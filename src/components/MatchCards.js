// src/components/MatchCards.js
import React, { useEffect, useState } from "react";
import { getMatchHistory } from "../services/api";  // ✅ Use centralized API
import "./MatchCards.css";

const MatchCards = () => {
  const [matches, setMatches] = useState([]);
  const [showOdi, setShowOdi] = useState(true);   // ✅ Show ODI initially
  const [showT20, setShowT20] = useState(false);  // ✅ Hide T20 initially

  useEffect(() => {
    const fetchMatches = async () => {
      try {
        const res = await getMatchHistory();  // ✅ Using central API
        console.log("✅ Received match data:", res);  // ✅ Debug log

        if (Array.isArray(res)) {
          setMatches(res);
        } else {
          console.error("❌ Invalid match data format");
        }
      } catch (err) {
        console.error("❌ Error fetching matches:", err);
      }
    };

    fetchMatches();
  }, []);

  const getFlag = (teamName) => {
    const normalized = teamName?.trim().toLowerCase();
    const flags = {
      india: "🇮🇳", australia: "🇦🇺", england: "🏴",
      "new zealand": "🇳🇿", pakistan: "🇵🇰", "south africa": "🇿🇦",
      "sri lanka": "🇱🇰", ireland: "🇮🇪", kenya: "🇰🇪", namibia: "🇳🇦",
      bangladesh: "🇧🇩", afghanistan: "🇦🇫", zimbabwe: "🇿🇼", 
      "west indies": "🏴‍☠️", usa: "🇺🇸", uae: "🇦🇪", oman: "🇴🇲", 
      scotland: "🏴", netherlands: "🇳🇱", nepal: "🇳🇵",
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

  const odiMatches = matches.filter((m) => m.match_type === "ODI");
  const t20Matches = matches.filter((m) => m.match_type === "T20");

  return (
    <div className="container mt-4">
      {/* ✅ Toggle Buttons */}
      <div className="d-flex gap-3 mb-4">
        <button
          className={`btn btn-warning ${showOdi ? "active" : ""}`}
          onClick={() => {
            setShowOdi(true);
            setShowT20(false);
          }}
        >
          🏏 ODI Matches {showOdi ? "▼" : "▲"}
        </button>

        <button
          className={`btn btn-danger ${showT20 ? "active" : ""}`}
          onClick={() => {
            setShowOdi(false);
            setShowT20(true);
          }}
        >
          🔥 T20 Matches {showT20 ? "▼" : "▲"}
        </button>
      </div>

      {/* ✅ Render ODI Section */}
      {showOdi && (
        <>
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
        </>
      )}

      {/* ✅ Render T20 Section */}
      {showT20 && (
        <>
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
        </>
      )}
    </div>
  );
};

export default MatchCards;
