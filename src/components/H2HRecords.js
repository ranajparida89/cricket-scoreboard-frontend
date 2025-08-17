// H2HRecords.js — adds lean analytics with pro charts (no animations)
import React, { useState, useEffect, useMemo } from "react";
import "./H2HRecords.css";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, Legend,
  CartesianGrid, ResponsiveContainer, PieChart, Pie, Cell, LabelList, ReferenceLine
} from "recharts";
import { FaInfoCircle } from "react-icons/fa";

const API = "https://cricket-scoreboard-backend.onrender.com";

const COLORS = {
  t1: "#22d3ee",
  t2: "#f87171",
  draw: "#94a3b8",
  grid: "#334155",
  gold: "#e8caa4",
};

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

  // NEW analytics state
  const [byFormat, setByFormat] = useState([]);
  const [testLead, setTestLead] = useState(null);
  const [testAvg, setTestAvg] = useState([]);
  const [points, setPoints] = useState(null);
  const [runsByFormat, setRunsByFormat] = useState([]);
  const [topBatters, setTopBatters] = useState([]);
  const [topBowlers, setTopBowlers] = useState([]);
  const [recent, setRecent] = useState([]);

  // lists
  useEffect(() => {
    fetch(`${API}/api/h2h/teams`).then(r => r.json()).then(d => setTeams(d||[]));
    fetch(`${API}/api/players/list`).then(r => r.json()).then(d => setPlayers(d||[]));
  }, []);

  // summary
  useEffect(() => {
    if (team1 && team2) {
      if (team1.toLowerCase() === team2.toLowerCase()) { setTeamError("⚠️ Please select two different teams."); return; }
      setTeamError("");
    }
    if (team1 && team2 && matchType && team1 !== team2) {
      setLoadingSummary(true);
      fetch(`${API}/api/h2h/summary?team1=${encodeURIComponent(team1)}&team2=${encodeURIComponent(team2)}&type=${matchType}`)
        .then(r=>r.json()).then(setSummary).finally(()=>setLoadingSummary(false));
    }
  }, [team1, team2, matchType]);

  // EXTRA analytics fetches
  useEffect(() => {
    if (!team1 || !team2 || team1 === team2) return;

    // 1) Wins by Format
    fetch(`${API}/api/h2h/by-format?team1=${encodeURIComponent(team1)}&team2=${encodeURIComponent(team2)}`)
      .then(r => r.json()).then(d => setByFormat(d||[]));

    // 2) Points (correct logic for each format)
    fetch(`${API}/api/h2h/points?team1=${encodeURIComponent(team1)}&team2=${encodeURIComponent(team2)}&type=${matchType}`)
      .then(r => r.json()).then(setPoints);

    // 3) Total runs by format for the two teams
    fetch(`${API}/api/h2h/runs-by-format?team1=${encodeURIComponent(team1)}&team2=${encodeURIComponent(team2)}`)
      .then(r => r.json()).then(d => setRunsByFormat(d||[]));

    // Test-only insights
    if (matchType === "TEST" || matchType === "ALL") {
      fetch(`${API}/api/h2h/test-innings-lead?team1=${encodeURIComponent(team1)}&team2=${encodeURIComponent(team2)}`)
        .then(r => r.json()).then(setTestLead);

      fetch(`${API}/api/h2h/test-innings-averages?team1=${encodeURIComponent(team1)}&team2=${encodeURIComponent(team2)}`)
        .then(r => r.json()).then(d => setTestAvg(d||[]));
    } else {
      setTestLead(null); setTestAvg([]);
    }

    // leaderboards for current type (or ALL)
    fetch(`${API}/api/h2h/top-batters?team1=${encodeURIComponent(team1)}&team2=${encodeURIComponent(team2)}&type=${matchType}`)
      .then(r => r.json()).then(d => setTopBatters(d||[]));

    fetch(`${API}/api/h2h/top-bowlers?team1=${encodeURIComponent(team1)}&team2=${encodeURIComponent(team2)}&type=${matchType}`)
      .then(r => r.json()).then(d => setTopBowlers(d||[]));

    // recent strip
    fetch(`${API}/api/h2h/recent?team1=${encodeURIComponent(team1)}&team2=${encodeURIComponent(team2)}&type=${matchType}&limit=10`)
      .then(r => r.json()).then(d => setRecent(d||[]));
  }, [team1, team2, matchType]);

  // players (diverging chart)
  useEffect(() => {
    if (player1 && player2) {
      if (player1.toLowerCase() === player2.toLowerCase()) { setPlayerError("⚠️ Please select two different players."); return; }
      setPlayerError("");
    }
    if (player1 && player2 && player1 !== player2) {
      setLoadingPlayers(true);
      fetch(`${API}/api/players/compare?player1=${encodeURIComponent(player1)}&player2=${encodeURIComponent(player2)}`)
        .then(r=>r.json()).then(d=>setPlayerStats(d?.players||null)).finally(()=>setLoadingPlayers(false));
    }
  }, [player1, player2]);

  // derived
  const teamBarData = useMemo(() => {
    if (!summary || !team1 || !team2) return [];
    const t1w = Number(summary[team1] || 0), t2w = Number(summary[team2] || 0), draws = Number(summary.draws || 0);
    const t1l = t2w, t2l = t1w;
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

  // player diverging data
  const playerMirrorData = useMemo(() => {
    if (!playerStats || !player1 || !player2) return [];
    const a = playerStats[player1] || {}, b = playerStats[player2] || {};
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
    return rows.map(r => ({ metric: r.metric, [player1]: -r.a, [player2]: r.b }));
  }, [playerStats, player1, player2]);

  const mirrorDomain = useMemo(() => {
    if (!playerMirrorData.length) return [-10, 10];
    const maxAbs = Math.max(...playerMirrorData.flatMap(d => [Math.abs(d[player1]||0), Math.abs(d[player2]||0)]));
    const pad = Math.ceil(maxAbs * 0.12);
    return [-(maxAbs + pad), (maxAbs + pad)];
  }, [playerMirrorData, player1, player2]);

  const absTick = (v) => Math.abs(v);

  // formats chart
  const formatChart = (byFormat || []).map(row => ({
    format: row.match_type,
    [team1]: Number(row.t1_wins || 0),
    [team2]: Number(row.t2_wins || 0),
    Draws: Number(row.draws || 0),
  }));

  // runs by format chart
  const runsFormatChart = (runsByFormat || []).map(r => ({
    format: r.match_type,
    [team1]: Number(r[team1] || 0),
    [team2]: Number(r[team2] || 0),
  }));

  const testAvgByTeam = (testAvg || []).reduce((acc, r) => {
    acc[r.team] = r; return acc;
  }, {});

  return (
    <div className="h2h-wrap">
      <div className="h2h-topbar">
        <h2 className="h2h-title">VS Head-to-Head Records</h2>
        <button className="info-fab subtle" onClick={() => setShowInfo(true)} title="About">
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

      {/* Summary + KPI */}
      {summary && !teamError && (
        <>
          <div className="summary-card">
            <div className="sum-head">
              <span className="sum-title">Summary</span>
              <span className="sum-type">Format: {matchType === "ALL" ? "All Formats" : matchType}</span>
            </div>
            <div className="kpi-grid">
              <div className="kpi"><div className="kpi-label">Total Matches</div><div className="kpi-value">{kpi?.total ?? 0}</div></div>

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

              <div className="kpi"><div className="kpi-label">Draws</div><div className="kpi-value">{kpi?.draws ?? 0}</div></div>
            </div>
          </div>

          {/* Core charts */}
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
                  <Bar dataKey={team1} fill={COLORS.t1} barSize={22} isAnimationActive={false} radius={[6,6,0,0]} />
                  <Bar dataKey={team2} fill={COLORS.t2} barSize={22} isAnimationActive={false} radius={[6,6,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="chart-card">
              <div className="chart-title">Result Share</div>
              <ResponsiveContainer width="100%" height={320}>
                <PieChart>
                  <Pie data={outcomePieData} dataKey="value" innerRadius={70} outerRadius={110} paddingAngle={2} isAnimationActive={false}>
                    {outcomePieData.map((e,i) => <Cell key={i} fill={e.color} />)}
                    <LabelList dataKey="value" position="outside" fill="#eaf2ff" fontSize={12}/>
                  </Pie>
                  <Tooltip contentStyle={{ background: "#0b1420", border: "1px solid #2a3f60", color: "#eaf2ff" }} />
                  <Legend wrapperStyle={{ color: "#c7d4ea", fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Wins by format */}
          {!!formatChart.length && (
            <div className="chart-card maxw">
              <div className="chart-title">Wins by Format</div>
              <ResponsiveContainer width="100%" height={320}>
                <BarChart data={formatChart} margin={{ top: 6, right: 12, left: 0, bottom: 6 }}>
                  <CartesianGrid vertical={false} stroke={COLORS.grid} strokeDasharray="3 3" />
                  <XAxis dataKey="format" tick={{ fill: "#93a4c3", fontSize: 12 }} />
                  <YAxis allowDecimals={false} tick={{ fill: "#93a4c3", fontSize: 12 }} />
                  <Tooltip contentStyle={{ background: "#0b1420", border: "1px solid #2a3f60", color: "#eaf2ff" }} />
                  <Legend wrapperStyle={{ color: "#c7d4ea", fontSize: 12 }} />
                  <Bar dataKey={team1} fill={COLORS.t1} barSize={20} isAnimationActive={false} />
                  <Bar dataKey={team2} fill={COLORS.t2} barSize={20} isAnimationActive={false} />
                  <Bar dataKey="Draws" fill={COLORS.draw} barSize={20} isAnimationActive={false} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Total runs by format */}
          {!!runsFormatChart.length && (
            <div className="chart-card maxw">
              <div className="chart-title">Total Runs by Format</div>
              <ResponsiveContainer width="100%" height={320}>
                <BarChart data={runsFormatChart} margin={{ top: 6, right: 12, left: 0, bottom: 6 }}>
                  <CartesianGrid vertical={false} stroke={COLORS.grid} strokeDasharray="3 3" />
                  <XAxis dataKey="format" tick={{ fill: "#93a4c3", fontSize: 12 }} />
                  <YAxis allowDecimals={false} tick={{ fill: "#93a4c3", fontSize: 12 }} />
                  <Tooltip contentStyle={{ background: "#0b1420", border: "1px solid #2a3f60", color: "#eaf2ff" }} />
                  <Legend wrapperStyle={{ color: "#c7d4ea", fontSize: 12 }} />
                  <Bar dataKey={team1} fill={COLORS.gold} barSize={20} isAnimationActive={false} />
                  <Bar dataKey={team2} fill={COLORS.draw} barSize={20} isAnimationActive={false} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* TEST insights */}
          {(matchType === "TEST" || matchType === "ALL") && (
            <>
              {(testLead || points) && (
                <div className="insight-grid">
                  {testLead && (
                    <div className="insight-card">
                      <div className="insight-title">First-Innings Lead</div>
                      <div className="chip-row">
                        <div className="kpi-chip" style={{borderColor:COLORS.t1}}>
                          <span className="dot" style={{background:COLORS.t1}}/> {team1} Leads <b>{testLead.t1_leads || 0}</b>
                        </div>
                        <div className="kpi-chip" style={{borderColor:COLORS.t2}}>
                          <span className="dot" style={{background:COLORS.t2}}/> {team2} Leads <b>{testLead.t2_leads || 0}</b>
                        </div>
                        <div className="kpi-chip" style={{borderColor:COLORS.draw}}>
                          <span className="dot" style={{background:COLORS.draw}}/> Level <b>{testLead.level || 0}</b>
                        </div>
                      </div>
                    </div>
                  )}

                  {points && (
                    <div className="insight-card">
                      <div className="insight-title">H2H {matchType === "ALL" ? "Overall" : matchType} Points</div>
                      <div className="points-row">
                        <div className="points-box">
                          <div className="label">{team1}</div>
                          <div className="value">{points.t1_points || 0}</div>
                        </div>
                        <div className="points-box">
                          <div className="label">{team2}</div>
                          <div className="value">{points.t2_points || 0}</div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {Object.keys(testAvgByTeam).length > 0 && (
                <div className="chart-card maxw">
                  <div className="chart-title">Test Batting Averages per Innings</div>
                  <ResponsiveContainer width="100%" height={320}>
                    <BarChart
                      data={[team1, team2].map((t) => ({
                        team: t,
                        "Innings 1": testAvgByTeam?.[t]?.avg_inn1_runs || 0,
                        "Innings 2": testAvgByTeam?.[t]?.avg_inn2_runs || 0,
                      }))}
                      margin={{ top: 6, right: 12, left: 0, bottom: 6 }}
                    >
                      <CartesianGrid vertical={false} stroke={COLORS.grid} strokeDasharray="3 3" />
                      <XAxis dataKey="team" tick={{ fill: "#93a4c3", fontSize: 12 }} />
                      <YAxis allowDecimals={false} tick={{ fill: "#93a4c3", fontSize: 12 }} />
                      <Tooltip contentStyle={{ background: "#0b1420", border: "1px solid #2a3f60", color: "#eaf2ff" }} />
                      <Legend wrapperStyle={{ color: "#c7d4ea", fontSize: 12 }} />
                      <Bar dataKey="Innings 1" fill={COLORS.gold} isAnimationActive={false} />
                      <Bar dataKey="Innings 2" fill={COLORS.draw} isAnimationActive={false} />
                    </BarChart>
                  </ResponsiveContainer>
                  <div className="rpw-row">
                    {[team1, team2].map(t => (
                      <div key={t} className="rpw-chip">
                        <span className="label">{t}</span>
                        <span className="mini">Inn1 RPW: <b>{testAvgByTeam?.[t]?.inn1_rpw ?? "-"}</b></span>
                        <span className="mini">Inn2 RPW: <b>{testAvgByTeam?.[t]?.inn2_rpw ?? "-"}</b></span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}

          {/* Leaderboards */}
          <div className="leader-grid">
            <div className="chart-card">
              <div className="chart-title">Top Batters ({matchType})</div>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={topBatters} layout="vertical" margin={{ top: 6, right: 12, left: 24, bottom: 6 }}>
                  <CartesianGrid horizontal={false} stroke={COLORS.grid} strokeDasharray="3 3" />
                  <XAxis type="number" tick={{ fill: "#93a4c3", fontSize: 12 }} />
                  <YAxis type="category" dataKey="player_name" tick={{ fill: "#cfd9ee", fontSize: 12 }} width={160} />
                  <Tooltip contentStyle={{ background: "#0b1420", border: "1px solid #2a3f60", color: "#eaf2ff" }} />
                  <Bar dataKey="runs" fill={COLORS.gold} barSize={16} isAnimationActive={false}>
                    <LabelList dataKey="runs" position="right" fill="#eaf2ff" fontSize={12}/>
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="chart-card">
              <div className="chart-title">Top Bowlers (Avg, min 3 wkts) — {matchType}</div>
              <div className="table">
                <div className="tr th">
                  <div>Bowler</div><div className="num">Wkts</div><div className="num">Runs</div><div className="num">Avg</div>
                </div>
                {(topBowlers||[]).map((r,i)=>(
                  <div key={i} className="tr">
                    <div>{r.player_name}</div>
                    <div className="num">{r.wkts}</div>
                    <div className="num">{r.runs_given}</div>
                    <div className="num">{r.bowl_avg}</div>
                  </div>
                ))}
                {(!topBowlers || topBowlers.length===0) && <div className="tr empty">No data</div>}
              </div>
            </div>
          </div>

          {/* Recent results strip */}
          {!!recent.length && (
            <div className="recent-strip">
              <div className="strip-title">Recent Results (new → old)</div>
              <div className="dots">
                {recent.map((r, idx) => {
                  const w = (r.winner || "").toLowerCase();
                  let bg = COLORS.draw;
                  if (w.includes((team1||"").toLowerCase())) bg = COLORS.t1;
                  else if (w.includes((team2||"").toLowerCase())) bg = COLORS.t2;
                  return <span key={idx} className="dot" style={{background:bg}} title={`${r.match_type}: ${r.winner || "Draw"}`}></span>;
                })}
              </div>
              <div className="legend">
                <span className="legend-chip" style={{background:COLORS.t1}}/> {team1}
                <span className="legend-chip" style={{background:COLORS.t2}}/> {team2}
                <span className="legend-chip" style={{background:COLORS.draw}}/> Draw
              </div>
            </div>
          )}
        </>
      )}

      {/* Player comparison (mirror) */}
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

            <div className="player-chart">
              <ResponsiveContainer width="100%" height={420}>
                <BarChart data={playerMirrorData} layout="vertical" margin={{ top: 8, right: 24, left: 24, bottom: 8 }}>
                  <CartesianGrid horizontal={false} stroke={COLORS.grid} strokeDasharray="3 3" />
                  <XAxis type="number" domain={mirrorDomain} tickFormatter={absTick} tick={{ fill: "#93a4c3", fontSize: 12 }} />
                  <YAxis type="category" dataKey="metric" tick={{ fill: "#cfd9ee", fontSize: 12 }} width={160} />
                  <Tooltip formatter={(v, k) => [Math.abs(v), k]} contentStyle={{ background: "#0b1420", border: "1px solid #2a3f60", color: "#eaf2ff" }} />
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

      {showInfo && (
        <div className="modal" onClick={() => setShowInfo(false)}>
          <div className="modal-box" onClick={(e)=>e.stopPropagation()}>
            <div className="modal-head">About Head-to-Head</div>
            <ul className="modal-list">
              <li>Summary + wins/losses/draws per format.</li>
              <li>Correct <b>points</b>: Test (12/6/4), ODI/T20 (2/0/1).</li>
              <li>Total runs by format for each team.</li>
              <li>Test insights: first-innings leads, batting averages.</li>
              <li>Leaderboards and recent results strip.</li>
              <li>No animations for mobile stability.</li>
            </ul>
            <div className="modal-actions">
              <button className="btn" onClick={()=>setShowInfo(false)}>Got it</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default H2HRecords;
