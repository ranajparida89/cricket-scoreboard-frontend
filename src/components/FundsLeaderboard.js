import React, { useEffect, useState } from "react";
import axios from "axios";
import { motion } from "framer-motion";
import "./Funds.css";

export default function FundsLeaderboard() {

    const [boards, setBoards] = useState([]);

    const BACKEND_URL =
        "https://cricket-scoreboard-backend.onrender.com";

    useEffect(() => {
        loadLeaderboard();
    }, []);

    const loadLeaderboard = async () => {
        try {
            const res = await axios.get(
                `${BACKEND_URL}/api/funds/leaderboard`
            );

            // ✅ ALWAYS SORT HIGHEST BALANCE FIRST
            const sorted = (res.data || []).sort(
                (a, b) => b.balance - a.balance
            );

            setBoards(sorted);

        } catch (err) {
            console.log("Leaderboard load error", err);
        }
    };

    /* ================= WEALTH EXPLOSION (UPWARD) ================= */

    const renderWealthExplosion = () => {
        return (
            <div className="wealthExplosion">
                {[...Array(40)].map((_, i) => (
                    <motion.div
                        key={i}
                        className="coinBurst"
                        initial={{ y: 0, opacity: 0, scale: 0.5 }}
                        animate={{
                            y: -200 - Math.random() * 200,
                            x: Math.random() * 300 - 150,
                            opacity: [0, 1, 1, 0],
                            scale: [0.5, 1.3, 1]
                        }}
                        transition={{
                            duration: 2 + Math.random(),
                            repeat: Infinity,
                            delay: Math.random() * 1.5
                        }}
                    >
                        💰
                    </motion.div>
                ))}
            </div>
        );
    };

    /* ================= RANK STYLE ================= */

    const getRankClass = (index) => {
        if (index === 0) return "rank1";
        if (index === 1) return "rank2";
        if (index === 2) return "rank3";
        return "";
    };

    /* ================= FINANCIAL STRENGTH ================= */

    const getStrength = (balance) => {
        if (balance > 300000) return "Strong";
        if (balance >= 150000) return "Stable";
        return "Weak";
    };

    const getStrengthClass = (balance) => {
        if (balance > 300000) return "strong";
        if (balance >= 150000) return "stable";
        return "weak";
    };

    /* ================= RANK DISPLAY ================= */

    const getRankDisplay = (index) => {
        if (index === 0) return "👑 1";
        if (index === 1) return "🥈 2";
        if (index === 2) return "🥉 3";
        return index + 1;
    };

    return (

        <div className="fundsPage">

            <div className="sectionTitle">
                💰 Funds Leaderboard
            </div>

            <div className="tableContainer">

                <table className="txTable">

                    <thead>
                        <tr>
                            <th>Rank</th>
                            <th>Board</th>
                            <th>Balance</th>
                            <th>Total Earned</th>
                            <th>Total Spent</th>
                            <th>Financial Strength</th>
                        </tr>
                    </thead>

                    <tbody>

                        {(boards || []).map((b, index) => (

                            <motion.tr
                                key={index}
                                className={getRankClass(index)}
                                initial={{ opacity: 0, y: 30 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.07 }}
                                whileHover={{
                                    scale: 1.02,
                                    boxShadow: "0px 0px 25px rgba(56,189,248,0.35)"
                                }}
                            >

                                <td>
                                    {getRankDisplay(index)}
                                </td>

                                <td className="boardNameCell">

                                    {index === 0 && (
                                        <>
                                            <span className="eliteCrown">👑</span>
                                            {renderWealthExplosion()}
                                        </>
                                    )}

                                    {b.board_name}
                                </td>

                                <td className="balanceCell animatedBalance">
                                    CE$ {Number(b.balance).toLocaleString()}
                                </td>

                                <td>
                                    CE$ {Number(b.total_earned).toLocaleString()}
                                </td>

                                <td>
                                    CE$ {Number(b.total_spent).toLocaleString()}
                                </td>

                                <td>
                                    <span className={
                                        "status " + getStrengthClass(b.balance)
                                    }>
                                        {getStrength(b.balance)}
                                    </span>
                                </td>

                            </motion.tr>

                        ))}

                    </tbody>

                </table>

            </div>

        </div>
    );
}