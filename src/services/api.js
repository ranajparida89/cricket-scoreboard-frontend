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
// 🔁 If older component is still using this, keep both names
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

  // 🔁 For now, return all matches (skip filtering by match_time)
  return matches;
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
  const response = await axios.get(`${API_URL}/match-history?team=${encodeURIComponent(teamName)}`);
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
