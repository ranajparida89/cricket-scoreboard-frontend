// ✅ src/components/TournamentFixtures.js
// CrickEdge – Tournament Fixture Management
// FINAL CLEAN VERSION (Grouped, Searchable, Stable)

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

  const [collapsedGroups, setCollapsedGroups] = useState({});

  /* ================= API ================= */

  const fetchTournamentList = async () => {
    const res = await fetch(`${API_BASE}/api/tournament/list`);
    setTournamentList(await res.json());
  };

  const fetchPendingMatches = async (id) => {
    if (!id) return;
    setLoading(true);
    const res = await fetch(`${API_BASE}/api/tournament/pending/${id}`);
    setPendingMatches(await res.json());
    setCompletedMatches([]);
    setCollapsedGroups({});
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

  /* ================= PDF PARSER ================= */

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
        grouped[y].push(it.str.trim());
      });

      rows.push(...Object.values(grouped).map((r) => r.join(" ").trim()));
    }

    const headers = rows[0].split(/\s{2,}/).map((h) => h.trim());

    return rows
      .slice(1)
      .map((r) => {
        const values = r.split(/\s{2,}/);
        const obj = {};
        headers.forEach((h, i) => (obj[h] = values[i]?.trim() || ""));
        return obj;
      })
      .filter((r) => {
        const id = r["Match ID"] || r["MatchID"] || "";
        if (!id.toLowerCase().startsWith("s")) return false;

        const match = (r.Match || "").toLowerCase();
        return ![
          "league",
          "validated",
          "fixtures",
          "crickedge",
          "match id",
        ].some((x) => match.includes(x));
      });
  };

  /* ================= Upload ================= */

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

  /* ================= SEARCH + GROUP ================= */

  const filteredMatches = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return pendingMatches;

    return pendingMatches.filter((m) =>
      Object.values(m.match_data || {}).some((v) =>
        String(v).toLowerCase().includes(q)
      )
    );
  }, [search, pendingMatches]);

  const groupedByGroup = useMemo(() => {
    const groups = {};
    filteredMatches.forEach((m) => {
      const g =
        (m.match_data.Group || "")
          .replace(/group/i, "")
          .trim() || "Others";

      if (!groups[g]) groups[g] = [];
      groups[g].push(m);
    });
    return groups;
  }, [filteredMatches]);

  const columns =
    filteredMatches.length > 0
      ? Object.keys(filteredMatches[0].match_data)
      : [];

  const toggleGroup = (g) =>
    setCollapsedGroups((p) => ({ ...p, [g]: !p[g] }));

  /* ================= UI ================= */

  return (
    <div className="tournament-fixtures">
      <h2 className="tf-title">🏏 Tournament Fixtures</h2>

      {/* Upload */}
      <div className="fixture-card">
        <h4 className="section-title">Upload Fixture (PDF)</h4>
        <div className="form-grid">
          <input className="tf-input" placeholder="Tournament Name"
            value={tournamentName} onChange={(e) => setTournamentName(e.target.value)} />
          <input className="tf-input" placeholder="Season Year"
            value={seasonYear} onChange={(e) => setSeasonYear(e.target.value)} />
          <label className="file-input">
            <input type="file" accept="application/pdf"
              onChange={(e) => setFixturePDF(e.target.files[0])} />
            {fixturePDF ? fixturePDF.name : "Choose PDF"}
          </label>
          <button className="primary-btn" onClick={uploadFixture}>
            {uploading ? "Uploading…" : "Upload"}
          </button>
        </div>
      </div>

      {/* Select + Search */}
      <div className="fixture-card">
        <div className="form-grid">
          <select className="tf-select" value={selectedTournament}
            onChange={(e) => { setSelectedTournament(e.target.value); fetchPendingMatches(e.target.value); }}>
            <option value="">Select Tournament</option>
            {tournamentList.map((t) => (
              <option key={t.tournament_id} value={t.tournament_id}>
                {t.tournament_name} ({t.season_year})
              </option>
            ))}
          </select>

          <input className="tf-input"
            placeholder="Search team / player / board…"
            value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
      </div>

      {/* Grouped Tables */}
      {loading ? <p>Loading…</p> :
        Object.entries(groupedByGroup)
          .sort(([a], [b]) => a.localeCompare(b))
          .map(([group, matches]) => {
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
                          {columns.map((c) => <th key={c}>{c}</th>)}
                          <th>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {matches.map((m) => (
                          <tr key={m.pending_id}>
                            {columns.map((c) => <td key={c}>{m.match_data[c]}</td>)}
                            <td>
                              <label className="status-pill pending">
                                <input type="checkbox"
                                  onChange={() => markMatchCompleted(m.pending_id)} />
                                Complete
                              </label>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            );
          })}
    </div>
  );
}
