// ✅ src/components/MatchForm.js
import React, { useEffect, useMemo, useRef, useState } from "react";
import axios from "axios";
import { createMatch, submitMatchResult } from "../services/api";
import { playSound } from "../utils/playSound";
import Confetti from "react-confetti";
import useWindowSize from "react-use/lib/useWindowSize";
import "./MatchForm.css";
import Select from "react-select";

const darkSelectStyles = {
  control: (provided) => ({
    ...provided,
    backgroundColor: "#0b1a2e",
    borderColor: "#d4af37",
    color: "white",
  }),
  menu: (provided) => ({
    ...provided,
    backgroundColor: "#0b1a2e",
    color: "white",
  }),
  option: (provided, state) => ({
    ...provided,
    backgroundColor: state.isFocused ? "#1e3a5f" : "#0b1a2e",
    color: "white",
    cursor: "pointer",
  }),
  singleValue: (provided) => ({
    ...provided,
    color: "white",
  }),
  input: (provided) => ({
    ...provided,
    color: "white",
  }),
  placeholder: (provided) => ({
    ...provided,
    color: "#bbb",
  }),
};

const API_BASE = "https://cricket-scoreboard-backend.onrender.com/api";
const API_PLAYERS =
  "https://cricket-scoreboard-backend.onrender.com/api/players";

const TEAM_MAP = {
  IND: "India",
  AUS: "Australia",
  ENG: "England",
  PAK: "Pakistan",
  SA: "South Africa",
  NZ: "New Zealand",
  SL: "Sri Lanka",
  BAN: "Bangladesh",
  AFG: "Afghanistan",
  WI: "West Indies",
  UAE: "United Arab Emirates",
  NAM: "Namibia",
  SCO: "Scotland",
  USA: "United States of America",
  NEP: "Nepal",
  NED: "Netherlands",
  IRE: "Ireland",
  OMA: "Oman",
  PNG: "Papua New Guinea",
  CAN: "Canada",
  KEN: "Kenya",
  BER: "Bermuda",
  HK: "Hong Kong",
  ZIM: "Zimbabwe",
};

/* ---------------- Tournament name formatter ---------------- */
const ACRONYMS = new Set([
  "ODI",
  "T20",
  "ICC",
  "WTC",
  "BCCI",
  "UAE",
  "USA",
  "WBBL",
  "BBL",
  "PSL",
  "IPL",
]);

const MINOR_LOWER = new Set([
  "of",
  "and",
  "or",
  "the",
  "a",
  "an",
  "for",
  "to",
  "in",
  "on",
  "at",
  "by",
  "vs",
]);

const FORCE_PROPER = new Set([
  "series",
  "trophy",
  "cup",
  "league",
  "championship",
  "championships",
]);

