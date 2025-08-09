import React, { useEffect, useMemo, useState } from "react";
import { getMatchHistory, getTeams, getTestMatches } from "../services/api";
import { motion, AnimatePresence } from "framer-motion";
import "./MatchCards.css";

/* ---------- helpers ---------- */
const formatOvers = (d = 0) => {
  const full = Math.floor(d);
  const balls = Math.round((d - full) * 6);
  return `${full}.${balls}`;
};
const getFlag = (name) => {
  const n = name?.trim().toLowerCase();
  const flags = {
    india: "🇮🇳", australia: "🇦🇺", england: "🏴", "new zealand": "🇳🇿",
    pakistan: "🇵🇰", "south africa": "🇿🇦", "sri lanka": "🇱🇰", ireland: "🇮🇪",
    kenya: "🇰🇪", namibia: "🇳🇦", bangladesh: "🇧🇩", afghanistan: "🇦🇫",
    zimbabwe: "🇿🇼", "west indies": "🏴‍☠️", usa: "🇺🇸", uae: "🇦🇪",
    oman: "🇴🇲", scotland: "🏴", netherlands: "🇳🇱", nepal: "🇳🇵",
  };
  return flags[n] || "🏳️";
};

/* ---------- sound (no external file) ---------- */
const playSwapWhoosh = () => {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = "triangle";
    o.frequency.setValueAtTime(220, ctx.currentTime);
    o.frequency.exponentialRampToValueAtTime(1100, ctx.currentTime + 0.18);
    g.gain.setValueAtTime(0.0001, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.2, ctx.currentTime + 0.03);
    g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.22);
    o.connect(g); g.connect(ctx.destination);
    o.start(); o.stop(ctx.currentTime + 0.24);
  } catch {}
};

/* ---------- deck position math ---------- */
/* We show a focused "front" card (active = 0), others fan behind to left/right */
const layoutForIndex = (i, active, total) => {
  const offset = i - active; // negative = left, positive = right
  const abs = Math.abs(offset);

  if (abs === 0) {
    return {
      x: 0,
      y: 0,
      scale: 1,
      rotateY: 0,
      zIndex: 100,
      opacity: 1,
      shadow: "0 16px 40px rgba(0,0,0,.45)",
    };
  }

  // how far to fan out
  const baseX = 110;              // horizontal spread
  const baseY = 12;               // vertical drift
  const baseRotate = 14;          // Y-axis tilt
  const spread = Math.min(abs, 4); // cap visible fan to 4 each side

  return {
    x: Math.sign(offset) * baseX * spread,
    y: baseY * spread,
    scale: 1 - 0.08 * spread,
    rotateY: -Math.sign(offset) * baseRotate * Math.min(spread, 2),
    zIndex: 100 - spread,         // older => behind
    opacity: 0.95 - 0.12 * spread,
    shadow: "0 10px 28px rgba(0,0,0,.35)",
  };
};

/* ---------- card shell ---------- */
const CardShell = ({ match, isRecent }) => (
  <div className="match-card premium h-100">
    {isRecent && (
      <div className="live-badge live-badge--green">
        <span className="dot-red" /> Recent
      </div>
    )}
    <h5 className="text-white card-title-wave">{match.match_name}</h5>

    <div className="d-flex justify-content-between align-items-center mb-2">
      <div>
        <h6 className="mb-1">
          {getFlag(match.team1)} <strong>{match.team1?.toUpperCase()}</strong>{" "}
          {match.runs1}/{match.wickets1}
        </h6>
        <p className="overs-info">Overs: {formatOvers(match.overs1)}</p>
      </div>
      <div>
        <h6 className="mb-1">
          {getFlag(match.team2)} <strong>{match.team2?.toUpperCase()}</strong>{" "}
          {match.runs2}/{match.wickets2}
        </h6>
        <p className="overs-info">Overs: {formatOvers(match.overs2)}</p>
      </div>
    </div>

    <p className="text-light">
      <strong>
        🏆{" "}
        {match.winner === "Draw"
          ? "Match is drawn."
          : match.winner?.toLowerCase()?.includes("won the match")
          ? match.winner
          : `${match.winner} won the match!`}
      </strong>
    </p>
  </div>
);

