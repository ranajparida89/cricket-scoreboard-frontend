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

  // ✅ CHANGE: unify admin detection (either role=admin OR legacy isAdmin flag)
  const isAdmin =
    currentUser?.role === "admin" || localStorage.getItem("isAdmin") === "true";

  // ✅ CHANGE: helper to attach admin JWT for protected endpoints
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

  // ❗️Your backend's PUT /update/:id expects the FULL board payload, not partial fields.
  // ✅ CHANGE: send full board object with a single field changed.
  const handleUpdateField = async (board, field, value) => {
    if (!isAdmin) return;
    const payload = {
      board_name: field === "board_name" ? value : board.board_name,
      owner_name: field === "owner_name" ? value : board.owner_name,
      registration_date:
        field === "registration_date" ? value : board.registration_date,
      owner_email: field === "owner_email" ? value : board.owner_email,
      teams: board.teams, // unchanged here
    };

    try {
      await axios.put(
        `https://cricket-scoreboard-backend.onrender.com/api/boards/update/${board.registration_id}`,
        payload,
        { headers: authHeaders() } // ✅ CHANGE: include admin JWT
      );
      fetchBoards();
    } catch (err) {
      alert(err.response?.data?.error || "Update failed.");
    }
  };

  // ❌ Delete a team (Admin only)
  // There is NO /remove-team API in backend. We emulate by PUT with filtered teams.
  // ✅ CHANGE: update board with teams minus the removed team.
  const handleRemoveTeam = async (board, teamName) => {
    if (!isAdmin) return;
    if (!window.confirm(`Delete team "${teamName}" from ${board.board_name}?`)) return;

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
        { headers: authHeaders() } // ✅ CHANGE: include admin JWT
      );
      fetchBoards();
    } catch (err) {
      alert(err.response?.data?.error || "Failed to delete team.");
    }
  };

  // ❌ Delete board (Admin only)
  // ✅ CHANGE: include admin JWT header
  const handleDeleteBoard = async (id) => {
    if (!isAdmin) return;
    if (!window.confirm("Are you sure you want to delete this entire board?")) return;

    try {
      await axios.delete(
        `https://cricket-scoreboard-backend.onrender.com/api/boards/delete/${id}`,
        { headers: authHeaders() } // ✅ CHANGE
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
            <h2
              contentEditable={isAdmin} // ✅ CHANGE: use unified isAdmin
              suppressContentEditableWarning={true}
              onBlur={(e) =>
                handleUpdateField(board, "board_name", e.target.innerText)
              } // ✅ CHANGE: call new updater
            >
              {board.board_name}
            </h2>

            <p>
              <strong>Owner:</strong>{" "}
              <span
                contentEditable={isAdmin} // ✅ CHANGE
                suppressContentEditableWarning={true}
                onBlur={(e) =>
                  handleUpdateField(board, "owner_name", e.target.innerText)
                } // ✅ CHANGE
              >
                {board.owner_name}
              </span>
            </p>

            <p>
              <strong>Email:</strong>{" "}
              <span
                contentEditable={isAdmin} // ✅ CHANGE
                suppressContentEditableWarning={true}
                onBlur={(e) =>
                  handleUpdateField(board, "owner_email", e.target.innerText)
                } // ✅ CHANGE
              >
                {board.owner_email}
              </span>
            </p>

            <p>
              <strong>Date:</strong>{" "}
              <span
                contentEditable={isAdmin} // ✅ CHANGE
                suppressContentEditableWarning={true}
                onBlur={(e) =>
                  handleUpdateField(
                    board,
                    "registration_date",
                    e.target.innerText
                  )
                } // ✅ CHANGE
              >
                {board.registration_date}
              </span>
            </p>

            <div className="team-list">
              {board.teams.map((team, index) => (
                <span key={index} className="team-chip">
                  {team}
                  {isAdmin && ( // ✅ CHANGE
                    <button
                      className="remove-btn"
                      onClick={() => handleRemoveTeam(board, team)} // ✅ CHANGE
                    >
                      ❌
                    </button>
                  )}
                </span>
              ))}
            </div>

            {isAdmin && ( // ✅ CHANGE
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
