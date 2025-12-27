// src/components/PlayerPerformance.js

import React, { useState, useEffect } from "react";
import axios from "axios";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "./PlayerPerformance.css";

const API_BASE    = "https://cricket-scoreboard-backend.onrender.com";
const API_PLAYERS = `${API_BASE}/api/players`;
const API_PERF    = `${API_BASE}/api/player-performance`;
const API_PERF_BULK = `${API_BASE}/api/player-performance/bulk`;
const API_TOURNEY = `${API_BASE}/api/tournaments`;

const YEAR_RE = /(19|20)\d{2}/;

function getUserIdFromClient() {
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
  const token =
    localStorage.getItem("token") ||
    localStorage.getItem("authToken") ||
    localStorage.getItem("access_token");
  if (token && token.split(".").length === 3) {
    try {
      const payload = JSON.parse(atob(token.split(".")[1]));
      return payload.id || payload.user_id || payload.sub || null;
    } catch {}
  }
  return null;
}

// extended milestone
function deriveMilestones(score) {
  const s = Number.isFinite(score) ? score : 0;
  if (s >= 200) return { fifties: 0, hundreds: Math.floor(s / 100), double_century: 1 };
  if (s >= 100 && s < 200) return { fifties: 0, hundreds: 1, double_century: 0 };
  if (s >= 50 && s < 100) return { fifties: 1, hundreds: 0, double_century: 0 };
  return { fifties: 0, hundreds: 0, double_century: 0 };
}

function buildFiveWMessage({ wickets_taken, runs_given, against_team, match_type }) {
  const wk = Number.isFinite(wickets_taken) ? wickets_taken : 0;
  const rg = Number.isFinite(runs_given) ? runs_given : 0;
  const vs = (against_team || "").trim();
  const mt = (match_type || "").trim();
  const ratio = rg ? ` (${wk}-${rg})` : ` (${wk})`;
  const vsTxt = vs ? ` vs ${vs}` : "";
  const mtTxt = mt ? ` • ${mt}` : "";
  return `🎯 5-wicket haul${ratio}${vsTxt}${mtTxt}`;
}

