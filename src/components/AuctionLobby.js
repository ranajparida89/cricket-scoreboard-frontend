// src/components/AuctionLobby.js
// FINAL version compatible with simpleAuctionRoutes backend

import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  fetchAuctionSessions,
  registerAsParticipant,
  createAuctionSession,
  getCurrentUserId,
} from "../services/auctionApi";

import "./AuctionLobby.css";

const statusColors = {
  NOT_STARTED: "#facc15",
  RUNNING: "#22c55e",
  PAUSED: "#f97316",
  ENDED: "#ef4444",
};

const AuctionLobby = () => {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");

  const navigate = useNavigate();
  const userId = getCurrentUserId();

  const isAdmin =
    localStorage.getItem("isAdmin") === "true" ||
    localStorage.getItem("role") === "admin";

  // -------------------------------------------------------------
  // LOAD ALL AUCTION SESSIONS
  // -------------------------------------------------------------
  const loadSessions = async () => {
    try {
      setLoading(true);
      setError("");

      const raw = await fetchAuctionSessions();

      // Convert snake_case → camelCase mapping
      const mapped = raw.sessions
        ? raw.sessions.map((s) => ({
            auctionId: s.auction_id,
            name: s.name,
            status: s.status,
            maxSquadSize: s.max_squad_size,
            initialWalletAmount: s.initial_wallet_amount,
            bidTimerSeconds: s.bid_timer_seconds,
            minIncrement: s.min_bid_increment,
            totalPlayers: s.total_players ?? 0,
          }))
        : [];

      setSessions(mapped);
    } catch (err) {
      console.error("Error loading sessions:", err);
      setError("Unable to load auction sessions.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSessions();
  }, []);

  // -------------------------------------------------------------
  // JOIN AUCTION
  // -------------------------------------------------------------
  const handleJoin = async (auctionId) => {
    try {
      setBusyId(auctionId);
      setError("");
      setInfo("");

      await registerAsParticipant(auctionId, userId);
      setInfo("You have joined this auction.");
    } catch (err) {
      console.error("Join error:", err);
      setError(err?.response?.data?.error || "Failed to join auction.");
    } finally {
      setBusyId(null);
    }
  };

  // -------------------------------------------------------------
  // ENTER ROOM / MY PLAYERS / ADMIN
  // -------------------------------------------------------------
  const handleEnterRoom = (id) => navigate(`/auction/${id}`);
  const handleMyPlayers = (id) => navigate(`/auction/${id}/my-players`);
  const handleAdminConsole = (id) => navigate(`/auction/${id}/admin`);
  const handleSummary = (id) => navigate(`/auction/${id}/summary`);

  // -------------------------------------------------------------
  // CREATE NEW AUCTION SESSION (ADMIN ONLY)
  // -------------------------------------------------------------
  const handleCreateSession = async () => {
    const name = window.prompt("Enter auction name:");
    if (!name || !name.trim()) return;

    try {
      setCreating(true);
      setError("");
      setInfo("");

      // backend expects only basic fields
      const payload = {
        name: name.trim(),
        maxSquadSize: 13,
        initialWalletAmount: 120,
        bidTimerSeconds: 30,
        minBidIncrement: 0.5,
      };

      const res = await createAuctionSession(payload);

      setInfo(`Auction "${payload.name}" created successfully.`);
      loadSessions();
    } catch (err) {
      console.error("Create session error:", err);
      setError(err?.response?.data?.error || "Failed to create auction.");
    } finally {
      setCreating(false);
    }
  };

  // -------------------------------------------------------------
  // UI
  // -------------------------------------------------------------
  return (
    <div className="auction-lobby-page">
      <div className="auction-lobby-header">
        <div>
          <h1>CrickEdge Auction Lobby</h1>
          <p className="auction-lobby-subtitle">
            Join an ongoing auction, or create a new one (admin only).
          </p>
        </div>

        <div className="auction-lobby-header-actions">
          <button className="auction-lobby-refresh" onClick={loadSessions}>
            ⟳ Refresh
          </button>

          {isAdmin && (
            <button
              className="auction-lobby-create"
              onClick={handleCreateSession}
              disabled={creating}
            >
              {creating ? "Creating..." : "➕ Create Auction Session"}
            </button>
          )}
        </div>
      </div>

      {error && <div className="auction-lobby-alert error">{error}</div>}
      {info && <div className="auction-lobby-alert info">{info}</div>}

      {/* ------------------- MAIN LIST ------------------- */}
      {loading ? (
        <div className="auction-lobby-loading">Loading sessions...</div>
      ) : sessions.length === 0 ? (
        <div className="auction-lobby-empty">
          {isAdmin
            ? "No auction sessions created yet. Use 'Create Auction Session'."
            : "No auctions available. Contact your admin."}
        </div>
      ) : (
        <div className="auction-lobby-grid">
          {sessions.map((s) => (
            <div key={s.auctionId} className="auction-card">
              <div className="auction-card-header">
                <h2>{s.name}</h2>
                <span
                  className="auction-status-pill"
                  style={{
                    backgroundColor: statusColors[s.status] || "#64748b",
                  }}
                >
                  {s.status}
                </span>
              </div>

              <div className="auction-card-body">
                <div className="auction-meta-row">
                  <span>Max Squad:</span>
                  <strong>{s.maxSquadSize}</strong>
                </div>
                <div className="auction-meta-row">
                  <span>Start Wallet:</span>
                  <strong>{s.initialWalletAmount} cr</strong>
                </div>
                <div className="auction-meta-row">
                  <span>Bid Timer:</span>
                  <strong>{s.bidTimerSeconds} sec</strong>
                </div>
              </div>

              <div className="auction-card-footer">
                <button
                  className="auction-btn secondary"
                  disabled={busyId === s.auctionId}
                  onClick={() => handleJoin(s.auctionId)}
                >
                  {busyId === s.auctionId ? "Joining..." : "Join / Re-join"}
                </button>

                <button
                  className="auction-btn primary"
                  onClick={() => handleEnterRoom(s.auctionId)}
                >
                  Enter Room
                </button>

                <button
                  className="auction-btn ghost"
                  onClick={() => handleMyPlayers(s.auctionId)}
                >
                  My Players
                </button>

                {isAdmin && (
                  <>
                    <button
                      className="auction-btn ghost"
                      onClick={() => handleAdminConsole(s.auctionId)}
                    >
                      Admin Console
                    </button>

                    {s.status === "ENDED" && (
                      <button
                        className="auction-btn ghost"
                        onClick={() => handleSummary(s.auctionId)}
                      >
                        Summary
                      </button>
                    )}
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AuctionLobby;
