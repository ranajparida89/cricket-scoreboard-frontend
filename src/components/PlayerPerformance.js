// ✅ src/components/PlayerPerformance.js
import React, { useState, useEffect } from "react";
import axios from "axios";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "./PlayerPerformance.css";

const API_PLAYERS = "https://cricket-scoreboard-backend.onrender.com/api/players";
const API_PERF    = "https://cricket-scoreboard-backend.onrender.com/api/player-performance";

// Try to discover the logged-in user's id from localStorage or JWT
function getUserIdFromClient() {
  // common localStorage keys your app might use
  const candidates = ["user", "authUser", "profile"];
  for (const key of candidates) {
    const raw = localStorage.getItem(key);
    if (!raw) continue;
    try {
      const obj = JSON.parse(raw);
      if (obj?.id) return obj.id;
      if (obj?.user?.id) return obj.user.id;
      if (obj?.user_id) return obj.user_id;
    } catch {}
  }
  // fall back to a JWT token if present
  const token =
    localStorage.getItem("token") ||
    localStorage.getItem("authToken") ||
    localStorage.getItem("access_token");
  if (token && token.split(".").length === 3) {
    try {
      const payload = JSON.parse(atob(token.split(".")[1]));
      // common id claims
      return payload.id || payload.user_id || payload.sub || null;
    } catch {}
  }
  return null;
}

const PlayerPerformance = () => {
  const [players, setPlayers] = useState([]);
  const [teams, setTeams]     = useState([]);
  const [loading, setLoading] = useState(true);

  const [form, setForm] = useState({
    match_name: "",
    player_id: "",
    team_name: "",
    match_type: "ODI",      // must be "ODI" | "T20" | "Test"
    against_team: "",
    run_scored: 0,
    balls_faced: 0,
    wickets_taken: 0,
    runs_given: 0,
    fifties: 0,
    hundreds: 0,
    dismissed: "Out"        // "Out" | "Not Out"
  });

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const res = await axios.get(API_PLAYERS);
        const list = Array.isArray(res.data) ? res.data : [];
        setPlayers(list);
        setTeams([...new Set(list.map(p => p.team_name))]);
      } catch (err) {
        console.error("❌ Error fetching players:", err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // number validation (same rules you had)
  const handleNumberChange = (e, key) => {
    let value = e.target.value;
    if (value === "") { setForm({ ...form, [key]: "" }); return; }
    if (value.includes(".")) {
      if (key === "balls_faced") toast.error("Please enter full number without any dot (.)");
      else if (["wickets_taken","runs_given","fifties","hundreds"].includes(key))
        toast.error("Ooops! Only full number allowed no number with dot.");
      return;
    }
    const intValue = parseInt(value, 10);
    if (["balls_faced","wickets_taken","runs_given","fifties","hundreds","run_scored"].includes(key)) {
      if (isNaN(intValue) || intValue < 0) return;
      if (key === "wickets_taken" && (form.match_type === "ODI" || form.match_type === "T20") && intValue > 10) {
        toast.error("Maximum 10 wickets are allowed in a match");
        return;
      }
      setForm({ ...form, [key]: intValue });
    }
  };

  const handleTeamNameChange = (team_name) => {
    if (team_name === form.against_team) {
      toast.error("Same teams names are not allowed.");
      setForm({ ...form, team_name, against_team: "" });
    } else setForm({ ...form, team_name });
  };
  const handleAgainstTeamChange = (against_team) => {
    if (against_team === form.team_name) {
      toast.error("Same teams names are not allowed.");
    } else setForm({ ...form, against_team });
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
    if (!window.confirm("Are you sure you want to submit this performance?")) return;

    // Attach user_id if we can detect it
    const userId = getUserIdFromClient();
    const payload = { ...form, user_id: userId ?? undefined };
    const headers = userId ? { "x-user-id": String(userId) } : {};

    try {
      await axios.post(API_PERF, payload, { headers });
      toast.success("✅ Player performance added successfully!");
      resetForm();
    } catch (err) {
      console.error("❌ Error submitting performance:", err?.response?.data || err.message);
      toast.error(err?.response?.data?.message || "❌ Failed to add player performance.");
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

  const isFilled = (value) =>
    value !== "" && value !== null && (typeof value === "string" ? value.trim() !== "" : true);

  if (loading) return <div className="text-center text-light mt-5">⏳ Loading Players...</div>;

  return (
    <div className="container mt-4 text-white">
      <ToastContainer position="top-center" />
      <div className="performance-card">
        <h3>📊 Add Player Performance</h3>

        <form onSubmit={handleSubmit} className="mt-3">
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

          <div className="mb-2">
            <label>Player Name</label>
            <select
              className={`form-select ${isFilled(form.player_id) ? "field-filled" : ""}`}
              value={form.player_id}
              onChange={(e) => setForm({ ...form, player_id: e.target.value })}
              required
            >
              <option value="">-- Select Player --</option>
              {players.map((p) => (
                <option key={p.id} value={p.id}>{p.player_name}</option>
              ))}
            </select>
          </div>

          <div className="mb-2">
            <label>Team Name</label>
            <select
              className={`form-select ${isFilled(form.team_name) ? "field-filled" : ""}`}
              value={form.team_name}
              onChange={(e) => handleTeamNameChange(e.target.value)}
              required
            >
              <option value="">-- Select Team --</option>
              {teams.map((t, i) => <option key={i} value={t}>{t}</option>)}
            </select>
          </div>

          <div className="mb-2">
            <label>Match Type</label>
            <select
              className={`form-select ${isFilled(form.match_type) ? "field-filled" : ""}`}
              value={form.match_type}
              onChange={(e) => setForm({ ...form, match_type: e.target.value })}
              required
            >
              {/* IMPORTANT: "Test" (not "TEST") to satisfy DB check constraint */}
              <option value="ODI">ODI</option>
              <option value="T20">T20</option>
              <option value="Test">Test</option>
            </select>
          </div>

          <div className="mb-2">
            <label>Against Team</label>
            <select
              className={`form-select ${isFilled(form.against_team) ? "field-filled" : ""}`}
              value={form.against_team}
              onChange={(e) => handleAgainstTeamChange(e.target.value)}
              required
            >
              <option value="">-- Select Team --</option>
              {teams.map((t, i) => (t !== form.team_name ? <option key={i} value={t}>{t}</option> : null))}
            </select>
          </div>

          <div className="row">
            {[
              { label: "Runs Scored", key: "run_scored" },
              { label: "Ball Faced", key: "balls_faced" },
              { label: "Wickets Taken", key: "wickets_taken" },
              { label: "Runs Given", key: "runs_given" },
              { label: "Fifties", key: "fifties" },
              { label: "Hundreds", key: "hundreds" },
            ].map((f) => (
              <div className="col-md-4 mb-2" key={f.key}>
                <label>{f.label}</label>
                <input
                  type="number"
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
            <button type="submit" className="btn btn-success mt-3">➕ Submit Performance</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PlayerPerformance;
