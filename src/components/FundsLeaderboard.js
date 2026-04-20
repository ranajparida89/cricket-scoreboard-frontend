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

            let data = res.data || [];

            // ✅ STEP 1: SEPARATE PARTICIPATED vs NON PARTICIPATED
            const participated = data.filter(b => Number(b.total_spent) > 0);
            const notParticipated = data.filter(b => Number(b.total_spent) === 0);

            // ✅ STEP 2: SORT ONLY PARTICIPATED
            participated.sort((a, b) => b.balance - a.balance);

            // ✅ STEP 3: MERGE (participated first)
            const finalSorted = [...participated, ...notParticipated];

            setBoards(finalSorted);

        } catch (err) {
            console.log("Leaderboard load error", err);
        }
    };

    /* 💰 PREMIUM COIN BURST (SLOW + ONLY TOP) */
    const renderTopCoins = () => {
        return (
            <div className="topCoinContainer">
                {[...Array(15)].map((_, i) => (
                    <motion.div
                        key={i}
                        className="topCoin"
                        initial={{ y: 0, opacity: 0 }}
                        animate={{
                            y: -150 - Math.random() * 150,
                            x: Math.random() * 100 - 50,
                            opacity: [0, 1, 1, 0]
                        }}
                        transition={{
                            duration: 3.5,
                            repeat: Infinity,
                            delay: i * 0.2
                        }}
                    >
                        💰
                    </motion.div>
                ))}
            </div>
        );
    };

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

            {/* ✅ NEW CARD STYLE VIEW */}
            <div className="leaderboardCards">

                {(boards || []).map((b, index) => (

                    <motion.div
                        key={index}
                        className={`leaderboardCard ${index === 0 ? "topCard" : ""}`}
                        initial={{ opacity: 0, y: 40 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                        whileHover={{ scale: 1.02 }}
                    >

                        {/* TOP COIN EFFECT */}
                        {index === 0 && renderTopCoins()}

                        <div className="cardLeft">

                            <div className="rankBox">
                                {getRankDisplay(index)}
                            </div>

                            <div className="boardName">
                                {b.board_name}
                            </div>

                        </div>

                        <div className="cardStats">

                            <div>
                                <div className="statLabel">Balance</div>
                                <div className="statValue green">
                                    CE$ {Number(b.balance).toLocaleString()}
                                </div>
                            </div>

                            <div>
                                <div className="statLabel">Earned</div>
                                <div className="statValue">
                                    CE$ {Number(b.total_earned).toLocaleString()}
                                </div>
                            </div>

                            <div>
                                <div className="statLabel">Spent</div>
                                <div className="statValue">
                                    CE$ {Number(b.total_spent).toLocaleString()}
                                </div>
                            </div>

                        </div>

                    </motion.div>

                ))}

            </div>

        </div>
    );
}