export default function PlayerPerformance() {
  const [players, setPlayers] = useState([]);
  const [teams, setTeams]     = useState([]);
  const [tournaments, setTournaments] = useState([]);
  const [loading, setLoading] = useState(true);
  // 🔍 Player search (used for single & bulk)
const [playerSearch, setPlayerSearch] = useState("");

  // single form
  const [form, setForm] = useState({
    match_name: "",
    player_id: "",
    team_name: "",
    match_type: "ODI",
    against_team: "",
    tournament_name: "",
    season_year: "",
    run_scored: 0,
    balls_faced: 0,
    wickets_taken: 0,
    runs_given: 0,
    fifties: 0,
    hundreds: 0,
    double_century: 0,
    dismissed: "Out",
    is_five_wicket_haul: false,
    bowling_milestone: "",
  });

  // bulk mode
  const [mode, setMode] = useState("single"); // "single" | "bulk"
  const [bulkRows, setBulkRows] = useState([
    {
      player_id: "",
      team_name: "",
      run_scored: 0,
      balls_faced: 0,
      wickets_taken: 0,
      runs_given: 0,
      dismissed: "Out",
      innings_no: 1,
    },
  ]);

  const [needsSeasonYear, setNeedsSeasonYear] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const [playersRes, tRes] = await Promise.all([
          axios.get(API_PLAYERS),
          axios.get(API_TOURNEY),
        ]);

        const list = Array.isArray(playersRes.data) ? playersRes.data : [];
        setPlayers(list);
        setTeams([...new Set(list.map((p) => p.team_name).filter(Boolean))]);

        const tourneys = Array.isArray(tRes.data) ? tRes.data : [];
        setTournaments(tourneys.filter(Boolean));
      } catch (err) {
        console.error("❌ Fetch error:", err);
        toast.error("Failed to load players/tournaments.");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // suggest tournament from match name
  useEffect(() => {
    if (!form.match_name || form.tournament_name) return;
    const lc = form.match_name.toLowerCase();
    const guess = tournaments.find((t) => lc.includes(String(t).toLowerCase()));
    if (guess) {
      const yr =
        (String(guess).match(YEAR_RE) || [])[0] ||
        (String(form.match_name).match(YEAR_RE) || [])[0] ||
        "";
      setForm((f) => ({ ...f, tournament_name: guess, season_year: yr }));
      setNeedsSeasonYear(!yr);
    }
  }, [form.match_name, form.tournament_name, tournaments]);

  const handleTournamentChange = (name) => {
    const yr =
      (String(name).match(YEAR_RE) || [])[0] ||
      (String(form.match_name).match(YEAR_RE) || [])[0] ||
      "";
    setForm((f) => ({ ...f, tournament_name: name, season_year: yr }));
    setNeedsSeasonYear(!yr);
  };

  const handleSeasonYearChange = (e) => {
    const v = e.target.value;
    if (/^\d{0,4}$/.test(v)) {
      setForm((f) => ({ ...f, season_year: v }));
    }
  };

  const validateSeasonYear = () => {
    if (!form.season_year) return !needsSeasonYear;
    if (form.season_year.length < 4) {
      toast.error("Enter a 4-digit year.");
      return false;
    }
    const yr = parseInt(form.season_year, 10);
    if (Number.isNaN(yr) || yr < 1877 || yr > 2100) {
      toast.error("Season year looks invalid (1877–2100).");
      return false;
    }
    return true;
  };

  const handleNumberChange = (e, key) => {
    let value = e.target.value;
    if (value === "") {
      setForm({ ...form, [key]: "" });
      return;
    }
    if (value.includes(".")) {
      toast.error("Only whole numbers allowed.");
      return;
    }
    const intValue = parseInt(value, 10);
    if (!Number.isInteger(intValue) || intValue < 0) return;

    if (key === "run_scored") {
      const { fifties, hundreds, double_century } = deriveMilestones(intValue);
      setForm({ ...form, run_scored: intValue, fifties, hundreds, double_century });
      return;
    }

    if (key === "wickets_taken") {
      const next = { ...form, wickets_taken: intValue };
      const is5W = intValue >= 5;
      next.is_five_wicket_haul = is5W;
      if (is5W) {
        next.bowling_milestone = buildFiveWMessage({
          wickets_taken: intValue,
          runs_given: form.runs_given,
          against_team: form.against_team,
          match_type: form.match_type,
        });
        if (!form.is_five_wicket_haul) {
          toast.success("🎉 Five-wicket haul detected! Milestone added.");
        }
      } else {
        next.bowling_milestone = "";
      }
      setForm(next);
      return;
    }

    if (key === "runs_given") {
      const next = { ...form, runs_given: intValue };
      if (form.is_five_wicket_haul) {
        next.bowling_milestone = buildFiveWMessage({
          wickets_taken: form.wickets_taken,
          runs_given: intValue,
          against_team: form.against_team,
          match_type: form.match_type,
        });
      }
      setForm(next);
      return;
    }

    setForm({ ...form, [key]: intValue });
  };

  const handleTeamNameChange = (team_name) => {
    if (team_name === form.against_team) {
      toast.error("Same team names are not allowed.");
      setForm({ ...form, team_name, against_team: "" });
    } else setForm({ ...form, team_name });
  };

  const handleAgainstTeamChange = (against_team) => {
    if (against_team === form.team_name) {
      toast.error("Same team names are not allowed.");
    } else {
      const next = { ...form, against_team };
      if (form.is_five_wicket_haul) {
        next.bowling_milestone = buildFiveWMessage({
          wickets_taken: form.wickets_taken,
          runs_given: form.runs_given,
          against_team,
          match_type: form.match_type,
        });
      }
      setForm(next);
    }
  };

  const resetForm = () => {
    setForm({
      match_name: "",
      player_id: "",
      team_name: "",
      match_type: "ODI",
      against_team: "",
      tournament_name: "",
      season_year: "",
      run_scored: 0,
      balls_faced: 0,
      wickets_taken: 0,
      runs_given: 0,
      fifties: 0,
      hundreds: 0,
      double_century: 0,
      dismissed: "Out",
      is_five_wicket_haul: false,
      bowling_milestone: "",
    });
  };

  // -------------------- submit single --------------------
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (
      !form.player_id ||
      !form.team_name ||
      !form.match_type ||
      !form.against_team ||
      !form.tournament_name
    ) {
      toast.error("⚠️ All fields are required.");
      return;
    }
    if (!form.match_name.trim()) {
      alert("⚠️ Please enter the Match Name.");
      return;
    }
    if (needsSeasonYear && !validateSeasonYear()) return;

    if (!window.confirm("Are you sure you want to submit this performance?")) return;

    const userId  = getUserIdFromClient();
    const payload = {
      ...form,
      season_year: form.season_year ? parseInt(form.season_year, 10) : undefined,
      user_id: userId ?? undefined,
    };
    const headers = userId ? { "x-user-id": String(userId) } : {};

    try {
      await axios.post(API_PERF, payload, { headers });
      toast.success("✅ Player performance added successfully!");
      resetForm();
      setNeedsSeasonYear(false);
    } catch (err) {
      console.error("❌ Error submitting performance:", err?.response?.data || err.message);
      toast.error(err?.response?.data?.message || "❌ Failed to add player performance.");
    }
  };

  // -------------------- submit bulk --------------------
  const handleBulkSubmit = async (e) => {
    e.preventDefault();

    if (!form.match_name.trim()) {
      toast.error("Match name is required.");
      return;
    }
    if (!form.tournament_name) {
      toast.error("Tournament is required.");
      return;
    }
    if (needsSeasonYear && !validateSeasonYear()) return;

    const cleanRows = bulkRows.filter(
      (r) => r.player_id && r.team_name && r.dismissed && (r.run_scored || r.wickets_taken || r.runs_given)
    );

    if (cleanRows.length === 0) {
      toast.error("Please add at least one player row.");
      return;
    }

    const userId = getUserIdFromClient();
    const headers = userId ? { "x-user-id": String(userId) } : {};

    const payload = {
      match: {
        match_name: form.match_name,
        match_type: form.match_type,
        tournament_name: form.tournament_name,
        season_year: form.season_year ? parseInt(form.season_year, 10) : undefined,
      },
      performances: cleanRows.map((r) => ({
        ...r,
        against_team: r.team_name === form.team_name ? form.against_team : form.team_name || form.against_team,
      })),
    };

    try {
      await axios.post(API_PERF_BULK, payload, { headers });
      toast.success("✅ Bulk performances added!");
      setBulkRows([
        {
          player_id: "",
          team_name: "",
          run_scored: 0,
          balls_faced: 0,
          wickets_taken: 0,
          runs_given: 0,
          dismissed: "Out",
          innings_no: 1,
        },
      ]);
    } catch (err) {
      console.error("❌ Bulk submit error:", err?.response?.data || err.message);
      toast.error(err?.response?.data?.message || "❌ Failed to add bulk performance.");
    }
  };

  const isFilled = (value) =>
    value !== "" && value !== null && (typeof value === "string" ? value.trim() !== "" : true);

  if (loading) return <div className="text-center text-light mt-5">⏳ Loading…</div>;

  return (
    <div className="container mt-4 text-white">
      <ToastContainer position="top-center" />
      <div className="performance-card">
        <div className="d-flex justify-content-between align-items-center">
          <h3>📊 Add Player Performance</h3>
          <div className="btn-group">
            <button
              type="button"
              className={`btn btn-sm ${mode === "single" ? "btn-success" : "btn-outline-success"}`}
              onClick={() => setMode("single")}
            >
              Single
            </button>
            <button
              type="button"
              className={`btn btn-sm ${mode === "bulk" ? "btn-success" : "btn-outline-success"}`}
              onClick={() => setMode("bulk")}
            >
              Bulk
            </button>
          </div>
        </div>

        {/* common match section */}
        <div className="mb-3 mt-3">
          <label htmlFor="matchName" className="form-label text-light">🏟️ Match Name</label>
          <input
            type="text"
            className={`form-control ${isFilled(form.match_name) ? "field-filled" : ""}`}
            id="matchName"
            placeholder="Enter match name (e.g., Champions Trophy 2025 League : India vs England)"
            value={form.match_name}
            onChange={(e) => setForm({ ...form, match_name: e.target.value })}
            required
          />
        </div>

        {/* Tournament + Season Year */}
        <div className="row">
          <div className="col-md-8 mb-2">
            <label>Tournament</label>
            <select
              className={`form-select ${isFilled(form.tournament_name) ? "field-filled" : ""}`}
              value={form.tournament_name}
              onChange={(e) => handleTournamentChange(e.target.value)}
              required
            >
              <option value="">-- Select Tournament --</option>
              {tournaments.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>

          <div className="col-md-4 mb-2">
            <label>Season Year</label>
            <input
              type="text"
              inputMode="numeric"
              pattern="\d{4}"
              maxLength={4}
              className={`form-control ${isFilled(form.season_year) ? "field-filled" : ""}`}
              value={form.season_year}
              onChange={handleSeasonYearChange}
              onBlur={validateSeasonYear}
              placeholder="e.g. 2025"
              required={needsSeasonYear}
            />
            {!needsSeasonYear && (
              <small className="text-muted">Optional if tournament has year.</small>
            )}
          </div>
        </div>

        {/* match type */}
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

        {/* team vs team (only needed once) */}
        <div className="mb-2">
          <label>Your Team (main)</label>
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

        <div className="mb-4">
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

        {mode === "single" ? (
          <form onSubmit={handleSubmit}>
                          <div className="mb-2">
                <label>Player Name</label>

                {/* 🔍 Search input (mobile friendly) */}
                <input
                  type="text"
                  className="form-control mb-1"
                  placeholder="Search player..."
                  value={playerSearch}
                  onChange={(e) => setPlayerSearch(e.target.value)}
                />

                <select
                  className={`form-select ${isFilled(form.player_id) ? "field-filled" : ""}`}
                  value={form.player_id}
                  onChange={(e) => setForm({ ...form, player_id: e.target.value })}
                  required
                >
                  <option value="">-- Select Player --</option>

                  {players
                    .filter(p =>
                      p.player_name.toLowerCase().includes(playerSearch.toLowerCase())
                    )
                    .map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.player_name}
                      </option>
                    ))}
                </select>
              </div>
            <div className="row">
              {[
                { label: "Runs Scored", key: "run_scored", disabled: false },
                { label: "Balls Faced", key: "balls_faced", disabled: false },
                { label: "Wickets Taken", key: "wickets_taken", disabled: false },
                { label: "Runs Given", key: "runs_given", disabled: false },
                { label: "Fifties", key: "fifties", disabled: true },
                { label: "Hundreds", key: "hundreds", disabled: true },
                { label: "Double Century", key: "double_century", disabled: true },
              ].map((f) => (
                <div className="col-md-4 mb-2" key={f.key}>
                  <label>{f.label}</label>
                  <input
                    type="number"
                    className={`form-control ${f.disabled ? "input-locked" : ""} ${isFilled(form[f.key]) ? "field-filled" : ""}`}
                    value={form[f.key]}
                    onChange={(e) => handleNumberChange(e, f.key)}
                    disabled={f.disabled}
                    required={!f.disabled}
                  />
                  {f.disabled && <small className="text-muted">Auto</small>}
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

            {form.is_five_wicket_haul && (
              <div className="fivew-wrap">
                <div className="fivew-badge">
                  <span className="fivew-icon">🏏</span>
                  <div className="fivew-text">
                    <div className="fivew-title">Five-wicket Haul</div>
                    <div className="fivew-sub">Milestone detected from wickets taken.</div>
                  </div>
                </div>
                <label className="mt-2">Milestone Message (editable)</label>
                <input
                  type="text"
                  className={`form-control field-filled fivew-input`}
                  value={form.bowling_milestone}
                  onChange={(e) => setForm({ ...form, bowling_milestone: e.target.value })}
                />
              </div>
            )}

            <div className="d-flex justify-content-end">
              <button type="submit" className="btn btn-success mt-3">➕ Submit Performance</button>
            </div>
          </form>
        ) : (
          // ---------------- bulk form ----------------
          <form onSubmit={handleBulkSubmit}>
            <div className="bulk-table-wrap">
              {bulkRows.map((row, idx) => (
                <div key={idx} className="bulk-row mb-2 p-2 rounded" style={{ background: "rgba(255,255,255,0.02)" }}>
                  <div className="row">
                    <div className="col-md-3 mb-2">
                      <label>Player</label>

                      {/* 🔍 Search input – same pattern as single mode */}
                      <input
                        type="text"
                        className="form-control mb-1"
                        placeholder="Search player..."
                        value={playerSearch}
                        onChange={(e) => setPlayerSearch(e.target.value)}
                      />

                      <select
                        className="form-select"
                        value={row.player_id}
                        onChange={(e) => {
                          const copy = [...bulkRows];
                          copy[idx].player_id = e.target.value;
                          setBulkRows(copy);
                        }}
                      >
                        <option value="">-- Select --</option>

                        {players
                          .filter(p =>
                            p.player_name.toLowerCase().includes(playerSearch.toLowerCase())
                          )
                          .map((p) => (
                            <option key={p.id} value={p.id}>
                              {p.player_name}
                            </option>
                          ))}
                      </select>
                    </div>
                    <div className="col-md-2 mb-2">
                      <label>Team</label>
                      <select
                        className="form-select"
                        value={row.team_name}
                        onChange={(e) => {
                          const copy = [...bulkRows];
                          copy[idx].team_name = e.target.value;
                          setBulkRows(copy);
                        }}
                      >
                        <option value="">-- Team --</option>
                        {teams.map((t, i) => (
                          <option key={i} value={t}>{t}</option>
                        ))}
                      </select>
                    </div>
                    <div className="col-md-2 mb-2">
                      <label>Runs</label>
                      <input
                        type="number"
                        className="form-control"
                        value={row.run_scored}
                        onChange={(e) => {
                          const copy = [...bulkRows];
                          copy[idx].run_scored = parseInt(e.target.value || "0", 10);
                          setBulkRows(copy);
                        }}
                      />
                    </div>
                    <div className="col-md-2 mb-2">
                      <label>Balls</label>
                      <input
                        type="number"
                        className="form-control"
                        value={row.balls_faced}
                        onChange={(e) => {
                          const copy = [...bulkRows];
                          copy[idx].balls_faced = parseInt(e.target.value || "0", 10);
                          setBulkRows(copy);
                        }}
                      />
                    </div>
                    <div className="col-md-1 mb-2">
                      <label>Wkts</label>
                      <input
                        type="number"
                        className="form-control"
                        value={row.wickets_taken}
                        onChange={(e) => {
                          const copy = [...bulkRows];
                          copy[idx].wickets_taken = parseInt(e.target.value || "0", 10);
                          setBulkRows(copy);
                        }}
                      />
                    </div>
                    <div className="col-md-2 mb-2">
                      <label>Runs Given</label>
                      <input
                        type="number"
                        className="form-control"
                        value={row.runs_given}
                        onChange={(e) => {
                          const copy = [...bulkRows];
                          copy[idx].runs_given = parseInt(e.target.value || "0", 10);
                          setBulkRows(copy);
                        }}
                      />
                    </div>

                    {form.match_type === "Test" && (
                      <div className="col-md-1 mb-2">
                        <label>Inns</label>
                        <input
                          type="number"
                          className="form-control"
                          value={row.innings_no}
                          onChange={(e) => {
                            const copy = [...bulkRows];
                            copy[idx].innings_no = parseInt(e.target.value || "1", 10);
                            setBulkRows(copy);
                          }}
                          min={1}
                          max={2}
                        />
                      </div>
                    )}

                    <div className="col-md-2 mb-2">
                      <label>Dismissed</label>
                      <select
                        className="form-select"
                        value={row.dismissed}
                        onChange={(e) => {
                          const copy = [...bulkRows];
                          copy[idx].dismissed = e.target.value;
                          setBulkRows(copy);
                        }}
                      >
                        <option value="Out">Out</option>
                        <option value="Not Out">Not Out</option>
                      </select>
                    </div>

                    <div className="col-md-1 d-flex align-items-end mb-2">
                      {bulkRows.length > 1 && (
                        <button
                          type="button"
                          className="btn btn-sm btn-danger"
                          onClick={() => {
                            const copy = bulkRows.filter((_, i) => i !== idx);
                            setBulkRows(copy);
                          }}
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <button
              type="button"
              className="btn btn-outline-light btn-sm mt-2"
              onClick={() =>
                setBulkRows([
                  ...bulkRows,
                  {
                    player_id: "",
                    team_name: "",
                    run_scored: 0,
                    balls_faced: 0,
                    wickets_taken: 0,
                    runs_given: 0,
                    dismissed: "Out",
                    innings_no: 1,
                  },
                ])
              }
            >
              + Add Player Row
            </button>

            <div className="d-flex justify-content-end">
              <button type="submit" className="btn btn-success mt-3">
                📥 Submit All
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
