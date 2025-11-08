// src/components/PitchRandomizer.js
// Pitch Randomizer with 4-step reveal modal (casino-style)
// keeps same backend + history logic

import React, { useState, useEffect, useRef } from "react";
import "./PitchRandomizer.css";

const API_BASE = "https://cricket-scoreboard-backend.onrender.com";

export default function PitchRandomizer() {
  // fixed lists
  const pitchTypes = [
    "Standard",
    "Dry",
    "Dusty",
    "Grassy",
    "Grassy/Dry",
    "Grassy/Dusty",
  ];
  const pitchCracks = ["Light", "Heavy", "None"];
  const pitchAgesMax2 = ["Day 1", "Day 2"]; // global: no Day 3

  // form state
  const [matchType, setMatchType] = useState("");
  const [name, setName] = useState("");
  const [matchName, setMatchName] = useState("");

  // pitch currently displayed under the form
  const [pitch, setPitch] = useState(null);

  // history table
  const [history, setHistory] = useState([]);

  // modal / spinning UI
  const [showSpinModal, setShowSpinModal] = useState(false);
  const [spinStep, setSpinStep] = useState(0); // 0=none,1=type,2=hard,3=crack,4=age
  const [spinData, setSpinData] = useState({
    pitchType: "",
    hardness: "",
    crack: "",
    pitchAge: "",
    matchType: "",
    name: "",
    matchName: "",
  });

  // to cancel timeouts if user clicks Generate fast
  const spinTimersRef = useRef([]);

  // browser fingerprint (per device)
  const [fingerprint] = useState(() => {
    const existing = localStorage.getItem("pitch_fp");
    if (existing) return existing;
    const fp = "fp_" + Math.random().toString(36).substring(2, 10);
    localStorage.setItem("pitch_fp", fp);
    return fp;
  });

  const LOCAL_KEY = "crickedge_pitch_history_v2";

  // initial load
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(
          `${API_BASE}/api/tools/pitch-randomizer/history?limit=60`
        );
        const json = await res.json();
        if (json.success) {
          const mapped = json.data.map((row) => ({
            id: new Date(row.created_at).getTime(),
            matchType: row.match_type,
            name: row.user_name,
            matchName: row.match_name,
            pitchType: row.pitch_type,
            hardness: row.pitch_hardness,
            crack: row.pitch_crack,
            pitchAge: row.pitch_age,
            time: new Date(row.created_at).toLocaleString("en-IN", {
              hour12: false,
              timeStyle: "medium",
              dateStyle: "short",
            }),
            duplicate: row.is_duplicate,
          }));
          const ten = mapped.slice(0, 10);
          setHistory(ten);
          localStorage.setItem(LOCAL_KEY, JSON.stringify(ten));
          return;
        }
      } catch (err) {
        console.warn("Backend not reachable, using local fallback", err);
      }

      // fallback
      try {
        const stored = localStorage.getItem(LOCAL_KEY);
        if (stored) setHistory(JSON.parse(stored));
      } catch (e) {
        console.warn("Local history load failed:", e);
      }
    })();

    // cleanup on unmount
    return () => {
      spinTimersRef.current.forEach((t) => clearTimeout(t));
    };
  }, []);

  // sync localStorage with history
  useEffect(() => {
    localStorage.setItem(LOCAL_KEY, JSON.stringify(history));
  }, [history]);

  const getRandom = (arr) => arr[Math.floor(Math.random() * arr.length)];

  // -------
  // GENERATE
  // -------
  const generatePitch = async () => {
    if (!matchType)
      return alert("Please select Match Type (ODI / T20 / Test).");
    if (!name.trim() || !matchName.trim())
      return alert("Please enter both your name and match name.");

    // 1) build pitch object (same logic as before)
    let hardness = "Medium";
    let selectedPitchType;
    let selectedPitchAge;

    if (matchType === "Test") {
      // more stable wickets
      const r = Math.random() * 100;
      hardness = r < 70 ? "Medium" : "Hard";

      const testFriendlyTypes = ["Standard", "Dry", "Grassy", "Grassy/Dry"];

      if (hardness === "Hard") {
        selectedPitchType = getRandom(["Standard", "Dry", "Grassy/Dry"]);
        selectedPitchAge = "Day 2";
      } else {
        selectedPitchType = getRandom(testFriendlyTypes);
        selectedPitchAge = getRandom(pitchAgesMax2);
      }
    } else {
      // ODI / T20
      const r = Math.random() * 100;
      hardness = "Medium";
      if (r < 15) hardness = "Soft";
      else if (r > 85) hardness = "Hard";

      if (hardness === "Hard") {
        selectedPitchType = getRandom(["Standard", "Dry", "Grassy/Dry"]);
        selectedPitchAge = "Day 2";
      } else if (hardness === "Soft") {
        selectedPitchType = getRandom(pitchTypes.filter((t) => t !== "Dusty"));
        selectedPitchAge = "Day 1";
      } else {
        selectedPitchType = getRandom(pitchTypes);
        selectedPitchAge = getRandom(pitchAgesMax2);
      }
    }

    const crack = getRandom(pitchCracks);
    const now = new Date();
    const formattedTime = now.toLocaleString("en-IN", {
      hour12: false,
      timeStyle: "medium",
      dateStyle: "short",
    });

    // object before server
    const tempPitch = {
      id: Date.now(),
      matchType,
      name: name.trim(),
      matchName: matchName.trim(),
      pitchType: selectedPitchType,
      hardness,
      crack,
      pitchAge: selectedPitchAge,
      time: formattedTime,
      duplicate: false,
    };

    // 2) open modal + run 4-step reveal
    startSpinSequence(tempPitch);

    // 3) send to backend (same as before)
    try {
      const res = await fetch(`${API_BASE}/api/tools/pitch-randomizer/log`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          match_type: tempPitch.matchType,
          user_name: tempPitch.name,
          match_name: tempPitch.matchName,
          pitch_type: tempPitch.pitchType,
          pitch_hardness: tempPitch.hardness,
          pitch_crack: tempPitch.crack,
          pitch_age: tempPitch.pitchAge,
          is_duplicate: false,
          browser_fingerprint: fingerprint,
        }),
      });

      const json = await res.json();
      if (json && json.success) {
        const finalPitch = {
          ...tempPitch,
          duplicate: json.is_duplicate === true,
          id: new Date(json.created_at).getTime(),
          time: new Date(json.created_at).toLocaleString("en-IN", {
            hour12: false,
            timeStyle: "medium",
            dateStyle: "short",
          }),
        };

        // show under the form
        setPitch(finalPitch);

        // reset history if backend trimmed
        if (json.history_cleared) {
          setHistory([finalPitch]);
        } else {
          setHistory((prev) => {
            const next = [finalPitch, ...prev];
            return next.slice(0, 10);
          });
        }

        if (json.is_duplicate) {
          alert("⚠ Duplicate pitch detected — try again after 1 minute.");
        }
        return;
      }
    } catch (err) {
      console.warn("Could not send pitch log to backend:", err);
      // fallback: local only
      setPitch(tempPitch);
      setHistory((prev) => {
        const next = [tempPitch, ...prev];
        return next.slice(0, 10);
      });
    }
  };

  // run 4-step wheel reveal
  const startSpinSequence = (tempPitch) => {
    // clear previous timers
    spinTimersRef.current.forEach((t) => clearTimeout(t));
    spinTimersRef.current = [];

    setSpinData({
      pitchType: tempPitch.pitchType,
      hardness: tempPitch.hardness,
      crack: tempPitch.crack,
      pitchAge: tempPitch.pitchAge,
      matchType: tempPitch.matchType,
      name: tempPitch.name,
      matchName: tempPitch.matchName,
    });
    setShowSpinModal(true);
    setSpinStep(0);

    const timings = [200, 900, 1600, 2300]; // when each one is revealed
    timings.forEach((ms, idx) => {
      const timer = setTimeout(() => {
        setSpinStep(idx + 1);
      }, ms);
      spinTimersRef.current.push(timer);
    });

    // close modal after all revealed
    const closeTimer = setTimeout(() => {
      setShowSpinModal(false);
    }, 3200);
    spinTimersRef.current.push(closeTimer);
  };

  return (
    <div className="pitch-container wide-layout">
      <h2 className="pitch-title">
        <span className="emoji-icon">🏏</span> Pitch Randomizer
      </h2>

      {/* top form */}
      <div className="form-row">
        <div className="input-group">
          <label>
            Match Type <span className="req">*</span>
          </label>
          <select
            value={matchType}
            onChange={(e) => setMatchType(e.target.value)}
            className={matchType ? "" : "placeholder-select"}
          >
            <option value="">Select Match Type</option>
            <option value="ODI">ODI</option>
            <option value="T20">T20</option>
            <option value="Test">Test</option>
          </select>
        </div>

        <div className="input-group">
          <label>Enter Your Name:</label>
          <input
            type="text"
            value={name}
            placeholder="e.g. Ranaj Parida"
            onChange={(e) => setName(e.target.value)}
          />
        </div>

        <div className="input-group">
          <label>Match Name:</label>
          <input
            type="text"
            value={matchName}
            placeholder="e.g. India vs Australia"
            onChange={(e) => setMatchName(e.target.value)}
          />
        </div>
      </div>

      <button className="btn-generate" onClick={generatePitch}>
        Generate Pitch
      </button>

      {/* spinning modal */}
      {showSpinModal && (
        <div className="spin-overlay">
          <div className="spin-modal">
            <div className="spin-header">
              <div className="spin-title">
                🎰 Generating pitch for {spinData.matchType} — {spinData.name}
              </div>
              <div className="spin-sub">
                {spinData.matchName ? spinData.matchName : ""}
              </div>
            </div>

            <div className="spin-row">
              {/* 1. Pitch Type */}
              <div
                className={`spin-slot ${
                  spinStep === 1 ? "spinning" : spinStep > 1 ? "done" : ""
                }`}
              >
                <div className="slot-label">Pitch Type</div>
                <div className="slot-body">
                  <div className="slot-arrow">▲</div>
                  <div className="slot-wheel">
                    <span>{spinStep >= 1 ? spinData.pitchType : "•••"}</span>
                  </div>
                </div>
              </div>

              {/* 2. Hardness */}
              <div
                className={`spin-slot ${
                  spinStep === 2 ? "spinning" : spinStep > 2 ? "done" : ""
                }`}
              >
                <div className="slot-label">Pitch Hardness</div>
                <div className="slot-body">
                  <div className="slot-arrow">▲</div>
                  <div className="slot-wheel">
                    <span>{spinStep >= 2 ? spinData.hardness : "•••"}</span>
                  </div>
                </div>
              </div>

              {/* 3. Crack */}
              <div
                className={`spin-slot ${
                  spinStep === 3 ? "spinning" : spinStep > 3 ? "done" : ""
                }`}
              >
                <div className="slot-label">Pitch Crack</div>
                <div className="slot-body">
                  <div className="slot-arrow">▲</div>
                  <div className="slot-wheel">
                    <span>{spinStep >= 3 ? spinData.crack : "•••"}</span>
                  </div>
                </div>
              </div>

              {/* 4. Age */}
              <div
                className={`spin-slot ${
                  spinStep === 4 ? "spinning" : spinStep > 4 ? "done" : ""
                }`}
              >
                <div className="slot-label">Pitch Age</div>
                <div className="slot-body">
                  <div className="slot-arrow">▲</div>
                  <div className="slot-wheel">
                    <span>{spinStep >= 4 ? spinData.pitchAge : "•••"}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="spin-footer">
              Auto-closing after reveal…
            </div>
          </div>
        </div>
      )}

      {/* result panel (same as before) */}
      {pitch && (
        <div
          className={`pitch-result fade-in ${
            pitch.duplicate ? "duplicate-box" : ""
          }`}
        >
          <h3>
            {pitch.matchType} Pitch Generated for {pitch.name} (
            {pitch.matchName})
            {pitch.duplicate && (
              <span className="dup-warning">
                {" "}
                ⚠ Duplicate (within 1 min)
              </span>
            )}
          </h3>
          <p>
            <strong>Pitch Type:</strong> {pitch.pitchType}
          </p>
          <p>
            <strong>Pitch Hardness:</strong> {pitch.hardness}
          </p>
          <p>
            <strong>Pitch Crack:</strong> {pitch.crack}
          </p>
          <p>
            <strong>Pitch Age:</strong> {pitch.pitchAge}
          </p>
          <p className="generated-at">
            <strong>Generated At:</strong> {pitch.time}
          </p>
        </div>
      )}

      {/* history table (unchanged) */}
      {history.length > 0 && (
        <div className="pitch-history">
          <h4>Previous Generations</h4>
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Match Type</th>
                  <th>User</th>
                  <th>Match</th>
                  <th>Type</th>
                  <th>Hardness</th>
                  <th>Crack</th>
                  <th>Age</th>
                  <th>Generated At</th>
                </tr>
              </thead>
              <tbody>
                {history.map((h, i) => (
                  <tr
                    key={h.id}
                    className={h.duplicate ? "duplicate-row" : ""}
                  >
                    <td>{i + 1}</td>
                    <td>{h.matchType}</td>
                    <td>{h.name}</td>
                    <td>{h.matchName}</td>
                    <td>{h.pitchType}</td>
                    <td>{h.hardness}</td>
                    <td>{h.crack}</td>
                    <td>{h.pitchAge}</td>
                    <td>{h.time}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="history-footnote">
            (Holds max 10 rows. When 11th is generated, old 10 are purged from
            DB/UI and the list restarts from #1.)
          </p>
        </div>
      )}
    </div>
  );
}
