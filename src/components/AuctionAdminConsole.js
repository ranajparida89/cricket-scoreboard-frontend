// src/components/AuctionAdminConsole.js
// Dedicated Admin Console for controlling the auction

import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
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
  getCurrentUserId,
} from "../services/auctionApi";
import "./AuctionAdminConsole.css";

const VALID_SKILLS = [
  "Batsman",
  "Bowler",
  "Allrounder",
  "WicketKeeper/Batsman",
];

const VALID_CATEGORIES = ["Legend", "Platinum", "Gold"];

const AuctionAdminConsole = () => {
  const { auctionId } = useParams();
  const navigate = useNavigate();
  const userId = getCurrentUserId();
  const isAdminFlag = localStorage.getItem("isAdmin") === "true";

  const [liveState, setLiveState] = useState(null);
  const [pushRules, setPushRules] = useState([]);
  const [participantsData, setParticipantsData] = useState(null);
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

  const auction = liveState?.auction || null;
  const livePlayer = liveState?.livePlayer || null;

  const loadAll = async () => {
    try {
      setLoading(true);
      setError("");
      setInfo("");

      const [live, rules, participants] = await Promise.all([
        fetchLiveState(auctionId, userId),
        fetchPushRules(auctionId),
        fetchParticipantsForAuction(auctionId),
      ]);

      setLiveState(live);
      setPushRules(rules || []);
      setParticipantsData(participants || null);
    } catch (err) {
      console.error("Error loading admin console data:", err);
      const msg =
        err?.response?.data?.error ||
        err?.message ||
        "Failed to load auction admin data.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [auctionId, userId]);

  const handleAction = async (action) => {
    try {
      setBusy(true);
      setError("");
      setInfo("");

      let res;
      if (action === "start") {
        res = await startAuction(auctionId);
      } else if (action === "pause") {
        res = await pauseAuction(auctionId);
      } else if (action === "resume") {
        res = await resumeAuction(auctionId);
      } else if (action === "end") {
        res = await endAuction(auctionId);
      } else if (action === "next") {
        res = await nextPlayer(auctionId);
      } else if (action === "closeRound") {
        res = await closeCurrentRound(auctionId);
      }

      // Phase 8 – richer summary when closing a round (SOLD/UNSOLD + auto-redeem)
      if (action === "closeRound" && res) {
        const parts = [];

        if (res.result === "SOLD") {
          const amount =
            res.amount != null ? Number(res.amount).toFixed(2) : null;
          const newBal =
            res.newWalletBalance != null
              ? Number(res.newWalletBalance).toFixed(2)
              : null;

          parts.push(
            `SOLD: ${res.playerName} to user ${res.winnerUserId} for ${
              amount ?? res.amount
            } cr.`
          );

          if (res.newSquadSize != null) {
            parts.push(
              `Winner squad size now ${res.newSquadSize} players${
                auction?.maxSquadSize ? ` / ${auction.maxSquadSize}` : ""
              }.`
            );
          }

          if (newBal != null) {
            parts.push(`Winner wallet after purchase: ${newBal} cr.`);
          }

          if (res.autoRedeem && res.autoRedeem.releasedCount > 0) {
            const r = res.autoRedeem;
            const finalBal =
              r.finalBalance != null
                ? Number(r.finalBalance).toFixed(2)
                : null;
            parts.push(
              `Auto-redeem applied: ${r.releasedCount} expensive player(s) returned to pool for this user.`
            );
            if (r.finalSquadSize != null) {
              parts.push(
                `Squad adjusted to ${r.finalSquadSize} players${
                  auction?.maxSquadSize ? ` / ${auction.maxSquadSize}` : ""
                }.`
              );
            }
            if (finalBal != null) {
              parts.push(
                `Wallet after auto-redeem: ${finalBal} cr (more power to buy remaining players).`
              );
            }
          }
        } else if (res.result === "UNSOLD") {
          parts.push(`UNSOLD: ${res.playerName} received no valid bids.`);
        }

        if (res.autoEnded) {
          parts.push(
            "Auction auto-ended (no players/participants left as per rules)."
          );
        }

        if (parts.length === 0 && res.message) {
          setInfo(res.message);
        } else {
          setInfo(parts.join(" "));
        }
      } else if (res && res.message) {
        // default behaviour for other actions
        setInfo(res.message);
      }

      await loadAll();
    } catch (err) {
      console.error("Admin action error:", err);
      const msg =
        err?.response?.data?.error ||
        err?.message ||
        "Admin action failed.";
      setError(msg);
    } finally {
      setBusy(false);
    }
  };

  const handleRuleInputChange = (field, value) => {
    setNewRule((prev) => ({ ...prev, [field]: value }));
  };

  const handleCreateRule = async () => {
    try {
      setBusy(true);
      setError("");
      setInfo("");

      const payload = {};
      if (newRule.skillType) payload.skillType = newRule.skillType;
      if (newRule.category) payload.category = newRule.category;
      if (newRule.count) payload.count = Number(newRule.count);
      if (newRule.priority) payload.priority = Number(newRule.priority);

      if (!payload.count || payload.count <= 0) {
        setError("Count is required and must be > 0.");
        setBusy(false);
        return;
      }

      await createPushRule(auctionId, payload);
      setInfo("Push rule created.");
      setNewRule({ skillType: "", category: "", count: "", priority: "" });
      const rules = await fetchPushRules(auctionId);
      setPushRules(rules || []);
    } catch (err) {
      console.error("Error creating push rule:", err);
      const msg =
        err?.response?.data?.error ||
        err?.message ||
        "Failed to create push rule.";
      setError(msg);
    } finally {
      setBusy(false);
    }
  };

  if (!isAdminFlag) {
    return (
      <div className="admin-console-page">
        <div className="admin-console-header">
          <h1>Auction Admin Console</h1>
        </div>
        <div className="admin-console-alert error">
          You are not marked as admin (localStorage isAdmin !== &quot;true&quot;).
          Please login as admin to access this page.
        </div>
        <button
          className="btn-outline"
          onClick={() => navigate(`/auction/${auctionId}`)}
        >
          ← Back to Auction Room
        </button>
      </div>
    );
  }

  const participants = participantsData?.participants || [];

  return (
    <div className="admin-console-page">
      <div className="admin-console-header">
        <div>
          <h1>Auction Admin Console</h1>
          {auction && (
            <p className="admin-console-subtitle">
              Auction: <strong>{auction.name}</strong> &nbsp;•&nbsp; Status:{" "}
              <span className={`tag tag-${auction.status?.toLowerCase()}`}>
                {auction.status}
              </span>
            </p>
          )}
        </div>

        <div className="admin-console-header-actions">
          <button
            className="btn-outline"
            onClick={() => navigate(`/auction/${auctionId}`)}
          >
            ← Back to Auction Room
          </button>

          {/* Import CSV → Player Pool */}
          <button
            className="btn-outline"
            onClick={() => navigate(`/auction/${auctionId}/import-players`)}
          >
            📦 Import Player Pool
          </button>

          {/* NEW: View Player Pool / manage unsold players */}
          <button
            className="btn-outline"
            onClick={() => navigate(`/auction/${auctionId}/player-pool`)}
          >
            👀 View Player Pool
          </button>

          {/* Summary only when auction is ended */}
          {auction?.status === "ENDED" && (
            <button
              className="btn-outline"
              onClick={() => navigate(`/auction/${auctionId}/summary`)}
            >
              📊 Summary
            </button>
          )}

          <button className="btn-outline" onClick={loadAll}>
            ⟳ Refresh
          </button>
          <button className="btn-outline" onClick={() => navigate("/auction")}>
            Lobby
          </button>
        </div>
      </div>

      {/* Info banner when auction has ended */}
      {auction?.status === "ENDED" && (
        <div className="admin-console-alert info" style={{ marginBottom: 8 }}>
          This auction is marked as <strong>ENDED</strong>. Use the Summary
          button to review final squads, spending, and player outcomes.
        </div>
      )}

      {error && <div className="admin-console-alert error">{error}</div>}
      {info && <div className="admin-console-alert info">{info}</div>}

      {/* Top: Overview + Controls + Live Player */}
      <div className="admin-console-top">
        <div className="admin-console-controls-card">
          <h3>Controls</h3>
          <div className="control-row">
            <button
              className="btn-primary"
              disabled={busy}
              onClick={() => handleAction("start")}
            >
              ▶ Start
            </button>
            <button
              className="btn-primary"
              disabled={busy}
              onClick={() => handleAction("pause")}
            >
              ⏸ Pause
            </button>
            <button
              className="btn-primary"
              disabled={busy}
              onClick={() => handleAction("resume")}
            >
              ⏯ Resume
            </button>
            <button
              className="btn-danger"
              disabled={busy}
              onClick={() => handleAction("end")}
            >
              ⏹ End Auction
            </button>
          </div>

          <div className="control-row">
            <button
              className="btn-secondary"
              disabled={busy}
              onClick={() => handleAction("closeRound")}
            >
              ✅ Close Current Round
            </button>
            <button
              className="btn-secondary"
              disabled={busy}
              onClick={() => handleAction("next")}
            >
              ⏭ Next Player
            </button>
          </div>

          {auction && (
            <div className="auction-meta-grid">
              <div className="meta-card">
                <span>Max Squad</span>
                <strong>{auction.maxSquadSize}</strong>
              </div>
              <div className="meta-card">
                <span>Min Exit Squad</span>
                <strong>{auction.minExitSquadSize}</strong>
              </div>
              <div className="meta-card">
                <span>Timer / Round</span>
                <strong>{auction.bidTimerSeconds} sec</strong>
              </div>
              <div className="meta-card">
                <span>Min Bid Increment</span>
                <strong>{auction.minBidIncrement} cr</strong>
              </div>
            </div>
          )}
        </div>

        <div className="admin-console-live-card">
          <h3>Live Player Snapshot</h3>
          {!livePlayer ? (
            <div className="admin-console-empty">
              No player is LIVE currently.
            </div>
          ) : (
            <div className="live-info">
              <div className="row">
                <span>Player</span>
                <strong>{livePlayer.playerName}</strong>
              </div>
              <div className="row">
                <span>Country</span>
                <strong>{livePlayer.country}</strong>
              </div>
              <div className="row">
                <span>Skill</span>
                <strong>{livePlayer.skillType}</strong>
              </div>
              <div className="row">
                <span>Category</span>
                <strong>{livePlayer.category}</strong>
              </div>
              <div className="row">
                <span>Base</span>
                <strong>{livePlayer.baseBidAmount} cr</strong>
              </div>
              <div className="row">
                <span>Highest Bid</span>
                <strong>
                  {livePlayer.lastHighestBidAmount != null
                    ? `${livePlayer.lastHighestBidAmount} cr`
                    : "-"}
                </strong>
              </div>
              <div className="row">
                <span>Time Left</span>
                <strong>
                  {livePlayer.timeRemainingSeconds != null
                    ? `${livePlayer.timeRemainingSeconds}s`
                    : "-"}
                </strong>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Middle: Push Rules */}
      <div className="admin-console-push-section">
        <div className="push-left">
          <h3>Push Rules (Next Player Sequence)</h3>
          {loading ? (
            <div className="admin-console-empty">Loading push rules...</div>
          ) : pushRules.length === 0 ? (
            <div className="admin-console-empty">
              No push rules defined. Default order = by created_at.
            </div>
          ) : (
            <div className="push-rules-table-wrap">
              <table className="push-rules-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Skill</th>
                    <th>Category</th>
                    <th>Remaining</th>
                    <th>Priority</th>
                    <th>Active</th>
                  </tr>
                </thead>
                <tbody>
                  {pushRules.map((r, idx) => (
                    <tr key={r.ruleId}>
                      <td>{idx + 1}</td>
                      <td>{r.skillType || "Any"}</td>
                      <td>{r.category || "Any"}</td>
                      <td>{r.remainingCount}</td>
                      <td>{r.priority}</td>
                      <td>{r.isActive ? "Yes" : "No"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="push-right">
          <h3>Create Push Rule</h3>
          <div className="form-row">
            <label>Skill Type (optional)</label>
            <select
              value={newRule.skillType}
              onChange={(e) =>
                handleRuleInputChange("skillType", e.target.value)
              }
            >
              <option value="">Any</option>
              {VALID_SKILLS.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
          <div className="form-row">
            <label>Category (optional)</label>
            <select
              value={newRule.category}
              onChange={(e) =>
                handleRuleInputChange("category", e.target.value)
              }
            >
              <option value="">Any</option>
              {VALID_CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
          <div className="form-row">
            <label>Count (how many players)</label>
            <input
              type="number"
              min="1"
              value={newRule.count}
              onChange={(e) =>
                handleRuleInputChange("count", e.target.value)
              }
            />
          </div>
          <div className="form-row">
            <label>Priority (optional)</label>
            <input
              type="number"
              min="1"
              value={newRule.priority}
              onChange={(e) =>
                handleRuleInputChange("priority", e.target.value)
              }
            />
          </div>
          <button
            className="btn-primary full-width"
            disabled={busy}
            onClick={handleCreateRule}
          >
            ➕ Create Rule
          </button>
        </div>
      </div>

      {/* Bottom: Participants list */}
      <div className="admin-console-participants">
        <h3>Participants</h3>
        {loading ? (
          <div className="admin-console-empty">Loading participants...</div>
        ) : !participantsData ? (
          <div className="admin-console-empty">
            No participants data received.
          </div>
        ) : participants.length === 0 ? (
          <div className="admin-console-empty">
            No one has joined this auction yet.
          </div>
        ) : (
          <div className="participants-table-wrap">
            <table className="participants-table">
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
                  <tr key={p.userId + "-" + p.roleInAuction}>
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
    </div>
  );
};

export default AuctionAdminConsole;
