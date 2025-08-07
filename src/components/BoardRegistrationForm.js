// src/components/BoardRegistrationForm.js

import React, { useState } from "react";
import axios from "axios";
import { Player } from "@lottiefiles/react-lottie-player";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "./BoardRegistrationForm.css";

const BoardRegistrationForm = () => {
  const [formData, setFormData] = useState({
    board_name: "",
    owner_name: "",
    registration_date: new Date().toISOString().split("T")[0],
    owner_email: "",
    teams: [""],
  });

  const [submitting, setSubmitting] = useState(false);
  const [submittedSuccess, setSubmittedSuccess] = useState(false);
  const [submittedError, setSubmittedError] = useState(false);

  const validateEmail = (email) =>
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const handleChange = (e, index) => {
    const { name, value } = e.target;

    if (name === "teams") {
      const updatedTeams = [...formData.teams];
      updatedTeams[index] = value;
      setFormData({ ...formData, teams: updatedTeams });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const addTeam = () => {
    setFormData({ ...formData, teams: [...formData.teams, ""] });
  };

  const removeTeam = (index) => {
    const updatedTeams = formData.teams.filter((_, i) => i !== index);
    setFormData({ ...formData, teams: updatedTeams });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // ✅ Validation
    const { board_name, owner_name, registration_date, owner_email, teams } =
      formData;

    if (!board_name || !owner_name || !registration_date || !owner_email) {
      toast.error("All fields are required.");
      return;
    }

    if (!validateEmail(owner_email)) {
      toast.error("Invalid email format.");
      return;
    }

    if (new Date(registration_date) < new Date().setHours(0, 0, 0, 0)) {
      toast.error("Registration date must be today or later.");
      return;
    }

    if (teams.length === 0 || teams.some((t) => !t.trim())) {
      toast.error("Please enter valid team names.");
      return;
    }

    try {
      setSubmitting(true);
      setSubmittedSuccess(false);
      setSubmittedError(false);

      const response = await axios.post(
        "https://cricket-scoreboard-backend.onrender.com/api/boards/register",
        formData
      );

      toast.success("Board registered successfully!");
      setSubmittedSuccess(true);
      setFormData({
        board_name: "",
        owner_name: "",
        registration_date: new Date().toISOString().split("T")[0],
        owner_email: "",
        teams: [""],
      });
    } catch (error) {
      toast.error("Something went wrong during registration.");
      setSubmittedError(true);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="form-container">
      <h1>🏏 Board Registration</h1>
      <form onSubmit={handleSubmit} className="registration-form">
        <input
          type="text"
          name="board_name"
          placeholder="Board Name"
          value={formData.board_name}
          onChange={handleChange}
        />
        <input
          type="text"
          name="owner_name"
          placeholder="Owner Name"
          value={formData.owner_name}
          onChange={handleChange}
        />
        <input
          type="date"
          name="registration_date"
          value={formData.registration_date}
          onChange={handleChange}
        />
        <input
          type="email"
          name="owner_email"
          placeholder="Owner Email"
          value={formData.owner_email}
          onChange={handleChange}
        />

        <label>Team Names:</label>
        {formData.teams.map((team, index) => (
          <div key={index} className="team-input-group">
            <input
              type="text"
              name="teams"
              placeholder={`Team ${index + 1}`}
              value={team}
              onChange={(e) => handleChange(e, index)}
            />
            {formData.teams.length > 1 && (
              <button type="button" onClick={() => removeTeam(index)}>
                ❌
              </button>
            )}
          </div>
        ))}
        <button type="button" onClick={addTeam} className="add-team-btn">
          ➕ Add Team
        </button>

        <button type="submit" disabled={submitting}>
          {submitting ? "Registering..." : "Register Board"}
        </button>
      </form>

      {/* ✅ Lottie Success Animation */}
      {submittedSuccess && (
        <div className="lottie-animation">
          <Player
            autoplay
            loop
            src="https://assets10.lottiefiles.com/packages/lf20_xd9ypluc.json"
            style={{ height: "200px", width: "200px" }}
          />
          <p>Thank you for registering!</p>
        </div>
      )}

      {/* ❌ Lottie Error Animation */}
      {submittedError && (
        <div className="lottie-animation">
          <Player
            autoplay
            loop
            src="https://assets2.lottiefiles.com/packages/lf20_qp1q7mct.json"
            style={{ height: "200px", width: "200px" }}
          />
          <p>Oops! Something went wrong.</p>
        </div>
      )}

      <ToastContainer position="top-right" autoClose={3000} />
    </div>
  );
};

export default BoardRegistrationForm;
