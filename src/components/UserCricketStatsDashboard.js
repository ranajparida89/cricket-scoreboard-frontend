// src/components/UserCricketStatsDashboard.js
import React, { useEffect, useState } from "react";
import axios from "axios";
import { useAuth } from "../services/auth"; // Update path as needed
import "./UserCricketStatsDashboard.css";

const CARD_COLORS = {
  played: "#1976d2",
  won: "#22a98a",
  lost: "#ef5350",
  draw: "#757575",
  runs: "#1ecbe1",
  wickets: "#fbc02d",
};

const MATCH_TYPES = ["All", "ODI", "T20", "Test"];

export default function UserCricketStatsDashboard() {
  const { currentUser } = useAuth(); // <-- Always use context!
  const [stats, setStats] = useState(null);
  const [selectedType, setSelectedType] = useState("All");
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState("");

  useEffect(() => {
    if (!currentUser || !currentUser.id) {
      setApiError("User not found. Please log in.");
      setLoading(false);
      return;
    }
    fetchStats(currentUser.id, selectedType);
    // eslint-disable-next-line
  }, [selectedType, currentUser]);

  const fetchStats = async (userId, matchType) => {
    setLoading(true);
    setApiError("");
    try {
      const { data } = await axios.get("/api/user-dashboard-stats", {
        params: { user_id: userId, match_type: matchType },
      });
      console.log("Dashboard API response:", data); // <--- ADD THIS
      setStats(data);
    } catch (err) {
      setApiError("Error fetching stats. Please try again.");
      setStats(null);
    } finally {
      setLoading(false);
    }
  };

  const cardList = [
    { label: "Matches Played", value: stats?.matches_played ?? 0, color: CARD_COLORS.played, icon: "🏏" },
    { label: "Matches Won", value: stats?.matches_won ?? 0, color: CARD_COLORS.won, icon: "🏆" },
    { label: "Matches Lost", value: stats?.matches_lost ?? 0, color: CARD_COLORS.lost, icon: "❌" },
    { label: "Matches Draw", value: stats?.matches_draw ?? 0, color: CARD_COLORS.draw, icon: "🤝" },
    { label: "Total Runs", value: stats?.total_runs ?? 0, color: CARD_COLORS.runs, icon: "🔢" },
    { label: "Total Wickets", value: stats?.total_wickets ?? 0, color: CARD_COLORS.wickets, icon: "🎯" },
  ];

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
        <div className="dashboard-error">{apiError}</div>
      ) : (
        <div className="stats-cards-grid">
          {cardList.map((card, idx) => (
            <div
              className="stat-card"
              style={{
                background: card.color,
                animationDelay: `${0.09 * idx}s`
              }}
              key={card.label}
            >
              <div className="stat-icon">{card.icon}</div>
              <div className="stat-label">{card.label}</div>
              <div className="stat-value">{card.value}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}