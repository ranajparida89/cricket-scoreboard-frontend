import React, { useEffect, useMemo, useRef, useState } from "react";
import "./H2HRecords.css";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, Legend, CartesianGrid,
  ResponsiveContainer, PieChart, Pie, Cell, LabelList, ReferenceLine,
  ComposedChart, Area, Line, Brush,
} from "recharts";
import { FaInfoCircle, FaTrophy } from "react-icons/fa";

const TOP_N = 5;
const API =
  process.env.REACT_APP_API_BASE ||
  "https://cricket-scoreboard-backend.onrender.com";

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

const arr = (v) => (Array.isArray(v) ? v : []);
const obj = (v) => (v && typeof v === "object" ? v : null);
const fmtNum = (n) => (n == null ? "0" : Number(n).toLocaleString());

/* --------- soft gradients (same style, different hues) --------- */
const THEME_GRADS = {
  gold:   [["0%","#fff2c6"],["50%","#e8caa4"],["100%","#cda56e"]],
  orange: [["0%","#ffe8c7"],["50%","#ffd58a"],["100%","#ffbf69"]],
  green:  [["0%","#d1fae5"],["50%","#86efac"],["100%","#4ade80"]],
  blue:   [["0%","#c7e3ff"],["50%","#93c5fd"],["100%","#60a5fa"]],
  purple: [["0%","#e9d5ff"],["50%","#c4b5fd"],["100%","#a78bfa"]],
  pink:   [["0%","#ffd1dc"],["50%","#f9a8d4"],["100%","#f472b6"]],
  slate:  [["0%","#e5edf9"],["50%","#cbd5e1"],["100%","#94a3b8"]],
};
const THEME_SOLIDS = {
  gold:"#d9b98b", orange:"#f6ad55", green:"#34d399", blue:"#60a5fa",
  purple:"#a78bfa", pink:"#f472b6", slate:"#94a3b8"
};

