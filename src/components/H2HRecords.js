// H2HRecords.js (✅ FINAL with loading + chart-safe + auto-hide)
import React, { useState, useEffect } from "react";
import "./H2HRecords.css";
import {
  LineChart, Line, XAxis, YAxis, Tooltip, Legend,
  CartesianGrid, ResponsiveContainer
} from "recharts";

const H2HRecords = () => {
  const [teams, setTeams] = useState([]);
  const [team1, setTeam1] = useState("");
  const [team2, setTeam2] = useState("");
  const [matchType, setMatchType] = useState("ALL"); // default changed from "ODI"
  const [summary, setSummary] = useState(null);
  const [loadingSummary, setLoadingSummary] = useState(false);

  const [players, setPlayers] = useState([]);
  const [player1, setPlayer1] = useState("");
  const [player2, setPlayer2] = useState("");
  const [playerStats, setPlayerStats] = useState(null);
  const [loadingPlayers, setLoadingPlayers] = useState(false);

  useEffect(() => {
    fetch("https://cricket-scoreboard-backend.onrender.com/api/h2h/teams")
      .then(res => res.json())
      .then(data => {
        const cleaned = data.filter(name => /^[a-zA-Z ]+$/.test(name)).sort();
        setTeams(cleaned);
      })
      .catch(err => console.error("Failed to load team list", err));
  }, []);

  useEffect(() => {
    fetch("https://cricket-scoreboard-backend.onrender.com/api/players/list")
      .then(res => res.json())
      .then(data => setPlayers(data))
      .catch(err => console.error("Failed to load players", err));
  }, []);

  useEffect(() => {
    if (team1 && team2 && matchType && team1 !== team2) {
      setLoadingSummary(true);
      fetch(`https://cricket-scoreboard-backend.onrender.com/api/h2h/summary?team1=${encodeURIComponent(team1)}&team2=${encodeURIComponent(team2)}&type=${matchType}`)
        .then(res => res.json())
        .then(data => {
          setSummary(data);
          setLoadingSummary(false);
        })
        .catch(err => {
          console.error("Failed to fetch H2H summary", err);
          setLoadingSummary(false);
        });
    }
  }, [team1, team2, matchType]);

  useEffect(() => {
    if (player1 && player2 && player1 !== player2) {
      setLoadingPlayers(true);
      fetch(`https://cricket-scoreboard-backend.onrender.com/api/players/compare?player1=${encodeURIComponent(player1)}&player2=${encodeURIComponent(player2)}`)
        .then(res => res.json())
        .then(data => {
          setPlayerStats(data.players);
          setLoadingPlayers(false);
        })
        .catch(err => {
          console.error("Failed to fetch player stats", err);
          setLoadingPlayers(false);
        });
    }
  }, [player1, player2]);

  const getChartData = () => {
    if (!summary || !team1 || !team2) return [];
    return [
      { category: "Wins", [team1]: summary[team1] || 0, [team2]: summary[team2] || 0 },
      { category: "Draws", [team1]: summary.draws || 0, [team2]: summary.draws || 0 }
    ];
  };

  const getPlayerChartData = () => {
    if (!playerStats || !playerStats[player1] || !playerStats[player2]) return [];

    return [
      { metric: "Runs", [player1]: playerStats[player1].runs, [player2]: playerStats[player2].runs },
      { metric: "Centuries", [player1]: playerStats[player1].centuries, [player2]: playerStats[player2].centuries },
      { metric: "Fifties", [player1]: playerStats[player1].fifties, [player2]: playerStats[player2].fifties },
      { metric: "Wickets", [player1]: playerStats[player1].wickets, [player2]: playerStats[player2].wickets }
    ];
  };

  return (
    <div className="h2h-container">
      <h2 className="h2h-heading">🆚 Head-to-Head Records</h2>

      <div className="h2h-selectors">
        <select value={team1} onChange={e => setTeam1(e.target.value)} className="h2h-dropdown">
          <option value="">Select Team 1</option>
          {teams.map(t => <option key={t} value={t}>{t}</option>)}
        </select>

        <select value={team2} onChange={e => setTeam2(e.target.value)} className="h2h-dropdown">
          <option value="">Select Team 2</option>
          {teams.map(t => <option key={t} value={t}>{t}</option>)}
        </select>

        <select value={matchType} onChange={e => setMatchType(e.target.value)} className="h2h-dropdown match-type">
          <option value="ALL">All</option>
          <option value="ODI">ODI</option>
          <option value="T20">T20</option>
          <option value="TEST">Test</option>
        </select>
      </div>

      {loadingSummary && <p className="loading-text">Loading summary...</p>}

      {summary && (
        <>
          <div className="h2h-summary-box">
            <h3>📋 Summary (Format: {matchType === "ALL" ? "All Formats" : matchType})</h3>
            <ul>
              <li>Total Matches: <strong>{summary.total_matches}</strong></li>
              <li>{team1} Wins: <strong>{summary[team1]}</strong></li>
              <li>{team2} Wins: <strong>{summary[team2]}</strong></li>
              <li>Draws: <strong>{summary.draws}</strong></li>
              <li>{team1} Win %: <strong>{summary.win_percentage_team1 || 0}%</strong></li>
              <li>{team2} Win %: <strong>{summary.win_percentage_team2 || 0}%</strong></li>
            </ul>
          </div>

          <div className="h2h-chart-container">
            <h3>📈 Performance Comparison</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={getChartData()}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="category" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey={team1} stroke="#34d399" strokeWidth={3} />
                <Line type="monotone" dataKey={team2} stroke="#f87171" strokeWidth={3} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </>
      )}

      <div className="player-comparison-section">
        <h2 className="h2h-heading">👤 Player Comparison</h2>

        <div className="h2h-selectors">
          <select value={player1} onChange={e => setPlayer1(e.target.value)} className="h2h-dropdown">
            <option value="">Select Player 1</option>
            {players.map(p => <option key={p} value={p}>{p}</option>)}
          </select>

          <select value={player2} onChange={e => setPlayer2(e.target.value)} className="h2h-dropdown">
            <option value="">Select Player 2</option>
            {players.map(p => <option key={p} value={p}>{p}</option>)}
          </select>
        </div>

        {loadingPlayers && <p className="loading-text">Loading player comparison...</p>}

        {playerStats && playerStats[player1] && playerStats[player2] && (
          <div className="player-comparison-card">
            <div className="player-columns">
              <div>
                <h4>{player1}</h4>
                <ul>
                  <li>Total Runs: {playerStats[player1].runs}</li>
                  <li>Centuries: {playerStats[player1].centuries}</li>
                  <li>Half-Centuries: {playerStats[player1].fifties}</li>
                  <li>Batting Avg: {playerStats[player1].batting_avg}</li>
                  <li>Highest Score: {playerStats[player1].highest}</li>
                  <li>Wickets: {playerStats[player1].wickets}</li>
                  <li>Bowling Avg: {playerStats[player1].bowling_avg}</li>
                </ul>
              </div>
              <div>
                <h4>{player2}</h4>
                <ul>
                  <li>Total Runs: {playerStats[player2].runs}</li>
                  <li>Centuries: {playerStats[player2].centuries}</li>
                  <li>Half-Centuries: {playerStats[player2].fifties}</li>
                  <li>Batting Avg: {playerStats[player2].batting_avg}</li>
                  <li>Highest Score: {playerStats[player2].highest}</li>
                  <li>Wickets: {playerStats[player2].wickets}</li>
                  <li>Bowling Avg: {playerStats[player2].bowling_avg}</li>
                </ul>
              </div>
            </div>

            <div className="strength-meter">
              <div className="meter-bar">
                <div className="meter-fill" style={{ width: `${playerStats[player1].runs > playerStats[player2].runs ? 65 : 35}%` }}>
                  {(playerStats[player1].runs > playerStats[player2].runs ? player1 : player2)} is stronger 💪
                </div>
              </div>
            </div>

            <div className="player-chart-comparison">
              <h3>📊 Stats Comparison Line Chart</h3>
              <ResponsiveContainer width="100%" height={280}>
                <LineChart data={getPlayerChartData()}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="metric" />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey={player1} stroke="#3b82f6" strokeWidth={3} dot={{ r: 5 }} />
                  <Line type="monotone" dataKey={player2} stroke="#ef4444" strokeWidth={3} dot={{ r: 5 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default H2HRecords;
