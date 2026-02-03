// ✅ src/components/TournamentFixtures.js
// CrickEdge – Tournament Fixture Management (Public Backend Version)
// Author: Ranaj Parida

import React, { useEffect, useState } from "react";
import * as pdfjsLib from "pdfjs-dist/legacy/build/pdf";
import pdfWorker from "pdfjs-dist/legacy/build/pdf.worker.entry";
import "./TournamentFixtures.css";

// ✅ Backend base
const API_BASE = "https://cricket-scoreboard-backend.onrender.com";

// ✅ PDF worker
pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;

export default function TournamentFixtures() {
  // -------------------- STATE --------------------
  const [tournamentName, setTournamentName] = useState("");
  const [seasonYear, setSeasonYear] = useState("");
  const [fixturePDF, setFixturePDF] = useState(null);

  const [tournamentList, setTournamentList] = useState([]);
  const [selectedTournament, setSelectedTournament] = useState("");

  const [pendingMatches, setPendingMatches] = useState([]);
  const [completedMatches, setCompletedMatches] = useState([]);

  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);

  // -------------------- API CALLS --------------------
  const fetchTournamentList = async () => {
    const res = await fetch(`${API_BASE}/api/tournament/list`);
    const data = await res.json();
    setTournamentList(data || []);
  };

  const fetchPendingMatches = async (tournamentId) => {
    if (!tournamentId) return;
    setLoading(true);
    const res = await fetch(
      `${API_BASE}/api/tournament/pending/${tournamentId}`
    );
    const data = await res.json();
    setPendingMatches(data || []);
    setLoading(false);
  };

  const fetchCompletedMatches = async (name, year) => {
    if (!name || !year) return;
    const res = await fetch(
      `${API_BASE}/api/tournament/completed?tournament_name=${name}&season_year=${year}`
    );
    const data = await res.json();
    setCompletedMatches(data || []);
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

    fetchPendingMatches(selectedTournament);
  };

  // -------------------- PDF PARSING --------------------
  const parseFixturePDF = async (file) => {
    const pdf = await pdfjsLib.getDocument(URL.createObjectURL(file)).promise;
    let rows = [];

    for (let p = 1; p <= pdf.numPages; p++) {
      const page = await pdf.getPage(p);
      const content = await page.getTextContent();
      const grouped = {};

      content.items.forEach((i) => {
        const y = Math.round(i.transform[5]);
        if (!grouped[y]) grouped[y] = [];
        grouped[y].push(i.str);
      });

      rows = rows.concat(
        Object.values(grouped).map((r) => r.join(" ").trim())
      );
    }

    if (rows.length < 2) return [];

    const headers = rows[0].split(/\s{2,}/);

    return rows.slice(1).map((r) => {
      const values = r.split(/\s{2,}/);
      const obj = {};
      headers.forEach((h, i) => (obj[h] = values[i] || ""));
      return obj;
    });
  };

  // -------------------- UPLOAD HANDLER --------------------
  const uploadFixture = async () => {
    if (!tournamentName || !seasonYear || !fixturePDF) {
      alert("Please fill all fields");
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
    alert("Fixture uploaded successfully");
  };

  // -------------------- EFFECT --------------------
  useEffect(() => {
    fetchTournamentList();
  }, []);

  // -------------------- HELPERS --------------------
  const getColumns = () => {
    if (!pendingMatches.length) return [];
    return Object.keys(pendingMatches[0].match_data || {});
  };

  // -------------------- UI --------------------
  return (
    <div className="tf-wrap">
      <h2>Tournament Fixtures</h2>

      {/* UPLOAD */}
      <div className="tf-box">
        <h4>Upload Fixture (PDF)</h4>
        <input
          placeholder="Tournament Name"
          value={tournamentName}
          onChange={(e) => setTournamentName(e.target.value)}
        />
        <input
          placeholder="Season Year"
          value={seasonYear}
          onChange={(e) => setSeasonYear(e.target.value)}
        />
        <input
          type="file"
          accept="application/pdf"
          onChange={(e) => setFixturePDF(e.target.files[0])}
        />
        <button onClick={uploadFixture} disabled={uploading}>
          {uploading ? "Uploading..." : "Upload"}
        </button>
      </div>

      {/* SELECT */}
      <select
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

      {/* PENDING TABLE */}
      {loading ? (
        <p>Loading...</p>
      ) : pendingMatches.length === 0 ? (
        <p>No pending matches</p>
      ) : (
        <table className="tf-table">
          <thead>
            <tr>
              {getColumns().map((c) => (
                <th key={c}>{c}</th>
              ))}
              <th>Completed</th>
            </tr>
          </thead>
          <tbody>
            {pendingMatches.map((row) => (
              <tr key={row.pending_id}>
                {getColumns().map((c) => (
                  <td key={c}>{row.match_data[c]}</td>
                ))}
                <td>
                  <input
                    type="checkbox"
                    onChange={() => markMatchCompleted(row.pending_id)}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {/* COMPLETED */}
      <div className="tf-box">
        <h4>Completed Matches</h4>
        <button
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
          <table className="tf-table">
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
                  <td>{new Date(r.completed_at).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
