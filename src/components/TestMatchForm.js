// src/components/TestMatchForm.js
import React, { useState } from "react";
import axios from "axios";
import { createMatch } from "../services/api";

const API_URL = "https://cricket-scoreboard-backend.onrender.com/api";

const normalizeTeamName = (name) => {
  return name ? name.trim().toUpperCase() : "";
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

      if (field === "overs" && (parseFloat(value) > maxOvers || !isValidOver(value))) {
        error = "Invalid overs (max 450, balls ≤ 5)";
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

    if (t2Runs > t1Runs) return { winner: team2, points: 12 };
    if (t1Runs > t2Runs && t2Wickets2 === 10) return { winner: team1, points: 12 };
    if (usedOvers >= maxOvers) return { winner: "Draw", points: 4 };
    return { winner: "Draw", points: 4 };
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const t1 = normalizeTeamName(team1);
    const t2 = normalizeTeamName(team2);

    if (!matchName || !t1 || !t2) {
      alert("❌ Fill all required fields.");
      return;
    }

    if (t1 === t2) {
      alert("❌ Team names must be different.");
      return;
    }

    const hasError = Object.values(innings).some((inn) => inn.error !== "");
    if (hasError) {
      alert("❌ Please fix validation errors before submitting.");
      return;
    }

    try {
      setIsSubmitting(true);

      const match = await createMatch({ match_name: matchName, match_type: "Test" });
      const { winner, points } = calculateResult();

      const payload = {
        match_id: match.match_id,
        match_type: "Test",
        team1: t1,
        team2: t2,
        winner,
        points,
        runs1: parseInt(innings.t1i1.runs),
        overs1: innings.t1i1.overs,
        wickets1: parseInt(innings.t1i1.wickets),
        runs2: parseInt(innings.t2i1.runs),
        overs2: innings.t2i1.overs,
        wickets2: parseInt(innings.t2i1.wickets),
        runs1_2: parseInt(innings.t1i2.runs),
        overs1_2: innings.t1i2.overs,
        wickets1_2: parseInt(innings.t1i2.wickets),
        runs2_2: parseInt(innings.t2i2.runs),
        overs2_2: innings.t2i2.overs,
        wickets2_2: parseInt(innings.t2i2.wickets),
        total_overs_used: totalUsedOvers()
      };

      // ✅ Correct endpoint for test match
      const result = await axios.post(`${API_URL}/test-match`, payload);
      setResultMsg(result.data.message);
    } catch (err) {
      alert("❌ Error: " + err.message);
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

  return (
    <div className="container mt-4">
      <div className="card shadow p-4">
        <h3 className="text-center mb-4 text-success">🏏 Test Match Form</h3>
        <form onSubmit={handleSubmit}>
          <div className="mb-2"><label>Match Name:</label><input type="text" className="form-control" value={matchName} onChange={(e) => setMatchName(e.target.value)} required /></div>
          <div className="row mb-3">
            <div className="col"><label>Team 1:</label><input type="text" className="form-control" value={team1} onChange={(e) => setTeam1(e.target.value)} required /></div>
            <div className="col"><label>Team 2:</label><input type="text" className="form-control" value={team2} onChange={(e) => setTeam2(e.target.value)} required /></div>
          </div>

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
            <button className="btn btn-success" disabled={isSubmitting}>
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
