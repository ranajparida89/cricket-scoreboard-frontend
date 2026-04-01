import React,
{ useEffect, useState }
    from "react";

import axios from "axios";

import "./Funds.css";

export default function TournamentAdminDashboard() {

    const [tournaments, setTournaments] = useState([]);
    const [selected, setSelected] = useState(null);
    const [boards, setBoards] = useState([]);

    const BACKEND =
        "https://cricket-scoreboard-backend.onrender.com";


    useEffect(() => {

        loadTournaments();

    }, []);


    const loadTournaments = async () => {

        try {

            const res =
                await axios.get(

                    `${BACKEND}/api/funds/tournaments`

                );

            setTournaments(res.data || []);

        }
        catch (err) {

            console.log(err);

        }

    };


    const loadBoards = async (id) => {

        try {

            const res =
                await axios.get(

                    `${BACKEND}/api/funds/tournament-boards/${id}`

                );

            setBoards(res.data || []);

            setSelected(id);

        }
        catch (err) {

            console.log(err);

        }

    };


    const closeTournament = async (id) => {
        const deleteTournament = async (id) => {

            if (!window.confirm(
                "Remove this tournament permanently?"
            )) return;

            try {

                await axios.delete(

                    `${BACKEND}/api/funds/delete-tournament/${id}`

                );

                loadTournaments();

                alert("Tournament removed");

            } catch (err) {

                console.log(err);

            }

        };

        if (!window.confirm(
            "Close this tournament?"
        )) return;

        try {

            await axios.put(

                `${BACKEND}/api/funds/close-tournament/${id}`

            );

            loadTournaments();

            alert("Tournament closed");

        }
        catch (err) {

            console.log(err);

        }

    };


    return (

        <div className="fundsPage">

            <div className="sectionTitle">

                Tournament Administration

            </div>


            {/* ✅ TABLE FIX */}

            <div className="tableContainer">

                <table className="txTable">

                    <thead>

                        <tr>

                            <th>Name</th>
                            <th>Type</th>
                            <th>Entry Fee</th>
                            <th>Date</th>
                            <th>Status</th>
                            <th>Actions</th>

                        </tr>

                    </thead>

                    <tbody>

                        {(tournaments || []).map(t => (

                            <tr key={t.tournament_id}>

                                <td>

                                    {t.tournament_name}

                                </td>

                                <td>

                                    {t.tournament_type}

                                </td>

                                <td>

                                    CE$ {Number(
                                        t.entry_fee
                                    ).toLocaleString()}

                                </td>

                                <td>

                                    {t.start_date?.substring(0, 10)}

                                </td>

                                <td>

                                    {t.tournament_status === "REGISTRATION_OPEN" && (

                                        <span className="status stable">
                                            RUNNING
                                        </span>

                                    )}

                                    {t.tournament_status === "REGISTRATION_CLOSED" && (

                                        <span className="status weak">
                                            CLOSED
                                        </span>

                                    )}

                                    {t.tournament_status === "COMPLETED" && (

                                        <span className="status strong">
                                            COMPLETED
                                        </span>

                                    )}

                                    {t.tournament_status === "CANCELLED" && (

                                        <span className="failedStatus">
                                            CANCELLED
                                        </span>

                                    )}

                                </td>

                                <td className="registrationActions">

                                    <button

                                        className="manage-btn add-btn"

                                        onClick={() =>
                                            loadBoards(
                                                t.tournament_id
                                            )}

                                    >

                                        View Boards

                                    </button>

                                    {t.tournament_status === "REGISTRATION_OPEN" && (

                                        <button

                                            className="manage-btn delete-btn"

                                            onClick={() =>
                                                closeTournament(
                                                    t.tournament_id
                                                )}

                                        >

                                            Close

                                        </button>

                                    )}

                                    {t.tournament_status !== "REGISTRATION_OPEN" && (

                                        <button

                                            className="manage-btn delete-btn"

                                            onClick={() =>
                                                deleteTournament(
                                                    t.tournament_id
                                                )}

                                        >

                                            Remove

                                        </button>

                                    )}

                                </td>
                            </tr>

                        ))}

                    </tbody>

                </table>

            </div>


            {selected && (

                <>

                    <div className="sectionTitle">

                        Registered Boards

                    </div>


                    {/* ✅ SECOND TABLE FIX */}

                    <div className="tableContainer">

                        <table className="txTable">

                            <thead>

                                <tr>

                                    <th>Board</th>
                                    <th>Entry Fee</th>
                                    <th>Registered Date</th>

                                </tr>

                            </thead>

                            <tbody>

                                {(boards || []).map(b => (

                                    <tr key={b.board_id}>

                                        <td>

                                            {b.board_name}

                                        </td>

                                        <td>

                                            CE$ {Number(
                                                b.entry_fee
                                            ).toLocaleString()}

                                        </td>

                                        <td>

                                            {b.registered_at
                                                ?.substring(0, 10)}

                                        </td>

                                    </tr>

                                ))}

                            </tbody>

                        </table>

                    </div>

                </>

            )}

        </div>

    );

}