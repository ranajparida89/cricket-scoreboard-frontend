import React, { useEffect, useState } from "react";
import axios from "axios";
import "./PlayerAuctionSetup.css";

const API = "https://cricket-scoreboard-backend.onrender.com";

export default function PlayerAuctionSetup() {

    const [auctionName, setAuctionName] = useState("");
    const [totalBoards, setTotalBoards] = useState("");
    const [auctionId, setAuctionId] = useState(null);

    const [allBoards, setAllBoards] = useState([]);
    const [selectedBoards, setSelectedBoards] = useState([]);

    const [file, setFile] = useState(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        fetchBoards();
    }, []);

    const fetchBoards = async () => {
        try {
            const res = await axios.get(`${API}/api/boards/all-boards`);
            if (res.data.success) {
                setAllBoards(res.data.boards);
            }
        } catch (err) {
            console.error("Error fetching boards", err);
        }
    };

    const createAuction = async () => {
        try {
            const res = await axios.post(
                `${API}/api/player-auction/create-auction`,
                {
                    auction_name: auctionName,
                    total_boards: parseInt(totalBoards)
                }
            );

            if (res.data.success) {
                setAuctionId(res.data.data.id);
                alert("Auction Created Successfully");
            }

        } catch (err) {
            console.error("Create Auction Error", err);
        }
    };

    const addBoardsToAuction = async () => {
        try {
            await axios.post(
                `${API}/api/player-auction/add-boards/${auctionId}`,
                {
                    boards: selectedBoards
                }
            );

            alert("Boards Added Successfully");

        } catch (err) {
            console.error("Add Boards Error", err);
        }
    };

    const uploadPlayers = async () => {
        if (!file) return;

        const formData = new FormData();
        formData.append("file", file);

        try {
            setLoading(true);

            await axios.post(
                `${API}/api/player-auction/upload-players/${auctionId}`,
                formData
            );

            alert("Players Uploaded Successfully");

        } catch (err) {
            console.error("Upload Error", err);
        } finally {
            setLoading(false);
        }
    };

    const startAuction = async () => {
        try {
            await axios.post(
                `${API}/api/player-auction/start-auction/${auctionId}`
            );

            alert("Auction Started Successfully");

        } catch (err) {
            console.error("Start Auction Error", err);
        }
    };

    return (
        <div className="auction-setup-container">

            <h2>🏆 CRICKEDGE PLAYER AUCTION SETUP</h2>

            {/* CREATE AUCTION */}
            <div className="setup-card">
                <h3>Create Auction</h3>

                <input
                    type="text"
                    placeholder="Auction Name"
                    value={auctionName}
                    onChange={(e) => setAuctionName(e.target.value)}
                />

                <input
                    type="number"
                    placeholder="Total Boards"
                    value={totalBoards}
                    onChange={(e) => setTotalBoards(e.target.value)}
                />

                <button onClick={createAuction}>
                    Create Auction
                </button>
            </div>

            {/* ADD BOARDS */}
            {auctionId && (
                <div className="setup-card">
                    <h3>Add Participating Boards</h3>

                    <select
                        multiple
                        onChange={(e) =>
                            setSelectedBoards(
                                Array.from(e.target.selectedOptions, option => option.value)
                            )
                        }
                    >
                        {allBoards.map(board => (
                            <option key={board.id} value={board.id}>
                                {board.board_name}
                            </option>
                        ))}
                    </select>

                    <button onClick={addBoardsToAuction}>
                        Add Boards
                    </button>
                </div>
            )}

            {/* UPLOAD PLAYERS */}
            {auctionId && (
                <div className="setup-card">
                    <h3>Upload Players Excel</h3>

                    <input
                        type="file"
                        accept=".xlsx"
                        onChange={(e) => setFile(e.target.files[0])}
                    />

                    <button onClick={uploadPlayers} disabled={loading}>
                        {loading ? "Uploading..." : "Upload Players"}
                    </button>
                </div>
            )}

            {/* START AUCTION */}
            {auctionId && (
                <div className="setup-card">
                    <button
                        className="start-auction-btn"
                        onClick={startAuction}
                    >
                        🚀 START AUCTION
                    </button>
                </div>
            )}

        </div>
    );
}
