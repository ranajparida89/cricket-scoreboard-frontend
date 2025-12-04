// src/components/AuctionAdminConsole.js

import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../services/auth";
import {
  fetchLiveState,
  startAuction,
  pauseAuction,
  resumeAuction,
  endAuction,
  nextPlayer,
  closeCurrentRound,
  fetchPushRules,
  createPushRule,
  fetchParticipantsForAuction,
} from "../services/auctionApi";
import "./AuctionAdminConsole.css";

const AuctionAdminConsole = () => {
  const { auctionId } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useAuth();

  const isAdminFlag =
    currentUser?.role === "admin" ||
    localStorage.getItem("isAdmin") === "true";

  const [auction, setAuction] = useState(null);
  const [livePlayer, setLivePlayer] = useState(null);
  const [participants, setParticipants] = useState([]);
  const [pushRules, setPushRules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");

  const [newRule, setNewRule] = useState({
    skillType: "",
    category: "",
    count: "",
    priority: "",
  });

  // ------------- helpers -------------

  const loadAll = async () => {
    setError("");
    setInfo("");
    setLoading(true);
    try {
      const [live, prules, parts] = await Promise.all([
        fetchLiveState(auctionId),
        fetchPushRules(auctionId),
        fetchParticipantsForAuction(auctionId),
      ]);

      setAuction(live.auction || null);
      setLivePlayer(live.livePlayer || null);
      setPushRules(prules || []);
      setParticipants(parts.participants || []);
    } catch (e) {
      console.error("Error loading admin console:", e);
      const msg =
        e?.response?.data?.error || e?.message || "Failed to load admin data.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!auctionId) return;
    if (!isAdminFlag) return;
    loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [auctionId, isAdminFlag]);

  const handleControl = async (fn, successMsg) => {
    if (!auctionId) return;
    setBusy(true);
    setError("");
    setInfo("");
    try {
      await fn(auctionId);
      setInfo(successMsg);
      await loadAll();
    } catch (e) {
      console.error("Admin control error:", e);
      const msg =
        e?.response?.data?.error || e?.message || "Action failed. Try again.";
      setError(msg);
    } finally {
      setBusy(false);
    }
  };

  // ------------- button handlers -------------

  const handleStart = () =>
    handleControl(startAuction, "Auction started. First player is LIVE.");

  const handlePause = () =>
    handleControl(pauseAuction, "Auction paused.");

  const handleResume = () =>
    handleControl(resumeAuction, "Auction resumed.");

  const handleEnd = () =>
    handleControl(endAuction, "Auction ended.");

  const handleCloseRound = () =>
    handleControl(closeCurrentRound, "Current round closed.");

  const handleNextPlayer = () =>
    handleControl(nextPlayer, "Next player is LIVE.");

  const handleCreateRule = async (e) => {
    e.preventDefault();
    if (!auctionId) return;

    const count = parseInt(newRule.count, 10);
    if (!Number.isFinite(count) || count <= 0) {
      setError("Count must be a positive number.");
      return;
    }

    setBusy(true);
    setError("");
    setInfo("");
    try {
      const payload = {
        skillType: newRule.skillType || null,
        category: newRule.category || null,
        count,
        priority: newRule.priority ? parseInt(newRule.priority, 10) : undefined,
      };

      await createPushRule(auctionId, payload);
      setInfo("Push rule created.");
      setNewRule({ skillType: "", category: "", count: "", priority: "" });
      await loadAll();
    } catch (e) {
      console.error("Error creating push rule:", e);
      const msg =
        e?.response?.data?.error || e?.message || "Failed to create push rule.";
      setError(msg);
    } finally {
      setBusy(false);
    }
  };

  // ------------- render -------------

  if (!isAdminFlag) {
    return (
      <div className="auction-admin-page">
        <div className="auction-admin-alert error">
          You are not marked as admin (localStorage isAdmin !== "true" and
          currentUser.role !== "admin"). Please login as admin to access this
          page.
        </div>
        <button
          className="auction-admin-back-btn"
          onClick={() => navigate(-1)}
        >
          ← Back to Auction Room
        </button>
      </div>
    );
  }

  return (
    <div className="auction-admin-page">
      <div className="auction-admin-header">
        <h1>Auction Admin Console</h1>
        <div className="auction-admin-header-meta">
          {auction ? (
            <>
              <span className={`status-pill status-${auction.status}`}>
                {auction.status}
              </span>
              <span>Max Squad: {auction.maxSquadSize}</span>
              <span>Min Exit: {auction.minExitSquadSize}</span>
              <span>Wallet: {auction.initialWalletAmount} cr</span>
            </>
          ) : (
            <span>Loading auction details...</span>
          )}
        </div>
        <button
          className="auction-admin-back-btn"
          onClick={() => navigate(`/auction/${auctionId}`)}
        >
          ← Back to Auction Room
        </button>
      </div>

      {error && <div className="auction-admin-alert error">{error}</div>}
      {info && <div className="auction-admin-alert info">{info}</div>}

      {loading ? (
        <div className="auction-admin-loading">Loading console…</div>
      ) : (
        <>
          {/* Controls */}
          <section className="auction-admin-section">
            <h2>Controls</h2>
            <div className="admin-controls-row">
              <button
                className="btn-control start"
                disabled={busy}
                onClick={handleStart}
              >
                ▶ Start
              </button>
              <button
                className="btn-control pause"
                disabled={busy}
                onClick={handlePause}
              >
                ⏸ Pause
              </button>
              <button
                className="btn-control resume"
                disabled={busy}
                onClick={handleResume}
              >
                ⏯ Resume
              </button>
              <button
                className="btn-control end"
                disabled={busy}
                onClick={handleEnd}
              >
                ⏹ End Auction
              </button>
              <button
                className="btn-control close-round"
                disabled={busy}
                onClick={handleCloseRound}
              >
                ✔ Close Current Round
              </button>
              <button
                className="btn-control next"
                disabled={busy}
                onClick={handleNextPlayer}
              >
                ⏭ Next Player
              </button>
            </div>
          </section>

          {/* Live Player Snapshot */}
          <section className="auction-admin-section two-col">
            <div className="left">
              <h2>Live Player Snapshot</h2>
              {livePlayer ? (
                <div className="live-player-card">
                  <div className="live-player-main">
                    <h3>{livePlayer.playerName}</h3>
                    <p>
                      {livePlayer.country} • {livePlayer.skillType} •{" "}
                      {livePlayer.category}
                    </p>
                  </div>
                  <div className="live-player-meta">
                    <div>
                      Base: <strong>{livePlayer.baseBidAmount} cr</strong>
                    </div>
                    <div>
                      Current bid:{" "}
                      <strong>
                        {livePlayer.lastHighestBidAmount ?? "—"}{" "}
                        {livePlayer.lastHighestBidAmount != null && "cr"}
                      </strong>
                    </div>
                    <div>
                      Time left:{" "}
                      <strong>
                        {livePlayer.timeRemainingSeconds ?? "—"} sec
                      </strong>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="live-player-empty">
                  No player is LIVE currently.
                </div>
              )}
            </div>

            {/* Push rules creation */}
            <div className="right">
              <h2>Create Push Rule</h2>
              <form className="push-rule-form" onSubmit={handleCreateRule}>
                <label>
                  Skill Type (optional)
                  <select
                    value={newRule.skillType}
                    onChange={(e) =>
                      setNewRule((r) => ({ ...r, skillType: e.target.value }))
                    }
                  >
                    <option value="">Any</option>
                    <option value="Batsman">Batsman</option>
                    <option value="Bowler">Bowler</option>
                    <option value="Allrounder">Allrounder</option>
                    <option value="WicketKeeper/Batsman">
                      WicketKeeper/Batsman
                    </option>
                  </select>
                </label>

                <label>
                  Category (optional)
                  <select
                    value={newRule.category}
                    onChange={(e) =>
                      setNewRule((r) => ({ ...r, category: e.target.value }))
                    }
                  >
                    <option value="">Any</option>
                    <option value="Legend">Legend</option>
                    <option value="Platinum">Platinum</option>
                    <option value="Gold">Gold</option>
                  </select>
                </label>

                <label>
                  Count (how many players)
                  <input
                    type="number"
                    min="1"
                    value={newRule.count}
                    onChange={(e) =>
                      setNewRule((r) => ({ ...r, count: e.target.value }))
                    }
                    required
                  />
                </label>

                <label>
                  Priority (optional)
                  <input
                    type="number"
                    min="1"
                    value={newRule.priority}
                    onChange={(e) =>
                      setNewRule((r) => ({ ...r, priority: e.target.value }))
                    }
                  />
                </label>

                <button
                  type="submit"
                  className="btn-push-rule"
                  disabled={busy}
                >
                  + Create Rule
                </button>
              </form>
            </div>
          </section>

          {/* Push rules list */}
          <section className="auction-admin-section">
            <h2>Push Rules (Next Player Sequence)</h2>
            {pushRules.length === 0 ? (
              <div className="empty-box">
                No push rules defined. Default order = by created_at.
              </div>
            ) : (
              <div className="push-rules-list">
                {pushRules.map((r) => (
                  <div key={r.ruleId} className="push-rule-chip">
                    <span>
                      #{r.priority} •{" "}
                      {r.skillType || "Any"} / {r.category || "Any"} • remaining{" "}
                      {r.remainingCount}
                    </span>
                    {!r.isActive && <span className="tag-inactive">Inactive</span>}
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Participants */}
          <section className="auction-admin-section">
            <h2>Participants</h2>
            {participants.length === 0 ? (
              <div className="empty-box">No participants data received.</div>
            ) : (
              <table className="participants-table">
                <thead>
                  <tr>
                    <th>User</th>
                    <th>Role</th>
                    <th>Status</th>
                    <th>Wallet (initial)</th>
                    <th>Wallet (current)</th>
                    <th>Spent</th>
                    <th>Squad size</th>
                  </tr>
                </thead>
                <tbody>
                  {participants.map((p) => (
                    <tr key={p.userId}>
                      <td>{p.userId}</td>
                      <td>{p.roleInAuction}</td>
                      <td>{p.status}</td>
                      <td>{p.walletInitial}</td>
                      <td>{p.walletBalance}</td>
                      <td>{p.walletSpent}</td>
                      <td>{p.squadSize}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </section>
        </>
      )}
    </div>
  );
};

export default AuctionAdminConsole;
