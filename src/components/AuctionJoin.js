// src/components/AuctionJoin.js
// Join auction session (simple version)

import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  fetchAuctionSessions,
  registerAsParticipant,
  getCurrentUserId,
} from "../services/auctionApi";

import "./AuctionJoin.css";

const AuctionJoin = () => {
  const { auctionId } = useParams();
  const navigate = useNavigate();

  const userId = getCurrentUserId();

  const [auction, setAuction] = useState(null);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);

  const [error, setError] = useState("");
  const [info, setInfo] = useState("");

  // ------------------------------------------
  // LOAD AUCTION INFO
  // ------------------------------------------
  const loadAuction = async () => {
    try {
      const all = await fetchAuctionSessions();
      const found = all.find((a) => a.auction_id === auctionId);
      setAuction(found || null);
      setError("");
    } catch (err) {
      console.error("Auction fetch error:", err);
      setError("Failed to load auction.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAuction();
  }, [auctionId]);

  // ------------------------------------------
  // JOIN AUCTION HANDLER
  // ------------------------------------------
  const handleJoin = async () => {
    try {
      setJoining(true);
      setError("");
      setInfo("");

      const res = await registerAsParticipant(auctionId, userId);
      setInfo(res.message || "Joined successfully!");

      // redirect to auction room
      setTimeout(() => {
        navigate(`/auction/${auctionId}`);
      }, 1000);
    } catch (err) {
      console.error("Join error:", err);
      setJoining(false);
      setError(
        err?.response?.data?.error || "Failed to join auction."
      );
    }
  };

  // ------------------------------------------
  // RENDER
  // ------------------------------------------
  return (
    <div className="auction-join-page">
      <h1>Join Auction</h1>

      {loading && (
        <div className="notice info">Loading auction details…</div>
      )}

      {error && <div className="notice error">{error}</div>}
      {info && <div className="notice success">{info}</div>}

      {!loading && !auction && (
        <div className="notice error">Auction not found.</div>
      )}

      {auction && (
        <div className="join-card">
          <h2>{auction.name}</h2>

          <div className="join-info-row">
            <span>Status:</span>
            <strong>{auction.status}</strong>
          </div>

          <div className="join-info-row">
            <span>Initial Wallet:</span>
            <strong>{auction.initial_wallet_amount} cr</strong>
          </div>

          <div className="join-info-row">
            <span>Bid Timer:</span>
            <strong>{auction.bid_timer_seconds} sec</strong>
          </div>

          <div className="join-btn-area">
            <button
              className="join-btn"
              disabled={joining}
              onClick={handleJoin}
            >
              {joining ? "Joining…" : "Join Auction"}
            </button>

            <button
              className="back-btn"
              onClick={() => navigate("/auction")}
            >
              ← Back
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AuctionJoin;
