import React, { useEffect, useState } from "react";
import axios from "axios";
import { useAuth } from "../services/auth";
import "./UserCricketStatsDashboardV2.css";

import RecentMatchesPanelV2 from "./RecentMatchesPanelV2";
import TopPerformerCard from "./TopPerformerCard";
import WinLossTrendDashboard from "./WinLossTrendDashboard";
import UserAchievements from "./UserAchievements";

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

  // Teams
  const [teams, setTeams] = useState([]);
  const [selectedTeam, setSelectedTeam] = useState("");
  const [teamsLoading, setTeamsLoading] = useState(true);

  // Match type
  const [selectedType, setSelectedType] = useState("All");

  // Top Performer
  const [topPerformer, setTopPerformer] = useState(null);
  const [tpLoading, setTpLoading] = useState(false);
  const [tpError, setTpError] = useState("");

  // Stats cards
  const [cardStats, setCardStats] = useState(null);
  const [cardLoading, setCardLoading] = useState(false);
  const [cardError, setCardError] = useState("");

  // Load user teams
  useEffect(() => {
    if (!currentUser?.id) return;
    setTeamsLoading(true);
    axios
      .get(`${API_BASE_URL}/user-teams?user_id=${currentUser.id}`)
      .then((res) => {
        const t = res.data?.teams || [];
        setTeams(t);
        setSelectedTeam((prev) => prev || t[0] || "");
      })
      .finally(() => setTeamsLoading(false));
  }, [currentUser]);

  // Load top performer (depends on team + type)
  useEffect(() => {
    if (!currentUser?.id || !selectedTeam) {
      setTopPerformer(null);
      setTpError("User/team not found. Please log in and select a team.");
      setTpLoading(false);
      return;
    }
    fetchTopPerformer(currentUser.id, selectedType, selectedTeam);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedType, selectedTeam, currentUser]);

  const fetchTopPerformer = async (userId, matchType, teamName) => {
    setTpLoading(true);
    setTpError("");
    setTopPerformer(null);
    try {
      const url = `${API_BASE_URL}/top-performer?user_id=${userId}&period=month&match_type=${matchType}&team_name=${encodeURIComponent(
        teamName
      )}`;
      const res = await axios.get(url);
      setTopPerformer(res.data?.performer ?? null);
    } catch {
      setTpError("Could not fetch top performer.");
      setTopPerformer(null);
    } finally {
      setTpLoading(false);
    }
  };

  // Load summary cards (depends on team + type)
  useEffect(() => {
    if (!currentUser?.id || !selectedTeam) return;
    setCardLoading(true);
    setCardStats(null);
    setCardError("");
    axios
      .get(`${API_BASE_URL}/team-match-stats`, {
        params: {
          user_id: currentUser.id,
          team_name: selectedTeam,
          match_type: selectedType,
        },
      })
      .then((res) => setCardStats(res.data))
      .catch(() =>
        setCardError("Could not load stats for the selected team/match type.")
      )
      .finally(() => setCardLoading(false));
  }, [currentUser, selectedTeam, selectedType]);

  if (!currentUser?.id) {
    return (
      <div className="dash-shell card-3d glass">
        <div className="dashboard-error">Please log in to view your dashboard.</div>
      </div>
    );
  }

  return (
    <div className="dash-shell card-3d glass">
      {/* Header */}
      <div className="dash-header">
        <div className="profile">
          <img
            src={currentUser.photo_url || "/default-profile.png"}
            alt="profile"
            className="avatar"
          />
          <div className="who">
            <div className="hello">
              Welcome, <span className="name">{currentUser.name || currentUser.first_name || currentUser.email || "Player"}</span>
            </div>

            {/* Team select */}
            <div className="select-wrap">
              {teamsLoading ? (
                <span className="muted">Loading teams…</span>
              ) : (
                <select
                  className="dark-select"
                  value={selectedTeam}
                  onChange={(e) => setSelectedTeam(e.target.value)}
                  aria-label="Select team"
                >
                  {teams.map((team) => (
                    <option key={team} value={team}>
                      {team.charAt(0).toUpperCase() + team.slice(1)}
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* Match-type pills */}
            <div className="pills">
              {MATCH_TYPES.map((type) => (
                <button
                  key={type}
                  className={`pill ${selectedType === type ? "active" : ""}`}
                  onClick={() => setSelectedType(type)}
                  aria-pressed={selectedType === type}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Top Performer */}
      <div className="block">
        {tpLoading ? (
          <div className="dashboard-loading">Loading MVP…</div>
        ) : tpError ? (
          <div className="dashboard-error">{tpError}</div>
        ) : (
          <TopPerformerCard performer={topPerformer} period="month" matchType={selectedType} />
        )}
      </div>

      {/* Win/Loss Trend */}
      <div className="block">
        <WinLossTrendDashboard selectedMatchType={selectedType} teamName={selectedTeam} />
      </div>

      {/* Summary cards */}
      <div className="block">
        {cardLoading ? (
          <div className="dashboard-loading">Loading cards…</div>
        ) : cardError ? (
          <div className="dashboard-error">{cardError}</div>
        ) : cardStats ? (
          <div className="stat-grid">
            <StatCard color={CARD_COLORS.played} label="Matches Played" value={cardStats.matches_played} icon="🏏" />
            <StatCard color={CARD_COLORS.won}    label="Matches Won"    value={cardStats.matches_won}    icon="🏆" />
            <StatCard color={CARD_COLORS.lost}   label="Matches Lost"   value={cardStats.matches_lost}   icon="❌" />
            <StatCard color={CARD_COLORS.draw}   label="Matches Draw"   value={cardStats.matches_draw}   icon="🤝" />
            <StatCard color={CARD_COLORS.runs}   label="Total Runs"     value={cardStats.total_runs}     icon="🔢" />
            <StatCard color={CARD_COLORS.wickets}label="Total Wickets"  value={cardStats.total_wickets}  icon="🎯" />
          </div>
        ) : (
          <div className="dashboard-info">No card stats found.</div>
        )}
      </div>

      {/* Achievements + Recent matches */}
      <div className="block">
        <UserAchievements userId={currentUser.id} matchType={selectedType} />
      </div>
      <div className="block">
        <RecentMatchesPanelV2 userId={currentUser.id} limit={5} />
      </div>
    </div>
  );
}

function StatCard({ color, label, value, icon }) {
  return (
    <div className="stat-card-3d" style={{ "--bg": color }}>
      <div className="stat-top">
        <span className="stat-ico" aria-hidden="true">{icon}</span>
        <span className="stat-label">{label}</span>
      </div>
      <div className="stat-value">{value}</div>
      <div className="stat-glow" aria-hidden="true" />
    </div>
  );
}
