import React, { useEffect, useMemo, useRef, useState } from "react";
import { getTeams } from "../services/api";
import { io } from "socket.io-client";
import { Animate } from "react-move";
import { useSpring, animated as a } from "@react-spring/web";
import { gsap } from "gsap";
import Particles from "react-tsparticles";
import { loadFull } from "tsparticles";
import "./LeaderboardFX.css";

// Optional (for future video export): Remotion springs/timing
// import { spring, useCurrentFrame, useVideoConfig } from "remotion";

// === Socket ===
const socket = io("https://cricket-scoreboard-backend.onrender.com");

// === Utils ===
const nrrWidth = (nrr) => {
  if (nrr === null || Number.isNaN(nrr)) return 0;
  const max = 8;
  const mag = Math.min(max, Math.max(0, Math.abs(nrr)));
  return Math.round((mag / max) * 100);
};
const nrrBucket = (nrr) => {
  if (nrr === null) return { bucket: "none", neg: false };
  if (nrr < 0) return { bucket: "red", neg: true };
  if (nrr < 0.5) return { bucket: "purple", neg: false };
  if (nrr < 2) return { bucket: "orange", neg: false };
  if (nrr < 4) return { bucket: "yellow", neg: false };
  return { bucket: "green", neg: false };
};
const renderNRR = (nrr) => (nrr === null ? "—" : nrr.toFixed(2));
const getMedal = (index) => {
  if (index === 0) return "🥇";
  if (index === 1) return "🥈";
  if (index === 2) return "🥉";
  return "";
};
const calcDraws = (t) => Math.max(0, t.matches_played - t.wins - t.losses);

// === AOI: tiny hook to know when table is in view ===
const useInView = (ref, rootMargin = "0px") => {
  const [isIntersecting, setIntersecting] = useState(false);
  useEffect(() => {
    if (!ref.current) return;
    const obs = new IntersectionObserver(
      ([entry]) => setIntersecting(entry.isIntersecting),
      { rootMargin, threshold: 0.2 }
    );
    obs.observe(ref.current);
    return () => obs.disconnect();
  }, [ref, rootMargin]);
  return isIntersecting;
};

