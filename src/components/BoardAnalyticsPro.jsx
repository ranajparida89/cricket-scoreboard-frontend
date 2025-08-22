// C:\cricket-scoreboard-frontend\src\components\BoardAnalyticsPro.jsx
import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import Select from "react-select";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend, LabelList,
  AreaChart, Area, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Cell,
  LineChart, Line
} from "recharts";
import { FaCrown, FaPlay, FaSyncAlt, FaMedal, FaInfoCircle, FaTrophy, FaTrash } from "react-icons/fa";
import "./BoardAnalyticsPro.css";

const API = "https://cricket-scoreboard-backend.onrender.com";
const PALETTE = ["#22c55e","#3b82f6","#ef4444","#a855f7","#f59e0b","#14b8a6","#f43f5e","#8b5cf6","#10b981","#eab308"];
const SERIES = { ODI:"#3b82f6", T20:"#10b981", TEST:"#a855f7" }; // distinct, professional colors
const fmts = ["ALL","ODI","T20","TEST"];
const months = [
  {v:1,l:"Jan"},{v:2,l:"Feb"},{v:3,l:"Mar"},{v:4,l:"Apr"},{v:5,l:"May"},{v:6,l:"Jun"},
  {v:7,l:"Jul"},{v:8,l:"Aug"},{v:9,l:"Sep"},{v:10,l:"Oct"},{v:11,l:"Nov"},{v:12,l:"Dec"}
];
const nf = (n)=> new Intl.NumberFormat().format(n ?? 0);
const fmtOrZero = (b, f, k) => Number(b?.formats?.[f]?.[k] ?? 0);
const pc = (n)=> (isFinite(n) ? Number(n.toFixed(2)) : 0);

