import React, { useEffect, useState } from "react";
import axios from "axios";
import "./DeclareTournamentResult.css";

export default function DeclareTournamentResult() {

    const BACKEND =
        "https://cricket-scoreboard-backend.onrender.com";

    const [tournaments, setTournaments] = useState([]);
    const [results, setResults] = useState([]);

    const [form, setForm] = useState({

        tournament_id: "",
        winner_team: "",
        runner_team: ""

    });

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    const isAdmin =
        localStorage.getItem("isAdmin") === "true";


    useEffect(() => {

        loadTournaments();
        loadResults();

    }, []);


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

        } catch {

            setError("Tournament load failed");

        }

    };


    const loadResults = async () => {

        try {

            const res =
                await axios.get(
                    `${BACKEND}/api/funds/tournament-results`
                );

            setResults(res.data);

        } catch { }

    };


    const handleChange = (e) => {

        setForm({

            ...form,
            [e.target.name]: e.target.value

        });

    };


    const validate = () => {

        if (!form.tournament_id)
            return "Tournament required";

        if (!form.winner_team.trim())
            return "Winner team required";

        if (!form.runner_team.trim())
            return "Runner team required";

        if (
            form.winner_team.toLowerCase() ===
            form.runner_team.toLowerCase()
        )
            return "Winner & Runner cannot match";

        return null;

    };


    const declareResult = async () => {

        setError("");
        setSuccess("");

        const v = validate();

        if (v) {

            setError(v);
            return;

        }

        try {

            setLoading(true);

            await axios.post(

                `${BACKEND}/api/funds/declare-result`,
                form

            );

            setSuccess("Reward distributed successfully");

            loadResults();

            setForm({

                tournament_id: "",
                winner_team: "",
                runner_team: ""

            });

        } catch (err) {

            setError(

                err.response?.data?.error ||
                "Distribution failed"

            );

        }

        setLoading(false);

    };


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

                        Declare champion & runner manually.
                        System distributes rewards automatically.

                    </div>


                    <div className="formGrid">

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


                        <input

                            name="winner_team"
                            value={form.winner_team}
                            onChange={handleChange}
                            placeholder="Enter Winner Team Name"
                            className="inputBox"
                        />


                        <input

                            name="runner_team"
                            value={form.runner_team}
                            onChange={handleChange}
                            placeholder="Enter Runner Team Name"
                            className="inputBox"
                        />

                    </div>


                    {error && (

                        <div className="errorBox">

                            ⚠ {error}

                        </div>

                    )}

                    {success && (

                        <div className="successBox">

                            ✔ {success}

                        </div>

                    )}


                    <button

                        onClick={declareResult}
                        className="declareBtn"
                        disabled={loading}

                    >

                        {loading ?

                            "Processing..."

                            :

                            "Declare Result"

                        }

                    </button>

                </div>

            )}



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

                                        No results declared

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

                                        CE$
                                        {Number(
                                            r.winner_reward
                                        ).toLocaleString()}

                                    </td>

                                    <td>

                                        CE$
                                        {Number(
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