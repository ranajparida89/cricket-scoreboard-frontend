import React, { useEffect, useState } from "react";
import "./PlayerRankings.css";
import axios from "axios";
import { getPlayerRankings } from "../services/api";

const PlayerRankings = () => {
  const [activeTab, setActiveTab] = useState("batting"); // batting | bowling | allrounder
  const [matchType, setMatchType] = useState("TEST"); // TEST | ODI | T20
  const [rankingData, setRankingData] = useState([]);

  useEffect(() => {
    fetchRankings();
  }, [activeTab, matchType]);

  const fetchRankings = async () => {
    try {
        const res = await axios.get(
            `https://cricket-scoreboard-backend.onrender.com/api/rankings/players?type=${activeTab}&match_type=${matchType}`
          );       
      setRankingData(res.data);
    } catch (err) {
      console.error("Failed to fetch rankings:", err);
    }
  };

  return (
    <div className="ranking-container">
      <h2>🏏 CrickEdge Player Rankings</h2>

      <div className="tabs">
        <button onClick={() => setActiveTab("batting")} className={activeTab === "batting" ? "active" : ""}>Batting</button>
        <button onClick={() => setActiveTab("bowling")} className={activeTab === "bowling" ? "active" : ""}>Bowling</button>
        <button onClick={() => setActiveTab("allrounder")} className={activeTab === "allrounder" ? "active" : ""}>All-rounders</button>
      </div>

      <div className="formats">
        <button onClick={() => setMatchType("TEST")} className={matchType === "TEST" ? "active" : ""}>TEST</button>
        <button onClick={() => setMatchType("ODI")} className={matchType === "ODI" ? "active" : ""}>ODI</button>
        <button onClick={() => setMatchType("T20")} className={matchType === "T20" ? "active" : ""}>T20</button>
      </div>

      <table className="ranking-table">
        <thead>
          <tr>
            <th>Position</th>
            <th>Player</th>
            <th>Team</th>
            <th>Rating</th>
          </tr>
        </thead>
        <tbody>
          {rankingData.map((player, index) => (
            <tr key={index}>
              <td>{index + 1}</td>
              <td><strong>{player.player_name}</strong></td>
              <td>{player.team_name}</td>
              <td>{player.rating}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default PlayerRankings;
