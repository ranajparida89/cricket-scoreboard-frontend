import React, { useEffect, useState } from "react";
import { getTeams } from "../services/api";
import { io } from "socket.io-client";

// Connect to backend Socket.io server
const socket = io("http://localhost:5000");

const Leaderboard = () => {
  const [teams, setTeams] = useState([]);

  // Function to fetch leaderboard data
  const fetchTeams = async () => {
    try {
      const data = await getTeams();
      const sorted = data.sort((a, b) =>
        b.points !== a.points ? b.points - a.points : b.nrr - a.nrr
      );
      setTeams(sorted);
    } catch (error) {
      console.error("Error fetching leaderboard:", error);
    }
  };

  useEffect(() => {
    fetchTeams(); // Initial load

    // Listen for real-time updates from backend
    socket.on("matchUpdate", () => {
      console.log("📡 Real-time update received");
      fetchTeams(); // Refresh data when update received
    });

    return () => {
      socket.off("matchUpdate"); // Cleanup on unmount
    };
  }, []);

  return (
    <div className="container mt-5">
      <div className="card shadow p-4">
        <h2 className="text-center text-success mb-4">🏆 Team Leaderboard</h2>
        <div className="table-responsive">
          <table className="table table-bordered text-center">
            <thead className="table-dark">
              <tr>
                <th>#</th>
                <th>Team</th>
                <th>Matches</th>
                <th>Wins</th>
                <th>Losses</th>
                <th>Points</th>
                <th>NRR</th>
              </tr>
            </thead>
            <tbody>
              {teams.map((team, index) => (
                <tr key={team.team_name}>
                  <td>{index + 1}</td>
                  <td>{team.team_name}</td>
                  <td>{team.matches_played}</td>
                  <td>{team.wins}</td>
                  <td>{team.losses}</td>
                  <td>{team.points}</td>
                  <td>{Number(team.nrr).toFixed(2)}</td>
                </tr>
              ))}
              {teams.length === 0 && (
                <tr>
                  <td colSpan="7">No match data available.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Leaderboard;
