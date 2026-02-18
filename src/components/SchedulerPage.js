// ✅ src/components/SchedulerPage.js
// ✅ [UPDATE 1] Uses shared API base: import { API_URL } from "../services/api"
// ✅ [UPDATE 2] Removed process.env REACT_APP_API_BASE usage
// ✅ [UPDATE 3] Endpoints now `${API_URL}/scheduler/...` (API_URL already ends with /api)
// ✅ [UPDATE 4] Dark theme styling with Bootstrap classes
// ✅ [UPDATE 5] Safer mapping + quick CSV export

import React, { useEffect, useState } from "react";
import axios from "axios";
import { API_URL } from "../services/api"; // <-- [UPDATE 1]
import "./SchedulerPage.css";

// Helper to safely turn possible response shapes into an array
const asArray = (v) => {
  if (Array.isArray(v)) return v;
  if (Array.isArray(v?.rows)) return v.rows;
  if (Array.isArray(v?.data)) return v.data;
  if (Array.isArray(v?.items)) return v.items;
  return [];
};

// ❌ [REMOVED] const API_BASE = process.env.REACT_APP_API_BASE;  // <-- [UPDATE 2]

const emptyBoard = () => ({ name: "", teams: [""] });

export default function SchedulerPage() {
  const [matchName, setMatchName] = useState("");
  const [boards, setBoards] = useState([emptyBoard()]);
  const [gap, setGap] = useState(1);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);

  const [seriesList, setSeriesList] = useState([]);
  const [selectedSeriesId, setSelectedSeriesId] = useState("");

  // ✅ Excel Fixtures State
const [excelFixtures, setExcelFixtures] = useState([]);
const [excelLoading, setExcelLoading] = useState(false);
const [searchTerm, setSearchTerm] = useState("");
const [completedFixtures, setCompletedFixtures] = useState([]);

// ✅ Independent Excel Manager
const [uploading, setUploading] = useState(false);
const [isTournamentCompleted, setIsTournamentCompleted] = useState(false);
const [tournamentView, setTournamentView] = useState("RUNNING");
const [tournamentHistory, setTournamentHistory] = useState([]);
const [selectedHistoryGroup, setSelectedHistoryGroup] = useState(null);




// 🔐 Admin JWT Check
const isAdmin = !!localStorage.getItem("admin_jwt");

  // Load existing series list on mount
  useEffect(() => {
    axios
      // 🔁 [UPDATE 3] Base URL now comes from API_URL
      .get(`${API_URL}/scheduler/series`)
      .then((r) => setSeriesList(asArray(r.data)))
      .catch(() => setSeriesList([]));
  }, []);
