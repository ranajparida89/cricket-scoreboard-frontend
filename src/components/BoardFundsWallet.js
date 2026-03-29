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

    const { currentUser } = useAuth();

    const [wallet, setWallet] = useState(null);
    const [tx, setTx] = useState([]);
    const [boardId, setBoardId] = useState(null);
    const [boardName, setBoardName] = useState("");
    const [showInfo, setShowInfo] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {

        if (currentUser?.email) {

            loadFunds();

        }

    }, [currentUser]);

    /* LOAD WALLET */

    const loadFunds = async () => {
        try {
            /* SAFE BOARD DETECTION */
            const boardIdFromUser = currentUser?.board_id;
            let boardId;
            let boardName;
            /* PRIMARY METHOD */
            if (boardIdFromUser) {
                boardId = boardIdFromUser;
                const walletRes =
                    await axios.get(
                        `https://cricket-scoreboard-backend.onrender.com/api/funds/wallet/${boardId}`
                    );
                boardName =
                    walletRes.data.board_name;
            }
            /* FALLBACK */
            else {
                const email =
                    currentUser?.email;
                const boardRes =
                    await axios.get(
                        `https://cricket-scoreboard-backend.onrender.com/api/funds/by-owner/${email}`
                    );
                boardId =
                    boardRes?.data?.board_id;
                boardName =
                    boardRes?.data?.board_name;
            }
            if (!boardId) {
                setLoading(false);
                return;
            }
            setBoardId(boardId);
            setBoardName(boardName);
            if (!boardId) {

                setLoading(false);
                return;

            }

            setBoardId(boardId);
            setBoardName(boardName);

            /* GET WALLET */

            const w =
                await getBoardFunds(boardId);

            setWallet(w.data);

            /* GET LEDGER */

            const t =
                await getFundsLedger(boardId);

            setTx(
                t?.data ? t.data.slice(0, 5) : []
            );

        }
        catch (err) {

            console.log("Funds load error", err);

        }

        setLoading(false);

    };

    if (loading) {

        return (

            <div className="fundsPage">

                Loading wallet...

            </div>

        );

    }

    return (

        <div className="fundsPage">

            <BoardFundsBar />

            {/* HEADER */}

            <div className="walletHeader">

                <div>

                    <div className="sectionTitle">

                        CrickEdge Board Wallet

                    </div>

                    <div className="walletSubtitle">

                        Financial account of <b>{boardName}</b>.
                        Used for tournament entry fees and receiving rewards.

                    </div>

                </div>

                <button
                    className="infoBtn"
                    onClick={() => setShowInfo(true)}
                >

                    i

                </button>

            </div>

            {/* SUMMARY CARDS */}

            <div className="fundsGrid">

                <FundsCard
                    title="Available CrickEdge Funds"
                    value={
                        "CE$ " +
                        (wallet?.balance || 0).toLocaleString()
                    }
                    subtitle="Current balance available for tournament registrations"
                    color="#35d07f"
                />

                <FundsCard
                    title="Total Rewards Earned"
                    value={
                        "CE$ " +
                        (wallet?.total_earned || 0).toLocaleString()
                    }
                    subtitle="Total prize money earned from tournaments and matches"
                    color="#59a8ff"
                />

                <FundsCard
                    title="Tournament Entry Fees Paid"
                    value={
                        "CE$ " +
                        (wallet?.total_spent || 0).toLocaleString()
                    }
                    subtitle="Total amount spent to participate in tournaments"
                    color="#ff6b6b"
                />

                <FundsCard
                    title="Current Net Position"
                    value={
                        "CE$ " +
                        (wallet?.balance || 0).toLocaleString()
                    }
                    subtitle="Overall financial strength of your board"
                    color="#ffd166"
                />

            </div>

            {/* QUICK SUMMARY */}

            <div className="walletSummaryBox">

                <div>

                    <b>Wallet Status:</b> {wallet?.wallet_status || "ACTIVE"}

                </div>

                <div>

                    <b>Last Activity:</b>
                    {tx.length > 0 ? tx[0].created_at?.substring(0, 10) : "No activity"}

                </div>

            </div>

            {/* RECENT LEDGER */}

            <div className="sectionTitle">

                Recent Financial Activity

            </div>

            <div className="walletExplain">

                Shows last 5 financial transactions including rewards,
                entry fees and refunds.

            </div>

            <table className="txTable">

                <thead>

                    <tr>

                        <th>Date</th>
                        <th>Transaction</th>
                        <th>Amount</th>
                        <th>Direction</th>

                    </tr>

                </thead>

                <tbody>

                    {tx.length === 0 && (

                        <tr>

                            <td colSpan="4">

                                No financial activity yet

                            </td>

                        </tr>

                    )}

                    {tx.map(x => (

                        <tr key={x.transaction_id}>

                            <td>

                                {x.created_at?.substring(0, 10)}

                            </td>

                            <td>

                                {x.transaction_type}

                            </td>

                            <td>

                                CE$ {x.amount?.toLocaleString()}

                            </td>

                            <td>

                                <span className={
                                    "badge " +
                                    (x.transaction_type?.includes("WIN")
                                        ? "credit"
                                        :
                                        "debit")
                                }>

                                    {x.transaction_type?.includes("WIN")
                                        ?
                                        "CREDIT"
                                        :
                                        "DEBIT"}

                                </span>

                            </td>

                        </tr>

                    ))}

                </tbody>

            </table>

            {/* FULL HISTORY */}

            {boardId && (

                <BoardFinancialHistory
                    boardId={boardId}
                />

            )}

            {/* INFO POPUP */}

            {showInfo && (

                <div className="infoOverlay">

                    <div className="infoBox">

                        <h3>CrickEdge Board Wallet Guide</h3>

                        <p>

                            This wallet represents your board's financial position inside CrickEdge.

                        </p>

                        <p>

                            <b>Available Funds</b><br />

                            Money currently available to register tournaments.

                        </p>

                        <p>

                            <b>Total Rewards Earned</b><br />

                            Prize money your board earned from tournament victories,
                            match wins and rewards.

                        </p>

                        <p>

                            <b>Tournament Entry Fees</b><br />

                            Money spent to participate in tournaments.

                        </p>

                        <p>

                            <b>Net Position</b><br />

                            Your board's current financial strength.

                            Higher balance means stronger tournament capability.

                        </p>

                        <p>

                            <b>Financial Activity</b><br />

                            Shows your latest rewards, entry fees and refunds.

                        </p>

                        <p>

                            <b>How money flows:</b>

                        </p>

                        <p>

                            Register Tournament → Entry fee deducted<br />
                            Win Tournament → Reward added<br />
                            Cancel Tournament → Refund added

                        </p>

                        <p style={{ marginTop: "10px", color: "#94a3b8" }}>

                            💡 CE$ is CrickEdge virtual currency used only inside platform.

                        </p>

                        <button

                            className="closeInfo"

                            onClick={() => setShowInfo(false)}

                        >

                            Close

                        </button>

                    </div>

                </div>

            )}

        </div>

    );

}