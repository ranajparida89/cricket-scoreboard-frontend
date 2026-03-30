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
    /* RESPONSE LOCK */
    const [responses, setResponses] = useState({});

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

            /* SAFE BOARD DETECTION */

            let boardIdFromUser =
                currentUser?.board_id;

            /* SAFE FALLBACK FOR ADMIN CREATED BOARDS */

            if (!boardIdFromUser) {

                const storedBoard =
                    localStorage.getItem("board_id");

                if (
                    storedBoard &&
                    storedBoard !== "undefined" &&
                    storedBoard !== "null"
                ) {

                    boardIdFromUser = storedBoard;

                }

            }

            /* PRIMARY METHOD */

            if (
                boardIdFromUser &&
                boardIdFromUser !== "undefined"
            ) {

                try {

                    const walletRes =
                        await axios.get(

                            `${BACKEND_URL}/api/funds/wallet/${boardIdFromUser}`

                        );

                    setBoard({

                        board_id: boardIdFromUser,
                        board_name: walletRes.data.board_name,
                        balance: walletRes.data.balance

                    });

                    /* SAVE BOARD FOR FUTURE */

                    localStorage.setItem(

                        "board_id",
                        boardIdFromUser

                    );

                }
                catch {

                    console.log("Wallet lookup failed");

                    setBoard(null);

                }

            }

            /* LAST FALLBACK (VERY OLD SYSTEM) */

            else {

                const email =
                    currentUser?.email;

                if (email) {

                    try {

                        const boardRes =
                            await axios.get(

                                `${BACKEND_URL}/api/funds/by-owner/${email}`

                            );

                        setBoard(boardRes.data);

                        /* SAVE BOARD */

                        localStorage.setItem(

                            "board_id",
                            boardRes.data.board_id

                        );

                    }
                    catch {

                        setBoard(null);

                    }

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

        if (responses[t.tournament_id]) {
            alert("Response already registered");
            return;
        }

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

            setResponses(prev => ({
                ...prev,
                [t.tournament_id]: "NO"
            }));

            alert("Response saved");

        } catch {

            alert("Failed");

        }

    };

    /* INTERESTED */
    const interested = (t) => {
        if (responses[t.tournament_id]) {
            alert("Response already registered");
            return;
        }
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

            /* LOCK RESPONSE AFTER SUCCESS */
            setResponses(prev => ({
                ...prev,
                [selected.tournament_id]: "YES"
            }));

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

            alert(
                "Loan request submitted. Check with admin for Approval / Reject status."
            );

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
                                        disabled={!boardId || responses[t.tournament_id]}

                                    >

                                        YES

                                    </button>

                                    <button

                                        onClick={() => notInterested(t)}
                                        className="noBtn"
                                        disabled={!boardId || responses[t.tournament_id]}

                                    >

                                        NO

                                    </button>

                                </td>
                            </tr>

                        ))}

                    </tbody>

                </table>

            </div>

            {showPopup && selected && (

                <div className="infoOverlay">

                    <div className="infoBox modernPopup">

                        <h3 className="popupTitle">
                            Tournament Registration
                        </h3>

                        <div className="popupRow">
                            <span className="popupLabel">Board</span>
                            <span className="popupValue">
                                {board?.board_name}
                            </span>
                        </div>

                        <div className="popupRow">
                            <span className="popupLabel">Tournament</span>
                            <span className="popupValue">
                                {selected.tournament_name}
                            </span>
                        </div>

                        <div className="popupRow">
                            <span className="popupLabel">Entry Fee</span>
                            <span className="popupValue fee">
                                CE$ {selected.entry_fee}
                            </span>
                        </div>

                        <div className="consentBox">

                            <input
                                type="checkbox"
                                checked={consent}
                                onChange={(e) =>
                                    setConsent(e.target.checked)
                                }
                            />

                            <span>
                                I agree entry fee rules
                            </span>

                        </div>

                        {!consent && (

                            <div className="errorText">

                                Please accept entry rules before submitting

                            </div>

                        )}

                        <div className="popupActions modernActions">

                            <button

                                onClick={() => {
                                    if (!consent) {

                                        alert("Please accept entry fee rules");

                                        return;

                                    }

                                    register();

                                }}

                                className="modernBtn submitBtn"

                            >

                                Submit

                            </button>

                            <button

                                onClick={() => setShowPopup(false)}

                                className="modernBtn cancelBtn"

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

                        <p className="loanHint">
                            Your board has insufficient balance.
                            You can request loan from Central Bank.
                            After request check with admin for approval/reject.
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