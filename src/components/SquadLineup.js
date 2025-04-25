// ✅ src/components/SquadLineup.js
// ✅ [Ranaj Parida - 2025-04-24 | Squad & Lineup Viewer Component]

import React, { useEffect, useState } from "react";
import {
    DragDropContext,
    Droppable,
    Draggable,
  } from "react-beautiful-dnd";
  
import axios from "axios";
import "./SquadLineup.css"; // Optional custom styles if needed

const SquadLineup = () => {
  const [players, setPlayers] = useState([]);
  const [lineup, setLineup] = useState([]);
  const [selectedFormat, setSelectedFormat] = useState("ODI");
  const [editingPlayer, setEditingPlayer] = useState(null);
  const [showModal, setShowModal] = useState(false);

  const renderSkillIcons = (player) => {
    switch (player.skill_type) {
      case "Batsman":
        return "🏏";
      case "Bowler":
        return "🎯";
      case "All Rounder":
        return "🏏+🎯";
      case "Wicketkeeper/Batsman":
        return "(WK)";
      default:
        return "";
    }
  };
  

  useEffect(() => {
    fetchPlayers();
  }, []);

  const fetchPlayers = async () => {
    try {
        const res = await axios.get("https://cricket-scoreboard-backend.onrender.com/api/players");  // ✅ Replace with actual endpoint
      setPlayers(res.data);
      console.log("Fetched players:", res.data);
    } catch (err) {
      console.error("Error fetching players:", err);
    }
  };
  // ✅ Update player in DB
const updatePlayer = async () => {
    try {
      const res = await axios.put("https://cricket-scoreboard-backend.onrender.com/api/update-player", editingPlayer);
      console.log("✅ Player updated:", res.data);
      alert("✅ Player updated successfully.");
      fetchPlayers(); // refresh squad
      setShowModal(false); // close modal
    } catch (err) {
      console.error("❌ Update failed:", err);
      alert("❌ Failed to update player.");
    }
  };
  
  useEffect(() => {
    const filtered = formatPlayers(selectedFormat).slice(0, 11);
    console.log("Filtered squad:", formatPlayers(selectedFormat));
    setLineup(filtered);
  }, [selectedFormat, players]);

  // ✅ Add this now on line 31
  const handleDragEnd = (result) => {
    if (!result.destination) return;
    const items = Array.from(lineup);
    const [reordered] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reordered);
    setLineup(items);
  };

  const formatPlayers = (type) =>
    players.filter((p) => p.lineup_type?.toLowerCase() === type.toLowerCase());  

  const fullSquad = formatPlayers(selectedFormat);
  useEffect(() => {
    const filtered = formatPlayers(selectedFormat).slice(0, 11);
    setLineup(filtered);
  }, [selectedFormat, players]);
  // ✅ Handle edit action for a player
  const handleEdit = (player) => {
    setEditingPlayer(player);
    setShowModal(true); // ✅ Show the edit modal
  };  
  // ✅ Handle delete action
