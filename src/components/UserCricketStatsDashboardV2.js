// src/components/UserCricketStatsDashboardV2.js

import React, { useEffect, useState } from "react";
import axios from "axios";
import { useAuth } from "../services/auth";
import "./UserCricketStatsDashboardV2.css";
import RecentMatchesPanelV2 from "./RecentMatchesPanelV2";

const API_BASE_URL = "https://cricket-scoreboard-backend.onrender.com/api";
const CARD_COLORS = {
  played: "#1976d2",
  won: "#22a98a",
  lost: "#ef5350",
  draw: "#757575",
  runs: "#1ecbe1",
  wickets: "#fbc02d",
};

const MATCH_TYPES = ["All", "ODI", "T20", "Test"];

export default function UserCricketStatsDashboardV2() {
  const { currentUser } = useAuth();
  const [stats, setStats] = useState(null);
  const [selectedType, setSelectedType] = useState("All");
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState("");
  const [retryCount, setRetryCount] = useState(0);

  // Fetch stats when user or match type changes
  useEffect(() => {
    if (!currentUser || !currentUser.id) {
      setApiError("User not found. Please log in.");
      setStats(null);
      setLoading(false);
      return;
    }
    fetchStats(currentUser.id, selectedType);
    // eslint-disable-next-line
  }, [selectedType, currentUser, retryCount]);

  // API call for main dashboard stats
  const fetchStats = async (userId, matchType) => {
    setLoading(true);
    setApiError("");
    try {
      if (!MATCH_TYPES.includes(matchType)) {
        setApiError("Invalid match type selected.");
        setStats(null);
        return;
      }
      const url = `${API_BASE_URL}/user-dashboard-stats-v2?user_id=${userId}&match_type=${matchType}`;
      const res = await axios.get(url);
      setStats(res.data);
    } catch (err) {
      setApiError(
        err.response?.data?.error ||
        "Could not load dashboard stats. Please check your connection and try again."
      );
      setStats(null);
    } finally {
      setLoading(false);
    }
  };

  // Retry handler
  const handleRetry = () => setRetryCount(retryCount + 1);

  // Card data for stats
  const cardList = [
    { label: "Matches Played", value: stats?.matches_played ?? 0, color: CARD_COLORS.played},
    { label: "Matches Won", value: stats?.matches_won ?? 0, color: CARD_COLORS.won, icon: "🏆" },
    { label: "Matches Lost", value: stats?.matches_lost ?? 0, color: CARD_COLORS.lost, icon: "❌" },
    { label: "Matches Draw", value: stats?.matches_draw ?? 0, color: CARD_COLORS.draw, icon: "🤝" },
    { label: "Total Runs", value: stats?.total_runs ?? 0, color: CARD_COLORS.runs, icon: "🔢" },
    { label: "Total Wickets", value: stats?.total_wickets ?? 0, color: CARD_COLORS.wickets, icon: "🎯" },
  ];

  // UI
  if (!currentUser || !currentUser.id) {
    return (
      <div className="cricket-dashboard-outer">
        <div className="dashboard-error">Please log in to view your dashboard.</div>
      </div>
    );
  }

  return (
    <div className="cricket-dashboard-outer">
      <div className="profile-row">
        <img
          src={currentUser.photo_url || "/default-profile.png"}
          alt="profile"
          className="profile-img"
        />
        <div>
          <div className="user-welcome">
            Welcome,
            <span className="username">
              {currentUser.name || currentUser.first_name || currentUser.email || "Player"}
            </span>
          </div>
          <div className="match-type-pills">
            {MATCH_TYPES.map((type) => (
              <button
                key={type}
                className={`pill-btn${selectedType === type ? " active" : ""}`}
                style={{
                  background: selectedType === type ? "#1976d2" : "#283e54",
                  color: selectedType === type ? "#fff" : "#bbdefb",
                  fontWeight: selectedType === type ? "bold" : 500,
                  border: "none",
                }}
                onClick={() => setSelectedType(type)}
                aria-pressed={selectedType === type}
              >
                {type}
              </button>
            ))}
          </div>
        </div>
      </div>

      {loading ? (
        <div className="dashboard-loading">Loading stats...</div>
      ) : apiError ? (
        <div className="dashboard-error">
          {apiError}
          <br />
          <button onClick={handleRetry} className="retry-btn">Retry</button>
        </div>
      ) : (
        <div>
          {cardList.every(card => card.value === 0) ? (
            <div className="dashboard-info">
              No matches found for your teams yet.
              <br />
              <span style={{fontSize: 12, color: "#aaa"}}>
                (Play or add new matches to see your stats here.)
              </span>
            </div>
          ) : (
            <>
              <div className="stats-cards-grid">
                {cardList.map((card, idx) => (
                  <div
                    className="stat-card"
                    style={{
                      background: card.color,
                      animationDelay: `${0.09 * idx}s`
                    }}
                    key={card.label}
                    aria-label={card.label + ": " + card.value}
                  >
                    <div className="stat-icon">{card.icon}</div>
                    <div className="stat-label">{card.label}</div>
                    <div className="stat-value">{card.value}</div>
                  </div>
                ))}
              </div>

              {/* Ranaj Parida | Added RecentMatchesPanelV2 for Recent User Matches | 07-Jun-2025 */}
              {/* Advanced user-focused Recent Matches panel, non-invasive */}
              <RecentMatchesPanelV2 userId={currentUser?.id} limit={5} />
            </>
          )}
        </div>
      )}
    </div>
  );
}
