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
    const [previewData, setPreviewData] = useState([]);

    const [auctionCreated, setAuctionCreated] = useState(false);
    const [boardsAdded, setBoardsAdded] = useState(false);
    const [playersUploaded, setPlayersUploaded] = useState(false);

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

    if (!auctionName.trim()) {
        alert("Auction name is required");
        return;
    }

    if (!totalBoards || totalBoards <= 0) {
        alert("Please enter valid number of boards");
        return;
    }

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
            setAuctionCreated(true);
            alert("Auction Created Successfully");
        }

    } catch (err) {
        console.error("Create Auction Error", err.response?.data);
        alert(err.response?.data?.message || "Error creating auction");
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
    setBoardsAdded(true);
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

        const res = await axios.post(
            `${API}/api/player-auction/upload-players/${auctionId}`,
            formData
        );

        if (res.data.success) {

    setPreviewData(res.data.preview || []);

    setPlayersUploaded(true);
    alert("Players Uploaded Successfully");
}


    } catch (err) {
        console.error("Upload Error", err.response?.data);
        alert(err.response?.data?.message || "Upload failed");
    } finally {
        setLoading(false);
    }
};


const startAuction = async () => {

    if (!auctionCreated) {
        alert("Please create auction first");
        return;
    }

    if (selectedBoards.length !== parseInt(totalBoards)) {
        alert(`You must select exactly ${totalBoards} boards`);
        return;
    }

    if (!file) {
        alert("Please upload players Excel before starting auction");
        return;
    }

    try {
        await axios.post(
            `${API}/api/player-auction/start-auction/${auctionId}`
        );

        alert("Auction Started Successfully");
        navigate(`/player-auction/${auctionId}`);

    } catch (err) {
        console.error("Start Auction Error", err.response?.data);
        alert(err.response?.data?.message || "Error starting auction");
    }
};

const handleSelectAll = (e) => {

    if (!totalBoards) {
        alert("Enter total boards first");
        return;
    }

    if (e.target.checked) {
        const maxBoards = allBoards.slice(0, parseInt(totalBoards));
        setSelectedBoards(maxBoards.map(b => b.id));
    } else {
        setSelectedBoards([]);
    }
};

// ===============================
// 📥 DOWNLOAD BOARD EXCEL
// ===============================
const downloadBoardExcel = async (boardId, boardName) => {

    if (!auctionId) {
        alert("Auction not created");
        return;
    }

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
                    disabled={auctionCreated}
                    onChange={(e) => setAuctionName(e.target.value)}
                />

              <input
                type="number"
                placeholder="Total Boards"
                value={totalBoards}
                disabled={auctionCreated}
                onChange={(e) => {
    const value = parseInt(e.target.value);
            if (!value || value <= 0) {
                alert("Total boards must be greater than 0");
                return;
            }

            setTotalBoards(value);
        }}
            />
               <button
                onClick={createAuction}
                disabled={auctionCreated}
            >
                {auctionCreated ? "Auction Created" : "Create Auction"}
            </button>
            </div>

            {/* ADD BOARDS */}
            {auctionId && (
                <div className="setup-card">
                    <h3>Add Participating Boards</h3>

 <div className="boards-checkbox-container">

    {/* Select All Option */}
    <div className="select-all-row">
        <input
            type="checkbox"
            onChange={handleSelectAll}
            checked={
                selectedBoards.length > 0 &&
                selectedBoards.length === parseInt(totalBoards)
            }
        />
        <label>
            Select All (Max {totalBoards || 0})
        </label>
    </div>

    {/* Boards List */}
    {allBoards.map(board => (
        <div key={board.id} className="board-checkbox-item">
            <input
                type="checkbox"
                id={`board-${board.id}`}
                value={board.id}
                checked={selectedBoards.includes(board.id)}
                disabled={
                    !selectedBoards.includes(board.id) &&
                    selectedBoards.length >= parseInt(totalBoards)
                }
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
            <label htmlFor={`board-${board.id}`}>
                {board.board_name}
            </label>
        </div>
    ))}

</div>

                   <button
                    onClick={addBoardsToAuction}
                    disabled={boardsAdded}
                >
                    {boardsAdded ? "Boards Added" : "Add Boards"}
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
            disabled={playersUploaded}
            onChange={(e) => setFile(e.target.files[0])}
        />

        <button
            onClick={uploadPlayers}
            disabled={loading || playersUploaded}
        >
            {playersUploaded
                ? "Players Uploaded"
                : (loading ? "Uploading..." : "Upload Players")}
        </button>

        {/* ===== PREVIEW TABLE START ===== */}
        {previewData.length > 0 && (
            <div className="preview-table-container">
                <h4 style={{ marginTop: "20px" }}>
                    Excel Preview (First 10 Players)
                </h4>

                <table className="preview-table">
                    <thead>
                        <tr>
                            <th>Player Name</th>
                            <th>Role</th>
                            <th>License</th>
                            <th>Grade</th>
                        </tr>
                    </thead>
                    <tbody>
                        {previewData.slice(0, 10).map((player, index) => (
                            <tr key={index}>
                                <td>{player.player_name}</td>
                                <td>{player.role_type}</td>
                                <td>{player.license_status}</td>
                                <td>{player.player_grade}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        )}
        {/* ===== PREVIEW TABLE END ===== */}

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

            {/* DOWNLOAD BOARD SQUADS */}
{auctionId && boardsAdded && playersUploaded && (
    <div className="setup-card">
        <h3>📥 Download Board Squads</h3>

        {allBoards
            .filter(board => selectedBoards.includes(board.id))
            .map(board => (
                <button
                    key={board.id}
                    className="export-btn"
                    onClick={() =>
                        downloadBoardExcel(board.id, board.board_name)
                    }
                >
                    Download {board.board_name} Squad
                </button>
            ))
        }
    </div>
)}


        </div>
    );
}
