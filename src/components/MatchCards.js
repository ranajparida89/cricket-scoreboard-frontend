// src/components/MatchCards.js
import React, { useEffect, useState } from "react";
import axios from "axios";
import "./MatchCards.css";

const MatchCards = () => {
  const [matches, setMatches] = useState([]);
  const [showODI, setShowODI] = useState(true);
  const [showT20, setShowT20] = useState(true);

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
      pakistan: "🇵🇰", "south africa": "🇿🇦", "sri lanka": "🇱🇰", ireland: "🇮🇪",
      kenya: "🇰🇪", namibia: "🇳🇦", bangladesh: "🇧🇩", afghanistan: "🇦🇫",
      zimbabwe: "🇿🇼", "west indies": "🏴‍☠️", usa: "🇺🇸", uae: "🇦🇪",
      oman: "🇴🇲", scotland: "🏴", netherlands: "🇳🇱", nepal: "🇳🇵"
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
      {/* ✅ Toggle Buttons with Flex Alignment */}
      <div className="d-flex gap-3 mb-4">
        <button
          className={`btn ${showODI ? "btn-warning" : "btn-outline-warning"}`}
          onClick={() => setShowODI(!showODI)}
        >
          🏏 ODI Matches {showODI ? "▼" : "▲"}
        </button>
        <button
          className={`btn ${showT20 ? "btn-danger" : "btn-outline-danger"}`}
          onClick={() => setShowT20(!showT20)}
        >
          🔥 T20 Matches {showT20 ? "▼" : "▲"}
        </button>
      </div>

      {/* ✅ ODI Section */}
      {showODI && (
        <>
          <h4 className="text-light mb-2">ODI Matches</h4>
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
        </>
      )}

      {/* ✅ T20 Section */}
      {showT20 && (
        <>
          <h4 className="text-light mt-4 mb-2">T20 Matches</h4>
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
        </>
      )}
    </div>
  );
};

export default MatchCards;