// ✅ Auto-load active tournament on page load
        useEffect(() => {
          if (tournamentView === "RUNNING" || tournamentView === "COMPLETED") {
            loadActiveTournament();
          }

          if (tournamentView === "HISTORY") {
            loadTournamentHistory();
          }
        }, [tournamentView]);
  const addBoard = () => setBoards((b) => [...b, emptyBoard()]);
  const removeBoard = (idx) =>
    setBoards((prev) => (prev.length === 1 ? prev : prev.filter((_, i) => i !== idx)));

  const updateBoardName = (idx, v) =>
    setBoards((prev) => prev.map((b, i) => (i === idx ? { ...b, name: v } : b)));

  const addTeam = (bIdx) =>
    setBoards((prev) =>
      prev.map((b, i) => (i === bIdx ? { ...b, teams: [...b.teams, ""] } : b))
    );

  const removeTeam = (bIdx, tIdx) =>
    setBoards((prev) =>
      prev.map((b, i) =>
        i === bIdx
          ? { ...b, teams: b.teams.length > 1 ? b.teams.filter((_, j) => j !== tIdx) : b.teams }
          : b
      )
    );

  const updateTeam = (bIdx, tIdx, v) =>
    setBoards((prev) =>
      prev.map((b, i) =>
        i === bIdx ? { ...b, teams: b.teams.map((t, j) => (j === tIdx ? v : t)) } : b
      )
    );

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setResult(null);

    // Basic validation
    if (!matchName.trim()) return setError("Match/Series name is required.");
    for (const b of boards) {
      if (!b.name.trim()) return setError("Every board must have a name.");
      if (b.teams.some((t) => !t.trim()))
        return setError(`All teams under board "${b.name || "(unnamed)"}" must be filled.`);
    }

    setLoading(true);
    try {
      // 🔁 [UPDATE 3] Base URL now comes from API_URL
      const res = await axios.post(`${API_URL}/scheduler/series`, {
        matchName,
        boards,
        options: { enforceGap: Number(gap), maxAttempts: 300 },
      });

      setResult(res.data);

      // Refresh list and auto-select new series
      const list = await axios.get(`${API_URL}/scheduler/series`); // <-- [UPDATE 3]
      setSeriesList(list.data || []);
      setSelectedSeriesId(String(res.data?.series?.id || ""));
    } catch (err) {
      setError(err?.response?.data?.error || "Failed to generate schedule.");
    } finally {
      setLoading(false);
    }
  };


  const loadFixtures = async (seriesId) => {

    if (!seriesId) return;
    setSelectedSeriesId(seriesId);
    setError("");
    setLoading(true);
    try {
      // 🔁 [UPDATE 3] Base URL now comes from API_URL
      const fixtures = await axios.get(`${API_URL}/scheduler/series/${seriesId}/fixtures`);
      const meta = seriesList.find((s) => String(s.id) === String(seriesId));
      setResult({
        series: { id: seriesId, name: meta?.name || "" },
        total_matches: fixtures.data?.length || 0,
        fixtures: fixtures.data,
      });
    } catch {
      setError("Could not load fixtures for the selected series.");
    } finally {
      setLoading(false);
    }
  };

  // ✅ Load Active Running Tournament (Independent Excel Manager)
const loadActiveTournament = async () => {
  setExcelLoading(true);

  try {
    const endpoint =
  tournamentView === "RUNNING"
    ? `${API_URL}/scheduler/excel/active`
    : `${API_URL}/scheduler/excel/completed`;

const res = await axios.get(endpoint);


    setExcelFixtures(res.data.data || []);
    const fixtures = res.data.data || [];

    if (fixtures.length > 0) {
  const allFinished = fixtures.every(
    f =>
      f.status === "COMPLETED" ||
      f.status === "CANCELLED" ||
      f.status === "WALKOVER"
  );

  setIsTournamentCompleted(allFinished);

  // 🔥 AUTO LOAD COMPLETED DATA
  if (allFinished) {
    loadCompletedTournament();
  }

} else {
  setIsTournamentCompleted(false);
}




  } catch (err) {
    console.error("Active Tournament Load Error:", err);
  } finally {
    setExcelLoading(false);
  }
};

const loadCompletedTournament = async () => {
  try {
    const res = await axios.get(
      `${API_URL}/scheduler/excel/completed`
    );

    setCompletedFixtures(res.data.data || []);

  } catch (err) {
    console.error("Completed Tournament Load Error:", err);
  }
};

const loadHistoryFixtures = async (groupId) => {
  try {
    const res = await axios.get(
      `${API_URL}/scheduler/excel/group/${groupId}`
    );

    setSelectedHistoryGroup({
      id: groupId,
      fixtures: res.data.data || []
    });

  } catch (err) {
    console.error("History Fixtures Load Error:", err);
  }
};

const loadTournamentHistory = async () => {
  try {
    const res = await axios.get(
      `${API_URL}/scheduler/excel/history`
    );

    setTournamentHistory(res.data.data || []);
  } catch (err) {
    console.error("History Load Error:", err);
  }
};

// 🔥 Handle Excel Upload
const handleExcelUpload = async (e) => {
  const file = e.target.files[0];
  if (!file) return;

  const formData = new FormData();
  formData.append("file", file);

  setUploading(true);

  try {
    const res = await axios.post(
      `${API_URL}/scheduler/excel/upload`,
      formData,
      { headers: { "Content-Type": "multipart/form-data" } }
    );

    loadActiveTournament();

  } catch (err) {
    console.error(err);
    alert("Upload failed");
  } finally {
    setUploading(false);
  }
};

