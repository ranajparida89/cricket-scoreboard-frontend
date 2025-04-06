// ✅ Updated MatchForm.js with real-time overs validation + path fix
import React, { useState } from "react";
import { createMatch, submitMatchResult } from "../services/api.js"; // 🔧 Fixed path (added .js)

const TEAM_MAP = {
  AFG: "Afghanistan", AUS: "Australia", BAN: "Bangladesh", ENG: "England", IND: "India",
  IRE: "Ireland", NZ: "New Zealand", PAK: "Pakistan", SA: "South Africa", SL: "Sri Lanka",
  WI: "West Indies", ZIM: "Zimbabwe", NED: "Netherlands", SCO: "Scotland", UAE: "United Arab Emirates",
  NEP: "Nepal", OMA: "Oman", PNG: "Papua New Guinea", NAM: "Namibia", USA: "United States of America",
  HK: "Hong Kong", CAN: "Canada", KEN: "Kenya", BER: "Bermuda"
};

const normalizeTeamName = (input) => {
  if (!input) return "";
  const upper = input.toUpperCase().trim();
  for (const [code, full] of Object.entries(TEAM_MAP)) {
    if (upper === code || upper === full.toUpperCase()) return full;
  }
  return input.trim();
};

const isValidOver = (over) => {
  if (!over) return true;
  const parts = over.toString().split(".");
  const balls = parts[1] ? parseInt(parts[1].padEnd(1, "0")) : 0;
  return balls <= 5;
};

const MatchForm = () => {
  const [matchName, setMatchName] = useState("");
  const [matchType, setMatchType] = useState("T20");
  const [team1, setTeam1] = useState("");
  const [team2, setTeam2] = useState("");
  const [runs1, setRuns1] = useState("");
  const [overs1, setOvers1] = useState("");
  const [overs1Error, setOvers1Error] = useState(""); // 🔧 New state
  const [wickets1, setWickets1] = useState("");
  const [runs2, setRuns2] = useState("");
  const [overs2, setOvers2] = useState("");
  const [overs2Error, setOvers2Error] = useState(""); // 🔧 New state
  const [wickets2, setWickets2] = useState("");
  const [resultMsg, setResultMsg] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const maxOvers = matchType === "T20" ? 20 : 50;

  // 🔧 Real-time validation handlers
  const handleOvers1Change = (val) => {
    setOvers1(val);
    const isValid = isValidOver(val) && parseFloat(val) <= maxOvers;
    setOvers1Error(isValid ? "" : `Invalid overs for ${normalizeTeamName(team1) || "Team 1"}`);
  };

  const handleOvers2Change = (val) => {
    setOvers2(val);
    const isValid = isValidOver(val) && parseFloat(val) <= maxOvers;
    setOvers2Error(isValid ? "" : `Invalid overs for ${normalizeTeamName(team2) || "Team 2"}`);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (overs1Error || overs2Error) {
      alert("❌ Please correct overs input before submitting.");
      return;
    }

    const formattedTeam1 = normalizeTeamName(team1);
    const formattedTeam2 = normalizeTeamName(team2);

    if (formattedTeam1.toLowerCase() === formattedTeam2.toLowerCase()) {
      alert("❌ Both teams cannot be the same.");
      return;
    }

    if (
      parseInt(wickets1) < 0 || parseInt(wickets1) > 10 ||
      parseInt(wickets2) < 0 || parseInt(wickets2) > 10
    ) {
      alert("❌ Wickets must be between 0 and 10.");
      return;
    }

    try {
      setIsSubmitting(true);
      const match = await createMatch({ match_name: matchName, match_type: matchType });

      const result = await submitMatchResult({
        match_id: match.match_id,
        team1: formattedTeam1,
        team2: formattedTeam2,
        runs1: parseInt(runs1),
        overs1: parseFloat(overs1),
        wickets1: parseInt(wickets1),
        runs2: parseInt(runs2),
        overs2: parseFloat(overs2),
        wickets2: parseInt(wickets2),
      });

      setResultMsg(result.message);
    } catch (err) {
      alert("Error: " + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container mt-5">
      <div className="card shadow p-4">
        <h2 className="text-center mb-4 text-primary">🏏 Enter Match Details</h2>
        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <label>Match Name:</label>
            <input type="text" className="form-control" value={matchName} onChange={(e) => setMatchName(e.target.value)} required />
          </div>
          <div className="mb-3">
            <label>Match Type:</label>
            <select className="form-select" value={matchType} onChange={(e) => setMatchType(e.target.value)}>
              <option value="T20">T20</option>
              <option value="ODI">ODI</option>
            </select>
          </div>

          <h5 className="mt-4">Bat First Team</h5>
          <input type="text" className="form-control mb-2" placeholder="Team 1 Name" value={team1} onChange={(e) => setTeam1(e.target.value)} required />
          <div className="row">
            <div className="col">
              <input type="number" className="form-control mb-2" placeholder={`Runs by ${team1 || "Team 1"}`} value={runs1} onChange={(e) => setRuns1(e.target.value)} required />
            </div>
            <div className="col">
              <input type="text" className="form-control mb-2" placeholder={`Overs by ${team1 || "Team 1"}`} value={overs1} onChange={(e) => handleOvers1Change(e.target.value)} required />
              {overs1Error && <small className="text-danger">{overs1Error}</small>}
            </div>
            <div className="col">
              <input type="number" className="form-control mb-2" placeholder={`Wickets by ${team1 || "Team 1"}`} value={wickets1} onChange={(e) => setWickets1(e.target.value)} required min="0" max="10" />
            </div>
          </div>

          <h5 className="mt-4">Second Team</h5>
          <input type="text" className="form-control mb-2" placeholder="Team 2 Name" value={team2} onChange={(e) => setTeam2(e.target.value)} required />
          <div className="row">
            <div className="col">
              <input type="number" className="form-control mb-2" placeholder={`Runs by ${team2 || "Team 2"}`} value={runs2} onChange={(e) => setRuns2(e.target.value)} required />
            </div>
            <div className="col">
              <input type="text" className="form-control mb-2" placeholder={`Overs by ${team2 || "Team 2"}`} value={overs2} onChange={(e) => handleOvers2Change(e.target.value)} required />
              {overs2Error && <small className="text-danger">{overs2Error}</small>}
            </div>
            <div className="col">
              <input type="number" className="form-control mb-2" placeholder={`Wickets by ${team2 || "Team 2"}`} value={wickets2} onChange={(e) => setWickets2(e.target.value)} required min="0" max="10" />
            </div>
          </div>

          <div className="d-grid mt-3">
            <button className="btn btn-primary" disabled={isSubmitting}>
              {isSubmitting ? "Submitting Match... ⏳" : "Submit Match Result"}
            </button>
          </div>

          {isSubmitting && (
            <div className="text-center mt-3">
              <div className="spinner-border text-info" role="status" />
              <p className="text-muted mt-2">Hang tight... Submitting the match</p>
            </div>
          )}
        </form>

        {resultMsg && (
          <div className="alert alert-success mt-4 text-center" role="alert">
            {resultMsg}
          </div>
        )}
      </div>
    </div>
  );
};

export default MatchForm;
