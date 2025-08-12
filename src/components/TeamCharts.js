// ✅ TeamCharts.js — Team Performance Insights (LOI points, Test points, pointer arrow)
// Data:
//  - /api/team-rankings → points + nrr (T20/ODI/Test) and W/L/D for Test
//  - /api/match-history?match_type=T20|ODI → parse winner text → W/L/D & LOI points (Win=2, Draw/Tie=1, Loss=0)

import React, { useEffect, useMemo, useRef, useState } from "react";
import { getTeamChartData, getMatchHistory } from "../services/api";
import "./TeamCharts.css";

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Tooltip,
  Legend,
  Title,
} from "chart.js";
import ChartDataLabels from "chartjs-plugin-datalabels";
import { Bar, Line } from "react-chartjs-2";

import { gsap } from "gsap";
import { useSpring, animated as a } from "@react-spring/web";
import Particles from "react-tsparticles";
import { loadFull } from "tsparticles";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Tooltip,
  Legend,
  Title,
  ChartDataLabels
);

/* ---------- helpers ---------- */
const useReducedMotion = () =>
  typeof window !== "undefined" &&
  window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

const useInView = (ref, threshold = 0.25) => {
  const [seen, setSeen] = useState(false);
  useEffect(() => {
    if (!ref.current) return;
    const obs = new IntersectionObserver(
      ([entry]) => entry.isIntersecting && setSeen(true),
      { threshold }
    );
    obs.observe(ref.current);
    return () => obs.disconnect();
  }, [ref, threshold]);
  return seen;
};

const Tilt = ({ children, className = "" }) => {
  const [spr, api] = useSpring(() => ({
    rotateX: 0,
    rotateY: 0,
    scale: 1,
    config: { mass: 1, tension: 280, friction: 24 },
  }));
  const onMove = (e) => {
    const r = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - r.left;
    const y = e.clientY - r.top;
    api.start({
      rotateX: -(y / r.height - 0.5) * 6,
      rotateY: (x / r.width - 0.5) * 6,
      scale: 1.01,
    });
  };
  const onLeave = () => api.start({ rotateX: 0, rotateY: 0, scale: 1 });
  return (
    <a.div
      className={`tcpro-card ${className}`}
      style={{
        transform: spr.scale.to(
          (s) =>
            `perspective(900px) rotateX(${spr.rotateX.get()}deg) rotateY(${spr.rotateY.get()}deg) scale(${s})`
        ),
      }}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
    >
      {children}
    </a.div>
  );
};

/* panel background */
const panelBg = {
  id: "panel_bg",
  beforeDraw(chart) {
    const { ctx, chartArea } = chart;
    if (!chartArea) return;
    const { left, right, top, bottom } = chartArea;
    const g = ctx.createLinearGradient(0, top, 0, bottom);
    g.addColorStop(0, "rgba(18,42,64,.12)");
    g.addColorStop(1, "rgba(14,28,44,.04)");
    ctx.save();
    ctx.fillStyle = g;
    ctx.fillRect(left, top, right - left, bottom - top);

    ctx.globalAlpha = 0.04;
    ctx.strokeStyle = "#ffffff";
    const gap = 14;
    for (let x = left - (bottom - top); x < right; x += gap) {
      ctx.beginPath();
      ctx.moveTo(x, bottom);
      ctx.lineTo(x + (bottom - top), top);
      ctx.stroke();
    }
    ctx.restore();
  },
};
const areaFill = (ctx, chartArea, rgba) => {
  const g = ctx.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
  g.addColorStop(0, rgba.replace("1)", "0.16)"));
  g.addColorStop(1, rgba.replace("1)", "0.02)"));
  return g;
};

/* ---------- LOI winner parser ---------- */
const parseLOIOutcome = (winnerStr, team1, team2) => {
  const w = (winnerStr || "").toLowerCase();
  const isDraw =
    w.includes("draw") || w.includes("no result") || w.includes("tie");
  if (isDraw) return { outcome: "draw" };
  if (w.includes("won")) {
    const nameGuess = winnerStr.split(/ won/i)[0].trim();
    const norm = (s) => (s || "").replace(/[^\w\s]/g, "").trim().toLowerCase();
    if (norm(nameGuess) === norm(team1)) return { outcome: "win", winner: team1 };
    if (norm(nameGuess) === norm(team2)) return { outcome: "win", winner: team2 };
    if (norm(nameGuess).includes(norm(team1))) return { outcome: "win", winner: team1 };
    if (norm(nameGuess).includes(norm(team2))) return { outcome: "win", winner: team2 };
  }
  return { outcome: "unknown" };
};

