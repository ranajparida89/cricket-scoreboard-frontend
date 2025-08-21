// src/components/TournamentPoints.jsx
import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { API_URL } from "../services/api";
import "./TournamentPoints.css";

const MTYPES = ["All", "T20", "ODI"];
const safeNum = (v, def = 0) => (Number.isFinite(Number(v)) ? Number(v) : def);

export default function TournamentPoints() {
  const [loading, setLoading] = useState(false);
  const [infoOpen, setInfoOpen] = useState(false);

  const [matchType, setMatchType] = useState("All");
  const [tournamentName, setTournamentName] = useState("");
  const [seasonYear, setSeasonYear] = useState("");

  const [catalog, setCatalog] = useState([]);
  const [rows, setRows] = useState([]);

  const tournaments = useMemo(
    () => catalog.map((c) => c.name).sort((a, b) => a.localeCompare(b)),
    [catalog]
  );
  const years = useMemo(() => {
    const s = new Set();
    catalog.forEach((c) => c.editions.forEach((e) => s.add(Number(e.season_year))));
    return Array.from(s).sort((a, b) => a - b);
  }, [catalog]);

  async function loadCatalog() {
    try {
      const { data } = await axios.get(`${API_URL}/tournaments`, {
        params: { match_type: matchType },
      });
      setCatalog(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error("Failed to load /api/tournaments:", e);
      setCatalog([]);
    }
  }

  async function reload() {
    try {
      setLoading(true);
      const params = { match_type: matchType };
      if (tournamentName) params.tournament_name = tournamentName;
      if (seasonYear) params.season_year = seasonYear;

      const { data } = await axios.get(`${API_URL}/tournaments/leaderboard`, { params });
      setRows(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error("Failed to load /api/tournaments/leaderboard:", e);
      setRows([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    (async () => {
      await loadCatalog();
      setTournamentName("");
      setSeasonYear("");
    })();
  }, [matchType]);

  useEffect(() => { reload(); }, [matchType, tournamentName, seasonYear]);

  const table = useMemo(() => rows, [rows]);

  // Chart series (Top-10 by points; server already sorts)
  const pointsSeries = useMemo(
    () => table.slice(0, 10).map((r) => ({ team: r.team_name, value: safeNum(r.points) })),
    [table]
  );
  const nrrSeries = useMemo(
    () => table.slice(0, 10).map((r) => ({ team: r.team_name, value: safeNum(r.nrr) })),
    [table]
  );

  // Chart layout
  const W = 980, H = 360, PAD = 44;
const yLMin = 0;
const yLMax = Math.ceil(Math.max(2, ...pointsSeries.map(d => d.value)) * 1.15);
// NRR bounds (robust against empty/NaN)
const nrrVals = nrrSeries
  .map(d => Number(d.value))
  .filter(v => Number.isFinite(v));
const nrrMin = Math.min(0, ...(nrrVals.length ? nrrVals : [0]));
const nrrMax = Math.max(1, ...(nrrVals.length ? nrrVals : [1]));
const nrrRange = Math.max(1e-6, nrrMax - nrrMin);

const yRight = (v) => H - PAD - ((v - nrrMin) / nrrRange) * (H - PAD * 2);
  const n = pointsSeries.length || 1;
  const step = (W - PAD * 2) / Math.max(1, n - 1);
  const rotateLabels = step < 90;

  const polyPoints = (series, w, h, pad, yMin, yMax) => {
    const n = series.length || 1;
    const step = (w - pad * 2) / Math.max(1, n - 1);
    const yScale = (v) => {
      const t = (v - yMin) / Math.max(1e-6, yMax - yMin);
      return h - pad - t * (h - pad * 2);
    };
    return series.map((d, i) => `${pad + i * step},${yScale(d.value)}`).join(" ");
  };

  const Axis = ({ x, y, x2, y2, opacity = 0.5 }) => (
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

        {/* Filters */}
        <div className="filters">
          <label>
            <span>Match Type</span>
            <select className="sel dark" value={matchType} onChange={(e) => setMatchType(e.target.value)}>
              {MTYPES.map((m) => <option key={m} value={m}>{m}</option>)}
            </select>
          </label>
          <label>
            <span>Tournament</span>
            <select className="sel dark" value={tournamentName} onChange={(e) => setTournamentName(e.target.value)}>
              <option value="">All tournaments</option>
              {tournaments.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </label>
          <label>
            <span>Season Year</span>
            <select className="sel dark" value={seasonYear} onChange={(e) => setSeasonYear(e.target.value)}>
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
        <div className="card-head">Points &amp; NRR (Top 10)</div>
        <div className="chart-wrap">
          {pointsSeries.length ? (
            <svg viewBox={`0 0 ${W} ${H}`} className="linechart">
              <Axis x={PAD} y={H - PAD} x2={W - PAD} y2={H - PAD} />
              <Axis x={PAD} y={PAD} x2={PAD} y2={H - PAD} />
              <Axis x={W - PAD} y={PAD} x2={W - PAD} y2={H - PAD} opacity={0.25} />

              {[0, .25, .5, .75, 1].map((t,i) => {
                const v = Math.round(yLMax * t);
                const y = H - PAD - ((v - yLMin) / Math.max(1e-6, yLMax - yLMin)) * (H - PAD * 2);
                return <line key={`h${i}`} x1={PAD} y1={y} x2={W - PAD} y2={y} className="grid" />;
              })}
              {pointsSeries.map((_, i) => (
                <line key={`v${i}`} x1={PAD + i * step} y1={PAD} x2={PAD + i * step} y2={H - PAD} className="grid v" />
              ))}

              <text x={PAD-28} y={PAD-10} className="axis-name">Points</text>
              <text x={W-PAD+6} y={PAD-10} className="axis-name">NRR</text>

              {[0,.25,.5,.75,1].map((t,i) => {
                const v = Math.round(yLMax * t);
                const y = H - PAD - ((v - yLMin) / Math.max(1e-6, yLMax - yLMin)) * (H - PAD * 2);
                return <text key={`lt${i}`} x={PAD-10} y={y} className="tick left" dy="4">{v}</text>;
              })}
              {[0,.5,1].map((t,i) => {
                const v = +(nrrMin + t * (nrrMax - nrrMin)).toFixed(2);
                return <text key={`rt${i}`} x={W - PAD + 10} y={yRight(v)} className="tick right" dy="4">{v}</text>;
              })}

              <polyline className="line gold" points={polyPoints(pointsSeries, W, H, PAD, 0, yLMax)} />
              <polyline className="line teal" points={polyPoints(nrrSeries, W, H, PAD, nrrMin, nrrMax)} />

              {pointsSeries.map((d, i) => {
                const x = PAD + i * step;
                const yL = H - PAD - ((d.value - 0) / Math.max(1e-6, yLMax - 0)) * (H - PAD * 2);
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

              <g className="legend">
                <rect x={W-280} y={20} width="240" height="28" rx="8" className="legend-bg"/>
                <circle cx={W-260} cy={34} r="5" className="dot gold"/><text x={W-248} y={38} className="legend-txt">Points</text>
                <circle cx={W-180} cy={34} r="5" className="dot teal"/><text x={W-168} y={38} className="legend-txt">NRR</text>
              </g>
            </svg>
          ) : <div className="empty">No data</div>}
        </div>
      </div>

      {/* Standings */}
      <div className="card tp-table-card">
        <div className="card-head">Standings</div>
        <div className="table-wrap">
          <table className="tp-table">
            <thead>
              <tr>
                <th>#</th><th>Team</th><th>Matches</th><th>Wins</th><th>Losses</th>
                <th>Draws</th><th>Points</th><th>NRR</th><th>Tournament</th><th>Year</th>
              </tr>
            </thead>
            <tbody>
              {table.length === 0 ? (
                <tr><td colSpan="10" className="empty-row">No data</td></tr>
              ) : table.map((t, idx) => (
                <tr key={t.team_name} className={`lb-row ${idx < 3 ? `top-${idx+1}` : ""}`}>
                  <td><span className="rank-badge">#{idx+1}</span></td>
                  <td className={`tname ${idx<3 ? "goldtxt":""}`}>{t.team_name}</td>
                  <td>{safeNum(t.matches)}</td>
                  <td className="good">{safeNum(t.wins)}</td>
                  <td className="bad">{safeNum(t.losses)}</td>
                  <td>{safeNum(t.draws)}</td>
                  <td><span className={`points-chip ${idx<3 ? "top3" : "dim"}`}>{safeNum(t.points)}</span></td>
                  <td className={safeNum(t.nrr) >= 0 ? "good" : "bad"}>{safeNum(t.nrr).toFixed(2)}</td>
                  <td className="muted">{t.tournament_name || "—"}</td>
                  <td className="muted">{t.season_year || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
