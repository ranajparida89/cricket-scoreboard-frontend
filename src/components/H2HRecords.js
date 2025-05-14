// H2HRecords.js
import React, { useState, useEffect } from "react";
import "./H2HRecords.css";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
  ResponsiveContainer,
} from "recharts";

const H2HRecords = () => {
  const [teams, setTeams] = useState([]);
  const [team1, setTeam1] = useState("");
  const [team2, setTeam2] = useState("");
  const [matchType, setMatchType] = useState("ODI");

  // Temporary mock chart data
  const dummyChartData = [
    { category: "Wins", [team1]: 3, [team2]: 5 },
    { category: "Losses", [team1]: 2, [team2]: 1 },
    { category: "Draws", [team1]: 1, [team2]: 2 },
  ];

  useEffect(() => {
    // Later fetch from API
    setTeams([
      "India", "Pakistan", "Australia", "England",
      "South Africa", "New Zealand", "Sri Lanka", "Bangladesh"
    ]);
  }, []);

  return (
    <div className="h2h-container">
      <h2 className="h2h-heading">🆚 Head-to-Head Records</h2>

      <div className="h2h-selectors">
        <select value={team1} onChange={(e) => setTeam1(e.target.value)} className="h2h-dropdown">
          <option value="">Select Team 1</option>
          {teams.map((team) => (
            <option key={team} value={team}>{team}</option>
          ))}
        </select>

        <select value={team2} onChange={(e) => setTeam2(e.target.value)} className="h2h-dropdown">
          <option value="">Select Team 2</option>
          {teams.map((team) => (
            <option key={team} value={team}>{team}</option>
          ))}
        </select>

        <select value={matchType} onChange={(e) => setMatchType(e.target.value)} className="h2h-dropdown match-type">
          <option value="ODI">ODI</option>
          <option value="T20">T20</option>
          <option value="TEST">Test</option>
        </select>
      </div>

      {(team1 && team2 && team1 !== team2) ? (
        <>
          <div className="h2h-summary-box">
            <h3>📋 Summary (Format: {matchType})</h3>
            <ul>
              <li>Total Matches: <strong>10</strong></li>
              <li>{team1} Wins: <strong>4</strong></li>
              <li>{team2} Wins: <strong>5</strong></li>
              <li>Draws: <strong>1</strong></li>
              <li>Top Scorer: <strong>Virat Kohli (435 runs)</strong></li>
              <li>Top Bowler: <strong>Shaheen Afridi (12 wickets)</strong></li>
            </ul>
          </div>

          <div className="h2h-chart-container">
            <h3>📈 Performance Comparison</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={dummyChartData} margin={{ top: 20, right: 40, left: 10, bottom: 10 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="category" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Legend verticalAlign="top" />
                <Line
                  type="monotone"
                  dataKey={team1}
                  stroke="#34d399"
                  strokeWidth={3}
                  dot={{ r: 6 }}
                  activeDot={{ r: 8 }}
                  name={team1}
                />
                <Line
                  type="monotone"
                  dataKey={team2}
                  stroke="#f87171"
                  strokeWidth={3}
                  dot={{ r: 6 }}
                  activeDot={{ r: 8 }}
                  name={team2}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </>
      ) : (
        <div className="h2h-placeholder">
          <p>📊 Please select two different teams to view Head-to-Head statistics.</p>
        </div>
      )}
    </div>
  );
};

export default H2HRecords;
