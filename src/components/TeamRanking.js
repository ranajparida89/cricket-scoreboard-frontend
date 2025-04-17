// ✅ src/components/TeamRanking.js
// ✅ [Ranaj Parida - 2025-04-19 | Extended Final Fix with 125+ Lines | Test + Combined Rankings]

import React, { useEffect, useState } from "react";
import axios from "axios";
import "./TeamRanking.css"; // ✅ Required for styling

const BACKEND = "https://cricket-scoreboard-backend.onrender.com";

// ✅ [Flag emoji mapping]
const flagMap = {
  india: "🇮🇳", australia: "🇦🇺", england: "🏴", "new zealand": "🇳🇿",
  pakistan: "🇵🇰", "south africa": "🇿🇦", "sri lanka": "🇱🇰", ireland: "🇮🇪",
  kenya: "🇰🇪", namibia: "🇳🇦", bangladesh: "🇧🇩", afghanistan: "🇦🇫",
  zimbabwe: "🇿🇼", "west indies": "🏴‍☠️", usa: "🇺🇸", uae: "🇦🇪",
  oman: "🇴🇲", scotland: "🏴", netherlands: "🇳🇱", nepal: "🇳🇵"
};

const TeamRanking = () => {
  const [rankings, setRankings] = useState({
    Combined: [],
    Test: []
  });

  // ✅ Fetch both Combined (ODI+T20) and Test rankings
  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [combinedRes, testRes] = await Promise.all([
          axios.get(`${BACKEND}/api/teams`),
          axios.get(`${BACKEND}/api/rankings/test`)
        ]);

        setRankings({
          Combined: combinedRes.data,
          Test: testRes.data
        });
      } catch (err) {
        console.error("❌ Error fetching team rankings:", err);
      }
    };

    fetchAll();
  }, []);

  // ✅ Add row style based on index and format type
  const getRowClass = (idx, matchType) => {
    let rankClass = "";
    if (idx === 0) rankClass = "gold";
    else if (idx === 1) rankClass = "silver";
    else if (idx === 2) rankClass = "bronze";

    if (matchType === "Combined") return `${rankClass} odi-row`;
    if (matchType === "Test") return `${rankClass} test-row`;
    return rankClass;
  };

  // ✅ Add medal emoji for top 3
  const getMedalEmoji = (rank) => {
    if (rank === 0) return <span className="medal-emoji">🥇</span>;
    if (rank === 1) return <span className="medal-emoji">🥈</span>;
    if (rank === 2) return <span className="medal-emoji">🥉</span>;
    return null;
  };

  // ✅ Optional: Add placeholder for empty data
  const renderEmptyRow = () => (
    <tr>
      <td colSpan="5" className="text-muted">No ranking data available.</td>
    </tr>
  );

  // ✅ Render a format block
  const renderRankingTable = (type, data) => (
    <div key={type} className="mb-5">
      <h4 className="text-warning">{type === "Combined" ? "ODI + T20 Rankings" : "Test Rankings"}</h4>
      <div className="table-responsive">
        <table className="table table-bordered table-dark text-center table-hover">
          <thead>
            <tr>
              <th>Rank</th>
              <th>Team</th>
              <th>Matches</th>
              <th>Points</th>
              <th>Rating</th>
            </tr>
          </thead>
          <tbody>
            {data.length > 0 ? (
              data.map((team, idx) => (
                <tr key={idx} className={getRowClass(idx, type)}>
                  <td>{getMedalEmoji(idx)} {idx + 1}</td>
                  <td>
                    {flagMap[team.team_name?.toLowerCase()] || "🏳️"}{" "}
                    {team.team_name}
                  </td>
                  <td>{team.matches}</td>
                  <td>{team.points}</td>
                  <td>{parseFloat(team.rating).toFixed(2)}</td>
                </tr>
              ))
            ) : renderEmptyRow()}
          </tbody>
        </table>
      </div>
    </div>
  );

  return (
    <div className="container mt-5">
      <div className="card bg-dark text-white p-4 shadow">
        <h2 className="text-center text-info mb-4">🌍 Team Rankings</h2>

        {/* ✅ Render all formats */}
        {renderRankingTable("Combined", rankings.Combined)}
        {renderRankingTable("Test", rankings.Test)}
      </div>
    </div>
  );
};

export default TeamRanking;
