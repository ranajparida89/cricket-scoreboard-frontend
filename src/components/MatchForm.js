// ✅ src/components/MatchForm.js
import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { createMatch, submitMatchResult } from "../services/api";
import { playSound } from "../utils/playSound";
import Confetti from "react-confetti";
import useWindowSize from "react-use/lib/useWindowSize";
import "./MatchForm.css";

const API_BASE = "https://cricket-scoreboard-backend.onrender.com/api";

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
  const balls = parts[1] ? parseInt(parts[1][0], 10) : 0;
  return !isNaN(balls) && balls >= 0 && balls <= 5;
};

function todayISO() {
  const d = new Date();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${mm}-${dd}`;
}

export default function MatchForm() {
  const { width, height } = useWindowSize();

  // Core
  const [matchName, setMatchName] = useState("");
  const [isMatchNameDirty, setIsMatchNameDirty] = useState(false);
  const [tournamentName, setTournamentName] = useState("");
  const [matchDate, setMatchDate] = useState(todayISO());
  const seasonDefault = useMemo(() => new Date(matchDate).getFullYear(), [matchDate]);
  const [seasonYear, setSeasonYear] = useState(seasonDefault);

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
  const [showPopup, setShowPopup] = useState(false);
  const [winnerTeam, setWinnerTeam] = useState("");

  const maxOvers = matchType === "T20" ? 20 : 50;

  // Tournaments & years
  const [tournaments, setTournaments] = useState([]);
  const [tournamentsLoading, setTournamentsLoading] = useState(true);
  const [yearOptions, setYearOptions] = useState([]);

  // Add-new modal
  const [addOpen, setAddOpen] = useState(false);
  const [newTourName, setNewTourName] = useState("");
  const [newTourYear, setNewTourYear] = useState(seasonDefault);

  // Load tournaments (ODI/T20 scope=limited)
  useEffect(() => {
    let cancelled = false;
    setTournamentsLoading(true);
    axios
      .get(`${API_BASE}/match/tournaments`, { params: { scope: "limited" } })
      .then(({ data }) => {
        if (cancelled) return;
        setTournaments(Array.isArray(data?.tournaments) ? data.tournaments : []);
      })
      .catch(() => !cancelled && setTournaments([]))
      .finally(() => !cancelled && setTournamentsLoading(false));
    return () => { cancelled = true; };
  }, []);

  // Load years when a tournament is chosen; default to newest
  useEffect(() => {
    let cancelled = false;
    if (!tournamentName) { setYearOptions([]); return; }
    axios
      .get(`${API_BASE}/match/tournaments/years`, {
        params: { scope: "limited", tournament_name: tournamentName }
      })
      .then(({ data }) => {
        if (cancelled) return;
        const yrs = Array.isArray(data?.years) ? data.years : [];
        setYearOptions(yrs);
        if (yrs.length) setSeasonYear(yrs[0]); // newest first (API orders DESC)
      })
      .catch(() => !cancelled && setYearOptions([]));
    return () => { cancelled = true; };
  }, [tournamentName]);

  // Auto compose match name (until edited)
  useEffect(() => {
    if (isMatchNameDirty) return;
    const t1 = normalizeTeamName(team1);
    const t2 = normalizeTeamName(team2);
    const tnm = tournamentName?.trim();
    if (tnm && seasonYear && t1 && t2) {
      setMatchName(`${tnm} ${seasonYear} : ${t1} vs ${t2}`);
    }
  }, [tournamentName, seasonYear, team1, team2, isMatchNameDirty]);

  const handleOversChange = (val, setOvers, setError, teamName) => {
    setOvers(val);
    const valid = isValidOver(val) && parseFloat(val) <= maxOvers;
    setError(valid ? "" : `❌ Invalid overs for ${normalizeTeamName(teamName) || "Team"}`);
  };

  const handleWicketsChange = (val, setWickets, setError) => {
    const w = parseInt(val, 10);
    setWickets(val);
    const valid = !isNaN(w) && w >= 0 && w <= 10;
    setError(valid ? "" : "❌ Wickets must be between 0 and 10");
  };

  const validateTournament = () => {
    const y = Number(seasonYear);
    if (!tournamentName.trim()) { alert("❌ Tournament Name is required."); return false; }
    if (!Number.isInteger(y) || y < 1860 || y > 2100) { alert("❌ Season Year must be between 1860 and 2100."); return false; }
    if (!matchDate) { alert("❌ Match Date is required."); return false; }
    return true;
  };

  const addNewTournament = (e) => {
    e.preventDefault();
    const nm = newTourName.trim();
    if (!nm) return;
    if (!tournaments.includes(nm)) setTournaments(prev => [...prev, nm].sort());
    setTournamentName(nm);
    setSeasonYear(Number(newTourYear) || seasonDefault);
    setAddOpen(false);
    setNewTourName("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const t1 = normalizeTeamName(team1);
    const t2 = normalizeTeamName(team2);

    if (t1.toLowerCase() === t2.toLowerCase()) { alert("❌ Both teams cannot be the same."); return; }
    if (overs1Error || overs2Error || wickets1Error || wickets2Error) { alert("❌ Please fix all validation errors before submitting."); return; }
    if (!validateTournament()) return;

    try {
      setIsSubmitting(true);
      const storedUser = JSON.parse(localStorage.getItem("user"));
      const userId = storedUser?.id;

      const match = await createMatch({ match_name: matchName, match_type: matchType, user_id: userId });

      const payload = {
        match_id: match.match_id,
        match_type: matchType,
        team1: t1, team2: t2,
        runs1: parseInt(runs1 || 0, 10),
        overs1: parseFloat(overs1 || 0),
        wickets1: parseInt(wickets1 || 0, 10),
        runs2: parseInt(runs2 || 0, 10),
        overs2: parseFloat(overs2 || 0),
        wickets2: parseInt(wickets2 || 0, 10),
        user_id: userId,
        tournament_name: tournamentName.trim(),
        season_year: Number(seasonYear),
        match_date: matchDate
      };

      const result = await submitMatchResult(payload);
      setResultMsg(result.message || "Match submitted.");

      const winner = (result.message || "").split(" ")[0];
      setWinnerTeam(winner);
      playSound("celebration");
      setShowPopup(true);
      setTimeout(() => setShowPopup(false), 4000);
    } catch (err) {
      alert("❌ Error: " + (err?.response?.data?.error || err.message));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container mt-4">
      {showPopup && <Confetti width={width} height={height} numberOfPieces={300} recycle={false} />}
      {showPopup && <div className="celebration-banner">🎉 Congratulations {winnerTeam}!</div>}

      <div className="card shadow p-4">
        <h3 className="text-center mb-4 text-primary">🏏 Enter Match Details</h3>

        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <label>Match Name:</label>
            <input
              type="text"
              className="form-control"
              value={matchName}
              onChange={(e) => { setMatchName(e.target.value); setIsMatchNameDirty(true); }}
              required
            />
          </div>

          {/* Tournament picker */}
          <div className="row g-3 align-items-end">
            <div className="col-md-6">
              <label>Tournament Name:</label>
              <div className="d-flex gap-2">
                <select
                  className="form-select"
                  value={tournamentName}
                  onChange={(e) => setTournamentName(e.target.value)}
                >
                  <option value="">{tournamentsLoading ? "Loading…" : "Select tournament…"}</option>
                  {tournaments.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
                <button type="button" className="btn btn-add-gold" title="Add new tournament" onClick={() => setAddOpen(true)}>+</button>
              </div>
            </div>

            <div className="col-md-3">
              <label>Season Year:</label>
              {yearOptions.length ? (
                <select className="form-select" value={seasonYear} onChange={(e) => setSeasonYear(Number(e.target.value))}>
                  {yearOptions.map(y => <option key={y} value={y}>{y}</option>)}
                </select>
              ) : (
                <input
                  type="number"
                  className="form-control"
                  value={seasonYear}
                  min={1860}
                  max={2100}
                  onChange={(e) => setSeasonYear(e.target.value)}
                  required
                />
              )}
            </div>

            <div className="col-md-3">
              <label>Match Date:</label>
              <input type="date" className="form-control" value={matchDate} onChange={(e) => setMatchDate(e.target.value)} required />
            </div>
          </div>

          {/* Add-new modal */}
          {addOpen && (
            <div className="addtour-backdrop" onClick={() => setAddOpen(false)}>
              <div className="addtour-modal" onClick={(e) => e.stopPropagation()}>
                <div className="addtour-header">➕ Add Tournament</div>
                <div className="mb-2">
                  <label className="form-label">Tournament Name</label>
                  <input className="form-control" placeholder="e.g., Champions Trophy" value={newTourName} onChange={(e) => setNewTourName(e.target.value)} />
                </div>
                <div className="mb-3">
                  <label className="form-label">Season Year</label>
                  <input type="number" className="form-control" value={newTourYear} min={1860} max={2100} onChange={(e) => setNewTourYear(e.target.value)} />
                </div>
                <div className="d-flex gap-2">
                  <button className="btn btn-primary flex-fill" onClick={addNewTournament}>Add</button>
                  <button className="btn btn-secondary flex-fill" onClick={() => setAddOpen(false)}>Cancel</button>
                </div>
              </div>
            </div>
          )}

          {/* Match Type */}
          <div className="mb-3 mt-3">
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
              <input type="text" className="form-control mb-2" placeholder="Overs" value={overs1} onChange={(e) => handleOversChange(e.target.value, setOvers1, setOvers1Error, team1)} />
              {overs1Error && <small className="text-danger">{overs1Error}</small>}
            </div>
            <div className="col">
              <input type="number" className="form-control mb-2" placeholder="Wickets" value={wickets1} onChange={(e) => handleWicketsChange(e.target.value, setWickets1, setWickets1Error)} />
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
              <input type="text" className="form-control mb-2" placeholder="Overs" value={overs2} onChange={(e) => handleOversChange(e.target.value, setOvers2, setOvers2Error, team2)} />
              {overs2Error && <small className="text-danger">{overs2Error}</small>}
            </div>
            <div className="col">
              <input type="number" className="form-control mb-2" placeholder="Wickets" value={wickets2} onChange={(e) => handleWicketsChange(e.target.value, setWickets2, setWickets2Error)} />
              {wickets2Error && <small className="text-danger">{wickets2Error}</small>}
            </div>
          </div>

          <div className="d-grid mt-3">
            <button className="btn btn-primary" disabled={isSubmitting}>
              {isSubmitting ? "Submitting..." : "Submit Match"}
            </button>
          </div>
        </form>

        {resultMsg && <div className="alert alert-success mt-3 text-center">{resultMsg}</div>}
      </div>
    </div>
  );
}
