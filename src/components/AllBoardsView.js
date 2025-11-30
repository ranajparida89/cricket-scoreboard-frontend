// src/components/AllBoardsView.js
// View + manage boards & teams (move team, remove team, active/archived toggle)

import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "./AllBoardsView.css";
import { useAuth } from "../services/auth";

const API_BASE = "https://cricket-scoreboard-backend.onrender.com";

const API_ALL_BOARDS = `${API_BASE}/api/boards/all-boards`;
const API_MOVE_TEAM = `${API_BASE}/api/boards/move-team`;
const API_REMOVE_TEAM = `${API_BASE}/api/boards/remove-team`;

/* ---------------- helpers: role / email detection ---------------- */

// hard-coded admin email so you always get admin powers
const ADMIN_EMAILS = ["ranajparida89@gmail.com"];

// ---- helper to derive role from different shapes of user object ----
const getRoleFromUser = (u) => {
  if (!u) return null;

  const possibleRole =
    u.role ??
    u.userRole ??
    u.user_role ??
    u.type ??
    u.userType ??
    u.accessRole;

  if (possibleRole) return String(possibleRole).toLowerCase();

  if (u.user) {
    const nestedRole =
      u.user.role ??
      u.user.userRole ??
      u.user.user_role ??
      u.user.type ??
      u.user.userType ??
      u.user.accessRole;
    if (nestedRole) return String(nestedRole).toLowerCase();
  }

  return null;
};

// try to extract an email from various possible shapes
const getEmailFromUser = (u) => {
  if (!u) return null;

  const direct =
    u.email ??
    u.user_email ??
    u.username ??
    u.userName ??
    u.login ??
    u.loginId;

  if (direct) return String(direct);

  if (u.user) {
    const nested =
      u.user.email ??
      u.user.user_email ??
      u.user.username ??
      u.user.userName ??
      u.user.login ??
      u.user.loginId;
    if (nested) return String(nested);
  }

  return null;
};

// ---- helper: safely get the teams array from board ----
const getTeamsFromBoard = (b) => {
  if (!b) return [];
  if (Array.isArray(b.teams)) return b.teams;
  if (Array.isArray(b.boardTeams)) return b.boardTeams;
  if (Array.isArray(b.board_teams)) return b.board_teams;
  if (Array.isArray(b.teams_with_history)) return b.teams_with_history;
  return [];
};

