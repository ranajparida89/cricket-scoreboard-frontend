import React, { useEffect, useState } from "react";
import axios from "axios";
import { useAuth } from "../services/auth";
import "./UserCricketStatsDashboardV2.css";
import RecentMatchesPanelV2 from "./RecentMatchesPanelV2";
import TopPerformerCard from "./TopPerformerCard";
import WinLossTrendDashboard from "./WinLossTrendDashboard";
import UserAchievements from "./UserAchievements"; // added for userAchievement

// Backend API base URL
const API_BASE_URL = "https://cricket-scoreboard-backend.onrender.com/api";

// Card colors for the main stats
const CARD_COLORS = {
  played: "#1976d2",
  won: "#22a98a",
  lost: "#ef5350",
  draw: "#757575",
  runs: "#1ecbe1",
  wickets: "#fbc02d",
};

// Supported match types (must match those used in backend/player_performance)
const MATCH_TYPES = ["All", "ODI", "T20", "Test"];

export default function UserCricketStatsDashboardV2() {
  const { currentUser } = useAuth();

  const [stats, setStats] = useState(null);
  const [selectedType, setSelectedType] = useState("All");
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState("");
  const [retryCount, setRetryCount] = useState(0);

  // ---- Top Performer states ----
  const [topPerformer, setTopPerformer] = useState(null);
  const [tpLoading, setTpLoading] = useState(false);
  const [tpError, setTpError] = useState("");

  // Fetch stats & Top Performer when user or match type changes
  useEffect(() => {
    if (!currentUser || !currentUser.id) {
      setApiError("User not found. Please log in.");
      setStats(null);
      setLoading(false);
      return;
    }
    fetchStats(currentUser.id, selectedType);
    fetchTopPerformer(currentUser.id, selectedType);
    // eslint-disable-next-line
  }, [selectedType, currentUser, retryCount]);

  // Main stats API call
  const fetchStats = async (userId, matchType, teamName) => {
    setLoading(true);
    setApiError("");
    try {
      if (!MATCH_TYPES.includes(matchType)) {
        setApiError("Invalid match type selected.");
        setStats(null);
        return;
      }
      //const url = `${API_BASE_URL}/user-dashboard-stats-v2?user_id=${userId}&match_type=${matchType}&team_name=${encodeURIComponent(teamName)}`;
      const url = `${API_BASE_URL}/user-dashboard-stats-v2?user_id=${userId}&match_type=${matchType}&team_name=${encodeURIComponent(teamName?.toLowerCase().trim())}`;
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

  // Top Performer API call (matches the selectedType)
  const fetchTopPerformer = async (userId, matchType) => {
    setTpLoading(true);
    setTpError("");
    setTopPerformer(null);
    try {
      // Always send match_type for accuracy!
      const url = `${API_BASE_URL}/top-performer?user_id=${userId}&period=month&match_type=${matchType}`;
      const res = await axios.get(url);
      //Debug: Uncomment this to see the API result in your browser console
       console.log("TopPerformer API:", res.data.performer, "| matchType:", matchType);
      setTopPerformer(res.data.performer ?? null);
    } catch (err) {
      setTpError("Could not fetch top performer.");
      setTopPerformer(null);
    } finally {
      setTpLoading(false);
    }
  };

  // Retry handler for stats errors
  const handleRetry = () => setRetryCount(retryCount + 1);

  // Card data for main stats
  const cardList = [
    { label: "Matches Played", value: stats?.matches_played ?? 0, color: CARD_COLORS.played },
    { label: "Matches Won", value: stats?.matches_won ?? 0, color: CARD_COLORS.won },
    { label: "Matches Lost", value: stats?.matches_lost ?? 0, color: CARD_COLORS.lost },
    { label: "Matches Draw", value: stats?.matches_draw ?? 0, color: CARD_COLORS.draw },
    { label: "Total Runs", value: stats?.total_runs ?? 0, color: CARD_COLORS.runs },
    { label: "Total Wickets", value: stats?.total_wickets ?? 0, color: CARD_COLORS.wickets },
    // Per Player Stats:
   // { label: "My Runs", value: stats?.player_total_runs ?? 0, color: "#FFB300" },
   // { label: "My Wickets", value: stats?.player_total_wickets ?? 0, color: "#C62828" },
  ];

  // Show login warning if user not present
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

          {/* ---- Top Performer Highlight Section ---- */}
      <div>
        {tpLoading ? (
          <div className="dashboard-loading" style={{ marginTop: 16 }}>Loading MVP...</div>
        ) : tpError ? (
          <div className="dashboard-error" style={{ marginTop: 16 }}>{tpError}</div>
        ) : (
          <TopPerformerCard
            performer={topPerformer}
            period="month"
            matchType={selectedType}
          />
        )}
      </div>

      {/* ---- Win/Loss Trend Section ---- */}
     <WinLossTrendDashboard selectedMatchType={selectedType} />   {/* ---- used for filter match type ODI,T20,Test By Ranaj Parida*/}

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
              <span style={{ fontSize: 12, color: "#aaa" }}>
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
              <UserAchievements userId={currentUser.id} matchType={selectedType} /> 
              <RecentMatchesPanelV2 userId={currentUser?.id} limit={5} />
            </>
          )}
        </div>
      )}
    </div>
  );
}
