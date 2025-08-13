// ✅ src/components/PlayerPerformance.js
// - Keeps your Add Performance form intact
// - Adds a dark, leaderboard-style "Player Performance Stats" table
// - Animated top-3 rows with gold/silver/bronze glow
// - Dark themed filters with glowing select

import React, { useState, useEffect, useMemo } from "react";
import axios from "axios";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "./PlayerPerformance.css";

const API_PLAYERS = "https://cricket-scoreboard-backend.onrender.com/api/players";
const API_PERF    = "https://cricket-scoreboard-backend.onrender.com/api/player-performance";

const PlayerPerformance = () => {
  const [players, setPlayers]   = useState([]);
  const [teams, setTeams]       = useState([]);
  const [loading, setLoading]   = useState(true);

  // NEW: stats state for the fancy table
  const [stats, setStats] = useState([]);

  // filters for the fancy table
  const [qPlayer, setQPlayer] = useState("");
  const [qTeam, setQTeam]     = useState("");
  const [typeFilter, setTypeFilter] = useState("ALL");

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
    (async () => {
      try {
        setLoading(true);
        const [resPlayers, resStats] = await Promise.all([
          axios.get(API_PLAYERS),
          axios.get(API_PERF).catch(() => ({ data: [] })), // defensive
        ]);

        const p = Array.isArray(resPlayers.data) ? resPlayers.data : [];
        setPlayers(p);
        setTeams([...new Set(p.map(pl => pl.team_name))]);

        setStats(Array.isArray(resStats.data) ? resStats.data : []);
      } catch (err) {
        console.error("❌ Error fetching data:", err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // Map player id → name (for stats rows that only have player_id)
  const playerNameById = useMemo(() => {
    const m = new Map();
    for (const p of players) m.set(String(p.id), p.player_name);
    return m;
  }, [players]);

  // ---- number inputs validation (your code, unchanged) ----
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

    if (key === "runs_given" || key === "fifties" || key === "hundreds") {
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

  const handleTeamNameChange = (team_name) => {
    if (team_name === form.against_team) {
      toast.error("Same teams names are not allowed.");
      setForm({ ...form, team_name, against_team: "" });
    } else {
      setForm({ ...form, team_name });
    }
  };
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
    if (!window.confirm("Are you sure you want to submit this performance?")) return;

    try {
      await axios.post(API_PERF, form);
      toast.success("✅ Player performance added successfully!");
      resetForm();
      // refresh stats table after add
      const res = await axios.get(API_PERF).catch(() => ({ data: [] }));
      setStats(Array.isArray(res.data) ? res.data : []);
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

  const isFilled = (value) =>
    value !== "" && value !== null && (typeof value === "string" ? value.trim() !== "" : true);

  // ---------- Fancy table helpers ----------
  const strikeRate = (runs, balls) => (balls > 0 ? ((runs / balls) * 100) : 0);
  // lightweight impact score to rank rows for top-3 glow
  const impactScore = (row) => {
    const r  = Number(row.run_scored || 0);
    const b  = Number(row.balls_faced || 0);
    const wk = Number(row.wickets_taken || 0);
    const sr = strikeRate(r, b);
    return r + wk * 25 + sr / 8; // tuneable
  };

  const normalizedRows = useMemo(() => {
    // ensure each row has player_name + computed fields
    return (Array.isArray(stats) ? stats : []).map((row) => {
      const name =
        row.player_name ||
        playerNameById.get(String(row.player_id)) ||
        "Unknown";
      const r  = Number(row.run_scored || 0);
      const b  = Number(row.balls_faced || 0);
      const sr = strikeRate(r, b);
      return {
        ...row,
        player_name: name,
        _sr: sr,
        _impact: impactScore({ ...row, run_scored: r, balls_faced: b }),
      };
    });
  }, [stats, playerNameById]);

  const filtered = useMemo(() => {
    const t = typeFilter;
    const qp = qPlayer.trim().toLowerCase();
    const qt = qTeam.trim().toLowerCase();
    return normalizedRows.filter((r) => {
      const typeOK = t === "ALL" || String(r.match_type).toUpperCase() === t;
      const pOK = !qp || String(r.player_name).toLowerCase().includes(qp);
      const teamOK = !qt || String(r.team_name).toLowerCase().includes(qt);
      return typeOK && pOK && teamOK;
    });
  }, [normalizedRows, qPlayer, qTeam, typeFilter]);

  // figure out top-3 by impact in the current filtered view
  const top3Ids = useMemo(() => {
    const sorted = [...filtered]
      .sort((a, b) => b._impact - a._impact)
      .slice(0, 3)
      .map((r) => `${r.player_name}|${r.match_name}|${r.team_name}`);
    return new Set(sorted);
  }, [filtered]);

  if (loading) {
    return <div className="text-center text-light mt-5">⏳ Loading Players...</div>;
  }

  return (
    <div className="container mt-4 text-white">

      <ToastContainer position="top-center" />

      {/* ===== Add Player Performance (your form, wrapped for styling) ===== */}
      <div className="performance-card">
        <h3>📊 Add Player Performance</h3>

        <form onSubmit={handleSubmit} className="mt-3">
          {/* Match Name */}
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

          <div className="d-flex justify-content-end">
            <button type="submit" className="btn btn-success mt-3">➕ Submit Performance</button>
          </div>
        </form>
      </div>

      {/* ===== Player Performance Stats (new fancy panel) ===== */}
      <div className="pps-wrap">
        <div className="pps-orbs">
          <span className="orb o1"></span>
          <span className="orb o2"></span>
        </div>

        <div className="pps-card">
          <div className="pps-header">
            <h3 className="pps-title">📈 Player Performance Stats</h3>
            <p className="pps-sub">Live table with animated top-3 and gold glow</p>
          </div>

          {/* Filters */}
          <div className="pps-filters">
            <input
              className="pps-input"
              placeholder="Search Player Name"
              value={qPlayer}
              onChange={(e) => setQPlayer(e.target.value)}
            />
            <input
              className="pps-input"
              placeholder="Search Team Name"
              value={qTeam}
              onChange={(e) => setQTeam(e.target.value)}
            />
            <select
              className="pps-select"
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
            >
              <option value="ALL">All Match Types</option>
              <option value="ODI">ODI</option>
              <option value="T20">T20</option>
              <option value="TEST">Test</option>
              <option value="Test">Test</option>
            </select>
          </div>

          {/* Grid "table" */}
          <div className="pps-table">
            <div className="pps-thead">
              <div className="th">Player</div>
              <div className="th">Team</div>
              <div className="th">Type</div>
              <div className="th">Match</div>
              <div className="th">Against</div>
              <div className="th">Runs</div>
              <div className="th">Balls</div>
              <div className="th">SR</div>
              <div className="th">Wkts</div>
              <div className="th">R. Given</div>
              <div className="th">50s</div>
              <div className="th">100s</div>
              <div className="th">Dismissed</div>
            </div>

            <div className="pps-tbody">
              {filtered.length === 0 && (
                <div className="pps-empty">No matching records.</div>
              )}

              {filtered.map((r, idx) => {
                const idKey = `${r.player_name}|${r.match_name}|${r.team_name}`;
                const top =
                  top3Ids.has(idKey) ? (idx === 0 ? "gold" : idx === 1 ? "silver" : "bronze") : "";
                const sr = (r._sr || 0).toFixed(2);
                const runsDisp =
                  String(r.dismissed || "").toLowerCase().includes("not")
                    ? `${r.run_scored}*`
                    : r.run_scored;
                return (
                  <div key={idx} className={`pps-row ${top}`}>
                    <div className="td player"><span className="name">{r.player_name}</span></div>
                    <div className="td team">{r.team_name}</div>
                    <div className="td type">{String(r.match_type).toUpperCase()}</div>
                    <div className="td match">{r.match_name}</div>
                    <div className="td against">{r.against_team}</div>
                    <div className="td num">{runsDisp}</div>
                    <div className="td num">{r.balls_faced}</div>
                    <div className="td num">{sr}</div>
                    <div className="td num">{r.wickets_taken}</div>
                    <div className="td num">{r.runs_given}</div>
                    <div className="td num">{r.fifties}</div>
                    <div className="td num">{r.hundreds}</div>
                    <div className="td">{r.dismissed}</div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PlayerPerformance;
