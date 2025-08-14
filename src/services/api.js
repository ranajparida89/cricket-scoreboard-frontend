// ✅ src/services/api.js
// ✅ [Ranaj Parida - 2025-04-17 | 04:05 AM]
// ✅ FINAL VERSION: Separated APIs for leaderboard vs. charting (match_type)
// ✅ Both getTeamChartData() and getTeamRankings() supported for clarity

import axios from "axios";

// ✅ LIVE BACKEND BASE URL (Render)
export const API_URL = "https://cricket-scoreboard-backend.onrender.com/api";

// ✅ Match Creation (for all types)
export const createMatch = async (matchDetails) => {
  const response = await axios.post(`${API_URL}/match`, matchDetails);
  return response.data;
};

// ✅ Match Result Submission (T20/ODI)
export const submitMatchResult = async (matchData) => {
  const response = await axios.post(`${API_URL}/submit-result`, matchData);
  return response.data;
};

// ✅ Test Match Result Submission
export const submitTestMatchResult = async (matchData) => {
  const response = await axios.post(`${API_URL}/test-match`, matchData);
  return response.data;
};

// ✅ [LEADERBOARD] Get teams with points, wins/losses, and NRR (aggregated)
// 🔁 Used in Leaderboard.js
export const getTeams = async () => {
  const response = await axios.get(`${API_URL}/teams`);
  return response.data;
};

// ✅ [CHARTS] Get rankings by match_type with NRR (ODI/T20/Test)
// 🔁 Used in TeamCharts.js (filtering charts by format)
export const getTeamChartData = async () => {
  const response = await axios.get(`${API_URL}/team-rankings`);
  return response.data;
};

// ✅ [OPTIONAL BACKWARD COMPATIBILITY]
export const getTeamRankings = getTeamChartData;

// ✅ Match History (ODI/T20) with filter support
export const getMatchHistory = async (filters = {}) => {
  const queryParams = new URLSearchParams(filters).toString();
  const response = await axios.get(`${API_URL}/match-history?${queryParams}`);
  return response.data;
};

// ✅ [UPDATED] Fetch All Matches for Qualification Scenario (Ignore future match filtering temporarily)
export const getUpcomingMatches = async () => {
  const response = await axios.get(`${API_URL}/match-history`);
  const matches = response.data;
  return matches; // return all for now
};

// ✅ Test Matches (raw fetch - optional use)
export const getTestMatches = async () => {
  const response = await axios.get(`${API_URL}/test-matches`);
  return response.data;
};

// ✅ Test Match History (used in TestMatchHistory.js)
export const getTestMatchHistory = async () => {
  const response = await axios.get(`${API_URL}/test-match-history`);
  return response.data;
};

// ✅ Point Table (used in PointsTable.js or summary dashboard)
export const getPointTable = async () => {
  const response = await axios.get(`${API_URL}/points`);
  return response.data;
};

// ✅ Match Ticker Headlines (Auto-scroll summary messages)
export const getMatchTicker = async () => {
  const response = await axios.get(`${API_URL}/match-ticker`);
  return response.data;
};

// ✅ [NEW] Team-wise Match History by Team Name (used in TeamDetails.js)
export const getMatchesByTeam = async (teamName) => {
  const response = await axios.get(
    `${API_URL}/match-history?team=${encodeURIComponent(teamName)}`
  );
  return response.data;
};

// ✅ Test Match Rankings (for TestRanking.js)
export const getTestRankings = async () => {
  const response = await axios.get(`${API_URL}/rankings/test`);
  return response.data;
};

// ✅ Add Upcoming Match (used in AddUpcomingMatch.js)
export const addUpcomingMatch = async (matchData) => {
  const response = await axios.post(`${API_URL}/upcoming-match`, matchData);
  return response.data;
};

// ✅ [Upcoming Matches] Get list of all upcoming matches
export const getUpcomingMatchList = async () => {
  const response = await axios.get(`${API_URL}/upcoming-matches`);
  return response.data;
};

