// ✅ src/components/PlayerPerformance.js
// Adds Tournament dropdown (fetched from backend) + Season Year
// NEW: 5W haul auto-badge + message field (persisted)
// 🔧 CHANGED: Season Year UX — manual entry allowed without noisy per-keystroke errors;
//             Season Year is required only when it wasn't auto-detected from Tournament/Match.

import React, { useState, useEffect } from "react";
import axios from "axios";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "./PlayerPerformance.css";

const API_BASE    = "https://cricket-scoreboard-backend.onrender.com";
const API_PLAYERS = `${API_BASE}/api/players`;
const API_PERF    = `${API_BASE}/api/player-performance`;
const API_TOURNEY = `${API_BASE}/api/tournaments`;

const YEAR_RE = /(19|20)\d{2}/;

// Try to discover the logged-in user's id from localStorage or JWT
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

// Single source of truth for stats derived from runs scored
function deriveMilestones(score) {
  const s = Number.isFinite(score) ? score : 0;
  if (s >= 50 && s < 100) return { fifties: 1, hundreds: 0 };
  if (s >= 100 && s < 200) return { fifties: 0, hundreds: 1 };
  if (s >= 200 && s < 300) return { fifties: 0, hundreds: 2 };
  if (s >= 300)           return { fifties: 0, hundreds: Math.floor(s / 100) };
  return { fifties: 0, hundreds: 0 };
}

