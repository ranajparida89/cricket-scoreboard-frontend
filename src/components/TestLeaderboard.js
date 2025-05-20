// src/components/TestLeaderboard.js

import React, { useEffect, useState } from "react";
import { getTestMatchLeaderboard } from "../services/api";
import { motion } from "framer-motion";
import "./Leaderboard.css";

// Test Match Leaderboard Component
const TestLeaderboard = () => {
  const [teams, setTeams] = useState([]);

  // Fetch leaderboard data on mount
  useEffect(() => {
    getTestMatchLeaderboard()
      .then(data => setTeams(data))
      .catch(() => setTeams([]));
  }, []);

  // Animated 3D Medal for Top 3 using Framer Motion and CSS
  const getMedal = (rank) => {
    // Framer Motion animation props
    const medalProps = {
      initial: { scale: 1, rotateY: 0 },
      animate: { scale: 1.18, rotateY: 360 },
      transition: { repeat: Infinity, duration: 1.3, ease: "linear" }
    };

    // Gold, Silver, Bronze for Top 3
    if (rank === 1) {
      return (
        <motion.span {...medalProps} className="medal-3d gold animated-spin">
          🥇
        </motion.span>
      );
    }
    if (rank === 2) {
      return (
        <motion.span {...medalProps} className="medal-3d silver animated-spin">
          🥈
        </motion.span>
      );
    }
    if (rank === 3) {
      return (
        <motion.span {...medalProps} className="medal-3d bronze animated-spin">
          🥉
        </motion.span>
      );
    }
    // For other ranks, show just the rank number (no medal)
    return <span>{rank}</span>;
  };

  return (
    <div className="table-responsive leaderboard-table-wrapper mt-5">
      <h2 className="text-center text-info mb-4">World Test Match Team Rankings</h2>
      <table className="table table-bordered table-dark table-sm text-center mb-0">
        <thead>
          <tr>
            <th>Rank</th>
            <th>Team</th>
            <th>Matches</th>
            <th>Wins</th>
            <th>Losses</th>
            <th>Draws</th>
            <th>Points</th>
          </tr>
        </thead>
        <tbody>
          {teams.length > 0 ? (
            teams.map((team) => (
              <tr key={team.team_name}>
                <td>{getMedal(team.rank)}</td>
                <td>{team.team_name}</td>
                <td>{team.matches}</td>
                <td>{team.wins}</td>
                <td>{team.losses}</td>
                <td>{team.draws}</td>
                <td>{team.points}</td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="7" className="text-muted">
                No Test match leaderboard data available.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default TestLeaderboard;
