// src/components/WinLossTrendDashboard.js
import React, { useEffect, useState, useMemo } from "react";
import axios from "axios";
import {
  BarChart,
  Bar,
  XAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import "./WinLossTrendDashboard.css";
import { useAuth } from "../services/auth";

const API_BASE = "https://cricket-scoreboard-backend.onrender.com/api";

const outcomeColors = {
  Win: "#22a98a",
  Loss: "#ef5350",
  Draw: "#f1d04f",
  "No Result": "#9e9e9e",
};

const WinLossTrendDashboard = ({ selectedMatchType = "All", teamName }) => {
  const { currentUser } = useAuth();
  const [trendData, setTrendData] = useState([]);
  const [loading, setLoading] = useState(false);
  const userId = currentUser?.id;

  // Fetch win/loss trend for current user + team
  useEffect(() => {
    if (!userId || !teamName) return;
    let cancelled = false;
    setLoading(true);

    axios
      .get(`${API_BASE}/win-loss-trend`, {
        params: {
          team_name: teamName,
          match_type: selectedMatchType,
          user_id: userId,
        },
      })
      .then((res) => {
        if (!cancelled) {
          const rows = Array.isArray(res.data?.data) ? res.data.data : [];
          setTrendData(rows);
        }
      })
      .finally(() => !cancelled && setLoading(false));

    return () => {
      cancelled = true;
    };
  }, [teamName, selectedMatchType, userId]);

  // Compute streak from most-recent-first data
  const streak = useMemo(() => {
    if (!trendData.length) return { type: "", count: 0 };
    let type = trendData[0].result;
    let count = 1;
    for (let i = 1; i < trendData.length; i++) {
      if (trendData[i].result === type) count++;
      else break;
    }
    return { type, count };
  }, [trendData]);

  // Oldest → newest for the chart + compact index
  const chartData = useMemo(() => {
    return trendData
      .slice(0, 10)
      .slice() // copy
      .reverse()
      .map((entry, i) => ({
        ...entry,
        h: 1, // constant height so color blocks read uniformly
        idx: i + 1, // 1..10 (oldest → newest)
      }));
  }, [trendData]);

  return (
    <div className="win-loss-trend-dashboard card-3d glass">
      <div className="trend-header">
        <div className="trend-title">
          <span className="trend-kicker">Form</span>
          <h2>Win/Loss Trend (Last 10 Matches)</h2>
        </div>
        <div className="trend-meta">
          {teamName && (
            <span className="trend-chip">
              Team:&nbsp;
              <b>{teamName.charAt(0).toUpperCase() + teamName.slice(1)}</b>
            </span>
          )}
          {streak.count > 1 && (
            <span
              className={`streak-chip ${streak.type.toLowerCase().replace(" ", "-")}`}
              title={`${streak.type} streak`}
            >
              {streak.type} Streak:&nbsp;<b>{streak.count}</b>
            </span>
          )}
        </div>
      </div>

      {loading ? (
        <div className="loading-trend">Loading trend…</div>
      ) : chartData.length === 0 ? (
        <div className="no-data-trend">No matches found for this team.</div>
      ) : (
        <>
          <div className="trend-chart">
            <ResponsiveContainer width="100%" height={140}>
              <BarChart
                data={chartData}
                margin={{ top: 6, right: 6, left: 6, bottom: 4 }}
                barCategoryGap={14}
                barGap={6}
              >
                {/* hide ticks to prevent overlap */}
                <XAxis dataKey="idx" tick={false} axisLine={false} tickLine={false} height={0} />

                <Tooltip
                  cursor={{ fill: "transparent" }}
                  content={({ active, payload }) => {
                    if (!active || !payload || !payload.length) return null;
                    const d = payload[0].payload;
                    return (
                      <div className="trend-tooltip">
                        <div className="tt-title">{d.match_name}</div>
                        <div className="tt-row">
                          <span className="tt-label">Result:</span>
                          <b style={{ color: outcomeColors[d.result] }}>{d.result}</b>
                        </div>
                        <div className="tt-row">
                          <span className="tt-label">Opponent:</span>
                          <span className="tt-val">{d.opponent}</span>
                        </div>
                        <div className="tt-row">
                          <span className="tt-label">Type:</span>
                          <span className="tt-val">{d.match_type}</span>
                        </div>
                        <div className="tt-row">
                          <span className="tt-label">Order:</span>
                          <span className="tt-val">#{d.idx} (oldest → newest)</span>
                        </div>
                      </div>
                    );
                  }}
                />

                <Bar dataKey="h" radius={[8, 8, 0, 0]}>
                  {chartData.map((entry, i) => (
                    <Cell key={`cell-${i}`} fill={outcomeColors[entry.result] || "#bdbdbd"} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="trend-legend">
            {Object.entries(outcomeColors).map(([key, color]) => (
              <span key={key} className="legend-item">
                <span className="dot" style={{ background: color }} />
                {key}
              </span>
            ))}
          </div>

          <div className="trend-footnote">Oldest &rarr; Newest</div>
        </>
      )}
    </div>
  );
};

export default WinLossTrendDashboard;
