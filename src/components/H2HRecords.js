// src/pages/H2HRecords.jsx
import React, { useEffect, useMemo, useState } from "react";
import "./H2HRecords.css";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, Legend, CartesianGrid,
  ResponsiveContainer, PieChart, Pie, Cell, LabelList, ReferenceLine,
} from "recharts";
import { FaInfoCircle, FaTrophy } from "react-icons/fa";
const TOP_N = 5;

const API = process.env.REACT_APP_API_BASE || "https://cricket-scoreboard-backend.onrender.com";

const COLORS = {
  t1: "#22d3ee",
  t2: "#f87171",
  draw: "#94a3b8",
  grid: "#334155",
  gold: "#e8caa4",
  ink: "#eaf2ff",
};

const fetchJSON = async (url, fallback) => {
  try {
    const r = await fetch(url);
    if (!r.ok) return fallback;
    const ct = r.headers.get("content-type") || "";
    if (!ct.includes("application/json")) return fallback;
    return await r.json();
  } catch {
    return fallback;
  }
};

const MirrorLabel = ({ x, y, width, height, value }) => {
  if (value == null) return null;
  const abs = Math.abs(value);
  const isLeft = value < 0;
  const tx = isLeft ? x - 8 : x + width + 8;
  const ty = y + height / 2 + 4;
  return (
    <text x={tx} y={ty} fontSize={12} fill={COLORS.ink} textAnchor={isLeft ? "end" : "start"}>
      {abs}
    </text>
  );
};

const arr = v => (Array.isArray(v) ? v : []);
const obj = v => (v && typeof v === "object" ? v : null);

