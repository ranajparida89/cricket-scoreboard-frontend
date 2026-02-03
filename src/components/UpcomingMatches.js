// ✅ src/components/UpcomingMatches.js
// Polished dark UI with gold accents + info modal + filters + skeleton loader
// Uses Bootstrap (already in app) + react-icons. No breaking changes to data.

import React, { useEffect, useMemo, useState } from "react";
import { getUpcomingMatchList } from "../services/api";

// ✅ ADD THIS LINE
const API_BASE = "https://cricket-scoreboard-backend.onrender.com";

import {
  FaClock,
  FaCalendarAlt,
  FaGlobeAsia,
  FaSyncAlt,
  FaInfo,
  FaSearch,
} from "react-icons/fa";
import "./UpcomingMatches.css";
import * as pdfjsLib from "pdfjs-dist/legacy/build/pdf";
import pdfWorker from "pdfjs-dist/legacy/build/pdf.worker.entry";

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;



export default function UpcomingMatches() {

  // ================= AUTH ROLE CHECK (STEP 10C) =================
 // ================= ADMIN AUTH CHECK =================
const isAdmin = localStorage.getItem("isAdmin") === "true";

  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  // UI state
  const [q, setQ] = useState("");
  const [format, setFormat] = useState("All"); // All | ODI | T20 | Test
  const [status, setStatus] = useState("All"); // All | Scheduled | Postponed | Cancelled
  const [dayNight, setDayNight] = useState("All"); // All | Day | Night
  const [showInfo, setShowInfo] = useState(false);

  // ================= Tournament Fixture State (NEW) =================

// Admin inputs
const [tournamentName, setTournamentName] = useState("");
const [seasonYear, setSeasonYear] = useState("");
const [fixturePDF, setFixturePDF] = useState(null);

// Tournament data
const [tournamentList, setTournamentList] = useState([]);
const [selectedTournament, setSelectedTournament] = useState("");
const [pendingMatches, setPendingMatches] = useState([]);
// ================= Pending Search (NEW) =================
const [pendingSearch, setPendingSearch] = useState("");
const [completedMatches, setCompletedMatches] = useState([]);
// ================= Completing Match State (STEP 14A) =================
const [completingId, setCompletingId] = useState(null);


// Loading flags
const [uploading, setUploading] = useState(false);
const [loadingPending, setLoadingPending] = useState(false);
const [loadingCompleted, setLoadingCompleted] = useState(false);
// ================= Completed History Selection =================
const [historyTournament, setHistoryTournament] = useState("");
const [historySeason, setHistorySeason] = useState("");
// ================= AUTH (ROLE CHECK) =================

// ================= Tournament APIs (NEW) =================

const fetchTournamentList = async () => {
  try {
    const res = await fetch(`${API_BASE}/api/tournament/list`);
    const data = await res.json();
    setTournamentList(data || []);
  } catch (err) {
    console.error("Failed to fetch tournament list", err);
  }
};


const fetchPendingMatches = async (tournamentId) => {
  if (!tournamentId) return;
  setLoadingPending(true);
  try {
    const res = await fetch(
      `${API_BASE}/api/tournament/pending/${tournamentId}`
    );
    const data = await res.json();
    setPendingMatches(data || []);
  } catch (err) {
    console.error("Failed to fetch pending matches", err);
  } finally {
    setLoadingPending(false);
  }
};


const fetchCompletedMatches = async (tournamentName, seasonYear) => {
  if (!tournamentName || !seasonYear) return;
  setLoadingCompleted(true);
  try {
    const res = await fetch(
      `/api/tournament/completed?tournament_name=${tournamentName}&season_year=${seasonYear}`
    );
    const data = await res.json();
    setCompletedMatches(data || []);
  } catch (err) {
    console.error("Failed to fetch completed matches", err);
  } finally {
    setLoadingCompleted(false);
  }
};

const markMatchCompleted = async (pendingId, tournamentId) => {
  try {
    setCompletingId(pendingId);

    // Optimistic UI
    setPendingMatches(prev =>
      prev.filter(row => row.pending_id !== pendingId)
    );

    await fetch("/api/tournament/complete-match", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        pending_id: pendingId,
        tournament_id: tournamentId
      }),
    });

  } catch (err) {
    console.error("Failed to mark match completed:", err);
    fetchPendingMatches(tournamentId); // rollback
  } finally {
    setCompletingId(null);
  }
};

