// src/components/TournamentFixtures.js
// FINAL – Dynamic Column Detection from PDF

import React, { useEffect, useMemo, useState } from "react";
import * as pdfjsLib from "pdfjs-dist/legacy/build/pdf";
import pdfWorker from "pdfjs-dist/legacy/build/pdf.worker.entry";
import "./TournamentFixtures.css";

const API_BASE = "https://cricket-scoreboard-backend.onrender.com";
pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;

export default function TournamentFixtures() {
  /* ---------------- Upload ---------------- */
  const [tournamentName, setTournamentName] = useState("");
  const [seasonYear, setSeasonYear] = useState("");
  const [fixturePDF, setFixturePDF] = useState(null);

  /* ---------------- Data ---------------- */
  const [tournamentList, setTournamentList] = useState([]);
  const [selectedTournament, setSelectedTournament] = useState("");

  const [pendingMatches, setPendingMatches] = useState([]);
  const [completedMatches, setCompletedMatches] = useState([]);

  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [collapsedGroups, setCollapsedGroups] = useState({});

  /* ---------------- API ---------------- */

  const fetchTournamentList = async () => {
    const res = await fetch(`${API_BASE}/api/tournament/list`);
    setTournamentList(await res.json());
  };

  const fetchPendingMatches = async (tournamentId) => {
    if (!tournamentId) return;
    setLoading(true);

    const res = await fetch(
      `${API_BASE}/api/tournament/pending/${tournamentId}`
    );
    setPendingMatches(await res.json());
    setCompletedMatches([]);
    setCollapsedGroups({});
    setLoading(false);
  };

  const fetchCompletedHistory = async (name, year) => {
    setLoading(true);

    const res = await fetch(
      `${API_BASE}/api/tournament/completed?tournament_name=${name}&season_year=${year}`
    );

    setCompletedMatches(await res.json());
    setPendingMatches([]);
    setLoading(false);
  };

  const markMatchCompleted = async (row) => {
    await fetch(`${API_BASE}/api/tournament/complete-match`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        pending_id: row.pending_id,
        tournament_id: selectedTournament,
      }),
    });

    setPendingMatches(p =>
      p.filter(x => x.pending_id !== row.pending_id)
    );
    setCompletedMatches(c => [...c, row]);
  };

  useEffect(() => {
    fetchTournamentList();
  }, []);

  /* ---------------- PDF PARSER (AUTO HEADER DETECTION) ---------------- */

  const parseFixturePDF = async (file) => {
    const pdf = await pdfjsLib.getDocument(URL.createObjectURL(file)).promise;
    let lines = [];

    for (let p = 1; p <= pdf.numPages; p++) {
      const page = await pdf.getPage(p);
      const content = await page.getTextContent();
      const grouped = {};

      content.items.forEach(it => {
        const y = Math.round(it.transform[5]);
        if (!grouped[y]) grouped[y] = [];
        grouped[y].push(it.str.trim());
      });

      lines.push(...Object.values(grouped).map(r => r.join("  ").trim()));
    }

    // Remove empty lines
    lines = lines.filter(Boolean);

    // First meaningful row = headers
    const headers = lines[0].split(/\s{2,}/).map(h => h.trim());

    // Remaining rows = data
    return lines.slice(1).map(row => {
      const values = row.split(/\s{2,}/);
      const obj = {};
      headers.forEach((h, i) => {
        obj[h] = values[i] || "";
      });
      return obj;
    });
  };

  const uploadFixture = async () => {
    if (!tournamentName || !seasonYear || !fixturePDF) {
      alert("Tournament Name, Season Year and PDF are required");
      return;
    }

    setLoading(true);
    const matches = await parseFixturePDF(fixturePDF);

    await fetch(`${API_BASE}/api/tournament/upload-fixture`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        tournament_name: tournamentName,
        season_year: seasonYear,
        uploaded_pdf_name: fixturePDF.name,
        matches,
      }),
    });

    setTournamentName("");
    setSeasonYear("");
    setFixturePDF(null);
    fetchTournamentList();
    setLoading(false);
  };

  /* ---------------- SEARCH ---------------- */

  const applySearch = (data) => {
    if (!search.trim()) return data;
    return data.filter(m =>
      Object.values(m.match_data || {}).some(v =>
        String(v).toLowerCase().includes(search.toLowerCase())
      )
    );
  };

  /* ---------------- GROUPING ---------------- */

  const normalizeGroup = (val) => {
    if (!val) return "Others";
    return val.toString().replace(/group/i, "").trim().toUpperCase();
  };

  const groupByGroup = (matches) => {
    const groups = {};
    matches.forEach(m => {
      const g = normalizeGroup(m.match_data?.Group);
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

  /* ---------------- DYNAMIC COLUMNS ---------------- */

  const detectedColumns = useMemo(() => {
    const src = pendingMatches[0] || completedMatches[0];
    return src ? Object.keys(src.match_data || {}) : [];
  }, [pendingMatches, completedMatches]);

  const toggleGroup = (g) =>
    setCollapsedGroups(p => ({ ...p, [g]: !p[g] }));

  /* ---------------- RENDER TABLES ---------------- */

  const renderTables = (groups, checkbox) =>
    Object.entries(groups).map(([group, rows]) => (
      <div className="fixture-card" key={group}>
        <div className="group-header" onClick={() => toggleGroup(group)}>
          <span className="group-title">
            Group {group} ({rows.length})
          </span>
          <span>{collapsedGroups[group] ? "▸" : "▾"}</span>
        </div>

        {!collapsedGroups[group] && (
          <div className="table-wrap">
            <table className="pro-table">
              <thead>
                <tr>
                  {detectedColumns.map(c => <th key={c}>{c}</th>)}
                  {checkbox && <th>Status</th>}
                </tr>
              </thead>
              <tbody>
                {rows.map(r => (
                  <tr key={r.pending_id || r.completed_id}>
                    {detectedColumns.map(c => (
                      <td key={c}>{r.match_data?.[c] ?? ""}</td>
                    ))}
                    {checkbox && r.pending_id && (
                      <td>
                        <label className="status-pill pending">
                          <input
                            type="checkbox"
                            onChange={() => markMatchCompleted(r)}
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
    ));

  /* ---------------- UI ---------------- */

  return (
    <div className="tournament-fixtures">
      <h2 className="tf-title">🏏 Tournament Fixtures</h2>

      {/* UPLOAD */}
      <div className="fixture-card">
        <div className="form-grid">
          <input
            className="tf-input"
            placeholder="Tournament Name"
            value={tournamentName}
            onChange={e => setTournamentName(e.target.value)}
          />
          <input
            className="tf-input"
            placeholder="Season Year"
            value={seasonYear}
            onChange={e => setSeasonYear(e.target.value)}
          />
          <input
            type="file"
            accept="application/pdf"
            onChange={e => setFixturePDF(e.target.files[0])}
          />
          <button className="primary-btn" onClick={uploadFixture}>
            Upload Fixture
          </button>
        </div>
      </div>

      {/* SELECT + SEARCH */}
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
            placeholder="Search..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
      </div>

      {loading && <p>Loading...</p>}

      {pendingMatches.length > 0 && (
        <>
          <h3 className="section-title">Pending Matches</h3>
          {renderTables(pendingGrouped, true)}
        </>
      )}

      {completedMatches.length > 0 && (
        <>
          <h3 className="section-title">Completed Matches</h3>
          {renderTables(completedGrouped, false)}
        </>
      )}

      {!loading && pendingMatches.length === 0 && completedMatches.length === 0 && (
        <p className="empty-text">
          No active fixtures. Select a tournament to view history.
        </p>
      )}
    </div>
  );
}
