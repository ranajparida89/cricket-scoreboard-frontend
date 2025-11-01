import React, { useState, useEffect } from "react";
import "./PitchRandomizer.css";

export default function PitchRandomizer() {
  // fixed lists
  const pitchTypes = ["Standard", "Dry", "Dusty", "Grassy", "Grassy/Dry", "Grassy/Dusty"];
  const pitchCracks = ["Light", "Heavy", "None"];
  const pitchAges = ["Day 1", "Day 2", "Day 3"];

  const [matchType, setMatchType] = useState(""); // ✅ NEW
  const [name, setName] = useState("");
  const [matchName, setMatchName] = useState("");
  const [pitch, setPitch] = useState(null);
  const [history, setHistory] = useState([]);

  const HISTORY_KEY = "crickedge_pitch_history_v2"; // 👈 new key so old data won't break

  // 📥 load from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(HISTORY_KEY);
      if (stored) {
        setHistory(JSON.parse(stored));
      }
    } catch (e) {
      console.warn("Pitch history load failed:", e);
    }
  }, []);

  // 📤 save to localStorage whenever history changes
  useEffect(() => {
    try {
      localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
    } catch (e) {
      console.warn("Pitch history save failed:", e);
    }
  }, [history]);

  const getRandom = (arr) => arr[Math.floor(Math.random() * arr.length)];

  const generatePitch = () => {
    // ✅ validation
    if (!matchType) {
      alert("Please select Match Type (ODI / T20 / Test) first.");
      return;
    }
    if (!name.trim() || !matchName.trim()) {
      alert("Please enter both your name and match name (e.g. India vs Australia).");
      return;
    }

    let hardness = "Medium";
    let pitchType;
    let pitchAge;

    // ✅ 1) MATCH TYPE = TEST
    if (matchType === "Test") {
      // 70% Medium, 30% Hard
      const r = Math.random() * 100;
      if (r < 70) {
        hardness = "Medium";
      } else {
        hardness = "Hard";
      }

      // For Test we don't want super dusty weird wickets
      const testFriendlyTypes = ["Standard", "Dry", "Grassy", "Grassy/Dry"]; // ❌ no Dusty, ❌ no Grassy/Dusty

      if (hardness === "Hard") {
        // Hard test wicket → 3rd day tendency
        pitchType = getRandom(["Standard", "Dry", "Grassy/Dry"]);
        pitchAge = "Day 3";
      } else {
        // Medium test wicket → day 2/3 feel
        pitchType = getRandom(testFriendlyTypes);
        pitchAge = getRandom(["Day 2", "Day 3"]);
      }
    }
    // ✅ 2) MATCH TYPE = ODI / T20 → old logic
    else {
      // your existing weighted logic
      const hardnessRand = Math.random() * 100;
      hardness = "Medium";
      if (hardnessRand < 15) {
        hardness = "Soft";
      } else if (hardnessRand > 85) {
        hardness = "Hard";
      }

      if (hardness === "Hard") {
        pitchType = getRandom(["Standard", "Dry", "Grassy/Dry"]);
        pitchAge = "Day 3";
      } else if (hardness === "Soft") {
        pitchType = getRandom(pitchTypes.filter((t) => t !== "Dusty"));
        pitchAge = "Day 1";
      } else {
        pitchType = getRandom(pitchTypes);
        pitchAge = getRandom(pitchAges);
      }
    }

    const crack = getRandom(pitchCracks);

    // timestamp
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
      pitchType,
      hardness,
      crack,
      pitchAge,
      time: formattedTime,
      duplicate: false,
    };

    // ✅ duplicate check: same user + same match + same matchType within 1 minute
    if (history.length > 0) {
      const lastSameUserAndMatch = history.find(
        (h) =>
          h.name === newPitch.name &&
          h.matchName === newPitch.matchName &&
          h.matchType === newPitch.matchType
      );
      if (lastSameUserAndMatch) {
        const timeDiffSec = (Date.now() - lastSameUserAndMatch.id) / 1000;
        if (timeDiffSec <= 60) {
          newPitch.duplicate = true;
        }
      }
    }

    const updated = [newPitch, ...history].slice(0, 60);
    setPitch(newPitch);
    setHistory(updated);
  };

  return (
    <div className="pitch-container wide-layout">
      <h2 className="pitch-title">
        <span className="emoji-icon">🏏</span> Pitch Randomizer
      </h2>

      {/* ✅ New Row for Match Type */}
      <div className="form-row">
        <div className="input-group">
          <label>Match Type <span className="req">*</span></label>
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

      {pitch && (
        <div className={`pitch-result fade-in ${pitch.duplicate ? "duplicate-box" : ""}`}>
          <h3>
            {pitch.matchType} Pitch Generated for {pitch.name} ({pitch.matchName})
            {pitch.duplicate && (
              <span className="dup-warning"> ⚠ Duplicate (within 1 min for same match)</span>
            )}
          </h3>
          <p><strong>Pitch Type:</strong> {pitch.pitchType}</p>
          <p><strong>Pitch Hardness:</strong> {pitch.hardness}</p>
          <p><strong>Pitch Crack:</strong> {pitch.crack}</p>
          <p><strong>Pitch Age:</strong> {pitch.pitchAge}</p>
          <p className="generated-at"><strong>Generated At:</strong> {pitch.time}</p>
        </div>
      )}

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
            (Stored locally in this browser. Red rows = duplicate attempts within 1 minute for the same user + same match + same match type.)
          </p>
        </div>
      )}
    </div>
  );
}
