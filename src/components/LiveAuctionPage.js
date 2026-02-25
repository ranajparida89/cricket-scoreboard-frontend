import React, { useEffect, useState } from "react";
import axios from "axios";
import "./LiveAuctionPage.css";
// Admin JWT Header (same as ManageAdmins)

function authHeader() {
    const token =
        localStorage.getItem("admin_jwt");
    return token
        ? { Authorization: `Bearer ${token}` }
        : {};
}
const API =
    "https://cricket-scoreboard-backend.onrender.com";
/*
Temporary Auction ID for testing
Later Admin will select auction
*/
const AUCTION_ID =
    "450460e4-12cf-497a-97f2-7f14a34fa771";
function LiveAuctionPage() {
    const [status, setStatus] = useState({});
    const [boards, setBoards] = useState([]);
    const [bids, setBids] = useState([]);
    const [registeredBoards, setRegisteredBoards] = useState([]);

    const [selectedBoards, setSelectedBoards] = useState([]);
    const [isAdmin, setIsAdmin] = useState(false);
    const [setupMessage, setSetupMessage] = useState("");

    useEffect(() => {
        loadData();
        const interval =
            setInterval(loadData, 2000);
        /* Detect Admin */
        const token =
            localStorage.getItem("admin_jwt");
        if (token) {
            setIsAdmin(true);
            loadRegisteredBoards();
        }
        return () => clearInterval(interval);
    }, []);

    /*
    LOAD AUCTION DATA
    */
    const loadData = async () => {

        try {
            const s =
                await axios.get(
                    API +
                    "/api/live-auction/status/" +
                    AUCTION_ID
                );
            setStatus(s.data);
            const b =
                await axios.get(
                    API +
                    "/api/live-auction/boards/" +
                    AUCTION_ID
                );
            setBoards(b.data.boards);
            const h =
                await axios.get(
                    API +
                    "/api/live-auction/bids/" +
                    AUCTION_ID
                );
            setBids(h.data.bids);
        }
        catch (err) {
            console.log(
                "Auction Load Error",
                err
            );

        }
    };
    /*
    PLACE BID
    */
    const placeBid = async () => {
        try {
            if (boards.length === 0) {
                alert(
                    "No boards available"
                );
                return;
            }
            const response =
                await axios.post(
                    API +
                    "/api/live-auction/place-bid",
                    {
                        auction_id:
                            AUCTION_ID,
                        board_id:
                            boards[0].board_id
                    }

                );
            console.log(response.data);
            loadData();
        }
        catch (err) {
            console.log(
                "Bid Error",
                err
            );
            alert(
                err.response?.data?.error
                ||
                "Bid failed"
            );
        }
    };

    // Admin feature Ranaj Parida 25-02-2026
    /*
    =====================================
    ADMIN FUNCTIONS
    =====================================
    */

    /*
    LOAD REGISTERED BOARDS
    */

    const loadRegisteredBoards = async () => {
        try {
            const res = await axios.get(
                API +
                "/api/live-auction/registered-boards",
                {
                    headers: authHeader()
                }
            );
            setRegisteredBoards(
                res.data.boards
            );
        }
        catch (err) {
            console.log(
                "Board Load Error",
                err
            );
        }
    };
    /*
    TOGGLE BOARD SELECTION
    */
    const toggleBoard = (board) => {
        const exists =
            selectedBoards.find(
                b => b.board_id === board.board_id
            );
        if (exists) {
            setSelectedBoards(
                selectedBoards.filter(
                    b => b.board_id !== board.board_id
                )
            );
        }
        else {
            setSelectedBoards([
                ...selectedBoards,
                {
                    board_id: board.board_id,
                    purse: 100000000
                }
            ]);
        }
    };


    /*
    SAVE PARTICIPANTS
    */
    const saveParticipants = async () => {
        try {
            await axios.post(
                API +
                "/api/live-auction/save-participants/" +
                AUCTION_ID,
                {
                    boards: selectedBoards
                },
                {
                    headers: authHeader()
                }
            );
            setSetupMessage(
                "Participants Saved Successfully"
            );
            loadData();
        }
        catch (err) {
            console.log(err);
            setSetupMessage(
                "Error Saving Participants"
            );
        }
    };
    return (
        <div className="auction-container">

            {
                isAdmin && (
                    <div
                        style={{
                            background: "#111",
                            padding: "20px",
                            marginBottom: "20px",
                            borderRadius: "10px"
                        }}
                    >
                        <h2>
                            Admin Auction Setup
                        </h2>
                        {
                            registeredBoards.map(b => (
                                <div key={b.board_id}>
                                    <input
                                        type="checkbox"
                                        onChange={() => toggleBoard(b)}
                                    />
                                    {b.board_name}
                                </div>
                            ))
                        }
                        <button
                            onClick={saveParticipants}
                            style={{
                                marginTop: "10px",
                                padding: "10px 20px",
                                background: "green",
                                color: "white",
                                border: "none",
                                borderRadius: "6px"
                            }}

                        >
                            Save Participants
                        </button>
                        <div style={{ marginTop: "10px" }}>
                            {setupMessage}
                        </div>
                    </div>
                )
            }
            <h1>🏏 Live Auction</h1>
            <div className="auction-grid">
                {/* PLAYER PANEL */}
                <div className="player-panel">
                    <h2>
                        {status.player_name
                            ??
                            "Waiting..."}
                    </h2>
                    <p>
                        Category:
                        {status.category
                            ||
                            "-"}
                    </p>
                    <p>
                        Role:
                        {status.role
                            ||
                            "-"}
                    </p>
                    <p>
                        Base Price:
                        ₹ {status.base_price
                            ||
                            "-"}
                    </p>
                </div>

                {/* BID PANEL */}

                <div className="bid-panel">
                    <h2>
                        ₹ {status.current_price
                            ??
                            "-"}
                    </h2>
                    <h3>
                        Timer:
                        {status.timer_seconds
                            ??
                            0}s
                    </h3>
                    <h3>
                        Leader:
                        {status.leading_board
                            ||
                            "-"}
                    </h3>
                    <button
                        className="bid-button"
                        onClick={placeBid}
                        disabled={boards.length === 0}
                    >
                        {boards.length === 0 ? "Loading Boards..." : "PLACE BID"}
                    </button>
                </div>
                {/* BOARD PANEL */}
                <div className="board-panel">
                    <h3>
                        Participating Boards
                    </h3>

                    {
                        boards.map(b => (
                            <div
                                key={b.board_name}
                                className="board-row"
                            >
                                <b>
                                    {b.board_name}

                                </b>
                                <br />
                                Purse:
                                ₹ {b.purse_remaining}
                                <br />
                                Players:
                                {b.players_bought}
                            </div>
                        ))
                    }
                </div>
            </div>
            {/* BID HISTORY */}
            <div className="bid-history">
                <h3>
                    Bid History
                </h3>
                {
                    bids.map((b, i) => (
                        <div key={i}>
                            {b.board_name}

                            —

                            ₹ {b.bid_amount}
                        </div>
                    ))
                }

            </div>
        </div>
    );
}
export default LiveAuctionPage;