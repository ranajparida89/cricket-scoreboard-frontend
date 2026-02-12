// ✅ src/components/TestMatchForm.js
import React, {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import axios from "axios";
import { createMatch, submitTestMatchResult } from "../services/api";
import { playSound } from "../utils/playSound";
import Confetti from "react-confetti";
import useWindowSize from "react-use/lib/useWindowSize";
import "./MatchForm.css";
import { useAuth } from "../services/auth";
import "./TestMatchForm.css";
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

/* ---- same formatter as MatchForm ---- */
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
  return parts.join("-");
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

const normalizeTeamName = (name) => {
  const m = {
    IND: "India",
    INDIA: "India",
    AUS: "Australia",
    AUSTRALIA: "Australia",
    ENG: "England",
    ENGLAND: "England",
    PAK: "Pakistan",
    PAKISTAN: "Pakistan",
    SA: "South Africa",
    "SOUTH AFRICA": "South Africa",
    NZ: "New Zealand",
    "NEW ZEALAND": "New Zealand",
    WI: "West Indies",
    "WEST INDIES": "West Indies",
    SL: "Sri Lanka",
    "SRI LANKA": "Sri Lanka",
    BAN: "Bangladesh",
    BANGLADESH: "Bangladesh",
    AFG: "Afghanistan",
    AFGHANISTAN: "Afghanistan",
    IRE: "Ireland",
    IRELAND: "Ireland",
    SCO: "Scotland",
    SCOTLAND: "Scotland",
    UAE: "United Arab Emirates",
    NEP: "Nepal",
  };
  const upper = (name || "").trim().toUpperCase();
  return m[upper] || (name || "").trim();
};

const isValidOver = (over) => {
  const parts = over.toString().split(".");
  const balls = parts[1] ? parseInt(parts[1][0], 10) : 0;
  return !isNaN(balls) && balls <= 5;
};

function todayISO() {
  const d = new Date();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${mm}-${dd}`;
}

// 🧠 Build test match name without duplicate year
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

export default function TestMatchForm() {
  const { width, height } = useWindowSize();
  const { currentUser } = useAuth();

  // Core
  const [matchName, setMatchName] = useState("");
  const [tournamentName, setTournamentName] = useState("");
  const [matchDate, setMatchDate] = useState(todayISO());
  const seasonDefault = useMemo(
    () => new Date(matchDate).getFullYear(),
    [matchDate]
  );
  const [seasonYear, setSeasonYear] = useState(seasonDefault);

const [team1, setTeam1] = useState("");
const [team2, setTeam2] = useState("");
const [teamsList, setTeamsList] = useState([]);
const [teamsLoading, setTeamsLoading] = useState(false);

// 🆕 Admin detection for Add Team
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


  const [resultMsg, setResultMsg] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showFireworks, setShowFireworks] = useState(false);
  const [celebrationText, setCelebrationText] = useState("");

  // Tournaments (scope=test) + years
  const [tournaments, setTournaments] = useState([]);
  const [tournamentsLoading, setTournamentsLoading] = useState(true);
  const [yearOptions, setYearOptions] = useState([]);

  // Add-new modal
  const [addOpen, setAddOpen] = useState(false);
  const [newTourName, setNewTourName] = useState("");
  const [newTourYear, setNewTourYear] = useState(seasonDefault);

  // Innings state
  const [innings, setInnings] = useState({
    t1i1: { runs: "", overs: "", wickets: "", error: "" },
    t2i1: { runs: "", overs: "", wickets: "", error: "" },
    t1i2: { runs: "", overs: "", wickets: "", error: "" },
    t2i2: { runs: "", overs: "", wickets: "", error: "" },
  });

  // 🆕 MoM fields (ID-based)
  const [momPlayerId, setMomPlayerId] = useState("");
  const [momReason, setMomReason] = useState("");

  // 🆕 All players for dropdown
  const [players, setPlayers] = useState([]);
  const [playersLoading, setPlayersLoading] = useState(false);
  const [playersError, setPlayersError] = useState("");
  // 🆕 Search text for MoM dropdown
  const [momSearch, setMomSearch] = useState("");
  // 🆕 Custom dropdown open/close
  const [momOpen, setMomOpen] = useState(false);
  const momDropdownRef = useRef(null);

  const maxOvers = 450;

  const formattedPreview = formatTournamentName(newTourName);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handler = (e) => {
      if (
        momDropdownRef.current &&
        !momDropdownRef.current.contains(e.target)
      ) {
        setMomOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Load tournaments
  useEffect(() => {
    let cancelled = false;
    setTournamentsLoading(true);
    axios
      .get(`${API_BASE}/match/tournaments`, { params: { scope: "test" } })
      .then(({ data }) => {
        if (!cancelled)
          setTournaments(
            Array.isArray(data?.tournaments) ? data.tournaments : []
          );
      })
      .catch(() => !cancelled && setTournaments([]))
      .finally(() => !cancelled && setTournamentsLoading(false));
    return () => {
      cancelled = true;
    };
  }, []);

  // Load years when a tournament is chosen (newest first from API)
  useEffect(() => {
    let cancelled = false;
    if (!tournamentName) {
      setYearOptions([]);
      return;
    }
    axios
      .get(`${API_BASE}/match/tournaments/years`, {
        params: { scope: "test", tournament_name: tournamentName }, // pass as-is
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

  // 🆕 Load players for MoM dropdown
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
          console.error("Failed to load players for Test MoM dropdown:", err);
          setPlayersError("Could not load players. Please refresh or retry.");
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

  const updateInning = (key, field, value) => {
    setInnings((prev) => {
      const updated = { ...prev[key], [field]: value };
      let error = "";

      if (field === "overs") {
        if (!isValidOver(value)) {
          error = "Overs must have balls between 0 and 5";
        } else {
          const total = Object.entries(prev).reduce((acc, [k, inn]) => {
            const v = parseFloat(k === key ? value || 0 : inn.overs || 0);
            return acc + (isNaN(v) ? 0 : v);
          }, 0);
          if (total > maxOvers)
            error = `Input overs exceed remaining (${maxOvers})`;
        }
      }

      if (field === "wickets") {
        const w = parseInt(value, 10);
        if (isNaN(w) || w < 0 || w > 10) error = "Wickets must be 0–10";
      }

      return { ...prev, [key]: { ...updated, error } };
    });
  };

  const totalUsedOvers = () =>
    Object.values(innings).reduce((acc, inn) => {
      const o = parseFloat(inn.overs || 0);
      return acc + (isNaN(o) || !isValidOver(o) ? 0 : o);
    }, 0);

  const remainingOvers = () =>
    Math.max(0, (maxOvers - totalUsedOvers()).toFixed(1));

  // 🔁 Auto compose read-only match name
  useEffect(() => {
    setMatchName(
      buildMatchName(tournamentName?.trim(), seasonYear, team1, team2)
    );
  }, [tournamentName, seasonYear, team1, team2]);

  const calculateResult = () => {
    const t1Runs =
      parseInt(innings.t1i1.runs || 0, 10) +
      parseInt(innings.t1i2.runs || 0, 10);
    const t2Runs =
      parseInt(innings.t2i1.runs || 0, 10) +
      parseInt(innings.t2i2.runs || 0, 10);
    const t2W2 = parseInt(innings.t2i2.wickets || 0, 10);
    const used = totalUsedOvers();

    if (t2Runs > t1Runs)
      return { winner: normalizeTeamName(team2), points: 12 };
    if (t1Runs > t2Runs && t2W2 === 10)
      return { winner: normalizeTeamName(team1), points: 12 };
    if (used >= maxOvers) return { winner: "Draw", points: 4 };
    return { winner: "Draw", points: 4 };
  };

  const addNewTournament = (e) => {
    e.preventDefault();
    const raw = newTourName.trim();
    if (!raw) return;
    const fm = formatTournamentName(raw);
    const exists = (tournaments || []).some(
      (t) => formatTournamentName(t).toLowerCase() === fm.toLowerCase()
    );
    if (!exists) setTournaments((p) => [...p, fm].sort());
    setTournamentName(fm);
    setSeasonYear(Number(newTourYear) || seasonDefault);
    setAddOpen(false);
    setNewTourName("");
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

  // 🆕 MoM dropdown grouping + search + de-dup (like ODI/T20 form)
  const { xiPlayers, otherPlayers } = useMemo(() => {
    const norm = (name) => normalizeTeamName(name).toLowerCase();
    const t1 = norm(team1);
    const t2 = norm(team2);

    const xi = [];
    const others = [];

    (players || []).forEach((p) => {
      const team = (p.team_name || "").toLowerCase();
      if (team && (team === t1 || team === t2)) {
        xi.push(p);
      } else {
        others.push(p);
      }
    });

    // sort by player name
    xi.sort((a, b) => (a.player_name || "").localeCompare(b.player_name || ""));
    others.sort((a, b) =>
      (a.player_name || "").localeCompare(b.player_name || "")
    );

    const search = momSearch.trim().toLowerCase();
    const matchSearch = (p) => {
      if (!search) return true;
      const name = (p.player_name || "").toLowerCase();
      const teamName = (p.team_name || "").toLowerCase();
      return name.includes(search) || teamName.includes(search);
    };

    const dedupe = (list) => {
      const seen = new Set();
      const out = [];
      for (const p of list) {
        const key = `${(p.player_name || "").toLowerCase()}|${(
          p.team_name || ""
        ).toLowerCase()}`;
        if (!seen.has(key)) {
          seen.add(key);
          out.push(p);
        }
      }
      return out;
    };

    return {
      xiPlayers: dedupe(xi.filter(matchSearch)),
      otherPlayers: dedupe(others.filter(matchSearch)),
    };
  }, [players, team1, team2, momSearch]);

  // For showing selected label in fake select
  const selectedMomForLabel = useMemo(() => {
    if (!momPlayerId) return null;
    return (
      (players || []).find(
        (p) => String(p.id) === String(momPlayerId)
      ) || null
    );
  }, [players, momPlayerId]);

  const momPlaceholder = playersLoading
    ? "Loading players…"
    : "Select Man of the Match";

  const momDisplayLabel = selectedMomForLabel
    ? `${selectedMomForLabel.player_name}${
        selectedMomForLabel.team_name
          ? ` (${selectedMomForLabel.team_name})`
          : ""
      }`
    : momPlaceholder;

  const handleMomSelect = (p) => {
    setMomPlayerId(p.id);
    setMomOpen(false);
  };
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

    const res = await axios.get(
      "https://cricket-scoreboard-backend.onrender.com/api/teams"
    );

    const uniqueTeams = Array.from(
      new Set((res.data || []).map((t) => t.team_name))
    ).sort();

    setTeamsList(uniqueTeams);

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

    if (!matchName || !t1 || !t2)
      return alert("❌ Fill Tournament, Year, Teams to auto-generate the name.");
    if (t1.toLowerCase() === t2.toLowerCase())
      return alert("❌ Team names must be different.");
    if (Object.values(innings).some((inn) => inn.error))
      return alert("❌ Please fix validation errors.");
    if (!validateTournament()) return;

    // ✅ MoM must be selected from dropdown (by player_id)
    if (!momPlayerId) {
      return alert("❌ Man of the Match is required. Please select a player.");
    }
    const selectedMom = (players || []).find(
      (p) => String(p.id) === String(momPlayerId)
    );
    if (!selectedMom) {
      return alert("❌ Selected MoM player not found. Please re-select.");
    }
    if (!momReason.trim()) {
      return alert("❌ Reason for MoM is required.");
    }

    try {
      setIsSubmitting(true);
      const match = await createMatch({
        match_name: matchName,
        match_type: "Test",
      });
      const { winner, points } = calculateResult();

      const payload = {
        match_id: match.match_id,
        match_type: "Test",
        team1: t1,
        team2: t2,
        winner,
        points,
        runs1: parseInt(innings.t1i1.runs || 0, 10),
        overs1: parseFloat(innings.t1i1.overs || 0),
        wickets1: parseInt(innings.t1i1.wickets || 0, 10),
        runs2: parseInt(innings.t2i1.runs || 0, 10),
        overs2: parseFloat(innings.t2i1.overs || 0),
        wickets2: parseInt(innings.t2i1.wickets || 0, 10),
        runs1_2: parseInt(innings.t1i2.runs || 0, 10),
        overs1_2: parseFloat(innings.t1i2.overs || 0),
        wickets1_2: parseInt(innings.t1i2.wickets || 0, 10),
        runs2_2: parseInt(innings.t2i2.runs || 0, 10),
        overs2_2: parseFloat(innings.t2i2.overs || 0),
        wickets2_2: parseInt(innings.t2i2.wickets || 0, 10),
        total_overs_used: totalUsedOvers(),
        user_id: currentUser?.id,
        // ✅ Send formatted tournament name
        tournament_name: formatTournamentName(tournamentName.trim()),
        season_year: Number(seasonYear),
        match_date: matchDate,
        match_name: matchName,

        // ✅ NEW: MoM ID + name
        mom_player_id: selectedMom.id,
        mom_player: selectedMom.player_name,
        mom_reason: momReason.trim(),
      };

      const result = await submitTestMatchResult(payload);

      if ((result.message || "").includes("won")) {
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

  const isDuplicateTeam =
    team1.trim() &&
    team2.trim() &&
    normalizeTeamName(team1).toLowerCase() ===
      normalizeTeamName(team2).toLowerCase();

  return (
    <div className="container mt-4">
      {showFireworks && (
        <Confetti
          width={width}
          height={height}
          numberOfPieces={300}
          recycle={false}
        />
      )}
      {celebrationText && (
        <div className="celebration-banner">{celebrationText}</div>
      )}

      <div className="card shadow p-4 test-card">
        <h3 className="text-center mb-4 text-success">🏏 Test Match Form</h3>

        <form onSubmit={handleSubmit}>
          {/* Read-only, auto-filled name */}
          <div className="mb-2">
            <label>Match Name:</label>
            <input
              type="text"
              className="form-control readonly-field"
              value={matchName}
              readOnly
              placeholder="Auto-generated: World Test Championship 2025 : India vs Australia"
              aria-describedby="testMatchNameHelp"
              required
            />
            <small id="testMatchNameHelp" className="text-muted d-block mt-1">
              Name auto-populates from Tournament, Season Year and Teams.
            </small>
          </div>

          <div className="row g-3 mb-2 align-items-end">
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
                      {formatTournamentName(t)}
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
                    placeholder="e.g., World Test Championship"
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
                  Tip: We format tournament names to Camel case (e.g., “Border
                  Gavaskar Series”).
                </small>
              </div>
            </div>
          )}

          <div className="row mb-3">
<div className="col">
  <label>Team 1:</label>

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
</div>

  <div className="col">
  <label>Team 2:</label>

  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
    <div style={{ flex: 1 }}>
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
</div>
          </div>

          {isDuplicateTeam && (
            <div className="alert alert-danger text-center py-2">
              ❌ Team names must be different!
            </div>
          )}

          {/* Info row */}
          <div className="mb-3 row">
            <div className="col">
              <label className="muted-label">🗓️ Total Days</label>
              <input
                className="form-control form-control-static"
                value="5"
                disabled
              />
            </div>
            <div className="col">
              <label className="muted-label">🎯 Overs/Day</label>
              <input
                className="form-control form-control-static"
                value="90"
                disabled
              />
            </div>
            <div className="col">
              <label className="muted-label">🧮 Total Overs</label>
              <input
                className="form-control form-control-static"
                value="450"
                disabled
              />
            </div>
            <div className="col">
              <label className="muted-label">⏳ Overs Remaining</label>
              <input
                className="form-control form-control-static"
                value={remainingOvers()}
                disabled
              />
            </div>
          </div>

          {/* Innings inputs */}
          {[
            [`${team1 || "Team 1"} - 1st Innings`, "t1i1"],
            [`${team2 || "Team 2"} - 1st Innings`, "t2i1"],
            [`${team1 || "Team 1"} - 2nd Innings`, "t1i2"],
            [`${team2 || "Team 2"} - 2nd Innings`, "t2i2"],
          ].map(([label, key]) => (
            <div className="mb-2" key={key}>
              <label>
                <strong>{label}</strong>
              </label>
              <div className="row">
                <div className="col">
                  <input
                    type="number"
                    className="form-control"
                    placeholder="Runs"
                    value={innings[key].runs}
                    onChange={(e) =>
                      setInnings((p) => ({
                        ...p,
                        [key]: { ...p[key], runs: e.target.value },
                      }))
                    }
                  />
                </div>
                <div className="col">
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Overs"
                    value={innings[key].overs}
                    onChange={(e) => updateInning(key, "overs", e.target.value)}
                  />
                </div>
                <div className="col">
                  <input
                    type="number"
                    className="form-control"
                    placeholder="Wickets"
                    value={innings[key].wickets}
                    onChange={(e) =>
                      updateInning(key, "wickets", e.target.value)
                    }
                  />
                </div>
              </div>
              {innings[key].error && (
                <small className="text-danger">{innings[key].error}</small>
              )}
            </div>
          ))}

          {/* 🆕 Man of the Match Section (ID-based, custom dropdown with search) */}
          <h5 className="mt-4">Man of the Match</h5>
          <div className="mb-2">
            <label className="form-label">Select Player:</label>

            <div
              className="test-mom-dropdown"
              ref={momDropdownRef}
            >
              {/* Fake select that opens panel */}
              <button
                type="button"
                className="form-select test-mom-select-display"
                onClick={() => setMomOpen((o) => !o)}
              >
                <span className={momPlayerId ? "" : "test-mom-placeholder"}>
                  {momDisplayLabel}
                </span>
                <span className="test-mom-select-arrow">
                  {momOpen ? "▴" : "▾"}
                </span>
              </button>

              {momOpen && (
                <div className="test-mom-panel">
                  {/* 🔍 Search input INSIDE dropdown panel */}
                  <input
                    type="text"
                    className="form-control test-mom-search-input"
                    placeholder="Search player by name or team…"
                    value={momSearch}
                    onChange={(e) => setMomSearch(e.target.value)}
                  />

                  <div className="test-mom-options">
                    {xiPlayers.length > 0 && (
                      <>
                        <div className="test-mom-group-label">
                          Players from selected teams
                        </div>
                        {xiPlayers.map((p) => (
                          <div
                            key={`${p.id}-xi`}
                            className={
                              "test-mom-option" +
                              (String(p.id) === String(momPlayerId)
                                ? " test-mom-option-selected"
                                : "")
                            }
                            onClick={() => handleMomSelect(p)}
                          >
                            {p.player_name}{" "}
                            {p.team_name ? `(${p.team_name})` : ""}
                          </div>
                        ))}
                      </>
                    )}

                    {otherPlayers.length > 0 && (
                      <>
                        <div className="test-mom-group-label">
                          Other registered players
                        </div>
                        {otherPlayers.map((p) => (
                          <div
                            key={`${p.id}-other`}
                            className={
                              "test-mom-option" +
                              (String(p.id) === String(momPlayerId)
                                ? " test-mom-option-selected"
                                : "")
                            }
                            onClick={() => handleMomSelect(p)}
                          >
                            {p.player_name}{" "}
                            {p.team_name ? `(${p.team_name})` : ""}
                          </div>
                        ))}
                      </>
                    )}

                    {!playersLoading &&
                      !xiPlayers.length &&
                      !otherPlayers.length && (
                        <div className="test-mom-empty">
                          No players found for this search.
                        </div>
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
            placeholder="Reason for MoM (e.g. 150 in 1st innings + 4 wickets)"
            value={momReason}
            onChange={(e) => setMomReason(e.target.value)}
            required
          />

          <div className="d-grid mt-4">
            <button className="btn btn-success" disabled={isSubmitting}>
              {isSubmitting ? "Submitting..." : "Submit Test Match"}
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
