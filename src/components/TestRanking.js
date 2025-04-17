// ✅ src/components/TestRanking.js
// ✅ [Ranaj Parida - 2025-04-21 | Final Fix: Accurate Test Ranking Display with API Integration]

import React, { useEffect, useState } from "react";
import axios from "axios";
import "./TeamRanking.css"; // ✅ Reuse ranking styles

// ✅ API Base
const API_URL1 = "https://cricket-scoreboard-backend.onrender.com/api/rankings/test";
const BACKEND = "https://cricket-scoreboard-backend.onrender.com";
const API_URL = `${BACKEND}/api/rankings/test`; // ✅ Correct Test Ranking Endpoint

// ✅ Map team names to emoji flags
const flagMap = {
  india: "🇮🇳", australia: "🇦🇺", england: "🏴", "new zealand": "🇳🇿",
  pakistan: "🇵🇰", "south africa": "🇿🇦", "sri lanka": "🇱🇰", ireland: "🇮🇪",
  kenya: "🇰🇪", namibia: "🇳🇦", bangladesh: "🇧🇩", afghanistan: "🇦🇫",
  zimbabwe: "🇿🇼", "west indies": "🏴‍☠️", usa: "🇺🇸", uae: "🇦🇪",
  oman: "🇴🇲", scotland: "🏴", netherlands: "🇳🇱", nepal: "🇳🇵"
};

const TestRanking = () => {
  const [testRankings, setTestRankings] = useState([]);

  // ✅ Fetch accurate Test Rankings from backend
  useEffect(() => {
    const fetchTestRankings = async () => {
      try {
        const response = await axios.get(API_URL);
        const data = response.data || [];

        // ✅ Sort by backend-provided rating (already rounded)
        const sorted = [...data].sort(
          (a, b) => parseFloat(b.rating) - parseFloat(a.rating)
        );

        setTestRankings(sorted);
      } catch (error) {
        console.error("❌ Failed to fetch Test Rankings:", error.message);
      }
    };

    fetchTestRankings();
  }, []);

  // ✅ Style table rows based on rank
  const getRowClass = (idx) => {
    if (idx === 0) return "gold test-row";
    if (idx === 1) return "silver test-row";
    if (idx === 2) return "bronze test-row";
    return "test-row";
  };

  // ✅ Show 🥇🥈🥉 for top 3
  const getMedalEmoji = (idx) => {
    if (idx === 0) return <span className="medal-emoji">🥇</span>;
    if (idx === 1) return <span className="medal-emoji">🥈</span>;
    if (idx === 2) return <span className="medal-emoji">🥉</span>;
    return null;
  };

  // ✅ Render the table
  return (
    <div className="container mt-5">
      <div className="card bg-dark text-white p-4 shadow">
        <h2 className="text-center text-info mb-4">📘 ICC Test Match Rankings</h2>
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
              {testRankings.map((team, idx) => (
                <tr key={idx} className={getRowClass(idx)}>
                  <td>{getMedalEmoji(idx)} {idx + 1}</td>
                  <td>
                    {flagMap[team.team_name?.toLowerCase()] || "🏳️"}{" "}
                    {team.team_name}
                  </td>
                  <td>{team.matches}</td>
                  <td>{team.points}</td>
                  <td><strong>{team.rating}</strong></td>
                </tr>
              ))}
              {testRankings.length === 0 && (
                <tr>
                  <td colSpan="5" className="text-muted">
                    No Test match ranking data available.
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

export default TestRanking;
