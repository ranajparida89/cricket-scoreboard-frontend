import React, { useEffect, useState } from "react";
import axios from "axios";
import "./PlayerAchievementForm.css";

const API_BASE = "https://cricket-scoreboard-backend.onrender.com";

const PlayerAchievementForm = () => {
  const [dashboard, setDashboard] = useState({
    totalAchievements: 0,
    verifiedAchievements: 0,
    hallOfFame: 0,
    legendaryAchievements: 0,
  });

  const [formData, setFormData] = useState({
    matchType: "",
    matchName: "",
    teamName: "",
    playerName: "",
    achievementDate: "",

    category: "",
    achievement: "",

    runs: "",
    balls: "",
    fours: "",
    sixes: "",

    wickets: "",
    overs: "",
    runsConceded: "",

    catches: "",
    stumpings: "",
    runOuts: "",

    remarks: "",
  });

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      const res = await axios.get(
        `${API_BASE}/api/player-achievements/dashboard`
      );

      setDashboard(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  return (
    <div className="achievement-page">

      {/* HEADER */}

      <div className="achievement-header">
        <h1>🏆 CrickEdge Achievement Center</h1>

        <p>
          Capture, verify and celebrate extraordinary cricket performances.
        </p>
      </div>

      {/* DASHBOARD */}

      <div className="dashboard-grid">

        <div className="dashboard-card">
          <span>Total Achievements</span>
          <h2>{dashboard.totalAchievements}</h2>
        </div>

        <div className="dashboard-card">
          <span>Verified</span>
          <h2>{dashboard.verifiedAchievements}</h2>
        </div>

        <div className="dashboard-card">
          <span>Hall Of Fame</span>
          <h2>{dashboard.hallOfFame}</h2>
        </div>

        <div className="dashboard-card">
          <span>Legendary</span>
          <h2>{dashboard.legendaryAchievements}</h2>
        </div>

      </div>

      {/* MAIN CONTENT */}

      <div className="achievement-layout">

        {/* LEFT SIDE */}

        <div className="achievement-form">

          <div className="card-section">
            <h3>Match Information</h3>

            <div className="form-grid">

              <div className="form-group">
                <label>Match Type</label>

                <select
                  name="matchType"
                  value={formData.matchType}
                  onChange={handleChange}
                >
                  <option value="">Select</option>
                  <option value="ODI">ODI</option>
                  <option value="T20">T20</option>
                  <option value="TEST">TEST</option>
                </select>
              </div>

              <div className="form-group">
                <label>Match Name</label>

                <input
                  type="text"
                  name="matchName"
                  value={formData.matchName}
                  onChange={handleChange}
                />
              </div>

              <div className="form-group">
                <label>Team Name</label>

                <input
                  type="text"
                  name="teamName"
                  value={formData.teamName}
                  onChange={handleChange}
                />
              </div>

              <div className="form-group">
                <label>Player Name</label>

                <input
                  type="text"
                  name="playerName"
                  value={formData.playerName}
                  onChange={handleChange}
                />
              </div>

              <div className="form-group">
                <label>Achievement Date</label>

                <input
                  type="date"
                  name="achievementDate"
                  value={formData.achievementDate}
                  onChange={handleChange}
                />
              </div>

            </div>
          </div>

          <div className="card-section">

            <h3>Achievement Information</h3>

            <div className="form-grid">

              <div className="form-group">
                <label>Category</label>

                <select
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                >
                  <option value="">Select</option>

                  <option value="Batting">Batting</option>
                  <option value="Bowling">Bowling</option>
                  <option value="Fielding">Fielding</option>
                  <option value="Wicket Keeping">
                    Wicket Keeping
                  </option>

                  <option value="All Round">
                    All Round
                  </option>
                </select>
              </div>

              <div className="form-group">
                <label>Achievement</label>

                <input
                  type="text"
                  name="achievement"
                  value={formData.achievement}
                  onChange={handleChange}
                />
              </div>

            </div>

          </div>

        </div>

        {/* RIGHT SIDE */}

        <div className="preview-panel">

          <h3>Achievement Preview</h3>

          <div className="preview-item">
            <strong>Player:</strong>
            <span>{formData.playerName || "-"}</span>
          </div>

          <div className="preview-item">
            <strong>Team:</strong>
            <span>{formData.teamName || "-"}</span>
          </div>

          <div className="preview-item">
            <strong>Achievement:</strong>
            <span>{formData.achievement || "-"}</span>
          </div>

          <div className="preview-item">
            <strong>Category:</strong>
            <span>{formData.category || "-"}</span>
          </div>

          <div className="preview-item">
            <strong>Status:</strong>
            <span>Pending Verification</span>
          </div>

        </div>

      </div>

    </div>
  );
};

export default PlayerAchievementForm;