// src/components/Admin/ManageAdmins.jsx
// 01-JULY-2025 RANAJ PARIDA - Fully converted to CSS classNames only

import React, { useEffect, useState } from "react";
import "./ManageAdmins.css";

// ---- Modal Components (Add/Edit, Delete) ----
function AdminModal({ open, mode, initialData, onSave, onClose, loading }) {
  const [form, setForm] = useState({
    username: "",
    email: "",
    password: "",
    full_name: "",
    is_super_admin: false,
    ...initialData,
  });
  const [error, setError] = useState("");

  useEffect(() => {
    setForm({
      username: "",
      email: "",
      password: "",
      full_name: "",
      is_super_admin: false,
      ...initialData,
    });
    setError("");
  }, [open, initialData]);

  function handleChange(e) {
    const { name, value, type, checked } = e.target;
    setForm(f => ({
      ...f,
      [name]: type === "checkbox" ? checked : value,
    }));
  }

  function validate() {
    if (!form.username.trim() || !form.email.trim() || !form.full_name.trim())
      return "All fields except password are required.";
    if (mode === "add" && !form.password.trim())
      return "Password is required for new admin.";
    if (form.password && form.password.length > 0 && form.password.length < 6)
      return "Password should be at least 6 characters.";
    if (!/^[^@]+@[^@]+\.[^@]+$/.test(form.email))
      return "Invalid email address.";
    return "";
  }

  function handleSubmit(e) {
    e.preventDefault();
    const err = validate();
    if (err) return setError(err);
    setError("");
    onSave({ ...form });
  }

  if (!open) return null;
  return (
    <div className="manage-modal-bg">
      <div className="manage-modal-card">
        <h2 className="manage-modal-title">
          {mode === "add" ? "Add New Admin" : "Edit Admin"}
        </h2>
        <form onSubmit={handleSubmit} className="manage-modal-form">
          <input
            className="manage-modal-input"
            placeholder="Username"
            name="username"
            autoComplete="off"
            disabled={mode === "edit"}
            value={form.username}
            onChange={handleChange}
            required
          />
          <input
            className="manage-modal-input"
            placeholder="Email"
            name="email"
            autoComplete="off"
            value={form.email}
            onChange={handleChange}
            required
          />
          <input
            className="manage-modal-input"
            placeholder={mode === "add" ? "Password" : "Change Password (leave blank to keep old)"}
            name="password"
            autoComplete="new-password"
            type="password"
            value={form.password}
            onChange={handleChange}
            minLength={mode === "add" ? 6 : 0}
          />
          <input
            className="manage-modal-input"
            placeholder="Full Name"
            name="full_name"
            autoComplete="off"
            value={form.full_name}
            onChange={handleChange}
            required
          />
          <label className="manage-modal-checklabel">
            <input
              type="checkbox"
              name="is_super_admin"
              checked={!!form.is_super_admin}
              onChange={handleChange}
            />
            Super Admin
          </label>
          {error && <div className="manage-modal-error">{error}</div>}
          <div className="manage-modal-actions">
            <button
              type="submit"
              className="manage-btn save-btn"
              disabled={loading}
            >
              {loading ? "Saving..." : "Save"}
            </button>
            <button
              type="button"
              className="manage-btn cancel-btn"
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function DeleteModal({ open, admin, onDelete, onClose, loading }) {
  if (!open || !admin) return null;
  return (
    <div className="manage-modal-bg">
      <div className="manage-modal-card">
        <h3 className="manage-modal-title delete">Delete Admin?</h3>
        <div className="manage-modal-confirm">
          Are you sure you want to delete admin <b>{admin.username}</b>?
        </div>
        <div className="manage-modal-actions">
          <button
            className="manage-btn delete-btn"
            onClick={onDelete}
            disabled={loading}
          >
            {loading ? "Deleting..." : "Delete"}
          </button>
          <button
            className="manage-btn cancel-btn"
            onClick={onClose}
            disabled={loading}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

// ---- Main Component ----
export default function ManageAdmins() {
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [modal, setModal] = useState({ open: false, mode: "add", data: null });
  const [deleteModal, setDeleteModal] = useState({ open: false, admin: null });
  const [actionLoading, setActionLoading] = useState(false);

  // Fetch admins
  useEffect(() => {
    setLoading(true);
    fetch("https://cricket-scoreboard-backend.onrender.com/api/admin/list")
      .then(r => r.json())
      .then(data => {
        setAdmins(data.admins || []);
        setLoading(false);
      })
      .catch(() => {
        setErr("Failed to load admins.");
        setLoading(false);
      });
  }, []);

  // Add/Edit admin
  async function handleSave(form) {
    setActionLoading(true);
    setErr("");
    const url =
      modal.mode === "add"
        ? "https://cricket-scoreboard-backend.onrender.com/api/admin/create"
        : `https://cricket-scoreboard-backend.onrender.com/api/admin/update/${modal.data.id}`;
    const method = modal.mode === "add" ? "POST" : "PUT";
    try {
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || "Failed to save admin");
      // Refetch admins
      setModal({ open: false, mode: "add", data: null });
      setActionLoading(false);
      setLoading(true);
      fetch("https://cricket-scoreboard-backend.onrender.com/api/admin/list")
        .then(r => r.json())
        .then(data => setAdmins(data.admins || []));
    } catch (e) {
      setErr(e.message || "Failed to save admin");
      setActionLoading(false);
    }
  }

  // Delete admin
  async function handleDelete() {
    setActionLoading(true);
    try {
      const res = await fetch(
        `https://cricket-scoreboard-backend.onrender.com/api/admin/delete/${deleteModal.admin.id}`,
        { method: "DELETE" }
      );
      const data = await res.json();
      if (!data.success) throw new Error(data.error || "Failed to delete admin");
      setAdmins(admins.filter(a => a.id !== deleteModal.admin.id));
      setDeleteModal({ open: false, admin: null });
      setActionLoading(false);
    } catch (e) {
      setErr(e.message || "Failed to delete admin");
      setActionLoading(false);
    }
  }

  return (
    <div className="manage-admins-bg">
      <div className="manage-admins-glass">
        <h1 className="manage-admins-title">
          Manage Admins
        </h1>
        <button
          className="manage-btn add-btn"
          onClick={() => setModal({ open: true, mode: "add", data: null })}
        >
          + Add Admin
        </button>

        {loading ? (
          <div className="manage-loading">Loading admins...</div>
        ) : err ? (
          <div className="manage-error">{err}</div>
        ) : (
          <div className="manage-table-scroll">
            <table className="manage-admins-table">
              <thead>
                <tr>
                  <th>Username</th>
                  <th>Email</th>
                  <th>Full Name</th>
                  <th>Super Admin</th>
                  <th>Created</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {admins.map(a => (
                  <tr key={a.id}>
                    <td>{a.username}</td>
                    <td>{a.email}</td>
                    <td>{a.full_name}</td>
                    <td style={{ textAlign: "center" }}>
                      {a.is_super_admin ? (
                        <span className="manage-super-yes">Yes</span>
                      ) : (
                        <span className="manage-super-no">No</span>
                      )}
                    </td>
                    <td style={{ textAlign: "center" }}>
                      {new Date(a.created_at).toLocaleDateString()}
                    </td>
                    <td style={{ textAlign: "center" }}>
                      <button
                        className="manage-btn edit-btn"
                        onClick={() => setModal({ open: true, mode: "edit", data: a })}
                      >
                        Edit
                      </button>
                      <button
                        className="manage-btn delete-btn"
                        onClick={() => setDeleteModal({ open: true, admin: a })}
                        disabled={admins.length < 2}
                        title={admins.length < 2 ? "At least one admin must exist." : ""}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
                {admins.length === 0 && (
                  <tr>
                    <td colSpan={6} style={{ textAlign: "center", padding: "2em", color: "#bbccdd" }}>
                      No admins found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
        {/* Modals */}
        <AdminModal
          open={modal.open}
          mode={modal.mode}
          initialData={modal.data}
          onSave={handleSave}
          onClose={() => setModal({ open: false, mode: "add", data: null })}
          loading={actionLoading}
        />
        <DeleteModal
          open={deleteModal.open}
          admin={deleteModal.admin}
          onDelete={handleDelete}
          onClose={() => setDeleteModal({ open: false, admin: null })}
          loading={actionLoading}
        />
      </div>
    </div>
  );
}
