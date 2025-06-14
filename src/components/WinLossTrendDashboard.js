import React, { useEffect, useState } from "react";
import axios from "axios";
import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import "./WinLossTrendDashboard.css";
import { useAuth } from "../services/auth";

const API_BASE = "https://cricket-scoreboard-backend.onrender.com/api";

const outcomeColors = {
  Win: "#4caf50",
  Loss: "#f44336",
  Draw: "#ffeb3b",
  "No Result": "#9e9e9e"
};

/**
 * #SYNCFIX: Now takes teamName prop (selected in main dashboard)
 */
const WinLossTrendDashboard = ({ selectedMatchType = "All", teamName }) => {
  const [trendData, setTrendData] = useState([]);
  const [loading, setLoading] = useState(false);

  const { currentUser } = useAuth();

  // #SYNCFIX: Fetch win/loss trend for the teamName prop (no dropdown here)
  useEffect(() => {
    if (!currentUser || !currentUser.id || !teamName) return;
    setLoading(true);
    axios
      .get(`${API_BASE}/win-loss-trend`, {
        params: {
          team_name: teamName,
          match_type: selectedMatchType,
          user_id: currentUser.id
        }
      })
      .then(res => setTrendData(res.data.data || []))
      .finally(() => setLoading(false));
  }, [teamName, selectedMatchType, currentUser.id]);

  // ... (same as before, unchanged)
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
      {/* #SYNCFIX: Header only, NO team dropdown here */}
      <div className="trend-header">
        <h2>Win/Loss Trend (Last 10 Matches)</h2>
        <span style={{ fontWeight: 700, fontSize: 16, color: "#8fd" }}>
          {teamName && `Team: ${teamName.charAt(0).toUpperCase() + teamName.slice(1)}`}
        </span>
      </div>
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
          <div className="trend-legend">
            <span className="win">■ Win</span>
            <span className="loss">■ Loss</span>
            <span className="draw">■ Draw</span>
            <span className="no-result">■ No Result</span>
          </div>
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
