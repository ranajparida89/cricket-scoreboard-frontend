// src/components/CreateAuction.js
// Dedicated page for Admin to create a full auction session

import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { createAuctionSession } from "../services/auctionApi";

import "./CreateAuction.css";

const CreateAuction = () => {
  const navigate = useNavigate();
  const isAdmin = localStorage.getItem("isAdmin") === "true";

  const [name, setName] = useState("");
  const [maxSquad, setMaxSquad] = useState(13);
  const [wallet, setWallet] = useState(120);
  const [timer, setTimer] = useState(30);
  const [increment, setIncrement] = useState(0.5);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // ----------------------------------------------------------------
  // Not Admin → Restrict Page
  // ----------------------------------------------------------------
  if (!isAdmin) {
    return (
      <div className="create-auction-page">
        <h1>Create Auction</h1>
        <div className="alert error">Only Admin can create auctions.</div>
        <button onClick={() => navigate("/auction")}>← Back</button>
      </div>
    );
  }

  // ----------------------------------------------------------------
  // Handle Create
  // ----------------------------------------------------------------
  const handleCreate = async () => {
    if (!name.trim()) {
      setError("Auction Name is required.");
      return;
    }

    setError("");
    setSuccess("");
    setLoading(true);

    try {
      const payload = {
        name,
        maxSquadSize: Number(maxSquad),
        initialWalletAmount: Number(wallet),
        bidTimerSeconds: Number(timer),
        minBidIncrement: Number(increment),
      };

      const res = await createAuctionSession(payload);
      setSuccess("Auction created successfully!");

      // After creation redirect to AuctionList
      setTimeout(() => navigate("/auction"), 1200);
    } catch (err) {
      console.error("Create auction error:", err);
      setError("Failed to create auction.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="create-auction-page">
      <h1>Create New Auction</h1>

      {error && <div className="alert error">{error}</div>}
      {success && <div className="alert success">{success}</div>}

      <div className="form-box">
        <label>Auction Name</label>
        <input
          type="text"
          placeholder="Enter auction name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />

        <label>Max Squad Size</label>
        <input
          type="number"
          value={maxSquad}
          onChange={(e) => setMaxSquad(e.target.value)}
          min="1"
        />

        <label>Initial Wallet Amount (cr)</label>
        <input
          type="number"
          value={wallet}
          onChange={(e) => setWallet(e.target.value)}
          min="1"
          step="0.1"
        />

        <label>Bid Timer (seconds)</label>
        <input
          type="number"
          value={timer}
          onChange={(e) => setTimer(e.target.value)}
          min="5"
        />

        <label>Minimum Bid Increment (cr)</label>
        <input
          type="number"
          value={increment}
          onChange={(e) => setIncrement(e.target.value)}
          step="0.1"
        />

        <button className="create-btn" onClick={handleCreate} disabled={loading}>
          {loading ? "Creating..." : "Create Auction"}
        </button>

        <button className="back-btn" onClick={() => navigate("/auction")}>
          ← Back
        </button>
      </div>
    </div>
  );
};

export default CreateAuction;
