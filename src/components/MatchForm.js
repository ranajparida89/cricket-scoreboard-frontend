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

const parseFloatSafe = (v) => v ? parseFloat(v) : 0;

const MatchForm = () => {
  const [matchName, setMatchName] = useState("");
  const [matchType, setMatchType] = useState("T20");
  const [team1, setTeam1] = useState("");
  const [team2, setTeam2] = useState("");

  // Common innings
  const [runs1, setRuns1] = useState(""); const [overs1, setOvers1] = useState(""); const [wickets1, setWickets1] = useState("");
  const [runs2, setRuns2] = useState(""); const [overs2, setOvers2] = useState(""); const [wickets2, setWickets2] = useState("");

  // Test only: 2nd innings
  const [runs1_2, setRuns1_2] = useState(""); const [overs1_2, setOvers1_2] = useState(""); const [wickets1_2, setWickets1_2] = useState("");
  const [runs2_2, setRuns2_2] = useState(""); const [overs2_2, setOvers2_2] = useState(""); const [wickets2_2, setWickets2_2] = useState("");

  const [totalDays, setTotalDays] = useState(5);
  const [oversPerDay, setOversPerDay] = useState(90);
  const [winner, setWinner] = useState("");
  const [resultMsg, setResultMsg] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const totalOvers = totalDays * oversPerDay;

  const totalUsedOvers = parseFloatSafe(overs1) + parseFloatSafe(overs2) + parseFloatSafe(overs1_2) + parseFloatSafe(overs2_2);
  const remainingOvers = matchType === "Test" ? Math.max(0, (totalOvers - totalUsedOvers).toFixed(1)) : 0;

  const handleSubmit = async (e) => {
    e.preventDefault();
    const t1 = normalizeTeamName(team1);
    const t2 = normalizeTeamName(team2);
    if (t1 === t2) return alert("❌ Both teams cannot be the same.");
    if (!matchName || !t1 || !t2) return alert("❌ Please fill required fields.");

    try {
      setIsSubmitting(true);
      const match = await createMatch({ match_name: matchName, match_type: matchType });

      const payload = {
        match_id: match.match_id,
        match_type: matchType,
        team1: t1,
        team2: t2,
        winner,

        // 1st Innings
        runs1: +runs1, overs1: parseFloatSafe(overs1), wickets1: +wickets1,
        runs2: +runs2, overs2: parseFloatSafe(overs2), wickets2: +wickets2,

        // 2nd Innings (only for Test)
        runs1_2: matchType === "Test" ? +runs1_2 : null,
        overs1_2: matchType === "Test" ? parseFloatSafe(overs1_2) : null,
        wickets1_2: matchType === "Test" ? +wickets1_2 : null,
        runs2_2: matchType === "Test" ? +runs2_2 : null,
        overs2_2: matchType === "Test" ? parseFloatSafe(overs2_2) : null,
        wickets2_2: matchType === "Test" ? +wickets2_2 : null,
        total_overs_used: matchType === "Test" ? totalUsedOvers : null
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
              <option value="Test">Test</option>
            </select>
          </div>

          {(matchType === "Test") && (
            <div className="row mb-3">
              <div className="col">
                <label>Total Days (Max 5)</label>
                <input type="number" className="form-control" value={totalDays} max="5" onChange={(e) => setTotalDays(e.target.value)} />
              </div>
              <div className="col">
                <label>Overs Per Day (Max 90)</label>
                <input type="number" className="form-control" value={oversPerDay} max="90" onChange={(e) => setOversPerDay(e.target.value)} />
              </div>
              <div className="col">
                <label>Total Overs</label>
                <input type="number" className="form-control" value={totalOvers} disabled />
              </div>
              <div className="col">
                <label>Remaining Overs</label>
                <input type="text" className="form-control" value={remainingOvers} disabled />
              </div>
            </div>
          )}

          {/* Team 1 */}
          <h5 className="mt-4">Team 1 (Bat First)</h5>
          <input className="form-control mb-2" placeholder="Team 1" value={team1} onChange={(e) => setTeam1(e.target.value)} />
          <div className="row mb-2">
            <div className="col"><input type="number" className="form-control" placeholder="Runs (1st Inn)" value={runs1} onChange={(e) => setRuns1(e.target.value)} /></div>
            <div className="col"><input type="number" className="form-control" placeholder="Overs" value={overs1} onChange={(e) => setOvers1(e.target.value)} /></div>
            <div className="col"><input type="number" className="form-control" placeholder="Wickets" value={wickets1} onChange={(e) => setWickets1(e.target.value)} /></div>
          </div>
          {matchType === "Test" && (
            <div className="row mb-2">
              <div className="col"><input type="number" className="form-control" placeholder="Runs (2nd Inn)" value={runs1_2} onChange={(e) => setRuns1_2(e.target.value)} /></div>
              <div className="col"><input type="number" className="form-control" placeholder="Overs" value={overs1_2} onChange={(e) => setOvers1_2(e.target.value)} /></div>
              <div className="col"><input type="number" className="form-control" placeholder="Wickets" value={wickets1_2} onChange={(e) => setWickets1_2(e.target.value)} /></div>
            </div>
          )}

          {/* Team 2 */}
          <h5 className="mt-4">Team 2</h5>
          <input className="form-control mb-2" placeholder="Team 2" value={team2} onChange={(e) => setTeam2(e.target.value)} />
          <div className="row mb-2">
            <div className="col"><input type="number" className="form-control" placeholder="Runs (1st Inn)" value={runs2} onChange={(e) => setRuns2(e.target.value)} /></div>
            <div className="col"><input type="number" className="form-control" placeholder="Overs" value={overs2} onChange={(e) => setOvers2(e.target.value)} /></div>
            <div className="col"><input type="number" className="form-control" placeholder="Wickets" value={wickets2} onChange={(e) => setWickets2(e.target.value)} /></div>
          </div>
          {matchType === "Test" && (
            <div className="row mb-2">
              <div className="col"><input type="number" className="form-control" placeholder="Runs (2nd Inn)" value={runs2_2} onChange={(e) => setRuns2_2(e.target.value)} /></div>
              <div className="col"><input type="number" className="form-control" placeholder="Overs" value={overs2_2} onChange={(e) => setOvers2_2(e.target.value)} /></div>
              <div className="col"><input type="number" className="form-control" placeholder="Wickets" value={wickets2_2} onChange={(e) => setWickets2_2(e.target.value)} /></div>
            </div>
          )}

          {matchType === "Test" && (
            <div className="mb-3 mt-3">
              <label>Winner (or type 'Draw'):</label>
              <input type="text" className="form-control" value={winner} onChange={(e) => setWinner(e.target.value)} />
            </div>
          )}

          <div className="d-grid mt-4">
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
