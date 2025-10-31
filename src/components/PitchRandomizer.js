import React, { useState, useEffect } from "react";
import "./PitchRandomizer.css";

export default function PitchRandomizer() {
  // fixed lists
  const pitchTypes = ["Standard", "Dry", "Dusty", "Grassy", "Grassy/Dry", "Grassy/Dusty"];
  const pitchCracks = ["Light", "Heavy", "None"];
  const pitchAges = ["Day 1", "Day 2", "Day 3"];

  const [name, setName] = useState("");
  const [pitch, setPitch] = useState(null);
  const [history, setHistory] = useState([]);

  const HISTORY_KEY = "crickedge_pitch_history";

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

  // 📤 whenever history changes, save to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
    } catch (e) {
      console.warn("Pitch history save failed:", e);
    }
  }, [history]);

  const getRandom = (arr) => arr[Math.floor(Math.random() * arr.length)];

  const generatePitch = () => {
    if (!name.trim()) {
      alert("Please enter your name first.");
      return;
    }

    // 🎯 weighted hardness: 70% Medium, 15% Soft, 15% Hard
    const hardnessRand = Math.random() * 100;
    let hardness = "Medium"; // default 70%
    if (hardnessRand < 15) {
      hardness = "Soft";
    } else if (hardnessRand > 85) {
      hardness = "Hard";
    }

    let pitchType, pitchAge;

    // rule: Hard -> Day 3 + (Standard/Dry/Grassy-Dry)
    if (hardness === "Hard") {
      pitchType = getRandom(["Standard", "Dry", "Grassy/Dry"]);
      pitchAge = "Day 3";
    }
    // rule: Soft -> not Dusty, Day 1
    else if (hardness === "Soft") {
      pitchType = getRandom(pitchTypes.filter((t) => t !== "Dusty"));
      pitchAge = "Day 1";
    }
    // otherwise full random
    else {
      pitchType = getRandom(pitchTypes);
      pitchAge = getRandom(pitchAges);
    }

    const crack = getRandom(pitchCracks);

    const now = new Date();
    const formattedTime = now.toLocaleString(); // e.g. "11/1/2025, 4:48:22 PM"

    const newPitch = {
      id: Date.now(),
      name: name.trim(),
      pitchType,
      hardness,
      crack,
      pitchAge,
      time: formattedTime,
    };

    // 🚨 anti-abuse: avoid exact consecutive same pitch
    if (history.length > 0) {
      const last = history[0];
      const isSame =
        last.pitchType === newPitch.pitchType &&
        last.hardness === newPitch.hardness &&
        last.pitchAge === newPitch.pitchAge &&
        last.crack === newPitch.crack;

      if (isSame) {
        alert("Same pitch got generated consecutively for this session. Please try again.");
        return;
      }
    }

    // keep max 25 items
    const updated = [newPitch, ...history].slice(0, 25);

    setPitch(newPitch);
    setHistory(updated);
  };

  return (
    <div className="pitch-container">
      <h2 className="pitch-title">
        <span className="emoji-icon">🏏</span> Pitch Randomizer
      </h2>

      <div className="input-group">
        <label>Enter Your Name:</label>
        <input
          type="text"
          value={name}
          placeholder="e.g. Ranaj Parida"
          onChange={(e) => setName(e.target.value)}
        />
      </div>

      <button className="btn-generate" onClick={generatePitch}>
        Generate Pitch
      </button>

      {pitch && (
        <div className="pitch-result fade-in">
          <h3>Pitch Generated for {pitch.name}</h3>
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
                <th>Type</th>
                <th>Hardness</th>
                <th>Crack</th>
                <th>Age</th>
                <th>Generated At</th>
              </tr>
            </thead>
            <tbody>
              {history.map((h, i) => (
                <tr key={h.id}>
                  <td>{i + 1}</td>
                  <td>{h.name}</td>
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
            (Stored locally in this browser. Clear browser storage to reset.)
          </p>
        </div>
      )}
    </div>
  );
}
