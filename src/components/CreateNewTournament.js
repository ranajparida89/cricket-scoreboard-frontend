import React,
{ useEffect, useState }
    from "react";

import axios from "axios";

import "./Funds.css";

export default function CreateNewTournament() {

    const [tournaments, setTournaments] = useState([]);

    const [form, setForm] = useState({

        tournament_name: "",
        tournament_type: "",
        start_date: ""

    });

    const [entryFee, setEntryFee] = useState(0);

    const [isAdmin, setIsAdmin] = useState(false);

    const BACKEND_URL =
        "https://cricket-scoreboard-backend.onrender.com";


    useEffect(() => {

        setIsAdmin(
            localStorage.getItem("isAdmin") === "true"
        );

        loadTournaments();

    }, []);


    const loadTournaments = async () => {

        try {

            const res =
                await axios.get(

                    `${BACKEND_URL}/api/funds/tournaments`

                );

            setTournaments(res.data);

        }
        catch (err) {

            console.log(err);

        }

    };


    /* HANDLE INPUT */

    const handleChange = (e) => {

        const { name, value } = e.target;

        setForm({

            ...form,

            [name]: value

        });

    };


    /* AUTO ENTRY FEE */

    const handleType = (e) => {

        const type = e.target.value;

        setForm({

            ...form,

            tournament_type: type

        });

        if (type === "BIG")
            setEntryFee(35000);

        else if (type === "MEDIUM")
            setEntryFee(25000);

        else if (type === "REGULAR")
            setEntryFee(15000);

        else if (type === "CHARITY")
            setEntryFee(7000);

    };


    /* CREATE TOURNAMENT */

    const createTournament = async () => {

        try {

            await axios.post(

                `${BACKEND_URL}/api/funds/create-tournament`,

                {

                    tournament_name:
                        form.tournament_name,

                    tournament_type:
                        form.tournament_type,

                    start_date:
                        form.start_date

                }

            );

            alert("Tournament Created");

            loadTournaments();

        }
        catch (err) {

            alert("Error creating");

        }

    };


    /* CLOSE TOURNAMENT */

    const closeTournament = async (id) => {

        try {

            await axios.put(

                `${BACKEND_URL}/api/funds/close-tournament/${id}`

            );

            loadTournaments();

        }
        catch (err) {

            console.log(err);

        }

    };


    if (!isAdmin) {

        return (

            <div className="fundsPage">

                Only admin can access this page.

            </div>

        );

    }


    return (

        <div className="fundsPage">

            <div className="sectionTitle">

                Create New Tournament

            </div>


            <div className="fundsGrid">

                <input

                    placeholder="Tournament Name"

                    name="tournament_name"

                    onChange={handleChange}

                />


                <select

                    onChange={handleType}

                >

                    <option>

                        Select Type

                    </option>

                    <option value="BIG">

                        Big Tournament

                    </option>

                    <option value="MEDIUM">

                        Medium Tournament

                    </option>

                    <option value="REGULAR">

                        Regular Tournament

                    </option>

                    <option value="CHARITY">

                        Charity Tournament

                    </option>

                </select>


                <input

                    type="date"

                    name="start_date"

                    onChange={handleChange}

                />


                <input

                    value={"CE$ " + entryFee}

                    readOnly

                />


                <button

                    onClick={createTournament}

                    className="manage-btn add-btn"

                >

                    Create Tournament

                </button>

            </div>


            <div className="sectionTitle">

                Created Tournaments

            </div>


            <table className="txTable">

                <thead>

                    <tr>

                        <th>Name</th>

                        <th>Type</th>

                        <th>Entry Fee</th>

                        <th>Date</th>

                        <th>Status</th>

                        <th>Action</th>

                    </tr>

                </thead>


                <tbody>

                    {tournaments.map(t => (

                        <tr key={t.tournament_id}>

                            <td>

                                {t.tournament_name}

                            </td>

                            <td>

                                {t.tournament_type}

                            </td>

                            <td>

                                CE$ {t.entry_fee}

                            </td>

                            <td>

                                {t.start_date?.substring(0, 10)}

                            </td>

                            <td>

                                <span className={
                                    t.tournament_status === "REGISTRATION_OPEN"
                                        ? "statusOpen"
                                        : "statusClosed"
                                }>

                                    {t.tournament_status}

                                </span>

                            </td>

                            <td>

                                {t.tournament_status === "REGISTRATION_OPEN" && (

                                    <button

                                        onClick={() => closeTournament(

                                            t.tournament_id

                                        )}

                                        className="manage-btn delete-btn"

                                    >

                                        Close

                                    </button>

                                )}

                            </td>

                        </tr>

                    ))}

                </tbody>

            </table>

        </div>

    );

}