// src/components/MatchCards.js
import React, { useEffect, useState } from "react";
import { getMatchHistory, getTeams, getTestMatches } from "../services/api";
import { motion, AnimatePresence } from "framer-motion"; // ✅ NEW
import "./MatchCards.css";

const formatOvers = (decimalOvers) => {
  const fullOvers = Math.floor(decimalOvers);
  const balls = Math.round((decimalOvers - fullOvers) * 6);
  return `${fullOvers}.${balls}`;
};

// ✅ Variants
const pageVariants = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.45, ease: "easeOut" } },
};
const listVariants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08, delayChildren: 0.05 } },
};
const cardVariants = {
  hidden: { opacity: 0, y: 26, scale: 0.98 },
  show: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.4 } },
  exit: { opacity: 0, y: -16, transition: { duration: 0.25 } },
};

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

  // ✅ Card renderers with motion wrappers
  const renderMatchCard = (match, index) => (
    <motion.div
      className="match-card mb-4"
      key={`${match.match_name}-${index}`}
      variants={cardVariants}
      whileHover={{ translateY: -3 }}
      transition={{ type: "spring", stiffness: 220, damping: 18 }}
    >
      {/* ✅ LIVE PULSE BADGE only for first/latest match */}
      {index === 0 && (
        <motion.div
          className="live-badge"
          animate={{ scale: [1, 1.12, 1], boxShadow: ["0 0 0px #00ffcc55", "0 0 14px #00ffccaa", "0 0 0px #00ffcc55"] }}
          transition={{ repeat: Infinity, duration: 1.6 }}
        >
          🟢 Recent
        </motion.div>
      )}

      <h5 className="text-white">{match.match_name}</h5>
      <div className="d-flex justify-content-between align-items-center mb-2">
        <div>
          <h6 className="mb-1">
            {getFlag(match.team1)} <strong>{match.team1?.toUpperCase()}</strong> {match.runs1}/{match.wickets1}
          </h6>
          <p className="overs-info">Overs: {formatOvers(match.overs1)}</p>
        </div>
        <div>
          <h6 className="mb-1">
            {getFlag(match.team2)} <strong>{match.team2?.toUpperCase()}</strong> {match.runs2}/{match.wickets2}
          </h6>
          <p className="overs-info">Overs: {formatOvers(match.overs2)}</p>
        </div>
      </div>

      <p className="text-light">
        <strong>
          🏆 {match.winner === "Draw"
            ? "Match is drawn."
            : match.winner.toLowerCase().includes("won the match")
              ? match.winner
              : `${match.winner} won the match!`}
        </strong>
      </p>
    </motion.div>
  );

  const renderTestMatchCard = (match, index) => (
    <motion.div
      className="match-card mb-4"
      key={`${match.match_name}-${index}`}
      variants={cardVariants}
      whileHover={{ translateY: -3 }}
      transition={{ type: "spring", stiffness: 220, damping: 18 }}
    >
      <h5 className="text-white">{match.match_name?.toUpperCase()}</h5>
      <div>
        <h6 className="text-info">{getFlag(match.team1)} {match.team1?.toUpperCase()}</h6>
        <p className="overs-info mb-1">1st Innings: {match.runs1}/{match.wickets1} ({formatOvers(match.overs1)} ov)</p>
        <p className="overs-info mb-1">2nd Innings: {match.runs1_2}/{match.wickets1_2} ({formatOvers(match.overs1_2)} ov)</p>
      </div>
      <div>
        <h6 className="text-info">{getFlag(match.team2)} {match.team2?.toUpperCase()}</h6>
        <p className="overs-info mb-1">1st Innings: {match.runs2}/{match.wickets2} ({formatOvers(match.overs2)} ov)</p>
        <p className="overs-info mb-1">2nd Innings: {match.runs2_2}/{match.wickets2_2} ({formatOvers(match.overs2_2)} ov)</p>
      </div>

      <p className="text-light mt-2">
        <strong>
          🏆 {match.winner === "Draw"
            ? "Match is drawn."
            : match.winner.toLowerCase().includes("won the match")
              ? match.winner
              : `${match.winner} won the match!`}
        </strong>
      </p>
    </motion.div>
  );

  const odiMatches = matches.filter((m) => m.match_type === "ODI");
  const t20Matches = matches.filter((m) => m.match_type === "T20");

  return (
    <motion.div
      className="container mt-4"
      variants={pageVariants}
      initial="hidden"
      animate="show"
    >
      <div className="toggle-buttons">
        <motion.button
          whileHover={{ scale: 1.04 }}
          whileTap={{ scale: 0.98 }}
          className={`btn btn-warning ${showOdi ? "active" : ""}`}
          onClick={() => { setShowOdi(true); setShowT20(false); setShowTest(false); }}
        >
          🏏 ODI Matches {showOdi ? "▼" : ""}
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.04 }}
          whileTap={{ scale: 0.98 }}
          className={`btn btn-danger ${showT20 ? "active" : ""}`}
          onClick={() => { setShowT20(true); setShowOdi(false); setShowTest(false); }}
        >
          🔥 T20 Matches {showT20 ? "▼" : ""}
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.04 }}
          whileTap={{ scale: 0.98 }}
          className={`btn btn-info ${showTest ? "active" : ""}`}
          onClick={() => { setShowTest(true); setShowOdi(false); setShowT20(false); }}
        >
          🧪 Test Matches {showTest ? "▼" : ""}
        </motion.button>
      </div>

      {/* ✅ ODI */}
      <AnimatePresence mode="wait">
        {showOdi && (
          <motion.div
            key="odi-list"
            initial="hidden"
            animate="show"
            exit={{ opacity: 0, y: -20 }}
            variants={listVariants}
          >
            <h3 className="text-light mb-3">ODI Matches</h3>
            <div className="row">
              {odiMatches.length === 0 ? (
                <p className="text-white">No ODI matches available.</p>
              ) : (
                odiMatches.map((match, index) => (
                  <div key={index} className="col-md-6 col-lg-4">
                    {renderMatchCard(match, index)}
                  </div>
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ✅ T20 */}
      <AnimatePresence mode="wait">
        {showT20 && (
          <motion.div
            key="t20-list"
            initial="hidden"
            animate="show"
            exit={{ opacity: 0, y: -20 }}
            variants={listVariants}
          >
            <h3 className="text-light mt-5 mb-3">T20 Matches</h3>
            <div className="row">
              {t20Matches.length === 0 ? (
                <p className="text-white">No T20 matches available.</p>
              ) : (
                t20Matches.map((match, index) => (
                  <div key={index} className="col-md-6 col-lg-4">
                    {renderMatchCard(match, index)}
                  </div>
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ✅ Test Matches */}
      <AnimatePresence mode="wait">
        {showTest && (
          <motion.div
            key="test-list"
            initial="hidden"
            animate="show"
            exit={{ opacity: 0, y: -20 }}
            variants={listVariants}
          >
            <h3 className="text-light mt-5 mb-3">Test Matches</h3>
            <div className="row">
              {testMatches.length === 0 ? (
                <p className="text-white">No Test matches available.</p>
              ) : (
                testMatches.map((match, index) => (
                  <div key={index} className="col-md-6 col-lg-4">
                    {renderTestMatchCard(match, index)}
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
