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
  // 🏏 Team Comparison States
  const [teams, setTeams] = useState([]);
  const [team1, setTeam1] = useState("");
  const [team2, setTeam2] = useState("");
  const [matchType, setMatchType] = useState("ODI");

  // 👤 Player Comparison States
  const [players, setPlayers] = useState([]);
  const [player1, setPlayer1] = useState("");
  const [player2, setPlayer2] = useState("");

  // 🧠 Chart dummy for now
  const dummyChartData = [
    { category: "Wins", [team1]: 3, [team2]: 5 },
    { category: "Losses", [team1]: 2, [team2]: 1 },
    { category: "Draws", [team1]: 1, [team2]: 2 },
  ];

  useEffect(() => {
    // Fetch team list (static for now)
    setTeams([
      "India", "Pakistan", "Australia", "England",
      "South Africa", "New Zealand", "Sri Lanka", "Bangladesh"
    ]);

    // Fetch real player list from backend
    fetch("https://cricket-scoreboard-backend.onrender.com/api/players/list")
      .then((res) => res.json())
      .then((data) => setPlayers(data))
      .catch((err) => console.error("Failed to load players:", err));
  }, []);

  return (
    <div className="h2h-container">
      {/* 🏏 Team Comparison Section */}
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

      {/* 👤 Player Comparison Section */}
      <div className="player-comparison-section">
        <h2 className="h2h-heading">👤 Player Comparison</h2>

        <div className="h2h-selectors">
          <select value={player1} onChange={(e) => setPlayer1(e.target.value)} className="h2h-dropdown">
            <option value="">Select Player 1</option>
            {players.map((p) => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>

          <select value={player2} onChange={(e) => setPlayer2(e.target.value)} className="h2h-dropdown">
            <option value="">Select Player 2</option>
            {players.map((p) => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>
        </div>

        {(player1 && player2 && player1 !== player2) ? (
          <div className="player-comparison-card">
            <div className="player-columns">
              <div>
                <h4>{player1}</h4>
                <ul>
                  <li>Total Runs: 8902</li>
                  <li>Centuries: 30</li>
                  <li>Half-Centuries: 48</li>
                  <li>Batting Avg: 54.3</li>
                  <li>Highest Score: 183</li>
                  <li>Wickets: 12</li>
                  <li>Bowling Avg: 32.6</li>
                </ul>
              </div>

              <div>
                <h4>{player2}</h4>
                <ul>
                  <li>Total Runs: 8104</li>
                  <li>Centuries: 26</li>
                  <li>Half-Centuries: 51</li>
                  <li>Batting Avg: 49.2</li>
                  <li>Highest Score: 158</li>
                  <li>Wickets: 18</li>
                  <li>Bowling Avg: 29.4</li>
                </ul>
              </div>
            </div>

            <div className="strength-meter">
              <div className="meter-bar">
                <div
                  className="meter-fill"
                  style={{ width: "65%" }}
                >
                  {player1} is stronger 💪
                </div>
              </div>
            </div>
          </div>
        ) : (
          <p className="placeholder-text">⚖️ Please select two different players to compare.</p>
        )}
      </div>
    </div>
  );
};

export default H2HRecords;
