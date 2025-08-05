import React, { useEffect, useState } from "react";
import axios from "axios";
import "./SchedulerPage.css";

// ✅ Helper to ensure .map calls don't fail
const asArray = (v) => {
  if (Array.isArray(v)) return v;
  if (Array.isArray(v?.rows)) return v.rows;
  if (Array.isArray(v?.data)) return v.data;
  if (Array.isArray(v?.items)) return v.items;
  return [];
};

const API_BASE = process.env.REACT_APP_API_BASE;

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

        useEffect(() => {
        axios
            .get(`${API_BASE}/api/scheduler/series`)
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

    if (!matchName.trim()) return setError("Match/Series name is required.");
    for (const b of boards) {
      if (!b.name.trim()) return setError("Every board must have a name.");
      if (b.teams.some((t) => !t.trim()))
        return setError(`All teams under board "${b.name || "(unnamed)"}" must be filled.`);
    }

    setLoading(true);
    try {
      const res = await axios.post(`${API_BASE}/api/scheduler/series`, {
        matchName,
        boards,
        options: { enforceGap: Number(gap), maxAttempts: 300 },
      });
      setResult(res.data);
      const list = await axios.get(`${API_BASE}/api/scheduler/series`);
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
      const fixtures = await axios.get(`${API_BASE}/api/scheduler/series/${seriesId}/fixtures`);
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
    if (!result?.fixtures?.length) return;
    const rows = [["Match ID", "Team 1", "Board 1", "Team 2", "Board 2", "Match Between"]];
    for (const f of result.fixtures) {
      rows.push([f.match_id, f.team1, f.team1_board, f.team2, f.team2_board, f.match_label]);
    }
    const csv = rows.map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    const safe = (result.series?.name || "schedule").replace(/\s+/g, "_").toLowerCase();
    a.download = `${safe}_fixtures.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="scheduler-page">
      <h1>Match Scheduler</h1>

      <div className="existing">
        <label>View existing series:</label>
        <select
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
        <button type="button" onClick={() => loadFixtures(selectedSeriesId)} disabled={!selectedSeriesId}>
          Load
        </button>
      </div>

      <form onSubmit={submit} className="scheduler-form">
        <div className="row">
          <label>Match / Series Name</label>
          <input
            type="text"
            value={matchName}
            onChange={(e) => setMatchName(e.target.value)}
            placeholder="e.g., Tri-Series 2025"
          />
        </div>

        <div className="row">
          <label>Spacing (no same team within last N matches)</label>
          <input
            type="number"
            min="1"
            value={gap}
            onChange={(e) => setGap(e.target.value)}
          />
        </div>

        <div className="boards">
          <div className="boards-header">
            <h2>Boards & Teams</h2>
            <button type="button" onClick={addBoard}>+ Add Board</button>
          </div>

          {boards.map((b, bIdx) => (
            <div className="board-card" key={bIdx}>
              <div className="board-head">
                <input
                  type="text"
                  value={b.name}
                  onChange={(e) => updateBoardName(bIdx, e.target.value)}
                  placeholder={`Board ${bIdx + 1} name (e.g., A)`}
                />
                <button type="button" onClick={() => removeBoard(bIdx)}>Remove Board</button>
              </div>

              <div className="teams">
                {b.teams.map((t, tIdx) => (
                  <div className="team-row" key={tIdx}>
                    <input
                      type="text"
                      value={t}
                      onChange={(e) => updateTeam(bIdx, tIdx, e.target.value)}
                      placeholder={`Team ${tIdx + 1} (e.g., India)`}
                    />
                    <button type="button" onClick={() => removeTeam(bIdx, tIdx)}>🗑</button>
                  </div>
                ))}
                <button type="button" onClick={() => addTeam(bIdx)}>+ Add Team</button>
              </div>
            </div>
          ))}
        </div>

        {error && <div className="error">{error}</div>}

        <div className="actions">
          <button type="submit" disabled={loading}>
            {loading ? "Generating..." : "Generate & Save Schedule"}
          </button>
        </div>
      </form>

      {result && (
        <div className="result">
          <div className="result-head">
            <h2>Schedule for: {result.series?.name}</h2>
            <div className="result-actions">
              <button onClick={downloadCSV}>Export CSV</button>
            </div>
          </div>
          <p>Total matches: {result.total_matches}</p>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Match ID</th>
                  <th>Team 1</th>
                  <th>Team 2</th>
                  <th>Match Between</th>
                </tr>
              </thead>
              <tbody>
                {result.fixtures.map((f) => (
                  <tr key={f.match_id}>
                    <td>{f.match_id}</td>
                    <td>{f.team1} ({f.team1_board})</td>
                    <td>{f.team2} ({f.team2_board})</td>
                    <td>{f.match_label}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="hint">
            Spacing rule applied: no team appears within the last <strong>{gap}</strong> match(es).
          </p>
        </div>
      )}
    </div>
  );
}
