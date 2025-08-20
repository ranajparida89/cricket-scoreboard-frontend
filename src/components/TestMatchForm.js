// ✅ src/components/TestMatchForm.js
// ✅ [Ranaj Parida - 2025-04-19] Celebration: Sound + Confetti + Banner
// ✅ [2025-06-13] useAuth for user_id
// ✅ [2025-08-21] Tournament + Edition + Date + Stage (UI-only for now)

import React, { useState } from "react";
import { createMatch, submitTestMatchResult } from "../services/api";
import { playSound } from "../utils/playSound";
import Confetti from "react-confetti";
import useWindowSize from "react-use/lib/useWindowSize";
import "./MatchForm.css"; // reuse celebration styles
import "./TestMatchForm.css"; // dark+gold theme
import { useAuth } from "../services/auth";
import TournamentPicker from "./TournamentPicker";

const normalizeTeamName = (name) => {
  const mapping = {
    IND: "India", INDIA: "India",
    AUS: "Australia", AUSTRALIA: "Australia",
    ENG: "England", ENGLAND: "England",
    PAK: "Pakistan", PAKISTAN: "Pakistan",
    SA: "South Africa", "SOUTH AFRICA": "South Africa",
    NZ: "New Zealand", "NEW ZEALAND": "New Zealand",
    WI: "West Indies", "WEST INDIES": "West Indies",
    SL: "Sri Lanka", "SRI LANKA": "Sri Lanka",
    BAN: "Bangladesh", BANGLADESH: "Bangladesh",
    AFG: "Afghanistan", AFGHANISTAN: "Afghanistan",
    IRE: "Ireland", IRELAND: "Ireland",
    SCO: "Scotland", SCOTLAND: "Scotland",
    UAE: "United Arab Emirates", NEP: "Nepal"
  };
  const upper = name?.trim().toUpperCase();
  return mapping[upper] || name.trim();
};

const isValidOver = (over) => {
  const parts = over.toString().split(".");
  const balls = parts[1] ? parseInt(parts[1].padEnd(1, "0")) : 0;
  return balls <= 5;
};

