// ✅ src/components/TeamDistributor.js
// [2025-08-05 rev6 - FULL FILE]
// - Animated Toast (pop-in/out, icon, progress, close)
// - Robust show/hide lifecycle using `visible` flag
// - Same wheel/confetti logic as rev5

import React, { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import "./TeamDistributor.css";

const WHEEL_SIZE = 360;
const WHEEL_MARGIN = 12;
const randBetween = (min, max) => Math.random() * (max - min) + min;
const shuffle = (arr) => {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

// Mount a dedicated container and only portal after mount
function useToastContainer() {
  const [container, setContainer] = useState(null);

  useEffect(() => {
    let el = document.getElementById("td-toasts-root");
    if (!el) {
      el = document.createElement("div");
      el.id = "td-toasts-root";
      el.style.position = "fixed";
      el.style.top = "0";
      el.style.right = "0";
      el.style.width = "0";
      el.style.height = "0";
      el.style.zIndex = "2147483647";
      document.body.appendChild(el);
    }
    setContainer(el);
    return () => {
      // If you want to remove on unmount, uncomment:
      // document.body.removeChild(el);
    };
  }, []);

  return container;
}

function ToastPortal({ toasts, onClose }) {
  const container = useToastContainer();
  if (!container) return null; // wait until after mount
  return createPortal(
    <div className="td-toasts" role="region" aria-live="polite" aria-atomic="true">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`td-toast ${t.type} ${t.visible ? "show" : ""}`}
          role="alert"
        >
          <button
            className="td-toast-close"
            aria-label="Dismiss notification"
            onClick={() => onClose(t.id)}
          >
            ×
          </button>
          <div className="td-toast-icon">✅</div>
          <div className="td-toast-body">
            <div className="td-toast-title">Assigned!</div>
            <div
              className="td-toast-msg"
              // You can switch to plain text if you prefer (and remove dangerouslySetInnerHTML)
              dangerouslySetInnerHTML={{ __html: t.message }}
            />
          </div>
          <div className="td-toast-progress" />
        </div>
      ))}
    </div>,
    container
  );
}

