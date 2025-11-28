// src/components/BoardRegistrationForm.js

import React, { useState, useEffect } from "react";
import axios from "axios";
import { Player } from "@lottiefiles/react-lottie-player";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "./BoardRegistrationForm.css";

// Helper to build form state from a board object (or empty for new)
const buildInitialForm = (board) => {
  const today = new Date().toISOString().split("T")[0];

  if (!board) {
    // New board
    return {
      board_name: "",
      owner_name: "",
      registration_date: today,
      owner_email: "",
      teams: [""],
    };
  }

  // Existing board → prefill
  return {
    board_name: board.board_name || "",
    owner_name: board.owner_name || "",
    registration_date: board.registration_date || today, // already YYYY-MM-DD
    owner_email: board.owner_email || "",
    teams:
      Array.isArray(board.teams) && board.teams.length
        ? board.teams
        : [""],
  };
};

const BoardRegistrationForm = () => {
  // [2025-11-28] Mode: "new" vs "existing"
  const [mode, setMode] = useState("new"); // "new" | "existing"

  // [2025-11-28] List of all boards for "existing" mode dropdown
  const [boards, setBoards] = useState([]);
  const [selectedRegId, setSelectedRegId] = useState("");

  // [2025-11-28] Edit state derived from mode + selected board
  const isEditMode = mode === "existing" && !!selectedRegId;
  const [registrationId, setRegistrationId] = useState(null);

  const [formData, setFormData] = useState(() => buildInitialForm(null));

  const [submitting, setSubmitting] = useState(false);
  const [submittedSuccess, setSubmittedSuccess] = useState(false);
  const [submittedError, setSubmittedError] = useState(false);

  // [2025-11-28] Fetch all boards once, for dropdown
  useEffect(() => {
    const fetchBoards = async () => {
      try {
        const res = await axios.get(
          "https://cricket-scoreboard-backend.onrender.com/api/boards/all-boards"
        );
        // backend sends { boards: [...] }
        const list = res.data?.boards || res.data || [];
        setBoards(list);
      } catch (err) {
        console.error("Error fetching boards list:", err);
        toast.error("Could not load existing boards list.");
      }
    };
    fetchBoards();
  }, []);

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

  // [2025-11-28] When user switches between "New" and "Existing"
  const handleModeChange = (newMode) => {
    setMode(newMode);

    if (newMode === "new") {
      // reset to blank new-board form
      setSelectedRegId("");
      setRegistrationId(null);
      setFormData(buildInitialForm(null));
    } else {
      // existing mode: wait until user selects a board;
      // keep current form as-is for now
    }
  };

  // [2025-11-28] When user selects an existing board from dropdown
  const handleExistingBoardSelect = (regId) => {
    setSelectedRegId(regId);

    const found = boards.find((b) => b.registration_id === regId);
    if (found) {
      setRegistrationId(found.registration_id);
      setFormData(buildInitialForm(found));
    } else {
      setRegistrationId(null);
      setFormData(buildInitialForm(null));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const { board_name, owner_name, registration_date, owner_email, teams } =
      formData;

    // Common validation
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

    // For existing mode we must have a selected board
    if (mode === "existing" && !selectedRegId) {
      toast.error("Please select an existing board to update.");
      return;
    }

    // Date rule: only enforce "today or later" for NEW boards
    if (mode === "new") {
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

      if (mode === "existing" && registrationId) {
        // UPDATE EXISTING BOARD
        await axios.put(
          `https://cricket-scoreboard-backend.onrender.com/api/boards/update/${registrationId}`,
          formData
        );
        toast.success("Board updated successfully!");
      } else {
        // CREATE NEW BOARD
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
        (mode === "existing"
          ? "Something went wrong while updating the board."
          : "Something went wrong during registration.");
      toast.error(msg);
      setSubmittedError(true);
    } finally {
      setSubmitting(false);
    }
  };

  const titleText =
    mode === "existing" && selectedRegId
      ? "🏏 Update Board"
      : "🏏 Board Registration";

  const submitLabel = submitting
    ? mode === "existing" && selectedRegId
      ? "Updating..."
      : "Registering..."
    : mode === "existing" && selectedRegId
    ? "Update Board"
    : "Register Board";

  return (
    <div className="form-container">
      <h1>{titleText}</h1>

      {/* [2025-11-28] Mode selector */}
      <div className="board-mode-toggle">
        <label>
          <input
            type="radio"
            name="boardMode"
            value="new"
            checked={mode === "new"}
            onChange={() => handleModeChange("new")}
          />
          <span>New Board</span>
        </label>
        <label>
          <input
            type="radio"
            name="boardMode"
            value="existing"
            checked={mode === "existing"}
            onChange={() => handleModeChange("existing")}
          />
          <span>Existing Board</span>
        </label>
      </div>

      {/* [2025-11-28] Existing board dropdown */}
      {mode === "existing" && (
        <div className="existing-board-select">
          <label>Select existing board:</label>
          <select
            value={selectedRegId}
            onChange={(e) => handleExistingBoardSelect(e.target.value)}
          >
            <option value="">-- Choose a board --</option>
            {boards.map((b) => (
              <option key={b.registration_id} value={b.registration_id}>
                {b.board_name}
              </option>
            ))}
          </select>
        </div>
      )}

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
          {submitLabel}
        </button>
      </form>

      {/* Lottie Success Animation */}
      {submittedSuccess && (
        <div className="lottie-animation">
          <Player
            autoplay
            loop
            src="https://assets10.lottiefiles.com/packages/lf20_xd9ypluc.json"
            style={{ height: "200px", width: "200px" }}
          />
          <p>
            {mode === "existing" && selectedRegId
              ? "Board details updated successfully!"
              : "Thank you for registering!"}
          </p>
        </div>
      )}

      {/* Lottie Error Animation */}
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
