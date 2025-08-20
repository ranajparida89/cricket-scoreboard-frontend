// ✅ src/services/api.js
// ✅ [Ranaj Parida - 2025-04-17 | 04:05 AM]
// FINAL: cleans up upcoming-matches functions, adds alias, keeps squads API
// ✅ [2025-06-27] Ensure createPlayer sends user_id from localStorage if not provided
// ✅ [2025-08-19] [HDR-UID] auto-send X-User-Id header on critical calls
// ✅ [2025-08-19] [TEAMS]   add Squad Teams APIs (list/create custom teams)
// ✅ [2025-08-19] [DEL-ALL] delete player everywhere helper
// ✅ [2025-08-19] [DEL-FORCE] forward ?force=true for safe backend deletes

import axios from "axios";

// ✅ LIVE BACKEND BASE URL (Render)
export const API_URL = "https://cricket-scoreboard-backend.onrender.com/api";

/* --- tiny helper to read the logged-in user id from localStorage --- */
function getStoredUserId() {
  try {
    const raw = localStorage.getItem("user");
    if (!raw) return null;
    const u = JSON.parse(raw);
    return u?.id ?? null;
  } catch {
    return null;
  }
}

/* --- build auth header only when we have a user id (used where relevant) --- */
function uidHeader() {
  const uid = getStoredUserId();
  return uid ? { "X-User-Id": String(uid) } : {};
}

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

/* ================== TOURNAMENTS (NEW) ================== */

// Catalog list (optionally filter by format)
export const getTournamentsCatalog = (matchType) =>
  axios
    .get(`${API_URL}/tournaments`, {
      params: matchType ? { match_type: matchType } : undefined,
    })
    .then((r) => r.data);

// Leaderboard for a tournament season (works with match_type = "All" | "ODI" | "T20" | "Test")
export const getTournamentLeaderboard = ({
  tournament_name,
  season_year,
  match_type = "All",
}) =>
  axios
    .get(`${API_URL}/tournaments/leaderboard`, {
      params: { tournament_name, season_year, match_type },
    })
    .then((r) => r.data);

// Matches list for a tournament season
export const getTournamentMatches = ({
  tournament_name,
  season_year,
  match_type = "All",
}) =>
  axios
    .get(`${API_URL}/tournaments/matches`, {
      params: { tournament_name, season_year, match_type },
    })
    .then((r) => r.data);


/* ================== HISTORIES / TABLES ================== */

export const getMatchHistory = async (filters = {}) => {
  const queryParams = new URLSearchParams(filters).toString();
  const response = await axios.get(`${API_URL}/match-history?${queryParams}`);
  return response.data;
};

/*
// ⚠️ Optional legacy helper (NOT “upcoming”)
// Keep only if something else uses it; otherwise remove.
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

export const addUpcomingMatch = async (matchData) => {
  const response = await axios.post(`${API_URL}/upcoming-match`, matchData);
  return response.data;
};

// Back-compat alias so old imports keep working
export const createUpcomingMatch = addUpcomingMatch;

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

/* ================== SQUAD TEAMS (NEW) ================== */
// [TEAMS] backend in routes/squadRoutes.js
export const getSquadTeams = () =>
  axios.get(`${API_URL}/squads/teams`).then((r) => r.data);

export const createSquadTeam = (name) =>
  axios
    .post(
      `${API_URL}/squads/teams`,
      { name },
      { headers: { ...uidHeader() } }
    )
    .then((r) => r.data);

/* ================== SQUAD & LINEUP ================== */

export const fetchPlayers = (team, format) =>
  axios
    .get(`${API_URL}/squads/players`, { params: { team, format } })
    .then((r) => r.data);

export const suggestPlayers = (team, q) =>
  axios
    .get(`${API_URL}/squads/suggest`, { params: { team, q } })
    .then((r) => r.data);

/**
 * Ensure we always include user_id when creating a player via Squad/Lineup.
 * - If caller already put user_id in payload, we keep it.
 * - Otherwise we read it from localStorage ("user") — same source used by useAuth.
 * - Also send X-User-Id header for backend backfill logic.  [HDR-UID]
 */
export const createPlayer = (payload) => {
  const ensured = { ...payload };
  if (ensured.user_id == null) {
    const uid = getStoredUserId();
    if (uid) ensured.user_id = uid;
  }
  return axios
    .post(`${API_URL}/squads/players`, ensured, { headers: { ...uidHeader() } })
    .then((r) => r.data);
};

export const updatePlayer = (id, payload) =>
  axios
    .put(`${API_URL}/squads/players/${id}`, payload, { headers: { ...uidHeader() } })
    .then((r) => r.data);

/**
 * Delete a player membership.
 * Options:
 *  - { all: true }    → delete same-named player across ALL formats for the same team
 *  - { force: true }  → allow backend to clean dependent rows (lineups/C-VC/performance) before delete
 * Both can be combined.
 */
export const deletePlayer = (id, opts = {}) => {
  // ✅ [DEL-FORCE] now forwards "force" in addition to "all"
  const params = {};
  if (opts.all)   params.all = true;
  if (opts.force) params.force = true;
  return axios
    .delete(`${API_URL}/squads/players/${id}`, { params, headers: { ...uidHeader() } })
    .then((r) => r.data);
};

// Convenience alias for readability
export const deletePlayerEverywhere = (id) => deletePlayer(id, { all: true });

export const getLineup = (team, format) =>
  axios
    .get(`${API_URL}/squads/lineup`, { params: { team, format } })
    .then((r) => r.data);

export const saveLineup = (payload) =>
  axios
    .post(`${API_URL}/squads/lineup`, payload, { headers: { ...uidHeader() } })
    .then((r) => r.data);

/* ================== USER DASHBOARD MOCK ================== */

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
    fetch(`/api/dashboard/achievements?userId=${userId}`).then((res) => res.json()),
    fetch(`/api/dashboard/widgets?userId=${userId}`).then((res) => res.json()),
    fetch(`/api/dashboard/activity?userId=${userId}`).then((res) => res.json()),
    fetch(`/api/dashboard/profile?userId=${userId}`).then((res) => res.json()),
    fetch(`/api/dashboard/notifications?userId=${userId}`).then((res) => res.json()),
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
