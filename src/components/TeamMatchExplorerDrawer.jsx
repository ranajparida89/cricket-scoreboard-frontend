import React, { useEffect, useMemo, useState } from "react";
import "./TeamMatchExplorerDrawer.css";
import { getTeamMatchExplorer } from "../services/api";

// Small helper for compact overs display if value is null/undefined
const fmt = (v) => (v === null || v === undefined ? "—" : v);

export default function TeamMatchExplorerDrawer({ team, onClose }) {
  const [format, setFormat] = useState("All");   // All | ODI | T20
  const [result, setResult] = useState("All");   // All | W | L | D
  const [season, setSeason] = useState("");      // '' = all
  const [tournament, setTournament] = useState("");// '' = all
  const [page, setPage] = useState(1);

  const [data, setData] = useState(null);
  const [busy, setBusy] = useState(false);
  const pageSize = 20;

  // Fetch on changes
  useEffect(() => {
    if (!team) return;
    setBusy(true);
    setData(null);
    getTeamMatchExplorer({
      team,
      format,
      result,
      season: season || undefined,
      tournament: tournament || undefined,
      page,
      pageSize
    })
      .then(setData)
      .catch(() => setData({ error: true, matches: [] }))
      .finally(() => setBusy(false));
  }, [team, format, result, season, tournament, page]);

  // Reset paging when filters change
  useEffect(() => { setPage(1); }, [format, result, season, tournament]);

  const totalPages = useMemo(() => {
    if (!data?.total) return 1;
    return Math.max(1, Math.ceil(data.total / (data.pageSize || pageSize)));
  }, [data]);

  if (!team) return null;

  return (
    <div className="tme-overlay" role="dialog" aria-modal="true" aria-label="Team Match Explorer">
      <div className="tme-panel">
        <header className="tme-header">
          <div className="tme-title">
            <span className="tme-title-main">{team}</span>
            <span className="tme-title-sub">Match Explorer</span>
          </div>
          <button className="tme-close" onClick={onClose} aria-label="Close">×</button>
        </header>

        <section className="tme-summary">
          <div className="tme-chip tme-chip-played">Played <b>{fmt(data?.summary?.played)}</b></div>
          <div className="tme-chip tme-chip-win">W <b>{fmt(data?.summary?.wins)}</b></div>
          <div className="tme-chip tme-chip-loss">L <b>{fmt(data?.summary?.losses)}</b></div>
          <div className="tme-chip tme-chip-draw">D <b>{fmt(data?.summary?.draws)}</b></div>
          <div className="tme-last5">
            Last 5:
            {(data?.summary?.last5 || []).map((r, i) => (
              <span key={i} className={`tme-last5-item ${r}`}>{r}</span>
            ))}
          </div>
        </section>

        <section className="tme-filters">
          <div className="tme-tabs">
            {["All","ODI","T20"].map(f => (
              <button key={f} className={`tme-tab ${format===f?"on":""}`} onClick={()=>setFormat(f)}>{f}</button>
            ))}
          </div>

          <div className="tme-pills">
            {["All","W","L","D"].map(r => (
              <button key={r} className={`tme-pill ${result===r?"on":""}`} onClick={()=>setResult(r)}>{r}</button>
            ))}
          </div>

          <div className="tme-selects">
            <select value={season} onChange={e => setSeason(e.target.value)}>
              <option value="">All Seasons</option>
              {(data?.facets?.seasons || []).map(y => <option key={y} value={y}>{y}</option>)}
            </select>

            <select value={tournament} onChange={e => setTournament(e.target.value)}>
              <option value="">All Tournaments</option>
              {(data?.facets?.tournaments || []).map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
        </section>

        <section className="tme-table-wrap">
          {busy && <div className="tme-loading">Loading…</div>}

          {!busy && data?.matches?.length === 0 && (
            <div className="tme-empty">No matches found for the selected filters.</div>
          )}

          {!busy && data?.matches?.length > 0 && (
            <table className="tme-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Fmt</th>
                  <th>Tournament</th>
                  <th>Opponent</th>
                  <th>Result</th>
                  <th>Score (Your Team vs Opp)</th>
                </tr>
              </thead>
              <tbody>
                {data.matches.map(m => {
                  const resClass =
                    m.result === "W" ? "win" : m.result === "L" ? "loss" : "draw";
                  return (
                    <tr key={m.match_id} className={`tme-row ${resClass}`}>
                      <td>{m.date}</td>
                      <td>{m.format}</td>
                      <td>{m.tournament}</td>
                      <td>{m.opponent}</td>
                      <td className={`tme-res ${resClass}`}>{m.result}</td>
                      <td className="tme-score">
                        {`${fmt(m.team_runs)}/${fmt(m.team_wkts)} (${fmt(m.team_overs)}) `}
                        <span className="tme-vs">vs</span>
                        {` ${fmt(m.opp_runs)}/${fmt(m.opp_wkts)} (${fmt(m.opp_overs)})`}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </section>

        <footer className="tme-footer">
          <div className="tme-pages">
            <button
              className="tme-page-btn"
              disabled={busy || page <= 1}
              onClick={() => setPage(p => p - 1)}
            >
              Prev
            </button>
            <span className="tme-page-ind">{page} / {totalPages}</span>
            <button
              className="tme-page-btn"
              disabled={busy || page >= totalPages}
              onClick={() => setPage(p => p + 1)}
            >
              Next
            </button>
          </div>
        </footer>
      </div>

      {/* Click outside to close */}
      <button className="tme-backdrop" aria-label="Close overlay" onClick={onClose}/>
    </div>
  );
}
