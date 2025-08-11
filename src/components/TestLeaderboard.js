import React, { useEffect, useMemo, useRef, useState, forwardRef } from "react";
import { getTestMatchLeaderboard } from "../services/api";
import { gsap } from "gsap";
import { Animate } from "react-move";
import { useSpring, animated as a } from "@react-spring/web";
import Particles from "react-tsparticles";
import { loadFull } from "tsparticles";
import "./TestLeaderboard.css";

/* AOI */
const useInView = (ref, threshold = 0.2) => {
  const [seen, setSeen] = useState(false);
  useEffect(() => {
    if (!ref.current) return;
    const o = new IntersectionObserver(([e]) => e.isIntersecting && setSeen(true), { threshold });
    o.observe(ref.current);
    return () => o.disconnect();
  }, [ref, threshold]);
  return seen;
};

/* helpers */
const medalEmoji = (i) => (i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : "");
const bucketGradient = (ratio) => {
  if (ratio >= 0.75) return "linear-gradient(90deg,#14e29a,#00c986)";
  if (ratio >= 0.55) return "linear-gradient(90deg,#ffe76a,#ffb03a)";
  if (ratio >= 0.35) return "linear-gradient(90deg,#ffb03a,#ff7a3d)";
  if (ratio > 0)     return "linear-gradient(90deg,#a57cff,#6dd6ff)";
  return "linear-gradient(90deg,#ff6b6b,#ff2b2b)";
};

/* Row component (hooks live here, not inside map) */
const TLRow = forwardRef(({ index, row, maxPoints }, ref) => {
  const ratio = (row.points || 0) / (maxPoints || 1);
  const pct = Math.round(ratio * 100);

  const [spr, api] = useSpring(() => ({
    rotateX: 0, rotateY: 0, scale: 1,
    config: { mass: 1, tension: 280, friction: 24 },
  }));
  const onMove = (e) => {
    const r = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - r.left, y = e.clientY - r.top;
    api.start({ rotateX: -(y / r.height - 0.5) * 6, rotateY: (x / r.width - 0.5) * 6, scale: 1.01 });
  };
  const onLeave = () => api.start({ rotateX: 0, rotateY: 0, scale: 1 });

  return (
    <a.tr
      ref={ref}
      className="tlfx-row"
      style={{
        transform: spr.scale.to(
          (s) => `perspective(900px) rotateX(${spr.rotateX.get()}deg) rotateY(${spr.rotateY.get()}deg) scale(${s})`
        ),
      }}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
    >
      <td className="rank">
        <span className={`medal-3d ${index===0?'gold':index===1?'silver':index===2?'bronze':''}`}>
          {medalEmoji(index)}
        </span>
        <span className="pos">{index + 1}</span>
      </td>
      <td className="team">{row.team_name}</td>
      <td>{row.matches}</td>
      <td className="pos">{row.wins}</td>
      <td className="neg">{row.losses}</td>
      <td>{row.draws}</td>

      {/* Points: bar fill + glowing head + number count-up */}
      <td className="tlfx-points">
        <div className="points-track" />
        <Animate start={{ w: 0 }} update={{ w: [pct], timing: { duration: 800 } }}>
          {({ w }) => (
            <div
              className={`points-bar ${index < 3 ? "pulse" : ""}`}
              style={{ width: `${w}%`, backgroundImage: bucketGradient(ratio) }}
            >
              <span className="bar-head" />
            </div>
          )}
        </Animate>

        <Animate start={{ val: 0 }} update={{ val: [row.points], timing: { duration: 800 } }}>
          {({ val }) => <span className="points-num">{Math.round(val)}</span>}
        </Animate>
      </td>
    </a.tr>
  );
});

const TestLeaderboard = () => {
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);

  const wrapRef = useRef(null);
  const rowRefs = useRef([]);
  rowRefs.current = [];
  const addRowRef = (el) => el && !rowRefs.current.includes(el) && rowRefs.current.push(el);

  const particlesInit = async (engine) => { await loadFull(engine); };

  useEffect(() => {
    getTestMatchLeaderboard()
      .then((data) => {
        const arr = Array.isArray(data) ? data : [];
        const normalized = arr.map((t) => ({
          team_name: t.team_name,
          matches: Number(t.matches) || 0,
          wins: Number(t.wins) || 0,
          losses: Number(t.losses) || 0,
          draws: t.draws != null
            ? Number(t.draws)
            : Math.max(0, (Number(t.matches)||0) - (Number(t.wins)||0) - (Number(t.losses)||0)),
          points: Number(t.points) || 0,
        }));
        const sorted = normalized.sort((a,b) => b.points - a.points || b.wins - a.wins);
        setTeams(sorted);
      })
      .catch(() => setTeams([]))
      .finally(() => setLoading(false));
  }, []);

  const inView = useInView(wrapRef);
  const maxPoints = useMemo(() => Math.max(10, ...teams.map(t => t.points || 0)), [teams]);

  useEffect(() => {
    if (!inView || !rowRefs.current.length) return;
    gsap.fromTo(
      rowRefs.current,
      { y: 20, opacity: 0, filter: "blur(4px)" },
      { y: 0, opacity: 1, filter: "blur(0px)", duration: 0.55, stagger: 0.07, ease: "power2.out" }
    );
    if (rowRefs.current[0]) {
      gsap.fromTo(
        rowRefs.current[0],
        { boxShadow: "0 0 0 rgba(0,255,170,0)" },
        { boxShadow: "0 0 22px rgba(0,255,170,.35)", duration: 1.1, repeat: 1, yoyo: true }
      );
    }
  }, [inView, teams]);

  return (
    <div className="tlfx-shell">
      <Particles
        id="tlfx-particles"
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

      <div ref={wrapRef} className="tlfx-glass">
        <div className="tlfx-header">
          <span className="tlfx-title">World Test Match Team Rankings</span>
        </div>

        <div className="tlfx-table-wrap">
          <table className="tlfx-table">
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
              {loading && (
                <>
                  <tr className="skeleton"><td colSpan="7" /></tr>
                  <tr className="skeleton"><td colSpan="7" /></tr>
                  <tr className="skeleton"><td colSpan="7" /></tr>
                </>
              )}

              {!loading && teams.length === 0 && (
                <tr><td className="tlfx-empty" colSpan="7">No Test match leaderboard data available.</td></tr>
              )}

              {!loading && teams.map((t, i) => (
                <TLRow
                  key={`${t.team_name}-${i}`}
                  ref={addRowRef}
                  index={i}
                  row={t}
                  maxPoints={maxPoints}
                />
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default TestLeaderboard;