/* Info popover */
function Info({ title, children }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button className="info-btn" type="button" title="What is this?" onClick={()=>setOpen(true)}>
        <FaInfoCircle />
      </button>
      {open && (
        <div className="info-modal" onClick={()=>setOpen(false)}>
          <div className="info-modal-body" onClick={(e)=>e.stopPropagation()}>
            <div className="info-modal-title">{title}</div>
            <div className="info-modal-content">{children}</div>
            <div className="text-end mt-3">
              <button className="btn btn-sm btn-primary" onClick={()=>setOpen(false)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

/* Crown pill */
function TopBoardBadge({ name }) {
  if (!name) return null;
  return (
    <div className="top-board-badge">
      <span className="tb-glow" />
      <span className="tb-icon">👑</span>
      <span className="tb-label">Crown Holder</span>
      <span className="tb-sep">•</span>
      <span className="tb-name">{name}</span>
    </div>
  );
}

export default function BoardAnalyticsPro() {
  // ====== analytics state ======
  const [boards, setBoards] = useState([]);
  const [selected, setSelected] = useState([]);
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [activeFmt, setActiveFmt] = useState("ALL");
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState(null);
  const [timeline, setTimeline] = useState(null);

  // ====== hall of fame state ======
  const [activeTab, setActiveTab] = useState("analytics");
  const [hofWall, setHofWall] = useState([]);
  const [hofStats, setHofStats] = useState({});
  const [hofMeta, setHofMeta] = useState({ tournaments: [], years: [], teams: [] }); // filters
  const [hofAddMeta, setHofAddMeta] = useState({ tournaments: [], teams: [], boards: [] }); // modal
  const [hofFilters, setHofFilters] = useState({ tournament: "", year: "", team: "" });
  const [hofLoading, setHofLoading] = useState(false);
  const [showHofModal, setShowHofModal] = useState(false);
  const [hofForm, setHofForm] = useState({
    board_id: "", match_name: "", match_type: "T20",
    tournament_name: "", season_year: new Date().getFullYear(),
    season_month: "", champion_team: "", champion_team_id: "",
    champion_board_id: "", runner_up_board_id: "",
    runner_up_team: "", final_date: "", remarks: ""
  });

  useEffect(() => {
    axios.get(`${API}/api/boards/analytics/boards`).then(r => setBoards(r.data.boards||[]));
    const today = new Date();
    const past  = new Date(); past.setDate(past.getDate()-365);
    setTo(today.toISOString().slice(0,10));
    setFrom(past.toISOString().slice(0,10));
  }, []);

  const analyze = async () => {
    if (!selected.length) { alert("Select at least one board"); return; }
    setLoading(true);
    try {
      const ids = selected.join(",");
      const [s, t] = await Promise.all([
        axios.get(`${API}/api/boards/analytics/summary`, { params: { board_ids: ids, from, to }}),
        axios.get(`${API}/api/boards/analytics/timeline`, { params: { board_ids: ids, from, to }})
      ]);
      setSummary(s.data);
      setTimeline(t.data);
    } catch(err) {
      console.error(err);
      alert("Failed to load analytics");
    } finally { setLoading(false); }
  };

  // react-select options
  const boardOptions = useMemo(
    () => (boards||[]).map(b => ({ value: String(b.board_id), label: b.board_name })),
    [boards]
  );
  const selectedBoardOptions = useMemo(
    () => boardOptions.filter(o => selected.includes(o.value)),
    [boardOptions, selected]
  );
  const formatOptions = fmts.map(f => ({ value: f, label: f }));

  // color per board
  const colorMap = useMemo(()=> {
    const m = new Map();
    (summary?.data||[]).forEach((b,i)=> m.set(b.board_id, PALETTE[i%PALETTE.length]));
    return m;
  }, [summary]);

  // table rows
  const rows = useMemo(()=> {
    if (!summary?.data) return [];
    return summary.data.map(b => {
      if (activeFmt==="ALL") {
        return { id:b.board_id, name:b.board_name, matches:b.totals.matches, wins:b.totals.wins, draws:b.totals.draws, losses:b.totals.losses, win_pct:b.totals.win_pct, points:b.totals.points };
      }
      return { id:b.board_id, name:b.board_name,
        matches:fmtOrZero(b,activeFmt,"matches"),
        wins:fmtOrZero(b,activeFmt,"wins"),
        draws:fmtOrZero(b,activeFmt,"draws"),
        losses:fmtOrZero(b,activeFmt,"losses"),
        win_pct:fmtOrZero(b,activeFmt,"win_pct"),
        points:fmtOrZero(b,activeFmt,"points"),
      };
    });
  }, [summary, activeFmt]);

  const pointsData   = useMemo(()=> rows.map(r=>({ name:r.name, points:r.points, color:colorMap.get(r.id) })), [rows, colorMap]);
  const outcomesData = useMemo(()=> rows.map(r=>({ name:r.name, Wins:r.wins, Draws:r.draws, Losses:r.losses })), [rows]);
  const radarData    = useMemo(()=> rows.map(r=>({ board:r.name, WinPct:r.win_pct })), [rows]);
  const perFormatLine = useMemo(()=> {
    if (!summary?.data) return [];
    return summary.data.map(b=>({
      name: b.board_name,
      ODI: fmtOrZero(b,"ODI","points"),
      T20: fmtOrZero(b,"T20","points"),
      TEST: fmtOrZero(b,"TEST","points")
    }));
  }, [summary]);

  const marginData = useMemo(()=> {
    if (!summary?.data) return [];
    return summary.data.map(b=>{
      if (activeFmt==="ALL") {
        const avgs = ["ODI","T20","TEST"].map(f=>Number(b?.formats?.[f]?.avg_run_margin||0)).filter(x=>x>0);
        const avg = avgs.length? avgs.reduce((a,c)=>a+c,0)/avgs.length : 0;
        return { name:b.board_name, AvgRunMargin: pc(avg) };
      }
      return { name:b.board_name, AvgRunMargin: Number(b?.formats?.[activeFmt]?.avg_run_margin||0) };
    });
  }, [summary, activeFmt]);

  // info text
  const scoringInfo = (
    <ul className="mb-0">
      <li><b>ODI/T20</b> — Win: <b>10</b>, Draw: <b>5</b>, Loss: <b>2</b></li>
      <li><b>Test</b> — Win: <b>18</b>, Draw: <b>9</b>, Loss: <b>4</b></li>
      <li>“Board Points” also include any <b>Champion Bonus</b> (25 ODI/T20, 50 Test).</li>
    </ul>
  );
  const timelineInfo = (
    <ul className="mb-0">
      <li>Daily cumulative leader including champion bonuses on their award dates.</li>
    </ul>
  );

  // react-select dark styles
  const selectStyles = {
    control: (base)=>({ ...base, background:'#0b1220', borderColor:'#223454', minHeight:38, boxShadow:'none' }),
    menu: (base)=>({ ...base, background:'#0b1220', color:'#e6f0ff', border:'1px solid #223454' }),
    option: (base, state)=>({ ...base, background: state.isFocused ? '#13203b' : 'transparent', color:'#e6f0ff', cursor:'pointer' }),
    multiValue: (base)=>({ ...base, background:'#13203b' }),
    multiValueLabel: (base)=>({ ...base, color:'#cbd5e1' }),
    input: (base)=>({ ...base, color:'#e6f0ff' }),
    singleValue: (base)=>({ ...base, color:'#e6f0ff' }),
    indicatorSeparator: () => ({ display:'none' })
  };

  // ====== HOF loaders ======
  const loadHOFMeta = async () => {
    if (!selected.length) return;
    try {
      const { data } = await axios.get(`${API}/api/boards/hof/filters`, {
        params: { board_ids: selected.join(",") }
      });
      setHofMeta({
        tournaments: data.tournaments || [],
        years: data.years || [],
        teams: data.teams || []
      });
    } catch (e) { console.error(e); }
  };

  const loadHOFAddMeta = async () => {
    try {
      const { data } = await axios.get(`${API}/api/boards/hof/meta`);
      setHofAddMeta({
        tournaments: data.tournaments || [],
        teams: data.teams || [],
        boards: data.boards || []
      });
    } catch (e) { console.error(e); }
  };

  const loadHOF = async () => {
    if (!selected.length) return;
    setHofLoading(true);
    try {
      const params = { board_ids: selected.join(","), sort: "chron" };
      if (hofFilters.tournament) params.tournament = hofFilters.tournament;
      if (hofFilters.year) params.year = hofFilters.year;
      if (hofFilters.team) params.team = hofFilters.team;

      const [listRes, statRes] = await Promise.all([
        axios.get(`${API}/api/boards/hof/list`,  { params }),
        axios.get(`${API}/api/boards/hof/stats`, { params: { board_ids: selected.join(",") }})
      ]);
      setHofWall(listRes.data.items || []);
      setHofStats(statRes.data.byBoard || {});
    } catch (e) {
      console.error(e); alert("Failed to load Hall of Fame");
    } finally { setHofLoading(false); }
  };

  useEffect(() => {
    if (activeTab === "hall" && selected.length) {
      loadHOFMeta();
      loadHOF();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, selected.join(","), hofFilters.tournament, hofFilters.year, hofFilters.team]);

  // open HOF modal
  const openHofModal = async () => {
    await loadHOFAddMeta();
    setHofForm(f => ({
      ...f,
      board_id: selected[0] || "",
      champion_board_id: selected[0] || "",
      match_type: "T20",
      season_year: new Date().getFullYear(),
      season_month: "",
      final_date: ""
    }));
    setShowHofModal(true);
  };

  // de-duplicate team list by name (fix duplicate options)
  const dedupTeams = useMemo(() => {
    const seen = new Map();
    (hofAddMeta.teams || []).forEach(t => {
      const key = String(t.name || "").trim().toLowerCase();
      if (key && !seen.has(key)) seen.set(key, { id: t.id, name: t.name });
    });
    return Array.from(seen.values());
  }, [hofAddMeta.teams]);

  // runner-up options (distinct and not equal to champion)
  const ruTeamOptions = useMemo(() => {
    const champ = String(hofForm.champion_team || "").toLowerCase();
    return dedupTeams.filter(t => String(t.name).toLowerCase() !== champ);
  }, [dedupTeams, hofForm.champion_team]);

  const ruBoardOptions = useMemo(() => {
    return (hofAddMeta.boards || []).filter(b => String(b.id) !== String(hofForm.champion_board_id || hofForm.board_id));
  }, [hofAddMeta.boards, hofForm.champion_board_id, hofForm.board_id]);

  return (
    <div className="board-analytics-container">
      <div className="d-flex align-items-center justify-content-between mb-3">
        <div>
          <h2 className="analytics-section-title mb-1">CrickEdge • Board Analytics</h2>
        </div>
        <TopBoardBadge name={summary?.top_board?.board_name} />
      </div>

      {/* Tabs */}
      <div className="tabs-nav mb-3">
        <button className={`tab-pill ${activeTab==='analytics' ? 'active':''}`} onClick={()=>setActiveTab('analytics')}>Analytics</button>
        <button className={`tab-pill ${activeTab==='hall' ? 'active':''}`} onClick={()=>setActiveTab('hall')}>Hall of Fame</button>
      </div>

      {/* Filters Row */}
      <div className="row g-3 mb-3">
        <div className="col-12 col-lg-5">
          <div className="card chart-card h-100">
            <div className="card-body">
              <div className="filter-title">Boards</div>
              <Select
                isMulti
                options={boardOptions}
                value={selectedBoardOptions}
                placeholder="Select boards…"
                classNamePrefix="rs"
                styles={selectStyles}
                onChange={(vals)=> setSelected((vals||[]).map(v=>v.value))}
              />
              <div className="tiny-actions">
                <button className="link-btn" onClick={()=>setSelected(boardOptions.map(o=>o.value))}>Select all</button>
                <span> · </span>
                <button className="link-btn" onClick={()=>setSelected([])}>Clear</button>
              </div>

              {activeTab==="hall" && (
                <div className="tiny-actions mt-2">
                  <button className="link-btn" onClick={()=>setHofFilters({ tournament:"", year:"", team:"" })}>Clear HOF filters</button>
                </div>
              )}
            </div>
          </div>
        </div>

        {activeTab==="analytics" ? (
          <>
            <div className="col-6 col-lg-2">
              <div className="card chart-card h-100">
                <div className="card-body">
                  <div className="filter-title">From</div>
                  <input type="date" className="form-control light-date" value={from} onChange={e=>setFrom(e.target.value)}/>
                </div>
              </div>
            </div>

            <div className="col-6 col-lg-2">
              <div className="card chart-card h-100">
                <div className="card-body">
                  <div className="filter-title">To</div>
                  <input type="date" className="form-control light-date" value={to} onChange={e=>setTo(e.target.value)}/>
                </div>
              </div>
            </div>

            <div className="col-12 col-lg-3">
              <div className="card chart-card h-100">
                <div className="card-body">
                  <div className="filter-title">Match Type</div>
                  <Select
                    options={formatOptions}
                    value={{ value: activeFmt, label: activeFmt }}
                    classNamePrefix="rs"
                    styles={selectStyles}
                    onChange={(v)=> setActiveFmt(v?.value || "ALL")}
                  />
                  <div className="d-flex gap-2 justify-content-end mt-3">
                    <button className="btn btn-primary btn-sm" onClick={analyze} disabled={loading}>
                      {loading ? <FaSyncAlt className="me-1 spin"/> : <FaPlay className="me-1"/>}
                      Analyze
                    </button>
                    <button className="btn btn-outline-light btn-sm" onClick={()=>{setSummary(null);setTimeline(null);}}>
                      Clear
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </>
        ) : (
          // Hall of Fame filter row
          <div className="col-12 col-lg-7">
            <div className="card chart-card h-100">
              <div className="card-body">
                <div className="row g-2">
                  <div className="col-12 col-md-5">
                    <label className="form-label subtle-strong">Tournament</label>
                    <input
                      className="form-control dark-input"
                      list="hof-tournaments"
                      placeholder="All tournaments"
                      value={hofFilters.tournament}
                      onChange={e=>setHofFilters(f=>({...f, tournament: e.target.value}))}
                    />
                    <datalist id="hof-tournaments">
                      {(hofMeta.tournaments||[]).map(t=>(<option key={t.key} value={t.label} />))}
                    </datalist>
                  </div>
                  <div className="col-6 col-md-3">
                    <label className="form-label subtle-strong">Year</label>
                    <select className="form-select dark-input"
                      value={hofFilters.year}
                      onChange={e=>setHofFilters(f=>({...f, year: e.target.value}))}
                    >
                      <option value="">All years</option>
                      {(hofMeta.years||[]).map(y=><option key={y} value={y}>{y}</option>)}
                    </select>
                  </div>
                  <div className="col-6 col-md-4">
                    <label className="form-label subtle-strong">Champion Team</label>
                    <input
                      className="form-control dark-input"
                      list="hof-teams"
                      placeholder="Any team"
                      value={hofFilters.team}
                      onChange={e=>setHofFilters(f=>({...f, team: e.target.value}))}
                    />
                    <datalist id="hof-teams">
                      {(hofMeta.teams||[]).map(t=>(<option key={t.key} value={t.label} />))}
                    </datalist>
                  </div>
                </div>

                <div className="d-flex justify-content-end gap-2 mt-2">
                  <button className="btn btn-outline-light btn-sm" onClick={loadHOF} disabled={hofLoading}>
                    {hofLoading ? <FaSyncAlt className="me-1 spin"/> : <FaSyncAlt className="me-1"/>}
                    Refresh
                  </button>
                  <button className="btn btn-primary btn-sm" onClick={openHofModal} disabled={!selected.length}>+ Add Entry</button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ===== CONTENT TABS ===== */}
      {activeTab === "analytics" ? (
        !summary ? (
          <div className="text-center subtle py-4 fade-in">
            <FaCrown className="me-2"/><span>Select boards & date range, then click Analyze.</span>
          </div>
        ) : (
          <>
            {/* KPI row — trimmed to 3 cards as requested */}
            <div className="row g-3 mb-3">
              <div className="col-12 col-md-4">
                <div className="card chart-card h-100">
                  <div className="card-body">
                    <div className="kpi-title">Boards Compared <Info title="Boards Compared">How many boards are included in this analysis window.</Info></div>
                    <div className="kpi-value">{summary.data.length}</div>
                  </div>
                </div>
              </div>
              <div className="col-12 col-md-4">
                <div className="card chart-card h-100">
                  <div className="card-body">
                    <div className="kpi-title">Total Matches <Info title="Total Matches">Sum of matches across the selected boards and date range.</Info></div>
                    <div className="kpi-value">{nf(summary.data.reduce((a,b)=>a+(b.totals?.matches||0),0))}</div>
                  </div>
                </div>
              </div>
              <div className="col-12 col-md-4">
                <div className="card chart-card h-100">
                  <div className="card-body">
                    <div className="kpi-title">Total Points <Info title="Board Points (BP)">{scoringInfo}</Info></div>
                    <div className="kpi-value">{nf(summary.data.reduce((a,b)=>a+(b.totals?.points||0),0))}</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Charts grid */}
            <div className="row g-3">
              <div className="col-12 col-lg-6">
                <div className="card chart-card">
                  <div className="card-body">
                    <div className="chart-title">Total Points <Info title="Total Points (BP)">{scoringInfo}</Info></div>
                    <div className="chart-frame">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={pointsData}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#233" />
                          <XAxis dataKey="name" />
                          <YAxis />
                          {/* Tooltip removed to eliminate hover highlight */}
                          <Legend />
                          <Bar dataKey="points" name="Points" radius={[10,10,0,0]} activeBar={false}>
                            <LabelList dataKey="points" position="top" />
                            {pointsData.map((d,i)=> <Cell key={i} fill={d.color} />)}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>
              </div>

              <div className="col-12 col-lg-6">
                <div className="card chart-card">
                  <div className="card-body">
                    <div className="chart-title">Wins / Draws / Losses <Info title="W/D/L">Counts of outcomes for the selected format (or ALL).</Info></div>
                    <div className="chart-frame">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={outcomesData}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#233" />
                          <XAxis dataKey="name" />
                          <YAxis />
                          {/* Tooltip removed to eliminate hover highlight */}
                          <Legend />
                          <Bar dataKey="Wins" fill="#22c55e" stackId="a" radius={[10,10,0,0]} activeBar={false}>
                            <LabelList dataKey="Wins" position="top" />
                          </Bar>
                          <Bar dataKey="Draws" fill="#eab308" stackId="a" radius={[10,10,0,0]} activeBar={false}>
                            <LabelList dataKey="Draws" position="top" />
                          </Bar>
                          <Bar dataKey="Losses" fill="#ef4444" stackId="a" radius={[10,10,0,0]} activeBar={false}>
                            <LabelList dataKey="Losses" position="top" />
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>
              </div>

              <div className="col-12 col-lg-6">
                <div className="card chart-card">
                  <div className="card-body">
                    <div className="chart-title">Win % Radar</div>
                    <div className="chart-frame">
                      <ResponsiveContainer width="100%" height="100%">
                        <RadarChart data={radarData} cx="50%" cy="50%" outerRadius="80%">
                          <PolarGrid />
                          <PolarAngleAxis dataKey="board" />
                          <PolarRadiusAxis angle={30} domain={[0, 100]} />
                          <Radar name="Win %" dataKey="WinPct" stroke="#22c55e" fill="#22c55e" fillOpacity={0.35} />
                        </RadarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>
              </div>

              <div className="col-12 col-lg-6">
                <div className="card chart-card">
                  <div className="card-body">
                    <div className="chart-title">Avg Run Margin</div>
                    <div className="chart-frame">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={marginData}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#233" />
                          <XAxis dataKey="name" />
                          <YAxis />
                          {/* Tooltip removed to eliminate hover highlight */}
                          <Legend />
                          <Bar dataKey="AvgRunMargin" fill="#38bdf8" radius={[10,10,0,0]} activeBar={false}>
                            <LabelList dataKey="AvgRunMargin" position="top" />
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>
              </div>

              {/* Points by Format — distinct colors & thicker lines */}
              <div className="col-12">
                <div className="card chart-card">
                  <div className="card-body">
                    <div className="chart-title">Points by Format (line)</div>
                    <div className="chart-frame tall">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={perFormatLine}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#233" />
                          <XAxis dataKey="name" />
                          <YAxis />
                          <Legend />
                          {/* keep tooltip here for readability */}
                          {/* Distinct colors + thickness + rounded caps */}
                          <Line type="monotone" dataKey="ODI"  stroke={SERIES.ODI}  strokeWidth={3} dot={{ r: 3 }} activeDot={{ r: 5 }} strokeLinecap="round" />
                          <Line type="monotone" dataKey="T20"  stroke={SERIES.T20}  strokeWidth={3} dot={{ r: 3 }} activeDot={{ r: 5 }} strokeLinecap="round" />
                          <Line type="monotone" dataKey="TEST" stroke={SERIES.TEST} strokeWidth={3} dot={{ r: 3 }} activeDot={{ r: 5 }} strokeLinecap="round" />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Timeline */}
            {timeline?.timeline?.length ? (
              <div className="row g-3 mt-1">
                <div className="col-12 col-lg-8">
                  <div className="card chart-card">
                    <div className="card-body">
                      <div className="chart-title">Crown Timeline (daily leader) <Info title="Crown Timeline">{timelineInfo}</Info></div>
                      <div className="chart-frame tall">
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={timeline.timeline}>
                            <defs>
                              <linearGradient id="grad1" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#22c55e" stopOpacity={0.6} />
                                <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                              </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="#233" />
                            <XAxis dataKey="date" />
                            <YAxis />
                            {/* Keep tooltip on timeline */}
                            <Area type="monotone" dataKey="points" stroke="#22c55e" strokeWidth={2} fillOpacity={1} fill="url(#grad1)" />
                          </AreaChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="col-12 col-lg-4">
                  <div className="card chart-card">
                    <div className="card-body">
                      <div className="chart-title">Timeline Stats</div>
                      <div className="small">
                        <div className="d-flex justify-content-between">
                          <span>Total Switches</span>
                          <strong>{Object.values(timeline.switches||{}).reduce((a,b)=>a+Number(b||0),0)}</strong>
                        </div>
                        <hr/>
                        <div className="mb-1 subtle-strong">By Board (switches)</div>
                        <ul className="list-unstyled soft-scroll">
                          {Object.entries(timeline.switches||{}).map(([bid,c])=>{
                            const name = summary?.data?.find(x=>String(x.board_id)===String(bid))?.board_name || `#${bid}`;
                            return <li key={bid} className="d-flex justify-content-between"><span>{name}</span><span className="text-success">{c}</span></li>;
                          })}
                        </ul>
                        <hr/>
                        <div className="mb-1 subtle-strong">Days Held (Top)</div>
                        <ul className="list-unstyled soft-scroll">
                          {Object.entries(timeline.days_held||{}).map(([bid,c])=>{
                            const name = summary?.data?.find(x=>String(x.board_id)===String(bid))?.board_name || `#${bid}`;
                            return <li key={bid} className="d-flex justify-content-between"><span>{name}</span><span className="text-info">{c}</span></li>;
                          })}
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : null}

            {/* Leaderboard Summary */}
            <div className="leaderboard-glass mt-3">
              <div className="lb-header">
                <div className="lb-title">Summary ({activeFmt})</div>
                <Info title="Summary Table">
                  Per-board totals for Matches, Wins, Draws, Losses, Win% and Points (includes bonuses).
                </Info>
              </div>
              <div className="leaderboard-table-wrapper">
                <table className="leaderboard-table">
                  <thead>
                    <tr>
                      <th style={{textAlign:'left'}}>Board</th>
                      <th>Matches</th>
                      <th>Wins</th>
                      <th>Draws</th>
                      <th>Losses</th>
                      <th>Win %</th>
                      <th>Points</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((r)=>(
                      <tr key={r.id} className="lb-row">
                        <td className="team-name">{r.name}</td>
                        <td>{nf(r.matches)}</td>
                        <td className="pos">{nf(r.wins)}</td>
                        <td className="warn">{nf(r.draws)}</td>
                        <td className="neg">{nf(r.losses)}</td>
                        <td>{pc(r.win_pct)}</td>
                        <td className="pos">{nf(r.points)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )
      ) : (
        // ====== HALL OF FAME ======
        <div className="row g-3">
          {/* Trophy Cabinet */}
          <div className="col-12">
            <div className="card chart-card">
              <div className="card-body">
                <div className="d-flex align-items-center justify-content-between">
                  <div className="analytics-section-title">Trophy Cabinet (3×+ Champions)</div>
                  <Info title="Trophy Cabinet">Teams with 3 or more championships for the selected board(s).</Info>
                </div>
                <div className="hof-cabinet">
                  {selected.map(bid => {
                    const boardName = boards.find(b=>String(b.board_id)===String(bid))?.board_name || `#${bid}`;
                    const items = hofStats[bid] || [];
                    return (
                      <div className="hof-cabinet-col" key={bid}>
                        <div className="hof-cabinet-title">{boardName}</div>
                        <div className="hof-cabinet-badges">
                          {items.length ? items.map((it, i)=>(
                            <div className="hof-badge" key={i} title={`${it.champion_team}: ${it.titles} titles`}>
                              <FaCrown className="me-1"/> <b>{it.titles}×</b> {it.champion_team}
                            </div>
                          )) : <div className="subtle">No 3× champions yet.</div>}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* Past Champions — Trophy Chain */}
          <div className="col-12">
            <div className="card chart-card">
              <div className="card-body">
                <div className="d-flex align-items-center justify-content-between">
                  <div className="analytics-section-title">Past Champions — Trophy Chain</div>
                  <div className="subtle">Ordered from <b>past</b> to <b>current</b>.</div>
                </div>

                <div className="hof-chain">
                  {hofLoading ? (
                    <div className="subtle">Loading…</div>
                  ) : (hofWall.length ? hofWall.map((item, idx) => {
                    const boardName = boards.find(b=>b.board_id===item.board_id)?.board_name || `#${item.board_id}`;
                    const dateStr = item.final_date || item.season_year;
                    const isLast = idx === hofWall.length - 1;
                    return (
                      <div className={`hof-chain-item ${isLast ? "last" : ""}`} key={item.id}>
                        <div className="hof-chain-trophy"><FaTrophy /></div>
                        <div className="hof-chain-content">
                          <div className="hof-chain-title">{item.champion_team}</div>
                          <div className="hof-chain-meta">
                            <span className="badge bg-primary bg-opacity-25 text-info me-1">{item.match_type}</span>
                            <span className="text">{item.tournament_name}</span>
                            <span className="dot">•</span>
                            <span className="text">{dateStr}</span>
                          </div>
                          {item.runner_up_team ? (
                            <div className="hof-chain-sub">Runner-up: <b>{item.runner_up_team}</b></div>
                          ) : null}
                          <div className="hof-chain-board">{boardName}</div>
                        </div>
                      </div>
                    );
                  }) : <div className="subtle">No entries match your filters.</div>)}
                </div>
              </div>
            </div>
          </div>

          {/* Hall of Fame Wall */}
          <div className="col-12">
            <div className="card chart-card">
              <div className="card-body">
                <div className="d-flex align-items-center justify-content-between">
                  <div className="analytics-section-title">Hall of Fame Wall</div>
                  <div className="subtle">{hofWall.length} record(s)</div>
                </div>
                <div className="hof-grid">
                  {hofWall.map(item => {
                    const bName = boards.find(b=>b.board_id===item.board_id)?.board_name || `#${item.board_id}`;
                    return (
                      <div className="hof-card" key={item.id}>
                        <div className="hof-card-top">
                          <div className="hof-card-board">{bName}</div>
                          <div className="hof-card-type">{item.match_type}</div>
                        </div>
                        <div className="hof-card-main">
                          <div className="hof-card-champ"><FaCrown className="me-1 text-warning"/>{item.champion_team}</div>
                          <div className="hof-card-sub">
                            {item.tournament_name} &middot; {item.season_year}
                            {item.season_month ? ` (${months.find(m=>m.v===item.season_month)?.l||item.season_month})` : ""}
                          </div>
                          {item.runner_up_team ? <div className="hof-card-runner">Runner-up: {item.runner_up_team}</div> : null}
                          {item.final_date ? <div className="hof-card-date">Final: {item.final_date}</div> : null}
                          {item.remarks ? <div className="hof-card-remarks">{item.remarks}</div> : null}
                        </div>
                        <div className="hof-card-actions">
                          <button className="btn btn-sm btn-outline-light"
                            onClick={async ()=>{
                              if (!window.confirm("Delete this entry?")) return;
                              await axios.delete(`${API}/api/boards/hof/${item.id}`);
                              await loadHOF();
                            }}
                          ><FaTrash className="me-1"/>Delete</button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* Add Entry Modal */}
          {showHofModal && (
            <div className="info-modal">
              <div className="info-modal-body" style={{maxWidth: 800}}>
                <div className="info-modal-title">Add Hall of Fame Entry</div>
                <div className="row g-3">
                  <div className="col-12 col-md-6">
                    <label className="form-label">Board</label>
                    <select className="form-select dark-input"
                      value={hofForm.board_id}
                      onChange={e=>setHofForm(f=>({...f, board_id:e.target.value, champion_board_id:e.target.value}))}
                    >
                      <option value="">Select</option>
                      {boards.map(b=><option key={b.board_id} value={b.board_id}>{b.board_name}</option>)}
                    </select>
                  </div>
                  <div className="col-6 col-md-3">
                    <label className="form-label">Match Type</label>
                    <select className="form-select dark-input"
                      value={hofForm.match_type}
                      onChange={e=>setHofForm(f=>({...f, match_type:e.target.value}))}
                    >
                      <option>ODI</option><option>T20</option><option>TEST</option>
                    </select>
                  </div>
                  <div className="col-6 col-md-3">
                    <label className="form-label">Season Year</label>
                    <input className="form-control dark-input" type="number"
                      value={hofForm.season_year}
                      onChange={e=>setHofForm(f=>({...f, season_year:e.target.value}))}/>
                  </div>

                  <div className="col-6 col-md-3">
                    <label className="form-label">Season Month</label>
                    <select className="form-select dark-input"
                      value={hofForm.season_month}
                      onChange={e=>setHofForm(f=>({...f, season_month:e.target.value}))}
                    >
                      <option value="">—</option>
                      {months.map(m=> <option key={m.v} value={m.v}>{m.l}</option>)}
                    </select>
                  </div>

                  <div className="col-12 col-md-9">
                    <label className="form-label">Tournament</label>
                    <select className="form-select dark-input"
                      value={hofForm.tournament_name}
                      onChange={e=>setHofForm(f=>({...f, tournament_name:e.target.value}))}
                    >
                      <option value="">Select tournament</option>
                      {hofAddMeta.tournaments.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>

                  <div className="col-12 col-md-6">
                    <label className="form-label">Champion Team</label>
                    <select className="form-select dark-input"
                      value={hofForm.champion_team_id}
                      onChange={e=>{
                        const id = e.target.value;
                        const name = dedupTeams.find(t=>String(t.id)===String(id))?.name || "";
                        setHofForm(f=>({...f, champion_team_id:id, champion_team:name}));
                      }}
                    >
                      <option value="">Select team</option>
                      {dedupTeams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                    </select>
                  </div>
                  <div className="col-12 col-md-6">
                    <label className="form-label">Runner-up Team</label>
                    <select className="form-select dark-input"
                      value={hofForm.runner_up_team}
                      onChange={e=>setHofForm(f=>({...f, runner_up_team:e.target.value}))}
                    >
                      <option value="">Select team</option>
                      {ruTeamOptions.map(t => <option key={t.id} value={t.name}>{t.name}</option>)}
                    </select>
                  </div>

                  <div className="col-12 col-md-6">
                    <label className="form-label">Champion Board</label>
                    <select className="form-select dark-input"
                      value={hofForm.champion_board_id || hofForm.board_id}
                      onChange={e=>setHofForm(f=>({...f, champion_board_id:e.target.value}))}
                    >
                      <option value="">Select board</option>
                      {(hofAddMeta.boards||[]).map(b => <option key={b.id} value={b.id}>{b.board_name}</option>)}
                    </select>
                  </div>
                  <div className="col-12 col-md-6">
                    <label className="form-label">Runner-up Board</label>
                    <select className="form-select dark-input"
                      value={hofForm.runner_up_board_id}
                      onChange={e=>setHofForm(f=>({...f, runner_up_board_id:e.target.value}))}
                    >
                      <option value="">Select board</option>
                      {ruBoardOptions.map(b => <option key={b.id} value={b.id}>{b.board_name}</option>)}
                    </select>
                  </div>

                  <div className="col-12 col-md-6">
                    <label className="form-label">Final Date</label>
                    <input className="form-control dark-input" type="date"
                      value={hofForm.final_date}
                      onChange={e=>setHofForm(f=>({...f, final_date:e.target.value}))}/>
                  </div>
                  <div className="col-12">
                    <label className="form-label">Remarks</label>
                    <textarea className="form-control dark-input" rows="2"
                      value={hofForm.remarks}
                      onChange={e=>setHofForm(f=>({...f, remarks:e.target.value}))}/>
                  </div>
                </div>

                <div className="d-flex justify-content-end gap-2 mt-3">
                  <button className="btn btn-outline-light btn-sm" onClick={()=>setShowHofModal(false)}>Cancel</button>
                  <button className="btn btn-primary btn-sm" onClick={async ()=>{
                    if (!hofForm.board_id || !hofForm.tournament_name || !hofForm.champion_team_id) {
                      alert("Board, Tournament and Champion team are required.");
                      return;
                    }
                    if (hofForm.runner_up_team &&
                        String(hofForm.runner_up_team).toLowerCase() === String(hofForm.champion_team).toLowerCase()) {
                      alert("Runner-up team cannot be the same as Champion team.");
                      return;
                    }
                    if (hofForm.runner_up_board_id &&
                        String(hofForm.runner_up_board_id) === String(hofForm.champion_board_id || hofForm.board_id)) {
                      alert("Runner-up board cannot be the same as Champion board.");
                      return;
                    }
                    try{
                      await axios.post(`${API}/api/boards/hof/upsert`, hofForm);
                      setShowHofModal(false);
                      await loadHOF();
                      await loadHOFMeta();
                    }catch(e){
                      console.error(e); alert("Save failed");
                    }
                  }}>Save</button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
