// ✅ src/components/TournamentFixtures.js
// FINAL – Pending + Completed + History + Multi-Group

import React, { useEffect, useMemo, useState } from "react";
import * as pdfjsLib from "pdfjs-dist/legacy/build/pdf";
import pdfWorker from "pdfjs-dist/legacy/build/pdf.worker.entry";
import "./TournamentFixtures.css";

const API_BASE = "https://cricket-scoreboard-backend.onrender.com";
pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;

export default function TournamentFixtures() {
  /* ---------------- CORE STATE ---------------- */
  const [tournamentList, setTournamentList] = useState([]);
  const [selectedTournament, setSelectedTournament] = useState("");

  const [pendingMatches, setPendingMatches] = useState([]);
  const [completedMatches, setCompletedMatches] = useState([]);

  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);

  const [collapsedGroups, setCollapsedGroups] = useState({});

  /* ---------------- FETCH ---------------- */

  const fetchTournamentList = async () => {
    const res = await fetch(`${API_BASE}/api/tournament/list`);
    setTournamentList(await res.json());
  };

  const fetchPendingMatches = async (id) => {
    if (!id) return;
    setLoading(true);

    const res = await fetch(`${API_BASE}/api/tournament/pending/${id}`);
    const data = await res.json();

    setPendingMatches(data);
    setCompletedMatches([]);       // reset history view
    setCollapsedGroups({});
    setLoading(false);
  };

  const fetchCompletedHistory = async (name, year) => {
    setLoading(true);
    const res = await fetch(
      `${API_BASE}/api/tournament/completed?tournament_name=${name}&season_year=${year}`
    );
    setCompletedMatches(await res.json());
    setPendingMatches([]);         // hide live data
    setLoading(false);
  };

  /* ---------------- COMPLETE MATCH ---------------- */

  const markMatchCompleted = async (pendingId) => {
    await fetch(`${API_BASE}/api/tournament/complete-match`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pending_id: pendingId }),
    });

    setPendingMatches((prev) => prev.filter(p => p.pending_id !== pendingId));
  };

  useEffect(() => {
    fetchTournamentList();
  }, []);

  /* ---------------- SEARCH ---------------- */

  const applySearch = (data) => {
    const q = search.trim().toLowerCase();
    if (!q) return data;

    return data.filter((m) =>
      Object.values(m.match_data).some(v =>
        String(v).toLowerCase().includes(q)
      )
    );
  };

  /* ---------------- GROUPING ---------------- */

  const groupByGroup = (matches) => {
    const groups = {};
    matches.forEach(m => {
      const g =
        (m.match_data.Group || "")
          .replace(/group/i, "")
          .trim() || "Others";

      if (!groups[g]) groups[g] = [];
      groups[g].push(m);
    });
    return groups;
  };

  const pendingGrouped = useMemo(
    () => groupByGroup(applySearch(pendingMatches)),
    [pendingMatches, search]
  );

  const completedGrouped = useMemo(
    () => groupByGroup(applySearch(completedMatches)),
    [completedMatches, search]
  );

  const columns =
    (pendingMatches[0] || completedMatches[0])?.match_data
      ? Object.keys(
          (pendingMatches[0] || completedMatches[0]).match_data
        )
      : [];

  const toggleGroup = (g) =>
    setCollapsedGroups(p => ({ ...p, [g]: !p[g] }));

  /* ---------------- RENDER GROUP TABLE ---------------- */

  const renderGroupTables = (groups, showCheckbox) =>
    Object.entries(groups).map(([group, matches]) => {
      const collapsed = collapsedGroups[group];
      return (
        <div className="fixture-card" key={group}>
          <div className="group-header" onClick={() => toggleGroup(group)}>
            <span className="group-title">
              Group {group} ({matches.length})
            </span>
            <span className="group-toggle">{collapsed ? "▸" : "▾"}</span>
          </div>

          {!collapsed && (
            <div className="table-wrap">
              <table className="pro-table">
                <thead>
                  <tr>
                    {columns.map(c => <th key={c}>{c}</th>)}
                    {showCheckbox && <th>Status</th>}
                  </tr>
                </thead>
                <tbody>
                  {matches.map(m => (
                    <tr key={m.pending_id || m.completed_id}>
                      {columns.map(c => (
                        <td key={c}>{m.match_data[c]}</td>
                      ))}
                      {showCheckbox && (
                        <td>
                          <label className="status-pill pending">
                            <input
                              type="checkbox"
                              onChange={() => markMatchCompleted(m.pending_id)}
                            />
                            Complete
                          </label>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      );
    });

  /* ---------------- UI ---------------- */

  const showPending = pendingMatches.length > 0;
  const showCompleted = completedMatches.length > 0;

  return (
    <div className="tournament-fixtures">
      <h2 className="tf-title">🏏 Tournament Fixtures</h2>

      {/* SELECT */}
      <div className="fixture-card">
        <div className="form-grid">
          <select
            className="tf-select"
            value={selectedTournament}
            onChange={(e) => {
              const t = tournamentList.find(
                x => x.tournament_id === e.target.value
              );
              setSelectedTournament(e.target.value);
              fetchPendingMatches(e.target.value);
              if (t) fetchCompletedHistory(t.tournament_name, t.season_year);
            }}
          >
            <option value="">Select Tournament</option>
            {tournamentList.map(t => (
              <option key={t.tournament_id} value={t.tournament_id}>
                {t.tournament_name} ({t.season_year})
              </option>
            ))}
          </select>

          <input
            className="tf-input"
            placeholder="Search…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {loading && <p>Loading…</p>}

      {/* PENDING */}
      {showPending && (
        <>
          <h3 className="section-title">Pending Matches</h3>
          {renderGroupTables(pendingGrouped, true)}
        </>
      )}

      {/* COMPLETED */}
      {showCompleted && (
        <>
          <h3 className="section-title">Completed Matches</h3>
          {renderGroupTables(completedGrouped, false)}
        </>
      )}

      {/* EMPTY STATE */}
      {!showPending && !showCompleted && !loading && (
        <p className="empty-text">
          No active fixtures. Select season & tournament to view history.
        </p>
      )}
    </div>
  );
}
