import React, { useEffect, useState } from "react";
import { getTestMatchHistory } from "../services/api";

const TestMatchHistory = () => {
  const [matches, setMatches] = useState([]);

  useEffect(() => {
    const fetchTestMatches = async () => {
      try {
        const data = await getTestMatchHistory();
        setMatches(data);
      } catch (error) {
        console.error("Error fetching test match history:", error);
      }
    };

    fetchTestMatches();
  }, []);

  const getTotal = (a = 0, b = 0) => (parseFloat(a) + parseFloat(b)).toFixed(1);

  return (
    <div className="container mt-5">
      <div className="card shadow p-4">
        <h2 className="text-center text-secondary mb-4">🧾 Test Match History</h2>

        <div className="table-responsive">
          <table className="table table-bordered text-center">
            <thead className="table-light">
              <tr>
                <th>#</th>
                <th>Match</th>
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
                  const runs1 = match.runs1 + match.runs1_2;
                  const overs1 = getTotal(match.overs1, match.overs1_2);
                  const wickets1 = match.wickets1 + match.wickets1_2;

                  const runs2 = match.runs2 + match.runs2_2;
                  const overs2 = getTotal(match.overs2, match.overs2_2);
                  const wickets2 = match.wickets2 + match.wickets2_2;

                  return (
                    <tr key={index}>
                      <td>{index + 1}</td>
                      <td>{match.match_name}</td>
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
                  <td colSpan="8">No Test match history available.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default TestMatchHistory;
