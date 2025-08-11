// ✅ TeamCharts.js — Dashboard charts with format-aware line selection + richer visuals
// Uses: Chart.js + chartjs-plugin-datalabels, GSAP (reveal), React Spring (tilt), tsparticles (desktop only)

import React, { useEffect, useMemo, useRef, useState } from "react";
import { getTeamChartData } from "../services/api";
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
    const rx = -(y / r.height - 0.5) * 6;
    const ry = (x / r.width - 0.5) * 6;
    api.start({ rotateX: rx, rotateY: ry, scale: 1.01 });
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

/** gradient + subtle stripes inside the chart panel */
const panelBg = {
  id: "panel_bg",
  beforeDraw(chart) {
    const { ctx, chartArea } = chart;
    if (!chartArea) return;
    const { left, right, top, bottom } = chartArea;
    // glassy gradient
    const g = ctx.createLinearGradient(0, top, 0, bottom);
    g.addColorStop(0, "rgba(18,42,64,.12)");
    g.addColorStop(1, "rgba(14,28,44,.04)");
    ctx.save();
    ctx.fillStyle = g;
    ctx.fillRect(left, top, right - left, bottom - top);

    // very faint diagonal stripes
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

/** soft area fill for each line */
const areaFill = (ctx, chartArea, rgba) => {
  const g = ctx.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
  g.addColorStop(0, rgba.replace("1)", "0.16)"));
  g.addColorStop(1, rgba.replace("1)", "0.02)"));
  return g;
};

const TeamCharts = () => {
  const [rows, setRows] = useState([]);
  const [format, setFormat] = useState("All"); // All | T20 | ODI | Test

  const shellRef = useRef(null);
  const seen = useInView(shellRef, 0.2);
  const reduce = useReducedMotion();
  const isTouch =
    typeof window !== "undefined" &&
    (window.matchMedia?.("(pointer: coarse)").matches ||
      /android|iphone|ipad|mobile/i.test(navigator.userAgent || ""));

  const particlesInit = async (engine) => await loadFull(engine);

  /* ---------- data fetch ---------- */
  useEffect(() => {
    (async () => {
      const data = await getTeamChartData(); // <-- your API
      const norm = (data || []).map((t) => ({
        team: t.team_name,
        type: (t.match_type || "").trim().toLowerCase(), // t20/odi/test
        matches: +t.matches || 0,
        wins: +t.wins || 0,
        losses: +t.losses || 0,
        draws: +t.draws || 0,
        points: +t.points || 0,
        nrr: isNaN(+t.nrr) ? 0 : +(+t.nrr).toFixed(2),
      }));
      setRows(norm);
    })();
  }, []);

  const formats = ["t20", "odi", "test"];

  /* ---------- maps & filtered sets ---------- */
  // team → { t20, odi, test }
  const byTeam = useMemo(() => {
    const map = new Map();
    for (const r of rows) {
      if (!map.has(r.team)) map.set(r.team, {});
      map.get(r.team)[r.type] = r;
    }
    return map;
  }, [rows]);

  // rows visible in the table/cards based on the dropdown
  const filtered = useMemo(() => {
    if (format === "All") return rows;
    return rows.filter((r) => r.type === format.toLowerCase());
  }, [rows, format]);

  const labels = filtered.map((r) => r.team);
  const wins = filtered.map((r) => r.wins);
  const losses = filtered.map((r) => r.losses);
  const draws = filtered.map((r) => r.draws);
  const points = filtered.map((r) => r.points);
  const nrr = filtered.map((r) => r.nrr);

  /* ---------- KPI ---------- */
  const totalMatches = filtered.reduce((s, r) => s + r.matches, 0);
  const totalWins = filtered.reduce((s, r) => s + r.wins, 0);
  const avgWinRate = totalMatches ? Math.round((totalWins / totalMatches) * 100) : 0;
  const bestTeam = filtered.slice().sort((a, b) => b.points - a.points)[0]?.team || "—";
  const bestNRRRow = filtered.slice().sort((a, b) => b.nrr - a.nrr)[0];
  const bestNRR = bestNRRRow?.nrr > 0 ? `+${bestNRRRow.nrr}` : bestNRRRow?.nrr ?? "—";

  /* ---------- Chart configs ---------- */
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
    y: {
      beginAtZero: true,
      ticks: { color: "#475569" },
      grid: { color: "rgba(0,0,0,.05)" },
    },
  };
  const delay = (ctx) => (reduce ? 0 : (ctx.dataIndex || 0) * 80);

  /* ---------- Win-Rate Line (format-aware team pick) ---------- */
  // palette helpers
  const paletteHex = ["#0ea5e9", "#fb7185", "#22c55e", "#f59e0b", "#a78bfa", "#14b8a6"];
  const toRGBA = (hex) => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r},${g},${b},1)`;
  };

  // Team selection:
  // - "All"  → top 4 by total points across formats
  // - "T20"/"ODI"/"Test" → top 6 by points in that format (so Kenya/HK appear in T20)
  const lineTeams = useMemo(() => {
    if (format === "All") {
      const sums = [];
      byTeam.forEach((obj, name) => {
        const total = formats.reduce((s, f) => s + (obj[f]?.points || 0), 0);
        sums.push({ name, total });
      });
      return sums.sort((a, b) => b.total - a.total).slice(0, 4).map((t) => t.name);
    }
    const key = format.toLowerCase();
    const list = rows
      .filter((r) => r.type === key)
      .sort((a, b) => b.points - a.points)
      .slice(0, 6) // show up to 6 lines for the chosen format
      .map((r) => r.team);
    return Array.from(new Set(list)); // unique
  }, [format, byTeam, rows]);

  const winRateLine = useMemo(() => {
    const datasets = lineTeams.map((team, i) => {
      const color = toRGBA(paletteHex[i % paletteHex.length]);
      // Always 3 points (T20/ODI/Test). Use 0 where missing → line is continuous.
      const data = formats.map((f) => {
        const r = byTeam.get(team)?.[f];
        return r?.matches ? +((r.wins / r.matches) * 100).toFixed(1) : 0;
      });

      return {
        label: team,
        data,
        borderColor: color,
        borderWidth: 3,
        // fancier visuals for lower-ranked lines
        borderDash: i >= 2 ? [8, 6] : undefined,
        borderDashOffset: (ctx) =>
          !reduce && i >= 2 ? (Date.now() / 50) % 200 : 0, // "marching dash"
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

    return {
      labels: ["T20", "ODI", "Test"],
      datasets,
    };
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

  /* ---------- Grouped Bars: Wins/Losses/Draws ---------- */
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

  /* ---------- Combo: Points (bar) + NRR (line) ---------- */
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

  /* ---------- Reveal ---------- */
  useEffect(() => {
    if (!seen || reduce) return;
    const cards = gsap.utils.toArray(".tcpro-card, .tcpro-kpi");
    gsap.fromTo(
      cards,
      { y: 18, opacity: 0, filter: "blur(4px)" },
      { y: 0, opacity: 1, filter: "blur(0)", duration: 0.5, stagger: 0.06, ease: "power2.out" }
    );
  }, [seen, reduce, format]);

  return (
    <div ref={shellRef} className="tcpro-shell">
      {/* desktop only particles */}
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
          <h3 className="tcpro-title">Dashboard</h3>
          <div className="tcpro-actions">
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
          </div>
        </div>

        {/* Row 1: Win rate line */}
        <Tilt>
          <div className="tcpro-card-inner">
            <div className="chart-tall">
              <Line
                data={winRateLine}
                options={winRateOptions}
                plugins={[ChartDataLabels, panelBg]}
              />
            </div>
          </div>
        </Tilt>

        {/* Row 2: Two charts side by side on desktop */}
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
          <div className="tcpro-kpi">
            <div className="kpi-title">Matches</div>
            <div className="kpi-value">{totalMatches}</div>
          </div>
          <div className="tcpro-kpi">
            <div className="kpi-title">Avg Win-Rate</div>
            <div className="kpi-value">{avgWinRate}%</div>
          </div>
          <div className="tcpro-kpi">
            <div className="kpi-title">Best Team</div>
            <div className="kpi-value">{bestTeam}</div>
          </div>
          <div className="tcpro-kpi">
            <div className="kpi-title">Best NRR</div>
            <div className="kpi-value">{bestNRR}</div>
          </div>
        </div>

        {/* Compact table */}
        <div className="tcpro-table-wrap">
          <table className="tcpro-table">
            <thead>
              <tr>
                <th>Team</th>
                <th>Matches</th>
                <th>Wins</th>
                <th>Losses</th>
                <th>Draws</th>
                <th>Points</th>
                <th>NRR</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((r) => (
                <tr key={`${r.team}-${r.type}`}>
                  <td className="left">{r.team}</td>
                  <td>{r.matches}</td>
                  <td className="pos">{r.wins}</td>
                  <td className="neg">{r.losses}</td>
                  <td>{r.draws}</td>
                  <td className="pos">{r.points}</td>
                  <td className={r.nrr >= 0 ? "pos" : "neg"}>{r.nrr >= 0 ? `+${r.nrr}` : r.nrr}</td>
                </tr>
              ))}
              {!filtered.length && (
                <tr>
                  <td colSpan="7" className="muted">
                    No data for this selection.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default TeamCharts;
