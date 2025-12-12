// src/components/AuctionList.js
// Lists all auctions + allows Join + Admin Create

import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  fetchAuctionSessions,
  createAuctionSession,
  registerAsParticipant,
  getCurrentUserId,
} from "../services/auctionApi";

import "./AuctionList.css";

const AuctionList = () => {
  const navigate = useNavigate();
  const userId = getCurrentUserId();
  const isAdmin = localStorage.getItem("isAdmin") === "true";

  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [newAuctionName, setNewAuctionName] = useState("");

  const [error, setError] = useState("");
  const [info, setInfo] = useState("");

  // ------------------------------------------------------
  // LOAD ALL SESSIONS
  // ------------------------------------------------------
  const loadSessions = async () => {
    try {
      setLoading(true);
      const list = await fetchAuctionSessions();
      setSessions(list || []);
      setError("");
    } catch (err) {
      console.error("Failed to load sessions:", err);
      setError("Unable to load auction sessions.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSessions();
  }, []);

  // ------------------------------------------------------
  // CREATE AUCTION (Admin)
  // ------------------------------------------------------
  const handleCreate = async () => {
    if (!newAuctionName.trim()) {
      setError("Auction Name required.");
      return;
    }

    try {
      setCreating(true);
      const payload = {
        name: newAuctionName.trim(),
      };
      const res = await createAuctionSession(payload);
      setInfo("Auction created successfully!");

      setNewAuctionName("");
      loadSessions();
    } catch (err) {
      console.error("Create error:", err);
      setError("Failed to create auction.");
    } finally {
      setCreating(false);
    }
  };

  // ------------------------------------------------------
  // JOIN AUCTION
  // ------------------------------------------------------
  const handleJoin = async (auctionId) => {
    try {
      await registerAsParticipant(auctionId, userId);
      navigate(`/auction/${auctionId}`);
    } catch (err) {
      console.error("Join error:", err);
      setError("Unable to join this auction.");
    }
  };

  // ------------------------------------------------------
  // UI
  // ------------------------------------------------------
  return (
    <div className="auction-list-page">
      <h1>CrickEdge Auction Sessions</h1>

      {error && <div className="alert error">{error}</div>}
      {info && <div className="alert info">{info}</div>}

      {/* ---------------- CREATE AUCTION (ADMIN ONLY) ---------------- */}
      {isAdmin && (
        <div className="create-box">
          <input
            type="text"
            placeholder="Auction Name"
            value={newAuctionName}
            onChange={(e) => setNewAuctionName(e.target.value)}
          />
          <button disabled={creating} onClick={handleCreate}>
            {creating ? "Creating..." : "Create Auction"}
          </button>
        </div>
      )}

      {/* ---------------- SESSION LIST ---------------- */}
      {loading ? (
        <div className="loading">Loading sessions…</div>
      ) : sessions.length === 0 ? (
        <div className="empty">No auction sessions created yet.</div>
      ) : (
        <div className="session-grid">
          {sessions.map((s) => (
            <div key={s.auction_id} className="session-card">
              <h3>{s.name}</h3>
              <p>Status: {s.status}</p>

              <div className="session-actions">
                <button onClick={() => handleJoin(s.auction_id)}>
                  Join / Re-Join
                </button>

                <button onClick={() => navigate(`/auction/${s.auction_id}`)}>
                  Enter Room
                </button>

                {isAdmin && (
                  <button
                    onClick={() =>
                      navigate(`/auction/${s.auction_id}/admin`)
                    }
                  >
                    Admin Console
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AuctionList;
