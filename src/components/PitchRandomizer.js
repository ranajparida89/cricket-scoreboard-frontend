// src/components/PitchRandomizer.js
// [Ranaj Parida - Pitch Randomizer with backend + localStorage sync]

import React, { useState, useEffect } from "react";
import "./PitchRandomizer.css";

const API_BASE = "https://cricket-scoreboard-backend.onrender.com"; // ← your Render backend

export default function PitchRandomizer() {
  // fixed lists
  const pitchTypes = ["Standard", "Dry", "Dusty", "Grassy", "Grassy/Dry", "Grassy/Dusty"];
  const pitchCracks = ["Light", "Heavy", "None"];
  const pitchAges = ["Day 1", "Day 2", "Day 3"];

  const [matchType, setMatchType] = useState("");        // ODI / T20 / Test
  const [name, setName] = useState("");
  const [matchName, setMatchName] = useState("");
  const [pitch, setPitch] = useState(null);
  const [history, setHistory] = useState([]);

  // browser-only id to know which device generated this
  const [fingerprint] = useState(() => {
    const existing = localStorage.getItem("pitch_fp");
    if (existing) return existing;
    const fp = "fp_" + Math.random().toString(36).substring(2, 10);
    localStorage.setItem("pitch_fp", fp);
    return fp;
  });

  const LOCAL_KEY = "crickedge_pitch_history_v2";

  // 1) on mount → try backend first; if fails, use localStorage
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
          setHistory(mapped);
          localStorage.setItem(LOCAL_KEY, JSON.stringify(mapped));
          return;
        }
      } catch (err) {
        console.warn("Backend not reachable, using localStorage fallback", err);
      }

      // fallback
      try {
        const stored = localStorage.getItem(LOCAL_KEY);
        if (stored) setHistory(JSON.parse(stored));
      } catch (e) {
        console.warn("Local history load failed:", e);
      }
    })();
  }, []);

  // 2) whenever history changes → keep local copy (fast render, offline)
  useEffect(() => {
    try {
      localStorage.setItem(LOCAL_KEY, JSON.stringify(history));
    } catch (e) {
      console.warn("Pitch history save failed:", e);
    }
  }, [history]);

  const getRandom = (arr) => arr[Math.floor(Math.random() * arr.length)];

  const generatePitch = async () => {
    // validation
    if (!matchType) {
      alert("Please select Match Type (ODI / T20 / Test).");
      return;
    }
    if (!name.trim() || !matchName.trim()) {
      alert("Please enter both your name and match name (e.g. India vs Australia).");
      return;
    }

    // -------------------------
    // 1. generate pitch (UI logic)
    // -------------------------
    let hardness = "Medium";
    let selectedPitchType;
    let selectedPitchAge;

    if (matchType === "Test") {
      // 70% Medium, 30% Hard
      const r = Math.random() * 100;
      hardness = r < 70 ? "Medium" : "Hard";

      const testFriendlyTypes = ["Standard", "Dry", "Grassy", "Grassy/Dry"];

      if (hardness === "Hard") {
        selectedPitchType = getRandom(["Standard", "Dry", "Grassy/Dry"]);
        selectedPitchAge = "Day 3";
      } else {
        // medium test wicket → day 2 or 3
        selectedPitchType = getRandom(testFriendlyTypes);
        selectedPitchAge = getRandom(["Day 2", "Day 3"]);
      }
    } else {
      // ODI / T20 → old logic
      const r = Math.random() * 100;
      hardness = "Medium";
      if (r < 15) {
        hardness = "Soft";
      } else if (r > 85) {
        hardness = "Hard";
      }

      if (hardness === "Hard") {
        selectedPitchType = getRandom(["Standard", "Dry", "Grassy/Dry"]);
        selectedPitchAge = "Day 3";
      } else if (hardness === "Soft") {
        selectedPitchType = getRandom(pitchTypes.filter((t) => t !== "Dusty"));
        selectedPitchAge = "Day 1";
      } else {
        selectedPitchType = getRandom(pitchTypes);
        selectedPitchAge = getRandom(pitchAges);
      }
    }

    const crack = getRandom(pitchCracks);
    const now = new Date();
    const formattedTime = now.toLocaleString("en-IN", {
      hour12: false,
      timeStyle: "medium",
      dateStyle: "short",
    });

    const newPitch = {
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

    // duplicate check: same user + same match + same matchType within 1 minute
    const lastSame = history.find(
      (h) =>
        h.name === newPitch.name &&
        h.matchName === newPitch.matchName &&
        h.matchType === newPitch.matchType
    );
    if (lastSame) {
      const diffSec = (Date.now() - lastSame.id) / 1000;
      if (diffSec <= 60) {
        newPitch.duplicate = true;
      }
    }

    const updated = [newPitch, ...history].slice(0, 60);
    setPitch(newPitch);
    setHistory(updated);

    // -------------------------
    // 2. send to backend (so mobile / other devices can see)
    // -------------------------
    try {
      await fetch(`${API_BASE}/api/tools/pitch-randomizer/log`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          match_type: newPitch.matchType,
          user_name: newPitch.name,
          match_name: newPitch.matchName,
          pitch_type: newPitch.pitchType,
          pitch_hardness: newPitch.hardness,
          pitch_crack: newPitch.crack,
          pitch_age: newPitch.pitchAge,
          is_duplicate: newPitch.duplicate,
          browser_fingerprint: fingerprint,
        }),
      });
    } catch (err) {
      // we don't block UI if backend call fails
      console.warn("Could not send pitch log to backend:", err);
    }
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

      {/* result block */}
      {pitch && (
        <div className={`pitch-result fade-in ${pitch.duplicate ? "duplicate-box" : ""}`}>
          <h3>
            {pitch.matchType} Pitch Generated for {pitch.name} ({pitch.matchName})
            {pitch.duplicate && (
              <span className="dup-warning"> ⚠ Duplicate (within 1 min)</span>
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

      {/* table */}
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
                  <tr key={h.id} className={h.duplicate ? "duplicate-row" : ""}>
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
            (Stored locally for fast load, and also saved to backend. Red rows = duplicate
            attempts within 1 minute for the same user + same match + same match type.)
          </p>
        </div>
      )}
    </div>
  );
}
