import React, { useEffect, useState } from "react";
import axios from "axios";
import { motion } from "framer-motion";
import "./Funds.css";

export default function FundsLeaderboard() {

    const [boards, setBoards] = useState([]);
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

            const played = data.filter(b => Number(b.total_spent) > 0);
            const notPlayed = data.filter(b => Number(b.total_spent) === 0);

            played.sort((a, b) => b.balance - a.balance);

            setParticipated(played);
            setNotParticipated(notPlayed);

            setBoards([...played, ...notPlayed]);

        } catch (err) {
            console.log("Leaderboard load error", err);
        }
    };

    /* 🌌 GLOBAL FLOATING COINS */
    const renderFloatingCoins = () => {
        return (
            <div className="floatingCoins">
                {[...Array(25)].map((_, i) => (
                    <motion.div
                        key={i}
                        className="floatingCoin"
                        initial={{
                            y: window.innerHeight,
                            x: Math.random() * window.innerWidth,
                            opacity: 0
                        }}
                        animate={{
                            y: -100,
                            x: "+=" + (Math.random() * 200 - 100),
                            opacity: [0, 0.6, 0.6, 0]
                        }}
                        transition={{
                            duration: 10 + Math.random() * 5,
                            repeat: Infinity,
                            delay: i * 0.5
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

            {/* 🌌 GLOBAL BACKGROUND ANIMATION */}
            {renderFloatingCoins()}

            <div className="sectionTitle">
                💰 Funds Leaderboard
            </div>

            {/* ✅ PARTICIPATED */}
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

            {/* ❌ NOT PARTICIPATED */}
            {notParticipated.length > 0 && (
                <>
                    <div className="notPlayedHeader">
                        ❌ Not Participated Boards
                    </div>

                    <div className="leaderboardCards">

                        {notParticipated.map((b, index) => (

                            <div
                                key={index}
                                className="leaderboardCard notPlayedCard"
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

                            </div>

                        ))}

                    </div>
                </>
            )}

        </div>
    );
}