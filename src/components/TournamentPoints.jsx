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

export default function TournamentPoints() {
  const [loading, setLoading] = useState(false);

  // Filters
  const [matchType, setMatchType] = useState("All");
  const [tournamentName, setTournamentName] = useState("");
  const [seasonYear, setSeasonYear] = useState("");

  // Dropdown catalog
  const [catalog, setCatalog] = useState([]);

  // Table rows
  const [rows, setRows] = useState([]);

  const [infoOpen, setInfoOpen] = useState(false);

  // Load tournaments catalog for current matchType
  useEffect(() => {
    (async () => {
      try {
        const { data } = await axios.get(`${API_URL}/tournaments`, {
          params: { match_type: matchType },
        });
        setCatalog(Array.isArray(data) ? data : []);
      } catch {
        setCatalog([]);
      }
    })();
  }, [matchType]);

  // Build dropdown lists
  const tournaments = useMemo(
    () => catalog.map((c) => c.name).sort((a, b) => a.localeCompare(b)),
    [catalog]
  );
  const years = useMemo(() => {
    const s = new Set();
    catalog.forEach((c) =>
      c.editions.forEach((e) => {
        if (!matchType || matchType === "All" || e.match_type === matchType) {
          s.add(Number(e.season_year));
        }
      })
    );
    return Array.from(s).sort((a, b) => a - b);
  }, [catalog, matchType]);

  // Load leaderboard (server does all maths from TEAMS table, with filters)
  async function reload() {
    try {
      setLoading(true);
      const params = { match_type: matchType };
      if (norm(tournamentName)) params.tournament_name = tournamentName;
      if (norm(seasonYear)) params.season_year = Number(seasonYear);

      const { data } = await axios.get(`${API_URL}/teams/leaderboard`, { params });

      const normalized = (Array.isArray(data) ? data : []).map((r) => ({
        team_name: r.team_name,
        matches_played: safeNum(r.matches_played),
        wins: safeNum(r.wins),
        losses: safeNum(r.losses),
        draws: safeNum(r.draws),
        points: safeNum(r.points),
        nrr: safeNum(r.nrr),
        tournament_name: r.tournament_name ?? null, // echoed from backend
        season_year: r.season_year ?? null,         // echoed from backend
      }));

      // Defensive sort (backend already orders this way)
      normalized.sort(
        (a, b) =>
          b.points - a.points ||
          b.nrr - a.nrr ||
          a.team_name.localeCompare(b.team_name)
      );

      setRows(normalized);
    } catch (e) {
      console.error("Failed to load /teams/leaderboard:", e);
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

  const pointsSeries = useMemo(
    () =>
      table.slice(0, 10).map((r) => ({
        team: r.team_name,
        value: safeNum(r.points),
      })),
    [table]
  );
  const nrrSeries = useMemo(
    () =>
      table.slice(0, 10).map((r) => ({
        team: r.team_name,
        value: safeNum(r.nrr),
      })),
    [table]
  );

  // ---------- Chart layout (robust bounds) ----------
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
    <line
      x1={x}
      y1={y}
      x2={x2}
      y2={y2}
      stroke="rgba(255,255,255,.12)"
      strokeWidth="1"
      opacity={opacity}
    />
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
                const y =
                  H - PAD - ((v - yLMin) / Math.max(1e-6, yLMax - yLMin)) * (H - PAD * 2);
                return <line key={`h${i}`} x1={PAD} y1={y} x2={W - PAD} y2={y} className="grid" />;
              })}
              {pointsSeries.map((_, i) => (
                <line key={`v${i}`} x1={PAD + i * step} y1={PAD} x2={PAD + i * step} y2={H - PAD} className="grid v" />
              ))}

              <text x={PAD - 28} y={PAD - 10} className="axis-name">Points</text>
              <text x={W - PAD + 6} y={PAD - 10} className="axis-name">NRR</text>

              {[0, 0.25, 0.5, 0.75, 1].map((t, i) => {
                const v = Math.round(yLMax * t);
                const y =
                  H - PAD - ((v - yLMin) / Math.max(1e-6, yLMax - yLMin)) * (H - PAD * 2);
                return <text key={`lt${i}`} x={PAD - 10} y={y} className="tick left" dy="4">{v}</text>;
              })}
              {[0, 0.5, 1].map((t, i) => {
                const v = +(nrrMin + t * (nrrMax - nrrMin)).toFixed(2);
                return <text key={`rt${i}`} x={W - PAD + 10} y={yRight(v)} className="tick right" dy="4">{v}</text>;
              })}

              <polyline className="line gold" points={polyPoints(pointsSeries, W, H, PAD, yLMin, yLMax)} />
              <polyline className="line teal"  points={polyPoints(nrrSeries,   W, H, PAD, nrrMin, nrrMax)} />

              {pointsSeries.map((d, i) => {
                const x = PAD + i * step;
                const yL =
                  H - PAD - ((d.value - yLMin) / Math.max(1e-6, yLMax - yLMin)) * (H - PAD * 2);
                const rVal = nrrSeries[i]?.value ?? 0;
                const yR = yRight(rVal);
                return (
                  <g key={d.team}>
                    <circle cx={x} cy={yL} r="4" className="dot gold" />
                    <circle cx={x} cy={yR} r="4" className="dot teal" />
                    <text className="val goldv" x={x} y={yL - 8}>{d.value}</text>
                    <text className="val tealv"  x={x} y={yR + (rVal >= 0 ? -8 : 16)}>{Number(rVal).toFixed(2)}</text>
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
                <tr><td colSpan="10" className="empty-row">No data</td></tr>
              ) : (
                table.map((t, idx) => (
                  <tr
                    key={t.team_name}
                    className={`lb-row ${idx < 3 ? `top-${idx + 1}` : ""}`}  // ✅ highlight full row for top 3
                  >
                    <td><span className="rank-badge">#{idx + 1}</span></td>
                    <td className={`tname ${idx < 3 ? "goldtxt" : ""}`}>{t.team_name}</td>
                    <td>{safeNum(t.matches_played)}</td>
                    <td className="good">{safeNum(t.wins)}</td>
                    <td className="bad">{safeNum(t.losses)}</td>
                    <td>{safeNum(t.draws)}</td>

                    {/* Neutral points chip (no yellow focus now) */}
                    <td><span className="points-chip">{safeNum(t.points)}</span></td>

                    <td className={safeNum(t.nrr) >= 0 ? "good" : "bad"}>
                      {safeNum(t.nrr).toFixed(2)}
                    </td>
                    <td className="muted">
                      {norm(t.tournament_name) ? t.tournament_name : "—"}
                    </td>
                    <td className="muted">
                      {safeNum(t.season_year) ? t.season_year : "—"}
                    </td>
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
                Server computes totals from <code>teams</code> with filters via <code>matches</code>
                (Win=2, Draw=1; NRR is run-rate diff). No joins that alter totals.
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
