// src/components/PastMatchesHub.js
// Past matches view for ODI/T20 + Test
// enhanced with filters, analytics, smart insights, and nicer structure

import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
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

  // interactive filters
  const [filters, setFilters] = useState({
    team: "",
    tournament: "",
    year: "",
    sort: "latest",
  });

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

  // ---------- derived data for filters ----------
  const allYears = useMemo(() => {
    const years = new Set();
    [...odiT20, ...tests].forEach((m) => {
      if (m.season_year) years.add(m.season_year.toString());
    });
    return Array.from(years).sort((a, b) => b.localeCompare(a));
  }, [odiT20, tests]);

  const allTournaments = useMemo(() => {
    const t = new Set();
    [...odiT20, ...tests].forEach((m) => {
      if (m.tournament_name) t.add(m.tournament_name);
    });
    return Array.from(t).sort();
  }, [odiT20, tests]);

  // ---------- analytics (for charts, insights) ----------
  const analytics = useMemo(() => {
    const all = [...odiT20, ...tests];

    // 1) avg runs by format
    const bucket = {
      ODI: { total: 0, count: 0 },
      T20: { total: 0, count: 0 },
      Test: { total: 0, count: 0 },
    };
    all.forEach((m) => {
      const mt = (m.match_type || "").toUpperCase();
      const totalRuns =
        (m.runs1 || 0) +
        (m.runs2 || 0) +
        (m.runs1_2 || 0) +
        (m.runs2_2 || 0);
      if (mt.includes("TEST")) {
        bucket.Test.total += totalRuns;
        bucket.Test.count += 1;
      } else if (mt.includes("T20")) {
        bucket.T20.total += totalRuns;
        bucket.T20.count += 1;
      } else {
        bucket.ODI.total += totalRuns;
        bucket.ODI.count += 1;
      }
    });
    const avgByFormat = [
      {
        format: "ODI",
        avg:
          bucket.ODI.count > 0
            ? Math.round(bucket.ODI.total / bucket.ODI.count)
            : 0,
      },
      {
        format: "T20",
        avg:
          bucket.T20.count > 0
            ? Math.round(bucket.T20.total / bucket.T20.count)
            : 0,
      },
      {
        format: "Test",
        avg:
          bucket.Test.count > 0
            ? Math.round(bucket.Test.total / bucket.Test.count)
            : 0,
      },
    ];

    // 2) wins by team (from "India won the match!")
    const winsMap = {};
    all.forEach((m) => {
      if (!m.winner) return;
      const teamName = m.winner.split(" won")[0]; // crude but works with your data
      if (!teamName) return;
      winsMap[teamName] = (winsMap[teamName] || 0) + 1;
    });
    const topWinners = Object.entries(winsMap)
      .map(([team, wins]) => ({ team, wins }))
      .sort((a, b) => b.wins - a.wins)
      .slice(0, 6);

    return { avgByFormat, topWinners };
  }, [odiT20, tests]);

  // ---------- smart insight strings ----------
  const smartInsights = useMemo(() => {
    const insights = [];
    // top winner text
    if (analytics.topWinners && analytics.topWinners.length > 0) {
      const top = analytics.topWinners[0];
      insights.push(
        `🔥 ${top.team} has the most wins in your archive (${top.wins}).`
      );
    }
    // high scoring format
    const highFormat = [...analytics.avgByFormat].sort(
      (a, b) => b.avg - a.avg
    )[0];
    if (highFormat && highFormat.avg > 0) {
      insights.push(
        `📈 ${highFormat.format} has been the highest-scoring format recently (avg ${highFormat.avg} runs per match).`
      );
    }
    // total matches
    const totalMatches = odiT20.length + tests.length;
    insights.push(`📦 Total recorded matches: ${totalMatches}.`);

    return insights;
  }, [analytics, odiT20.length, tests.length]);

  // ---------- filtering + sorting ----------
  const applyFilters = (list) => {
    let out = [...list];

    if (filters.team.trim() !== "") {
      const q = filters.team.trim().toLowerCase();
      out = out.filter(
        (m) =>
          m.team1?.toLowerCase().includes(q) ||
          m.team2?.toLowerCase().includes(q) ||
          m.winner?.toLowerCase().includes(q)
      );
    }

    if (filters.tournament) {
      out = out.filter((m) => m.tournament_name === filters.tournament);
    }

    if (filters.year) {
      out = out.filter(
        (m) => m.season_year && String(m.season_year) === filters.year
      );
    }

    // sort
    if (filters.sort === "latest") {
      out.sort((a, b) => {
        const da = new Date(a.match_time || a.match_date || a.created_at || 0);
        const db = new Date(b.match_time || b.match_date || b.created_at || 0);
        return db - da;
      });
    } else if (filters.sort === "runsHigh") {
      out.sort((a, b) => {
        const totalA =
          (a.runs1 || 0) +
          (a.runs2 || 0) +
          (a.runs1_2 || 0) +
          (a.runs2_2 || 0);
        const totalB =
          (b.runs1 || 0) +
          (b.runs2 || 0) +
          (b.runs1_2 || 0) +
          (b.runs2_2 || 0);
        return totalB - totalA;
      });
    }

    return out;
  };

  const filteredLimited = applyFilters(odiT20);
  const filteredTests = applyFilters(tests);

  return (
    <div className="pm-shell">
      {/* ---------- header / title ---------- */}
      <header className="pm-top">
        <h2>🏏 Past Matches Archive</h2>
        <p>Browse recorded ODI, T20 and Test match results.</p>
      </header>

      {/* ---------- smart insights strip ---------- */}
      <div className="pm-insights-strip">
        {smartInsights.map((txt, i) => (
          <div key={i} className="pm-insight-pill">
            {txt}
          </div>
        ))}
      </div>

      {/* ---------- analytics row (charts) ---------- */}
      <div className="pm-analytics-row">
        <div className="pm-analytics-card">
          <h4>Avg Runs by Format</h4>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={analytics.avgByFormat}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,.06)" />
              <XAxis dataKey="format" stroke="#fff" />
              <YAxis stroke="#fff" />
              <Tooltip />
              <Bar dataKey="avg" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="pm-analytics-card">
          <h4>Top Winners</h4>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={analytics.topWinners}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,.06)" />
              <XAxis dataKey="team" stroke="#fff" hide />
              <YAxis stroke="#fff" />
              <Tooltip />
              <Bar dataKey="wins" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
          <ul className="pm-mini-list">
            {analytics.topWinners.map((t) => (
              <li key={t.team}>
                <span>{t.team}</span>
                <strong>{t.wins}</strong>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* ---------- tab + filters ---------- */}
      <div className="pm-controls">
        <div className="pm-tabs">
          <button
            className={activeTab === "limited" ? "active" : ""}
            onClick={() => setActiveTab("limited")}
          >
            ODI / T20 ({odiT20.length})
          </button>
          <button
            className={activeTab === "tests" ? "active" : ""}
            onClick={() => setActiveTab("tests")}
          >
            Test Matches ({tests.length})
          </button>
        </div>

        <div className="pm-filters">
          <input
            type="text"
            placeholder="Search team / winner…"
            value={filters.team}
            onChange={(e) =>
              setFilters((f) => ({ ...f, team: e.target.value }))
            }
          />
          <select
            value={filters.tournament}
            onChange={(e) =>
              setFilters((f) => ({ ...f, tournament: e.target.value }))
            }
          >
            <option value="">All Tournaments</option>
            {allTournaments.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
          <select
            value={filters.year}
            onChange={(e) =>
              setFilters((f) => ({ ...f, year: e.target.value }))
            }
          >
            <option value="">All Years</option>
            {allYears.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
          <select
            value={filters.sort}
            onChange={(e) =>
              setFilters((f) => ({ ...f, sort: e.target.value }))
            }
          >
            <option value="latest">Newest first</option>
            <option value="runsHigh">Highest scoring</option>
          </select>
        </div>
      </div>

      {error && <div className="pm-error">{error}</div>}

      {/* ---------- main list ---------- */}
      {loading ? (
        <div className="pm-loading">Loading matches…</div>
      ) : activeTab === "limited" ? (
        <div className="pm-grid">
          {filteredLimited.length === 0 && (
            <p className="pm-empty">No ODI/T20 matches found.</p>
          )}
          {filteredLimited.map((m) => {
            const score1 =
              m.runs1 != null
                ? `${m.runs1}/${m.wickets1 ?? 0} (${m.overs1 ?? "-"} ov)`
                : "—";
            const score2 =
              m.runs2 != null
                ? `${m.runs2}/${m.wickets2 ?? 0} (${m.overs2 ?? "-"} ov)`
                : "—";

            return (
              <article
                key={m.id || m.match_time}
                className="pm-card pm-card-glassy"
              >
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
          {filteredTests.length === 0 && (
            <p className="pm-empty">No Test matches found.</p>
          )}
          {filteredTests.map((m) => {
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
              <article
                key={m.id || m.match_date}
                className="pm-card pm-card-test pm-card-glassy"
              >
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
