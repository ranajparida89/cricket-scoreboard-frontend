// ✅ AddPlayers.js
// ✅ [Ranaj Parida - 2025-04-23 | Full Player Add Form with all conditional logic]
// ✅ [Updated: Now sends user_id - 2025-05-29]

import React, { useState } from "react";
import axios from "axios";
import { API_URL } from "../services/api";

// ⬇️ ADDED: Import your auth context/hook (update if you use something else)
import { useAuth } from "../services/auth"; 

import "./AddPlayers.css"; // optional, if you want to style

const AddPlayers = ({ isAdmin }) => {   // added for admin
  // ⬇️ ADDED: Get current logged-in user (update if you use a different hook or method)
  const { currentUser } = useAuth(); 

    // Block non-admin users (THIS is the added logic)
  if (!isAdmin) {
    return (
      <div className="container mt-5">
        <div className="alert alert-danger" style={{ fontSize: 18, marginTop: 32 }}>
          ⚠️ Only admins are allowed to add players. If you think this is a mistake, contact your administrator.
        </div>
      </div>
    );
  }

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

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // ✅ Validation
    if (!form.playerName.trim() || !form.teamName.trim() || !form.skill) {
      setMessage("All required fields must be filled.");
      return;
    }

    // ✅ ADDED: Check if user is logged in
    if (!currentUser || !currentUser.id) {
      setMessage("User not logged in. Please sign in to add players.");
      return;
    }

    try {
      const res = await axios.post(`${API_URL}/add-player`, {
        lineup_type: form.lineupType,
        player_name: form.playerName.trim(),
        team_name: form.teamName.trim(),
        skill_type: form.skill,
        batting_style: form.skill === "Batsman" ? form.battingStyle : null,
        bowling_type: form.skill === "Bowler" ? form.bowlingType : null,
        is_captain: form.isCaptain,
        is_vice_captain: form.isViceCaptain,
        user_id: currentUser.id, // ✅ ADDED: send user_id to backend added "form." which was missing RCA
      });

      setMessage(
        `✅ Player '${res.data.player.player_name}' added to ${res.data.player.lineup_type} squad.`
      );

      // Reset form
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
      setMessage(
        "❌ Failed to add player: " + (err.response?.data?.error || "Server error")
      );
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
            value={form.lineupType}
            onChange={handleChange}
          >
            <option>ODI</option>
            <option>T20</option>
            <option>Test</option>
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

          {/* Batting Style (only if Batsman) */}
          {form.skill === "Batsman" && (
            <>
              <label>🏏 Batting Style</label>
              <select
                className="form-select mb-3"
                name="battingStyle"
                value={form.battingStyle}
                onChange={handleChange}
              >
                <option value="">-- Select --</option>
                <option>Right Hand</option>
                <option>Left Hand</option>
              </select>
            </>
          )}

          {/* Bowling Type (only if Bowler) */}
          {form.skill === "Bowler" && (
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
                <option>Medium</option>
                <option>Off Spin</option>
                <option>Leg Spin</option>
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
          <button type="submit" className="btn btn-success">
            ➕ Submit Player
          </button>
        </form>
      </div>
    </div>
  );
};

export default AddPlayers;
