// src/components/MatchCards.js
import React, { useEffect, useState } from "react";
import axios from "axios";
import "./MatchCards.css";

const MatchCards = () => {
  const [matches, setMatches] = useState([]);
  const [showODI, setShowODI] = useState(false);
  const [showT20, setShowT20] = useState(false);

  useEffect(() => {
    const fetchMatches = async () => {
      try {
        const res = await axios.get("/api/match-history");
        if (Array.isArray(res.data)) {
          setMatches(res.data);
        } else {
          console.error("Invalid match data format");
        }
      } catch (err) {
        console.error("Error fetching matches:", err);
      }
    };
    fetchMatches();
  }, []);

  const getFlag = (teamName) => {
    const normalized = teamName?.trim().toLowerCase();
    const flags = {
      india: "🇮🇳", australia: "🇦🇺", england: "🏴", "new zealand": "🇳🇿",
      pakistan: "🇵🇰", "south africa": "🇿🇦", "sri lanka": "🇱🇰",
      ireland: "🇮🇪", kenya: "🇰🇪", namibia: "🇳🇦", bangladesh: "🇧🇩",
      afghanistan: "🇦🇫", zimbabwe: "🇿🇼", "west indies": "🏴‍☠️",
      usa: "🇺🇸", uae: "🇦🇪", oman: "🇴🇲", scotland: "🏴",
      netherlands: "🇳🇱", nepal: "🇳🇵",
    };
    return flags[normalized] || "🏳️";
  };

  const renderMatchCard = (match, index) => (
    <div className="match-card mb-4" key={index}>
      <h5 className="text-white">{match.match_name}</h5>
      <div className="d-flex justify-content-between align-items-center mb-2">
        <div>
          <h6 className="mb-1">
            {getFlag(match.team1)} <strong>{match.team1?.toUpperCase()}</strong> {match.runs1}/{match.wickets1}
          </h6>
          <p className="text-muted">Overs: {match.overs1}</p>
        </div>
        <div>
          <h6 className="mb-1">
            {getFlag(match.team2)} <strong>{match.team2?.toUpperCase()}</strong> {match.runs2}/{match.wickets2}
          </h6>
          <p className="text-muted">Overs: {match.overs2}</p>
        </div>
      </div>
      <p className="text-light">
        <strong>🏆 {match.winner}</strong>
      </p>
      <div className="nrr-info small text-secondary">
        NRR: {match.runs1}/{match.overs1} – {match.runs2}/{match.overs2}
      </div>
    </div>
  );

  const odiMatches = matches.filter((m) => m.match_type?.toLowerCase() === "odi");
  const t20Matches = matches.filter((m) => m.match_type?.toLowerCase() === "t20");

  return (
    <div className="container mt-4">
      {/* 🏏 ODI Toggle Button */}
      <button
        className="btn btn-outline-warning mb-3"
        onClick={() => setShowODI(!showODI)}
      >
        🏏 ODI Matches {showODI ? "▲" : "▼"}
      </button>
      {showODI && (
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
      )}

      {/* 🔥 T20 Toggle Button */}
      <button
        className="btn btn-outline-danger mb-3 mt-4"
        onClick={() => setShowT20(!showT20)}
      >
        🔥 T20 Matches {showT20 ? "▲" : "▼"}
      </button>
      {showT20 && (
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
      )}
    </div>
  );
};

export default MatchCards;
