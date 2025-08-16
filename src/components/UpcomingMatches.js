// ✅ src/components/UpcomingMatches.js
// Polished dark UI with gold accents + info modal + filters + skeleton loader
// Uses Bootstrap (already in app) + react-icons. No breaking changes to data.

import React, { useEffect, useMemo, useState } from "react";
import { getUpcomingMatchList } from "../services/api";
import {
  FaClock,
  FaCalendarAlt,
  FaGlobeAsia,
  FaSyncAlt,
  FaInfo,
  FaSearch,
} from "react-icons/fa";
import "./UpcomingMatches.css";

export default function UpcomingMatches() {
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  // UI state
  const [q, setQ] = useState("");
  const [format, setFormat] = useState("All"); // All | ODI | T20 | Test
  const [status, setStatus] = useState("All"); // All | Scheduled | Postponed | Cancelled
  const [dayNight, setDayNight] = useState("All"); // All | Day | Night
  const [showInfo, setShowInfo] = useState(false);

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

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      weekday: "short",
    });
  };

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    return matches.filter((m) => {
      const okFormat = format === "All" || (m.match_type || "").toLowerCase() === format.toLowerCase();
      const okStatus = status === "All" || (m.match_status || "") === status;
      const okDayNight = dayNight === "All" || (m.day_night || "") === dayNight;
      const hay =
        `${m.match_name ?? ""} ${m.series_name ?? ""} ${m.team_playing ?? ""} ${m.location ?? ""}`
          .toLowerCase();
      const okSearch = !term || hay.includes(term);
      return okFormat && okStatus && okDayNight && okSearch;
    });
  }, [matches, q, format, status, dayNight]);

  return (
    <div className="um-wrap" data-component="UpcomingMatches.list">
      {/* Title + actions */}
      <div className="um-titlebar">
        <div className="um-title-left">
          <span className="um-plus">+</span>
          <h2 className="um-title">Upcoming Match Details</h2>
        </div>

        <div className="um-actions">
          <button
            type="button"
            className="um-info-btn"
            aria-label="How this page works"
            title="About this page"
            onClick={() => setShowInfo(true)}
          >
            <FaInfo />
          </button>

          <button
            type="button"
            className="um-btn refresh"
            onClick={fetchMatches}
            title="Refresh list"
          >
            <FaSyncAlt className="me-2" />
            Refresh
          </button>
        </div>
      </div>

      {/* Toolbar: search + filters */}
      <div className="um-toolbar">
        <div className="um-search">
          <FaSearch className="um-search-ico" />
          <input
            className="um-input"
            placeholder="Search team, series or venue…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>

        <div className="um-filters">
          <select
            className="um-input"
            value={format}
            onChange={(e) => setFormat(e.target.value)}
          >
            <option value="All">All Formats</option>
            <option value="ODI">ODI</option>
            <option value="T20">T20</option>
            <option value="Test">Test</option>
          </select>

          <select
            className="um-input"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
          >
            <option value="All">All Status</option>
            <option value="Scheduled">Scheduled</option>
            <option value="Postponed">Postponed</option>
            <option value="Cancelled">Cancelled</option>
          </select>

          <select
            className="um-input"
            value={dayNight}
            onChange={(e) => setDayNight(e.target.value)}
          >
            <option value="All">Day or Night</option>
            <option value="Day">Day</option>
            <option value="Night">Night</option>
          </select>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="um-grid">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="um-card um-skeleton">
              <div className="um-skel-line w40"></div>
              <div className="um-skel-line w70"></div>
              <div className="um-skel-line w55"></div>
              <div className="um-skel-line w65"></div>
              <div className="um-skel-line w30"></div>
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="um-empty error">Failed to load upcoming matches. Please try again.</div>
      ) : filtered.length === 0 ? (
        <div className="um-empty">No upcoming matches match your filters.</div>
      ) : (
        <div className="um-grid">
          {filtered.map((m, i) => (
            <article key={i} className="um-card">
              <header className="um-card-head">
                <div className="um-chip">{m.match_type}</div>
                <h3 className="um-card-title">{m.match_name || "—"}</h3>
              </header>

              <div className="um-card-line teams">
                <strong>Teams:</strong>
                <span className="um-teams">{m.team_playing || "—"}</span>
              </div>

              <div className="um-card-line">
                <FaGlobeAsia className="um-ico" />
                <span>{m.location || "—"}</span>
              </div>

              <div className="um-card-line">
                <FaCalendarAlt className="um-ico" />
                <span>{formatDate(m.match_date)}</span>
              </div>

              <div className="um-card-line">
                <FaClock className="um-ico" />
                <span>
                  {m.match_time || "--:--"} &nbsp;|&nbsp; <strong>{m.day_night} Match</strong>
                </span>
              </div>

              <div className="um-card-line">
                <strong>Series:</strong>
                <span>{m.series_name || "—"}</span>
              </div>

              <footer className="um-card-foot">
                <span className={`um-status ${String(m.match_status || "").toLowerCase()}`}>
                  {m.match_status}
                </span>
              </footer>
            </article>
          ))}
        </div>
      )}

      {/* Info modal */}
      {showInfo && (
        <div className="um-modal" role="dialog" aria-modal="true" aria-label="How this page works">
          <div className="um-modal-card">
            <div className="um-modal-head">
              <h3>About “Upcoming Match Details”</h3>
              <button className="um-x" onClick={() => setShowInfo(false)} aria-label="Close">×</button>
            </div>
            <ul className="um-help">
              <li>Use the <strong>search</strong> to find a series, team, or venue.</li>
              <li>Filter by <strong>format</strong>, <strong>status</strong> and <strong>Day/Night</strong>.</li>
              <li>Click <strong>Refresh</strong> to fetch the latest schedule.</li>
              <li>Cards glow with a <strong>golden</strong> accent on hover. ✨</li>
            </ul>
            <div className="um-modal-foot">
              <button className="um-btn ghost" onClick={() => setShowInfo(false)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
