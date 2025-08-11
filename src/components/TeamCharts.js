// ✅ src/components/TeamCharts.js
// Redesigned with GSAP (reveal), React Spring (hover tilt),
// tsparticles background, AOI, and scripted Chart.js animations.

import React, { useEffect, useMemo, useRef, useState } from "react";
import { getTeamChartData } from "../services/api";
import "./TeamCharts.css";

import { Bar, Line } from "react-chartjs-2";
import { Pie } from "react-chartjs-2";

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

// Anim / UX
import { gsap } from "gsap";
import { useSpring, animated as a } from "@react-spring/web";
import Particles from "react-tsparticles";
import { loadFull } from "tsparticles";

// Register chart.js bits
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

// ---------- tiny utilities ----------
const usePrefersReducedMotion = () =>
  typeof window !== "undefined" &&
  window.matchMedia &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const useInView = (ref, threshold = 0.25) => {
  const [seen, setSeen] = useState(false);
  useEffect(() => {
    if (!ref.current) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setSeen(true);
      },
      { threshold }
    );
    obs.observe(ref.current);
    return () => obs.disconnect();
  }, [ref, threshold]);
  return seen;
};

// Hover-tilt chart card
const TiltCard = ({ children, className = "" }) => {
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
      className={`tc-card ${className}`}
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

const TeamCharts = () => {
  const [teams, setTeams] = useState([]);
  const [filteredType, setFilteredType] = useState("All");
  const [selectedTestTeam, setSelectedTestTeam] = useState("");

  // shell refs for reveal
  const shellRef = useRef(null);
  const seen = useInView(shellRef, 0.2);
  const reduce = usePrefersReducedMotion();

  // particles
  const isTouch =
    typeof window !== "undefined" &&
    (window.matchMedia?.("(pointer: coarse)").matches ||
      /android|iphone|ipad|mobile/i.test(navigator.userAgent || ""));

  const particlesInit = async (engine) => {
    await loadFull(engine);
  };

  useEffect(() => {
    const fetchData = async () => {
      const data = await getTeamChartData();
      const normalized = (data || []).map((team) => ({
        ...team,
        match_type: (team.match_type || "").trim().toLowerCase(),
      }));
      const sorted = normalized.sort((a, b) => (b.points || 0) - (a.points || 0));
      setTeams(sorted);
    };
    fetchData();
  }, []);

  // compute Test team list
  const uniqueTestTeams = useMemo(() => {
    const list = teams
      .filter((t) => t.match_type === "test")
      .map((t) => t.team_name);
    return [...new Set(list)];
  }, [teams]);

  useEffect(() => {
    if (filteredType === "Test" && uniqueTestTeams.length && !selectedTestTeam) {
      setSelectedTestTeam(uniqueTestTeams[0]);
    }
  }, [filteredType, uniqueTestTeams, selectedTestTeam]);

  // filter
  const filteredTeams =
    filteredType === "All"
      ? teams
      : teams.filter((t) => t.match_type === filteredType.toLowerCase());

  const labels = filteredTeams.map((t) => t.team_name);
  const points = filteredTeams.map((t) => +t.points || 0);
  const nrr = filteredTeams.map((t) => {
    const v = parseFloat(t.nrr);
    return isNaN(v) ? 0 : +v.toFixed(2);
  });

  // theming by type
  const typeColor = {
    t20: "rgba(255, 159, 64, 0.85)",
    odi: "rgba(54, 162, 235, 0.85)",
    test: "rgba(153, 102, 255, 0.85)",
    all: "rgba(75, 192, 192, 0.85)",
  };
  const color = typeColor[filteredType.toLowerCase()] || typeColor.all;

  // ---------- Chart configs with scripted animation delays ----------
  const basePlugins = {
    legend: {
      position: "top",
      labels: { color: "#dfefff" },
    },
    datalabels: {
      color: "#fff",
      font: { weight: "bold" },
      formatter: (v) => v,
    },
    title: {
      display: false,
      text: "",
      color: "#dfefff",
      font: { size: 14, weight: 700 },
    },
  };

  const sc = {
    x: { ticks: { color: "#bfe2ff" }, grid: { color: "rgba(255,255,255,.08)" } },
    y: {
      beginAtZero: true,
      ticks: { color: "#bfe2ff" },
      grid: { color: "rgba(255,255,255,.08)" },
    },
  };

  // Staggered dataset draw – disabled if prefers-reduced-motion
  const perItemDelay = (ctx) => {
    const base = 80;
    if (reduce) return 0;
    const idx = ctx.dataIndex ?? 0;
    return idx * base;
  };

  const barData = {
    labels,
    datasets: [
      {
        label: "Points",
        data: points,
        backgroundColor: color,
        borderRadius: 6,
      },
    ],
  };

  const barOptions = {
    responsive: true,
    animation: !reduce && {
      duration: 700,
      easing: "easeOutCubic",
      delay: (ctx) => perItemDelay(ctx),
    },
    plugins: basePlugins,
    scales: sc,
  };

  const lineData = {
    labels,
    datasets: [
      {
        label: "Net Run Rate (NRR)",
        data: nrr,
        borderColor: color,
        backgroundColor: color,
        pointRadius: 4,
        pointHoverRadius: 6,
        tension: 0.35,
      },
    ],
  };

  const lineOptions = {
    responsive: true,
    animation: !reduce && {
      duration: 900,
      easing: "easeOutQuart",
      delay: (ctx) => perItemDelay(ctx),
    },
    plugins: basePlugins,
    scales: sc,
  };

  const selectedTeamData =
    filteredType === "Test" && selectedTestTeam
      ? teams.find(
          (t) =>
            t.match_type === "test" && t.team_name === selectedTestTeam
        )
      : null;

  const pieData = selectedTeamData && {
    labels: ["Wins", "Losses", "Draws"],
    datasets: [
      {
        data: [
          selectedTeamData?.wins || 0,
          selectedTeamData?.losses || 0,
          selectedTeamData?.draws || 0,
        ],
        backgroundColor: ["#16e29a", "#ff6b6b", "#ffe76a"],
        borderColor: ["#0a452f", "#3a0e0e", "#4a3b00"],
        borderWidth: 1,
      },
    ],
  };

  const pieOptions = {
    responsive: true,
    animation: !reduce && {
      animateRotate: true,
      animateScale: true,
      duration: 800,
      easing: "easeOutBack",
    },
    plugins: {
      ...basePlugins,
      datalabels: {
        color: "#041b2a",
        font: { weight: "bold" },
        formatter: (v, ctx) => {
          const total = ctx.dataset.data.reduce((a, b) => a + b, 0);
          if (!total) return "";
          const pct = Math.round((v / total) * 100);
          return `${pct}%`;
        },
      },
      legend: { position: "bottom", labels: { color: "#dfefff" } },
    },
  };

  // ---------- GSAP reveal when in view ----------
  useEffect(() => {
    if (!seen || reduce) return;
    const cards = gsap.utils.toArray(".tc-card");
    gsap.fromTo(
      cards,
      { y: 24, opacity: 0, filter: "blur(4px)" },
      { y: 0, opacity: 1, filter: "blur(0px)", duration: 0.55, stagger: 0.08, ease: "power2.out" }
    );
  }, [seen, reduce, filteredType, selectedTestTeam]);

  return (
    <div ref={shellRef} className="tc-shell">
      {!isTouch && (
        <Particles
          id="tc-particles"
          init={particlesInit}
          options={{
            fullScreen: { enable: false },
            background: { color: { value: "transparent" } },
            fpsLimit: 60,
            particles: {
              number: { value: 22, density: { enable: true, area: 800 } },
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

      <div className="tc-glass">
        <div className="tc-header">
          <h3 className="tc-title">📊 Team Performance Charts</h3>

          <div className="tc-filter">
            <select
              className="team-chart-type-select"
              value={filteredType}
              onChange={(e) => setFilteredType(e.target.value)}
            >
              <option value="All">All</option>
              <option value="T20">T20</option>
              <option value="ODI">ODI</option>
              <option value="Test">Test</option>
            </select>

            {filteredType === "Test" && uniqueTestTeams.length > 0 && (
              <select
                className="team-chart-type-select"
                value={selectedTestTeam}
                onChange={(e) => setSelectedTestTeam(e.target.value)}
              >
                {uniqueTestTeams.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            )}
          </div>
        </div>

        {/* Bar */}
        <TiltCard>
          <div className="tc-card-inner">
            <h5 className="tc-card-title">Points Comparison</h5>
            <Bar
              key={`bar-${filteredType}-${labels.join("-")}`}
              data={barData}
              options={barOptions}
              plugins={[ChartDataLabels]}
            />
          </div>
        </TiltCard>

        {/* Pie or Line */}
        {filteredType === "Test" && pieData ? (
          <TiltCard>
            <div className="tc-card-inner">
              <h5 className="tc-card-title">
                Win / Loss / Draw &nbsp;
                <span className="tc-muted">({selectedTeamData.team_name})</span>
              </h5>
              <Pie data={pieData} options={pieOptions} plugins={[ChartDataLabels]} />
            </div>
          </TiltCard>
        ) : (
          <TiltCard>
            <div className="tc-card-inner">
              <h5 className="tc-card-title">Net Run Rate (NRR)</h5>
              <Line
                key={`line-${filteredType}-${labels.join("-")}`}
                data={lineData}
                options={lineOptions}
                plugins={[ChartDataLabels]}
              />
            </div>
          </TiltCard>
        )}
      </div>
    </div>
  );
};

export default TeamCharts;
