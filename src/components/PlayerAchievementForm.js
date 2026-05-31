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

    const [players, setPlayers] = useState([]);
    const [achievements, setAchievements] = useState([]);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState("");

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
        loadPlayers();
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

    const loadPlayers = async () => {
        try {
            const res = await axios.get(
                `${API_BASE}/api/players/list`
            );

            setPlayers(res.data || []);
        } catch (err) {
            console.error(err);
        }
    };

    const loadAchievementsByCategory = async (
        category
    ) => {
        try {

            if (!category) {
                setAchievements([]);
                return;
            }

            const res = await axios.get(
                `${API_BASE}/api/player-achievements/master/${category}`
            );

            setAchievements(
                res.data.data || []
            );

        } catch (err) {
            console.error(err);
        }
    };

    const handleChange = (e) => {

        const { name, value } = e.target;

        setFormData((prev) => ({
            ...prev,
            [name]: value,
        }));

        if (name === "category") {
            loadAchievementsByCategory(value);
        }
    };

    const handleSubmit = async () => {
        try {

            setLoading(true);

            const payload = {
                match_type: formData.matchType,
                match_name: formData.matchName,

                team_name: formData.teamName,
                player_name: formData.playerName,

                achievement_category:
                    formData.category,

                achievement_name:
                    formData.achievement,

                achievement_date:
                    formData.achievementDate,

                runs_scored:
                    Number(formData.runs || 0),

                balls_faced:
                    Number(formData.balls || 0),

                fours:
                    Number(formData.fours || 0),

                sixes:
                    Number(formData.sixes || 0),

                wickets:
                    Number(formData.wickets || 0),

                runs_conceded:
                    Number(
                        formData.runsConceded || 0
                    ),

                catches:
                    Number(formData.catches || 0),

                stumpings:
                    Number(formData.stumpings || 0),

                run_outs:
                    Number(formData.runOuts || 0),

                remarks:
                    formData.remarks,

                created_by: "Ranaj",
            };

            const res = await axios.post(
                `${API_BASE}/api/player-achievements/register`,
                payload
            );

            setMessage(res.data.message);

            loadDashboard();

        } catch (err) {

            setMessage(
                err?.response?.data?.message ||
                "Failed to save achievement"
            );

        } finally {

            setLoading(false);

        }
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
                                    list="playerList"
                                    name="playerName"
                                    value={formData.playerName}
                                    onChange={handleChange}
                                />

                                <datalist id="playerList">

                                    {players.map((player, index) => (
                                        <option
                                            key={index}
                                            value={player}
                                        />
                                    ))}

                                </datalist>

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

                                <select
                                    name="achievement"
                                    value={formData.achievement}
                                    onChange={handleChange}
                                >

                                    <option value="">
                                        Select Achievement
                                    </option>

                                    {achievements.map((item) => (
                                        <option
                                            key={item.id}
                                            value={item.achievement_name}
                                        >
                                            {item.achievement_name}
                                        </option>
                                    ))}

                                </select>
                            </div>

                        </div>

                    </div>

                </div>
                <div className="card-section">

                    <h3>Performance Details</h3>

                    <div className="form-grid">

                        {(formData.category === "Batting" ||
                            formData.category === "All Round") && (
                                <>
                                    <input
                                        type="number"
                                        placeholder="Runs"
                                        name="runs"
                                        value={formData.runs}
                                        onChange={handleChange}
                                    />

                                    <input
                                        type="number"
                                        placeholder="Balls"
                                        name="balls"
                                        value={formData.balls}
                                        onChange={handleChange}
                                    />
                                </>
                            )}

                        {(formData.category === "Bowling" ||
                            formData.category === "All Round") && (
                                <>
                                    <input
                                        type="number"
                                        placeholder="Wickets"
                                        name="wickets"
                                        value={formData.wickets}
                                        onChange={handleChange}
                                    />

                                    <input
                                        type="number"
                                        placeholder="Runs Conceded"
                                        name="runsConceded"
                                        value={formData.runsConceded}
                                        onChange={handleChange}
                                    />
                                </>
                            )}

                    </div>

                    <div className="action-buttons">

                        <button
                            className="btn-save"
                            onClick={handleSubmit}
                            disabled={loading}
                        >
                            {loading
                                ? "Saving..."
                                : "🏆 Register Achievement"}
                        </button>

                    </div>

                    {message && (
                        <p
                            style={{
                                marginTop: "15px",
                                fontWeight: "600",
                            }}
                        >
                            {message}
                        </p>
                    )}

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