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

/* ------------------------------------------------------------------
   ADMIN DETECTION: robust + overridable
   - You can pass <TournamentPoints isAdmin />
   - Or set localStorage:
       isAdmin=true  (or admin=true / is_admin=true / tp_can_edit=1)
     OR put role: 'admin' inside any of: user, authUser, profile, auth
   - Or use env var REACT_APP_FORCE_ADMIN=true
-------------------------------------------------------------------*/
function detectAdmin(explicitProp) {
  if (typeof explicitProp === "boolean") return explicitProp;

  try {
    // direct boolean flags in localStorage
    for (const k of ["isAdmin", "admin", "is_admin", "tp_can_edit", "tp_edit"]) {
      const v = localStorage.getItem(k);
      if (v && /^(1|true|yes)$/i.test(v)) return true;
    }

    // objects with role or isAdmin flag
    for (const k of ["user", "authUser", "profile", "currentUser", "auth", "userProfile"]) {
      const raw = localStorage.getItem(k);
      if (!raw) continue;
      try {
        const o = JSON.parse(raw);
        const role =
          o?.role ??
          o?.user?.role ??
          o?.data?.role ??
          o?.profile?.role ??
          o?.currentUser?.role ??
          o?.auth?.role;
        if (role && /admin/i.test(String(role))) return true;

        const flag =
          o?.isAdmin ?? o?.user?.isAdmin ?? o?.data?.isAdmin ?? o?.profile?.isAdmin;
        if (flag === true) return true;
      } catch {}
    }

    // JWT with role / isAdmin
    const token = localStorage.getItem("token") || localStorage.getItem("jwt");
    if (token && token.split(".").length === 3) {
      try {
        const payload = JSON.parse(atob(token.split(".")[1]));
        if (/admin/i.test(String(payload.role || ""))) return true;
        if (payload.isAdmin === true) return true;
        if (Array.isArray(payload.roles) && payload.roles.some((r) => /admin/i.test(r))) {
          return true;
        }
      } catch {}
    }
  } catch {}

  if (String(process.env.REACT_APP_FORCE_ADMIN).toLowerCase() === "true") return true;
  if (typeof window !== "undefined" && (window).__TP_FORCE_ADMIN__ === true) return true;

  return false;
}

/* =========================================================
 * Team abbreviation map
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

function abbreviateTeamName(name) {
  const s = norm(name);
  if (!s) return s;
  const key = s.toLowerCase();
  if (TEAM_ABBR[key]) return TEAM_ABBR[key];
  const words = s.split(/\s+/).filter(Boolean);
  if (words.length === 1) return words[0].slice(0, 3).toUpperCase();
  return words.map((w) => w[0]).join("").slice(0, 3).toUpperCase();
}
const displayTeam = (name) => abbreviateTeamName(name);

function headerLabel(key) {
  switch (key) {
    case "rank": return "Rank";
    case "team": return "Team";
    case "matches": return "M";
    case "wins": return "W";
    case "losses": return "L";
    case "draws": return "D";
    case "points": return "Pts";
    case "nrr": return "NRR";
    case "tournament": return "TN";
    case "year": return "Yrs";
    default: return key;
  }
}

/* Chart label separations */
const LABEL = { P_DY: -14, N_POS_DY: -18, N_NEG_DY: 20, P_DX: -8, N_DX: 8, SEP_MIN: 16 };

/* UI-only overrides & editing helpers */
const NUM_FIELDS = new Set(["matches_played", "wins", "losses", "draws", "points", "season_year"]);
const FLOAT_FIELDS = new Set(["nrr"]);
const rowKeyOf = (r) => `${r.team_name}::${r.tournament_name ?? ""}::${r.season_year ?? ""}`;
const sortRows = (list) =>
  [...list].sort(
    (a, b) => b.points - a.points || b.nrr - a.nrr || a.team_name.localeCompare(b.team_name)
  );
function applyOverrides(rows, overrides) {
  const next = rows.map((r) => {
    const k = rowKeyOf(r);
    const ov = overrides[k];
    return ov ? { ...r, ...ov } : r;
  });
  return sortRows(next);
}

