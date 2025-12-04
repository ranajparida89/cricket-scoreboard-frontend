// src/components/AuctionRoom.js

import React, { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  fetchLiveState,
  placeBid,
  nextPlayer,
  closeCurrentRound,
  exitAuction,
  getCurrentUserId,
} from "../services/auctionApi";
import { useAuth } from "../services/auth";   // ✅ NEW
import "./AuctionRoom.css";

const POLL_INTERVAL = 1500; // ms

const AuctionRoom = () => {
  const { auctionId } = useParams();
  const navigate = useNavigate();

  const { currentUser } = useAuth();          // ✅ NEW
  const userId = getCurrentUserId();
  const isAdmin =
    currentUser?.role === "admin" ||
    localStorage.getItem("isAdmin") === "true" ||
    localStorage.getItem("role") === "admin"; // extra safety

  const [liveState, setLiveState] = useState(null);
  const [loading, setLoading] = useState(true);
  const [placingBid, setPlacingBid] = useState(false);
  const [actionMsg, setActionMsg] = useState("");
  const [error, setError] = useState("");
  const pollRef = useRef(null);

  const loadLive = async () => {
    try {
      const data = await fetchLiveState(auctionId, userId);
      setLiveState(data);
      setError("");
    } catch (err) {
      console.error("Error fetching live auction:", err);
      const msg =
        err?.response?.data?.error ||
        err?.message ||
        "Failed to fetch live state.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setLoading(true);
    loadLive();

    pollRef.current = setInterval(loadLive, POLL_INTERVAL);
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [auctionId, userId]);

  const auction = liveState?.auction || null;
  const livePlayer = liveState?.livePlayer || null;
  const userContext = liveState?.userContext || null;

  const isAuctionRunning = auction?.status === "RUNNING";
  const userSquadSize = userContext?.currentSquadSize || 0;
  const userWallet = userContext?.walletBalance ?? null;
  const minExitSquad = auction?.minExitSquadSize ?? 11;
  const maxSquad = auction?.maxSquadSize ?? 13;

  // server-side canBid (Phase 7)
  const canBidFromServer = userContext?.canBid ?? false;

  // Compute next bid value for the "big button"
  const { minAllowedBid, suggestedBid } = useMemo(() => {
    if (!auction || !livePlayer)
      return { minAllowedBid: null, suggestedBid: null };

    const base = Number(livePlayer.baseBidAmount || 0);
    const last =
      livePlayer.lastHighestBidAmount != null
        ? Number(livePlayer.lastHighestBidAmount)
        : null;
    const minInc = Number(auction.minBidIncrement || 0.5);

    const floorCurrent = last != null ? last : base;
    const minAllowed = floorCurrent + minInc;
    const suggestion = Number(minAllowed.toFixed(2));
    return { minAllowedBid: minAllowed, suggestedBid: suggestion };
  }, [auction, livePlayer]);

  const timeRemaining = livePlayer?.timeRemainingSeconds ?? null;

  // Reason why bidding is blocked – used in UI for friendly message
  const bidBlockedReason = useMemo(() => {
    if (!auction || !livePlayer || !userContext) return null;

    if (auction.status !== "RUNNING") {
      return `Auction is currently ${auction.status}. Bidding is paused.`;
    }

    if (timeRemaining != null && timeRemaining <= 0) {
      return "Time is over for this player.";
    }

    if (
      userContext.participantStatus &&
      userContext.participantStatus !== "ACTIVE"
    ) {
      return `Your auction status is ${userContext.participantStatus}. You cannot bid now.`;
    }

    if (userContext.isActive === false) {
      return "Your participation in this auction is closed (completed or exited).";
    }

    if (userSquadSize >= maxSquad) {
      return `You already have full squad of ${maxSquad} players.`;
    }

    if (
      userWallet != null &&
      minAllowedBid != null &&
      minAllowedBid > userWallet
    ) {
      return "Insufficient wallet balance for the next minimum bid.";
    }

    return null;
  }, [
    auction,
    livePlayer,
    userContext,
    userSquadSize,
    maxSquad,
    timeRemaining,
    userWallet,
    minAllowedBid,
  ]);

  const effectiveCanBid =
    isAuctionRunning &&
    canBidFromServer &&
    suggestedBid != null &&
    timeRemaining != null &&
    timeRemaining > 0;

  const handleBid = async () => {
    if (!auction || !livePlayer || suggestedBid == null) return;

    if (!effectiveCanBid) {
      // show a polite message instead of doing nothing
      if (bidBlockedReason) {
        setError(bidBlockedReason);
      } else {
        setError("You cannot place a bid at this moment.");
      }
      return;
    }

    if (userWallet != null && suggestedBid > userWallet) {
      setError("You don't have enough wallet balance for this bid.");
      return;
    }

    try {
      setPlacingBid(true);
      setError("");
      setActionMsg("");

      const res = await placeBid(
        auction.auctionId,
        livePlayer.sessionPlayerId,
        suggestedBid,
        userId
      );
      setActionMsg(`Bid accepted at ${res.lastHighestBidAmount} cr.`);
      // Live state will refresh on next poll
    } catch (err) {
      console.error("Error placing bid:", err);
      const msg =
        err?.response?.data?.error ||
        err?.message ||
        "Failed to place bid.";
      setError(msg);
    } finally {
      setPlacingBid(false);
    }
  };

  const handleExitAuction = async () => {
    if (
      !window.confirm(
        "Are you sure you want to end your auction participation?"
      )
    ) {
      return;
    }
    try {
      setError("");
      setActionMsg("");
      await exitAuction(auctionId, userId);
      setActionMsg("You have exited this auction.");
      // Optionally navigate away after some time
      // navigate("/auction");
    } catch (err) {
      console.error("Error exiting auction:", err);
      const msg =
        err?.response?.data?.error ||
        err?.message ||
        "Unable to exit auction.";
      setError(msg);
    }
  };

  // Admin helpers – still available here but also in Admin Console
  const handleAdminNextPlayer = async () => {
    try {
      setError("");
      const res = await nextPlayer(auctionId);
      setActionMsg(res.message || "Next player is live.");
    } catch (err) {
      console.error("Error setting next player:", err);
      const msg =
        err?.response?.data?.error ||
        err?.message ||
        "Unable to pick next player.";
      setError(msg);
    }
  };

  const handleAdminCloseRound = async () => {
    try {
      setError("");
      const res = await closeCurrentRound(auctionId);
      setActionMsg(res.message || "Round closed.");
    } catch (err) {
      console.error("Error closing round:", err);
      const msg =
        err?.response?.data?.error ||
        err?.message ||
        "Unable to close round.";
      setError(msg);
    }
  };

  const showExitButton =
    userSquadSize >= minExitSquad &&
    userContext?.participantStatus === "ACTIVE";

  return (
    <div className="auction-room-page">
      <div className="auction-room-header">
        <div>
          <h1>Auction Room</h1>
          {auction && (
            <p className="auction-room-subtitle">
              {auction.name} &nbsp;•&nbsp; Status:{" "}
              <span className={`tag tag-${auction.status?.toLowerCase()}`}>
                {auction.status}
              </span>
            </p>
          )}
        </div>

        <div className="auction-room-header-actions">
          {isAdmin && (
            <button
              className="auction-room-back"
              onClick={() => navigate(`/auction/${auctionId}/admin`)}
            >
              🛠 Admin Console
            </button>
          )}

          {/* Phase 10 – link to summary when auction is ended */}
          {auction?.status === "ENDED" && (
            <button
              className="auction-room-back"
              onClick={() => navigate(`/auction/${auctionId}/summary`)}
            >
              📊 Summary
            </button>
          )}

          <button
            className="auction-room-back"
            onClick={() => navigate(`/auction/${auctionId}/my-players`)}
          >
            👥 My Players
          </button>
          <button
            className="auction-room-back"
            onClick={() => navigate("/auction")}
          >
            ← Lobby
          </button>
        </div>
      </div>

      {/* Phase 10 – soft info bar when auction is ended */}
      {auction?.status === "ENDED" && (
        <div className="auction-room-alert info" style={{ marginBottom: 8 }}>
          This auction has ended. You can still review your squad and open the
          full summary report.
        </div>
      )}

      {error && <div className="auction-room-alert error">{error}</div>}
      {actionMsg && (
        <div className="auction-room-alert info">{actionMsg}</div>
      )}

      <div className="auction-room-layout">
        {/* Left: Live Player Card */}
        <div className="auction-live-panel">
          {!livePlayer ? (
            <div className="auction-room-empty">
              {auction?.status === "RUNNING"
                ? "Waiting for admin to start next player..."
                : "No live player currently."}
            </div>
          ) : (
            <div className="auction-live-card">
              <div className="auction-live-header">
                <h2>{livePlayer.playerName}</h2>
                <span className="live-tag">LIVE</span>
              </div>

              <div className="auction-live-info">
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
                  <span>Base Price</span>
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
                    {timeRemaining != null ? `${timeRemaining}s` : "-"}
                  </strong>
                </div>
              </div>

              <div className="auction-bid-panel">
                <div className="bid-label">
                  {effectiveCanBid
                    ? "Your bid button (next allowed bid):"
                    : "Bidding currently disabled for you:"}
                </div>
                <button
                  className="bid-main-btn"
                  disabled={!effectiveCanBid || placingBid}
                  onClick={handleBid}
                >
                  {placingBid
                    ? "Placing..."
                    : suggestedBid != null
                    ? `Bid ${suggestedBid} cr`
                    : "Bid"}
                </button>
                {minAllowedBid != null && (
                  <div className="bid-min-text">
                    Minimum allowed bid: <strong>{minAllowedBid} cr</strong>
                  </div>
                )}
                {(!effectiveCanBid || bidBlockedReason) && (
                  <div className="bid-min-text">
                    {bidBlockedReason
                      ? bidBlockedReason
                      : "You cannot bid at this moment."}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Right: User info + Admin mini controls */}
        <div className="auction-side-panel">
          <div className="auction-user-card">
            <h3>My Auction Status</h3>
            <div className="row">
              <span>Wallet</span>
              <strong>
                {userWallet != null ? `${userWallet.toFixed(2)} cr` : "-"}
              </strong>
            </div>
            <div className="row">
              <span>Squad Size</span>
              <strong>
                {userSquadSize} / {maxSquad}
              </strong>
            </div>
            <div className="row">
              <span>Participant Status</span>
              <strong>{userContext?.participantStatus || "-"}</strong>
            </div>
            <div className="row">
              <span>Active in this auction?</span>
              <strong>
                {userContext?.isActive === false
                  ? "No"
                  : userContext?.isActive === true
                  ? "Yes"
                  : "-"}
              </strong>
            </div>

            {showExitButton && (
              <button className="exit-btn" onClick={handleExitAuction}>
                End my auction (I have {userSquadSize} players)
              </button>
            )}
          </div>

          {/* Admin quick controls – only visible for admins */}
          {isAdmin && (
            <div className="auction-admin-mini">
              <h3>Admin quick controls</h3>
              <button className="admin-btn" onClick={handleAdminCloseRound}>
                Close current round
              </button>
              <button className="admin-btn" onClick={handleAdminNextPlayer}>
                Next player
              </button>
            </div>
          )}
        </div>
      </div>

      {loading && (
        <div className="auction-room-alert info" style={{ marginTop: 12 }}>
          Loading live auction data...
        </div>
      )}
    </div>
  );
};

export default AuctionRoom;
