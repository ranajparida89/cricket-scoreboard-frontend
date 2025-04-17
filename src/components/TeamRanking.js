// ✅ src/components/TeamRanking.js
// ✅ [Ranaj Parida - 2025-04-22 | Removed Test Match Rankings from main table display]

import React, { useEffect, useState } from "react";
import axios from "axios";
import "./TeamRanking.css"; // ✅ Required for styling

const API_URL = "https://cricket-scoreboard-backend.onrender.com/api/team-rankings";

// ✅ Team flag emojis
const flagMap = {
  india: "🇮🇳", australia: "🇦🇺", england: "🇼", "new zealand": "🇳🇿",
  pakistan: "🇵🇰", "south africa": "🇿🇦", "sri lanka": "🇱🇰", ireland: "🇮🇪",
  kenya: "🇰🇪", namibia: "🇳🇦", bangladesh: "🇧🇩", afghanistan: "🇦🇫",
  zimbabwe: "🇿🇼", "west indies": "🏴‍☠️", usa: "🇺🇸", uae: "🇦🇪",
  oman: "🇴🇲", scotland: "🇼", netherlands: "🇳🇱", nepal: "🇳🇵"
};

const TeamRanking = () => {
  const [rankings, setRankings] = useState([]);

  // ✅ Fetch team rankings on component mount
  useEffect(() => {
    const fetchRankings = async () => {
      try {
        const res = await axios.get(API_URL);
        setRankings(res.data);
      } catch (err) {
        console.error("Error fetching rankings:", err);
      }
    };
    fetchRankings();
  }, []);

  // ✅ Group rankings by match_type (ODI, T20) — Removed Test
  const groupByMatchType = (data) => {
    return data.reduce((acc, team) => {
      if (!acc[team.match_type]) acc[team.match_type] = [];
      acc[team.match_type].push(team);
      return acc;
    }, {});
  };

  const grouped = groupByMatchType(rankings);

  // ✅ Add medal-based row styling and match-type coloring
  const getRowClass = (idx, matchType) => {
    let rankClass = "";
    if (idx === 0) rankClass = "gold";
    else if (idx === 1) rankClass = "silver";
    else if (idx === 2) rankClass = "bronze";

    if (matchType === "ODI") return `${rankClass} odi-row`;
    if (matchType === "T20") return `${rankClass} t20-row`;
    return rankClass;
  };

  // ✅ Glowing medal emoji wrapper
  const getMedalEmoji = (rank) => {
    if (rank === 0) return <span className="medal-emoji">🥇</span>;
    if (rank === 1) return <span className="medal-emoji">🥈</span>;
    if (rank === 2) return <span className="medal-emoji">🥉</span>;
    return null;
  };

  return (
    <div className="container mt-5">
      <div className="card bg-dark text-white p-4 shadow">
        <h2 className="text-center text-info mb-4">🌍 ODI and T20 Team Rankings</h2>

        {/* ✅ Loop only through ODI and T20 groupings (Test Removed) */}
        {["ODI", "T20"].map((type) => (
          grouped[type] && (
            <div key={type} className="mb-5">
              <h4 className="text-warning">{type.toUpperCase()} Rankings</h4>
              <div className="table-responsive">
                <table className="table table-bordered text-center table-dark table-hover">
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
                    {grouped[type].map((team, idx) => (
                      <tr key={idx} className={getRowClass(idx, type)}>
                        <td>{getMedalEmoji(idx)} {idx + 1}</td>
                        <td>
                          {flagMap[team.team_name?.toLowerCase()] || "🏳️"} {" "}
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