// Build a nice default message for 5W milestone
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

  const [form, setForm] = useState({
    match_name: "",
    player_id: "",
    team_name: "",
    match_type: "ODI", // "ODI" | "T20" | "Test"
    against_team: "",
    tournament_name: "",
    season_year: "",
    run_scored: 0,
    balls_faced: 0,
    wickets_taken: 0,
    runs_given: 0,
    fifties: 0,   // derived
    hundreds: 0,  // derived
    dismissed: "Out",

    // NEW: five-wicket haul fields
    is_five_wicket_haul: false,
    bowling_milestone: ""
  });

  // ✅ NEW: track whether Season Year must be provided by user
  const [needsSeasonYear, setNeedsSeasonYear] = useState(false);

  // -- fetch players + tournaments
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

  // 💡 If user types a match name, auto-suggest tournament if it’s a substring
  useEffect(() => {
    if (!form.match_name || form.tournament_name) return;
    const lc = form.match_name.toLowerCase();
    const guess = tournaments.find((t) => lc.includes(String(t).toLowerCase()));
    if (guess) {
      const yr =
        (String(guess).match(YEAR_RE) || [])[0] ||
        (String(form.match_name).match(YEAR_RE) || [])[0] ||
        "";
      // 🔧 CHANGED: also update "needsSeasonYear" based on whether we auto-detected a year
      setForm((f) => ({ ...f, tournament_name: guess, season_year: yr }));
      setNeedsSeasonYear(!yr); // ✅ NEW
    }
  }, [form.match_name, form.tournament_name, tournaments]);

  // 🔧 CHANGED: tournament change sets year if present, and toggles requirement
  const handleTournamentChange = (name) => {
    const yr =
      (String(name).match(YEAR_RE) || [])[0] ||
      (String(form.match_name).match(YEAR_RE) || [])[0] ||
      "";
    setForm((f) => ({ ...f, tournament_name: name, season_year: yr }));
    setNeedsSeasonYear(!yr); // ✅ NEW
  };

  // 🔧 CHANGED: season year handled by dedicated handlers (no per-keystroke errors)
  const handleSeasonYearChange = (e) => {
    const v = e.target.value;
    // allow empty or up to 4 digits while typing
    if (/^\d{0,4}$/.test(v)) {
      setForm((f) => ({ ...f, season_year: v }));
    }
  };

  // ✅ NEW: validate year only on blur/submit
  const validateSeasonYear = () => {
    if (!form.season_year) return !needsSeasonYear; // ok if not required
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

    // Keep empty state (so users can clear a field)
    if (value === "") {
      setForm({ ...form, [key]: "" });
      return;
    }

    if (value.includes(".")) {
      if (key === "balls_faced") toast.error("Please enter a full number (no decimal).");
      else if (
        ["wickets_taken", "runs_given", "fifties", "hundreds", "run_scored"].includes(key) // 🔧 CHANGED: removed "season_year" from this list
      ) toast.error("Only full numbers allowed.");
      return;
    }

    const intValue = parseInt(value, 10);
    if (!Number.isInteger(intValue) || intValue < 0) return;

    if (key === "wickets_taken" && (form.match_type === "ODI" || form.match_type === "T20") && intValue > 10) {
      toast.error("Maximum 10 wickets in ODI/T20.");
      return;
    }

    // When runs change, lock-in auto milestones
    if (key === "run_scored") {
      const { fifties, hundreds } = deriveMilestones(intValue);
      setForm({ ...form, run_scored: intValue, fifties, hundreds });
      return;
    }

    // Handle wickets / runs_given interplay for 5W milestone
    if (key === "wickets_taken") {
      const next = { ...form, wickets_taken: intValue };
      const is5W = intValue >= 5;
      next.is_five_wicket_haul = is5W;

      if (is5W) {
        // Prefill or refresh message
        next.bowling_milestone = buildFiveWMessage({
          wickets_taken: intValue,
          runs_given: form.runs_given,
          against_team: form.against_team,
          match_type: form.match_type,
        });
        // Fun: one-time toast cue
        if (!form.is_five_wicket_haul) {
          toast.success("🎉 Five-wicket haul detected! Milestone added.");
        }
      } else {
        next.bowling_milestone = ""; // clear if they drop below 5
      }
      setForm(next);
      return;
    }

    if (key === "runs_given") {
      const next = { ...form, runs_given: intValue };
      // If already 5W and message looks auto, refresh with latest runs_given
      if (form.is_five_wicket_haul && /^🎯 5-?wicket haul/i.test(form.bowling_milestone || "")) {
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
      // If 5W and message looks auto, refresh with latest opponent
      if (form.is_five_wicket_haul && /^🎯 5-?wicket haul/i.test(form.bowling_milestone || "")) {
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

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Base required fields (season_year handled separately)
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
    if (needsSeasonYear && !validateSeasonYear()) return; // 🔧 CHANGED

    if (!window.confirm("Are you sure you want to submit this performance?")) return;

    const { fifties, hundreds } = deriveMilestones(Number(form.run_scored) || 0);
    const userId  = getUserIdFromClient();

    const payload = {
      ...form,
      // 🔧 CHANGED: send undefined if empty (backend can infer)
      season_year: form.season_year ? parseInt(form.season_year, 10) : undefined,
      fifties,
      hundreds,
      user_id: userId ?? undefined,
    };
    const headers = userId ? { "x-user-id": String(userId) } : {};

    try {
      await axios.post(API_PERF, payload, { headers });
      toast.success("✅ Player performance added successfully!");
      resetForm();
      setNeedsSeasonYear(false); // ✅ NEW: reset
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
      tournament_name: "",
      season_year: "",
      run_scored: 0,
      balls_faced: 0,
      wickets_taken: 0,
      runs_given: 0,
      fifties: 0,
      hundreds: 0,
      dismissed: "Out",

      is_five_wicket_haul: false,
      bowling_milestone: ""
    });
  };

  const isFilled = (value) =>
    value !== "" && value !== null && (typeof value === "string" ? value.trim() !== "" : true);

  if (loading) return <div className="text-center text-light mt-5">⏳ Loading…</div>;

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
                // 🔧 CHANGED: text + numeric keypad; validate on blur
                type="text"
                inputMode="numeric"
                pattern="\d{4}"
                maxLength={4}
                className={`form-control ${isFilled(form.season_year) ? "field-filled" : ""}`}
                value={form.season_year}
                onChange={handleSeasonYearChange}   // ✅ NEW
                onBlur={validateSeasonYear}         // ✅ NEW
                placeholder="e.g. 2025"
                required={needsSeasonYear}          // ✅ NEW
              />
              {!needsSeasonYear && (
                <small className="text-muted">Optional if tournament name already has the year.</small>
              )}
            </div>
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
              { label: "Runs Scored", key: "run_scored", disabled: false, title: "" },
              { label: "Balls Faced", key: "balls_faced", disabled: false, title: "" },
              { label: "Wickets Taken", key: "wickets_taken", disabled: false, title: "" },
              { label: "Runs Given", key: "runs_given", disabled: false, title: "" },
              // Lock: derived from runs
              { label: "Fifties", key: "fifties", disabled: true, title: "Auto-calculated from Runs Scored" },
              { label: "Hundreds", key: "hundreds", disabled: true, title: "Auto-calculated from Runs Scored" },
            ].map((f) => (
              <div className="col-md-4 mb-2" key={f.key}>
                <label>{f.label}</label>
                <input
                  type="number"
                  className={`form-control ${f.disabled ? "input-locked" : ""} ${isFilled(form[f.key]) ? "field-filled" : ""}`}
                  value={form[f.key]}
                  onChange={(e) => handleNumberChange(e, f.key)}
                  disabled={f.disabled}
                  title={f.title}
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

          {/* Five-wicket Haul badge + message */}
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
                placeholder="e.g., 🎯 5-wicket haul (5-23) vs Australia • T20"
              />
            </div>
          )}

          <div className="d-flex justify-content-end">
            <button type="submit" className="btn btn-success mt-3">➕ Submit Performance</button>
          </div>
        </form>
      </div>
    </div>
  );
}
