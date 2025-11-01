// src/components/PitchRandomizer.js
// [Ranaj Parida - Pitch Randomizer with backend duplicate enforcement
//   + 10-row auto-reset
//   + max Day 2 for ALL formats
//   + classic TABLE view]

import React, { useState, useEffect } from "react";
import "./PitchRandomizer.css";

const API_BASE = "https://cricket-scoreboard-backend.onrender.com";

export default function PitchRandomizer() {
  // fixed lists
  const pitchTypes = ["Standard", "Dry", "Dusty", "Grassy", "Grassy/Dry", "Grassy/Dusty"];
  const pitchCracks = ["Light", "Heavy", "None"];
  const pitchAgesMax2 = ["Day 1", "Day 2"]; // 👈 global rule: no Day 3 anywhere

  const [matchType, setMatchType] = useState("");
  const [name, setName] = useState("");
  const [matchName, setMatchName] = useState("");
  const [pitch, setPitch] = useState(null);
  const [history, setHistory] = useState([]);

  // browser fingerprint (per device)
  const [fingerprint] = useState(() => {
    const existing = localStorage.getItem("pitch_fp");
    if (existing) return existing;
    const fp = "fp_" + Math.random().toString(36).substring(2, 10);
    localStorage.setItem("pitch_fp", fp);
    return fp;
  });

  const LOCAL_KEY = "crickedge_pitch_history_v2";

  // 🔁 load from backend first
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`${API_BASE}/api/tools/pitch-randomizer/history?limit=60`);
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
          // show only 10 in UI
          const ten = mapped.slice(0, 10);
          setHistory(ten);
          localStorage.setItem(LOCAL_KEY, JSON.stringify(ten));
          return;
        }
      } catch (err) {
        console.warn("Backend not reachable, using local fallback", err);
      }

      // fallback to local
      try {
        const stored = localStorage.getItem(LOCAL_KEY);
        if (stored) setHistory(JSON.parse(stored));
      } catch (e) {
        console.warn("Local history load failed:", e);
      }
    })();
  }, []);

  // keep local copy in sync
  useEffect(() => {
    localStorage.setItem(LOCAL_KEY, JSON.stringify(history));
  }, [history]);

  const getRandom = (arr) => arr[Math.floor(Math.random() * arr.length)];

  const generatePitch = async () => {
    if (!matchType) return alert("Please select Match Type (ODI / T20 / Test).");
    if (!name.trim() || !matchName.trim())
      return alert("Please enter both your name and match name.");

    // -----------------------------
    // 1. build pitch object (UI)
    // -----------------------------
    let hardness = "Medium";
    let selectedPitchType;
    let selectedPitchAge;

    // ✅ TEST
    if (matchType === "Test") {
      // 70% medium, 30% hard
      const r = Math.random() * 100;
      hardness = r < 70 ? "Medium" : "Hard";

      const testFriendlyTypes = ["Standard", "Dry", "Grassy", "Grassy/Dry"];

      if (hardness === "Hard") {
        // hard TEST → Day 2 only (no Day 3)
        selectedPitchType = getRandom(["Standard", "Dry", "Grassy/Dry"]);
        selectedPitchAge = "Day 2";
      } else {
        // medium test wicket → Day 1 or Day 2
        selectedPitchType = getRandom(testFriendlyTypes);
        selectedPitchAge = getRandom(pitchAgesMax2);
      }
    }
    // ✅ ODI / T20
    else {
      const r = Math.random() * 100;
      hardness = "Medium";
      if (r < 15) hardness = "Soft";
      else if (r > 85) hardness = "Hard";

      if (hardness === "Hard") {
        // hard LOI → Day 2 only
        selectedPitchType = getRandom(["Standard", "Dry", "Grassy/Dry"]);
        selectedPitchAge = "Day 2";
      } else if (hardness === "Soft") {
        // soft LOI → Day 1
        selectedPitchType = getRandom(pitchTypes.filter((t) => t !== "Dusty"));
        selectedPitchAge = "Day 1";
      } else {
        // medium LOI → Day 1 or 2
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

    // temp (before server response)
    let tempPitch = {
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

    // show immediately
    setPitch(tempPitch);

    // -----------------------------
    // 2. send to backend
    // -----------------------------
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
        // server may mark as duplicate & set real timestamp
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

        // if server cleared history → start fresh
        if (json.history_cleared) {
          setPitch(finalPitch);
          setHistory([finalPitch]);
          return;
        }

        // otherwise prepend & cap at 10
        setPitch(finalPitch);
        setHistory((prev) => {
          const next = [finalPitch, ...prev];
          return next.slice(0, 10);
        });

        if (json.is_duplicate) {
          alert("⚠ Duplicate pitch detected — try again after 1 minute.");
        }
      }
    } catch (err) {
      console.warn("Could not send pitch log to backend:", err);
      // fallback: keep locally, cap at 10
      setHistory((prev) => {
        const next = [tempPitch, ...prev];
        return next.slice(0, 10);
      });
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

      {/* result */}
      {pitch && (
        <div className={`pitch-result fade-in ${pitch.duplicate ? "duplicate-box" : ""}`}>
          <h3>
            {pitch.matchType} Pitch Generated for {pitch.name} ({pitch.matchName})
            {pitch.duplicate && <span className="dup-warning"> ⚠ Duplicate (within 1 min)</span>}
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

      {/* history - back to TABLE */}
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
            (Holds max 10 rows. When 11th is generated, old 10 are purged from DB/UI and the list restarts
            from #1.)
          </p>
        </div>
      )}
    </div>
  );
}
