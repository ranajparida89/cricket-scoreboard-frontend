import React, { useEffect, useMemo, useState } from "react";
import "./UserBoardMapping.css";

const API = "https://cricket-scoreboard-backend.onrender.com/api";

function authHeader() {
  const token = localStorage.getItem("admin_jwt");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export default function UserBoardMapping() {
  const [users, setUsers] = useState([]);
  const [boards, setBoards] = useState([]);
  const [selectedUser, setSelectedUser] = useState("");
  const [selectedBoard, setSelectedBoard] = useState("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");
  const [showUsers, setShowUsers] = useState(false);
  const [showBoards, setShowBoards] = useState(false);
  const [userSearch, setUserSearch] = useState("");
  const [boardSearch, setBoardSearch] = useState("");

  const loadPending = async () => {
    setLoading(true);
    setErr("");
    setMsg("");

    try {
      const res = await fetch(`${API}/user-board-map/pending`, {
        headers: {
          ...authHeader(),
          "Content-Type": "application/json",
        },
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to load pending mappings");
      }

      setUsers(data.users || []);
      setBoards(data.boards || []);
    } catch (e) {
      setErr(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPending();
  }, []);

  const filteredUsers = useMemo(() => {
    const q = userSearch.toLowerCase().trim();
    if (!q) return users;

    return users.filter((u) =>
      `${u.id} ${u.first_name} ${u.last_name} ${u.email}`
        .toLowerCase()
        .includes(q)
    );
  }, [users, userSearch]);

  const filteredBoards = useMemo(() => {
    const q = boardSearch.toLowerCase().trim();
    if (!q) return boards;

    return boards.filter((b) =>
      `${b.id} ${b.board_name} ${b.owner_name} ${b.owner_email}`
        .toLowerCase()
        .includes(q)
    );
  }, [boards, boardSearch]);

  const selectedUserObj = users.find((u) => String(u.id) === String(selectedUser));
  const selectedBoardObj = boards.find((b) => String(b.id) === String(selectedBoard));

  const handleMap = async () => {
    if (!selectedUser || !selectedBoard) {
      setErr("Please select both user and board.");
      return;
    }

    const confirmMap = window.confirm(
      `Confirm mapping?\n\nUser: ${selectedUserObj?.first_name || ""} ${selectedUserObj?.last_name || ""}\nEmail: ${selectedUserObj?.email || ""}\n\nBoard: ${selectedBoardObj?.board_name || ""}\nOwner: ${selectedBoardObj?.owner_name || ""}`
    );

    if (!confirmMap) return;

    setLoading(true);
    setErr("");
    setMsg("");

    try {
      const res = await fetch(`${API}/user-board-map/map`, {
        method: "POST",
        headers: {
          ...authHeader(),
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          user_id: Number(selectedUser),
          board_id: Number(selectedBoard),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Mapping failed");
      }

      setMsg(data.message || "Mapped successfully");
      setSelectedUser("");
      setSelectedBoard("");
      await loadPending();
    } catch (e) {
      setErr(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="ubm-page">
      <div className="ubm-hero">
        <div>
          <div className="ubm-kicker">Admin Utility</div>
          <h1>User Board Mapping</h1>
          <p>
            Safely connect registered users with their board records without using SQL or pgAdmin.
          </p>
        </div>

        <button className="ubm-refresh" onClick={loadPending} disabled={loading}>
          {loading ? "Refreshing..." : "↻ Refresh"}
        </button>
      </div>

      {err && <div className="ubm-alert ubm-alert-error">⚠️ {err}</div>}
      {msg && <div className="ubm-alert ubm-alert-success">✅ {msg}</div>}

      <div className="ubm-stat-grid">
        <button
          className={`ubm-stat-card ${showUsers ? "active" : ""}`}
          onClick={() => setShowUsers((v) => !v)}
        >
          <div className="ubm-stat-icon">👤</div>
          <div>
            <span>Pending Users</span>
            <strong>{users.length}</strong>
            <small>Click to {showUsers ? "hide" : "view"} details</small>
          </div>
        </button>

        <button
          className={`ubm-stat-card ${showBoards ? "active" : ""}`}
          onClick={() => setShowBoards((v) => !v)}
        >
          <div className="ubm-stat-icon">🏏</div>
          <div>
            <span>Pending Boards</span>
            <strong>{boards.length}</strong>
            <small>Click to {showBoards ? "hide" : "view"} details</small>
          </div>
        </button>
      </div>

      <div className="ubm-map-panel">
        <h3>Quick Mapping</h3>

        <div className="ubm-grid">
          <div>
            <label>Select User</label>
            <select
              value={selectedUser}
              onChange={(e) => setSelectedUser(e.target.value)}
            >
              <option value="">-- Select unmapped user --</option>
              {users.map((u) => (
                <option key={u.id} value={u.id}>
                  #{u.id} - {u.first_name} {u.last_name} ({u.email})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label>Select Board</label>
            <select
              value={selectedBoard}
              onChange={(e) => setSelectedBoard(e.target.value)}
            >
              <option value="">-- Select unmapped board --</option>
              {boards.map((b) => (
                <option key={b.id} value={b.id}>
                  #{b.id} - {b.board_name} / {b.owner_name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {(selectedUserObj || selectedBoardObj) && (
          <div className="ubm-preview">
            <div>
              <span>User</span>
              <b>
                {selectedUserObj
                  ? `${selectedUserObj.first_name} ${selectedUserObj.last_name}`
                  : "Not selected"}
              </b>
              <small>{selectedUserObj?.email || "-"}</small>
            </div>

            <div className="ubm-arrow">→</div>

            <div>
              <span>Board</span>
              <b>{selectedBoardObj?.board_name || "Not selected"}</b>
              <small>{selectedBoardObj?.owner_name || "-"}</small>
            </div>
          </div>
        )}

        <button className="ubm-map-btn" onClick={handleMap} disabled={loading}>
          {loading ? "Processing..." : "Map User With Board"}
        </button>
      </div>

      {showUsers && (
        <div className="ubm-collapse-card">
          <div className="ubm-table-head">
            <div>
              <h3>Pending Users</h3>
              <p>Users who are registered but not linked to any board.</p>
            </div>
            <input
              value={userSearch}
              onChange={(e) => setUserSearch(e.target.value)}
              placeholder="Search user..."
            />
          </div>

          <div className="ubm-table-wrap">
            <table className="ubm-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((u) => (
                  <tr
                    key={u.id}
                    onClick={() => setSelectedUser(String(u.id))}
                    className={String(selectedUser) === String(u.id) ? "selected" : ""}
                  >
                    <td>#{u.id}</td>
                    <td>{u.first_name} {u.last_name}</td>
                    <td>{u.email}</td>
                    <td><span className="ubm-pill danger">Unmapped</span></td>
                  </tr>
                ))}
                {filteredUsers.length === 0 && (
                  <tr>
                    <td colSpan="4" className="ubm-empty">No pending users found.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {showBoards && (
        <div className="ubm-collapse-card">
          <div className="ubm-table-head">
            <div>
              <h3>Pending Boards</h3>
              <p>Boards created but not linked to a registered user.</p>
            </div>
            <input
              value={boardSearch}
              onChange={(e) => setBoardSearch(e.target.value)}
              placeholder="Search board..."
            />
          </div>

          <div className="ubm-table-wrap">
            <table className="ubm-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Board</th>
                  <th>Owner</th>
                  <th>Email</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredBoards.map((b) => (
                  <tr
                    key={b.id}
                    onClick={() => setSelectedBoard(String(b.id))}
                    className={String(selectedBoard) === String(b.id) ? "selected" : ""}
                  >
                    <td>#{b.id}</td>
                    <td>{b.board_name}</td>
                    <td>{b.owner_name}</td>
                    <td>{b.owner_email}</td>
                    <td><span className="ubm-pill warn">No User</span></td>
                  </tr>
                ))}
                {filteredBoards.length === 0 && (
                  <tr>
                    <td colSpan="5" className="ubm-empty">No pending boards found.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}