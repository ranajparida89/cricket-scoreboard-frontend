// src/components/TournamentPoints.jsx
// Tournament Points (no UI libs)
// - Uses /api/tournaments + /api/tournaments/leaderboard
// - Robust chart labels + legend position
// - Dark pro table (top-3 get soft gold glow)

import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { API_URL } from "../services/api";
import "./TournamentPoints.css";

const MTYPES = ["All", "T20", "ODI"];

export default function TournamentPoints() {
  const [loading, setLoading] = useState(false);
  const [infoOpen, setInfoOpen] = useState(false);

  const [matchType, setMatchType] = useState("All");
  const [tournamentName, setTournamentName] = useState("");
  const [seasonYear, setSeasonYear] = useState("");

  const [catalog, setCatalog] = useState([]);     // [{ name, editions:[{season_year, match_type, matches}] }]
  const [table, setTable] = useState([]);         // API result rows

  // build filter lists from catalog
  const tournaments = useMemo(() => catalog.map(c => c.name).sort((a,b)=>a.localeCompare(b)), [catalog]);
  const years = useMemo(() => {
    const s = new Set();
    catalog.forEach(c => c.editions.forEach(e => s.add(Number(e.season_year))));
    return Array.from(s).sort((a,b)=>a-b);
  }, [catalog]);

  // series for the chart (Top 10 by points)
  const pointsSeries = useMemo(
    () => table.slice(0, 10).map(r => ({ team: r.team_name, value: Number(r.points) })),
    [table]
  );
  const nrrSeries = useMemo(
    () => table.slice(0, 10).map(r => ({ team: r.team_name, value: Number(r.nrr) })),
    [table]
  );

  async function loadCatalog() {
    const { data } = await axios.get(`${API_URL}/tournaments`, {
      params: { match_type: matchType }
    });
    setCatalog(Array.isArray(data) ? data : []);
  }

  async function reload() {
    try {
      setLoading(true);
      const params = {
        match_type: matchType
      };
      if (tournamentName) params.tournament_name = tournamentName;
      if (seasonYear)     params.season_year     = seasonYear;

      const { data } = await axios.get(`${API_URL}/tournaments/leaderboard`, { params });
      setTable(Array.isArray(data) ? data : []);
    } catch {
      setTable([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadCatalog(); }, [matchType]);
  useEffect(() => { reload(); }, [matchType, tournamentName, seasonYear]);

  // ---------- chart sizing/axes ----------
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

  // label overlap handling
  const n = pointsSeries.length || 1;
  const step = (W - PAD * 2) / Math.max(1, n - 1);
  const rotateLabels = step < 90;

  const polyPoints = (series, w, h, pad, yMin, yMax) => {
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
  };

  const Axis = ({ x, y, x2, y2, opacity=0.5 }) => (
    <line x1={x} y1={y} x2={x2} y2={y2} stroke="rgba(255,255,255,.12)" strokeWidth="1" opacity={opacity} />
  );

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
            <select value={matchType} onChange={(e)=>setMatchType(e.target.value)} className="sel dark">
              {MTYPES.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
          </label>
          <label>
            <span>Tournament</span>
            <select value={tournamentName} onChange={(e)=>setTournamentName(e.target.value)} className="sel dark">
              <option value="">All tournaments</option>
              {tournaments.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </label>
          <label>
            <span>Season Year</span>
            <select value={seasonYear} onChange={(e)=>setSeasonYear(e.target.value)} className="sel dark">
              <option value="">All years</option>
              {years.map(y => <option key={y} value={y}>{y}</option>)}
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
              <Axis x={PAD} y={H-PAD} x2={W-PAD} y2={H-PAD} />
              <Axis x={PAD} y={PAD}   x2={PAD}   y2={H-PAD} />
              <Axis x={W-PAD} y={PAD} x2={W-PAD} y2={H-PAD} opacity={0.25} />

              {leftTicks.map((v, i) => {
                const y = H - PAD - (v - 0) / Math.max(1e-6, yLMax - 0) * (H - PAD * 2);
                return <line key={`h-${i}`} x1={PAD} y1={y} x2={W-PAD} y2={y} className="grid" />;
              })}
              {pointsSeries.map((_, i) => {
                const stepX = (W - PAD * 2) / Math.max(1, n - 1);
                const x = PAD + i * stepX;
                return <line key={`v-${i}`} x1={x} y1={PAD} x2={x} y2={H-PAD} className="grid v" />;
              })}

              <text x={PAD-28} y={PAD-10} className="axis-name">Points</text>
              <text x={W-PAD+6} y={PAD-10} className="axis-name">NRR</text>

              {leftTicks.map((v, i) => {
                const y = H - PAD - (v - 0) / Math.max(1e-6, yLMax - 0) * (H - PAD * 2);
                return <text key={`lt-${i}`} x={PAD-10} y={y} className="tick left" dy="4">{v}</text>;
              })}
              {rightTicks.map((v, i) =>
                <text key={`rt-${i}`} x={W-PAD+10} y={yRight(v)} className="tick right" dy="4">{v}</text>
              )}

              <polyline className="line gold" points={polyPoints(pointsSeries, W, H, PAD, 0, yLMax)} />
              <polyline className="line teal"  points={polyPoints(nrrSeries,   W, H, PAD, nrrMin, nrrMax)} />

              {pointsSeries.map((d, i) => {
                const stepX = (W - PAD * 2) / Math.max(1, n - 1);
                const x = PAD + i * stepX;
                const yL = H - PAD - (d.value - 0) / Math.max(1e-6, yLMax - 0) * (H - PAD * 2);
                const rVal = nrrSeries[i]?.value ?? 0;
                const yR = yRight(rVal);
                return (
                  <g key={d.team}>
                    <circle cx={x} cy={yL} r="4" className="dot gold" />
                    <circle cx={x} cy={yR} r="4" className="dot teal" />
                    <text className="val goldv" x={x} y={yL - 8}>{d.value}</text>
                    <text className="val tealv" x={x} y={yR + (rVal >= 0 ? -8 : 16)}>{rVal.toFixed(2)}</text>
                    <text
                      className={`xlabel ${rotateLabels ? "small rot" : ""}`}
                      x={x} y={H - PAD + 16} dy="10"
                      transform={rotateLabels ? `rotate(-28 ${x} ${H - PAD + 16})` : undefined}
                    >
                      {d.team}
                    </text>
                  </g>
                );
              })}

              {/* Legend moved left to avoid overlap */}
              <g className="legend">
                <rect x={W-280} y={20} width="240" height="28" rx="8" className="legend-bg"/>
                <circle cx={W-260} cy={34} r="5" className="dot gold"/><text x={W-248} y={38} className="legend-txt">Points</text>
                <circle cx={W-180} cy={34} r="5" className="dot teal"/><text x={W-168} y={38} className="legend-txt">NRR</text>
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
                  <tr key={t.team_name} className={`lb-row ${idx<3 ? `top-${idx+1}` : ""}`}>
                    <td><span className="rank-badge">#{idx + 1}</span></td>
                    <td className={`tname ${idx<3 ? "goldtxt":""}`}>{t.team_name}</td>
                    <td>{t.matches}</td>
                    <td className="good">{t.wins}</td>
                    <td className="bad">{t.losses}</td>
                    <td>{t.draws}</td>
                    <td>
                      <span className={`points-chip ${idx<3 ? "top3" : "dim"}`}>{t.points}</span>
                    </td>
                    <td className={Number(t.nrr) >= 0 ? "good" : "bad"}>{Number(t.nrr).toFixed(2)}</td>
                    <td className="muted">{t.tournament_name || "—"}</td>
                    <td className="muted">{t.season_year || "—"}</td>
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
                Points & NRR are computed from <code>match_history</code> with exact winner parsing
                (e.g. <code>India won the match!</code>). Select filters above to narrow the view.
              </p>
              <ul>
                <li>Win = +2, Draw = +1.</li>
                <li>NRR = (Runs&nbsp;For / Overs&nbsp;Faced) − (Runs&nbsp;Against / Overs&nbsp;Bowled).</li>
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