// ================= PDF PARSING (ADMIN) =================
const parseFixturePDF = async (file) => {
  const pdf = await pdfjsLib.getDocument(URL.createObjectURL(file)).promise;

  let allRows = [];

  // 🔁 READ ALL PAGES
  for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
    const page = await pdf.getPage(pageNum);
    const content = await page.getTextContent();

    const rows = {};

    content.items.forEach(item => {
      const y = Math.round(item.transform[5]);
      if (!rows[y]) rows[y] = [];
      rows[y].push(item.str);
    });

    const pageRows = Object.values(rows)
      .map(r => r.join(" ").trim())
      .filter(Boolean);

    allRows = allRows.concat(pageRows);
  }

  if (allRows.length < 2) return [];

  // 🧠 FIRST ROW = HEADERS
let headers = allRows[0].split(/\s{2,}/);

// ✅ Auto-add Board Name & Owner Name if missing
if (!headers.includes("Board Name")) {
  headers.push("Board Name");
}
if (!headers.includes("Owner Name")) {
  headers.push("Owner Name");
}

  // 🧠 REMAINING ROWS = MATCH DATA
const matches = allRows.slice(1).map(row => {
  const values = row.split(/\s{2,}/);
  const obj = {};

  headers.forEach((h, i) => {
    if (h === "Board Name") {
      obj[h] = "N/A";
    } else if (h === "Owner Name") {
      obj[h] = "N/A";
    } else {
      obj[h] = values[i] || "";
    }
  });

  return obj;
});
  return matches;
};



  const fetchMatches = async () => {
    try {
      setLoading(true);
      setError(false);
      const data = await getUpcomingMatchList();
      setMatches(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Error fetching upcoming matches:", err);
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMatches();
    fetchTournamentList(); // NEW
  }, []);

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      weekday: "short",
    });
  };

  // ================= Helpers for Dynamic Table =================
const getPendingColumns = () => {
  if (!pendingMatches || pendingMatches.length === 0) return [];
  return Object.keys(pendingMatches[0].match_data || {});
};

// ================= Highlight Helper =================
const highlightText = (text, search) => {
  if (!search) return text;

  const regex = new RegExp(`(${search})`, "gi");
  const parts = String(text).split(regex);

  return parts.map((part, i) =>
    part.toLowerCase() === search.toLowerCase() ? (
      <mark key={i} style={{ backgroundColor: "#ffd54f", padding: "0 3px" }}>
        {part}
      </mark>
    ) : (
      part
    )
  );
};


  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    return matches.filter((m) => {
      const okFormat = format === "All" || (m.match_type || "").toLowerCase() === format.toLowerCase();
      const okStatus = status === "All" || (m.match_status || "") === status;
      const okDayNight = dayNight === "All" || (m.day_night || "") === dayNight;
      const hay =
        `${m.match_name ?? ""} ${m.series_name ?? ""} ${m.team_playing ?? ""} ${m.location ?? ""}`
          .toLowerCase();
      const okSearch = !term || hay.includes(term);
      return okFormat && okStatus && okDayNight && okSearch;
    });
  }, [matches, q, format, status, dayNight]);

  return (
    <div className="um-wrap" data-component="UpcomingMatches.list">
      {/* ================= ADMIN: TOURNAMENT FIXTURE UPLOAD ================= */}
      {isAdmin && (
        <>
<div className="um-admin-box">
  <h3 className="um-admin-title">Tournament Fixture Upload (Admin)</h3>
  <select
  className="um-input"
  value={selectedTournament}
  onChange={(e) => {
    setSelectedTournament(e.target.value);
    fetchPendingMatches(e.target.value);
  }}
>
  <option value="">Select Tournament to View Pending Matches</option>
  {tournamentList.map(t => (
    <option key={t.tournament_id} value={t.tournament_id}>
      {t.tournament_name} ({t.season_year})
    </option>
  ))}
</select>


  <div className="um-admin-form">
    <input
      type="text"
      className="um-input"
      placeholder="Tournament Name (e.g. World Cup)"
      value={tournamentName}
      onChange={(e) => setTournamentName(e.target.value)}
    />

    <input
      type="text"
      className="um-input"
      placeholder="Season Year (e.g. 2026)"
      value={seasonYear}
      onChange={(e) => setSeasonYear(e.target.value)}
    />

    <input
      type="file"
      className="um-input"
      accept="application/pdf"
      onChange={(e) => setFixturePDF(e.target.files[0])}
    />

    <button
      className="um-btn refresh"
      disabled={uploading}
     onClick={async () => {
  if (!tournamentName || !seasonYear || !fixturePDF) {
    alert("Please enter tournament name, season year and select a PDF");
    return;
  }

  try {
    setUploading(true);

    // 1️⃣ Parse PDF
   const matches = await parseFixturePDF(fixturePDF);

if (!matches || matches.length === 0) {
  alert("No match data found in PDF");
  setUploading(false);   // 🔥 IMPORTANT FIX
  return;
}

    // 2️⃣ Upload to backend
   await fetch(`${API_BASE}/api/tournament/upload-fixture`, {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    Authorization: `Bearer ${localStorage.getItem("adminToken")}`,
  },
  body: JSON.stringify({
    tournament_name: tournamentName,
    season_year: seasonYear,
    uploaded_pdf_name: fixturePDF.name,
    matches,
  }),
});

  alert("Fixture uploaded successfully");

// 🔁 Reload tournament list
const res = await fetch(`${API_BASE}/api/tournament/list`);
const list = await res.json();
setTournamentList(list);

// ✅ Auto-select latest tournament
const latestTournament = list[0];
setSelectedTournament(latestTournament.tournament_id);

// ✅ Load pending matches immediately
fetchPendingMatches(latestTournament.tournament_id);

// reset form
setTournamentName("");
setSeasonYear("");
setFixturePDF(null);

  } catch (err) {
    console.error("Upload fixture failed:", err);
    alert("Failed to upload fixture");
  } finally {
    setUploading(false);
  }
}}

    >
      {uploading ? "Uploading..." : "Upload Fixture"}
    </button>
  </div>
</div>
{/* ================= END ADMIN UPLOAD ================= */}
</>
)}

