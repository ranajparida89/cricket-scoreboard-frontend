// ✅ src/components/PlayerStats.js — leaderboard-style stats page
import React, { useState, useEffect, useMemo } from "react";
import axios from "axios";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "./PlayerStats.css";
import "./PlayerDetailsModal.css";

const PlayerStats = () => {
  const [performances, setPerformances] = useState([]);
  const [loading, setLoading] = useState(true);

  const [filters, setFilters] = useState({
    playerName: "",
    teamName: "",
    matchType: "",
  });

  const [selectedPlayer, setSelectedPlayer] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  const handlePlayerClick = (playerName) => {
    setSelectedPlayer(playerName);
    setShowDetailsModal(true);
  };

  useEffect(() => {
    fetchPerformances();
  }, []);

  const fetchPerformances = async () => {
    try {
      setLoading(true);
      const res = await axios.get(
        "https://cricket-scoreboard-backend.onrender.com/api/player-stats-summary"
      );
      setPerformances(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error("❌ Error fetching performances:", err);
      toast.error("❌ Failed to fetch player performances.");
    } finally {
      setLoading(false);
    }
  };

  // ---------- filtering ----------
  const filteredPerformances = useMemo(() => {
    const pn = filters.playerName.trim().toLowerCase();
    const tn = filters.teamName.trim().toLowerCase();
    const mt = filters.matchType;
    return (performances || []).filter((p) => {
      const playerMatch = String(p.player_name || "").toLowerCase().includes(pn);
      const teamMatch   = String(p.team_name   || "").toLowerCase().includes(tn);
      const typeMatch   = mt ? String(p.match_type) === mt : true;
      return playerMatch && teamMatch && typeMatch;
    });
  }, [performances, filters]);

  // ---------- summary (overall by player+team+type) ----------
  const combinedData = useMemo(() => {
    const map = new Map();
    for (const perf of filteredPerformances) {
      const key = `${perf.player_name}|${perf.team_name}|${perf.match_type}`;
      const curr = map.get(key) || {
        player_name: perf.player_name,
        team_name: perf.team_name,
        match_type: perf.match_type,
        total_runs: 0,
        total_wickets: 0,
        total_fifties: 0,
        total_hundreds: 0,
        total_matches: 0,
        match_count: 0,
      };
      curr.total_runs     += parseInt(perf.run_scored)     || 0;
      curr.total_wickets  += parseInt(perf.wickets_taken)  || 0;
      curr.total_fifties  += parseInt(perf.fifties)        || 0;
      curr.total_hundreds += parseInt(perf.hundreds)       || 0;
      curr.match_count     = perf.match_count || curr.match_count;
      curr.total_matches  += parseInt(perf.total_matches)  || 0;
      map.set(key, curr);
    }
    return [...map.values()];
  }, [filteredPerformances]);

  const sortedCombinedData = useMemo(
    () => [...combinedData].sort((a, b) => b.total_runs - a.total_runs),
    [combinedData]
  );

  // ---------- top-3 logic for the match-wise grid ----------
  const strikeRate = (runs, balls) => (balls > 0 ? (runs / balls) * 100 : 0);
  const impactScore = (row) => {
    const r  = Number(row.run_scored || 0);
    const b  = Number(row.balls_faced || 0);
    const wk = Number(row.wickets_taken || 0);
    const sr = strikeRate(r, b);
    return r + wk * 25 + sr / 8;
  };
  const enrichedRows = useMemo(
    () =>
      filteredPerformances.map((p) => ({
        ...p,
        _sr: p.strike_rate || strikeRate(Number(p.run_scored || 0), Number(p.balls_faced || 0)).toFixed(2),
        _impact: impactScore(p),
        _runsDisp:
          String(p.dismissed_status || "").toLowerCase().includes("not")
            ? `${p.run_scored}*`
            : p.run_scored,
      })),
    [filteredPerformances]
  );

  const top3Ids = useMemo(() => {
    const sorted = [...enrichedRows]
      .sort((a, b) => b._impact - a._impact)
      .slice(0, 3)
      .map((r, i) => `${r.player_name}|${r.match_name}|${i}`); // make unique-ish
    return new Set(sorted);
  }, [enrichedRows]);

  if (loading) return <div className="text-center text-light mt-5">⏳ Loading performances...</div>;

  return (
    <div className="container mt-4 text-white">
      <ToastContainer position="top-center" />

      <div className="pps-wrap">
        <div className="pps-orbs">
          <span className="orb o1"></span>
          <span className="orb o2"></span>
        </div>

        <div className="pps-card">
          <div className="pps-header">
            <h3 className="pps-title">📈 Player Performance Stats</h3>
            <p className="pps-sub">Dark leaderboard with animated top-3 and gold glow</p>
          </div>

          {/* Filters */}
          <div className="pps-filters">
            <input
              className="pps-input"
              placeholder="Search Player Name"
              value={filters.playerName}
              onChange={(e) => setFilters({ ...filters, playerName: e.target.value })}
            />
            <input
              className="pps-input"
              placeholder="Search Team Name"
              value={filters.teamName}
              onChange={(e) => setFilters({ ...filters, teamName: e.target.value })}
            />
            <select
              className="pps-select"
              value={filters.matchType}
              onChange={(e) => setFilters({ ...filters, matchType: e.target.value })}
            >
              <option value="">All Match Types</option>
              <option value="ODI">ODI</option>
              <option value="T20">T20</option>
              <option value="Test">Test</option>
            </select>
          </div>

          {/* Match-wise grid */}
          <div className="pps-table">
            <div className="pps-thead">
              <div className="th">Player</div>
              <div className="th">Team</div>
              <div className="th">Type</div>
              <div className="th">Match</div>
              <div className="th">Against</div>
              <div className="th">Runs</div>
              <div className="th">Balls</div>
              <div className="th">SR</div>
              <div className="th">Wkts</div>
              <div className="th">R. Given</div>
              <div className="th">50s</div>
              <div className="th">100s</div>
              <div className="th">Dismissed</div>
            </div>

            <div className="pps-tbody">
              {enrichedRows.length === 0 && (
                <div className="pps-empty">No matching records.</div>
              )}

              {enrichedRows.map((r, idx) => {
                const top = top3Ids.has(`${r.player_name}|${r.match_name}|${idx}`)
                  ? idx === 0 ? "gold" : idx === 1 ? "silver" : "bronze"
                  : "";
                return (
                  <div key={idx} className={`pps-row ${top}`}>
                    <div className="td player">
                      <span
                        className="name clickable-player"
                        onClick={() => handlePlayerClick(r.player_name)}
                      >
                        {r.player_name}
                      </span>
                    </div>
                    <div className="td team">{r.team_name}</div>
                    <div className="td type">{String(r.match_type).toUpperCase()}</div>
                    <div className="td match">{r.match_name || "—"}</div>
                    <div className="td against">{r.against_team}</div>
                    <div className="td num">{r._runsDisp}</div>
                    <div className="td num">{r.balls_faced}</div>
                    <div className="td num">{Number(r._sr).toFixed(2)}</div>
                    <div className="td num">{r.wickets_taken}</div>
                    <div className="td num">{r.runs_given}</div>
                    <div className="td num">{r.fifties}</div>
                    <div className="td num">{r.hundreds}</div>
                    <div className="td">{r.dismissed_status || r.dismissed || "-"}</div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Overall Summary (ranked) */}
          {sortedCombinedData.length > 0 && (
            <>
              <h4 className="pps-section-title">Player Overall Performance Summary</h4>
              <div className="pps-table summary">
                <div className="pps-thead">
                  <div className="th">Rank</div>
                  <div className="th">Player</div>
                  <div className="th">Team</div>
                  <div className="th">Type</div>
                  <div className="th">Matches</div>
                  <div className="th">Runs</div>
                  <div className="th">Wkts</div>
                  <div className="th">50s</div>
                  <div className="th">100s</div>
                </div>
                <div className="pps-tbody">
                  {sortedCombinedData.map((p, index) => {
                    const top =
                      index === 0 ? "gold" : index === 1 ? "silver" : index === 2 ? "bronze" : "";
                    return (
                      <div key={index} className={`pps-row ${top}`}>
                        <div className="td num">{index + 1}</div>
                        <div className="td player">
                          <span
                            className="name clickable-player"
                            onClick={() => handlePlayerClick(p.player_name)}
                          >
                            {p.player_name}
                          </span>
                        </div>
                        <div className="td team">{p.team_name}</div>
                        <div className="td type">{String(p.match_type).toUpperCase()}</div>
                        <div className="td num">{filters.matchType ? p.match_count : p.total_matches}</div>
                        <div className="td num">{p.total_runs}</div>
                        <div className="td num">{p.total_wickets}</div>
                        <div className="td num">{p.total_fifties}</div>
                        <div className="td num">{p.total_hundreds}</div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Modal (unchanged) */}
      {showDetailsModal && selectedPlayer && (
        <div className="player-modal-overlay">
          <div className="player-modal-content">
            <button className="player-modal-close" onClick={() => setShowDetailsModal(false)}>✖</button>
            <h2 className="modal-header">📋 Match-wise Player Performance </h2>

            {performances
              .filter((p) => p.player_name === selectedPlayer)
              .map((match, idx) => (
                <li key={idx} className="player-match-card">
                  <h5 className="text-info fw-bold mb-3">🖋️ {match.match_name} ({match.match_type})</h5>

                  <p><strong>🧍‍♂️ Player:</strong> {match.player_name}</p>
                  <p><strong>🏳️ Team:</strong> {match.team_name}</p>
                  <p><strong>⚔️ Opposition:</strong> {match.against_team}</p>

                  <div className="section mt-3">
                    <h6 className="text-warning fw-bold"> Batting Performance</h6>
                    <p>Scored <b>{match.formatted_run_scored}</b> runs from <b>{match.balls_faced}</b> balls with a strike rate of <b>{match.strike_rate}</b></p>
                    <p>Milestones: <b>{match.fifties}</b> Fifties | <b>{match.hundreds}</b> Hundreds</p>
                  </div>

                  <div className="section mt-3">
                    <h6 className="text-warning fw-bold"> Bowling Performance</h6>
                    <p>Took <b>{match.wickets_taken}</b> wicket(s) conceding <b>{match.runs_given}</b> runs</p>
                    <p>Economy: <b>{match.runs_given > 0 && match.wickets_taken > 0 ? (match.runs_given / (match.wickets_taken || 1)).toFixed(2) : "-"}</b></p>
                  </div>
                </li>
              ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default PlayerStats;
