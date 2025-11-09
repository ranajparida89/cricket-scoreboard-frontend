// src/components/TestRanking.js
// Fixed: UI now respects "wins first, then points" like backend
// New: sort toggle + info button + working single close button (old removed)

import React, {
  useEffect,
  useMemo,
  useRef,
  useState,
  forwardRef,
} from "react";
import { getTestRankings } from "../services/api";
import { gsap } from "gsap";
import { Animate } from "react-move";
import { useSpring, animated as a } from "@react-spring/web";
import Particles from "react-tsparticles";
import { loadFull } from "tsparticles";
import "./TestRanking.css";

/* ---------- Flags ---------- */
const flagMap = {
  india: "🇮🇳",
  australia: "🇦🇺",
  england: "🏴",
  "new zealand": "🇳🇿",
  pakistan: "🇵🇰",
  "south africa": "🇿🇦",
  "sri lanka": "🇱🇰",
  ireland: "🇮🇪",
  kenya: "🇰🇪",
  namibia: "🇳🇦",
  bangladesh: "🇧🇩",
  afghanistan: "🇦🇫",
  zimbabwe: "🇿🇼",
  "west indies": "🏴‍☠️",
  usa: "🇺🇸",
  uae: "🇦🇪",
  oman: "🇴🇲",
  scotland: "🏴",
  netherlands: "🇳🇱",
  nepal: "🇳🇵",
};

/* ---------- AOI (in-view) ---------- */
const useInView = (ref, threshold = 0.2) => {
  const [seen, setSeen] = useState(false);
  useEffect(() => {
    if (!ref.current) return;
    const o = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) setSeen(true);
      },
      { threshold }
    );
    o.observe(ref.current);
    return () => o.disconnect();
  }, [ref, threshold]);
  return seen;
};

/* ---------- Helpers ---------- */
const medal = (i) => (i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : "");
const bucketByPoints = (p, max) => {
  const r = p / (max || 1);
  if (r >= 0.75) return "green";
  if (r >= 0.55) return "yellow";
  if (r >= 0.35) return "orange";
  if (r > 0) return "purple";
  return "red";
};
const bucketGradient = (b) =>
  ({
    green: "linear-gradient(90deg,#14e29a,#00c986)",
    yellow: "linear-gradient(90deg,#ffe76a,#ffb03a)",
    orange: "linear-gradient(90deg,#ffb03a,#ff7a3d)",
    purple: "linear-gradient(90deg,#a57cff,#6dd6ff)",
    red: "linear-gradient(90deg,#ff6b6b,#ff2b2b)",
  }[b] || "linear-gradient(90deg,#93a6bd,#93a6bd)");

/* ---------- Row component ---------- */
const TestRow = forwardRef(({ index, row, maxPoints }, ref) => {
  const { team_name, matches, wins, losses, draws, points } = row;
  const flag = flagMap[team_name?.toLowerCase()] || "🏳️";
  const pct = Math.round((points / maxPoints) * 100);
  const bucket = bucketByPoints(points, maxPoints);

  const [spr, api] = useSpring(() => ({
    rotateX: 0,
    rotateY: 0,
    scale: 1,
    config: { mass: 1, tension: 280, friction: 24 },
  }));

  const onMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const rx = -((y / rect.height - 0.5) * 6);
    const ry = (x / rect.width - 0.5) * 6;
    api.start({ rotateX: rx, rotateY: ry, scale: 1.01 });
  };
  const onLeave = () => api.start({ rotateX: 0, rotateY: 0, scale: 1 });

  return (
    <a.tr
      ref={ref}
      className={`trfx-row bucket-${bucket}`}
      style={{
        transform: spr.scale.to(
          (s) =>
            `perspective(900px) rotateX(${spr.rotateX.get()}deg) rotateY(${spr.rotateY.get()}deg) scale(${s})`
        ),
      }}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
    >
      <td className="rank">
        <span className="medal">{medal(index)}</span> {index + 1}
      </td>
      <td className="team">
        <span className="flag">{flag}</span>
        <span className="name">{team_name}</span>
      </td>
      <td>{matches}</td>
      <td className="pos">{wins}</td>
      <td className="neg">{losses}</td>
      <td>{draws}</td>
      <td className="trfx-points">
        <div className="points-track" />
        <Animate
          start={{ w: 0 }}
          update={{ w: [pct], timing: { duration: 600 } }}
        >
          {({ w }) => (
            <div
              className="points-bar"
              style={{
                width: `${w}%`,
                backgroundImage: bucketGradient(bucket),
              }}
            />
          )}
        </Animate>
        <span className="points-num">{points}</span>
      </td>
    </a.tr>
  );
});

