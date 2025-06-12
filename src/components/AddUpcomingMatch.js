// ✅ src/components/AddUpcomingMatch.js

// ✅ [CrickEdge Floating Form - Upcoming Match Scheduler | Ranaj Parida | 30-Apr-2025]

import React, { useState, useEffect } from "react";
import { FaSave } from "react-icons/fa";
import { addUpcomingMatch } from "../services/api"; // we'll create this next!
import './AddUpcomingMatch.css'; // for dark screen page Ranaj Parida

const AddUpcomingMatch = () => {
  // GPT ENHANCEMENT: Function to get tomorrow's date in yyyy-mm-dd format
  const getTomorrowDateString = () => {
    const today = new Date();
    today.setDate(today.getDate() + 1); // Move to tomorrow
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, "0");
    const dd = String(today.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  };

  // GPT ENHANCEMENT: Store tomorrow's date for use as default and min date
  const tomorrowDate = getTomorrowDateString();

const [formData, setFormData] = useState({
  match_name: "",
  match_type: "ODI",
  team_1: "",
  team_2: "",
  match_date: tomorrowDate,
  match_time: "",
  location: "",
  series_name: "",
  match_status: "Scheduled",
  day_night: "Day",
  user_id: "", // changed
});

const [teamPlaying, setTeamPlaying] = useState(""); // added file
// In effect
useEffect(() => {
  const storedUser = JSON.parse(localStorage.getItem("user"));
  setFormData((prev) => ({
    ...prev,
    user_id: storedUser?.id || "",
  }));
}, []);


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

  const normalizeAndCapitalize = (str) => {
    const cleaned = str.trim().toLowerCase();
    return cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name.startsWith("team_")
        ? normalizeAndCapitalize(value)
        : value
    }));
  };

  const validateForm = () => {
    const requiredFields = [
      "match_name", "match_type", "team_1", "team_2",
      "match_date", "match_time", "location", "match_status", "day_night"
    ];

    for (let field of requiredFields) {
      if (!formData[field] || formData[field].trim() === "") {
        return `Field "${field}" is required`;
      }
    }

    const team1 = formData.team_1.trim().toLowerCase();
    const team2 = formData.team_2.trim().toLowerCase();

    // ✅ Team names must not be identical
    if (team1 === team2) {
      return "Team 1 and Team 2 cannot be the same.";
    }

    // ✅ Minimum length check
    if (team1.length < 3 || team2.length < 3) {
      return "Team names must be at least 3 characters long.";
    }

    // ✅ Letters and spaces only
    const nameRegex = /^[A-Za-z\s]+$/;
    if (!nameRegex.test(formData.team_1) || !nameRegex.test(formData.team_2)) {
      return "Team names must contain only letters and spaces.";
    }

    // GPT ENHANCEMENT: Prevent scheduling for past or today (must be tomorrow or later)
    if (formData.match_date < tomorrowDate) {
      return "Cannot select past dates or today. Please pick tomorrow or a future date.";
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
      // GPT UPDATE: Always set created_by again from localStorage
      const storedUser = JSON.parse(localStorage.getItem("user"));
      setFormData({
        match_name: "",
        match_type: "ODI",
        team_1: "",
        team_2: "",
        match_date: tomorrowDate, // GPT CHANGE: reset to tomorrow's date
        match_time: "",
        location: "",
        series_name: "",
        match_status: "Scheduled",
        day_night: "Day",
        created_by: storedUser?.email || "", // or .id if you prefer
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

        <input
          type="text"
          name="team_1"
          placeholder="Team 1"
          value={formData.team_1}
          onChange={handleChange}
          style={{
            ...styles.input,
            borderColor:
              formData.team_1.trim().toLowerCase() === formData.team_2.trim().toLowerCase()
                ? "red"
                : "#ccc",
          }}
        />

        <input
          type="text"
          name="team_2"
          placeholder="Team 2"
          value={formData.team_2}
          onChange={handleChange}
          style={{
            ...styles.input,
            borderColor:
              formData.team_1.trim().toLowerCase() === formData.team_2.trim().toLowerCase()
                ? "red"
                : "#ccc",
          }}
        />

        {/* Auto Generated Team Playing Field */}
        <input type="text" name="team_playing" placeholder="Team Playing" value={teamPlaying} disabled style={styles.input} />

        {/* GPT CHANGE: Add min attribute to restrict past dates, and set default to tomorrow */}
        <input
          type="date"
          name="match_date"
          placeholder="Match Date"
          value={formData.match_date}
          onChange={handleChange}
          min={tomorrowDate} // GPT ENHANCEMENT: restrict to tomorrow and future
          style={styles.input}
        />

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
