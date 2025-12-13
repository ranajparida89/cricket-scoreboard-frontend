// src/services/auctionApi.js
// ✅ FINAL & CORRECT version for simpleAuctionRoutes

import axios from "axios";

// 🔥 MUST MATCH server.js
// app.use("/api/auction", simpleAuctionRoutes);
const API_BASE =
  "https://cricket-scoreboard-backend.onrender.com/api/auction";

const api = axios.create({
  baseURL: API_BASE,
  withCredentials: true,
});

// -------------------------------------------------------------
// ATTACH AUTH TOKEN (CrickEdge standard)
// -------------------------------------------------------------
api.interceptors.request.use((config) => {
  try {
    const token =
      localStorage.getItem("token") ||
      localStorage.getItem("authToken") ||
      localStorage.getItem("auth_token");

    if (token && !config.headers.Authorization) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  } catch (err) {
    console.warn("Auction API: token attach failed", err);
  }
  return config;
});

// -------------------------------------------------------------
// CURRENT USER
// -------------------------------------------------------------
export function getCurrentUserId() {
  try {
    const raw = localStorage.getItem("user");
    if (raw) {
      const u = JSON.parse(raw);
      return (
        u?.id ??
        u?.user_id ??
        u?.userId ??
        u?.uid ??
        null
      );
    }
  } catch {}

  let fallback =
    localStorage.getItem("userId") ||
    localStorage.getItem("authUserId") ||
    localStorage.getItem("user_id");

  if (fallback) return fallback;

  // temp guest fallback
  let temp = localStorage.getItem("tempAuctionUserId");
  if (!temp) {
    temp = "temp-" + Math.random().toString(36).slice(2, 10);
    localStorage.setItem("tempAuctionUserId", temp);
  }
  return temp;
}

// -------------------------------------------------------------
// AUCTION SESSIONS
// -------------------------------------------------------------
export async function fetchAuctionSessions() {
  const res = await api.get("/sessions");
  return res.data; // { sessions: [...] }
}

export async function createAuctionSession(payload) {
  const res = await api.post("/sessions", payload);
  return res.data;
}

// -------------------------------------------------------------
// PARTICIPANTS
// -------------------------------------------------------------
export async function registerAsParticipant(auctionId, userId) {
  const res = await api.post(`/sessions/${auctionId}/join`, { userId });
  return res.data;
}

export async function exitAuction(auctionId, userId) {
  const res = await api.post(`/sessions/${auctionId}/leave`, { userId });
  return res.data;
}

export async function fetchParticipants(auctionId) {
  const res = await api.get(`/sessions/${auctionId}/participants`);
  return res.data; // { participants: [...] }
}

// -------------------------------------------------------------
// LIVE AUCTION STATE
// -------------------------------------------------------------
export async function fetchLiveState(auctionId) {
  const res = await api.get(`/sessions/${auctionId}/live`);
  return res.data;
}

// -------------------------------------------------------------
// ADMIN CONTROLS
// -------------------------------------------------------------
export async function startAuction(auctionId) {
  const res = await api.post(`/sessions/${auctionId}/start`);
  return res.data;
}

export async function closeRound(auctionId) {
  const res = await api.post(`/sessions/${auctionId}/close-round`);
  return res.data;
}

export async function nextPlayer(auctionId) {
  const res = await api.post(`/sessions/${auctionId}/next-player`);
  return res.data;
}

export async function endAuction(auctionId) {
  const res = await api.post(`/sessions/${auctionId}/end`);
  return res.data;
}

// -------------------------------------------------------------
// BIDDING
// -------------------------------------------------------------
export async function placeBid(
  auctionId,
  sessionPlayerId,
  amount,
  userId
) {
  const res = await api.post(`/sessions/${auctionId}/bid`, {
    userId,
    sessionPlayerId,
    amount,
  });
  return res.data;
}

// -------------------------------------------------------------
// PLAYER POOL
// -------------------------------------------------------------
export async function importPlayerPool(players) {
  const res = await api.post("/players/import", { players });
  return res.data;
}

export async function listPlayerPool() {
  const res = await api.get("/players");
  return res.data;
}

// -------------------------------------------------------------
// SUMMARY
// -------------------------------------------------------------
export async function fetchAuctionSummary(auctionId) {
  const res = await api.get(`/sessions/${auctionId}/summary`);
  return res.data;
}
