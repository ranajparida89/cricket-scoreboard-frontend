import React, { useEffect, useState } from "react";
import axios from "axios";

import "./CentralBank.css";
import "./Funds.css";

export default function CentralBank() {

    const BACKEND =
        "https://cricket-scoreboard-backend.onrender.com";

    const [summary, setSummary] = useState({});
    const [failed, setFailed] = useState([]);
    const [ratings, setRatings] = useState([]);

    const [selectedLoan, setSelectedLoan] = useState(null);
    const [showPopup, setShowPopup] = useState(false);

    const [loading, setLoading] = useState(true);

    useEffect(() => {

        loadData();

    }, []);

    const loadData = async () => {

        try {

            const s =
                await axios.get(
                    `${BACKEND}/api/funds/central-bank-summary`
                );

            const f =
                await axios.get(
                    `${BACKEND}/api/funds/failed-transactions`
                );

            const r =
                await axios.get(
                    `${BACKEND}/api/funds/financial-ratings`
                );

            setSummary(s.data || {});
            setFailed(f.data || []);
            setRatings(r.data || []);

        } catch (err) {

            console.log(err);

        }

        setLoading(false);

    };

    const openLoanPopup = (loan) => {

        setSelectedLoan(loan);

        setShowPopup(true);

    };

    const approveLoan = async () => {

        try {

            await axios.post(

                `${BACKEND}/api/funds/request-loan`,

                {

                    board_id: selectedLoan.board_id,

                    tournament_id: selectedLoan.tournament_id

                }

            );

            alert("Loan request created");

            setShowPopup(false);

            loadData();

        } catch (err) {

            alert(err.response?.data?.message);

        }

    };

    const processLoans = async () => {

        await axios.post(
            `${BACKEND}/api/funds/process-loans`
        );

        alert("Loan engine executed");

        loadData();

    };

    const calculateRatings = async () => {

        await axios.post(
            `${BACKEND}/api/funds/calculate-ratings`
        );

        alert("Ratings updated");

        loadData();

    };

    if (loading) {

        return (

            <div className="cbPage">

                Loading Central Bank...

            </div>

        );

    }

    return (

        <div className="cbPage">

            {/* HEADER */}

            <div className="cbHeader">

                <div>

                    <div className="cbTitle">

                        🏦 CrickEdge Central Bank

                    </div>

                    <div className="cbSubtitle">

                        Central treasury, lending authority and financial regulator

                    </div>

                </div>

                <div className="cbControls">

                    <button
                        className="cbBtn"
                        onClick={processLoans}
                    >

                        Process Loans

                    </button>

                    <button
                        className="cbBtn"
                        onClick={calculateRatings}
                    >

                        Update Ratings

                    </button>

                </div>

            </div>

            {/* TREASURY */}

            <div className="cbGrid">

                <div className="cbCard">

                    <div className="cardLabel">

                        Total System Funds

                    </div>

                    <div className="cardValue">

                        CE$ {Number(
                            summary.totalSystemFunds || 0
                        ).toLocaleString()}

                    </div>

                </div>

                <div className="cbCard">

                    <div className="cardLabel">

                        Available Liquidity

                    </div>

                    <div className="cardValue green">

                        CE$ {Number(
                            summary.availableLiquidity || 0
                        ).toLocaleString()}

                    </div>

                </div>

                <div className="cbCard">

                    <div className="cardLabel">

                        Loan Outstanding

                    </div>

                    <div className="cardValue orange">

                        CE$ {Number(
                            summary.loanOutstanding || 0
                        ).toLocaleString()}

                    </div>

                </div>

                <div className="cbCard">

                    <div className="cardLabel">

                        Tournament Contribution

                    </div>

                    <div className="cardValue blue">

                        CE$ {Number(
                            summary.tournamentContribution || 0
                        ).toLocaleString()}

                    </div>

                </div>

                <div className="cbCard">

                    <div className="cardLabel">

                        Interest Earned

                    </div>

                    <div className="cardValue green">

                        CE$ {Number(
                            summary.interestEarned || 0
                        ).toLocaleString()}

                    </div>

                </div>

                <div className="cbCard">

                    <div className="cardLabel">

                        Recovered Amount

                    </div>

                    <div className="cardValue red">

                        CE$ {Number(
                            summary.recoveredAmount || 0
                        ).toLocaleString()}

                    </div>

                </div>

            </div>

            {/* LOAN REQUESTS */}

            <div className="cbSection">

                <div className="cbSectionTitle">

                    Loan Requests

                </div>

                <div className="tableContainer">

                    <table className="txTable">

                        <thead>

                            <tr>

                                <th>Board</th>
                                <th>Tournament</th>
                                <th>Required</th>
                                <th>Available</th>
                                <th>Action</th>

                            </tr>

                        </thead>

                        <tbody>

                            {failed.map(x => (

                                <tr key={x.failed_id}>

                                    <td>

                                        {x.board_name}

                                    </td>

                                    <td>

                                        {x.tournament_name}

                                    </td>

                                    <td className="money">

                                        CE$ {x.required_amount}

                                    </td>

                                    <td>

                                        CE$ {x.available_balance}

                                    </td>

                                    <td>

                                        <button
                                            className="approveBtn"
                                            onClick={() => openLoanPopup(x)}
                                        >

                                            Approve Loan

                                        </button>

                                    </td>

                                </tr>

                            ))}

                        </tbody>

                    </table>

                </div>

            </div>

            {/* CREDIT RATINGS */}

            <div className="cbSection">

                <div className="cbSectionTitle">

                    Board Financial Ratings

                </div>

                <table className="txTable">

                    <thead>

                        <tr>

                            <th>Board</th>
                            <th>Credit Score</th>
                            <th>Rating</th>
                            <th>Total Loans</th>
                            <th>Defaults</th>

                        </tr>

                    </thead>

                    <tbody>

                        {ratings.map((r, i) => (

                            <tr key={i}>

                                <td>{r.board_name}</td>

                                <td>{r.credit_score}</td>

                                <td>

                                    <span className="ratingBadge">

                                        {r.rating}

                                    </span>

                                </td>

                                <td>{r.total_loans}</td>

                                <td className="risk">

                                    {r.defaults}

                                </td>

                            </tr>

                        ))}

                    </tbody>

                </table>

            </div>

            {/* POPUP */}

            {showPopup && selectedLoan && (

                <div className="cbPopup">

                    <div className="cbPopupBox">

                        <h3>Loan Approval</h3>

                        <p>

                            Board :
                            <b>

                                {selectedLoan.board_name}

                            </b>

                        </p>

                        <p>

                            Tournament :
                            {selectedLoan.tournament_name}

                        </p>

                        <p>

                            Required Amount :
                            CE$ {selectedLoan.required_amount}

                        </p>

                        <p>

                            Interest (12%) :
                            CE$ {Math.floor(
                                selectedLoan.required_amount * 0.12
                            )}

                        </p>

                        <p>

                            Total Payable :

                            CE$ {Math.floor(

                                selectedLoan.required_amount * 1.12

                            )}

                        </p>

                        <div className="popupActions">

                            <button
                                className="cbApprove"
                                onClick={approveLoan}
                            >

                                Approve

                            </button>

                            <button
                                className="cbCancel"
                                onClick={() => setShowPopup(false)}
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