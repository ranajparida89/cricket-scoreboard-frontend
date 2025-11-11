// src/components/PastMatchesHub.js
// Past matches view for ODI/T20 (match_history) + Test (test_match_results)
// now calling the new backend routes you added: /api/past-matches/odi-t20 and /api/past-matches/test

import React, { useEffect, useState } from "react";
import axios from "axios";
import "./past-matches.css";

const API_BASE = "https://cricket-scoreboard-backend.onrender.com/api";

// helper to make the timestamp look nice
const formatDateTime = (raw) => {
  if (!raw) return "—";
  const d = new Date(raw);
  if (isNaN(d.getTime())) {
    // if backend sent only "2025-08-23" we just show that
    return raw;
  }
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
  const [activeTab, setActiveTab] = useState("limited");
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true);
      setError("");
      try {
        // ✅ these are the endpoints we just created in the backend
        const [limitedRes, testRes] = await Promise.all([
          axios.get(`${API_BASE}/past-matches/odi-t20`),
          axios.get(`${API_BASE}/past-matches/test`),
        ]);
        setOdiT20(limitedRes.data || []);
        setTests(testRes.data || []);
      } catch (err) {
        console.error("PastMatchesHub fetch error:", err);
        setError("Could not load past matches.");
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, []);

  return (
    <div className="pm-shell">
      <header className="pm-top">
        <h2>🏏 Past Matches Archive</h2>
        <p>Browse recorded ODI, T20 and Test match results.</p>
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
      ) : activeTab === "limited" ? (
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
              <article key={m.id || m.match_time} className="pm-card">
                <div className="pm-card-header">
                  <span className="pm-tag">{m.match_type || "ODI/T20"}</span>
                  <span className="pm-date">
                    {formatDateTime(m.match_time || m.match_date)}
                  </span>
                </div>
                <h3 className="pm-title">{m.match_name}</h3>
                {(m.tournament_name || m.season_year) && (
                  <p className="pm-tournament">
                    {m.tournament_name || "Tournament"}{" "}
                    {m.season_year ? `• ${m.season_year}` : ""}
                  </p>
                )}

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
      ) : (
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

            const has2nd =
              m.runs1_2 != null ||
              m.runs2_2 != null ||
              m.overs1_2 != null ||
              m.overs2_2 != null;

            return (
              <article key={m.id || m.match_date} className="pm-card pm-card-test">
                <div className="pm-card-header">
                  <span className="pm-tag pm-tag-test">
                    {m.match_type || "Test"}
                  </span>
                  <span className="pm-date">
                    {formatDateTime(m.match_date || m.created_at)}
                  </span>
                </div>

                <h3 className="pm-title">{m.match_name}</h3>
                {(m.tournament_name || m.season_year) && (
                  <p className="pm-tournament">
                    {m.tournament_name || "Tournament"}{" "}
                    {m.season_year ? `• ${m.season_year}` : ""}
                  </p>
                )}

                <div className="pm-teams">
                  <div className="pm-team">
                    <h4>{m.team1}</h4>
                    <p>{score1}</p>
                    {has2nd && m.runs1_2 != null && (
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
                    {has2nd && m.runs2_2 != null && (
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
    </div>
  );
};

export default PastMatchesHub;
