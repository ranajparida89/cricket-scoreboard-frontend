// Tournament Points (no libraries)
// - Fetches /api/match-history
// - Client-calculates Points + NRR for ODI/T20
// - SVG dual-line chart with value labels + grid
// - Dark filters + info modal
// - Slick dark table (replaces previous card grid)

import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { API_URL } from "../services/api";
import "./TournamentPoints.css";

/* ---------------- helpers ---------------- */
const MTYPES = ["All", "T20", "ODI"]; // ignoring Test here

const canon = (s) => (s || "").toString().trim().toLowerCase();
const num = (v) => (v == null || v === "" || Number.isNaN(Number(v)) ? 0 : Number(v));

const isDraw = (winner) => {
  const w = canon(winner);
  return w === "draw" || w === "match draw" || w === "match drawn";
};

const winnerIsTeam = (winner, team) => {
  const w = canon(winner);
  const t = canon(team);
  return w === t || w.startsWith(t + " ") || w.includes(`${t} won`);
};

function buildTable(rows, { matchType, tournamentName, seasonYear }) {
  const map = new Map();

  const filtered = rows.filter((r) => {
    const mt = (r.match_type || "").toString();
    if (matchType !== "All" && mt !== matchType) return false;
    if (tournamentName && canon(r.tournament_name) !== canon(tournamentName)) return false;
    if (seasonYear && Number(r.season_year) !== Number(seasonYear)) return false;
    return mt === "T20" || mt === "ODI";
  });

  for (const r of filtered) {
    const t1 = r.team1, t2 = r.team2, w = r.winner;

    let t1Win = false, t2Win = false, draw = false;
    if (isDraw(w)) draw = true;
    else if (winnerIsTeam(w, t1)) t1Win = true;
    else if (winnerIsTeam(w, t2)) t2Win = true;

    const rf1 = num(r.runs1), rf2 = num(r.runs2);
    const o1  = num(r.overs1), o2  = num(r.overs2);

    if (!map.has(t1)) map.set(t1, { team: t1, matches: 0, wins: 0, losses: 0, draws: 0, points: 0, rf: 0, of: 0, ra: 0, ob: 0, tournament_name: r.tournament_name ?? "—", season_year: r.season_year ?? "—" });
    if (!map.has(t2)) map.set(t2, { team: t2, matches: 0, wins: 0, losses: 0, draws: 0, points: 0, rf: 0, of: 0, ra: 0, ob: 0, tournament_name: r.tournament_name ?? "—", season_year: r.season_year ?? "—" });

    const s1 = map.get(t1);
    s1.matches += 1; s1.rf += rf1; s1.of += o1; s1.ra += rf2; s1.ob += o2;
    if (t1Win) { s1.wins += 1; s1.points += 2; }
    else if (draw) { s1.draws += 1; s1.points += 1; }
    else { s1.losses += 1; }

    const s2 = map.get(t2);
    s2.matches += 1; s2.rf += rf2; s2.of += o2; s2.ra += rf1; s2.ob += o1;
    if (t2Win) { s2.wins += 1; s2.points += 2; }
    else if (draw) { s2.draws += 1; s2.points += 1; }
    else { s2.losses += 1; }
  }

  const table = Array.from(map.values()).map((s) => {
    const nrrFor = s.of > 0 ? s.rf / s.of : 0;
    const nrrAg  = s.ob > 0 ? s.ra / s.ob : 0;
    const nrr    = Number((nrrFor - nrrAg).toFixed(2));
    return { ...s, nrr };
  });

  table.sort((a, b) => b.points - a.points || b.nrr - a.nrr || a.team.localeCompare(b.team));
  return table;
}

function extractFilters(rows) {
  const tnames = new Set();
  const years = new Set();
  rows.forEach((r) => {
    if (r.tournament_name) tnames.add(r.tournament_name);
    if (r.season_year) years.add(Number(r.season_year));
  });
  return {
    tournaments: Array.from(tnames).sort((a, b) => a.localeCompare(b)),
    years: Array.from(years).sort((a, b) => a - b),
  };
}

/* ---------------- SVG line helpers ---------------- */
function polyPoints(series, w, h, pad, yMin, yMax) {
  const n = series.length || 1;
  const step = (w - pad * 2) / Math.max(1, n - 1);
  const yScale = (v) => {
    const t = (v - yMin) / Math.max(1e-6, (yMax - yMin));
    return h - pad - t * (h - pad * 2);
  };
  return series.map((d, i) => {
    const x = pad + i * step;
    const y = yScale(d.value);
    return `${x},${y}`;
  }).join(" ");
}

function Axis({ x, y, x2, y2, opacity=0.5 }) {
  return <line x1={x} y1={y} x2={x2} y2={y2} stroke="rgba(255,255,255,.12)" strokeWidth="1" opacity={opacity} />;
}

