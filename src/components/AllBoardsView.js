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

  // admin detection (unchanged)
  const isAdmin =
    currentUser?.role === "admin" || localStorage.getItem("isAdmin") === "true";

  const authHeaders = () => {
    const t = localStorage.getItem("admin_jwt");
    return t ? { Authorization: `Bearer ${t}` } : {};
  };

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

  const handleUpdateField = async (board, field, value) => {
    if (!isAdmin) return;
    const payload = {
      board_name: field === "board_name" ? value : board.board_name,
      owner_name: field === "owner_name" ? value : board.owner_name,
      registration_date:
        field === "registration_date" ? value : board.registration_date,
      owner_email: field === "owner_email" ? value : board.owner_email,
      teams: board.teams,
    };

    try {
      await axios.put(
        `https://cricket-scoreboard-backend.onrender.com/api/boards/update/${board.registration_id}`,
        payload,
        { headers: authHeaders() }
      );
      fetchBoards();
    } catch (err) {
      alert(err.response?.data?.error || "Update failed.");
    }
  };

  const handleRemoveTeam = async (board, teamName) => {
    if (!isAdmin) return;
    if (!window.confirm(`Delete team "${teamName}" from ${board.board_name}?`))
      return;

    const payload = {
      board_name: board.board_name,
      owner_name: board.owner_name,
      registration_date: board.registration_date,
      owner_email: board.owner_email,
      teams: board.teams.filter((t) => t !== teamName),
    };

    try {
      await axios.put(
        `https://cricket-scoreboard-backend.onrender.com/api/boards/update/${board.registration_id}`,
        payload,
        { headers: authHeaders() }
      );
      fetchBoards();
    } catch (err) {
      alert(err.response?.data?.error || "Failed to delete team.");
    }
  };

  const handleDeleteBoard = async (id) => {
    if (!isAdmin) return;
    if (!window.confirm("Are you sure you want to delete this entire board?"))
      return;

    try {
      await axios.delete(
        `https://cricket-scoreboard-backend.onrender.com/api/boards/delete/${id}`,
        { headers: authHeaders() }
      );
      fetchBoards();
    } catch (err) {
      alert(err.response?.data?.error || "Failed to delete board.");
    }
  };

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
            <div className="board-card-header">
              <h2
                contentEditable={isAdmin}
                suppressContentEditableWarning={true}
                onBlur={(e) =>
                  handleUpdateField(board, "board_name", e.target.innerText)
                }
              >
                {board.board_name}
              </h2>
              <span className="board-badge">Board</span>
            </div>

            <div className="board-meta">
              <p>
                <strong>Owner:</strong>{" "}
                <span
                  contentEditable={isAdmin}
                  suppressContentEditableWarning={true}
                  onBlur={(e) =>
                    handleUpdateField(board, "owner_name", e.target.innerText)
                  }
                >
                  {board.owner_name}
                </span>
              </p>
              <p>
                <strong>Email:</strong>{" "}
                <span
                  contentEditable={isAdmin}
                  suppressContentEditableWarning={true}
                  onBlur={(e) =>
                    handleUpdateField(board, "owner_email", e.target.innerText)
                  }
                >
                  {board.owner_email}
                </span>
              </p>
              <p>
                <strong>Date:</strong>{" "}
                <span
                  contentEditable={isAdmin}
                  suppressContentEditableWarning={true}
                  onBlur={(e) =>
                    handleUpdateField(
                      board,
                      "registration_date",
                      e.target.innerText
                    )
                  }
                >
                  {board.registration_date}
                </span>
              </p>
            </div>

            <div className="team-list">
              {board.teams.map((team, index) => (
                <div key={index} className="team-chip">
                  <span className="team-name">{team}</span>
                  {isAdmin && (
                    <button
                      className="team-remove-btn"
                      onClick={() => handleRemoveTeam(board, team)}
                      type="button"
                    >
                      ✕
                    </button>
                  )}
                </div>
              ))}
            </div>

            {isAdmin && (
              <button
                className="delete-board-btn"
                onClick={() => handleDeleteBoard(board.registration_id)}
              >
                🗑️ Delete Board
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default AllBoardsView;
