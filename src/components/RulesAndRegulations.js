import React, { useEffect, useState } from "react";
import axios from "axios";
import "./Rules.css";

const API_BASE = "https://cricket-scoreboard-backend.onrender.com";

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

  /* ======================
     LOAD RULES
  ====================== */
  const loadRules = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API_BASE}/api/rules`);
      setRules(res.data);
    } catch (err) {
      setError("Failed to load rules");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRules();
  }, []);

  /* ======================
     VALIDATIONS
  ====================== */
  const validateForm = () => {
    if (!form.rule_number) return "Rule number is required";
    if (!form.title.trim()) return "Title is required";
    if (!form.description.trim()) return "Description is required";
    if (!form.category.trim()) return "Category is required";
    if (!form.format) return "Format is required";

    if (
      !isEdit &&
      rules.some(r => r.rule_number === Number(form.rule_number))
    ) {
      return "Rule number already exists";
    }

    if (isEdit && !form.admin_comment.trim()) {
      return "Admin comment is mandatory while updating a rule";
    }

    return null;
  };

  /* ======================
     SAVE (ADD / UPDATE)
  ====================== */
  const handleSave = async () => {
    const validationError = validateForm();
    if (validationError) {
      alert(validationError);
      return;
    }

    try {
   const authHeader = {
  headers: {
    Authorization: `Bearer ${localStorage.getItem("token")}`
  }
};

if (isEdit) {
  await axios.put(
    `${API_BASE}/api/rules/${editingId}`,
    form,
    authHeader
  );
} else {
  await axios.post(
    `${API_BASE}/api/rules`,
    form,
    authHeader
  );
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

  /* ======================
     EDIT MODE
  ====================== */
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

  /* ======================
     FILTER RULES
  ====================== */
  const odiT20Rules = rules.filter(
    r => r.format === "ODI" || r.format === "T20" || r.format === "ALL"
  );

  const testRules = rules.filter(
    r => r.format === "TEST" || r.format === "ALL"
  );

  /* ======================
     RENDER RULE
  ====================== */
  const renderRule = (rule) => (
    <div
      key={rule.id}
      className={`rule-card ${rule.rule_status?.toLowerCase()}`}
    >
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
        <button
          className="edit-btn"
          onClick={() => handleEdit(rule)}
        >
          ✏️ Edit
        </button>
      )}
    </div>
  );

  /* ======================
     UI
  ====================== */
  return (
    <div className="rules-container">
      <h1 className="rules-title">CrickEdge – Rules & Regulations</h1>

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
            onChange={e =>
              setForm({ ...form, rule_number: e.target.value })
            }
            disabled={isEdit}
          />

          <input
            type="text"
            placeholder="Title"
            value={form.title}
            onChange={e => setForm({ ...form, title: e.target.value })}
          />

          <textarea
            placeholder="Description"
            value={form.description}
            onChange={e =>
              setForm({ ...form, description: e.target.value })
            }
          />

          <input
            type="text"
            placeholder="Category (Batting/Bowling/etc)"
            value={form.category}
            onChange={e =>
              setForm({ ...form, category: e.target.value })
            }
          />

          <select
            value={form.format}
            onChange={e => setForm({ ...form, format: e.target.value })}
          >
            <option value="ODI">ODI / T20</option>
            <option value="TEST">Test</option>
            <option value="ALL">All Formats</option>
          </select>

          <label>
            <input
              type="checkbox"
              checked={form.is_mandatory}
              onChange={e =>
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
            onChange={e =>
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
