import React,
{ useEffect, useState }
    from "react";

import axios from "axios";

import "./DeclareTournamentResult.css";

export default function DeclareTournamentResult() {

    const BACKEND =
        "https://cricket-scoreboard-backend.onrender.com";

    const [tournaments, setTournaments] = useState([]);

    const [form, setForm] = useState({

        tournament_id: "",
        winner_team: "",
        runner_team: ""

    });

    const [loading, setLoading] = useState(false);

    const [success, setSuccess] = useState(null);

    const [error, setError] = useState("");

    const isAdmin =
        localStorage.getItem("isAdmin") === "true";

    useEffect(() => {

        loadTournaments();

    }, []);


    /* LOAD CLOSED TOURNAMENTS */

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

            setError("Failed loading tournaments");

        }

    };


    /* HANDLE INPUT */

    const handleChange = (e) => {

        setForm({

            ...form,
            [e.target.name]: e.target.value

        });

    };


    /* VALIDATION */

    const validate = () => {

        if (!form.tournament_id)
            return "Select tournament";

        if (!form.winner_team)
            return "Enter winner team";

        if (!form.runner_team)
            return "Enter runner team";

        if (form.winner_team === form.runner_team)
            return "Winner & Runner cannot be same";

        return null;

    };


    /* DECLARE RESULT */

    const declareResult = async () => {

        setError("");

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

            setSuccess({

                tournament:
                    tournaments.find(
                        t => t.tournament_id === form.tournament_id
                    )?.tournament_name,

                winner:
                    form.winner_team,

                runner:
                    form.runner_team

            });

            setForm({

                tournament_id: "",
                winner_team: "",
                runner_team: ""

            });

        }
        catch (err) {

            setError(

                err.response?.data?.error ||

                "Distribution failed"

            );

        }

        setLoading(false);

    };


    /* ADMIN BLOCK */

    if (!isAdmin) {

        return (

            <div className="declarePage">

                <div className="noAccess">

                    Admin access required

                </div>

            </div>

        );

    }


    return (

        <div className="declarePage">

            <div className="declareCard">

                <div className="declareHeader">

                    🏆 Tournament Result Declaration

                </div>

                <div className="declareSub">

                    Declare winner & runner.
                    System will automatically distribute rewards.

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

                        className="inputBox"

                        placeholder="Winner Team"

                        name="winner_team"

                        value={form.winner_team}

                        onChange={handleChange}

                    />


                    <input

                        className="inputBox"

                        placeholder="Runner Team"

                        name="runner_team"

                        value={form.runner_team}

                        onChange={handleChange}

                    />

                </div>


                {error && (

                    <div className="errorBox">

                        {error}

                    </div>

                )}


                <button

                    onClick={declareResult}

                    disabled={loading}

                    className="declareBtn"

                >

                    {loading ?

                        "Processing Distribution..."

                        :

                        "Declare Result & Distribute Rewards"

                    }

                </button>


                {success && (

                    <div className="successPanel">

                        <div className="successTitle">

                            Result Declared Successfully

                        </div>

                        <div className="resultGrid">

                            <div className="winnerCard">

                                <div className="medal">

                                    🏆

                                </div>

                                <div className="teamName">

                                    {success.winner}

                                </div>

                                <div className="label">

                                    Champion

                                </div>

                            </div>


                            <div className="runnerCard">

                                <div className="medal">

                                    🥈

                                </div>

                                <div className="teamName">

                                    {success.runner}

                                </div>

                                <div className="label">

                                    Runner

                                </div>

                            </div>

                        </div>


                        <div className="successTournament">

                            Tournament :

                            {success.tournament}

                        </div>

                    </div>

                )}

            </div>

        </div>

    );

}