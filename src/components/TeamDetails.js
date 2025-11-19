// src/components/TeamDetails.js
// Teams Overview (landing) + per-team Morale dashboard (ODI / T20 / Test)

import React, { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { getMatchesByTeam, getTestMatches } from "../services/api"; // ✅ UPDATED
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";
import "./TeamDetails.css";

const API_BASE = "https://cricket-scoreboard-backend.onrender.com";

/* ----------------- helpers ----------------- */

const normalizeTeamName = (name) => {
  if (!name) return "";
  const n = String(name).trim().toLowerCase();
  const map = {
    ind: "India",
    india: "India",
    in: "India",

    aus: "Australia",
    australia: "Australia",
    au: "Australia",

    eng: "England",
    england: "England",
    gb: "England",

    pak: "Pakistan",
    pakistan: "Pakistan",
    pk: "Pakistan",

    nz: "New Zealand",
    "new zealand": "New Zealand",

    sa: "South Africa",
    "south africa": "South Africa",
    za: "South Africa",

    sl: "Sri Lanka",
    "sri lanka": "Sri Lanka",
    lk: "Sri Lanka",

    wi: "West Indies",
    "west indies": "West Indies",

    afg: "Afghanistan",
    afghanistan: "Afghanistan",

    ban: "Bangladesh",
    bangladesh: "Bangladesh",

    zim: "Zimbabwe",
    zimbabwe: "Zimbabwe",

    ire: "Ireland",
    ireland: "Ireland",

    ned: "Netherlands",
    netherlands: "Netherlands",

    sco: "Scotland",
    scotland: "Scotland",

    nep: "Nepal",
    nepal: "Nepal",

    uae: "United Arab Emirates",
    "united arab emirates": "United Arab Emirates",

    nam: "Namibia",
    namibia: "Namibia",

    usa: "USA",
    oma: "Oman",
    oman: "Oman",

    png: "Papua New Guinea",
    "papua new guinea": "Papua New Guinea",
  };
  return map[n] || name;
};

const clamp = (v, min, max) => Math.min(max, Math.max(min, v));

const round1 = (v) =>
  Number.isFinite(v) ? Math.round(v * 10) / 10 : 0;

const round2 = (v) =>
  Number.isFinite(v) ? Math.round(v * 100) / 100 : 0;

const formatOvers = (v) => {
  if (!Number.isFinite(v)) return "-";
  const r = Math.round(v * 10) / 10; // 30.3333 → 30.3
  return Number.isInteger(r) ? r.toFixed(0) : r.toFixed(1);
};

const classifyMorale = (winPct, nrr, recentWinPct, matchesCount) => {
  const w = Number.isFinite(winPct) ? winPct : 0;
  const r = Number.isFinite(recentWinPct) ? recentWinPct : w;
  const n = Number.isFinite(nrr) ? nrr : 0;

  // very few matches → treat as neutral band
  if (!matchesCount || matchesCount < 3) {
    const rawNeutral =
      0.55 * w + 0.25 * r + 15 * clamp(n, -1.5, 1.5);
    return {
      band: "Moderate",
      score: Math.round(clamp(rawNeutral, 0, 100)),
    };
  }

  const rawScore =
    0.55 * w + // long-term win%
    0.25 * r + // recent win%
    15 * clamp(n, -1.5, 1.5); // NRR impact

  const score = clamp(rawScore, 0, 100);

  let band = "Low";
  if (score >= 70) band = "High";
  else if (score >= 45) band = "Moderate";

  return { band, score: Math.round(score) };
};

// Decide result from winner text + team names
const getResultForTeam = (rawWinner, teamNorm) => {
  const winnerStr = String(rawWinner || "").toLowerCase();
  const team = String(teamNorm || "").toLowerCase();

  if (!winnerStr) return "NR";
  if (winnerStr.includes("draw")) return "Draw";

  // Handle values like "India", "India won the match!", "India won!"
  if (winnerStr.includes(team)) return "Win";

  return "Loss";
};

// Convert one match row from API into a normalized structure
const normalizeMatchRow = (row, teamName) => {
  const teamNorm = normalizeTeamName(teamName).toLowerCase();

  const team1 = row.team1 || row.team_1 || row.home_team;
  const team2 = row.team2 || row.team_2 || row.away_team;

  const t1Norm = normalizeTeamName(team1);
  const t2Norm = normalizeTeamName(team2);

  const isTeam1 = String(t1Norm).toLowerCase() === teamNorm;
  const isTeam2 = String(t2Norm).toLowerCase() === teamNorm;
  if (!isTeam1 && !isTeam2) return null;

  // match type
  let format = String(
    row.match_type || row.matchType || row.type || ""
  ).toUpperCase();
  if (format !== "ODI" && format !== "T20" && format !== "TEST") {
    format = "ODI"; // default bucket
  }

  // date & season
  const dateStr = row.match_date || row.match_time || row.created_at;
  const dt = dateStr ? new Date(dateStr) : null;
  const seasonYear =
    row.season_year ||
    (dt && Number.isFinite(dt.getFullYear()) ? dt.getFullYear() : null);
  const monthKey =
    dt && Number.isFinite(dt.getMonth())
      ? `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, "0")}`
      : "Unknown";
  const label =
    dt &&
    dt.toLocaleString("default", {
      month: "short",
      year: "numeric",
    });

  // scores
  const runs1 = Number(
    row.runs1 ??
      row.runs_1 ??
      row.total_runs_team1 ??
      0
  );
  const runs2 = Number(
    row.runs2 ??
      row.runs_2 ??
      row.total_runs_team2 ??
      0
  );
  const overs1 = Number(
    row.overs1 ??
      row.overs_1 ??
      row.total_overs_team1 ??
      0
  );
  const overs2 = Number(
    row.overs2 ??
      row.overs_2 ??
      row.total_overs_team2 ??
      0
  );

  const runsFor = isTeam1 ? runs1 : runs2;
  const runsAgainst = isTeam1 ? runs2 : runs1;
  const oversFor = isTeam1 ? overs1 : overs2;
  const oversAgainst = isTeam1 ? overs2 : overs1;

  const winner = row.winner || row.winner_team || "";
  const result = getResultForTeam(winner, teamNorm);
  const opponent = isTeam1 ? t2Norm : t1Norm;

  return {
    id: row.id,
    matchName: row.match_name || row.matchName || row.series_name || "",
    format,
    seasonYear,
    date: dt,
    dateLabel: label || monthKey,
    monthKey,
    opponent,
    result, // Win / Loss / Draw / NR
    runsFor,
    runsAgainst,
    oversFor,
    oversAgainst,
  };
};

/* ----------------- component ----------------- */

const TeamDetails = () => {
  const { teamName } = useParams();
  const navigate = useNavigate();
  const isOverview = !teamName;

  // ---------- Overview (landing cards) state ----------
  const [overviewTeams, setOverviewTeams] = useState([]);
  const [overviewLoading, setOverviewLoading] = useState(true);
  const [overviewError, setOverviewError] = useState("");
  const [showInfo, setShowInfo] = useState(false);

  // ---------- Detail view state ----------
  const [matchesRaw, setMatchesRaw] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [formatFilter, setFormatFilter] = useState("ALL"); // ALL | ODI | T20 | TEST
  const [moraleFilter, setMoraleFilter] = useState("ALL"); // ALL | High | Moderate | Low
  const [seasonFilter, setSeasonFilter] = useState("ALL");

  const teamLabel = normalizeTeamName(teamName || "");

  // ---------- Data loading ----------
  useEffect(() => {
    // Landing page → fetch all teams and compute morale
    if (isOverview) {
      const loadOverview = async () => {
        setOverviewLoading(true);
        setOverviewError("");
        try {
          const res = await axios.get(`${API_BASE}/api/teams`);
          const rows = Array.isArray(res.data) ? res.data : [];

          const enriched = rows.map((row) => {
            const rawName =
              row.team_name || row.name || row.team || "";
            const name = normalizeTeamName(rawName);

            const matches =
              Number(
                row.matches_played ??
                  row.matches ??
                  row.total_matches ??
                  0
              ) || 0;
            const wins = Number(row.wins ?? 0) || 0;
            const losses = Number(row.losses ?? 0) || 0;
            const draws = Number(row.draws ?? 0) || 0;
            const nrr = Number(row.nrr ?? 0) || 0;

            const winPct = matches ? (wins * 100) / matches : 0;

            const morale = classifyMorale(winPct, nrr, winPct, matches);

            return {
              name,
              matches,
              wins,
              losses,
              draws,
              winPct: round1(winPct),
              nrr: round2(nrr),
              moraleBand: morale.band,
              moraleScore: morale.score,
            };
          });

          // Sort by morale score desc (then win% as tie-breaker)
          enriched.sort((a, b) => {
            if (b.moraleScore !== a.moraleScore) {
              return b.moraleScore - a.moraleScore;
            }
            return b.winPct - a.winPct;
          });

          // Assign ranks
          const ranked = enriched.map((t, idx) => ({
            ...t,
            rank: idx + 1,
          }));

          setOverviewTeams(ranked);
        } catch (e) {
          console.error("teams overview error", e);
          setOverviewError("Unable to load teams overview.");
          setOverviewTeams([]);
        } finally {
          setOverviewLoading(false);
        }
      };

      loadOverview();
      return;
    }

    // Detail view → load matches for this team
    const loadDetails = async () => {
      if (!teamLabel) return;
      setLoading(true);
      setError("");
      try {
        // ✅ fetch limited-overs + Test matches
        const [limitedRes, testRes] = await Promise.all([
          getMatchesByTeam(teamLabel),
          getTestMatches(), // (used exactly like in MatchCards)
        ]);

        const limitedArr = Array.isArray(limitedRes)
          ? limitedRes
          : limitedRes?.data || [];

        const testArrRaw = Array.isArray(testRes)
          ? testRes
          : testRes?.data || [];

        // normalise Test rows → expose totals & mark as TEST
        const testArr = testArrRaw.map((row) => ({
          ...row,
          match_type: (row.match_type || "TEST").toUpperCase(),
          runs1:
            row.runs1 ??
            row.runs_1 ??
            row.total_runs_team1,
          runs2:
            row.runs2 ??
            row.runs_2 ??
            row.total_runs_team2,
          overs1:
            row.overs1 ??
            row.overs_1 ??
            row.total_overs_team1,
          overs2:
            row.overs2 ??
            row.overs_2 ??
            row.total_overs_team2,
        }));

        setMatchesRaw([...limitedArr, ...testArr]);
      } catch (e) {
        console.error("getMatchesByTeam / getTestMatches error", e);
        setError("Unable to fetch matches for this team.");
        setMatchesRaw([]);
      } finally {
        setLoading(false);
      }
    };

    loadDetails();
  }, [isOverview, teamLabel]);

  // ---------- Detail view calculations ----------

  // normalized + sorted
  const matches = useMemo(() => {
    if (isOverview) return [];
    return matchesRaw
      .map((r) => normalizeMatchRow(r, teamLabel))
      .filter(Boolean)
      .sort((a, b) => {
        if (a.date && b.date) return a.date - b.date;
        return 0;
      });
  }, [matchesRaw, teamLabel, isOverview]);

  // seasons for dropdown
  const availableSeasons = useMemo(() => {
    if (isOverview) return [];
    const set = new Set();
    matches.forEach((m) => {
      if (m.seasonYear) set.add(m.seasonYear);
    });
    return Array.from(set).sort();
  }, [matches, isOverview]);

  // apply format + season filters
  const filteredMatches = useMemo(() => {
    if (isOverview) return [];
    return matches.filter((m) => {
      if (formatFilter !== "ALL" && m.format !== formatFilter) return false;
      if (
        seasonFilter !== "ALL" &&
        m.seasonYear !== Number(seasonFilter)
      )
        return false;
      return true;
    });
  }, [matches, formatFilter, seasonFilter, isOverview]);

  // overall stats for current view
  const overallStats = useMemo(() => {
    if (isOverview || !filteredMatches.length) return null;

    let total = 0,
      wins = 0,
      losses = 0,
      draws = 0;
    let runsFor = 0,
      runsAgainst = 0,
      oversFor = 0,
      oversAgainst = 0;

    filteredMatches.forEach((m) => {
      total++;
      if (m.result === "Win") wins++;
      else if (m.result === "Loss") losses++;
      else if (m.result === "Draw") draws++;

      runsFor += m.runsFor;
      runsAgainst += m.runsAgainst;
      oversFor += m.oversFor;
      oversAgainst += m.oversAgainst;
    });

    const winPct = total ? (wins * 100) / total : 0;

    // last 5 matches in this filtered view
    const recentSlice = filteredMatches.slice(-5);
    const recentWins = recentSlice.filter(
      (m) => m.result === "Win"
    ).length;
    const recentWinPct = recentSlice.length
      ? (recentWins * 100) / recentSlice.length
      : winPct;

    let nrr = 0;
    if (oversFor > 0 && oversAgainst > 0) {
      nrr = runsFor / oversFor - runsAgainst / oversAgainst;
    }

    const morale = classifyMorale(
      winPct,
      nrr,
      recentWinPct,
      total
    );

    return {
      matches: total,
      wins,
      losses,
      draws,
      winPct,
      nrr,
      recentWinPct,
      moraleBand: morale.band,
      moraleScore: morale.score,
    };
  }, [filteredMatches, isOverview]);

  // build monthly morale history (simple, per-month stats)
  const history = useMemo(() => {
    if (isOverview || !filteredMatches.length) return [];

    const map = new Map();

    filteredMatches.forEach((m) => {
      const key = m.monthKey || "Unknown";
      if (!map.has(key)) {
        map.set(key, {
          key,
          label: m.dateLabel || key,
          matches: 0,
          wins: 0,
          losses: 0,
          draws: 0,
          runsFor: 0,
          runsAgainst: 0,
          oversFor: 0,
          oversAgainst: 0,
        });
      }
      const bucket = map.get(key);
      bucket.matches++;
      if (m.result === "Win") bucket.wins++;
      else if (m.result === "Loss") bucket.losses++;
      else if (m.result === "Draw") bucket.draws++;

      bucket.runsFor += m.runsFor;
      bucket.runsAgainst += m.runsAgainst;
      bucket.oversFor += m.oversFor;
      bucket.oversAgainst += m.oversAgainst;
    });

    const rows = Array.from(map.values()).sort((a, b) =>
      a.key.localeCompare(b.key)
    );

    // compute morale per month – use that month’s win% as both long-term & recent
    rows.forEach((row) => {
      const rawWinPct = row.matches
        ? (row.wins * 100) / row.matches
        : 0;
      const winPct = round1(rawWinPct);

      let nrr = 0;
      if (row.oversFor > 0 && row.oversAgainst > 0) {
        nrr =
          row.runsFor / row.oversFor -
          row.runsAgainst / row.oversAgainst;
      }
      const nrrRounded = round2(nrr);

      const morale = classifyMorale(
        winPct,
        nrrRounded,
        winPct,
        row.matches
      );

      row.winPct = winPct;
      row.nrr = nrrRounded;
      row.moraleScore = morale.score;
      row.moraleBand = morale.band;
    });

    return rows;
  }, [filteredMatches, isOverview]);

  // morale band filter on history
  const filteredHistory = useMemo(() => {
    if (isOverview) return [];
    if (moraleFilter === "ALL") return history;
    return history.filter((h) => h.moraleBand === moraleFilter);
  }, [history, moraleFilter, isOverview]);

  const recentMatches = useMemo(
    () => (isOverview ? [] : filteredMatches.slice(-8).reverse()),
    [filteredMatches, isOverview]
  );

  const formatLabel =
    formatFilter === "ALL" ? "All Formats" : formatFilter.toUpperCase();

  /* ------------- OVERVIEW RENDER ------------- */

  if (isOverview) {
    return (
      <div className="teams-page-overview">
        <div className="teams-header-row">
          <div>
            <h2 className="teams-title">Teams Overview</h2>
            <p className="teams-subtitle">
              Live morale snapshot based on Win %, NRR and form across
              ODI &amp; T20.
            </p>
          </div>

          <div className="teams-header-right">
            <button
              className="teams-info-btn"
              onClick={() => setShowInfo((v) => !v)}
              title="How morale & rank are calculated"
            >
              i
            </button>
            <div className="teams-count-pill">
              <span>Total Teams</span>
              <strong>{overviewTeams.length}</strong>
            </div>
          </div>
        </div>

        {showInfo && (
          <div className="teams-info-popup">
            <h4>How Team Morale &amp; Rank work</h4>
            <p>
              Each team&apos;s morale (0–100) is derived from overall
              Win %, Net Run Rate and match volume. Bands:{" "}
              <strong>High</strong> ≥ 70,{" "}
              <strong>Moderate</strong> 45–69,{" "}
              <strong>Low</strong> &lt; 45.
            </p>
            <p>
              Rank is assigned by morale score (higher first), with
              Win % as a tie-breaker.
            </p>
          </div>
        )}

        {overviewLoading && (
          <div className="teams-overview-status">
            Loading teams…
          </div>
        )}
        {overviewError && (
          <div className="teams-overview-status error">
            {overviewError}
          </div>
        )}

        {!overviewLoading && !overviewError && (
          <div className="teams-grid">
            {overviewTeams.map((t) => (
              <div className="teams-card" key={t.name}>
                <div className="teams-card-top">
                  <div className="teams-card-name-block">
                    <h3 className="teams-card-name">{t.name}</h3>
                    <span
                      className={`team-morale-pill small team-morale-${t.moraleBand.toLowerCase()}`}
                    >
                      {t.moraleBand.toUpperCase()} •{" "}
                      {t.moraleScore}
                    </span>
                  </div>
                  <div className="teams-rank-pill">
                    <span>Rank</span>
                    <strong>#{t.rank}</strong>
                  </div>
                </div>

                <div className="teams-card-body">
                  <div className="teams-stat">
                    <span className="teams-stat-label">
                      Matches
                    </span>
                    <span className="teams-stat-value">
                      {t.matches}
                    </span>
                  </div>
                  <div className="teams-stat">
                    <span className="teams-stat-label">
                      Win %
                    </span>
                    <span className="teams-stat-value">
                      {t.winPct.toFixed(1)}%
                    </span>
                  </div>
                  <div className="teams-stat">
                    <span className="teams-stat-label">
                      NRR
                    </span>
                    <span className="teams-stat-value">
                      {t.nrr.toFixed(2)}
                    </span>
                  </div>
                  <div className="teams-stat">
                    <span className="teams-stat-label">
                      W / L
                    </span>
                    <span className="teams-stat-value">
                      {t.wins} / {t.losses}
                    </span>
                  </div>
                </div>

                <div className="teams-card-footer">
                  <button
                    className="teams-view-btn"
                    onClick={() =>
                      navigate(
                        `/teams/${encodeURIComponent(t.name)}`
                      )
                    }
                  >
                    View Stats
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  /* ------------- DETAIL RENDER ------------- */

  return (
    <div className="team-page">
      <div className="team-page-header">
        <button
          className="team-back-btn"
          onClick={() => navigate(-1)}
        >
          ← Back
        </button>

        <div className="team-header-title">
          <h2>{teamLabel || "Team"}</h2>
          <span className="team-header-sub">
            Team Morale • {formatLabel}
            {seasonFilter !== "ALL"
              ? ` • Season ${seasonFilter}`
              : ""}
          </span>
        </div>
      </div>

      {loading && (
        <div className="team-loading">Loading team data…</div>
      )}
      {error && <div className="team-error">{error}</div>}

      {!loading && !error && (
        <>
          {/* summary */}
          <div className="team-top-row">
            <div className="team-card stats">
              {overallStats ? (
                <>
                  <div className="team-stats-grid">
                    <div className="stat-block">
                      <span className="stat-label">
                        Matches
                      </span>
                      <span className="stat-value">
                        {overallStats.matches}
                      </span>
                    </div>
                    <div className="stat-block">
                      <span className="stat-label">
                        Wins / Losses
                      </span>
                      <span className="stat-value">
                        {overallStats.wins} /{" "}
                        {overallStats.losses}
                      </span>
                    </div>
                    <div className="stat-block">
                      <span className="stat-label">
                        Draws
                      </span>
                      <span className="stat-value">
                        {overallStats.draws}
                      </span>
                    </div>
                    <div className="stat-block">
                      <span className="stat-label">
                        Win %
                      </span>
                      <span className="stat-value">
                        {round1(
                          overallStats.winPct
                        ).toFixed(1)}
                        %
                      </span>
                    </div>
                    <div className="stat-block">
                      <span className="stat-label">
                        NRR
                      </span>
                      <span className="stat-value">
                        {round2(
                          overallStats.nrr
                        ).toFixed(2)}
                      </span>
                    </div>
                    <div className="stat-block">
                      <span className="stat-label">
                        Last 5 Win %
                      </span>
                      <span className="stat-value">
                        {round1(
                          overallStats.recentWinPct
                        ).toFixed(1)}
                        %
                      </span>
                    </div>
                    <div className="stat-block">
                      <span className="stat-label">
                        Current Morale
                      </span>
                      <span
                        className={`team-morale-pill team-morale-${overallStats.moraleBand.toLowerCase()}`}
                      >
                        {overallStats.moraleBand.toUpperCase()}{" "}
                        • {overallStats.moraleScore}
                      </span>
                    </div>
                  </div>
                  <div className="team-morale-legend">
                    High = strong form • Moderate = stable •
                    Low = needs improvement.
                  </div>
                </>
              ) : (
                <div className="team-no-data">
                  No matches found for this filter.
                </div>
              )}
            </div>
          </div>

          {/* filters */}
          <div className="team-filters-row">
            <div className="pill-group">
              <span className="pill-group-label">FORMAT</span>
              {["ALL", "ODI", "T20", "TEST"].map((fmt) => (
                <button
                  key={fmt}
                  className={`pill-btn ${
                    formatFilter === fmt ? "active" : ""
                  }`}
                  onClick={() => setFormatFilter(fmt)}
                >
                  {fmt === "ALL" ? "All" : fmt}
                </button>
              ))}
            </div>

            <div className="pill-group">
              <span className="pill-group-label">MORALE</span>
              {["ALL", "High", "Moderate", "Low"].map(
                (band) => (
                  <button
                    key={band}
                    className={`pill-btn pill-${band.toLowerCase()} ${
                      moraleFilter === band ? "active" : ""
                    }`}
                    onClick={() => setMoraleFilter(band)}
                  >
                    {band === "ALL" ? "All" : band}
                  </button>
                )
              )}
            </div>

            <div className="season-filter">
              <span className="pill-group-label">SEASON</span>
              <select
                className="season-select"
                value={seasonFilter}
                onChange={(e) =>
                  setSeasonFilter(e.target.value)
                }
              >
                <option value="ALL">All</option>
                {availableSeasons.map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* chart + monthly table */}
          <div className="team-bottom-row">
            <div className="team-card chart-card">
              <div className="card-header-row">
                <h4>Season / Month Morale Trend</h4>
                <span className="card-sub">
                  Morale score (0–100) calculated from win%,
                  recent form and NRR.
                </span>
              </div>
              {filteredHistory.length ? (
                <ResponsiveContainer
                  width="100%"
                  height={260}
                >
                  <LineChart data={filteredHistory}>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      opacity={0.25}
                    />
                    <XAxis dataKey="label" />
                    <YAxis domain={[0, 100]} />
                    <Tooltip
                      formatter={(value, name) => {
                        if (name === "moraleScore")
                          return [value, "Morale"];
                        if (name === "winPct")
                          return [
                            `${round1(value).toFixed(
                              1
                            )}%`,
                            "Win %",
                          ];
                        if (name === "nrr")
                          return [
                            round2(value).toFixed(2),
                            "NRR",
                          ];
                        return value;
                      }}
                    />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="moraleScore"
                      name="Morale"
                      strokeWidth={2.2}
                      dot={{ r: 4 }}
                      activeDot={{ r: 5 }}
                    />
                    <Line
                      type="monotone"
                      dataKey="winPct"
                      name="Win %"
                      strokeWidth={1.5}
                      strokeDasharray="4 2"
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="team-no-data center">
                  No monthly data for this view.
                </div>
              )}
            </div>

            <div className="team-card history-card">
              <div className="card-header-row">
                <h4>Monthly Morale Snapshot</h4>
                <span className="card-sub">
                  Morale filter (High / Moderate / Low) applies
                  here.
                </span>
              </div>
              {filteredHistory.length ? (
                <div className="history-table-wrap">
                  <table className="history-table">
                    <thead>
                      <tr>
                        <th>Period</th>
                        <th>M</th>
                        <th>W / L</th>
                        <th>Win %</th>
                        <th>NRR</th>
                        <th>Morale</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredHistory.map((h) => (
                        <tr key={h.key}>
                          <td>{h.label}</td>
                          <td>{h.matches}</td>
                          <td>
                            {h.wins} / {h.losses}
                          </td>
                          <td>
                            {round1(h.winPct).toFixed(1)}%
                          </td>
                          <td>
                            {round2(h.nrr).toFixed(2)}
                          </td>
                          <td>
                            <span
                              className={`team-morale-pill team-morale-${h.moraleBand.toLowerCase()}`}
                            >
                              {h.moraleBand.toUpperCase()} •{" "}
                              {h.moraleScore}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="team-no-data center">
                  No periods in this morale band.
                </div>
              )}
            </div>
          </div>

          {/* recent matches */}
          <div className="team-card recent-card">
            <div className="card-header-row">
              <h4>Recent Matches (current view)</h4>
              <span className="card-sub">
                Last 8 matches after applying format + season
                filters.
              </span>
            </div>
            {recentMatches.length ? (
              <div className="recent-table-wrap">
                <table className="recent-table">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Format</th>
                      <th>Opponent</th>
                      <th>Result</th>
                      <th>Runs / Overs (For)</th>
                      <th>Runs / Overs (Against)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentMatches.map((m) => (
                      <tr key={m.id}>
                        <td>{m.dateLabel}</td>
                        <td>{m.format}</td>
                        <td>{m.opponent}</td>
                        <td>
                          <span
                            className={`result-pill result-${m.result.toLowerCase()}`}
                          >
                            {m.result}
                          </span>
                        </td>
                        <td>
                          {m.runsFor} /{" "}
                          {formatOvers(m.oversFor)}
                        </td>
                        <td>
                          {m.runsAgainst} /{" "}
                          {formatOvers(m.oversAgainst)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="team-no-data center">
                No recent matches in this view.
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default TeamDetails;
