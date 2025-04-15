import React, { useEffect, useState } from "react";
import { getTeams } from "../services/api";
import { io } from "socket.io-client";
import "./Leaderboard.css";

// ✅ Connect to backend socket
const socket = io("https://cricket-scoreboard-backend.onrender.com");

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
        b.points !== a.points
          ? b.points - a.points
          : (b.nrr || 0) - (a.nrr || 0)
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
    if (index === 0) return <span className="medal-emoji">🥇</span>;
    if (index === 1) return <span className="medal-emoji">🥈</span>;
    if (index === 2) return <span className="medal-emoji">🥉</span>;
    return null;
  };

  // ✅ Display NRR safely
  const renderNRR = (nrr) => {
    return nrr === null ? "—" : nrr.toFixed(2);
  };

  return (
    <div className="table-responsive leaderboard-table-wrapper">
      <table className="table table-bordered table-dark table-sm text-center mb-0">
        <thead>
          <tr>
            <th>#</th>
            <th>Team</th>
            <th>Matches</th>
            <th>Wins</th>
            <th>Losses</th>
            <th>Points</th>
            <th>NRR</th>
          </tr>
        </thead>
        <tbody>
          {teams.map((team, index) => (
            <tr key={team.team_name}>
              <td>{getMedal(index)} {index + 1}</td>
              <td>{team.team_name}</td>
              <td>{team.matches_played}</td>
              <td>{team.wins}</td>
              <td>{team.losses}</td>
              <td>{team.points}</td>
              <td>{renderNRR(team.nrr)}</td>
            </tr>
          ))}
          {teams.length === 0 && (
            <tr>
              <td colSpan="7" className="text-muted">
                No match data available.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default Leaderboard;