export default function H2HRecords() {
  const [teams, setTeams] = useState([]);
  const [team1, setTeam1] = useState("");
  const [team2, setTeam2] = useState("");
  const [matchType, setMatchType] = useState("ALL");

  const [summary, setSummary] = useState(null);
  const [byFormat, setByFormat] = useState([]);
  const [points, setPoints] = useState(null);
  const [runsByFormat, setRunsByFormat] = useState([]);
  const [testLead, setTestLead] = useState(null);
  const [testAvg, setTestAvg] = useState([]);

  const [topBatters, setTopBatters] = useState([]);
  const [topBowlers, setTopBowlers] = useState([]);
  const [recent, setRecent] = useState([]);

  const [players, setPlayers] = useState([]);
  const [player1, setPlayer1] = useState("");
  const [player2, setPlayer2] = useState("");
  const [playerStats, setPlayerStats] = useState(null);

  // Leaderboards filters
  const [lbType, setLbType] = useState("ALL");
  const [lbTournament, setLbTournament] = useState("ALL");
  const [lbYear, setLbYear] = useState("ALL");
  const [lbTeam, setLbTeam] = useState("ALL");

  const [tournaments, setTournaments] = useState([]);
  const [years, setYears] = useState([]);
  const [leaderboards, setLeaderboards] = useState(null);

  const [teamError, setTeamError] = useState("");
  const [playerError, setPlayerError] = useState("");
  const [showInfo, setShowInfo] = useState(false);

useEffect(() => {
  fetchJSON(`${API}/api/h2h/teams`, []).then(d => setTeams(arr(d)));
  fetchJSON(`${API}/api/players/list`, []).then(d => setPlayers(arr(d)));
  // seed meta for leaderboards (from PP + MH)
  fetchJSON(`${API}/api/h2h/meta/tournaments?type=${lbType}`, []).then(d => setTournaments(["ALL", ...arr(d)]));
  fetchJSON(`${API}/api/h2h/meta/years?type=${lbType}`, []).then(d => setYears(["ALL", ...arr(d)]));
}, []);


  // Keep meta in sync with type
 useEffect(() => {
  setLbTournament("ALL");
  setLbYear("ALL");
  fetchJSON(`${API}/api/h2h/meta/tournaments?type=${lbType}`, []).then(d => setTournaments(["ALL", ...arr(d)]));
  fetchJSON(`${API}/api/h2h/meta/years?type=${lbType}`, []).then(d => setYears(["ALL", ...arr(d)]));
}, [lbType]);


  // Fetch leaderboards whenever any filter changes
useEffect(() => {
  const qs = new URLSearchParams({
    type: lbType,
    tournament: lbTournament || "ALL",
    year: lbYear === "ALL" ? "" : String(lbYear || ""),
    team: lbTeam || "ALL",
    limit: String(TOP_N), // Top-5 from backend
  }).toString();
  fetchJSON(`${API}/api/h2h/players/highlights?${qs}`, null).then(setLeaderboards);
}, [lbType, lbTournament, lbYear, lbTeam]);



  // ---------- H2H summary ----------
  useEffect(() => {
    if (team1 && team2 && team1.toLowerCase() === team2.toLowerCase()) {
      setTeamError("⚠️ Please select two different teams.");
      return;
    }
    setTeamError("");
    if (!team1 || !team2) return;

    const t1 = encodeURIComponent(team1);
    const t2 = encodeURIComponent(team2);

    fetchJSON(`${API}/api/h2h/summary?team1=${t1}&team2=${t2}&type=${matchType}`, null)
      .then(setSummary);

    fetchJSON(`${API}/api/h2h/by-format?team1=${t1}&team2=${t2}`, [])
      .then(d => setByFormat(arr(d)));

    fetchJSON(`${API}/api/h2h/points?team1=${t1}&team2=${t2}&type=${matchType}`, null)
      .then(setPoints);

    fetchJSON(`${API}/api/h2h/runs-by-format?team1=${t1}&team2=${t2}&type=${matchType}`, [])
      .then(d => setRunsByFormat(arr(d)));

    if (matchType === "TEST" || matchType === "ALL") {
      fetchJSON(`${API}/api/h2h/test-innings-lead?team1=${t1}&team2=${t2}`, null)
        .then(setTestLead);
      fetchJSON(`${API}/api/h2h/test-innings-averages?team1=${t1}&team2=${t2}`, [])
        .then(d => setTestAvg(arr(d)));
    } else {
      setTestLead(null); setTestAvg([]);
    }

    fetchJSON(`${API}/api/h2h/top-batters?team1=${t1}&team2=${t2}&type=${matchType}`, [])
      .then(d => setTopBatters(arr(d)));

    fetchJSON(`${API}/api/h2h/top-bowlers?team1=${t1}&team2=${t2}&type=${matchType}`, [])
      .then(d => setTopBowlers(arr(d)));

    fetchJSON(`${API}/api/h2h/recent?team1=${t1}&team2=${t2}&type=${matchType}&limit=10`, [])
      .then(d => setRecent(arr(d)));
  }, [team1, team2, matchType]);

  // ---------- Player compare ----------
  useEffect(() => {
    if (player1 && player2 && player1.toLowerCase() === player2.toLowerCase()) {
      setPlayerError("⚠️ Please select two different players.");
      return;
    }
    setPlayerError("");
    if (player1 && player2 && player1 !== player2) {
      const p1 = encodeURIComponent(player1);
      const p2 = encodeURIComponent(player2);
      fetchJSON(`${API}/api/players/compare?player1=${p1}&player2=${p2}`, null)
        .then(d => setPlayerStats(obj(d?.players) ? d.players : null));
    }
  }, [player1, player2]);

  // ---------- Derived ----------
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
    const d = Number(summary.draws || 0);
    const t1p = Number(summary.win_percentage_team1 || 0);
    const t2p = Number(summary.win_percentage_team2 || 0);
    return { total, t1w, t2w, draws: d, t1p, t2p, t1l: t2w, t2l: t1w };
  }, [summary, team1, team2]);

  const playerMirrorData = useMemo(() => {
    if (!playerStats || !player1 || !player2) return [];
    const a = playerStats[player1] || {}, b = playerStats[player2] || {};
    const num = (x) => (x == null || x === "" ? 0 : Number(x));
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

  const formatChart = arr(byFormat).map(row => ({
    format: row.match_type,
    [team1]: Number(row.t1_wins || 0),
    [team2]: Number(row.t2_wins || 0),
    Draws: Number(row.draws || 0),
  }));

  const runsFormatChartRaw = arr(runsByFormat).map(r => ({
    format: r.match_type,
    [team1]: Number(r[team1] || 0),
    [team2]: Number(r[team2] || 0),
  }));

  const runsFormatChart = useMemo(() => {
    if (matchType === "ALL") return runsFormatChartRaw;
    return runsFormatChartRaw.filter(x => String(x.format).toUpperCase() === matchType);
  }, [runsFormatChartRaw, matchType]);

  const tooltipProps = {
    cursor: false,
    contentStyle: { background: "#0b1420", border: "1px solid #2a3f60" },
    itemStyle: { color: COLORS.ink },
    labelStyle: { color: COLORS.ink },
  };

  // simple horizontal bar list
const HBar = ({ title, rows, dataKey = "value" }) => {
  // filter: valid rows only, then cap to Top-5
  const clean = arr(rows)
    .filter(r => r && r.player_name && r[dataKey] != null && r[dataKey] !== 0)
    .slice(0, TOP_N);

  const top = clean[0];

  return (
    <div className="chart-card card-glow">
      <div className="chart-title">{title}</div>

      {/* Congrats ribbon for the #1 */}
      {top && (
        <div className="congrats-ribbon">
          <FaTrophy className="trophy" />
          <span>
            Congrats <b>{top.player_name}</b>{top.team_name ? ` (${top.team_name})` : ""}! — <i>{title}</i> <b>{top[dataKey]}</b>
          </span>
        </div>
      )}

      <ResponsiveContainer
        width="100%"
        height={clean.length ? Math.max(220, clean.length * 40) : 220}
      >
        <BarChart data={clean} layout="vertical" margin={{ top: 8, right: 28, left: 32, bottom: 8 }}>
          <defs>
            <linearGradient id="grad-gold" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#fff2c6" />
              <stop offset="50%" stopColor="#e8caa4" />
              <stop offset="100%" stopColor="#cda56e" />
            </linearGradient>
          </defs>
          <CartesianGrid horizontal={false} stroke={COLORS.grid} strokeDasharray="3 3" />
          <XAxis type="number" tick={{ fill: "#93a4c3", fontSize: 12 }} />
          <YAxis
            type="category"
            dataKey="player_name"
            tick={{ fill: "#e7efff", fontSize: 12 }}
            width={190}
          />
          <Tooltip
            {...tooltipProps}
            formatter={(v, _k, p) => [v, p?.payload?.team_name ? `${p.payload.player_name} (${p.payload.team_name})` : p.payload.player_name]}
          />
          <Bar
            dataKey={dataKey}
            fill="url(#grad-gold)"
            barSize={20}
            radius={[10, 10, 10, 10]}
            animationDuration={700}
            animationEasing="ease-out"
          >
            <LabelList dataKey={dataKey} position="right" fill={COLORS.ink} fontSize={12} />
          </Bar>
        </BarChart>
      </ResponsiveContainer>

      {!clean.length && <div className="tr empty" style={{ padding: 12 }}>No data</div>}
    </div>
  );
};


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

      {/* Errors */}
      {teamError && <div className="alert warn">{teamError}</div>}

      {/* Summary + charts */}
      {summary && !teamError && (
        <>
          <div className="summary-card wide">
            <div className="sum-head">
              <span className="sum-title">Summary</span>
              <span className="sum-type">Format: {matchType === "ALL" ? "All Formats" : (matchType === "TEST" ? "Test" : matchType)}</span>
            </div>
            <div className="kpi-grid">
              <div className="kpi">
                <div className="kpi-label">Total Matches</div>
                <div className="kpi-value">{summary?.total_matches ?? 0}</div>
              </div>

              <div className="kpi kpi-t1">
                <div className="kpi-pill">{team1 || "Team 1"}</div>
                <div className="kpi-pair"><span>Wins</span><b>{summary?.[team1] ?? 0}</b></div>
                <div className="kpi-pair"><span>Losses</span><b>{summary ? summary[team2] : 0}</b></div>
                <div className="kpi-pair"><span>Win %</span><b>{summary?.win_percentage_team1 ?? 0}%</b></div>
              </div>

              <div className="kpi kpi-t2">
                <div className="kpi-pill">{team2 || "Team 2"}</div>
                <div className="kpi-pair"><span>Wins</span><b>{summary?.[team2] ?? 0}</b></div>
                <div className="kpi-pair"><span>Losses</span><b>{summary ? summary[team1] : 0}</b></div>
                <div className="kpi-pair"><span>Win %</span><b>{summary?.win_percentage_team2 ?? 0}%</b></div>
              </div>

              <div className="kpi">
                <div className="kpi-label">Draws</div>
                <div className="kpi-value">{summary?.draws ?? 0}</div>
              </div>
            </div>
          </div>

          <div className="charts-grid two">
            <div className="chart-card">
              <div className="chart-title">Outcome Comparison</div>
              <ResponsiveContainer width="100%" height={320}>
                <BarChart data={teamBarData} margin={{ top: 18, right: 20, left: 8, bottom: 4 }}>
                  <CartesianGrid vertical={false} stroke={COLORS.grid} strokeDasharray="3 3" />
                  <XAxis dataKey="metric" tick={{ fill: "#93a4c3", fontSize: 12 }} />
                  <YAxis allowDecimals={false} tick={{ fill: "#93a4c3", fontSize: 12 }} />
                  <Tooltip {...tooltipProps} />
                  <Legend wrapperStyle={{ color: "#c7d4ea", fontSize: 12 }} />
                  <Bar dataKey={team1} fill={COLORS.t1} barSize={22} radius={[6,6,0,0]} isAnimationActive={false}>
                    <LabelList dataKey={team1} position="top" fill="#cdeefa" fontSize={12} />
                  </Bar>
                  <Bar dataKey={team2} fill={COLORS.t2} barSize={22} radius={[6,6,0,0]} isAnimationActive={false}>
                    <LabelList dataKey={team2} position="top" fill="#ffd8d8" fontSize={12} />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="chart-card">
              <div className="chart-title">Result Share</div>
              <ResponsiveContainer width="100%" height={320}>
                <PieChart>
                  <Pie data={outcomePieData} dataKey="value" innerRadius={70} outerRadius={110} paddingAngle={2} isAnimationActive={false}>
                    {arr(outcomePieData).map((e, i) => <Cell key={i} fill={e.color} />)}
                    <LabelList dataKey="value" position="outside" fill={COLORS.ink} fontSize={12} />
                  </Pie>
                  <Tooltip {...tooltipProps} />
                  <Legend wrapperStyle={{ color: "#c7d4ea", fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="charts-grid two">
            {!!formatChart.length && (
              <div className="chart-card">
                <div className="chart-title">Wins by Format</div>
                <ResponsiveContainer width="100%" height={320}>
                  <BarChart data={formatChart} margin={{ top: 28, right: 20, left: 10, bottom: 6 }}>
                    <CartesianGrid vertical={false} stroke={COLORS.grid} strokeDasharray="3 3" />
                    <XAxis dataKey="format" tick={{ fill: "#93a4c3", fontSize: 12 }} />
                    <YAxis allowDecimals={false} tick={{ fill: "#93a4c3", fontSize: 12 }} />
                    <Tooltip {...tooltipProps} />
                    <Legend wrapperStyle={{ color: "#c7d4ea", fontSize: 12 }} />
                    <Bar dataKey={team1} fill={COLORS.t1} barSize={20} isAnimationActive={false}><LabelList position="top" fill={COLORS.ink} /></Bar>
                    <Bar dataKey={team2} fill={COLORS.t2} barSize={20} isAnimationActive={false}><LabelList position="top" fill={COLORS.ink} /></Bar>
                    <Bar dataKey="Draws" fill={COLORS.draw} barSize={20} isAnimationActive={false}><LabelList position="top" fill={COLORS.ink} /></Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}

            {!!runsFormatChart.length && (
              <div className="chart-card">
                <div className="chart-title">
                  {matchType === "ALL" ? "Total Runs by Format" : `Total Runs — ${matchType === "TEST" ? "Test" : matchType}`}
                </div>
                <ResponsiveContainer width="100%" height={320}>
                  <BarChart data={runsFormatChart} margin={{ top: 28, right: 20, left: 14, bottom: 6 }}>
                    <CartesianGrid vertical={false} stroke={COLORS.grid} strokeDasharray="3 3" />
                    <XAxis dataKey="format" tick={{ fill: "#93a4c3", fontSize: 12 }}
                      label={{ value: "Format", position: "insideBottom", offset: -2, fill: "#9fb3d6", fontSize: 12 }} />
                    <YAxis allowDecimals={false} tick={{ fill: "#93a4c3", fontSize: 12 }}
                      label={{ value: "Runs", angle: -90, position: "insideLeft", fill: "#9fb3d6", fontSize: 12 }} />
                    <Tooltip {...tooltipProps} />
                    <Legend wrapperStyle={{ color: "#c7d4ea", fontSize: 12 }} />
                    <Bar dataKey={team1} fill={COLORS.gold} barSize={20} isAnimationActive={false}><LabelList position="top" fill={COLORS.ink} /></Bar>
                    <Bar dataKey={team2} fill={COLORS.draw} barSize={20} isAnimationActive={false}><LabelList position="top" fill={COLORS.ink} /></Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          {(matchType === "TEST" || matchType === "ALL") && (
            <>
              {(testLead || points) && (
                <div className="insight-grid two">
                  {testLead && (
                    <div className="insight-card">
                      <div className="insight-title">First-Innings Lead</div>
                      <div className="chip-row">
                        <div className="kpi-chip" style={{ borderColor: COLORS.t1 }}>
                          <span className="dot" style={{ background: COLORS.t1 }} /> {team1} Leads <b>{testLead.t1_leads || 0}</b>
                        </div>
                        <div className="kpi-chip" style={{ borderColor: COLORS.t2 }}>
                          <span className="dot" style={{ background: COLORS.t2 }} /> {team2} Leads <b>{testLead.t2_leads || 0}</b>
                        </div>
                        <div className="kpi-chip" style={{ borderColor: COLORS.draw }}>
                          <span className="dot" style={{ background: COLORS.draw }} /> Level <b>{testLead.level || 0}</b>
                        </div>
                      </div>
                    </div>
                  )}

                  {points && (
                    <div className="insight-card">
                      <div className="insight-title">H2H {matchType === "ALL" ? "Overall" : (matchType === "TEST" ? "Test" : matchType)} Points</div>
                      <div className="points-row">
                        <div className="points-box gold">
                          <div className="label">{team1}</div>
                          <div className="value">{points.t1_points || 0}</div>
                        </div>
                        <div className="points-box gold">
                          <div className="label">{team2}</div>
                          <div className="value">{points.t2_points || 0}</div>
                        </div>
                      </div>
                      <div className="points-note">Rules: Test <b>12/6/4</b>, ODI/T20 <b>2/0/1</b> (W/L/D).</div>
                    </div>
                  )}
                </div>
              )}
            </>
          )}

          {/* Leaderboards (pair) */}
          <div className="leader-grid two">
            <div className="chart-card">
              <div className="chart-title">Top Batters ({matchType})</div>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={arr(topBatters)} layout="vertical" margin={{ top: 12, right: 24, left: 28, bottom: 6 }}>
                  <CartesianGrid horizontal={false} stroke={COLORS.grid} strokeDasharray="3 3" />
                  <XAxis type="number" tick={{ fill: "#93a4c3", fontSize: 12 }} />
                  <YAxis type="category" dataKey="player_name" tick={{ fill: "#cfd9ee", fontSize: 12 }} width={160} />
                  <Tooltip {...tooltipProps} />
                  <Bar dataKey="runs" fill={COLORS.gold} barSize={18} isAnimationActive={false}>
                    <LabelList dataKey="runs" position="right" fill={COLORS.ink} fontSize={12} />
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
                {arr(topBowlers).map((r, i) => (
                  <div key={i} className="tr">
                    <div>{r.player_name}</div>
                    <div className="num">{r.wkts}</div>
                    <div className="num">{r.runs_given}</div>
                    <div className="num">{r.bowl_avg}</div>
                  </div>
                ))}
                {arr(topBowlers).length === 0 && <div className="tr empty">No data</div>}
              </div>
            </div>
          </div>

          {/* Best Players (global leaderboards with filters) */}
          <div className="player-sec">
            <h3 className="h3">Best Players (by filters)</h3>
            <div className="h2h-row h2h-selects">
              <select value={lbType} onChange={e => setLbType(e.target.value)} className="sel">
                <option value="ALL">All</option><option value="ODI">ODI</option><option value="T20">T20</option><option value="TEST">Test</option>
              </select>
              <select value={lbTournament} onChange={e => setLbTournament(e.target.value)} className="sel">
                {arr(tournaments).map(t => <option key={t} value={t}>{t}</option>)}
              </select>
              <select value={lbYear} onChange={e => setLbYear(e.target.value)} className="sel">
                {arr(years).map(y => <option key={y} value={y}>{y}</option>)}
              </select>
              <select value={lbTeam} onChange={e => setLbTeam(e.target.value)} className="sel">
                <option value="ALL">All Teams</option>
                {teams.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>

            <div className="charts-grid two">
  <HBar title="Best Run Scored" rows={arr(leaderboards?.leaders?.most_runs)} dataKey="total_runs" />
  <HBar title="Highest Wicket Taker" rows={arr(leaderboards?.leaders?.highest_wickets)} dataKey="total_wickets" />
  <HBar title="Best Batting Average" rows={arr(leaderboards?.leaders?.best_batting_avg)} dataKey="batting_avg" />
  <HBar title="Best Strike Rate" rows={arr(leaderboards?.leaders?.best_strike_rate)} dataKey="strike_rate" />
  <HBar title="Most Centuries" rows={arr(leaderboards?.leaders?.most_centuries)} dataKey="total_hundreds" />
  <HBar title="Most Half-Centuries" rows={arr(leaderboards?.leaders?.most_fifties)} dataKey="total_fifties" />
  <HBar title="Most Successful (25+ runs and 2+ wkts in a match)" rows={arr(leaderboards?.leaders?.most_successful)} dataKey="success_matches" />
</div>

          </div>

          {/* Player Comparison */}
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

            {playerStats && playerStats[player1] && playerStats[player2] && !playerError && (
              <div className="player-card">
                <div className="legend-row">
                  <div className="legend-chip" style={{ background: COLORS.t1 }} />
                  <span>{player1}</span>
                  <div className="legend-chip" style={{ background: COLORS.t2 }} />
                  <span>{player2}</span>
                  <span className="legend-note">Mirror chart (0 center). <b>Bowling Avg</b> lower is better.</span>
                </div>

                <div className="player-chart">
                  <ResponsiveContainer width="100%" height={420}>
                    <BarChart data={playerMirrorData} layout="vertical" margin={{ top: 8, right: 40, left: 40, bottom: 8 }}>
                      <CartesianGrid horizontal={false} stroke={COLORS.grid} strokeDasharray="3 3" />
                      <XAxis type="number" domain={[-100, 100]} tickFormatter={(v) => Math.abs(v)} tick={{ fill: "#93a4c3", fontSize: 12 }} />
                      <YAxis type="category" dataKey="metric" tick={{ fill: "#cfd9ee", fontSize: 12 }} width={160} />
                      <Tooltip {...tooltipProps} formatter={(v, k) => [Math.abs(v), k]} />
                      <Legend wrapperStyle={{ color: "#c7d4ea", fontSize: 12 }} />
                      <ReferenceLine x={0} stroke="#6b7280" />
                      <Bar dataKey={player1} fill={COLORS.t1} barSize={18} radius={[0, 6, 6, 0]} isAnimationActive={false}>
                        <LabelList content={(props) => <MirrorLabel {...props} />} />
                      </Bar>
                      <Bar dataKey={player2} fill={COLORS.t2} barSize={18} radius={[0, 6, 6, 0]} isAnimationActive={false}>
                        <LabelList content={(props) => <MirrorLabel {...props} />} />
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}
          </div>
        </>
      )}

      {showInfo && (
        <div className="modal" onClick={() => setShowInfo(false)}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="modal-head">About Head-to-Head</div>
            <ul className="modal-list">
              <li>Points: Test 12/6/4, ODI/T20 2/0/1.</li>
              <li>Wins & runs by format, first-innings lead, Test innings averages.</li>
              <li>Leaderboards, recent results.</li>
              <li>Best Players: global leaderboards with format/tournament/year/team filters.</li>
            </ul>
            <div className="modal-actions">
              <button className="btn" onClick={() => setShowInfo(false)}>Got it</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
