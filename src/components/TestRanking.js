// ✅ src/components/TestRanking.js
// ✅ [Ranaj Parida - 2025-04-21 | Final Fix: Accurate Test Ranking Display with Full Comments]

import React, { useEffect, useState } from "react";
import axios from "axios";
import "./TeamRanking.css"; // ✅ Reuse existing global styles for table layout

const BACKEND = "https://cricket-scoreboard-backend.onrender.com";

// ✅ Mapping team names to their flag emojis
const flagMap = {
  india: "🇮🇳", australia: "🇦🇺", england: "🏴", "new zealand": "🇳🇿",
  pakistan: "🇵🇰", "south africa": "🇿🇦", "sri lanka": "🇱🇰", ireland: "🇮🇪",
  kenya: "🇰🇪", namibia: "🇳🇦", bangladesh: "🇧🇩", afghanistan: "🇦🇫",
  zimbabwe: "🇿🇼", "west indies": "🏴‍☠️", usa: "🇺🇸", uae: "🇦🇪",
  oman: "🇴🇲", scotland: "🏴", netherlands: "🇳🇱", nepal: "🇳🇵"
};

const TestRanking = () => {
  const [testRankings, setTestRankings] = useState([]);

  // ✅ Fetch Test Rankings on initial render
  useEffect(() => {
    const fetchTestRankings = async () => {
      try {
        const res = await axios.get(`${BACKEND}/api/rankings/test`);
        const data = res.data || [];

        // ✅ Compute rating safely in frontend (even though backend provides it)
        const withRating = data.map((team) => ({
          ...team,
          rating: team.matches > 0 ? (team.points / team.matches).toFixed(2) : "0.00"
        }));

        // ✅ Sort teams by rating (highest first)
        const sorted = withRating.sort((a, b) => parseFloat(b.rating) - parseFloat(a.rating));

        setTestRankings(sorted);
      } catch (err) {
        console.error("❌ Error fetching Test rankings:", err);
      }
    };

    fetchTestRankings();
  }, []);

  // ✅ Get row styling class based on rank
  const getRowClass = (idx) => {
    if (idx === 0) return "gold test-row";
    if (idx === 1) return "silver test-row";
    if (idx === 2) return "bronze test-row";
    return "test-row";
  };

  // ✅ Glowing medal emojis for top 3 teams
  const getMedalEmoji = (idx) => {
    if (idx === 0) return <span className="medal-emoji">🥇</span>;
    if (idx === 1) return <span className="medal-emoji">🥈</span>;
    if (idx === 2) return <span className="medal-emoji">🥉</span>;
    return null;
  };

  // ✅ Render full table with test rankings
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

              {/* ✅ Fallback if no data */}
              {testRankings.length === 0 && (
                <tr>
                  <td colSpan="5" className="text-muted">No Test match rankings available</td>
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
