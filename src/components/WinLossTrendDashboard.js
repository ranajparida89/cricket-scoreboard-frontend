import React, { useEffect, useState } from "react";
import axios from "axios";
import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import "./WinLossTrendDashboard.css";

const API_BASE = "https://cricket-scoreboard-backend.onrender.com/api";

// Colors for different results
const outcomeColors = {
  Win: "#43a047",    // green
  Loss: "#e53935",   // red
  Draw: "#757575",   // gray
  "No Result": "#bdbdbd"
};

const WinLossTrendDashboard = () => {
  const [teams, setTeams] = useState([]);
  const [selectedTeam, setSelectedTeam] = useState("");
  const [trendData, setTrendData] = useState([]);
  const [loading, setLoading] = useState(false);

  // Fetch team list for dropdown
  useEffect(() => {
    axios
      .get(`${API_BASE}/user-teams`)
      .then(res => {
        setTeams(res.data.teams || []);
        if (res.data.teams && res.data.teams.length > 0) setSelectedTeam(res.data.teams[0]);
      });
  }, []);

  // Fetch win/loss trend when selectedTeam changes
  useEffect(() => {
    if (!selectedTeam) return;
    setLoading(true);
    axios
      .get(`${API_BASE}/win-loss-trend?team_name=${encodeURIComponent(selectedTeam)}`)
      .then(res => setTrendData(res.data.data || []))
      .finally(() => setLoading(false));
  }, [selectedTeam]);

  // Calculate current streak
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

  return (
    <div className="win-loss-trend-dashboard">
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

      {loading ? (
        <div className="loading-trend">Loading...</div>
      ) : trendData.length === 0 ? (
        <div className="no-data-trend">No matches found for this team.</div>
      ) : (
        <>
          <ResponsiveContainer width="100%" height={110}>
            <BarChart data={trendData.slice(0).reverse()}>
              <XAxis
                dataKey="match_name"
                tickLine={false}
                axisLine={false}
                tick={{ fontSize: 14, fill: "#f1f1f1" }}
                label={{ value: "Recent Matches", position: "insideBottom", offset: -4, fill: "#f1f1f1" }}
              />
              <Tooltip
                contentStyle={{ background: "#222", borderRadius: 10, color: "#fff" }}
                formatter={(value, name, props) =>
                  `${props.payload.result} vs ${props.payload.opponent} (${props.payload.match_type})`
                }
                cursor={false}
              />
              <Bar dataKey="result">
                {trendData.slice(0).reverse().map((entry, index) => (
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
