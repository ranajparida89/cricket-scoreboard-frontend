import React, { useEffect, useState } from "react";
import { getMatchHistory, getTestMatchHistory } from "../services/api"; // ✅ [Ranaj - 2025-04-09] Imported Test match history API

const MatchHistory = () => {
  const [matches, setMatches] = useState([]);
  const [filters, setFilters] = useState({
    match_type: "",
    team: "",
    winner: ""
  });

  // ✅ [Ranaj - 2025-04-09] Updated fetchData logic to support Test match history
  const fetchData = async (filterValues = {}) => {
    try {
      let data = [];
      if (filterValues.match_type === "Test") {
        const testMatches = await getTestMatchHistory();
        data = testMatches.map(match => ({
          ...match,
          match_type: "Test",
          match_name: match.match_name,
          match_time: match.match_time,
          team1: match.team1,
          team2: match.team2,
          winner: match.winner,
          runs1: match.runs1,
          overs1: match.overs1,
          wickets1: match.wickets1,
          runs1_2: match.runs1_2,
          overs1_2: match.overs1_2,
          wickets1_2: match.wickets1_2,
          runs2: match.runs2,
          overs2: match.overs2,
          wickets2: match.wickets2,
          runs2_2: match.runs2_2,
          overs2_2: match.overs2_2,
          wickets2_2: match.wickets2_2
        }));
      } else {
        data = await getMatchHistory(filterValues);
      }
      setMatches(data);
    } catch (error) {
      console.error("Error fetching match history:", error);
    }
  };

  useEffect(() => {
    fetchData();
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
    return Number(overs).toFixed(1);
  };

  const getTotal = (primary, secondary) => {
    const p = parseFloat(primary || 0);
    const s = parseFloat(secondary || 0);
    return (p + s).toFixed(1);
  };

  return (
    <div className="container mt-5">
     <div className="transparent-card p-4 mt-3"> {/* ✅ transparent wrapper */}
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
                matches.map((match, index) => {
                  const isTest = match.match_type === "Test";

                  // Team 1 scores
                  const runs1 = isTest ? (parseInt(match.runs1 || 0) + parseInt(match.runs1_2 || 0)) : match.runs1;
                  const overs1 = isTest ? getTotal(match.overs1, match.overs1_2) : formatOvers(match.overs1);
                  const wickets1 = isTest ? (parseInt(match.wickets1 || 0) + parseInt(match.wickets1_2 || 0)) : match.wickets1;

                  // Team 2 scores
                  const runs2 = isTest ? (parseInt(match.runs2 || 0) + parseInt(match.runs2_2 || 0)) : match.runs2;
                  const overs2 = isTest ? getTotal(match.overs2, match.overs2_2) : formatOvers(match.overs2);
                  const wickets2 = isTest ? (parseInt(match.wickets2 || 0) + parseInt(match.wickets2_2 || 0)) : match.wickets2;

                  return (
                    <tr key={match.id || index}>
                      <td>{index + 1}</td>
                      <td>{match.match_name}</td>
                      <td>{match.match_type}</td>
                      <td>{match.team1}</td>
                      <td>{runs1}/{wickets1} ({overs1} ov)</td>
                      <td>{match.team2}</td>
                      <td>{runs2}/{wickets2} ({overs2} ov)</td>
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
