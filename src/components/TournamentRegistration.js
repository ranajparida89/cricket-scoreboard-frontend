import React,
{ useEffect, useState }
    from "react";

import axios from "axios";

import "./Funds.css";

import { useAuth } from "../services/auth";


export default function TournamentRegistration() {

    const { currentUser } = useAuth();

    const [tournaments, setTournaments] = useState([]);

    const [board, setBoard] = useState(null);

    const [showPopup, setShowPopup] = useState(false);

    const [selected, setSelected] = useState(null);

    const [consent, setConsent] = useState(false);

    const BACKEND_URL =
        "https://cricket-scoreboard-backend.onrender.com";


    useEffect(() => {

        loadData();

    }, [currentUser]);


    const loadData = async () => {

        try {

            const email = currentUser?.email;

            if (!email) return;


            /* GET BOARD */

            const boardRes =
                await axios.get(

                    `${BACKEND_URL}/api/boards/by-owner/${email}`

                );

            setBoard(boardRes.data);


            /* GET OPEN TOURNAMENTS */

            const res =
                await axios.get(

                    `${BACKEND_URL}/api/funds/open-tournaments`

                );

            setTournaments(res.data);

        }
        catch (err) {

            console.log(err);

        }

    };


    /* INTEREST NO */

    const notInterested = async (t) => {

        try {

            await axios.post(

                `${BACKEND_URL}/api/funds/tournament-interest`,

                {

                    board_id:
                        board.id,

                    tournament_id:
                        t.tournament_id,

                    interest_status: "NOT_INTERESTED"

                }

            );

            alert(
                "Thank you for your feedback"
            );

        }
        catch (err) {

            console.log(err);

        }

    };


    /* INTEREST YES */

    const interested = (t) => {

        setSelected(t);

        setShowPopup(true);

    };


    /* REGISTER */

    const register = async () => {

        try {

            await axios.post(

                `${BACKEND_URL}/api/funds/register-tournament`,

                {

                    tournament_id:
                        selected.tournament_id,

                    board_id:
                        board.id,

                    consent_given: true

                }

            );

            alert("Registered");

            setShowPopup(false);

        }
        catch (err) {

            alert(
                "Insufficient funds or error"
            );

        }

    };


    if (tournaments.length === 0) {

        return (

            <div className="fundsPage">

                No tournament created by admin.

            </div>

        );

    }


    return (

        <div className="fundsPage">

            <div className="sectionTitle">

                Tournament Registration

            </div>


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

                            <td>

                                {t.tournament_name}

                            </td>

                            <td>

                                {t.tournament_type}

                            </td>

                            <td>

                                CE$ {t.entry_fee}

                            </td>

                            <td className="registrationActions">

                                <button
                                    onClick={() => interested(t)}
                                    className="yesBtn"
                                >

                                    YES

                                </button>

                                <button
                                    onClick={()=>notInterested(t)}
                                    className="noBtn"
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

                        <h3>

                            Tournament Registration

                        </h3>


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

                                onChange={(e) =>
                                    setConsent(e.target.checked)
                                }

                            />

                            I agree entry fee rules

                        </label>


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

            )}

        </div>

    );

}