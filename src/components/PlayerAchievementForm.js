import React, { useEffect, useState } from "react";
import axios from "axios";
import "./PlayerAchievementForm.css";

const API_BASE = "https://cricket-scoreboard-backend.onrender.com";

const PlayerAchievementForm = () => {

    /* ==========================
       DASHBOARD
    ========================== */
    const [dashboard, setDashboard] = useState({
        totalAchievements: 0,
        verifiedAchievements: 0,
        hallOfFame: 0,
        legendaryAchievements: 0,
    });

    /* ==========================
       MODALS
    ========================== */
    const [showRegisterModal, setShowRegisterModal] =
        useState(false);

    const [showHistoryModal, setShowHistoryModal] =
        useState(false);

    /* ==========================
       DROPDOWNS
    ========================== */
    const [players, setPlayers] = useState([]);
    const [achievements, setAchievements] = useState([]);

    /* ==========================
       HISTORY
    ========================== */
    const [achievementHistory, setAchievementHistory] =
        useState([]);

    const [historyLoading, setHistoryLoading] =
        useState(false);

    /* ==========================
       FORM
    ========================== */
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
        wickets: "",
        overs: "",
        runsConceded: "",

        catches: "",
        stumpings: "",
        runOuts: "",

        remarks: "",
    });

    /* ==========================
       INITIAL LOAD
    ========================== */

    useEffect(() => {
        loadDashboard();
        loadPlayers();
    }, []);

    /* ==========================
       DASHBOARD API
    ========================== */

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

    /* ==========================
       PLAYER API
    ========================== */

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

    /* ==========================
       ACHIEVEMENT MASTER
    ========================== */

    const loadAchievementsByCategory =
        async (category) => {
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

    /* ==========================
       ACHIEVEMENT HISTORY
    ========================== */

    const loadAchievementHistory =
        async () => {
            try {

                setHistoryLoading(true);

                const res = await axios.get(
                    `${API_BASE}/api/player-achievements/all`
                );

                setAchievementHistory(
                    res.data.data || []
                );

            } catch (err) {

                console.error(err);

            } finally {

                setHistoryLoading(false);

            }
        };

    /* ==========================
       HANDLE CHANGE
    ========================== */

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

    /* ==========================
       RESET FORM
    ========================== */

    const resetForm = () => {

        setFormData({
            matchType: "",
            matchName: "",
            teamName: "",
            playerName: "",
            achievementDate: "",

            category: "",
            achievement: "",

            runs: "",
            balls: "",
            wickets: "",
            overs: "",
            runsConceded: "",
            catches: "",
            stumpings: "",
            runOuts: "",
            remarks: "",
        });

        setAchievements([]);
        setMessage("");
    };

    /* ==========================
       SAVE ACHIEVEMENT
    ========================== */

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

            setMessage(
                res.data.message ||
                "Achievement Saved Successfully"
            );

            loadDashboard();
            loadAchievementHistory();

            setTimeout(() => {
                setShowRegisterModal(false);
                resetForm();
            }, 1500);

        } catch (err) {

            setMessage(
                err?.response?.data?.message ||
                "Failed to Save Achievement"
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
                    <h2>{dashboard.totalAchievements || 0}</h2>
                </div>

                <div className="dashboard-card">
                    <span>Verified</span>
                    <h2>{dashboard.verifiedAchievements || 0}</h2>
                </div>

                <div className="dashboard-card">
                    <span>Hall Of Fame</span>
                    <h2>{dashboard.hallOfFame || 0}</h2>
                </div>

                <div className="dashboard-card">
                    <span>Legendary</span>
                    <h2>{dashboard.legendaryAchievements || 0}</h2>
                </div>

            </div>

            {/* ACTION CARDS */}

            <div className="achievement-actions">

                <div
                    className="action-card register-card"
                    onClick={() => setShowRegisterModal(true)}
                >
                    <h2>🏆 Register Achievement</h2>

                    <p>
                        Submit a new achievement for any player.
                    </p>
                </div>

                <div
                    className="action-card history-card"
                    onClick={() => {
                        setShowHistoryModal(true);
                        loadAchievementHistory();
                    }}
                >
                    <h2>📋 Show Achievements</h2>

                    <p>
                        View all recorded achievements.
                    </p>
                </div>

            </div>

            {/* REGISTER MODAL */}

            {showRegisterModal && (

                <div className="modal-overlay">

                    <div className="achievement-modal">

                        <h2>🏆 Register Achievement</h2>

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
                            <div className="form-group player-search-box">

                                <label>Player Name</label>

                                <input
                                    type="text"
                                    name="playerName"
                                    placeholder="Search or type player name"
                                    value={formData.playerName}
                                    onChange={handleChange}
                                />

                                {formData.playerName && (
                                    <div className="player-suggestion-list">

                                        {players
                                            .filter((player) =>
                                                player
                                                    .toLowerCase()
                                                    .includes(formData.playerName.toLowerCase())
                                            )
                                            .slice(0, 10)
                                            .map((player, index) => (
                                                <div
                                                    key={index}
                                                    className="player-suggestion-item"
                                                    onClick={() =>
                                                        setFormData((prev) => ({
                                                            ...prev,
                                                            playerName: player,
                                                        }))
                                                    }
                                                >
                                                    {player}
                                                </div>
                                            ))}

                                    </div>
                                )}

                            </div>

                            <div className="form-group">
                                <label>Achievement Date</label>

                                <input
                                    type="date"
                                    name="achievementDate"
                                    value={formData.achievementDate}
                                    max={new Date().toISOString().split("T")[0]}
                                    onChange={handleChange}
                                />
                            </div>

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

                        {/* PERFORMANCE */}

                        <div className="performance-section">

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

                        </div>

                        {message && (
                            <div className="success-message">
                                {message}
                            </div>
                        )}

                        <div className="action-buttons">

                            <button
                                className="btn-save"
                                onClick={handleSubmit}
                                disabled={loading}
                            >
                                {loading
                                    ? "Saving..."
                                    : "Submit Achievement"}
                            </button>

                            <button
                                className="btn-reset"
                                onClick={() =>
                                    setShowRegisterModal(false)
                                }
                            >
                                Cancel
                            </button>

                        </div>

                    </div>

                </div>

            )}

            {/* HISTORY MODAL */}

            {showHistoryModal && (

                <div className="modal-overlay">

                    <div className="history-modal">

                        <div className="history-header">

                            <h2>
                                📋 Achievement History
                            </h2>

                            <button
                                className="btn-reset"
                                onClick={() =>
                                    setShowHistoryModal(false)
                                }
                            >
                                Close
                            </button>

                        </div>

                        {historyLoading ? (

                            <p>Loading...</p>

                        ) : (

                            <div className="history-table">

                                <table>

                                    <thead>
                                        <tr>
                                            <th>ID</th>
                                            <th>Player</th>
                                            <th>Team</th>
                                            <th>Achievement</th>
                                            <th>Category</th>
                                            <th>Points</th>
                                            <th>Status</th>
                                        </tr>
                                    </thead>

                                    <tbody>

                                        {achievementHistory.map(
                                            (row) => (
                                                <tr
                                                    key={row.id}
                                                >
                                                    <td>
                                                        {row.achievement_id}
                                                    </td>

                                                    <td>
                                                        {row.player_name}
                                                    </td>

                                                    <td>
                                                        {row.team_name}
                                                    </td>

                                                    <td>
                                                        {row.achievement_name}
                                                    </td>

                                                    <td>
                                                        {row.achievement_category}
                                                    </td>

                                                    <td>
                                                        {row.achievement_points}
                                                    </td>

                                                    <td>
                                                        {row.status}
                                                    </td>
                                                </tr>
                                            )
                                        )}

                                    </tbody>

                                </table>

                            </div>

                        )}

                    </div>

                </div>

            )}

        </div>
    );
};

export default PlayerAchievementForm;