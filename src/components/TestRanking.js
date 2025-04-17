// ✅ src/components/TestRanking.js
// ✅ [Ranaj Parida - 2025-04-21 | Final Fix: Accurate Test Ranking Display using /api/rankings/test]

import React, { useEffect, useState } from "react";
import axios from "axios";
import "./TeamRanking.css"; // ✅ Reuse styles from TeamRanking

// ✅ Dedicated API endpoint for Test Match Ranking
const API_URL = "https://cricket-scoreboard-backend.onrender.com/api/rankings/test";

// ✅ Mapping team names to their corresponding flag emojis
const flagMap = {
  india: "🇮🇳", australia: "🇦🇺", england: "🏴", "new zealand": "🇳🇿",
  pakistan: "🇵🇰", "south africa": "🇿🇦", "sri lanka": "🇱🇰", ireland: "🇮🇪",
  kenya: "🇰🇪", namibia: "🇳🇦", bangladesh: "🇧🇩", afghanistan: "🇦🇫",
  zimbabwe: "🇿🇼", "west indies": "🏴‍☠️", usa: "🇺🇸", uae: "🇦🇪",
  oman: "🇴🇲", scotland: "🏴", netherlands: "🇳🇱", nepal: "🇳🇵"
};

const TestRanking = () => {
  const [testRankings, setTestRankings] = useState([]);

  // ✅ Fetch rankings from /api/rankings/test when component mounts
  useEffect(() => {
    const fetchTestRankings = async () => {
      try {
        const res = await axios.get(API_URL);
        const data = res.data || [];

        // ✅ Add frontend fallback calculation for safety
        const withRating = data.map((team) => ({
          ...team,
          rating: team.matches > 0 ? (team.points / team.matches).toFixed(2) : "0.00"
        }));

        // ✅ Sort teams by rating descending
        const sorted = withRating.sort((a, b) => parseFloat(b.rating) - parseFloat(a.rating));
        setTestRankings(sorted);
      } catch (err) {
        console.error("❌ Failed to load Test Match Rankings:", err);
      }
    };

    fetchTestRankings();
  }, []);

  // ✅ Medal color class logic
  const getRowClass = (idx) => {
    if (idx === 0) return "gold test-row";
    if (idx === 1) return "silver test-row";
    if (idx === 2) return "bronze test-row";
    return "test-row";
  };

  // ✅ Glowing medal emojis for top 3 ranks
  const getMedalEmoji = (idx) => {
    if (idx === 0) return <span className="medal-emoji">🥇</span>;
    if (idx === 1) return <span className="medal-emoji">🥈</span>;
    if (idx === 2) return <span className="medal-emoji">🥉</span>;
    return null;
  };

  // ✅ Render Test Match Rankings Table
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

              {/* ✅ If no data */}
              {testRankings.length === 0 && (
                <tr>
                  <td colSpan="5" className="text-muted">
                    No Test match rankings available
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
