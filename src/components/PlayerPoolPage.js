// src/components/PlayerPoolPage.js
// Player Pool Viewer (simple version)

import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";

import {
  listPlayerPool,
  importPlayerPool,
} from "../services/auctionApi";

import "./PlayerPoolPage.css";

const PlayerPoolPage = () => {
  const { auctionId } = useParams();
  const navigate = useNavigate();

  const isAdmin = localStorage.getItem("isAdmin") === "true";

  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");
  const [info, setInfo] = useState("");

  // New player form state
  const [form, setForm] = useState({
    playerName: "",
    country: "",
    skillType: "",
    category: "",
    bidAmount: "",
  });

  // ----------------------------------------
  // LOAD PLAYERS
  // ----------------------------------------
  const loadPlayers = async () => {
    try {
      setLoading(true);
      const arr = await listPlayerPool();
      setPlayers(arr || []);
      setError("");
    } catch (err) {
      console.error("Pool load error:", err);
      setError("Failed to load player pool.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPlayers();
  }, []);

  // ----------------------------------------
  // IMPORT A SINGLE PLAYER (manual entry)
  // ----------------------------------------
  const handleAddPlayer = async () => {
    if (!isAdmin) return;

    if (!form.playerName || !form.bidAmount) {
      setError("Player name & base bid amount are required.");
      return;
    }

    const payload = [
      {
        playerName: form.playerName,
        country: form.country,
        skillType: form.skillType,
        category: form.category,
        bidAmount: Number(form.bidAmount),
      },
    ];

    try {
      setSaving(true);
      const res = await importPlayerPool(payload);
      setInfo(res.message || "Player added.");
      setForm({
        playerName: "",
        country: "",
        skillType: "",
        category: "",
        bidAmount: "",
      });
      loadPlayers();
    } catch (err) {
      console.error("Add player error:", err);
      setError("Failed to add player.");
    } finally {
      setSaving(false);
    }
  };

  // ----------------------------------------
  // RENDER
  // ----------------------------------------
  return (
    <div className="pool-page">
      <div className="pool-header">
        <h1>Player Pool</h1>

        <div className="pool-actions">
          <button onClick={() => loadPlayers()}>⟳ Refresh</button>

          <button onClick={() => navigate(`/auction/${auctionId}/admin`)}>
            ← Back to Admin
          </button>
        </div>
      </div>

      {error && <div className="notice error">{error}</div>}
      {info && <div className="notice success">{info}</div>}

      {/* --------------------- ADD PLAYER FORM --------------------- */}
      {isAdmin && (
        <div className="add-player-form">
          <h2>Add Player</h2>

          <div className="form-row">
            <label>Name</label>
            <input
              type="text"
              value={form.playerName}
              onChange={(e) =>
                setForm({ ...form, playerName: e.target.value })
              }
            />
          </div>

          <div className="form-row">
            <label>Country</label>
            <input
              type="text"
              value={form.country}
              onChange={(e) =>
                setForm({ ...form, country: e.target.value })
              }
            />
          </div>

          <div className="form-row">
            <label>Skill</label>
            <select
              value={form.skillType}
              onChange={(e) =>
                setForm({ ...form, skillType: e.target.value })
              }
            >
              <option value="">--</option>
              <option value="Batsman">Batsman</option>
              <option value="Bowler">Bowler</option>
              <option value="Allrounder">Allrounder</option>
              <option value="WicketKeeper">Wicket Keeper</option>
            </select>
          </div>

          <div className="form-row">
            <label>Category</label>
            <select
              value={form.category}
              onChange={(e) =>
                setForm({ ...form, category: e.target.value })
              }
            >
              <option value="">--</option>
              <option value="Legend">Legend</option>
              <option value="Platinum">Platinum</option>
              <option value="Gold">Gold</option>
            </select>
          </div>

          <div className="form-row">
            <label>Base Price</label>
            <input
              type="number"
              step="0.1"
              value={form.bidAmount}
              onChange={(e) =>
                setForm({ ...form, bidAmount: e.target.value })
              }
            />
          </div>

          <button
            className="add-btn"
            disabled={saving}
            onClick={handleAddPlayer}
          >
            {saving ? "Adding…" : "Add Player"}
          </button>
        </div>
      )}

      {/* --------------------- PLAYER TABLE --------------------- */}
      <div className="pool-table-wrap">
        <table className="pool-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Name</th>
              <th>Country</th>
              <th>Skill</th>
              <th>Category</th>
              <th>Base Price</th>
            </tr>
          </thead>

          <tbody>
            {players.length === 0 ? (
              <tr>
                <td colSpan="6" className="empty">
                  No players in pool.
                </td>
              </tr>
            ) : (
              players.map((p, idx) => (
                <tr key={p.pool_player_id}>
                  <td>{idx + 1}</td>
                  <td>{p.player_name}</td>
                  <td>{p.country}</td>
                  <td>{p.skill_type}</td>
                  <td>{p.category}</td>
                  <td>{p.base_bid_amount}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default PlayerPoolPage;