const LeaderboardFX = () => {
  const [teams, setTeams] = useState([]);
  const wrapperRef = useRef(null);
  const rowsRef = useRef([]);
  rowsRef.current = [];

  const addRowRef = (el) => {
    if (el && !rowsRef.current.includes(el)) rowsRef.current.push(el);
  };

  // data
  const fetchTeams = async () => {
    try {
      const data = await getTeams();
      const parsed = data.map((team) => ({
        ...team,
        team_name: team.team_name,
        matches_played: parseInt(team.matches_played, 10) || 0,
        wins: parseInt(team.wins, 10) || 0,
        losses: parseInt(team.losses, 10) || 0,
        points: parseInt(team.points, 10) || 0,
        nrr: isNaN(parseFloat(team.nrr)) ? null : parseFloat(team.nrr),
      }));
      const sorted = parsed.sort((a, b) =>
        b.points !== a.points ? b.points - a.points : (b.nrr || 0) - (a.nrr || 0)
      );
      setTeams(sorted);
    } catch (e) {
      console.error("Error fetching leaderboard:", e);
    }
  };

  useEffect(() => {
    fetchTeams();
    const deb = { current: null };
    socket.on("matchUpdate", () => {
      if (deb.current) clearTimeout(deb.current);
      deb.current = setTimeout(fetchTeams, 1200);
    });
    return () => {
      socket.off("matchUpdate");
      clearTimeout(deb.current);
    };
  }, []);

  // Particles init
  const particlesInit = async (engine) => {
    await loadFull(engine);
  };

  // AOI trigger
  const inView = useInView(wrapperRef);

  // GSAP: stagger-in rows on first reveal or when data changes
  useEffect(() => {
    if (!inView || rowsRef.current.length === 0) return;
    gsap.fromTo(
      rowsRef.current,
      { y: 20, opacity: 0, filter: "blur(4px)" },
      {
        y: 0,
        opacity: 1,
        filter: "blur(0px)",
        duration: 0.6,
        stagger: 0.08,
        ease: "power2.out",
      }
    );
    // subtle glow on top row
    if (rowsRef.current[0]) {
      gsap.fromTo(
        rowsRef.current[0],
        { boxShadow: "0 0 0px rgba(0,255,170,0)" },
        {
          boxShadow: "0 0 24px rgba(0,255,170,.35)",
          duration: 1.2,
          repeat: 1,
          yoyo: true,
          ease: "sine.inOut",
        }
      );
    }
  }, [inView, teams]);

  // Memo particles config
  const particlesOptions = useMemo(
    () => ({
      fullScreen: { enable: false },
      background: { color: { value: "transparent" } },
      fpsLimit: 60,
      particles: {
        number: { value: 25, density: { enable: true, area: 800 } },
        shape: { type: "circle" },
        size: { value: { min: 1, max: 3 } },
        move: { enable: true, speed: 1, outModes: { default: "bounce" } },
        opacity: { value: 0.2 },
        links: { enable: true, distance: 120, opacity: 0.15, width: 1 },
      },
      detectRetina: true,
    }),
    []
  );

  return (
    <div className="lbfx-shell">
      <Particles id="lbfx-particles" init={particlesInit} options={particlesOptions} />
      <div ref={wrapperRef} className="lbfx-glass">
        <div className="lbfx-header">
          <span className="lbfx-title">Limited-Overs Cricket Leaderboard</span>
          <span className="lbfx-sub">Live • Auto-updated</span>
        </div>

        <div className="lbfx-table-wrap">
          <div className="lbfx-table">
            {/* Head */}
            <div className="lbfx-row lbfx-head">
              <div>#</div>
              <div>Team</div>
              <div>Matches</div>
              <div>Wins</div>
              <div>Losses</div>
              <div>Draws</div>
              <div>Points</div>
              <div>NRR</div>
            </div>

            {/* Body */}
            {teams.length === 0 && (
              <div className="lbfx-row lbfx-empty">No match data available.</div>
            )}

            {teams.map((t, i) => {
              const { bucket, neg } = nrrBucket(t.nrr);
              const w = nrrWidth(t.nrr);

              // react-spring: 3D hover tilt per-row
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
                const rx = -(y / rect.height - 0.5) * 6;
                const ry = (x / rect.width - 0.5) * 6;
                api.start({ rotateX: rx, rotateY: ry, scale: 1.01 });
              };
              const onLeave = () => api.start({ rotateX: 0, rotateY: 0, scale: 1 });

              return (
                <a.div
                  key={t.team_name}
                  ref={addRowRef}
                  className={`lbfx-row lbfx-item bucket-${bucket}`}
                  style={{
                    transform: spr.scale
                      .to((s) => `perspective(900px) rotateX(${spr.rotateX.get()}deg) rotateY(${spr.rotateY.get()}deg) scale(${s})`),
                  }}
                  onMouseMove={onMove}
                  onMouseLeave={onLeave}
                >
                  <div className="lbfx-rank">
                    <span className="medal">{getMedal(i)}</span> {i + 1}
                  </div>
                  <div className="lbfx-team">{t.team_name}</div>
                  <div>{t.matches_played}</div>
                  <div className="pos">{t.wins}</div>
                  <div className="neg">{t.losses}</div>
                  <div>{calcDraws(t)}</div>
                  <div className="pos">{t.points}</div>

                  {/* NRR: value + animated bar (react-move) */}
                  <div className={`lbfx-nrr ${neg ? "neg" : "pos"}`}>
                    <div className="nrr-track" />
                    <Animate
                      start={{ w: 0 }}
                      update={{ w: [w], timing: { duration: 600 } }}
                    >
                      {({ w }) => (
                        <div
                          className={`nrr-bar ${neg ? "from-right" : "from-left"}`}
                          style={{ width: `${w}%` }}
                        />
                      )}
                    </Animate>
                    <span className="nrr-text">{renderNRR(t.nrr)}</span>
                  </div>
                </a.div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LeaderboardFX;
