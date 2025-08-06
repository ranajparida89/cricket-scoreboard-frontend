// ✅ src/components/TeamDistributor.js
// [2025-08-06 rev9 - FULL FILE]
// - Spin snapshot to prevent desync (teams, player, type, winning team)
// - End angle computed to land exactly at the chosen segment center
// - finalizeSpin uses the pre-chosen team from the snapshot (no re-calc)
// - Ignore edits while spinning; button disabled; pointer/Toast always match
// - ✅ Fair-share rule now checks ONLY at build time; once armed, spins are not blocked
// - ✅ If players change or phase switches, wheel is "disarmed" and asks to Build again
// - ✅ Friendly validation for names, duplicates, and guidance messages

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

/* ------------------------ Validation helpers ------------------------ */
const sanitize = (s) => (s || "").replace(/\s+/g, " ").trim();
const isNameOk = (s) => /^[A-Za-z0-9 .'\-]{1,30}$/.test(s);
const isTeamOk = (s) => /^[A-Za-z0-9 .'\-]{1,30}$/.test(s);
/* ------------------------------------------------------------------- */

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
  }, []);
  return container;
}

function ToastPortal({ toasts, onClose }) {
  const container = useToastContainer();
  if (!container) return null;
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
          <div className="td-toast-icon">{t.type === "error" ? "⚠️" : "✅"}</div>
          <div className="td-toast-body">
            <div className="td-toast-title">
              {t.type === "error" ? "Heads up" : "Assigned!"}
            </div>
            <div
              className="td-toast-msg"
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

  // 👉 Wheel arming state: fairness is checked at build time only
  const [wheelGate, setWheelGate] = useState({
    ok: false,           // true = armed and allowed to spin regardless of remaining count
    reason: "Click “Build Wheel” to arm equal distribution.",
    initialTeams: 0,
    playersAtBuild: 0,
    typeAtBuild: "Weak",
    armedAt: 0,          // timestamp for reference
  });

  useEffect(() => {
    const src = teamType === "Weak" ? weakPool : strongPool;
    setTeamNamesRaw(src.join("\n"));
  }, [teamType, weakPool, strongPool]);

  const parseLines = (raw) =>
    raw.split(/[\n,]/g).map((s) => s.trim()).filter(Boolean);

  const [toasts, setToasts] = useState([]);
  const removeToast = (id) =>
    setToasts((arr) => arr.filter((x) => x.id !== id));
  const pushToast = (message, type = "success", timeout = 3000) => {
    const id = Math.random().toString(36).slice(2);
    setToasts((arr) => [...arr, { id, message, type, visible: false, timeout }]);
    setTimeout(() => {
      setToasts((arr) => arr.map((t) => (t.id === id ? { ...t, visible: true } : t)));
    }, 10);
    const exitAt = timeout - 350;
    setTimeout(() => {
      setToasts((arr) => arr.map((t) => (t.id === id ? { ...t, visible: false } : t)));
    }, Math.max(600, exitAt));
    setTimeout(() => removeToast(id), Math.max(900, timeout));
  };
  const closeToastNow = (id) => {
    setToasts((arr) => arr.map((t) => (t.id === id ? { ...t, visible: false } : t)));
    setTimeout(() => removeToast(id), 320);
  };

  /* ------------------ Build Wheel + validations (one-time check) ------------------ */
  const playerNames = useMemo(
    () => players.map((p) => p.name).filter(Boolean),
    [players]
  );
  const playersCount = playerNames.length;

  const buildPool = () => {
    const rawItems = parseLines(teamNamesRaw)
      .map(sanitize)
      .filter(Boolean)
      .map((t) => t.slice(0, 30));

    const invalids = rawItems.filter((t) => !isTeamOk(t));
    const valids = rawItems.filter((t) => isTeamOk(t));

    // case-insensitive dedupe
    const seen = new Set();
    const list = valids.filter((t) => {
      const key = t.toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    if (invalids.length > 0) {
      pushToast(
        `Skipped ${invalids.length} team name(s). Use letters, numbers, spaces, . ’ - (max 30 chars).`,
        "error",
        4200
      );
    }
    const removedDupes = valids.length - list.length;
    if (removedDupes > 0) {
      pushToast(`Removed ${removedDupes} duplicate team name(s).`, "error", 3000);
    }

    if (teamType === "Weak") setWeakPool(list);
    else setStrongPool(list);

    // Arm/disarm fairness gate at build time (only if we have players)
    if (playersCount === 0) {
      setWheelGate({
        ok: false,
        reason: "Add at least one board/player to enable equal distribution.",
        initialTeams: list.length,
        playersAtBuild: 0,
        typeAtBuild: teamType,
        armedAt: Date.now(),
      });
      return;
    }

    const teamsCount = list.length;
    const remainder = teamsCount % playersCount;

    if (remainder === 0) {
      // ✅ Armed: after this point we won't block spins as teams are distributed
      setWheelGate({
        ok: true,
        reason: "",
        initialTeams: teamsCount,
        playersAtBuild: playersCount,
        typeAtBuild: teamType,
        armedAt: Date.now(),
      });
      pushToast(
        `Wheel armed for fair share: ${teamsCount} team(s) / ${playersCount} board(s).`,
        "success",
        2600
      );
    } else {
      const needToAdd = (playersCount - remainder) % playersCount;
      const canRemove = remainder;
      const multiplesSample = Array.from({ length: 4 }, (_, i) => playersCount * (i + 1))
        .slice(0, 4)
        .join(", ");
      setWheelGate({
        ok: false,
        reason: `To split evenly across ${playersCount} board(s), total teams should be a multiple of ${playersCount} (e.g., ${multiplesSample}). You currently have ${teamsCount}. Add ${needToAdd} more team(s) or remove ${canRemove} to balance evenly.`,
        initialTeams: teamsCount,
        playersAtBuild: playersCount,
        typeAtBuild: teamType,
        armedAt: Date.now(),
      });
    }
  };
  /* ------------------------------------------------------------------------------- */

  // ---------- Spin engine ----------
  const canvasRef = useRef(null);
  const confettiRef = useRef(null);
  const [isSpinning, setIsSpinning] = useState(false);
  const [angle, setAngle] = useState(0);

  const currentPool = teamType === "Weak" ? weakPool : strongPool;

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

  // If players change after we armed, require a rebuild to recheck fairness.
  useEffect(() => {
    setWheelGate((prev) => {
      if (!prev.ok && prev.reason) return prev; // already disarmed
      return {
        ok: false,
        reason: "Players changed. Click “Build Wheel” to recheck and arm equal distribution.",
        initialTeams: prev.initialTeams,
        playersAtBuild: playersCount,
        typeAtBuild: teamType,
        armedAt: prev.armedAt,
      };
    });
  }, [playersCount]); // eslint-disable-line react-hooks/exhaustive-deps

  // Disarm when switching between Weak/Strong; user must click Build again.
  useEffect(() => {
    setWheelGate({
      ok: false,
      reason: "Phase changed. Click “Build Wheel” to arm equal distribution.",
      initialTeams: 0,
      playersAtBuild: playersCount,
      typeAtBuild: teamType,
      armedAt: 0,
    });
    setAngle(0);
  }, [teamType]); // eslint-disable-line react-hooks/exhaustive-deps

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

    // Pointer
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

  // ---------- Spin snapshot ----------
  const spinSnapRef = useRef(null);

  // ---------- Spin / Assign ----------
  const [assignments, setAssignments] = useState({ Weak: {}, Strong: {} });

  const canSpin =
    teamsForWheel.length > 0 &&
    !isSpinning &&
    !!currentPlayer &&
    wheelGate.ok; // ✅ check only the build-time gate

  const spin = () => {
    if (!currentPlayer) {
      pushToast("Add at least one board/player to start.", "error");
      return;
    }
    if (teamsForWheel.length === 0) {
      pushToast("Add team names and click “Build Wheel” first.", "error");
      return;
    }
    if (!wheelGate.ok) {
      pushToast(wheelGate.reason || "Click “Build Wheel” to arm equal distribution.", "error", 5200);
      return;
    }
    if (isSpinning) return;

    // Snapshot now
    const teamsSnapshot = [...teamsForWheel];
    const playerSnapshot = currentPlayer;
    const typeSnapshot = teamType;

    const n = teamsSnapshot.length;
    const slice = (Math.PI * 2) / n;

    const selectedIndex = Math.floor(Math.random() * n);
    const selectedTeam = teamsSnapshot[selectedIndex];

    const pointerAngle = Math.PI / 2;
    const segmentCenter = selectedIndex * slice + slice / 2;

    const bigSpins = Math.floor(randBetween(3, 6)) * (Math.PI * 2);
    const targetAngle = bigSpins + (pointerAngle - segmentCenter);

    spinSnapRef.current = {
      teamsSnapshot,
      playerSnapshot,
      typeSnapshot,
      selectedIndex,
      selectedTeam,
      targetAngle
    };

    setIsSpinning(true);

    const duration = 2600;
    const startAngle = angle;
    const start = performance.now();

    const step = (t) => {
      const p = Math.min(1, (t - start) / duration);
      const ease = 1 - Math.pow(1 - p, 3);
      const next = startAngle + (targetAngle - startAngle) * ease;
      setAngle(next);
      if (p < 1) requestAnimationFrame(step);
      else {
        setAngle(targetAngle);
        setIsSpinning(false);
        finalizeSpin();
      }
    };
    requestAnimationFrame(step);
  };

  const finalizeSpin = () => {
    const snap = spinSnapRef.current;
    if (!snap) return;

    const { playerSnapshot, typeSnapshot, selectedTeam } = snap;
    if (!selectedTeam) return;

    setAssignments((prev) => {
      const bucket = prev[typeSnapshot] || {};
      const list = bucket[playerSnapshot] ? [...bucket[playerSnapshot], selectedTeam] : [selectedTeam];
      return { ...prev, [typeSnapshot]: { ...bucket, [playerSnapshot]: list } };
    });

    if (typeSnapshot === "Weak") {
      setWeakPool((prev) => {
        const i = prev.indexOf(selectedTeam);
        return i === -1 ? prev : prev.slice(0, i).concat(prev.slice(i + 1));
      });
    } else {
      setStrongPool((prev) => {
        const i = prev.indexOf(selectedTeam);
        return i === -1 ? prev : prev.slice(0, i).concat(prev.slice(i + 1));
      });
    }

    setTurnPtr((prev) => prev + 1);

    pushToast(`<strong>${selectedTeam}</strong> goes to <strong>${playerSnapshot}</strong>. Nice pick!`);
    const r = WHEEL_SIZE / 2 - WHEEL_MARGIN;
    const tipX = WHEEL_SIZE / 2;
    const tipY = WHEEL_SIZE / 2 + r - 6;
    fireConfetti(tipX, tipY);

    spinSnapRef.current = null;
  };

  // ---------- UI helpers ----------
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
                  disabled={isSpinning}
                />
                <button className="btn btn-outline-light" onClick={addPlayer} disabled={isSpinning}>
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
                      onClick={() => setPlayers((prev) => prev.filter((x) => x.name !== p.name))}
                      disabled={isSpinning}
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
                  if (isSpinning) return;
                  setTeamType(e.target.value);
                }}
                disabled={isSpinning}
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
                  disabled={isSpinning}
                />
                <div className="d-flex gap-2 mt-2">
                  <button
                    className="btn btn-outline-info btn-sm"
                    onClick={buildPool}
                    disabled={isSpinning}
                  >
                    {teamType === "Weak"
                      ? "Build Weak Wheel"
                      : "Build Strong Wheel"}
                  </button>
                  <span className="text-muted small align-self-center">
                    {(teamType === "Weak" ? weakPool : strongPool).length} ready
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
                <canvas ref={confettiRef} className="confetti-canvas" />
              </div>

              <div className="mt-2 small text-muted">
                {teamsForWheel.length} team(s) on wheel
                {/* Friendly, actionable message BEFORE spin; hidden after arming */}
                {!wheelGate.ok && wheelGate.reason && (
                  <div className="text-warning mt-1">{wheelGate.reason}</div>
                )}
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
                      ? "Add at least one board/player."
                      : teamsForWheel.length === 0
                      ? "Add team names then click “Build Wheel”."
                      : !wheelGate.ok
                      ? wheelGate.reason
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

      {/* Toasts via Portal */}
      <ToastPortal toasts={toasts} onClose={closeToastNow} />
    </div>
  );

  // ---------- Local helpers ----------
  function addPlayer() {
    const name = sanitize(playerInput);
    if (!name) {
      pushToast("Please enter a board/player name.", "error");
      return;
    }
    if (!isNameOk(name)) {
      pushToast("Name can use letters, numbers, spaces, . ’ - (max 30 chars).", "error");
      return;
    }
    if (players.find((p) => p.name.toLowerCase() === name.toLowerCase())) {
      pushToast("That name is already in the list.", "error");
      return;
    }
    setPlayers((prev) => [...prev, { name }]);
    setPlayerInput("");
  }
}
