// src/components/MatchForm.js
import React, { useState } from "react";
import { createMatch, submitMatchResult } from "../services/api.js";

const TEAM_MAP = {
  IND: "India", AUS: "Australia", ENG: "England", PAK: "Pakistan", SA: "South Africa",
  NZ: "New Zealand", SL: "Sri Lanka", BAN: "Bangladesh", AFG: "Afghanistan", WI: "West Indies",
  UAE: "United Arab Emirates", NAM: "Namibia", SCO: "Scotland", USA: "United States of America",
  NEP: "Nepal", NED: "Netherlands", IRE: "Ireland", OMA: "Oman", PNG: "Papua New Guinea",
  CAN: "Canada", KEN: "Kenya", BER: "Bermuda", HK: "Hong Kong", ZIM: "Zimbabwe"
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
  const [wickets1, setWickets1] = useState("");
  const [runs2, setRuns2] = useState("");
  const [overs2, setOvers2] = useState("");
  const [wickets2, setWickets2] = useState("");

  const [overs1Error, setOvers1Error] = useState("");
  const [overs2Error, setOvers2Error] = useState("");
  const [wickets1Error, setWickets1Error] = useState("");
  const [wickets2Error, setWickets2Error] = useState("");
  const [resultMsg, setResultMsg] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const maxOvers = matchType === "T20" ? 20 : 50;

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

  const handleWickets1Change = (val) => {
    setWickets1(val);
    const w = parseInt(val);
    setWickets1Error(w >= 0 && w <= 10 ? "" : "Wickets must be between 0 and 10");
  };

  const handleWickets2Change = (val) => {
    setWickets2(val);
    const w = parseInt(val);
    setWickets2Error(w >= 0 && w <= 10 ? "" : "Wickets must be between 0 and 10");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (overs1Error || overs2Error || wickets1Error || wickets2Error) {
      alert("❌ Please fix overs/wickets input errors before submitting.");
      return;
    }

    const t1 = normalizeTeamName(team1);
    const t2 = normalizeTeamName(team2);
    if (t1.toLowerCase() === t2.toLowerCase()) {
      alert("❌ Both teams cannot be the same.");
      return;
    }

    try {
      setIsSubmitting(true);

      const match = await createMatch({ match_name: matchName, match_type: matchType });

      const payload = {
        match_id: match.match_id,
        match_type,
        team1: t1,
        team2: t2,
        runs1: parseInt(runs1),
        overs1: parseFloat(overs1),
        wickets1: parseInt(wickets1),
        runs2: parseInt(runs2),
        overs2: parseFloat(overs2),
        wickets2: parseInt(wickets2)
      };

      const result = await submitMatchResult(payload);
      setResultMsg(result.message);
    } catch (err) {
      alert("❌ Error: " + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container mt-4">
      <div className="card shadow p-4">
        <h3 className="text-center mb-4 text-primary">🏏 Enter Match Details</h3>
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

          {/* Team 1 */}
          <h5 className="mt-4">Team 1 (Bat First)</h5>
          <input type="text" className="form-control mb-2" placeholder="Team 1 Name" value={team1} onChange={(e) => setTeam1(e.target.value)} required />
          <div className="row">
            <div className="col">
              <input type="number" className="form-control mb-2" placeholder={`Runs by ${normalizeTeamName(team1) || "Team 1"}`} value={runs1} onChange={(e) => setRuns1(e.target.value)} />
            </div>
            <div className="col">
              <input type="text" className="form-control mb-2" placeholder="Overs" value={overs1} onChange={(e) => handleOvers1Change(e.target.value)} />
              {overs1Error && <small className="text-danger">{overs1Error}</small>}
            </div>
            <div className="col">
              <input type="number" className="form-control mb-2" placeholder="Wickets" value={wickets1} onChange={(e) => handleWickets1Change(e.target.value)} />
              {wickets1Error && <small className="text-danger">{wickets1Error}</small>}
            </div>
          </div>

          {/* Team 2 */}
          <h5 className="mt-4">Team 2</h5>
          <input type="text" className="form-control mb-2" placeholder="Team 2 Name" value={team2} onChange={(e) => setTeam2(e.target.value)} required />
          <div className="row">
            <div className="col">
              <input type="number" className="form-control mb-2" placeholder={`Runs by ${normalizeTeamName(team2) || "Team 2"}`} value={runs2} onChange={(e) => setRuns2(e.target.value)} />
            </div>
            <div className="col">
              <input type="text" className="form-control mb-2" placeholder="Overs" value={overs2} onChange={(e) => handleOvers2Change(e.target.value)} />
              {overs2Error && <small className="text-danger">{overs2Error}</small>}
            </div>
            <div className="col">
              <input type="number" className="form-control mb-2" placeholder="Wickets" value={wickets2} onChange={(e) => handleWickets2Change(e.target.value)} />
              {wickets2Error && <small className="text-danger">{wickets2Error}</small>}
            </div>
          </div>

          <div className="d-grid mt-3">
            <button className="btn btn-primary" disabled={isSubmitting}>
              {isSubmitting ? "Submitting..." : "Submit Match"}
            </button>
          </div>
        </form>

        {resultMsg && (
          <div className="alert alert-success mt-3 text-center">{resultMsg}</div>
        )}
      </div>
    </div>
  );
};

export default MatchForm;
