// src/components/Leaderboard.js
import React, { useEffect, useState } from "react";
import { getTeams } from "../services/api";
import { io } from "socket.io-client";
import { motion } from "framer-motion";                   // ✅ NEW: framer-motion
import { useSpring, animated as a } from "@react-spring/web"; // ✅ NEW: react-spring
import "./Leaderboard.css";

// ✅ Connect to backend socket
const socket = io("https://cricket-scoreboard-backend.onrender.com");

// ✅ Reusable variants for section + rows
const sectionVariants = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.45, ease: "easeOut" } },
};

const tableVariants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06, delayChildren: 0.05 } },
};

const rowVariants = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35 } },
};

// ✅ Smooth number component (react-spring)
const AnimatedNumber = ({ value }) => {
  const spring = useSpring({
    from: { val: 0 },
    to: { val: Number.isFinite(value) ? value : 0 },
    config: { tension: 180, friction: 20 },
  });
  return (
    <a.span>
      {spring.val.to((v) => (Number.isInteger(value) ? Math.round(v) : v.toFixed(2)))}
    </a.span>
  );
};

const Leaderboard = () => {
  const [teams, setTeams] = useState([]);

  // ✅ Fetch leaderboard data
  const fetchTeams = async () => {
    try {
      const data = await getTeams();

      // ✅ Parse and sort properly using points and NRR
      const parsed = data.map((team) => ({
        ...team,
        team_name: team.team_name,
        matches_played: parseInt(team.matches_played, 10) || 0,
        wins: parseInt(team.wins, 10) || 0,
        losses: parseInt(team.losses, 10) || 0,
        points: parseInt(team.points, 10) || 0,
        nrr: isNaN(parseFloat(team.nrr)) ? null : parseFloat(team.nrr),
      }));

      const sorted = parsed.sort((a, b) =>
        b.points !== a.points ? b.points - a.points : (b.nrr || 0) - (a.nrr || 0)
      );

      setTeams(sorted);
    } catch (error) {
      console.error("Error fetching leaderboard:", error);
    }
  };

  // ✅ Real-time update with debounce to avoid stale fetch
  useEffect(() => {
    fetchTeams();

    const debounceRef = { current: null };

    socket.on("matchUpdate", () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(fetchTeams, 1200);
    });

    return () => {
      socket.off("matchUpdate");
      clearTimeout(debounceRef.current);
    };
  }, []);

  // ✅ Show medal for top 3 teams
  const getMedal = (index) => {
    if (index === 0)
      return <span className="medal-emoji medal-3d gold">🥇</span>;
    if (index === 1)
      return <span className="medal-emoji medal-3d silver">🥈</span>;
    if (index === 2)
      return <span className="medal-emoji medal-3d bronze">🥉</span>;
    return null;
  };

  // ✅ Display NRR safely
  const renderNRR = (nrr) => (nrr === null ? "—" : nrr);

  // ✅ Compute Draws: Matches - Wins - Losses
  const calculateDraws = (team) => {
    const { matches_played, wins, losses } = team;
    const draws = matches_played - wins - losses;
    return draws >= 0 ? draws : 0;
  };

  return (
    <motion.div
      className="table-responsive leaderboard-table-wrapper"
      variants={sectionVariants}
      initial="hidden"
      animate="show"
    >
      <motion.table
        className="table table-bordered table-dark table-sm text-center mb-0 leaderboard-motion-table"
        variants={tableVariants}
        initial="hidden"
        animate="show"
      >
        <thead>
          <tr>
            <th>#</th>
            <th>Team</th>
            <th>Matches</th>
            <th>Wins</th>
            <th>Losses</th>
            <th>Draws</th>
            <th>Points</th>
            <th>NRR</th>
          </tr>
        </thead>

        <tbody>
          {teams.map((team, index) => (
            <motion.tr
              key={team.team_name}
              variants={rowVariants}
              whileHover={{ scale: 1.01, backgroundColor: "rgba(255,255,255,0.04)" }}
              transition={{ type: "spring", stiffness: 220, damping: 18 }}
              className={index === 0 ? "leaderboard-row-top" : ""}
            >
              <td>
                {getMedal(index)} {index + 1}
              </td>
              <td>{team.team_name}</td>
              <td><AnimatedNumber value={team.matches_played} /></td>
              <td><AnimatedNumber value={team.wins} /></td>
              <td><AnimatedNumber value={team.losses} /></td>
              <td><AnimatedNumber value={calculateDraws(team)} /></td>
              <td><AnimatedNumber value={team.points} /></td>
              <td>
                {team.nrr === null ? "—" : <AnimatedNumber value={Number(team.nrr.toFixed(2))} />}
              </td>
            </motion.tr>
          ))}

          {teams.length === 0 && (
            <tr>
              <td colSpan="8" className="text-muted">
                No match data available.
              </td>
            </tr>
          )}
        </tbody>
      </motion.table>
    </motion.div>
  );
};

export default Leaderboard;
