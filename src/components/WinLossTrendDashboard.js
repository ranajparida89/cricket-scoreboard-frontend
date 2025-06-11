import React, { useEffect, useState } from "react";
import axios from "axios";
import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import "./WinLossTrendDashboard.css";
import { useAuth } from "../services/auth";

const API_BASE = "https://cricket-scoreboard-backend.onrender.com/api";

// Color codes for different outcomes
const outcomeColors = {
  Win: "#4caf50",    // Green
  Loss: "#f44336",   // Red
  Draw: "#ffeb3b",   // Yellow
  "No Result": "#9e9e9e" // Gray
};

/**
 * WinLossTrendDashboard component
 * @param {string} selectedMatchType - Match type filter: "All" | "ODI" | "T20" | "Test"
 */
const WinLossTrendDashboard = ({ selectedMatchType = "All" }) => {
  const [teams, setTeams] = useState([]);
  const [selectedTeam, setSelectedTeam] = useState("");
  const [trendData, setTrendData] = useState([]);
  const [loading, setLoading] = useState(false);

  const { currentUser } = useAuth(); // <-- Add this line

  // Fetch the list of teams on component mount
 // Fetch the list of teams for this user on mount or when currentUser changes
useEffect(() => {
  if (!currentUser || !currentUser.id) return;
  axios
    .get(`${API_BASE}/user-teams?user_id=${currentUser.id}`)
    .then(res => {
      setTeams(res.data.teams || []);
      if (res.data.teams && res.data.teams.length > 0) setSelectedTeam(res.data.teams[0]);
    });
}, [currentUser]);

  // Fetch win/loss trend when selectedTeam or selectedMatchType changes
  useEffect(() => {
    if (!selectedTeam) return;
    setLoading(true);
    axios
      .get(`${API_BASE}/win-loss-trend`, {
        params: {
          team_name: selectedTeam,
          match_type: selectedMatchType  // Send match_type to backend
        }
      })
      .then(res => setTrendData(res.data.data || []))
      .finally(() => setLoading(false));
  }, [selectedTeam, selectedMatchType]);

  // Calculate the streak (Win/Loss/Draw/No Result in a row)
  const calcStreak = data => {
    if (!data.length) return { type: '', count: 0 };
    let streakType = data[0].result;
    let streakCount = 1;
    for (let i = 1; i < data.length; i++) {
      if (data[i].result === streakType) streakCount++;
      else break;
    }
    return { type: streakType, count: streakCount };
  };
  const streak = calcStreak(trendData);

  // Format data for the BarChart (adds a resultValue for bar height)
  const chartData = trendData
    .slice(0).reverse()
    .map(entry => ({
      ...entry,
      resultValue: entry.result === "Win" ? 1
                 : entry.result === "Loss" ? -1
                 : entry.result === "Draw" ? 0.5
                 : 0
    }));

  return (
    <div className="win-loss-trend-dashboard">
      {/* Header and Team Selector */}
      <div className="trend-header">
        <h2>Win/Loss Trend (Last 10 Matches)</h2>
        <select
          className="team-select"
          value={selectedTeam}
          onChange={e => setSelectedTeam(e.target.value)}
        >
          {teams.map(team => (
            <option key={team} value={team}>{team}</option>
          ))}
        </select>
      </div>

      {/* Loading / No Data / Chart */}
      {loading ? (
        <div className="loading-trend">Loading...</div>
      ) : chartData.length === 0 ? (
        <div className="no-data-trend">No matches found for this team.</div>
      ) : (
        <>
          <ResponsiveContainer width="100%" height={110}>
            <BarChart data={chartData}>
              <XAxis
                dataKey="match_name"
                tickLine={false}
                axisLine={false}
                tick={{ fontSize: 14, fill: "#f1f1f1" }}
                label={{
                  value: "Recent Matches",
                  position: "insideBottom",
                  offset: -4,
                  fill: "#f1f1f1"
                }}
              />
              <Tooltip
                content={({ active, payload, label }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    return (
                      <div
                        style={{
                          background: "#222",
                          borderRadius: 10,
                          color: "#fff",
                          padding: "12px 18px",
                          minWidth: 180,
                          boxShadow: "0 4px 12px #111a"
                        }}
                      >
                        <div style={{ fontWeight: "bold", fontSize: 15, marginBottom: 4 }}>
                          {data.match_name}
                        </div>
                        <div style={{ fontSize: 14 }}>
                          <span style={{ color: outcomeColors[data.result], fontWeight: 700 }}>
                            Result: {data.result}
                          </span>
                          {" vs "}
                          <span style={{ color: "#90caf9" }}>{data.opponent}</span>
                          <span style={{ color: "#fff" }}> ({data.match_type})</span>
                        </div>
                      </div>
                    );
                  }
                  return null;
                }}
                cursor={false}
              />
              <Bar dataKey="resultValue">
                {chartData.map((entry, index) => (
                  <Cell key={index} fill={outcomeColors[entry.result] || "#bdbdbd"} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>

          {/* Legend */}
          <div className="trend-legend">
            <span className="win">■ Win</span>
            <span className="loss">■ Loss</span>
            <span className="draw">■ Draw</span>
            <span className="no-result">■ No Result</span>
          </div>

          {/* Streak Indicator */}
          {streak.count > 1 && (
            <div className="streak-indicator">
              <span>
                <b>{streak.type} Streak:</b> {streak.count}
              </span>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default WinLossTrendDashboard;
