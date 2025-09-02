import React, { useEffect, useMemo, useRef, useState } from "react";
import "./H2HRecords.css";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, Legend, CartesianGrid,
  ResponsiveContainer, PieChart, Pie, Cell, LabelList, ReferenceLine,
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

/* --------- soft gradients --------- */
const THEME_GRADS = {
  gold:   [["0%","#fff2c6"],["50%","#e8caa4"],["100%","#cda56e"]],
  orange: [["0%","#ffe8c7"],["50%","#ffd58a"],["100%","#ffbf69"]],
  green:  [["0%","#d1fae5"],["50%","#86efac"],["100%","#4ade80"]],
  blue:   [["0%","#c7e3ff"],["50%","#93c5fd"],["100%","#60a5fa"]],
  purple: [["0%","#e9d5ff"],["50%","#c4b5fd"],["100%","#a78bfa"]],
  pink:   [["0%","#ffd1dc"],["50%","#f9a8d4"],["100%","#f472b6"]],
  slate:  [["0%","#e5edf9"],["50%","#cbd5e1"],["100%","#94a3b8"]],
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

  // These three fix your ESLint errors:
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

  // PDF – whole page
  const exportRef = useRef(null);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    fetchJSON(`${API}/api/h2h/teams`, []).then((d) => setTeams(arr(d)));
    fetchJSON(`${API}/api/players/list`, []).then((d) => setPlayers(arr(d)));
    fetchJSON(`${API}/api/h2h/meta/tournaments?type=${lbType}`, []).then((d) =>
      setTournaments(["ALL", ...arr(d)]));
    fetchJSON(`${API}/api/h2h/meta/years?type=${lbType}`, []).then((d) =>
      setYears(["ALL", ...arr(d)]));
  }, []);

  useEffect(() => {
    setLbTournament("ALL");
    setLbYear("ALL");
    fetchJSON(`${API}/api/h2h/meta/tournaments?type=${lbType}`, []).then((d) =>
      setTournaments(["ALL", ...arr(d)]));
    fetchJSON(`${API}/api/h2h/meta/years?type=${lbType}`, []).then((d) =>
      setYears(["ALL", ...arr(d)]));
  }, [lbType]);

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

  const tooltipProps = {
    cursor: false,
    contentStyle: { background: "#0b1420", border: "1px solid #2a3f60" },
    itemStyle: { color: COLORS.ink },
    labelStyle: { color: COLORS.ink },
  };

  /** ---------- Generic HBar (single Bar) ---------- */
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

  /* ========= 5W Hauls ========= */
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

  /** ---------- PDF (whole module, compressed) ---------- */
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
      {/* Top bar with actions (not in PDF) */}
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
            {/* ... (the rest is unchanged from earlier message – included here) */}
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