// 🔥 Admin Status Update
const handleStatusChange = async (fixtureId, newStatus) => {
  try {
    await axios.put(
      `${API_URL}/scheduler/excel/status/${fixtureId}`,
      { status: newStatus }
    );

    // Refresh active tournament
    loadActiveTournament();

  } catch (err) {
    console.error("Status update failed", err);
  }
};



  const downloadCSV = () => {
    const fixtures = result?.fixtures || [];
    if (!fixtures.length) return;

    const rows = [["Match ID", "Team 1", "Board 1", "Team 2", "Board 2", "Match Between"]];
    for (const f of fixtures) {
      rows.push([f.match_id, f.team1, f.team1_board, f.team2, f.team2_board, f.match_label]);
    }
    const csv = rows.map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    const safe = (result?.series?.name || "schedule").replace(/\s+/g, "_").toLowerCase();
    a.download = `${safe}_fixtures.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // 🔎 Case-insensitive search filter
const filteredFixtures = excelFixtures.filter((f) => {
  if (!searchTerm.trim()) return true;

  const keyword = searchTerm.toLowerCase();

  const row = f.row_data || {};

  return (
    (row["Match ID"] || "").toLowerCase().includes(keyword) ||
    (row["Team 1"] || "").toLowerCase().includes(keyword) ||
    (row["Team 2"] || "").toLowerCase().includes(keyword) ||
    (row["Owner 1"] || "").toLowerCase().includes(keyword) ||
    (row["Owner 2"] || "").toLowerCase().includes(keyword) ||
    (row["Group Match"] || "").toLowerCase().includes(keyword) ||
    (f.status || "").toLowerCase().includes(keyword)
  );
});

  return (
    <div className="container mt-4">
      {/* Header */}
      <div className="card bg-dark text-white shadow mb-4">
        <div className="card-body d-flex justify-content-between align-items-center">
          <h3 className="m-0">🗓️ Match Scheduler</h3>
          <div>
            <button
              className="btn btn-outline-info btn-sm me-2"
              onClick={downloadCSV}
              disabled={!result?.fixtures?.length}
              title={!result?.fixtures?.length ? "Generate or load a schedule first" : "Export CSV"}
            >
              Export CSV
            </button>
          </div>
        </div>
      </div>

      {/* Load existing series */}
      <div className="card bg-dark text-white shadow mb-4">
        <div className="card-body">
          <label className="form-label">View existing series</label>
          <div className="d-flex gap-2">
            <select
              className="form-select bg-dark text-white"
              value={selectedSeriesId}
              onChange={(e) => {
                  const id = e.target.value;
                  loadFixtures(id);         // old scheduler
                }}
               >
              <option value="">-- Select a series --</option>
              {asArray(seriesList).map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => loadFixtures(selectedSeriesId)}
              disabled={!selectedSeriesId}
            >
              Load
            </button>
          </div>
        </div>
      </div>

      {/* Create schedule form */}
      <form onSubmit={submit} className="card bg-dark text-white shadow mb-4">
        <div className="card-body">
          <div className="row g-3">
            <div className="col-md-6">
              <label className="form-label">Match / Series Name</label>
              <input
                type="text"
                className="form-control bg-dark text-white"
                value={matchName}
                onChange={(e) => setMatchName(e.target.value)}
                placeholder="e.g., Tri-Series 2025"
              />
            </div>

            <div className="col-md-6">
              <label className="form-label">Spacing (no same team within last N matches)</label>
              <input
                type="number"
                min="1"
                className="form-control bg-dark text-white"
                value={gap}
                onChange={(e) => setGap(e.target.value)}
              />
            </div>
          </div>

          {/* Boards & Teams */}
          <div className="d-flex justify-content-between align-items-center mt-4">
            <h5 className="m-0 text-info">Boards & Teams</h5>
            <button type="button" className="btn btn-outline-light btn-sm" onClick={addBoard}>
              + Add Board
            </button>
          </div>

          {boards.map((b, bIdx) => (
            <div key={bIdx} className="mt-3 p-3 rounded" style={{ background: "#111" }}>
              <div className="d-flex gap-2 align-items-center mb-2">
                <input
                  type="text"
                  className="form-control bg-dark text-white"
                  value={b.name}
                  onChange={(e) => updateBoardName(bIdx, e.target.value)}
                  placeholder={`Board ${bIdx + 1} name (e.g., A)`}
                />
                <button
                  type="button"
                  className="btn btn-outline-danger btn-sm"
                  onClick={() => removeBoard(bIdx)}
                >
                  Remove
                </button>
              </div>

              {/* Teams */}
              {b.teams.map((t, tIdx) => (
                <div key={tIdx} className="d-flex gap-2 align-items-center mb-2">
                  <input
                    type="text"
                    className="form-control bg-dark text-white"
                    value={t}
                    onChange={(e) => updateTeam(bIdx, tIdx, e.target.value)}
                    placeholder={`Team ${tIdx + 1} (e.g., India)`}
                  />
                  <button
                    type="button"
                    className="btn btn-outline-warning btn-sm"
                    onClick={() => removeTeam(bIdx, tIdx)}
                    title="Remove team"
                  >
                    🗑
                  </button>
                </div>
              ))}
              <button
                type="button"
                className="btn btn-outline-info btn-sm"
                onClick={() => addTeam(bIdx)}
              >
                + Add Team
              </button>
            </div>
          ))}

          {error && <div className="alert alert-danger mt-3">{error}</div>}

          <div className="d-flex justify-content-end mt-3">
            <button type="submit" className="btn btn-success" disabled={loading}>
              {loading ? "Generating..." : "Generate & Save Schedule"}
            </button>
          </div>
        </div>
      </form>

      {/* Results */}
      {result && (
        <div className="card bg-dark text-white shadow">
          <div className="card-body">
            <div className="d-flex justify-content-between align-items-start flex-wrap">
              <h5 className="text-info mb-3">Schedule for: {result.series?.name}</h5>
              <small className="text-muted">
                Spacing rule: no team appears within the last <strong>{gap}</strong> match(es)
              </small>
            </div>

            <p className="mb-3">Total matches: {result.total_matches}</p>

            <div className="table-responsive">
              <table className="table table-dark table-striped table-hover align-middle">
                <thead>
                  <tr>
                    <th>Group</th>
                    <th>Match ID</th>
                    <th>Team 1</th>
                    <th>Team 2</th>
                    <th>Match Between</th>
                  </tr>
                </thead>
               <tbody>
  {Object.entries(
    (result?.fixtures || []).reduce((acc, fixture) => {
      const group = fixture.group_name || "Ungrouped";
      if (!acc[group]) acc[group] = [];
      acc[group].push(fixture);
      return acc;
    }, {})
  ).map(([groupName, groupFixtures]) => (
    <React.Fragment key={groupName}>

      {/* GROUP HEADER */}
      <tr className="table-info text-dark fw-bold">
        <td colSpan="5">🏆 {groupName}</td>
      </tr>

      {/* GROUP MATCHES */}
      {groupFixtures.map((f) => (
        <tr key={f.match_id ?? f.id}>
          <td>{groupName}</td>
          <td>{f.match_id}</td>
          <td>{f.team1} ({f.team1_board})</td>
          <td>{f.team2} ({f.team2_board})</td>
          <td>{f.match_label}</td>
        </tr>
      ))}

    </React.Fragment>
  ))}
</tbody>


              </table>
            </div>

            <div className="text-end">
              <button className="btn btn-outline-info btn-sm" onClick={downloadCSV}>
                Export CSV
              </button>
            </div>
          </div>
        </div>
      )}
            {/* ✅ Excel Fixtures Section */}
      {selectedSeriesId && (
        <div className="card bg-dark text-white shadow mt-4">
          <div className="card-body">

            <h5 className="text-warning mb-3">📄 Uploaded Excel Fixtures</h5>

            {excelLoading ? (
              <div>Loading Excel fixtures...</div>
            ) : excelFixtures.length === 0 ? (
              <div className="text-muted">No Excel fixtures uploaded.</div>
            ) : (
              <>
                <div className="table-responsive">
                  <table className="table table-dark table-bordered align-middle">
                    <thead>
                      <tr>
                        {Object.keys(excelFixtures[0].row_data).map((key) => (
                          <th key={key}>{key}</th>
                        ))}
                        <th>Status</th>
                        <th>Winner</th>
                      </tr>
                    </thead>
                    <tbody>
                      {excelFixtures.map((f) => (
                        <tr key={f.id}>
                          {Object.values(f.row_data).map((val, idx) => (
                            <td key={idx}>{val}</td>
                          ))}
                          <td>{f.status}</td>
                          <td>{f.winner || "-"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}

          </div>
        </div>
            )}

      {/* ======================= */}
      {/* 🔥 Independent Excel Fixture Manager */}
      {/* ======================= */}
      <div className="card bg-dark text-white shadow mt-4">
        <div className="card-body">

          <h4 className="text-warning mb-3">
            📂 Match Fixture Manager
          </h4>
                    <div className="mb-3">
              <select
              className="form-select w-auto"
              value={tournamentView}
              onChange={(e) => setTournamentView(e.target.value)}
            >
              <option value="RUNNING">Running Tournament</option>
              <option value="COMPLETED">Completed Tournament</option>
              <option value="HISTORY">Tournament History</option>
            </select>
            </div>

            {tournamentView === "HISTORY" && (
  <>
    <div className="alert alert-info text-center fw-bold">
      📜 Tournament History Archive
    </div>

    {tournamentHistory.length === 0 ? (
      <div className="text-muted">No past tournaments found.</div>
    ) : (
      <div className="table-responsive mb-4">
        <table className="table table-dark table-bordered align-middle">
          <thead>
            <tr>
              <th>ID</th>
              <th>Status</th>
              <th>Created At</th>
              <th>Total Matches</th>
              <th>Played</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {tournamentHistory.map((t) => (
              <tr key={t.id}>
                <td>{t.id}</td>
                <td>{t.tournament_status}</td>
                <td>{new Date(t.created_at).toLocaleString()}</td>
                <td>{t.total_matches}</td>
                <td>{t.played_matches}</td>
                <td>
                  <button
                    className="btn btn-sm btn-outline-info"
                    onClick={() => loadHistoryFixtures(t.id)}
                  >
                    View
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )}

    {selectedHistoryGroup && (
      <div className="table-responsive">
        <h6 className="text-warning">
          Viewing Tournament ID: {selectedHistoryGroup.id}
        </h6>
        <table className="table table-dark table-bordered align-middle">
          <thead>
            <tr>
              <th>SL No</th>
              <th>Match ID</th>
              {selectedHistoryGroup.fixtures[0] &&
                Object.keys(selectedHistoryGroup.fixtures[0].row_data)
                  .filter((key) => key !== "Match ID")
                  .map((key) => (
                    <th key={key}>{key}</th>
                  ))}
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {selectedHistoryGroup.fixtures.map((f, index) => (
              <tr key={f.id}>
                <td>{index + 1}</td>
                <td>{f.row_data["Match ID"] || "-"}</td>
                {Object.keys(f.row_data)
                  .filter((key) => key !== "Match ID")
                  .map((key, idx) => (
                    <td key={idx}>{f.row_data[key]}</td>
                  ))}
                <td>{f.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )}
  </>
)}
         {tournamentView === "COMPLETED" && (
      <div className="alert alert-info text-center fw-bold">
        📜 Viewing Completed Tournament
      </div>
    )}

    {tournamentView === "RUNNING" && isTournamentCompleted && (
      <div className="alert alert-success text-center fw-bold">
        🏆 Tournament Completed
      </div>
    )}

    {/* 🔎 Search Bar */}
    {excelFixtures.length > 0 && (
      <div className="mb-3">
        <input
          type="text"
          className="form-control"
          placeholder="Search by Match ID, Team, Owner, Group, Status..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>
    )}

    {isTournamentCompleted && completedFixtures.length > 0 && (
  <div className="table-responsive mt-3">
    <table className="table table-dark table-bordered align-middle">
      <thead>
        <tr>
          <th>SL No</th>
          <th>Match ID</th>
          {Object.keys(completedFixtures[0].row_data)
            .filter(key => key !== "Match ID")
            .map(key => (
              <th key={key}>{key}</th>
            ))}
          <th>Status</th>
        </tr>
      </thead>
      <tbody>
        {completedFixtures.map((f, index) => (
          <tr key={f.id}>
            <td>{index + 1}</td>
            <td>{f.row_data["Match ID"] || "-"}</td>
            {Object.keys(f.row_data)
              .filter(key => key !== "Match ID")
              .map((key, idx) => (
                <td key={idx}>{f.row_data[key]}</td>
              ))}
            <td>
              <span className="status-badge status-completed">
                {f.status}
              </span>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
)}

          {/* Upload Button */}
          <div className="mb-3">
        {isAdmin &&
          tournamentView === "RUNNING" &&
          !isTournamentCompleted && (
              <input
                type="file"
                accept=".xlsx,.xls"
                onChange={handleExcelUpload}
                className="form-control"
              />
            )}
          </div>

          {uploading && <div className="text-info">Uploading...</div>}

          {excelFixtures.length > 0 && !isTournamentCompleted && (
          <>
            <div className="text-muted mb-2">
              </div>

              {excelLoading ? (
                <div className="text-warning">Loading fixtures...</div>
              ) : (
                <div className="table-responsive">
                  <table className="table table-dark table-bordered align-middle">
                     <thead>
                      <tr>
                        <th>SL No</th>
                        <th>Match ID</th>

                        {excelFixtures[0] &&
                          Object.keys(excelFixtures[0].row_data)
                            .filter((key) => key !== "Match ID")
                            .map((key) => (
                              <th key={key}>{key}</th>
                            ))}

                        <th>Status</th>
                      </tr>
                    </thead>
                   <tbody>
                  {filteredFixtures.length > 0 ? (
                  filteredFixtures.map((f, index) => (
                    <tr
                      key={f.id}
                      className={
                        f.status === "COMPLETED"
                          ? "row-completed"
                          : f.status === "CANCELLED"
                          ? "row-cancelled"
                          : f.status === "WALKOVER"
                          ? "row-walkover"
                          : ""
                      }
                    >

                      {/* Serial Number */}
                      <td>{index + 1}</td>

                      {/* Match ID always second */}
                      <td>{f.row_data["Match ID"] || "-"}</td>

                      {/* Remaining Columns */}
                      {Object.keys(f.row_data)
                        .filter((key) => key !== "Match ID")
                        .map((key, idx) => (
                          <td key={idx}>{f.row_data[key]}</td>
                        ))}

                       <td>
                      {isAdmin && !isTournamentCompleted ? (
                          <select
                            className="form-select form-select-sm status-dropdown"
                            value={f.status}
                            onChange={(e) =>
                              handleStatusChange(f.id, e.target.value)
                            }
                          >
                          <option value="NOT_PLAYED">NOT_PLAYED</option>
                          <option value="COMPLETED">COMPLETED</option>
                          <option value="CANCELLED">CANCELLED</option>
                          <option value="WALKOVER">WALKOVER</option>
                        </select>
                       ) : (
                          <span
                            className={`status-badge ${
                              f.status === "COMPLETED"
                                ? "status-completed"
                                : f.status === "CANCELLED"
                                ? "status-cancelled"
                                : f.status === "WALKOVER"
                                ? "status-walkover"
                                : "status-notplayed"
                            }`}
                          >
                            {f.status}
                          </span>
                        )}
                    </td>
                    </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="100%" className="text-center text-warning fw-bold">
                        No results found for "{searchTerm}"
                      </td>
                    </tr>
                  )}
                </tbody>

                  </table>
                </div>
              )}
            </>
          )}

        </div>
      </div>

    </div>
  );
}