/* ---------------- component ---------------- */
export default function TournamentPoints() {
  const [loading, setLoading] = useState(false);
  const [rows, setRows] = useState([]);
  const [infoOpen, setInfoOpen] = useState(false);

  const [matchType, setMatchType] = useState("T20");
  const [tournamentName, setTournamentName] = useState("");
  const [seasonYear, setSeasonYear] = useState("");

  const { tournaments, years } = useMemo(() => extractFilters(rows), [rows]);
  const table = useMemo(
    () => buildTable(rows, { matchType, tournamentName: tournamentName || undefined, seasonYear: seasonYear || undefined }),
    [rows, matchType, tournamentName, seasonYear]
  );

  const topTeams = useMemo(() => table.slice(0, 10).map((t) => t.team), [table]);
  const pointsSeries = useMemo(
    () => table.filter(t => topTeams.includes(t.team)).map(({ team, points }) => ({ team, value: points })),
    [table, topTeams]
  );
  const nrrSeries = useMemo(
    () => table.filter(t => topTeams.includes(t.team)).map(({ team, nrr }) => ({ team, value: nrr })),
    [table, topTeams]
  );

  async function reload() {
    try {
      setLoading(true);
      const params = {};
      if (matchType !== "All") params.match_type = matchType;
      const { data } = await axios.get(`${API_URL}/match-history`, { params });
      setRows(Array.isArray(data) ? data : []);
    } catch {
      setRows([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { reload(); }, []); // initial

  // SVG chart sizing + scales
  const W = 980, H = 360, PAD = 44;
  const ptsMax = Math.max(2, ...pointsSeries.map(d => d.value));
  const yLMin = 0, yLMax = Math.ceil(ptsMax * 1.15);
  const nrrMin = Math.min(0, ...nrrSeries.map(d => d.value));
  const nrrMax = Math.max(1, ...nrrSeries.map(d => d.value));
  const nrrRange = Math.max(1, nrrMax - nrrMin);

  const yRight = (v) => {
    const t = (v - nrrMin) / nrrRange;
    return H - PAD - t * (H - PAD * 2);
  };

  // ticks + grids
  const leftTicks = [0, 0.25, 0.5, 0.75, 1].map(t => Math.round(yLMax * t));
  const rightTicks = [0, 0.5, 1].map(t => +(nrrMin + t * (nrrMax - nrrMin)).toFixed(2));

  return (
    <div className="tp-simple">
      <div className="tp-head">
        <h2 className="tp-title">
          <span className="medal" role="img" aria-label="trophy">🏆</span>
          Tournament Points
          <button className="info-btn" onClick={() => setInfoOpen(true)}>i</button>
        </h2>

        <div className="filters">
          <label>
            <span>Match Type</span>
            <select value={matchType} onChange={(e) => setMatchType(e.target.value)} className="sel dark">
              {MTYPES.map((m) => <option key={m} value={m}>{m}</option>)}
            </select>
          </label>
          <label>
            <span>Tournament</span>
            <select value={tournamentName} onChange={(e) => setTournamentName(e.target.value)} className="sel dark">
              <option value="">All tournaments</option>
              {tournaments.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </label>
          <label>
            <span>Season Year</span>
            <select value={seasonYear} onChange={(e) => setSeasonYear(e.target.value)} className="sel dark">
              <option value="">All years</option>
              {years.map((y) => <option key={y} value={y}>{y}</option>)}
            </select>
          </label>
          <button className="btn-gold" onClick={reload} disabled={loading}>
            {loading ? "Loading…" : "Reload"}
          </button>
        </div>
      </div>

      {/* Chart */}
      <div className="card tp-chart">
        <div className="card-head">Points & NRR (Top 10)</div>
        <div className="chart-wrap">
          {pointsSeries.length ? (
            <svg viewBox={`0 0 ${W} ${H}`} className="linechart">
              {/* Axes */}
              <Axis x={PAD} y={H-PAD} x2={W-PAD} y2={H-PAD} />
              <Axis x={PAD} y={PAD}   x2={PAD}   y2={H-PAD} />
              <Axis x={W-PAD} y={PAD} x2={W-PAD} y2={H-PAD} opacity={0.25} />

              {/* Gridlines (horizontal for left scale) */}
              {leftTicks.map((v, i) => {
                const y = H - PAD - (v - yLMin) / Math.max(1e-6, yLMax - yLMin) * (H - PAD * 2);
                return <line key={`h-${i}`} x1={PAD} y1={y} x2={W-PAD} y2={y} className="grid" />;
              })}

              {/* Vertical gridlines (per x step) */}
              {pointsSeries.map((_, i) => {
                const n = pointsSeries.length || 1;
                const step = (W - PAD * 2) / Math.max(1, n - 1);
                const x = PAD + i * step;
                return <line key={`v-${i}`} x1={x} y1={PAD} x2={x} y2={H-PAD} className="grid v" />;
              })}

              {/* Axis labels */}
              <text x={PAD-28} y={PAD-10} className="axis-name">Points</text>
              <text x={W-PAD+6} y={PAD-10} className="axis-name">NRR</text>

              {/* Left ticks (Points) */}
              {leftTicks.map((v, i) => {
                const y = H - PAD - (v - yLMin) / Math.max(1e-6, yLMax - yLMin) * (H - PAD * 2);
                return <text key={`lt-${i}`} x={PAD-10} y={y} className="tick left" dy="4">{v}</text>;
              })}

              {/* Right ticks (NRR) */}
              {rightTicks.map((v, i) => <text key={`rt-${i}`} x={W-PAD+10} y={yRight(v)} className="tick right" dy="4">{v}</text>)}

              {/* Lines */}
              <polyline className="line gold" points={polyPoints(pointsSeries, W, H, PAD, yLMin, yLMax)} />
              <polyline className="line teal"  points={polyPoints(nrrSeries,   W, H, PAD, nrrMin, nrrMax)} />

              {/* Points + value labels */}
              {pointsSeries.map((d, i) => {
                const n = pointsSeries.length || 1;
                const step = (W - PAD * 2) / Math.max(1, n - 1);
                const x = PAD + i * step;
                const yL = H - PAD - (d.value - yLMin) / Math.max(1e-6, yLMax - yLMin) * (H - PAD * 2);
                const rVal = nrrSeries[i]?.value ?? 0;
                const yR = yRight(rVal);
                return (
                  <g key={d.team}>
                    <circle cx={x} cy={yL} r="4" className="dot gold" />
                    <circle cx={x} cy={yR} r="4" className="dot teal" />
                    <text className="val goldv" x={x} y={yL - 8}>{d.value}</text>
                    <text className="val tealv" x={x} y={yR + (rVal >= 0 ? -8 : 16)}>{rVal.toFixed(2)}</text>
                    <text className="xlabel" x={x} y={H - PAD + 16} dy="10">{d.team}</text>
                  </g>
                );
              })}

              {/* Legend */}
              <g className="legend">
                <rect x={W-220} y={20} width="200" height="28" rx="8" className="legend-bg"/>
                <circle cx={W-200} cy={34} r="5" className="dot gold"/><text x={W-188} y={38} className="legend-txt">Points</text>
                <circle cx={W-120} cy={34} r="5" className="dot teal"/><text x={W-108} y={38} className="legend-txt">NRR</text>
              </g>
            </svg>
          ) : (
            <div className="empty">No data</div>
          )}
        </div>
      </div>

      {/* Standings table */}
      <div className="card tp-table-card">
        <div className="card-head">Standings</div>
        <div className="table-wrap">
          <table className="tp-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Team</th>
                <th>Matches</th>
                <th>Wins</th>
                <th>Losses</th>
                <th>Draws</th>
                <th>Points</th>
                <th>NRR</th>
                <th>Tournament</th>
                <th>Year</th>
              </tr>
            </thead>
            <tbody>
              {table.length === 0 ? (
                <tr><td colSpan="10" className="empty-row">No matches for this selection</td></tr>
              ) : (
                table.map((t, idx) => (
                  <tr key={t.team} className={`r${idx+1 <=3 ? idx+1 : ""}`}>
                    <td><span className="rank-badge">#{idx + 1}</span></td>
                    <td className={`tname ${idx<3 ? "goldtxt":""}`}>{t.team}</td>
                    <td>{t.matches}</td>
                    <td className="good">{t.wins}</td>
                    <td className="bad">{t.losses}</td>
                    <td>{t.draws}</td>
                    <td>
                      <span className={`points-chip ${idx<3 ? "pulse":""}`}>{t.points}</span>
                    </td>
                    <td className={t.nrr >= 0 ? "good" : "bad"}>{t.nrr.toFixed(2)}</td>
                    <td className="muted">{t.tournament_name ?? "—"}</td>
                    <td className="muted">{t.season_year ?? "—"}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
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
                We compute <b>Points</b> and <b>NRR</b> on the client using data from
                <code> /api/match-history</code>. Only ODI/T20 matches are included here.
              </p>
              <ul>
                <li>Win = +2 points, Draw = +1 point.</li>
                <li>NRR = (Runs&nbsp;For / Overs&nbsp;Faced) − (Runs&nbsp;Against / Overs&nbsp;Bowled).</li>
                <li>Use the filters to narrow by match type, tournament, and year.</li>
              </ul>
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
