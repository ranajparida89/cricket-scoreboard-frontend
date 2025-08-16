// H2HRecords.js — H2H redesign (bugfix for TEST + diverging player chart + subtler "i")
// NOTE: no chart animations (mobile-stable)

import React, { useState, useEffect, useMemo } from "react";
import "./H2HRecords.css";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, Legend,
  CartesianGrid, ResponsiveContainer, PieChart, Pie, Cell, LabelList, ReferenceLine
} from "recharts";
import { FaInfoCircle } from "react-icons/fa";

const API = "https://cricket-scoreboard-backend.onrender.com";

const H2HRecords = () => {
  const [teams, setTeams] = useState([]);
  const [team1, setTeam1] = useState("");
  const [team2, setTeam2] = useState("");
  const [matchType, setMatchType] = useState("ALL");
  const [summary, setSummary] = useState(null);
  const [loadingSummary, setLoadingSummary] = useState(false);

  const [players, setPlayers] = useState([]);
  const [player1, setPlayer1] = useState("");
  const [player2, setPlayer2] = useState("");
  const [playerStats, setPlayerStats] = useState(null);
  const [loadingPlayers, setLoadingPlayers] = useState(false);

  const [teamError, setTeamError] = useState("");
  const [playerError, setPlayerError] = useState("");
  const [showInfo, setShowInfo] = useState(false);

  // palette
  const COLORS = {
    t1: "#22d3ee",   // cyan for Team/Player 1
    t2: "#f87171",   // rose for Team/Player 2
    draw: "#94a3b8", // neutral
    grid: "#334155",
  };

  // ---------- Load lists ----------
  useEffect(() => {
    fetch(`${API}/api/h2h/teams`)
      .then(res => res.json())
      .then(data => {
        const cleaned = (data || []).filter(n => /^[a-zA-Z ]+$/.test(n)).sort();
        setTeams(cleaned);
      })
      .catch(err => console.error("Failed to load team list", err));
  }, []);

  useEffect(() => {
    fetch(`${API}/api/players/list`)
      .then(res => res.json())
      .then(data => setPlayers(data || []))
      .catch(err => console.error("Failed to load players", err));
  }, []);

  // ---------- H2H summary ----------
  useEffect(() => {
    if (team1 && team2) {
      if (team1.toLowerCase() === team2.toLowerCase()) {
        setTeamError("⚠️ Please select two different teams.");
        return;
      } else {
        setTeamError("");
      }
    }
    if (team1 && team2 && matchType && team1 !== team2) {
      setLoadingSummary(true);
      fetch(
        `${API}/api/h2h/summary?team1=${encodeURIComponent(team1)}&team2=${encodeURIComponent(team2)}&type=${matchType}`
      )
        .then(res => res.json())
        .then(data => setSummary(data))
        .catch(err => console.error("Failed to fetch H2H summary", err))
        .finally(() => setLoadingSummary(false));
    }
  }, [team1, team2, matchType]);

  // ---------- Player comparison ----------
  useEffect(() => {
    if (player1 && player2) {
      if (player1.toLowerCase() === player2.toLowerCase()) {
        setPlayerError("⚠️ Please select two different players.");
        return;
      } else {
        setPlayerError("");
      }
    }
    if (player1 && player2 && player1 !== player2) {
      setLoadingPlayers(true);
      fetch(
        `${API}/api/players/compare?player1=${encodeURIComponent(player1)}&player2=${encodeURIComponent(player2)}`
      )
        .then(res => res.json())
        .then(data => setPlayerStats(data?.players || null))
        .catch(err => console.error("Failed to fetch player stats", err))
        .finally(() => setLoadingPlayers(false));
    }
  }, [player1, player2]);

  // ---------- Derived chart data ----------
  const teamBarData = useMemo(() => {
    if (!summary || !team1 || !team2) return [];
    const t1w = Number(summary[team1] || 0);
    const t2w = Number(summary[team2] || 0);
    const draws = Number(summary.draws || 0);
    const t1l = t2w;
    const t2l = t1w;
    return [
      { metric: "Wins", [team1]: t1w, [team2]: t2w },
      { metric: "Losses", [team1]: t1l, [team2]: t2l },
      { metric: "Draws", [team1]: draws, [team2]: draws },
    ];
  }, [summary, team1, team2]);

  const outcomePieData = useMemo(() => {
    if (!summary || !team1 || !team2) return [];
    return [
      { name: `${team1} Wins`, value: Number(summary[team1] || 0), color: COLORS.t1 },
      { name: `${team2} Wins`, value: Number(summary[team2] || 0), color: COLORS.t2 },
      { name: "Draws", value: Number(summary.draws || 0), color: COLORS.draw },
    ];
  }, [summary, team1, team2]);

  const kpi = useMemo(() => {
    if (!summary || !team1 || !team2) return null;
    const total = Number(summary.total_matches || 0);
    const t1w = Number(summary[team1] || 0);
    const t2w = Number(summary[team2] || 0);
    const d  = Number(summary.draws || 0);
    const t1p = Number(summary.win_percentage_team1 || 0);
    const t2p = Number(summary.win_percentage_team2 || 0);
    return { total, t1w, t2w, draws: d, t1p, t2p, t1l: t2w, t2l: t1w };
  }, [summary, team1, team2]);

  // ------------ Player diverging data (mirror bars) ------------
  const playerMirrorData = useMemo(() => {
    if (!playerStats || !player1 || !player2) return [];
    const a = playerStats[player1] || {};
    const b = playerStats[player2] || {};
    const num = (x) => (x === null || x === undefined || x === "" ? 0 : Number(x));

    const rows = [
      { metric: "Runs", a: num(a.runs), b: num(b.runs) },
      { metric: "Centuries", a: num(a.centuries), b: num(b.centuries) },
      { metric: "Fifties", a: num(a.fifties), b: num(b.fifties) },
      { metric: "Batting Avg", a: num(a.batting_avg), b: num(b.batting_avg) },
      { metric: "Highest Score", a: num(a.highest), b: num(b.highest) },
      { metric: "Wickets", a: num(a.wickets), b: num(b.wickets) },
      { metric: "Bowling Avg (↓ better)", a: num(a.bowling_avg), b: num(b.bowling_avg) },
    ];

    // Convert player1 to negative so it renders to the left of zero
    return rows.map(r => ({ metric: r.metric, [player1]: -r.a, [player2]: r.b }));
  }, [playerStats, player1, player2]);

  const mirrorDomain = useMemo(() => {
    if (!playerMirrorData.length) return [-10, 10];
    const maxAbs = Math.max(
      ...playerMirrorData.flatMap(d => [Math.abs(d[player1] || 0), Math.abs(d[player2] || 0)])
    );
    const pad = Math.ceil(maxAbs * 0.12);
    return [-(maxAbs + pad), (maxAbs + pad)];
  }, [playerMirrorData, player1, player2]);

  const absTick = (v) => Math.abs(v);

  return (
    <div className="h2h-wrap">
      {/* Title row */}
      <div className="h2h-topbar">
        <h2 className="h2h-title">VS Head-to-Head Records</h2>
        <button
          className="info-fab subtle"
          title="About this page"
          aria-label="About this page"
          onClick={() => setShowInfo(true)}
        >
          <FaInfoCircle />
        </button>
      </div>

      {/* Selectors */}
      <div className="h2h-row h2h-selects">
        <select value={team1} onChange={e => setTeam1(e.target.value)} className="sel">
          <option value="">Select Team 1</option>
          {teams.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
        <select value={team2} onChange={e => setTeam2(e.target.value)} className="sel">
          <option value="">Select Team 2</option>
          {teams.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
        <select value={matchType} onChange={e => setMatchType(e.target.value)} className="sel sel-type">
          <option value="ALL">All</option>
          <option value="ODI">ODI</option>
          <option value="T20">T20</option>
          <option value="TEST">Test</option>
        </select>
      </div>

      {teamError && <div className="alert warn">{teamError}</div>}
      {loadingSummary && <div className="alert">Loading summary…</div>}

      {/* Summary + KPIs */}
      {summary && !teamError && (
        <>
          <div className="summary-card">
            <div className="sum-head">
              <span className="sum-title">Summary</span>
              <span className="sum-type">Format: {matchType === "ALL" ? "All Formats" : matchType}</span>
            </div>
            <div className="kpi-grid">
              <div className="kpi">
                <div className="kpi-label">Total Matches</div>
                <div className="kpi-value">{kpi?.total ?? 0}</div>
              </div>

              <div className="kpi kpi-t1">
                <div className="kpi-pill">{team1 || "Team 1"}</div>
                <div className="kpi-pair"><span>Wins</span><b>{kpi?.t1w ?? 0}</b></div>
                <div className="kpi-pair"><span>Losses</span><b>{kpi?.t1l ?? 0}</b></div>
                <div className="kpi-pair"><span>Win %</span><b>{kpi?.t1p ?? 0}%</b></div>
              </div>

              <div className="kpi kpi-t2">
                <div className="kpi-pill">{team2 || "Team 2"}</div>
                <div className="kpi-pair"><span>Wins</span><b>{kpi?.t2w ?? 0}</b></div>
                <div className="kpi-pair"><span>Losses</span><b>{kpi?.t2l ?? 0}</b></div>
                <div className="kpi-pair"><span>Win %</span><b>{kpi?.t2p ?? 0}%</b></div>
              </div>

              <div className="kpi">
                <div className="kpi-label">Draws</div>
                <div className="kpi-value">{kpi?.draws ?? 0}</div>
              </div>
            </div>
          </div>

          {/* Charts row */}
          <div className="charts-grid">
            <div className="chart-card">
              <div className="chart-title">Outcome Comparison</div>
              <ResponsiveContainer width="100%" height={320}>
                <BarChart data={teamBarData} margin={{ top: 4, right: 8, left: 0, bottom: 4 }}>
                  <CartesianGrid vertical={false} stroke={COLORS.grid} strokeDasharray="3 3" />
                  <XAxis dataKey="metric" tick={{ fill: "#93a4c3", fontSize: 12 }} />
                  <YAxis allowDecimals={false} tick={{ fill: "#93a4c3", fontSize: 12 }} />
                  <Tooltip contentStyle={{ background: "#0b1420", border: "1px solid #2a3f60", color: "#eaf2ff" }} />
                  <Legend wrapperStyle={{ color: "#c7d4ea", fontSize: 12 }} />
                  <Bar dataKey={team1} fill={COLORS.t1} barSize={22} isAnimationActive={false} radius={[6,6,0,0]}>
                    <LabelList dataKey={team1} position="top" fill="#cdeefa" fontSize={12}/>
                  </Bar>
                  <Bar dataKey={team2} fill={COLORS.t2} barSize={22} isAnimationActive={false} radius={[6,6,0,0]}>
                    <LabelList dataKey={team2} position="top" fill="#ffd8d8" fontSize={12}/>
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="chart-card">
              <div className="chart-title">Result Share</div>
              <ResponsiveContainer width="100%" height={320}>
                <PieChart>
                  <Pie
                    data={outcomePieData}
                    dataKey="value"
                    innerRadius={70}
                    outerRadius={110}
                    paddingAngle={2}
                    isAnimationActive={false}
                  >
                    {outcomePieData.map((e, i) => <Cell key={i} fill={e.color} />)}
                    <LabelList dataKey="value" position="outside" fill="#eaf2ff" fontSize={12}/>
                  </Pie>
                  <Tooltip contentStyle={{ background: "#0b1420", border: "1px solid #2a3f60", color: "#eaf2ff" }} />
                  <Legend wrapperStyle={{ color: "#c7d4ea", fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </>
      )}

      {/* Player comparison */}
      <div className="player-sec">
        <h3 className="h3">Player Comparison</h3>

        <div className="h2h-row h2h-selects">
          <select value={player1} onChange={e => setPlayer1(e.target.value)} className="sel">
            <option value="">Select Player 1</option>
            {players.map(p => <option key={p} value={p}>{p}</option>)}
          </select>
          <select value={player2} onChange={e => setPlayer2(e.target.value)} className="sel">
            <option value="">Select Player 2</option>
            {players.map(p => <option key={p} value={p}>{p}</option>)}
          </select>
        </div>

        {playerError && <div className="alert warn">{playerError}</div>}
        {loadingPlayers && <div className="alert">Loading player comparison…</div>}

        {playerStats && playerStats[player1] && playerStats[player2] && !playerError && (
          <div className="player-card">
            <div className="legend-row">
              <div className="legend-chip" style={{ background: COLORS.t1 }} />
              <span>{player1}</span>
              <div className="legend-chip" style={{ background: COLORS.t2 }} />
              <span>{player2}</span>
              <span className="legend-note">Mirror chart (0 in middle). <b>Bowling Avg</b> lower is better.</span>
            </div>

            {/* Diverging bar chart (like your reference) */}
            <div className="player-chart">
              <ResponsiveContainer width="100%" height={420}>
                <BarChart
                  data={playerMirrorData}
                  layout="vertical"
                  margin={{ top: 8, right: 24, left: 24, bottom: 8 }}
                >
                  <CartesianGrid horizontal={false} stroke={COLORS.grid} strokeDasharray="3 3" />
                  <XAxis
                    type="number"
                    domain={mirrorDomain}
                    tickFormatter={absTick}
                    tick={{ fill: "#93a4c3", fontSize: 12 }}
                  />
                  <YAxis
                    type="category"
                    dataKey="metric"
                    tick={{ fill: "#cfd9ee", fontSize: 12 }}
                    width={160}
                  />
                  <Tooltip
                    formatter={(v, k) => [Math.abs(v), k]}
                    contentStyle={{ background: "#0b1420", border: "1px solid #2a3f60", color: "#eaf2ff" }}
                  />
                  <Legend wrapperStyle={{ color: "#c7d4ea", fontSize: 12 }} />
                  <ReferenceLine x={0} stroke="#6b7280" />
                  <Bar dataKey={player1} fill={COLORS.t1} isAnimationActive={false} barSize={16} radius={[0,6,6,0]} />
                  <Bar dataKey={player2} fill={COLORS.t2} isAnimationActive={false} barSize={16} radius={[0,6,6,0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </div>

      {/* Info modal */}
      {showInfo && (
        <div className="modal" onClick={() => setShowInfo(false)}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="modal-head">About Head-to-Head</div>
            <ul className="modal-list">
              <li>Select two teams + a format (ALL/ODI/T20/TEST).</li>
              <li>Summary cards show totals, wins/losses/draws, win%.</li>
              <li>Outcome Comparison (bar) + Result Share (donut) = quick read.</li>
              <li>Player comparison uses a diverging bar chart (mirror) per metric.</li>
              <li>No chart animations to avoid mobile flicker.</li>
            </ul>
            <div className="modal-actions">
              <button className="btn" onClick={() => setShowInfo(false)}>Got it</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default H2HRecords;