/* =================================================================== */
export default function TournamentPoints({ isAdmin: isAdminProp }) {
  const [loading, setLoading] = useState(false);
  const [isAdmin, setIsAdmin] = useState(detectAdmin(isAdminProp));
  useEffect(() => setIsAdmin(detectAdmin(isAdminProp)), [isAdminProp]);

  // Filters
  const [matchType, setMatchType] = useState("All");
  const [tournamentName, setTournamentName] = useState("");
  const [seasonYear, setSeasonYear] = useState("");

  // Options
  const [tournaments, setTournaments] = useState([]);
  const [years, setYears] = useState([]);

  // Data (DB truth)
  const [rows, setRows] = useState([]);
  // UI overrides
  const [overrides, setOverrides] = useState({});
  // Inline editing state
  const [editing, setEditing] = useState(null);

  const [infoOpen, setInfoOpen] = useState(false);

  /* ---------- FILTER CATALOG ---------- */
  async function loadFilters(type = matchType) {
    try {
      const { data } = await axios.get(`${API_URL}/tournaments/filters`, {
        params: { match_type: type },
      });
      setTournaments(Array.isArray(data?.tournaments) ? data.tournaments : []);
      setYears(Array.isArray(data?.years) ? data.years : []);
    } catch {
      // Fallback to legacy endpoint
      try {
        const { data } = await axios.get(`${API_URL}/tournaments`, { params: { match_type: type } });
        const cats = Array.isArray(data) ? data : [];
        setTournaments(cats.map((c) => c.name).sort((a, b) => a.localeCompare(b)));
        const yrSet = new Set();
        cats.forEach((c) =>
          (Array.isArray(c.editions) ? c.editions : []).forEach((e) => {
            if (!type || type === "All" || e.match_type === type) yrSet.add(Number(e.season_year));
          })
        );
        setYears(Array.from(yrSet).sort((a, b) => b - a));
      } catch {
        setTournaments([]);
        setYears([]);
      }
    }
  }
  useEffect(() => { loadFilters(matchType); /* eslint-disable-next-line */ }, [matchType]);

  /* ---------- LEADERBOARD ---------- */
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
  useEffect(() => { reload(); /* eslint-disable-next-line */ }, [matchType, tournamentName, seasonYear]);

  /* ---------- Apply overrides ---------- */
  const table = useMemo(() => applyOverrides(rows, overrides), [rows, overrides]);

  /* ---------- Chart series ---------- */
  const pointsSeries = useMemo(
    () => table.slice(0, 10).map((r) => ({ team: displayTeam(r.team_name), value: safeNum(r.points) })),
    [table]
  );
  const nrrSeries = useMemo(
    () => table.slice(0, 10).map((r) => ({ team: displayTeam(r.team_name), value: safeNum(r.nrr) })),
    [table]
  );

  /* ---------- Chart layout ---------- */
  const W = 980, H = 360, PAD = 44;
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

  /* ---------- Predictions ---------- */
  const modeLabel = (m) => (m === "S8" ? "Super 8" : m === "S6" ? "Super 6" : "Semi-finals");
  const fmtNrr = (n) => ((safeNum(n, 0) >= 0 ? "+" : "") + safeNum(n, 0).toFixed(2));
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

  const rankByStandings = (list) =>
    [...list].sort(
      (a, b) => b.points - a.points || b.nrr - a.nrr || b.wins - a.wins || a.team_name.localeCompare(b.team_name)
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
      const nrrNorm = (safeNum(r.nrr) - nrrMinL) / nrrRangeL;
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
    return { mode: "DIRECT_SEMIS", label: "Direct Semi-finals", cut: 4, teams };
  }

  function buildPredictions(list) {
    if (!list?.length) {
      return { mode: "EMPTY", super8: [], super6: [], semifinal: [], summary: "No data for the chosen filters.", cutoff: null, cut: 0 };
    }
    const stage = buildStage(list);
    const withProb = scoreAndProb(list);
    const rankedAll = rankByStandings(list);

    let super8 = [], super6 = [], semifinal = [];
    if (stage.mode === "S8") {
      super8 = withProb.slice(0, 8);
      const s8Names = new Set(super8.map((t) => t.team_name));
      semifinal = withProb.filter((t) => s8Names.has(t.team_name)).slice(0, 4);
    } else if (stage.mode === "S6") {
      super6 = withProb.slice(0, 6);
      const top3 = rankByStandings(super6).slice(0, 3);
      const top3Names = new Set(top3.map((t) => t.team_name));
      const rest = rankedAll.filter((t) => !top3Names.has(t.team_name));
      const wildcard = rest[0] ? [rest[0]] : [];
      semifinal = [...top3, ...wildcard];
    } else if (stage.mode === "DIRECT_SEMIS") {
      semifinal = withProb.slice(0, 4);
    }

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
    if (stage.mode === "S8") summary = `With ${stage.teams} teams in this tournament, the format is Super 8 → Semi-finals.`;
    else if (stage.mode === "S6") summary = `Exactly 9 teams detected: the format is Super 6 → Semi-finals (Top 3 + 1 wildcard by Points, then NRR tiebreak).`;
    else summary = `Not enough teams for Super 8 or Super 6; going straight to Semi-finals.`;

    return { mode: stage.mode, cut: stage.cut, super8, super6, semifinal, cutoff, summary };
  }
  const predictions = useMemo(() => buildPredictions(table), [table]);

  /* ---------- Inline editing (admin only) ---------- */
  const startEdit = (row, field) => {
    if (!isAdmin) return;
    const key = rowKeyOf(row);
    const raw = row[field] ?? "";
    setEditing({ key, field, value: String(raw) });
  };
  const commitEdit = () => {
    if (!editing) return;
    const { key, field, value } = editing;
    let nextVal = value;
    if (NUM_FIELDS.has(field)) {
      const n = parseInt(value, 10);
      nextVal = Number.isFinite(n) ? n : 0;
    } else if (FLOAT_FIELDS.has(field)) {
      const f = parseFloat(value);
      nextVal = Number.isFinite(f) ? f : 0;
    }
    setOverrides((prev) => ({ ...prev, [key]: { ...(prev[key] || {}), [field]: nextVal } }));
    setEditing(null);
  };
  const cancelEdit = () => setEditing(null);

  const adminReset = async () => {
    setOverrides({});
    setEditing(null);
    await reload(); // reload from DB (discard local changes)
  };

  /* Table cell with auto number/text input */
  const TD = ({ row, field, className = "", children }) => {
    const k = rowKeyOf(row);
    const isEditing = editing && editing.key === k && editing.field === field;
    const isNumberField = NUM_FIELDS.has(field) || FLOAT_FIELDS.has(field);
    const step = FLOAT_FIELDS.has(field) ? "0.01" : "1";

    return (
      <td
        className={`${className} ${isAdmin ? "editable" : ""}`}
        onDoubleClick={() => startEdit(row, field)}
      >
        {isEditing ? (
          <input
            className="edit-input"
            type={isNumberField ? "number" : "text"}
            step={isNumberField ? step : undefined}
            value={editing.value}
            onChange={(e) => setEditing((ed) => ({ ...ed, value: e.target.value }))}
            onBlur={commitEdit}
            onKeyDown={(e) => {
              if (e.key === "Enter") commitEdit();
              if (e.key === "Escape") cancelEdit();
            }}
            autoFocus
          />
        ) : (
          children
        )}
      </td>
    );
  };

  return (
    <div className="tp-simple">
      <div className="tp-head">
        <h2 className="tp-title">
          <span className="medal" role="img" aria-label="trophy">🏆</span>
          Tournament Points
          <button className="info-btn" onClick={() => setInfoOpen(true)}>i</button>
          {isAdmin && (
            <span style={{
              marginLeft: 10, fontSize: ".85rem", color: "#d9e8ff",
              background: "rgba(88,230,217,.08)", border: "1px solid rgba(88,230,217,.25)",
              padding: "3px 8px", borderRadius: 8
            }}>
              Admin edit mode
            </span>
          )}
        </h2>

        {/* Filters */}
        <div className="filters" style={{ marginLeft: "auto" }}>
          <label>
            <span>Match Type</span>
            <select value={matchType} onChange={(e) => setMatchType(e.target.value)} className="sel dark">
              {MTYPES.map((m) => (<option key={m} value={m}>{m}</option>))}
            </select>
          </label>

          <label>
            <span>Tournament</span>
            <select value={tournamentName} onChange={(e) => setTournamentName(e.target.value)} className="sel dark">
              <option value="">All tournaments</option>
              {tournaments.map((t) => (<option key={t} value={t}>{t}</option>))}
            </select>
          </label>

          <label>
            <span>Season Year</span>
            <select value={seasonYear} onChange={(e) => setSeasonYear(e.target.value)} className="sel dark">
              <option value="">All years</option>
              {years.map((y) => (<option key={y} value={y}>{y}</option>))}
            </select>
          </label>

          <button className="btn-gold" onClick={reload} disabled={loading}>
            {loading ? "Loading…" : "Reload"}
          </button>

          {/* Admin-only reset */}
          {isAdmin && (
            <button
              className="btn-gold"
              style={{ marginLeft: 8 }}
              onClick={adminReset}
              disabled={loading}
              title="Discard local edits and refetch from server"
            >
              Reset to DB
            </button>
          )}
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

                const pX = x + LABEL.P_DX;
                const nX = x + LABEL.N_DX;
                let pY = yL + LABEL.P_DY;
                let nY = yR + (rVal >= 0 ? LABEL.N_POS_DY : LABEL.N_NEG_DY);
                const sep = Math.abs(pY - nY);
                if (sep < LABEL.SEP_MIN) {
                  const bump = LABEL.SEP_MIN - sep + 2;
                  nY += (rVal >= 0 ? -bump : bump);
                }

                return (
                  <g key={`${d.team}-${i}`}>
                    <circle cx={x} cy={yL} r="4" className="dot gold" />
                    <circle cx={x} cy={yR} r="4" className="dot teal" />
                    <text className="val goldv" x={pX} y={pY}>{d.value}</text>
                    <text className="val tealv" x={nX} y={nY}>{Number(rVal).toFixed(2)}</text>
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
                <th>{headerLabel("rank")}</th>
                <th>{headerLabel("team")}</th>
                <th>{headerLabel("matches")}</th>
                <th>{headerLabel("wins")}</th>
                <th>{headerLabel("losses")}</th>
                <th>{headerLabel("draws")}</th>
                <th>{headerLabel("points")}</th>
                <th>{headerLabel("nrr")}</th>
                <th>{headerLabel("tournament")}</th>
                <th>{headerLabel("year")}</th>
              </tr>
            </thead>
            <tbody>
              {table.length === 0 ? (
                <tr><td colSpan="10" className="empty-row">No data</td></tr>
              ) : (
                table.map((t, idx) => (
                  <tr key={rowKeyOf(t)} className={`lb-row ${idx < 3 ? `top-${idx + 1}` : ""}`}>
                    <td><span className="rank-badge">#{idx + 1}</span></td>

                    <TD row={t} field="team_name" className={`tname ${idx < 3 ? "goldtxt" : ""}`}>
                      {displayTeam(t.team_name)}
                    </TD>

                    <TD row={t} field="matches_played">
                      {safeNum(t.matches_played)}
                    </TD>

                    <TD row={t} field="wins" className="good">
                      {safeNum(t.wins)}
                    </TD>

                    <TD row={t} field="losses" className="bad">
                      {safeNum(t.losses)}
                    </TD>

                    <TD row={t} field="draws">
                      {safeNum(t.draws)}
                    </TD>

                    <TD row={t} field="points">
                      <span className="points-chip">{safeNum(t.points)}</span>
                    </TD>

                    <TD row={t} field="nrr">
                      <span className={safeNum(t.nrr) >= 0 ? "good" : "bad"}>
                        {safeNum(t.nrr).toFixed(2)}
                      </span>
                    </TD>

                    <TD row={t} field="tournament_name" className="muted">
                      {norm(t.tournament_name) ? t.tournament_name : "—"}
                    </TD>

                    <TD row={t} field="season_year" className="muted">
                      {safeNum(t.season_year) ? t.season_year : "—"}
                    </TD>
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

        {/* Cutoff snapshot */}
        <div className="snapshot-card">
          <div className="snapshot-title">Qualification cutoff snapshot (Top {predictions.cut})</div>
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

        {/* (predictions CSS kept inline, unchanged) */}
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
          .snapshot-help{margin:6px 0 10px;color:#cfe0ff}
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
              {isAdmin && (
                <p><strong>Admin:</strong> Double-click any cell in Standings to edit it locally. Click <em>Reset to DB</em> to discard edits.</p>
              )}
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