function GradientDefs({ id, theme = "gold" }) {
  const stops = THEME_GRADS[theme] || THEME_GRADS.gold;
  return (
    <defs>
      <linearGradient id={id} x1="0" y1="0" x2="1" y2="0">
        {stops.map(([off, color], i) => (
          <stop key={i} offset={off} stopColor={color} />
        ))}
      </linearGradient>
    </defs>
  );
}

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

  // present but not used for now—kept because API calls set them
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

  // --- Team total runs (season-wise) filters + data
  const [runsTeam, setRunsTeam] = useState("");
  const [runsType, setRunsType] = useState("ALL");
  const [runsTournament, setRunsTournament] = useState("ALL");
  const [runsYear, setRunsYear] = useState("ALL");
  const [runsMetaTournaments, setRunsMetaTournaments] = useState(["ALL"]);
  const [runsMetaYears, setRunsMetaYears] = useState(["ALL"]);
  const [teamSeasonRuns, setTeamSeasonRuns] = useState(null);

  // NEW: totals for ALL teams under the same filters
  const [allTeamsTotals, setAllTeamsTotals] = useState({ loading: false, rows: [] });

  // PDF
  const exportRef = useRef(null);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    fetchJSON(`${API}/api/h2h/teams`, []).then((d) => setTeams(arr(d)));
    fetchJSON(`${API}/api/players/list`, []).then((d) => setPlayers(arr(d)));
    fetchJSON(`${API}/api/h2h/meta/tournaments?type=${lbType}`, []).then((d) =>
      setTournaments(["ALL", ...arr(d)]));
    fetchJSON(`${API}/api/h2h/meta/years?type=${lbType}`, []).then((d) =>
      setYears(["ALL", ...arr(d)]));

    // initialize Runs meta with ALL
    fetchJSON(`${API}/api/h2h/meta/tournaments?type=ALL`, []).then((d) =>
      setRunsMetaTournaments(["ALL", ...arr(d)]));
    fetchJSON(`${API}/api/h2h/meta/years?type=ALL`, []).then((d) =>
      setRunsMetaYears(["ALL", ...arr(d)]));
  }, []);

  // Update meta for leaderboard filters
  useEffect(() => {
    setLbTournament("ALL");
    setLbYear("ALL");
    fetchJSON(`${API}/api/h2h/meta/tournaments?type=${lbType}`, []).then((d) =>
      setTournaments(["ALL", ...arr(d)]));
    fetchJSON(`${API}/api/h2h/meta/years?type=${lbType}`, []).then((d) =>
      setYears(["ALL", ...arr(d)]));
  }, [lbType]);

  // Update meta for Runs module
  useEffect(() => {
    setRunsTournament("ALL");
    setRunsYear("ALL");
    fetchJSON(`${API}/api/h2h/meta/tournaments?type=${runsType}`, []).then((d) =>
      setRunsMetaTournaments(["ALL", ...arr(d)]));
    fetchJSON(`${API}/api/h2h/meta/years?type=${runsType}`, []).then((d) =>
      setRunsMetaYears(["ALL", ...arr(d)]));
  }, [runsType]);

  // Load leaderboards
  useEffect(() => {
    const qs = new URLSearchParams({
      type: lbType,
      tournament: lbTournament || "ALL",
      year: lbYear === "ALL" ? "" : String(lbYear || ""),
      team: lbTeam || "ALL",
      limit: String(TOP_N),
    }).toString();
    fetchJSON(`${API}/api/h2h/players/highlights?${qs}`, null).then(setLeaderboards);
  }, [lbType, lbTournament, lbYear, lbTeam]);

  // ---------- H2H summary ----------
  useEffect(() => {
    if (team1 && team2 && team1.toLowerCase() === team2.toLowerCase()) {
      setTeamError("⚠️ Please select two different teams."); return;
    }
    setTeamError("");
    if (!team1 || !team2) return;

    const t1 = encodeURIComponent(team1);
    const t2 = encodeURIComponent(team2);

    fetchJSON(`${API}/api/h2h/summary?team1=${t1}&team2=${t2}&type=${matchType}`, null).then(setSummary);
    fetchJSON(`${API}/api/h2h/by-format?team1=${t1}&team2=${t2}`, []).then((d) => setByFormat(arr(d)));
    fetchJSON(`${API}/api/h2h/points?team1=${t1}&team2=${t2}&type=${matchType}`, null).then(setPoints);

    fetchJSON(`${API}/api/h2h/runs-by-format?team1=${t1}&team2=${t2}&type=${matchType}`, [])
      .then((d) => setRunsByFormat(arr(d)));

    if (matchType === "TEST" || matchType === "ALL") {
      fetchJSON(`${API}/api/h2h/test-innings-lead?team1=${t1}&team2=${t2}`, null).then(setTestLead);
      fetchJSON(`${API}/api/h2h/test-innings-averages?team1=${t1}&team2=${t2}`, [])
        .then((d) => setTestAvg(arr(d)));
    } else { setTestLead(null); setTestAvg([]); }

    fetchJSON(`${API}/api/h2h/top-batters?team1=${t1}&team2=${t2}&type=${matchType}`, [])
      .then((d) => setTopBatters(arr(d)));
    fetchJSON(`${API}/api/h2h/top-bowlers?team1=${t1}&team2=${t2}&type=${matchType}`, [])
      .then((d) => setTopBowlers(arr(d)));
    fetchJSON(`${API}/api/h2h/recent?team1=${t1}&team2=${t2}&type=${matchType}&limit=10`, [])
      .then((d) => setRecent(arr(d)));
  }, [team1, team2, matchType]);

  // ---------- Player compare ----------
  useEffect(() => {
    if (player1 && player2 && player1.toLowerCase() === player2.toLowerCase()) {
      setPlayerError("⚠️ Please select two different players."); return;
    }
    setPlayerError("");
    if (player1 && player2 && player1 !== player2) {
      const p1 = encodeURIComponent(player1);
      const p2 = encodeURIComponent(player2);
      fetchJSON(`${API}/api/players/compare?player1=${p1}&player2=${p2}`, null).then((d) =>
        setPlayerStats(obj(d?.players) ? d.players : null));
    }
  }, [player1, player2]);

  // ---------- Team total runs (single team, season series) ----------
  useEffect(() => {
    if (!runsTeam) { setTeamSeasonRuns(null); return; }
    const qs = new URLSearchParams({
      team: runsTeam,
      type: runsType,
      tournament: runsTournament || "ALL",
      season: runsYear === "ALL" ? "" : String(runsYear || ""),
    }).toString();
    fetchJSON(`${API}/api/h2h/team-total-runs?${qs}`, null).then(setTeamSeasonRuns);
  }, [runsTeam, runsType, runsTournament, runsYear]);

  // ---------- NEW: Total runs for ALL teams under the current filters ----------
  useEffect(() => {
    if (!teams.length) { setAllTeamsTotals({ loading: false, rows: [] }); return; }

    let cancelled = false;
    const load = async () => {
      setAllTeamsTotals((s) => ({ ...s, loading: true }));
      const qsBase = (team) =>
        new URLSearchParams({
          team,
          type: runsType,
          tournament: runsTournament || "ALL",
          season: runsYear === "ALL" ? "" : String(runsYear || ""),
        }).toString();

      // Fetch all teams in parallel and reduce to totals
      const promises = teams.map(async (t) => {
        const data = await fetchJSON(`${API}/api/h2h/team-total-runs?${qsBase(t)}`, null);
        const total = arr(data?.series).reduce((sum, r) => sum + (Number(r?.runs) || 0), 0);
        return { team: t, runs: total };
      });

      const rows = (await Promise.all(promises))
        .filter((r) => r && (r.runs || r.runs === 0))
        .sort((a, b) => b.runs - a.runs);

      if (!cancelled) setAllTeamsTotals({ loading: false, rows });
    };

    load();
    return () => { cancelled = true; };
  }, [teams, runsType, runsTournament, runsYear]);

  // ---------- Derived ----------
  const teamBarData = useMemo(() => {
    if (!summary || !team1 || !team2) return [];
    const t1w = Number(summary[team1] || 0),
          t2w = Number(summary[team2] || 0),
          draws = Number(summary.draws || 0);
    const t1l = t2w, t2l = t1w;
    return [
      { metric: "Wins",   [team1]: t1w, [team2]: t2w },
      { metric: "Losses", [team1]: t1l, [team2]: t2l },
      { metric: "Draws",  [team1]: draws, [team2]: draws },
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
    return rows.map((r) => ({ metric: r.metric, [player1]: -r.a, [player2]: r.b }));
  }, [playerStats, player1, player2]);

  const formatChart = arr(byFormat).map((row) => ({
    format: row.match_type,
    [team1]: Number(row.t1_wins || 0),
    [team2]: Number(row.t2_wins || 0),
    Draws: Number(row.draws || 0),
  }));

  const runsFormatChartRaw = arr(runsByFormat).map((r) => ({
    format: r.match_type,
    [team1]: Number(r[team1] || 0),
    [team2]: Number(r[team2] || 0),
  }));

  const runsFormatChart = useMemo(() => {
    if (matchType === "ALL") return runsFormatChartRaw;
    return runsFormatChartRaw.filter((x) => String(x.format).toUpperCase() === matchType);
  }, [runsFormatChartRaw, matchType]);

  // Season-wise series for the selected runsTeam
  const seasonSeries = useMemo(() => {
    const s = arr(teamSeasonRuns?.series)
      .map((x) => ({ season_year: Number(x.season_year), runs: Number(x.runs || 0) }))
      .sort((a, b) => a.season_year - b.season_year);
    return s;
  }, [teamSeasonRuns]);

  const seasonStats = useMemo(() => {
    const s = seasonSeries;
    if (!s.length) return { min: 0, max: 0, avg: 0, total: 0 };
    const vals = s.map((d) => d.runs);
    const total = vals.reduce((a, b) => a + b, 0);
    const min = Math.min(...vals);
    const max = Math.max(...vals);
    const avg = Math.round(total / s.length);
    return { min, max, avg, total };
  }, [seasonSeries]);

  const tooltipProps = {
    cursor: false,
    contentStyle: { background: "#0b1420", border: "1px solid #2a3f60" },
    itemStyle: { color: COLORS.ink },
    labelStyle: { color: COLORS.ink },
  };

  /** ---------- Generic HBar with solid fallback + gradient overlay ---------- */
  const HBar = ({ title, rows, dataKey = "value", theme = "gold" }) => {
    const clean = arr(rows)
      .filter((r) => r && r.player_name && r[dataKey] != null && r[dataKey] !== 0)
      .slice(0, TOP_N);

    const top = clean[0];
    const gradId = `grad-${theme}-${title.replace(/[^\w]/g, "")}`;

    return (
      <div className="chart-card card-glow">
        <div className="chart-title">{title}</div>

        {top && (
          <div className="congrats-ribbon">
            <FaTrophy className="trophy" />
            <span>
              Congrats <b>{top.player_name}</b>
              {top.team_name ? ` (${top.team_name})` : ""}! — <i>{title}</i>{" "}
              <b>{top[dataKey]}</b>
            </span>
          </div>
        )}

        <ResponsiveContainer width="100%" height={clean.length ? Math.max(220, clean.length * 40) : 220}>
          <BarChart data={clean} layout="vertical" margin={{ top: 8, right: 120, left: 32, bottom: 8 }}>
            <GradientDefs id={gradId} theme={theme} />
            <CartesianGrid horizontal={false} stroke={COLORS.grid} strokeDasharray="3 3" />
            <XAxis type="number" tick={{ fill: "#93a4c3", fontSize: 12 }} domain={[0, "dataMax"]} />
            <YAxis type="category" dataKey="player_name" tick={{ fill: "#e7efff", fontSize: 12 }} width={190} />
            <Tooltip
              {...tooltipProps}
              formatter={(v, _k, p) => [
                v,
                p?.payload?.team_name
                  ? `${p.payload.player_name} (${p.payload.team_name})`
                  : p?.payload?.player_name,
              ]}
            />
            <Bar
              dataKey={dataKey}
              fill={THEME_SOLIDS[theme] || THEME_SOLIDS.blue}
              barSize={20}
              radius={[10, 10, 10, 10]}
              isAnimationActive={false}
            />
            <Bar
              dataKey={dataKey}
              fill={`url(#${gradId})`}
              barSize={20}
              radius={[10, 10, 10, 10]}
              isAnimationActive={false}
            >
              <LabelList dataKey={dataKey} position="right" fill={COLORS.ink} fontSize={12} />
            </Bar>
          </BarChart>
        </ResponsiveContainer>

        {!clean.length && <div className="tr empty" style={{ padding: 12 }}>No data</div>}
      </div>
    );
  };

  /* ========= Most 5-Wicket Hauls ========= */
  const FiveWLabel = ({ x, y, width, height, value, payload }) => {
    if (value == null) return null;
    const tx = x + width + 8;
    const ty = y + height / 2 + 4;
    const best =
      payload?.best_wickets != null
        ? ` · Best ${payload.best_wickets}${payload.best_vs_team ? ` vs ${payload.best_vs_team}` : ""}`
        : "";
    const unit = value === 1 ? "haul" : "hauls";
    return (
      <text x={tx} y={ty} fontSize={12} fill={COLORS.ink}>
        {value} {unit}{best}
      </text>
    );
  };

  const HBarFiveW = ({ rows }) => {
    const clean = arr(rows)
      .filter((r) => r && r.player_name && r.fivewh_count != null && r.fivewh_count !== 0)
      .slice(0, TOP_N);

    const top = clean[0];

    return (
      <div className="chart-card card-glow">
        <div className="chart-title">Most 5-Wicket Hauls</div>

        {top && (
          <div className="congrats-ribbon">
            <FaTrophy className="trophy" />
            <span>
              <b>{top.player_name}</b>
              {top.team_name ? ` (${top.team_name})` : ""} — {top.fivewh_count}{" "}
              {top.fivewh_count === 1 ? "haul" : "hauls"}
              {top.best_wickets ? <> · Best <b>{top.best_wickets}</b>{top.best_vs_team ? <> vs <b>{top.best_vs_team}</b></> : null}</> : null}
            </span>
          </div>
        )}

        <ResponsiveContainer width="100%" height={clean.length ? Math.max(240, clean.length * 44) : 240}>
          <BarChart data={clean} layout="vertical" margin={{ top: 8, right: 180, left: 32, bottom: 8 }}>
            <defs>
              <linearGradient id="grad-5w" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#4de2ff" />
                <stop offset="50%" stopColor="#e8caa4" />
                <stop offset="100%" stopColor="#ffdd87" />
              </linearGradient>
            </defs>
            <CartesianGrid horizontal={false} stroke={COLORS.grid} strokeDasharray="3 3" />
            <XAxis type="number" tick={{ fill: "#93a4c3", fontSize: 12 }} domain={[0, "dataMax"]} />
            <YAxis type="category" dataKey="player_name" tick={{ fill: "#e7efff", fontSize: 12 }} width={200} />
            <Tooltip
              {...tooltipProps}
              formatter={(v, _k, p) => {
                const r = p?.payload || {};
                const best = r.best_wickets != null ? `Best ${r.best_wickets}${r.best_vs_team ? ` vs ${r.best_vs_team}` : ""}` : "";
                return [`${v} ${v === 1 ? "haul" : "hauls"}${best ? ` • ${best}` : ""}`, r.team_name ? `${r.player_name} (${r.team_name})` : r.player_name];
              }}
            />
            <Bar
              dataKey="fivewh_count"
              fill="url(#grad-5w)"
              barSize={22}
              radius={[10, 10, 10, 10]}
              isAnimationActive={false}
            >
              <LabelList content={(props) => <FiveWLabel {...props} />} />
            </Bar>
          </BarChart>
        </ResponsiveContainer>

        {!clean.length && <div className="tr empty" style={{ padding: 12 }}>No data</div>}
      </div>
    );
  };

  /** ---------- MVP (All-rounder) ---------- */
  const mvp = useMemo(() => {
    const L = leaderboards?.leaders;
    if (!L) return null;

    const max = {
      runs: Math.max(1, ...arr(L.most_runs).map((x) => Number(x.total_runs) || 0)),
      wkts: Math.max(1, ...arr(L.highest_wickets).map((x) => Number(x.total_wickets) || 0)),
      batting_avg: Math.max(1, ...arr(L.best_batting_avg).map((x) => Number(x.batting_avg) || 0)),
      strike_rate: Math.max(1, ...arr(L.best_strike_rate).map((x) => Number(x.strike_rate) || 0)),
      success: Math.max(1, ...arr(L.most_successful).map((x) => Number(x.success_matches) || 0)),
    };

    const scores = {};
    const add = (name, team, type, val, m) => {
      if (!name) return;
      scores[name] ??= { player_name: name, team_name: team || "", score: 0, parts: {} };
      const weight = { runs: 0.35, wkts: 0.35, batting_avg: 0.12, strike_rate: 0.08, success: 0.10 }[type] || 0;
      const norm = (Number(val) || 0) / (m || 1);
      scores[name].score += weight * norm;
      scores[name].parts[type] = norm;
    };

    arr(L.most_runs).forEach((x) => add(x.player_name, x.team_name, "runs", x.total_runs, max.runs));
    arr(L.highest_wickets).forEach((x) => add(x.player_name, x.team_name, "wkts", x.total_wickets, max.wkts));
    arr(L.best_batting_avg).forEach((x) => add(x.player_name, x.team_name, "batting_avg", x.batting_avg, max.batting_avg));
    arr(L.best_strike_rate).forEach((x) => add(x.player_name, x.team_name, "strike_rate", x.strike_rate, max.strike_rate));
    arr(L.most_successful).forEach((x) => add(x.player_name, x.team_name, "success", x.success_matches, max.success));

    const best = Object.values(scores).sort((a, b) => b.score - a.score)[0];
    return best || null;
  }, [leaderboards]);

  /** ---------- PDF ---------- */
  const loadScript = (src) =>
    new Promise((resolve, reject) => {
      const s = document.createElement("script");
      s.src = src;
      s.async = true;
      s.onload = resolve;
      s.onerror = reject;
      document.body.appendChild(s);
    });

  const getPdfDeps = async () => {
    try {
      const [h2c, jspdf] = await Promise.all([import("html2canvas"), import("jspdf")]);
      return {
        html2canvas: h2c.default || h2c,
        jsPDF: (jspdf.jsPDF ? jspdf.jsPDF : jspdf.default?.jsPDF),
      };
    } catch {
      await loadScript("https://cdn.jsdelivr.net/npm/html2canvas@1.4.1/dist/html2canvas.min.js");
      await loadScript("https://cdn.jsdelivr.net/npm/jspdf@2.5.1/dist/jspdf.umd.min.js");
      const jsPDF = window.jspdf?.jsPDF || window.jsPDF;
      const html2canvas = window.html2canvas;
      if (!html2canvas || !jsPDF) throw new Error("PDF libs not available");
      return { html2canvas, jsPDF };
    }
  };

  const handleDownloadPDF = async () => {
    if (!exportRef.current) return;
    try {
      setExporting(true);
      const { html2canvas, jsPDF } = await getPdfDeps();

      const canvas = await html2canvas(exportRef.current, {
        backgroundColor: "#0b111a",
        scale: 1.35,
        useCORS: true,
        windowWidth: document.documentElement.scrollWidth,
      });

      const imgData = canvas.toDataURL("image/jpeg", 0.82);

      const pdf = new jsPDF("p", "mm", "a4");
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 8;
      const imgWidth = pageWidth - margin * 2;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      let heightLeft = imgHeight;
      let position = margin;

      pdf.setFontSize(12);
      pdf.text("VS Head-to-Head Records", margin, 7);

      pdf.addImage(imgData, "JPEG", margin, position, imgWidth, imgHeight);
      heightLeft -= (pageHeight - margin);

      while (heightLeft > 0) {
        pdf.addPage();
        pdf.text("VS Head-to-Head Records", margin, 7);
        position = heightLeft * -1 + margin;
        pdf.addImage(imgData, "JPEG", margin, position, imgWidth, imgHeight);
        heightLeft -= (pageHeight - margin);
      }

      pdf.save("H2H-Records.pdf");
    } catch (e) {
      console.error("PDF export failed:", e);
      alert("Failed to export PDF. Please try again.");
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="h2h-wrap">
      {/* Top bar with actions (not inside exportRef) */}
      <div className="h2h-topbar">
        <h2 className="h2h-title">VS Head-to-Head Records</h2>
        <div style={{ display: "flex", gap: 8 }}>
          <button className="btn" onClick={handleDownloadPDF} title="Download full report (PDF)">
            {exporting ? "Exporting…" : "Download PDF"}
          </button>
          <button className="info-fab subtle" onClick={() => setShowInfo(true)} title="About">
            <FaInfoCircle />
          </button>
        </div>
      </div>

      {/* EVERYTHING below is included in the PDF */}
      <div ref={exportRef}>
        {/* Selectors */}
        <div className="h2h-row h2h-selects">
          <select value={team1} onChange={(e) => setTeam1(e.target.value)} className="sel">
            <option value="">Select Team 1</option>
            {teams.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
          <select value={team2} onChange={(e) => setTeam2(e.target.value)} className="sel">
            <option value="">Select Team 2</option>
            {teams.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
          <select value={matchType} onChange={(e) => setMatchType(e.target.value)} className="sel sel-type">
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
                <span className="sum-type">
                  Format: {matchType === "ALL" ? "All Formats" : (matchType === "TEST" ? "Test" : matchType)}
                </span>
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

            {/* ======================== Team Total Runs (Season-wise) ======================== */}
            <div className="player-sec">
              <h3 className="h3" style={{ marginBottom: 6 }}>Team Total Runs (Season-wise)</h3>

              <div className="h2h-row h2h-selects" style={{ marginTop: 8 }}>
                <select value={runsTeam} onChange={(e) => setRunsTeam(e.target.value)} className="sel">
                  <option value="">Select Team</option>
                  {teams.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>

                <select value={runsType} onChange={(e) => setRunsType(e.target.value)} className="sel">
                  <option value="ALL">All</option><option value="ODI">ODI</option>
                  <option value="T20">T20</option><option value="TEST">Test</option>
                </select>

                <select value={runsTournament} onChange={(e) => setRunsTournament(e.target.value)} className="sel">
                  {arr(runsMetaTournaments).map((t) => <option key={t} value={t}>{t}</option>)}
                </select>

                <select value={runsYear} onChange={(e) => setRunsYear(e.target.value)} className="sel">
                  {arr(runsMetaYears).map((y) => <option key={y} value={y}>{y}</option>)}
                </select>
              </div>

              <div className="charts-grid">
                <div className="chart-card card-glow">
                  <div className="chart-title">
                    {runsTeam ? `${runsTeam} — Season Totals (${runsType === "ALL" ? "All Formats" : runsType})` : "Select a team to view chart"}
                  </div>

                  {/* KPI row: unified golden glow on all boxes */}
                  {runsTeam && (
                    <div className="points-row kpi-gold-row" style={{ marginBottom: 6 }}>
                      <div className="points-box">
                        <div className="label">Total Runs</div>
                        <div className="value">{fmtNum(seasonStats.total)}</div>
                      </div>
                      <div className="points-box">
                        <div className="label">Avg / Season</div>
                        <div className="value">{fmtNum(seasonStats.avg)}</div>
                      </div>
                      <div className="points-box">
                        <div className="label">Min</div>
                        <div className="value">{fmtNum(seasonStats.min)}</div>
                      </div>
                      <div className="points-box">
                        <div className="label">Max</div>
                        <div className="value">{fmtNum(seasonStats.max)}</div>
                      </div>
                    </div>
                  )}

                  <ResponsiveContainer width="100%" height={380}>
                    <ComposedChart
                      data={seasonSeries}
                      margin={{ top: 16, right: 28, left: 10, bottom: 8 }}
                    >
                      <defs>
                        <linearGradient id="runsAreaFill" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#60a5fa" stopOpacity={0.35} />
                          <stop offset="95%" stopColor="#0b111a" stopOpacity={0.0} />
                        </linearGradient>
                        <linearGradient id="runsLineStroke" x1="0" y1="0" x2="1" y2="0">
                          <stop offset="0%" stopColor="#22d3ee" />
                          <stop offset="50%" stopColor="#e8caa4" />
                          <stop offset="100%" stopColor="#f87171" />
                        </linearGradient>
                      </defs>

                      <CartesianGrid stroke={COLORS.grid} strokeDasharray="3 3" />
                      <XAxis
                        dataKey="season_year"
                        tick={{ fill: "#93a4c3", fontSize: 12 }}
                        label={{ value: "Season", position: "insideBottom", offset: -2, fill: "#9fb3d6", fontSize: 12 }}
                        allowDuplicatedCategory={false}
                      />
                      <YAxis
                        tick={{ fill: "#93a4c3", fontSize: 12 }}
                        label={{ value: "Runs", angle: -90, position: "insideLeft", fill: "#9fb3d6", fontSize: 12 }}
                        allowDecimals={false}
                      />
                      <Tooltip
                        {...tooltipProps}
                        formatter={(v) => [fmtNum(v), "Runs"]}
                        labelFormatter={(v) => `Season ${v}`}
                      />

                      <Area type="monotone" dataKey="runs" stroke="none" fill="url(#runsAreaFill)" isAnimationActive={false} />

                      <Line
                        type="monotone"
                        dataKey="runs"
                        stroke="url(#runsLineStroke)"
                        strokeWidth={3}
                        dot={{ r: 3, fill: "#eaf2ff" }}
                        activeDot={{ r: 5 }}
                        isAnimationActive={false}
                      >
                        <LabelList dataKey="runs" position="top" formatter={(v) => fmtNum(v)} fill={COLORS.ink} fontSize={12} />
                      </Line>

                      {seasonSeries.length > 0 && (
                        <>
                          <ReferenceLine y={seasonStats.min} stroke="#22d3ee" strokeDasharray="3 3"
                            label={{ value: `Min ${fmtNum(seasonStats.min)}`, position: "left", fill: "#a7f3d0", fontSize: 11 }} />
                          <ReferenceLine y={seasonStats.avg} stroke="#e8caa4" strokeDasharray="4 4"
                            label={{ value: `Avg ${fmtNum(seasonStats.avg)}`, position: "left", fill: "#ffe6b3", fontSize: 11 }} />
                          <ReferenceLine y={seasonStats.max} stroke="#f87171" strokeDasharray="3 3"
                            label={{ value: `Max ${fmtNum(seasonStats.max)}`, position: "left", fill: "#fecaca", fontSize: 11 }} />
                        </>
                      )}

                      {seasonSeries.length > 6 && (
                        <Brush dataKey="season_year" travellerWidth={10} height={26} stroke="#e8caa4" />
                      )}
                    </ComposedChart>
                  </ResponsiveContainer>

                  {!runsTeam && <div className="tr empty" style={{ padding: 12 }}>Select a team to load data</div>}
                  {runsTeam && seasonSeries.length === 0 && <div className="tr empty" style={{ padding: 12 }}>No data for selected filters</div>}
                </div>
              </div>

              {/* NEW: All teams totals (filtered) */}
              <div className="charts-grid">
                <div className="chart-card card-glow">
                  <div className="chart-title">
                    Total Runs by Team {runsType !== "ALL" ? `— ${runsType}` : "(All Formats)"}{runsTournament && runsTournament !== "ALL" ? ` • ${runsTournament}` : ""}{runsYear && runsYear !== "ALL" ? ` • ${runsYear}` : ""}
                  </div>

                  {allTeamsTotals.loading && <div className="tr" style={{ padding: 12, opacity: .8 }}>Loading teams…</div>}

                  {!allTeamsTotals.loading && (
                    <ResponsiveContainer width="100%" height={Math.max(360, allTeamsTotals.rows.length * 26)}>
                      <BarChart
                        data={allTeamsTotals.rows}
                        layout="vertical"
                        margin={{ top: 8, right: 24, left: 24, bottom: 8 }}
                      >
                        <defs>
                          <linearGradient id="grad-all-teams" x1="0" y1="0" x2="1" y2="0">
                            <stop offset="0%" stopColor="#fff2c6" />
                            <stop offset="50%" stopColor="#e8caa4" />
                            <stop offset="100%" stopColor="#cda56e" />
                          </linearGradient>
                        </defs>

                        <CartesianGrid horizontal={false} stroke={COLORS.grid} strokeDasharray="3 3" />
                        <XAxis type="number" tick={{ fill: "#93a4c3", fontSize: 12 }} domain={[0, "dataMax"]} />
                        <YAxis type="category" dataKey="team" tick={{ fill: "#e7efff", fontSize: 12 }} width={200} />
                        <Tooltip
                          {...tooltipProps}
                          formatter={(v, _k, p) => [fmtNum(v), p?.payload?.team]}
                        />
                        <Bar dataKey="runs" fill="url(#grad-all-teams)" barSize={18} radius={[10, 10, 10, 10]} isAnimationActive={false}>
                          <LabelList dataKey="runs" position="right" formatter={(v) => fmtNum(v)} fill={COLORS.ink} fontSize={12} />
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  )}

                  {!allTeamsTotals.loading && allTeamsTotals.rows.length === 0 && (
                    <div className="tr empty" style={{ padding: 12 }}>No team totals for the selected filters</div>
                  )}
                </div>
              </div>
            </div>
            {/* ====================== END NEW MODULE ====================== */}

            {/* Best Players */}
            <div className="player-sec">
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <h3 className="h3" style={{ marginBottom: 0 }}>Best Players (by filters)</h3>
                {mvp && (
                  <div className="card-glow"
                    style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 14px",
                      borderRadius: 12, border: "1px solid rgba(255,215,106,.45)",
                      background: "linear-gradient(160deg, rgba(255,209,112,.18), rgba(255,240,200,.06))" }}
                    title="Most Valuable Player (all-round impact across batting/bowling)">
                    <div style={{ background: "conic-gradient(from 0deg, #ffd76a, #fff2c6, #ffd76a 70%)",
                      width: 42, height: 42, borderRadius: "999px", display: "grid", placeItems: "center",
                      color: "#1a1306", fontWeight: 900, boxShadow: "0 0 16px rgba(255,215,106,.35)" }}>
                      MVP
                    </div>
                    <div style={{ lineHeight: 1.2 }}>
                      <div style={{ fontWeight: 900, color: "#ffe6b3" }}>
                        {mvp.player_name}{mvp.team_name ? ` (${mvp.team_name})` : ""}
                      </div>
                      <div style={{ fontSize: 12, color: "#f5e9c9" }}>
                        All-round impact score {Math.round(mvp.score * 100)}/100
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="h2h-row h2h-selects" style={{ marginTop: 12 }}>
                <select value={lbType} onChange={(e) => setLbType(e.target.value)} className="sel">
                  <option value="ALL">All</option><option value="ODI">ODI</option>
                  <option value="T20">T20</option><option value="TEST">Test</option>
                </select>
                <select value={lbTournament} onChange={(e) => setLbTournament(e.target.value)} className="sel">
                  {arr(tournaments).map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
                <select value={lbYear} onChange={(e) => setLbYear(e.target.value)} className="sel">
                  {arr(years).map((y) => <option key={y} value={y}>{y}</option>)}
                </select>
                <select value={lbTeam} onChange={(e) => setLbTeam(e.target.value)} className="sel">
                  <option value="ALL">All Teams</option>
                  {teams.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>

              <div className="charts-grid two">
                <HBarFiveW rows={arr(leaderboards?.leaders?.most_five_wicket_hauls)} />
                <HBar title="Best Run Scored" rows={arr(leaderboards?.leaders?.most_runs)} dataKey="total_runs" theme="orange" />
                <HBar title="Highest Wicket Taker" rows={arr(leaderboards?.leaders?.highest_wickets)} dataKey="total_wickets" theme="green" />
                <HBar title="Best Batting Average" rows={arr(leaderboards?.leaders?.best_batting_avg)} dataKey="batting_avg" theme="blue" />
                <HBar title="Best Strike Rate" rows={arr(leaderboards?.leaders?.best_strike_rate)} dataKey="strike_rate" theme="purple" />
                <HBar title="Most Centuries" rows={arr(leaderboards?.leaders?.most_centuries)} dataKey="total_hundreds" theme="pink" />
                <HBar title="Most Half-Centuries" rows={arr(leaderboards?.leaders?.most_fifties)} dataKey="total_fifties" theme="slate" />
                <HBar title="Most Successful (25+ runs and 2+ wkts in a match)" rows={arr(leaderboards?.leaders?.most_successful)} dataKey="success_matches" theme="gold" />
              </div>
            </div>

            {/* Player Comparison */}
            <div className="player-sec">
              <h3 className="h3">Player Comparison</h3>
              <div className="h2h-row h2h-selects">
                <select value={player1} onChange={(e) => setPlayer1(e.target.value)} className="sel">
                  <option value="">Select Player 1</option>
                  {players.map((p) => <option key={p} value={p}>{p}</option>)}
                </select>
                <select value={player2} onChange={(e) => setPlayer2(e.target.value)} className="sel">
                  <option value="">Select Player 2</option>
                  {players.map((p) => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
              {playerError && <div className="alert warn">{playerError}</div>}

              {playerStats && playerStats[player1] && playerStats[player2] && !playerError && (
                <div className="player-card">
                  <div className="legend-row">
                    <div className="legend-chip" style={{ background: COLORS.t1 }} /><span>{player1}</span>
                    <div className="legend-chip" style={{ background: COLORS.t2 }} /><span>{player2}</span>
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
                        <Bar dataKey={player1} fill={COLORS.t1} barSize={18} radius={[0,6,6,0]} isAnimationActive={false}>
                          <LabelList content={(props) => <MirrorLabel {...props} />} />
                        </Bar>
                        <Bar dataKey={player2} fill={COLORS.t2} barSize={18} radius={[0,6,6,0]} isAnimationActive={false}>
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
      </div>

      {showInfo && (
        <div className="modal" onClick={() => setShowInfo(false)}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="modal-head">About Head-to-Head</div>
            <ul className="modal-list">
              <li>Points: Test 12/6/4, ODI/T20 2/0/1.</li>
              <li>Wins &amp; runs by format, first-innings lead, Test innings averages.</li>
              <li>Leaderboards, recent results.</li>
              <li>Best Players: global leaderboards with filters.</li>
              <li>5-wicket haul leaderboard, MVP badge &amp; full-page PDF export.</li>
              <li><b>NEW:</b> Team Total Runs timeline + all-teams totals with filters.</li>
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
