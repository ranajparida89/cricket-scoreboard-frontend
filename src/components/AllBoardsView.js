// src/components/AllBoardsView.js
import React, { useEffect, useState } from "react";
import axios from "axios";
import { Player } from "@lottiefiles/react-lottie-player";
import "./AllBoardsView.css";

const AllBoardsView = () => {
  const [boards, setBoards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchBoards = async () => {
    try {
      const res = await axios.get(
        "https://cricket-scoreboard-backend.onrender.com/api/boards/all-boards"
      );
      setBoards(res.data.boards || []);
    } catch (err) {
      setError("Failed to load boards. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBoards();
  }, []);

  return (
    <div className="boards-container">
      <h1 className="boards-title">📋 Registered Cricket Boards</h1>

      {loading && (
        <div className="lottie-wrapper">
          <Player
            autoplay
            loop
            src="https://assets10.lottiefiles.com/packages/lf20_usmfx6bp.json"
            style={{ height: "180px", width: "180px" }}
          />
          <p>Loading Boards...</p>
        </div>
      )}

      {error && (
        <div className="lottie-wrapper error">
          <Player
            autoplay
            loop
            src="https://assets2.lottiefiles.com/packages/lf20_qp1q7mct.json"
            style={{ height: "180px", width: "180px" }}
          />
          <p>{error}</p>
        </div>
      )}

      {!loading && !error && boards.length === 0 && (
        <div className="lottie-wrapper no-boards">
          <Player
            autoplay
            loop
            src="https://assets7.lottiefiles.com/private_files/lf30_j3bzzv.json"
            style={{ height: "160px", width: "160px" }}
          />
          <p>No boards registered yet.</p>
        </div>
      )}

      <div className="board-grid">
        {boards.map((board) => (
          <div key={board.registration_id} className="board-card">
            <h2>{board.board_name}</h2>
            <p><strong>Owner:</strong> {board.owner_name}</p>
            <p><strong>Email:</strong> {board.owner_email}</p>
            <p><strong>Date:</strong> {board.registration_date}</p>
            <div className="team-list">
              {board.teams.map((team, index) => (
                <span key={index} className="team-chip">{team}</span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AllBoardsView;
