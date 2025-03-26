import React, { useEffect, useState } from "react";
import { getTeams } from "../services/api";
import { io } from "socket.io-client";

// ✅ IMPORTANT: use your deployed backend Socket.io URL here
const socket = io("https://cricket-scoreboard-backend.onrender.com"); // <-- Updated from localhost

const Leaderboard = () => {
  const [teams, setTeams] = useState([]);

  // 🔁 Fetch team leaderboard
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
    fetchTeams(); // ✅ Initial load

    socket.on("matchUpdate", () => {
      console.log("📡 Real-time update received");
      fetchTeams(); // ✅ Real-time refresh
    });

    return () => {
      socket.off("matchUpdate");
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
