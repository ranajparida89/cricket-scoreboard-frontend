// src/components/AuctionRoom.js
// Updated to fully match simpleAuctionRoutes backend

import React, { useEffect, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";

import {
  fetchLiveState,
  placeBid,
  nextPlayer,
  closeRound,
  endAuction,
  fetchParticipants,
  getCurrentUserId,
} from "../services/auctionApi";

import "./AuctionRoom.css";

const POLL_INTERVAL = 1500;

const AuctionRoom = () => {
  const { auctionId } = useParams();
  const navigate = useNavigate();

  const userId = getCurrentUserId();
  const isAdmin = localStorage.getItem("isAdmin") === "true";

  const [liveState, setLiveState] = useState(null);
  const [loading, setLoading] = useState(true);
  const [placingBid, setPlacingBid] = useState(false);

  const [participants, setParticipants] = useState([]);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");

  const pollRef = useRef(null);

  // ---------------------------------------------------------
  // LOAD LIVE STATE
  // ---------------------------------------------------------
  const loadLive = async () => {
    try {
      const data = await fetchLiveState(auctionId);
      setLiveState(data);
      setError("");
    } catch (err) {
      console.error("Error loading live auction:", err);
      setError("Failed to load live auction state.");
    } finally {
      setLoading(false);
    }
  };

  const loadParticipantsList = async () => {
    try {
      const res = await fetchParticipants(auctionId);
      setParticipants(res.participants || []);
    } catch (err) {
      console.error("Failed to fetch participants:", err);
    }
  };

  useEffect(() => {
    loadLive();
    loadParticipantsList();

    pollRef.current = setInterval(() => {
      loadLive();
      loadParticipantsList();
    }, POLL_INTERVAL);

    return () => clearInterval(pollRef.current);
  }, [auctionId]);

  const auction = liveState?.auction || null;
  const livePlayer = liveState?.livePlayer || null;
  const highestBid = liveState?.highestBid ?? null;
  const timeLeft = liveState?.timeLeft ?? null;

  // ---------------------------------------------------------
  // HANDLE BID — FIXED
  // ---------------------------------------------------------
  const handleBid = async () => {
    if (!livePlayer) return;

    const nextBid =
      highestBid != null
        ? (highestBid + livePlayer.bid_increment).toFixed(2)
        : Number(livePlayer.base_bid_amount).toFixed(2);

    try {
      setPlacingBid(true);

      await placeBid(
        auctionId,
        livePlayer.session_player_id, // FIXED
        Number(nextBid),
        userId
      );

      setInfo(`Bid placed: ${nextBid} cr`);
    } catch (err) {
      console.error("Bid error:", err);
      setError("Failed to place bid.");
    } finally {
      setPlacingBid(false);
    }
  };

  // ---------------------------------------------------------
  // ADMIN ACTIONS
  // ---------------------------------------------------------
  const handleAdminNextPlayer = async () => {
    try {
      const res = await nextPlayer(auctionId);
      setInfo(res.message || "Next player loaded.");
      loadLive();
    } catch (err) {
      setError("Failed to load next player.");
    }
  };

  const handleAdminCloseRound = async () => {
    try {
      const res = await closeRound(auctionId);
      setInfo(res.message || "Round closed.");
      loadLive();
    } catch (err) {
      setError("Failed to close round.");
    }
  };

  const handleAdminEndAuction = async () => {
    if (!window.confirm("End the auction now?")) return;
    try {
      const res = await endAuction(auctionId);
      setInfo(res.message || "Auction ended.");
      loadLive();
    } catch (err) {
      setError("Failed to end auction.");
    }
  };

  // ---------------------------------------------------------
  // RENDER UI
  // ---------------------------------------------------------
  return (
    <div className="auction-room-page">
      <div className="auction-room-header">
        <div>
          <h1>Auction Room</h1>
          {auction && (
            <p className="auction-room-subtitle">
              {auction.name} &nbsp;•&nbsp;
              <span className={`tag tag-${auction.status?.toLowerCase()}`}>
                {auction.status}
              </span>
            </p>
          )}
        </div>

        <div className="auction-room-header-actions">
          {isAdmin && (
            <button onClick={() => navigate(`/auction/${auctionId}/admin`)}>
              🛠 Admin Console
            </button>
          )}
          <button onClick={() => navigate(`/auction/${auctionId}/my-players`)}>
            👥 My Players
          </button>
          <button onClick={() => navigate("/auction")}>← Lobby</button>
        </div>
      </div>

      {error && <div className="auction-room-alert error">{error}</div>}
      {info && <div className="auction-room-alert info">{info}</div>}

      <div className="auction-room-layout">
        {/* LEFT PANEL */}
        <div className="auction-live-panel">
          {!livePlayer ? (
            <div className="auction-room-empty">
              Waiting for admin to load next player...
            </div>
          ) : (
            <div className="auction-live-card">
              <div className="auction-live-header">
                <h2>{livePlayer.player_name}</h2>
                <span className="live-tag">LIVE</span>
              </div>

              <div className="auction-live-info">
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
                  <strong>{highestBid ?? "-"}</strong>
                </div>
                <div className="row">
                  <span>Time Left</span>
                  <strong>{timeLeft ?? "-"}s</strong>
                </div>
              </div>

              {/* Bid Button */}
              <div className="auction-bid-panel">
                <button
                  className="bid-main-btn"
                  onClick={handleBid}
                  disabled={placingBid}
                >
                  {placingBid
                    ? "Placing..."
                    : highestBid != null
                    ? `Bid ${(highestBid + livePlayer.bid_increment).toFixed(2)} cr`
                    : `Bid ${livePlayer.base_bid_amount} cr`}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* RIGHT PANEL */}
        <div className="auction-side-panel">
          <div className="auction-user-card">
            <h3>Participants</h3>
            <ul className="participant-list">
              {participants.map((p) => (
                <li key={p.userId}>
                  {p.userId}
                  {p.userId === userId && " (You)"}
                </li>
              ))}
            </ul>
          </div>

          {isAdmin && (
            <div className="auction-admin-mini">
              <h3>Admin Controls</h3>
              <button onClick={handleAdminCloseRound}>❎ Close Round</button>
              <button onClick={handleAdminNextPlayer}>⏭ Next Player</button>
              <button onClick={handleAdminEndAuction}>⛔ End Auction</button>
            </div>
          )}
        </div>
      </div>

      {loading && (
        <div className="auction-room-alert info">Loading auction data…</div>
      )}
    </div>
  );
};

export default AuctionRoom;
