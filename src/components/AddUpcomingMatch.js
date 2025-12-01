// ✅ src/components/AddUpcomingMatch.js
// Dark form + golden “i” help, toast, loading spinner, success check + confetti
// (the aum-* version)
// ✅ [NEW] Ongoing Tournament panel with admin-only controls + countdown

import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { createUpcomingMatch } from "../services/api";
import { useAuth } from "../services/auth";
import { FaInfo } from "react-icons/fa";
import "./AddUpcomingMatch.css";

const API_BASE = "https://cricket-scoreboard-backend.onrender.com";

// helper → convert ms → days / hh:mm:ss
const msToParts = (ms) => {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const days = Math.floor(totalSeconds / (24 * 3600));
  const hours = Math.floor((totalSeconds % (24 * 3600)) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return { days, hours, minutes, seconds };
};

const pad2 = (n) => String(n).padStart(2, "0");

const TEAMS = [
  "India",
  "Australia",
  "England",
  "Pakistan",
  "New Zealand",
  "South Africa",
  "Sri Lanka",
  "Bangladesh",
  "Afghanistan",
  "West Indies",
  "Ireland",
  "Netherlands",
  "Zimbabwe",
  "Scotland",
  "Namibia",
  "UAE",
  "USA",
];

export default function AddUpcomingMatch({ isAdmin: isAdminProp = true }) {
  const { currentUser } = useAuth();

  // ✅ admin detection (same style as other modules)
  const isAdmin =
    isAdminProp ||
    currentUser?.role === "admin" ||
    localStorage.getItem("isAdmin") === "true";

  // sanity log: confirm correct file renders
  useEffect(() => {
    console.log("AddUpcomingMatch (aum) mounted");
  }, []);

  /* -------------------------------------------------
   *  ONGOING TOURNAMENT STATE
   * ------------------------------------------------- */
  const [tourForm, setTourForm] = useState({
    name: "",
    startDate: "",
    durationDays: "",
  });
  const [tourEndDate, setTourEndDate] = useState("");
  const [tournament, setTournament] = useState(null); // data from backend
  const [timeLeftMs, setTimeLeftMs] = useState(0);
  const [tourSubmitting, setTourSubmitting] = useState(false);

  // auto-compute end date from startDate + durationDays (for display only)
  useEffect(() => {
    if (!tourForm.startDate || !tourForm.durationDays) {
      setTourEndDate("");
      return;
    }
    const days = parseInt(tourForm.durationDays, 10);
    if (!Number.isFinite(days) || days <= 0) {
      setTourEndDate("");
      return;
    }
    const d = new Date(tourForm.startDate);
    if (isNaN(d.getTime())) {
      setTourEndDate("");
      return;
    }
    d.setDate(d.getDate() + days);
    setTourEndDate(d.toISOString().slice(0, 10)); // yyyy-mm-dd
  }, [tourForm.startDate, tourForm.durationDays]);

  // fetch current running/paused tournament on mount
  useEffect(() => {
    const fetchTournament = async () => {
      try {
        const res = await axios.get(`${API_BASE}/api/tournament/ongoing`);
        const t = res.data;
        if (!t || !t.id) return;

        // normalise / derive remaining ms
        let ms = 0;
        if (t.status === "running") {
          ms = Math.max(new Date(t.end_at).getTime() - Date.now(), 0);
        } else if (t.status === "paused") {
          ms = Number(t.remaining_ms || 0);
        }

        setTournament(t);
        setTimeLeftMs(ms);
      } catch (err) {
        console.error("Failed to load ongoing tournament", err);
      }
    };

    fetchTournament();
  }, []);

  // countdown tick (client-side only) when status === running
  useEffect(() => {
    if (!tournament || tournament.status !== "running") return;
    if (timeLeftMs <= 0) return;

    const id = setInterval(() => {
      setTimeLeftMs((prev) => {
        if (prev <= 1000) {
          clearInterval(id);
          setTournament((t) =>
            t ? { ...t, status: "completed", remaining_ms: 0 } : t
          );
          return 0;
        }
        return prev - 1000;
      });
    }, 1000);

    return () => clearInterval(id);
  }, [tournament?.status, timeLeftMs]);

  const tourCountdownParts = msToParts(timeLeftMs);
  const isUrgent =
    tournament &&
    tournament.status !== "completed" &&
    tourCountdownParts.days <= 2 &&
    timeLeftMs > 0;

  // shared toast for both panels
  const [toast, setToast] = useState("");

  const showToast = (msg, ms = 2600) => {
    setToast(msg);
    setTimeout(() => setToast(""), ms);
  };

  // handlers for tournament form
  const handleTourField = (key, value) => {
    setTourForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleStartTournament = async () => {
    if (!isAdmin) return;

    const name = (tourForm.name || "").trim();
    const startDate = tourForm.startDate;
    const days = parseInt(tourForm.durationDays, 10);

    if (!name || !startDate || !Number.isFinite(days) || days <= 0) {
      showToast(
        "Please fill Tournament Name, Start Date and a positive Duration (days)."
      );
      return;
    }

    try {
      setTourSubmitting(true);
      const res = await axios.post(`${API_BASE}/api/tournament/start`, {
        tournament_name: name,
        start_date: startDate,
        duration_days: days,
      });

      const t = res.data;
      let ms = 0;
      if (t.status === "running") {
        ms = Number(t.remaining_ms || 0);
      }
      setTournament(t);
      setTimeLeftMs(ms);
      showToast("Tournament started successfully ✅");
    } catch (err) {
      const msg =
        err?.response?.data?.error ||
        err?.message ||
        "Failed to start tournament.";
      showToast(msg, 3400);
    } finally {
      setTourSubmitting(false);
    }
  };

  const handlePauseTournament = async () => {
    if (!isAdmin) return;
    try {
      setTourSubmitting(true);
      const res = await axios.post(`${API_BASE}/api/tournament/pause`);
      const t = res.data;
      setTournament(t);
      setTimeLeftMs(Number(t.remaining_ms || 0));
      showToast("Tournament paused ⏸️");
    } catch (err) {
      const msg =
        err?.response?.data?.error ||
        err?.message ||
        "Failed to pause tournament.";
      showToast(msg, 3400);
    } finally {
      setTourSubmitting(false);
    }
  };

  const handleResumeTournament = async () => {
    if (!isAdmin) return;
    try {
      setTourSubmitting(true);
      const res = await axios.post(`${API_BASE}/api/tournament/resume`);
      const t = res.data;
      setTournament(t);
      setTimeLeftMs(Number(t.remaining_ms || 0));
      showToast("Tournament resumed ▶️");
    } catch (err) {
      const msg =
        err?.response?.data?.error ||
        err?.message ||
        "Failed to resume tournament.";
      showToast(msg, 3400);
    } finally {
      setTourSubmitting(false);
    }
  };

  const handleDeleteTournament = async () => {
    if (!isAdmin || !tournament) return;
    try {
      setTourSubmitting(true);
      await axios.post(`${API_BASE}/api/tournament/delete`, {
        id: tournament.id,
      });
      setTournament(null);
      setTimeLeftMs(0);
      setTourForm({ name: "", startDate: "", durationDays: "" });
      setTourEndDate("");
      showToast("Tournament deleted 🗑️");
    } catch (err) {
      const msg =
        err?.response?.data?.error ||
        err?.message ||
        "Failed to delete tournament.";
      showToast(msg, 3400);
    } finally {
      setTourSubmitting(false);
    }
  };

  const renderTimerBox = () => {
    if (!tournament) {
      return (
        <div className="aum-ongoing-timer-box">
          <div className="aum-ongoing-timer-label">Countdown</div>
          <div className="aum-ongoing-timer green">
            No active tournament timer
          </div>
        </div>
      );
    }

    if (tournament.status === "completed" || timeLeftMs <= 0) {
      return (
        <div className="aum-ongoing-timer-box">
          <div className="aum-ongoing-timer-label">Countdown</div>
          <div className="aum-ongoing-timer red">
            0 Days 00 hr : 00 min : 00 sec
          </div>
          <div className="aum-ongoing-status">
            {tournament.tournament_name} tournament is over.
          </div>
        </div>
      );
    }

    const { days, hours, minutes, seconds } = tourCountdownParts;

    return (
      <div className="aum-ongoing-timer-box">
        <div className="aum-ongoing-timer-label">Countdown</div>
        <div className={"aum-ongoing-timer " + (isUrgent ? "red" : "green")}>
          {days} Days {pad2(hours)} hr : {pad2(minutes)} min :{" "}
          {pad2(seconds)} sec
        </div>
        <div className="aum-ongoing-status">
          {tournament.status === "running" &&
            `${tournament.tournament_name} tournament is live.`}
          {tournament.status === "paused" &&
            `${tournament.tournament_name} tournament paused.`}
        </div>
      </div>
    );
  };

  /* -------------------------------------------------
   *  EXISTING UPCOMING MATCH FORM STATE
   * ------------------------------------------------- */
  const [form, setForm] = useState({
    match_name: "",
    match_type: "ODI",
    team_1: "",
    team_2: "",
    team_playing: "",
    match_date: "",
    match_time: "",
    location: "",
    series_name: "",
    match_status: "Scheduled",
    day_night: "Day",
  });

  const [submitting, setSubmitting] = useState(false);
  const [showInfo, setShowInfo] = useState(false);
  const [celebrate, setCelebrate] = useState(false);

  const livePlaying = useMemo(() => {
    const t1 = (form.team_1 || "").trim();
    const t2 = (form.team_2 || "").trim();
    if (!t1 && !t2) return "";
    return `${t1 || "Team 1"} vs ${t2 || "Team 2"}`;
  }, [form.team_1, form.team_2]);

  const set = (k, v) => setForm((p) => ({ ...p, [k]: v }));

  const cleanTeam = (s) =>
    (s || "")
      .toString()
      .trim()
      .replace(/\s+/g, " ")
      .replace(/\b\w/g, (c) => c.toUpperCase());

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (submitting) return;

    if (
      !form.match_name ||
      !form.team_1 ||
      !form.team_2 ||
      !form.match_date ||
      !form.match_time
    ) {
      showToast("Please fill Match Name, Team 1, Team 2, Date and Time.");
      return;
    }

    const payload = {
      match_name: form.match_name.trim(),
      match_type: form.match_type,
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

      setCelebrate(true);
      showToast("Match scheduled successfully 🎉", 2800);

      setTimeout(() => {
        setForm({
          match_name: "",
          match_type: "ODI",
          team_1: "",
          team_2: "",
          team_playing: "",
          match_date: "",
          match_time: "",
          location: "",
          series_name: "",
          match_status: "Scheduled",
          day_night: "Day",
        });
        setCelebrate(false);
      }, 1600);
    } catch (err) {
      const msg =
        err?.response?.data?.error ||
        err?.message ||
        "Failed to schedule match. Please try again.";
      showToast(msg, 3200);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="aum-wrap"
      id="add-upcoming-match-v3"
      data-component="AddUpcomingMatch.aum"
    >
      {/* ---------- Ongoing Tournament panel ---------- */}
      <div className="aum-ongoing">
        <div className="aum-ongoing-card">
          <div className="aum-ongoing-header">
            <h3 className="aum-ongoing-title">🏆 Ongoing Tournament</h3>
            <p className="aum-ongoing-sub">
              {isAdmin
                ? "Admins can start, pause, resume or delete the tournament timer."
                : "View live tournament timer here."}
            </p>
          </div>

          {isAdmin && (
            <div className="aum-ongoing-grid">
              <div>
                <div className="aum-ongoing-form-row">
                  <div className="aum-field">
                    <label>Tournament Name</label>
                    <input
                      className="aum-input"
                      value={tourForm.name}
                      onChange={(e) =>
                        handleTourField("name", e.target.value)
                      }
                      placeholder="Triangular Series 2025"
                    />
                  </div>
                  <div className="aum-field">
                    <label>Tournament Start Date</label>
                    <input
                      type="date"
                      className="aum-input"
                      value={tourForm.startDate}
                      onChange={(e) =>
                        handleTourField("startDate", e.target.value)
                      }
                    />
                  </div>
                </div>

                <div className="aum-ongoing-form-row">
                  <div className="aum-field">
                    <label>Duration (Days)</label>
                    <input
                      type="number"
                      min="1"
                      className="aum-input"
                      value={tourForm.durationDays}
                      onChange={(e) =>
                        handleTourField(
                          "durationDays",
                          e.target.value.replace(/[^\d]/g, "")
                        )
                      }
                      placeholder="45"
                    />
                  </div>
                  <div className="aum-field">
                    <label>End Date (auto)</label>
                    <input
                      className="aum-input"
                      value={
                        tourEndDate
                          ? new Date(tourEndDate).toLocaleDateString("en-GB")
                          : ""
                      }
                      placeholder="Auto from Start + Duration"
                      readOnly
                      disabled
                    />
                  </div>
                </div>

                <div className="aum-ongoing-actions">
                  {(!tournament || tournament.status === "completed") && (
                    <button
                      type="button"
                      className="aum-ongoing-btn"
                      onClick={handleStartTournament}
                      disabled={tourSubmitting}
                    >
                      {tourSubmitting ? "Starting..." : "Start Tournament"}
                    </button>
                  )}

                  {tournament && tournament.status === "running" && (
                    <button
                      type="button"
                      className="aum-ongoing-btn secondary"
                      onClick={handlePauseTournament}
                      disabled={tourSubmitting}
                    >
                      {tourSubmitting ? "Pausing..." : "Pause Tournament"}
                    </button>
                  )}

                  {tournament && tournament.status === "paused" && (
                    <button
                      type="button"
                      className="aum-ongoing-btn"
                      onClick={handleResumeTournament}
                      disabled={tourSubmitting}
                    >
                      {tourSubmitting ? "Resuming..." : "Resume Tournament"}
                    </button>
                  )}

                  {tournament && (
                    <button
                      type="button"
                      className="aum-ongoing-btn danger"
                      onClick={handleDeleteTournament}
                      disabled={tourSubmitting}
                    >
                      {tourSubmitting ? "Deleting..." : "Delete Tournament"}
                    </button>
                  )}
                </div>
              </div>

              {renderTimerBox()}
            </div>
          )}

          {!isAdmin && renderTimerBox()}
        </div>
      </div>

      {/* toast (shared) */}
      {toast && (
        <div className="aum-toast" role="status" aria-live="polite">
          {toast}
        </div>
      )}

      {/* ---------- Existing "Schedule Upcoming Match" form ---------- */}
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

      {/* card */}
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
          <button
            className={`aum-btn ${submitting ? "loading" : ""}`}
            disabled={submitting}
          >
            {submitting ? "Submitting…" : "Submit"}
          </button>
        </div>

        {celebrate && (
          <div className="aum-celebrate" aria-live="polite">
            <div className="aum-check">
              <svg viewBox="0 0 52 52" aria-hidden="true">
                <circle
                  className="aum-check-circle"
                  cx="26"
                  cy="26"
                  r="24"
                />
                <path
                  className="aum-check-mark"
                  fill="none"
                  d="M14 27 l8 8 l16 -16"
                />
              </svg>
              <div className="aum-check-text">Saved!</div>
            </div>
            <div className="aum-confetti">
              {Array.from({ length: 60 }).map((_, i) => (
                <span key={i} style={{ "--i": i, "--slot": i % 8 }} />
              ))}
            </div>
          </div>
        )}
      </form>

      {showInfo && (
        <div
          className="aum-modal"
          role="dialog"
          aria-modal="true"
          aria-label="How this page works"
        >
          <div className="aum-modal-card">
            <div className="aum-modal-head">
              <h3>About “Schedule Upcoming Match”</h3>
              <button
                className="aum-x"
                onClick={() => setShowInfo(false)}
                aria-label="Close"
              >
                ×
              </button>
            </div>
            <ul className="aum-help">
              <li>Select format (ODI / T20 / Test).</li>
              <li>
                Enter Team 1 &amp; Team 2 — “Team Playing” fills
                automatically.
              </li>
              <li>Pick Date, Time, Venue and Series.</li>
              <li>Set Status &amp; Day/Night, then Submit.</li>
            </ul>
            <div className="aum-modal-foot">
              <button
                className="aum-btn ghost"
                onClick={() => setShowInfo(false)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
