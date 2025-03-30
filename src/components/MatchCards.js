// src/components/MatchCards.js
import React, { useEffect, useState } from "react";
import { getMatchHistory, getTeams } from "../services/api"; // ✅ Centralized API usage
import "./MatchCards.css";

const MatchCards = () => {
  const [matches, setMatches] = useState([]);
  const [teams, setTeams] = useState([]); // ✅ Fetch from teams table
  const [showOdi, setShowOdi] = useState(true);
  const [showT20, setShowT20] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const matchRes = await getMatchHistory();
        const teamRes = await getTeams(); // ✅ Includes NRR data

        console.log("✅ Match History:", matchRes);
        console.log("✅ Team List (NRR):", teamRes);

        if (Array.isArray(matchRes)) setMatches(matchRes);
        if (Array.isArray(teamRes)) setTeams(teamRes);
      } catch (err) {
        console.error("❌ Error fetching data:", err);
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

  // ✅ Fetch correct team NRR
  const getTeamNRR = (teamName) => {
    const team = teams.find((t) => t.team_name === teamName);
    return team?.nrr?.toFixed(2) || "N/A";
  };

  const renderMatchCard = (match, index) => (
    <div className="match-card mb-4" key={index}>
      <h5 className="text-white">{match.match_name}</h5>
      <div className="d-flex justify-content-between align-items-center mb-2">
        <div>
          <h6 className="mb-1">
            {getFlag(match.team1)} <strong>{match.team1?.toUpperCase()}</strong> {match.runs1}/{match.wickets1}
          </h6>
          <p className="overs-info">Overs: {match.overs1}</p>
        </div>
        <div>
          <h6 className="mb-1">
            {getFlag(match.team2)} <strong>{match.team2?.toUpperCase()}</strong> {match.runs2}/{match.wickets2}
          </h6>
          <p className="overs-info">Overs: {match.overs2}</p>
        </div>
      </div>
      <p className="text-light"><strong>🏆 {match.winner}</strong></p>

      {/* ✅ Display NRR from teams table */}
      <div className="nrr-info">
        NRR: {getTeamNRR(match.team1)} – {getTeamNRR(match.team2)}
      </div>
    </div>
  );

  const odiMatches = matches.filter((m) => m.match_type === "ODI");
  const t20Matches = matches.filter((m) => m.match_type === "T20");

  return (
    <div className="container mt-4">
      {/* ✅ Toggle Buttons */}
      <div className="toggle-buttons">
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

      {/* ✅ ODI Matches */}
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

      {/* ✅ T20 Matches */}
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
