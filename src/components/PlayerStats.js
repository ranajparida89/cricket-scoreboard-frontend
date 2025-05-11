// ✅ src/components/PlayerStats.js
import React, { useState, useEffect } from "react";
import axios from "axios";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import './PlayerDetailsModal.css';

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
      const res = await axios.get("https://cricket-scoreboard-backend.onrender.com/api/player-stats-summary");
      setPerformances(res.data);
      setLoading(false);
    } catch (err) {
      console.error("❌ Error fetching performances:", err);
      toast.error("❌ Failed to fetch player performances.");
      setLoading(false);
    }
  };

  const filteredPerformances = performances.filter((p) => {
    const playerMatch = p.player_name.toLowerCase().includes(filters.playerName.toLowerCase());
    const teamMatch = p.team_name.toLowerCase().includes(filters.teamName.toLowerCase());
    const matchTypeMatch = filters.matchType ? p.match_type === filters.matchType : true;
    return playerMatch && teamMatch && matchTypeMatch;
  });

  if (loading) {
    return <div className="text-center text-light mt-5">⏳ Loading performances...</div>;
  }

  const combinedData = [];
  filteredPerformances.forEach((perf) => {
    const existing = combinedData.find(
      (p) =>
        p.player_name === perf.player_name &&
        p.team_name === perf.team_name &&
        p.match_type === perf.match_type
    );

    if (existing) {
      existing.total_runs += parseInt(perf.run_scored) || 0;
      existing.total_wickets += parseInt(perf.wickets_taken) || 0;
      existing.total_fifties += parseInt(perf.fifties) || 0;
      existing.total_hundreds += parseInt(perf.hundreds) || 0;
    } else {
      combinedData.push({
        player_name: perf.player_name,
        team_name: perf.team_name,
        match_type: perf.match_type,
        total_runs: parseInt(perf.run_scored) || 0,
        total_wickets: parseInt(perf.wickets_taken) || 0,
        total_fifties: parseInt(perf.fifties) || 0,
        total_hundreds: parseInt(perf.hundreds) || 0,
        match_count: perf.match_count,
        total_matches: parseInt(perf.total_matches) || 0,
      });
    }
  });

  const sortedCombinedData = [...combinedData].sort((a, b) => b.total_runs - a.total_runs);

  return (
    <div className="container mt-4 text-white">
      <ToastContainer position="top-center" />
      <h3>📈 Player Performance Stats</h3>

      {/* Filters */}
      <div className="row my-3">
        <div className="col-md-4 mb-2">
          <input
            type="text"
            className="form-control"
            placeholder="Search Player Name"
            value={filters.playerName}
            onChange={(e) => setFilters({ ...filters, playerName: e.target.value })}
          />
        </div>
        <div className="col-md-4 mb-2">
          <input
            type="text"
            className="form-control"
            placeholder="Search Team Name"
            value={filters.teamName}
            onChange={(e) => setFilters({ ...filters, teamName: e.target.value })}
          />
        </div>
        <div className="col-md-4 mb-2">
          <select
            className="form-select"
            value={filters.matchType}
            onChange={(e) => setFilters({ ...filters, matchType: e.target.value })}
          >
            <option value="">All Match Types</option>
            <option value="ODI">ODI</option>
            <option value="T20">T20</option>
            <option value="Test">Test</option>
          </select>
        </div>
      </div>

      {/* Table 1 */}
      {filteredPerformances.length === 0 ? (
        <div className="text-center text-warning mt-4">⚠️ No performances found for selected filters.</div>
      ) : (
        <div className="table-responsive">
          <table className="table table-dark table-striped table-hover">
            <thead>
              <tr>
                <th>Player Name</th>
                <th>Team Name</th>
                <th>Match Type</th>
                <th>Match Name</th>
                <th>Against Team</th>
                <th>Runs Scored</th>
                <th>Ball Faced</th>
                <th>Strike Rate</th>
                <th>Highest Score</th>
                <th>Batting Avg</th>
                <th>Bowling Avg</th>
                <th>Wickets Taken</th>
                <th>Runs Given</th>
                <th>Fifties</th>
                <th>Hundreds</th>
              </tr>
            </thead>
            <tbody>
              {filteredPerformances.map((p, index) => {
                const battingAverage = p.dismissed_status === "out"
                  ? (p.run_scored / 1).toFixed(2)
                  : (p.run_scored / 0.5).toFixed(2);

                const bowlingAverage = p.wickets_taken > 0
                  ? (p.runs_given / p.wickets_taken).toFixed(2)
                  : "-";

                return (
                  <tr key={p.id || index}>
                    <td>{p.player_name}</td>
                    <td>{p.team_name}</td>
                    <td>{p.match_type}</td>
                    <td>{p.match_name || "—"}</td>
                    <td>{p.against_team}</td>
                    <td>{p.formatted_run_scored}</td>
                    <td>{p.balls_faced}</td>
                    <td>{p.strike_rate}</td>
                    <td>{p.highest_score}</td>
                    <td>{battingAverage}</td>
                    <td>{bowlingAverage}</td>
                    <td>{p.wickets_taken}</td>
                    <td>{p.runs_given}</td>
                    <td>{p.fifties}</td>
                    <td>{p.hundreds}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Table 2 */}
      {combinedData.length > 0 && (
        <>
          <h4 className="text-center text-info mt-5">Player Overall Performance Summary</h4>
          <div className="table-responsive">
            <table className="table table-dark table-striped table-hover">
              <thead>
                <tr>
                  <th>Rank</th>
                  <th>Player Name</th>
                  <th>Team Name</th>
                  <th>Match Type</th>
                  <th>Total Matches</th>
                  <th>Total Runs</th>
                  <th>Total Wickets</th>
                  <th>Total Fifty(s)</th>
                  <th>Total Hundred(s)</th>
                </tr>
              </thead>
              <tbody>
                {sortedCombinedData.map((p, index) => (
                  <tr
                    key={index}
                    className={
                      index === 0 ? "gold-row" :
                      index === 1 ? "silver-row" :
                      index === 2 ? "bronze-row" : ""
                    }
                  >
                    <td>{index + 1}</td>
                    <td>
                      <span className="clickable-player" onClick={() => handlePlayerClick(p.player_name)}>
                        {p.player_name}
                      </span>
                    </td>
                    <td>{p.team_name}</td>
                    <td>{p.match_type}</td>
                    <td>{filters.matchType ? p.match_count : p.total_matches}</td>
                    <td>{p.total_runs}</td>
                    <td>{p.total_wickets}</td>
                    <td>{p.total_fifties}</td>
                    <td>{p.total_hundreds}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* ✅ Floating Modal should be placed at bottom of return but inside main div */}
      {showDetailsModal && selectedPlayer && (
  <div className="player-modal-overlay">
    <div className="player-modal-content">
      <button className="player-modal-close" onClick={() => setShowDetailsModal(false)}>❌</button>
      <h2 className="modal-header">📋 Match-wise Performance of {"  "}<span>  {selectedPlayer}</span></h2>

      {performances
        .filter((p) => p.player_name === selectedPlayer)
        .map((match, index) => (
          <div className="player-match-card" key={index}>
            <h4>🏏 {match.match_name} ({match.match_type})</h4>
            <p><strong>📅 Date:</strong> {match.match_date && match.match_date.split("T")?.[0]}</p>
            <p><strong>🕒 Time:</strong> {match.match_time?.trim() || "N/A"} <strong>🗓 Day:</strong> {match.match_day?.trim() || "N/A"}</p>

            <div className="section">
              <h5>🧢 Batting Performance</h5>
              <p>• Scored <b>{match.formatted_run_scored}</b> runs from <b>{match.balls_faced}</b> balls with a strike rate of <b>{match.strike_rate}</b></p>
              <p>• Milestones: <b>{match.fifties}</b> Fifties | <b>{match.hundreds}</b> Hundreds | <b>{match.dismissed}</b></p>
            </div>

            <div className="section">
              <h5>🎯 Bowling Performance</h5>
              <p>• Took <b>{match.wickets_taken}</b> wicket(s) conceding <b>{match.runs_given}</b> runs</p>
              <p>• Economy: <b>
                {match.balls_faced > 0
                  ? (match.runs_given / (match.balls_faced / 6)).toFixed(2)
                  : "-"}
              </b></p>
            </div>
          </div>
        ))}
    </div>
  </div>
)}
    </div>
  );
};

export default PlayerStats;
