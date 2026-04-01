import React, { useEffect, useState } from "react";
import axios from "axios";
import "./DeclareTournamentResult.css";

export default function DeclareTournamentResult() {

    const BACKEND =
        "https://cricket-scoreboard-backend.onrender.com";

    const [tournaments, setTournaments] = useState([]);
    const [teams, setTeams] = useState([]);
    const [results, setResults] = useState([]);

    const [form, setForm] = useState({

        tournament_id: "",
        winner_team: "",
        runner_team: ""

    });

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState(null);

    const isAdmin =
        localStorage.getItem("isAdmin") === "true";


    /* =========================
    LOAD INITIAL DATA
    ========================= */

    useEffect(() => {

        loadTournaments();
        loadResults();

    }, []);


    /* =========================
    LOAD TOURNAMENTS
    ========================= */

    const loadTournaments = async () => {

        try {

            const res =
                await axios.get(
                    `${BACKEND}/api/funds/tournaments`
                );

            const closed =
                res.data.filter(
                    t => t.tournament_status === "REGISTRATION_CLOSED"
                );

            setTournaments(closed);

        }
        catch {

            setError("Tournament load failed");

        }

    };


    /* =========================
    LOAD RESULTS
    ========================= */

    const loadResults = async () => {

        try {

            const res =
                await axios.get(

                    `${BACKEND}/api/funds/tournament-results`

                );

            setResults(res.data);

        }
        catch { }

    };


    /* =========================
    LOAD TEAMS
    ========================= */

    const loadTeams = async (id) => {

        if (!id) {

            setTeams([]);
            return;

        }

        try {

            const res =
                await axios.get(

                    `${BACKEND}/api/funds/tournament-boards/${id}`

                );

            console.log("Teams:", res.data);

            setTeams(res.data || []);

        }
        catch (err) {

            console.log("Team load error", err);

            setTeams([]);

        }

    };


    /* =========================
    HANDLE CHANGE
    ========================= */

    const handleChange = (e) => {

        const { name, value } = e.target;

        setForm(prev => ({

            ...prev,
            [name]: value

        }));

        if (name === "tournament_id") {

            loadTeams(value);

            /* RESET SELECTION */

            setForm({

                tournament_id: value,
                winner_team: "",
                runner_team: ""

            });

        }

    };


    /* =========================
    VALIDATION
    ========================= */

    const validate = () => {

        if (!form.tournament_id)
            return "Select tournament";

        if (teams.length === 0)
            return "No teams registered in this tournament";

        if (!form.winner_team)
            return "Select winner";

        if (!form.runner_team)
            return "Select runner";

        if (form.winner_team === form.runner_team)
            return "Winner and Runner cannot be same";

        return null;

    };


    /* =========================
    DECLARE RESULT
    ========================= */

    const declareResult = async () => {

        setError("");
        setSuccess(null);

        const v = validate();

        if (v) {

            setError(v);
            return;

        }

        try {

            setLoading(true);

            const res =
                await axios.post(

                    `${BACKEND}/api/funds/declare-result`,
                    form

                );

            setSuccess("Rewards distributed successfully");

            loadResults();

            setForm({

                tournament_id: "",
                winner_team: "",
                runner_team: ""

            });

            setTeams([]);

        }
        catch (err) {

            setError(

                err.response?.data?.error ||
                "Distribution failed"

            );

        }

        setLoading(false);

    };


    /* =========================
    UI
    ========================= */

    return (

        <div className="declarePage">

            {isAdmin && (

                <div className="declareCard">

                    <div className="declareHeader">

                        🏆 Result Control Panel

                        <span className="adminBadge">

                            ADMIN CONTROL

                        </span>

                    </div>

                    <div className="declareSub">

                        Declare result → system distributes rewards automatically.

                    </div>


                    <div className="formGrid">

                        {/* TOURNAMENT */}

                        <select

                            name="tournament_id"
                            value={form.tournament_id}
                            onChange={handleChange}
                            className="inputBox"

                        >

                            <option value="">

                                Select Tournament

                            </option>

                            {tournaments.map(t => (

                                <option

                                    key={t.tournament_id}
                                    value={t.tournament_id}

                                >

                                    {t.tournament_name}

                                </option>

                            ))}

                        </select>


                        {/* WINNER */}

                        <select

                            name="winner_team"
                            value={form.winner_team}
                            onChange={handleChange}
                            className="inputBox"

                        >

                            <option value="">

                                Select Winner Team

                            </option>

                            {teams.map(t => (

                                <option

                                    key={t.team_name}
                                    value={t.team_name}

                                >

                                    {t.team_name}

                                </option>

                            ))}

                        </select>


                        {/* RUNNER */}

                        <select

                            name="runner_team"
                            value={form.runner_team}
                            onChange={handleChange}
                            className="inputBox"

                        >

                            <option value="">

                                Select Runner Team

                            </option>

                            {teams.map(t => (

                                <option

                                    key={t.team_name}
                                    value={t.team_name}

                                >

                                    {t.team_name}

                                </option>

                            ))}

                        </select>

                    </div>


                    {/* ERROR */}

                    {error && (

                        <div className="errorBox">

                            {error}

                        </div>

                    )}


                    {/* SUCCESS */}

                    {success && (

                        <div className="successBox">

                            {success}

                        </div>

                    )}


                    <button

                        onClick={declareResult}
                        className="declareBtn"
                        disabled={loading}

                    >

                        {loading ?
                            "Distributing..."
                            :
                            "Declare Result"
                        }

                    </button>

                </div>

            )}



            {/* RESULTS TABLE */}

            <div className="historyCard">

                <div className="historyTitle">

                    🏆 Tournament Results

                </div>

                <div className="tableContainer">

                    <table className="txTable">

                        <thead>

                            <tr>

                                <th>Tournament</th>
                                <th>Champion</th>
                                <th>Runner</th>
                                <th>Winner Reward</th>
                                <th>Runner Reward</th>
                                <th>Date</th>

                            </tr>

                        </thead>

                        <tbody>

                            {results.length === 0 && (

                                <tr>

                                    <td colSpan="6">

                                        No results declared yet

                                    </td>

                                </tr>

                            )}

                            {results.map(r => (

                                <tr key={r.result_id}>

                                    <td>

                                        {r.tournament_name}

                                    </td>

                                    <td className="winnerText">

                                        🏆 {r.winner_team}

                                    </td>

                                    <td className="runnerText">

                                        🥈 {r.runner_team}

                                    </td>

                                    <td className="creditText">

                                        CE$ {Number(

                                            r.winner_reward

                                        ).toLocaleString()}

                                    </td>

                                    <td>

                                        CE$ {Number(

                                            r.runner_reward

                                        ).toLocaleString()}

                                    </td>

                                    <td>

                                        {r.distributed_at?.
                                            substring(0, 10)}

                                    </td>

                                </tr>

                            ))}

                        </tbody>

                    </table>

                </div>

            </div>

        </div>

    );

}