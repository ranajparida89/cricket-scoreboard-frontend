import React, { useEffect, useState } from "react";
import { getMatchHistory } from "../services/api";

const MatchHistory = () => {
  const [matches, setMatches] = useState([]);
  const [filters, setFilters] = useState({
    match_type: "",
    team: "",
    winner: ""
  });

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

  const formatOvers = (overs) => {
    if (!overs && overs !== 0) return "-";
    const floatVal = parseFloat(overs);
    const full = Math.floor(floatVal);
    const balls = Math.round((floatVal - full) * 6);
    return `${full}.${balls}`;
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
              <option value="Test">Test</option> {/* ✅ Added Test option */}
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
                matches.map((match, index) => {
                  const isTest = match.match_type === "Test";

                  const team1Runs = isTest
                    ? (parseInt(match.runs1 || 0) + parseInt(match.runs1_2 || 0))
                    : match.runs1;
                  const team1Overs = isTest
                    ? (parseFloat(match.overs1 || 0) + parseFloat(match.overs1_2 || 0))
                    : match.overs1;
                  const team1Wickets = isTest ? 10 : match.wickets1;

                  const team2Runs = isTest
                    ? (parseInt(match.runs2 || 0) + parseInt(match.runs2_2 || 0))
                    : match.runs2;
                  const team2Overs = isTest
                    ? (parseFloat(match.overs2 || 0) + parseFloat(match.overs2_2 || 0))
                    : match.overs2;
                  const team2Wickets = isTest ? 10 : match.wickets2;

                  return (
                    <tr key={match.id}>
                      <td>{index + 1}</td>
                      <td>{match.match_name}</td>
                      <td>{match.match_type}</td>
                      <td>{match.team1}</td>
                      <td>{team1Runs}/{team1Wickets} ({formatOvers(team1Overs)} ov)</td>
                      <td>{match.team2}</td>
                      <td>{team2Runs}/{team2Wickets} ({formatOvers(team2Overs)} ov)</td>
                      <td>{match.winner}</td>
                      <td>{new Date(match.match_time).toLocaleString()}</td>
                    </tr>
                  );
                })
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
