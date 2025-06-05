// src/components/RecentMatchesPanelV2.js

import React, { useEffect, useState } from "react";
import axios from "axios";
import "./RecentMatchesPanelV2.css";
import { FaTrophy, FaRegSadCry, FaHandshake, FaClock, FaTimes } from "react-icons/fa";

const API_BASE_URL = "https://cricket-scoreboard-backend.onrender.com/api";

export default function RecentMatchesPanelV2({ userId, limit = 5 }) {
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState("");
  const [selectedMatch, setSelectedMatch] = useState(null);

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

  // Close modal on ESC
  useEffect(() => {
    if (!selectedMatch) return;
    const handleEsc = (e) => {
      if (e.key === "Escape") setSelectedMatch(null);
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [selectedMatch]);

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

  // Helper to get icon/color for result
  const getResultDisplay = (result) => {
    if (result === "Won") return { color: "#22a98a", icon: <FaTrophy /> };
    if (result === "Lost") return { color: "#ef5350", icon: <FaRegSadCry /> };
    return { color: "#757575", icon: <FaHandshake /> };
  };

  return (
    <div className="recent-matches-panel-v2">
      <h3>
        <FaClock style={{ color: "#1ecbe1", marginRight: 6 }} />
        Recent Matches
      </h3>
      <div className="recent-matches-panel-scroll">
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
          const { color, icon } = getResultDisplay(m.result);
          // Format date
          const dateStr = new Date(m.match_time).toLocaleDateString(undefined, {
            year: "numeric", month: "short", day: "numeric"
          });
          return (
            <div
              className="rm-row"
              key={m.match_id}
              tabIndex={0}
              style={{ cursor: "pointer" }}
              onClick={() => setSelectedMatch(m)}
              title="Click for match details"
              aria-label={`Open details for ${m.match_name}`}
            >
              <span>{dateStr}</span>
              <span title={m.match_name}>{m.match_name}</span>
              <span>{m.match_type}</span>
              <span>{m.opponent}</span>
              <span style={{ color, fontWeight: 600 }}>
                <span className="rm-icon">{icon}</span> {m.result}
              </span>
              <span>{m.runs}</span>
              <span>{m.wickets}</span>
            </div>
          );
        })}
      </div>

      {/* ---------- Floating Modal for Details ---------- */}
      {selectedMatch && (
        <div className="rm-modal-backdrop" onClick={() => setSelectedMatch(null)}>
          <div
            className="rm-modal"
            onClick={e => e.stopPropagation()}
            tabIndex={-1}
          >
            <button className="rm-modal-close" onClick={() => setSelectedMatch(null)} aria-label="Close">
              <FaTimes />
            </button>
            <h4 style={{ marginBottom: 18, color: "#1ecbe1" }}>
              Match Details
            </h4>
            <div className="rm-modal-details">
              <div><strong>Date:</strong> {new Date(selectedMatch.match_time).toLocaleString()}</div>
              <div><strong>Match Name:</strong> {selectedMatch.match_name}</div>
              <div><strong>Type:</strong> {selectedMatch.match_type}</div>
              <div><strong>Opponent:</strong> {selectedMatch.opponent}</div>
              <div>
                <strong>Result:</strong>
                <span style={{ color: getResultDisplay(selectedMatch.result).color, marginLeft: 6 }}>
                  {getResultDisplay(selectedMatch.result).icon} {selectedMatch.result}
                </span>
              </div>
              <div><strong>Runs:</strong> {selectedMatch.runs}</div>
              <div><strong>Wickets:</strong> {selectedMatch.wickets}</div>
              {/* Add more fields if your API provides them! */}
            </div>
          </div>
        </div>
      )}
      {/* ---------- End Modal ---------- */}
    </div>
  );
}
