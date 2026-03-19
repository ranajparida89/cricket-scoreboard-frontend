import React, { useEffect, useState } from "react";
import axios from "axios";
import "./BoardFinancialHistory.css";

const BoardFinancialHistory = ({ boardId }) => {

    const [transactions, setTransactions] = useState([]);
    const [filteredTransactions, setFilteredTransactions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState("ALL");

    const BACKEND_URL =
        "https://cricket-scoreboard-backend.onrender.com";


    useEffect(() => {

        fetchTransactions();

    }, [boardId]);


    const fetchTransactions = async () => {

        try {

            const res = await axios.get(

                `${BACKEND_URL}/api/funds/transactions/${boardId}`

            );

            setTransactions(res.data);
            setFilteredTransactions(res.data);

            setLoading(false);

        }
        catch (error) {

            console.error("Transaction fetch error", error);

            setLoading(false);

        }

    };


    const handleFilter = (type) => {

        setFilter(type);

        if (type === "ALL") {

            setFilteredTransactions(transactions);

            return;

        }

        const filtered = transactions.filter(

            t => t.transaction_type === type

        );

        setFilteredTransactions(filtered);

    };


    const getTransactionClass = (type) => {

        if (
            type === "TOURNAMENT_ENTRY"
        ) {
            return "debit";
        }

        if (
            type === "TOURNAMENT_WINNER" ||
            type === "TOURNAMENT_RUNNER" ||
            type === "TOURNAMENT_REFUND" ||
            type === "MATCH_WIN"
        ) {
            return "credit";
        }

        return "";

    };


    if (loading) {

        return (

            <div className="financial-history-container">

                Loading transactions...

            </div>

        );

    }


    return (

        <div className="financial-history-container">

            <div className="history-header">

                <h2>
                    Financial Transaction History
                </h2>

            </div>


            <div className="history-filters">

                <button
                    className={filter === "ALL" ? "active" : ""}
                    onClick={() => handleFilter("ALL")}
                >
                    ALL
                </button>


                <button
                    onClick={() => handleFilter("TOURNAMENT_ENTRY")}
                >
                    ENTRY
                </button>


                <button
                    onClick={() => handleFilter("TOURNAMENT_WINNER")}
                >
                    WINNER
                </button>


                <button
                    onClick={() => handleFilter("TOURNAMENT_RUNNER")}
                >
                    RUNNER
                </button>


                <button
                    onClick={() => handleFilter("TOURNAMENT_REFUND")}
                >
                    REFUND
                </button>


                <button
                    onClick={() => handleFilter("MATCH_WIN")}
                >
                    MATCH WIN
                </button>

            </div>


            <div className="history-table-wrapper">

                <table className="history-table">

                    <thead>

                        <tr>

                            <th>Date</th>

                            <th>Type</th>

                            <th>Amount</th>

                            <th>Before</th>

                            <th>After</th>

                            <th>Remarks</th>

                        </tr>

                    </thead>


                    <tbody>

                        {
                            filteredTransactions.length === 0 ?

                                <tr>

                                    <td colSpan="6">

                                        No transactions found

                                    </td>

                                </tr>

                                :

                                filteredTransactions.map(

                                    (txn, index) => (

                                        <tr key={index}>

                                            <td>

                                                {
                                                    new Date(
                                                        txn.created_at
                                                    ).toLocaleString()
                                                }

                                            </td>


                                            <td>

                                                <span
                                                    className={
                                                        "txn-badge " +
                                                        getTransactionClass(
                                                            txn.transaction_type
                                                        )
                                                    }
                                                >

                                                    {txn.transaction_type}

                                                </span>

                                            </td>


                                            <td className={
                                                getTransactionClass(
                                                    txn.transaction_type
                                                )
                                            }>

                                                CE$ {txn.amount}

                                            </td>


                                            <td>
                                                {txn.balance_before}
                                            </td>


                                            <td>
                                                {txn.balance_after}
                                            </td>


                                            <td>
                                                {txn.remarks}
                                            </td>


                                        </tr>

                                    )

                                )

                        }

                    </tbody>

                </table>

            </div>

        </div>

    );

};

export default BoardFinancialHistory;