/* ---------- Main component ---------- */
const TestRanking = () => {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sortMode, setSortMode] = useState("wins");
  const [showInfo, setShowInfo] = useState(false);
  const [visible, setVisible] = useState(true);

  const wrapRef = useRef(null);
  const bodyRefs = useRef([]);
  bodyRefs.current = [];
  const addRowRef = (el) => {
    if (el && !bodyRefs.current.includes(el)) bodyRefs.current.push(el);
  };

  const particlesInit = async (engine) => {
    await loadFull(engine);
  };

  useEffect(() => {
    (async () => {
      try {
        const data = await getTestRankings();
        const clean = (Array.isArray(data) ? data : []).map((t) => ({
          team_name: t.team_name,
          matches: Number(t.matches) || 0,
          wins: Number(t.wins) || 0,
          losses: Number(t.losses) || 0,
          draws:
            t.draws != null
              ? Number(t.draws)
              : Math.max(
                  0,
                  (Number(t.matches) || 0) -
                    (Number(t.wins) || 0) -
                    (Number(t.losses) || 0)
                ),
          points: Number(t.points) || 0,
        }));
        setRows(clean);
      } catch (e) {
        console.error("Test rankings load failed:", e?.message || e);
        setRows([]);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const sortedRows = useMemo(() => {
    const arr = [...rows];
    if (sortMode === "wins") {
      arr.sort(
        (a, b) =>
          b.wins - a.wins ||
          b.points - a.points ||
          a.team_name.localeCompare(b.team_name)
      );
    } else {
      arr.sort(
        (a, b) =>
          b.points - a.points ||
          b.wins - a.wins ||
          a.team_name.localeCompare(b.team_name)
      );
    }
    return arr;
  }, [rows, sortMode]);

  const inView = useInView(wrapRef);
  const maxPoints = useMemo(
    () => Math.max(10, ...sortedRows.map((r) => r.points)),
    [sortedRows]
  );

  useEffect(() => {
    if (!inView || !bodyRefs.current.length) return;
    gsap.fromTo(
      bodyRefs.current,
      { y: 20, opacity: 0, filter: "blur(4px)" },
      {
        y: 0,
        opacity: 1,
        filter: "blur(0px)",
        duration: 0.55,
        stagger: 0.07,
        ease: "power2.out",
      }
    );
  }, [inView, sortedRows]);

  if (!visible) return null;

  return (
    <div className="trfx-shell">
      <Particles
        id="trfx-particles"
        init={particlesInit}
        options={{
          fullScreen: { enable: false },
          background: { color: { value: "transparent" } },
          particles: {
            number: { value: 18, density: { enable: true, area: 800 } },
            links: { enable: true, distance: 120, opacity: 0.15, width: 1 },
            move: { enable: true, speed: 1, outModes: { default: "bounce" } },
            size: { value: { min: 1, max: 3 } },
            opacity: { value: 0.25 },
          },
        }}
      />

      <div ref={wrapRef} className="trfx-glass">
        <div className="trfx-header">
          <span className="trfx-title">World Test Match Team Rankings</span>

          <button
            className="trfx-info-btn"
            onClick={() => setShowInfo((p) => !p)}
            title="About this page"
          >
            i
          </button>

          {/* ✅ SINGLE close button only */}
          <button
            className="trfx-close-btn"
            onClick={() => setVisible(false)}
            title="Close"
          >
            ✕
          </button>
        </div>

        {/* sort bar */}
        <div className="trfx-sortbar">
          <span className="label">Sort by:</span>
          <button
            className={sortMode === "wins" ? "active" : ""}
            onClick={() => setSortMode("wins")}
          >
            Wins → Points
          </button>
          <button
            className={sortMode === "points" ? "active" : ""}
            onClick={() => setSortMode("points")}
          >
            Points → Wins
          </button>
        </div>

        {showInfo && (
          <div className="trfx-info-panel">
            <h4>How this ranking works</h4>
            <ul>
              <li>Primary order: Teams with more Test wins come first.</li>
              <li>If wins are equal, points determine ranking.</li>
              <li>Win = 12 pts, Draw = 4 pts, Loss = 6 pts.</li>
              <li>
                Drawn matches give both sides points, so low-win teams may still
                rank higher on points.
              </li>
            </ul>
          </div>
        )}

        <div className="trfx-table-wrap">
          <table className="trfx-table">
            <thead>
              <tr>
                <th>Rank</th>
                <th>Team</th>
                <th>Matches</th>
                <th>Wins</th>
                <th>Losses</th>
                <th>Draws</th>
                <th>Points</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <>
                  <tr className="skeleton"><td colSpan="7" /></tr>
                  <tr className="skeleton"><td colSpan="7" /></tr>
                  <tr className="skeleton"><td colSpan="7" /></tr>
                </>
              ) : sortedRows.length === 0 ? (
                <tr>
                  <td colSpan="7" className="trfx-empty">
                    No Test ranking data available.
                  </td>
                </tr>
              ) : (
                sortedRows.map((r, i) => (
                  <TestRow
                    key={`${r.team_name}-${i}`}
                    ref={addRowRef}
                    index={i}
                    row={r}
                    maxPoints={maxPoints}
                  />
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default TestRanking;
