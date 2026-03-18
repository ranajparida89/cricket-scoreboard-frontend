import React,
{ useEffect, useState }
    from "react";

import {

    getBoardFunds,
    getFundsLedger

}
    from "../common/FundsAPI";

import BoardFundsBar
    from "../components/BoardFundsBar";

import FundsCard
    from "../components/FundsCard";

import "../common/Funds.css";

export default function BoardFundsWallet() {

    const [wallet, setWallet] =
        useState(null);

    const [tx, setTx] =
        useState([]);

    useEffect(() => {

        load();

    }, []);

    const load = async () => {

        const boardId =
            localStorage.getItem("board_id");

        const w =
            await getBoardFunds(boardId);

        setWallet(w.data);

        const t =
            await getFundsLedger(boardId);

        setTx(t.data.slice(0, 5));

    };

    return (

        <div className="fundsPage">

            <BoardFundsBar />

            <div className="fundsGrid">

                <FundsCard

                    title="Available CrickEdge Funds"

                    value={
                        "CE$ " +
                        (wallet?.balance || 0)
                            .toLocaleString()
                    }

                    color="#35d07f"

                />

                <FundsCard

                    title="Total Rewards Earned"

                    value={
                        "CE$ " +
                        (wallet?.total_rewards || 0)
                            .toLocaleString()
                    }

                    color="#59a8ff"

                />

                <FundsCard

                    title="Tournament Entry Fees"

                    value={
                        "CE$ " +
                        (wallet?.total_spent || 0)
                            .toLocaleString()
                    }

                    color="#ff6b6b"

                />

                <FundsCard

                    title="Net Funds Position"

                    value={
                        "CE$ " +
                        (wallet?.net || 0)
                            .toLocaleString()
                    }

                    color="#ffd166"

                />

            </div>

            <div className="sectionTitle">

                Recent Funds Ledger

            </div>

            <table className="txTable">

                <thead>

                    <tr>

                        <th>Date</th>

                        <th>Type</th>

                        <th>Amount</th>

                        <th>Direction</th>

                    </tr>

                </thead>

                <tbody>

                    {tx.map(x => (

                        <tr key={x.id}>

                            <td>

                                {x.created_at?.substring(0, 10)}

                            </td>

                            <td>

                                {x.type}

                            </td>

                            <td>

                                CE$ {x.amount.toLocaleString()}

                            </td>

                            <td>

                                <span className={
                                    "badge " +
                                    (x.direction === "CREDIT"
                                        ? "credit" : "debit")
                                }>

                                    {x.direction}

                                </span>

                            </td>

                        </tr>

                    ))}

                </tbody>

            </table>

        </div>

    );

}