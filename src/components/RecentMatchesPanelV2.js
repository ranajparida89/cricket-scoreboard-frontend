// src/components/RecentMatchesPanelV2.js
import React, { useEffect, useState, useMemo } from "react";
import axios from "axios";
import "./RecentMatchesPanelV2.css";
import {
  FaTrophy,
  FaRegSadCry,
  FaHandshake,
  FaClock,
  FaTimes,
} from "react-icons/fa";

const API_BASE_URL = "https://cricket-scoreboard-backend.onrender.com/api";

export default function RecentMatchesPanelV2({ userId, limit = 5 }) {
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState("");
  const [selectedMatch, setSelectedMatch] = useState(null);

  // Fetch recent matches
  useEffect(() => {
    if (!userId) return;
    let cancelled = false;
    setLoading(true);
    setApiError("");

    axios
      .get(`${API_BASE_URL}/user-recent-matches-v2`, {
        params: { user_id: userId, limit },
      })
      .then((res) => {
        if (!cancelled) setMatches(Array.isArray(res.data) ? res.data : []);
      })
      .catch(() => !cancelled && setApiError("Failed to load recent matches"))
      .finally(() => !cancelled && setLoading(false));

    return () => {
      cancelled = true;
    };
  }, [userId, limit]);

  // Close modal on ESC
  useEffect(() => {
    if (!selectedMatch) return;
    const onEsc = (e) => e.key === "Escape" && setSelectedMatch(null);
    window.addEventListener("keydown", onEsc);
    return () => window.removeEventListener("keydown", onEsc);
  }, [selectedMatch]);

  const empty = !loading && !apiError && matches.length === 0;

  const rows = useMemo(
    () =>
      matches.map((m) => ({
        id: m.match_id,
        date: fmtDate(m.match_time),
        match_name: m.match_name,
        match_type: m.match_type,
        opponent: m.opponent,
        result: m.result, // "Won" | "Lost" | "Draw" | etc
        runs: m.runs,
        wickets: m.wickets,
        raw: m,
      })),
    [matches]
  );

  function fmtDate(iso) {
    try {
      return new Date(iso).toLocaleDateString(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    } catch {
      return "-";
    }
  }

  const getResultChip = (result) => {
    const norm = String(result || "").toLowerCase();
    if (norm === "won")
      return { cls: "win", icon: <FaTrophy aria-hidden="true" />, text: "Won" };
    if (norm === "lost")
      return {
        cls: "loss",
        icon: <FaRegSadCry aria-hidden="true" />,
        text: "Lost",
      };
    return {
      cls: "draw",
      icon: <FaHandshake aria-hidden="true" />,
      text: result || "Draw",
    };
  };

  return (
    <div className="recent-matches-panel-v2 card-3d glass">
      <div className="rm-headerbar">
        <h3>
          <FaClock className="rm-clock" />
          Recent Matches
        </h3>
      </div>

      {loading ? (
        <div className="rm-skeleton-wrap" aria-live="polite">
          {Array.from({ length: Math.max(3, limit) }).map((_, i) => (
            <div className="rm-skel-row" key={i} />
          ))}
        </div>
      ) : apiError ? (
        <div className="rm-state error">{apiError}</div>
      ) : empty ? (
        <div className="rm-state empty">
          <FaRegSadCry style={{ fontSize: 28 }} />
          <span>No recent matches found.</span>
        </div>
      ) : (
        <div className="recent-matches-panel-scroll">
          {/* Sticky table header (no overlapping text) */}
          <div className="rm-header">
            <span>Date</span>
            <span>Match</span>
            <span>Type</span>
            <span>Opponent</span>
            <span>Result</span>
            <span>Runs</span>
            <span>Wickets</span>
          </div>

          {rows.map((r) => {
            const chip = getResultChip(r.result);
            return (
              <div
                key={r.id}
                className="rm-row"
                role="button"
                tabIndex={0}
                onClick={() => setSelectedMatch(r.raw)}
                onKeyDown={(e) =>
                  (e.key === "Enter" || e.key === " ") &&
                  setSelectedMatch(r.raw)
                }
                title="Open match details"
                aria-label={`Open details for ${r.match_name}`}
              >
                <span>{r.date}</span>
                <span title={r.match_name}>{r.match_name}</span>
                <span>{r.match_type}</span>
                <span>{r.opponent}</span>
                <span className={`rm-chip ${chip.cls}`}>
                  <span className="rm-chip-icon">{chip.icon}</span>
                  {chip.text}
                </span>
                <span>{r.runs}</span>
                <span>{r.wickets}</span>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal */}
      {selectedMatch && (
        <div
          className="rm-modal-backdrop"
          onClick={() => setSelectedMatch(null)}
        >
          <div
            className="rm-modal card-3d glass"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-label="Match details"
            tabIndex={-1}
          >
            <button
              className="rm-modal-close"
              onClick={() => setSelectedMatch(null)}
              aria-label="Close"
            >
              <FaTimes />
            </button>
            <h4 className="rm-modal-title">Match Details</h4>

            <div className="rm-modal-details">
              <Detail label="Date" value={new Date(selectedMatch.match_time).toLocaleString()} />
              <Detail label="Match" value={selectedMatch.match_name} />
              <Detail label="Type" value={selectedMatch.match_type} />
              <Detail label="Opponent" value={selectedMatch.opponent} />
              <Detail
                label="Result"
                value={
                  <span
                    className={`rm-chip ${getResultChip(selectedMatch.result).cls}`}
                  >
                    <span className="rm-chip-icon">
                      {getResultChip(selectedMatch.result).icon}
                    </span>
                    {getResultChip(selectedMatch.result).text}
                  </span>
                }
              />
              <Detail label="Runs" value={selectedMatch.runs} />
              <Detail label="Wickets" value={selectedMatch.wickets} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Detail({ label, value }) {
  return (
    <div className="rm-detail-row">
      <span className="rm-detail-label">{label}</span>
      <span className="rm-detail-value">{value}</span>
    </div>
  );
}
