// ✅ src/services/api.js
// ✅ [Ranaj Parida - 2025-04-17 | 04:05 AM]
// FINAL: cleans up upcoming-matches functions, adds alias, keeps squads API

import axios from "axios";

// ✅ LIVE BACKEND BASE URL (Render)
export const API_URL = "https://cricket-scoreboard-backend.onrender.com/api";

/* ================== MATCH CREATION / RESULTS ================== */

export const createMatch = async (matchDetails) => {
  const response = await axios.post(`${API_URL}/match`, matchDetails);
  return response.data;
};

export const submitMatchResult = async (matchData) => {
  const response = await axios.post(`${API_URL}/submit-result`, matchData);
  return response.data;
};

export const submitTestMatchResult = async (matchData) => {
  const response = await axios.post(`${API_URL}/test-match`, matchData);
  return response.data;
};

/* ================== LEADERBOARD / CHARTS ================== */

export const getTeams = async () => {
  const response = await axios.get(`${API_URL}/teams`);
  return response.data;
};

export const getTeamChartData = async () => {
  const response = await axios.get(`${API_URL}/team-rankings`);
  return response.data;
};

// Back-compat alias
export const getTeamRankings = getTeamChartData;

/* ================== HISTORIES / TABLES ================== */

export const getMatchHistory = async (filters = {}) => {
  const queryParams = new URLSearchParams(filters).toString();
  const response = await axios.get(`${API_URL}/match-history?${queryParams}`);
  return response.data;
};

// ⚠️ Optional legacy helper (NOT “upcoming”)
// Keep only if something else uses it; otherwise remove.
/*
export const getAllMatchesForScenario = async () => {
  const response = await axios.get(`${API_URL}/match-history`);
  return response.data;
};
*/

export const getTestMatches = async () => {
  const response = await axios.get(`${API_URL}/test-matches`);
  return response.data;
};

export const getTestMatchHistory = async () => {
  const response = await axios.get(`${API_URL}/test-match-history`);
  return response.data;
};

export const getPointTable = async () => {
  const response = await axios.get(`${API_URL}/points`);
  return response.data;
};

export const getMatchTicker = async () => {
  const response = await axios.get(`${API_URL}/match-ticker`);
  return response.data;
};

export const getMatchesByTeam = async (teamName) => {
  const response = await axios.get(
    `${API_URL}/match-history?team=${encodeURIComponent(teamName)}`
  );
  return response.data;
};

export const getTestRankings = async () => {
  const response = await axios.get(`${API_URL}/rankings/test`);
  return response.data;
};

/* ================== UPCOMING MATCHES (NEW) ================== */

// POST /api/upcoming-match
export const addUpcomingMatch = async (matchData) => {
  const response = await axios.post(`${API_URL}/upcoming-match`, matchData);
  return response.data;
};

// Back-compat alias so old imports keep working
export const createUpcomingMatch = addUpcomingMatch;

// GET /api/upcoming-matches
export const getUpcomingMatchList = async () => {
  const response = await axios.get(`${API_URL}/upcoming-matches`);
  return response.data;
};

/* ================== PLAYER RANKINGS ================== */

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

/* ================== SQUAD & LINEUP ================== */

export const fetchPlayers = (team, format) =>
  axios
    .get(`${API_URL}/squads/players`, { params: { team, format } })
    .then((r) => r.data);

export const suggestPlayers = (team, q) =>
  axios
    .get(`${API_URL}/squads/suggest`, { params: { team, q } })
    .then((r) => r.data);

export const createPlayer = (payload) =>
  axios.post(`${API_URL}/squads/players`, payload).then((r) => r.data);

export const updatePlayer = (id, payload) =>
  axios.put(`${API_URL}/squads/players/${id}`, payload).then((r) => r.data);

export const deletePlayer = (id) =>
  axios.delete(`${API_URL}/squads/players/${id}`).then((r) => r.data);

export const getLineup = (team, format) =>
  axios
    .get(`${API_URL}/squads/lineup`, { params: { team, format } })
    .then((r) => r.data);

export const saveLineup = (payload) =>
  axios.post(`${API_URL}/squads/lineup`, payload).then((r) => r.data);

/* ================== USER DASHBOARD MOCK ================== */

export const getUserDashboardData = async (userId) => {
  const [favorites, posts, achievements, widgets, activity, profile, notifications, settings] =
    await Promise.all([
      fetch(`/api/dashboard/favorites?userId=${userId}`).then((res) => res.json()),
      fetch(`/api/dashboard/posts?userId=${userId}`).then((res) => res.json()),
      fetch(`/api/dashboard/achievements?userId=${userId}`).then((res) => res.json()),
      fetch(`/api/dashboard/widgets?userId=${userId}`).then((res) => res.json()),
      fetch(`/api/dashboard/activity?userId=${userId}`).then((res) => res.json()),
      fetch(`/api/dashboard/profile?userId=${userId}`).then((res) => res.json()),
      fetch(`/api/dashboard/notifications?userId=${userId}`).then((res) => res.json()),
      fetch(`/api/dashboard/settings?userId=${userId}`).then((res) => res.json()),
    ]);
  return { favorites, posts, achievements, widgets, activity, profile, notifications, settings };
};
