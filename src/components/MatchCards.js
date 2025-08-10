// src/components/MatchCards.js
import React, { useEffect, useRef, useState, useMemo } from "react";
import { getMatchHistory, getTeams, getTestMatches } from "../services/api";
import { motion, AnimatePresence, useMotionValue, useTransform } from "framer-motion";
import gsap from "gsap";
import "./MatchCards.css";

/* ---------------------------------------
   Utility: overs formatter
--------------------------------------- */
const formatOvers = (decimalOvers = 0) => {
  const fullOvers = Math.floor(decimalOvers);
  const balls = Math.round((decimalOvers - fullOvers) * 6);
  return `${fullOvers}.${balls}`;
};

/* ---------------------------------------
   Framer variants (page / list / card)
--------------------------------------- */
const pageVariants = {
  hidden: { opacity: 0, y: 24 },
  show:   { opacity: 1, y: 0, transition: { duration: 0.45, ease: "easeOut" } },
};
const listVariants = {
  hidden: {},
  show:   { transition: { staggerChildren: 0.08, delayChildren: 0.05 } },
};
const cardVariants = {
  hidden: { opacity: 0, y: 26, scale: 0.98 },
  show:   { opacity: 1, y: 0, scale: 1, transition: { duration: 0.4 } },
  exit:   { opacity: 0, y: -16, transition: { duration: 0.25 } },
};

/* ---------------------------------------
   Flags helper
--------------------------------------- */
const getFlag = (teamName) => {
  const normalized = teamName?.trim().toLowerCase();
  const flags = {
    india: "🇮🇳", australia: "🇦🇺", england: "🏴", "new zealand": "🇳🇿",
    pakistan: "🇵🇰", "south africa": "🇿🇦", "sri lanka": "🇱🇰", ireland: "🇮🇪",
    kenya: "🇰🇪", namibia: "🇳🇦", bangladesh: "🇧🇩", afghanistan: "🇦🇫",
    zimbabwe: "🇿🇼", "west indies": "🏴‍☠️", usa: "🇺🇸", uae: "🇦🇪",
    oman: "🇴🇲", scotland: "🏴", netherlands: "🇳🇱", nepal: "🇳🇵",
  };
  return flags[normalized] || "🏳️";
};

/* ---------------------------------------
   Color palettes (looped per card)
--------------------------------------- */
const PALETTES = [
  ["#4facfe", "#00f2fe"],
  ["#43e97b", "#38f9d7"],
  ["#fa709a", "#fee140"],
  ["#30cfd0", "#91a7ff"],
  ["#f093fb", "#f5576c"],
  ["#45b7d1", "#96c93d"],
  ["#ff6b6b", "#ee5a24"],
  ["#a18cd1", "#fbc2eb"],
];

/* ---------------------------------------
   Text Anim 1: Title word-stagger
   - Splits title into words
   - Each word fades+slides up on mount
   - Tiny lift on hover for micro-delight
--------------------------------------- */
const TitleStagger = ({ text }) => {
  const words = useMemo(() => (text || "").split(" "), [text]);
  return (
    <motion.span className="title-stagger" role="heading" aria-level={5}>
      {words.map((w, i) => (
        <motion.span
          key={`${w}-${i}`}
          className="title-word"
          initial={{ y: 12, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.28, ease: "easeOut", delay: 0.04 * i }}
          whileHover={{ y: -2 }}
        >
          {w}{i < words.length - 1 ? " " : ""}
        </motion.span>
      ))}
    </motion.span>
  );
};

/* ---------------------------------------
   Text Anim 2: RevealLine
   - Uses clip-path mask to wipe text in
   - Ideal for lines like "Overs" or team rows
--------------------------------------- */
const RevealLine = ({ children, delay = 0 }) => (
  <motion.span
    className="reveal-line"
    initial={{ clipPath: "inset(0 100% 0 0)" , opacity: 0.0001 }}
    animate={{ clipPath: "inset(0 0% 0 0)", opacity: 1 }}
    transition={{ duration: 0.38, ease: "easeOut", delay }}
  >
    {children}
  </motion.span>
);

/* ---------------------------------------
   Text Anim 3: ScoreFlip
   - Your existing score flip-in (kept)
--------------------------------------- */
const ScoreFlip = ({ children, delay = 0 }) => (
  <motion.span
    className="score-flip"
    initial={{ rotateX: 90, opacity: 0 }}
    animate={{ rotateX: 0, opacity: 1 }}
    transition={{ duration: 0.25, ease: "easeOut", delay }}
    style={{ display: "inline-block", transformOrigin: "bottom" }}
  >
    {children}
  </motion.span>
);

