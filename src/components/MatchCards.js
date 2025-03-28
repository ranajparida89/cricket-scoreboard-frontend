// src/components/MatchCards.js
import React, { useEffect, useState } from "react";
import axios from "axios";
import "./MatchCards.css"; // ✅ This is the import you need for styles

const MatchCards = () => {
  const [matches, setMatches] = useState([]);

  useEffect(() => {
    const fetchMatches = async () => {
      try {
        const res = await axios.get("/api/match-history");
        setMatches(res.data);
      } catch (err) {
        console.error("Error fetching matches:", err);
      }
    };

    fetchMatches();
  }, []);

  const getFlag = (teamName) => {
    const flags = {
      India: "🇮🇳",
      Australia: "🇦🇺",
      England: "🏴",
      "New Zealand": "🇳🇿",
      Pakistan: "🇵🇰",
      "South Africa": "🇿🇦",
      SriLanka: "🇱🇰",
      Ireland: "🇮🇪",
      Kenya: "🇰🇪",
    };
    return flags[teamName] || "🏳️";
  };

  const renderMatchCard = (match, index) => (
    <div className="match-card mb-4" key={index}>
      <h5 className="text-white">{match.match_name}</h5>
      <div className="d-flex justify-content-between align-items-center mb-2">
        <div>
          <h6 className="mb-1">
            {getFlag(match.team1)} <strong>{match.team1.toUpperCase()}</strong> {match.runs1}/{match.wickets1}
          </h6>
          <p className="text-muted">Overs: {match.overs1}</p>
        </div>
        <div>
          <h6 className="mb-1">
            {getFlag(match.team2)} <strong>{match.team2.toUpperCase()}</strong> {match.runs2}/{match.wickets2}
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

  return (
    <div className="container mt-4">
      <h3 className="text-light mb-4">🏏 ODI Matches</h3>
      <div className="row">
        {matches.length === 0 ? (
          <p className="text-white">No match data available.</p>
        ) : (
          matches.map((match, index) => (
            <div key={index} className="col-md-6 col-lg-4">
              {renderMatchCard(match, index)}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default MatchCards;
