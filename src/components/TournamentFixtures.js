// ✅ src/components/TournamentFixtures.js
// CrickEdge – Tournament Fixture Management (Public Backend)
// FINAL STABLE VERSION + GROUP COLLAPSE + STICKY HEADERS

import React, { useEffect, useMemo, useState } from "react";
import * as pdfjsLib from "pdfjs-dist/legacy/build/pdf";
import pdfWorker from "pdfjs-dist/legacy/build/pdf.worker.entry";
import "./TournamentFixtures.css";

const API_BASE = "https://cricket-scoreboard-backend.onrender.com";
pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;

export default function TournamentFixtures() {
  const [tournamentName, setTournamentName] = useState("");
  const [seasonYear, setSeasonYear] = useState("");
  const [fixturePDF, setFixturePDF] = useState(null);

  const [tournamentList, setTournamentList] = useState([]);
  const [selectedTournament, setSelectedTournament] = useState("");

  const [pendingMatches, setPendingMatches] = useState([]);
  const [completedMatches, setCompletedMatches] = useState([]);

  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);

  // 🔥 NEW: collapse state per group
  const [collapsedGroups, setCollapsedGroups] = useState({});

  /* ---------------- API ---------------- */
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
    setCompletedMatches([]);
    setCollapsedGroups({}); // reset collapse on tournament change
    setLoading(false);
  };

  const fetchCompletedMatches = async (name, year) => {
    const res = await fetch(
      `${API_BASE}/api/tournament/completed?tournament_name=${name}&season_year=${year}`
    );
    setCompletedMatches(await res.json());
  };

  const markMatchCompleted = async (pendingId) => {
    await fetch(`${API_BASE}/api/tournament/complete-match`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        pending_id: pendingId,
        tournament_id: selectedTournament,
      }),
    });

    setPendingMatches((prev) =>
      prev.filter((p) => p.pending_id !== pendingId)
    );
  };

  /* ---------------- PDF PARSER ---------------- */
  const parseFixturePDF = async (file) => {
    const pdf = await pdfjsLib.getDocument(URL.createObjectURL(file)).promise;
    let rows = [];

    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();
      const grouped = {};

      content.items.forEach((it) => {
        const y = Math.round(it.transform[5]);
        if (!grouped[y]) grouped[y] = [];
        grouped[y].push(it.str);
      });

      rows.push(...Object.values(grouped).map((r) => r.join(" ").trim()));
    }

    const headers = rows[0].split(/\s{2,}/);

    return rows
      .slice(1)
      .map((r) => {
        const values = r.split(/\s{2,}/);
        const obj = {};
        headers.forEach((h, i) => (obj[h] = values[i] || ""));
        return obj;
      })
      .filter(
        (r) =>
          r.Match &&
          !r.Match.toLowerCase().includes("league") &&
          !r.Match.toLowerCase().includes("validated") &&
          !r.Match.toLowerCase().includes("match id")
      );
  };

  /* ---------------- Upload ---------------- */
  const uploadFixture = async () => {
    if (!tournamentName || !seasonYear || !fixturePDF) {
      alert("All fields required");
      return;
    }

    setUploading(true);
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
    setUploading(false);
    fetchTournamentList();
  };

  useEffect(() => {
    fetchTournamentList();
  }, []);

  /* ---------------- GROUP + SEARCH ---------------- */
  const filteredMatches = useMemo(() => {
    if (!search) return pendingMatches;
    const q = search.toLowerCase();
    return pendingMatches.filter((m) =>
      Object.values(m.match_data).some((v) =>
        String(v).toLowerCase().includes(q)
      )
    );
  }, [search, pendingMatches]);

  const groupedByGroup = useMemo(() => {
    const groups = {};
    filteredMatches.forEach((m) => {
      const g = m.match_data.Group || "Others";
      if (!groups[g]) groups[g] = [];
      groups[g].push(m);
    });
    return groups;
  }, [filteredMatches]);

  const columns =
    filteredMatches.length > 0
      ? Object.keys(filteredMatches[0].match_data)
      : [];

  const toggleGroup = (group) => {
    setCollapsedGroups((prev) => ({
      ...prev,
      [group]: !prev[group],
    }));
  };

  /* ---------------- UI ---------------- */
  return (
    <div className="tournament-fixtures">
      <h2 className="tf-title">🏏 Tournament Fixtures</h2>

      {/* Upload */}
      <div className="fixture-card">
        <h4 className="section-title">Upload Fixture (PDF)</h4>
        <div className="form-grid">
          <input
            className="tf-input"
            placeholder="Tournament Name"
            value={tournamentName}
            onChange={(e) => setTournamentName(e.target.value)}
          />
          <input
            className="tf-input"
            placeholder="Season Year"
            value={seasonYear}
            onChange={(e) => setSeasonYear(e.target.value)}
          />
          <label className="file-input">
            <input
              type="file"
              accept="application/pdf"
              onChange={(e) => setFixturePDF(e.target.files[0])}
            />
            {fixturePDF ? fixturePDF.name : "Choose PDF"}
          </label>
          <button className="primary-btn" onClick={uploadFixture}>
            {uploading ? "Uploading…" : "Upload"}
          </button>
        </div>
      </div>

      {/* Select + Search */}
      <div className="fixture-card">
        <h4 className="section-title">Select Tournament</h4>
        <div className="form-grid">
          <select
            className="tf-select"
            value={selectedTournament}
            onChange={(e) => {
              setSelectedTournament(e.target.value);
              fetchPendingMatches(e.target.value);
            }}
          >
            <option value="">Select Tournament</option>
            {tournamentList.map((t) => (
              <option key={t.tournament_id} value={t.tournament_id}>
                {t.tournament_name} ({t.season_year})
              </option>
            ))}
          </select>

          <input
            className="tf-input"
            placeholder="Search team / player / board…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Pending by Group */}
      {loading ? (
        <p>Loading…</p>
      ) : (
        Object.entries(groupedByGroup).map(([group, matches]) => {
          const collapsed = collapsedGroups[group];

          return (
            <div className="fixture-card group-card" key={group}>
              <div
                className="group-header"
                onClick={() => toggleGroup(group)}
              >
                <span className="group-title">Group {group}</span>
                <span className="group-toggle">
                  {collapsed ? "▸" : "▾"}
                </span>
              </div>

              <div
                className={`group-content ${
                  collapsed ? "collapsed" : "expanded"
                }`}
              >
                <div className="table-wrap">
                  <table className="pro-table">
                    <thead>
                      <tr>
                        {columns.map((c) => (
                          <th key={c}>{c}</th>
                        ))}
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {matches.map((m) => (
                        <tr key={m.pending_id}>
                          {columns.map((c) => (
                            <td key={c}>{m.match_data[c]}</td>
                          ))}
                          <td>
                            <label className="status-pill pending">
                              <input
                                type="checkbox"
                                onChange={() =>
                                  markMatchCompleted(m.pending_id)
                                }
                              />
                              Complete
                            </label>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          );
        })
      )}

      {/* Completed */}
      <div className="fixture-card">
        <h4 className="section-title">Completed Matches</h4>
        <button
          className="secondary-btn"
          onClick={() => {
            const t = tournamentList.find(
              (x) => x.tournament_id === selectedTournament
            );
            if (t) fetchCompletedMatches(t.tournament_name, t.season_year);
          }}
        >
          Load Completed
        </button>

        {completedMatches.length > 0 && (
          <div className="table-wrap">
            <table className="pro-table completed">
              <thead>
                <tr>
                  {Object.keys(completedMatches[0].match_data).map((c) => (
                    <th key={c}>{c}</th>
                  ))}
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {completedMatches.map((r) => (
                  <tr key={r.completed_id}>
                    {Object.keys(r.match_data).map((c) => (
                      <td key={c}>{r.match_data[c]}</td>
                    ))}
                    <td>
                      {new Date(r.completed_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
