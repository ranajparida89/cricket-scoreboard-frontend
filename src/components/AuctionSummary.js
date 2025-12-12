// src/components/AuctionSummary.js
// Updated for simpleAuctionRoutes backend – removes old fetchParticipantsForAuction

import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import {
  fetchAuctionSummary,
  fetchParticipants,      // ✅ FIXED
  getCurrentUserId,
} from "../services/auctionApi";

import "./AuctionSummary.css";

const AuctionSummary = () => {
  const { auctionId } = useParams();
  const navigate = useNavigate();
  const userId = getCurrentUserId();
  const isAdmin = localStorage.getItem("isAdmin") === "true";

  const [summary, setSummary] = useState(null);
  const [participantsData, setParticipantsData] = useState(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setError("");

        const [summaryRes, participantsRes] = await Promise.all([
          fetchAuctionSummary(auctionId),
          fetchParticipants(auctionId),     // ✅ FIXED
        ]);

        setSummary(summaryRes);
        setParticipantsData(participantsRes);
      } catch (err) {
        console.error("Error loading auction summary:", err);
        const msg =
          err?.response?.data?.error ||
          err?.message ||
          "Failed to load auction summary.";
        setError(msg);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [auctionId]);

  const auction = summary?.auction || null;
  const playerCounts = summary?.playerCounts || null;
  const participantCounts = summary?.participantCounts || null;
  const topSpenders = summary?.topSpenders || [];
  const soldPlayers = summary?.soldPlayers || [];

  // New backend sends participants under participantsData.participants
  const participants = participantsData?.participants || [];

  const formatDateTime = (value) => {
    if (!value) return "-";
    try {
      return new Date(value).toLocaleString();
    } catch {
      return String(value);
    }
  };

  return (
    <div className="auction-summary-page">
      <div className="auction-summary-header">
        <div>
          <h1>Auction Summary</h1>

          {auction && (
            <p className="auction-summary-subtitle">
              Auction: <strong>{auction.name}</strong>
              &nbsp;•&nbsp;
              <span className={`tag tag-${auction.status?.toLowerCase()}`}>
                {auction.status}
              </span>
              <br />
              Created: {formatDateTime(auction.createdAt)}
              &nbsp;|&nbsp;
              Ended: {formatDateTime(auction.endedAt)}
            </p>
          )}
        </div>

        <div className="auction-summary-header-actions">
          <button
            className="summary-btn-outline"
            onClick={() => navigate(`/auction/${auctionId}`)}
          >
            ← Back to Auction Room
          </button>

          <button
            className="summary-btn-outline"
            onClick={() => navigate("/auction")}
          >
            Lobby
          </button>
        </div>
      </div>

      {error && <div className="auction-summary-alert error">{error}</div>}

      {loading && !summary ? (
        <div className="auction-summary-alert info">Loading auction summary...</div>
      ) : !summary ? (
        <div className="auction-summary-alert error">
          No summary found for this auction.
        </div>
      ) : (
        <>
          {/* PLAYER & PARTICIPANT OVERVIEW */}
          <div className="summary-top-grid">
            <div className="summary-card">
              <h3>Players</h3>
              <div className="summary-card-metrics">
                <div>
                  <span>Total</span>
                  <strong>{playerCounts?.totalPlayers ?? "-"}</strong>
                </div>
                <div>
                  <span>Sold</span>
                  <strong>{playerCounts?.sold ?? "-"}</strong>
                </div>
                <div>
                  <span>Unsold</span>
                  <strong>{playerCounts?.unsold ?? "-"}</strong>
                </div>
                <div>
                  <span>Pending/Reclaimed</span>
                  <strong>
                    {(playerCounts?.pending || 0) +
                      (playerCounts?.reclaimed || 0)}
                  </strong>
                </div>
              </div>
            </div>

            <div className="summary-card">
              <h3>Participants</h3>
              <div className="summary-card-metrics">
                <div>
                  <span>Total</span>
                  <strong>{participantCounts?.totalParticipants ?? "-"}</strong>
                </div>
                <div>
                  <span>Completed</span>
                  <strong>{participantCounts?.completed ?? "-"}</strong>
                </div>
                <div>
                  <span>Exited</span>
                  <strong>{participantCounts?.exited ?? "-"}</strong>
                </div>
                <div>
                  <span>Active</span>
                  <strong>{participantCounts?.active ?? "-"}</strong>
                </div>
              </div>
            </div>

            <div className="summary-card">
              <h3>Config</h3>
              <div className="summary-card-metrics">
                <div>
                  <span>Max Squad</span>
                  <strong>{auction?.maxSquadSize ?? "-"}</strong>
                </div>
                <div>
                  <span>Initial Wallet</span>
                  <strong>{auction?.initialWalletAmount ?? "-"} cr</strong>
                </div>
              </div>
            </div>
          </div>

          {/* TOP SPENDERS */}
          <div className="summary-section-card">
            <div className="summary-section-header">
              <h3>Top Spenders</h3>
              <span className="summary-section-caption">
                Based on wallet spent
              </span>
            </div>

            {topSpenders.length === 0 ? (
              <div className="summary-empty">No spenders yet.</div>
            ) : (
              <div className="summary-table-wrap">
                <table className="summary-table">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>User ID</th>
                      <th>Squad</th>
                      <th>Initial</th>
                      <th>Spent</th>
                      <th>Balance</th>
                    </tr>
                  </thead>
                  <tbody>
                    {topSpenders.map((p, idx) => (
                      <tr
                        key={p.userId}
                        className={p.userId === userId ? "summary-row-highlight" : ""}
                      >
                        <td>{idx + 1}</td>
                        <td>{p.userId}</td>
                        <td>{p.squadSize}</td>
                        <td>{p.walletInitial}</td>
                        <td>{p.walletSpent.toFixed(2)}</td>
                        <td>{p.walletBalance.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* PARTICIPANTS TABLE */}
          <div className="summary-section-card">
            <div className="summary-section-header">
              <h3>Participants Overview</h3>
            </div>

            {participants.length === 0 ? (
              <div className="summary-empty">No participants joined.</div>
            ) : (
              <div className="summary-table-wrap">
                <table className="summary-table">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>User ID</th>
                      <th>Status</th>
                      <th>Active</th>
                    </tr>
                  </thead>
                  <tbody>
                    {participants.map((p, idx) => (
                      <tr key={p.userId}>
                        <td>{idx + 1}</td>
                        <td>{p.userId}</td>
                        <td>{p.status}</td>
                        <td>{p.isActive ? "Yes" : "No"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* SOLD PLAYERS */}
          <div className="summary-section-card">
            <div className="summary-section-header">
              <h3>Sold Players</h3>
            </div>

            {soldPlayers.length === 0 ? (
              <div className="summary-empty">No players sold.</div>
            ) : (
              <div className="summary-table-wrap">
                <table className="summary-table">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Player</th>
                      <th>Country</th>
                      <th>Skill</th>
                      <th>Category</th>
                      <th>Base</th>
                      <th>Sold Price</th>
                      <th>Buyer</th>
                    </tr>
                  </thead>
                  <tbody>
                    {soldPlayers.map((sp, idx) => (
                      <tr key={sp.sessionPlayerId}>
                        <td>{idx + 1}</td>
                        <td>{sp.playerName}</td>
                        <td>{sp.country}</td>
                        <td>{sp.skillType}</td>
                        <td>{sp.category}</td>
                        <td>{sp.baseBidAmount}</td>
                        <td>{sp.finalBidAmount}</td>
                        <td>{sp.soldToUserId}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default AuctionSummary;