/* ---------------------------------------
   CardFX:
   - 3D tilt + pointer-glow
   - Shine sweep
   - Gradient palettes per card
   - Dark blue morph on hover/touch
   - Ripple on pointer down
--------------------------------------- */
function CardFX({ children, isRecent, paletteIndex }) {
  const cardRef = useRef(null);
  const glowRef = useRef(null);
  const [isDark, setIsDark] = useState(false);
  const [c1, c2] = PALETTES[paletteIndex % PALETTES.length];

  // 3D tilt
  const rx = useMotionValue(0);
  const ry = useMotionValue(0);
  const rotateX = useTransform(rx, [-1, 1], [8, -8]);
  const rotateY = useTransform(ry, [-1, 1], [-8, 8]);

  const onMove = (e) => {
    const el = cardRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const px = (e.clientX - rect.left) / rect.width;
    const py = (e.clientY - rect.top) / rect.height;
    ry.set(px * 2 - 1);
    rx.set(py * 2 - 1);

    if (glowRef.current) {
      gsap.to(glowRef.current, {
        x: (px - 0.5) * rect.width * 0.4,
        y: (py - 0.5) * rect.height * 0.4,
        duration: 0.2,
        ease: "power2.out",
      });
    }
  };

  const onEnter = () => {
    setIsDark(true); // morph to dark while hovered
    gsap.to(cardRef.current, {
      boxShadow: "0 18px 44px rgba(0,255,204,0.22)",
      y: -4,
      duration: 0.25,
      ease: "power2.out",
    });
    gsap.to(glowRef.current, { opacity: 1, duration: 0.25, ease: "power2.out" });
  };

  const onLeave = () => {
    setIsDark(false);
    gsap.to(cardRef.current, {
      boxShadow: "0 4px 14px rgba(0,0,0,0.35)",
      y: 0,
      duration: 0.3,
      ease: "power2.out",
    });
    gsap.to(glowRef.current, { opacity: 0, duration: 0.3, ease: "power2.out" });
    rx.set(0); ry.set(0);
  };

  // Tap ripple + dark hold on touch
  const onTap = (e) => {
    setIsDark(true);
    const el = cardRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const ripple = document.createElement("span");
    ripple.className = "tap-ripple";
    ripple.style.left = `${x}px`;
    ripple.style.top = `${y}px`;
    el.appendChild(ripple);
    ripple.addEventListener("animationend", () => ripple.remove());
  };
  const onPointerUp = () => setIsDark(false);

  return (
    <motion.div
      ref={cardRef}
      className={`match-card advanced h-100 ${isDark ? "is-dark" : ""}`}
      style={{ "--c1": c1, "--c2": c2 }}
      variants={cardVariants}
      onMouseMove={onMove}
      onMouseEnter={onEnter}
      onMouseLeave={onLeave}
      onPointerDown={onTap}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      whileTap={{ scale: 0.99 }}
      animate={{ rotateX, rotateY }}
    >
      {/* soft glow follower */}
      <div ref={glowRef} className="card-glow" aria-hidden="true" />
      {/* shine sweep */}
      <div className="card-shine" aria-hidden="true" />

      {/* recent pill (ODI/T20/Test: index 0 in each list) */}
      {isRecent && (
        <motion.div
          className="live-badge"
          animate={{
            scale: [1, 1.12, 1],
            boxShadow: ["0 0 0px #00ffcc55", "0 0 16px #00ffccaa", "0 0 0px #00ffcc55"],
          }}
          transition={{ repeat: Infinity, duration: 1.6 }}
        >
          <span className="dot-red" />
          Recent
        </motion.div>
      )}

      {/* slight idle float for whole content */}
      <motion.div
        className="card-surface"
        style={{ rotateX, rotateY }}
        animate={{ y: [0, -2, 0] }}
        transition={{ duration: 4.5, repeat: Infinity, ease: "easeInOut" }}
      >
        {children}
      </motion.div>
    </motion.div>
  );
}

