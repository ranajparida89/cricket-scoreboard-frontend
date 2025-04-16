// ✅ src/components/MatchTicker.js
// ✅ [Ranaj Parida - 2025-04-19 | Auto-Match Switcher Carousel]
// ✅ Live news-style ticker that auto-switches latest results

import React, { useEffect, useState } from "react";
import { getMatchHistory, getTestMatches } from "../services/api";
import "./MatchTicker.css"; // ✅ Ticker styles

const MatchTicker = () => {
  const [messages, setMessages] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  // ✅ Rotate text every 5 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % messages.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [messages]);

  // ✅ Fetch all match results (ODI + T20 + Test)
  useEffect(() => {
    const loadMatches = async () => {
      try {
        const res = await getMatchHistory();
        const test = await getTestMatches();

        const format = (m) => {
          const name = m.match_name || "Unnamed";
          const type = m.match_type || "Match";
          return m.winner === "Draw"
            ? `🤝 ${m.team1} drew vs ${m.team2} in ${type}`
            : `🏆 ${m.winner} won vs ${m.winner === m.team1 ? m.team2 : m.team1} in ${type}`;
        };

        const formatted = [...res, ...test]
          .sort((a, b) => new Date(b.match_time) - new Date(a.match_time))
          .map(format);

        setMessages(formatted);
      } catch (err) {
        console.error("❌ Failed to load ticker data:", err.message);
      }
    };

    loadMatches();
  }, []);

  if (!messages.length) return null;

  return (
    <div className="ticker-wrapper">
      <div className="ticker-content">
        <span className="ticker-item">{messages[currentIndex]}</span>
      </div>
    </div>
  );
};

export default MatchTicker;
