import React, { useState } from "react";
import "./PitchRandomizer.css";

export default function PitchRandomizer() {
  const pitchTypes = ["Standard", "Dry", "Dusty", "Grassy", "Grassy/Dry", "Grassy/Dusty"];
  const pitchCracks = ["Light", "Heavy", "None"];
  const pitchAges = ["Day 1", "Day 2", "Day 3"];

  const [name, setName] = useState("");
  const [pitch, setPitch] = useState(null);
  const [history, setHistory] = useState([]);

  const getRandom = (arr) => arr[Math.floor(Math.random() * arr.length)];

  const generatePitch = () => {
    if (!name.trim()) {
      alert("Please enter your name first.");
      return;
    }

    // Weighted hardness
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

    const newPitch = {
      id: Date.now(),
      name,
      pitchType,
      hardness,
      crack,
      pitchAge,
    };

    // Consecutive check
    if (history.length > 0) {
      const last = history[0];
      if (
        last.pitchType === newPitch.pitchType &&
        last.hardness === newPitch.hardness &&
        last.pitchAge === newPitch.pitchAge
      ) {
        alert("Same pitch generated consecutively. Try again!");
        return;
      }
    }

    // Store max 10
    const updated = [newPitch, ...history].slice(0, 10);
    setPitch(newPitch);
    setHistory(updated);
  };

  return (
    <div className="pitch-container">
      <h2 className="pitch-title">🏏 Pitch Randomizer</h2>

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
        </div>
      )}

      {history.length > 0 && (
        <div className="pitch-history">
          <h4>Previous Generations</h4>
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>Type</th>
                <th>Hardness</th>
                <th>Crack</th>
                <th>Age</th>
              </tr>
            </thead>
            <tbody>
              {history.map((h, i) => (
                <tr key={h.id}>
                  <td>{i + 1}</td>
                  <td>{h.pitchType}</td>
                  <td>{h.hardness}</td>
                  <td>{h.crack}</td>
                  <td>{h.pitchAge}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
