// src/components/SubmitMatch.jsx
// 07-JULY-2025: Professional Match Auto-Approval Submission UI (with glassmorphism & all validation)

import React, { useState } from "react";

// ------ Form glassmorphism CSS ------
const styles = {
  glass: {
    background: "rgba(25, 32, 49, 0.80)",
    backdropFilter: "blur(16px)",
    border: "1.5px solid rgba(0,255,255,0.11)",
    borderRadius: "2rem",
    boxShadow: "0 12px 36px #09b6e211",
    padding: "2.6rem 2.2rem",
    maxWidth: 470,
    width: "96vw",
    margin: "3rem auto",
  }
};

const defaultForm = {
  match_type: "",
  team1: "",
  team2: "",
  match_date: "",
  venue: "",
  runs1: "",
  wickets1: "",
  runs2: "",
  wickets2: "",
  result: "",
};

const matchTypeOptions = ["T20", "ODI", "TEST"];

export default function SubmitMatch() {
  const [form, setForm] = useState({ ...defaultForm });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [status, setStatus] = useState("");
  const [pendingReason, setPendingReason] = useState("");

  // ---- Validate before submission (frontend)
  function validateForm(f) {
    let missing = [];
    for (const key in defaultForm) {
      if (!f[key] || f[key].toString().trim() === "") missing.push(key);
    }
    if (missing.length) return "All fields are required.";
    if (f.team1.trim().toLowerCase() === f.team2.trim().toLowerCase()) return "Team 1 and Team 2 must be different.";
    if (isNaN(f.runs1) || isNaN(f.runs2) || isNaN(f.wickets1) || isNaN(f.wickets2))
      return "Runs and wickets must be numbers.";
    if (parseInt(f.wickets1,10)>10 || parseInt(f.wickets2,10)>10)
      return "Wickets can't exceed 10.";
    if (f.result.trim().length < 5) return "Please enter a valid match result description.";
    return "";
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSuccess("");
    setStatus("");
    setPendingReason("");
    const v = validateForm(form);
    if (v) { setError(v); return; }
    setLoading(true);

    try {
      const res = await fetch("https://cricket-scoreboard-backend.onrender.com/api/match/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form)
      });
      const data = await res.json();
      if (res.ok && data.status === "approved") {
        setSuccess("✅ Match auto-approved and added to scoreboard!");
        setStatus("approved");
        setForm({ ...defaultForm });
      } else if (data.status === "pending") {
        setStatus("pending");
        setPendingReason(data.review_reason || "");
        setError(
          <>
            <b>⏳ Sent for admin review.</b> {data.error}
            <br/>
            {data.review_reason && (
              <span className="review-reason">
                <span style={{color:"#12eeef"}}>Reason: </span>
                {data.review_reason}
              </span>
            )}
          </>
        );
      } else {
        setError(data.error || "Unknown error.");
      }
    } catch (e) {
      setError("Server/network error. Try again.");
    }
    setLoading(false);
  }

  function handleChange(e) {
    const { name, value } = e.target;
    setForm(f => ({ ...f, [name]: value }));
  }

  // ----------- UI -----------
  return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(120deg, #121428 0%, #18283b 100%)",
      display: "flex",
      alignItems: "flex-start",
      justifyContent: "center"
    }}>
      <form
        style={styles.glass}
        className="submit-match-form"
        onSubmit={handleSubmit}
        autoComplete="off"
      >
        <h2 className="form-title">Submit a Cricket Match</h2>

        {/* Status banners */}
        {success && <div className="banner success">{success}</div>}
        {error && <div className="banner error">{error}</div>}

        <div className="flex-row">
          <div className="form-group">
            <label>Match Type</label>
            <select name="match_type" value={form.match_type} onChange={handleChange} required>
              <option value="">Select Type</option>
              {matchTypeOptions.map(opt => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label>Date</label>
            <input
              type="date"
              name="match_date"
              value={form.match_date}
              onChange={handleChange}
              required
              min="2020-01-01"
              max="2100-12-31"
            />
          </div>
        </div>
        <div className="flex-row">
          <div className="form-group">
            <label>Team 1</label>
            <input type="text" name="team1" value={form.team1} onChange={handleChange} placeholder="Team 1" required />
          </div>
          <div className="form-group">
            <label>Team 2</label>
            <input type="text" name="team2" value={form.team2} onChange={handleChange} placeholder="Team 2" required />
          </div>
        </div>
        <div className="form-group">
          <label>Venue</label>
          <input type="text" name="venue" value={form.venue} onChange={handleChange} placeholder="Venue" required />
        </div>
        <div className="flex-row">
          <div className="form-group">
            <label>Runs (Team 1)</label>
            <input type="number" name="runs1" value={form.runs1} onChange={handleChange} required min="0" max="1200" />
          </div>
          <div className="form-group">
            <label>Wickets (Team 1)</label>
            <input type="number" name="wickets1" value={form.wickets1} onChange={handleChange} required min="0" max="10" />
          </div>
        </div>
        <div className="flex-row">
          <div className="form-group">
            <label>Runs (Team 2)</label>
            <input type="number" name="runs2" value={form.runs2} onChange={handleChange} required min="0" max="1200" />
          </div>
          <div className="form-group">
            <label>Wickets (Team 2)</label>
            <input type="number" name="wickets2" value={form.wickets2} onChange={handleChange} required min="0" max="10" />
          </div>
        </div>
        <div className="form-group">
          <label>Result/Description</label>
          <textarea
            name="result"
            value={form.result}
            onChange={handleChange}
            rows={2}
            placeholder="Who won, by how many runs/wickets, etc."
            required
            style={{resize:"vertical", minHeight:40, fontSize:"1.05rem"}}
          />
        </div>

        <button
          className="submit-btn"
          type="submit"
          disabled={loading}
        >
          {loading ? "Submitting..." : "Submit Match"}
        </button>
      </form>
      {/* Inline CSS for pro look */}
      <style>{`
        .submit-match-form {
          font-family: 'Montserrat', 'Segoe UI', Arial, sans-serif;
        }
        .form-title {
          font-size:2rem;
          font-weight: 800;
          color:#27e8e8;
          letter-spacing:.7px;
          margin-bottom: 1.4rem;
          text-align: center;
          text-shadow: 0 1.5px 8px #0aeee430;
        }
        .flex-row { display:flex; gap:18px; }
        @media (max-width:600px) {
          .flex-row { flex-direction:column; gap:0.5rem;}
        }
        .form-group {
          display:flex;
          flex-direction:column;
          flex:1;
          margin-bottom: 16px;
        }
        .form-group label {
          color: #18e3e3;
          font-weight: 700;
          margin-bottom: 4px;
          letter-spacing:.03em;
        }
        .form-group input, .form-group select, .form-group textarea {
          padding: 0.75em 0.85em;
          border-radius: 0.7em;
          border: none;
          outline: 1.5px solid #00ffc944;
          background: rgba(255,255,255,0.11);
          font-size:1rem;
          margin-bottom: 2px;
          transition: box-shadow .19s, outline-color .16s;
        }
        .form-group input:focus,
        .form-group select:focus,
        .form-group textarea:focus {
          outline: 2.3px solid #0ff7;
          box-shadow:0 3px 22px #00eee214;
          background: rgba(255,255,255,0.19);
        }
        .submit-btn {
          width: 100%;
          margin-top: 1.7em;
          font-size: 1.13rem;
          font-weight: 800;
          padding: .92em 0;
          border-radius: 1.2em;
          color: #fff;
          background: linear-gradient(90deg, #11e7e9, #35aee8 85%);
          border:none;
          box-shadow: 0 4px 18px #09e8e522;
          transition: transform .13s, background .18s;
          letter-spacing:.03em;
          cursor: pointer;
        }
        .submit-btn:active { transform: scale(.97);}
        .submit-btn:disabled { opacity:0.65; pointer-events:none; }

        .banner {
          border-radius: .95em;
          padding: .7em 1em;
          margin-bottom: 1em;
          font-weight:700;
          font-size:1.09rem;
          text-align:center;
        }
        .banner.success {
          background: linear-gradient(92deg,#25df9d 60%,#18e8e4 120%);
          color: #133a27;
          border: 1.2px solid #09e8e9a1;
        }
        .banner.error {
          background: linear-gradient(92deg,#f7b185,#fd7070 120%);
          color: #331700;
          border: 1.2px solid #f53c2db1;
        }
        .review-reason {
          font-size:.96em;
          color:#00bcd4;
        }
      `}</style>
    </div>
  );
}
