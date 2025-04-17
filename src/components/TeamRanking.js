// ✅ src/components/TeamRanking.js
// ✅ [Ranaj Parida - 2025-04-20 | Fixed: No data for ODI/T20 + Show Combined]

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
  const [combined, setCombined] = useState([]);
  const [test, setTest] = useState([]);

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [res, testRes] = await Promise.all([
          axios.get(`${BACKEND}/api/teams`),
          axios.get(`${BACKEND}/api/rankings/test`)
        ]);

        const addRating = (teams) =>
          teams.map((team) => ({
            ...team,
            rating: team.matches > 0 ? (team.points / team.matches).toFixed(2) : "0.00"
          })).sort((a, b) => parseFloat(b.rating) - parseFloat(a.rating));

        setCombined(addRating(res.data || []));
        setTest(addRating(testRes.data || []));
      } catch (err) {
        console.error("Ranking fetch error:", err);
      }
    };

    fetchAll();
  }, []);

  const getRowClass = (idx, type) => {
    let base = idx === 0 ? "gold" : idx === 1 ? "silver" : idx === 2 ? "bronze" : "";
    return `${base} ${type.toLowerCase()}-row`;
  };

  const getMedalEmoji = (idx) => {
    if (idx === 0) return <span className="medal-emoji">🥇</span>;
    if (idx === 1) return <span className="medal-emoji">🥈</span>;
    if (idx === 2) return <span className="medal-emoji">🥉</span>;
    return null;
  };

  const renderTable = (teams, title, type) => (
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
            {teams.length > 0 ? (
              teams.map((team, idx) => (
                <tr key={idx} className={getRowClass(idx, type)}>
                  <td>{getMedalEmoji(idx)} {idx + 1}</td>
                  <td>
                    {flagMap[team.team_name?.toLowerCase()] || "🏳️"}{" "}
                    {team.team_name}
                  </td>
                  <td>{team.matches}</td>
                  <td>{team.points}</td>
                  <td>{team.rating}</td>
                </tr>
              ))
            ) : (
              <tr><td colSpan="5" className="text-muted">No data available</td></tr>
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
        {renderTable(combined, "ODI + T20 Combined", "ODI")}
        {renderTable(test, "Test", "Test")}
      </div>
    </div>
  );
};

export default TeamRanking;
