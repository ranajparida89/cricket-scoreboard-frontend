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

  // Team state, list and loading
  const [teams, setTeams] = useState([]);
  const [selectedTeam, setSelectedTeam] = useState("");
  const [teamsLoading, setTeamsLoading] = useState(true);

  const [selectedType, setSelectedType] = useState("All");

  // Top Performer states
  const [topPerformer, setTopPerformer] = useState(null);
  const [tpLoading, setTpLoading] = useState(false);
  const [tpError, setTpError] = useState("");

  // Card stats state (dynamically loaded)
  const [cardStats, setCardStats] = useState(null);
  const [cardLoading, setCardLoading] = useState(false);
  const [cardError, setCardError] = useState(""); // NEW

  // Fetch user teams on mount
  useEffect(() => {
    if (!currentUser || !currentUser.id) return;
    setTeamsLoading(true);
    axios
      .get(`${API_BASE_URL}/user-teams?user_id=${currentUser.id}`)
      .then(res => {
        const t = res.data.teams || [];
        setTeams(t);
        setSelectedTeam(t[0] || "");
      })
      .finally(() => setTeamsLoading(false));
  }, [currentUser]);

  // Fetch Top Performer when team changes
  useEffect(() => {
    if (!currentUser || !currentUser.id || !selectedTeam) {
      setTopPerformer(null);
      setTpError("User/team not found. Please log in and select a team.");
      setTpLoading(false);
      return;
    }
    fetchTopPerformer(currentUser.id, selectedType, selectedTeam);
    // eslint-disable-next-line
  }, [selectedType, currentUser, selectedTeam]);

  // Top Performer API call (now uses team)
  const fetchTopPerformer = async (userId, matchType, teamName) => {
    setTpLoading(true);
    setTpError("");
    setTopPerformer(null);
    try {
      const url = `${API_BASE_URL}/top-performer?user_id=${userId}&period=month&match_type=${matchType}&team_name=${encodeURIComponent(teamName)}`;
      const res = await axios.get(url);
      setTopPerformer(res.data.performer ?? null);
    } catch (err) {
      setTpError("Could not fetch top performer.");
      setTopPerformer(null);
    } finally {
      setTpLoading(false);
    }
  };

  // Fetch card stats dynamically from /team-match-stats
  useEffect(() => {
    if (!currentUser || !selectedTeam) return;
    setCardLoading(true);
    setCardStats(null);
    setCardError("");
    axios.get(`${API_BASE_URL}/team-match-stats`, {
      params: {
        user_id: currentUser.id,
        team_name: selectedTeam,
        match_type: selectedType
      }
    })
      .then(res => {
        setCardStats(res.data);
      })
      .catch(err => {
        setCardStats(null);
        setCardError("Could not load stats for the selected team/match type.");
      })
      .finally(() => setCardLoading(false));
  }, [currentUser, selectedTeam, selectedType]);

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
          <div className="team-selector" style={{ margin: "12px 0" }}>
            {teamsLoading ? (
              <span style={{ color: "#eee" }}>Loading teams...</span>
            ) : (
              <select
                value={selectedTeam}
                onChange={e => setSelectedTeam(e.target.value)}
                style={{ fontWeight: "bold", borderRadius: 5, padding: "4px 10px" }}
                aria-label="Select team"
              >
                {teams.map(team => (
                  <option key={team} value={team}>{team.charAt(0).toUpperCase() + team.slice(1)}</option>
                ))}
              </select>
            )}
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

      {/* Top Performer Section */}
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

      <WinLossTrendDashboard selectedMatchType={selectedType} teamName={selectedTeam} />

      <div>
        <div className="stats-cards-grid">
          {cardLoading ? (
            <div className="dashboard-loading">Loading cards...</div>
          ) : cardError ? (
            <div className="dashboard-error">{cardError}</div>
          ) : cardStats ? (
            <>
              <div className="stat-card" style={{ background: CARD_COLORS.played }}>
                <div className="stat-label">Matches Played</div>
                <div className="stat-value">{cardStats.matches_played}</div>
              </div>
              <div className="stat-card" style={{ background: CARD_COLORS.won }}>
                <div className="stat-label">Matches Won</div>
                <div className="stat-value">{cardStats.matches_won}</div>
              </div>
              <div className="stat-card" style={{ background: CARD_COLORS.lost }}>
                <div className="stat-label">Matches Lost</div>
                <div className="stat-value">{cardStats.matches_lost}</div>
              </div>
              <div className="stat-card" style={{ background: CARD_COLORS.draw }}>
                <div className="stat-label">Matches Draw</div>
                <div className="stat-value">{cardStats.matches_draw}</div>
              </div>
              <div className="stat-card" style={{ background: CARD_COLORS.runs }}>
                <div className="stat-label">Total Runs</div>
                <div className="stat-value">{cardStats.total_runs}</div>
              </div>
              <div className="stat-card" style={{ background: CARD_COLORS.wickets }}>
                <div className="stat-label">Total Wickets</div>
                <div className="stat-value">{cardStats.total_wickets}</div>
              </div>
            </>
          ) : (
            <div>No card stats found.</div>
          )}
        </div>
        <UserAchievements userId={currentUser.id} matchType={selectedType} />
        <RecentMatchesPanelV2 userId={currentUser?.id} limit={5} />
      </div>
    </div>
  );
}
