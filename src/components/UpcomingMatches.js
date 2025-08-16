// ✅ src/components/UpcomingMatches.js
// Cleaner, responsive cards + subtle animation (no external CSS file)
// - Robust date parsing (supports "YYYY-MM-DD" and "DD-MM-YYYY")
// - Sorts by date+time ascending
// - Skeleton shimmer while loading
// - Computed status: shows "Completed" for past dates
// - Self-contained styles injected via <style> tag

import React, { useEffect, useMemo, useState } from "react";
import { getUpcomingMatchList } from "../services/api";
import {
  FaClock,
  FaCalendarAlt,
  FaGlobeAsia,
  FaSyncAlt,
  FaMapMarkerAlt,
} from "react-icons/fa";

/* ----------------------- small date helpers ----------------------- */

/** Parse "YYYY-MM-DD" or "DD-MM-YYYY" safely into a JS Date at local midnight. */
function parseFlexibleDate(d) {
  if (!d || typeof d !== "string") return null;

  // Normalize separators
  const s = d.trim().replace(/\//g, "-");

  // Expect 3 parts; if not, let Date try (may return Invalid Date)
  const parts = s.split("-");
  if (parts.length !== 3) {
    const dt = new Date(s);
    return isNaN(dt) ? null : new Date(dt.getFullYear(), dt.getMonth(), dt.getDate());
  }

  // Detect format: YYYY-MM-DD  or  DD-MM-YYYY
  // Heuristic: first token length 4 => YYYY first
  let year, month, day;
  if (parts[0].length === 4) {
    // YYYY-MM-DD
    year = Number(parts[0]);
    month = Number(parts[1]) - 1;
    day = Number(parts[2]);
  } else {
    // DD-MM-YYYY
    day = Number(parts[0]);
    month = Number(parts[1]) - 1;
    year = Number(parts[2]);
  }

  const dt = new Date(year, month, day);
  return isNaN(dt) ? null : dt;
}

/** Parse "HH:mm" (24h) to minutes for easy comparison. Returns null on failure. */
function parseTimeToMinutes(t) {
  if (!t || typeof t !== "string") return null;
  const m = t.trim().match(/^(\d{1,2}):(\d{2})$/);
  if (!m) return null;
  const hh = Number(m[1]);
  const mm = Number(m[2]);
  if (hh < 0 || hh > 23 || mm < 0 || mm > 59) return null;
  return hh * 60 + mm;
}

/** Combine date + "HH:mm" into a comparable number (ms since epoch). */
function toComparableDateTime(dateStr, timeStr) {
  const d = parseFlexibleDate(dateStr);
  if (!d) return Number.MAX_SAFE_INTEGER; // push invalid dates to end
  const mins = parseTimeToMinutes(timeStr) ?? 0;
  const ms = d.getTime() + mins * 60 * 1000;
  return ms;
}

/* ------------------------------------------------------------------ */

const UpcomingMatches = () => {
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  /** Load from API and store */
  const fetchMatches = async () => {
    try {
      setLoading(true);
      setError(false);
      const data = await getUpcomingMatchList();
      setMatches(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Error fetching upcoming matches:", err);
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMatches();
  }, []);

  /** Format a date string to "DD Mon YYYY" (en-IN) or "—" if invalid */
  const formatDate = (dateStr) => {
    const d = parseFlexibleDate(dateStr);
    if (!d) return "—";
    return d.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  /** True if the match date is strictly before today */
  const isMatchCompleted = (dateStr) => {
    const d = parseFlexibleDate(dateStr);
    if (!d) return false;
    const today = new Date();
    // compare at local midnight
    today.setHours(0, 0, 0, 0);
    d.setHours(0, 0, 0, 0);
    return d.getTime() < today.getTime();
  };

  /** Sort by date+time ascending for consistent display */
  const sortedMatches = useMemo(() => {
    return [...matches].sort((a, b) => {
      const aKey = toComparableDateTime(a.match_date, a.match_time);
      const bKey = toComparableDateTime(b.match_date, b.match_time);
      return aKey - bKey;
    });
  }, [matches]);

  /* ----------------------- inlined CSS (scoped) ----------------------- */
  const css = `
    .um-wrap{padding:20px;color:#eaf6ff}
    .um-head{display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;gap:12px;flex-wrap:wrap}
    .um-title{font-size:1.4rem;font-weight:800;letter-spacing:.2px;margin:0}
    .um-refresh{padding:8px 14px;background:#0d6efd;border:none;border-radius:10px;color:#fff;display:flex;gap:8px;align-items:center;cursor:pointer}
    .um-refresh:active{transform:translateY(1px)}
    .um-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:14px}
    .um-card{background:#0f1b28;border:1px solid rgba(255,255,255,.08);border-radius:14px;padding:14px;box-shadow:0 6px 20px rgba(0,0,0,.22);animation:cardIn .35s ease both}
    .um-card:hover{transform:translateY(-2px)}
    .um-name{font-size:1.05rem;font-weight:700;margin:0 0 6px}
    .um-row{display:flex;gap:8px;align-items:center;margin:4px 0;color:#cfe0ee}
    .um-chip{display:inline-flex;align-items:center;gap:8px;background:#13263a;border:1px solid rgba(255,255,255,.10);border-radius:999px;padding:4px 10px;font-size:.82rem;color:#cfe0ee}
    .um-status{font-weight:700;border-radius:999px;padding:4px 10px}
    .um-status.scheduled{background:rgba(34,197,94,.12);border:1px solid rgba(34,197,94,.45);color:#22c55e}
    .um-status.postponed{background:rgba(250,204,21,.12);border:1px solid rgba(250,204,21,.45);color:#facc15}
    .um-status.completed{background:rgba(96,165,250,.12);border:1px solid rgba(96,165,250,.45);color:#60a5fa}
    .um-status.cancelled{background:rgba(239,68,68,.12);border:1px solid rgba(239,68,68,.45);color:#ef4444}
    .um-info{color:#cfe0ee;opacity:.9}
    .um-error{color:#ff6b6b}
    @keyframes cardIn { from{opacity:0; transform:translateY(6px)} to{opacity:1; transform:translateY(0)} }
    /* skeleton */
    .um-skel{height:120px;border-radius:14px;background:linear-gradient(90deg,#0e1a27 25%,#14273b 37%,#0e1a27 63%);background-size:400% 100%;animation:shimmer 1s ease-in-out infinite}
    @keyframes shimmer{0%{background-position:100% 0}100%{background-position:0 0}}
  `;

  return (
    <div className="um-wrap">
      {/* Styles live with the component; no external CSS file required */}
      <style>{css}</style>

      <div className="um-head">
        <h2 className="um-title">📅 Upcoming Matches</h2>
        <button className="um-refresh" onClick={fetchMatches} aria-label="Refresh upcoming matches">
          <FaSyncAlt /> Refresh
        </button>
      </div>

      {loading ? (
        // Skeleton cards
        <div className="um-grid" role="status" aria-live="polite">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="um-skel" />
          ))}
        </div>
      ) : error ? (
        <p className="um-error">Failed to load upcoming matches. Please try again.</p>
      ) : sortedMatches.length === 0 ? (
        <p className="um-info">No upcoming matches scheduled.</p>
      ) : (
        <div className="um-grid">
          {sortedMatches.map((m, idx) => {
            // Compute a status for display: past date => "Completed"
            const computed =
              isMatchCompleted(m.match_date) ? "Completed" : (m.match_status || "Scheduled");

            const statusClass =
              (computed === "Scheduled" && "scheduled") ||
              (computed === "Postponed" && "postponed") ||
              (computed === "Completed" && "completed") ||
              "cancelled";

            return (
              <div className="um-card" key={idx}>
                <div className="um-row" style={{ justifyContent: "space-between" }}>
                  <h3 className="um-name">
                    {m.match_name}{" "}
                    <span className="um-chip">{(m.match_type || "").toUpperCase()}</span>
                  </h3>
                  <span
                    className={`um-status ${statusClass.toLowerCase()}`}
                    aria-label={`Status: ${computed}`}
                  >
                    {computed}
                  </span>
                </div>

                <div className="um-row">
                  <strong>Teams:</strong>&nbsp;{m.team_playing || `${m.team_1} vs ${m.team_2}`}
                </div>

                <div className="um-row">
                  <FaMapMarkerAlt />
                  {m.location || "—"}
                </div>

                <div className="um-row">
                  <FaCalendarAlt />
                  {formatDate(m.match_date)}
                </div>

                <div className="um-row">
                  <FaClock />
                  {m.match_time || "—"} •{" "}
                  <span className="um-chip">
                    {(m.day_night || "Day").toString().trim()} match
                  </span>
                </div>

                {m.series_name ? (
                  <div className="um-row">
                    <FaGlobeAsia />
                    {m.series_name}
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default UpcomingMatches;
