// ✅ src/components/PlayerPerformance.js
import React, { useState, useEffect } from "react";
import axios from "axios";
import { ToastContainer, toast } from "react-toastify"; // ✅ Added
import "react-toastify/dist/ReactToastify.css"; // ✅ Added
// import "../styles/PlayerPerformance.css";
import "./PlayerPerformance.css";


const PlayerPerformance = () => {
  const [players, setPlayers] = useState([]);
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);

  const [form, setForm] = useState({
    match_name: "", // ✅ ADD HERE IN useState
    player_id: "",
    team_name: "",
    match_type: "ODI",
    against_team: "",
    run_scored: 0,
    balls_faced: 0,  // ⬅️ ADD Ball faced new implimenataion 02-May-2025
    wickets_taken: 0,
    runs_given: 0,
    fifties: 0,
    hundreds: 0,
    dismissed: 'Out'
  });
  

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await axios.get("https://cricket-scoreboard-backend.onrender.com/api/players");
      setPlayers(res.data);

      const teamSet = new Set(res.data.map((player) => player.team_name));
      setTeams([...teamSet]);

      setLoading(false);
    } catch (err) {
      console.error("❌ Error fetching players:", err);
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.player_id || !form.team_name || !form.match_type || !form.against_team) {
      toast.error("⚠️ All fields are required!");
      return;
    }
    if (!window.confirm("Are you sure you want to submit this performance?")) {
      return;
    }
                // ✅ Validate Match Name (Required Field)
            if (!form.match_name.trim()) {
              alert("⚠️ Please enter the Match Name.");
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
      match_name: "", // ✅ Add here
      player_id: "",
      team_name: "",
      match_type: "ODI",
      against_team: "",
      run_scored: 0,
      balls_faced: 0,    // ⬅️ ADD HERE in resetForm
      wickets_taken: 0,
      runs_given: 0,
      fifties: 0,
      hundreds: 0,
      dismissed: "Out"
    });
    
  };

  if (loading) {
    return <div className="text-center text-light mt-5">⏳ Loading Players...</div>;
  }

  return (
    <div className="container mt-4 text-white">
      <ToastContainer position="top-center" /> {/* ✅ Added Toast container */}

      <h3>📊 Add Player Performance</h3>
      <form onSubmit={handleSubmit} className="mt-3">
            {/* Match Name Field */}
            <div className="mb-3">
              <label htmlFor="matchName" className="form-label text-light">🏟️ Match Name</label>
              <input
                type="text"
                className="form-control"
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
            className="form-select"
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
            className="form-select"
            value={form.team_name}
            onChange={(e) => setForm({ ...form, team_name: e.target.value })}
            required
          >
            <option value="">-- Select Team --</option>
            {teams.map((team, index) => (
              <option key={index} value={team}>
                {team}
              </option>
            ))}
          </select>
        </div>

     
        {/* Match Type */}
        <div className="mb-2">
          <label>Match Type</label>
          <select
            className="form-select"
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
          <input
            type="text"
            className="form-control"
            value={form.against_team}
            onChange={(e) => setForm({ ...form, against_team: e.target.value })}
            required
          />
        </div>

        {/* Performance Inputs */}
        <div className="row">
       {/* ✅ Performance Inputs */}
<div className="row">
  {/* Performance Fields */}
  {[
    { label: "Runs Scored", key: "run_scored" },
    { label: "Ball Faced", key: "balls_faced" },  // ⬅️ ADD HERE
    { label: "Wickets Taken", key: "wickets_taken" },
    { label: "Runs Given", key: "runs_given" },
    { label: "Fifties", key: "fifties" },
    { label: "Hundreds", key: "hundreds" },
  ].map((field) => (
    <div className="col-md-4 mb-2" key={field.key}>
      <label>{field.label}</label>
      <input
        type="number"
        className="form-control"
        value={form[field.key]}
        onChange={(e) => setForm({ ...form, [field.key]: Math.max(0, e.target.value) })}
        required
      />
    </div>
  ))}

  {/* ✅ Dismissed Status Field */}
  <div className="col-md-4 mb-2">
    <label>Dismissed Status</label>
    <select
      className="form-select"
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
