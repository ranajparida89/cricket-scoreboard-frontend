import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { motion } from "framer-motion";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, LabelList,
  LineChart, Line, Area, AreaChart, ResponsiveContainer, Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  PieChart, Pie, Cell
} from "recharts";
import { Crown, CalendarRange, Trophy, Target, Sparkles, RefreshCw, Filter, TrendingUp, Activity, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import './BoardAnalyticsPro.css';


// === CONFIG ===
const API = "https://cricket-scoreboard-backend.onrender.com";
const PALETTE = [
  "#22c55e", "#3b82f6", "#ef4444", "#a855f7", "#f59e0b",
  "#14b8a6", "#f43f5e", "#8b5cf6", "#10b981", "#eab308",
];

const fmtList = ["ALL", "ODI", "T20", "TEST"];

// tiny helpers
const fmtOrZero = (b, f, k) => Number(b?.formats?.[f]?.[k] ?? 0);
const safePct = (num) => isFinite(num) ? Number(num.toFixed(2)) : 0;
const nf = (n)=> new Intl.NumberFormat().format(n ?? 0);

export default function BoardAnalyticsPro() {
  const [boards, setBoards] = useState([]);
  const [selected, setSelected] = useState([]); // board_id[]
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState(null);   // { data, top_board }
  const [timeline, setTimeline] = useState(null); // { timeline, switches, days_held }
  const [activeFmt, setActiveFmt] = useState("ALL");

  // Load boards on mount
  useEffect(() => {
    axios.get(`${API}/api/boards/analytics/boards`).then(r => setBoards(r.data.boards || []));
    // Default date range: last 365 days
    const today = new Date();
    const past = new Date(); past.setDate(past.getDate()-365);
    setTo(today.toISOString().slice(0,10));
    setFrom(past.toISOString().slice(0,10));
  }, []);

  const analyze = async () => {
    if (!selected.length) {
      alert("Select at least one board");
      return;
    }
    setLoading(true);
    try {
      const ids = selected.join(",");
      const [s, t] = await Promise.all([
        axios.get(`${API}/api/boards/analytics/summary`, { params: { board_ids: ids, from, to } }),
        axios.get(`${API}/api/boards/analytics/timeline`, { params: { board_ids: ids, from, to } }),
      ]);
      setSummary(s.data);
      setTimeline(t.data);
    } catch (e) {
      console.error(e);
      alert("Failed to load analytics");
    } finally { setLoading(false); }
  };

  // color map per board
  const colorMap = useMemo(() => {
    const map = new Map();
    (summary?.data||[]).forEach((b, i)=> map.set(b.board_id, PALETTE[i % PALETTE.length]));
    return map;
  }, [summary]);

  // KPI rollups based on active format
  const tableRows = useMemo(()=>{
    if (!summary?.data) return [];
    return summary.data.map(b => {
      if (activeFmt === "ALL") {
        return {
          id: b.board_id,
          name: b.board_name,
          matches: b.totals.matches,
          wins: b.totals.wins,
          draws: b.totals.draws,
          losses: b.totals.losses,
          win_pct: b.totals.win_pct,
          points: b.totals.points,
        };
      }
      return {
        id: b.board_id,
        name: b.board_name,
        matches: fmtOrZero(b, activeFmt, "matches"),
        wins: fmtOrZero(b, activeFmt, "wins"),
        draws: fmtOrZero(b, activeFmt, "draws"),
        losses: fmtOrZero(b, activeFmt, "losses"),
        win_pct: fmtOrZero(b, activeFmt, "win_pct"),
        points: fmtOrZero(b, activeFmt, "points"),
      };
    });
  }, [summary, activeFmt]);

  // Chart datasets
  const pointsData = useMemo(()=>tableRows.map(r=>({ name: r.name, points: r.points, color: colorMap.get(r.id) })), [tableRows, colorMap]);
  const outcomesData = useMemo(()=>tableRows.map(r=>({ name: r.name, Wins: r.wins, Draws: r.draws, Losses: r.losses })), [tableRows]);
  const winPctRadar = useMemo(()=>tableRows.map(r=>({ board: r.name, WinPct: r.win_pct })), [tableRows]);

  // Per-format bar data from summary
  const formatPointsStack = useMemo(()=>{
    if (!summary?.data) return [];
    return summary.data.map(b=>({
      name: b.board_name,
      ODI: fmtOrZero(b, "ODI", "points"),
      T20: fmtOrZero(b, "T20", "points"),
      TEST: fmtOrZero(b, "TEST", "points"),
    }));
  }, [summary]);

  // Avg run margin per board (by active fmt or total avg of avgs)
  const marginData = useMemo(()=>{
    if (!summary?.data) return [];
    return summary.data.map(b=>{
      if (activeFmt === "ALL") {
        const avgs = ["ODI","T20","TEST"]
          .map(f=> Number(b?.formats?.[f]?.avg_run_margin ?? 0))
          .filter(x=>x>0);
        const avg = avgs.length ? avgs.reduce((a,c)=>a+c,0)/avgs.length : 0;
        return { name: b.board_name, "Avg Run Margin": safePct(avg) };
      }
      return { name: b.board_name, "Avg Run Margin": Number(b?.formats?.[activeFmt]?.avg_run_margin ?? 0) };
    });
  }, [summary, activeFmt]);

  const top = summary?.top_board;

  return (
    <div className="min-h-screen bg-[#0b0f1a] text-slate-200">
      {/* HEADER */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 via-indigo-500/10 to-fuchsia-500/10" />
        <div className="max-w-7xl mx-auto px-4 py-8 relative">
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .5 }} className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-3">
                <Sparkles className="w-6 h-6 text-emerald-400"/>
                <h1 className="text-2xl md:text-3xl font-bold tracking-tight">CrickEdge • Board Analytics</h1>
              </div>
              <p className="text-slate-400 mt-1">Deep-dive performance across Boards, Formats, and Time.</p>
            </div>
            <Badge className="bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">PRO</Badge>
          </motion.div>

          {/* FILTERS */}
          <div className="mt-6 grid grid-cols-1 md:grid-cols-4 gap-3">
            <Card className="bg-white/5 border-white/10">
              <CardHeader className="py-3"><CardTitle className="text-sm text-slate-300 flex items-center gap-2"><Filter className="w-4 h-4"/> Boards</CardTitle></CardHeader>
              <CardContent className="py-3">
                <div className="h-28 overflow-auto rounded-xl ring-1 ring-white/10">
                  <ul className="divide-y divide-white/5">
                    {boards.map(b=>{
                      const checked = selected.includes(String(b.board_id));
                      return (
                        <li key={b.board_id} className="flex items-center justify-between px-3 py-2 hover:bg-white/5">
                          <span className="truncate">{b.board_name}</span>
                          <input type="checkbox" className="accent-emerald-500" checked={checked}
                                 onChange={(e)=>{
                                   if (e.target.checked) setSelected(prev=>[...prev, String(b.board_id)]);
                                   else setSelected(prev=>prev.filter(x=>x!==String(b.board_id)));
                                 }} />
                        </li>
                      );
                    })}
                  </ul>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white/5 border-white/10">
              <CardHeader className="py-3"><CardTitle className="text-sm text-slate-300 flex items-center gap-2"><CalendarRange className="w-4 h-4"/> Date From</CardTitle></CardHeader>
              <CardContent className="py-3">
                <Input type="date" value={from} onChange={e=>setFrom(e.target.value)} className="bg-black/30 border-white/10"/>
              </CardContent>
            </Card>

            <Card className="bg-white/5 border-white/10">
              <CardHeader className="py-3"><CardTitle className="text-sm text-slate-300 flex items-center gap-2"><CalendarRange className="w-4 h-4"/> Date To</CardTitle></CardHeader>
              <CardContent className="py-3">
                <Input type="date" value={to} onChange={e=>setTo(e.target.value)} className="bg-black/30 border-white/10"/>
              </CardContent>
            </Card>

            <Card className="bg-white/5 border-white/10">
              <CardHeader className="py-3"><CardTitle className="text-sm text-slate-300 flex items-center gap-2"><Activity className="w-4 h-4"/> Actions</CardTitle></CardHeader>
              <CardContent className="py-3 flex items-center gap-2">
                <Button className="bg-emerald-600 hover:bg-emerald-500" onClick={analyze} disabled={loading}>
                  {loading ? <RefreshCw className="animate-spin w-4 h-4"/> : <TrendingUp className="w-4 h-4 mr-1"/>}
                  Analyze
                </Button>
                <Button variant="outline" className="border-white/20 text-slate-200 hover:bg-white/10" onClick={()=>{ setSummary(null); setTimeline(null); }}>
                  Clear
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* BODY */}
      <div className="max-w-7xl mx-auto px-4 pb-10">
        {summary ? (
          <>
            {/* KPI STRIP */}
            <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card className="bg-gradient-to-br from-amber-500/15 to-yellow-500/10 border-amber-400/20">
                <CardHeader className="pb-2"><CardTitle className="text-amber-300 text-sm flex items-center gap-2"><Crown className="w-4 h-4"/> Top Board</CardTitle></CardHeader>
                <CardContent>
                  <div className="text-xl font-semibold flex items-center gap-2">
                    {summary.top_board ? summary.top_board.board_name : "—"}
                    {summary.top_board && <Trophy className="w-5 h-5 text-amber-400"/>}
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white/5 border-white/10">
                <CardHeader className="pb-2"><CardTitle className="text-slate-300 text-sm">Boards Compared</CardTitle></CardHeader>
                <CardContent><div className="text-xl font-semibold">{summary.data.length}</div></CardContent>
              </Card>

              <Card className="bg-white/5 border-white/10">
                <CardHeader className="pb-2"><CardTitle className="text-slate-300 text-sm">Total Matches</CardTitle></CardHeader>
                <CardContent><div className="text-xl font-semibold">{nf(summary.data.reduce((a,b)=>a+(b.totals?.matches||0),0))}</div></CardContent>
              </Card>

              <Card className="bg-white/5 border-white/10">
                <CardHeader className="pb-2"><CardTitle className="text-slate-300 text-sm">Total Points</CardTitle></CardHeader>
                <CardContent><div className="text-xl font-semibold">{nf(summary.data.reduce((a,b)=>a+(b.totals?.points||0),0))}</div></CardContent>
              </Card>
            </div>

            {/* FORMAT TABS */}
            <div className="mt-6">
              <Tabs value={activeFmt} onValueChange={setActiveFmt}>
                <TabsList className="grid grid-cols-4 bg-white/5 border border-white/10">
                  {fmtList.map(f=> (
                    <TabsTrigger key={f} value={f} className="data-[state=active]:bg-emerald-500/20 data-[state=active]:text-emerald-300">{f}</TabsTrigger>
                  ))}
                </TabsList>
                <TabsContent value={activeFmt} className="mt-4">
                  {/* CHARTS GRID */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Points Bar */}
                    <Card className="bg-white/5 border-white/10">
                      <CardHeader><CardTitle className="text-slate-200 text-sm flex items-center gap-2"><Target className="w-4 h-4"/> Total Points</CardTitle></CardHeader>
                      <CardContent className="h-[320px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={pointsData} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                            <XAxis dataKey="name" tick={{ fill: "#9ca3af" }} />
                            <YAxis tick={{ fill: "#9ca3af" }} />
                            <Tooltip contentStyle={{ background: "#0b1220", border: "1px solid #1f2937" }} />
                            <Legend />
                            <Bar dataKey="points" name="Points">
                              <LabelList dataKey="points" position="top" fill="#cbd5e1" />
                              {pointsData.map((e,i)=> (<Cell key={i} fill={e.color}/>))}
                            </Bar>
                          </BarChart>
                        </ResponsiveContainer>
                      </CardContent>
                    </Card>

                    {/* Outcomes Stacked */}
                    <Card className="bg-white/5 border-white/10">
                      <CardHeader><CardTitle className="text-slate-200 text-sm">Wins / Draws / Losses</CardTitle></CardHeader>
                      <CardContent className="h-[320px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={outcomesData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#1f2937"/>
                            <XAxis dataKey="name" tick={{ fill: "#9ca3af" }}/>
                            <YAxis tick={{ fill: "#9ca3af" }}/>
                            <Tooltip contentStyle={{ background: "#0b1220", border: "1px solid #1f2937" }}/>
                            <Legend/>
                            <Bar dataKey="Wins" stackId="a" fill="#22c55e"/>
                            <Bar dataKey="Draws" stackId="a" fill="#eab308"/>
                            <Bar dataKey="Losses" stackId="a" fill="#ef4444"/>
                          </BarChart>
                        </ResponsiveContainer>
                      </CardContent>
                    </Card>

                    {/* Radar Win % */}
                    <Card className="bg-white/5 border-white/10">
                      <CardHeader><CardTitle className="text-slate-200 text-sm">Win % Radar</CardTitle></CardHeader>
                      <CardContent className="h-[320px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <RadarChart data={winPctRadar} cx="50%" cy="50%" outerRadius="80%">
                            <PolarGrid stroke="#1f2937" />
                            <PolarAngleAxis dataKey="board" tick={{ fill: "#9ca3af" }} />
                            <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fill: "#9ca3af" }}/>
                            <Radar name="Win %" dataKey="WinPct" stroke="#22c55e" fill="#22c55e" fillOpacity={0.35} />
                          </RadarChart>
                        </ResponsiveContainer>
                      </CardContent>
                    </Card>

                    {/* Avg Run Margin */}
                    <Card className="bg-white/5 border-white/10">
                      <CardHeader><CardTitle className="text-slate-200 text-sm">Avg Run Margin</CardTitle></CardHeader>
                      <CardContent className="h-[320px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={marginData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#1f2937"/>
                            <XAxis dataKey="name" tick={{ fill: "#9ca3af" }}/>
                            <YAxis tick={{ fill: "#9ca3af" }}/>
                            <Tooltip contentStyle={{ background: "#0b1220", border: "1px solid #1f2937" }}/>
                            <Legend/>
                            <Bar dataKey="Avg Run Margin" fill="#38bdf8"/>
                          </BarChart>
                        </ResponsiveContainer>
                      </CardContent>
                    </Card>

                    {/* Per-Format Stack */}
                    <Card className="bg-white/5 border-white/10 lg:col-span-2">
                      <CardHeader><CardTitle className="text-slate-200 text-sm">Points by Format (stacked)</CardTitle></CardHeader>
                      <CardContent className="h-[340px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={formatPointsStack}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#1f2937"/>
                            <XAxis dataKey="name" tick={{ fill: "#9ca3af" }}/>
                            <YAxis tick={{ fill: "#9ca3af" }}/>
                            <Tooltip contentStyle={{ background: "#0b1220", border: "1px solid #1f2937" }}/>
                            <Legend/>
                            <Bar dataKey="ODI" stackId="fmt" fill="#22c55e"/>
                            <Bar dataKey="T20" stackId="fmt" fill="#3b82f6"/>
                            <Bar dataKey="TEST" stackId="fmt" fill="#a855f7"/>
                          </BarChart>
                        </ResponsiveContainer>
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>
              </Tabs>
            </div>

            {/* TIMELINE */}
            {timeline?.timeline?.length ? (
              <div className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Card className="bg-white/5 border-white/10 lg:col-span-2">
                  <CardHeader><CardTitle className="text-slate-200 text-sm flex items-center gap-2"><Crown className="w-4 h-4"/> Crown Timeline (Top board cumulative points)</CardTitle></CardHeader>
                  <CardContent className="h-[340px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={timeline.timeline} margin={{ top: 10, right: 16, left: 0, bottom: 0 }}>
                        <defs>
                          <linearGradient id="grad1" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#22c55e" stopOpacity={0.6}/>
                            <stop offset="95%" stopColor="#22c55e" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                        <XAxis dataKey="date" tick={{ fill: "#9ca3af" }}/>
                        <YAxis tick={{ fill: "#9ca3af" }}/>
                        <Tooltip contentStyle={{ background: "#0b1220", border: "1px solid #1f2937" }}/>
                        <Area type="monotone" dataKey="points" stroke="#22c55e" fillOpacity={1} fill="url(#grad1)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                <Card className="bg-white/5 border-white/10">
                  <CardHeader><CardTitle className="text-slate-200 text-sm flex items-center gap-2"><Info className="w-4 h-4"/> Timeline Stats</CardTitle></CardHeader>
                  <CardContent>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center justify-between"><span>Switches</span><span className="font-semibold">{Object.values(timeline.switches||{}).reduce((a,b)=>a+Number(b||0),0)}</span></div>
                      <div className="border-t border-white/10 pt-2">
                        <div className="text-xs text-slate-400 mb-1">By Board</div>
                        <ul className="space-y-1 max-h-40 overflow-auto pr-1">
                          {Object.entries(timeline.switches||{}).map(([bid,c])=>{
                            const name = summary?.data?.find(x=>String(x.board_id)===String(bid))?.board_name || `#${bid}`;
                            return <li key={bid} className="flex items-center justify-between"><span>{name}</span><span className="text-emerald-300">{c}</span></li>
                          })}
                        </ul>
                      </div>
                      <div className="border-t border-white/10 pt-2">
                        <div className="text-xs text-slate-400 mb-1">Days Held (Top)</div>
                        <ul className="space-y-1 max-h-40 overflow-auto pr-1">
                          {Object.entries(timeline.days_held||{}).map(([bid,c])=>{
                            const name = summary?.data?.find(x=>String(x.board_id)===String(bid))?.board_name || `#${bid}`;
                            return <li key={bid} className="flex items-center justify-between"><span>{name}</span><span className="text-indigo-300">{c}</span></li>
                          })}
                        </ul>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            ) : null}

            {/* TABLE */}
            <div className="mt-6">
              <Card className="bg-white/5 border-white/10">
                <CardHeader className="pb-0">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-slate-200 text-sm">Board Summary ({activeFmt})</CardTitle>
                    <Badge className="bg-white/10 border border-white/10 text-slate-300">{selected.length} selected</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="overflow-auto rounded-xl ring-1 ring-white/10">
                    <table className="min-w-full text-sm">
                      <thead className="bg-white/5 text-slate-300">
                        <tr>
                          <th className="text-left px-4 py-2">Board</th>
                          <th className="text-right px-4 py-2">Matches</th>
                          <th className="text-right px-4 py-2">Wins</th>
                          <th className="text-right px-4 py-2">Draws</th>
                          <th className="text-right px-4 py-2">Losses</th>
                          <th className="text-right px-4 py-2">Win %</th>
                          <th className="text-right px-4 py-2">Points</th>
                        </tr>
                      </thead>
                      <tbody>
                        {tableRows.map((r, idx)=> (
                          <tr key={r.id} className="odd:bg-white/0 even:bg-white/5">
                            <td className="px-4 py-2"><div className="flex items-center gap-2"><span className="inline-block w-2.5 h-2.5 rounded-full" style={{ background: colorMap.get(r.id) }}/>{r.name}</div></td>
                            <td className="px-4 py-2 text-right">{nf(r.matches)}</td>
                            <td className="px-4 py-2 text-right text-emerald-300">{nf(r.wins)}</td>
                            <td className="px-4 py-2 text-right text-yellow-300">{nf(r.draws)}</td>
                            <td className="px-4 py-2 text-right text-rose-300">{nf(r.losses)}</td>
                            <td className="px-4 py-2 text-right">{safePct(r.win_pct)}</td>
                            <td className="px-4 py-2 text-right font-semibold">{nf(r.points)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </div>
          </>
        ) : (
          <div className="mt-16 flex flex-col items-center justify-center text-slate-400 gap-4">
            <Crown className="w-10 h-10 text-slate-600"/>
            <div className="text-center">
              <div className="text-lg font-semibold">Select boards and a date range, then hit <span className="text-emerald-300">Analyze</span>.</div>
              <div className="text-sm">We’ll fetch points, outcomes, win%, run margins, and a live crown timeline.</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
