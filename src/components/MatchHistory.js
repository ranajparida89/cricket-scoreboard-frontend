import React, { useEffect, useRef, useState, forwardRef } from "react";
import { getMatchHistory, getTestMatchHistory } from "../services/api";
import { gsap } from "gsap";
import { useSpring, animated as a } from "@react-spring/web";
import Particles from "react-tsparticles";
import { loadFull } from "tsparticles";
import "./MatchHistory.css";

/* -------- AOI (in-view) -------- */
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

/* -------- Helpers -------- */
const formatOvers = (overs) => Number(overs || 0).toFixed(1);
const sumNum = (a, b) => Number(a || 0) + Number(b || 0);
const sumOvers = (a, b) => (Number(a || 0) + Number(b || 0)).toFixed(1);

/** Extract just the team name from backend winner string.
 *  Examples:
 *   "India won the match!"  -> "India"
 *   "England won by 5 runs" -> "England"
 *   "Match Draw"            -> "Draw"
 *   "" / null               -> "—"
 */
const extractWinnerName = (w) => {
  if (!w) return "—";
  if (/draw/i.test(w)) return "Draw";
  const m = w.match(/^(.+?)\s+won/i);
  return m ? m[1].trim() : w.trim();
};

/* -------- Row (hooks live here, not inside map) -------- */
const MHRow = forwardRef(({ i, m }, ref) => {
  const isTest = m.match_type === "Test";

  // Team 1 (aggregate for Test)
  const runs1    = isTest ? sumNum(m.runs1,    m.runs1_2)    : m.runs1;
  const wickets1 = isTest ? sumNum(m.wickets1, m.wickets1_2) : m.wickets1;
  const overs1   = isTest ? sumOvers(m.overs1, m.overs1_2)   : formatOvers(m.overs1);

  // Team 2 (aggregate for Test)
  const runs2    = isTest ? sumNum(m.runs2,    m.runs2_2)    : m.runs2;
  const wickets2 = isTest ? sumNum(m.wickets2, m.wickets2_2) : m.wickets2;
  const overs2   = isTest ? sumOvers(m.overs2, m.overs2_2)   : formatOvers(m.overs2);

  const winnerName = extractWinnerName(m.winner);

  // Hover tilt
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
      className="mhfx-row"
      style={{
        transform: spr.scale.to(
          (s) =>
            `perspective(900px) rotateX(${spr.rotateX.get()}deg) rotateY(${spr.rotateY.get()}deg) scale(${s})`
        ),
      }}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
    >
      <td className="idx">{i + 1}</td>
      <td className="left">{m.match_name}</td>
      <td>{m.match_type}</td>
      <td className="left">{m.team1}</td>
      <td>{runs1}/{wickets1} ({overs1} ov)</td>
      <td className="left">{m.team2}</td>
      <td>{runs2}/{wickets2} ({overs2} ov)</td>

      {/* Winner: simple text only */}
      <td className="winner-text">{winnerName}</td>

      <td className="right">{new Date(m.match_time).toLocaleString()}</td>
    </a.tr>
  );
});

/* -------- Main component -------- */
const MatchHistory = () => {
  const [matches, setMatches] = useState([]);
  const [filters, setFilters] = useState({ match_type: "", team: "", winner: "" });
  const wrapRef = useRef(null);
  const rowsRef = useRef([]);
  rowsRef.current = [];
  const addRowRef = (el) => el && !rowsRef.current.includes(el) && rowsRef.current.push(el);

  const particlesInit = async (engine) => { await loadFull(engine); };

  const fetchData = async (filterValues = {}) => {
    try {
      let data = [];
      if (filterValues.match_type === "Test") {
        const t = await getTestMatchHistory();
        data = (t || []).map((match) => ({
          ...match,
          match_type: "Test",
          match_name: match.match_name,
          match_time: match.match_time,
          team1: match.team1, team2: match.team2,
          winner: match.winner,
          runs1: match.runs1, overs1: match.overs1, wickets1: match.wickets1,
          runs1_2: match.runs1_2, overs1_2: match.overs1_2, wickets1_2: match.wickets1_2,
          runs2: match.runs2, overs2: match.overs2, wickets2: match.wickets2,
          runs2_2: match.runs2_2, overs2_2: match.overs2_2, wickets2_2: match.wickets2_2,
        }));
      } else {
        data = await getMatchHistory(filterValues);
      }
      setMatches(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Error fetching match history:", err);
      setMatches([]);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleChange = (e) => setFilters({ ...filters, [e.target.name]: e.target.value });
  const handleSearch = (e) => { e.preventDefault(); fetchData(filters); };
  const handleReset = () => { setFilters({ match_type: "", team: "", winner: "" }); fetchData({}); };

  const inView = useInView(wrapRef);

  // GSAP reveal
  useEffect(() => {
    if (!inView || !rowsRef.current.length) return;
    gsap.fromTo(
      rowsRef.current,
      { y: 20, opacity: 0, filter: "blur(4px)" },
      { y: 0, opacity: 1, filter: "blur(0px)", duration: 0.55, stagger: 0.06, ease: "power2.out" }
    );
  }, [inView, matches]);

  return (
    <div className="mhfx-shell">
      <Particles
        id="mhfx-particles"
        init={particlesInit}
        options={{
          fullScreen: { enable: false },
          background: { color: { value: "transparent" } },
          fpsLimit: 60,
          particles: {
            number: { value: 20, density: { enable: true, area: 800 } },
            links: { enable: true, distance: 120, opacity: 0.15, width: 1 },
            move: { enable: true, speed: 1, outModes: { default: "bounce" } },
            size: { value: { min: 1, max: 3 } },
            opacity: { value: 0.25 },
          },
        }}
      />

      <div ref={wrapRef} className="mhfx-glass">
        <div className="mhfx-header">
          <span className="mhfx-title">📜 Match History</span>
          <span className="mhfx-sub">Past results • All formats</span>
        </div>

        {/* Filters */}
        <form onSubmit={handleSearch} className="mhfx-filters">
          <select name="match_type" value={filters.match_type} onChange={handleChange}>
            <option value="">All Match Types</option>
            <option value="T20">T20</option>
            <option value="ODI">ODI</option>
            <option value="Test">Test</option>
          </select>

          <input
            type="text" name="team" placeholder="Search by Team"
            value={filters.team} onChange={handleChange}
          />
          <input
            type="text" name="winner" placeholder="Search by Winner"
            value={filters.winner} onChange={handleChange}
          />

          <div className="btns">
            <button type="submit" className="btn primary">Search</button>
            <button type="button" className="btn" onClick={handleReset}>Reset</button>
          </div>
        </form>

        {/* Table */}
        <div className="mhfx-table-wrap">
          <table className="mhfx-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Match</th>
                <th>Type</th>
                <th>Team 1</th>
                <th>Score</th>
                <th>Team 2</th>
                <th>Score</th>
                <th>Winner</th>
                <th>Date</th>
              </tr>
            </thead>

            <tbody>
              {matches.length ? (
                matches.map((m, i) => (
                  <MHRow key={m.id || `${m.match_name}-${i}`} ref={(el) => addRowRef(el)} i={i} m={m} />
                ))
              ) : (
                <>
                  <tr className="skeleton"><td colSpan="9" /></tr>
                  <tr className="skeleton"><td colSpan="9" /></tr>
                  <tr className="skeleton"><td colSpan="9" /></tr>
                </>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default MatchHistory;
