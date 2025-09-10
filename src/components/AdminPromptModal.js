// src/components/AdminPromptModal.jsx
// 05-JUL-2025 — Glassmorphism redesign with stadium photo backdrop
// ✅ Logic preserved exactly; only visuals/wrapper updated.
// ✅ Uses your image at: src/assets/images/Cricketstadium.jpg

import React, { useMemo, useState } from "react";

// ⬇️ Import your background image from the path you provided
import stadium from "../assets/images/Cricketstadium.jpg";

export default function AdminPromptModal({ onAdminResponse }) {
  // Choose behaviour on password focus: "close" | "cover"
  const COVER_MODE = "close"; // set to "cover" for hands-over-eyes

  const [showCredentials, setShowCredentials] = useState(false);
  const [username, setUsername]     = useState("");
  const [password, setPassword]     = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError]           = useState("");

  // visual states
  const [coverEyes, setCoverEyes]   = useState(false);
  const [sad, setSad]               = useState(false);
  const [cry, setCry]               = useState(false);
  const [shake, setShake]           = useState(false);
  const [speak, setSpeak]           = useState(false);

  // === logic (unchanged) ===
  const handleNo = () => {
    localStorage.setItem("isAdmin", "false");
    localStorage.removeItem("admin_jwt");
    onAdminResponse(false);
  };
  const handleYes = () => setShowCredentials(true);

  const usernameLooksValid = useMemo(() => {
    if (!username) return false;
    const email  = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(username);
    const simple = /^[a-zA-Z0-9_]{3,}$/.test(username);
    return email || simple;
  }, [username]);

  const onUsernameFocus = () => { setSad(false); setSpeak(false); };
  const onUsernameBlur  = () => { if (!username) setSad(true); };

  const onPasswordFocus   = () => { setCoverEyes(true); if (!username) setSad(true); };
  const onPasswordChange  = e => { setPassword(e.target.value); setCoverEyes(true); };
  const onPasswordBlur    = () => setCoverEyes(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError(""); setCry(false); setSpeak(false);

    if (!username || !password) {
      setCry(true); setShake(true);
      setTimeout(()=>setShake(false), 600);
      setError("Please fill username & password.");
      return;
    }
    if (!usernameLooksValid) {
      setSpeak(true); setShake(true);
      setTimeout(()=>setShake(false), 600);
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
        setSpeak(true); setShake(true);
        setTimeout(()=>setShake(false), 600);
      }
    } catch {
      localStorage.setItem("isAdmin", "false");
      localStorage.removeItem("admin_jwt");
      setError("Server error. Try again.");
      setShake(true); setTimeout(()=>setShake(false), 600);
    }
    setSubmitting(false);
  };

  const coverClass = coverEyes
    ? (COVER_MODE === "cover" ? "cover" : "blink")
    : "";

  return (
    // ⬇️ We pass the imported image into CSS as a variable (--photo)
    <div
      className="admin-modal-bg photo"
      style={{ "--photo": `url(${stadium})` }}
      role="dialog" aria-modal="true" tabIndex={-1}
    >
      {/* Decorative floating orbs above photo (kept) */}
      <div className="glass-orbs" aria-hidden>
        <span className="orb orb1" />
        <span className="orb orb2" />
        <span className="orb orb3" />
      </div>

      {/* The glass card UI */}
      <div className="admin-modal tilt">
        {!showCredentials ? (
          <>
            <h2 className="title">Are you an Admin?</h2>
            <div className="row">
              <button className="btn yes" onClick={handleYes}>Yes</button>
              <button className="btn no"  onClick={handleNo}>No</button>
            </div>
          </>
        ) : (
          <form className={`login-card ${shake ? "shake":""}`} onSubmit={handleLogin} autoComplete="off">
            <h3 className="subtitle">Admin Login</h3>

            <input
              type="text"
              placeholder="Admin Username"
              value={username}
              onChange={e=> setUsername(e.target.value)}
              onFocus={onUsernameFocus}
              onBlur={onUsernameBlur}
              className={`inp ${username ? (usernameLooksValid ? "ok":"warn") : ""}`}
              required
            />

            {/* ===== Character between fields ===== */}
            <div
              className={[
                "char-wrap",
                coverClass, sad ? "sad":"", cry ? "cry":"", speak ? "speak":""
              ].join(" ")}
              aria-hidden
            >
              <svg
                className="avatar"
                width="200" height="190" viewBox="0 0 200 190"
                xmlns="http://www.w3.org/2000/svg"
              >
                <defs>
                  <linearGradient id="skin" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%"  stopColor="#FFD7B3"/>
                    <stop offset="100%" stopColor="#E7AD83"/>
                  </linearGradient>
                  <linearGradient id="hair" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#5b3b2f"/>
                    <stop offset="100%" stopColor="#342016"/>
                  </linearGradient>
                  <linearGradient id="shirt" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#6FB2FF"/>
                    <stop offset="100%" stopColor="#2E6BFF"/>
                  </linearGradient>
                  <linearGradient id="pants" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#1E293B"/>
                    <stop offset="100%" stopColor="#0B1220"/>
                  </linearGradient>
                </defs>

                {/* ground shadow */}
                <ellipse cx="100" cy="178" rx="40" ry="7" fill="#000" opacity=".22"/>

                {/* legs + feet */}
                <g fill="url(#pants)">
                  <rect x="72"  y="132" width="18" height="32" rx="8"/>
                  <rect x="110" y="132" width="18" height="32" rx="8"/>
                </g>
                <g fill="#0b1320">
                  <rect x="62"  y="160" width="36" height="11" rx="6"/>
                  <rect x="102" y="160" width="36" height="11" rx="6"/>
                </g>

                {/* body / shirt */}
                <rect x="58" y="84" width="84" height="56" rx="26" fill="url(#shirt)"/>

                {/* arms */}
                <g className="arm arm-left" transform="translate(56 98)">
                  <rect x="0" y="0" width="46" height="14" rx="7" fill="url(#skin)"/>
                  <g className="hand hand-left" transform="translate(38 -2)">
                    <rect width="24" height="22" rx="11" fill="url(#skin)"/>
                    <path d="M5 9 H19 M5 13 H19" stroke="rgba(0,0,0,.1)" strokeWidth="2" strokeLinecap="round"/>
                  </g>
                </g>

                <g className="arm arm-right" transform="translate(98 98)">
                  <rect x="0" y="0" width="46" height="14" rx="7" fill="url(#skin)"/>
                  <g className="hand hand-right" transform="translate(38 -2)">
                    <rect width="24" height="22" rx="11" fill="url(#skin)"/>
                    <path d="M5 9 H19 M5 13 H19" stroke="rgba(0,0,0,.1)" strokeWidth="2" strokeLinecap="round"/>
                  </g>
                </g>

                {/* head */}
                <g transform="translate(56 22)">
                  {/* hair cap */}
                  <rect x="28" y="-2" width="44" height="18" rx="9" fill="url(#hair)"/>
                  {/* face */}
                  <rect x="0" y="14" width="100" height="72" rx="34" fill="url(#skin)"/>

                  {/* eyes (pupils) */}
                  <circle className="eye eye-left"  cx="30" cy="44" r="7" fill="#0f172a"/>
                  <circle className="eye eye-right" cx="70" cy="44" r="7" fill="#0f172a"/>

                  {/* eyelids (real, slide down) */}
                  <rect className="lid lid-left"  x="23" y="36" width="14" height="14" rx="7" fill="url(#skin)"/>
                  <rect className="lid lid-right" x="63" y="36" width="14" height="14" rx="7" fill="url(#skin)"/>

                  {/* tears */}
                  <circle className="tear tear-left"  cx="30" cy="53" r="4.2" fill="#8ee7ff" opacity="0"/>
                  <circle className="tear tear-right" cx="70" cy="53" r="4.2" fill="#8ee7ff" opacity="0"/>

                  {/* mouth */}
                  <rect className="mouth" x="44" y="60" width="12" height="6" rx="3" fill="#1f2937"/>
                </g>
              </svg>

              {/* speech bubble */}
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
              <button className="btn submit" type="submit" disabled={submitting}>
                {submitting ? "Logging in..." : "Login"}
              </button>
              <button className="btn back" type="button" onClick={()=>setShowCredentials(false)} disabled={submitting}>
                Back
              </button>
            </div>

            {error && <div className="error-bar">{error}</div>}
          </form>
        )}
      </div>

      <style>{`
        :root{
          --stroke:rgba(255,255,255,.12);
          --cyan:#00e5ff;
          --violet:#7b61ff;
          --ok:#16d6a7;
          --warn:#ffc857;
          --text:#e9f1ff;
          --ease:cubic-bezier(.22,.61,.36,1);
        }

        /* ===== Fullscreen backdrop with your stadium photo =====
           We paint the image on ::before so we can layer darkening
           gradients above it without extra DOM elements. */
        .admin-modal-bg{
          position:fixed; inset:0; display:flex; align-items:center; justify-content:center;
          overflow:hidden; z-index:99999;
          font-family:Poppins, system-ui, -apple-system, Segoe UI, Roboto, Arial;
        }
        .admin-modal-bg.photo::before{
          content:""; position:absolute; inset:0; z-index:0;
          background:
            linear-gradient(180deg, rgba(6,10,18,.55), rgba(6,10,18,.82)),  /* dimmer for readability */
            radial-gradient(1400px 700px at 80% 40%, rgba(0,0,0,.30), transparent 60%), /* vignette */
            var(--photo) center/cover no-repeat fixed;   /* <- your imported image */
          filter: saturate(1.05) contrast(1.05) brightness(.95);
          transform: scale(1.02); /* slight zoom to avoid edge gaps on small screens */
        }

        /* Decorative floating orbs (above photo, below card) */
        .glass-orbs{ position:absolute; inset:0; z-index:1; pointer-events:none; }
        .glass-orbs .orb{
          position:absolute; border-radius:50%; filter:blur(44px); opacity:.55; mix-blend-mode:screen;
          animation: orb 18s ease-in-out infinite;
        }
        .orb1{ width:360px; height:360px; left:8%; top:12%;
               background:radial-gradient(circle at 30% 30%, #00e5ff, transparent 60%),
                          radial-gradient(circle at 70% 70%, #6f80ff, transparent 60%); }
        .orb2{ width:300px; height:300px; right:12%; top:10%;
               background:radial-gradient(circle at 30% 30%, #ff73fa, transparent 60%),
                          radial-gradient(circle at 70% 70%, #00ffc6, transparent 60%); animation-duration:20s;}
        .orb3{ width:460px; height:460px; right:18%; bottom:10%;
               background:radial-gradient(circle at 30% 30%, #63a3ff, transparent 60%),
                          radial-gradient(circle at 70% 70%, #00e6b9, transparent 60%); animation-duration:22s;}
        @keyframes orb{ 0%,100%{transform:translate(0,0)} 50%{transform:translate(-30px,-22px)} }

        /* ===== 3D glass card ===== */
        .admin-modal{
          position:relative; z-index:2;
          width:min(740px,92vw);
          background:linear-gradient(180deg, rgba(18,26,44,.58), rgba(18,26,44,.42));
          backdrop-filter: blur(18px); -webkit-backdrop-filter: blur(18px);
          border:1px solid var(--stroke); border-radius:22px;
          padding:18px;
          box-shadow:
            0 26px 60px rgba(0,0,0,.36),
            inset 0 1px 0 rgba(255,255,255,.08),
            0 0 0 1px rgba(255,255,255,.06);
          transform-style:preserve-3d; perspective:1000px;
          animation: float3d 9s ease-in-out infinite;
        }
        .admin-modal.tilt:hover{ animation-play-state:paused; transform:rotateX(2deg) rotateY(-2deg); }
        @keyframes float3d{
          0%,100%{ transform: translateY(0) rotateX(0deg) rotateY(0deg) }
          50%{ transform: translateY(-4px) rotateX(1.2deg) rotateY(-1.2deg) }
        }

        .title, .subtitle{
          text-align:center; font-weight:800;
          background:linear-gradient(90deg,var(--cyan),var(--violet));
          -webkit-background-clip:text; background-clip:text; -webkit-text-fill-color:transparent;
          text-shadow: 0 2px 12px rgba(0, 229, 255, .15);
        }
        .title{ font-size:26px; margin:10px 0 14px; }
        .subtitle{ font-size:20px; margin:6px 0 8px; }

        .row{ display:flex; gap:12px; justify-content:center; align-items:center; margin-top:12px; }
        .btn{
          position:relative; border:none; color:#fff; font-weight:700; letter-spacing:.2px;
          padding:.7rem 1.2rem; border-radius:12px; cursor:pointer;
          box-shadow:0 12px 28px rgba(0,0,0,.28), inset 0 0 0 1px rgba(255,255,255,.08);
          transition: transform .15s var(--ease), filter .2s var(--ease);
        }
        .btn::after{
          content:""; position:absolute; inset:0; border-radius:inherit;
          background:linear-gradient(120deg, rgba(255,255,255,.16), transparent 60%);
          mix-blend-mode:overlay; opacity:.0; transition:opacity .25s var(--ease);
        }
        .btn:hover{ transform:translateY(-1px); filter:brightness(1.06) }
        .btn:hover::after{ opacity:.6 }
        .yes{ background:linear-gradient(135deg,#00e0ff,#6a8bff) }
        .no{  background:linear-gradient(135deg,#ff6b6b,#ff5aa0) }
        .submit{ background:linear-gradient(135deg,#00d7b4,#6a8bff) }
        .back{   background:linear-gradient(135deg,#2f394a,#455064) }

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
        .inp:focus{ box-shadow:0 0 0 3px rgba(0,229,255,.25), inset 0 0 0 1px rgba(0,229,255,.6) }
        .inp.ok{   box-shadow: inset 0 0 0 1px rgba(22,214,167,.9), 0 0 0 3px rgba(22,214,167,.25) }
        .inp.warn{ box-shadow: inset 0 0 0 1px rgba(255,200,87,.95), 0 0 0 3px rgba(255,200,87,.25) }

        .error-bar{
          margin-top:12px; text-align:center; padding:.7rem 1rem; border-radius:10px;
          color:#3c2a00; background:#ffecec; box-shadow: inset 0 0 0 1px rgba(255,107,107,.35);
        }

        /* ===== Character ===== */
        .char-wrap{ position:relative; height:190px; display:flex; align-items:center; justify-content:center; }
        .avatar{ overflow:visible; }
        .arm, .hand, .eye, .mouth, .tear, .lid { transform-box: fill-box; transform-origin: center; }

        /* arm joints */
        .arm-left  { transform-origin: 6px 7px; }
        .arm-right { transform-origin: 6px 7px; }
        .hand-left, .hand-right { transform-origin: 50% 50%; }
        .arm-left, .arm-right, .hand-left, .hand-right { transition: transform .28s var(--ease); }

        /* Cover-eyes pose (if COVER_MODE === "cover") */
        .char-wrap.cover .arm-left  { transform: rotate(-70deg); }
        .char-wrap.cover .arm-right { transform: rotate( 70deg); }
        .char-wrap.cover .hand-left  { transform: translateX(25px) translateY(-25px) scale(1.5); }
        .char-wrap.cover .hand-right { transform: translateX(-25px) translateY(-25px) scale(1.5); }

        /* True eyelids: start tucked above pupils, slide down on blink */
        .lid{ transform: translateY(-16px); transition: transform .22s var(--ease); }
        .char-wrap.blink .lid{ transform: translateY(0px); } /* fully covers pupils */

        /* Still show a thin line when closed for clarity */
        .char-wrap.blink .eye{ transform: scaleY(.1) translateY(3px); transition: transform .18s var(--ease); }

        /* Sad */
        .char-wrap.sad .eye{ transform: translateY(2px) scaleY(.75); }
        .char-wrap.sad .mouth{ transform: translateY(2px) rotate(180deg); }

        /* Cry */
        .char-wrap.cry .mouth{ width:10px; height:10px; rx:5px; transform:translateY(-2px); }
        .char-wrap.cry .tear{ opacity:1; animation: tear 1s ease-in infinite; }
        @keyframes tear{ 0%{ transform:translateY(0); opacity:0 } 10%{opacity:1} 100%{ transform:translateY(42px); opacity:0 } }

        /* Speech bubble */
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
