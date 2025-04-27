// ✅ src/components/PlayerStats.js
import React, { useState, useEffect } from "react";
import axios from "axios";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const PlayerStats = () => {
  const [performances, setPerformances] = useState([]);
  const [loading, setLoading] = useState(true);

  const [filters, setFilters] = useState({
    playerName: "",
    teamName: "",
    matchType: "",
  });

  useEffect(() => {
    fetchPerformances();
  }, []);

  const fetchPerformances = async () => {
    try {
      setLoading(true);
      const res = await axios.get("https://cricket-scoreboard-backend.onrender.com/api/player-stats");
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

      {/* Table */}
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
      <th>Against Team</th>
      <th>Runs Scored</th>
      <th>Highest Score</th> {/* 🆕 Added */}
      <th>Batting Avg</th> {/* 🆕 Added */}
      <th>Wickets Taken</th>
      <th>Runs Given</th>
      <th>Fifties</th>
      <th>Hundreds</th>
    </tr>
  </thead>
  <tbody>
    {filteredPerformances.map((p, index) => {
      // 🧠 Calculate Batting Average
      const battingAverage = p.dismissed_status === "out"
        ? (p.run_scored / 1).toFixed(2) // if out, divide normally
        : (p.run_scored / 0.5).toFixed(2); // if not out, weight less (fake average to handle 0 dismissal)

      // 🧠 Highest Score is same as run_scored (for now)
      const highestScore = p.dismissed_status === "not out"
        ? `${p.run_scored}*`
        : `${p.run_scored}`;

      return (
        <tr key={p.id || index}>
          <td>{p.player_name}</td>
          <td>{p.team_name}</td>
          <td>{p.match_type}</td>
          <td>{p.against_team}</td>
          <td>{p.run_scored}</td>
          <td>{highestScore}</td> {/* 🆕 Highest Score displayed */}
          <td>{battingAverage}</td> {/* 🆕 Batting Avg displayed */}
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
    </div>
  );
};

export default PlayerStats;
