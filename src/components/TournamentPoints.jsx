// src/components/TournamentPoints.jsx
import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { API_URL } from "../services/api";
import "./TournamentPoints.css";

const MTYPES = ["All", "T20", "ODI"];
const safeNum = (v, def = 0) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : def;
};
const norm = (s) => (s ?? "").toString().trim();

/* =========================================================
 * 🔹 MOBILE: small helper to know if we're on a phone
 * Uses 640px as the breakpoint (tweak if you want)
 * =======================================================*/
function useIsMobile(breakpoint = 640) {
  const get = () =>
    typeof window !== "undefined" &&
    window.matchMedia &&
    window.matchMedia(`(max-width:${breakpoint}px)`).matches;

  const [isMobile, setIsMobile] = useState(get());

  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;
    const mq = window.matchMedia(`(max-width:${breakpoint}px)`);
    const onChange = (e) => setIsMobile(e.matches);
    // modern + legacy listeners
    mq.addEventListener ? mq.addEventListener("change", onChange) : mq.addListener(onChange);
    return () =>
      mq.removeEventListener
        ? mq.removeEventListener("change", onChange)
        : mq.removeListener(onChange);
  }, [breakpoint]);

  return isMobile;
}

/* =========================================================
 * 🔹 MOBILE: team abbreviation map (upper-case)
 * Fallback logic is provided if a team isn't listed here.
 * =======================================================*/
const TEAM_ABBR = {
  "south africa": "SA",
  england: "ENG",
  india: "IND",
  kenya: "KEN",
  scotland: "SCT",
  "new zealand": "NZ",
  "hong kong": "HKG",
  afghanistan: "AFG",
  bangladesh: "BAN",
  pakistan: "PAK",
  australia: "AUS",
  ireland: "IRE",
  netherlands: "NED",
  namibia: "NAM",
  zimbabwe: "ZIM",
  nepal: "NEP",
  oman: "OMA",
  canada: "CAN",
  "united arab emirates": "UAE",
  "west indies": "WI",
  "papua new guinea": "PNG",
  "sri lanka": "SL",
  "united states": "USA",
  usa: "USA",
};

/* Smart fallback for unknown names:
   - 1 word: first 3 letters
   - 2-3+ words: take initials (max 3) */
function abbreviateTeamName(name) {
  const s = norm(name);
  if (!s) return s;
  const key = s.toLowerCase();
  if (TEAM_ABBR[key]) return TEAM_ABBR[key];

  const words = s.split(/\s+/).filter(Boolean);
  if (words.length === 1) return words[0].slice(0, 3).toUpperCase();
  return words.map((w) => w[0]).join("").slice(0, 3).toUpperCase();
}

// Only abbreviate on mobile
const displayTeam = (name, isMobile) => (isMobile ? abbreviateTeamName(name) : name);

/* =========================================================
 * 🔹 MOBILE: column header labels (Rank on ALL screens)
 * =======================================================*/
function headerLabel(key, isMobile) {
  switch (key) {
    case "rank":
      return "Rank"; // <- ALWAYS "Rank" (mobile + desktop)
    case "team":
      return "Team";
    case "matches":
      return isMobile ? "M" : "Matches";
    case "wins":
      return isMobile ? "W" : "Wins";
    case "losses":
      return isMobile ? "L" : "Losses";
    case "draws":
      return isMobile ? "D" : "Draws";
    case "points":
      return isMobile ? "Pts" : "Points";
    case "nrr":
      return "NRR";
    case "tournament":
      return isMobile ? "TN" : "Tournament";
    case "year":
      return isMobile ? "Yrs" : "Year";
    default:
      return key;
  }
}

