import React, { useEffect, useMemo, useState } from "react";
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

  const [openSections, setOpenSections] = useState({
    visual: false,
    skill: false,
    odi: true,
    test: false
  });

  const [openRules, setOpenRules] = useState({});
  const [openVisuals, setOpenVisuals] = useState({});
  const [previewImage, setPreviewImage] = useState(null);

  const toggleSection = (key) => {
    setOpenSections((prev) => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const toggleRule = (ruleId) => {
    setOpenRules((prev) => ({
      ...prev,
      [ruleId]: !prev[ruleId]
    }));
  };

  const toggleVisual = (key) => {
    setOpenVisuals((prev) => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

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

    window.scrollTo({ top: 0, behavior: "smooth" });
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
      ${rule.format}
    `.toLowerCase();

    const matchesSearch =
      !searchText || text.includes(searchText.toLowerCase());

    const matchesFilter =
      filterKey === "ALL" ||
      (filterKey === "MANDATORY" && rule.is_mandatory) ||
      (filterKey === "UPDATED" && rule.rule_status === "UPDATED") ||
      (filterKey === "NEW" && rule.rule_status === "NEW") ||
      rule.category?.toUpperCase().includes(filterKey) ||
      rule.title?.toUpperCase().includes(filterKey) ||
      rule.format?.toUpperCase().includes(filterKey);

    return matchesSearch && matchesFilter;
  };

  const odiT20Rules = useMemo(
    () =>
      rules.filter(
        (r) =>
          (r.format === "ODI" || r.format === "T20" || r.format === "ALL") &&
          applySearchFilter(r)
      ),
    [rules, searchText, filterKey]
  );

  const testRules = useMemo(
    () =>
      rules.filter(
        (r) =>
          (r.format === "TEST" || r.format === "ALL") &&
          applySearchFilter(r)
      ),
    [rules, searchText, filterKey]
  );

  const stats = useMemo(() => {
    return {
      total: rules.length,
      mandatory: rules.filter((r) => r.is_mandatory).length,
      updated: rules.filter((r) => r.rule_status === "UPDATED").length,
      fresh: rules.filter((r) => r.rule_status === "NEW").length,
      odi: rules.filter(
        (r) => r.format === "ODI" || r.format === "T20" || r.format === "ALL"
      ).length,
      test: rules.filter((r) => r.format === "TEST" || r.format === "ALL").length
    };
  }, [rules]);

  const highlightText = (text, search) => {
    if (!search || !text) return text;

    const escapedSearch = search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const regex = new RegExp(`(${escapedSearch})`, "gi");
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

  const scrollToSection = (id, sectionKey) => {
    setOpenSections((prev) => ({
      ...prev,
      [sectionKey]: true
    }));

    setTimeout(() => {
      const el = document.getElementById(id);
      if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 80);
  };

  const renderBadge = (rule) => (
    <div className="rule-badges">
      {rule.is_mandatory && <span className="badge mandatory">MANDATORY</span>}
      {rule.rule_status === "NEW" && <span className="badge new">NEW</span>}
      {rule.rule_status === "UPDATED" && (
        <span className="badge updated">UPDATED</span>
      )}
    </div>
  );

  const renderRule = (rule) => {
    const isOpen = !!openRules[rule.id];

    return (
      <div key={rule.id} className={`rule-card ${rule.rule_status?.toLowerCase() || ""}`}>
        <button className="rule-summary" onClick={() => toggleRule(rule.id)}>
          <div className="rule-summary-left">
            <span className={`accordion-arrow ${isOpen ? "open" : ""}`}>▶</span>
            <span className="rule-number">Rule {rule.rule_number}</span>
            <span className="rule-title">
              {highlightText(rule.title, searchText)}
            </span>
          </div>

          {renderBadge(rule)}
        </button>

        {isOpen && (
          <div className="rule-details">
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
        )}
      </div>
    );
  };

  const VisualAccordion = ({ id, title, pill, pillType, description, children }) => {
    const isOpen = !!openVisuals[id];

    return (
      <div className="visual-accordion-card">
        <button className="visual-summary" onClick={() => toggleVisual(id)}>
          <div>
            <span className={`rule-pill ${pillType || ""}`}>{pill}</span>
            <h3>{title}</h3>
            <p>{description}</p>
          </div>
          <span className={`accordion-arrow big ${isOpen ? "open" : ""}`}>▶</span>
        </button>

        {isOpen && <div className="visual-details">{children}</div>}
      </div>
    );
  };

  return (
    <div className="rules-container">
      <h1 className="rules-title">CrickEdge – Rules & Regulations</h1>

      <div className="rules-toolbar sticky-toolbar">
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
          <option value="UPDATED">Updated</option>
          <option value="NEW">New</option>
          <option value="BOWLING">Bowling</option>
          <option value="BATTING">Batting</option>
          <option value="FIELDING">Fielding</option>
          <option value="PENALTY">Penalty</option>
          <option value="CUSTOM">Custom Player</option>
          <option value="TEST">Test</option>
          <option value="ODI">ODI / T20</option>
        </select>
      </div>

      <div className="rules-stats-grid">
        <div className="stat-card">
          <span>Total Rules</span>
          <strong>{stats.total}</strong>
        </div>
        <div className="stat-card danger-stat">
          <span>Mandatory</span>
          <strong>{stats.mandatory}</strong>
        </div>
        <div className="stat-card warning-stat">
          <span>Updated</span>
          <strong>{stats.updated}</strong>
        </div>
        <div className="stat-card success-stat">
          <span>New</span>
          <strong>{stats.fresh}</strong>
        </div>
      </div>

      <div className="quick-nav">
        <button onClick={() => scrollToSection("visual-guide", "visual")}>
          🏏 Visual Guide
        </button>
        <button onClick={() => scrollToSection("team-skill", "skill")}>
          🧩 Team Skill
        </button>
        <button onClick={() => scrollToSection("odi-rules", "odi")}>
          📘 ODI / T20 Rules
        </button>
        <button onClick={() => scrollToSection("test-rules", "test")}>
          📕 Test Rules
        </button>
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

      <section id="visual-guide" className="collapsible-section">
        <button className="section-toggle" onClick={() => toggleSection("visual")}>
          <div>
            <span className="section-kicker">Visual Fielding Guide</span>
            <h2>🏏 ODI / T20 Field Placement Rules</h2>
            <p>
              Open only when required. This keeps the page short for new members.
            </p>
          </div>
          <span className={`accordion-arrow big ${openSections.visual ? "open" : ""}`}>
            ▶
          </span>
        </button>

        {openSections.visual && (
          <div className="section-body">
            <VisualAccordion
              id="before-pp"
              pill="Before Powerplay"
              title="Powerplay Field Setup"
              description="Allowed fielding setup before powerplay in ODI / T20."
            >
              <img
                src={beforePowerPlay}
                alt="Before powerplay field setup"
                className="fielding-main-img clickable-img"
                onClick={() => setPreviewImage(beforePowerPlay)}
              />
            </VisualAccordion>

            <VisualAccordion
              id="after-pp"
              pill="After Powerplay"
              pillType="success"
              title="Allowed Field Setup After Powerplay"
              description="Valid examples of field placement after powerplay."
            >
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
                    onClick={() => setPreviewImage(img)}
                    className="clickable-img"
                  />
                ))}
              </div>
            </VisualAccordion>

            <VisualAccordion
              id="restricted-points"
              pill="Restricted Points"
              pillType="danger"
              title="Only 1 Fielder Allowed in These 4 Points"
              description="Only one fielder can be deployed in any one of the four restricted points."
            >
              <img
                src={restrictedPoints}
                alt="Restricted points fielding rule"
                className="fielding-main-img clickable-img"
                onClick={() => setPreviewImage(restrictedPoints)}
              />
            </VisualAccordion>

            <VisualAccordion
              id="distribution-rule"
              pill="Distribution Rule"
              pillType="warning"
              title="Balanced Inner Circle Fielding"
              description="Fielders should be balanced between off side and leg side."
            >
              <img
                src={fieldingDescription}
                alt="Fielding distribution explanation"
                className="fielding-main-img clickable-img"
                onClick={() => setPreviewImage(fieldingDescription)}
              />
            </VisualAccordion>
          </div>
        )}
      </section>

      <section id="team-skill" className="collapsible-section">
        <button className="section-toggle skill-toggle" onClick={() => toggleSection("skill")}>
          <div>
            <span className="section-kicker">Team Template</span>
            <h2>🧩 Player Skill Template</h2>
            <p>
              Mandatory player skill setup for all newly assigned teams.
            </p>
          </div>
          <span className={`accordion-arrow big ${openSections.skill ? "open" : ""}`}>
            ▶
          </span>
        </button>

        {openSections.skill && (
          <div className="section-body">
            <div className="fielding-rule-card skill-card">
              <div className="fielding-rule-content">
                <span className="rule-pill success">Team Template</span>

                <h3>Player Skill Template (Mandatory)</h3>

                <p>
                  Every newly assigned team must follow the official CrickEdge
                  player skill template before submitting the squad for approval.
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
                className="fielding-main-img clickable-img"
                onClick={() => setPreviewImage(teamTemplate)}
              />
            </div>
          </div>
        )}
      </section>

      <section id="odi-rules" className="collapsible-section">
        <button className="section-toggle" onClick={() => toggleSection("odi")}>
          <div>
            <span className="section-kicker">ODI / T20</span>
            <h2>📘 ODI / T20 Rules ({odiT20Rules.length})</h2>
            <p>Click any rule to view full details.</p>
          </div>
          <span className={`accordion-arrow big ${openSections.odi ? "open" : ""}`}>
            ▶
          </span>
        </button>

        {openSections.odi && (
          <div className="rules-list">
            {odiT20Rules.length ? (
              odiT20Rules.map(renderRule)
            ) : (
              <p className="empty-state">No ODI / T20 rules found.</p>
            )}
          </div>
        )}
      </section>

      <section id="test-rules" className="collapsible-section">
        <button className="section-toggle test-toggle" onClick={() => toggleSection("test")}>
          <div>
            <span className="section-kicker">Test Match</span>
            <h2>📕 Test Match Rules ({testRules.length})</h2>
            <p>Click any rule to view full details.</p>
          </div>
          <span className={`accordion-arrow big ${openSections.test ? "open" : ""}`}>
            ▶
          </span>
        </button>

        {openSections.test && (
          <div className="rules-list">
            {testRules.length ? (
              testRules.map(renderRule)
            ) : (
              <p className="empty-state">No Test rules found.</p>
            )}
          </div>
        )}
      </section>

      {loading && <p className="loading-text">Loading rules...</p>}
      {error && <p className="error">{error}</p>}

      <button
        className="back-to-top"
        onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      >
        ↑
      </button>

      {previewImage && (
        <div className="image-modal" onClick={() => setPreviewImage(null)}>
          <button className="image-modal-close">×</button>
          <img src={previewImage} alt="Preview" onClick={(e) => e.stopPropagation()} />
        </div>
      )}
    </div>
  );
}

export default RulesAndRegulations;