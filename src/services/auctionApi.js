// src/services/auctionApi.js
// Thin axios wrapper for all Auction APIs

import axios from "axios";

const API_BASE = "https://cricket-scoreboard-backend.onrender.com/api/auction";

const api = axios.create({
  baseURL: API_BASE,
  withCredentials: true,
});

// Try to derive current user id from localStorage
export const getCurrentUserId = () => {
  const raw =
    localStorage.getItem("crickedge_user_id") ||
    localStorage.getItem("userId") ||
    localStorage.getItem("authUserId") ||
    localStorage.getItem("currentUserId");

  if (!raw || raw === "undefined" || raw === "null") return null;
  return raw;
};

// ---------------- Sessions / Lobby ----------------

export const fetchAuctionSessions = async () => {
  const res = await api.get("/sessions");
  return res.data;
};

// 🔹 MISSING EARLIER – now added
export const createAuctionSession = async (payload) => {
  // payload: { name, maxSquadSize, minExitSquadSize, initialWalletAmount, bidTimerSeconds, ... }
  const res = await api.post("/sessions", payload);
  return res.data;
};

export const registerAsParticipant = async (auctionId, userId) => {
  if (!userId) {
    throw new Error("No userId found in localStorage for auction.");
  }

  const res = await api.post(`/sessions/${auctionId}/participants`, {
    userId,
  });

  return res.data;
};

// ---------------- Live state ----------------

export const fetchLiveState = async (auctionId, userId) => {
  const res = await api.get(`/sessions/${auctionId}/live`, {
    params: userId ? { userId } : {},
  });
  return res.data;
};

// ---------------- Controls (Admin) ----------------

export const startAuction = async (auctionId) => {
  const res = await api.post(`/sessions/${auctionId}/start`);
  return res.data;
};

export const pauseAuction = async (auctionId) => {
  const res = await api.post(`/sessions/${auctionId}/pause`);
  return res.data;
};

export const resumeAuction = async (auctionId) => {
  const res = await api.post(`/sessions/${auctionId}/resume`);
  return res.data;
};

export const endAuction = async (auctionId) => {
  const res = await api.post(`/sessions/${auctionId}/end`);
  return res.data;
};

export const closeCurrentRound = async (auctionId) => {
  const res = await api.post(`/sessions/${auctionId}/live/close`);
  return res.data;
};

export const nextPlayer = async (auctionId) => {
  const res = await api.post(`/sessions/${auctionId}/next-player`);
  return res.data;
};

// ---------------- Push rules ----------------

export const fetchPushRules = async (auctionId) => {
  const res = await api.get(`/sessions/${auctionId}/push-rules`);
  return res.data;
};

export const createPushRule = async (auctionId, payload) => {
  const res = await api.post(`/sessions/${auctionId}/push-rules`, payload);
  return res.data;
};

export const updatePushRule = async (ruleId, payload) => {
  const res = await api.patch(`/push-rules/${ruleId}`, payload);
  return res.data;
};

export const deletePushRule = async (ruleId) => {
  const res = await api.delete(`/push-rules/${ruleId}`);
  return res.data;
};

// ---------------- Participants & squads ----------------

export const fetchParticipantsForAuction = async (auctionId) => {
  const res = await api.get(`/sessions/${auctionId}/participants`);
  return res.data;
};

export const fetchMyAuctionPlayers = async (auctionId, userId) => {
  const res = await api.get(`/sessions/${auctionId}/my-players`, {
    params: { userId },
  });
  return res.data;
};

// ---------------- Bids (participant) ----------------

export const placeBid = async (auctionId, payload) => {
  // payload: { userId, sessionPlayerId, bidAmount }
  const res = await api.post(`/sessions/${auctionId}/bids`, payload);
  return res.data;
};
