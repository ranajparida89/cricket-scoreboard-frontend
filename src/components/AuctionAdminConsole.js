// src/components/AuctionAdminConsole.js
// Updated for simpleAuctionRoutes backend (FINAL)

import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import {
  fetchLiveState,
  startAuction,
  endAuction,
  nextPlayer,
  closeRound,
  fetchParticipants,
  getCurrentUserId,
} from "../services/auctionApi";

import "./AuctionAdminConsole.css";

const AuctionAdminConsole = () => {
  const { auctionId } = useParams();
  const navigate = useNavigate();

  const userId = getCurrentUserId();
  const isAdmin = localStorage.getItem("isAdmin") === "true";

  const [liveState, setLiveState] = useState(null);
  const [participants, setParticipants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  const [error, setError] = useState("");
  const [info, setInfo] = useState("");

  const auction = liveState?.auction || null;
  const livePlayer = liveState?.livePlayer || null;

  // ---------------------------------------------------------
  // LOAD DATA
  // ---------------------------------------------------------
  const loadAll = async () => {
    try {
      setLoading(true);

      const live = await fetchLiveState(auctionId);
      const p = await fetchParticipants(auctionId);

      setLiveState(live);
      setParticipants(p.participants || []);
      setError("");
    } catch (err) {
      console.error("Admin console load error:", err);
      setError("Failed to load admin console data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
  }, [auctionId]);

  // ---------------------------------------------------------
  // ADMIN ACTIONS
  // ---------------------------------------------------------
  const handleStart = async () => {
    try {
      setBusy(true);
      const res = await startAuction(auctionId);
      setInfo(res.message || "Auction started.");
      loadAll();
    } catch (err) {
      setError("Failed to start auction.");
    } finally {
      setBusy(false);
    }
  };

  const handleEnd = async () => {
    if (!window.confirm("End auction permanently?")) return;

    try {
      setBusy(true);
      const res = await endAuction(auctionId);
      setInfo(res.message || "Auction ended.");
      loadAll();
    } catch (err) {
      setError("Failed to end auction.");
    } finally {
      setBusy(false);
    }
  };

  const handleNextPlayer = async () => {
    try {
      setBusy(true);
      const res = await nextPlayer(auctionId);
      setInfo(res.message || "Next player is LIVE.");
      loadAll();
    } catch (err) {
      setError("Failed to load next player.");
    } finally {
      setBusy(false);
    }
  };

  const handleCloseRound = async () => {
    try {
      setBusy(true);
      const res = await closeRound(auctionId);
      setInfo(res.message || "Round closed.");
      loadAll();
    } catch (err) {
      setError("Failed to close round.");
    } finally {
      setBusy(false);
    }
  };

  // ---------------------------------------------------------
  // NOT ADMIN
  // ---------------------------------------------------------
  if (!isAdmin) {
    return (
      <div className="admin-console-page">
        <h1>Auction Admin Console</h1>
        <div className="admin-console-alert error">
          You are NOT an admin. Please login as admin.
        </div>
        <button onClick={() => navigate(`/auction/${auctionId}`)}>
          ← Back to Auction Room
        </button>
      </div>
    );
  }

  // ---------------------------------------------------------
  // MAIN UI
  // ---------------------------------------------------------
  return (
    <div className="admin-console-page">
      <div className="admin-console-header">
        <div>
          <h1>Auction Admin Console</h1>
          {auction && (
            <p className="admin-console-subtitle">
              Auction: <strong>{auction.name}</strong> &nbsp;•&nbsp;
              <span className={`tag tag-${auction.status?.toLowerCase()}`}>
                {auction.status}
              </span>
            </p>
          )}
        </div>

        <div className="admin-console-header-actions">
          <button onClick={() => navigate(`/auction/${auctionId}`)}>
            ← Back to Room
          </button>

          <button onClick={() => navigate(`/auction/${auctionId}/import-players`)}>
            📦 Import Player Pool
          </button>

          <button onClick={() => navigate(`/auction/${auctionId}/player-pool`)}>
            👀 View Player Pool
          </button>

          {auction?.status === "ENDED" && (
            <button onClick={() => navigate(`/auction/${auctionId}/summary`)}>
              📊 Summary
            </button>
          )}

          <button onClick={loadAll}>⟳ Refresh</button>
          <button onClick={() => navigate("/auction")}>Lobby</button>
        </div>
      </div>

      {error && <div className="admin-console-alert error">{error}</div>}
      {info && <div className="admin-console-alert info">{info}</div>}

      {/* ------------------------ CONTROLS ------------------------ */}
      <div className="admin-console-controls-card">
        <h3>Controls</h3>

        <div className="control-row">
          <button disabled={busy} onClick={handleStart}>
            ▶ Start Auction
          </button>

          <button disabled={busy} onClick={handleEnd}>
            ⛔ End Auction
          </button>
        </div>

        <div className="control-row">
          <button disabled={busy} onClick={handleCloseRound}>
            ❎ Close Current Round
          </button>

          <button disabled={busy} onClick={handleNextPlayer}>
            ⏭ Next Player
          </button>
        </div>
      </div>

      {/* ------------------------ LIVE PLAYER ------------------------ */}
      <div className="admin-console-live-card">
        <h3>Live Player</h3>
        {!livePlayer ? (
          <div className="admin-console-empty">No player LIVE currently.</div>
        ) : (
          <div className="live-info">
            <div className="row">
              <span>Name</span>
              <strong>{livePlayer.player_name}</strong>
            </div>
            <div className="row">
              <span>Country</span>
              <strong>{livePlayer.country}</strong>
            </div>
            <div className="row">
              <span>Skill</span>
              <strong>{livePlayer.skill_type}</strong>
            </div>
            <div className="row">
              <span>Category</span>
              <strong>{livePlayer.category}</strong>
            </div>
            <div className="row">
              <span>Base Price</span>
              <strong>{livePlayer.base_bid_amount} cr</strong>
            </div>
            <div className="row">
              <span>Highest Bid</span>
              <strong>{liveState?.highestBid ?? "-"}</strong>
            </div>
            <div className="row">
              <span>Time Left</span>
              <strong>{liveState?.timeLeft ?? "-"}s</strong>
            </div>
          </div>
        )}
      </div>

      {/* ------------------------ PARTICIPANTS ------------------------ */}
      <div className="admin-console-participants">
        <h3>Participants</h3>

        {participants.length === 0 ? (
          <div className="admin-console-empty">No participants yet.</div>
        ) : (
          <table className="participants-table">
            <thead>
              <tr>
                <th>#</th>
                <th>User ID</th>
              </tr>
            </thead>
            <tbody>
              {participants.map((p, idx) => (
                <tr key={p.userId}>
                  <td>{idx + 1}</td>
                  <td>{p.userId}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default AuctionAdminConsole;
