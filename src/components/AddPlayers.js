// ✅ AddPlayers.js
// ✅ [Ranaj Parida - 2025-04-23 | Full Player Add Form with all conditional logic]
// ✅ [Updated: Now sends user_id - 2025-05-29]
// ✅ [2025-06-26 | FIXED: React Hooks error by moving hooks before admin check]
// ✅ [2025-08-19 | Normalize lineup type to TEST/ODI/T20, align batting/bowling labels, better errors]

import React, { useState } from "react";
import axios from "axios";
import { API_URL } from "../services/api";
import { useAuth } from "../services/auth"; // Auth hook import
import "./AddPlayers.css"; // optional, if you want to style

const toFormat = (v) => {
  const s = String(v || "").toUpperCase().trim();
  if (s === "ODI" || s === "T20" || s === "TEST") return s;
  // accept "Test" from legacy and coerce
  if (String(v) === "Test") return "TEST";
  return "ODI";
};

const norm = (s) => String(s || "").trim();

const AddPlayers = ({ isAdmin }) => {
  // 🔴 All hooks at the top
  const { currentUser } = useAuth();

  const [form, setForm] = useState({
    lineupType: "ODI",
    playerName: "",
    teamName: "",
    skill: "",
    battingStyle: "",
    bowlingType: "",
    isCaptain: false,
    isViceCaptain: false,
  });

  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // 🟡 Block non-admins
  if (!isAdmin) {
    return (
      <div className="container mt-5">
        <div className="alert alert-danger" style={{ fontSize: 18, marginTop: 32 }}>
          ⚠️ Only admins are allowed to add players. If you think this is a mistake, contact your administrator.
        </div>
      </div>
    );
  }

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");

    const playerName = norm(form.playerName);
    const teamName = norm(form.teamName);
    const lineupType = toFormat(form.lineupType);
    const skill = norm(form.skill);

    if (!playerName || !teamName || !skill) {
      setMessage("All required fields must be filled.");
      return;
    }

    if (!currentUser || !currentUser.id) {
      setMessage("User not logged in. Please sign in to add players.");
      return;
    }

    // Align labels with the rest of the app
    const batting_style =
      skill === "Batsman" || skill === "Wicketkeeper/Batsman"
        ? form.battingStyle || ""
        : "";

    const bowling_style_allowed =
      skill === "Bowler" || skill === "All Rounder" || skill === "Wicketkeeper/Batsman";

    const bowling_type = bowling_style_allowed ? form.bowlingType || "" : "";

    try {
      setSubmitting(true);
      const res = await axios.post(`${API_URL}/add-player`, {
        lineup_type: lineupType,                    // ✅ normalized to ODI/T20/TEST
        player_name: playerName,
        team_name: teamName,
        skill_type: skill,
        batting_style,
        bowling_type,
        is_captain: !!form.isCaptain,
        is_vice_captain: !!form.isViceCaptain,
        user_id: currentUser.id,                    // ✅ stamp user
      });

      setMessage(
        `✅ Player '${res.data.player.player_name}' added to ${res.data.player.lineup_type} squad.`
      );

      setForm({
        lineupType: "ODI",
        playerName: "",
        teamName: "",
        skill: "",
        battingStyle: "",
        bowlingType: "",
        isCaptain: false,
        isViceCaptain: false,
      });
    } catch (err) {
      const status = err?.response?.status;
      if (status === 409) {
        setMessage("⚠️ Player already exists in this team & format.");
      } else {
        setMessage("❌ Failed to add player: " + (err.response?.data?.error || "Server error"));
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="container mt-5 text-white">
      <div className="card bg-dark p-4 shadow">
        <h2 className="text-center text-info mb-3">🏏 Add Player to Squad (Max 15)</h2>
        {message && <div className="alert alert-info">{message}</div>}

        <form onSubmit={handleSubmit}>
          {/* Lineup Type */}
          <label>🎯 Lineup Type *</label>
          <select
            className="form-select mb-3"
            name="lineupType"
            value={toFormat(form.lineupType)}
            onChange={handleChange}
          >
            <option value="ODI">ODI</option>
            <option value="T20">T20</option>
            <option value="TEST">TEST</option>
          </select>

          {/* Player Name */}
          <label>👤 Player Name *</label>
          <input
            className="form-control mb-3"
            name="playerName"
            value={form.playerName}
            onChange={handleChange}
            placeholder="e.g., Rohit Sharma"
            required
          />

          {/* Team Name */}
          <label>🧢 Team Name *</label>
          <input
            className="form-control mb-3"
            name="teamName"
            value={form.teamName}
            onChange={handleChange}
            placeholder="e.g., India"
            required
          />

          {/* Player Skill */}
          <label>🎽 Skill Type *</label>
          <select
            className="form-select mb-3"
            name="skill"
            value={form.skill}
            onChange={handleChange}
            required
          >
            <option value="">-- Select Skill --</option>
            <option value="Batsman">Batsman</option>
            <option value="Bowler">Bowler</option>
            <option value="All Rounder">All Rounder</option>
            <option value="Wicketkeeper/Batsman">Wicketkeeper/Batsman</option>
          </select>

          {/* Batting Style (Batsman / WK-B) */}
          {(form.skill === "Batsman" || form.skill === "Wicketkeeper/Batsman") && (
            <>
              <label>🏏 Batting Style</label>
              <select
                className="form-select mb-3"
                name="battingStyle"
                value={form.battingStyle}
                onChange={handleChange}
              >
                <option value="">-- Select --</option>
                <option>Right-hand Bat</option>
                <option>Left-hand Bat</option>
              </select>
            </>
          )}

          {/* Bowling Type (Bowler / AR / WK-B optional) */}
          {(form.skill === "Bowler" ||
            form.skill === "All Rounder" ||
            form.skill === "Wicketkeeper/Batsman") && (
            <>
              <label>🎯 Bowling Type</label>
              <select
                className="form-select mb-3"
                name="bowlingType"
                value={form.bowlingType}
                onChange={handleChange}
              >
                <option value="">-- Select --</option>
                <option>Fast</option>
                <option>Medium Fast</option>
                <option>Off Spin</option>
                <option>Leg Spin</option>
                <option>Left-arm Orthodox</option>
                <option>Left-arm Wrist Spin</option>
              </select>
            </>
          )}

          {/* Captain / Vice Captain */}
          <div className="form-check mb-2">
            <input
              type="checkbox"
              className="form-check-input"
              name="isCaptain"
              checked={form.isCaptain}
              onChange={handleChange}
            />
            <label className="form-check-label">Captain</label>
          </div>

          <div className="form-check mb-4">
            <input
              type="checkbox"
              className="form-check-input"
              name="isViceCaptain"
              checked={form.isViceCaptain}
              onChange={handleChange}
            />
            <label className="form-check-label">Vice Captain</label>
          </div>

          {/* Submit */}
          <button type="submit" className="btn btn-success" disabled={submitting}>
            {submitting ? "Submitting…" : "➕ Submit Player"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default AddPlayers;