const titleWord = (w, index, last) => {
  if (!w) return w;
  const parts = w.split("-").map((seg) => {
    const clean = seg.replace(/[^A-Za-z0-9']/g, "");
    if (!clean) return seg;

    if (ACRONYMS.has(clean.toUpperCase())) return clean.toUpperCase();

    const lower = clean.toLowerCase();

    if (FORCE_PROPER.has(lower))
      return lower.charAt(0).toUpperCase() + lower.slice(1);

    if (MINOR_LOWER.has(lower) && index !== 0 && index !== last) return lower;

    return lower.charAt(0).toUpperCase() + lower.slice(1);
  });
  return parts.map((p) => (p ? p : "")).join("-");
};

const formatTournamentName = (raw) => {
  if (!raw) return "";
  const s = String(raw).replace(/\s+/g, " ").trim();
  if (!s) return "";
  const tokens = s.split(" ");
  const last = tokens.length - 1;
  const out = tokens.map((t, i) => titleWord(t, i, last)).join(" ");

  return out.replace(/\bSeries\b/gi, "Series");
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

// ⏱️ build a clean one-liner without duplicate years
function buildMatchName(tournamentName, seasonYear, team1, team2) {
  const t1 = normalizeTeamName(team1);
  const t2 = normalizeTeamName(team2);
  if (!tournamentName || !seasonYear || !t1 || !t2) return "";

  const base = formatTournamentName(tournamentName)
    .replace(/\b(19|20)\d{2}\b/g, "")
    .replace(/\s{2,}/g, " ")
    .trim();

  return `${base} ${seasonYear} : ${t1} vs ${t2}`;
}

/** Winner text helper (unchanged logic) */
function extractWinnerName(message = "", team1 = "", team2 = "") {
  const msg = message.trim();
  const t1 = normalizeTeamName(team1);
  const t2 = normalizeTeamName(team2);
  if (!msg) return "";
  const lower = msg.toLowerCase();
  const wonIdx = lower.indexOf("won the match");
  if (wonIdx !== -1) {
    let winnerRaw = msg.slice(0, wonIdx).trim();
    winnerRaw = winnerRaw.replace(/^[🏆\-\s]+/, "").trim();
    if (winnerRaw && winnerRaw.split(" ").length === 1) {
      if (t1 && t1.toLowerCase().startsWith(winnerRaw.toLowerCase()))
        return t1;
      if (t2 && t2.toLowerCase().startsWith(winnerRaw.toLowerCase()))
        return t2;
    }
    return winnerRaw;
  }
  if (
    lower.includes("match is drawn") ||
    lower.includes("match drawn") ||
    lower.includes("draw")
  ) {
    return "Match Drawn";
  }
  if (t1 && lower.includes(t1.toLowerCase())) return t1;
  if (t2 && lower.includes(t2.toLowerCase())) return t2;
  const first = msg.split(" ")[0];
  if (t1 && t1.toLowerCase().startsWith(first.toLowerCase())) return t1;
  if (t2 && t2.toLowerCase().startsWith(first.toLowerCase())) return t2;
  return first;
}

export default function MatchForm() {
  const { width, height } = useWindowSize();

  // Core
  const [matchName, setMatchName] = useState("");
  const [tournamentName, setTournamentName] = useState("");
  const [matchDate, setMatchDate] = useState(todayISO());
  const seasonDefault = useMemo(
    () => new Date(matchDate).getFullYear(),
    [matchDate]
  );
  const [seasonYear, setSeasonYear] = useState(seasonDefault);

  const [matchType, setMatchType] = useState("T20");
  const [team1, setTeam1] = useState("");
  const [team2, setTeam2] = useState("");
  const [teamsList, setTeamsList] = useState([]);
  const [teamsLoading, setTeamsLoading] = useState(false);

  // 🆕 Admin detection
const [isAdmin, setIsAdmin] = useState(false);
const [showAddTeamModal, setShowAddTeamModal] = useState(false);
const [newTeamName, setNewTeamName] = useState("");
const [addingTeam, setAddingTeam] = useState(false);

useEffect(() => {
  const token = localStorage.getItem("admin_jwt");
  if (token) {
    setIsAdmin(true);
  }
}, []);

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

  // 🆕 MoM fields (ID-based)
  const [momPlayerId, setMomPlayerId] = useState("");
  const [momReason, setMomReason] = useState("");

  // 🆕 All players (for MoM dropdown)
  const [players, setPlayers] = useState([]);
  const [playersLoading, setPlayersLoading] = useState(false);
  const [playersError, setPlayersError] = useState("");

  // 🆕 Search text inside MoM dropdown
  const [momSearch, setMomSearch] = useState("");
  // 🆕 Dropdown open/close
  const [momOpen, setMomOpen] = useState(false);
  const momRef = useRef(null);

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

  const formattedPreview = formatTournamentName(newTourName);

  // 🔄 Load tournaments (ODI/T20 scope=limited)
  useEffect(() => {
    let cancelled = false;
    setTournamentsLoading(true);
    axios
      .get(`${API_BASE}/match/tournaments`, { params: { scope: "limited" } })
      .then(({ data }) => {
        if (cancelled) return;
        const list = Array.isArray(data?.tournaments) ? data.tournaments : [];

        // 🔧 NEW: normalise + de-duplicate by formatted name (case-insensitive)
        const seen = new Set();
        const cleaned = [];

        list.forEach((raw) => {
          const label = formatTournamentName(String(raw || "").trim());
          if (!label) return;
          const key = label.toLowerCase();
          if (seen.has(key)) return;
          seen.add(key);
          cleaned.push(label);
        });

        cleaned.sort((a, b) => a.localeCompare(b));
        setTournaments(cleaned);
      })
      .catch(() => !cancelled && setTournaments([]))
      .finally(() => !cancelled && setTournamentsLoading(false));
    return () => {
      cancelled = true;
    };
  }, []);

  // 🔄 Load years when a tournament is chosen; default to newest
  useEffect(() => {
    let cancelled = false;
    if (!tournamentName) {
      setYearOptions([]);
      return;
    }
    axios
      .get(`${API_BASE}/match/tournaments/years`, {
        params: { scope: "limited", tournament_name: tournamentName }, // tournamentName is already canonical
      })
      .then(({ data }) => {
        if (cancelled) return;
        const yrs = Array.isArray(data?.years) ? data.years : [];
        setYearOptions(yrs);
        if (yrs.length) setSeasonYear(yrs[0]);
      })
      .catch(() => !cancelled && setYearOptions([]));
    return () => {
      cancelled = true;
    };
  }, [tournamentName]);

  // 🆕 Load players for MoM dropdown (once)
  useEffect(() => {
    let cancelled = false;
    const fetchPlayers = async () => {
      try {
        setPlayersLoading(true);
        setPlayersError("");
        const res = await axios.get(API_PLAYERS);
        if (cancelled) return;
        const list = Array.isArray(res.data) ? res.data : [];
        setPlayers(list);
      } catch (err) {
        if (!cancelled) {
          console.error("Failed to load players for MoM dropdown:", err);
          setPlayersError("Could not load players. Please retry or refresh.");
          setPlayers([]);
        }
      } finally {
        if (!cancelled) setPlayersLoading(false);
      }
    };
    fetchPlayers();
    return () => {
      cancelled = true;
    };
  }, []);

  // 🆕 Load Teams for dropdown from existing leaderboard API
useEffect(() => {
  let cancelled = false;

  const fetchTeams = async () => {
    try {
      setTeamsLoading(true);

      const res = await axios.get(
        "https://cricket-scoreboard-backend.onrender.com/api/teams"
      );

      if (cancelled) return;

      const uniqueTeams = Array.from(
        new Set((res.data || []).map((t) => t.team_name))
      ).sort();

      setTeamsList(uniqueTeams);
    } catch (err) {
      console.error("Failed to load teams:", err);
      if (!cancelled) setTeamsList([]);
    } finally {
      if (!cancelled) setTeamsLoading(false);
    }
  };

  fetchTeams();

  return () => {
    cancelled = true;
  };
}, []);


  // 🔁 Auto compose match name
  useEffect(() => {
    setMatchName(
      buildMatchName(tournamentName?.trim(), seasonYear, team1, team2)
    );
  }, [tournamentName, seasonYear, team1, team2]);

  // ❌ Close MoM dropdown when clicking outside
  useEffect(() => {
    const handler = (e) => {
      if (!momRef.current) return;
      if (!momRef.current.contains(e.target)) {
        setMomOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleOversChange = (val, setOvers, setError, teamName) => {
    setOvers(val);
    const valid = isValidOver(val) && parseFloat(val) <= maxOvers;
    setError(
      valid
        ? ""
        : `❌ Invalid overs for ${normalizeTeamName(teamName) || "Team"}`
    );
  };

  const handleWicketsChange = (val, setWickets, setError) => {
    const w = parseInt(val, 10);
    setWickets(val);
    const valid = !isNaN(w) && w >= 0 && w <= 10;
    setError(valid ? "" : "❌ Wickets must be between 0 and 10");
  };

  const validateTournament = () => {
    const y = Number(seasonYear);
    if (!tournamentName.trim()) {
      alert("❌ Tournament Name is required.");
      return false;
    }
    if (!Number.isInteger(y) || y < 1860 || y > 2100) {
      alert("❌ Season Year must be between 1860 and 2100.");
      return false;
    }
    if (!matchDate) {
      alert("❌ Match Date is required.");
      return false;
    }
    return true;
  };

  const addNewTournament = (e) => {
    e.preventDefault();
    const raw = newTourName.trim();
    if (!raw) return;
    const fm = formatTournamentName(raw);

    // 🔧 tournaments already store canonical labels, but keep defensive check
    const exists = (tournaments || []).some(
      (t) => formatTournamentName(t).toLowerCase() === fm.toLowerCase()
    );
    if (!exists) {
      setTournaments((prev) => [...prev, fm].sort((a, b) => a.localeCompare(b)));
    }
    setTournamentName(fm);
    setSeasonYear(Number(newTourYear) || seasonDefault);
    setAddOpen(false);
    setNewTourName("");
  };

  // 🆕 Derived: de-dupe players + split into XI vs others + search filter
  const { xiPlayers, otherPlayers } = useMemo(() => {
    const norm = (name) => normalizeTeamName(name).toLowerCase();
    const t1 = norm(team1);
    const t2 = norm(team2);

    // 1) de-duplicate by (name, team)
    const unique = [];
    const seen = new Set();
    (players || []).forEach((p) => {
      const key = `${(p.player_name || "").trim().toLowerCase()}|${(
        p.team_name || ""
      )
        .trim()
        .toLowerCase()}`;
      if (seen.has(key)) return;
      seen.add(key);
      unique.push(p);
    });

    // 2) split into XI vs others
    const xi = [];
    const others = [];

    unique.forEach((p) => {
      const team = (p.team_name || "").toLowerCase();
      if (team && (team === t1 || team === t2)) {
        xi.push(p);
      } else {
        others.push(p);
      }
    });

    // 3) sort
    xi.sort((a, b) => (a.player_name || "").localeCompare(b.player_name || ""));
    others.sort((a, b) =>
      (a.player_name || "").localeCompare(b.player_name || "")
    );

    // 4) search filter
    const search = momSearch.trim().toLowerCase();
    if (!search) return { xiPlayers: xi, otherPlayers: others };

    const matchSearch = (p) => {
      const name = (p.player_name || "").toLowerCase();
      const teamName = (p.team_name || "").toLowerCase();
      return name.includes(search) || teamName.includes(search);
    };

    return {
      xiPlayers: xi.filter(matchSearch),
      otherPlayers: others.filter(matchSearch),
    };
  }, [players, team1, team2, momSearch]);

  // 🆕 Currently selected MoM (for combobox label)
  const selectedMom = useMemo(
    () =>
      (players || []).find((p) => String(p.id) === String(momPlayerId)) || null,
    [players, momPlayerId]
  );
  // 🆕 Add new team (Admin only)
const handleAddTeam = async () => {
  if (!newTeamName.trim()) {
    alert("Team name is required.");
    return;
  }

  try {
    setAddingTeam(true);

    const token = localStorage.getItem("admin_jwt");

    await axios.post(
      "https://cricket-scoreboard-backend.onrender.com/api/admin/add-team",
      { team_name: newTeamName.trim() },
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    // Reload teams list
    const res = await axios.get(
      "https://cricket-scoreboard-backend.onrender.com/api/teams"
    );

    const uniqueTeams = Array.from(
      new Set((res.data || []).map((t) => t.team_name))
    ).sort();

    setTeamsList(uniqueTeams);

    // Auto select new team
    setTeam1(newTeamName.trim());

    setShowAddTeamModal(false);
    setNewTeamName("");
  } catch (err) {
    alert("Error adding team.");
  } finally {
    setAddingTeam(false);
  }
};

  const handleSubmit = async (e) => {
    e.preventDefault();
    const t1 = normalizeTeamName(team1);
    const t2 = normalizeTeamName(team2);

    if (!matchName) {
      alert(
        "❌ Match Name will auto-generate once Tournament, Year and both teams are set."
      );
      return;
    }
    if (t1.toLowerCase() === t2.toLowerCase()) {
      alert("❌ Both teams cannot be the same.");
      return;
    }
    if (overs1Error || overs2Error || wickets1Error || wickets2Error) {
      alert("❌ Please fix all validation errors before submitting.");
      return;
    }
    if (!validateTournament()) return;

    if (!momPlayerId) {
      alert("❌ Man of the Match is required. Please select a player.");
      return;
    }
    if (!selectedMom) {
      alert("❌ Selected MoM player not found. Please re-select.");
      return;
    }
    if (!momReason.trim()) {
      alert("❌ Reason for MoM is required.");
      return;
    }

    try {
      setIsSubmitting(true);
      const storedUser = JSON.parse(localStorage.getItem("user"));
      const userId = storedUser?.id;

      const match = await createMatch({
        match_name: matchName,
        match_type: matchType,
        user_id: userId,
      });

      const payload = {
        match_id: match.match_id,
        match_type: matchType,
        team1: t1,
        team2: t2,
        runs1: parseInt(runs1 || 0, 10),
        overs1: parseFloat(overs1 || 0),
        wickets1: parseInt(wickets1 || 0, 10),
        runs2: parseInt(runs2 || 0, 10),
        overs2: parseFloat(overs2 || 0),
        wickets2: parseInt(wickets2 || 0, 10),
        user_id: userId,
        tournament_name: formatTournamentName(tournamentName.trim()),
        season_year: Number(seasonYear),
        match_date: matchDate,
        mom_player_id: selectedMom.id,
        mom_player: selectedMom.player_name,
        mom_reason: momReason.trim(),
      };

      const result = await submitMatchResult(payload);
      const msg = result.message || "Match submitted.";
      setResultMsg(msg);
      const winner = extractWinnerName(msg, t1, t2);
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
      {showPopup && (
        <Confetti
          width={width}
          height={height}
          numberOfPieces={300}
          recycle={false}
        />
      )}
      {showPopup && (
        <div className="celebration-banner">
          🎉 Congratulations {winnerTeam}!
        </div>
      )}

      <div className="card shadow p-4">
        <h3 className="text-center mb-4 text-primary">🏏 Enter Match Details</h3>

        <form onSubmit={handleSubmit}>
          {/* Read-only, auto-filled name */}
          <div className="mb-3">
            <label>Match Name:</label>
            <input
              type="text"
              className="form-control readonly-field"
              value={matchName}
              readOnly
              placeholder="Auto-generated: Champions Trophy 2025 : India vs Australia"
              aria-describedby="matchNameHelp"
              required
            />
            <small id="matchNameHelp" className="text-muted d-block mt-1">
              Name auto-populates from Tournament, Season Year and Teams.
            </small>
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
                  <option value="">
                    {tournamentsLoading ? "Loading…" : "Select tournament…"}
                  </option>
                  {tournaments.map((t) => (
                    <option key={t} value={t}>
                      {t /* already canonical */}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  className="btn btn-add-gold"
                  title="Add new tournament"
                  onClick={() => setAddOpen(true)}
                >
                  +
                </button>
              </div>
            </div>

            <div className="col-md-3">
              <label>Season Year:</label>
              {yearOptions.length ? (
                <select
                  className="form-select"
                  value={seasonYear}
                  onChange={(e) => setSeasonYear(Number(e.target.value))}
                >
                  {yearOptions.map((y) => (
                    <option key={y} value={y}>
                      {y}
                    </option>
                  ))}
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
              <input
                type="date"
                className="form-control"
                value={matchDate}
                onChange={(e) => setMatchDate(e.target.value)}
                required
              />
            </div>
          </div>

          {/* Add-new modal */}
          {addOpen && (
            <div className="addtour-backdrop" onClick={() => setAddOpen(false)}>
              <div
                className="addtour-modal"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="addtour-header">➕ Add Tournament</div>
                <div className="mb-2">
                  <label className="form-label">Tournament Name</label>
                  <input
                    className="form-control"
                    placeholder="e.g., Champions Trophy"
                    value={newTourName}
                    onChange={(e) => setNewTourName(e.target.value)}
                  />
                  <small className="text-muted d-block mt-1">
                    We’ll save this as:{" "}
                    <strong>{formattedPreview || "—"}</strong>
                  </small>
                </div>
                <div className="mb-3">
                  <label className="form-label">Season Year</label>
                  <input
                    type="number"
                    className="form-control"
                    value={newTourYear}
                    min={1860}
                    max={2100}
                    onChange={(e) => setNewTourYear(e.target.value)}
                  />
                </div>
                <div className="d-flex gap-2">
                  <button
                    className="btn btn-primary flex-fill"
                    onClick={addNewTournament}
                  >
                    Add
                  </button>
                  <button
                    className="btn btn-secondary flex-fill"
                    onClick={() => setAddOpen(false)}
                  >
                    Cancel
                  </button>
                </div>
                <small className="text-info d-block mt-2">
                  Tip: We format tournament names to Camel case (e.g., “Azar
                  Mehemood Ali Trophy”).
                </small>
              </div>
            </div>
          )}

          {/* Match Type */}
          <div className="mb-3 mt-3">
            <label>Match Type:</label>
            <select
              className="form-select"
              value={matchType}
              onChange={(e) => setMatchType(e.target.value)}
            >
              <option value="T20">T20</option>
              <option value="ODI">ODI</option>
            </select>
          </div>

          {/* Team 1 */}
          <h5 className="mt-4">Team 1 (Bat First)</h5>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
        <div style={{ flex: 1 }}>
          <Select
            styles={darkSelectStyles}
            options={teamsList.map((team) => ({
              value: team,
              label: team,
            }))}
            value={team1 ? { value: team1, label: team1 } : null}
            onChange={(selected) => setTeam1(selected?.value || "")}
            placeholder="Search & Select Team 1"
            isLoading={teamsLoading}
            isSearchable
          />
        </div>

        {isAdmin && (
          <button
            type="button"
            className="btn btn-warning"
            onClick={() => setShowAddTeamModal(true)}
            style={{ height: "38px" }}
          >
            +
          </button>
        )}
      </div>

          <div className="row">
            <div className="col">
              <input
                type="number"
                className="form-control mb-2"
                placeholder={`Runs by ${normalizeTeamName(team1) || "Team 1"}`}
                value={runs1}
                onChange={(e) => setRuns1(e.target.value)}
              />
            </div>
            <div className="col">
              <input
                type="text"
                className="form-control mb-2"
                placeholder="Overs"
                value={overs1}
                onChange={(e) =>
                  handleOversChange(
                    e.target.value,
                    setOvers1,
                    setOvers1Error,
                    team1
                  )
                }
              />
              {overs1Error && (
                <small className="text-danger">{overs1Error}</small>
              )}
            </div>
            <div className="col">
              <input
                type="number"
                className="form-control mb-2"
                placeholder="Wickets"
                value={wickets1}
                onChange={(e) =>
                  handleWicketsChange(
                    e.target.value,
                    setWickets1,
                    setWickets1Error
                  )
                }
              />
              {wickets1Error && (
                <small className="text-danger">{wickets1Error}</small>
              )}
            </div>
          </div>

          {/* Team 2 */}
          <h5 className="mt-4">Team 2</h5>
 <Select
  styles={darkSelectStyles}
  options={teamsList
    .filter((team) => team !== team1)
    .map((team) => ({
      value: team,
      label: team,
    }))}
  value={team2 ? { value: team2, label: team2 } : null}
  onChange={(selected) => setTeam2(selected?.value || "")}
  placeholder="Search & Select Team 2"
  isLoading={teamsLoading}
  isSearchable
/>

          <div className="row">
            <div className="col">
              <input
                type="number"
                className="form-control mb-2"
                placeholder={`Runs by ${normalizeTeamName(team2) || "Team 2"}`}
                value={runs2}
                onChange={(e) => setRuns2(e.target.value)}
              />
            </div>
            <div className="col">
              <input
                type="text"
                className="form-control mb-2"
                placeholder="Overs"
                value={overs2}
                onChange={(e) =>
                  handleOversChange(
                    e.target.value,
                    setOvers2,
                    setOvers2Error,
                    team2
                  )
                }
              />
              {overs2Error && (
                <small className="text-danger">{overs2Error}</small>
              )}
            </div>
            <div className="col">
              <input
                type="number"
                className="form-control mb-2"
                placeholder="Wickets"
                value={wickets2}
                onChange={(e) =>
                  handleWicketsChange(
                    e.target.value,
                    setWickets2,
                    setWickets2Error
                  )
                }
              />
              {wickets2Error && (
                <small className="text-danger">{wickets2Error}</small>
              )}
            </div>
          </div>

          {/* 🆕 Man of the Match (custom searchable dropdown) */}
          <h5 className="mt-4">Man of the Match</h5>
          <div className="mb-2">
            <label className="form-label">Select Player:</label>

            <div
              className={`mom-combobox ${momOpen ? "open" : ""}`}
              ref={momRef}
            >
              {/* Visible control */}
              <div
                className="mom-combobox-control"
                onClick={() => setMomOpen((o) => !o)}
              >
                <span
                  className={
                    selectedMom ? "mom-value" : "mom-value mom-placeholder"
                  }
                >
                  {selectedMom
                    ? `${selectedMom.player_name}${
                        selectedMom.team_name
                          ? ` (${selectedMom.team_name})`
                          : ""
                      }`
                    : playersLoading
                    ? "Loading players…"
                    : "Select Man of the Match"}
                </span>
                <span className="mom-select-arrow">▾</span>
              </div>

              {/* Dropdown panel with internal search + options */}
              {momOpen && (
                <div className="mom-dropdown-panel">
                  <input
                    type="text"
                    className="form-control mom-search-input"
                    placeholder="Search player by name or team…"
                    value={momSearch}
                    onChange={(e) => setMomSearch(e.target.value)}
                    autoFocus
                  />

                  <div className="mom-options-list">
                    {playersLoading && (
                      <div className="mom-option mom-option-disabled">
                        Loading players…
                      </div>
                    )}

                    {!playersLoading &&
                      xiPlayers.length === 0 &&
                      otherPlayers.length === 0 && (
                        <div className="mom-option mom-option-disabled">
                          No players match your search.
                        </div>
                      )}

                    {!playersLoading && xiPlayers.length > 0 && (
                      <>
                        <div className="mom-group-label">
                          Players from selected teams
                        </div>
                        {xiPlayers.map((p) => (
                          <div
                            key={p.id}
                            className={`mom-option ${
                              String(p.id) === String(momPlayerId)
                                ? "selected"
                                : ""
                            }`}
                            onClick={() => {
                              setMomPlayerId(p.id);
                              setMomOpen(false);
                            }}
                          >
                            {p.player_name}
                            {p.team_name ? ` (${p.team_name})` : ""}
                          </div>
                        ))}
                      </>
                    )}

                    {!playersLoading && otherPlayers.length > 0 && (
                      <>
                        <div className="mom-group-label">
                          Other registered players
                        </div>
                        {otherPlayers.map((p) => (
                          <div
                            key={p.id}
                            className={`mom-option ${
                              String(p.id) === String(momPlayerId)
                                ? "selected"
                                : ""
                            }`}
                            onClick={() => {
                              setMomPlayerId(p.id);
                              setMomOpen(false);
                            }}
                          >
                            {p.player_name}
                            {p.team_name ? ` (${p.team_name})` : ""}
                          </div>
                        ))}
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>

            {playersError && (
              <small className="text-danger d-block mt-1">
                {playersError}
              </small>
            )}
          </div>

          <textarea
            className="form-control mb-3"
            rows={2}
            placeholder="Reason for MoM (e.g. 85(45) + 1 wicket in a tight chase)"
            value={momReason}
            onChange={(e) => setMomReason(e.target.value)}
            required
          />

          <div className="d-grid mt-3">
            <button className="btn btn-primary" disabled={isSubmitting}>
              {isSubmitting ? "Submitting..." : "Submit Match"}
            </button>
          </div>
        </form>

        {resultMsg && (
          <div className="alert alert-success mt-3 text-center">
            {resultMsg}
          </div>
        )}
        {showAddTeamModal && (
  <div className="addteam-backdrop">
    <div className="addteam-modal">
      <h5>Add New Team</h5>

      <input
        type="text"
        className="form-control"
        placeholder="Enter Team Name"
        value={newTeamName}
        onChange={(e) => setNewTeamName(e.target.value)}
      />

      <div style={{ marginTop: "12px", display: "flex", gap: "10px" }}>
        <button
          className="btn btn-success"
          onClick={handleAddTeam}
          disabled={addingTeam}
        >
          {addingTeam ? "Adding..." : "Add"}
        </button>

        <button
          className="btn btn-secondary"
          onClick={() => setShowAddTeamModal(false)}
        >
          Cancel
        </button>
      </div>
    </div>
  </div>
)}
      </div>
    </div>
  );
}
