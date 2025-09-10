// src/components/AdminPromptModal.jsx
// 09-SEP-2025 — Glassmorphism + Soft-Gold theme
// • Logic preserved. UI fully refreshed.
// • Stadium photo is used as the page backdrop.
// • Are-you-admin choice uses elegant gold buttons (no blue/pink).

import React, { useMemo, useState } from "react";
import stadium from "../assets/images/Cricketstadium.jpg";

export default function AdminPromptModal({ onAdminResponse }) {
  // Choose behaviour on password focus: "close" | "cover"
  const COVER_MODE = "close"; // set to "cover" for hands-over-eyes

  const [showCredentials, setShowCredentials] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  // visual micro-states
  const [coverEyes, setCoverEyes] = useState(false);
  const [sad, setSad] = useState(false);
  const [cry, setCry] = useState(false);
  const [shake, setShake] = useState(false);
  const [speak, setSpeak] = useState(false);

  // === logic (unchanged) ===
  const handleNo = () => {
    localStorage.setItem("isAdmin", "false");
    localStorage.removeItem("admin_jwt");
    onAdminResponse(false);
  };
  const handleYes = () => setShowCredentials(true);

  const usernameLooksValid = useMemo(() => {
    if (!username) return false;
    const email = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(username);
    const simple = /^[a-zA-Z0-9_]{3,}$/.test(username);
    return email || simple;
  }, [username]);

  const onUsernameFocus = () => { setSad(false); setSpeak(false); };
  const onUsernameBlur = () => { if (!username) setSad(true); };

  const onPasswordFocus = () => { setCoverEyes(true); if (!username) setSad(true); };
  const onPasswordChange = (e) => { setPassword(e.target.value); setCoverEyes(true); };
  const onPasswordBlur = () => setCoverEyes(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError(""); setCry(false); setSpeak(false);

    if (!username || !password) {
      setCry(true); setShake(true); setTimeout(() => setShake(false), 600);
      setError("Please fill username & password.");
      return;
    }
    if (!usernameLooksValid) {
      setSpeak(true); setShake(true); setTimeout(() => setShake(false), 600);
      setError("Invalid username.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("https://cricket-scoreboard-backend.onrender.com/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();
      if (res.ok && data.isAdmin && data.token) {
        localStorage.setItem("isAdmin", "true");
        localStorage.setItem("admin_jwt", data.token);
        onAdminResponse(true);
      } else {
        localStorage.setItem("isAdmin", "false");
        localStorage.removeItem("admin_jwt");
        setError(data.error || "Invalid credentials.");
        setSpeak(true); setShake(true); setTimeout(() => setShake(false), 600);
      }
    } catch {
      localStorage.setItem("isAdmin", "false");
      localStorage.removeItem("admin_jwt");
      setError("Server error. Try again.");
      setShake(true); setTimeout(() => setShake(false), 600);
    }
    setSubmitting(false);
  };

  const coverClass = coverEyes ? (COVER_MODE === "cover" ? "cover" : "blink") : "";

  return (
    <div
      className="admin-modal-bg photo"
      style={{ "--photo": `url(${stadium})` }}
      role="dialog" aria-modal="true" tabIndex={-1}
    >
      {/* Decorative floating orbs */}
      <div className="glass-orbs" aria-hidden>
        <span className="orb orb1" />
        <span className="orb orb2" />
        <span className="orb orb3" />
      </div>

      {/* Glass card */}
      <div className="admin-modal tilt">
        {!showCredentials ? (
          <>
            <h2 className="title gold">Are you an Admin?</h2>
            <p className="lead">Use admin access for tournament & score management.</p>

            <div className="choice-group">
              <button className="btn gold-fill choice" onClick={handleYes}>
                {/* check icon */}
                <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
                  <path fill="currentColor" d="M9.2 16.2 5.5 12.6l-1.4 1.4 5.1 5.1L20 8.3l-1.4-1.4z"/>
                </svg>
                <span>Yes, continue</span>
              </button>

              <button className="btn gold-ghost choice" onClick={handleNo}>
                {/* x icon */}
                <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
                  <path fill="currentColor" d="M18.3 5.7 12 12l6.3 6.3-1.4 1.4L10.6 13.4 4.3 19.7 2.9 18.3 9.2 12 2.9 5.7 4.3 4.3 10.6 10.6 16.9 4.3z"/>
                </svg>
                <span>No, take me back</span>
              </button>
            </div>
          </>
        ) : (
          <form className={`login-card ${shake ? "shake" : ""}`} onSubmit={handleLogin} autoComplete="off">
            <h3 className="subtitle gold">Admin Login</h3>

            <input
              type="text"
              placeholder="Admin Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              onFocus={onUsernameFocus}
              onBlur={onUsernameBlur}
              className={`inp ${username ? (usernameLooksValid ? "ok" : "warn") : ""}`}
              required
            />

            {/* Character between fields */}
            <div
              className={[
                "char-wrap",
                coverClass, sad ? "sad" : "", cry ? "cry" : "", speak ? "speak" : ""
              ].join(" ")}
              aria-hidden
            >
              <svg className="avatar" width="200" height="190" viewBox="0 0 200 190" xmlns="http://www.w3.org/2000/svg">
                <defs>
                  <linearGradient id="skin" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#FFD7B3" />
                    <stop offset="100%" stopColor="#E7AD83" />
                  </linearGradient>
                  <linearGradient id="hair" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#5b3b2f" />
                    <stop offset="100%" stopColor="#342016" />
                  </linearGradient>
                  <linearGradient id="shirt" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#6FB2FF" />
                    <stop offset="100%" stopColor="#2E6BFF" />
                  </linearGradient>
                  <linearGradient id="pants" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#1E293B" />
                    <stop offset="100%" stopColor="#0B1220" />
                  </linearGradient>
                </defs>

                <ellipse cx="100" cy="178" rx="40" ry="7" fill="#000" opacity=".22" />
                <g fill="url(#pants)">
                  <rect x="72" y="132" width="18" height="32" rx="8" />
                  <rect x="110" y="132" width="18" height="32" rx="8" />
                </g>
                <g fill="#0b1320">
                  <rect x="62" y="160" width="36" height="11" rx="6" />
                  <rect x="102" y="160" width="36" height="11" rx="6" />
                </g>
                <rect x="58" y="84" width="84" height="56" rx="26" fill="url(#shirt)" />
                <g className="arm arm-left" transform="translate(56 98)">
                  <rect x="0" y="0" width="46" height="14" rx="7" fill="url(#skin)" />
                  <g className="hand hand-left" transform="translate(38 -2)">
                    <rect width="24" height="22" rx="11" fill="url(#skin)" />
                    <path d="M5 9 H19 M5 13 H19" stroke="rgba(0,0,0,.1)" strokeWidth="2" strokeLinecap="round" />
                  </g>
                </g>
                <g className="arm arm-right" transform="translate(98 98)">
                  <rect x="0" y="0" width="46" height="14" rx="7" fill="url(#skin)" />
                  <g className="hand hand-right" transform="translate(38 -2)">
                    <rect width="24" height="22" rx="11" fill="url(#skin)" />
                    <path d="M5 9 H19 M5 13 H19" stroke="rgba(0,0,0,.1)" strokeWidth="2" strokeLinecap="round" />
                  </g>
                </g>
                <g transform="translate(56 22)">
                  <rect x="28" y="-2" width="44" height="18" rx="9" fill="url(#hair)" />
                  <rect x="0" y="14" width="100" height="72" rx="34" fill="url(#skin)" />
                  <circle className="eye eye-left" cx="30" cy="44" r="7" fill="#0f172a" />
                  <circle className="eye eye-right" cx="70" cy="44" r="7" fill="#0f172a" />
                  <rect className="lid lid-left" x="23" y="36" width="14" height="14" rx="7" fill="url(#skin)" />
                  <rect className="lid lid-right" x="63" y="36" width="14" height="14" rx="7" fill="url(#skin)" />
                  <circle className="tear tear-left" cx="30" cy="53" r="4.2" fill="#8ee7ff" opacity="0" />
                  <circle className="tear tear-right" cx="70" cy="53" r="4.2" fill="#8ee7ff" opacity="0" />
                  <rect className="mouth" x="44" y="60" width="12" height="6" rx="3" fill="#1f2937" />
                </g>
              </svg>

              <div className="speech">No No put correct username</div>
            </div>

            <input
              type="password"
              placeholder="Admin Password"
              value={password}
              onFocus={onPasswordFocus}
              onChange={onPasswordChange}
              onBlur={onPasswordBlur}
              className="inp"
              required
            />

            <div className="row">
              <button className="btn gold-fill" type="submit" disabled={submitting}>
                {submitting ? "Logging in..." : "Login"}
              </button>
              <button className="btn gold-ghost" type="button" onClick={() => setShowCredentials(false)} disabled={submitting}>
                Back
              </button>
            </div>

            {error && <div className="error-bar">{error}</div>}
          </form>
        )}
      </div>

      <style>{`
        :root{
          --gold:#f7c948;
          --gold-2:#ffe082;
          --stroke:rgba(255,255,255,.10);
          --text:#eef4ff;
          --ease:cubic-bezier(.22,.61,.36,1);
        }

        /* ===== Stadium backdrop ===== */
        .admin-modal-bg{
          position:fixed; inset:0; display:flex; align-items:center; justify-content:center;
          overflow:hidden; z-index:99999;
          font-family:Poppins, system-ui, -apple-system, Segoe UI, Roboto, Arial;
        }
        .admin-modal-bg.photo::before{
          content:""; position:absolute; inset:0; z-index:0;
          background:
            linear-gradient(180deg, rgba(6,10,18,.42), rgba(6,10,18,.76)),
            radial-gradient(1200px 600px at 80% 40%, rgba(0,0,0,.25), transparent 60%),
            var(--photo) center/cover no-repeat fixed;
          filter: saturate(1.05) contrast(1.04) brightness(.96);
          transform: scale(1.02);
        }

        /* Orbs */
        .glass-orbs{ position:absolute; inset:0; z-index:1; pointer-events:none; }
        .glass-orbs .orb{
          position:absolute; border-radius:50%; filter:blur(44px); opacity:.55; mix-blend-mode:screen;
          animation: orb 18s ease-in-out infinite;
        }
        .orb1{ width:360px; height:360px; left:8%;  top:12%;
               background:radial-gradient(circle at 30% 30%, #00e5ff, transparent 60%),
                          radial-gradient(circle at 70% 70%, #6f80ff, transparent 60%); }
        .orb2{ width:300px; height:300px; right:12%; top:10%;
               background:radial-gradient(circle at 30% 30%, #ff73fa, transparent 60%),
                          radial-gradient(circle at 70% 70%, #00ffc6, transparent 60%); animation-duration:20s;}
        .orb3{ width:460px; height:460px; right:18%; bottom:10%;
               background:radial-gradient(circle at 30% 30%, #63a3ff, transparent 60%),
                          radial-gradient(circle at 70% 70%, #00e6b9, transparent 60%); animation-duration:22s;}
        @keyframes orb{ 0%,100%{transform:translate(0,0)} 50%{transform:translate(-30px,-22px)} }

        /* ===== Glass card (lighter, golden halo) ===== */
        .admin-modal{
          position:relative; z-index:2;
          width:min(740px,92vw);
          background:linear-gradient(180deg, rgba(18,26,44,.48), rgba(18,26,44,.36));
          backdrop-filter: blur(18px); -webkit-backdrop-filter: blur(18px);
          border:1px solid var(--stroke); border-radius:22px;
          padding:22px 20px 20px;
          box-shadow:
            0 26px 60px rgba(0,0,0,.34),
            0 0 0 1px rgba(255,255,255,.05) inset,
            0 18px 48px -22px rgba(247,201,72,.35); /* soft gold glow */
          transform-style:preserve-3d; perspective:1000px;
          animation: float3d 9s ease-in-out infinite;
          color: var(--text);
        }
        .admin-modal.tilt:hover{ animation-play-state:paused; transform:rotateX(2deg) rotateY(-2deg); }
        @keyframes float3d{
          0%,100%{ transform: translateY(0) rotateX(0deg) rotateY(0deg) }
          50%{ transform: translateY(-4px) rotateX(1.2deg) rotateY(-1.2deg) }
        }

        /* Headings */
        .title, .subtitle{
          text-align:center; font-weight:800; letter-spacing:.2px;
          background:linear-gradient(90deg, var(--gold), var(--gold-2));
          -webkit-background-clip:text; background-clip:text; -webkit-text-fill-color:transparent;
          text-shadow: 0 1px 0 rgba(0,0,0,.35);
          margin: 4px 0 10px;
        }
        .title.gold{ font-size:26px; }
        .subtitle.gold{ font-size:20px; margin-top:6px; }

        .lead{
          text-align:center; color:#e6eadb; opacity:.9; margin:0 0 14px;
          font-weight:600; letter-spacing:.15px;
        }

        /* ===== Choice buttons (gold theme) ===== */
        .choice-group{ display:flex; flex-direction:column; gap:12px; margin-top:10px; }
        .btn{
          position:relative; border:none; color:#1a1f2e; font-weight:800; letter-spacing:.2px;
          padding:.8rem 1.1rem; border-radius:14px; cursor:pointer;
          transition: transform .14s var(--ease), box-shadow .2s var(--ease), background .25s var(--ease), color .2s var(--ease);
          display:flex; align-items:center; justify-content:center; gap:10px;
        }
        .btn svg{ opacity:.9 }
        .btn:disabled{ opacity:.6; cursor:not-allowed }

        /* Filled gold */
        .gold-fill{
          background: linear-gradient(180deg, rgba(247,201,72,.22), rgba(247,201,72,.16));
          color:#fff7d6;
          border:1px solid rgba(247,201,72,.55);
          box-shadow: 0 10px 28px -18px rgba(247,201,72,.6), inset 0 1px 0 rgba(255,255,255,.06);
        }
        .gold-fill:hover{ transform: translateY(-1px);
          background: linear-gradient(180deg, rgba(247,201,72,.28), rgba(247,201,72,.2));
          box-shadow: 0 14px 34px -16px rgba(247,201,72,.66);
        }

        /* Ghost (glass) with gold edge */
        .gold-ghost{
          background: linear-gradient(180deg, rgba(255,255,255,.06), rgba(255,255,255,.03));
          color:#fff5cc;
          border:1px dashed rgba(247,201,72,.45);
          box-shadow: inset 0 0 0 1px rgba(255,255,255,.06), 0 10px 26px -18px rgba(247,201,72,.45);
        }
        .gold-ghost:hover{ transform: translateY(-1px); background: linear-gradient(180deg, rgba(255,255,255,.08), rgba(255,255,255,.04)); }

        /* Keep row (login buttons) visually aligned with choice buttons */
        .row{ display:flex; gap:12px; justify-content:center; align-items:center; margin-top:12px; }

        /* Inputs */
        .login-card{ padding:12px 12px 16px; border-radius:16px; }
        .login-card.shake{ animation:shake .6s var(--ease); }
        @keyframes shake{
          0%,100%{transform:translateX(0)} 20%{transform:translateX(-10px)}
          40%{transform:translateX(8px)} 60%{transform:translateX(-6px)} 80%{transform:translateX(4px)}
        }

        .inp{
          width:100%; color:var(--text); border:none; outline:none; border-radius:14px;
          padding:0.95rem 1rem; margin-top:10px; font-size:1rem;
          background:linear-gradient(180deg, rgba(255,255,255,.06), rgba(255,255,255,.03));
          box-shadow: inset 0 0 0 1px rgba(255,255,255,.12);
          transition: box-shadow .2s var(--ease), background .25s var(--ease);
        }
        .inp:focus{ box-shadow:0 0 0 3px rgba(247,201,72,.25), inset 0 0 0 1px rgba(247,201,72,.6) }
        .inp.ok{   box-shadow: inset 0 0 0 1px rgba(98,255,205,.9), 0 0 0 3px rgba(98,255,205,.25) }
        .inp.warn{ box-shadow: inset 0 0 0 1px rgba(255,200,87,.95), 0 0 0 3px rgba(255,200,87,.25) }

        .error-bar{
          margin-top:12px; text-align:center; padding:.7rem 1rem; border-radius:10px;
          color:#3c2a00; background:#ffecec; box-shadow: inset 0 0 0 1px rgba(255,107,107,.35);
        }

        /* ===== Character micro-animations ===== */
        .char-wrap{ position:relative; height:190px; display:flex; align-items:center; justify-content:center; }
        .avatar{ overflow:visible; }
        .arm, .hand, .eye, .mouth, .tear, .lid { transform-box: fill-box; transform-origin: center; }

        .arm-left  { transform-origin: 6px 7px; }
        .arm-right { transform-origin: 6px 7px; }
        .hand-left, .hand-right { transform-origin: 50% 50%; }
        .arm-left, .arm-right, .hand-left, .hand-right { transition: transform .28s var(--ease); }

        .char-wrap.cover .arm-left  { transform: rotate(-70deg); }
        .char-wrap.cover .arm-right { transform: rotate( 70deg); }
        .char-wrap.cover .hand-left  { transform: translateX(25px) translateY(-25px) scale(1.5); }
        .char-wrap.cover .hand-right { transform: translateX(-25px) translateY(-25px) scale(1.5); }

        .lid{ transform: translateY(-16px); transition: transform .22s var(--ease); }
        .char-wrap.blink .lid{ transform: translateY(0px); }
        .char-wrap.blink .eye{ transform: scaleY(.1) translateY(3px); transition: transform .18s var(--ease); }

        .char-wrap.sad .eye{ transform: translateY(2px) scaleY(.75); }
        .char-wrap.sad .mouth{ transform: translateY(2px) rotate(180deg); }

        .char-wrap.cry .mouth{ width:10px; height:10px; rx:5px; transform:translateY(-2px); }
        .char-wrap.cry .tear{ opacity:1; animation: tear 1s ease-in infinite; }
        @keyframes tear{ 0%{ transform:translateY(0); opacity:0 } 10%{opacity:1} 100%{ transform:translateY(42px); opacity:0 } }

        .speech{
          position:absolute; top:2px; left:50%; transform:translate(-50%,-110%);
          background:rgba(18,28,46,.92); color:#fff; font-weight:700; font-size:.86rem;
          padding:.5rem .8rem; border-radius:10px; border:1px solid rgba(255,255,255,.14);
          opacity:0; pointer-events:none; transition: opacity .2s var(--ease), transform .2s var(--ease);
          white-space:nowrap; box-shadow:0 10px 24px rgba(0,0,0,.25);
        }
        .speech::after{
          content:""; position:absolute; left:50%; bottom:-8px; transform:translateX(-50%) rotate(45deg);
          width:12px; height:12px; background:inherit; border:inherit; border-top:none; border-left:none;
        }
        .char-wrap.speak .speech{ opacity:1; transform:translate(-50%,-120%); }
      `}</style>
    </div>
  );
}
