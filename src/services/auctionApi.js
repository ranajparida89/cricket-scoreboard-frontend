// src/services/auctionApi.js
// Thin client for CrickEdge Auction backend

import axios from "axios";

const API_BASE = "https://cricket-scoreboard-backend.onrender.com/api/auction";

const api = axios.create({
  baseURL: API_BASE,
  withCredentials: true,
});

// -----------------------------------------------------------------------------
// Attach auth token (same pattern as other modules)
// -----------------------------------------------------------------------------
api.interceptors.request.use((config) => {
  try {
    const token =
      localStorage.getItem("token") ||
      localStorage.getItem("authToken") ||
      localStorage.getItem("auth_token");

    if (token && !config.headers.Authorization) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  } catch (e) {
    // fail silently – we will just call without token
    console.warn("Auction API: unable to attach token", e);
  }
  return config;
});

// -----------------------------------------------------------------------------
// Helper – current user
// -----------------------------------------------------------------------------
export function getCurrentUserId() {
  // ✅ FIRST: read the standard "user" object that the rest of CrickEdge uses
  try {
    const raw = localStorage.getItem("user");
    if (raw) {
      const parsed = JSON.parse(raw);
      const id =
        parsed?.id ??
        parsed?.user_id ??
        parsed?.userId ??
        parsed?.uid ??
        null;

      if (id != null) {
        return id;
      }
    }
  } catch (e) {
    console.warn("Auction API: failed to parse user from localStorage", e);
  }

  // ✅ SECOND: fall back to legacy id keys if present
  const fromStorage =
    localStorage.getItem("userId") ||
    localStorage.getItem("authUserId") ||
    localStorage.getItem("user_id");

  if (fromStorage) return fromStorage;

  // ⚠️ LAST RESORT: synthetic temp id (mainly for local testing)
  let tempId = localStorage.getItem("tempAuctionUserId");
  if (!tempId) {
    tempId = `temp-user-${Math.random().toString(36).slice(2, 10)}`;
    localStorage.setItem("tempAuctionUserId", tempId);
  }
  return tempId;
}

// -----------------------------------------------------------------------------
// Sessions
// -----------------------------------------------------------------------------
export async function fetchAuctionSessions() {
  const res = await api.get("/sessions");
  return res.data;
}

export async function createAuctionSession(payload) {
  const res = await api.post("/sessions", payload);
  return res.data;
}

// -----------------------------------------------------------------------------
// Participants
// -----------------------------------------------------------------------------
export async function registerAsParticipant(auctionId, userId) {
  const res = await api.post(`/sessions/${auctionId}/participants`, {
    userId,
    roleInAuction: "PARTICIPANT",
  });
  return res.data;
}

export async function exitAuction(auctionId, userId) {
  const res = await api.post(`/sessions/${auctionId}/participants/end`, {
    userId,
  });
  return res.data;
}

// -----------------------------------------------------------------------------
// Live state & control
// -----------------------------------------------------------------------------
export async function fetchLiveState(auctionId, userId) {
  const params = userId ? { userId } : {};
  const res = await api.get(`/sessions/${auctionId}/live`, { params });
  return res.data;
}

export async function startAuction(auctionId) {
  const res = await api.post(`/sessions/${auctionId}/start`);
  return res.data;
}

export async function pauseAuction(auctionId) {
  const res = await api.post(`/sessions/${auctionId}/pause`);
  return res.data;
}

export async function resumeAuction(auctionId) {
  const res = await api.post(`/sessions/${auctionId}/resume`);
  return res.data;
}

export async function endAuction(auctionId) {
  const res = await api.post(`/sessions/${auctionId}/end`);
  return res.data;
}

export async function closeCurrentRound(auctionId) {
  const res = await api.post(`/sessions/${auctionId}/live/close`);
  return res.data;
}

export async function nextPlayer(auctionId) {
  const res = await api.post(`/sessions/${auctionId}/next-player`);
  return res.data;
}

// -----------------------------------------------------------------------------
// Bidding
// -----------------------------------------------------------------------------
export async function placeBid(auctionId, sessionPlayerId, bidAmount, userId) {
  const res = await api.post(`/sessions/${auctionId}/bids`, {
    userId,
    sessionPlayerId,
    bidAmount,
  });
  return res.data;
}

// -----------------------------------------------------------------------------
// Admin push rules
// -----------------------------------------------------------------------------
export async function createPushRule(auctionId, payload) {
  const res = await api.post(`/sessions/${auctionId}/push-rules`, payload);
  return res.data;
}

export async function fetchPushRules(auctionId) {
  const res = await api.get(`/sessions/${auctionId}/push-rules`);
  return res.data;
}

// -----------------------------------------------------------------------------
// My players & participants
// -----------------------------------------------------------------------------
export async function fetchMyPlayers(auctionId, userId) {
  const res = await api.get(`/sessions/${auctionId}/my-players`, {
    params: { userId },
  });
  return res.data;
}

export async function fetchParticipantsForAuction(auctionId) {
  const res = await api.get(`/sessions/${auctionId}/participants`);
  return res.data;
}

// -----------------------------------------------------------------------------
// Player pool import + listing (Phase 9)
// -----------------------------------------------------------------------------
/**
 * Import player pool.
 * Backend route: POST /api/auction/player-pool/import
 * Body: { players: [ { playerCode, playerName, country, skillType, category, bidAmount } ] }
 */
export async function importPlayerPool(players) {
  const res = await api.post("/player-pool/import", { players });
  return res.data;
}

/**
 * Helper to list current pool.
 * GET /api/auction/player-pool
 */
export async function listPlayerPool(params = {}) {
  const res = await api.get("/player-pool", { params });
  return res.data; // callers handle shape (array vs { players })
}

// -----------------------------------------------------------------------------
// Auction summary (Phase 10)
// -----------------------------------------------------------------------------
/**
 * Summary per auction:
 * GET /api/auction/sessions/:auctionId/summary
 */
export async function fetchAuctionSummary(auctionId) {
  const res = await api.get(`/sessions/${auctionId}/summary`);
  return res.data;
}