const TestMatchForm = () => {
  const [matchName, setMatchName] = useState("");
  const [team1, setTeam1] = useState("");
  const [team2, setTeam2] = useState("");
  const [resultMsg, setResultMsg] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showFireworks, setShowFireworks] = useState(false);
  const [celebrationText, setCelebrationText] = useState("");
  const { width, height } = useWindowSize();

  // new: tournament state
  const [tp, setTp] = useState({
    tournamentName: "",
    seasonYear: new Date().getFullYear(),
    matchDate: new Date().toISOString().slice(0, 10),
    stage: ""
  });

  const [innings, setInnings] = useState({
    t1i1: { runs: "", overs: "", wickets: "", error: "" },
    t2i1: { runs: "", overs: "", wickets: "", error: "" },
    t1i2: { runs: "", overs: "", wickets: "", error: "" },
    t2i2: { runs: "", overs: "", wickets: "", error: "" }
  });

  const maxOvers = 450;

  const updateInning = (key, field, value) => {
    setInnings((prev) => {
      const updated = { ...prev[key], [field]: value };
      let error = "";

      const total = Object.entries(prev).reduce((acc, [k, inn]) => {
        if (k === key) return acc;
        return acc + parseFloat(inn.overs || 0);
      }, 0) + parseFloat(field === "overs" ? value : prev[key].overs || 0);

      if (field === "overs") {
        if (!isValidOver(value)) {
          error = "Overs must have balls between 0 and 5";
        } else if (total > maxOvers) {
          error = `Input overs (${total}) exceed remaining (${maxOvers})`;
        }
      }

      if (field === "wickets" && (parseInt(value) > 10 || parseInt(value) < 0)) {
        error = "Wickets must be between 0 and 10";
      }

      return { ...prev, [key]: { ...updated, error } };
    });
  };

  const totalUsedOvers = () => {
    return Object.values(innings).reduce((acc, inn) => {
      const o = parseFloat(inn.overs || 0);
      return acc + (isValidOver(o) ? o : 0);
    }, 0);
  };

  const remainingOvers = () => {
    return Math.max(0, (maxOvers - totalUsedOvers()).toFixed(1));
  };

  const calculateResult = () => {
    const t1Runs = parseInt(innings.t1i1.runs || 0) + parseInt(innings.t1i2.runs || 0);
    const t2Runs = parseInt(innings.t2i1.runs || 0) + parseInt(innings.t2i2.runs || 0);
    const t2Wickets2 = parseInt(innings.t2i2.wickets || 0);
    const usedOvers = totalUsedOvers();

    if (t2Runs > t1Runs) return { winner: normalizeTeamName(team2), points: 12 };
    if (t1Runs > t2Runs && t2Wickets2 === 10) return { winner: normalizeTeamName(team1), points: 12 };
    if (usedOvers >= maxOvers) return { winner: "Draw", points: 4 };
    return { winner: "Draw", points: 4 };
  };

  const { currentUser } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    const t1 = normalizeTeamName(team1);
    const t2 = normalizeTeamName(team2);

    if (!matchName || !t1 || !t2) return alert("❌ Fill all required fields.");
    if (!tp.tournamentName || !tp.seasonYear || !tp.matchDate) {
      return alert("❌ Please select Tournament, Match Date and Edition (Year).");
    }
    if (t1.toLowerCase() === t2.toLowerCase()) return alert("❌ Team names must be different.");

    const hasError = Object.values(innings).some((inn) => inn.error !== "");
    if (hasError) return alert("❌ Please fix validation errors before submitting.");

    try {
      setIsSubmitting(true);
      const match = await createMatch({
        match_name: matchName,
        match_type: "Test",
        tournament_name: tp.tournamentName || "",
        season_year: tp.seasonYear,
        match_date: tp.matchDate,
        stage: tp.stage || ""
      });
      const { winner, points } = calculateResult();

      const payload = {
        match_id: match.match_id,
        match_type: "Test",
        team1: t1,
        team2: t2,
        winner,
        points,
        runs1: parseInt(innings.t1i1.runs),
        overs1: parseFloat(innings.t1i1.overs),
        wickets1: parseInt(innings.t1i1.wickets),
        runs2: parseInt(innings.t2i1.runs),
        overs2: parseFloat(innings.t2i1.overs),
        wickets2: parseInt(innings.t2i1.wickets),
        runs1_2: parseInt(innings.t1i2.runs),
        overs1_2: parseFloat(innings.t1i2.overs),
        wickets1_2: parseInt(innings.t1i2.wickets),
        runs2_2: parseInt(innings.t2i2.runs),
        overs2_2: parseFloat(innings.t2i2.overs),
        wickets2_2: parseInt(innings.t2i2.wickets),
        total_overs_used: totalUsedOvers(),
        user_id: currentUser?.id,
        tournament_name: tp.tournamentName || "",
        season_year: tp.seasonYear,
        match_date: tp.matchDate,
        stage: tp.stage || ""
      };

      const result = await submitTestMatchResult(payload);

      // ✅ Celebration
      if (result.message && result.message.includes("won")) {
        const winnerTeam = result.message.split(" won")[0];
        playSound("celebration");
        setCelebrationText(`🎉 Congratulations! ${winnerTeam} won the match!`);
        setShowFireworks(true);
        setTimeout(() => {
          setShowFireworks(false);
          setCelebrationText("");
        }, 4000);
      }

      setResultMsg(result.message);
    } catch (err) {
      alert("❌ Error: " + (err?.response?.data?.error || err.message));
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderInning = (label, key) => (
    <div className="mb-2">
      <label><strong>{label}</strong></label>
      <div className="row">
        <div className="col"><input type="number" className="form-control" placeholder="Runs" value={innings[key].runs} onChange={(e) => updateInning(key, "runs", e.target.value)} /></div>
        <div className="col"><input type="text" className="form-control" placeholder="Overs" value={innings[key].overs} onChange={(e) => updateInning(key, "overs", e.target.value)} /></div>
        <div className="col"><input type="number" className="form-control" placeholder="Wickets" value={innings[key].wickets} onChange={(e) => updateInning(key, "wickets", e.target.value)} /></div>
      </div>
      {innings[key].error && <small className="text-danger">{innings[key].error}</small>}
    </div>
  );

  const isDuplicateTeam = normalizeTeamName(team1).toLowerCase() === normalizeTeamName(team2).toLowerCase();

  return (
    <div className="container mt-4">
      {showFireworks && <Confetti width={width} height={height} numberOfPieces={300} recycle={false} />}
      {celebrationText && <div className="celebration-banner">{celebrationText}</div>}

      <div className="card shadow p-4">
        <h3 className="text-center mb-4 text-success">🏏 Test Match Form</h3>
        <form onSubmit={handleSubmit}>
          <div className="mb-2"><label>Match Name:</label><input type="text" className="form-control" value={matchName} onChange={(e) => setMatchName(e.target.value)} required /></div>

          {/* 🎯 Tournament + Edition */}
          <div className="mb-3">
            <TournamentPicker matchType="Test" value={tp} onChange={setTp} allowStage={true} />
          </div>

          <div className="row mb-3">
            <div className="col">
              <label>Team 1:</label>
              <input type="text" className="form-control" value={team1} onChange={(e) => setTeam1(e.target.value)} required />
            </div>
            <div className="col">
              <label>Team 2:</label>
              <input type="text" className="form-control" value={team2} onChange={(e) => setTeam2(e.target.value)} required />
            </div>
          </div>
          {isDuplicateTeam && (
            <div className="alert alert-danger text-center py-2">❌ Team names must be different!</div>
          )}

          <div className="mb-3 row">
            <div className="col"><label>🗓️ Total Days</label><input className="form-control" value="5" disabled /></div>
            <div className="col"><label>🎯 Overs/Day</label><input className="form-control" value="90" disabled /></div>
            <div className="col"><label>🧮 Total Overs</label><input className="form-control" value={maxOvers} disabled /></div>
            <div className="col"><label>⏳ Overs Remaining</label><input className="form-control" value={remainingOvers()} disabled /></div>
          </div>

          {renderInning(`${team1 || "Team 1"} - 1st Innings`, "t1i1")}
          {renderInning(`${team2 || "Team 2"} - 1st Innings`, "t2i1")}
          {renderInning(`${team1 || "Team 1"} - 2nd Innings`, "t1i2")}
          {renderInning(`${team2 || "Team 2"} - 2nd Innings`, "t2i2")}

          <div className="d-grid mt-4">
            <button className="btn btn-success" disabled={isSubmitting || isDuplicateTeam}>
              {isSubmitting ? "Submitting..." : "Submit Test Match"}
            </button>
          </div>
        </form>

        {resultMsg && <div className="alert alert-success mt-3 text-center">{resultMsg}</div>}
      </div>
    </div>
  );
};

export default TestMatchForm;
