// ✅ src/components/PlayerStats.js
// match-wise table + grouped table + combined-all-formats table + Moral
import React, { useState, useEffect, useMemo } from "react";
import axios from "axios";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "./PlayerStats.css";

const API =
  "https://cricket-scoreboard-backend.onrender.com/api/player-stats-summary";

const PlayerStats = () => {
  const [performances, setPerformances] = useState([]);
  const [loading, setLoading] = useState(true);

  // 1st table filters
  const [filters, setFilters] = useState({
    playerName: "",
    teamName: "",
    matchType: "ALL",
  });

  // 3rd table search
  const [combinedSearch, setCombinedSearch] = useState("");

  // 3rd table sort
  // runs = default (what your global rank is based on)
  const [combinedSort, setCombinedSort] = useState("runs"); // "runs" | "wkts" | "rpm"

  // 3rd table morale filter
  const [moraleFilter, setMoraleFilter] = useState("ALL"); // "ALL" | "High" | "Moderate" | "Low"

  const [selectedPlayer, setSelectedPlayer] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  // info modal for small "i"
  const [infoModal, setInfoModal] = useState({
    open: false,
    title: "",
    body: "",
  });

  const openInfo = (title, body) => setInfoModal({ open: true, title, body });
  const closeInfo = () => setInfoModal({ open: false, title: "", body: "" });

  // fetch once
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

  // 1) filtered match-wise rows (table 1)
  const rows = useMemo(() => {
    const pQ = filters.playerName.trim().toLowerCase();
    const tQ = filters.teamName.trim().toLowerCase();
    const type = filters.matchType;

    return performances.filter((r) => {
      const playerOK = !pQ || String(r.player_name).toLowerCase().includes(pQ);
      const teamOK = !tQ || String(r.team_name).toLowerCase().includes(tQ);
      const typeOK =
        type === "ALL" || String(r.match_type).toUpperCase() === type;
      return playerOK && teamOK && typeOK;
    });
  }, [performances, filters]);

  // 2) grouped by player+team+match_type (table 2)
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

  // 3) true combined per player (ALL formats together) – table 3
  const combinedAllFormats = useMemo(() => {
    const map = new Map();

    for (const perf of rows) {
      const player = perf.player_name;
      if (!player) continue;
      if (!map.has(player)) {
        map.set(player, {
          player_name: player,
          team_name: perf.team_name,
          total_matches: 0,
          total_runs: 0,
          total_wickets: 0,
          total_fifties: 0,
          total_hundreds: 0,
          total_double_hundreds: 0,
        });
      }
      const acc = map.get(player);
      acc.team_name = perf.team_name || acc.team_name;
      acc.total_matches += 1;
      acc.total_runs += Number(perf.run_scored || 0);
      acc.total_wickets += Number(perf.wickets_taken || 0);
      acc.total_fifties += Number(perf.fifties || 0);
      acc.total_hundreds += Number(perf.hundreds || 0);

      const dh =
        perf.double_hundreds !== undefined
          ? Number(perf.double_hundreds)
          : Number(perf.run_scored >= 200 ? 1 : 0);
      acc.total_double_hundreds += dh;
    }

    // sort once by total_runs, assign global rank (the REAL rank)
    const arr = Array.from(map.values());
    arr.sort((a, b) => b.total_runs - a.total_runs);
    arr.forEach((p, idx) => {
      p.rank = idx + 1;
    });
    return arr;
  }, [rows]);

  // 3x) Morale map: player_name -> "High" | "Moderate" | "Low"
  const moraleByPlayer = useMemo(() => {
    const byPlayer = new Map();

    for (const perf of rows) {
      const name = perf.player_name;
      if (!name) continue;
      if (!byPlayer.has(name)) byPlayer.set(name, []);
      byPlayer.get(name).push(perf);
    }

    const sumStats = (items) => {
      let runs = 0;
      let wkts = 0;
      let fifties = 0;
      let hundreds = 0;
      let lowScores = 0; // <20 runs & 0 wkts

      for (const m of items) {
        const r = Number(m.run_scored || 0);
        const w = Number(m.wickets_taken || 0);
        runs += r;
        wkts += w;
        fifties += Number(m.fifties || 0);
        hundreds += Number(m.hundreds || 0);
        if (r < 20 && w === 0) lowScores += 1;
      }

      return {
        matches: items.length,
        runs,
        wkts,
        fifties,
        hundreds,
        lowScores,
      };
    };

    const result = new Map();

    byPlayer.forEach((list, playerName) => {
      // newest first (higher id = newer if present)
      const sorted = [...list].sort((a, b) => (b.id || 0) - (a.id || 0));
      const recent = sorted.slice(0, 5); // last 5 matches
      const rec = sumStats(recent);
      const all = sumStats(list);

      if (rec.matches < 3 || all.matches === 0) {
        // not enough data → neutral
        result.set(playerName, "Moderate");
        return;
      }

      const recentRunsAvg = rec.matches ? rec.runs / rec.matches : 0;
      const careerRunsAvg = all.matches ? all.runs / all.matches : 0;
      const recentWktsAvg = rec.matches ? rec.wkts / rec.matches : 0;
      const careerWktsAvg = all.matches ? all.wkts / all.matches : 0;

      const batRatio =
        careerRunsAvg > 0 ? recentRunsAvg / careerRunsAvg : 1;
      const bowlRatio =
        careerWktsAvg > 0 ? recentWktsAvg / careerWktsAvg : 1;

      // weighted form index (1.0 = normal, >1 good, <1 poor)
      const formIndex = 0.7 * batRatio + 0.3 * bowlRatio;

      const hasPurplePatch =
        rec.fifties + rec.hundreds >= 2 ||
        recentRunsAvg >= careerRunsAvg * 1.3 ||
        recentWktsAvg >= careerWktsAvg * 1.5;

      const isSlump =
        rec.lowScores >= 3 ||
        (recentRunsAvg <= careerRunsAvg * 0.6 &&
          recentWktsAvg <= careerWktsAvg * 0.6);

      let morale = "Moderate";
      if (hasPurplePatch || formIndex >= 1.25) {
        morale = "High";
      } else if (isSlump || formIndex <= 0.75) {
        morale = "Low";
      }

      result.set(playerName, morale);
    });

    return result;
  }, [rows]);

  // 3a) build highlights from the global combined array
  const combinedHighlights = useMemo(() => {
    if (!combinedAllFormats.length) return null;
    const topRuns = combinedAllFormats[0];

    // top wickets
    const topWkts = [...combinedAllFormats].sort(
      (a, b) => b.total_wickets - a.total_wickets
    )[0];

    // best runs per match
    const bestRpm = [...combinedAllFormats]
      .filter((p) => p.total_matches > 0)
      .sort(
        (a, b) =>
          b.total_runs / b.total_matches - a.total_runs / a.total_matches
      )[0];

    return {
      topRuns,
      topWkts,
      bestRpm,
    };
  }, [combinedAllFormats]);

  // 3b) apply search + sort + morale filter to table 3 (but DO NOT change displayed rank)
  const filteredCombinedAllFormats = useMemo(() => {
    const q = combinedSearch.trim().toLowerCase();
    let base = combinedAllFormats;

    if (q) {
      base = base.filter((p) =>
        p.player_name.toLowerCase().includes(q)
      );
    }

    if (moraleFilter !== "ALL") {
      base = base.filter(
        (p) =>
          (moraleByPlayer.get(p.player_name) || "Moderate") ===
          moraleFilter
      );
    }

    // sort view-only
    if (combinedSort === "wkts") {
      return [...base].sort((a, b) => b.total_wickets - a.total_wickets);
    }
    if (combinedSort === "rpm") {
      return [...base].sort((a, b) => {
        const aRpm = a.total_matches ? a.total_runs / a.total_matches : 0;
        const bRpm = b.total_matches ? b.total_runs / b.total_matches : 0;
        return bRpm - aRpm;
      });
    }

    // "runs" -> keep original run order to match rank
    return base;
  }, [
    combinedAllFormats,
    combinedSearch,
    combinedSort,
    moraleFilter,
    moraleByPlayer,
  ]);

  if (loading) {
    return (
      <div className="text-center text-light mt-5">
        ⏳ Loading performances...
      </div>
    );
  }

  return (
    <div className="container mt-4 text-white">
      <ToastContainer position="top-center" />

      {/* ===== 1) Match-wise table ===== */}
      <div className="ps-card">
        <div className="ps-header">
          <h3 className="ps-title">
            <span className="dot" /> Player Performance Stats
          </h3>
          <p className="ps-sub">
            Match-wise rows. Filter by player, team, or format.
          </p>
          <button
            type="button"
            className="ps-info"
            onClick={() =>
              openInfo(
                "Player Performance Stats",
                "This table shows every match entry. Each row = one match for one player. Use the filters to narrow by player, team, or format."
              )
            }
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

        <div className="ps-grid" role="table">
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
              const notOut = String(r.dismissed_status || r.dismissed || "")
                .toLowerCase()
                .includes("not");
              const runsDisp = notOut ? `${r.run_scored}*` : r.run_scored;
              const srDisp = (
                r.strike_rate
                  ? Number(r.strike_rate)
                  : sr(r.run_scored, r.balls_faced)
              ).toFixed(2);

              return (
                <div
                  className="ps-row"
                  role="row"
                  key={`${r.player_name}-${idx}`}
                >
                  <div className="cell player">
                    <button
                      className="player-link"
                      onClick={() => handlePlayerClick(r.player_name)}
                    >
                      {r.player_name}
                    </button>
                  </div>
                  <div className="cell">{r.team_name}</div>
                  <div className="cell">
                    {String(r.match_type).toUpperCase()}
                  </div>
                  <div className="cell">{r.match_name || "—"}</div>
                  <div className="cell">{r.against_team}</div>
                  <div className="cell num">{runsDisp}</div>
                  <div className="cell num">{r.balls_faced}</div>
                  <div className="cell num">{srDisp}</div>
                  <div className="cell num">{r.wickets_taken}</div>
                  <div className="cell num">{r.runs_given}</div>
                  <div className="cell num">{r.fifties}</div>
                  <div className="cell num">{r.hundreds}</div>
                  <div className="cell">
                    {r.dismissed_status || r.dismissed || "—"}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ===== 2) Existing Overall Summary ===== */}
      {combined.length > 0 && (
        <div className="ps-card mt-4">
          <div className="ps-header ps-header--mini">
            <h4 className="ps-title-small">
              Player Overall Performance Summary
            </h4>
            <button
              type="button"
              className="ps-info"
              onClick={() =>
                openInfo(
                  "Player Overall Performance Summary",
                  "This table groups by player + team + match type. So the same player can appear multiple times (ODI / T20 / Test). It shows totals for that combination only."
                )
              }
            >
              i
            </button>
          </div>

          <div className="ps-grid-sum" role="table">
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
                const top =
                  i === 0
                    ? "gold"
                    : i === 1
                    ? "silver"
                    : i === 2
                    ? "bronze"
                    : "";
                const medal =
                  i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : null;
                return (
                  <div
                    className={`ps-row-sum ${top}`}
                    role="row"
                    key={`${p.player_name}-${i}`}
                  >
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
                    <div className="cell">
                      {String(p.match_type).toUpperCase()}
                    </div>
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

      {/* ===== 3) Player Combined (All Formats) ===== */}
      <div className="ps-card mt-4">
        <div className="ps-header ps-header--mini">
          <h4 className="ps-title-small">Player Combined (All Formats)</h4>
          <button
            type="button"
            className="ps-info"
            onClick={() =>
              openInfo(
                "Player Combined (All Formats) & Moral",
                `This table shows exactly 1 row per player. It adds ODI + T20 + Test for that player from the filtered list above.

Moral = recent form compared to the player's career:

• HIGH – last 5 matches clearly better than career (more runs/wickets per match or 2+ big scores).
• MODERATE – last 5 matches roughly equal to normal career performance.
• LOW – last 5 matches much below career and include several low scores (<20 runs with 0 wickets).`
              )
            }
          >
            i
          </button>
        </div>

        {/* Highlights bar */}
        {combinedHighlights && (
          <div className="ps-combined-highlights">
            <div className="ps-h-item">
              <span className="ps-h-label">Top Runs</span>
              <span className="ps-h-value">
                {combinedHighlights.topRuns?.player_name} •{" "}
                {combinedHighlights.topRuns?.total_runs}
              </span>
            </div>
            <div className="ps-h-item">
              <span className="ps-h-label">Top Wkts</span>
              <span className="ps-h-value">
                {combinedHighlights.topWkts?.player_name} •{" "}
                {combinedHighlights.topWkts?.total_wickets}
              </span>
            </div>
            <div className="ps-h-item">
              <span className="ps-h-label">Best Runs/Match</span>
              <span className="ps-h-value">
                {combinedHighlights.bestRpm?.player_name} •{" "}
                {combinedHighlights.bestRpm?.total_matches
                  ? (
                      combinedHighlights.bestRpm.total_runs /
                      combinedHighlights.bestRpm.total_matches
                    ).toFixed(1)
                  : "0"}
              </span>
            </div>
          </div>
        )}

        {/* search + sort toolbar for table 3 */}
        <div className="ps-combined-toolbar">
          <div className="ps-filters ps-filters--compact">
            <input
              className="ps-input"
              placeholder="Search player in combined table..."
              value={combinedSearch}
              onChange={(e) => setCombinedSearch(e.target.value)}
            />
            <div className="moral-filter-group">
              <button
                type="button"
                className={`moral-filter-btn ${
                  moraleFilter === "ALL" ? "active" : ""
                }`}
                onClick={() => setMoraleFilter("ALL")}
              >
                All
              </button>
              <button
                type="button"
                className={`moral-filter-btn moral-filter-high ${
                  moraleFilter === "High" ? "active" : ""
                }`}
                onClick={() => setMoraleFilter("High")}
              >
                High
              </button>
              <button
                type="button"
                className={`moral-filter-btn moral-filter-moderate ${
                  moraleFilter === "Moderate" ? "active" : ""
                }`}
                onClick={() => setMoraleFilter("Moderate")}
              >
                Moderate
              </button>
              <button
                type="button"
                className={`moral-filter-btn moral-filter-low ${
                  moraleFilter === "Low" ? "active" : ""
                }`}
                onClick={() => setMoraleFilter("Low")}
              >
                Low
              </button>
            </div>
          </div>
          <div className="ps-combined-sort-wrap">
            <label className="ps-combined-sort-label" htmlFor="sortCombined">
              Sort by
            </label>
            <select
              id="sortCombined"
              className="ps-combined-sort"
              value={combinedSort}
              onChange={(e) => setCombinedSort(e.target.value)}
            >
              <option value="runs">Total Runs (default)</option>
              <option value="wkts">Total Wickets</option>
              <option value="rpm">Runs per Match</option>
            </select>
          </div>
        </div>

        {/* Moral legend so users understand colours quickly */}
        <div className="moral-legend">
          <span className="moral-legend-label">Moral guide:</span>
          <span className="moral-pill moral-high moral-pill-mini">
            High = hot form
          </span>
          <span className="moral-pill moral-moderate moral-pill-mini">
            Moderate = normal form
          </span>
          <span className="moral-pill moral-low moral-pill-mini">
            Low = below par
          </span>
        </div>

        <div className="ps-grid-combined" role="table">
          <div className="ps-head-combined" role="rowgroup">
            <div className="cell head num">Rank</div>
            <div className="cell head">Player</div>
            <div className="cell head num">Matches</div>
            <div className="cell head num">Total Runs</div>
            <div className="cell head num">Total Wkts</div>
            <div className="cell head num">Total 50s</div>
            <div className="cell head num">Total 100s</div>
            <div className="cell head num">Total 200s</div>
            <div className="cell head">Moral</div>
          </div>

          <div className="ps-body" role="rowgroup">
            {filteredCombinedAllFormats.length === 0 && (
              <div className="ps-empty">No such player found.</div>
            )}

            {filteredCombinedAllFormats.map((p) => {
              const top =
                p.rank === 1
                  ? "gold"
                  : p.rank === 2
                  ? "silver"
                  : p.rank === 3
                  ? "bronze"
                  : "";
              const medal =
                p.rank === 1
                  ? "🥇"
                  : p.rank === 2
                  ? "🥈"
                  : p.rank === 3
                  ? "🥉"
                  : null;

              const runsPerMatch = p.total_matches
                ? (p.total_runs / p.total_matches).toFixed(1)
                : "0.0";
              const wktsPerMatch = p.total_matches
                ? (p.total_wickets / p.total_matches).toFixed(2)
                : "0.00";

              const morale = moraleByPlayer.get(p.player_name) || "Moderate";
              const moraleClass =
                morale === "High"
                  ? "moral-pill moral-high"
                  : morale === "Low"
                  ? "moral-pill moral-low"
                  : "moral-pill moral-moderate";

              return (
                <div
                  className={`ps-row-combined ${top}`}
                  role="row"
                  key={p.player_name}
                  title={`Runs/Match: ${runsPerMatch} • Wkts/Match: ${wktsPerMatch}`}
                >
                  <div className="cell num">
                    <span className={`medal ${top || ""}`}>{medal}</span>
                    {p.rank}
                  </div>
                  <div className="cell">
                    <button
                      className="player-link"
                      onClick={() => handlePlayerClick(p.player_name)}
                    >
                      {p.player_name}
                    </button>
                  </div>
                  <div className="cell num">{p.total_matches}</div>
                  <div className="cell num">{p.total_runs}</div>
                  <div className="cell num">{p.total_wickets}</div>
                  <div className="cell num">{p.total_fifties}</div>
                  <div className="cell num">{p.total_hundreds}</div>
                  <div className="cell num">{p.total_double_hundreds}</div>
                  <div className="cell moral-cell">
                    <span className={moraleClass}>{morale}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ===== Match details modal ===== */}
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
                      <h6 className="text-warning fw-bold">
                        Batting Performance
                      </h6>
                      <p>
                        Scored <b>{match.formatted_run_scored}</b> from{" "}
                        <b>{match.balls_faced}</b> balls, strike rate{" "}
                        <b>{match.strike_rate}</b>
                      </p>
                      <p>
                        Milestones: <b>{match.fifties}</b> fifties ·{" "}
                        <b>{match.hundreds}</b> hundreds
                      </p>
                    </div>

                    <div className="section mt-2">
                      <h6 className="text-warning fw-bold">
                        Bowling Performance
                      </h6>
                      <p>
                        Wickets: <b>{match.wickets_taken}</b>, Runs:{" "}
                        <b>{match.runs_given}</b>
                      </p>
                      <p>
                        Economy:{" "}
                        <b>
                          {match.runs_given > 0 && match.wickets_taken > 0
                            ? (
                                match.runs_given /
                                (match.wickets_taken || 1)
                              ).toFixed(2)
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

      {/* ===== Info modal for "i" buttons ===== */}
      {infoModal.open && (
        <div className="ps-info-modal-overlay" onClick={closeInfo}>
          <div className="ps-info-modal" onClick={(e) => e.stopPropagation()}>
            <div className="ps-info-modal-header">
              <h3 className="ps-info-modal-title">{infoModal.title}</h3>
              <button className="ps-info-modal-close" onClick={closeInfo}>
                ✖
              </button>
            </div>
            <p className="ps-info-modal-body">{infoModal.body}</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default PlayerStats;
