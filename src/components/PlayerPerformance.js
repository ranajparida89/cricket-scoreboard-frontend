// ✅ src/components/PlayerPerformance.js
import React, { useState, useEffect } from "react";
import axios from "axios";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "./PlayerPerformance.css";

const PlayerPerformance = () => {
  const [players, setPlayers] = useState([]);
  const [teams, setTeams] = useState([]);
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
    dismissed: "Out"
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await axios.get("https://cricket-scoreboard-backend.onrender.com/api/players?user_id=${currentUser.id}");
      setPlayers(res.data);
      const teamSet = new Set(res.data.map((player) => player.team_name));
      setTeams([...teamSet]);
      setLoading(false);
    } catch (err) {
      console.error("❌ Error fetching players:", err);
      setLoading(false);
    }
  };

  // --- GPT ENHANCEMENT: Unified number field validation handler ---
  const handleNumberChange = (e, key) => {
    let value = e.target.value;

    if (value === "") {
      setForm({ ...form, [key]: "" });
      return;
    }

    if (value.includes(".")) {
      if (key === "balls_faced") {
        toast.error("Please enter full number without any dot (.)");
      } else if (
        key === "wickets_taken" ||
        key === "runs_given" ||
        key === "fifties" ||
        key === "hundreds"
      ) {
        toast.error("Ooops! Only full number allowed no number with dot.");
      }
      return;
    }

    const intValue = parseInt(value, 10);

    if (key === "balls_faced") {
      if (isNaN(intValue) || intValue < 0) return;
      setForm({ ...form, balls_faced: intValue });
      return;
    }

    if (key === "wickets_taken") {
      if (isNaN(intValue) || intValue < 0) return;
      if ((form.match_type === "ODI" || form.match_type === "T20") && intValue > 10) {
        toast.error("Maximum 10 wickets are allowed in a match");
        return;
      }
      setForm({ ...form, wickets_taken: intValue });
      return;
    }

    if (
      key === "runs_given" ||
      key === "fifties" ||
      key === "hundreds"
    ) {
      if (isNaN(intValue) || intValue < 0) return;
      setForm({ ...form, [key]: intValue });
      return;
    }

    if (key === "run_scored") {
      if (isNaN(intValue) || intValue < 0) return;
      setForm({ ...form, run_scored: intValue });
      return;
    }
  };
  // --- END GPT ENHANCEMENT ---

  // GPT ENHANCEMENT: Handle Team Name change with instant validation
  const handleTeamNameChange = (team_name) => {
    if (team_name === form.against_team) {
      toast.error("Same teams names are not allowed.");
      setForm({ ...form, team_name, against_team: "" });
    } else {
      setForm({ ...form, team_name });
    }
  };

  // GPT ENHANCEMENT: Handle Against Team change with instant validation
  const handleAgainstTeamChange = (against_team) => {
    if (against_team === form.team_name) {
      toast.error("Same teams names are not allowed.");
      setForm({ ...form, against_team: "" });
    } else {
      setForm({ ...form, against_team });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.player_id || !form.team_name || !form.match_type || !form.against_team) {
      toast.error("⚠️ All fields are required!");
      return;
    }

    if (!form.match_name.trim()) {
      alert("⚠️ Please enter the Match Name.");
      return;
    }

    if (!window.confirm("Are you sure you want to submit this performance?")) {
      return;
    }

    try {
      await axios.post("https://cricket-scoreboard-backend.onrender.com/api/player-performance", form);
      toast.success("✅ Player performance added successfully!");
      resetForm();
    } catch (err) {
      console.error("❌ Error submitting performance:", err);
      toast.error("❌ Failed to add player performance.");
    }
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
      dismissed: "Out"
    });
  };

  // GPT ENHANCEMENT: Utility to detect "filled" for highlighting fields
  const isFilled = (value) => {
    // For 0 or "0" fields, treat as filled (user typed it)
    return value !== "" && value !== null && (typeof value === "string" ? value.trim() !== "" : true);
  };

  if (loading) {
    return <div className="text-center text-light mt-5">⏳ Loading Players...</div>;
  }

  return (
    <div className="container mt-4 text-white">
      <ToastContainer position="top-center" />
      <h3>📊 Add Player Performance</h3>

      <form onSubmit={handleSubmit} className="mt-3">

        {/* ✅ Match Name Field */}
        <div className="mb-3">
          <label htmlFor="matchName" className="form-label text-light">🏟️ Match Name</label>
          <input
            type="text"
            className={`form-control ${isFilled(form.match_name) ? "field-filled" : ""}`}
            id="matchName"
            placeholder="Enter match name (e.g., Asia Cup Final)"
            value={form.match_name}
            onChange={(e) => setForm({ ...form, match_name: e.target.value })}
            required
          />
        </div>

        {/* Player Name */}
        <div className="mb-2">
          <label>Player Name</label>
          <select
            className={`form-select ${isFilled(form.player_id) ? "field-filled" : ""}`}
            value={form.player_id}
            onChange={(e) => setForm({ ...form, player_id: e.target.value })}
            required
          >
            <option value="">-- Select Player --</option>
            {players.map((player) => (
              <option key={player.id} value={player.id}>
                {player.player_name}
              </option>
            ))}
          </select>
        </div>

        {/* Team Name */}
        <div className="mb-2">
          <label>Team Name</label>
          <select
            className={`form-select ${isFilled(form.team_name) ? "field-filled" : ""}`}
            value={form.team_name}
            onChange={(e) => handleTeamNameChange(e.target.value)}
            required
          >
            <option value="">-- Select Team --</option>
            {teams.map((team, index) => (
              <option key={index} value={team}>{team}</option>
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

        {/* Against Team (Dropdown Only) */}
        <div className="mb-2">
          <label>Against Team</label>
          <select
            className={`form-select ${isFilled(form.against_team) ? "field-filled" : ""}`}
            value={form.against_team}
            onChange={(e) => handleAgainstTeamChange(e.target.value)}
            required
          >
            <option value="">-- Select Team --</option>
            {teams.map((team, index) =>
              team !== form.team_name ? (
                <option key={index} value={team}>{team}</option>
              ) : null
            )}
          </select>
        </div>

        {/* Performance Inputs */}
        <div className="row">
          {[
            { label: "Runs Scored", key: "run_scored" },
            { label: "Ball Faced", key: "balls_faced" },
            { label: "Wickets Taken", key: "wickets_taken" },
            { label: "Runs Given", key: "runs_given" },
            { label: "Fifties", key: "fifties" },
            { label: "Hundreds", key: "hundreds" },
          ].map((field) => (
            <div className="col-md-4 mb-2" key={field.key}>
              <label>{field.label}</label>
              <input
                type="number"
                className={`form-control ${isFilled(form[field.key]) ? "field-filled" : ""}`}
                value={form[field.key]}
                onChange={(e) => handleNumberChange(e, field.key)}
                required
              />
            </div>
          ))}

          {/* Dismissed Status */}
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

        {/* Submit Button */}
        <div className="d-flex justify-content-end">
          <button type="submit" className="btn btn-success mt-3">
            ➕ Submit Performance
          </button>
        </div>
      </form>
    </div>
  );
};

export default PlayerPerformance;
