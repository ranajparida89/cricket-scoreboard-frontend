// src/components/AuctionMyPlayers.js
// Updated for NEW simplified auction system (simpleAuctionRoutes)

import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { fetchAuctionSummary, getCurrentUserId } from "../services/auctionApi";
import "./AuctionMyPlayers.css";

const AuctionMyPlayers = () => {
  const { auctionId } = useParams();
  const navigate = useNavigate();
  const userId = getCurrentUserId();

  const [players, setPlayers] = useState([]);
  const [auction, setAuction] = useState(null);
  const [wallet, setWallet] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadData = async () => {
    try {
      setLoading(true);
      setError("");

      const summary = await fetchAuctionSummary(auctionId);

      // Auction details
      setAuction(summary?.auction || null);

      // Wallet filtering for this user
      const myWallet = summary?.wallets?.find((w) => w.user_id === userId) || null;
      setWallet(myWallet);

      // Player filtering for this user
      const myPlayers =
        summary?.squads?.filter((p) => p.user_id === userId) || [];

      setPlayers(myPlayers);
    } catch (err) {
      console.error("Error loading my players:", err);
      const msg =
        err?.response?.data?.error ||
        err?.message ||
        "Failed to load your players.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [auctionId, userId]);

  const squadSize = players.length;
  const maxSquad = auction?.max_squad_size ?? 13;

  return (
    <div className="my-players-page">
      {/* HEADER */}
      <div className="my-players-header">
        <div>
          <h1>My Players</h1>
          {auction && (
            <p className="my-players-subtitle">
              Auction: <strong>{auction.name}</strong> &nbsp;•&nbsp; Squad:{" "}
              <strong>
                {squadSize} / {maxSquad}
              </strong>
            </p>
          )}
        </div>

        <div className="my-players-header-actions">
          <button
            className="btn-outline"
            onClick={() => navigate(`/auction/${auctionId}`)}
          >
            ← Back to Auction Room
          </button>

          <button className="btn-outline" onClick={loadData}>
            ⟳ Refresh
          </button>

          <button className="btn-outline" onClick={() => navigate("/auction")}>
            Lobby
          </button>
        </div>
      </div>

      {error && <div className="my-players-alert error">{error}</div>}

      {/* WALLET SECTION */}
      {wallet && (
        <div className="my-players-wallet">
          <div className="wallet-card">
            <span className="label">Initial Wallet</span>
            <span className="value">{wallet.initial_amount} cr</span>
          </div>
          <div className="wallet-card">
            <span className="label">Current Balance</span>
            <span className="value">{wallet.current_balance} cr</span>
          </div>
        </div>
      )}

      {/* PLAYERS TABLE */}
      {loading ? (
        <div className="my-players-loading">Loading your squad...</div>
      ) : players.length === 0 ? (
        <div className="my-players-empty">
          You haven&apos;t bought any players yet in this auction.
        </div>
      ) : (
        <div className="my-players-table-wrap">
          <table className="my-players-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Player</th>
                <th>Country</th>
                <th>Skill</th>
                <th>Category</th>
                <th>Purchase Price</th>
              </tr>
            </thead>
            <tbody>
              {players.map((p, idx) => (
                <tr key={p.squad_player_id}>
                  <td>{idx + 1}</td>
                  <td>{p.player_name}</td>
                  <td>{p.country}</td>
                  <td>{p.skill_type}</td>
                  <td>{p.category}</td>
                  <td>{p.purchase_price} cr</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default AuctionMyPlayers;
