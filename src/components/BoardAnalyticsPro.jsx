// C:\cricket-scoreboard-frontend\src\components\BoardAnalyticsPro.jsx
import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, LabelList,
  AreaChart, Area, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Cell
} from "recharts";
import { FaCrown, FaFilter, FaPlay, FaSyncAlt, FaMedal, FaInfoCircle } from "react-icons/fa";
import "./BoardAnalyticsPro.css";

const API = "https://cricket-scoreboard-backend.onrender.com";
const PALETTE = ["#22c55e","#3b82f6","#ef4444","#a855f7","#f59e0b","#14b8a6","#f43f5e","#8b5cf6","#10b981","#eab308"];
const fmts = ["ALL","ODI","T20","TEST"];
const nf = (n)=> new Intl.NumberFormat().format(n ?? 0);
const fmtOrZero = (b, f, k) => Number(b?.formats?.[f]?.[k] ?? 0);
const pc = (n)=> (isFinite(n) ? Number(n.toFixed(2)) : 0);

/* Tiny “i” popover */
function Info({ title, children }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button className="info-btn" type="button" title="What is this?" onClick={()=>setOpen(true)}>
        <FaInfoCircle />
      </button>
      {open && (
        <div className="info-modal">
          <div className="info-modal-body">
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

  // Helpful strings for the info popups
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

  return (
    <div className="board-analytics-container">
      <div className="d-flex align-items-center justify-content-between mb-3">
        <div>
          <h2 className="analytics-section-title mb-1">CrickEdge • Board Analytics</h2>
          <div className="text-muted small">Compare boards across formats and time.</div>
        </div>
        {summary?.top_board && (
          <div className="top-board-highlight">
            <FaCrown /> Top: {summary.top_board.board_name}
          </div>
        )}
      </div>

      {/* Filters */}
      <div className="row g-3 mb-3">
        <div className="col-12 col-md-4">
          <div className="card chart-card h-100">
            <div className="card-body">
              <div className="d-flex align-items-center mb-2">
                <FaFilter className="me-2 text-info"/><strong>Boards</strong>
              </div>
              <div className="border rounded p-2" style={{maxHeight:140, overflowY:"auto"}}>
                {boards.map(b=>{
                  const checked = selected.includes(String(b.board_id));
                  return (
                    <div key={b.board_id} className="form-check">
                      <input className="form-check-input" type="checkbox" id={`b${b.board_id}`}
                        checked={checked}
                        onChange={(e)=>{
                          if (e.target.checked) setSelected(prev=>[...prev, String(b.board_id)]);
                          else setSelected(prev=>prev.filter(x=>x!==String(b.board_id)));
                        }}
                      />
                      <label className="form-check-label" htmlFor={`b${b.board_id}`}>{b.board_name}</label>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        <div className="col-6 col-md-2">
          <div className="card chart-card h-100">
            <div className="card-body">
              <div className="small text-muted">From</div>
              <input type="date" className="form-control" value={from} onChange={e=>setFrom(e.target.value)}/>
            </div>
          </div>
        </div>
        <div className="col-6 col-md-2">
          <div className="card chart-card h-100">
            <div className="card-body">
              <div className="small text-muted">To</div>
              <input type="date" className="form-control" value={to} onChange={e=>setTo(e.target.value)}/>
            </div>
          </div>
        </div>

        <div className="col-12 col-md-4">
          <div className="card chart-card h-100">
            <div className="card-body d-flex flex-wrap gap-2 align-items-center">
              <div className="me-2 small text-muted">Format:</div>
              {fmts.map(f=>(
                <button
                  key={f}
                  className={`btn btn-sm ${activeFmt===f? "btn-success":"btn-outline-secondary"}`}
                  onClick={()=>setActiveFmt(f)}
                >
                  {f}
                </button>
              ))}
              <div className="ms-auto d-flex gap-2">
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
        <div className="text-center text-muted py-4 fade-in">
          <FaCrown className="me-2"/><span>Select boards & date range, then click Analyze.</span>
        </div>
      ) : (
        <>
          {/* KPI Cards */}
          <div className="row g-3 mb-3">
            <div className="col-12 col-md-3">
              <div className="card chart-card h-100">
                <div className="card-body">
                  <div className="d-flex align-items-center justify-content-between">
                    <div className="text-muted small">Boards Compared</div>
                    <Info title="Boards Compared">How many boards are included in this analysis window.</Info>
                  </div>
                  <div className="h4 m-0">{summary.data.length}</div>
                </div>
              </div>
            </div>
            <div className="col-12 col-md-3">
              <div className="card chart-card h-100">
                <div className="card-body">
                  <div className="d-flex align-items-center justify-content-between">
                    <div className="text-muted small">Total Matches</div>
                    <Info title="Total Matches">Sum of matches across the selected boards and date range.</Info>
                  </div>
                  <div className="h4 m-0">{nf(summary.data.reduce((a,b)=>a+(b.totals?.matches||0),0))}</div>
                </div>
              </div>
            </div>
            <div className="col-12 col-md-3">
              <div className="card chart-card h-100">
                <div className="card-body">
                  <div className="d-flex align-items-center justify-content-between">
                    <div className="text-muted small">Total Points</div>
                    <Info title="Board Points (BP)">{scoringInfo}</Info>
                  </div>
                  <div className="h4 m-0">{nf(summary.data.reduce((a,b)=>a+(b.totals?.points||0),0))}</div>
                </div>
              </div>
            </div>
            <div className="col-12 col-md-3">
              <div className="card chart-card h-100">
                <div className="card-body d-flex align-items-center gap-2">
                  <FaMedal className="text-warning"/><div className="small">Top Board</div>
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
                  <div className="d-flex align-items-center justify-content-between">
                    <div className="analytics-section-title">Total Points</div>
                    <Info title="Total Points (BP)">{scoringInfo}</Info>
                  </div>
                  <div style={{ height: 320 }}>
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
                  <div className="d-flex align-items-center justify-content-between">
                    <div className="analytics-section-title">Wins / Draws / Losses</div>
                    <Info title="W/D/L">
                      Counts of outcomes for the currently selected format (or ALL). Draw includes tie/no result/abandoned.
                    </Info>
                  </div>
                  <div style={{ height: 320 }}>
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
                  <div className="d-flex align-items-center justify-content-between">
                    <div className="analytics-section-title">Win % Radar</div>
                    <Info title="Win %">
                      Percentage of wins out of matches for the active format. Higher is better.
                    </Info>
                  </div>
                  <div style={{ height: 320 }}>
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
                  <div className="d-flex align-items-center justify-content-between">
                    <div className="analytics-section-title">Avg Run Margin</div>
                    <Info title="Avg Run Margin">
                      Average of run margins (ODI/T20: |R1-R2|; Test: |(R1+R1_2)-(R2+R2_2)|). In ALL, we average the per-format averages.
                    </Info>
                  </div>
                  <div style={{ height: 320 }}>
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
                  <div className="d-flex align-items-center justify-content-between">
                    <div className="analytics-section-title">Points by Format (stacked)</div>
                    <Info title="Points by Format">{scoringInfo}</Info>
                  </div>
                  <div style={{ height: 340 }}>
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
                    <div className="d-flex align-items-center justify-content-between">
                      <div className="analytics-section-title">Crown Timeline (daily leader)</div>
                      <Info title="Crown Timeline">{timelineInfo}</Info>
                    </div>
                    <div style={{ height: 340 }}>
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
                    <div className="d-flex align-items-center justify-content-between">
                      <div className="analytics-section-title">Timeline Stats</div>
                      <Info title="Timeline Stats">{timelineInfo}</Info>
                    </div>
                    <div className="small">
                      <div className="d-flex justify-content-between">
                        <span>Total Switches</span>
                        <strong>{Object.values(timeline.switches||{}).reduce((a,b)=>a+Number(b||0),0)}</strong>
                      </div>
                      <hr/>
                      <div className="mb-1 text-muted">By Board (switches)</div>
                      <ul className="list-unstyled" style={{maxHeight:150, overflowY:"auto"}}>
                        {Object.entries(timeline.switches||{}).map(([bid,c])=>{
                          const name = summary?.data?.find(x=>String(x.board_id)===String(bid))?.board_name || `#${bid}`;
                          return <li key={bid} className="d-flex justify-content-between"><span>{name}</span><span className="text-success">{c}</span></li>;
                        })}
                      </ul>
                      <hr/>
                      <div className="mb-1 text-muted">Days Held (Top)</div>
                      <ul className="list-unstyled" style={{maxHeight:150, overflowY:"auto"}}>
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

          {/* Table */}
          <div className="card chart-card mt-3">
            <div className="card-body">
              <div className="d-flex align-items-center justify-content-between">
                <div className="analytics-section-title">Summary ({activeFmt})</div>
                <Info title="Summary Table">
                  Per-board totals for Matches, Wins, Draws, Losses, Win% and Points under the selected format.
                </Info>
              </div>
              <div className="table-responsive">
                <table className="table table-dark table-striped table-hover align-middle">
                  <thead>
                    <tr>
                      <th>Board</th>
                      <th className="text-end">Matches</th>
                      <th className="text-end">Wins</th>
                      <th className="text-end">Draws</th>
                      <th className="text-end">Losses</th>
                      <th className="text-end">Win %</th>
                      <th className="text-end">Points</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map(r=>(
                      <tr key={r.id}>
                        <td>{r.name}</td>
                        <td className="text-end">{nf(r.matches)}</td>
                        <td className="text-end text-success">{nf(r.wins)}</td>
                        <td className="text-end text-warning">{nf(r.draws)}</td>
                        <td className="text-end text-danger">{nf(r.losses)}</td>
                        <td className="text-end">{pc(r.win_pct)}</td>
                        <td className="text-end fw-semibold">{nf(r.points)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
