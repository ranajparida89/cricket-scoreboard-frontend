import React, { useEffect, useState } from "react";
import axios from "axios";
import "./Funds.css";
import { useAuth } from "../services/auth";

export default function TournamentRegistration() {

    const { currentUser } = useAuth();

    const [tournaments, setTournaments] = useState([]);
    const [board, setBoard] = useState(null);
    const [loading, setLoading] = useState(true);

    const [showPopup, setShowPopup] = useState(false);
    const [selected, setSelected] = useState(null);
    const [consent, setConsent] = useState(false);

    const BACKEND_URL = "https://cricket-scoreboard-backend.onrender.com";


    useEffect(() => {
        loadData();
    }, [currentUser]);


    const loadData = async () => {

        try {

            /* LOAD TOURNAMENTS */

            const tournamentRes =
                await axios.get(
                    `${BACKEND_URL}/api/funds/open-tournaments`
                );

            setTournaments(tournamentRes.data || []);


            /* LOAD BOARD */

            const email = currentUser?.email;

            if (email) {

                try {

                    const boardRes =
                        await axios.get(
                            `${BACKEND_URL}/api/funds/by-owner/${email}`
                        );

                    console.log("Board loaded:", boardRes.data);

                    setBoard(boardRes.data);

                } catch (err) {

                    console.log("Board not found");

                    setBoard(null);

                }

            }

        } catch (err) {

            console.log("Load error:", err);

        }

        /* IMPORTANT → UI READY ONLY AFTER BOARD LOADS */

        setLoading(false);

    };



    /* NOT INTERESTED */

    const notInterested = async (t) => {

        // SAFETY CHECK
        if (!board || !board.board_id) {

            alert("Board not loaded yet. Please wait 2 seconds.");

            console.log("Board state:", board);

            return;

        }

        try {

            console.log("Sending interest:", {
                board_id: board.board_id,
                tournament_id: t.tournament_id
            });

            await axios.post(
                `${BACKEND_URL}/api/funds/tournament-interest`,
                {
                    board_id: Number(board.board_id),   // FORCE INTEGER
                    tournament_id: Number(t.tournament_id),
                    interest_status: "NOT_INTERESTED"
                }
            );

            alert("Interest recorded");

        } catch (err) {

            console.log("Interest error:", err.response?.data || err);

            alert("Failed to record interest");

        }

    };



    /* INTERESTED */

    const interested = (t) => {

        if (!board) {

            alert("Please register a Board first");

            return;

        }

        setSelected(t);
        setShowPopup(true);

    };



    /* REGISTER */

    const register = async () => {

        if (!board) {

            alert("Board not found");

            return;

        }

        try {

            await axios.post(
                `${BACKEND_URL}/api/funds/register-tournament`,
                {
                    tournament_id: selected.tournament_id,
                    board_id: board.board_id,
                    consent_given: true
                }
            );

            alert("Tournament Registered");

            setShowPopup(false);

        } catch (err) {

            if (err.response?.data?.message) {

                alert(err.response.data.message);

            } else {

                alert("Registration failed");

            }

        }

    };



    if (loading) {

        return (
            <div className="fundsPage">
                Loading tournaments...
            </div>
        );

    }



    return (

        <div className="fundsPage">

            <div className="sectionTitle">
                Tournament Registration
            </div>


            {/* BOARD WARNING */}

            {!board && (

                <div className="warningBox">

                    You must register a Board before joining tournaments.

                </div>

            )}


            <table className="txTable">

                <thead>

                    <tr>
                        <th>Tournament</th>
                        <th>Type</th>
                        <th>Entry Fee</th>
                        <th>Action</th>
                    </tr>

                </thead>

                <tbody>

                    {tournaments.map(t => (

                        <tr key={t.tournament_id}>

                            <td>{t.tournament_name}</td>

                            <td>{t.tournament_type}</td>

                            <td>CE$ {t.entry_fee}</td>

                            <td className="registrationActions">

                                <button
                                    onClick={() => interested(t)}
                                    className="yesBtn"
                                    disabled={!board || !board.board_id}
                                >

                                    YES

                                </button>

                                <button
                                    onClick={() => notInterested(t)}
                                    className="noBtn"
                                    disabled={!board || !board.board_id}
                                >

                                    NO

                                </button>

                            </td>

                        </tr>

                    ))}

                </tbody>

            </table>


            {/* POPUP */}

            {showPopup && (

                <div className="infoOverlay">

                    <div className="infoBox">

                        <h3>Tournament Registration</h3>

                        <p>
                            Owner:
                            {currentUser?.email}
                        </p>

                        <p>
                            Board:
                            {board?.board_name}
                        </p>

                        <p>
                            Tournament:
                            {selected?.tournament_name}
                        </p>

                        <p>
                            Type:
                            {selected?.tournament_type}
                        </p>

                        <p>
                            Entry Fee:
                            CE$ {selected?.entry_fee}
                        </p>


                        <label>

                            <input
                                type="checkbox"
                                onChange={(e) => setConsent(e.target.checked)}
                            />

                            I agree entry fee rules

                        </label>


                        <div className="popupActions">

                            <button
                                disabled={!consent}
                                onClick={register}
                                className="manage-btn add-btn"
                            >

                                Submit

                            </button>


                            <button
                                onClick={() => setShowPopup(false)}
                                className="manage-btn cancel-btn"
                            >

                                Cancel

                            </button>

                        </div>

                    </div>

                </div>

            )}

        </div>

    );

}