import React, { useState } from "react";

export default function AdminPromptModal({ onAdminResponse }) {
  const [showCredentials, setShowCredentials] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  // Step 1: If "No", just close modal as normal user
  const handleNo = () => onAdminResponse(false);

  // Step 2: If "Yes", show admin login fields
  const handleYes = () => setShowCredentials(true);

  // Step 3: Handle form submit for admin login
  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const res = await fetch("https://cricket-scoreboard-backend.onrender.com/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();
      if (res.ok && data.isAdmin) {
        onAdminResponse(true);
      } else {
        setError(data.error || "Invalid credentials.");
      }
    } catch (e) {
      setError("Server error. Try again.");
    }
    setSubmitting(false);
  };

  return (
    <div className="admin-modal-bg" role="dialog" aria-modal="true" tabIndex={-1}>
      <div className="admin-modal animate-pop">
        {!showCredentials ? (
          <>
            <h2 className="admin-modal-title">Are you an Admin?</h2>
            <div className="admin-modal-btns">
              <button className="admin-btn admin-btn-yes" onClick={handleYes}>Yes</button>
              <button className="admin-btn admin-btn-no" onClick={handleNo}>No</button>
            </div>
          </>
        ) : (
          <form className="admin-login-form" onSubmit={handleLogin} autoComplete="off">
            <h3>Admin Login</h3>
            <input
              type="text"
              placeholder="Admin Username"
              autoFocus
              value={username}
              onChange={e => setUsername(e.target.value)}
              required
            />
            <input
              type="password"
              placeholder="Admin Password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
            />
            <div className="admin-modal-btns">
              <button className="admin-btn admin-btn-login" type="submit" disabled={submitting}>
                {submitting ? "Logging in..." : "Login"}
              </button>
              <button className="admin-btn admin-btn-back" type="button" onClick={() => setShowCredentials(false)} disabled={submitting}>Back</button>
            </div>
            {error && <div className="admin-modal-error">{error}</div>}
          </form>
        )}
      </div>
      {/* Advanced/modern CSS */}
      <style>{`
        .admin-modal-bg {
          position:fixed; left:0; top:0; width:100vw; height:100vh;
          background:rgba(0,0,0,0.44); display:flex; align-items:center; justify-content:center;
          z-index:99999;
          animation: fadeIn 0.2s;
        }
        @keyframes fadeIn { from { opacity:0; } to { opacity:1; } }

        .admin-modal {
          background:#181925;
          color:#fff;
          padding:2.3rem 2rem 2rem 2rem;
          border-radius:20px;
          min-width:350px;
          box-shadow:0 8px 36px #111a  ;
          text-align:center;
          border: 1.5px solid #00bfae33;
        }
        .animate-pop { animation: popIn .25s cubic-bezier(.23,1.23,.84,1.02);}
        @keyframes popIn { from {transform:scale(.95); opacity:0;} to {transform:scale(1); opacity:1;} }

        .admin-modal-title {
          font-size: 1.7rem;
          font-weight: 700;
          margin-bottom: 1.6rem;
          color: #00BFAE;
        }
        .admin-modal-btns {
          display:flex; justify-content:center; gap:18px; margin-top:14px;
        }
        .admin-btn {
          font-size: 1.09rem;
          padding: 0.5rem 1.45rem;
          border: none;
          border-radius: 7px;
          background: #191b24;
          color: #eee;
          font-weight: 600;
          transition: background 0.15s;
          outline: none;
          cursor:pointer;
          box-shadow:0 2px 10px #0002;
        }
        .admin-btn-yes { background: linear-gradient(90deg,#00bfae,#08b3f7);}
        .admin-btn-no { background: #e44; }
        .admin-btn-login { background: #23a44d;}
        .admin-btn-back { background: #343a40;}
        .admin-btn:active { opacity:0.82; }
        .admin-login-form { display:flex; flex-direction:column; gap:12px; margin-top:12px; }
        .admin-login-form input {
          padding:0.7rem 0.8rem; border-radius:6px; border:none; font-size:1rem; background:#262a36; color:#fff;
          margin-bottom:0;
        }
        .admin-login-form input:focus { outline:2px solid #00bfae;}
        .admin-modal-error { color:#FFD700; margin-top:9px; font-size:15px;}
      `}</style>
    </div>
  );
}