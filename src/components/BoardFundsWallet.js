import React,
{ useEffect, useState }
    from "react";

import BoardFundsBar from "./BoardFundsBar";
import FundsCard from "./FundsCard";
import "./Funds.css";
import { getBoardFunds, getFundsLedger } from "./FundsAPI";
import { useAuth } from "../services/auth";
import BoardFinancialHistory from "./BoardFinancialHistory";
import axios from "axios";

export default function BoardFundsWallet() {

    /*
    ✅ WHY THIS CHANGE
    
    Your auth system does NOT store board_id.
    But it DOES store user email.
    
    Board is linked using:
    board_registration.owner_email
    
    So we dynamically fetch board using email.
    This avoids changing login system.
    */

    const { currentUser } = useAuth();

    const [wallet, setWallet] = useState(null);
    const [tx, setTx] = useState([]);
    const [boardId, setBoardId] = useState(null);

    useEffect(() => {

        if (currentUser?.email) {

            loadFunds();

        }

    }, [currentUser]);


    /*
    ✅ STEP 1
    Find board using logged user email
    */
    const loadFunds = async () => {

        try {

            const email =
                currentUser?.email;

            if (!email) return;


            /*
            ✅ GET BOARD FROM EXISTING BOARD MODULE
            (uses your deployed backend)
            */

            const boardRes =
                await axios.get(
                    `https://cricket-scoreboard-backend.onrender.com/api/boards/by-owner/${email}`
                );

            const boardId =
                boardRes?.data?.id;
            if (!boardId) return;

            setBoardId(boardId);


            /*
            ✅ STEP 2
            Load wallet using boardId
            */

            const w =
                await getBoardFunds(boardId);

            setWallet(w.data);


            /*
            ✅ STEP 3
            Load ledger transactions
            */

            const t =
                await getFundsLedger(boardId);

            setTx(
                t?.data ? t.data.slice(0, 5) : []
            );

        }
        catch (err) {

            console.log("Funds load error", err);

        }

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
                                CE$ {x.amount?.toLocaleString()}
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
            {/* FULL FINANCIAL HISTORY */}

            {boardId && (

                <BoardFinancialHistory
                    boardId={boardId}
                />

            )}

        </div>

    );

}