import React, { useEffect, useState } from "react";
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

  const handleMap = async () => {
    if (!selectedUser || !selectedBoard) {
      setErr("Please select both user and board.");
      return;
    }

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
      <div className="ubm-card">
        <div className="ubm-header">
          <div>
            <h2>User Board Mapping</h2>
            <p>Map newly registered users with their created boards safely.</p>
          </div>
          <button onClick={loadPending} disabled={loading}>
            Refresh
          </button>
        </div>

        {err && <div className="ubm-error">{err}</div>}
        {msg && <div className="ubm-success">{msg}</div>}

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

        <button className="ubm-map-btn" onClick={handleMap} disabled={loading}>
          {loading ? "Processing..." : "Map User With Board"}
        </button>

        <div className="ubm-section">
          <h4>Pending Users: {users.length}</h4>
          <div className="ubm-table-wrap">
            <table>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Name</th>
                  <th>Email</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id}>
                    <td>{u.id}</td>
                    <td>{u.first_name} {u.last_name}</td>
                    <td>{u.email}</td>
                  </tr>
                ))}
                {users.length === 0 && (
                  <tr>
                    <td colSpan="3">No pending users.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="ubm-section">
          <h4>Pending Boards: {boards.length}</h4>
          <div className="ubm-table-wrap">
            <table>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Board</th>
                  <th>Owner</th>
                  <th>Email</th>
                </tr>
              </thead>
              <tbody>
                {boards.map((b) => (
                  <tr key={b.id}>
                    <td>{b.id}</td>
                    <td>{b.board_name}</td>
                    <td>{b.owner_name}</td>
                    <td>{b.owner_email}</td>
                  </tr>
                ))}
                {boards.length === 0 && (
                  <tr>
                    <td colSpan="4">No pending boards.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}