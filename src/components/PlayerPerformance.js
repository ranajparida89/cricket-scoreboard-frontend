// ✅ src/components/PlayerPerformance.js — FORM ONLY (fixed)
// - Casts player_id and numeric fields correctly
// - Works whether your /players API returns { id } or { player_id }
// - Shows helpful API error messages in toasts

import React, { useState, useEffect } from "react";
import axios from "axios";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "./PlayerPerformance.css";

const API_PLAYERS = "https://cricket-scoreboard-backend.onrender.com/api/players";
const API_PERF    = "https://cricket-scoreboard-backend.onrender.com/api/player-performance";

export default function PlayerPerformance() {
  const [players, setPlayers] = useState([]);
  const [teams, setTeams]     = useState([]);
  const [loading, setLoading] = useState(true);

  const [form, setForm] = useState({
    match_name: "",
    player_id: "",
    team_name: "",
    match_type: "ODI",
    against_team: "",
    run_scored: 0,
    balls_faced: 0,
    wickets_taken: 0,
    runs_given: 0,
    fifties: 0,
    hundreds: 0,
    dismissed: "Out", // kept for UI; backend doesn’t store it yet
  });

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const res = await axios.get(API_PLAYERS);
        const list = Array.isArray(res.data) ? res.data : [];
        setPlayers(list);

        // derive teams from players
        const uniq = [...new Set(list.map((p) => p.team_name).filter(Boolean))];
        setTeams(uniq);
      } catch (err) {
        console.error("❌ Error fetching players:", err);
        toast.error("Failed to load players.");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // ---------- helpers ----------
  const isFilled = (value) =>
    value !== "" && value !== null && (typeof value === "string" ? value.trim() !== "" : true);

  const handleTeamNameChange = (team_name) => {
    if (team_name === form.against_team) {
      toast.error("Same team names are not allowed.");
      setForm({ ...form, team_name, against_team: "" });
    } else {
      setForm({ ...form, team_name });
    }
  };

  const handleAgainstTeamChange = (against_team) => {
    if (against_team === form.team_name) {
      toast.error("Same team names are not allowed.");
      setForm({ ...form, against_team: "" });
    } else {
      setForm({ ...form, against_team });
    }
  };

  const handleNumberChange = (e, key) => {
    let value = e.target.value;

    if (value === "") {
      setForm((f) => ({ ...f, [key]: "" }));
      return;
    }
    if (value.includes(".")) {
      if (key === "balls_faced") {
        toast.error("Please enter a whole number for Balls Faced.");
      } else if (["wickets_taken", "runs_given", "fifties", "hundreds", "run_scored"].includes(key)) {
        toast.error("Only whole numbers are allowed.");
      }
      return;
    }

    const intValue = Number(value);
    if (Number.isNaN(intValue) || intValue < 0) return;

    if (key === "wickets_taken" && (form.match_type === "ODI" || form.match_type === "T20") && intValue > 10) {
      toast.error("Maximum 10 wickets are allowed in a limited-overs match.");
      return;
    }
    setForm((f) => ({ ...f, [key]: intValue }));
  };

  const resetForm = () => {
    setForm({
      match_name: "",
      player_id: "",
      team_name: "",
      match_type: "ODI",
      against_team: "",
      run_scored: 0,
      balls_faced: 0,
      wickets_taken: 0,
      runs_given: 0,
      fifties: 0,
      hundreds: 0,
      dismissed: "Out",
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.player_id || !form.team_name || !form.match_type || !form.against_team) {
      toast.error("⚠️ All fields are required!");
      return;
    }
    if (!form.match_name.trim()) {
      toast.error("⚠️ Please enter the Match Name.");
      return;
    }
    if (!window.confirm("Are you sure you want to submit this performance?")) return;

    // Build clean payload (cast numbers explicitly)
    const payload = {
      match_name: form.match_name.trim(),
      player_id: Number(form.player_id),
      team_name: form.team_name.trim(),
      match_type: form.match_type,
      against_team: form.against_team.trim(),
      run_scored: Number(form.run_scored) || 0,
      balls_faced: Number(form.balls_faced) || 0,
      wickets_taken: Number(form.wickets_taken) || 0,
      runs_given: Number(form.runs_given) || 0,
      fifties: Number(form.fifties) || 0,
      hundreds: Number(form.hundreds) || 0,
    };

    try {
      // Debug while testing
      console.log("POST /player-performance payload:", payload);

      await axios.post(API_PERF, payload, {
        headers: { "Content-Type": "application/json" },
      });
      toast.success("✅ Player performance added successfully!");
      resetForm();
    } catch (err) {
      console.error("❌ Error submitting performance:", err);
      const msg = err?.response?.data?.message || "❌ Failed to add player performance.";
      toast.error(msg);
    }
  };

  if (loading) return <div className="text-center text-light mt-5">⏳ Loading Players...</div>;

  return (
    <div className="container mt-4 text-white">
      <ToastContainer position="top-center" />
      <div className="performance-card">
        <h3>📊 Add Player Performance</h3>

        <form onSubmit={handleSubmit} className="mt-3">
          {/* Match Name */}
          <div className="mb-3">
            <label htmlFor="matchName" className="form-label text-light">🏟️ Match Name</label>
            <input
              id="matchName"
              type="text"
              className={`form-control ${isFilled(form.match_name) ? "field-filled" : ""}`}
              placeholder="Enter match name (e.g., Asia Cup Final)"
              value={form.match_name}
              onChange={(e) => setForm({ ...form, match_name: e.target.value })}
              required
            />
          </div>

          {/* Player */}
          <div className="mb-2">
            <label>Player Name</label>
            <select
              className={`form-select ${isFilled(form.player_id) ? "field-filled" : ""}`}
              value={form.player_id}
              onChange={(e) => setForm({ ...form, player_id: Number(e.target.value) })} // cast to number
              required
            >
              <option value="">-- Select Player --</option>
              {players.map((p) => (
                <option key={p.id ?? p.player_id} value={p.id ?? p.player_id}>
                  {p.player_name}
                </option>
              ))}
            </select>
          </div>

          {/* Team */}
          <div className="mb-2">
            <label>Team Name</label>
            <select
              className={`form-select ${isFilled(form.team_name) ? "field-filled" : ""}`}
              value={form.team_name}
              onChange={(e) => handleTeamNameChange(e.target.value)}
              required
            >
              <option value="">-- Select Team --</option>
              {teams.map((t, i) => (
                <option key={i} value={t}>{t}</option>
              ))}
            </select>
          </div>

          {/* Match Type */}
          <div className="mb-2">
            <label>Match Type</label>
            <select
              className={`form-select ${isFilled(form.match_type) ? "field-filled" : ""}`}
              value={form.match_type}
              onChange={(e) => setForm({ ...form, match_type: e.target.value })}
              required
            >
              <option value="ODI">ODI</option>
              <option value="T20">T20</option>
              <option value="Test">Test</option>
            </select>
          </div>

          {/* Against Team */}
          <div className="mb-2">
            <label>Against Team</label>
            <select
              className={`form-select ${isFilled(form.against_team) ? "field-filled" : ""}`}
              value={form.against_team}
              onChange={(e) => handleAgainstTeamChange(e.target.value)}
              required
            >
              <option value="">-- Select Team --</option>
              {teams.map((t, i) =>
                t !== form.team_name ? (
                  <option key={i} value={t}>{t}</option>
                ) : null
              )}
            </select>
          </div>

          {/* Performance inputs */}
          <div className="row">
            {[
              { label: "Runs Scored", key: "run_scored" },
              { label: "Balls Faced", key: "balls_faced" },
              { label: "Wickets Taken", key: "wickets_taken" },
              { label: "Runs Given", key: "runs_given" },
              { label: "Fifties", key: "fifties" },
              { label: "Hundreds", key: "hundreds" },
            ].map((f) => (
              <div className="col-md-4 mb-2" key={f.key}>
                <label>{f.label}</label>
                <input
                  type="number"
                  step="1"
                  min="0"
                  className={`form-control ${isFilled(form[f.key]) ? "field-filled" : ""}`}
                  value={form[f.key]}
                  onChange={(e) => handleNumberChange(e, f.key)}
                  required
                />
              </div>
            ))}

            <div className="col-md-4 mb-2">
              <label>Dismissed Status</label>
              <select
                className={`form-select ${isFilled(form.dismissed) ? "field-filled" : ""}`}
                value={form.dismissed}
                onChange={(e) => setForm({ ...form, dismissed: e.target.value })}
                required
              >
                <option value="">-- Select Status --</option>
                <option value="Out">Out</option>
                <option value="Not Out">Not Out</option>
              </select>
            </div>
          </div>

          <div className="d-flex justify-content-end">
            <button type="submit" className="btn btn-success mt-3">
              ➕ Submit Performance
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
