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

    /* NEW */
    const [loanPopup, setLoanPopup] = useState(false);
    const [loanInfo, setLoanInfo] = useState(null);

    const BACKEND_URL =
        "https://cricket-scoreboard-backend.onrender.com";

    /* LOAD */

    useEffect(() => {

        loadData();

    }, [currentUser]);

    const loadData = async () => {

        try {

            const tournamentRes =
                await axios.get(
                    `${BACKEND_URL}/api/funds/open-tournaments`
                );

            setTournaments(tournamentRes.data || []);

            const email = currentUser?.email;

            if (email) {

                try {

                    const boardRes =
                        await axios.get(
                            `${BACKEND_URL}/api/funds/by-owner/${email}`
                        );

                    setBoard(boardRes.data);

                } catch {

                    setBoard(null);

                }

            }

        } catch (err) {

            console.log(err);

        }

        setLoading(false);

    };

    /* BOARD ID */

    const boardId = board?.board_id;

    /* NOT INTERESTED */

    const notInterested = async (t) => {

        if (!boardId) {

            alert("Board not loaded");
            return;

        }

        try {

            await axios.post(

                `${BACKEND_URL}/api/funds/tournament-interest`,

                {
                    board_id: boardId,
                    tournament_id: t.tournament_id,
                    interest_status: "NOT_INTERESTED"
                }

            );

            alert("Saved");

        } catch {

            alert("Failed");

        }

    };

    /* INTERESTED */

    const interested = (t) => {

        if (!boardId) {

            alert("Register board first");
            return;

        }

        setSelected(t);
        setShowPopup(true);

    };

    /* REGISTER */

    const register = async () => {

        if (!boardId) {

            alert("Board missing");
            return;

        }

        try {

            await axios.post(

                `${BACKEND_URL}/api/funds/register-tournament`,

                {
                    tournament_id: selected.tournament_id,
                    board_id: boardId,
                    consent_given: true
                }

            );

            alert("Tournament Registered");

            setShowPopup(false);
            setConsent(false);

        } catch (err) {

            /* INSUFFICIENT FUNDS */

            if (
                err.response?.data?.message?.includes("Insufficient")
            ) {

                setLoanInfo({

                    board_name: board.board_name,
                    tournament: selected.tournament_name,
                    required: selected.entry_fee,
                    available: board.balance,
                    tournament_id: selected.tournament_id

                });

                setLoanPopup(true);

            } else {

                alert(
                    err.response?.data?.message ||
                    "Registration failed"
                );

            }

        }

    };

    /* REQUEST LOAN */

    const requestLoan = async () => {

        try {

            await axios.post(

                `${BACKEND_URL}/api/funds/request-loan`,

                {
                    board_id: boardId,
                    tournament_id: loanInfo.tournament_id
                }

            );

            alert("Loan request submitted to Central Bank");

            setLoanPopup(false);

        } catch {

            alert("Loan request failed");

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

            {!boardId && (

                <div className="warningBox">

                    Register board to join tournaments

                </div>

            )}

            <div className="tableContainer">

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

                        {(tournaments || []).map(t => (

                            <tr key={t.tournament_id}>

                                <td>{t.tournament_name}</td>

                                <td>{t.tournament_type}</td>

                                <td>

                                    CE$ {t.entry_fee}

                                </td>

                                <td className="registrationActions">

                                    <button

                                        onClick={() => interested(t)}
                                        className="yesBtn"
                                        disabled={!boardId}

                                    >

                                        YES

                                    </button>

                                    <button

                                        onClick={() => notInterested(t)}
                                        className="noBtn"
                                        disabled={!boardId}

                                    >

                                        NO

                                    </button>

                                </td>

                            </tr>

                        ))}

                    </tbody>

                </table>

            </div>

            {/* REGISTER POPUP */}

            {showPopup && selected && (

                <div className="infoOverlay">

                    <div className="infoBox">

                        <h3>Tournament Registration</h3>

                        <p>

                            Board:
                            {board?.board_name}

                        </p>

                        <p>

                            Tournament:
                            {selected.tournament_name}

                        </p>

                        <p>

                            Entry Fee:
                            CE$ {selected.entry_fee}

                        </p>

                        <label>

                            <input
                                type="checkbox"
                                checked={consent}
                                onChange={(e) =>
                                    setConsent(e.target.checked)
                                }
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

            {/* LOAN POPUP */}

            {loanPopup && loanInfo && (

                <div className="infoOverlay">

                    <div className="infoBox">

                        <h3>Insufficient Funds</h3>

                        <p>

                            Board:
                            {loanInfo.board_name}

                        </p>

                        <p>

                            Tournament:
                            {loanInfo.tournament}

                        </p>

                        <p>

                            Required:
                            CE$ {loanInfo.required}

                        </p>

                        <p>

                            Available:
                            CE$ {loanInfo.available}

                        </p>

                        <p style={{ color: "#f87171" }}>

                            You can request loan from Central Bank

                        </p>

                        <div className="popupActions">

                            <button
                                onClick={requestLoan}
                                className="yesBtn"
                            >

                                Request Loan

                            </button>

                            <button
                                onClick={() => setLoanPopup(false)}
                                className="noBtn"
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