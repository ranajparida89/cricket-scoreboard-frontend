import React, { useEffect, useState } from "react";
import axios from "axios";
import { motion } from "framer-motion";
import "./Funds.css";

export default function FundsLeaderboard() {

    const [participated, setParticipated] = useState([]);
    const [notParticipated, setNotParticipated] = useState([]);

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

            // ✅ Separate boards
            const played = data.filter(b => Number(b.total_spent) > 0);
            const notPlayed = data.filter(b => Number(b.total_spent) === 0);

            // ✅ Sort only participated
            played.sort((a, b) => b.balance - a.balance);

            setParticipated(played);
            setNotParticipated(notPlayed);

        } catch (err) {
            console.log("Leaderboard load error", err);
        }
    };

    /* 🌌 ULTRA SMOOTH FLOATING COINS (NO STUCK) */
    const renderFloatingCoins = () => {
        return (
            <div className="floatingCoins">
                {[...Array(20)].map((_, i) => {

                    const startX = Math.random() * window.innerWidth;

                    return (
                        <motion.div
                            key={i}
                            className="floatingCoin"
                            initial={{
                                y: "110vh",
                                x: startX,
                                opacity: 0
                            }}
                            animate={{
                                y: ["110vh", "-10vh"],
                                x: [
                                    startX,
                                    startX + (Math.random() * 80 - 40),
                                    startX + (Math.random() * 120 - 60)
                                ],
                                opacity: [0, 0.5, 0.5, 0]
                            }}
                            transition={{
                                duration: 12 + Math.random() * 6,
                                repeat: Infinity,
                                ease: "linear",
                                delay: i * 0.6
                            }}
                        >
                            💰
                        </motion.div>
                    );
                })}
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

            {/* 🌌 Background floating coins */}
            {renderFloatingCoins()}

            <div className="sectionTitle">
                💰 Funds Leaderboard
            </div>

            {/* ✅ PARTICIPATED BOARDS */}
            <div className="leaderboardCards">

                {participated.map((b, index) => (

                    <motion.div
                        key={index}
                        className={`leaderboardCard ${index === 0 ? "topCard" : ""}`}
                        initial={{ opacity: 0, y: 40 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                        whileHover={{ scale: 1.02 }}
                    >

                        <div className="cardLeft">

                            <div className="rankBox">
                                {getRankDisplay(index)}
                            </div>

                            <div className="boardName">
                                {index === 0 && <span className="eliteCrown">👑</span>}
                                {b.board_name}
                            </div>

                        </div>

                        <div className="cardStats">

                            <div>
                                <div className="statLabel">Balance</div>
                                <div className="statValue green animatedBalance">
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

            {/* ❌ NOT PARTICIPATED SECTION */}
            {notParticipated.length > 0 && (
                <>
                    <div className="notPlayedHeader">
                        ❌ Not Participated Boards
                    </div>

                    <div className="leaderboardCards">

                        {notParticipated.map((b, index) => (

                            <motion.div
                                key={index}
                                className="leaderboardCard notPlayedCard"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.3 }}
                            >

                                <div className="cardLeft">
                                    <div className="rankBox">—</div>
                                    <div className="boardName">
                                        {b.board_name}
                                    </div>
                                </div>

                                <div className="cardStats">
                                    <div className="statValue red">
                                        No Tournament Activity
                                    </div>
                                </div>

                            </motion.div>

                        ))}

                    </div>
                </>
            )}

        </div>
    );
}