{/* ================= PENDING MATCHES TABLE ================= */}
{selectedTournament && (
  <div className="um-pending-box">
    {/* 🔍 Pending Match Search */}
<div className="um-search mb-2">
  <FaSearch className="um-search-ico" />
  <input
    className="um-input"
    placeholder="Search player, team, board, owner..."
    value={pendingSearch}
    onChange={(e) => setPendingSearch(e.target.value)}
  />
</div>

    <h3 className="um-title">
      Pending Matches –{" "}
      {
        tournamentList.find(t => t.tournament_id === selectedTournament)
          ?.tournament_name
      }{" "}
      (
      {
        tournamentList.find(t => t.tournament_id === selectedTournament)
          ?.season_year
      }
      )
    </h3>

    {loadingPending ? (
      <div className="um-empty">Loading pending matches...</div>
    ) : pendingMatches.length === 0 ? (
      <div className="um-empty">No pending matches available.</div>
    ) : (
      <div className="table-responsive">
        <table className="table table-dark table-bordered">
          <thead>
            <tr>
              {getPendingColumns().map(col => (
                <th key={col}>{col}</th>
              ))}
              <th>Completed</th>
            </tr>
          </thead>
          <tbody>
            {pendingMatches
  .filter(row => {
    if (!pendingSearch) return true;

    return Object.values(row.match_data || {}).some(val =>
      String(val).toLowerCase().includes(pendingSearch.toLowerCase())
    );
  })
  .map(row => (

              <tr key={row.pending_id}>
                {getPendingColumns().map(col => (
                  <td key={col}>
  {highlightText(row.match_data[col] ?? "-", pendingSearch)}
</td>
                ))}
<td className="text-center">
  {isAdmin ? (
    <input
      type="checkbox"
      title={
        completingId === row.pending_id
          ? "Completing..."
          : "Mark match as completed"
      }
      disabled={completingId === row.pending_id}
      onChange={() =>
        markMatchCompleted(row.pending_id, selectedTournament)
      }
    />
  ) : (
    <span style={{ color: "#999", fontSize: "12px" }}>
      Admin only
    </span>
  )}
</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )}
  </div>
)}
{/* ================= END PENDING MATCHES ================= */}

{/* ================= COMPLETED MATCHES HISTORY ================= */}
<div className="um-completed-box">
  <h3 className="um-title">Completed Matches Details</h3>

  <div className="um-history-filters">
    <select
      className="um-input"
      value={historyTournament}
      onChange={(e) => setHistoryTournament(e.target.value)}
    >
      <option value="">Select Tournament</option>
      {tournamentList.map(t => (
        <option key={t.tournament_id} value={t.tournament_name}>
          {t.tournament_name}
        </option>
      ))}
    </select>

    <select
      className="um-input"
      value={historySeason}
      onChange={(e) => setHistorySeason(e.target.value)}
    >
      <option value="">Select Season Year</option>
      {[...new Set(tournamentList.map(t => t.season_year))].map(year => (
        <option key={year} value={year}>{year}</option>
      ))}
    </select>

    <button
      className="um-btn refresh"
      onClick={() =>
        fetchCompletedMatches(historyTournament, historySeason)
      }
      disabled={!historyTournament || !historySeason}
    >
      Load History
    </button>
  </div>

  {loadingCompleted ? (
    <div className="um-empty">Loading completed matches...</div>
  ) : completedMatches.length === 0 ? (
    <div className="um-empty">
      No completed matches found for selected tournament.
    </div>
  ) : (
    <div className="table-responsive">
      <table className="table table-dark table-bordered">
        <thead>
          <tr>
            {Object.keys(completedMatches[0].match_data || {}).map(col => (
              <th key={col}>{col}</th>
            ))}
            <th>Completed On</th>
          </tr>
        </thead>
        <tbody>
          {completedMatches.map(row => (
            <tr key={row.completed_id}>
              {Object.keys(row.match_data).map(col => (
                <td key={col}>{row.match_data[col]}</td>
              ))}
              <td>
                {new Date(row.completed_at).toLocaleDateString("en-IN")}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )}
</div>
{/* ================= END COMPLETED MATCHES ================= */}


      {/* Title + actions */}
      <div className="um-titlebar">
        <div className="um-title-left">
          <span className="um-plus">+</span>
          <h2 className="um-title">Upcoming Match Details</h2>
        </div>

        <div className="um-actions">
          <button
            type="button"
            className="um-info-btn"
            aria-label="How this page works"
            title="About this page"
            onClick={() => setShowInfo(true)}
          >
            <FaInfo />
          </button>

          <button
            type="button"
            className="um-btn refresh"
            onClick={fetchMatches}
            title="Refresh list"
          >
            <FaSyncAlt className="me-2" />
            Refresh
          </button>
        </div>
      </div>

      {/* Toolbar: search + filters */}
      <div className="um-toolbar">
        <div className="um-search">
          <FaSearch className="um-search-ico" />
          <input
            className="um-input"
            placeholder="Search team, series or venue…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>

        <div className="um-filters">
          <select
            className="um-input"
            value={format}
            onChange={(e) => setFormat(e.target.value)}
          >
            <option value="All">All Formats</option>
            <option value="ODI">ODI</option>
            <option value="T20">T20</option>
            <option value="Test">Test</option>
          </select>

          <select
            className="um-input"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
          >
            <option value="All">All Status</option>
            <option value="Scheduled">Scheduled</option>
            <option value="Postponed">Postponed</option>
            <option value="Cancelled">Cancelled</option>
          </select>

          <select
            className="um-input"
            value={dayNight}
            onChange={(e) => setDayNight(e.target.value)}
          >
            <option value="All">Day or Night</option>
            <option value="Day">Day</option>
            <option value="Night">Night</option>
          </select>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="um-grid">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="um-card um-skeleton">
              <div className="um-skel-line w40"></div>
              <div className="um-skel-line w70"></div>
              <div className="um-skel-line w55"></div>
              <div className="um-skel-line w65"></div>
              <div className="um-skel-line w30"></div>
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="um-empty error">Failed to load upcoming matches. Please try again.</div>
      ) : filtered.length === 0 ? (
        <div className="um-empty">No upcoming matches match your filters.</div>
      ) : (
        <div className="um-grid">
          {filtered.map((m, i) => (
            <article key={i} className="um-card">
              <header className="um-card-head">
                <div className="um-chip">{m.match_type}</div>
                <h3 className="um-card-title">{m.match_name || "—"}</h3>
              </header>

              <div className="um-card-line teams">
                <strong>Teams:</strong>
                <span className="um-teams">{m.team_playing || "—"}</span>
              </div>

              <div className="um-card-line">
                <FaGlobeAsia className="um-ico" />
                <span>{m.location || "—"}</span>
              </div>

              <div className="um-card-line">
                <FaCalendarAlt className="um-ico" />
                <span>{formatDate(m.match_date)}</span>
              </div>

              <div className="um-card-line">
                <FaClock className="um-ico" />
                <span>
                  {m.match_time || "--:--"} &nbsp;|&nbsp; <strong>{m.day_night} Match</strong>
                </span>
              </div>

              <div className="um-card-line">
                <strong>Series:</strong>
                <span>{m.series_name || "—"}</span>
              </div>

              <footer className="um-card-foot">
                <span className={`um-status ${String(m.match_status || "").toLowerCase()}`}>
                  {m.match_status}
                </span>
              </footer>
            </article>
          ))}
        </div>
      )}

      {/* Info modal */}
      {showInfo && (
        <div className="um-modal" role="dialog" aria-modal="true" aria-label="How this page works">
          <div className="um-modal-card">
            <div className="um-modal-head">
              <h3>About “Upcoming Match Details”</h3>
              <button className="um-x" onClick={() => setShowInfo(false)} aria-label="Close">×</button>
            </div>
            <ul className="um-help">
              <li>Use the <strong>search</strong> to find a series, team, or venue.</li>
              <li>Filter by <strong>format</strong>, <strong>status</strong> and <strong>Day/Night</strong>.</li>
              <li>Click <strong>Refresh</strong> to fetch the latest schedule.</li>
              <li>Cards glow with a <strong>golden</strong> accent on hover. ✨</li>
            </ul>
            <div className="um-modal-foot">
              <button className="um-btn ghost" onClick={() => setShowInfo(false)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
