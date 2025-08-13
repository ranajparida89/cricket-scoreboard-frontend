// ✅ src/components/PlayerStats.js — aligned dark leaderboard tables + tooltips
import React, { useState, useEffect, useMemo } from "react";
import axios from "axios";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "./PlayerStats.css";

const API = "https://cricket-scoreboard-backend.onrender.com/api/player-stats-summary";

const PlayerStats = () => {
  const [performances, setPerformances] = useState([]);
  const [loading, setLoading] = useState(true);

  const [filters, setFilters] = useState({
    playerName: "",
    teamName: "",
    matchType: "ALL", // ALL | ODI | T20 | TEST
  });

  const [selectedPlayer, setSelectedPlayer] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const res = await axios.get(API);
        setPerformances(Array.isArray(res.data) ? res.data : []);
      } catch (err) {
        console.error("❌ Error fetching performances:", err);
        toast.error("❌ Failed to fetch player performances.");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const handlePlayerClick = (playerName) => {
    setSelectedPlayer(playerName);
    setShowDetailsModal(true);
  };

  /* ---------- helpers ---------- */
  const sr = (runs, balls) =>
    Number(balls) > 0 ? (Number(runs) / Number(balls)) * 100 : 0;

  // Filtered rows (match-wise)
  const rows = useMemo(() => {
    const pQ = filters.playerName.trim().toLowerCase();
    const tQ = filters.teamName.trim().toLowerCase();
    const type = filters.matchType; // already canonical

    return performances.filter((r) => {
      const playerOK = !pQ || String(r.player_name).toLowerCase().includes(pQ);
      const teamOK = !tQ || String(r.team_name).toLowerCase().includes(tQ);
      const typeOK =
        type === "ALL" || String(r.match_type).toUpperCase() === type;
      return playerOK && teamOK && typeOK;
    });
  }, [performances, filters]);

  // Overall summary (combine by player + team + type)
  const combined = useMemo(() => {
    const acc = [];
    for (const perf of rows) {
      const key = `${perf.player_name}|${perf.team_name}|${perf.match_type}`;
      let found = acc.find(
        (x) => `${x.player_name}|${x.team_name}|${x.match_type}` === key
      );
      if (!found) {
        found = {
          player_name: perf.player_name,
          team_name: perf.team_name,
          match_type: perf.match_type,
          total_matches: Number(perf.total_matches || perf.match_count || 0),
          total_runs: 0,
          total_wickets: 0,
          total_fifties: 0,
          total_hundreds: 0,
          match_count: Number(perf.match_count || 0),
        };
        acc.push(found);
      }
      found.total_runs += Number(perf.run_scored || 0);
      found.total_wickets += Number(perf.wickets_taken || 0);
      found.total_fifties += Number(perf.fifties || 0);
      found.total_hundreds += Number(perf.hundreds || 0);
    }
    return acc.sort((a, b) => b.total_runs - a.total_runs);
  }, [rows]);

  if (loading) {
    return (
      <div className="text-center text-light mt-5">⏳ Loading performances...</div>
    );
  }

  return (
    <div className="container mt-4 text-white">
      <ToastContainer position="top-center" />

      {/* ===== Match-wise table ===== */}
      <div className="ps-card">
        <div className="ps-header">
          <h3 className="ps-title">
            <span className="dot" /> Player Performance Stats
          </h3>
          <p className="ps-sub">Dark leaderboard with animated top-3 & gold glow</p>

          {/* info button */}
          <button
            type="button"
            className="ps-info"
            aria-label="About this table"
            data-tip="Each row is a single match. Filter by player, team, or format. Numeric columns are right-aligned; * means Not Out."
          >
            i
          </button>
        </div>

        {/* Filters */}
        <div className="ps-filters">
          <input
            className="ps-input"
            placeholder="Search Player Name"
            value={filters.playerName}
            onChange={(e) =>
              setFilters({ ...filters, playerName: e.target.value })
            }
          />
          <input
            className="ps-input"
            placeholder="Search Team Name"
            value={filters.teamName}
            onChange={(e) =>
              setFilters({ ...filters, teamName: e.target.value })
            }
          />
          <select
            className="ps-select"
            value={filters.matchType}
            onChange={(e) =>
              setFilters({ ...filters, matchType: e.target.value })
            }
          >
            <option value="ALL">All Match Types</option>
            <option value="ODI">ODI</option>
            <option value="T20">T20</option>
            <option value="TEST">Test</option>
          </select>
        </div>

        <div className="ps-grid" role="table" aria-label="Match-wise player stats">
          {/* SAME GRID FOR HEAD + ROWS via CSS var */}
          <div className="ps-head" role="rowgroup">
            <div className="cell head">Player</div>
            <div className="cell head">Team</div>
            <div className="cell head">Type</div>
            <div className="cell head">Match</div>
            <div className="cell head">Against</div>
            <div className="cell head num">Runs</div>
            <div className="cell head num">Balls</div>
            <div className="cell head num">SR</div>
            <div className="cell head num">Wkts</div>
            <div className="cell head num">R. Given</div>
            <div className="cell head num">50s</div>
            <div className="cell head num">100s</div>
            <div className="cell head">Dismissed</div>
          </div>

          <div className="ps-body" role="rowgroup">
            {rows.length === 0 && (
              <div className="ps-empty">No matching records.</div>
            )}
            {rows.map((r, idx) => {
              const notOut = String(
                r.dismissed_status || r.dismissed || ""
              )
                .toLowerCase()
                .includes("not");
              const runsDisp = notOut ? `${r.run_scored}*` : r.run_scored;
              const srDisp = (
                r.strike_rate
                  ? Number(r.strike_rate)
                  : sr(r.run_scored, r.balls_faced)
              ).toFixed(2);

              return (
                <div className="ps-row" role="row" key={`${r.player_name}-${idx}`}>
                  <div className="cell player">
                    <button
                      className="player-link"
                      onClick={() => handlePlayerClick(r.player_name)}
                    >
                      {r.player_name}
                    </button>
                  </div>
                  <div className="cell">{r.team_name}</div>
                  <div className="cell">{String(r.match_type).toUpperCase()}</div>
                  <div className="cell">{r.match_name || "—"}</div>
                  <div className="cell">{r.against_team}</div>
                  <div className="cell num">{runsDisp}</div>
                  <div className="cell num">{r.balls_faced}</div>
                  <div className="cell num">{srDisp}</div>
                  <div className="cell num">{r.wickets_taken}</div>
                  <div className="cell num">{r.runs_given}</div>
                  <div className="cell num">{r.fifties}</div>
                  <div className="cell num">{r.hundreds}</div>
                  <div className="cell">{r.dismissed_status || r.dismissed || "—"}</div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ===== Overall Summary (ranked) ===== */}
      {combined.length > 0 && (
        <div className="ps-card mt-4">
          <div className="ps-header ps-header--mini">
            <h4 className="ps-title-small">Player Overall Performance Summary</h4>
            <button
              type="button"
              className="ps-info"
              aria-label="About this table"
              data-tip="Totals per player within the current filters. Ranked by total runs. Medals mark the top 3."
            >
              i
            </button>
          </div>

          <div className="ps-grid-sum" role="table" aria-label="Overall player summary">
            <div className="ps-head-sum" role="rowgroup">
              <div className="cell head num">Rank</div>
              <div className="cell head">Player</div>
              <div className="cell head">Team</div>
              <div className="cell head">Type</div>
              <div className="cell head num">Matches</div>
              <div className="cell head num">Runs</div>
              <div className="cell head num">Wkts</div>
              <div className="cell head num">50s</div>
              <div className="cell head num">100s</div>
            </div>

            <div className="ps-body" role="rowgroup">
              {combined.map((p, i) => {
                const top = i === 0 ? "gold" : i === 1 ? "silver" : i === 2 ? "bronze" : "";
                const medal =
                  i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : null;
                return (
                  <div className={`ps-row-sum ${top}`} role="row" key={`${p.player_name}-${i}`}>
                    <div className="cell num">
                      <span className={`medal ${top || ""}`}>{medal}</span>
                      {i + 1}
                    </div>
                    <div className="cell">
                      <button
                        className="player-link"
                        onClick={() => handlePlayerClick(p.player_name)}
                      >
                        {p.player_name}
                      </button>
                    </div>
                    <div className="cell">{p.team_name}</div>
                    <div className="cell">{String(p.match_type).toUpperCase()}</div>
                    <div className="cell num">
                      {filters.matchType !== "ALL" && filters.matchType !== ""
                        ? p.match_count
                        : p.total_matches}
                    </div>
                    <div className="cell num">{p.total_runs}</div>
                    <div className="cell num">{p.total_wickets}</div>
                    <div className="cell num">{p.total_fifties}</div>
                    <div className="cell num">{p.total_hundreds}</div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Modal (unchanged data; styled in CSS) */}
      {showDetailsModal && selectedPlayer && (
        <div className="player-modal-overlay">
          <div className="player-modal-content">
            <button
              className="player-modal-close"
              onClick={() => setShowDetailsModal(false)}
            >
              ✖
            </button>
            <h2 className="modal-header">📋 Match-wise Player Performance</h2>

            <ul className="player-modal-list">
              {performances
                .filter((p) => p.player_name === selectedPlayer)
                .map((match, idx) => (
                  <li key={idx} className="player-match-card">
                    <h5 className="text-info fw-bold mb-2">
                      🖋️ {match.match_name} ({match.match_type})
                    </h5>
                    <p>
                      <strong>🧍‍♂️ Player:</strong> {match.player_name}
                    </p>
                    <p>
                      <strong>🏳️ Team:</strong> {match.team_name}
                    </p>
                    <p>
                      <strong>⚔️ Opposition:</strong> {match.against_team}
                    </p>

                    <div className="section mt-2">
                      <h6 className="text-warning fw-bold">Batting Performance</h6>
                      <p>
                        Scored <b>{match.formatted_run_scored}</b> from{" "}
                        <b>{match.balls_faced}</b> balls, strike rate <b>{match.strike_rate}</b>
                      </p>
                      <p>
                        Milestones: <b>{match.fifties}</b> fifties ·{" "}
                        <b>{match.hundreds}</b> hundreds
                      </p>
                    </div>

                    <div className="section mt-2">
                      <h6 className="text-warning fw-bold">Bowling Performance</h6>
                      <p>
                        Wickets: <b>{match.wickets_taken}</b>, Runs:{" "}
                        <b>{match.runs_given}</b>
                      </p>
                      <p>
                        Economy:{" "}
                        <b>
                          {match.runs_given > 0 && match.wickets_taken > 0
                            ? (match.runs_given / (match.wickets_taken || 1)).toFixed(2)
                            : "-"}
                        </b>
                      </p>
                    </div>
                  </li>
                ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
};

export default PlayerStats;
