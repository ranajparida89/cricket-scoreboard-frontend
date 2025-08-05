// ✅ src/components/TeamDistributor.js
// [2025-08-05] Updates:
// 1) 🔁 Single textarea for team names; dropdown chooses Weak/Strong  (replaces two blocks)
// 2) ⬇️ Pointer now points DOWN; spin math updated to land under bottom pointer
// 3) 🎨 Nicer wheel styling (ring, gloss, subtle ticks)
// 4) 🖨️ Print shows ONLY logo + final allocation table
// 5) 🪄 Comments tagged with  // [CHANGED]  where relevant

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
  // ---------- Players ----------
  const [players, setPlayers] = useState([]);
  const [playerInput, setPlayerInput] = useState("");

  // ---------- Team input (single block) ----------
  const [teamType, setTeamType] = useState("Weak");              // Weak | Strong
  const [teamNamesRaw, setTeamNamesRaw] = useState("");          // [CHANGED] single textarea
  const [weakPool, setWeakPool] = useState([]);
  const [strongPool, setStrongPool] = useState([]);

  // keep textarea in sync with current pool when switching type
  useEffect(() => {
    const src = teamType === "Weak" ? weakPool : strongPool;
    setTeamNamesRaw(src.join("\n"));                              // [CHANGED]
  }, [teamType, weakPool, strongPool]);

  const parseLines = (raw) =>
    raw.split(/[\n,]/g).map((s) => s.trim()).filter(Boolean);

  const buildPool = () => {                                       // [CHANGED]
    const list = [...new Set(parseLines(teamNamesRaw))];
    if (teamType === "Weak") setWeakPool(list);
    else setStrongPool(list);
  };

  // ---------- Spin engine ----------
  const canvasRef = useRef(null);
  const [isSpinning, setIsSpinning] = useState(false);
  const [angle, setAngle] = useState(0);
  const [targetAngle, setTargetAngle] = useState(0);

  const currentPool = teamType === "Weak" ? weakPool : strongPool;
  const setCurrentPool = teamType === "Weak" ? setWeakPool : setStrongPool;

  const playerNames = useMemo(() => players.map((p) => p.name).filter(Boolean), [players]);

  // Order queue that reshuffles every round
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

  // ---------- Drawing ----------
  useEffect(() => {
    const cvs = canvasRef.current;
    if (!cvs) return;

    const ctx = cvs.getContext("2d");
    const dpr = window.devicePixelRatio || 1;
    const size = 360;
    cvs.width = size * dpr;
    cvs.height = size * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const w = size, h = size, cx = w / 2, cy = h / 2, r = Math.min(w, h) / 2 - 12;

    // clear
    ctx.clearRect(0, 0, w, h);

    // outer ring
    const ringGrad = ctx.createRadialGradient(cx, cy, r - 20, cx, cy, r + 16);
    ringGrad.addColorStop(0, "#0b0f14");
    ringGrad.addColorStop(1, "#27313b");
    ctx.fillStyle = ringGrad;
    ctx.beginPath();
    ctx.arc(cx, cy, r + 10, 0, Math.PI * 2);
    ctx.fill();

    // shadow
    ctx.save();
    ctx.shadowColor = "rgba(0,0,0,0.6)";
    ctx.shadowBlur = 18;

    const n = Math.max(teamsForWheel.length, 1);
    const slice = (Math.PI * 2) / n;

    // wheel body
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(angle);

    for (let i = 0; i < n; i++) {
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.arc(0, 0, r, i * slice, (i + 1) * slice);
      ctx.closePath();

      // segment gradient
      const segGrad = ctx.createLinearGradient(-r, -r, r, r);
      const base = teamType === "Weak" ? ["#7c4dff", "#3d5afe"] : ["#20c997", "#0dcaf0"];
      const off = i % 2 ? 0.08 : 0;
      segGrad.addColorStop(0, shade(base[0], -0.1 - off));
      segGrad.addColorStop(1, shade(base[1],  0.05 + off));
      ctx.fillStyle = teamsForWheel.length ? segGrad : "#555";
      ctx.fill();

      // borders
      ctx.strokeStyle = "rgba(0,0,0,0.6)";
      ctx.lineWidth = 2;
      ctx.stroke();

      // tick at edge
      ctx.save();
      ctx.rotate(i * slice);
      ctx.beginPath();
      ctx.moveTo(r - 8, 0);
      ctx.lineTo(r, 0);
      ctx.strokeStyle = "rgba(255,255,255,0.15)";
      ctx.lineWidth = 3;
      ctx.stroke();
      ctx.restore();

      // labels
      const label = teamsForWheel[i] || "—";
      ctx.save();
      ctx.rotate(i * slice + slice / 2);
      ctx.textAlign = "right";
      ctx.fillStyle = "#fff";
      ctx.font = "600 15px ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Roboto, Arial";
      ctx.fillText(label, r - 12, 5);
      ctx.restore();
    }
    ctx.restore(); // rotation
    ctx.restore(); // shadow

    // center hub with ring
    ctx.beginPath();
    ctx.arc(cx, cy, 40, 0, Math.PI * 2);
    ctx.fillStyle = "#0b0f14";
    ctx.fill();
    ctx.lineWidth = 4;
    ctx.strokeStyle = teamType === "Weak" ? "#7c4dff" : "#20c997";
    ctx.stroke();

    // gloss
    const gloss = ctx.createLinearGradient(cx, cy - 40, cx, cy + 40);
    gloss.addColorStop(0, "rgba(255,255,255,0.22)");
    gloss.addColorStop(0.5, "rgba(255,255,255,0.05)");
    gloss.addColorStop(1, "rgba(255,255,255,0)");
    ctx.beginPath();
    ctx.arc(cx, cy, 38, 0, Math.PI * 2);
    ctx.strokeStyle = gloss;
    ctx.lineWidth = 2;
    ctx.stroke();

    // ▼ pointer (DOWN)  [CHANGED]
    // full arrow: shaft + triangle, positioned at bottom
    const ptrY = cy + r + 12;
    ctx.lineWidth = 6;
    ctx.strokeStyle = "#111";
    ctx.fillStyle = "#ffc107";

    // shaft
    ctx.beginPath();
    ctx.moveTo(cx, ptrY - 34);
    ctx.lineTo(cx, ptrY - 10);
    ctx.strokeStyle = "#ffc107";
    ctx.stroke();

    // triangle head
    ctx.beginPath();
    ctx.moveTo(cx, ptrY);
    ctx.lineTo(cx - 14, ptrY - 18);
    ctx.lineTo(cx + 14, ptrY - 18);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = "#111";
    ctx.lineWidth = 2;
    ctx.stroke();
  }, [teamsForWheel, angle, teamType]);

  function shade(hex, pct) {
    const f = parseInt(hex.replace("#", ""), 16);
    const t = pct < 0 ? 0 : 255;
    const p = Math.abs(pct);
    const R = f >> 16, G = (f >> 8) & 0x00ff, B = f & 0x0000ff;
    const v = (c) => Math.round((t - c) * p) + c;
    return `#${(0x1000000 + (v(R) << 16) + (v(G) << 8) + v(B)).toString(16).slice(1)}`;
  }

  // ---------- Spin ----------
  const [assignments, setAssignments] = useState({ Weak: {}, Strong: {} });

  const spin = () => {
    if (isSpinning || teamsForWheel.length === 0 || !currentPlayer) return;
    const n = teamsForWheel.length;
    const selectedIndex = Math.floor(Math.random() * n);
    const slice = (Math.PI * 2) / n;

    // pointer is at +90deg (bottom)  [CHANGED]
    const pointerAngle = Math.PI / 2;
    const segmentCenter = selectedIndex * slice + slice / 2;

    const bigSpins = Math.floor(randBetween(3, 6)) * (Math.PI * 2);
    const endAngle = bigSpins + (pointerAngle - segmentCenter);

    setTargetAngle(endAngle);
    setIsSpinning(true);

    // animate
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

    // pointer at bottom → +90deg  [CHANGED]
    const pointerAngle = Math.PI / 2;
    const normalized = ((pointerAngle - angle) % (Math.PI * 2) + Math.PI * 2) % (Math.PI * 2);
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

    setTimeout(() => {
      alert(`${team} is assigned to ${p}`);
    }, 80);
  };

  // phase progression notices
  const weakDone = weakPool.length === 0 && weakPool.length !== 0 || (weakPool.length === 0 && parseLines(teamNamesRaw).length > 0 && teamType === "Weak");
  const strongDone = strongPool.length === 0 && strongPool.length !== 0 || (strongPool.length === 0 && parseLines(teamNamesRaw).length > 0 && teamType === "Strong");
  const allDone = (weakPool.length === 0 && strongPool.length === 0) && (Object.keys(assignments.Weak).length + Object.keys(assignments.Strong).length > 0);

  // ---------- Helpers ----------
  const addPlayer = () => {
    const name = (playerInput || "").trim();
    if (!name) return;
    if (players.find((p) => p.name.toLowerCase() === name.toLowerCase())) return;
    setPlayers((prev) => [...prev, { name }]);
    setPlayerInput("");
  };
  const removePlayer = (name) => setPlayers((prev) => prev.filter((p) => p.name !== name));
  const canSpin = teamsForWheel.length > 0 && !isSpinning && currentPlayer;

  // ---------- Print: just call window.print() ----------
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
                <button className="btn btn-outline-light" onClick={addPlayer}>Add</button>
              </div>

              <ul className="list-group list-group-flush mt-3">
                {players.map((p) => (
                  <li key={p.name} className="list-group-item bg-dark text-white d-flex justify-content-between align-items-center">
                    {p.name}
                    <button className="btn btn-sm btn-outline-danger" onClick={() => removePlayer(p.name)}>Remove</button>
                  </li>
                ))}
                {players.length === 0 && (
                  <li className="list-group-item bg-dark text-secondary">No players added yet.</li>
                )}
              </ul>

              {players.length > 0 && (
                <div className="mt-3">
                  <div className="small text-muted mb-1">Turn order (shuffles every round):</div>
                  <div className="d-flex flex-wrap gap-2">
                    {orderQueue.slice(turnPtr, turnPtr + players.length).map((n, i) => (
                      <span key={i} className="badge bg-secondary">{i + 1}. {n}</span>
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
                  setAngle(0); setTargetAngle(0);
                }}
              >
                <option>Weak</option>
                <option>Strong</option>
              </select>

              <div className="mt-3">
                <label className="form-label">Teams (comma or newline separated)</label>
                <textarea
                  className="form-control bg-dark text-white"
                  rows={8}
                  value={teamNamesRaw}
                  onChange={(e) => setTeamNamesRaw(e.target.value)}
                  placeholder={`e.g.\nBangladesh, Zimbabwe, Kenya\nor one per line`}
                />
                <div className="d-flex gap-2 mt-2">
                  <button className="btn btn-outline-info btn-sm" onClick={buildPool}>
                    {teamType === "Weak" ? "Build Weak Wheel" : "Build Strong Wheel"}
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
              </div>
              <div className="mt-2 small text-muted">{teamsForWheel.length} team(s) on wheel</div>

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

              {teamType === "Weak" && weakPool.length === 0 && players.length > 0 && (
                <div className="alert alert-info mt-3 w-100 text-center">
                  Weak teams done? Switch to <b>Strong</b> and build wheel.
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
            <button className="btn btn-outline-light btn-sm" onClick={downloadPDF}>Download as PDF</button>
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
                    <td colSpan={3} className="text-center text-secondary">Add players to see allocations.</td>
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
        </div>
      </div>
    </div>
  );
}