// ✅ [NEW] Player Rankings by type & match format
export const getPlayerRankings = async (type, matchType) => {
  const response = await axios.get(
    `${API_URL}/rankings/players?type=${type}&match_type=${matchType}`
  );
  return response.data;
};

export const getTestMatchLeaderboard = async () => {
  const res = await fetch(
    "https://cricket-scoreboard-backend.onrender.com/api/leaderboard/test"
  );
  return res.json();
};

/* ============================================
   SQUAD & LINEUP (Team-wise + Format-wise)
   Base: ${API_URL}/squads/*
   ============================================ */

// Remove undefined/null/empty-string keys (prevents 400s on strict validators)
const clean = (obj = {}) =>
  Object.fromEntries(
    Object.entries(obj).filter(
      ([, v]) => v !== undefined && v !== null && v !== ""
    )
  );

// Get squad (players) for a team+format
export const fetchPlayers = (team, format) =>
  axios
    .get(`${API_URL}/squads/players`, {
      params: { team_name: team, lineup_type: format },
    })
    .then((r) => r.data);

// Typeahead suggestions (shows “already in squad” in UI)
export const suggestPlayers = (team, q) =>
  axios
    .get(`${API_URL}/squads/suggest`, {
      params: { team_name: team, q },
    })
    .then((r) => r.data);

/**
 * Create OR link a player into a squad.
 *
 * NEW player:
 *   {
 *     player_name, team_name, lineup_type,
 *     skill_type, batting_style, bowling_type
 *   }
 *
 * LINK existing player to another format:
 *   {
 *     existing_player_id, team_name, lineup_type
 *   }
 */
export const createPlayer = (payload) =>
  axios
    .post(`${API_URL}/squads/players`, clean(payload), {
      headers: { "Content-Type": "application/json" },
    })
    .then((r) => r.data);

// Convenience wrapper to link by id
export const linkExistingPlayer = (team, format, existingPlayerId) =>
  createPlayer({
    team_name: team,
    lineup_type: format,
    existing_player_id: existingPlayerId,
  });

// Update a player
export const updatePlayer = (id, payload) =>
  axios
    .put(`${API_URL}/squads/players/${id}`, clean(payload), {
      headers: { "Content-Type": "application/json" },
    })
    .then((r) => r.data);

// Delete a player
export const deletePlayer = (id) =>
  axios.delete(`${API_URL}/squads/players/${id}`).then((r) => r.data);

// Get latest saved lineup for team+format
export const getLineup = (team, format) =>
  axios
    .get(`${API_URL}/squads/lineup`, {
      params: { team_name: team, lineup_type: format },
    })
    .then((r) => r.data);

// Save lineup (expects { team_name, lineup_type, captain_player_id, vice_captain_player_id, players:[{player_id,order_no,is_twelfth}] })
export const saveLineup = (payload) =>
  axios
    .post(`${API_URL}/squads/lineup`, clean(payload), {
      headers: { "Content-Type": "application/json" },
    })
    .then((r) => r.data);

// (Unrelated dashboard mock API kept as-is)
export const getUserDashboardData = async (userId) => {
  const [
    favorites,
    posts,
    achievements,
    widgets,
    activity,
    profile,
    notifications,
    settings,
  ] = await Promise.all([
    fetch(`/api/dashboard/favorites?userId=${userId}`).then((res) => res.json()),
    fetch(`/api/dashboard/posts?userId=${userId}`).then((res) => res.json()),
    fetch(`/api/dashboard/achievements?userId=${userId}`).then((res) =>
      res.json()
    ),
    fetch(`/api/dashboard/widgets?userId=${userId}`).then((res) => res.json()),
    fetch(`/api/dashboard/activity?userId=${userId}`).then((res) => res.json()),
    fetch(`/api/dashboard/profile?userId=${userId}`).then((res) => res.json()),
    fetch(`/api/dashboard/notifications?userId=${userId}`).then((res) =>
      res.json()
    ),
    fetch(`/api/dashboard/settings?userId=${userId}`).then((res) => res.json()),
  ]);
  return {
    favorites,
    posts,
    achievements,
    widgets,
    activity,
    profile,
    notifications,
    settings,
  };
};
