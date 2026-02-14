import React, { useEffect, useState } from "react";
import axios from "axios";
import "./PlayerAuctionSetup.css";
import { useNavigate } from "react-router-dom";

const API = "https://cricket-scoreboard-backend.onrender.com";

export default function PlayerAuctionSetup() {

    const navigate = useNavigate();

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

        if (res.data.boards) {
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

    if (!auctionId) {
        alert("Create auction first");
        return;
    }

    if (selectedBoards.length === 0) {
        alert("Select boards first");
        return;
    }

    if (selectedBoards.length !== parseInt(totalBoards)) {
        alert(`You must select exactly ${totalBoards} boards`);
        return;
    }

    try {
        const res = await axios.post(
            `${API}/api/player-auction/add-boards/${auctionId}`,
            { boards: selectedBoards }
        );

        if (res.data.success) {
            alert("Boards Added Successfully");
        }

    } catch (err) {
        console.error("Add Boards Error", err.response?.data);
        alert(err.response?.data?.message || "Error adding boards");
    }
};

    const uploadPlayers = async () => {
        if (!file) {
            alert("Please select Excel file first");
            return;
        }

        if (!auctionId) {
            alert("Please create auction first");
            return;
        }

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

        // ✅ Redirect to Reveal Screen
        navigate(`/player-auction/${auctionId}`);

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

                   <div className="boards-checkbox-container">
    {allBoards.map(board => (
        <div key={board.id} className="board-checkbox-item">
            <input
                type="checkbox"
                id={board.id}
                value={board.id}
                checked={selectedBoards.includes(board.id)}
                onChange={(e) => {
                    if (e.target.checked) {
                        setSelectedBoards(prev => [...prev, board.id]);
                    } else {
                        setSelectedBoards(prev =>
                            prev.filter(id => id !== board.id)
                        );
                    }
                }}
            />
            <label htmlFor={board.id}>
                {board.board_name}
            </label>
        </div>
    ))}
</div>
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
