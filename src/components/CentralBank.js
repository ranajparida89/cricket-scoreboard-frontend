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
    const [loans, setLoans] = useState([]);
    const [logs, setLogs] = useState([]);

    const [selectedLoan, setSelectedLoan] = useState(null);
    const [showPopup, setShowPopup] = useState(false);

    const [loading, setLoading] = useState(true);

    useEffect(() => {

        loadData();

    }, []);

    /* LOAD DATA */

    const loadData = async () => {

        try {

            const s =
                await axios.get(
                    `${BACKEND}/api/funds/central-bank-summary`
                );

            setSummary(s.data || {});

            const f =
                await axios.get(
                    `${BACKEND}/api/funds/failed-transactions`
                );

            setFailed(f.data || []);

            const r =
                await axios.get(
                    `${BACKEND}/api/funds/financial-ratings`
                );

            setRatings(r.data || []);

        } catch (err) {

            console.log(err);

        }

        /* loans optional */

        try {

            const l =
                await axios.get(
                    `${BACKEND}/api/funds/loans`
                );

            setLoans(l.data || []);

        } catch {

            setLoans([]);

        }

        /* logs optional */

        try {

            const lg =
                await axios.get(
                    `${BACKEND}/api/funds/loan-transactions`
                );

            setLogs(lg.data || []);

        } catch {

            setLogs([]);

        }

        setLoading(false);

    };

    /* OPEN APPROVAL */

    const openLoanPopup = (loan) => {

        setSelectedLoan(loan);
        setShowPopup(true);

    };

    /* APPROVE */

    const approveLoan = async () => {

        try {

            await axios.post(

                `${BACKEND}/api/funds/approve-loan`,

                {
                    board_id: selectedLoan.board_id,
                    tournament_id: selectedLoan.tournament_id
                }

            );

            alert("Loan Approved");

            setShowPopup(false);

            loadData();

        } catch (err) {

            alert("Approval failed");

        }

    };

    /* REJECT */

    const rejectLoan = async (loan) => {

        if (!window.confirm("Reject loan request?"))
            return;

        try {

            await axios.post(

                `${BACKEND}/api/funds/reject-loan`,

                {
                    board_id: loan.board_id,
                    tournament_id: loan.tournament_id
                }

            );

            alert("Loan Rejected");

            loadData();

        } catch {

            alert("Reject failed");

        }

    };

    /* PROCESS ENGINE */

    const processLoans = async () => {

        await axios.post(
            `${BACKEND}/api/funds/process-loans`
        );

        alert("Loan engine executed");

        loadData();

    };

    /* RATINGS */

    const calculateRatings = async () => {

        await axios.post(
            `${BACKEND}/api/funds/calculate-ratings`
        );

        alert("Ratings updated");

        loadData();

    };

    /* DAYS */

    const daysLeft = (date) => {

        if (!date) return "-";

        const now = new Date();

        const due = new Date(date);

        return Math.ceil(
            (due - now) / (1000 * 60 * 60 * 24)
        );

    };

    /* STATUS */

    const loanStatus = (loan) => {

        if (loan.defaulted)
            return "DEFAULTED";

        if (daysLeft(loan.due_date) <= 0)
            return "OVERDUE";

        return "ACTIVE";

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

                        CE$ {Number(summary.totalSystemFunds || 0).toLocaleString()}

                    </div>

                </div>

                <div className="cbCard">

                    <div className="cardLabel">

                        Available Liquidity

                    </div>

                    <div className="cardValue green">

                        CE$ {Number(summary.availableLiquidity || 0).toLocaleString()}

                    </div>

                </div>

                <div className="cbCard">

                    <div className="cardLabel">

                        Loan Outstanding

                    </div>

                    <div className="cardValue orange">

                        CE$ {Number(summary.loanOutstanding || 0).toLocaleString()}

                    </div>

                </div>

                <div className="cbCard">

                    <div className="cardLabel">

                        Recovered Amount

                    </div>

                    <div className="cardValue red">

                        CE$ {Number(summary.recoveredAmount || 0).toLocaleString()}

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

                            {failed.length === 0 ? (

                                <tr>

                                    <td colSpan="5"
                                        style={{ textAlign: "center" }}
                                    >

                                        No loan requests

                                    </td>

                                </tr>

                            ) : (

                                failed.map(x => (

                                    <tr key={x.failed_id}>

                                        <td>{x.board_name}</td>

                                        <td>{x.tournament_name}</td>

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

                                                Approve

                                            </button>

                                            <button
                                                className="cbCancel"
                                                style={{ marginLeft: "8px" }}
                                                onClick={() => rejectLoan(x)}
                                            >

                                                Reject

                                            </button>

                                        </td>

                                    </tr>

                                ))

                            )}

                        </tbody>

                    </table>

                </div>

            </div>

            {/* ACTIVE LOANS */}

            <div className="cbSection">

                <div className="cbSectionTitle">

                    Active Loans Monitoring

                </div>

                <table className="txTable">

                    <thead>

                        <tr>

                            <th>Board</th>
                            <th>Loan</th>
                            <th>Remaining</th>
                            <th>Interest</th>
                            <th>Due</th>
                            <th>Days Left</th>
                            <th>Status</th>

                        </tr>

                    </thead>

                    <tbody>

                        {loans.length === 0 ? (

                            <tr>

                                <td colSpan="7"
                                    style={{ textAlign: "center" }}
                                >

                                    No active loans

                                </td>

                            </tr>

                        ) : (loans.map(l => (

                            <tr key={l.loan_id}>

                                <td>{l.board_name}</td>

                                <td>CE$ {l.loan_amount}</td>

                                <td>CE$ {l.remaining_amount}</td>

                                <td>{l.interest_rate}%</td>

                                <td>{l.due_date?.substring(0, 10)}</td>

                                <td>{daysLeft(l.due_date)}</td>

                                <td>

                                    <span className={
                                        loanStatus(l) === "ACTIVE"
                                            ? "status stable"
                                            : loanStatus(l) === "OVERDUE"
                                                ? "status weak"
                                                : "status danger"
                                    }>

                                        {loanStatus(l)}

                                    </span>

                                </td>

                            </tr>

                        )))}

                    </tbody>

                </table>

            </div>

            {/* LOGS */}

            <div className="cbSection">

                <div className="cbSectionTitle">

                    Loan Recovery Logs

                </div>

                <table className="txTable">

                    <thead>

                        <tr>

                            <th>Board</th>
                            <th>Type</th>
                            <th>Amount</th>
                            <th>Date</th>

                        </tr>

                    </thead>

                    <tbody>

                        {logs.length === 0 ? (

                            <tr>

                                <td colSpan="4"
                                    style={{ textAlign: "center" }}
                                >

                                    No loan transactions

                                </td>

                            </tr>

                        ) : (logs.map(l => (

                            <tr key={l.txn_id}>

                                <td>{l.board_name}</td>

                                <td>{l.txn_type}</td>

                                <td>CE$ {l.amount}</td>

                                <td>{l.created_at?.substring(0, 10)}</td>

                            </tr>

                        )))}

                    </tbody>

                </table>

            </div>

            {/* RATINGS */}

            <div className="cbSection">

                <div className="cbSectionTitle">

                    Board Financial Ratings

                </div>

                <table className="txTable">

                    <thead>

                        <tr>

                            <th>Board</th>
                            <th>Score</th>
                            <th>Rating</th>
                            <th>Loans</th>
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

                            Board:
                            <b>{selectedLoan.board_name}</b>

                        </p>

                        <p>

                            Amount:
                            CE$ {selectedLoan.required_amount}

                        </p>

                        <p>

                            Interest: 12%

                        </p>

                        <p>

                            Total:

                            CE$ {
                                Math.floor(
                                    selectedLoan.required_amount * 1.12
                                )
                            }

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