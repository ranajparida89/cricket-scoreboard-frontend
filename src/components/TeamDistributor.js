// ✅ src/components/TeamDistributor.js
// ✅ [NEW | 2025-07-xx] Team Distributor (Spinner Wheel)
// - Dark UI (Bootstrap)
// - Two phases: Weak teams first, then Strong teams
// - Randomizes player order EACH ROUND
// - Removes selected team from wheel after spin
// - Result table + "Download PDF" (print) option

import React, { useEffect, useMemo, useRef, useState } from "react";
import "./TeamDistributor.css";

const randBetween = (min, max) => Math.random() * (max - min) + min;
const shuffle = (arr) => {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

export default function TeamDistributor() {
  // ---------- Inputs ----------
  const [players, setPlayers] = useState([]);         // [{name}]
  const [playerInput, setPlayerInput] = useState("");

  const [teamType, setTeamType] = useState("Weak");   // "Weak" | "Strong"
  const [weakNamesRaw, setWeakNamesRaw] = useState("");
  const [strongNamesRaw, setStrongNamesRaw] = useState("");

  // Pools used for the wheel (current phase)
  const [weakPool, setWeakPool] = useState([]);       // ["BAN", "ZIM", ...]
  const [strongPool, setStrongPool] = useState([]);

  // ---------- Spin engine ----------
  const canvasRef = useRef(null);
  const [isSpinning, setIsSpinning] = useState(false);
  const [angle, setAngle] = useState(0);
  const [targetAngle, setTargetAngle] = useState(0);
  const [spinStart, setSpinStart] = useState(null);

  // Sequence logic: build a queue that changes order *each round*
  const [orderQueue, setOrderQueue] = useState([]);   // list of player names
  const [turnPtr, setTurnPtr] = useState(0);          // index in orderQueue

  // Assignments
  const [assignments, setAssignments] = useState({
    Weak: {},   // { playerName: ["TeamA","TeamB"] }
    Strong: {}, // { playerName: ["TeamX", ...] }
  });

  // Phase control
  const currentPool = teamType === "Weak" ? weakPool : strongPool;
  const setCurrentPool = teamType === "Weak" ? setWeakPool : setStrongPool;

  // ---------- Derived helpers ----------
  const playerNames = useMemo(() => players.map((p) => p.name).filter(Boolean), [players]);

  const teamsForWheel = useMemo(() => {
    const cleaned = currentPool.filter((t) => t && t.trim());
    return cleaned;
  }, [currentPool]);

  const currentPlayer = orderQueue[turnPtr] || "";

  // ---------- Build / Update pools ----------
  const parseLines = (raw) =>
    raw
      .split(/[\n,]/g)
      .map((s) => s.trim())
      .filter(Boolean);

  const buildWeakPool = () => setWeakPool([...new Set(parseLines(weakNamesRaw))]);
  const buildStrongPool = () => setStrongPool([...new Set(parseLines(strongNamesRaw))]);

  // ---------- Order queue (changes every round) ----------
  // A "round" = up to N spins where N = players.length (or fewer if teams run out)
  // We append a new shuffled order whenever we are close to consuming the current queue.
  useEffect(() => {
    if (playerNames.length === 0) {
      setOrderQueue([]);
      setTurnPtr(0);
      return;
    }
    if (orderQueue.length - turnPtr <= 1) {
      // Append a fresh shuffle for the next round
      setOrderQueue((prev) => [...prev, ...shuffle(playerNames)]);
    }
  }, [playerNames, orderQueue.length, turnPtr]);

  // Reset queue when player list changes drastically
  useEffect(() => {
    setOrderQueue(shuffle(playerNames));
    setTurnPtr(0);
  }, [playerNames.join("|")]); // reset on membership change

  // ---------- Wheel drawing ----------
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    const dpr = window.devicePixelRatio || 1;
    const size = 340; // canvas CSS size
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    ctx.scale(dpr, dpr);

    const w = size;
    const h = size;
    const cx = w / 2;
    const cy = h / 2;
    const r = Math.min(w, h) / 2 - 10;

    // bg
    ctx.clearRect(0, 0, w, h);
    // outer ring
    ctx.beginPath();
    ctx.arc(cx, cy, r + 6, 0, Math.PI * 2);
    const gradient = ctx.createLinearGradient(0, 0, w, h);
    gradient.addColorStop(0, "#222");
    gradient.addColorStop(1, "#444");
    ctx.fillStyle = gradient;
    ctx.fill();

    const n = Math.max(teamsForWheel.length, 1);
    const slice = (Math.PI * 2) / n;

    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(angle);

    // segments
    for (let i = 0; i < n; i++) {
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.arc(0, 0, r, i * slice, (i + 1) * slice);
      ctx.closePath();

      // alternating fills
      ctx.fillStyle = i % 2 === 0 ? "#0d6efd" : "#6610f2";
      if (teamsForWheel.length === 0) ctx.fillStyle = "#555";
      ctx.fill();

      // segment borders
      ctx.strokeStyle = "#111";
      ctx.lineWidth = 2;
      ctx.stroke();

      // text
      const label = teamsForWheel[i] || "—";
      ctx.save();
      ctx.rotate(i * slice + slice / 2);
      ctx.textAlign = "right";
      ctx.fillStyle = "#fff";
      ctx.font = "bold 14px system-ui, -apple-system, Segoe UI, Roboto, Arial";
      ctx.fillText(label, r - 10, 4);
      ctx.restore();
    }

    ctx.restore();

    // center hub
    ctx.beginPath();
    ctx.arc(cx, cy, 38, 0, Math.PI * 2);
    ctx.fillStyle = "#000";
    ctx.fill();
    ctx.lineWidth = 3;
    ctx.strokeStyle = "#0dcaf0";
    ctx.stroke();

    // pointer (top)
    ctx.beginPath();
    ctx.moveTo(cx, cy - r - 12);
    ctx.lineTo(cx - 12, cy - r + 18);
    ctx.lineTo(cx + 12, cy - r + 18);
    ctx.closePath();
    ctx.fillStyle = "#ffc107";
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = "#111";
    ctx.stroke();
  }, [teamsForWheel, angle]);

  // ---------- Spin animation ----------
  useEffect(() => {
    if (!isSpinning) return;
    let raf;
    const duration = 2500; // ms
    const start = performance.now();
    setSpinStart(start);

    const tick = (t) => {
      const elapsed = t - start;
      const p = Math.min(1, elapsed / duration);
      // ease-out cubic
      const ease = 1 - Math.pow(1 - p, 3);
      const a = angle + (targetAngle - angle) * ease;
      setAngle(a);
      if (p < 1) {
        raf = requestAnimationFrame(tick);
      } else {
        setIsSpinning(false);
        finalizeSpin();
      }
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSpinning, targetAngle]);

  const spin = () => {
    if (isSpinning || teamsForWheel.length === 0 || !currentPlayer) return;

    // pick a random segment to land on (index 0 is at pointer when angle aligns to -segmentCenter)
    const n = teamsForWheel.length;
    const selectedIndex = Math.floor(Math.random() * n);

    // Use math to land the wheel so the selectedIndex ends up under the pointer at the end.
    const slice = (Math.PI * 2) / n;
    const segmentCenter = selectedIndex * slice + slice / 2;
    // Pointer is at -90deg (top). We want: (angleEnd % 2π) + segmentCenter === -π/2
    const pointerAngle = -Math.PI / 2;
    // Compose large spins for drama (3–5 rotations)
    const bigSpins = Math.floor(randBetween(3, 6)) * (Math.PI * 2);
    const endAngle = bigSpins + (pointerAngle - segmentCenter);

    setTargetAngle(endAngle);
    setIsSpinning(true);
  };

  const finalizeSpin = () => {
    // read which segment is under pointer at final angle
    if (teamsForWheel.length === 0) return;
    const n = teamsForWheel.length;
    const slice = (Math.PI * 2) / n;
    const pointerAngle = -Math.PI / 2; // top
    const normalized = ((pointerAngle - angle) % (Math.PI * 2) + Math.PI * 2) % (Math.PI * 2);
    const index = Math.floor(normalized / slice);
    const team = teamsForWheel[index];

    // Assign to currentPlayer
    const p = currentPlayer || "Unknown";
    setAssignments((prev) => {
      const bucket = prev[teamType] || {};
      const list = bucket[p] ? [...bucket[p], team] : [team];
      return { ...prev, [teamType]: { ...bucket, [p]: list } };
    });

    // Remove team from pool
    setCurrentPool((prev) => prev.filter((t) => t !== team));

    // Advance turn pointer
    setTurnPtr((prev) => prev + 1);

    // Notify
    window.setTimeout(() => {
      alert(`${team} is assigned to ${p}`);
    }, 50);
  };

  // ---------- Phase progression ----------
  const weakDone = weakPool.length === 0 && parseLines(weakNamesRaw).length > 0;
  const strongDone = strongPool.length === 0 && parseLines(strongNamesRaw).length > 0;
  const allDone = weakDone && strongDone;

  useEffect(() => {
    if (weakDone && teamType === "Weak") {
      // Prompt: move to strong phase
      if (parseLines(strongNamesRaw).length === 0) return; // wait until user enters strong teams
      alert("All Weak teams are allocated. Please switch to Strong teams.");
      setTeamType("Strong");
      // Reset angle for fresh look
      setAngle(0);
      setTargetAngle(0);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [weakDone]);

  // ---------- PDF (print) ----------
  const downloadPDF = () => {
    // Simple & robust: open a printable view and let user "Save as PDF"
    window.print();
  };

  // ---------- Helpers for UI ----------
  const addPlayer = () => {
    const name = (playerInput || "").trim();
    if (!name) return;
    if (players.find((p) => p.name.toLowerCase() === name.toLowerCase())) return;
    setPlayers((prev) => [...prev, { name }]);
    setPlayerInput("");
  };

  const removePlayer = (name) => {
    setPlayers((prev) => prev.filter((p) => p.name !== name));
  };

  const canSpin = teamsForWheel.length > 0 && !isSpinning && currentPlayer;

  return (
    <div className="container mt-4 teamdist">
      <div className="card bg-dark text-white shadow mb-4">
        <div className="card-body d-flex justify-content-between align-items-center">
          <h3 className="m-0">🎡 Team Distributor</h3>
          <div className="small text-muted">
            Phase: <span className="badge bg-info">{teamType}</span>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="row g-3">
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
                  <div className="small text-muted mb-1">Turn order (shuffles every round):</div>
                  <div className="d-flex flex-wrap gap-2">
                    {orderQueue.slice(turnPtr, turnPtr + players.length).map((n, i) => (
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

        {/* Team inputs */}
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
                  // Reset wheel angle when switching
                  setAngle(0);
                  setTargetAngle(0);
                }}
              >
                <option>Weak</option>
                <option>Strong</option>
              </select>

              {/* Weak teams input */}
              <div className="mt-3">
                <label className="form-label">Weak Teams (comma or newline separated)</label>
                <textarea
                  className="form-control bg-dark text-white"
                  rows={6}
                  value={weakNamesRaw}
                  onChange={(e) => setWeakNamesRaw(e.target.value)}
                  placeholder={`e.g.\nBangladesh, Zimbabwe, Kenya\nor one per line`}
                />
                <div className="d-flex gap-2 mt-2">
                  <button className="btn btn-outline-info btn-sm" onClick={buildWeakPool}>
                    Build Weak Wheel
                  </button>
                  <span className="text-muted small align-self-center">
                    {weakPool.length} ready
                  </span>
                </div>
              </div>

              {/* Strong teams input */}
              <div className="mt-4">
                <label className="form-label">Strong Teams (comma or newline separated)</label>
                <textarea
                  className="form-control bg-dark text-white"
                  rows={6}
                  value={strongNamesRaw}
                  onChange={(e) => setStrongNamesRaw(e.target.value)}
                  placeholder={`e.g.\nIndia, Australia, England\nor one per line`}
                />
                <div className="d-flex gap-2 mt-2">
                  <button className="btn btn-outline-info btn-sm" onClick={buildStrongPool}>
                    Build Strong Wheel
                  </button>
                  <span className="text-muted small align-self-center">
                    {strongPool.length} ready
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
                  title={!currentPlayer ? "Add players first" : teamsForWheel.length === 0 ? "Build wheel first" : ""}
                >
                  {isSpinning ? "Spinning..." : "Spin"}
                </button>
              </div>

              {weakDone && teamType === "Weak" && (
                <div className="alert alert-info mt-3 w-100 text-center">
                  Weak teams done. Switch to <b>Strong</b> and build wheel.
                </div>
              )}
              {allDone && (
                <div className="alert alert-success mt-3 w-100 text-center">
                  ✅ All spins complete. Teams allocated successfully.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Results Table */}
      <div className="card bg-dark text-white shadow mt-4 print-area">
        <div className="card-body">
          <div className="d-flex justify-content-between align-items-center flex-wrap gap-2">
            <h5 className="text-info m-0">Final Allocation</h5>
            <button className="btn btn-outline-light btn-sm" onClick={downloadPDF}>
              Download as PDF
            </button>
          </div>

          <div className="table-responsive mt-3">
            <table className="table table-dark table-striped table-hover align-middle">
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

          {/* Quick explanation */}
          <div className="small text-muted">
            Order shuffles every round (e.g., if 3 players and 6 Weak teams, you’ll see 2 rounds,
            each with a new random order).
          </div>
        </div>
      </div>
    </div>
  );
}
