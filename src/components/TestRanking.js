// ✅ src/components/TestRanking.js
// Ranaj Parida — 2025-04-21
// Polished glassmorphism UI + framer-motion row animations + rating bars

import React, { useEffect, useState, useMemo } from "react";
import { motion } from "framer-motion";
import { getTestRankings } from "../services/api";
import "./TeamRanking.css";

// Map team → flag
const flagMap = {
  india: "🇮🇳", australia: "🇦🇺", england: "🏴", "new zealand": "🇳🇿",
  pakistan: "🇵🇰", "south africa": "🇿🇦", "sri lanka": "🇱🇰", ireland: "🇮🇪",
  kenya: "🇰🇪", namibia: "🇳🇦", bangladesh: "🇧🇩", afghanistan: "🇦🇫",
  zimbabwe: "🇿🇼", "west indies": "🏴‍☠️", usa: "🇺🇸", uae: "🇦🇪",
  oman: "🇴🇲", scotland: "🏴", netherlands: "🇳🇱", nepal: "🇳🇵",
};

const listVariants = {
  hidden: { opacity: 0, y: 16 },
  show: {
    opacity: 1, y: 0,
    transition: { duration: 0.45, ease: "easeOut", staggerChildren: 0.06, delayChildren: 0.05 },
  },
};

const rowVariants = {
  hidden: { opacity: 0, y: 14 },
  show:   { opacity: 1, y: 0, transition: { duration: 0.28 } },
};

const TestRanking = () => {
  const [testRankings, setTestRankings] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch rankings
  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await getTestRankings();
        const valid = (Array.isArray(data) ? data : []).filter(
          (t) => t && t.team_name && t.points != null && t.rating != null
        );
        const sorted = valid.sort((a, b) => b.points - a.points);
        setTestRankings(sorted);
      } catch (err) {
        console.error("❌ Failed to load Test Rankings:", err?.message || err);
        setTestRankings([]);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Helpful metadata
  const maxRating = useMemo(() => {
    const max = Math.max(120, ...testRankings.map((t) => +t.rating || 0));
    return Math.min(140, Math.max(100, max)); // clamp to a nice range
  }, [testRankings]);

  const medal = (i) =>
    i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : "";

  const rowClass = (i) =>
    i === 0 ? "tr-row gold" : i === 1 ? "tr-row silver" : i === 2 ? "tr-row bronze" : "tr-row";

  return (
    <div className="tr-wrap">
      <div className="tr-orbs" aria-hidden>
        <span className="orb o1" />
        <span className="orb o2" />
      </div>

      <motion.div
        className="tr-card"
        variants={listVariants}
        initial="hidden"
        animate="show"
      >
        <div className="tr-header">
          <h2 className="tr-title">World Test Match Team Rankings</h2>
          <p className="tr-sub">Live ICC table • auto-updated</p>
        </div>

        <div className="tr-table">
          <div className="tr-thead">
            <div className="th rank">Rank</div>
            <div className="th team">Team</div>
            <div className="th matches">Matches</div>
            <div className="th points">Points</div>
            <div className="th rating">Rating</div>
          </div>

          <div className="tr-tbody">
            {loading && (
              <>
                <div className="skeleton-row" />
                <div className="skeleton-row" />
                <div className="skeleton-row" />
              </>
            )}

            {!loading && testRankings.length === 0 && (
              <div className="tr-empty">No Test match ranking data available.</div>
            )}

            {!loading &&
              testRankings.map((t, i) => {
                const flag = flagMap[t.team_name?.toLowerCase()] || "🏳️";
                const pct = Math.round((Math.min(maxRating, +t.rating) / maxRating) * 100);

                return (
                  <motion.div key={`${t.team_name}-${i}`} className={rowClass(i)} variants={rowVariants}>
                    <div className="td rank">
                      <span className="medal">{medal(i)}</span>
                      <span className="pos">{i + 1}</span>
                    </div>

                    <div className="td team">
                      <span className="flag">{flag}</span>
                      <span className="name">{t.team_name}</span>
                    </div>

                    <div className="td matches">{t.matches}</div>
                    <div className="td points">{t.points}</div>

                    <div className="td rating">
                      <div className="rating-wrap">
                        <div className="rating-track" />
                        <div
                          className={`rating-bar ${i === 0 ? "g" : i === 1 ? "s" : i === 2 ? "b" : ""}`}
                          style={{ width: `${pct}%` }}
                        />
                        <span className="rating-num">{t.rating}</span>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default TestRanking;
