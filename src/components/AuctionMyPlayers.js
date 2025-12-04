// src/components/AuctionMyPlayers.js
// "My Players" room – shows squad + wallet for current user in a given auction

import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { fetchMyPlayers, getCurrentUserId } from "../services/auctionApi";
import "./AuctionMyPlayers.css";

const AuctionMyPlayers = () => {
  const { auctionId } = useParams();
  const navigate = useNavigate();
  const userId = getCurrentUserId();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadData = async () => {
    try {
      setLoading(true);
      setError("");
      const res = await fetchMyPlayers(auctionId, userId);
      setData(res);
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [auctionId, userId]);

  const auction = data?.auction || null;
  const wallet = data?.wallet || null;
  const players = data?.players || [];
  const squadSize = data?.squadSize ?? 0;
  const maxSquad = auction?.maxSquadSize ?? 13;

  return (
    <div className="my-players-page">
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
          <button
            className="btn-outline"
            onClick={() => navigate("/auction")}
          >
            Lobby
          </button>
        </div>
      </div>

      {error && <div className="my-players-alert error">{error}</div>}

      {wallet && (
        <div className="my-players-wallet">
          <div className="wallet-card">
            <span className="label">Initial Wallet</span>
            <span className="value">{wallet.initialAmount} cr</span>
          </div>
          <div className="wallet-card">
            <span className="label">Spent</span>
            <span className="value">{wallet.spent.toFixed(2)} cr</span>
          </div>
          <div className="wallet-card">
            <span className="label">Remaining</span>
            <span className="value">
              {wallet.currentBalance.toFixed(2)} cr
            </span>
          </div>
          <div className="wallet-card">
            <span className="label">Status</span>
            <span className="value">{wallet.status}</span>
          </div>
        </div>
      )}

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
                <th>Base Price</th>
                <th>Purchase Price</th>
                <th>Diff</th>
                <th>Purchased At</th>
              </tr>
            </thead>
            <tbody>
              {players.map((p, idx) => {
                const base = Number(p.baseBidAmount || 0);
                const price = Number(p.purchasePrice || 0);
                const diff = Number((price - base).toFixed(2));
                return (
                  <tr key={p.squadPlayerId}>
                    <td>{idx + 1}</td>
                    <td>{p.playerName}</td>
                    <td>{p.country}</td>
                    <td>{p.skillType}</td>
                    <td>{p.category}</td>
                    <td>{base} cr</td>
                    <td>{price} cr</td>
                    <td className={diff >= 0 ? "pos" : "neg"}>
                      {diff >= 0 ? `+${diff}` : diff} cr
                    </td>
                    <td>
                      {p.createdAt
                        ? new Date(p.createdAt).toLocaleString()
                        : "-"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default AuctionMyPlayers;