export default function TournamentPoints() {
  const [loading, setLoading] = useState(false);

  // 🔹 MOBILE: know if we should shorten labels/names
  const isMobile = useIsMobile(640);

  // Filters
  const [matchType, setMatchType] = useState("All");
  const [tournamentName, setTournamentName] = useState("");
  const [seasonYear, setSeasonYear] = useState("");

  // Distinct dropdown options (from DB)
  const [tournaments, setTournaments] = useState([]);
  const [years, setYears] = useState([]);

  // Table rows
  const [rows, setRows] = useState([]);

  const [infoOpen, setInfoOpen] = useState(false);

  // --------- FILTER CATALOG (distinct values from match_history) ----------
  async function loadFilters(type = matchType) {
    try {
      const { data } = await axios.get(`${API_URL}/tournaments/filters`, {
        params: { match_type: type },
      });
      setTournaments(Array.isArray(data?.tournaments) ? data.tournaments : []);
      setYears(Array.isArray(data?.years) ? data.years : []);
    } catch {
      // Fallback to old /tournaments if /filters isn’t deployed yet
      try {
        const { data } = await axios.get(`${API_URL}/tournaments`, {
          params: { match_type: type },
        });
        const cats = Array.isArray(data) ? data : [];
        setTournaments(cats.map((c) => c.name).sort((a, b) => a.localeCompare(b)));
        const yrSet = new Set();
        cats.forEach((c) =>
          (Array.isArray(c.editions) ? c.editions : []).forEach((e) => {
            if (!type || type === "All" || e.match_type === type)
              yrSet.add(Number(e.season_year));
          })
        );
        setYears(Array.from(yrSet).sort((a, b) => b - a));
      } catch {
        setTournaments([]);
        setYears([]);
      }
    }
  }

  useEffect(() => {
    loadFilters(matchType);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [matchType]);

  // --------- LEADERBOARD ----------
  async function reload() {
    try {
      setLoading(true);
      const params = { match_type: matchType };
      if (norm(tournamentName)) params.tournament_name = tournamentName;
      if (norm(seasonYear)) params.season_year = Number(seasonYear);

      const { data } = await axios.get(`${API_URL}/tournaments/leaderboard`, { params });

      const normalized = (Array.isArray(data) ? data : []).map((r) => ({
        team_name: r.team_name,
        matches_played: safeNum(r.matches),
        wins: safeNum(r.wins),
        losses: safeNum(r.losses),
        draws: safeNum(r.draws),
        points: safeNum(r.points),
        nrr: safeNum(r.nrr),
        tournament_name: r.tournament_name ?? null,
        season_year: r.season_year ?? null,
      }));

      // Defensive sort (backend also orders this way)
      normalized.sort(
        (a, b) => b.points - a.points || b.nrr - a.nrr || a.team_name.localeCompare(b.team_name)
      );

      setRows(normalized);
    } catch (e) {
      console.error("Failed to load /tournaments/leaderboard:", e);
      setRows([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [matchType, tournamentName, seasonYear]);

  // ---------- Chart series ----------
  const table = rows;

  /* 🔹 MOBILE: use abbreviated team names for chart labels on phones */
  const pointsSeries = useMemo(
    () =>
      table.slice(0, 10).map((r) => ({
        team: displayTeam(r.team_name, isMobile),
        value: safeNum(r.points),
      })),
    [table, isMobile]
  );
  const nrrSeries = useMemo(
    () =>
      table.slice(0, 10).map((r) => ({
        team: displayTeam(r.team_name, isMobile),
        value: safeNum(r.nrr),
      })),
    [table, isMobile]
  );

  // ---------- Chart layout ----------
  const W = 980,
    H = 360,
    PAD = 44;

  const yLMin = 0;
  const yLMax = Math.ceil(Math.max(2, ...pointsSeries.map((d) => d.value)) * 1.15);

  const nrrVals = nrrSeries.map((d) => Number(d.value)).filter(Number.isFinite);
  const nrrMin = Math.min(0, ...(nrrVals.length ? nrrVals : [0]));
  const nrrMax = Math.max(1, ...(nrrVals.length ? nrrVals : [1]));
  const nrrRange = Math.max(1e-6, nrrMax - nrrMin);

  const yRight = (v) => H - PAD - ((v - nrrMin) / nrrRange) * (H - PAD * 2);

  const n = pointsSeries.length || 1;
  const step = (W - PAD * 2) / Math.max(1, n - 1);
  const rotateLabels = step < 90;

  const polyPoints = (series, w, h, pad, yMin, yMax) => {
    const count = series.length || 1;
    const st = (w - pad * 2) / Math.max(1, count - 1);
    const yScale = (v) => {
      const t = (v - yMin) / Math.max(1e-6, yMax - yMin);
      return h - pad - t * (h - pad * 2);
    };
    return series.map((d, i) => `${pad + i * st},${yScale(d.value)}`).join(" ");
  };

  const Axis = ({ x, y, x2, y2, opacity = 0.5 }) => (
    <line x1={x} y1={y} x2={x2} y2={y2} stroke="rgba(255,255,255,.12)" strokeWidth="1" opacity={opacity} />
  );

  // ---------- NEW: plain-English explainer helpers ----------
  const modeLabel = (m) => (m === "S8" ? "Super 8" : m === "S6" ? "Super 6" : "Semi-finals");
  const fmtNrr = (n) => {
    const v = safeNum(n, 0);
    return (v >= 0 ? "+" : "") + v.toFixed(2);
  };
  function cutoffNarrative(p) {
    if (!p || !p.cutoff || !p.cut) return "";
    const last = p.cutoff.cutoffTeam;
    const out = p.cutoff.bubble?.[0];
    const parts = [
      `Top ${p.cut} teams qualify for ${modeLabel(p.mode)}.`,
      `${last.team_name} currently holds the last qualifying spot with ${safeNum(last.points)} pts and NRR ${fmtNrr(last.nrr)}.`,
    ];
    if (out) {
      parts.push(
        `${out.team_name} is next in line (${safeNum(out.points)} pts, NRR ${fmtNrr(out.nrr)}). ` +
          `To enter the Top ${p.cut}, they must finish with more points than ${last.team_name}, ` +
          `or tie on points and have a better NRR.`
      );
    }
    return parts.join(" ");
  }

  // ---------- Ranking / Prediction helpers ----------
  const rankByStandings = (list) =>
    [...list].sort(
      (a, b) =>
        b.points - a.points || // primary
        b.nrr - a.nrr || // tie-break 1
        b.wins - a.wins || // extra signal
        a.team_name.localeCompare(b.team_name)
    );

  function scoreAndProb(list) {
    if (!list?.length) return [];

    const ptsMax = Math.max(...list.map((r) => safeNum(r.points, 0)), 1);
    const wrArr = list.map((r) => safeNum(r.wins) / Math.max(1, safeNum(r.matches_played)));
    const wrMax = Math.max(...wrArr, 1);
    const nrrMinL = Math.min(...list.map((r) => safeNum(r.nrr, 0)));
    const nrrMaxL = Math.max(...list.map((r) => safeNum(r.nrr, 0)));
    const nrrRangeL = Math.max(1e-6, nrrMaxL - nrrMinL);

    const scored = list.map((r) => {
      const ptsNorm = safeNum(r.points, 0) / ptsMax;
      const wr = safeNum(r.wins) / Math.max(1, safeNum(r.matches_played));
      const wrNorm = wr / wrMax;
      const nrrNorm = (safeNum(r.nrr) - nrrMinL) / nrrRangeL; // 0..1
      const score = 0.55 * ptsNorm + 0.35 * wrNorm + 0.10 * nrrNorm;
      return { ...r, score };
    });

    const sMin = Math.min(...scored.map((s) => s.score));
    const sMax = Math.max(...scored.map((s) => s.score), sMin + 1e-6);

    return scored
      .map((s) => ({ ...s, probability: Math.round(((s.score - sMin) / (sMax - sMin)) * 100) }))
      .sort((a, b) => b.score - a.score);
  }

  function buildStage(list) {
    const teams = list?.length || 0;
    if (teams > 9) return { mode: "S8", label: "Super 8", cut: 8, teams };
    if (teams === 9) return { mode: "S6", label: "Super 6", cut: 6, teams };
    if (teams < 5) return { mode: "DIRECT_SEMIS", label: "Direct Semi-finals", cut: 4, teams };
    // 5..8: not enough for S8 and S6 is only for exactly 9
    return { mode: "DIRECT_SEMIS", label: "Direct Semi-finals", cut: 4, teams };
  }

  function buildPredictions(list) {
    if (!list?.length) {
      return {
        mode: "EMPTY",
        super8: [],
        super6: [],
        semifinal: [],
        summary: "No data for the chosen filters.",
        cutoff: null,
        cut: 0,
      };
    }

    const stage = buildStage(list);
    const withProb = scoreAndProb(list);
    const rankedAll = rankByStandings(list);

    let super8 = [];
    let super6 = [];
    let semifinal = [];

    if (stage.mode === "S8") {
      super8 = withProb.slice(0, 8);
      const s8Names = new Set(super8.map((t) => t.team_name));
      semifinal = withProb.filter((t) => s8Names.has(t.team_name)).slice(0, 4);
    } else if (stage.mode === "S6") {
      super6 = withProb.slice(0, 6);
      // Semis: Top 3 from Super6 by points (tie → NRR) + 1 wildcard from the rest by points, then NRR
      const top3 = rankByStandings(super6).slice(0, 3);
      const top3Names = new Set(top3.map((t) => t.team_name));
      const rest = rankedAll.filter((t) => !top3Names.has(t.team_name));
      const wildcard = rest[0] ? [rest[0]] : [];
      semifinal = [...top3, ...wildcard];
    } else if (stage.mode === "DIRECT_SEMIS") {
      semifinal = withProb.slice(0, 4);
    }

    // Cutoff snapshot (doesn't assume matches left)
    const cut = stage.cut;
    let cutoff = null;
    if (rankedAll.length >= cut && cut > 0) {
      const cutoffTeam = rankedAll[cut - 1];
      const above = rankedAll[cut - 2] || null;
      const bubble = rankedAll.slice(cut, cut + 3).map((t) => ({
        ...t,
        ptsBehind: safeNum(cutoffTeam.points) - safeNum(t.points),
        nrrBehind: +(safeNum(cutoffTeam.nrr) - safeNum(t.nrr)).toFixed(2),
      }));
      cutoff = { cutoffTeam, above, bubble };
    }

    let summary = "";
    if (stage.mode === "S8")
      summary = `With ${stage.teams} teams in this tournament, the format is Super 8 → Semi-finals.`;
    else if (stage.mode === "S6")
      summary = `Exactly 9 teams detected: the format is Super 6 → Semi-finals (Top 3 + 1 wildcard by Points, then NRR tiebreak).`;
    else summary = `Not enough teams for Super 8 or Super 6; going straight to Semi-finals.`;

    return {
      mode: stage.mode,
      cut: stage.cut,
      super8,
      super6,
      semifinal,
      cutoff,
      summary,
    };
  }

  const predictions = useMemo(() => buildPredictions(rows), [rows]);

  return (
    <div className="tp-simple">
      <div className="tp-head">
        <h2 className="tp-title">
          <span className="medal" role="img" aria-label="trophy">🏆</span>
          Tournament Points
          <button className="info-btn" onClick={() => setInfoOpen(true)}>i</button>
        </h2>

        {/* Filters */}
        <div className="filters" style={{ marginLeft: "auto" }}>
          <label>
            <span>Match Type</span>
            <select
              value={matchType}
              onChange={(e) => setMatchType(e.target.value)}
              className="sel dark"
            >
              {MTYPES.map((m) => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </label>

          <label>
            <span>Tournament</span>
            <select
              value={tournamentName}
              onChange={(e) => setTournamentName(e.target.value)}
              className="sel dark"
            >
              <option value="">All tournaments</option>
              {tournaments.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </label>

          <label>
            <span>Season Year</span>
            <select
              value={seasonYear}
              onChange={(e) => setSeasonYear(e.target.value)}
              className="sel dark"
            >
              <option value="">All years</option>
              {years.map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </label>

          <button className="btn-gold" onClick={reload} disabled={loading}>
            {loading ? "Loading…" : "Reload"}
          </button>
        </div>
      </div>

      {/* Chart */}
      <div className="card tp-chart">
        <div className="card-head">Points &amp; NRR (Top 10)</div>
        <div className="chart-wrap">
          {pointsSeries.length ? (
            <svg viewBox={`0 0 ${W} ${H}`} className="linechart">
              <Axis x={PAD} y={H - PAD} x2={W - PAD} y2={H - PAD} />
              <Axis x={PAD} y={PAD} x2={PAD} y2={H - PAD} />
              <Axis x={W - PAD} y={PAD} x2={W - PAD} y2={H - PAD} opacity={0.25} />

              {[0, 0.25, 0.5, 0.75, 1].map((t, i) => {
                const v = Math.round(yLMax * t);
                const y = H - PAD - ((v - yLMin) / Math.max(1e-6, yLMax - yLMin)) * (H - PAD * 2);
                return <line key={`h${i}`} x1={PAD} y1={y} x2={W - PAD} y2={y} className="grid" />;
              })}
              {pointsSeries.map((_, i) => (
                <line key={`v${i}`} x1={PAD + i * step} y1={PAD} x2={PAD + i * step} y2={H - PAD} className="grid v" />
              ))}

              <text x={PAD - 28} y={PAD - 10} className="axis-name">Points</text>
              <text x={W - PAD + 6} y={PAD - 10} className="axis-name">NRR</text>

              {[0, 0.25, 0.5, 0.75, 1].map((t, i) => {
                const v = Math.round(yLMax * t);
                const y = H - PAD - ((v - yLMin) / Math.max(1e-6, yLMax - yLMin)) * (H - PAD * 2);
                return <text key={`lt${i}`} x={PAD - 10} y={y} className="tick left" dy="4">{v}</text>;
              })}
              {[0, 0.5, 1].map((t, i) => {
                const v = +(nrrMin + t * (nrrMax - nrrMin)).toFixed(2);
                return <text key={`rt${i}`} x={W - PAD + 10} y={yRight(v)} className="tick right" dy="4">{v}</text>;
              })}

              <polyline className="line gold" points={polyPoints(pointsSeries, W, H, PAD, yLMin, yLMax)} />
              <polyline className="line teal" points={polyPoints(nrrSeries, W, H, PAD, nrrMin, nrrMax)} />

              {pointsSeries.map((d, i) => {
                const x = PAD + i * step;
                const yL = H - PAD - ((d.value - yLMin) / Math.max(1e-6, yLMax - yLMin)) * (H - PAD * 2);
                const rVal = nrrSeries[i]?.value ?? 0;
                const yR = yRight(rVal);
                return (
                  <g key={`${d.team}-${i}`}>
                    <circle cx={x} cy={yL} r="4" className="dot gold" />
                    <circle cx={x} cy={yR} r="4" className="dot teal" />
                    <text className="val goldv" x={x} y={yL - 8}>{d.value}</text>
                    <text className="val tealv" x={x} y={yR + (rVal >= 0 ? -8 : 16)}>
                      {Number(rVal).toFixed(2)}
                    </text>
                    <text
                      className={`xlabel ${rotateLabels ? "small rot" : ""}`}
                      x={x}
                      y={H - PAD + 16}
                      dy="10"
                      transform={rotateLabels ? `rotate(-28 ${x} ${H - PAD + 16})` : undefined}
                    >
                      {d.team}
                    </text>
                  </g>
                );
              })}

              <g className="legend">
                <rect x={W - 280} y={20} width="240" height="28" rx="8" className="legend-bg" />
                <circle cx={W - 260} cy={34} r="5" className="dot gold" />
                <text x={W - 248} y={38} className="legend-txt">Points</text>
                <circle cx={W - 180} cy={34} r="5" className="dot teal" />
                <text x={W - 168} y={38} className="legend-txt">NRR</text>
              </g>
            </svg>
          ) : (
            <div className="empty">No data</div>
          )}
        </div>
      </div>

      {/* Standings */}
      <div className="card tp-table-card">
        <div className="card-head">Standings</div>
        <div className="table-wrap">
          <table className="tp-table">
            <thead>
              <tr>
                {/* 🔹 MOBILE: header labels (Rank on ALL screens) */}
                <th>{headerLabel("rank", isMobile)}</th>
                <th>{headerLabel("team", isMobile)}</th>
                <th>{headerLabel("matches", isMobile)}</th>
                <th>{headerLabel("wins", isMobile)}</th>
                <th>{headerLabel("losses", isMobile)}</th>
                <th>{headerLabel("draws", isMobile)}</th>
                <th>{headerLabel("points", isMobile)}</th>
                <th>{headerLabel("nrr", isMobile)}</th>
                <th>{headerLabel("tournament", isMobile)}</th>
                <th>{headerLabel("year", isMobile)}</th>
              </tr>
            </thead>
            <tbody>
              {table.length === 0 ? (
                <tr><td colSpan="10" className="empty-row">No data</td></tr>
              ) : (
                table.map((t, idx) => (
                  <tr key={t.team_name} className={`lb-row ${idx < 3 ? `top-${idx + 1}` : ""}`}>
                    <td><span className="rank-badge">#{idx + 1}</span></td>
                    {/* 🔹 MOBILE: abbreviate team name only on mobile */}
                    <td className={`tname ${idx < 3 ? "goldtxt" : ""}`}>
                      {displayTeam(t.team_name, isMobile)}
                    </td>
                    <td>{safeNum(t.matches_played)}</td>
                    <td className="good">{safeNum(t.wins)}</td>
                    <td className="bad">{safeNum(t.losses)}</td>
                    <td>{safeNum(t.draws)}</td>
                    <td><span className="points-chip">{safeNum(t.points)}</span></td>
                    <td className={safeNum(t.nrr) >= 0 ? "good" : "bad"}>{safeNum(t.nrr).toFixed(2)}</td>
                    <td className="muted">{norm(t.tournament_name) ? t.tournament_name : "—"}</td>
                    <td className="muted">{safeNum(t.season_year) ? t.season_year : "—"}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Predictions */}
      <div className="card tp-predict">
        <div className="card-head">
          Predictions
          <span className="stage-badge">{predictions.summary}</span>
        </div>

        <div className="predict-grid">
          {/* Super 8 */}
          <div className="predict-col">
            <div className="predict-title">
              Super 8 — strongest 8
              {predictions.mode !== "S8" && (
                <span className="section-note">Not applicable for this tournament</span>
              )}
            </div>
            {predictions.mode === "S8" ? (
              <ol className="predict-list">
                {predictions.super8.map((t, i) => (
                  <li key={`s8-${t.team_name}`} className="predict-item">
                    <span className="p-rank">#{i + 1}</span>
                    <span className="p-team">{t.team_name}</span>
                    <span className="p-bar"><span className="p-fill" style={{ width: `${t.probability}%` }} /></span>
                    <span className="p-prob">{t.probability}%</span>
                  </li>
                ))}
              </ol>
            ) : (
              <div className="empty small">Super 8 appears only when the tournament has <strong>more than 9</strong> teams.</div>
            )}
          </div>

          {/* Super 6 */}
          <div className="predict-col">
            <div className="predict-title">
              Super 6 — strongest 6
              {predictions.mode !== "S6" && (
                <span className="section-note">Not applicable for this tournament</span>
              )}
            </div>
            {predictions.mode === "S6" ? (
              <ol className="predict-list">
                {predictions.super6.map((t, i) => (
                  <li key={`s6-${t.team_name}`} className="predict-item">
                    <span className="p-rank">#{i + 1}</span>
                    <span className="p-team">{t.team_name}</span>
                    <span className="p-bar"><span className="p-fill" style={{ width: `${t.probability}%` }} /></span>
                    <span className="p-prob">{t.probability}%</span>
                  </li>
                ))}
              </ol>
            ) : (
              <div className="empty small">
                Super 6 appears only when the tournament has <strong>exactly 9</strong> teams.
              </div>
            )}
          </div>

          {/* Semi Final */}
          <div className="predict-col">
            <div className="predict-title">
              Semi-finals — strongest 4
              {predictions.mode === "S6" && (
                <span className="section-note">Top 3 from Super 6 + 1 wildcard (Points → NRR)</span>
              )}
              {predictions.mode === "S8" && (
                <span className="section-note">Picked from the Super 8 contenders</span>
              )}
            </div>
            <ol className="predict-list">
              {predictions.semifinal.map((t, i) => (
                <li key={`sf-${t.team_name}`} className="predict-item">
                  <span className="p-rank">#{i + 1}</span>
                  <span className="p-team">{t.team_name}</span>
                  <span className="p-bar"><span className="p-fill" style={{ width: `${t.probability ?? 90}%` }} /></span>
                  <span className="p-prob">{(t.probability ?? 90)}%</span>
                  {predictions.mode === "S6" && i === 3 && <span className="wild-tag">Wildcard</span>}
                </li>
              ))}
            </ol>
          </div>
        </div>

        {/* Cutoff snapshot (static, no assumptions about remaining matches) */}
        <div className="snapshot-card">
          <div className="snapshot-title">Qualification cutoff snapshot (Top {predictions.cut})</div>

          {/* NEW: one-line plain-English explainer */}
          {predictions.cut > 0 && predictions.cutoff && (
            <p className="snapshot-help">{cutoffNarrative(predictions)}</p>
          )}

          {predictions.cut > 0 && predictions.cutoff ? (
            <ul className="snapshot-list">
              {predictions.cutoff.above && (
                <li>
                  <span className="snap-label">Just above</span>
                  <strong>{predictions.cutoff.above.team_name}</strong>
                  {" • "}
                  {safeNum(predictions.cutoff.above.points)} pts, NRR {safeNum(predictions.cutoff.above.nrr).toFixed(2)}
                  {" "}
                  <span className="delta pos">(+{safeNum(predictions.cutoff.above.points) - safeNum(predictions.cutoff.cutoffTeam.points)} pts vs cutoff)</span>
                </li>
              )}
              <li>
                <span className="snap-label">On cutoff (#{predictions.cut})</span>
                <strong>{predictions.cutoff.cutoffTeam.team_name}</strong>
                {" • "}
                {safeNum(predictions.cutoff.cutoffTeam.points)} pts, NRR {safeNum(predictions.cutoff.cutoffTeam.nrr).toFixed(2)}
              </li>
              {predictions.cutoff.bubble?.length ? (
                <>
                  <li className="snap-sub">Bubble teams (outside looking in):</li>
                  {predictions.cutoff.bubble.map((b) => (
                    <li key={`bubble-${b.team_name}`} className="bubble">
                      <strong>{b.team_name}</strong>
                      {" • "}
                      {safeNum(b.points)} pts{" "}
                      <span className={`delta ${b.ptsBehind > 0 ? "neg" : "pos"}`}>
                        ({b.ptsBehind > 0 ? `-${b.ptsBehind}` : "+0"} pts vs cutoff)
                      </span>
                      , NRR {safeNum(b.nrr).toFixed(2)}{" "}
                      <span className={`delta ${b.nrrBehind > 0 ? "neg" : "pos"}`}>
                        ({b.nrrBehind > 0 ? `-${Math.abs(b.nrrBehind).toFixed(2)}` : "+0.00"} NRR vs cutoff)
                      </span>
                    </li>
                  ))}
                </>
              ) : null}
            </ul>
          ) : (
            <div className="empty small">Cutoff will appear once there are at least {predictions.cut || 4} teams.</div>
          )}
          <div className="tie-note">Tie-breaks in this view: Points → NRR → Wins → Team name.</div>
        </div>

        {/* minimal CSS scoped to this card */}
        <style>{`
          .predict-grid{display:grid;gap:14px;grid-template-columns:repeat(3,minmax(0,1fr));}
          @media(max-width: 992px){.predict-grid{grid-template-columns:1fr;}}
          .predict-title{font-weight:800;color:#e8caa4;margin-bottom:8px;display:flex;gap:10px;align-items:center;flex-wrap:wrap}
          .section-note{font-size:.82rem;color:#a9bdd9;background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.08);padding:4px 8px;border-radius:999px}
          .predict-list{list-style:none;padding:0;margin:0;display:flex;flex-direction:column;gap:8px}
          .predict-item{display:grid;grid-template-columns:auto 1fr auto auto;gap:10px;align-items:center;position:relative}
          .p-rank{font-weight:800;color:#cfe9ff;opacity:.9}
          .p-team{font-weight:700;color:#fff;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
          .p-bar{height:8px;background:rgba(255,255,255,.08);border-radius:999px;overflow:hidden}
          .p-fill{display:block;height:100%;background:linear-gradient(90deg,#14e29a,#5fd0c7)}
          .p-prob{font-weight:800;color:#d7fff1;min-width:44px;text-align:right}
          .stage-badge{margin-left:8px;font-size:.85rem;color:#d9e8ff;background:rgba(88,230,217,.08);border:1px solid rgba(88,230,217,.25);padding:4px 8px;border-radius:8px}
          .wild-tag{margin-left:8px;font-size:.72rem;color:#ffe59a;background:rgba(245,210,107,.08);border:1px solid rgba(245,210,107,.25);padding:2px 6px;border-radius:6px}
          .empty.small{padding:12px;color:#a9bdd9}

          .snapshot-card{margin-top:16px;padding:12px;border-top:1px dashed rgba(255,255,255,.08)}
          .snapshot-title{font-weight:900;color:#e8caa4;margin-bottom:8px}
          .snapshot-help{margin:6px 0 10px;color:#cfe0ff} /* NEW */
          .snapshot-list{list-style:none;margin:0;padding:0;display:flex;flex-direction:column;gap:6px}
          .snap-label{display:inline-block;font-size:.82rem;color:#b9cdee;background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.08);padding:2px 6px;border-radius:6px;margin-right:6px}
          .snap-sub{color:#a9bdd9;margin-top:6px}
          .delta{font-size:.85rem;margin-left:6px}
          .delta.pos{color:#79e39a}
          .delta.neg{color:#ff6b7a}
          .tie-note{margin-top:8px;color:#a9bdd9;font-size:.9rem}
        `}</style>
      </div>

      {/* Info modal */}
      {infoOpen && (
        <div className="modal" onClick={() => setInfoOpen(false)}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="modal-head">
              <h3>How this page works</h3>
              <button className="modal-close" onClick={() => setInfoOpen(false)}>✕</button>
            </div>
            <div className="modal-body">
              <p>
                Server computes totals from <code>match_history</code> (ODI/T20) and returns a leaderboard.
                Predictions are recalculated on each reload using Points, Win-rate and NRR. Stages are chosen
                automatically from the team count with your rules.
              </p>
            </div>
            <div className="modal-foot">
              <button className="btn-gold" onClick={() => setInfoOpen(false)}>Got it</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
