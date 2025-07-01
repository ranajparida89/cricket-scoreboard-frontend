// src/components/Admin/ManageAdmins.jsx 01-JULY-2025 RANAJ PARIDA
import React, { useEffect, useState } from "react";

// Glass style helpers (Tailwind + some inline)
const glassCard = "bg-[#192031]/80 backdrop-blur-lg border border-white/20 shadow-2xl rounded-2xl";

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
    <div className="fixed inset-0 z-40 bg-black bg-opacity-40 flex items-center justify-center transition-all">
      <div className={`p-7 min-w-[320px] max-w-[90vw] w-full ${glassCard} relative shadow-2xl`}>
        <h2 className="text-2xl font-extrabold text-teal-300 mb-4 text-center tracking-wide">
          {mode === "add" ? "Add New Admin" : "Edit Admin"}
        </h2>
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <input
            className="rounded-lg px-4 py-2 bg-white/70 text-black shadow"
            placeholder="Username"
            name="username"
            autoComplete="off"
            disabled={mode === "edit"}
            value={form.username}
            onChange={handleChange}
            required
          />
          <input
            className="rounded-lg px-4 py-2 bg-white/70 text-black shadow"
            placeholder="Email"
            name="email"
            autoComplete="off"
            value={form.email}
            onChange={handleChange}
            required
          />
          <input
            className="rounded-lg px-4 py-2 bg-white/70 text-black shadow"
            placeholder={mode === "add" ? "Password" : "Change Password (leave blank to keep old)"}
            name="password"
            autoComplete="new-password"
            type="password"
            value={form.password}
            onChange={handleChange}
            minLength={mode === "add" ? 6 : 0}
          />
          <input
            className="rounded-lg px-4 py-2 bg-white/70 text-black shadow"
            placeholder="Full Name"
            name="full_name"
            autoComplete="off"
            value={form.full_name}
            onChange={handleChange}
            required
          />
          <label className="flex items-center gap-2 mt-2 select-none font-semibold">
            <input
              type="checkbox"
              name="is_super_admin"
              checked={!!form.is_super_admin}
              onChange={handleChange}
            />
            Super Admin
          </label>
          {error && <div className="text-yellow-400 font-medium mt-2">{error}</div>}
          <div className="flex gap-3 mt-3">
            <button
              type="submit"
              className="px-6 py-2 rounded-xl font-bold bg-gradient-to-r from-teal-400 to-cyan-400 text-white shadow"
              disabled={loading}
            >
              {loading ? "Saving..." : "Save"}
            </button>
            <button
              type="button"
              className="px-5 py-2 rounded-xl bg-gray-700 text-white"
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
    <div className="fixed inset-0 z-40 bg-black bg-opacity-40 flex items-center justify-center">
      <div className={`${glassCard} p-7 min-w-[320px] max-w-[90vw]`}>
        <h3 className="text-xl font-extrabold text-rose-400 mb-3 text-center">Delete Admin?</h3>
        <div className="mb-5 text-white text-center">
          Are you sure you want to delete admin <b>{admin.username}</b>?
        </div>
        <div className="flex gap-3 justify-center">
          <button
            className="px-6 py-2 rounded-xl font-bold bg-gradient-to-r from-rose-500 to-rose-700 text-white"
            onClick={onDelete}
            disabled={loading}
          >
            {loading ? "Deleting..." : "Delete"}
          </button>
          <button
            className="px-5 py-2 rounded-xl bg-gray-700 text-white"
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
    <div className="min-h-screen flex flex-col items-center justify-start bg-gradient-to-br from-[#0f172a] to-[#151a2e] pt-16">
      <div className={`${glassCard} p-8 mt-6 w-[97vw] max-w-4xl`}>
        <h1 className="text-3xl font-extrabold text-cyan-200 mb-7 tracking-wide text-center drop-shadow">
          Manage Admins
        </h1>
        <button
          className="mb-5 px-6 py-2 rounded-xl font-bold bg-gradient-to-r from-teal-500 to-cyan-500 text-white shadow"
          onClick={() => setModal({ open: true, mode: "add", data: null })}
        >
          + Add Admin
        </button>
        {loading ? (
          <div className="text-white text-lg text-center py-10">Loading admins...</div>
        ) : err ? (
          <div className="text-red-400 text-center py-8">{err}</div>
        ) : (
          <div className="overflow-x-auto rounded-xl">
            <table className="min-w-full bg-transparent text-white shadow-xl">
              <thead>
                <tr className="bg-white/10 backdrop-blur-lg text-cyan-100">
                  <th className="py-2 px-4 text-left">Username</th>
                  <th className="py-2 px-4 text-left">Email</th>
                  <th className="py-2 px-4 text-left">Full Name</th>
                  <th className="py-2 px-4 text-center">Super Admin</th>
                  <th className="py-2 px-4 text-center">Created</th>
                  <th className="py-2 px-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {admins.map(a => (
                  <tr
                    key={a.id}
                    className="hover:bg-white/10 transition"
                  >
                    <td className="py-2 px-4">{a.username}</td>
                    <td className="py-2 px-4">{a.email}</td>
                    <td className="py-2 px-4">{a.full_name}</td>
                    <td className="py-2 px-4 text-center">
                      {a.is_super_admin ? (
                        <span className="inline-block px-2 py-1 rounded-xl bg-teal-400/20 text-teal-200 font-bold">
                          Yes
                        </span>
                      ) : (
                        <span className="inline-block px-2 py-1 rounded-xl bg-gray-500/30 text-gray-200">No</span>
                      )}
                    </td>
                    <td className="py-2 px-4 text-center">
                      {new Date(a.created_at).toLocaleDateString()}
                    </td>
                    <td className="py-2 px-4 text-center">
                      <button
                        className="px-4 py-1 rounded-lg bg-cyan-600 text-white mr-2"
                        onClick={() =>
                          setModal({
                            open: true,
                            mode: "edit",
                            data: a,
                          })
                        }
                      >
                        Edit
                      </button>
                      <button
                        className="px-4 py-1 rounded-lg bg-rose-600 text-white"
                        onClick={() =>
                          setDeleteModal({
                            open: true,
                            admin: a,
                          })
                        }
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
                    <td colSpan={6} className="text-center py-6 text-white/80">
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
