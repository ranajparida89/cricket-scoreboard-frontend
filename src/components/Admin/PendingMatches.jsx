// src/components/Admin/PendingMatches.jsx
// 10-JULY-2025: Unified Pending Match UI (ODI/T20 + Test) for new backend

import React, { useEffect, useState } from "react";

// --- Glass style ---
const glass = {
  background: "rgba(23,30,45,0.88)",
  backdropFilter: "blur(13px)",
  borderRadius: "2rem",
  border: "1.7px solid #00ffd828",
  boxShadow: "0 10px 28px #18e8e42a",
  padding: "2.2rem 1.5rem 2.5rem 1.5rem",
  maxWidth: "1150px",
  width: "97vw",
  margin: "2.7rem auto",
};

export default function PendingMatches() {
  const [pending, setPending] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [action, setAction] = useState({});
  const [refresh, setRefresh] = useState(false);

  // --- Auth: JWT from localStorage
  function getJWT() {
    return localStorage.getItem("admin_jwt") || "";
  }

  // --- Load pending matches ---
  useEffect(() => {
    setLoading(true);
    setErr("");
    fetch("https://cricket-scoreboard-backend.onrender.com/api/match/pending", {
      headers: { Authorization: "Bearer " + getJWT() }
    })
      .then(r => r.json())
      .then(data => {
        if (data.pending) setPending(data.pending);
        else setErr("No pending matches found.");
        setLoading(false);
      })
      .catch(() => { setErr("Failed to load."); setLoading(false); });
  }, [refresh]);

  // --- Approve/Deny ---
  async function handleAction(table, id, type) {
    setAction({ id, type, loading: true, err: "", ok: false });
    // -- PATCH endpoint expects table (match_history or test_match_results)
    let url = `https://cricket-scoreboard-backend.onrender.com/api/match/${type}/${table}/${id}`;
    let method = "PATCH";
    let opts = {
      method,
      headers: { "Content-Type": "application/json", Authorization: "Bearer " + getJWT() },
    };
    if (type === "deny") {
      opts.body = JSON.stringify({ reason: "Admin denied - invalid, duplicate or suspicious." });
    }
    try {
      const res = await fetch(url, opts);
      const data = await res.json();
      if (!res.ok || !data.match) throw new Error(data.error || "Action failed.");
      setAction({ id, type, loading: false, err: "", ok: true });
      setTimeout(() => setRefresh(r => !r), 650);
    } catch (e) {
      setAction({ id, type, loading: false, err: e.message, ok: false });
    }
  }

  // --- Main UI ---
  return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(120deg,#13162d 0%,#19304d 100%)",
      display: "flex",
      alignItems: "flex-start",
      justifyContent: "center"
    }}>
      <div style={glass} className="pending-matches-glass">
        <h1 className="pending-title">Pending Match Approvals</h1>
        {loading ? (
          <div className="pending-banner pending-loading">Loading...</div>
        ) : err ? (
          <div className="pending-banner pending-error">{err}</div>
        ) : pending.length === 0 ? (
          <div className="pending-banner pending-success">
            <b>🎉 All caught up! No pending matches.</b>
          </div>
        ) : (
          <div className="pending-scroll">
            <table className="pending-table">
              <thead>
                <tr>
                  <th>Type</th>
                  <th>Date</th>
                  <th>Match Name</th>
                  <th>Team 1</th>
                  <th>Team 2</th>
                  <th>Scores</th>
                  <th>Result</th>
                  <th>Reason</th>
                  <th>Format</th>
                  <th style={{ textAlign: "center" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {pending.map(match => (
                  <tr key={match.id} style={action.id === match.id && action.loading ? { opacity: 0.64 } : {}}>
                    <td>{match.match_type}</td>
                    <td>{new Date(match.match_date || match.date).toLocaleDateString()}</td>
                    <td>{match.match_name || "-"}</td>
                    <td>{match.team1}</td>
                    <td>{match.team2}</td>
                    <td>
                      <b>{match.runs1}-{match.wickets1}</b>
                      {" / "}
                      <b>{match.runs2}-{match.wickets2}</b>
                    </td>
                    <td style={{ maxWidth: 170 }}>
                      <span className="pending-result">{match.winner}</span>
                    </td>
                    <td>
                      <span className="pending-reason">{match.auto_flag_reason || "--"}</span>
                    </td>
                    <td>
                      <span className="pending-reason">{match.match_format || (match.match_type?.toLowerCase() === "test" ? "Test" : "ODI/T20")}</span>
                    </td>
                    <td style={{ textAlign: "center" }}>
                      <button
                        className="pending-btn approve"
                        onClick={() => handleAction(
                          match.match_format === "Test" ? "test_match_results" : "match_history",
                          match.id, "approve"
                        )}
                        disabled={action.loading}
                      >
                        {action.id === match.id && action.type === "approve" && action.loading
                          ? "Approving..." : "Approve"}
                      </button>
                      <button
                        className="pending-btn deny"
                        onClick={() => handleAction(
                          match.match_format === "Test" ? "test_match_results" : "match_history",
                          match.id, "deny"
                        )}
                        disabled={action.loading}
                        style={{ marginLeft: 10 }}
                      >
                        {action.id === match.id && action.type === "deny" && action.loading
                          ? "Denying..." : "Deny"}
                      </button>
                      {action.id === match.id && action.err && (
                        <div className="pending-action-err">{action.err}</div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      {/* Modern CSS, fully responsive */}
      <style>{`
        .pending-matches-glass {
          font-family: 'Montserrat','Segoe UI',Arial,sans-serif;
        }
        .pending-title {
          font-size:2.1rem;
          font-weight: 900;
          color: #25f6ea;
          letter-spacing:.7px;
          margin-bottom: 1.4rem;
          text-align:center;
          text-shadow: 0 1.5px 8px #18e8e466;
        }
        .pending-scroll {
          max-height: 65vh;
          overflow:auto;
          border-radius:1.3em;
          box-shadow: 0 2px 13px #19e8e422;
          background:rgba(17,22,32,.05);
        }
        .pending-table {
          width:100%;
          border-collapse:separate;
          border-spacing:0 5px;
          color:#fff;
        }
        .pending-table th {
          background:rgba(18,255,243,.11);
          font-weight:700;
          color:#19e8e4;
          padding:8px 8px;
          text-align:left;
          font-size:1.02rem;
          position:sticky;
          top:0;
          z-index:10;
        }
        .pending-table td {
          background:rgba(255,255,255,0.09);
          font-size:.98rem;
          padding: 8px 9px;
          border-radius:11px;
          border-bottom: 2.5px solid #2229;
          vertical-align:middle;
        }
        .pending-result {
          font-size:.98em;
          color:#11e8bb;
          font-weight:600;
          word-break: break-word;
        }
        .pending-reason {
          font-size:.96em;
          color:#c0e;
        }
        .pending-btn {
          border-radius:11px;
          font-size:.98em;
          font-weight:800;
          padding:6px 15px;
          border:none;
          margin-top:3px;
          cursor:pointer;
          box-shadow:0 2px 10px #09b6e221;
          outline:none;
          transition: background .13s, color .13s, transform .12s;
        }
        .pending-btn.approve {
          background: linear-gradient(90deg, #25df9d, #18e8e4);
          color:#191928;
        }
        .pending-btn.deny {
          background: linear-gradient(92deg,#ff8a7d 10%,#d8458b 120%);
          color:#fff;
        }
        .pending-btn:active { transform:scale(.97);}
        .pending-btn:disabled { opacity:0.62;}
        .pending-banner {
          border-radius: .85em;
          padding: .68em 1.1em;
          margin-bottom: 1em;
          font-weight:800;
          font-size:1.13rem;
          text-align:center;
        }
        .pending-loading { background:#111c; color:#cce;}
        .pending-error { background:linear-gradient(92deg,#fcb5a8,#ff7070 120%); color:#422;}
        .pending-success { background:linear-gradient(92deg,#8ffece 60%,#18e8e4 120%); color:#166;}
        .pending-action-err { color:#FFD700; margin-top:4px; font-size:.95em;}
        @media (max-width:800px) {
          .pending-table th,.pending-table td { font-size:.93em;}
          .pending-table td { padding:7px 3px;}
        }
        @media (max-width:550px) {
          .pending-table th,.pending-table td { font-size:.89em;}
          .pending-table td { padding:5px 2px;}
          .pending-title { font-size:1.33rem;}
          .pending-matches-glass { padding:1.2rem .5rem 1.6rem .5rem;}
        }
      `}</style>
    </div>
  );
}
