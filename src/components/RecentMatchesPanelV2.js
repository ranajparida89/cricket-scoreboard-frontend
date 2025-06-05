// src/components/RecentMatchesPanelV2.js

import React, { useEffect, useState } from "react";
import axios from "axios";
import "./RecentMatchesPanelV2.css"; // We will create this next
import { FaTrophy, FaRegSadCry, FaHandshake, FaClock } from "react-icons/fa";

const API_BASE_URL = "https://cricket-scoreboard-backend.onrender.com/api";

export default function RecentMatchesPanelV2({ userId, limit = 5 }) {
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState("");

  useEffect(() => {
    if (!userId) return;
    setLoading(true);
    setApiError("");
    axios
      .get(`${API_BASE_URL}/user-recent-matches-v2?user_id=${userId}&limit=${limit}`)
      .then((res) => setMatches(res.data))
      .catch(() => setApiError("Failed to load recent matches"))
      .finally(() => setLoading(false));
  }, [userId, limit]);

  if (!userId) {
    return <div className="recent-matches-panel-v2">User not found.</div>;
  }

  if (loading) {
    return (
      <div className="recent-matches-panel-v2 loading">Loading recent matches...</div>
    );
  }

  if (apiError) {
    return (
      <div className="recent-matches-panel-v2 error">{apiError}</div>
    );
  }

  if (matches.length === 0) {
    return (
      <div className="recent-matches-panel-v2 empty">
        <FaRegSadCry style={{ fontSize: 32, color: "#ffb300" }} />
        <span>No recent matches found!</span>
      </div>
    );
  }

  return (
    <div className="recent-matches-panel-v2">
      <h3>
        <FaClock style={{ color: "#1ecbe1", marginRight: 6 }} />
        Recent Matches
      </h3>
      <div className="recent-matches-table">
        <div className="rm-header">
          <span>Date</span>
          <span>Match</span>
          <span>Type</span>
          <span>Opponent</span>
          <span>Result</span>
          <span>Runs</span>
          <span>Wickets</span>
        </div>
        {matches.map((m, i) => {
          let resultColor = "#757575", resultIcon = <FaHandshake />;
          if (m.result === "Won") { resultColor = "#22a98a"; resultIcon = <FaTrophy />; }
          else if (m.result === "Lost") { resultColor = "#ef5350"; resultIcon = <FaRegSadCry />; }
          // Format date nicely
          const dateStr = new Date(m.match_time).toLocaleDateString(undefined, {
            year: "numeric", month: "short", day: "numeric"
          });
          return (
            <div className="rm-row" key={m.match_id}>
              <span>{dateStr}</span>
              <span title={m.match_name}>{m.match_name}</span>
              <span>{m.match_type}</span>
              <span>{m.opponent}</span>
              <span style={{ color: resultColor, fontWeight: 600 }}>
                <span className="rm-icon">{resultIcon}</span> {m.result}
              </span>
              <span>{m.runs}</span>
              <span>{m.wickets}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
