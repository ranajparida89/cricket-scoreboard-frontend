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

/* ---------- bold gradient palette (loops) ---------- */
const GRADS = [
  ["#ff6b6b", "#ee5a24"],
  ["#4ecdc4", "#44a08d"],
  ["#45b7d1", "#96c93d"],
  ["#f093fb", "#f5576c"],
  ["#4facfe", "#00f2fe"],
  ["#43e97b", "#38f9d7"],
  ["#fa709a", "#fee140"],
  ["#30cfd0", "#91a7ff"],
];

/* ---------- card shell ---------- */
const CardShell = ({ match, isRecent, gradient, active }) => (
  <div
    className={`match-card premium square ${active ? "is-active" : "is-dimmed"}`}
    style={{
      // front card = bold, back = slightly desaturated via CSS class
      backgroundImage: `linear-gradient(135deg, ${gradient[0]}, ${gradient[1]})`,
    }}
  >
    {isRecent && (
      <div className="live-badge live-badge--green">
        <span className="dot-red" /> Recent
      </div>
    )}

    <h2 className="mc-title">{match.match_name}</h2>

    <div className="mc-row">
      <div>
        <div className="mc-line">
          {getFlag(match.team1)} <strong>{match.team1?.toUpperCase()}</strong>{" "}
          {match.runs1}/{match.wickets1}
        </div>
        <div className="mc-sub">Overs: {formatOvers(match.overs1)}</div>
      </div>
      <div>
        <div className="mc-line">
          {getFlag(match.team2)} <strong>{match.team2?.toUpperCase()}</strong>{" "}
          {match.runs2}/{match.wickets2}
        </div>
        <div className="mc-sub">Overs: {formatOvers(match.overs2)}</div>
      </div>
    </div>

    <div className="mc-win">
      🏆{" "}
      {match.winner === "Draw"
        ? "Match is drawn."
        : match.winner?.toLowerCase()?.includes("won the match")
        ? match.winner
        : `${match.winner} won the match!`}
    </div>
  </div>
);

/* ---------- deck position math (centered, large square) ---------- */
const layoutForIndex = (i, active) => {
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
    };
  }
  const spread = Math.min(abs, 5);
  const baseX = 140;           // how far side cards move
  const baseRotate = 18;       // tilt
  return {
    x: Math.sign(offset) * baseX * spread,
    y: 8 * spread,
    scale: 1 - 0.1 * spread,
    rotateY: -Math.sign(offset) * baseRotate * Math.min(spread, 2),
    zIndex: 100 - spread,
    opacity: 0.95 - 0.12 * spread,
  };
};

/* ---------- deck (centered with controls) ---------- */
const Deck = ({ items }) => {
  const [active, setActive] = useState(0);

  const next = () => setActive((a) => Math.min(a + 1, Math.max(0, items.length - 1)));
  const prev = () => setActive((a) => Math.max(a - 1, 0));

  return (
    <div className="deck-wrap">
      <div className="deck" role="listbox" aria-label="Match cards carousel">
        {items.slice(0, 12).map((m, i) => {
          const pos = layoutForIndex(i, active);
          const grad = GRADS[i % GRADS.length];
          const isActive = i === active;
          return (
            <motion.button
              type="button"
              aria-label={`Open ${m.match_name}`}
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
              }}
              transition={{ type: "spring", stiffness: 260, damping: 22, mass: 0.8 }}
              onClick={() => setActive(i)}
            >
              <CardShell match={m} isRecent={i === 0} gradient={grad} active={isActive} />
            </motion.button>
          );
        })}
      </div>

      <div className="deck-controls">
        <button className="glass-btn" onClick={prev} disabled={active === 0}>
          ← Previous
        </button>
        <button
          className="glass-btn"
          onClick={next}
          disabled={active === Math.max(0, items.length - 1)}
        >
          Next →
        </button>
      </div>
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
