import React, { useState } from "react";
import { createMatch, submitMatchResult } from "../services/api";

// 🏏 Team map for standardization
const teamMap = {
  AFG: "Afghanistan", AUS: "Australia", BAN: "Bangladesh", ENG: "England", IND: "India",
  IRE: "Ireland", NZ: "New Zealand", PAK: "Pakistan", SA: "South Africa", SL: "Sri Lanka",
  WI: "West Indies", ZIM: "Zimbabwe", NED: "Netherlands", SCO: "Scotland", UAE: "UAE",
  NEP: "Nepal", OMA: "Oman", PNG: "Papua New Guinea", NAM: "Namibia", USA: "USA",
  HK: "Hong Kong", CAN: "Canada", KEN: "Kenya", BER: "Bermuda"
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
  const [resultMsg, setResultMsg] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const normalizeTeam = (input) => {
    const upper = input.trim().toUpperCase();
    return teamMap[upper] || input.trim();
  };

  const isValidOvers = (overs) => {
    const [whole, decimal] = overs.split(".");
    return !decimal || parseInt(decimal) <= 6;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const maxOvers = matchType === "T20" ? 20 : 50;

    if (!isValidOvers(overs1) || !isValidOvers(overs2)) {
      alert("Invalid overs input! Max 6 balls allowed per over.");
      return;
    }

    if (parseFloat(overs1) > maxOvers || parseFloat(overs2) > maxOvers) {
      alert(`Overs cannot exceed ${maxOvers} for ${matchType}`);
      return;
    }

    if (
      parseInt(wickets1) < 0 || parseInt(wickets1) > 10 ||
      parseInt(wickets2) < 0 || parseInt(wickets2) > 10
    ) {
      alert("Wickets must be between 0 and 10 only.");
      return;
    }

    const team1Final = normalizeTeam(team1);
    const team2Final = normalizeTeam(team2);

    if (team1Final.toLowerCase() === team2Final.toLowerCase()) {
      alert("Team 1 and Team 2 cannot be the same.");
      return;
    }

    try {
      setIsSubmitting(true);
      const match = await createMatch({ match_name: matchName, match_type: matchType });

      const result = await submitMatchResult({
        match_id: match.match_id,
        team1: team1Final,
        team2: team2Final,
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
              <input type="number" className="form-control mb-2" placeholder="Runs" value={runs1} onChange={(e) => setRuns1(e.target.value)} required />
            </div>
            <div className="col">
              <input type="text" className="form-control mb-2" placeholder="Overs (e.g., 18.4)" value={overs1} onChange={(e) => setOvers1(e.target.value)} required />
            </div>
            <div className="col">
              <input type="number" className="form-control mb-2" placeholder="Wickets" value={wickets1} onChange={(e) => setWickets1(e.target.value)} required min="0" max="10" />
            </div>
          </div>

          <h5 className="mt-4">Second Team</h5>
          <input type="text" className="form-control mb-2" placeholder="Team 2 Name" value={team2} onChange={(e) => setTeam2(e.target.value)} required />

          <div className="row">
            <div className="col">
              <input type="number" className="form-control mb-2" placeholder="Runs" value={runs2} onChange={(e) => setRuns2(e.target.value)} required />
            </div>
            <div className="col">
              <input type="text" className="form-control mb-2" placeholder="Overs (e.g., 20.0)" value={overs2} onChange={(e) => setOvers2(e.target.value)} required />
            </div>
            <div className="col">
              <input type="number" className="form-control mb-2" placeholder="Wickets" value={wickets2} onChange={(e) => setWickets2(e.target.value)} required min="0" max="10" />
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
