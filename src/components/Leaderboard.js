// src/components/Leaderboard.js
import React, { useEffect, useMemo, useRef, useState } from "react";
import { getTeams } from "../services/api";
import { io } from "socket.io-client";
import { motion } from "framer-motion";
import { useSpring, animated as a } from "@react-spring/web";
import "./Leaderboard.css";

/* socket */
const socket = io("https://cricket-scoreboard-backend.onrender.com");

/* page/list/row variants */
const sectionVariants = {
  hidden: { opacity: 0, y: 24 },
  show:   { opacity: 1, y: 0, transition: { duration: 0.45, ease: "easeOut" } },
};
const tableVariants = {
  hidden: {},
  show:   { transition: { staggerChildren: 0.05, delayChildren: 0.05 } },
};
const rowVariants = {
  hidden: { opacity: 0, y: 14 },
  show:   { opacity: 1, y: 0, transition: { duration: 0.28 } },
};

/* animated number (react-spring) */
const AnimatedNumber = ({ value }) => {
  const spring = useSpring({
    from: { val: 0 },
    to:   { val: Number.isFinite(value) ? value : 0 },
    config: { tension: 180, friction: 20 },
  });
  return (
    <a.span>
      {spring.val.to((v) => (Number.isInteger(value) ? Math.round(v) : v.toFixed(2)))}
    </a.span>
  );
};

/* helpers */
const parseTeams = (data) =>
  data.map((t) => ({
    ...t,
    team_name: t.team_name,
    matches_played: parseInt(t.matches_played, 10) || 0,
    wins: parseInt(t.wins, 10) || 0,
    losses: parseInt(t.losses, 10) || 0,
    points: parseInt(t.points, 10) || 0,
    nrr: Number.isNaN(parseFloat(t.nrr)) ? null : parseFloat(t.nrr),
  }));

const sortTeams = (arr) =>
  [...arr].sort((a, b) =>
    b.points !== a.points ? b.points - a.points : (b.nrr || 0) - (a.nrr || 0)
  );

/* NRR helpers */
const nrrPercent = (nrr) => {
  if (nrr === null || Number.isNaN(nrr)) return 0;
  const max = 8; // map |nrr| to 0..8
  const mag = Math.min(max, Math.max(0, Math.abs(nrr)));
  return Math.round((mag / max) * 100);
};

/* bucket → {bucketName, neg} */
const nrrBucket = (nrr) => {
  if (nrr === null) return { bucket: "none", neg: false };
  if (nrr < 0)     return { bucket: "red",    neg: true  };
  if (nrr < 0.5)   return { bucket: "purple", neg: false };
  if (nrr < 2)     return { bucket: "orange", neg: false };
  if (nrr < 4)     return { bucket: "yellow", neg: false };
  return { bucket: "green", neg: false }; // >= 4
};

const Leaderboard = () => {
  const [teams, setTeams] = useState([]);
  const [updatedRows, setUpdatedRows] = useState(new Set());
  const prevRanksRef = useRef(new Map());

  const fetchTeams = async () => {
    try {
      const raw = await getTeams();
      const parsed = parseTeams(raw);
      const sorted = sortTeams(parsed);

      const changed = new Set();
      sorted.forEach((t) => {
        const prev = teams.find((x) => x.team_name === t.team_name);
        if (
          !prev ||
          prev.points !== t.points ||
          prev.wins !== t.wins ||
          prev.losses !== t.losses ||
          (prev.nrr ?? null) !== (t.nrr ?? null)
        ) changed.add(t.team_name);
      });
      setUpdatedRows(changed);

      const rankMap = new Map();
      sorted.forEach((t, i) => rankMap.set(t.team_name, i));
      prevRanksRef.current = rankMap;

      setTeams(sorted);
    } catch (e) {
      console.error("Error fetching leaderboard:", e);
    }
  };

  useEffect(() => {
    fetchTeams();
    let debounced;
    socket.on("matchUpdate", () => {
      clearTimeout(debounced);
      debounced = setTimeout(fetchTeams, 900);
    });
    return () => {
      socket.off("matchUpdate");
      clearTimeout(debounced);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const prevRankMap = useMemo(() => prevRanksRef.current, [teams]);
  const draws = (t) => Math.max(0, t.matches_played - t.wins - t.losses);

  return (
    <motion.div
      className="leaderboard-shell"
      variants={sectionVariants}
      initial="hidden"
      animate="show"
    >
      <motion.table
        className="table table-dark leaderboard-motion-table"
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
          {teams.map((team, index) => {
            const prevIndex = prevRankMap.get(team.team_name);
            const delta = typeof prevIndex === "number" ? prevIndex - index : 0;
            const pulse = updatedRows.has(team.team_name);

            const { bucket, neg } = nrrBucket(team.nrr);
            const width = nrrPercent(team.nrr);

            return (
              <motion.tr
                key={team.team_name}
                variants={rowVariants}
                className={`lb-row ${pulse ? "is-updated" : ""}`}
                data-bucket={bucket}
                whileHover={{ y: -2, scale: 1.01 }}
                transition={{ type: "spring", stiffness: 260, damping: 20 }}
              >
                <td className="rank-cell">
                  <span className="medal-emoji">🏅</span>
                  <span className="rank-num">{index + 1}</span>
                  {delta !== 0 && (
                    <motion.span
                      className={`rank-arrow ${delta > 0 ? "up" : "down"}`}
                      initial={{ y: delta > 0 ? 10 : -10, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      transition={{ duration: 0.28 }}
                      title={delta > 0 ? "Moved up" : "Moved down"}
                    >
                      {delta > 0 ? "↑" : "↓"}
                    </motion.span>
                  )}
                </td>

                <td className="team-cell">
                  <span className="team-name u-underline-slide">{team.team_name}</span>
                </td>

                <td><AnimatedNumber value={team.matches_played} /></td>
                <td className="pos"><AnimatedNumber value={team.wins} /></td>
                <td className="neg"><AnimatedNumber value={team.losses} /></td>
                <td><AnimatedNumber value={draws(team)} /></td>

                <td className={`pos points-cell ${pulse ? "sparkle-once" : ""}`}>
                  <span className="cell-pop"><AnimatedNumber value={team.points} /></span>
                </td>

                <td className={`nrr-cell ${neg ? "neg" : "pos"}`}>
                  <div className="nrr-track" aria-hidden />
                  <div
                    className={`nrr-bar ${neg ? "from-right" : "from-left"}`}
                    style={{ "--target": `${width}%` }}
                    aria-hidden
                  />
                  {team.nrr === null ? "—" : (
                    <span className="cell-pop"><AnimatedNumber value={Number(team.nrr.toFixed(2))} /></span>
                  )}
                </td>
              </motion.tr>
            );
          })}

          {teams.length === 0 && (
            <tr><td colSpan="8" className="text-muted py-4">No match data available.</td></tr>
          )}
        </tbody>
      </motion.table>
    </motion.div>
  );
};

export default Leaderboard;
