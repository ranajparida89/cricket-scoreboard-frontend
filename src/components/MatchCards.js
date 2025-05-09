// src/components/MatchCards.js
import React, { useEffect, useState } from "react";
import { getMatchHistory, getTeams, getTestMatches } from "../services/api"; // ✅ new
import "./MatchCards.css";

const formatOvers = (decimalOvers) => {
  const fullOvers = Math.floor(decimalOvers);
  const balls = Math.round((decimalOvers - fullOvers) * 6);
  return `${fullOvers}.${balls}`;
};

const MatchCards = () => {
  const [matches, setMatches] = useState([]);
  const [testMatches, setTestMatches] = useState([]); // ✅ new
  const [teams, setTeams] = useState([]);
  const [showOdi, setShowOdi] = useState(true);
  const [showT20, setShowT20] = useState(false);
  const [showTest, setShowTest] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const matchRes = await getMatchHistory();
        const testRes = await getTestMatches(); // ✅ new
        const teamRes = await getTeams();

        if (Array.isArray(matchRes)) setMatches(matchRes);
        if (Array.isArray(testRes)) setTestMatches(testRes); // ✅ new
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

  // ✅ [UPDATED: Added live badge on latest match]
  const renderMatchCard = (match, index) => (
    <div className="match-card mb-4" key={index}>
      {/* ✅ LIVE PULSE BADGE only for first/latest match */}
      {index === 0 && <div className="live-badge">🟢 Recent</div>}

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

      {/* ✅ [FIXED - Ranaj 2025-04-19] Prevent duplicate "won the match!" in winner string */}
      <p className="text-light">
        <strong>
          🏆 {match.winner === "Draw"
            ? "Match is drawn."
            : match.winner.toLowerCase().includes("won the match")
              ? match.winner
              : `${match.winner} won the match!`}
        </strong>
      </p>
    </div>
  );

  const renderTestMatchCard = (match, index) => (
    <div className="match-card mb-4" key={index}>
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

      {/* ✅ [FIXED - Ranaj 2025-04-19] Avoid duplicate win text in Test match cards */}
      <p className="text-light mt-2">
        <strong>
          🏆 {match.winner === "Draw"
            ? "Match is drawn."
            : match.winner.toLowerCase().includes("won the match")
              ? match.winner
              : `${match.winner} won the match!`}
        </strong>
      </p>
    </div>
  );

  const odiMatches = matches.filter((m) => m.match_type === "ODI");
  const t20Matches = matches.filter((m) => m.match_type === "T20");

  return (
    <div className="container mt-4">
      <div className="toggle-buttons">
        <button className={`btn btn-warning ${showOdi ? "active" : ""}`} onClick={() => {
          setShowOdi(true); setShowT20(false); setShowTest(false);
        }}>🏏 ODI Matches {showOdi ? "▼" : ""}</button>

        <button className={`btn btn-danger ${showT20 ? "active" : ""}`} onClick={() => {
          setShowT20(true); setShowOdi(false); setShowTest(false);
        }}>🔥 T20 Matches {showT20 ? "▼" : ""}</button>

        <button className={`btn btn-info ${showTest ? "active" : ""}`} onClick={() => {
          setShowTest(true); setShowOdi(false); setShowT20(false);
        }}>🧪 Test Matches {showTest ? "▼" : ""}</button>
      </div>

      {/* ✅ ODI */}
      {showOdi && (
        <>
          <h3 className="text-light mb-3">ODI Matches</h3>
          <div className="transparent-card">
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
          </div>
        </>
      )}

      {/* ✅ T20 */}
      {showT20 && (
        <>
          <h3 className="text-light mt-5 mb-3">T20 Matches</h3>
          <div className="transparent-card">
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
          </div>
        </>
      )}

      {/* ✅ Test Matches */}
      {showTest && (
        <>
          <h3 className="text-light mt-5 mb-3">Test Matches</h3>
          <div className="transparent-card">
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
          </div>
        </>
      )}
    </div>
  );
};

export default MatchCards;
