import axios from "axios";

// ✅ LIVE BACKEND BASE URL (Render)
const API_URL = "https://cricket-scoreboard-backend.onrender.com/api";

// ✅ Create a new match (common to all formats)
export const createMatch = async (matchDetails) => {
  const response = await axios.post(`${API_URL}/match`, matchDetails);
  return response.data;
};

// ✅ Submit T20/ODI match result
export const submitMatchResult = async (matchData) => {
  const response = await axios.post(`${API_URL}/submit-result`, matchData);
  return response.data;
};

// ✅ Submit Test match result (NEW)
export const submitTestMatchResult = async (matchData) => {
  const response = await axios.post(`${API_URL}/test-match`, matchData);
  return response.data;
};

// ✅ Get leaderboard teams
export const getTeams = async () => {
  const response = await axios.get(`${API_URL}/teams`);
  return response.data;
};

// ✅ Get match history (with optional search filters)
export const getMatchHistory = async (filters = {}) => {
  const queryParams = new URLSearchParams(filters).toString();
  const response = await axios.get(`${API_URL}/match-history?${queryParams}`);
  return response.data;
};
