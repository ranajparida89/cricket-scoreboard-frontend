import React, { useEffect, useState } from "react";
import axios from "axios";
import confetti from "canvas-confetti";
import "./AuctionResults.css";
import { useParams } from "react-router-dom";

const API = "https://cricket-scoreboard-backend.onrender.com";

export default function AuctionResults() {

    const { auctionId } = useParams();

    const [boards, setBoards] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isRevealing, setIsRevealing] = useState(false);
    const [auctionCompleted, setAuctionCompleted] = useState(false);


    useEffect(() => {
        fetchResults();
    }, []);

    const fetchResults = async () => {
        try {
            const res = await axios.get(
                `${API}/api/player-auction/results/${auctionId}`
            );

            const preparedBoards = res.data.boards.map(board => ({
                ...board,
                players: board.players.map(player => ({
                    ...player,
                    revealed: false
                }))
            }));

            setBoards(preparedBoards);
            setLoading(false);

        } catch (error) {
            console.error("Error fetching auction results", error);
        }
    };

    const generateRevealQueue = () => {
        let queue = [];

        boards.forEach((board, bIndex) => {
            board.players.forEach((player, pIndex) => {
                queue.push({ bIndex, pIndex });
            });
        });

        for (let i = queue.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [queue[i], queue[j]] = [queue[j], queue[i]];
        }

        return queue;
    };

    const triggerCelebration = () => {
        confetti({
            particleCount: 180,
            spread: 100,
            origin: { y: 0.6 }
        });
    };

    const startReveal = () => {

        if (isRevealing) return;

        setIsRevealing(true);

        const queue = generateRevealQueue();
        let index = 0;

        const interval = setInterval(() => {

            if (index >= queue.length) {
            clearInterval(interval);
            setIsRevealing(false);
            setAuctionCompleted(true);   // ✅ MARK COMPLETED
            return;
        }

            const { bIndex, pIndex } = queue[index];

            setBoards(prev => {
                const updated = [...prev];
                updated[bIndex].players[pIndex].revealed = true;
                return updated;
            });

            triggerCelebration();
            index++;

        }, 3500);
    };

    // ===============================
    // 📥 DOWNLOAD BOARD EXCEL
    // ===============================
    const downloadBoardExcel = async (boardId, boardName) => {

        try {
            const response = await axios.get(
                `${API}/api/player-auction/export-board/${auctionId}/${boardId}`,
                { responseType: "blob" }
            );

            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement("a");

            link.href = url;
            link.setAttribute("download", `${boardName}_Squad.xlsx`);
            document.body.appendChild(link);
            link.click();
            link.remove();

        } catch (error) {
            console.error("Download error:", error);
            alert("Failed to download squad");
        }
    };

    if (loading) return <div className="auction-loading">Loading Auction...</div>;

    return (
        <div className="auction-container">

            <div className="auction-header">
                <h2>🎯 CRICKEDGE PLAYER AUCTION</h2>
                <button 
                    className="reveal-btn"
                    onClick={startReveal}
                    disabled={isRevealing}
                >
                    {isRevealing ? "Auction In Progress..." : "Reveal Players"}
                </button>
            </div>

            <div className="boards-wrapper">
                {boards.map((board, bIndex) => (
                    <div key={bIndex} className="board-card">

                        <h3 className="board-title">
                            🏏 {board.board_name}
                        </h3>

                        <div className="players-grid">
                            {board.players.map((player, pIndex) => (
                                <div
                                    key={pIndex}
                                    className={`player-card ${player.revealed ? "revealed" : ""}`}
                                >
                                    <div className="player-name">
                                        {player.revealed ? player.player_name : "Hidden"}
                                    </div>

                                    <div className="player-role">
                                        {player.role_type}
                                    </div>

                                    <div className="player-grade">
                                        {player.player_grade}
                                    </div> 
                                </div>
                            ))} 
                        </div>
                    </div>
                ))} 
                       </div>

            {/* ================= DOWNLOAD SECTION ================= */}
           {/* ================= DOWNLOAD SECTION ================= */}
{auctionCompleted && (
    <div className="download-section">
        <h3>📥 Download Final Results</h3>

        {/* Board Squad Downloads */}
        {boards.map((board, index) => (
            <button
                key={index}
                className="export-btn"
                onClick={() =>
                    downloadBoardExcel(board.board_id, board.board_name)
                }
            >
                Download {board.board_name} Squad
            </button>
        ))}

        {/* Unsold Players Download */}
        <button
            className="export-btn unsold-btn"
            onClick={async () => {
                try {
                    const response = await axios.get(
                        `${API}/api/player-auction/export-unsold/${auctionId}`,
                        { responseType: "blob" }
                    );

                    const url = window.URL.createObjectURL(new Blob([response.data]));
                    const link = document.createElement("a");

                    link.href = url;
                    link.setAttribute("download", `Unsold_Players.xlsx`);
                    document.body.appendChild(link);
                    link.click();
                    link.remove();

                } catch (error) {
                    console.error("Unsold download error:", error);
                    alert("Failed to download unsold players");
                }
            }}
        >
            Download Unsold Players
        </button>
    </div>
)}
        </div>
    );
}

