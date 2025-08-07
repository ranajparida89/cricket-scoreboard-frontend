// src/components/AllBoardsView.js
import React, { useEffect, useState } from "react";
import axios from "axios";
import { Player } from "@lottiefiles/react-lottie-player";
import { useAuth } from "../services/auth";
import "./AllBoardsView.css";

const AllBoardsView = () => {
  const [boards, setBoards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const { currentUser } = useAuth();

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

  // 🔁 Update board field (Admin only)
  const handleUpdateBoard = async (id, field, value) => {
    try {
      await axios.put(`https://cricket-scoreboard-backend.onrender.com/api/boards/update/${id}`, {
        field,
        value
      });
      fetchBoards();
    } catch (err) {
      alert("Update failed.");
    }
  };

  // ❌ Delete a team (Admin only)
  const handleDeleteTeam = async (registrationId, teamName) => {
    if (!window.confirm(`Are you sure you want to delete team "${teamName}"?`)) return;

    try {
      await axios.delete(`https://cricket-scoreboard-backend.onrender.com/api/boards/remove-team`, {
        data: {
          registration_id: registrationId,
          team_name: teamName
        }
      });
      fetchBoards();
    } catch (err) {
      alert("Failed to delete team.");
    }
  };

  // ❌ Delete board (Admin only)
  const handleDeleteBoard = async (id) => {
    if (!window.confirm("Are you sure you want to delete this entire board?")) return;

    try {
      await axios.delete(`https://cricket-scoreboard-backend.onrender.com/api/boards/delete/${id}`);
      fetchBoards();
    } catch (err) {
      alert("Failed to delete board.");
    }
  };

  return (
    <div className="boards-container">
      <h1 className="boards-title">📋 Registered Cricket Boards</h1>

      {loading && (
        <div className="lottie-wrapper">
          <Player autoplay loop src="https://assets10.lottiefiles.com/packages/lf20_usmfx6bp.json" style={{ height: "180px", width: "180px" }} />
          <p>Loading Boards...</p>
        </div>
      )}

      {error && (
        <div className="lottie-wrapper error">
          <Player autoplay loop src="https://assets2.lottiefiles.com/packages/lf20_qp1q7mct.json" style={{ height: "180px", width: "180px" }} />
          <p>{error}</p>
        </div>
      )}

      {!loading && !error && boards.length === 0 && (
        <div className="lottie-wrapper no-boards">
          <Player autoplay loop src="https://assets7.lottiefiles.com/private_files/lf30_j3bzzv.json" style={{ height: "160px", width: "160px" }} />
          <p>No boards registered yet.</p>
        </div>
      )}

      <div className="board-grid">
        {boards.map((board) => (
          <div key={board.registration_id} className="board-card">
            <h2 contentEditable={currentUser?.role === "admin"}
                suppressContentEditableWarning={true}
                onBlur={(e) => handleUpdateBoard(board.registration_id, "board_name", e.target.innerText)}>
              {board.board_name}
            </h2>

            <p><strong>Owner:</strong>
              <span contentEditable={currentUser?.role === "admin"}
                suppressContentEditableWarning={true}
                onBlur={(e) => handleUpdateBoard(board.registration_id, "owner_name", e.target.innerText)}>
                {board.owner_name}
              </span>
            </p>

            <p><strong>Email:</strong>
              <span contentEditable={currentUser?.role === "admin"}
                suppressContentEditableWarning={true}
                onBlur={(e) => handleUpdateBoard(board.registration_id, "owner_email", e.target.innerText)}>
                {board.owner_email}
              </span>
            </p>

            <p><strong>Date:</strong>
              <span contentEditable={currentUser?.role === "admin"}
                suppressContentEditableWarning={true}
                onBlur={(e) => handleUpdateBoard(board.registration_id, "registration_date", e.target.innerText)}>
                {board.registration_date}
              </span>
            </p>

            <div className="team-list">
              {board.teams.map((team, index) => (
                <span key={index} className="team-chip">
                  {team}
                  {currentUser?.role === "admin" && (
                    <button className="remove-btn" onClick={() => handleDeleteTeam(board.registration_id, team)}>❌</button>
                  )}
                </span>
              ))}
            </div>

            {currentUser?.role === "admin" && (
              <button className="delete-board-btn" onClick={() => handleDeleteBoard(board.registration_id)}>🗑️ Delete Board</button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default AllBoardsView;
