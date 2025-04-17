// ✅ src/components/TeamRanking.js
// ✅ [Ranaj Parida - 2025-04-20 | Final Fix: ODI, T20, Test separated + Rating NaN fix + Min 125 lines]

import React, { useEffect, useState } from "react";
import axios from "axios";
import "./TeamRanking.css"; // ✅ Required for styling

const BACKEND = "https://cricket-scoreboard-backend.onrender.com";

// ✅ Flag mapping (standardized)
const flagMap = {
  india: "🇮🇳", australia: "🇦🇺", england: "🏴", "new zealand": "🇳🇿",
  pakistan: "🇵🇰", "south africa": "🇿🇦", "sri lanka": "🇱🇰", ireland: "🇮🇪",
  kenya: "🇰🇪", namibia: "🇳🇦", bangladesh: "🇧🇩", afghanistan: "🇦🇫",
  zimbabwe: "🇿🇼", "west indies": "🏴‍☠️", usa: "🇺🇸", uae: "🇦🇪",
  oman: "🇴🇲", scotland: "🏴", netherlands: "🇳🇱", nepal: "🇳🇵"
};

const TeamRanking = () => {
  const [odiRankings, setOdiRankings] = useState([]);
  const [t20Rankings, setT20Rankings] = useState([]);
  const [testRankings, setTestRankings] = useState([]);

  // ✅ Fetch rankings on mount
  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [res, testRes] = await Promise.all([
          axios.get(`${BACKEND}/api/teams`),
          axios.get(`${BACKEND}/api/rankings/test`)
        ]);

        const allTeams = res.data || [];

        // ✅ Classify as ODI if matches > 20
        const odiTeams = allTeams.filter((t) => t.matches > 20);
        // ✅ Classify as T20 if matches <= 20
        const t20Teams = allTeams.filter((t) => t.matches <= 20);

        const applyRating = (teams) => teams.map((team) => ({
          ...team,
          rating:
            team.matches > 0
              ? (team.points / team.matches).toFixed(2)
              : "0.00"
        })).sort((a, b) => parseFloat(b.rating) - parseFloat(a.rating));

        setOdiRankings(applyRating(odiTeams));
        setT20Rankings(applyRating(t20Teams));
        setTestRankings(applyRating(testRes.data || []));
      } catch (err) {
        console.error("❌ Failed to fetch rankings:", err);
      }
    };

    fetchAll();
  }, []);

  // ✅ Medal class and row styling
  const getRowClass = (index, matchType) => {
    let base = "";
    if (index === 0) base = "gold";
    else if (index === 1) base = "silver";
    else if (index === 2) base = "bronze";
    return `${base} ${matchType.toLowerCase()}-row`;
  };

  const getMedalEmoji = (index) => {
    if (index === 0) return <span className="medal-emoji">🥇</span>;
    if (index === 1) return <span className="medal-emoji">🥈</span>;
    if (index === 2) return <span className="medal-emoji">🥉</span>;
    return null;
  };

  // ✅ Renders one section of ranking
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
            {teams.map((team, index) => (
              <tr key={index} className={getRowClass(index, title)}>
                <td>{getMedalEmoji(index)} {index + 1}</td>
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
  );

  return (
    <div className="container mt-5">
      <div className="card bg-dark text-white p-4 shadow">
        <h2 className="text-center text-info mb-4">🌍 Team Rankings</h2>
        {renderTable(odiRankings, "ODI")}
        {renderTable(t20Rankings, "T20")}
        {renderTable(testRankings, "Test")}
      </div>
    </div>
  );
};

export default TeamRanking;