const TeamCharts = () => {
  const [rows, setRows] = useState([]);
  const [format, setFormat] = useState("All");

  const [showHelp, setShowHelp] = useState(false);
  const [showCoach, setShowCoach] = useState(false);   // bubble tip
  const [showPointer, setShowPointer] = useState(false); // arrow pointer

  const shellRef = useRef(null);
  const seen = useInView(shellRef, 0.2);
  const reduce = useReducedMotion();
  const isTouch =
    typeof window !== "undefined" &&
    (window.matchMedia?.("(pointer: coarse)").matches ||
      /android|iphone|ipad|mobile/i.test(navigator.userAgent || ""));

  const particlesInit = async (engine) => await loadFull(engine);

  /* ---------- fetch & unify ---------- */
  useEffect(() => {
    (async () => {
      // 1) rankings for all formats (Test includes W/L/D; LOI gives points+NRR)
      const rankingRows = await getTeamChartData();
      const rKey = (team, type) => `${team.toLowerCase()}|${type.toLowerCase()}`;
      const rankingMap = new Map();
      for (const r of rankingRows || []) {
        if (!r.team_name || !r.match_type) continue;
        rankingMap.set(
          rKey(r.team_name, r.match_type),
          {
            points: Number(r.points) || 0,
            nrr: r.nrr == null ? 0 : Number(r.nrr),
            matches: Number(r.matches) || 0,
            wins: Number(r.wins) || 0,
            losses: Number(r.losses) || 0,
            draws: Number(r.draws) || 0,
            type: (r.match_type || "").trim(),
            team: r.team_name,
          }
        );
      }

      // 2) build LOI W/L/D & points from raw match_history (Win=2, Draw/Tie=1)
      const [t20Hist, odiHist] = await Promise.all([
        getMatchHistory({ match_type: "T20" }),
        getMatchHistory({ match_type: "ODI" }),
      ]);
      const acc = new Map();
      const bump = (team, type, field, n = 1) => {
        const key = rKey(team, type);
        if (!acc.has(key)) {
          acc.set(key, { team, type, matches: 0, wins: 0, losses: 0, draws: 0, points: 0, nrr: 0 });
        }
        acc.get(key)[field] += n;
      };
      const processLOI = (list, type) => {
        for (const m of list || []) {
          if (!m.team1 || !m.team2) continue;
          bump(m.team1, type, "matches");
          bump(m.team2, type, "matches");
          const { outcome, winner } = parseLOIOutcome(m.winner, m.team1, m.team2);
          if (outcome === "draw") {
            bump(m.team1, type, "draws"); bump(m.team2, type, "draws");
            bump(m.team1, type, "points", 1); bump(m.team2, type, "points", 1);
          } else if (outcome === "win" && winner) {
            const loser = winner === m.team1 ? m.team2 : m.team1;
            bump(winner, type, "wins"); bump(loser, type, "losses");
            bump(winner, type, "points", 2);
          }
        }
      };
      processLOI(t20Hist, "T20");
      processLOI(odiHist, "ODI");

      // merge NRR / prefer ranking points if present
      for (const [key, stat] of acc) {
        const r = rankingMap.get(key);
        if (r) {
          stat.nrr = r.nrr ?? 0;
          if (!Number.isNaN(Number(r.points))) stat.points = Number(r.points);
        }
      }
      // add LOI rows that exist only in rankings
      for (const [key, r] of rankingMap) {
        const [, type] = key.split("|");
        const typeUp = (type || "").toUpperCase();
        if ((typeUp === "T20" || typeUp === "ODI") && !acc.has(key)) {
          acc.set(key, {
            team: r.team, type: typeUp, matches: r.matches || 0,
            wins: 0, losses: 0, draws: 0, points: r.points || 0, nrr: r.nrr ?? 0,
          });
        }
      }

      // 3) Test direct from rankings (Win=12, Loss=6, Draw=4 already applied in SQL)
      const testRows = (rankingRows || [])
        .filter((r) => (r.match_type || "").toUpperCase() === "TEST")
        .map((r) => ({
          team: r.team_name, type: "Test",
          matches: Number(r.matches) || 0,
          wins: Number(r.wins) || 0,
          losses: Number(r.losses) || 0,
          draws: Number(r.draws) || 0,
          points: Number(r.points) || 0,
          nrr: 0,
        }));

      setRows([...Array.from(acc.values()), ...testRows]);
    })();
  }, []);

  const formats = ["t20", "odi", "test"];

  /* ---------- filter + sort ---------- */
  const filtered = useMemo(() => {
    if (format === "All") return rows;
    return rows.filter((r) => r.type?.toLowerCase() === format.toLowerCase());
  }, [rows, format]);

  const sorted = useMemo(() => {
    const copy = [...filtered];
    copy.sort((a, b) => (b.points - a.points) || (b.nrr - a.nrr));
    return copy;
  }, [filtered]);

  const labels = sorted.map((r) => r.team);
  const wins = sorted.map((r) => r.wins);
  const losses = sorted.map((r) => r.losses);
  const draws = sorted.map((r) => r.draws);
  const points = sorted.map((r) => r.points);
  const nrr = sorted.map((r) => r.nrr);
  const winPct = (r) => (r.matches ? Math.round((r.wins / r.matches) * 100) : 0);

  /* ---------- KPIs ---------- */
  const totalMatches = filtered.reduce((s, r) => s + (r.matches || 0), 0);
  const totalWins = filtered.reduce((s, r) => s + (r.wins || 0), 0);
  const avgWinRate = totalMatches ? Math.round((totalWins / totalMatches) * 100) : 0;
  const bestTeam = sorted[0]?.team || "—";
  const bestNRRRow = [...filtered].sort((a, b) => b.nrr - a.nrr)[0];
  const bestNRR = bestNRRRow?.nrr > 0 ? `+${bestNRRRow.nrr}` : bestNRRRow?.nrr ?? "—";

  /* ---------- charts ---------- */
  const basePlugins = {
    legend: { position: "top", labels: { color: "#233" } },
    datalabels: { color: "#111", font: { weight: "bold" } },
    tooltip: {
      backgroundColor: "rgba(30,33,50,.92)",
      titleColor: "#fff",
      bodyColor: "#fff",
      borderColor: "rgba(255,255,255,.08)",
      borderWidth: 1,
    },
  };
  const axes = {
    x: { ticks: { color: "#475569" }, grid: { color: "rgba(0,0,0,.05)" } },
    y: { beginAtZero: true, ticks: { color: "#475569" }, grid: { color: "rgba(0,0,0,.05)" } },
  };
  const reduceDelay = useReducedMotion();
  const delay = (ctx) => (reduceDelay ? 0 : (ctx.dataIndex || 0) * 80);

  const byTeam = useMemo(() => {
    const map = new Map();
    for (const r of rows) {
      if (!map.has(r.team)) map.set(r.team, {});
      map.get(r.team)[r.type?.toLowerCase()] = r;
    }
    return map;
  }, [rows]);

  const paletteHex = ["#0ea5e9", "#fb7185", "#22c55e", "#f59e0b", "#a78bfa", "#14b8a6"];
  const toRGBA = (hex) => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r},${g},${b},1)`;
  };

  const lineTeams = useMemo(() => {
    if (format === "All") {
      const totals = [];
      byTeam.forEach((obj, name) => {
        const total = (obj.t20?.points || 0) + (obj.odi?.points || 0) + (obj.test?.points || 0);
        totals.push({ name, total });
      });
      return totals.sort((a, b) => b.total - a.total).slice(0, 4).map((t) => t.name);
    }
    const key = format.toLowerCase();
    return rows
      .filter((r) => r.type?.toLowerCase() === key)
      .sort((a, b) => b.points - a.points)
      .slice(0, 6)
      .map((r) => r.team);
  }, [format, byTeam, rows]);

  const winRateLine = useMemo(() => {
    const datasets = lineTeams.map((team, i) => {
      const color = toRGBA(paletteHex[i % paletteHex.length]);
      const data = ["t20", "odi", "test"].map((f) => {
        const r = byTeam.get(team)?.[f];
        return r?.matches ? +((r.wins / r.matches) * 100).toFixed(1) : 0;
      });
      return {
        label: team,
        data,
        borderColor: color,
        borderWidth: 3,
        borderDash: i >= 2 ? [8, 6] : undefined,
        borderDashOffset: (ctx) => (!reduce && i >= 2 ? (Date.now() / 50) % 200 : 0),
        pointRadius: (ctx) => (ctx.raw === 0 ? 2 : 4),
        pointHoverRadius: 6,
        pointBackgroundColor: color,
        pointBorderColor: "#fff",
        pointBorderWidth: 1,
        tension: 0.35,
        spanGaps: true,
        fill: true,
        backgroundColor: (c) => {
          const { chartArea, ctx } = c.chart;
          if (!chartArea) return color;
          return areaFill(ctx, chartArea, color);
        },
      };
    });
    return { labels: ["T20", "ODI", "Test"], datasets };
  }, [lineTeams, byTeam, reduce]);

  const winRateOptions = {
    responsive: true,
    maintainAspectRatio: false,
    animation: !reduce && { duration: 900, easing: "easeOutQuart" },
    plugins: {
      ...basePlugins,
      subtitle: {
        display: true,
        text:
          format === "All"
            ? "Top-4 teams by total points • Value = Win% by format"
            : `Top teams in ${format} • Value = Win% by format`,
        color: "#475569",
        padding: { bottom: 6 },
      },
      datalabels: { display: false },
      legend: { position: "top", labels: { color: "#233", boxWidth: 14 } },
      title: { display: true, text: "Win Rate Trend", color: "#223", font: { weight: 700 } },
    },
    scales: {
      x: { ...axes.x },
      y: { ...axes.y, max: 100, title: { display: true, text: "Win %" } },
    },
  };

  const performanceBarData = {
    labels,
    datasets: [
      { label: "Wins", data: wins, backgroundColor: "rgba(34,197,94,.88)", borderRadius: 8 },
      { label: "Losses", data: losses, backgroundColor: "rgba(244,63,94,.88)", borderRadius: 8 },
      { label: "Draws", data: draws, backgroundColor: "rgba(250,204,21,.95)", borderRadius: 8 },
    ],
  };
  const performanceBarOptions = {
    responsive: true,
    animation: !reduce && { duration: 700, easing: "easeOutCubic", delay },
    plugins: {
      ...basePlugins,
      title: { display: true, text: "Performance Bar", color: "#223", font: { weight: 700 } },
    },
    scales: axes,
  };

  const combinedData = {
    labels,
    datasets: [
      {
        type: "bar",
        label: "Points",
        data: points,
        backgroundColor: "rgba(59,130,246,.92)",
        borderRadius: 8,
        yAxisID: "y",
      },
      {
        type: "line",
        label: "NRR",
        data: nrr,
        borderColor: "#16e29a",
        backgroundColor: "#16e29a",
        tension: 0.35,
        pointRadius: 4,
        pointBackgroundColor: "#16e29a",
        yAxisID: "y1",
      },
    ],
  };
  const combinedOptions = {
    responsive: true,
    animation: !reduce && { duration: 800, easing: "easeOutCubic", delay },
    plugins: {
      ...basePlugins,
      title: { display: true, text: "Combined Bar + Line", color: "#223", font: { weight: 700 } },
    },
    scales: {
      x: axes.x,
      y: { ...axes.y, title: { display: true, text: "Points" } },
      y1: { position: "right", grid: { drawOnChartArea: false }, ticks: { color: "#475569" } },
    },
  };

  /* ---------- animations & pointers ---------- */
  useEffect(() => {
    if (!seen || reduce) return;
    const cards = gsap.utils.toArray(".tcpro-card, .tcpro-kpi");
    gsap.fromTo(
      cards,
      { y: 18, opacity: 0, filter: "blur(4px)" },
      { y: 0, opacity: 1, filter: "blur(0)", duration: 0.5, stagger: 0.06, ease: "power2.out" }
    );
  }, [seen, reduce, format]);

  useEffect(() => {
    if (!seen) return;
    setShowCoach(true);
    setShowPointer(true);
    const t1 = setTimeout(() => setShowCoach(false), 4200);
    const t2 = setTimeout(() => setShowPointer(false), 5200);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [seen]);

  return (
    <div ref={shellRef} className="tcpro-shell">
      {!isTouch && (
        <Particles
          id="tcpro-particles"
          init={particlesInit}
          options={{
            fullScreen: { enable: false },
            background: { color: { value: "transparent" } },
            particles: {
              number: { value: 20, density: { enable: true, area: 800 } },
              links: { enable: true, distance: 120, opacity: 0.14, width: 1 },
              move: { enable: true, speed: 0.6, outModes: { default: "bounce" } },
              size: { value: { min: 1, max: 3 } },
              opacity: { value: 0.22 },
              color: { value: "#7ad1ff" },
            },
            detectRetina: true,
          }}
        />
      )}

      <div className="tcpro-glass">
        <div className="tcpro-header">
          <h3 className="tcpro-title">Team Performance Insights</h3>

          <div className="tcpro-actions">
            {/* pointer arrow that nudges the user to choose match type */}
            {showPointer && (
              <div className="tcpro-pointer" role="status">
                <span className="tcpro-pointer-text">Please select <b>Match Type</b></span>
              </div>
            )}

            <select
              className="tcpro-select"
              value={format}
              onChange={(e) => setFormat(e.target.value)}
            >
              <option value="All">All Formats</option>
              <option value="T20">T20</option>
              <option value="ODI">ODI</option>
              <option value="Test">Test</option>
            </select>

            {/* help / coachmark */}
            <div className="tcpro-help">
              <button
                type="button"
                className="tcpro-help-btn"
                aria-label="About these charts"
                onClick={() => setShowHelp(true)}
              >
                i
              </button>
              {showCoach && (
                <div className="tcpro-help-coach">
                  Tip: Select a <b>Match Type</b> to filter all charts.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Win rate line */}
        <Tilt>
          <div className="tcpro-card-inner">
            <div className="chart-tall">
              <Line data={winRateLine} options={winRateOptions} plugins={[ChartDataLabels, panelBg]} />
            </div>
          </div>
        </Tilt>

        {/* Two charts */}
        <div className="tcpro-grid">
          <Tilt>
            <div className="tcpro-card-inner">
              <Bar
                key={`bar-perf-${format}-${labels.join("|")}`}
                data={performanceBarData}
                options={performanceBarOptions}
                plugins={[ChartDataLabels]}
              />
            </div>
          </Tilt>

          <Tilt>
            <div className="tcpro-card-inner">
              <Bar
                key={`combo-${format}-${labels.join("|")}`}
                data={combinedData}
                options={combinedOptions}
                plugins={[ChartDataLabels]}
              />
            </div>
          </Tilt>
        </div>

        {/* KPIs */}
        <div className="tcpro-kpis">
          <div className="tcpro-kpi"><div className="kpi-title">Matches</div><div className="kpi-value">{totalMatches}</div></div>
          <div className="tcpro-kpi" title="Across all teams in the current filter">
            <div className="kpi-title">Avg Win-Rate</div><div className="kpi-value">{avgWinRate}%</div>
          </div>
          <div className="tcpro-kpi"><div className="kpi-title">Best Team</div><div className="kpi-value">{bestTeam}</div></div>
          <div className="tcpro-kpi"><div className="kpi-title">Best NRR</div><div className="kpi-value">{bestNRR}</div></div>
        </div>

        {/* Pretty table */}
        <div className="tcpro-table-wrap">
          <table className="tcpro-table tcpro-table--pretty">
            <thead>
              <tr>
                <th>Team</th>
                <th>Match Type</th>
                <th>Matches</th>
                <th>Wins</th>
                <th>Losses</th>
                <th>Draws</th>
                <th>Points</th>
                <th>Win %</th>
                <th>NRR</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((r, i) => (
                <tr key={`${r.team}-${r.type}`} className={i < 3 ? `rank${i + 1}` : ""}>
                  <td className="left">
                    {i < 3 && <span className={`medal m${i + 1}`} aria-hidden="true" />}
                    {r.team}
                  </td>
                  <td><span className={`badge-type ${r.type?.toLowerCase()}`}>{(r.type || "").toUpperCase()}</span></td>
                  <td>{r.matches}</td>
                  <td className="pos">{r.wins}</td>
                  <td className="neg">{r.losses}</td>
                  <td>{r.draws}</td>
                  <td className="pos">{r.points}</td>
                  <td className="pos">{winPct(r)}%</td>
                  <td className={r.nrr >= 0 ? "pos" : "neg"}>{r.nrr >= 0 ? `+${r.nrr}` : r.nrr}</td>
                </tr>
              ))}
              {!sorted.length && (
                <tr><td colSpan="9" className="muted">No data for this selection.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Help overlay */}
      {showHelp && (
        <div className="tcpro-help-modal" role="dialog" aria-modal="true" aria-label="Chart help">
          <div className="tcpro-help-panel">
            <div className="help-hdr">
              <h4>How to read this section</h4>
              <button className="help-close" onClick={() => setShowHelp(false)} aria-label="Close">×</button>
            </div>
            <div className="help-body">
              <p>Use the <b>Match Type</b> dropdown to switch between T20, ODI and Test. All charts & KPIs sync.</p>
              <ul className="help-list">
                <li><b>LOI points</b>: Win=2, Loss=0, Tie/Draw/NR=1.</li>
                <li><b>Test points</b>: Win=12, Loss=6, Draw=4.</li>
                <li><b>Win Rate Trend</b> shows win% across formats for the top teams.</li>
                <li><b>Table</b> is sorted by <i>Points</i> then <i>NRR</i> and highlights the top 3.</li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeamCharts;
