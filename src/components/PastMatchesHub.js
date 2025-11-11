// src/pages/PastMatchesHub.js
// Visually rich archive for ODI/T20 + Test

import React, { useEffect, useState } from "react";
import axios from "axios";
import "../styles/past-matches.css";

const API_BASE = "https://cricket-scoreboard-backend.onrender.com/api";

const formatDateTime = (raw) => {
  if (!raw) return "—";
  // raw could be "2025-08-23 13:48:56.907091" or "2025-08-23"
  const d = new Date(raw);
  if (isNaN(d.getTime())) return raw; // fallback to raw
  return d.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const PastMatchesHub = () => {
  const [loading, setLoading] = useState(true);
  const [odiT20, setOdiT20] = useState([]);
  const [tests, setTests] = useState([]);
  const [activeTab, setActiveTab] = useState("limited"); // limited | tests
  const [error, setError] = useState("");

  useEffect(() => {
    const go = async () => {
      setLoading(true);
      try {
        const [limitedRes, testRes] = await Promise.all([
          axios.get(`${API_BASE}/match-history`),
          axios.get(`${API_BASE}/test-match-results`),
        ]);
        setOdiT20(limitedRes.data || []);
        setTests(testRes.data || []);
      } catch (err) {
        console.error(err);
        setError("Could not load past matches.");
      } finally {
        setLoading(false);
      }
    };
    go();
  }, []);

  return (
    <div className="pm-shell">
      <header className="pm-top">
        <h2>🏏 Past Matches Archive</h2>
        <p>All results recorded in your tables — ODI, T20 and Test.</p>
      </header>

      <div className="pm-tabs">
        <button
          className={activeTab === "limited" ? "active" : ""}
          onClick={() => setActiveTab("limited")}
        >
          ODI / T20
        </button>
        <button
          className={activeTab === "tests" ? "active" : ""}
          onClick={() => setActiveTab("tests")}
        >
          Test Matches
        </button>
      </div>

      {error && <div className="pm-error">{error}</div>}

      {loading ? (
        <div className="pm-loading">Loading matches…</div>
      ) : (
        <>
          {activeTab === "limited" && (
            <div className="pm-grid">
              {odiT20.length === 0 && (
                <p className="pm-empty">No ODI/T20 matches found.</p>
              )}
              {odiT20.map((m) => {
                const score1 =
                  m.runs1 != null
                    ? `${m.runs1}/${m.wickets1 ?? 0} (${m.overs1 ?? "-"} ov)`
                    : "—";
                const score2 =
                  m.runs2 != null
                    ? `${m.runs2}/${m.wickets2 ?? 0} (${m.overs2 ?? "-"} ov)`
                    : "—";
                return (
                  <article key={m.id} className="pm-card">
                    <div className="pm-card-header">
                      <span className="pm-tag">{m.match_type || "ODI/T20"}</span>
                      <span className="pm-date">
                        {formatDateTime(m.match_time || m.match_date)}
                      </span>
                    </div>
                    <h3 className="pm-title">{m.match_name}</h3>
                    <p className="pm-tournament">
                      {m.tournament_name} • {m.season_year}
                    </p>

                    <div className="pm-teams">
                      <div className="pm-team">
                        <h4>{m.team1}</h4>
                        <p>{score1}</p>
                      </div>
                      <div className="pm-vs">vs</div>
                      <div className="pm-team pm-team-right">
                        <h4>{m.team2}</h4>
                        <p>{score2}</p>
                      </div>
                    </div>

                    <div className="pm-footer">
                      <p className="pm-winner">
                        🏆 {m.winner ? m.winner : "Result not provided"}
                      </p>
                    </div>
                  </article>
                );
              })}
            </div>
          )}

          {activeTab === "tests" && (
            <div className="pm-grid">
              {tests.length === 0 && (
                <p className="pm-empty">No Test matches found.</p>
              )}
              {tests.map((m) => {
                const score1 =
                  m.runs1 != null
                    ? `${m.runs1}/${m.wickets1 ?? 0} (${m.overs1 ?? "-"} ov)`
                    : "—";
                const score2 =
                  m.runs2 != null
                    ? `${m.runs2}/${m.wickets2 ?? 0} (${m.overs2 ?? "-"} ov)`
                    : "—";

                // some of your test rows also have innings 2 columns – we can show small chip
                const hasSecondInnings =
                  m.runs1_2 != null ||
                  m.runs2_2 != null ||
                  m.overs1_2 != null ||
                  m.overs2_2 != null;

                return (
                  <article key={m.id} className="pm-card pm-card-test">
                    <div className="pm-card-header">
                      <span className="pm-tag pm-tag-test">
                        {m.match_type || "Test"}
                      </span>
                      <span className="pm-date">
                        {formatDateTime(m.match_date)}
                      </span>
                    </div>
                    <h3 className="pm-title">{m.match_name}</h3>
                    <p className="pm-tournament">
                      {m.tournament_name} • {m.season_year}
                    </p>

                    <div className="pm-teams">
                      <div className="pm-team">
                        <h4>{m.team1}</h4>
                        <p>{score1}</p>
                        {hasSecondInnings && m.runs1_2 != null && (
                          <small className="pm-inn">
                            2nd: {m.runs1_2}/{m.wickets1_2 ?? 0} (
                            {m.overs1_2 ?? "-"} ov)
                          </small>
                        )}
                      </div>
                      <div className="pm-vs">vs</div>
                      <div className="pm-team pm-team-right">
                        <h4>{m.team2}</h4>
                        <p>{score2}</p>
                        {hasSecondInnings && m.runs2_2 != null && (
                          <small className="pm-inn">
                            2nd: {m.runs2_2}/{m.wickets2_2 ?? 0} (
                            {m.overs2_2 ?? "-"} ov)
                          </small>
                        )}
                      </div>
                    </div>

                    <div className="pm-footer">
                      <p className="pm-winner">
                        🏆 {m.winner ? m.winner : "Result not provided"}
                      </p>
                      {m.total_overs_used && (
                        <p className="pm-meta">
                          Total overs used: {m.total_overs_used}
                        </p>
                      )}
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default PastMatchesHub;
