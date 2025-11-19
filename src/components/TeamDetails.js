// src/components/TeamDetails.js
// Pure data-driven Team Morale dashboard (ODI / T20 / Test)

import React, { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getMatchesByTeam } from "../services/api";
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

/* ----------------- helpers ----------------- */

const normalizeTeamName = (name) => {
  if (!name) return "";
  const n = String(name).trim().toLowerCase();
  const map = {
    ind: "India",
    india: "India",
    aus: "Australia",
    australia: "Australia",
    eng: "England",
    england: "England",
    pak: "Pakistan",
    pakistan: "Pakistan",
    nz: "New Zealand",
    "new zealand": "New Zealand",
    sa: "South Africa",
    "south africa": "South Africa",
    sl: "Sri Lanka",
    "sri lanka": "Sri Lanka",
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
    uae: "UAE",
    nam: "Namibia",
    namibia: "Namibia",
    usa: "USA",
    oma: "Oman",
    png: "Papua New Guinea",
    "papua new guinea": "Papua New Guinea",
  };
  return map[n] || name;
};

const clamp = (v, min, max) => Math.min(max, Math.max(min, v));

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
  const runs1 = Number(row.runs1 ?? row.runs_1 ?? 0);
  const runs2 = Number(row.runs2 ?? row.runs_2 ?? 0);
  const overs1 = Number(row.overs1 ?? row.overs_1 ?? 0);
  const overs2 = Number(row.overs2 ?? row.overs_2 ?? 0);

  const runsFor = isTeam1 ? runs1 : runs2;
  const runsAgainst = isTeam1 ? runs2 : runs1;
  const oversFor = isTeam1 ? overs1 : overs2;
  const oversAgainst = isTeam1 ? overs2 : overs1;

  // result
  const winner = row.winner || row.winner_team || "";
  let result = "NR";
  if (!winner) result = "NR";
  else if (String(winner).toLowerCase().includes("draw")) result = "Draw";
  else if (normalizeTeamName(winner).toLowerCase() === teamNorm)
    result = "Win";
  else result = "Loss";

  const opponent = isTeam1 ? t2Norm : t1Norm;

  return {
    id: row.id,
    matchName: row.match_name || row.matchName || "",
    format,
    seasonYear,
    date: dt,
    dateLabel: label || monthKey,
    monthKey,
    opponent,
    result,
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

  const [matchesRaw, setMatchesRaw] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [formatFilter, setFormatFilter] = useState("ALL"); // ALL | ODI | T20 | TEST
  const [moraleFilter, setMoraleFilter] = useState("ALL"); // ALL | High | Moderate | Low
  const [seasonFilter, setSeasonFilter] = useState("ALL");

  const teamLabel = normalizeTeamName(teamName || "");

  // load matches
  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError("");
      try {
        const res = await getMatchesByTeam(teamLabel);
        if (Array.isArray(res)) {
          setMatchesRaw(res);
        } else {
          setMatchesRaw([]);
        }
      } catch (e) {
        console.error("getMatchesByTeam error", e);
        setError("Unable to fetch matches for this team.");
        setMatchesRaw([]);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [teamLabel]);

  // normalized + sorted
  const matches = useMemo(() => {
    return matchesRaw
      .map((r) => normalizeMatchRow(r, teamLabel))
      .filter(Boolean)
      .sort((a, b) => (a.date && b.date ? a.date - b.date : 0));
  }, [matchesRaw, teamLabel]);

  // seasons for dropdown
  const availableSeasons = useMemo(() => {
    const set = new Set();
    matches.forEach((m) => {
      if (m.seasonYear) set.add(m.seasonYear);
    });
    return Array.from(set).sort();
  }, [matches]);

  // apply format + season filters
  const filteredMatches = useMemo(() => {
    return matches.filter((m) => {
      if (formatFilter !== "ALL" && m.format !== formatFilter) return false;
      if (seasonFilter !== "ALL" && m.seasonYear !== Number(seasonFilter))
        return false;
      return true;
    });
  }, [matches, formatFilter, seasonFilter]);

  // overall stats for current view
  const overallStats = useMemo(() => {
    if (!filteredMatches.length) return null;

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
    const recentSlice = filteredMatches.slice(-5);
    const recentWins = recentSlice.filter((m) => m.result === "Win").length;
    const recentWinPct = recentSlice.length
      ? (recentWins * 100) / recentSlice.length
      : winPct;

    let nrr = 0;
    if (oversFor > 0 && oversAgainst > 0) {
      nrr = runsFor / oversFor - runsAgainst / oversAgainst;
    }

    const morale = classifyMorale(winPct, nrr, recentWinPct, total);

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
  }, [filteredMatches]);

  // build monthly morale history
  const history = useMemo(() => {
    if (!filteredMatches.length) return [];

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

    // compute morale per month
    rows.forEach((row) => {
      const winPct = row.matches ? (row.wins * 100) / row.matches : 0;
      let nrr = 0;
      if (row.oversFor > 0 && row.oversAgainst > 0) {
        nrr = row.runsFor / row.oversFor - row.runsAgainst / row.oversAgainst;
      }

      // recent window: last 5 matches up to end of that month
      const uptoIndex = filteredMatches.findIndex(
        (m) => m.monthKey === row.key
      );
      let slice = filteredMatches;
      if (uptoIndex >= 0) {
        const upto = uptoIndex + row.matches;
        slice = filteredMatches.slice(Math.max(0, upto - 5), upto);
      }
      const recentWins = slice.filter((m) => m.result === "Win").length;
      const recentWinPct = slice.length
        ? (recentWins * 100) / slice.length
        : winPct;

      const morale = classifyMorale(
        winPct,
        nrr,
        recentWinPct,
        row.matches
      );

      row.winPct = winPct;
      row.nrr = nrr;
      row.recentWinPct = recentWinPct;
      row.moraleScore = morale.score;
      row.moraleBand = morale.band;
    });

    return rows;
  }, [filteredMatches]);

  // morale band filter on history
  const filteredHistory = useMemo(() => {
    if (moraleFilter === "ALL") return history;
    return history.filter((h) => h.moraleBand === moraleFilter);
  }, [history, moraleFilter]);

  const recentMatches = useMemo(
    () => filteredMatches.slice(-8).reverse(),
    [filteredMatches]
  );

  const formatLabel =
    formatFilter === "ALL" ? "All Formats" : formatFilter.toUpperCase();

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
            {seasonFilter !== "ALL" ? ` • Season ${seasonFilter}` : ""}
          </span>
        </div>
      </div>

      {loading && <div className="team-loading">Loading team data…</div>}
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
                      <span className="stat-label">Matches</span>
                      <span className="stat-value">
                        {overallStats.matches}
                      </span>
                    </div>
                    <div className="stat-block">
                      <span className="stat-label">Wins / Losses</span>
                      <span className="stat-value">
                        {overallStats.wins} / {overallStats.losses}
                      </span>
                    </div>
                    <div className="stat-block">
                      <span className="stat-label">Draws</span>
                      <span className="stat-value">
                        {overallStats.draws}
                      </span>
                    </div>
                    <div className="stat-block">
                      <span className="stat-label">Win %</span>
                      <span className="stat-value">
                        {overallStats.winPct.toFixed(1)}%
                      </span>
                    </div>
                    <div className="stat-block">
                      <span className="stat-label">NRR</span>
                      <span className="stat-value">
                        {overallStats.nrr.toFixed(2)}
                      </span>
                    </div>
                    <div className="stat-block">
                      <span className="stat-label">Last 5 Win %</span>
                      <span className="stat-value">
                        {overallStats.recentWinPct.toFixed(1)}%
                      </span>
                    </div>
                    <div className="stat-block">
                      <span className="stat-label">Current Morale</span>
                      <span
                        className={`team-morale-pill team-morale-${overallStats.moraleBand.toLowerCase()}`}
                      >
                        {overallStats.moraleBand.toUpperCase()} •{" "}
                        {overallStats.moraleScore}
                      </span>
                    </div>
                  </div>
                  <div className="team-morale-legend">
                    High = strong form • Moderate = stable • Low = needs
                    improvement.
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
              <span className="pill-group-label">Format</span>
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
              <span className="pill-group-label">Morale</span>
              {["ALL", "High", "Moderate", "Low"].map((band) => (
                <button
                  key={band}
                  className={`pill-btn pill-${band.toLowerCase()} ${
                    moraleFilter === band ? "active" : ""
                  }`}
                  onClick={() => setMoraleFilter(band)}
                >
                  {band === "ALL" ? "All" : band}
                </button>
              ))}
            </div>

            <div className="season-filter">
              <span className="pill-group-label">Season</span>
              <select
                className="season-select"
                value={seasonFilter}
                onChange={(e) => setSeasonFilter(e.target.value)}
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
                  Morale score (0–100) calculated from win%, recent form and
                  NRR.
                </span>
              </div>
              {filteredHistory.length ? (
                <ResponsiveContainer width="100%" height={260}>
                  <LineChart data={filteredHistory}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.25} />
                    <XAxis dataKey="label" />
                    <YAxis domain={[0, 100]} />
                    <Tooltip
                      formatter={(value, name) => {
                        if (name === "moraleScore")
                          return [value, "Morale"];
                        if (name === "winPct")
                          return [`${value.toFixed(1)}%`, "Win %"];
                        if (name === "nrr")
                          return [value.toFixed(2), "NRR"];
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
                  Morale filter (High / Moderate / Low) applies here.
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
                          <td>{h.winPct.toFixed(1)}%</td>
                          <td>{h.nrr.toFixed(2)}</td>
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
                Last 8 matches after applying format + season filters.
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
                          {m.runsFor} / {m.oversFor}
                        </td>
                        <td>
                          {m.runsAgainst} / {m.oversAgainst}
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
