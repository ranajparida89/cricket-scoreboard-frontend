// C:\cricket-scoreboard-frontend\src\components\BoardAnalyticsPro.jsx
import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import Select from "react-select";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, LabelList,
  AreaChart, Area, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Cell
} from "recharts";
import { FaCrown, FaPlay, FaSyncAlt, FaMedal, FaInfoCircle } from "react-icons/fa";
import "./BoardAnalyticsPro.css";

const API = "https://cricket-scoreboard-backend.onrender.com";
const PALETTE = ["#22c55e","#3b82f6","#ef4444","#a855f7","#f59e0b","#14b8a6","#f43f5e","#8b5cf6","#10b981","#eab308"];
const fmts = ["ALL","ODI","T20","TEST"];
const nf = (n)=> new Intl.NumberFormat().format(n ?? 0);
const fmtOrZero = (b, f, k) => Number(b?.formats?.[f]?.[k] ?? 0);
const pc = (n)=> (isFinite(n) ? Number(n.toFixed(2)) : 0);

/* ——— Tiny “i” popover ——— */
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

/* ——— Fancy Top Board badge ——— */
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
  const [boards, setBoards] = useState([]);
  const [selected, setSelected] = useState([]);
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [activeFmt, setActiveFmt] = useState("ALL");
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState(null);
  const [timeline, setTimeline] = useState(null);

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
  const perFormatStack = useMemo(()=> {
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

  // helpful strings for the info popups
  const scoringInfo = (
    <ul className="mb-0">
      <li><b>ODI/T20</b> — Win: <b>10</b>, Draw: <b>5</b>, Loss: <b>2</b></li>
      <li><b>Test</b> — Win: <b>18</b>, Draw: <b>9</b>, Loss: <b>4</b></li>
      <li>“Board Points” = sum of points by matches for selected format(s).</li>
    </ul>
  );
  const timelineInfo = (
    <ul className="mb-0">
      <li>We add each day’s points to a running total.</li>
      <li>The chart shows the <b>current leader’s cumulative points</b> across time.</li>
      <li><b>Switches</b> = how many times a new leader took the crown.</li>
      <li><b>Days Held</b> = number of days a board stayed on top.</li>
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

  return (
    <div className="board-analytics-container">
      <div className="d-flex align-items-center justify-content-between mb-3">
        <div>
          <h2 className="analytics-section-title mb-1">CrickEdge • Board Analytics</h2>
          <div className="subtle">Compare boards across formats and time.</div>
        </div>
        <TopBoardBadge name={summary?.top_board?.board_name} />
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
            </div>
          </div>
        </div>

        <div className="col-6 col-lg-2">
          <div className="card chart-card h-100">
            <div className="card-body">
              <div className="filter-title">From</div>
              <input type="date" className="form-control dark-input" value={from} onChange={e=>setFrom(e.target.value)}/>
            </div>
          </div>
        </div>

        <div className="col-6 col-lg-2">
          <div className="card chart-card h-100">
            <div className="card-body">
              <div className="filter-title">To</div>
              <input type="date" className="form-control dark-input" value={to} onChange={e=>setTo(e.target.value)}/>
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
      </div>

      {!summary ? (
        <div className="text-center subtle py-4 fade-in">
          <FaCrown className="me-2"/><span>Select boards & date range, then click Analyze.</span>
        </div>
      ) : (
        <>
          {/* KPI Cards */}
          <div className="row g-3 mb-3">
            <div className="col-12 col-md-3">
              <div className="card chart-card h-100">
                <div className="card-body">
                  <div className="kpi-title">Boards Compared <Info title="Boards Compared">How many boards are included in this analysis window.</Info></div>
                  <div className="kpi-value">{summary.data.length}</div>
                </div>
              </div>
            </div>
            <div className="col-12 col-md-3">
              <div className="card chart-card h-100">
                <div className="card-body">
                  <div className="kpi-title">Total Matches <Info title="Total Matches">Sum of matches across the selected boards and date range.</Info></div>
                  <div className="kpi-value">{nf(summary.data.reduce((a,b)=>a+(b.totals?.matches||0),0))}</div>
                </div>
              </div>
            </div>
            <div className="col-12 col-md-3">
              <div className="card chart-card h-100">
                <div className="card-body">
                  <div className="kpi-title">Total Points <Info title="Board Points (BP)">{scoringInfo}</Info></div>
                  <div className="kpi-value">{nf(summary.data.reduce((a,b)=>a+(b.totals?.points||0),0))}</div>
                </div>
              </div>
            </div>
            <div className="col-12 col-md-3">
              <div className="card chart-card h-100">
                <div className="card-body d-flex align-items-center gap-2">
                  <FaMedal className="text-warning"/><div className="subtle-strong">Top Board</div>
                  <div className="ms-auto fw-semibold">{summary.top_board?.board_name || "—"}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Charts grid */}
          <div className="row g-3">
            {/* Total Points */}
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
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="points" name="Points" radius={[10,10,0,0]}>
                          <LabelList dataKey="points" position="top" />
                          {pointsData.map((d,i)=> <Cell key={i} fill={d.color} />)}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            </div>

            {/* W/D/L */}
            <div className="col-12 col-lg-6">
              <div className="card chart-card">
                <div className="card-body">
                  <div className="chart-title">Wins / Draws / Losses <Info title="W/D/L">Counts of outcomes for the selected format (or ALL). Draw may include tie/no result/abandoned.</Info></div>
                  <div className="chart-frame">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={outcomesData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#233" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="Wins" fill="#22c55e" stackId="a" radius={[10,10,0,0]}>
                          <LabelList dataKey="Wins" position="top" />
                        </Bar>
                        <Bar dataKey="Draws" fill="#eab308" stackId="a" radius={[10,10,0,0]}>
                          <LabelList dataKey="Draws" position="top" />
                        </Bar>
                        <Bar dataKey="Losses" fill="#ef4444" stackId="a" radius={[10,10,0,0]}>
                          <LabelList dataKey="Losses" position="top" />
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            </div>

            {/* Win % Radar */}
            <div className="col-12 col-lg-6">
              <div className="card chart-card">
                <div className="card-body">
                  <div className="chart-title">Win % Radar <Info title="Win %">Percentage of wins out of matches for the active format.</Info></div>
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

            {/* Avg Run Margin */}
            <div className="col-12 col-lg-6">
              <div className="card chart-card">
                <div className="card-body">
                  <div className="chart-title">Avg Run Margin <Info title="Avg Run Margin">Average of run margins (ODI/T20: |R1-R2|; Test: |(R1+R1_2)-(R2+R2_2)|). In ALL, we average per-format averages.</Info></div>
                  <div className="chart-frame">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={marginData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#233" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="AvgRunMargin" fill="#38bdf8" radius={[10,10,0,0]}>
                          <LabelList dataKey="AvgRunMargin" position="top" />
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            </div>

            {/* Stacked by format */}
            <div className="col-12">
              <div className="card chart-card">
                <div className="card-body">
                  <div className="chart-title">Points by Format (stacked) <Info title="Points by Format">{scoringInfo}</Info></div>
                  <div className="chart-frame tall">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={perFormatStack}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#233" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="ODI" stackId="fmt" fill="#22c55e" radius={[10,10,0,0]}>
                          <LabelList dataKey="ODI" position="top" />
                        </Bar>
                        <Bar dataKey="T20" stackId="fmt" fill="#3b82f6" radius={[10,10,0,0]}>
                          <LabelList dataKey="T20" position="top" />
                        </Bar>
                        <Bar dataKey="TEST" stackId="fmt" fill="#a855f7" radius={[10,10,0,0]}>
                          <LabelList dataKey="TEST" position="top" />
                        </Bar>
                      </BarChart>
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
                          <Tooltip />
                          <Area type="monotone" dataKey="points" stroke="#22c55e" fillOpacity={1} fill="url(#grad1)" />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>
              </div>

              <div className="col-12 col-lg-4">
                <div className="card chart-card">
                  <div className="card-body">
                    <div className="chart-title">Timeline Stats <Info title="Timeline Stats">{timelineInfo}</Info></div>
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

          {/* Leaderboard-style Summary */}
          <div className="leaderboard-glass mt-3">
            <div className="lb-header">
              <div className="lb-title">Summary ({activeFmt})</div>
              <Info title="Summary Table">
                Per-board totals for Matches, Wins, Draws, Losses, Win% and Points under the selected format.
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
                  {rows.map((r,i)=>(
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
      )}
    </div>
  );
}
