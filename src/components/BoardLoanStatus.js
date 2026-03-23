import React, { useEffect, useState } from "react";
import axios from "axios";

import "./CentralBank.css";
import "./Funds.css";

import { useAuth } from "../services/auth";

export default function BoardLoanStatus() {

    const BACKEND =
        "https://cricket-scoreboard-backend.onrender.com";

    const { currentUser } = useAuth();

    const [loans, setLoans] = useState([]);
    const [logs, setLogs] = useState([]);

    const [loading, setLoading] = useState(true);

    useEffect(() => {

        if (currentUser?.board_id) {

            load();

        }

    }, [currentUser]);

    const load = async () => {

        try {

            const l =
                await axios.get(

                    `${BACKEND}/api/funds/loans/${currentUser.board_id}`

                );

            const lg =
                await axios.get(

                    `${BACKEND}/api/funds/loan-transactions/${currentUser.board_id}`

                );

            setLoans(l.data || []);
            setLogs(lg.data || []);

        } catch (err) {

            console.log(err);

        }

        setLoading(false);

    };

    const daysLeft = (date) => {

        if (!date) return "-";

        const now =
            new Date();

        const due =
            new Date(date);

        const diff =
            Math.ceil(
                (due - now) / (1000 * 60 * 60 * 24)
            );

        return diff;

    };

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

                Loading loan details...

            </div>

        );

    }

    return (

        <div className="cbPage">

            <div className="cbTitle">

                💳 Board Loan Status

            </div>

            <div className="cbSubtitle">

                Loan monitoring and repayment schedule

            </div>

            {/* LOANS */}

            <div className="cbSection">

                <div className="cbSectionTitle">

                    Active Loans

                </div>

                <table className="txTable">

                    <thead>

                        <tr>

                            <th>Loan Amount</th>
                            <th>Total Payable</th>
                            <th>Remaining</th>
                            <th>Interest</th>
                            <th>Due Date</th>
                            <th>Days Left</th>
                            <th>Status</th>

                        </tr>

                    </thead>

                    <tbody>

                        {loans.map(l => (

                            <tr key={l.loan_id}>

                                <td>

                                    CE$ {l.loan_amount}

                                </td>

                                <td>

                                    CE$ {l.total_payable}

                                </td>

                                <td>

                                    CE$ {l.remaining_amount}

                                </td>

                                <td>

                                    {l.interest_rate}%

                                </td>

                                <td>

                                    {l.due_date?.substring(0, 10)}

                                </td>

                                <td>

                                    {daysLeft(l.due_date)}

                                </td>

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

                        ))}

                        {loans.length === 0 && (

                            <tr>

                                <td colSpan="7"
                                    style={{ textAlign: "center" }}
                                >

                                    No active loans

                                </td>

                            </tr>

                        )}

                    </tbody>

                </table>

            </div>

            {/* RECOVERY LOG */}

            <div className="cbSection">

                <div className="cbSectionTitle">

                    Loan Transaction History

                </div>

                <table className="txTable">

                    <thead>

                        <tr>

                            <th>Type</th>
                            <th>Amount</th>
                            <th>Remarks</th>
                            <th>Date</th>

                        </tr>

                    </thead>

                    <tbody>

                        {logs.map(l => (

                            <tr key={l.txn_id}>

                                <td>

                                    {l.txn_type}

                                </td>

                                <td>

                                    CE$ {l.amount}

                                </td>

                                <td>

                                    {l.remarks}

                                </td>

                                <td>

                                    {l.created_at?.substring(0, 10)}

                                </td>

                            </tr>

                        ))}

                        {logs.length === 0 && (

                            <tr>

                                <td colSpan="4"
                                    style={{ textAlign: "center" }}
                                >

                                    No transactions

                                </td>

                            </tr>

                        )}

                    </tbody>

                </table>

            </div>

        </div>

    );

}