// ✅ src/components/PointTable.js
// ✅ [Ranaj Parida - 2025-04-14 | 8:45 AM] Unified point table with glowing medals, total matches & draws

import React, { useEffect, useState } from "react";
import { getPointTable } from "../services/api"; // ✅ Centralized Point Table API

// ✅ API endpoint for unified point table (with draws)
// const API_URL = "https://cricket-scoreboard-backend.onrender.com/api/points";

const PointTable = () => {
  const [points, setPoints] = useState([]);

  useEffect(() => {
    const fetchPoints = async () => {
      try {
        const data = await getPointTable();
        setPoints(data);        
      } catch (error) {
        console.error("Error fetching point table:", error);
      }
    };
    fetchPoints();
  }, []);

  // ✅ Glowing Medal Emoji
  const getMedal = (index) => {
    const emoji =
      index === 0 ? "🥇" : index === 1 ? "🥈" : index === 2 ? "🥉" : "";
    return emoji ? <span className="medal-emoji">{emoji}</span> : null;
  };

  return (
    <div className="container mt-5">
      <div className="transparent-card p-4 mt-3">
        <h2 className="text-center text-warning mb-4">🏆 Point Table</h2>
        <div className="table-responsive">
          <table className="table table-bordered text-center table-dark table-hover">
            <thead>
              <tr>
                <th>Rank</th>
                <th>Team</th>
                <th>Total Matches</th>
                <th>Wins</th>
                <th>Losses</th>
                <th>Draws</th> {/* ✅ New column */}
                <th>Points</th>
              </tr>
            </thead>
            <tbody>
              {points
                .sort((a, b) => b.points - a.points)
                .map((team, idx) => {
                  const totalMatches = team.total_matches || team.matches || (team.wins + team.losses + (team.draws || 0));
                  const draws = team.draws || (totalMatches - team.wins - team.losses);

                  return (
                    <tr key={team.team}>
                      <td>{getMedal(idx)} {idx + 1}</td>
                      <td><strong>{team.team}</strong></td>
                      <td>{String(totalMatches).padStart(2, "0")}</td>
                      <td>{team.wins}</td>
                      <td>{team.losses}</td>
                      <td>{draws}</td> {/* ✅ Displaying draws */}
                      <td>{team.points}</td>
                    </tr>
                  );
                })}
              {points.length === 0 && (
                <tr>
                  <td colSpan="7" className="text-muted">
                    No match data available.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default PointTable;
