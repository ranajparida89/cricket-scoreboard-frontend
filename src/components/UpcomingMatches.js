// ✅ src/components/AddUpcomingMatch.jsx
// Dark-themed form + golden “i” help, toast, loading spinner,
// success check + confetti (CSS-safe: no modulo inside calc()).

import React, { useMemo, useState } from "react";
import { createUpcomingMatch } from "../services/api";
import { useAuth } from "../services/auth";
import { FaInfo } from "react-icons/fa";
import "./AddUpcomingMatch.css";

const TEAMS = [
  "India","Australia","England","Pakistan","New Zealand","South Africa",
  "Sri Lanka","Bangladesh","Afghanistan","West Indies","Ireland",
  "Netherlands","Zimbabwe","Scotland","Namibia","UAE","USA"
];

const AddUpcomingMatch = ({ isAdmin = true }) => {
  const { currentUser } = useAuth();

  // ---- form state ----
  const [form, setForm] = useState({
    match_name: "",
    match_type: "ODI",         // "ODI" | "T20" | "Test"
    team_1: "",
    team_2: "",
    team_playing: "",          // derived, editable
    match_date: "",            // YYYY-MM-DD
    match_time: "",            // HH:mm
    location: "",
    series_name: "",
    match_status: "Scheduled", // "Scheduled" | "Postponed" | "Cancelled"
    day_night: "Day",          // "Day" | "Night"
  });

  // ---- ui state ----
  const [submitting, setSubmitting] = useState(false);
  const [showInfo, setShowInfo] = useState(false);
  const [celebrate, setCelebrate] = useState(false);
  const [toast, setToast] = useState("");

  // keep team_playing synced by default
  const livePlaying = useMemo(() => {
    const t1 = (form.team_1 || "").trim();
    const t2 = (form.team_2 || "").trim();
    if (!t1 && !t2) return "";
    return `${t1 || "Team 1"} vs ${t2 || "Team 2"}`;
  }, [form.team_1, form.team_2]);

  const set = (k, v) => setForm((p) => ({ ...p, [k]: v }));

  // title-case helper
  const cleanTeam = (s) =>
    (s || "")
      .toString()
      .trim()
      .replace(/\s+/g, " ")
      .replace(/\b\w/g, (c) => c.toUpperCase());

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (submitting) return;

    // minimal client validation
    if (!form.match_name || !form.team_1 || !form.team_2 || !form.match_date || !form.match_time) {
      setToast("Please fill Match Name, Team 1, Team 2, Date and Time.");
      setTimeout(() => setToast(""), 2500);
      return;
    }

    const payload = {
      match_name: form.match_name.trim(),
      match_type: form.match_type, // backend accepts "ODI" | "T20" | "Test"
      team_1: cleanTeam(form.team_1),
      team_2: cleanTeam(form.team_2),
      team_playing: (form.team_playing || livePlaying).trim(),
      match_date: form.match_date,
      match_time: form.match_time,
      location: form.location.trim(),
      series_name: form.series_name.trim(),
      match_status: form.match_status,
      day_night: form.day_night,
      created_by: currentUser?.email || "system@crickedge",
    };

    try {
      setSubmitting(true);
      await createUpcomingMatch(payload);

      // success!
      setCelebrate(true);
      setToast("Match scheduled successfully 🎉");
      setTimeout(() => setToast(""), 2800);

      // reset shortly after so users see what they submitted
      setTimeout(() => {
        setForm((p) => ({
          ...p,
          match_name: "",
          team_1: "",
          team_2: "",
          team_playing: "",
          match_date: "",
          match_time: "",
          location: "",
          series_name: "",
          match_status: "Scheduled",
          day_night: "Day",
        }));
        setCelebrate(false);
      }, 1600);
    } catch (err) {
      const msg =
        err?.response?.data?.error ||
        err?.message ||
        "Failed to schedule match. Please try again.";
      setToast(msg);
      setTimeout(() => setToast(""), 3200);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="aum-wrap">
      {/* title + golden info button */}
      <div className="aum-titlebar">
        <h2 className="aum-title">➕ Schedule Upcoming Match</h2>
        <button
          type="button"
          className="aum-info-btn"
          aria-label="How this page works"
          onClick={() => setShowInfo(true)}
          title="About this page"
        >
          <FaInfo />
        </button>
      </div>

      {/* toast */}
      {toast && <div className="aum-toast">{toast}</div>}

      {/* main card */}
      <form className="aum-card" onSubmit={handleSubmit}>
        <div className="aum-grid">
          <div className="aum-field aum-col-2">
            <label>Match Name</label>
            <input
              className="aum-input"
              value={form.match_name}
              onChange={(e) => set("match_name", e.target.value)}
              placeholder="Triangular Series 2025"
            />
          </div>

          <div className="aum-field">
            <label>Format</label>
            <select
              className="aum-input"
              value={form.match_type}
              onChange={(e) => set("match_type", e.target.value)}
            >
              <option>ODI</option>
              <option>T20</option>
              <option>Test</option>
            </select>
          </div>

          <div className="aum-field">
            <label>Team 1</label>
            <input
              className="aum-input"
              list="aum-teams"
              value={form.team_1}
              onChange={(e) => set("team_1", e.target.value)}
              placeholder="India"
            />
          </div>

          <div className="aum-field">
            <label>Team 2</label>
            <input
              className="aum-input"
              list="aum-teams"
              value={form.team_2}
              onChange={(e) => set("team_2", e.target.value)}
              placeholder="Australia"
            />
          </div>

          <datalist id="aum-teams">
            {TEAMS.map((t) => (
              <option key={t} value={t} />
            ))}
          </datalist>

          <div className="aum-field aum-col-2">
            <label>Team Playing (auto)</label>
            <input
              className="aum-input"
              value={form.team_playing || livePlaying}
              onChange={(e) => set("team_playing", e.target.value)}
              placeholder="India vs Australia"
            />
          </div>

          <div className="aum-field">
            <label>Date</label>
            <input
              type="date"
              className="aum-input"
              value={form.match_date}
              onChange={(e) => set("match_date", e.target.value)}
            />
          </div>

          <div className="aum-field">
            <label>Time</label>
            <input
              type="time"
              className="aum-input"
              value={form.match_time}
              onChange={(e) => set("match_time", e.target.value)}
            />
          </div>

          <div className="aum-field aum-col-2">
            <label>Venue / Location</label>
            <input
              className="aum-input"
              value={form.location}
              onChange={(e) => set("location", e.target.value)}
              placeholder="Adelaide"
            />
          </div>

          <div className="aum-field aum-col-2">
            <label>Series Name</label>
            <input
              className="aum-input"
              value={form.series_name}
              onChange={(e) => set("series_name", e.target.value)}
              placeholder="Triangular Series 2025"
            />
          </div>

          <div className="aum-field">
            <label>Status</label>
            <select
              className="aum-input"
              value={form.match_status}
              onChange={(e) => set("match_status", e.target.value)}
            >
              <option>Scheduled</option>
              <option>Postponed</option>
              <option>Cancelled</option>
            </select>
          </div>

          <div className="aum-field">
            <label>Day/Night</label>
            <select
              className="aum-input"
              value={form.day_night}
              onChange={(e) => set("day_night", e.target.value)}
            >
              <option>Day</option>
              <option>Night</option>
            </select>
          </div>
        </div>

        <div className="aum-actions">
          <button className={`aum-btn ${submitting ? "loading" : ""}`} disabled={submitting}>
            {submitting ? "Submitting…" : "Submit"}
          </button>
        </div>

        {/* success celebration overlay */}
        {celebrate && (
          <div className="aum-celebrate" aria-live="polite">
            <div className="aum-check">
              <svg viewBox="0 0 52 52" aria-hidden="true">
                <circle className="aum-check-circle" cx="26" cy="26" r="24" />
                <path className="aum-check-mark" fill="none" d="M14 27 l8 8 l16 -16" />
              </svg>
              <div className="aum-check-text">Saved!</div>
            </div>

            {/* ⬇️ pass remainder via --slot (no modulo in CSS) */}
            <div className="aum-confetti">
              {Array.from({ length: 60 }).map((_, i) => (
                <span key={i} style={{ "--i": i, "--slot": i % 8 }} />
              ))}
            </div>
          </div>
        )}
      </form>

      {/* info modal */}
      {showInfo && (
        <div className="aum-modal" role="dialog" aria-modal="true" aria-label="How this page works">
          <div className="aum-modal-card">
            <div className="aum-modal-head">
              <h3>About “Schedule Upcoming Match”</h3>
              <button className="aum-x" onClick={() => setShowInfo(false)} aria-label="Close">×</button>
            </div>
            <ul className="aum-help">
              <li>Pick the <strong>format</strong> (ODI, T20, or Test).</li>
              <li>Enter <strong>Team 1</strong> and <strong>Team 2</strong>. “Team Playing” fills automatically.</li>
              <li>Choose the <strong>Date</strong>, <strong>Time</strong>, and <strong>Venue</strong>.</li>
              <li>Set the <strong>Status</strong> and whether it’s a <strong>Day</strong> or <strong>Night</strong> match.</li>
              <li>Click <strong>Submit</strong>. You’ll see a golden check + confetti on success.</li>
            </ul>
            <div className="aum-modal-foot">
              <button className="aum-btn ghost" onClick={() => setShowInfo(false)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AddUpcomingMatch;
