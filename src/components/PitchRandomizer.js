import React, { useState, useEffect } from "react";
import "./PitchRandomizer.css";

export default function PitchRandomizer() {
  const pitchTypes = ["Standard", "Dry", "Dusty", "Grassy", "Grassy/Dry", "Grassy/Dusty"];
  const pitchCracks = ["Light", "Heavy", "None"];
  const pitchAges = ["Day 1", "Day 2", "Day 3"];

  const [name, setName] = useState("");
  const [matchName, setMatchName] = useState("");
  const [pitch, setPitch] = useState(null);
  const [history, setHistory] = useState([]);

  const HISTORY_KEY = "crickedge_pitch_history";

  useEffect(() => {
    try {
      const stored = localStorage.getItem(HISTORY_KEY);
      if (stored) setHistory(JSON.parse(stored));
    } catch (e) {
      console.warn("Pitch history load failed:", e);
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
    } catch (e) {
      console.warn("Pitch history save failed:", e);
    }
  }, [history]);

  const getRandom = (arr) => arr[Math.floor(Math.random() * arr.length)];

  const generatePitch = () => {
    if (!name.trim() || !matchName.trim()) {
      alert("Please enter both your name and match name (e.g. India vs Australia).");
      return;
    }

    // Weighted hardness 70% Medium, 15% Soft, 15% Hard
    const hardnessRand = Math.random() * 100;
    let hardness = "Medium";
    if (hardnessRand < 15) hardness = "Soft";
    else if (hardnessRand > 85) hardness = "Hard";

    let pitchType, pitchAge;
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

    const crack = getRandom(pitchCracks);
    const now = new Date();
    const formattedTime = now.toLocaleString("en-IN", {
      hour12: false,
      timeStyle: "medium",
      dateStyle: "short",
    });

    const newPitch = {
      id: Date.now(),
      name: name.trim(),
      matchName: matchName.trim(),
      pitchType,
      hardness,
      crack,
      pitchAge,
      time: formattedTime,
      duplicate: false,
    };

    // Check duplicate within 1 minute (same user + same match)
    if (history.length > 0) {
      const last = history.find(
        (h) => h.name === newPitch.name && h.matchName === newPitch.matchName
      );
      if (last) {
        const timeDiff = (Date.now() - last.id) / 1000; // in seconds
        if (timeDiff <= 60) {
          newPitch.duplicate = true;
        }
      }
    }

    const updated = [newPitch, ...history].slice(0, 50);
    setPitch(newPitch);
    setHistory(updated);
  };

  return (
    <div className="pitch-container wide-layout">
      <h2 className="pitch-title">
        <span className="emoji-icon">🏏</span> Pitch Randomizer
      </h2>

      <div className="form-row">
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
            Pitch Generated for {pitch.name} ({pitch.matchName})
            {pitch.duplicate && <span className="dup-warning"> ⚠ Duplicate (within 1 min)</span>}
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
          <table>
            <thead>
              <tr>
                <th>#</th>
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
          <p className="history-footnote">
            (Stored locally in this browser. Red entries indicate duplicate randomizations within 1 minute.)
          </p>
        </div>
      )}
    </div>
  );
}
