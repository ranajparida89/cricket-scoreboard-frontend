// ✅ src/components/AddUpcomingMatch.js
// ✅ [CrickEdge Floating Form - Upcoming Match Scheduler | Ranaj Parida | 30-Apr-2025]

import React, { useState, useEffect } from "react";
import { FaSave } from "react-icons/fa";
import { addUpcomingMatch } from "../services/api"; // we'll create this next!

const AddUpcomingMatch = () => {
  const [formData, setFormData] = useState({
    match_name: "",
    match_type: "ODI",
    team_1: "",
    team_2: "",
    match_date: "",
    match_time: "",
    location: "",
    series_name: "",
    match_status: "Scheduled",
    day_night: "Day",
    created_by: "admin", // Later can be dynamic
  });

  const [teamPlaying, setTeamPlaying] = useState("");

  useEffect(() => {
    if (formData.team_1 && formData.team_2) {
      const team1Formatted = normalizeTeamName(formData.team_1);
      const team2Formatted = normalizeTeamName(formData.team_2);
      setTeamPlaying(`${team1Formatted} vs ${team2Formatted}`);
    } else {
      setTeamPlaying("");
    }
  }, [formData.team_1, formData.team_2]);

  const normalizeTeamName = (name) => {
    const n = name.trim().toLowerCase();
    if (n === "ind" || n === "india") return "India";
    if (n === "aus" || n === "australia") return "Australia";
    if (n === "pak" || n === "pakistan") return "Pakistan";
    if (n === "eng" || n === "england") return "England";
    // More team normalization can be added
    return name.trim();
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const validateForm = () => {
    const requiredFields = [
      "match_name", "match_type", "team_1", "team_2",
      "match_date", "match_time", "location", "match_status", "day_night"
    ];
    for (let field of requiredFields) {
      if (!formData[field]) {
        return `Field ${field} is required`;
      }
    }
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const error = validateForm();
    if (error) {
      alert(error);
      return;
    }

    try {
      const payload = {
        ...formData,
        team_playing: teamPlaying,
      };
      console.log("🛰️ Sending match payload to backend:", payload); // handle error log
      const response = await addUpcomingMatch(payload);
      alert("Match Scheduled Successfully!");
      // Reset form
      setFormData({
        match_name: "",
        match_type: "ODI",
        team_1: "",
        team_2: "",
        match_date: "",
        match_time: "",
        location: "",
        series_name: "",
        match_status: "Scheduled",
        day_night: "Day",
        created_by: "admin",
      });
      setTeamPlaying("");
    } catch (err) {
      console.error("Error scheduling match", err);
      alert("Failed to schedule match. Please try again.");
    }
  };

  return (
    <div className="add-upcoming-match" style={styles.container}>
      <h2 style={styles.heading}>➕ Schedule Upcoming Match</h2>

      <form onSubmit={handleSubmit} style={styles.form}>
        <input type="text" name="match_name" placeholder="Match Name" value={formData.match_name} onChange={handleChange} style={styles.input} />

        <select name="match_type" value={formData.match_type} onChange={handleChange} style={styles.input}>
          <option value="ODI">ODI</option>
          <option value="T20">T20</option>
          <option value="Test">Test</option>
        </select>

        <input type="text" name="team_1" placeholder="Team 1" value={formData.team_1} onChange={handleChange} style={styles.input} />
        <input type="text" name="team_2" placeholder="Team 2" value={formData.team_2} onChange={handleChange} style={styles.input} />

        {/* Auto Generated Team Playing Field */}
        <input type="text" name="team_playing" placeholder="Team Playing" value={teamPlaying} disabled style={styles.input} />

        <input type="date" name="match_date" placeholder="Match Date" value={formData.match_date} onChange={handleChange} style={styles.input} />

        <input type="time" name="match_time" placeholder="Match Time" value={formData.match_time} onChange={handleChange} style={styles.input} />

        <input type="text" name="location" placeholder="Venue/Location" value={formData.location} onChange={handleChange} style={styles.input} />

        <input type="text" name="series_name" placeholder="Series Name" value={formData.series_name} onChange={handleChange} style={styles.input} />

        <select name="match_status" value={formData.match_status} onChange={handleChange} style={styles.input}>
          <option value="Scheduled">Scheduled</option>
          <option value="Postponed">Postponed</option>
          <option value="Cancelled">Cancelled</option>
        </select>

        <select name="day_night" value={formData.day_night} onChange={handleChange} style={styles.input}>
          <option value="Day">Day</option>
          <option value="Night">Night</option>
        </select>

        <button type="submit" style={styles.button}>
          <FaSave /> Submit
        </button>
      </form>
    </div>
  );
};

const styles = {
  container: { padding: "20px", maxWidth: "600px", margin: "auto" },
  heading: { fontSize: "24px", marginBottom: "20px", textAlign: "center" },
  form: { display: "flex", flexDirection: "column", gap: "10px" },
  input: { padding: "10px", borderRadius: "5px", border: "1px solid #ccc" },
  button: { padding: "10px", backgroundColor: "#1e90ff", color: "white", borderRadius: "5px", cursor: "pointer", border: "none" },
};

export default AddUpcomingMatch;
