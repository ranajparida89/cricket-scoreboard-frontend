// src/components/AdminPromptModal.jsx
// 05-JULY-2025 RANAJ PARIDA -- JWT admin login support (logic kept intact)

import React, { useMemo, useState } from "react";

export default function AdminPromptModal({ onAdminResponse }) {
  const [showCredentials, setShowCredentials] = useState(false);
  const [username, setUsername]         = useState("");
  const [password, setPassword]         = useState("");
  const [submitting, setSubmitting]     = useState(false);
  const [error, setError]               = useState("");

  // UI/animation state (purely visual – does not touch logic/endpoints)
  const [eyeCover, setEyeCover]         = useState(false);
  const [isSad, setIsSad]               = useState(false);
  const [cry, setCry]                   = useState(false);
  const [shake, setShake]               = useState(false);
  const [speak, setSpeak]               = useState(false);

  // Step 1: If "No", just close modal as normal user
  const handleNo = () => {
    localStorage.setItem("isAdmin", "false");
    // 🔒 05-JULY-2025 JWT CHANGE: Always clear JWT token if declining admin access
    localStorage.removeItem("admin_jwt");
    onAdminResponse(false);
  };

  // Step 2: If "Yes", show admin login fields
  const handleYes = () => setShowCredentials(true);

  // Validation helpers (visual only)
  const usernameLooksValid = useMemo(() => {
    if (!username) return false;
    // allow either email-like or simple alphanumeric/underscore min 3
    const emailLike = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(username);
    const simple    = /^[a-zA-Z0-9_]{3,}$/.test(username);
    return emailLike || simple;
  }, [username]);

  // event wiring for character
  const onUsernameBlur = () => {
    // If user skips username and goes to password, make face sad
    if (!username) setIsSad(true);
  };

  const onPasswordFocus = () => {
    if (!username) setIsSad(true);
    // Hands move while typing; we start the pose on focus for snappier feel
    setEyeCover(true);
  };
  const onPasswordChange = (e) => {
    setPassword(e.target.value);
    setEyeCover(true);
  };
  const onPasswordBlur = () => setEyeCover(false);
  const onUsernameFocus = () => {
    setIsSad(false);
    setSpeak(false);
  };

  // Step 3: Handle form submit for admin login (logic unchanged)
  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setCry(false);
    setSpeak(false);

    // Visual validation / feedback before hitting server
    if (!username || !password) {
      // empty form -> cry and shake
      setCry(true);
      setShake(true);
      setTimeout(() => setShake(false), 600);
      setError("Please fill username & password.");
      return;
    }
    if (!usernameLooksValid) {
      // invalid username -> speech bubble
      setSpeak(true);
      setShake(true);
      setTimeout(() => setShake(false), 600);
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
        // 🔒 Save JWT token for future API calls
        localStorage.setItem("isAdmin", "true");
        localStorage.setItem("admin_jwt", data.token);
        onAdminResponse(true);
      } else {
        // 🔒 Remove JWT on failure
        localStorage.setItem("isAdmin", "false");
        localStorage.removeItem("admin_jwt");
        setError(data.error || "Invalid credentials.");
        // face reacts as "speaking" to wrong username
        setSpeak(true);
        setShake(true);
        setTimeout(() => setShake(false), 600);
      }
    } catch (e) {
      // 🔒 Remove JWT on error
      localStorage.setItem("isAdmin", "false");
      localStorage.removeItem("admin_jwt");
      setError("Server error. Try again.");
      setShake(true);
      setTimeout(() => setShake(false), 600);
    }
    setSubmitting(false);
  };

  return (
    <div className="admin-modal-bg" role="dialog" aria-modal="true" tabIndex={-1}>
      <div className={`glass-stage`}>
        {/* floating color orbs */}
        <div className="orb orb-a" aria-hidden />
        <div className="orb orb-b" aria-hidden />
        <div className="orb orb-c" aria-hidden />
      </div>

      <div className={`admin-modal3d ${showCredentials ? "rolling" : ""}`}>
        <div className="float-3d">
          {!showCredentials ? (
            <div className="prompt-card">
              <h2 className="admin-modal-title grad-text">Are you an Admin?</h2>
              <div className="admin-modal-btns">
                <button className="btn-neo yes" onClick={handleYes}>Yes</button>
                <button className="btn-neo no" onClick={handleNo}>No</button>
              </div>
            </div>
          ) : (
            <form
              className={`admin-login-form fx-form ${shake ? "shake" : ""}`}
              onSubmit={handleLogin}
              autoComplete="off"
              noValidate
            >
              <h3 className="grad-text sm">Admin Login</h3>

              {/* Username */}
              <input
                type="text"
                placeholder="Admin Username"
                value={username}
                onChange={(e) => { setUsername(e.target.value); setIsSad(false); }}
                onBlur={onUsernameBlur}
                onFocus={onUsernameFocus}
                className={`fx-input ${username ? (usernameLooksValid ? "ok" : "warn") : ""}`}
                required
              />

              {/* === Character sits exactly between username & password === */}
              <div
                className={[
                  "character-wrap",
                  eyeCover ? "cover-eyes" : "",
                  isSad ? "sad" : "",
                  cry ? "cry" : "",
                  speak ? "speak" : "",
                ].join(" ")}
                aria-hidden
              >
                <div className="char">
                  {/* legs / feet */}
                  <div className="legs">
                    <div className="leg left"><span className="foot" /></div>
                    <div className="leg right"><span className="foot" /></div>
                  </div>

                  {/* body */}
                  <div className="body">
                    <div className="shirt" />
                  </div>

                  {/* arms */}
                  <div className="arm left">
                    <span className="hand hand-left" />
                  </div>
                  <div className="arm right">
                    <span className="hand hand-right" />
                  </div>

                  {/* head */}
                  <div className="head">
                    <div className="hair" />
                    <div className="face">
                      <div className="eye eye-left">
                        <span className="tear tear-left" />
                      </div>
                      <div className="eye eye-right">
                        <span className="tear tear-right" />
                      </div>
                      <div className="mouth" />
                    </div>
                  </div>
                </div>

                {/* speech bubble (invalid username) */}
                <div className="speech">No No put correct username</div>
              </div>

              {/* Password */}
              <input
                type="password"
                placeholder="Admin Password"
                value={password}
                onFocus={onPasswordFocus}
                onChange={onPasswordChange}
                onBlur={onPasswordBlur}
                className="fx-input"
                required
              />

              {/* Submit & Back */}
              <div className="admin-modal-btns">
                <button className="btn-neo submit" type="submit" disabled={submitting}>
                  <span className="shine" />
                  {submitting ? "Logging in..." : "Login"}
                </button>
                <button
                  className="btn-neo back"
                  type="button"
                  onClick={() => setShowCredentials(false)}
                  disabled={submitting}
                >
                  Back
                </button>
              </div>

              {error && <div className="hint error">{error}</div>}
            </form>
          )}
        </div>
      </div>

      {/* Inline CSS only for this modal/component */}
      <style>{`
        :root{
          --glass:#0f172a7a;
          --glass-2:#152238a6;
          --stroke:rgba(255,255,255,.14);
          --cyan:#00e5ff;
          --blue:#6c8cff;
          --purple:#a36bff;
          --ok:#1ad19a;
          --warn:#ffc857;
          --err:#ff6b6b;
          --text:#e8f0ff;
          --ease:cubic-bezier(.22,.61,.36,1);
          --ease2:cubic-bezier(.23,1,.32,1);
          --shadow:0 10px 40px rgba(0,0,0,.35);
        }
        @keyframes floaty { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-6px)} }
        @keyframes orbMove { 0%{transform:translate(0,0)} 50%{transform:translate(40px,-30px)} 100%{transform:translate(0,0)} }
        @keyframes shine { from{transform:translateX(-150%)} to{transform:translateX(150%)} }
        @keyframes tearFall { 0%{ transform:translateY(0); opacity:0 } 10%{opacity:1} 100%{ transform:translateY(38px); opacity:0 } }
        @keyframes shake { 0%,100%{transform:translateX(0)} 20%{transform:translateX(-10px)} 40%{transform:translateX(8px)} 60%{transform:translateX(-6px)} 80%{transform:translateX(4px)} }
        @keyframes fadeIn { from { opacity:0; } to { opacity:1; } }

        .admin-modal-bg{
          position:fixed; inset:0; display:flex; align-items:center; justify-content:center;
          background:linear-gradient(135deg,#0b1220,#0b1220) no-repeat;
          overflow:hidden; z-index:99999; animation:fadeIn .25s var(--ease);
          font-family:"Poppins",system-ui,-apple-system,Segoe UI,Roboto,Arial;
        }

        .glass-stage .orb{
          position:absolute; filter:blur(40px); opacity:.65; mix-blend-mode:screen; z-index:0;
          border-radius:50%;
          animation:orbMove 10s var(--ease2) infinite;
        }
        .glass-stage .orb-a{ width:360px; height:360px; left:8%; top:12%;
          background:radial-gradient(circle at 30% 30%, #00d1ff, transparent 60%),
                     radial-gradient(circle at 70% 70%, #7b61ff, transparent 60%);
          animation-duration: 16s;
        }
        .glass-stage .orb-b{ width:300px; height:300px; right:12%; top:8%;
          background:radial-gradient(circle at 30% 30%, #ff73fa, transparent 60%),
                     radial-gradient(circle at 70% 70%, #00ffee, transparent 60%);
          animation-duration: 18s;
        }
        .glass-stage .orb-c{ width:420px; height:420px; right:18%; bottom:10%;
          background:radial-gradient(circle at 30% 30%, #63a3ff, transparent 60%),
                     radial-gradient(circle at 70% 70%, #00ffc6, transparent 60%);
          animation-duration: 22s;
        }

        .admin-modal3d{
          position:relative; z-index:2; perspective:1200px;
        }
        .float-3d{
          transform:rotateX(.5deg) rotateY(-.5deg);
          animation: floaty 5.5s ease-in-out infinite;
        }
        .prompt-card,.fx-form{
          background:linear-gradient(180deg, rgba(15,23,42,.64), rgba(21,34,56,.64));
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
          border:1px solid var(--stroke);
          border-radius:22px;
          box-shadow: var(--shadow);
          padding:24px 24px 22px;
          width:min(680px,92vw);
          margin:auto;
        }

        .prompt-card{ text-align:center }
        .grad-text{
          background:linear-gradient(90deg, var(--cyan), var(--purple));
          -webkit-background-clip:text; background-clip:text;
          -webkit-text-fill-color:transparent;
          text-fill-color:transparent;
        }
        .admin-modal-title{ font-size:28px; margin:10px 0 18px; }

        .admin-modal-btns{ display:flex; gap:14px; justify-content:center; margin-top:14px; }
        .btn-neo{
          position:relative; border:none; color:white; font-weight:700; letter-spacing:.2px;
          padding:.7rem 1.35rem; border-radius:12px; cursor:pointer; outline:none;
          box-shadow: 0 6px 20px rgba(0,0,0,.35), inset 0 0 0 1px rgba(255,255,255,.08);
          transition: transform .15s var(--ease), filter .2s var(--ease), box-shadow .2s var(--ease);
          overflow:hidden;
        }
        .btn-neo .shine{
          position:absolute; inset:0; pointer-events:none;
          background:linear-gradient(110deg, transparent 40%, rgba(255,255,255,.35) 50%, transparent 60%);
          transform:translateX(-150%); animation:shine 2.8s ease-in-out infinite;
        }
        .btn-neo:hover{ transform:translateY(-1px); filter:brightness(1.06) }
        .btn-neo:active{ transform:translateY(0) scale(.98) }

        .yes{ background:linear-gradient(135deg,#00e0ff,#6a8bff) }
        .no{ background:linear-gradient(135deg,#ff6b6b,#ff5aa0) }
        .submit{ background:linear-gradient(135deg,#00dbb6,#6c8cff) }
        .back{ background:linear-gradient(135deg,#313a49,#414b5e) }

        .fx-form h3.sm{ margin:0 0 10px; font-size:22px; text-align:center }
        .fx-input{
          width:100%; border:none; outline:none; color:var(--text);
          border-radius:14px; padding:.9rem 1rem; font-size:1rem;
          background:linear-gradient(180deg, rgba(255,255,255,.06), rgba(255,255,255,.03));
          box-shadow: inset 0 0 0 1px rgba(255,255,255,.12);
          transition: box-shadow .2s var(--ease), background .25s var(--ease);
        }
        .fx-input:focus{
          box-shadow: 0 0 0 3px rgba(0,229,255,.25), inset 0 0 0 1px rgba(0,229,255,.6);
          background:linear-gradient(180deg, rgba(255,255,255,.1), rgba(255,255,255,.05));
        }
        .fx-input.ok{ box-shadow: inset 0 0 0 1px rgba(26,209,154,.8), 0 0 0 3px rgba(26,209,154,.25) }
        .fx-input.warn{ box-shadow: inset 0 0 0 1px rgba(255,200,87,.9), 0 0 0 3px rgba(255,200,87,.25) }

        .hint.error{ color:#ffd86b; margin-top:10px; text-align:center }

        .fx-form.shake{ animation:shake .6s var(--ease) }

        /* ================= CHARACTER ================= */
        .character-wrap{
          position:relative; height:140px; margin:8px 2px 14px;
          display:flex; align-items:flex-end; justify-content:center;
          perspective:800px;
        }
        .char{ position:relative; transform:translateZ(20px); }

        /* legs/feet */
        .legs{ display:flex; gap:16px; justify-content:center; transform:translateY(22px); }
        .leg{ width:14px; height:46px; border-radius:8px; background:linear-gradient(180deg,#1f2937,#0f172a);
              box-shadow:inset 0 1px 0 rgba(255,255,255,.12); position:relative; }
        .leg.left{ transform:translateX(-8px) }
        .leg.right{ transform:translateX(8px) }
        .foot{ position:absolute; bottom:-8px; left:50%; transform:translateX(-50%); width:32px; height:12px;
               background:linear-gradient(180deg,#0d1320,#0b1220); border-radius:10px; box-shadow:0 2px 0 rgba(0,0,0,.25) }

        /* body/shirt */
        .body{ position:absolute; left:50%; top:18px; transform:translateX(-50%); }
        .shirt{ width:120px; height:70px; border-radius:18px 18px 26px 26px;
                background:linear-gradient(180deg,#49a2ff,#296bff); box-shadow:inset 0 8px 14px rgba(255,255,255,.12), 0 6px 18px rgba(0,0,0,.25) }

        /* arms */
        .arm{ position:absolute; top:26px; width:60px; height:18px; transform-origin:10px 9px; }
        .arm.left{ left:calc(50% - 64px); }
        .arm.right{ right:calc(50% - 64px); }
        .arm::before{
          content:""; position:absolute; left:0; top:0; width:60px; height:16px; border-radius:10px;
          background:linear-gradient(180deg,#f7c7a6,#e7a37c);
          box-shadow:inset 0 1px 0 rgba(255,255,255,.6), 0 2px 6px rgba(0,0,0,.18);
        }

        /* hands (4-finger mitts) */
        .hand{ position:absolute; right:-2px; top:-4px; width:30px; height:26px; border-radius:14px;
               background:linear-gradient(180deg,#f5c09b,#e5a47e);
               box-shadow:inset 0 1px 0 rgba(255,255,255,.6), 0 2px 6px rgba(0,0,0,.18);
               transform-origin:center;
        }
        .hand::after{
          /* finger grooves hint */
          content:""; position:absolute; inset:6px 5px auto 5px; height:2px;
          background:linear-gradient(90deg, rgba(0,0,0,.10), rgba(255,255,255,.2), rgba(0,0,0,.10));
          border-radius:2px; box-shadow: 0 6px 0 rgba(0,0,0,.08), 0 12px 0 rgba(0,0,0,.06);
        }

        /* head / hair / face */
        .head{ position:absolute; left:50%; top:-16px; transform:translateX(-50%); }
        .hair{
          width:86px; height:28px; border-radius:16px 16px 6px 6px; margin:0 auto 2px;
          background:linear-gradient(180deg,#5c4033,#3b241a);
          box-shadow:inset 0 6px 10px rgba(255,255,255,.06), 0 4px 10px rgba(0,0,0,.25)
        }
        .face{
          position:relative; width:86px; height:72px; border-radius:32px;
          background:radial-gradient(110% 120% at 50% 0%, #ffd7b1 0%, #f4b992 55%, #eaa881 100%);
          box-shadow: inset 0 4px 10px rgba(255,255,255,.35), 0 10px 24px rgba(0,0,0,.25);
        }
        .eye{
          position:absolute; top:26px; width:12px; height:12px; background:#0f172a; border-radius:50%;
          box-shadow: 0 0 0 2px rgba(255,255,255,.6) inset, 0 2px 0 rgba(0,0,0,.2);
        }
        .eye-left{ left:24px }
        .eye-right{ right:24px }
        .mouth{
          position:absolute; left:50%; bottom:18px; transform:translateX(-50%);
          width:26px; height:8px; border-radius:0 0 16px 16px; background:#1f2937;
          box-shadow:inset 0 -2px 0 rgba(255,255,255,.28);
          transition: all .25s var(--ease);
        }

        /* tears aligned from both eyes */
        .tear{
          position:absolute; left:50%; top:10px; width:8px; height:8px; transform:translateX(-50%);
          background:radial-gradient(circle at 30% 30%, #fff, #a4e9ff 50%, #00e5ff 80%);
          border-radius:50%;
          opacity:0;
        }
        .character-wrap.cry .tear{
          animation: tearFall .9s var(--ease) infinite;
        }
        .tear-left{ }
        .tear-right{ }

        /* Sad face – droopy eyes + upside-down mouth */
        .character-wrap.sad .eye{
          height:10px; width:12px; border-radius: 12px 12px 6px 6px / 10px 10px 6px 6px;
          transform: translateY(2px);
        }
        .character-wrap.sad .mouth{
          height:18px; width:22px; border-radius:18px 18px 36px 36px;
          transform:translateX(-50%) rotate(180deg);
        }

        /* Cry mouth (small round) */
        .character-wrap.cry .mouth{
          width:12px; height:12px; border-radius:50%;
          bottom:20px; background:#0f172a;
        }

        /* Speak bubble (invalid username) */
        .speech{
          position:absolute; left:50%; top:-10px; transform:translate(-50%,-100%);
          background:rgba(25,35,58,.85); backdrop-filter:blur(6px);
          border:1px solid rgba(255,255,255,.18); color:#fff; font-weight:700; font-size:.85rem;
          padding:.55rem .8rem; border-radius:12px; box-shadow:var(--shadow);
          opacity:0; pointer-events:none; transition:opacity .2s var(--ease), transform .2s var(--ease);
          white-space:nowrap;
        }
        .speech::after{
          content:""; position:absolute; left:50%; bottom:-8px; transform:translateX(-50%);
          width:12px; height:12px; background:inherit; border:inherit; border-top:none; border-left:none;
          rotate:45deg;
        }
        .character-wrap.speak .speech{ opacity:1; transform:translate(-50%,-110%) }

        /* === Cover eyes pose === */
        .character-wrap.cover-eyes .arm.left{
          transform: rotate(-70deg) translate(4px, -6px);
        }
        .character-wrap.cover-eyes .arm.right{
          transform: rotate(70deg) translate(-4px, -6px);
        }
        .character-wrap.cover-eyes .hand-left{
          transform: translateX(25px) translateY(-25px) scale(1.5);
        }
        .character-wrap.cover-eyes .hand-right{
          transform: translateX(-25px) translateY(-25px) scale(1.5);
        }

        /* micro spacing / layout */
        .admin-modal-btns .btn-neo{ min-width:118px }

        /* gradient title above prompt had same selectors; keep original tiny modal buttons color mapping */
        .rolling .prompt-card{ transform:rotateX(0) }

        /* keep a small safety on ultra-small widths */
        @media (max-width:420px){
          .fx-form, .prompt-card{ padding:18px 16px 16px }
          .speech{ font-size:.78rem }
        }
      `}</style>
    </div>
  );
}
