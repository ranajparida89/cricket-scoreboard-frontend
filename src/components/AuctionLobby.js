// src/components/AuctionLobby.js

import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  fetchAuctionSessions,
  registerAsParticipant,
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
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");

  const navigate = useNavigate();
  const userId = getCurrentUserId();

  const loadSessions = async () => {
    try {
      setLoading(true);
      setError("");
      const data = await fetchAuctionSessions();
      setSessions(data || []);
    } catch (err) {
      console.error("Error loading auction sessions:", err);
      setError("Unable to load auction sessions. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSessions();
  }, []);

  const handleJoin = async (auctionId) => {
    try {
      setBusyId(auctionId);
      setError("");
      setInfo("");
      await registerAsParticipant(auctionId, userId);
      setInfo("You are registered for this auction.");
    } catch (err) {
      console.error("Error joining auction:", err);
      const msg =
        err?.response?.data?.error ||
        err?.message ||
        "Failed to join auction.";
      setError(msg);
    } finally {
      setBusyId(null);
    }
  };

  const handleEnterRoom = (auctionId) => {
    navigate(`/auction/${auctionId}`);
  };

  return (
    <div className="auction-lobby-page">
      <div className="auction-lobby-header">
        <h1>CrickEdge Auction Lobby</h1>
        <p className="auction-lobby-subtitle">
          Join an ongoing auction or wait for admin to start a new one.
        </p>
        <button className="auction-lobby-refresh" onClick={loadSessions}>
          Refresh
        </button>
      </div>

      {error && <div className="auction-lobby-alert error">{error}</div>}
      {info && <div className="auction-lobby-alert info">{info}</div>}

      {loading ? (
        <div className="auction-lobby-loading">Loading sessions...</div>
      ) : sessions.length === 0 ? (
        <div className="auction-lobby-empty">
          No auction sessions found. Please ask admin to create one.
        </div>
      ) : (
        <div className="auction-lobby-grid">
          {sessions.map((s) => (
            <div key={s.auctionId} className="auction-card">
              <div className="auction-card-header">
                <h2>{s.name}</h2>
                <span
                  className="auction-status-pill"
                  style={{ backgroundColor: statusColors[s.status] || "#64748b" }}
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
                <div className="auction-meta-row">
                  <span>Players in pool:</span>
                  <strong>{s.totalPlayers}</strong>
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
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AuctionLobby;