const AllBoardsView = () => {
  const [boards, setBoards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMove, setLoadingMove] = useState(false);
  const [error, setError] = useState(null);

  // Move-team panel state
  const [movePanel, setMovePanel] = useState(null);

  // Drag context for drag-to-move
  const [dragContext, setDragContext] = useState(null);

  // Filter: "active" | "archived"
  const [teamFilter, setTeamFilter] = useState("active");

  // -------- Auth / Role --------
  const { currentUser } = useAuth();

  const user = useMemo(() => {
    try {
      const raw =
        localStorage.getItem("user") ||
        localStorage.getItem("loggedInUser") ||
        localStorage.getItem("authUser");
      const parsed = raw ? JSON.parse(raw) : null;
      console.log("AllBoardsView: user from localStorage =", parsed);
      return parsed;
    } catch {
      return null;
    }
  }, []);

  const roleFromLocalUser = getRoleFromUser(user);
  const emailFromLocalUser = getEmailFromUser(user);

  // FINAL admin check: any of these being true makes you admin
  const isAdmin =
    currentUser?.role === "admin" || // from auth context (old logic)
    localStorage.getItem("isAdmin") === "true" || // manual flag (old logic)
    (roleFromLocalUser &&
      roleFromLocalUser.toLowerCase() === "admin") || // role in stored user
    (emailFromLocalUser &&
      ADMIN_EMAILS.some(
        (e) => e.toLowerCase() === String(emailFromLocalUser).toLowerCase()
      )); // whitelisted email

  // -------- Load boards --------
  const fetchBoards = async () => {
    try {
      setLoading(true);
      setError(null);

      const res = await axios.get(API_ALL_BOARDS);

      const rawData = Array.isArray(res.data?.boards)
        ? res.data.boards
        : res.data;

      console.log("ALL BOARDS RAW API:", rawData);

      setBoards(rawData || []);
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

  // -------- Move team handlers (panel) --------

  const openMovePanel = (board, teamName) => {
    if (!isAdmin) {
      toast.info("Only admin users can move teams between boards.");
      return;
    }
    if (!board) return;

    const fromRegId = board.registration_id;
    const today = new Date().toISOString().slice(0, 10);

    const fallbackTarget = boards.find(
      (b) => b.registration_id !== fromRegId
    );
    const targetRegId = fallbackTarget?.registration_id || "";

    setMovePanel({
      fromRegId,
      toRegId: targetRegId,
      teamName,
      moveDate: today,
    });
  };

  const closeMovePanel = () => setMovePanel(null);

  const handleMoveFieldChange = (field, value) => {
    setMovePanel((prev) => (prev ? { ...prev, [field]: value } : prev));
  };

  const handleConfirmMove = async () => {
    if (!movePanel) return;

    const { fromRegId, toRegId, teamName, moveDate } = movePanel;

    if (!fromRegId || !teamName || !toRegId) {
      toast.warning("Please select a target board.", { autoClose: 3000 });
      return;
    }

    if (fromRegId === toRegId) {
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
        team_name: teamName,
        from_registration_id: fromRegId,
        to_registration_id: toRegId,
        effective_date: moveDate,
      });

      toast.success(`Team "${teamName}" moved successfully to new board.`, {
        autoClose: 3500,
      });

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

  // -------- Remove team handler --------

  const handleRemoveTeam = async (board, team) => {
    if (!isAdmin) {
      toast.info("Only admin users can remove teams from boards.");
      return;
    }

    const teamName = team?.team_name;
    if (!teamName) return;

    const ok = window.confirm(
      `Remove team "${teamName}" from ${board.board_name}?`
    );
    if (!ok) return;

    try {
      setLoadingMove(true);
      const todayIso = new Date().toISOString().slice(0, 10);

      await axios.post(API_REMOVE_TEAM, {
        registration_id: board.registration_id,
        team_name: teamName,
        effective_date: todayIso,
      });

      toast.success(
        `Team "${teamName}" removed from ${board.board_name} (history preserved).`,
        { autoClose: 3500 }
      );

      await fetchBoards();
    } catch (err) {
      console.error("Remove team failed:", err);
      const msg =
        err?.response?.data?.error ||
        err?.message ||
        "Failed to remove team. Please try again.";
      toast.error(msg, { autoClose: 5000 });
    } finally {
      setLoadingMove(false);
    }
  };

  // -------- Drag handlers (drag-to-move) --------

  const handleDragStart = (e, board, team) => {
    if (!isAdmin || !team || team.left_at) return;
    const fromRegId = board.registration_id;
    const teamName = team.team_name;
    if (!fromRegId || !teamName) return;

    setDragContext({ fromRegId, teamName });

    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", teamName);
  };

  const handleDragEnd = () => setDragContext(null);

  const handleDragOverBoard = (e, board) => {
    if (!dragContext || !isAdmin) return;
    if (String(board.registration_id) === String(dragContext.fromRegId)) return;
    e.preventDefault();
  };

  const handleDropOnBoard = (e, board) => {
    e.preventDefault();
    if (!dragContext || !isAdmin) return;

    const toRegId = board.registration_id;
    if (String(toRegId) === String(dragContext.fromRegId)) return;

    const today = new Date().toISOString().slice(0, 10);

    setMovePanel({
      fromRegId: dragContext.fromRegId,
      toRegId,
      teamName: dragContext.teamName,
      moveDate: today,
    });

    setDragContext(null);
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
      boards.map((b) => {
        const rawTeams = getTeamsFromBoard(b);

        const normalizedTeams = rawTeams.map((t, idx) => {
          const teamName =
            t.team_name ??
            t.teamName ??
            t.name ??
            t.team ??
            t.team_title ??
            (typeof t === "string" ? t : "");

          const joined =
            t.joined_at ??
            t.joinedAt ??
            t.joined_date ??
            t.joined ??
            t.start_date ??
            t.effective_from ??
            null;

          const left =
            t.left_at ??
            t.leftAt ??
            t.left_date ??
            t.left ??
            t.end_date ??
            t.effective_to ??
            null;

          return {
            id: t.id ?? t.team_id ?? `${b.id ?? b.board_id}-${idx}`,
            team_name: teamName,
            joined_at: joined,
            left_at: left,
          };
        });

        return {
          id: b.id ?? b.board_id,
          board_id: b.id ?? b.board_id,
          registration_id: b.registration_id,
          board_name: b.board_name,
          owner_name: b.owner_name,
          owner_email: b.owner_email,
          registration_date: b.registration_date,
          teams: normalizedTeams,
        };
      }),
    [boards]
  );

  // -------- Render --------

  if (loading && !boards.length) {
    return (
      <div className="abv-wrapper">
        <ToastContainer />
        <div className="abv-loading-card">
          <div className="abv-spinner" />
          <p>Loading boards &amp; teams…</p>
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
        <h1 className="abv-title">View Boards &amp; Teams</h1>
        <p className="abv-subtitle">
          All registered cricket boards, their core details and teams.{" "}
          {isAdmin ? (
            <span className="abv-role-pill abv-role-admin">
              Admin mode: you can delete boards, remove teams, or move teams
              between boards (drag team row or use Move button).
            </span>
          ) : (
            <span className="abv-role-pill abv-role-viewer">
              Viewer mode: you can view boards &amp; teams (changes disabled).
            </span>
          )}
        </p>
      </header>

      {/* Legend & filter */}
      <div className="abv-legend">
        <button
          type="button"
          className={
            "abv-legend-chip" +
            (teamFilter === "active" ? " abv-chip-active" : "")
          }
          onClick={() => setTeamFilter("active")}
        >
          Active Team
        </button>
        <button
          type="button"
          className={
            "abv-legend-chip" +
            (teamFilter === "archived" ? " abv-chip-archived" : "")
          }
          onClick={() => setTeamFilter("archived")}
        >
          Archived / Left Team
        </button>
        {isAdmin && (
          <span className="abv-legend-chip abv-chip-move">
            Drag a team row onto another board OR click Move → preserves all
            past matches under old board
          </span>
        )}
      </div>

      {/* Move panel */}
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
                      (b) =>
                        String(b.registration_id) ===
                        String(movePanel.fromRegId)
                    )?.board_name
                  }{" "}
                  (Reg ID: {movePanel.fromRegId})
                </div>
              </div>

              <div className="abv-move-row">
                <label htmlFor="move-to-board">Move To Board</label>
                <select
                  id="move-to-board"
                  className="abv-input"
                  value={movePanel.toRegId || ""}
                  onChange={(e) =>
                    handleMoveFieldChange("toRegId", e.target.value)
                  }
                >
                  <option value="">-- Select board --</option>
                  {effectiveBoards
                    .filter(
                      (b) =>
                        String(b.registration_id) !==
                        String(movePanel.fromRegId)
                    )
                    .map((b) => (
                      <option
                        key={b.registration_id}
                        value={b.registration_id}
                      >
                        {b.board_name} (Reg ID: {b.registration_id})
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
                  Old board membership will be closed on this date, and new
                  board membership will start from this date. All historical
                  matches before this date stay with the old board.
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

          const visibleTeams = teams.filter((t) => {
            if (teamFilter === "active") return !t.left_at;
            if (teamFilter === "archived") return !!t.left_at;
            return true;
          });

          const isDropTargetActive =
            dragContext &&
            isAdmin &&
            String(board.registration_id) !== String(dragContext.fromRegId);

          const noTeamsMessage =
            teams.length === 0
              ? "No teams registered yet for this board."
              : teamFilter === "active"
              ? "No active teams for this board."
              : "No archived / left teams for this board.";

          return (
            <div
              key={board.board_id}
              className={
                "abv-board-card" +
                (isDropTargetActive ? " abv-board-drop-target" : "")
              }
              onDragOver={(e) => handleDragOverBoard(e, board)}
              onDragEnter={(e) => handleDragOverBoard(e, board)}
              onDrop={(e) => handleDropOnBoard(e, board)}
            >
              <div className="abv-board-header">
                <div>
                  <h2 className="abv-board-name">{board.board_name}</h2>
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

              {visibleTeams.length === 0 ? (
                <div className="abv-no-teams">{noTeamsMessage}</div>
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
                      {visibleTeams.map((team, idx) => {
                        const tid = team.id ?? `${board.board_id}-${idx}`;
                        const isArchived = !!team.left_at;

                        const rowClasses = [
                          isArchived ? "abv-row-archived" : "abv-row-active",
                        ];
                        if (isAdmin && !isArchived) {
                          rowClasses.push("abv-row-draggable");
                        }

                        return (
                          <tr
                            key={tid}
                            className={rowClasses.join(" ")}
                            draggable={isAdmin && !isArchived}
                            onDragStart={(e) =>
                              handleDragStart(e, board, team)
                            }
                            onDragEnd={handleDragEnd}
                          >
                            <td>{idx + 1}</td>
                            <td>{team.team_name}</td>
                            <td>{formatDate(team.joined_at)}</td>
                            <td>
                              {team.left_at ? formatDate(team.left_at) : "—"}
                            </td>

                            {isAdmin && (
                              <td className="abv-actions-cell">
                                {!isArchived && (
                                  <button
                                    className="abv-btn abv-btn-move"
                                    type="button"
                                    onClick={() =>
                                      openMovePanel(board, team.team_name)
                                    }
                                  >
                                    Move
                                  </button>
                                )}
                                <button
                                  className="abv-btn abv-btn-small"
                                  type="button"
                                  onClick={() =>
                                    handleRemoveTeam(board, team)
                                  }
                                >
                                  Remove
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