const handleDelete = async (playerId) => {
    if (!window.confirm("Are you sure you want to delete this player?")) return;
  
    try {
      await axios.delete(`https://cricket-scoreboard-backend.onrender.com/api/players/${playerId}`);
      setPlayers((prev) => prev.filter((p) => p.id !== playerId));
      alert("✅ Player deleted successfully.");
    } catch (err) {
      console.error("Delete error:", err);
      alert("❌ Failed to delete player.");
    }
  };

  return (
    <div className="container mt-4 text-white">
 {showModal && (
  <div className="modal-backdrop">
    <div className="modal-content text-dark">
      <h5 className="mb-3">✏️ Edit Player</h5>

      {/* ✅ Player Edit Form */}
      <form>
        <div className="mb-2">
          <label>Player Name:</label>
          <input
            type="text"
            className="form-control"
            value={editingPlayer?.player_name || ""}
            onChange={(e) =>
              setEditingPlayer((prev) => ({ ...prev, player_name: e.target.value }))
            }
          />
        </div>

        <div className="mb-2">
          <label>Skill Type:</label>
          <select
            className="form-select"
            value={editingPlayer?.skill_type || ""}
            onChange={(e) =>
              setEditingPlayer((prev) => ({ ...prev, skill_type: e.target.value }))
            }
          >
            <option value="">-- Select Skill --</option>
            <option value="Batsman">Batsman</option>
            <option value="Bowler">Bowler</option>
            <option value="All Rounder">All Rounder</option>
            <option value="Wicketkeeper/Batsman">Wicketkeeper/Batsman</option>
          </select>
        </div>

        <div className="mb-2">
          <label>Team Name:</label>
          <input
            type="text"
            className="form-control"
            value={editingPlayer?.team_name || ""}
            onChange={(e) =>
              setEditingPlayer((prev) => ({ ...prev, team_name: e.target.value }))
            }
          />
        </div>
      </form>

      <div className="d-flex justify-content-end mt-4">
        <button className="btn btn-secondary me-2" onClick={() => {
          setShowModal(false);
          setEditingPlayer(null);
        }}>
          ❌ Cancel
        </button>
        <button className="btn btn-primary" onClick={updatePlayer}>✅ Update</button>
      </div>
    </div>
  </div>
)}
      <h3 className="text-center mb-3">🏏 {selectedFormat} Squad</h3>

      <div className="d-flex justify-content-center gap-3 mb-4">
        {["ODI", "T20", "TEST"].map((type) => (
          <button
            key={type}
            className={`btn ${selectedFormat === type ? "btn-primary" : "btn-outline-light"}`}
            onClick={() => setSelectedFormat(type)}
          >
            {type}
          </button>
        ))}
      </div>

      {/* ✅ Full Squad Section */}
      <div className="mb-5">
        <h5 className="text-success">🧢 Full Squad (Max 15)</h5>
        <ul className="list-group list-group-flush">
  {fullSquad.map((player, idx) => (
    <li
      key={idx}
      className="list-group-item bg-dark text-white d-flex justify-content-between align-items-center"
    >
      <div>
        {player.player_name} {renderSkillIcons(player)}
        {player.is_captain && " (C)"} {player.is_vice_captain && " (VC)"}
      </div>
      <div>
        <button
          className="btn btn-sm btn-outline-warning me-2"
          onClick={() => handleEdit(player)}
          title="Edit Player"
        >
          ✏️
        </button>
        <button
          className="btn btn-sm btn-outline-danger"
          onClick={() => handleDelete(player.id)}
          title="Delete Player"
        >
          🗑️
        </button>
      </div>
    </li>
  ))}
</ul>

      </div>

     {/* ✅ Playing XI Section */}
<div>
  <h5 className="text-warning">🎯 Playing XI (Lineup)</h5>
  {lineup.length === 0 ? (
    <p className="text-danger ms-2">No players available in {selectedFormat} lineup. Please add players.</p>
  ) : (
    <DragDropContext onDragEnd={handleDragEnd}>
    <Droppable droppableId="lineup">
      {(provided) => (
        <ul
          className="list-group list-group-flush"
          {...provided.droppableProps}
          ref={provided.innerRef}
        >
          {lineup.map((player, idx) => (
            <Draggable
              key={player.player_name + idx}
              draggableId={player.player_name + idx}
              index={idx}
            >
              {(provided) => (
                <li
                  className="list-group-item bg-dark text-white"
                  ref={provided.innerRef}
                  {...provided.draggableProps}
                  {...provided.dragHandleProps}
                >
                  {player.player_name} {renderSkillIcons(player)}
                  {player.is_captain && " (C)"} {player.is_vice_captain && " (VC)"}
                </li>
              )}
            </Draggable>
          ))}
          {provided.placeholder}
        </ul>
      )}
    </Droppable>
  </DragDropContext>  
  )}
</div>
    </div>
  );
};
export default SquadLineup;
