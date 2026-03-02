import React, { useEffect, useState } from "react";
import axios from "axios";
import "./LiveAuctionPage.css";
import confetti from "canvas-confetti";
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
// ✅ Price Formatter (Crores)

const formatPrice = (amount) => {
    const cr = amount / 10000000;
    let crText = "";
    if (cr >= 1) {
        crText =
            "(" +
            parseFloat(cr.toFixed(2))
            + " cr)";
    }
    return "₹ "
        + Number(amount).toLocaleString()
        + " "
        + crText;
};
function LiveAuctionPage() {
    const [status, setStatus] = useState({});
    const [boards, setBoards] = useState([]);
    const [bids, setBids] = useState([]);
    const [registeredBoards, setRegisteredBoards] = useState([]);

    const [selectedBoards, setSelectedBoards] = useState([]);
    const [selectAllBoards, setSelectAllBoards] = useState(false);
    const [isAdmin, setIsAdmin] = useState(false);
    const [setupMessage, setSetupMessage] = useState("");
    const [selectedBoardId, setSelectedBoardId] = useState("");
    const [soldMessage, setSoldMessage] = useState("");

    const [soldPlayers, setSoldPlayers] = useState([]);
    const [soldFilterBoard, setSoldFilterBoard] = useState("");
    const [soldPopup, setSoldPopup] = useState("");
    const [lastSoldPlayer, setLastSoldPlayer] = useState("");
    const [squadData, setSquadData] = useState(null);
    const [allSquads, setAllSquads] = useState([]);
    const [boardSquadFilter, setBoardSquadFilter] = useState("");
    const selectedBoard =
        boards.find(b => b.board_id === selectedBoardId);
    // ✅ CONFETTI CELEBRATION

    const triggerConfetti = () => {
        confetti({
            particleCount: 200,
            spread: 120,
            origin: { y: 0.6 }
        });
    };

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
            /*
            MULTI-DEVICE SOLD DETECTION (FINAL)
            */

            setStatus(prev => ({
                ...s.data,
                playerClosed: false
            }));
            // ✅ AUTO CLOSE PLAYER WHEN TIMER ENDS
            if (s.data.timer_seconds === 0 && !status.playerClosed) {

                try {

                    await axios.post(
                        API +
                        "/api/live-auction/close-player/" +
                        AUCTION_ID
                    );

                    console.log("Player Closed");

                    setStatus(prev => ({
                        ...prev,
                        playerClosed: true
                    }));

                }
                catch (err) {

                    console.log("Close Player Error", err);

                }

            }
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

            // ✅ LOAD SOLD PLAYERS
            const sold =
                await axios.get(
                    API +
                    "/api/live-auction/sold-players/" +
                    AUCTION_ID
                );
            setSoldPlayers([...sold.data].reverse());
            setAllSquads(sold.data);


            if (sold.data.length > 0) {
                const latestSold = sold.data[0];
                if (latestSold.player_name !== lastSoldPlayer) {
                    setSoldPopup(
                        "🏆 " +
                        latestSold.player_name +
                        " SOLD to " +
                        latestSold.board_name +
                        " for " +
                        formatPrice(latestSold.sold_price)
                    );
                    setLastSoldPlayer(latestSold.player_name);

                }
            }
            // ✅ LOAD BOARD SQUAD
            // ✅ LOAD BOARD SQUAD (NO BLINK STABLE)
            try {

                if (selectedBoardId) {

                    const squad =
                        await axios.get(
                            API +
                            "/api/live-auction/board-squad/" +
                            AUCTION_ID +
                            "/" +
                            selectedBoardId
                        );

                    // Update only if changed
                    if (
                        !squadData ||
                        JSON.stringify(squadData.players) !== JSON.stringify(squad.data.players)
                    ) {
                        setSquadData(squad.data);
                    }

                }

            } catch (err) {

                console.log("Squad Load Error", err);

            }
            // ✅ Show latest bid info
            if (h.data.bids.length > 0) {
                const latestBid = h.data.bids[0];
                setSoldMessage(
                    latestBid.board_name +
                    " leading ₹ " +
                    latestBid.bid_amount
                );
            }
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
                            selectedBoardId
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

            const updated =
                selectedBoards.filter(
                    b => b.board_id !== board.board_id
                );

            setSelectedBoards(updated);

            if (updated.length !== registeredBoards.length) {
                setSelectAllBoards(false);
            }

        }
        else {

            const updated = [

                ...selectedBoards,

                {
                    board_id: board.board_id,
                    purse: 1200000000
                }

            ];

            setSelectedBoards(updated);

            if (updated.length === registeredBoards.length) {
                setSelectAllBoards(true);
            }

        }

    };

    const toggleSelectAllBoards = () => {

        if (selectAllBoards) {

            setSelectedBoards([]);
            setSelectAllBoards(false);

        }
        else {

            const allBoards =
                registeredBoards.map(b => ({

                    board_id: b.board_id,

                    purse: 1200000000

                }));

            setSelectedBoards(allBoards);

            setSelectAllBoards(true);

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

                        {/* ADMIN AUCTION CONTROL */}

                        <div
                            style={{
                                marginTop: "15px",
                                padding: "10px",
                                background: "#222",
                                borderRadius: "8px"
                            }}
                        >

                            <h3>Auction Control</h3>

                            <select
                                id="categoryFilter"
                                style={{
                                    marginRight: "10px",
                                    padding: "5px"
                                }}
                            >

                                <option value="ALL">All Categories</option>

                                <option value="LEGEND">Legend</option>

                                <option value="DIAMOND">Diamond</option>

                                <option value="PLATINUM">Platinum</option>

                                <option value="GOLD">Gold</option>

                                <option value="SILVER">Silver</option>

                            </select>

                            <select
                                id="roleFilter"
                                style={{
                                    marginRight: "10px",
                                    padding: "5px"
                                }}
                            >

                                <option value="ALL">All Roles</option>

                                <option value="BATSMAN">Batsman</option>

                                <option value="BOWLER">Bowler</option>

                                <option value="ALLROUNDER">Allrounder</option>

                            </select>

                            <button

                                onClick={async () => {

                                    try {

                                        const category =
                                            document.getElementById("categoryFilter").value;

                                        const role =
                                            document.getElementById("roleFilter").value;

                                        await axios.post(

                                            API +
                                            "/api/live-auction/admin-control/"
                                            + AUCTION_ID,

                                            {
                                                category,
                                                role
                                            }

                                        );

                                        alert("Auction Control Updated");

                                    }
                                    catch (err) {

                                        alert("Control Update Failed");

                                    }

                                }}

                                style={{

                                    padding: "8px 20px",
                                    background: "#673ab7",
                                    color: "white",
                                    border: "none",
                                    borderRadius: "6px",
                                    fontWeight: "bold"

                                }}

                            >

                                Apply Control
                            </button>
                        </div>

                        {/* ✅ START AUCTION BUTTON */}
                        <button
                            onClick={async () => {
                                try {
                                    const res = await axios.post(
                                        API +
                                        "/api/live-auction/start/" +
                                        AUCTION_ID
                                    );
                                    alert(res.data.message || "Auction Started");
                                    loadData();
                                }
                                catch (err) {

                                    alert(
                                        err.response?.data?.error
                                        ||
                                        "Auction already running"
                                    );
                                }
                            }}
                            style={{
                                marginBottom: "10px",
                                marginRight: "10px",
                                padding: "10px 20px",
                                background: "#2e7d32",
                                color: "white",
                                border: "none",
                                borderRadius: "6px",
                                fontWeight: "bold"
                            }}
                        >
                            Start Auction
                        </button>

                        {/* ✅ PAUSE AUCTION BUTTON */}
                        <button
                            onClick={async () => {
                                try {

                                    if (status.is_paused) {
                                        await axios.post(
                                            API +
                                            "/api/live-auction/resume-auction/" +
                                            AUCTION_ID
                                        );
                                        alert("Auction Resumed");
                                    }
                                    else {
                                        await axios.post(
                                            API +
                                            "/api/live-auction/pause-auction/" +
                                            AUCTION_ID
                                        );
                                        alert("Auction Paused");
                                    }
                                    loadData();
                                }
                                catch (err) {
                                    alert(
                                        err.response?.data?.error
                                        || "Pause/Resume Failed"
                                    );
                                }
                            }}
                            style={{
                                marginLeft: "10px",
                                padding: "10px 20px",
                                background: status.is_paused ? "#1976d2" : "#ef6c00",
                                color: "white",
                                border: "none",
                                borderRadius: "6px",
                                fontWeight: "bold"
                            }}
                        >
                            {status.is_paused ? "Resume Auction" : "Pause Auction"}
                        </button>

                        {/* ✅ RESET AUCTION BUTTON */}

                        <button
                            onClick={async () => {

                                if (!window.confirm("Reset Auction?"))
                                    return;

                                try {

                                    const res = await axios.post(
                                        API +
                                        "/api/live-auction/reset-auction/" +
                                        AUCTION_ID
                                    );

                                    alert(res.data.message);

                                    loadData();

                                } catch (err) {

                                    alert(
                                        err.response?.data?.error ||
                                        "Reset Failed"
                                    );

                                }

                            }}
                            style={{
                                marginLeft: "10px",
                                marginBottom: "10px",
                                padding: "10px 20px",
                                background: "#b71c1c",
                                color: "white",
                                border: "none",
                                borderRadius: "6px",
                                fontWeight: "bold"
                            }}
                        >
                            Reset Auction
                        </button>
                        {/* ✅ END AUCTION BUTTON */}

                        <button
                            onClick={async () => {

                                if (!window.confirm("End Auction Permanently?"))
                                    return;

                                try {

                                    const res = await axios.post(
                                        API +
                                        "/api/live-auction/end-auction/" +
                                        AUCTION_ID
                                    );

                                    alert(res.data.message);

                                    loadData();

                                }
                                catch (err) {

                                    alert(
                                        err.response?.data?.error ||
                                        "End Auction Failed"
                                    );

                                }

                            }}
                            style={{

                                marginLeft: "10px",
                                marginBottom: "10px",
                                padding: "10px 20px",
                                background: "#8b0000",
                                color: "white",
                                border: "none",
                                borderRadius: "6px",
                                fontWeight: "bold"

                            }}
                        >

                            End Auction

                        </button>

                        {/* SELECT ALL BOARDS */}

                        <div style={{ marginTop: "10px" }}>

                            <input
                                type="checkbox"
                                className="selectAllCheckbox"
                                checked={selectAllBoards}
                                onChange={toggleSelectAllBoards}
                            />

                            <b style={{ marginLeft: "10px" }}>
                                Select All Boards
                            </b>

                        </div>


                        {/* BOARD LIST */}

                        {
                            registeredBoards.map(b => {

                                const checked =
                                    selectedBoards.find(
                                        x => x.board_id === b.board_id
                                    );

                                return (

                                    <div key={b.board_id}>

                                        <input
                                            type="checkbox"

                                            checked={checked ? true : false}

                                            onChange={() => toggleBoard(b)}
                                        />

                                        {b.board_name}

                                    </div>

                                )

                            })
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

            {
                status.is_paused &&
                <div
                    style={{

                        background: "#ff9800",
                        padding: "18px",
                        marginBottom: "20px",
                        borderRadius: "10px",
                        fontSize: "26px",
                        fontWeight: "bold",
                        textAlign: "center",
                        color: "#000"

                    }}
                >

                    ⏸ AUCTION PAUSED

                </div>
            }

            {
                isAdmin &&
                <button
                    onClick={() => {
                        window.open(
                            API +
                            "/api/live-auction/export-squads/" +
                            AUCTION_ID
                        );
                    }}
                    style={{
                        marginBottom: "15px",
                        padding: "10px 20px",
                        background: "#1976d2",
                        color: "white",
                        border: "none",
                        borderRadius: "6px",
                        cursor: "pointer"
                    }}
                >
                    Export Squad Excel
                </button>
            }
            {/* PROFESSIONAL BOARD SQUAD TABLE */}
            <div className="board-squad-table">

                <h3>Board Squads</h3>

                <select
                    value={soldFilterBoard}
                    onChange={(e) => setSoldFilterBoard(e.target.value)}
                    style={{
                        marginBottom: "15px",
                        padding: "6px",
                        borderRadius: "6px"
                    }}
                >

                    <option value="">
                        All Boards
                    </option>

                    {
                        boards.map(b => (
                            <option
                                key={b.board_id}
                                value={b.board_name}
                            >
                                {b.board_name}
                            </option>
                        ))
                    }

                </select>


                <div className="table-scroll-wrapper">

                    <table>

                        <thead>

                            <tr>

                                <th>Board</th>
                                <th>Player</th>
                                <th>Role</th>
                                <th>Category</th>
                                <th>Price</th>
                                <th>Remaining Purse</th>

                            </tr>

                        </thead>

                        <tbody>

                            {
                                allSquads
                                    .filter(p =>
                                        soldFilterBoard === ""
                                        ||
                                        p.board_name === soldFilterBoard
                                    )
                                    .map((p, i) => {

                                        const board =
                                            boards.find(
                                                b => b.board_name === p.board_name
                                            );

                                        return (

                                            <tr key={i}>

                                                <td><b>{p.board_name}</b></td>

                                                <td>{p.player_name}</td>

                                                <td>{p.role || "-"}</td>

                                                <td>{p.category}</td>

                                                <td>{formatPrice(p.sold_price)}</td>

                                                <td className="purse-highlight">

                                                    {
                                                        board
                                                            ?
                                                            formatPrice(board.purse_remaining)
                                                            :
                                                            "-"
                                                    }

                                                </td>

                                            </tr>

                                        )

                                    })

                            }

                        </tbody>

                    </table>

                </div>

            </div>
            {
                soldPopup &&
                <div
                    style={{
                        background: "#b71c1c",
                        padding: "15px",
                        marginBottom: "15px",
                        borderRadius: "10px",
                        fontWeight: "bold",
                        color: "#fff",
                        textAlign: "center",
                        fontSize: "22px"
                    }}
                >
                    🏆 {soldPopup}
                </div>
            }
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
                        {status.base_price
                            ? formatPrice(status.base_price)
                            : "-"}
                    </p>
                </div>

                {/* BID PANEL */}

                <div className="bid-panel">
                    <h2>
                        {status.current_price
                            ? formatPrice(status.current_price)
                            : "-"}
                    </h2>
                    <h3>
                        Timer:
                        {status.timer_seconds
                            ??
                            0}s
                    </h3>
                    <h3>
                        Leader:
                        {
                            boards.find(b => b.board_name === status.leading_board)?.display_name
                            ||
                            status.leading_board
                            ||
                            "-"
                        }
                    </h3>
                    <select
                        value={selectedBoardId}
                        onChange={(e) => setSelectedBoardId(e.target.value)}
                        style={{
                            marginBottom: "10px",
                            padding: "6px"
                        }}
                    >
                        <option value="">
                            Select Board
                        </option>

                        {
                            boards.map(b => (
                                <option
                                    key={b.board_id}
                                    value={b.board_id}
                                >
                                    {b.display_name || b.board_name}
                                </option>
                            ))
                        }
                    </select>
                    <button
                        className="bid-button"
                        onClick={placeBid}
                        disabled={
                            status.is_paused ||
                            !selectedBoardId ||
                            selectedBoard?.players_bought >= 13
                        }
                    >
                        {
                            selectedBoard?.players_bought >= 13
                                ?
                                "Squad Full (13/13)"
                                :
                                (boards.length === 0
                                    ? "Loading Boards..."
                                    : "PLACE BID")
                        }

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

                                className={
                                    b.players_bought >= 13
                                        ?
                                        "board-row complete-board"
                                        :
                                        "board-row"
                                }
                            >

                                <b>
                                    {b.display_name || b.board_name}
                                </b>

                                <br />

                                Purse:
                                {formatPrice(b.purse_remaining)}

                                <br />

                                Players:

                                {b.players_bought}/13

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

                            {formatPrice(b.bid_amount)}
                        </div>
                    ))
                }

            </div>
            <div className="bid-history sold-scroll">

                <h3>Sold Players</h3>

                <select
                    value={soldFilterBoard}
                    onChange={(e) => setSoldFilterBoard(e.target.value)}
                    style={{
                        marginBottom: "10px",
                        padding: "6px"
                    }}
                >

                    <option value="">
                        All Boards
                    </option>

                    {
                        boards.map(b => (
                            <option
                                key={b.board_id}
                                value={b.board_name}
                            >
                                {b.display_name}
                            </option>
                        ))
                    }

                </select>

                {
                    soldPlayers
                        .filter(p =>

                            !soldFilterBoard ||

                            p.board_name === soldFilterBoard

                        )
                        .map((p, i) => (
                            <div key={i}>

                                <b>{p.player_name}</b>

                                —

                                {p.board_name}

                                —

                                {formatPrice(p.sold_price)}

                            </div>
                        ))
                }

            </div>
        </div>
    );
}
export default LiveAuctionPage;