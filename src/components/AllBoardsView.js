// src/components/AllBoardsView.js
// 10-AUG-2025 — Board overview + admin actions + Move Team between boards (no data loss)

import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "./AllBoardsView.css";

const API_BASE = "https://cricket-scoreboard-backend.onrender.com";

const API_ALL_BOARDS = `${API_BASE}/api/boards/all-boards`;
const API_MOVE_TEAM = `${API_BASE}/api/boards/move-team`;

const AllBoardsView = () => {
  const [boards, setBoards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMove, setLoadingMove] = useState(false);
  const [error, setError] = useState(null);

  // Move-team state
  const [movePanel, setMovePanel] = useState(null);
  // { fromBoardId, teamName, toBoardId, moveDate }

  // -------- Auth / Role --------
  const user = useMemo(() => {
    try {
      const raw =
        localStorage.getItem("user") ||
        localStorage.getItem("loggedInUser") ||
        localStorage.getItem("authUser");
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }, []);

  const isAdmin = user?.role === "admin";

  // -------- Load boards --------
  const fetchBoards = async () => {
    try {
      setLoading(true);
      setError(null);

      const res = await axios.get(API_ALL_BOARDS);
      // Expecting something like:
      // [
      //   {
      //     id,
      //     registration_id,
      //     board_name,
      //     owner_name,
      //     owner_email,
      //     registration_date,
      //     teams: [
      //       { id / team_id, team_name, joined_at, left_at }
      //     ]
      //   }
      // ]
      const data = Array.isArray(res.data?.boards) ? res.data.boards : res.data;
      setBoards(data || []);
    } catch (err) {
      console.error("Failed to load boards:", err);
      setError("Failed to load boards. Please try again.");
      toast.error("Failed to load boards.", { autoClose: 4000 });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBoards();
  }, []);

  // -------- Move team handlers --------

  const openMovePanel = (boardId, teamName) => {
    if (!isAdmin) {
      toast.info("Only admin users can move teams between boards.");
      return;
    }

    const today = new Date().toISOString().slice(0, 10);

    // Default target board → first board that is not this one
    const fallbackTarget = boards.find((b) => b.id !== boardId || b.board_id !== boardId);
    const targetId =
      fallbackTarget?.id ||
      fallbackTarget?.board_id ||
      null;

    setMovePanel({
      fromBoardId: boardId,
      teamName,
      toBoardId: targetId,
      moveDate: today,
    });
  };

  const closeMovePanel = () => {
    setMovePanel(null);
  };

  const handleMoveFieldChange = (field, value) => {
    setMovePanel((prev) => (prev ? { ...prev, [field]: value } : prev));
  };

  const handleConfirmMove = async () => {
    if (!movePanel) return;

    const { fromBoardId, teamName, toBoardId, moveDate } = movePanel;

    if (!fromBoardId || !teamName || !toBoardId) {
      toast.warning("Please select a target board.", { autoClose: 3000 });
      return;
    }

    if (Number(fromBoardId) === Number(toBoardId)) {
      toast.warning("Target board must be different from current board.", {
        autoClose: 3000,
      });
      return;
    }

    if (!moveDate) {
      toast.warning("Please select a valid move date.", { autoClose: 3000 });
      return;
    }

    try {
      setLoadingMove(true);

      await axios.post(API_MOVE_TEAM, {
        fromBoardId,
        toBoardId,
        teamName,
        moveDate,
      });

      toast.success(
        `Team "${teamName}" moved successfully to new board.`,
        { autoClose: 3500 }
      );

      setMovePanel(null);
      fetchBoards();
    } catch (err) {
      console.error("Move team failed:", err);
      const msg =
        err?.response?.data?.error ||
        err?.message ||
        "Failed to move team. Please try again.";
      toast.error(msg, { autoClose: 5000 });
    } finally {
      setLoadingMove(false);
    }
  };

  // -------- Helpers --------

  const formatDate = (d) => {
    if (!d) return "";
    try {
      const dt = new Date(d);
      if (Number.isNaN(dt.getTime())) return d;
      return dt.toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
    } catch {
      return d;
    }
  };

  const effectiveBoards = useMemo(
    () =>
      boards.map((b) => ({
        id: b.id ?? b.board_id,
        board_id: b.id ?? b.board_id,
        registration_id: b.registration_id,
        board_name: b.board_name,
        owner_name: b.owner_name,
        owner_email: b.owner_email,
        registration_date: b.registration_date,
        teams: Array.isArray(b.teams) ? b.teams : [],
      })),
    [boards]
  );

  // -------- Render --------

  if (loading && !boards.length) {
    return (
      <div className="abv-wrapper">
        <ToastContainer />
        <div className="abv-loading-card">
          <div className="abv-spinner" />
          <p>Loading boards & teams…</p>
        </div>
      </div>
    );
  }

  if (error && !boards.length) {
    return (
      <div className="abv-wrapper">
        <ToastContainer />
        <div className="abv-error-card">
          <p>{error}</p>
          <button className="abv-btn abv-btn-primary" onClick={fetchBoards}>
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="abv-wrapper">
      <ToastContainer />

      <header className="abv-header">
        <h1 className="abv-title">View Boards & Teams</h1>
        <p className="abv-subtitle">
          All registered cricket boards, their core details and teams.{" "}
          {isAdmin ? (
            <span className="abv-role-pill abv-role-admin">
              Admin mode: you can update, delete or move teams between boards.
            </span>
          ) : (
            <span className="abv-role-pill abv-role-viewer">
              Viewer mode: you can view boards & teams (changes disabled).
            </span>
          )}
        </p>
      </header>

      {/* Optional small legend */}
      <div className="abv-legend">
        <span className="abv-legend-chip abv-chip-active">Active Team</span>
        <span className="abv-legend-chip abv-chip-archived">
          Archived / Left Team
        </span>
        {isAdmin && (
          <span className="abv-legend-chip abv-chip-move">
            Move Team → preserves all past matches under old board
          </span>
        )}
      </div>

      {/* Move panel (floating) */}
      {movePanel && (
        <div className="abv-move-overlay">
          <div className="abv-move-card">
            <div className="abv-move-header">
              <h3>Move Team to Another Board</h3>
            </div>
            <div className="abv-move-body">
              <div className="abv-move-row">
                <label>Team Name</label>
                <div className="abv-move-bold">
                  {movePanel.teamName || "-"}
                </div>
              </div>

              <div className="abv-move-row">
                <label>From Board</label>
                <div className="abv-move-bold">
                  {
                    effectiveBoards.find(
                      (b) => Number(b.board_id) === Number(movePanel.fromBoardId)
                    )?.board_name
                  }{" "}
                  (ID: {movePanel.fromBoardId})
                </div>
              </div>

              <div className="abv-move-row">
                <label htmlFor="move-to-board">Move To Board</label>
                <select
                  id="move-to-board"
                  className="abv-input"
                  value={movePanel.toBoardId || ""}
                  onChange={(e) =>
                    handleMoveFieldChange("toBoardId", Number(e.target.value))
                  }
                >
                  <option value="">-- Select board --</option>
                  {effectiveBoards
                    .filter(
                      (b) => Number(b.board_id) !== Number(movePanel.fromBoardId)
                    )
                    .map((b) => (
                      <option key={b.board_id} value={b.board_id}>
                        {b.board_name} (ID: {b.board_id})
                      </option>
                    ))}
                </select>
              </div>

              <div className="abv-move-row">
                <label htmlFor="move-date">Effective Move Date</label>
                <input
                  id="move-date"
                  type="date"
                  className="abv-input"
                  value={movePanel.moveDate || ""}
                  onChange={(e) =>
                    handleMoveFieldChange("moveDate", e.target.value)
                  }
                />
                <small className="abv-hint">
                  Old board membership will be closed on this date, and new board
                  membership will start from this date. All historical matches
                  before this date stay with the old board.
                </small>
              </div>
            </div>

            <div className="abv-move-footer">
              <button
                className="abv-btn abv-btn-ghost"
                onClick={closeMovePanel}
                disabled={loadingMove}
              >
                Cancel
              </button>
              <button
                className="abv-btn abv-btn-primary"
                onClick={handleConfirmMove}
                disabled={loadingMove}
              >
                {loadingMove ? "Moving…" : "Confirm Move"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Boards grid */}
      <div className="abv-grid">
        {effectiveBoards.map((board) => {
          const teams = board.teams || [];

          return (
            <div
              key={board.board_id}
              className="abv-board-card"
            >
              <div className="abv-board-header">
                <div>
                  <h2 className="abv-board-name">
                    {board.board_name}
                  </h2>
                  <div className="abv-board-meta">
                    <span className="abv-badge">
                      Reg ID: {board.registration_id || "—"}
                    </span>
                    {board.registration_date && (
                      <span className="abv-badge">
                        Since {formatDate(board.registration_date)}
                      </span>
                    )}
                  </div>
                </div>
                <div className="abv-owner-block">
                  <div className="abv-owner-name">
                    Owner: {board.owner_name || "—"}
                  </div>
                  <div className="abv-owner-email">
                    {board.owner_email || ""}
                  </div>
                </div>
              </div>

              {/* Team list */}
              {teams.length === 0 ? (
                <div className="abv-no-teams">
                  No teams registered yet for this board.
                </div>
              ) : (
                <div className="abv-team-table-wrapper">
                  <table className="abv-team-table">
                    <thead>
                      <tr>
                        <th>#</th>
                        <th>Team Name</th>
                        <th>Joined</th>
                        <th>Left</th>
                        {isAdmin && <th>Actions</th>}
                      </tr>
                    </thead>
                    <tbody>
                      {teams.map((team, idx) => {
                        const tid = team.team_id ?? team.id ?? `${board.board_id}-${idx}`;
                        const isArchived = !!team.left_at;

                        return (
                          <tr
                            key={tid}
                            className={
                              isArchived ? "abv-row-archived" : "abv-row-active"
                            }
                          >
                            <td>{idx + 1}</td>
                            <td>{team.team_name}</td>
                            <td>{formatDate(team.joined_at)}</td>
                            <td>{team.left_at ? formatDate(team.left_at) : "—"}</td>

                            {isAdmin && (
                              <td className="abv-actions-cell">
                                {/* Existing admin actions (edit/delete) can stay here if you had them earlier */}
                                <button
                                  className="abv-btn abv-btn-move"
                                  type="button"
                                  onClick={() =>
                                    openMovePanel(board.board_id, team.team_name)
                                  }
                                >
                                  Move
                                </button>
                              </td>
                            )}
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          );
        })}

        {effectiveBoards.length === 0 && !loading && (
          <div className="abv-empty-state">
            <p>No boards found. Please register a board first.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AllBoardsView;
