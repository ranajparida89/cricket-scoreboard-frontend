// src/components/Leaderboard.js
import React, { useEffect, useState } from "react";
import { getTeams } from "../services/api";
import { io } from "socket.io-client";
import "./Leaderboard.css"; // ✅ Keep this for styling

const socket = io("https://cricket-scoreboard-backend.onrender.com");

const Leaderboard = () => {
  const [teams, setTeams] = useState([]);

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
    fetchTeams();
    socket.on("matchUpdate", fetchTeams);
    return () => socket.off("matchUpdate");
  }, []);

  return (
    <div className="table-responsive leaderboard-table-wrapper">
      <table className="table table-bordered table-dark table-sm text-center mb-0">
        <thead>
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
              <td colSpan="7" className="text-muted">
                No match data available.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default Leaderboard;
