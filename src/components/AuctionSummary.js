// src/components/AuctionSummary.js
// Phase 10 – Auction finish report & summary screen

import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  fetchAuctionSummary,
  fetchParticipantsForAuction,
  getCurrentUserId,
} from "../services/auctionApi";
import "./AuctionSummary.css";

const AuctionSummary = () => {
  const { auctionId } = useParams();
  const navigate = useNavigate();
  const userId = getCurrentUserId(); // not strictly needed, but useful if later you want personal highlighting
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

        const [sumRes, partRes] = await Promise.all([
          fetchAuctionSummary(auctionId),
          fetchParticipantsForAuction(auctionId),
        ]);

        setSummary(sumRes);
        setParticipantsData(partRes);
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
  const participants = participantsData?.participants || [];

  const formatDateTime = (value) => {
    if (!value) return "-";
    try {
      const d = new Date(value);
      return d.toLocaleString();
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
              Auction: <strong>{auction.name}</strong> &nbsp;•&nbsp; Status:{" "}
              <span className={`tag tag-${auction.status?.toLowerCase()}`}>
                {auction.status}
              </span>
              <br />
              Created: {formatDateTime(auction.createdAt)} &nbsp;|&nbsp; Ended:{" "}
              {formatDateTime(auction.endedAt)}
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
        <div className="auction-summary-alert info">
          Loading auction summary...
        </div>
      ) : !summary ? (
        <div className="auction-summary-alert error">
          No summary information found for this auction.
        </div>
      ) : (
        <>
          {/* Top cards – players + participants overview */}
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
                    {((playerCounts?.pending || 0) +
                      (playerCounts?.reclaimed || 0)) ??
                      "-"}
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
                  <span>Min Exit Squad</span>
                  <strong>{auction?.minExitSquadSize ?? "-"}</strong>
                </div>
                <div>
                  <span>Initial Wallet</span>
                  <strong>
                    {auction?.initialWalletAmount != null
                      ? `${auction.initialWalletAmount} cr`
                      : "-"}
                  </strong>
                </div>
              </div>
            </div>
          </div>

          {/* Top spenders */}
          <div className="summary-section-card">
            <div className="summary-section-header">
              <h3>Top Spenders</h3>
              <span className="summary-section-caption">
                Based on wallet spent (initial - current)
              </span>
            </div>
            {topSpenders.length === 0 ? (
              <div className="summary-empty">No spending data available.</div>
            ) : (
              <div className="summary-table-wrap">
                <table className="summary-table">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>User ID</th>
                      <th>Squad Size</th>
                      <th>Wallet Initial</th>
                      <th>Wallet Spent</th>
                      <th>Wallet Balance</th>
                    </tr>
                  </thead>
                  <tbody>
                    {topSpenders.map((p, idx) => (
                      <tr
                        key={`${p.userId}-${idx}`}
                        className={
                          p.userId === userId ? "summary-row-highlight" : ""
                        }
                      >
                        <td>{idx + 1}</td>
                        <td>{p.userId}</td>
                        <td>{p.squadSize}</td>
                        <td>{p.walletInitial} cr</td>
                        <td>{p.walletSpent.toFixed(2)} cr</td>
                        <td>{p.walletBalance.toFixed(2)} cr</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Participants full table */}
          <div className="summary-section-card">
            <div className="summary-section-header">
              <h3>Participants Overview</h3>
              <span className="summary-section-caption">
                All admins & bidders in this auction
              </span>
            </div>
            {!participantsData ? (
              <div className="summary-empty">No participant data.</div>
            ) : participants.length === 0 ? (
              <div className="summary-empty">No one joined this auction.</div>
            ) : (
              <div className="summary-table-wrap">
                <table className="summary-table">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>User ID</th>
                      <th>Role</th>
                      <th>Status</th>
                      <th>Active</th>
                      <th>Squad Size</th>
                      <th>Wallet Initial</th>
                      <th>Wallet Spent</th>
                      <th>Wallet Balance</th>
                    </tr>
                  </thead>
                  <tbody>
                    {participants.map((p, idx) => (
                      <tr
                        key={`${p.userId}-${p.roleInAuction}`}
                        className={
                          p.userId === userId ? "summary-row-highlight" : ""
                        }
                      >
                        <td>{idx + 1}</td>
                        <td>{p.userId}</td>
                        <td>{p.roleInAuction}</td>
                        <td>{p.status}</td>
                        <td>{p.isActive ? "Yes" : "No"}</td>
                        <td>
                          {p.squadSize} / {auction?.maxSquadSize ?? "-"}
                        </td>
                        <td>{p.walletInitial} cr</td>
                        <td>{p.walletSpent.toFixed(2)} cr</td>
                        <td>{p.walletBalance.toFixed(2)} cr</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Sold players list */}
          <div className="summary-section-card">
            <div className="summary-section-header">
              <h3>Sold Players</h3>
              <span className="summary-section-caption">
                Final list of bought players (with price & buyer)
              </span>
            </div>
            {soldPlayers.length === 0 ? (
              <div className="summary-empty">No players were SOLD.</div>
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
                      <th>Base Price</th>
                      <th>Sold Price</th>
                      <th>Buyer (userId)</th>
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
                        <td>{sp.baseBidAmount} cr</td>
                        <td>
                          {sp.finalBidAmount != null
                            ? `${sp.finalBidAmount.toFixed(2)} cr`
                            : "-"}
                        </td>
                        <td>{sp.soldToUserId || "-"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Small footer note */}
          <div className="summary-footer-note">
            {isAdmin && (
              <span>
                You are viewing as <strong>Admin</strong>. Use this report for
                line-up planning or exporting data.
              </span>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default AuctionSummary;