export default function TeamDistributor() {
  // ---------- Players ----------
  const [players, setPlayers] = useState([]);
  const [playerInput, setPlayerInput] = useState("");

  // ---------- Team input (single block) ----------
  const [teamType, setTeamType] = useState("Weak");
  const [teamNamesRaw, setTeamNamesRaw] = useState("");
  const [weakPool, setWeakPool] = useState([]);
  const [strongPool, setStrongPool] = useState([]);

  useEffect(() => {
    const src = teamType === "Weak" ? weakPool : strongPool;
    setTeamNamesRaw(src.join("\n"));
  }, [teamType, weakPool, strongPool]);

  const parseLines = (raw) =>
    raw.split(/[\n,]/g).map((s) => s.trim()).filter(Boolean);

  const buildPool = () => {
    const list = [...new Set(parseLines(teamNamesRaw))];
    if (teamType === "Weak") setWeakPool(list);
    else setStrongPool(list);
  };

  // ---------- Spin engine ----------
  const canvasRef = useRef(null);
  const confettiRef = useRef(null);
  const [isSpinning, setIsSpinning] = useState(false);
  const [angle, setAngle] = useState(0);
  const [targetAngle, setTargetAngle] = useState(0);

  const currentPool = teamType === "Weak" ? weakPool : strongPool;
  const setCurrentPool = teamType === "Weak" ? setWeakPool : setStrongPool;

  const playerNames = useMemo(
    () => players.map((p) => p.name).filter(Boolean),
    [players]
  );
  const [orderQueue, setOrderQueue] = useState([]);
  const [turnPtr, setTurnPtr] = useState(0);
  const currentPlayer = orderQueue[turnPtr] || "";

  useEffect(() => {
    if (playerNames.length === 0) {
      setOrderQueue([]);
      setTurnPtr(0);
      return;
    }
    if (orderQueue.length - turnPtr <= 1) {
      setOrderQueue((prev) => [...prev, ...shuffle(playerNames)]);
    }
  }, [playerNames, orderQueue.length, turnPtr]);

  useEffect(() => {
    setOrderQueue(shuffle(playerNames));
    setTurnPtr(0);
  }, [playerNames.join("|")]);

  const teamsForWheel = currentPool.filter(Boolean);

  // ---------- Color helpers ----------
  const shade = (hex, pct) => {
    const f = parseInt(hex.replace("#", ""), 16);
    const t = pct < 0 ? 0 : 255;
    const p = Math.abs(pct);
    const R = f >> 16, G = (f >> 8) & 0xff, B = f & 0xff;
    const v = (c) => Math.round((t - c) * p) + c;
    return `#${(0x1000000 + (v(R) << 16) + (v(G) << 8) + (v(B))).toString(16).slice(1)}`;
  };

  const hslToHex = (h, s, l) => {
    s /= 100; l /= 100;
    const k = (n) => (n + h / 30) % 12;
    const a = s * Math.min(l, 1 - l);
    const f = (n) => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
    const toHex = (x) => Math.round(255 * x).toString(16).padStart(2, "0");
    return `#${toHex(f(0))}${toHex(f(8))}${toHex(f(4))}`;
  };

  const segBaseHex = (i, n) => {
    const startHue = teamType === "Weak" ? 270 : 170;
    const hue = (startHue + (360 * i) / n) % 360;
    return hslToHex(hue, 70, 45);
  };

  // ---------- Drawing ----------
  useEffect(() => {
    const cvs = canvasRef.current;
    if (!cvs) return;
    const ctx = cvs.getContext("2d");

    const dpr = window.devicePixelRatio || 1;
    const size = WHEEL_SIZE;
    cvs.width = size * dpr;
    cvs.height = size * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const w = size, h = size, cx = w / 2, cy = h / 2, r = Math.min(w, h) / 2 - WHEEL_MARGIN;

    if (confettiRef.current) {
      const c2 = confettiRef.current;
      c2.width = size * dpr;
      c2.height = size * dpr;
      const c2ctx = c2.getContext("2d");
      c2ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      c2ctx.clearRect(0, 0, size, size);
    }

    ctx.clearRect(0, 0, w, h);

    const ringGrad = ctx.createRadialGradient(cx, cy, r - 24, cx, cy, r + 18);
    ringGrad.addColorStop(0, "#0b0f14");
    ringGrad.addColorStop(1, "#26313c");
    ctx.fillStyle = ringGrad;
    ctx.beginPath();
    ctx.arc(cx, cy, r + 10, 0, Math.PI * 2);
    ctx.fill();

    ctx.save();
    ctx.shadowColor = "rgba(0,0,0,0.6)";
    ctx.shadowBlur = 18;

    const n = Math.max(teamsForWheel.length, 1);
    const slice = (Math.PI * 2) / n;

    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(angle);

    for (let i = 0; i < n; i++) {
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.arc(0, 0, r, i * slice, (i + 1) * slice);
      ctx.closePath();

      const base = teamsForWheel.length ? segBaseHex(i, n) : "#777";
      const segGrad = ctx.createLinearGradient(-r, -r, r, r);
      segGrad.addColorStop(0, shade(base, -0.14));
      segGrad.addColorStop(0.5, shade(base, 0.05));
      segGrad.addColorStop(1, shade(base, 0.15));
      ctx.fillStyle = segGrad;
      ctx.fill();

      ctx.strokeStyle = "rgba(0,0,0,0.55)";
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.save();
      ctx.rotate(i * slice);
      ctx.beginPath();
      ctx.moveTo(r - 10, 0);
      ctx.lineTo(r, 0);
      ctx.strokeStyle = "rgba(255,255,255,0.18)";
      ctx.lineWidth = 3;
      ctx.stroke();
      ctx.restore();

      const label = teamsForWheel[i] || "—";
      ctx.save();
      ctx.rotate(i * slice + slice / 2);
      ctx.textAlign = "right";
      ctx.fillStyle = "#fff";
      ctx.font =
        "600 15px ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Roboto, Arial";
      ctx.fillText(label, r - 14, 5);
      ctx.restore();
    }
    ctx.restore();
    ctx.restore();

    ctx.beginPath();
    ctx.arc(cx, cy, 40, 0, Math.PI * 2);
    ctx.fillStyle = "#0b0f14";
    ctx.fill();
    ctx.lineWidth = 4;
    ctx.strokeStyle = teamType === "Weak" ? "#7c4dff" : "#20c997";
    ctx.stroke();

    const gloss = ctx.createLinearGradient(cx, cy - 40, cx, cy + 40);
    gloss.addColorStop(0, "rgba(255,255,255,0.22)");
    gloss.addColorStop(0.5, "rgba(255,255,255,0.05)");
    gloss.addColorStop(1, "rgba(255,255,255,0)");
    ctx.beginPath();
    ctx.arc(cx, cy, 38, 0, Math.PI * 2);
    ctx.strokeStyle = gloss;
    ctx.lineWidth = 2;
    ctx.stroke();

    const tipY = cy + r - 6;
    const baseY = tipY + 24;
    ctx.fillStyle = "#ffc107";
    ctx.strokeStyle = "#111";
    ctx.lineWidth = 2;

    ctx.beginPath();
    ctx.moveTo(cx, tipY);
    ctx.lineTo(cx - 16, baseY);
    ctx.lineTo(cx + 16, baseY);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(cx, baseY);
    ctx.lineTo(cx, baseY + 16);
    ctx.strokeStyle = "#ffc107";
    ctx.lineWidth = 5;
    ctx.stroke();
  }, [teamsForWheel, angle, teamType]);

  // ---------- Toasts ----------
  const [toasts, setToasts] = useState([]);

  const removeToast = (id) =>
    setToasts((arr) => arr.filter((x) => x.id !== id));

  const pushToast = (message, type = "success", timeout = 3000) => {
    const id = Math.random().toString(36).slice(2);
    // Insert hidden
    setToasts((arr) => [...arr, { id, message, type, visible: false, timeout }]);

    // Make it visible on next tick for enter animation
    setTimeout(() => {
      setToasts((arr) => arr.map((t) => (t.id === id ? { ...t, visible: true } : t)));
    }, 10);

    // Start exit slightly before removal so CSS can animate
    const exitAt = timeout - 350;
    setTimeout(() => {
      setToasts((arr) => arr.map((t) => (t.id === id ? { ...t, visible: false } : t)));
    }, Math.max(600, exitAt));

    // Remove after timeout
    setTimeout(() => removeToast(id), Math.max(900, timeout));
  };

  const closeToastNow = (id) => {
    setToasts((arr) => arr.map((t) => (t.id === id ? { ...t, visible: false } : t)));
    setTimeout(() => removeToast(id), 320);
  };

  // ---------- Confetti ----------
  const fireConfetti = (x, y) => {
    const canvas = confettiRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const particles = Array.from({ length: 60 }).map(() => ({
      x, y,
      vx: randBetween(-3, 3),
      vy: randBetween(-6, -2),
      g: 0.15,
      life: randBetween(40, 70),
      size: randBetween(3, 6),
      hue: Math.floor(randBetween(0, 360)),
    }));

    let frame = 0;
    const animate = () => {
      frame++;
      ctx.clearRect(0, 0, WHEEL_SIZE, WHEEL_SIZE);
      particles.forEach((p) => {
        p.vy += p.g;
        p.x += p.vx;
        p.y += p.vy;
        p.life -= 1;
        ctx.fillStyle = `hsl(${p.hue}, 85%, 60%)`;
        ctx.fillRect(p.x, p.y, p.size, p.size);
      });
      if (frame < 80) requestAnimationFrame(animate);
      else ctx.clearRect(0, 0, WHEEL_SIZE, WHEEL_SIZE);
    };
    animate();
  };

  // ---------- Spin / Assign ----------
  const [assignments, setAssignments] = useState({ Weak: {}, Strong: {} });

  const spin = () => {
    if (isSpinning || teamsForWheel.length === 0 || !currentPlayer) return;

    const n = teamsForWheel.length;
    const selectedIndex = Math.floor(Math.random() * n);
    const slice = (Math.PI * 2) / n;

    const pointerAngle = Math.PI / 2;
    const segmentCenter = selectedIndex * slice + slice / 2;

    const bigSpins = Math.floor(randBetween(3, 6)) * (Math.PI * 2);
    const endAngle = bigSpins + (pointerAngle - segmentCenter);

    setTargetAngle(endAngle);
    setIsSpinning(true);

    const duration = 2600;
    const start = performance.now();
    const step = (t) => {
      const p = Math.min(1, (t - start) / duration);
      const ease = 1 - Math.pow(1 - p, 3);
      setAngle((prev) => prev + (endAngle - prev) * ease);
      if (p < 1) requestAnimationFrame(step);
      else {
        setIsSpinning(false);
        finalizeSpin();
      }
    };
    requestAnimationFrame(step);
  };

  const finalizeSpin = () => {
    if (teamsForWheel.length === 0) return;
    const n = teamsForWheel.length;
    const slice = (Math.PI * 2) / n;

    const pointerAngle = Math.PI / 2;
    const normalized =
      ((pointerAngle - angle) % (Math.PI * 2) + Math.PI * 2) % (Math.PI * 2);
    const index = Math.floor(normalized / slice);
    const team = teamsForWheel[index];

    const p = currentPlayer || "Unknown";
    setAssignments((prev) => {
      const bucket = prev[teamType] || {};
      const list = bucket[p] ? [...bucket[p], team] : [team];
      return { ...prev, [teamType]: { ...bucket, [p]: list } };
    });

    setCurrentPool((prev) => {
      const i = prev.indexOf(team);
      return i === -1 ? prev : prev.slice(0, i).concat(prev.slice(i + 1));
    });

    setTurnPtr((prev) => prev + 1);

    // Celebrate the assignment (HTML for bold labels)
    pushToast(`<strong>${team}</strong> assigned to <strong>${p}</strong>`, "success");
    const r = WHEEL_SIZE / 2 - WHEEL_MARGIN;
    const tipX = WHEEL_SIZE / 2;
    const tipY = WHEEL_SIZE / 2 + r - 6;
    fireConfetti(tipX, tipY);
  };

  // ---------- Helpers ----------
  const addPlayer = () => {
    const name = (playerInput || "").trim();
    if (!name) return;
    if (players.find((p) => p.name.toLowerCase() === name.toLowerCase())) return;
    setPlayers((prev) => [...prev, { name }]);
    setPlayerInput("");
  };
  const removePlayer = (name) =>
    setPlayers((prev) => prev.filter((p) => p.name !== name));
  const canSpin = teamsForWheel.length > 0 && !isSpinning && currentPlayer;
  const downloadPDF = () => window.print();

  return (
    <div className="container mt-4 teamdist">
      {/* Header */}
      <div className="card bg-dark text-white shadow mb-4 not-print">
        <div className="card-body d-flex justify-content-between align-items-center">
          <h3 className="m-0">🎡 Team Distributor</h3>
          <div className="small text-muted">
            Phase: <span className="badge bg-info">{teamType}</span>
          </div>
        </div>
      </div>

      <div className="row g-3 not-print">
        {/* Players */}
        <div className="col-lg-4">
          <div className="card bg-dark text-white shadow h-100">
            <div className="card-body">
              <h5 className="text-info">Players / Boards</h5>
              <div className="d-flex gap-2 mt-2">
                <input
                  className="form-control bg-dark text-white"
                  placeholder="Enter name (e.g., Ranaj)"
                  value={playerInput}
                  onChange={(e) => setPlayerInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && addPlayer()}
                />
                <button className="btn btn-outline-light" onClick={addPlayer}>
                  Add
                </button>
              </div>

              <ul className="list-group list-group-flush mt-3">
                {players.map((p) => (
                  <li
                    key={p.name}
                    className="list-group-item bg-dark text-white d-flex justify-content-between align-items-center"
                  >
                    {p.name}
                    <button
                      className="btn btn-sm btn-outline-danger"
                      onClick={() => removePlayer(p.name)}
                    >
                      Remove
                    </button>
                  </li>
                ))}
                {players.length === 0 && (
                  <li className="list-group-item bg-dark text-secondary">
                    No players added yet.
                  </li>
                )}
              </ul>

              {players.length > 0 && (
                <div className="mt-3">
                  <div className="small text-muted mb-1">
                    Turn order (shuffles every round):
                  </div>
                  <div className="d-flex flex-wrap gap-2">
                    {orderQueue
                      .slice(turnPtr, turnPtr + players.length)
                      .map((n, i) => (
                        <span key={i} className="badge bg-secondary">
                          {i + 1}. {n}
                        </span>
                      ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Team input (single block) */}
        <div className="col-lg-4">
          <div className="card bg-dark text-white shadow h-100">
            <div className="card-body">
              <h5 className="text-info">Team Type & Names</h5>

              <label className="form-label mt-2">Team Type</label>
              <select
                className="form-select bg-dark text-white"
                value={teamType}
                onChange={(e) => {
                  setTeamType(e.target.value);
                  setAngle(0);
                  setTargetAngle(0);
                }}
              >
                <option>Weak</option>
                <option>Strong</option>
              </select>

              <div className="mt-3">
                <label className="form-label">
                  Teams (comma or newline separated)
                </label>
                <textarea
                  className="form-control bg-dark text-white"
                  rows={8}
                  value={teamNamesRaw}
                  onChange={(e) => setTeamNamesRaw(e.target.value)}
                  placeholder={`e.g.\nBangladesh, Zimbabwe, Kenya\nor one per line`}
                />
                <div className="d-flex gap-2 mt-2">
                  <button
                    className="btn btn-outline-info btn-sm"
                    onClick={buildPool}
                  >
                    {teamType === "Weak"
                      ? "Build Weak Wheel"
                      : "Build Strong Wheel"}
                  </button>
                  <span className="text-muted small align-self-center">
                    {currentPool.length} ready
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Wheel */}
        <div className="col-lg-4">
          <div className="card bg-dark text-white shadow h-100">
            <div className="card-body d-flex flex-column align-items-center">
              <h5 className="text-info">Wheel</h5>
              <div className="wheel-wrap my-2">
                <canvas ref={canvasRef} className="wheel-canvas" />
                {/* Confetti overlay (no pointer events) */}
                <canvas ref={confettiRef} className="confetti-canvas" />
              </div>
              <div className="mt-2 small text-muted">
                {teamsForWheel.length} team(s) on wheel
              </div>

              <div className="mt-3 text-center">
                <div className="mb-2">
                  Next up:&nbsp;
                  <span className="badge bg-warning text-dark">
                    {currentPlayer || "—"}
                  </span>
                </div>
                <button
                  className="btn btn-success"
                  onClick={spin}
                  disabled={!canSpin}
                  title={
                    !currentPlayer
                      ? "Add players first"
                      : teamsForWheel.length === 0
                      ? "Build wheel first"
                      : ""
                  }
                >
                  {isSpinning ? "Spinning..." : "Spin"}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* PRINT HEADER (logo) */}
      <div className="print-header print-only">
        <img src="/logo192.png" alt="CrickEdge.in" />
        <h2>Team Distributor — Final Allocation</h2>
      </div>

      {/* Results Table */}
      <div className="card bg-dark text-white shadow mt-4 print-area">
        <div className="card-body">
          <div className="d-flex justify-content-between align-items-center flex-wrap gap-2 not-print">
            <h5 className="text-info m-0">Final Allocation</h5>
            <button className="btn btn-outline-light btn-sm" onClick={downloadPDF}>
              Download as PDF
            </button>
          </div>

          <div className="table-responsive mt-3">
            <table className="table table-dark table-striped table-hover align-middle print-table">
              <thead>
                <tr>
                  <th>Player / Board</th>
                  <th>Weak Teams</th>
                  <th>Strong Teams</th>
                </tr>
              </thead>
              <tbody>
                {playerNames.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="text-center text-secondary">
                      Add players to see allocations.
                    </td>
                  </tr>
                ) : (
                  playerNames.map((p) => (
                    <tr key={p}>
                      <td>{p}</td>
                      <td>{(assignments.Weak[p] || []).join(", ") || "—"}</td>
                      <td>{(assignments.Strong[p] || []).join(", ") || "—"}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="small text-muted not-print">
            Order reshuffles every round (e.g., 3 players and 6 teams → 2 rounds).
          </div>
        </div>
      </div>

      {/* Toasts via Portal (fixed, top-right, always on top) */}
      <ToastPortal toasts={toasts} onClose={closeToastNow} />
    </div>
  );
}
