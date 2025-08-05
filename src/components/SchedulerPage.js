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

  // Load existing series list on mount
  useEffect(() => {
    axios
      // 🔁 [UPDATE 3] Base URL now comes from API_URL
      .get(`${API_URL}/scheduler/series`)
      .then((r) => setSeriesList(asArray(r.data)))
      .catch(() => setSeriesList([]));
  }, []);

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
              onChange={(e) => loadFixtures(e.target.value)}
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
                    <th>Match ID</th>
                    <th>Team 1</th>
                    <th>Team 2</th>
                    <th>Match Between</th>
                  </tr>
                </thead>
                <tbody>
                  {(result?.fixtures || []).map((f) => (
                    <tr key={f.match_id ?? f.id}>
                      <td>{f.match_id}</td>
                      <td>
                        {f.team1} ({f.team1_board})
                      </td>
                      <td>
                        {f.team2} ({f.team2_board})
                      </td>
                      <td>{f.match_label}</td>
                    </tr>
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
    </div>
  );
}
