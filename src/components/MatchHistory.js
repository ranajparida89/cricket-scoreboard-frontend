import React, { useEffect, useState } from "react";
import { getMatchHistory } from "../services/api";

const MatchHistory = () => {
  const [matches, setMatches] = useState([]);
  const [filters, setFilters] = useState({
    match_type: "",
    team: "",
    winner: ""
  });

  // ✅ Load all data initially
  const fetchData = async (filterValues = {}) => {
    try {
      const data = await getMatchHistory(filterValues);
      setMatches(data);
    } catch (error) {
      console.error("Error fetching match history:", error);
    }
  };

  useEffect(() => {
    fetchData(); // ✅ Initial load
  }, []);

  const handleChange = (e) => {
    setFilters({
      ...filters,
      [e.target.name]: e.target.value
    });
  };

  const handleSearch = (e) => {
    e.preventDefault();
    fetchData(filters);
  };

  const handleReset = () => {
    setFilters({
      match_type: "",
      team: "",
      winner: ""
    });
    fetchData({});
  };

  return (
    <div className="container mt-5">
      <div className="card shadow p-4">
        <h2 className="text-center text-secondary mb-4">📜 Match History</h2>

        {/* Filter Form */}
        <form onSubmit={handleSearch} className="row g-3 mb-4">
          <div className="col-md-3">
            <select
              className="form-select"
              name="match_type"
              value={filters.match_type}
              onChange={handleChange}
            >
              <option value="">All Match Types</option>
              <option value="T20">T20</option>
              <option value="ODI">ODI</option>
            </select>
          </div>

          <div className="col-md-3">
            <input
              type="text"
              name="team"
              className="form-control"
              placeholder="Search by Team"
              value={filters.team}
              onChange={handleChange}
            />
          </div>

          <div className="col-md-3">
            <input
              type="text"
              name="winner"
              className="form-control"
              placeholder="Search by Winner"
              value={filters.winner}
              onChange={handleChange}
            />
          </div>

          <div className="col-md-3 d-flex justify-content-between">
            <button type="submit" className="btn btn-primary me-2">Search</button>
            <button type="button" className="btn btn-secondary" onClick={handleReset}>
              Reset
            </button>
          </div>
        </form>

        {/* Match History Table */}
        <div className="table-responsive">
          <table className="table table-bordered text-center">
            <thead className="table-light">
              <tr>
                <th>#</th>
                <th>Match</th>
                <th>Type</th>
                <th>Team 1</th>
                <th>Score</th>
                <th>Team 2</th>
                <th>Score</th>
                <th>Winner</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {matches.length > 0 ? (
                matches.map((match, index) => (
                  <tr key={match.id}>
                    <td>{index + 1}</td>
                    <td>{match.match_name}</td>
                    <td>{match.match_type}</td>
                    <td>{match.team1}</td>
                    <td>{match.runs1}/{match.wickets1} ({Number(match.overs1).toFixed(1)} ov)</td>
                    <td>{match.team2}</td>
                    <td>{match.runs2}/{match.wickets2} ({Number(match.overs2).toFixed(1)} ov)</td>
                    <td>{match.winner}</td>
                    <td>{new Date(match.match_time).toLocaleString()}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="9">No match history available.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default MatchHistory;
