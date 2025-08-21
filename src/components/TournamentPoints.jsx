// src/pages/TournamentPoints.jsx
import React, { useEffect, useMemo, useState } from "react";
import { API_URL } from "../services/api";

function toDec(n) {
  const x = Number(n);
  return Number.isFinite(x) ? x : 0;
}

function normalizeWinner(winner = "") {
  const w = winner.trim();
  if (!w) return "";
  const lw = w.toLowerCase();
  if (lw.includes("draw")) return "Draw";
  // common format: "<TEAM> won the match!"
  const wonIdx = lw.indexOf(" won");
  return wonIdx > 0 ? w.substring(0, wonIdx).trim() : w;
}

export default function TournamentPoints() {
  const [matchType, setMatchType] = useState("T20"); // T20 or ODI
  const [tournamentName, setTournamentName] = useState("");
  const [seasonYear, setSeasonYear] = useState("");
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);

  async function load() {
    setLoading(true);
    try {
      // Backend supports match_type filter:
      const res = await fetch(`${API_URL}/match-history?match_type=${encodeURIComponent(matchType)}`, {
        credentials: "include",
      });
      const data = await res.json();
      setRows(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error(e);
      setRows([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [matchType]);

  const filtered = useMemo(() => {
    const tn = tournamentName.trim().toLowerCase();
    const yr = seasonYear.trim();

    return rows.filter((r) => {
      const okTN = tn
        ? (r.tournament_name || "").toString().toLowerCase().includes(tn)
        : true;
      const okYR = yr ? String(r.season_year || "") === yr : true;
      return okTN && okYR;
    });
  }, [rows, tournamentName, seasonYear]);

  const table = useMemo(() => {
    // Build aggregates per team
    const byTeam = new Map();

    function ensure(team) {
      const key = team?.trim();
      if (!key) return null;
      if (!byTeam.has(key)) {
        byTeam.set(key, {
          team: key,
          matches: 0,
          wins: 0,
          losses: 0,
          draws: 0,
          runsFor: 0,
          oversFaced: 0,
          runsAgainst: 0,
          oversBowled: 0,
          // For display columns (show first encountered name/year)
          tournament_name: null,
          season_year: null,
        });
      }
      return byTeam.get(key);
    }

    for (const m of filtered) {
      const t1 = (m.team1 || "").trim();
      const t2 = (m.team2 || "").trim();
      const w  = normalizeWinner(m.winner);

      const r1 = toDec(m.runs1);
      const o1 = toDec(m.overs1);
      const r2 = toDec(m.runs2);
      const o2 = toDec(m.overs2);

      const a1 = ensure(t1);
      const a2 = ensure(t2);
      if (!a1 || !a2) continue;

      a1.matches += 1;
      a2.matches += 1;

      if (w === "Draw") {
        a1.draws += 1;
        a2.draws += 1;
      } else if (w === t1) {
        a1.wins += 1;
        a2.losses += 1;
      } else if (w === t2) {
        a2.wins += 1;
        a1.losses += 1;
      } else {
        // unknown winner format → ignore win/loss, but still count match
      }

      // NRR parts (runs/overs faced; conceded/overs bowled)
      a1.runsFor += r1;
      a1.oversFaced += o1;
      a1.runsAgainst += r2;
      a1.oversBowled += o2;

      a2.runsFor += r2;
      a2.oversFaced += o2;
      a2.runsAgainst += r1;
      a2.oversBowled += o1;

      // keep first tournament/year we see (for display)
      if (a1.tournament_name == null && m.tournament_name) a1.tournament_name = m.tournament_name;
      if (a1.season_year == null && m.season_year != null) a1.season_year = m.season_year;
      if (a2.tournament_name == null && m.tournament_name) a2.tournament_name = m.tournament_name;
      if (a2.season_year == null && m.season_year != null) a2.season_year = m.season_year;
    }

    const arr = Array.from(byTeam.values()).map((t) => {
      const nrrFor = t.oversFaced > 0 ? t.runsFor / t.oversFaced : 0;
      const nrrAg  = t.oversBowled > 0 ? t.runsAgainst / t.oversBowled : 0;
      const nrr    = Number((nrrFor - nrrAg).toFixed(2));
      const points = t.wins * 2 + t.draws * 1;
      return { ...t, nrr, points };
    });

    // Order by points desc, then NRR desc, then team
    arr.sort((a, b) =>
      b.points - a.points ||
      b.nrr - a.nrr ||
      a.team.localeCompare(b.team)
    );
    return arr;
  }, [filtered]);

  return (
    <div className="container mt-4">
      <div className="card p-3 shadow-sm">
        <h3 className="mb-3">🏆 Tournament Points (Client-only)</h3>

        <div className="row g-2">
          <div className="col-md-2">
            <label className="form-label">Match Type</label>
            <select className="form-select" value={matchType} onChange={(e) => setMatchType(e.target.value)}>
              <option value="T20">T20</option>
              <option value="ODI">ODI</option>
            </select>
          </div>
          <div className="col-md-5">
            <label className="form-label">Tournament</label>
            <input
              className="form-control"
              placeholder="e.g., Asia Cup"
              value={tournamentName}
              onChange={(e) => setTournamentName(e.target.value)}
            />
          </div>
          <div className="col-md-2">
            <label className="form-label">Season Year</label>
            <input
              className="form-control"
              placeholder="e.g., 2025"
              value={seasonYear}
              onChange={(e) => setSeasonYear(e.target.value)}
            />
          </div>
          <div className="col-md-3 d-flex align-items-end">
            <button className="btn btn-primary w-100" onClick={load} disabled={loading}>
              {loading ? "Loading..." : "Reload"}
            </button>
          </div>
        </div>

        <div className="table-responsive mt-3">
          <table className="table table-striped align-middle">
            <thead>
              <tr>
                <th>Team</th>
                <th>Matches</th>
                <th>Wins</th>
                <th>Losses</th>
                <th>Draws</th>
                <th>Points</th>
                <th>NRR</th>
                <th>Tournament</th>
                <th>Year</th>
              </tr>
            </thead>
            <tbody>
              {table.map((r) => (
                <tr key={r.team}>
                  <td>{r.team}</td>
                  <td>{r.matches}</td>
                  <td>{r.wins}</td>
                  <td>{r.losses}</td>
                  <td>{r.draws}</td>
                  <td>{r.points}</td>
                  <td>{r.nrr}</td>
                  <td>{r.tournament_name || "—"}</td>
                  <td>{r.season_year != null ? r.season_year : "—"}</td>
                </tr>
              ))}
              {table.length === 0 && !loading && (
                <tr><td colSpan="9" className="text-center text-muted">No rows. Try removing filters or posting a match.</td></tr>
              )}
            </tbody>
          </table>
        </div>

        <small className="text-muted">
          This page computes points & NRR on the client from <code>/api/match-history</code>. 
          To see Tournament/Year populated, your match rows must include <code>tournament_name</code> and <code>season_year</code>.
        </small>
      </div>
    </div>
  );
}
