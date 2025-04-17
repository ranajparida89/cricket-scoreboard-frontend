// ✅ src/components/TeamRanking.js
// ✅ [Ranaj Parida - 2025-04-20 | Final Fix: Show ODI+T20 Combined + Test Separate + ≥125 Lines]

import React, { useEffect, useState } from "react";
import axios from "axios";
import "./TeamRanking.css";

const BACKEND = "https://cricket-scoreboard-backend.onrender.com";

const flagMap = {
  india: "🇮🇳", australia: "🇦🇺", england: "🏴", "new zealand": "🇳🇿",
  pakistan: "🇵🇰", "south africa": "🇿🇦", "sri lanka": "🇱🇰", ireland: "🇮🇪",
  kenya: "🇰🇪", namibia: "🇳🇦", bangladesh: "🇧🇩", afghanistan: "🇦🇫",
  zimbabwe: "🇿🇼", "west indies": "🏴‍☠️", usa: "🇺🇸", uae: "🇦🇪",
  oman: "🇴🇲", scotland: "🏴", netherlands: "🇳🇱", nepal: "🇳🇵"
};

const TeamRanking = () => {
  const [combinedRankings, setCombinedRankings] = useState([]);
  const [testRankings, setTestRankings] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [generalRes, testRes] = await Promise.all([
          axios.get(`${BACKEND}/api/teams`),
          axios.get(`${BACKEND}/api/rankings/test`)
        ]);

        const generalTeams = generalRes.data || [];
        const testTeams = testRes.data || [];

        const formatWithRating = (teams) =>
          teams.map((t) => ({
            ...t,
            rating: t.matches > 0 ? (t.points / t.matches).toFixed(2) : "0.00"
          })).sort((a, b) => parseFloat(b.rating) - parseFloat(a.rating));

        setCombinedRankings(formatWithRating(generalTeams));
        setTestRankings(formatWithRating(testTeams));
      } catch (err) {
        console.error("❌ Ranking fetch failed:", err);
      }
    };

    fetchData();
  }, []);

  const getRowClass = (idx, type) => {
    const base =
      idx === 0 ? "gold" : idx === 1 ? "silver" : idx === 2 ? "bronze" : "";
    return `${base} ${type.toLowerCase()}-row`;
  };

  const getMedalEmoji = (idx) => {
    if (idx === 0) return <span className="medal-emoji">🥇</span>;
    if (idx === 1) return <span className="medal-emoji">🥈</span>;
    if (idx === 2) return <span className="medal-emoji">🥉</span>;
    return null;
  };

  const renderTable = (teams, title) => (
    <div className="mb-5">
      <h4 className="text-warning">{title} Rankings</h4>
      <div className="table-responsive">
        <table className="table table-bordered table-dark table-hover text-center">
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
            {teams.map((team, idx) => (
              <tr key={idx} className={getRowClass(idx, title)}>
                <td>{getMedalEmoji(idx)} {idx + 1}</td>
                <td>
                  {flagMap[team.team_name?.toLowerCase()] || "🏳️"}{" "}
                  {team.team_name}
                </td>
                <td>{team.matches}</td>
                <td>{team.points}</td>
                <td>{team.rating}</td>
              </tr>
            ))}
            {teams.length === 0 && (
              <tr>
                <td colSpan="5" className="text-muted">No data available</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );

  return (
    <div className="container mt-5">
      <div className="card bg-dark text-white p-4 shadow">
        <h2 className="text-center text-info mb-4">🌍 Team Rankings</h2>
        {renderTable(combinedRankings, "ODI + T20")}
        {renderTable(testRankings, "Test")}
      </div>
    </div>
  );
};

export default TeamRanking;
