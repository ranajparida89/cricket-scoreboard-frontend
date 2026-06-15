import React, { useEffect, useState } from "react";
import axios from "axios";
import "./PlayerAchievementForm.css";
import Select from "react-select";
import CreatableSelect from "react-select/creatable";

const API_BASE = "https://cricket-scoreboard-backend.onrender.com";
const isAdminUser = () => {
    return !!localStorage.getItem("admin_jwt");
};

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

    const [showInfoModal, setShowInfoModal] =
        useState(false);

    /* ==========================
       DROPDOWNS
    ========================== */
    const [players, setPlayers] = useState([]);
    const [achievements, setAchievements] = useState([]);

    const [tournaments, setTournaments] = useState([]);

    const tournamentOptions = tournaments.map((item) => ({
        value: item.tournament_name,
        label: item.tournament_name,
    }));

    const playerOptions = players.map((player) => ({
        value: player,
        label: player,
    }));

    /* ==========================
       HISTORY
    ========================== */
    const [achievementHistory, setAchievementHistory] =
        useState([]);

    const [historyLoading, setHistoryLoading] =
        useState(false);

    const [historyFilters, setHistoryFilters] = useState({
        playerName: "",
        matchType: "",
        category: "",
    });

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

    const loadTournamentsByMatchType = async (matchType) => {
        try {
            if (!matchType) {
                setTournaments([]);
                return;
            }

            const res = await axios.get(
                `${API_BASE}/api/player-achievements/tournaments/${matchType}`
            );

            setTournaments(res.data.tournaments || []);
        } catch (err) {
            console.error("Tournament Load Error:", err);
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
        if (name === "matchType") {
            setFormData((prev) => ({
                ...prev,
                matchName: "",
            }));

            loadTournamentsByMatchType(value);
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
    const updateAchievementStatus = async (achievementId, status) => {
        try {
            await axios.put(
                `${API_BASE}/api/player-achievements/update/${achievementId}`,
                { status }
            );

            loadAchievementHistory();
            loadDashboard();

        } catch (err) {
            console.error(err);
            alert("Failed to update achievement status");
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
                <button
                    className="achievement-info-btn"
                    onClick={() => setShowInfoModal(true)}
                    title="How this module works"
                >
                    ℹ️
                </button>

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

                                <label>Tournament Name</label>

                                <Select
                                    className="player-react-select"
                                    classNamePrefix="player-select"
                                    options={tournamentOptions}
                                    placeholder="Select Tournament..."
                                    isSearchable
                                    isClearable
                                    value={
                                        formData.matchName
                                            ? {
                                                value: formData.matchName,
                                                label: formData.matchName,
                                            }
                                            : null
                                    }
                                    onChange={(selected) =>
                                        setFormData((prev) => ({
                                            ...prev,
                                            matchName: selected ? selected.value : "",
                                        }))
                                    }
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

                                <CreatableSelect
                                    className="player-react-select"
                                    classNamePrefix="player-select"
                                    options={playerOptions}
                                    placeholder="Search or type player name..."
                                    isSearchable
                                    isClearable
                                    value={
                                        formData.playerName
                                            ? {
                                                value: formData.playerName,
                                                label: formData.playerName,
                                            }
                                            : null
                                    }
                                    onChange={(selected) =>
                                        setFormData((prev) => ({
                                            ...prev,
                                            playerName: selected ? selected.value : "",
                                        }))
                                    }
                                    onCreateOption={(inputValue) => {
                                        const typedName = inputValue.trim();

                                        if (!typedName) return;

                                        setFormData((prev) => ({
                                            ...prev,
                                            playerName: typedName,
                                        }));
                                    }}
                                />

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
                        <div className="history-filters">

                            <input
                                type="text"
                                placeholder="Search Player Name..."
                                value={historyFilters.playerName}
                                onChange={(e) =>
                                    setHistoryFilters({
                                        ...historyFilters,
                                        playerName: e.target.value,
                                    })
                                }
                            />

                            <select
                                value={historyFilters.matchType}
                                onChange={(e) =>
                                    setHistoryFilters({
                                        ...historyFilters,
                                        matchType: e.target.value,
                                    })
                                }
                            >
                                <option value="">All Formats</option>
                                <option value="ODI">ODI</option>
                                <option value="T20">T20</option>
                                <option value="TEST">TEST</option>
                            </select>

                            <select
                                value={historyFilters.category}
                                onChange={(e) =>
                                    setHistoryFilters({
                                        ...historyFilters,
                                        category: e.target.value,
                                    })
                                }
                            >
                                <option value="">All Categories</option>
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
                                            <th>Action</th>
                                        </tr>
                                    </thead>

                                    <tbody>

                                        {achievementHistory
                                            .filter((row) => {

                                                const playerMatch =
                                                    !historyFilters.playerName ||
                                                    row.player_name
                                                        ?.toLowerCase()
                                                        .includes(
                                                            historyFilters.playerName.toLowerCase()
                                                        );

                                                const formatMatch =
                                                    !historyFilters.matchType ||
                                                    row.match_type === historyFilters.matchType;

                                                const categoryMatch =
                                                    !historyFilters.category ||
                                                    row.achievement_category === historyFilters.category;

                                                return playerMatch && formatMatch && categoryMatch;
                                            })
                                            .map(
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
                                                        <td>{row.status}</td>

                                                        <td>
                                                            {row.status === "Pending Verification" ? (
                                                                isAdminUser() ? (
                                                                    <div style={{ display: "flex", gap: "8px" }}>
                                                                        <button
                                                                            onClick={() =>
                                                                                updateAchievementStatus(row.achievement_id, "Verified")
                                                                            }
                                                                            style={{
                                                                                background: "#28a745",
                                                                                color: "#fff",
                                                                                border: "none",
                                                                                padding: "4px 10px",
                                                                                borderRadius: "4px",
                                                                                cursor: "pointer",
                                                                            }}
                                                                        >
                                                                            Approve
                                                                        </button>

                                                                        <button
                                                                            onClick={() =>
                                                                                updateAchievementStatus(row.achievement_id, "Rejected")
                                                                            }
                                                                            style={{
                                                                                background: "#dc3545",
                                                                                color: "#fff",
                                                                                border: "none",
                                                                                padding: "4px 10px",
                                                                                borderRadius: "4px",
                                                                                cursor: "pointer",
                                                                            }}
                                                                        >
                                                                            Reject
                                                                        </button>
                                                                    </div>
                                                                ) : (
                                                                    <span style={{ color: "#888", fontWeight: "600" }}>
                                                                        Admin only
                                                                    </span>
                                                                )
                                                            ) : (
                                                                "-"
                                                            )}
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

            {/* INFO MODAL */}

            {showInfoModal && (
                <div className="modal-overlay">

                    <div className="info-modal">

                        <div className="history-header">

                            <h2>
                                ℹ️ How Player Achievements Work
                            </h2>

                            <button
                                className="btn-reset"
                                onClick={() => setShowInfoModal(false)}
                            >
                                Close
                            </button>

                        </div>

                        <div className="info-content">

                            <p>
                                Use this module to register and track
                                special player achievements.
                            </p>

                            <ul>

                                <li>
                                    Register Achievement →
                                    Add a new player achievement.
                                </li>

                                <li>
                                    Show Achievements →
                                    View all saved achievements.
                                </li>

                                <li>
                                    Player Name →
                                    Search and select player.
                                </li>

                                <li>
                                    Category →
                                    Batting, Bowling,
                                    Fielding, Wicket Keeping,
                                    All Round.
                                </li>

                                <li>
                                    Achievement →
                                    Loaded from achievement master.
                                </li>

                                <li>
                                    Achievement Date →
                                    Current or past date only.
                                </li>

                                <li>
                                    Points →
                                    Auto calculated from
                                    achievement master.
                                </li>

                            </ul>

                        </div>

                    </div>

                </div>
            )}
        </div>
    );
};

export default PlayerAchievementForm;