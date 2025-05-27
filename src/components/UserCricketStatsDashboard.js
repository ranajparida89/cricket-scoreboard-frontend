// ✅ src/components/UserCricketStatsDashboard.js
// ✅ Ranaj Parida | 28-May-2025 | Super Advanced User Cricket Stats Dashboard (UPDATED: use "currentUser" everywhere)

import React, { useEffect, useState } from "react";
import axios from "axios";
import "./UserCricketStatsDashboard.css";

const CARD_COLORS = {
  played: "#1976d2",  // blue
  won: "#22a98a",     // green
  lost: "#ef5350",    // red
  draw: "#757575",    // gray
  runs: "#1ecbe1",    // aqua
  wickets: "#fbc02d", // gold
};

const MATCH_TYPES = ["All", "ODI", "T20", "Test"];

export default function UserCricketStatsDashboard({ user }) {
  // 'user' prop: { id, name, photo_url } or get from context/localStorage
  const [stats, setStats] = useState(null);
  const [selectedType, setSelectedType] = useState("All");
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState("");

  // Optional: for advanced delete actions (next step)
  // const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    // ====== CHANGED: always use "currentUser" key for localStorage ======
    let currentUser = user;
    if (!currentUser) {
      const local = localStorage.getItem("currentUser"); // <-- updated!
      if (local) currentUser = JSON.parse(local);
    }
    if (!currentUser || !currentUser.id) {
      setApiError("User not found. Please log in.");
      setLoading(false);
      return;
    }
    fetchStats(currentUser.id, selectedType);
    // eslint-disable-next-line
  }, [selectedType, user]); // added "user" to deps for good measure

  const fetchStats = async (userId, matchType) => {
    setLoading(true);
    setApiError("");
    try {
      const { data } = await axios.get("/api/user-dashboard-stats", {
        params: { user_id: userId, match_type: matchType },
      });
      setStats(data);
    } catch (err) {
      setApiError("Error fetching stats. Please try again.");
      setStats(null);
    } finally {
      setLoading(false);
    }
  };

  // Stat card list, for easy mapping & animation
  const cardList = [
    { label: "Matches Played", value: stats?.matches_played ?? 0, color: CARD_COLORS.played, icon: "🏏" },
    { label: "Matches Won", value: stats?.matches_won ?? 0, color: CARD_COLORS.won, icon: "🏆" },
    { label: "Matches Lost", value: stats?.matches_lost ?? 0, color: CARD_COLORS.lost, icon: "❌" },
    { label: "Matches Draw", value: stats?.matches_draw ?? 0, color: CARD_COLORS.draw, icon: "🤝" },
    { label: "Total Runs", value: stats?.total_runs ?? 0, color: CARD_COLORS.runs, icon: "🔢" },
    { label: "Total Wickets", value: stats?.total_wickets ?? 0, color: CARD_COLORS.wickets, icon: "🎯" },
  ];

  // Responsive and themed profile section
  return (
    <div className="cricket-dashboard-outer">
      <div className="profile-row">
        <img
          src={user?.photo_url || "/default-profile.png"}
          alt="profile"
          className="profile-img"
        />
        <div>
          <div className="user-welcome">
            Welcome,
            <span className="username">
              {user?.name || user?.first_name || user?.email || "Player"}
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

      {/* Delete Buttons (for next step) */}
      {/* <div className="delete-actions-row">
        <button className="delete-btn" onClick={handleDeleteOne}>Delete Match</button>
        <button className="delete-btn" onClick={() => setShowDeleteConfirm(true)}>Delete All Stats</button>
      </div>
      {showDeleteConfirm && (
        <ConfirmModal onConfirm={handleDeleteAll} onCancel={() => setShowDeleteConfirm(false)} />
      )} */}
    </div>
  );
}
