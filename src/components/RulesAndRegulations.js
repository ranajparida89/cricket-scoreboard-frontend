import React, { useEffect, useState } from "react";
import axios from "axios";
import "./Rules.css";

import afterPowerPlay1 from "../assets/image 1.jpg";
import afterPowerPlay2 from "../assets/2.jpg";
import afterPowerPlay3 from "../assets/3.jpg";
import afterPowerPlay4 from "../assets/4.jpg";
import afterPowerPlay5 from "../assets/5.jpg";
import fieldingDescription from "../assets/how to put desc.jpg";
import restrictedPoints from "../assets/don't touch those points.jpg";
import beforePowerPlay from "../assets/before pp.jpeg";
import teamTemplate from "../assets/team template.jpg";

const api = axios.create({
  baseURL: "https://cricket-scoreboard-backend.onrender.com/api",
  withCredentials: true
});

api.interceptors.request.use((config) => {
  const token =
    localStorage.getItem("admin_jwt") ||
    localStorage.getItem("token") ||
    localStorage.getItem("authToken") ||
    localStorage.getItem("accessToken");

  if (token) {
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

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

  const validateForm = () => {
    if (!form.rule_number) return "Rule number is required";
    if (!form.title.trim()) return "Title is required";
    if (!form.description.trim()) return "Description is required";
    if (!form.category.trim()) return "Category is required";
    if (!form.format) return "Format is required";

    if (!isEdit && rules.some((r) => r.rule_number === Number(form.rule_number))) {
      return "Rule number already exists";
    }

    if (isEdit && !form.admin_comment.trim()) {
      return "Admin comment is mandatory while updating a rule";
    }

    return null;
  };

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
      console.error("API error:", err?.response || err);
      alert("Operation failed. Please try again.");
    }
  };

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

  const handleDelete = async (ruleId) => {
    const ok = window.confirm(
      "Are you sure you want to delete this rule?\nThis action cannot be undone."
    );

    if (!ok) return;

    try {
      await api.delete(`/rules/${ruleId}`);
      alert("Rule deleted successfully");
      loadRules();
    } catch (err) {
      console.error("Delete rule failed:", err?.response || err);
      alert("Failed to delete rule");
    }
  };

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

  const odiT20Rules = rules.filter(
    (r) =>
      (r.format === "ODI" || r.format === "T20" || r.format === "ALL") &&
      applySearchFilter(r)
  );

  const testRules = rules.filter(
    (r) =>
      (r.format === "TEST" || r.format === "ALL") &&
      applySearchFilter(r)
  );

  const highlightText = (text, search) => {
    if (!search || !text) return text;

    const regex = new RegExp(`(${search})`, "gi");
    const parts = text.split(regex);

    return parts.map((part, index) =>
      part.toLowerCase() === search.toLowerCase() ? (
        <span key={index} className="highlight">
          {part}
        </span>
      ) : (
        part
      )
    );
  };

  const renderRule = (rule) => (
    <div key={rule.id} className={`rule-card ${rule.rule_status?.toLowerCase()}`}>
      <div className="rule-header">
        <span className="rule-number">Rule {rule.rule_number}</span>
        <span className="rule-title">
          {highlightText(rule.title, searchText)}
        </span>

        {rule.is_mandatory && <span className="badge mandatory">MANDATORY</span>}
        {rule.rule_status === "NEW" && <span className="badge new">NEW</span>}
        {rule.rule_status === "UPDATED" && (
          <span className="badge updated">UPDATED</span>
        )}
      </div>

      <div className="rule-description">
        {highlightText(rule.description, searchText)}
      </div>

      {user?.role === "admin" && rule.admin_comment && (
        <div className="admin-comment">
          <strong>Admin Note:</strong> {rule.admin_comment}
        </div>
      )}

      {user?.role === "admin" && (
        <div className="rule-actions">
          <button className="edit-btn" onClick={() => handleEdit(rule)}>
            ✏️ Edit
          </button>

          <button
            className="edit-btn delete-btn"
            onClick={() => handleDelete(rule.id)}
          >
            🗑 Delete
          </button>
        </div>
      )}
    </div>
  );

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

      <section className="fielding-guide-section">
        <div className="fielding-guide-header">
          <span className="fielding-guide-tag">Visual Fielding Guide</span>
          <h2>🏏 ODI / T20 Field Placement Rules</h2>
          <p>
            These screenshots help users clearly understand legal field placement
            before powerplay, after powerplay, restricted positions and balanced
            field distribution.
          </p>
        </div>

        <div className="fielding-rule-card before-pp">
          <div className="fielding-rule-content">
            <span className="rule-pill">Before Powerplay</span>
            <h3>Powerplay Field Setup</h3>
            <p>
              This image shows the fielding setup before powerplay in ODI / T20
              format. Users must follow the allowed fielding restrictions during
              powerplay.
            </p>
          </div>

          <img
            src={beforePowerPlay}
            alt="Before powerplay field setup"
            className="fielding-main-img"
          />
        </div>

        <div className="fielding-rule-card after-pp">
          <div className="fielding-rule-content">
            <span className="rule-pill success">After Powerplay</span>
            <h3>Allowed Field Setup After Powerplay</h3>
            <p>
              These images show valid examples of field placement after powerplay
              for ODI / T20 format.
            </p>
          </div>

          <div className="fielding-gallery">
            {[
              afterPowerPlay1,
              afterPowerPlay2,
              afterPowerPlay3,
              afterPowerPlay4,
              afterPowerPlay5
            ].map((img, index) => (
              <img
                key={index}
                src={img}
                alt={`After powerplay field setup ${index + 1}`}
              />
            ))}
          </div>
        </div>

        <div className="fielding-rule-card danger-card">
          <div className="fielding-rule-content">
            <span className="rule-pill danger">Restricted Points</span>
            <h3>Only 1 Fielder Allowed in These 4 Points</h3>
            <p>
              In the marked red positions, only <b>1 fielder</b> can be deployed
              in any one of the 4 points. More than 1 fielder is not allowed in
              those restricted points during powerplay or after powerplay.
            </p>
          </div>

          <img
            src={restrictedPoints}
            alt="Restricted points fielding rule"
            className="fielding-main-img"
          />
        </div>

        <div className="fielding-rule-card warning-card">
          <div className="fielding-rule-content">
            <span className="rule-pill warning">Distribution Rule</span>
            <h3>Balanced Inner Circle Fielding</h3>
            <p>
              Fielders inside or around the circle should be distributed properly
              between off side and leg side. Slip is optional. If no slip is used,
              fielders should be balanced in a <b>4:5</b> or <b>5:4</b> ratio.
            </p>
          </div>

          <img
            src={fieldingDescription}
            alt="Fielding distribution explanation"
            className="fielding-main-img"
          />
        </div>
      </section>

      <div className="fielding-rule-card skill-card">
        <div className="fielding-rule-content">
          <span className="rule-pill success">Team Template</span>

          <h3>Player Skill Template (Mandatory)</h3>

          <p>
            Every newly assigned team must follow the official CrickEdge player
            skill template before submitting the squad for approval.
          </p>

          <div className="skill-rules-grid">

            <div className="skill-rule batsman">
              🏏 Batsman = <strong>99</strong>
            </div>

            <div className="skill-rule allrounder">
              ⚡ All Rounder = <strong>92</strong>
            </div>

            <div className="skill-rule licensed">
              ✅ Licensed Bowler = <strong>83</strong>
            </div>

            <div className="skill-rule nonlicensed">
              ❌ Non Licensed Bowler = <strong>75</strong>
            </div>

          </div>

          <div className="important-note">
            ⚠️ Any deviation from the approved skill template may result in
            rejection of the squad during Admin verification.
          </div>
        </div>

        <img
          src={teamTemplate}
          alt="CrickEdge Team Skill Template"
          className="fielding-main-img"
        />
      </div>

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