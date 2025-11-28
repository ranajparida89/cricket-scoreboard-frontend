// src/components/BoardRegistrationForm.js

import React, { useState } from "react";
import axios from "axios";
import { Player } from "@lottiefiles/react-lottie-player";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useLocation } from "react-router-dom"; // [2025-11-28] NEW
import "./BoardRegistrationForm.css";

// [2025-11-28] Helper to build initial form (create vs edit)
const buildInitialForm = (editingBoard) => {
  const today = new Date().toISOString().split("T")[0];

  if (!editingBoard) {
    // 👉 Create mode (new board)
    return {
      board_name: "",
      owner_name: "",
      registration_date: today,
      owner_email: "",
      teams: [""],
    };
  }

  // 👉 Edit mode: prefill with existing board + teams
  return {
    board_name: editingBoard.board_name || "",
    owner_name: editingBoard.owner_name || "",
    // registration_date from backend is already YYYY-MM-DD
    registration_date:
      editingBoard.registration_date || today,
    owner_email: editingBoard.owner_email || "",
    teams:
      Array.isArray(editingBoard.teams) && editingBoard.teams.length
        ? editingBoard.teams
        : [""],
  };
};

const BoardRegistrationForm = () => {
  // [2025-11-28] Read data passed from "Registered Cricket Boards" page
  const location = useLocation();
  const routeState = location.state || {};
  const editingBoard = routeState.board || routeState.editingBoard || null;
  const isEditMode = !!editingBoard;
  const registrationId = editingBoard?.registration_id || null;

  const [formData, setFormData] = useState(() =>
    buildInitialForm(editingBoard)
  );

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

    const { board_name, owner_name, registration_date, owner_email, teams } =
      formData;

    // ✅ Common validation for both create + edit
    if (!board_name || !owner_name || !registration_date || !owner_email) {
      toast.error("All fields are required.");
      return;
    }

    if (!validateEmail(owner_email)) {
      toast.error("Invalid email format.");
      return;
    }

    if (teams.length === 0 || teams.some((t) => !t.trim())) {
      toast.error("Please enter valid team names.");
      return;
    }

    // [2025-11-28] Date check ONLY for NEW boards
    if (!isEditMode) {
      const todayMidnight = new Date();
      todayMidnight.setHours(0, 0, 0, 0);
      const chosen = new Date(registration_date);
      if (chosen < todayMidnight) {
        toast.error("Registration date must be today or later.");
        return;
      }
    }

    try {
      setSubmitting(true);
      setSubmittedSuccess(false);
      setSubmittedError(false);

      if (isEditMode && registrationId) {
        // [2025-11-28] EDIT MODE → PUT update
        await axios.put(
          `https://cricket-scoreboard-backend.onrender.com/api/boards/update/${registrationId}`,
          formData
        );
        toast.success("Board updated successfully!");
      } else {
        // CREATE MODE → POST register (existing behaviour)
        await axios.post(
          "https://cricket-scoreboard-backend.onrender.com/api/boards/register",
          formData
        );
        toast.success("Board registered successfully!");

        // reset form only for create
        const today = new Date().toISOString().split("T")[0];
        setFormData({
          board_name: "",
          owner_name: "",
          registration_date: today,
          owner_email: "",
          teams: [""],
        });
      }

      setSubmittedSuccess(true);
    } catch (error) {
      console.error("Board save error:", error?.response || error);
      const msg =
        error?.response?.data?.error ||
        (isEditMode
          ? "Something went wrong while updating the board."
          : "Something went wrong during registration.");
      toast.error(msg);
      setSubmittedError(true);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="form-container">
      {/* [2025-11-28] Dynamic title */}
      <h1>{isEditMode ? "🏏 Update Board" : "🏏 Board Registration"}</h1>

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
          {submitting
            ? isEditMode
              ? "Updating..."
              : "Registering..."
            : isEditMode
            ? "Update Board"
            : "Register Board"}
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
          <p>
            {isEditMode
              ? "Board details updated successfully!"
              : "Thank you for registering!"}
          </p>
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
