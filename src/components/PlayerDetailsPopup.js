import React from "react";
import "./PlayerDetailsModal.css"; // We'll define advanced styling separately

const PlayerDetailsModal = ({ playerName, matches, onClose }) => {
  if (!matches || matches.length === 0) return null;

  return (
    <div className="player-modal-overlay">
      <div className="player-modal-content">
        <button className="player-modal-close" onClick={onClose}>❌</button>
        <h2 className="modal-header">📋 Detailed Match Stats for <span>{playerName}</span></h2>

        {matches.map((match, index) => (
          <div className="player-match-card" key={index}>
            <h4>🏏 Match {index + 1}: <span>{match.match_name}</span> ({match.match_type})</h4>
            <p><strong>📅 Date:</strong> {match.match_day}, {new Date(match.match_date).toLocaleDateString()}</p>
            <p><strong>⏰ Time:</strong> {match.match_time}</p>
            <p><strong>🆚 Opposition:</strong> {match.against_team}</p>

            <div className="section">
              <h5>🧢 Batting Performance</h5>
              <ul>
                <li><strong>Player:</strong> {match.player_name} ({match.team_name})</li>
                <li><strong>Runs Scored:</strong> {match.formatted_run_scored} ({match.dismissed === "Not Out" ? "Not Out" : "Dismissed"})</li>
                <li><strong>Balls Faced:</strong> {match.balls_faced}</li>
                <li><strong>Strike Rate:</strong> {match.strike_rate}</li>
                <li><strong>Fifty:</strong> {match.fifties > 0 ? `Yes (${match.fifties})` : "No"}</li>
                <li><strong>Century:</strong> {match.hundreds > 0 ? `Yes (${match.hundreds})` : "No"}</li>
              </ul>
            </div>

            <div className="section">
              <h5>🎯 Bowling Performance</h5>
              <ul>
                <li><strong>Wickets Taken:</strong> {match.wickets_taken}</li>
                <li><strong>Runs Conceded:</strong> {match.runs_given}</li>
                <li><strong>Overs Bowled:</strong> {Math.floor(match.balls_faced / 6)}.{match.balls_faced % 6}</li>
                <li><strong>Economy:</strong> {match.balls_faced > 0 ? ((match.runs_given / (match.balls_faced / 6)).toFixed(2)) : "N/A"}</li>
              </ul>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PlayerDetailsModal;