/* ---------------------------------------
   MAIN
--------------------------------------- */
const MatchCards = () => {
  const [matches, setMatches] = useState([]);
  const [testMatches, setTestMatches] = useState([]);
  const [teams, setTeams] = useState([]);
  const [showOdi, setShowOdi] = useState(true);
  const [showT20, setShowT20] = useState(false);
  const [showTest, setShowTest] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const matchRes = await getMatchHistory();
        const testRes = await getTestMatches();
        const teamRes = await getTeams();

        if (Array.isArray(matchRes)) setMatches(matchRes);
        if (Array.isArray(testRes)) setTestMatches(testRes);
        if (Array.isArray(teamRes)) setTeams(teamRes);
      } catch (err) {
        console.error("❌ Error fetching match/team data:", err);
      }
    };
    fetchData();
  }, []);

  /* ----- Card renderers with text animations ----- */
  const renderODICard = (match, index) => (
    <CardFX key={`${match.match_name}-${index}`} isRecent={index === 0} paletteIndex={index}>
      <h5 className="text-white">
        {/* Title: word-stagger + subtle shimmer via CSS */}
        <TitleStagger text={match.match_name} />
      </h5>

      <div className="d-flex justify-content-between align-items-center mb-2">
        <div>
          <h6 className="mb-1">
            <RevealLine delay={0.05}>
              {getFlag(match.team1)} <strong>{match.team1?.toUpperCase()}</strong>{" "}
              <ScoreFlip delay={0.08}>{match.runs1}/{match.wickets1}</ScoreFlip>
            </RevealLine>
          </h6>
          <p className="overs-info">
            <RevealLine delay={0.12}>Overs: <ScoreFlip delay={0.16}>{formatOvers(match.overs1)}</ScoreFlip></RevealLine>
          </p>
        </div>
        <div>
          <h6 className="mb-1">
            <RevealLine delay={0.05}>
              {getFlag(match.team2)} <strong>{match.team2?.toUpperCase()}</strong>{" "}
              <ScoreFlip delay={0.08}>{match.runs2}/{match.wickets2}</ScoreFlip>
            </RevealLine>
          </h6>
          <p className="overs-info">
            <RevealLine delay={0.12}>Overs: <ScoreFlip delay={0.16}>{formatOvers(match.overs2)}</ScoreFlip></RevealLine>
          </p>
        </div>
      </div>

      {/* Winner: underline grow + sheen on hover */}
      <p className="text-light win-line u-underline u-sheen">
        <strong>
          🏆 {match.winner === "Draw"
            ? "Match is drawn."
            : match.winner.toLowerCase().includes("won the match")
              ? match.winner
              : `${match.winner} won the match!`}
        </strong>
      </p>
    </CardFX>
  );

  const renderT20Card = (match, index) => (
    <CardFX key={`${match.match_name}-${index}`} isRecent={index === 0} paletteIndex={index + 2}>
      <h5 className="text-white"><TitleStagger text={match.match_name} /></h5>
      <div className="d-flex justify-content-between align-items-center mb-2">
        <div>
          <h6 className="mb-1">
            <RevealLine delay={0.05}>
              {getFlag(match.team1)} <strong>{match.team1?.toUpperCase()}</strong>{" "}
              <ScoreFlip delay={0.08}>{match.runs1}/{match.wickets1}</ScoreFlip>
            </RevealLine>
          </h6>
          <p className="overs-info">
            <RevealLine delay={0.12}>Overs: <ScoreFlip delay={0.16}>{formatOvers(match.overs1)}</ScoreFlip></RevealLine>
          </p>
        </div>
        <div>
          <h6 className="mb-1">
            <RevealLine delay={0.05}>
              {getFlag(match.team2)} <strong>{match.team2?.toUpperCase()}</strong>{" "}
              <ScoreFlip delay={0.08}>{match.runs2}/{match.wickets2}</ScoreFlip>
            </RevealLine>
          </h6>
          <p className="overs-info">
            <RevealLine delay={0.12}>Overs: <ScoreFlip delay={0.16}>{formatOvers(match.overs2)}</ScoreFlip></RevealLine>
          </p>
        </div>
      </div>
      <p className="text-light win-line u-underline u-sheen">
        <strong>
          🏆 {match.winner === "Draw"
            ? "Match is drawn."
            : match.winner.toLowerCase().includes("won the match")
              ? match.winner
              : `${match.winner} won the match!`}
        </strong>
      </p>
    </CardFX>
  );

  const renderTestCard = (match, index) => (
    <CardFX key={`${match.match_name}-${index}`} isRecent={index === 0} paletteIndex={index + 4}>
      <h5 className="text-white"><TitleStagger text={(match.match_name || "").toUpperCase()} /></h5>

      <div>
        <h6 className="text-info">
          <RevealLine delay={0.05}>
            {getFlag(match.team1)} {match.team1?.toUpperCase()}
          </RevealLine>
        </h6>
        <p className="overs-info mb-1">
          <RevealLine delay={0.08}>
            1st Innings: <ScoreFlip delay={0.12}>{match.runs1}/{match.wickets1}</ScoreFlip>
            {" "}(<ScoreFlip delay={0.16}>{formatOvers(match.overs1)}</ScoreFlip> ov)
          </RevealLine>
        </p>
        <p className="overs-info mb-1">
          <RevealLine delay={0.1}>
            2nd Innings: <ScoreFlip delay={0.14}>{match.runs1_2}/{match.wickets1_2}</ScoreFlip>
            {" "}(<ScoreFlip delay={0.18}>{formatOvers(match.overs1_2)}</ScoreFlip> ov)
          </RevealLine>
        </p>
      </div>

      <div className="mt-2">
        <h6 className="text-info">
          <RevealLine delay={0.05}>
            {getFlag(match.team2)} {match.team2?.toUpperCase()}
          </RevealLine>
        </h6>
        <p className="overs-info mb-1">
          <RevealLine delay={0.08}>
            1st Innings: <ScoreFlip delay={0.12}>{match.runs2}/{match.wickets2}</ScoreFlip>
            {" "}(<ScoreFlip delay={0.16}>{formatOvers(match.overs2)}</ScoreFlip> ov)
          </RevealLine>
        </p>
        <p className="overs-info mb-1">
          <RevealLine delay={0.1}>
            2nd Innings: <ScoreFlip delay={0.14}>{match.runs2_2}/{match.wickets2_2}</ScoreFlip>
            {" "}(<ScoreFlip delay={0.18}>{formatOvers(match.overs2_2)}</ScoreFlip> ov)
          </RevealLine>
        </p>
      </div>

      <p className="text-light mt-2 win-line u-underline u-sheen">
        <strong>
          🏆 {match.winner === "Draw"
            ? "Match is drawn."
            : match.winner.toLowerCase().includes("won the match")
              ? match.winner
              : `${match.winner} won the match!`}
        </strong>
      </p>
    </CardFX>
  );

  /* ----- Data filters ----- */
  const odiMatches = matches.filter((m) => m.match_type === "ODI");
  const t20Matches = matches.filter((m) => m.match_type === "T20");

  return (
    <motion.div className="container mt-4" variants={pageVariants} initial="hidden" animate="show">
      <div className="toggle-buttons">
        <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.98 }}
          className={`btn btn-warning ${showOdi ? "active" : ""}`}
          onClick={() => { setShowOdi(true); setShowT20(false); setShowTest(false); }}>
          🏏 ODI Matches {showOdi ? "▼" : ""}
        </motion.button>

        <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.98 }}
          className={`btn btn-danger ${showT20 ? "active" : ""}`}
          onClick={() => { setShowT20(true); setShowOdi(false); setShowTest(false); }}>
          🔥 T20 Matches {showT20 ? "▼" : ""}
        </motion.button>

        <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.98 }}
          className={`btn btn-info ${showTest ? "active" : ""}`}
          onClick={() => { setShowTest(true); setShowOdi(false); setShowT20(false); }}>
          🧪 Test Matches {showTest ? "▼" : ""}
        </motion.button>
      </div>

      {/* ODI */}
      <AnimatePresence mode="wait">
        {showOdi && (
          <motion.div key="odi-list" initial="hidden" animate="show" exit={{ opacity: 0, y: -20 }} variants={listVariants}>
            <h3 className="text-light mb-3">ODI Matches</h3>
            <div className="row g-4">
              {odiMatches.length === 0 ? (
                <p className="text-white">No ODI matches available.</p>
              ) : (
                odiMatches.map((match, index) => (
                  <div key={index} className="col-md-6 col-lg-4 d-flex">
                    <div className="w-100 h-100">{renderODICard(match, index)}</div>
                  </div>
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* T20 */}
      <AnimatePresence mode="wait">
        {showT20 && (
          <motion.div key="t20-list" initial="hidden" animate="show" exit={{ opacity: 0, y: -20 }} variants={listVariants}>
            <h3 className="text-light mt-5 mb-3">T20 Matches</h3>
            <div className="row g-4">
              {t20Matches.length === 0 ? (
                <p className="text-white">No T20 matches available.</p>
              ) : (
                t20Matches.map((match, index) => (
                  <div key={index} className="col-md-6 col-lg-4 d-flex">
                    <div className="w-100 h-100">{renderT20Card(match, index)}</div>
                  </div>
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Test */}
      <AnimatePresence mode="wait">
        {showTest && (
          <motion.div key="test-list" initial="hidden" animate="show" exit={{ opacity: 0, y: -20 }} variants={listVariants}>
            <h3 className="text-light mt-5 mb-3">Test Matches</h3>
            <div className="row g-4">
              {testMatches.length === 0 ? (
                <p className="text-white">No Test matches available.</p>
              ) : (
                testMatches.map((match, index) => (
                  <div key={index} className="col-md-6 col-lg-4 d-flex">
                    <div className="w-100 h-100">{renderTestCard(match, index)}</div>
                  </div>
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default MatchCards;
