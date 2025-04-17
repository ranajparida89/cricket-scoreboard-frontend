// ✅ src/components/TeamRanking.js
// ✅ [Ranaj Parida - 2025-04-19 | Full Format Split + Test Ranking API Integration]

import React, { useEffect, useState } from "react";
import axios from "axios";
import "./TeamRanking.css"; // ✅ Required for styling

const BACKEND = "https://cricket-scoreboard-backend.onrender.com";

// ✅ [Ranaj Parida - 2025-04-13 | Flag support]
const flagMap = {
  india: "🇮🇳", australia: "🇦🇺", england: "🏴", "new zealand": "🇳🇿",
  pakistan: "🇵🇰", "south africa": "🇿🇦", "sri lanka": "🇱🇰", ireland: "🇮🇪",
  kenya: "🇰🇪", namibia: "🇳🇦", bangladesh: "🇧🇩", afghanistan: "🇦🇫",
  zimbabwe: "🇿🇼", "west indies": "🏴‍☠️", usa: "🇺🇸", uae: "🇦🇪",
  oman: "🇴🇲", scotland: "🏴", netherlands: "🇳🇱", nepal: "🇳🇵"
};

const TeamRanking = () => {
  const [rankings, setRankings] = useState({
    ODI: [],
    T20: [],
    Test: []
  });

  // ✅ Fetch all formats on mount
  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [t20OdiRes, testRes] = await Promise.all([
          axios.get(`${BACKEND}/api/teams`),
          axios.get(`${BACKEND}/api/rankings/test`)
        ]);

        // ✅ Separate ODI and T20 from common list based on rating patterns
        const odi = t20OdiRes.data.filter((team) => team.matches <= 50);
        const t20 = t20OdiRes.data.filter((team) => team.matches < 30); // rough guess separation
        const deduped = (arr) => {
          const seen = new Set();
          return arr.filter((team) => {
            const key = team.team_name;
            if (seen.has(key)) return false;
            seen.add(key);
            return true;
          });
        };

        setRankings({
          ODI: deduped(odi),
          T20: deduped(t20),
          Test: testRes.data
        });
      } catch (err) {
        console.error("❌ Error fetching rankings:", err);
      }
    };
    fetchAll();
  }, []);

  // ✅ Row style based on medal and match type
  const getRowClass = (idx, matchType) => {
    let rankClass = "";
    if (idx === 0) rankClass = "gold";
    else if (idx === 1) rankClass = "silver";
    else if (idx === 2) rankClass = "bronze";

    if (matchType === "ODI") return `${rankClass} odi-row`;
    if (matchType === "T20") return `${rankClass} t20-row`;
    if (matchType === "Test") return `${rankClass} test-row`;
    return rankClass;
  };

  const getMedalEmoji = (rank) => {
    if (rank === 0) return <span className="medal-emoji">🥇</span>;
    if (rank === 1) return <span className="medal-emoji">🥈</span>;
    if (rank === 2) return <span className="medal-emoji">🥉</span>;
    return null;
  };

  return (
    <div className="container mt-5">
      <div className="card bg-dark text-white p-4 shadow">
        <h2 className="text-center text-info mb-4">🌍 Team Rankings</h2>

        {/* ✅ Iterate through ODI, T20, Test */}
        {["ODI", "T20", "Test"].map((type) => (
          rankings[type].length > 0 && (
            <div key={type} className="mb-5">
              <h4 className="text-warning">{type} Rankings</h4>
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
                    {rankings[type].map((team, idx) => (
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
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )
        ))}
      </div>
    </div>
  );
};

export default TeamRanking;
