// src/components/AuctionRoom.js

import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  fetchLiveState,
  placeBid,
  fetchMyAuctionPlayers,
  getCurrentUserId,
} from "../services/auctionApi";
import "./AuctionRoom.css";

const AuctionRoom = () => {
  const { auctionId } = useParams();
  const navigate = useNavigate();
  const userId = getCurrentUserId();

  const [auction, setAuction] = useState(null);
  const [livePlayer, setLivePlayer] = useState(null);
  const [userContext, setUserContext] = useState(null);
  const [mySquad, setMySquad] = useState(null);

  const [bidAmount, setBidAmount] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");

  const loadState = async () => {
    if (!auctionId) return;
    setError("");
    try {
      const live = await fetchLiveState(auctionId, userId);
      setAuction(live.auction || null);
      setLivePlayer(live.livePlayer || null);
      setUserContext(live.userContext || null);
    } catch (e) {
      console.error("Error loading live state:", e);
      const msg =
        e?.response?.data?.error ||
        e?.message ||
        "Failed to load live auction state.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const loadMySquad = async () => {
    if (!auctionId || !userId) return;
    try {
      const data = await fetchMyAuctionPlayers(auctionId, userId);
      setMySquad(data);
    } catch (e) {
      console.error("Error loading my squad:", e);
      // non-blocking
    }
  };

  useEffect(() => {
    loadState();
    const id = setInterval(loadState, 4000); // poll every 4s
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [auctionId, userId]);

  useEffect(() => {
    loadMySquad();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [auctionId, userId]);

  const handleBid = async (delta) => {
    if (!livePlayer || !auction || !userContext) return;
    const base =
      livePlayer.lastHighestBidAmount != null
        ? Number(livePlayer.lastHighestBidAmount)
        : Number(livePlayer.baseBidAmount);
    const minInc = Number(auction.minBidIncrement || 0.5);
    const suggested = +(base + minInc * delta).toFixed(2);

    setBidAmount(String(suggested));
  };

  const submitBid = async (e) => {
    e.preventDefault();
    if (!livePlayer || !auction || !userContext) return;

    const amount = parseFloat(bidAmount);
    if (!Number.isFinite(amount) || amount <= 0) {
      setError("Please enter a valid bid amount.");
      return;
    }

    setBusy(true);
    setError("");
    setInfo("");
    try {
      await placeBid(auctionId, {
        userId,
        sessionPlayerId: livePlayer.sessionPlayerId,
        bidAmount: amount,
      });
      setInfo("Bid accepted.");
      await loadState();
      await loadMySquad();
    } catch (e) {
      console.error("Error placing bid:", e);
      const msg =
        e?.response?.data?.error || e?.message || "Failed to place bid.";
      setError(msg);
    } finally {
      setBusy(false);
    }
  };

  const canBid =
    auction?.status === "RUNNING" && userContext?.canBid && !!livePlayer;

  return (
    <div className="auction-room-page">
      <div className="auction-room-header">
        <h1>CrickEdge Auction Room</h1>
        {auction && (
          <div className="auction-room-meta">
            <span className={`status-pill status-${auction.status}`}>
              {auction.status}
            </span>
            <span>Max Squad: {auction.maxSquadSize}</span>
            <span>Wallet: {auction.initialWalletAmount} cr</span>
          </div>
        )}
        <button
          className="btn-lobby-link"
          onClick={() => navigate("/auction")}
        >
          ← Back to Lobby
        </button>
      </div>

      {error && <div className="auction-room-alert error">{error}</div>}
      {info && <div className="auction-room-alert info">{info}</div>}

      {loading ? (
        <div className="auction-room-loading">Loading auction…</div>
      ) : (
        <div className="auction-room-layout">
          {/* Live player + bid area */}
          <div className="auction-room-main">
            <h2>Live Player</h2>
            {livePlayer ? (
              <div className="live-player-card participant-view">
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

                <form className="bid-form" onSubmit={submitBid}>
                  <div className="wallet-line">
                    Wallet:{" "}
                    <strong>
                      {userContext?.walletBalance != null
                        ? `${userContext.walletBalance} cr`
                        : "—"}
                    </strong>{" "}
                    • Squad:{" "}
                    <strong>{userContext?.currentSquadSize ?? 0}</strong>
                  </div>

                  <div className="bid-input-row">
                    <input
                      type="number"
                      step="0.1"
                      value={bidAmount}
                      onChange={(e) => setBidAmount(e.target.value)}
                      placeholder="Enter your bid (cr)"
                      disabled={!canBid || busy}
                    />
                    <button
                      type="button"
                      className="btn-suggest"
                      disabled={!canBid || busy}
                      onClick={() => handleBid(1)}
                    >
                      + Min
                    </button>
                    <button
                      type="button"
                      className="btn-suggest"
                      disabled={!canBid || busy}
                      onClick={() => handleBid(2)}
                    >
                      + 2× Min
                    </button>
                    <button
                      type="submit"
                      className="btn-place-bid"
                      disabled={!canBid || busy}
                    >
                      Place Bid
                    </button>
                  </div>

                  {!canBid && (
                    <p className="bid-disabled-note">
                      You cannot bid right now (auction not running, squad full,
                      or you have exited/completed).
                    </p>
                  )}
                </form>
              </div>
            ) : (
              <div className="live-player-empty">
                No player is LIVE currently. Waiting for admin to start / move
                to next player.
              </div>
            )}
          </div>

          {/* My squad summary */}
          <div className="auction-room-sidebar">
            <h2>My Squad</h2>
            {!mySquad ? (
              <div className="empty-box">Loading your squad…</div>
            ) : mySquad.players.length === 0 ? (
              <div className="empty-box">
                You have not bought any player yet.
              </div>
            ) : (
              <>
                <div className="squad-wallet-summary">
                  <div>
                    Initial: <strong>{mySquad.wallet.initialAmount} cr</strong>
                  </div>
                  <div>
                    Spent: <strong>{mySquad.wallet.spent} cr</strong>
                  </div>
                  <div>
                    Balance:{" "}
                    <strong>{mySquad.wallet.currentBalance} cr</strong>
                  </div>
                  <div>
                    Squad size: <strong>{mySquad.squadSize}</strong> /{" "}
                    {mySquad.auction.maxSquadSize}
                  </div>
                </div>
                <div className="squad-list">
                  {mySquad.players.map((p) => (
                    <div key={p.squadPlayerId} className="squad-player-row">
                      <div className="name-line">
                        <strong>{p.playerName}</strong>
                        <span>
                          {p.playerSkillType} • {p.playerCategory}
                        </span>
                      </div>
                      <div className="price-line">
                        <span>Base {p.baseBidAmount} cr</span>
                        <span>Bought at {p.purchasePrice} cr</span>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AuctionRoom;
