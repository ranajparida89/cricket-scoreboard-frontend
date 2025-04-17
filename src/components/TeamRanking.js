// ✅ src/components/TeamRanking.js
// ✅ [Ranaj Parida - 2025-04-20 | Final Fix: Show ODI, T20, and Test Separately + ≥125 Lines]

import React, { useEffect, useState } from "react";
import axios from "axios";
import "./TeamRanking.css"; // ✅ Required for styling

const BACKEND = "https://cricket-scoreboard-backend.onrender.com";

// ✅ Country flag mapping
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

  // ✅ Fetch rankings for all 3 formats
  useEffect(() => {
    const fetchAllRankings = async () => {
      try {
        const [generalRes, testRes] = await Promise.all([
          axios.get(`${BACKEND}/api/teams`),
          axios.get(`${BACKEND}/api/rankings/test`)
        ]);

        const allTeams = generalRes.data || [];

        // ✅ Rough logic to separate ODI and T20 based on match count
        const odi = allTeams.filter(team => team.matches >= 6);
        const t20 = allTeams.filter(team => team.matches < 6);

        const computeRatings = (list) =>
          list.map(team => ({
            ...team,
            rating:
              team.matches && team.points
                ? (team.points / team.matches).toFixed(2)
                : "0.00"
          })).sort((a, b) => parseFloat(b.rating) - parseFloat(a.rating));

        setOdiRankings(computeRatings(odi));
        setT20Rankings(computeRatings(t20));
        setTestRankings(computeRatings(testRes.data || []));
      } catch (err) {
        console.error("❌ Error fetching team rankings:", err);
      }
    };

    fetchAllRankings();
  }, []);

  // ✅ Assign row color and medal highlight
  const getRowClass = (index, matchType) => {
    let baseClass = "";
    if (index === 0) baseClass = "gold";
    else if (index === 1) baseClass = "silver";
    else if (index === 2) baseClass = "bronze";

    if (matchType === "ODI") return `${baseClass} odi-row`;
    if (matchType === "T20") return `${baseClass} t20-row`;
    if (matchType === "Test") return `${baseClass} test-row`;
    return baseClass;
  };

  const getMedalEmoji = (index) => {
    if (index === 0) return <span className="medal-emoji">🥇</span>;
    if (index === 1) return <span className="medal-emoji">🥈</span>;
    if (index === 2) return <span className="medal-emoji">🥉</span>;
    return null;
  };

  // ✅ Renders any ranking table with type and title
  const renderTable = (teams, title, matchType) => (
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
                <tr key={idx} className={getRowClass(idx, matchType)}>
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
        {renderTable(odiRankings, "ODI", "ODI")}
        {renderTable(t20Rankings, "T20", "T20")}
        {renderTable(testRankings, "Test", "Test")}
      </div>
    </div>
  );
};

export default TeamRanking;