/* ---------- deck component ---------- */
const Deck = ({ items }) => {
  // items already sorted newest → oldest
  const [active, setActive] = useState(0);

  const onPick = (i) => {
    if (i === active) return;
    setActive(i);
    // tiny whoosh
    if (window.matchMedia("(prefers-reduced-motion: no-preference)").matches) {
      playSwapWhoosh();
    }
  };

  const visible = useMemo(() => items.slice(0, 12), [items]); // cap to avoid too many in DOM

  return (
    <div className="deck">
      {visible.map((m, i) => {
        const pos = layoutForIndex(i, active, visible.length);
        return (
          <motion.div
            key={m.id || `${m.match_name}-${i}`}
            className="deck-item"
            style={{ zIndex: pos.zIndex }}
            initial={false}
            animate={{
              x: pos.x,
              y: pos.y,
              scale: pos.scale,
              rotateY: pos.rotateY,
              opacity: pos.opacity,
              boxShadow: pos.shadow,
            }}
            transition={{ type: "spring", stiffness: 260, damping: 22, mass: 0.8 }}
            onClick={() => onPick(i)}
            whileHover={{ y: i === active ? -2 : pos.y - 2 }}
          >
            <CardShell match={m} isRecent={i === 0} />
          </motion.div>
        );
      })}
    </div>
  );
};

/* ======================= PAGE ======================= */
const MatchCards = () => {
  const [matches, setMatches] = useState([]);
  const [testMatches, setTestMatches] = useState([]);
  const [teams, setTeams] = useState([]);
  const [tab, setTab] = useState("ODI"); // 'ODI' | 'T20' | 'TEST'

  useEffect(() => {
    const load = async () => {
      try {
        const [matchRes, testRes, teamRes] = await Promise.all([
          getMatchHistory(),
          getTestMatches(),
          getTeams(),
        ]);
        if (Array.isArray(matchRes)) setMatches(matchRes);
        if (Array.isArray(testRes)) setTestMatches(testRes);
        if (Array.isArray(teamRes)) setTeams(teamRes);
      } catch (e) {
        console.error("Error loading data:", e);
      }
    };
    load();
  }, []);

  // newest first (assuming API already returns newest first, else sort by date desc if available)
  const odi = useMemo(() => matches.filter((m) => m.match_type === "ODI"), [matches]);
  const t20 = useMemo(() => matches.filter((m) => m.match_type === "T20"), [matches]);
  const test = useMemo(() => testMatches, [testMatches]);

  const Section = ({ title, items }) => (
    <motion.div
      key={title}
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -16 }}
      transition={{ duration: 0.45, ease: "easeOut" }}
    >
      <h3 className="text-light mb-3">{title}</h3>
      {items.length === 0 ? (
        <p className="text-white">No {title} available.</p>
      ) : (
        <Deck items={items} />
      )}
    </motion.div>
  );

  return (
    <div className="container mt-4">
      <div className="toggle-buttons">
        <motion.button
          whileHover={{ scale: 1.04 }}
          whileTap={{ scale: 0.98 }}
          className={`btn btn-warning ${tab === "ODI" ? "active" : ""}`}
          onClick={() => setTab("ODI")}
        >
          🏏 ODI Matches {tab === "ODI" ? "▼" : ""}
        </motion.button>
        <motion.button
          whileHover={{ scale: 1.04 }}
          whileTap={{ scale: 0.98 }}
          className={`btn btn-danger ${tab === "T20" ? "active" : ""}`}
          onClick={() => setTab("T20")}
        >
          🔥 T20 Matches {tab === "T20" ? "▼" : ""}
        </motion.button>
        <motion.button
          whileHover={{ scale: 1.04 }}
          whileTap={{ scale: 0.98 }}
          className={`btn btn-info ${tab === "TEST" ? "active" : ""}`}
          onClick={() => setTab("TEST")}
        >
          🧪 Test Matches {tab === "TEST" ? "▼" : ""}
        </motion.button>
      </div>

      <AnimatePresence mode="wait">
        {tab === "ODI" && <Section title="ODI Matches" items={odi} />}
        {tab === "T20" && <Section title="T20 Matches" items={t20} />}
        {tab === "TEST" && <Section title="Test Matches" items={test} />}
      </AnimatePresence>
    </div>
  );
};

export default MatchCards;
