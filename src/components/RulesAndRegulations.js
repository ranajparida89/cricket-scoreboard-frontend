import React, { useEffect, useState } from "react";
import axios from "axios";
import "./Rules.css";

/* =====================================================
   AXIOS INSTANCE (SAME PATTERN AS BOARD MODULE)
===================================================== */
const api = axios.create({
  baseURL: "https://cricket-scoreboard-backend.onrender.com/api",
  withCredentials: true
});

api.interceptors.request.use((config) => {
  const token =
    localStorage.getItem("token") ||
    localStorage.getItem("authToken") ||
    localStorage.getItem("accessToken");

  if (token) {
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

/* =====================================================
   CONSTANTS
===================================================== */
const EMPTY_RULE = {
  rule_number: "",
  title: "",
  description: "",
  category: "",
  format: "ODI",
  is_mandatory: false,
  admin_comment: ""
};

function RulesAndRegulations({ user }) {
  const [rules, setRules] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [showForm, setShowForm] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [form, setForm] = useState(EMPTY_RULE);
  const [editingId, setEditingId] = useState(null);

  const [searchText, setSearchText] = useState("");
  const [filterKey, setFilterKey] = useState("ALL");

  /* =====================================================
     LOAD RULES
  ===================================================== */
  const loadRules = async () => {
    try {
      setLoading(true);
      const res = await api.get("/rules");
      setRules(res.data || []);
    } catch (err) {
      setError("Failed to load rules");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRules();
  }, []);

  /* =====================================================
     VALIDATION
  ===================================================== */
  const validateForm = () => {
    if (!form.rule_number) return "Rule number is required";
    if (!form.title.trim()) return "Title is required";
    if (!form.description.trim()) return "Description is required";
    if (!form.category.trim()) return "Category is required";
    if (!form.format) return "Format is required";

    if (!isEdit && rules.some(r => r.rule_number === Number(form.rule_number))) {
      return "Rule number already exists";
    }

    if (isEdit && !form.admin_comment.trim()) {
      return "Admin comment is mandatory while updating a rule";
    }

    return null;
  };

  /* =====================================================
     SAVE (ADD / UPDATE)
  ===================================================== */
  const handleSave = async () => {
    const validationError = validateForm();
    if (validationError) {
      alert(validationError);
      return;
    }

    try {
      if (isEdit) {
        await api.put(`/rules/${editingId}`, form);
      } else {
        await api.post("/rules", form);
      }

      setShowForm(false);
      setForm(EMPTY_RULE);
      setIsEdit(false);
      setEditingId(null);
      loadRules();
    } catch (err) {
      alert("Operation failed. Please try again.");
    }
  };

  /* =====================================================
     EDIT MODE
  ===================================================== */
  const handleEdit = (rule) => {
    setForm({
      rule_number: rule.rule_number,
      title: rule.title,
      description: rule.description,
      category: rule.category,
      format: rule.format,
      is_mandatory: rule.is_mandatory,
      admin_comment: ""
    });
    setEditingId(rule.id);
    setIsEdit(true);
    setShowForm(true);
  };

  /* =====================================================
     SEARCH & FILTER
  ===================================================== */
  const applySearchFilter = (rule) => {
    const text = `
      ${rule.rule_number}
      ${rule.title}
      ${rule.description}
      ${rule.category}
    `.toLowerCase();

    const matchesSearch =
      !searchText || text.includes(searchText.toLowerCase());

    const matchesFilter =
      filterKey === "ALL" ||
      (filterKey === "MANDATORY" && rule.is_mandatory) ||
      rule.category?.toUpperCase().includes(filterKey) ||
      rule.title?.toUpperCase().includes(filterKey) ||
      rule.format?.toUpperCase().includes(filterKey);

    return matchesSearch && matchesFilter;
  };

  /* =====================================================
     FORMAT SECTIONS
  ===================================================== */
  const odiT20Rules = rules.filter(
    r =>
      (r.format === "ODI" || r.format === "T20" || r.format === "ALL") &&
      applySearchFilter(r)
  );

  const testRules = rules.filter(
    r =>
      (r.format === "TEST" || r.format === "ALL") &&
      applySearchFilter(r)
  );

  /* =====================================================
     RENDER RULE
  ===================================================== */
  const renderRule = (rule) => (
    <div key={rule.id} className={`rule-card ${rule.rule_status?.toLowerCase()}`}>
      <div className="rule-header">
        <span className="rule-number">Rule {rule.rule_number}</span>
        <span className="rule-title">{rule.title}</span>

        {rule.is_mandatory && <span className="badge mandatory">MANDATORY</span>}
        {rule.rule_status === "NEW" && <span className="badge new">NEW</span>}
        {rule.rule_status === "UPDATED" && (
          <span className="badge updated">UPDATED</span>
        )}
      </div>

      <div className="rule-description">{rule.description}</div>

      {user?.role === "admin" && rule.admin_comment && (
        <div className="admin-comment">
          <strong>Admin Note:</strong> {rule.admin_comment}
        </div>
      )}

      {user?.role === "admin" && (
        <button className="edit-btn" onClick={() => handleEdit(rule)}>
          ✏️ Edit
        </button>
      )}
    </div>
  );

  /* =====================================================
     UI
  ===================================================== */
  return (
    <div className="rules-container">
      <h1 className="rules-title">CrickEdge – Rules & Regulations</h1>

      <div className="rules-toolbar">
        <input
          type="text"
          className="rules-search"
          placeholder="🔍 Search by rule number, keyword, text..."
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
        />

        <select
          className="rules-filter"
          value={filterKey}
          onChange={(e) => setFilterKey(e.target.value)}
        >
          <option value="ALL">All Rules</option>
          <option value="MANDATORY">Mandatory</option>
          <option value="BOWLING">Bowling</option>
          <option value="BATTING">Batting</option>
          <option value="FIELDING">Fielding</option>
          <option value="PENALTY">Penalty</option>
          <option value="CUSTOM">Custom Player</option>
          <option value="TEST">Test</option>
          <option value="ODI">ODI / T20</option>
        </select>
      </div>

      {user?.role === "admin" && (
        <button className="add-btn" onClick={() => setShowForm(true)}>
          ➕ Add Rule
        </button>
      )}

      {showForm && (
        <div className="rule-form">
          <h3>{isEdit ? "Edit Rule" : "Add New Rule"}</h3>

          <input
            type="number"
            placeholder="Rule Number"
            value={form.rule_number}
            onChange={(e) =>
              setForm({ ...form, rule_number: e.target.value })
            }
            disabled={isEdit}
          />

          <input
            type="text"
            placeholder="Title"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
          />

          <textarea
            placeholder="Description"
            value={form.description}
            onChange={(e) =>
              setForm({ ...form, description: e.target.value })
            }
          />

          <input
            type="text"
            placeholder="Category"
            value={form.category}
            onChange={(e) =>
              setForm({ ...form, category: e.target.value })
            }
          />

          <select
            value={form.format}
            onChange={(e) =>
              setForm({ ...form, format: e.target.value })
            }
          >
            <option value="ODI">ODI / T20</option>
            <option value="TEST">Test</option>
            <option value="ALL">All Formats</option>
          </select>

          <label>
            <input
              type="checkbox"
              checked={form.is_mandatory}
              onChange={(e) =>
                setForm({ ...form, is_mandatory: e.target.checked })
              }
            />
            Mandatory
          </label>

          <textarea
            placeholder={
              isEdit
                ? "Admin comment (mandatory for update)"
                : "Admin comment"
            }
            value={form.admin_comment}
            onChange={(e) =>
              setForm({ ...form, admin_comment: e.target.value })
            }
          />

          <div className="form-actions">
            <button onClick={handleSave}>Save</button>
            <button
              className="cancel"
              onClick={() => {
                setShowForm(false);
                setIsEdit(false);
                setForm(EMPTY_RULE);
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      <section className="rules-section">
        <h2 className="section-title">📘 ODI / T20 Rules</h2>
        {odiT20Rules.map(renderRule)}
      </section>

      <section className="rules-section">
        <h2 className="section-title">📕 Test Match Rules</h2>
        {testRules.map(renderRule)}
      </section>

      {loading && <p>Loading rules...</p>}
      {error && <p className="error">{error}</p>}
    </div>
  );
}

export default RulesAndRegulations;
