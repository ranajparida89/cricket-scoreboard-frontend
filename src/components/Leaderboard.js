import React, { useEffect, useState, useRef } from "react";
import { getTeams } from "../services/api";
import { io } from "socket.io-client";
import ScopeBar from "./ScopeBar";
import { buildFilters } from "./tournaments";
import "./Leaderboard.css";

// Connect to backend socket
const socket = io("https://cricket-scoreboard-backend.onrender.com");

// Map |NRR| to 0..100% for the small bar
const nrrWidth = (nrr) => {
  if (nrr === null || Number.isNaN(nrr)) return 0;
  const max = 8; // clamp to 8 for UI
  const mag = Math.min(max, Math.max(0, Math.abs(nrr)));
  return Math.round((mag / max) * 100);
};

// Bucket rule (row tint + bar color)
const nrrBucket = (nrr) => {
  if (nrr === null) return { bucket: "none", neg: false };
  if (nrr < 0)     return { bucket: "red",    neg: true  };  // negative
  if (nrr < 0.5)   return { bucket: "purple", neg: false };  // near zero
  if (nrr < 2)     return { bucket: "orange", neg: false };
  if (nrr < 4)     return { bucket: "yellow", neg: false };
  return { bucket: "green",  neg: false };                   // 4+
};

// Ensure bar color even if other CSS tries to override
const bucketGradient = (bucket) => {
  switch (bucket) {
    case "green":  return "linear-gradient(90deg,#14e29a,#00c986)";
    case "yellow": return "linear-gradient(90deg,#ffe76a,#ffb03a)";
    case "orange": return "linear-gradient(90deg,#ffb03a,#ff7a3d)";
    case "purple": return "linear-gradient(90deg,#a57cff,#6dd6ff)";
    case "red":    return "linear-gradient(90deg,#ff6b6b,#ff2b2b)";
    default:       return "linear-gradient(90deg,#93a6bd,#93a6bd)";
  }
};

const Leaderboard = () => {
  const [teams, setTeams] = useState([]);
  const [filters, setFilters] = useState({ matchType: "All", tournamentName: "", seasonYear: "" });
  const debounceRef = useRef(null);

  const fetchTeams = async (f = filters) => {
    try {
      // Pass tournament/type/year if your backend supports it (safe no-op otherwise)
      const query = buildFilters(f); // { match_type, tournament_name, season_year }
      const data = await getTeams(query);

      const parsed = (data || []).map((team) => ({
        ...team,
        team_name: team.team_name,
        matches_played: parseInt(team.matches_played, 10) || 0,
        wins: parseInt(team.wins, 10) || 0,
        losses: parseInt(team.losses, 10) || 0,
        points: parseInt(team.points, 10) || 0,
        nrr: isNaN(parseFloat(team.nrr)) ? null : parseFloat(team.nrr),
      }));

      const sorted = parsed.sort((a, b) =>
        b.points !== a.points ? b.points - a.points : (b.nrr || 0) - (a.nrr || 0)
      );

      setTeams(sorted);
    } catch (error) {
      console.error("Error fetching leaderboard:", error);
      setTeams([]);
    }
  };

  useEffect(() => {
    fetchTeams();

    socket.on("matchUpdate", () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      // slight delay to let backend finish updates, use current filters
      debounceRef.current = setTimeout(() => fetchTeams(), 1200);
    });

    return () => {
      socket.off("matchUpdate");
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const getMedal = (index) => {
    if (index === 0) return <span className="medal-emoji">🥇</span>;
    if (index === 1) return <span className="medal-emoji">🥈</span>;
    if (index === 2) return <span className="medal-emoji">🥉</span>;
    return null;
  };

  const renderNRR = (nrr) => (nrr === null ? "—" : nrr.toFixed(2));
  const calculateDraws = (team) =>
    Math.max(0, team.matches_played - team.wins - team.losses);

  return (
    <div className="leaderboard-glass">
      {/* Tournament / Season / Type controls (safe: no backend change needed to render) */}
      <div className="leaderboard-controls">
        <ScopeBar
          defaultType="All"
          onApply={(f) => {
            setFilters(f);
            fetchTeams(f);
          }}
        />
      </div>

      <div className="table-responsive leaderboard-table-wrapper">
        <table className="table table-dark text-center mb-0 leaderboard-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Team</th>
              <th>Matches</th>
              <th>Wins</th>
              <th>Losses</th>
              <th>Draws</th>
              <th>Points</th>
              <th>NRR</th>
            </tr>
          </thead>

          <tbody>
            {teams.map((team, index) => {
              const { bucket, neg } = nrrBucket(team.nrr);
              const width = nrrWidth(team.nrr);

              return (
                <tr
                  key={`${team.team_name}-${index}`}
                  className="lb-row"
                  data-bucket={bucket}
                >
                  <td>{getMedal(index)} {index + 1}</td>
                  <td className="team-name">{team.team_name}</td>
                  <td>{team.matches_played}</td>
                  <td className="pos">{team.wins}</td>
                  <td className="neg">{team.losses}</td>
                  <td>{calculateDraws(team)}</td>
                  <td className="pos">{team.points}</td>

                  {/* NRR value + small bar that fills from left/right */}
                  <td className={`nrr-cell ${neg ? "neg" : "pos"}`}>
                    <div className="nrr-track" aria-hidden />
                    <div
                      className={`nrr-bar ${neg ? "from-right" : "from-left"}`}
                      style={{
                        "--w": `${width}%`,
                        backgroundImage: bucketGradient(bucket), // force correct color
                      }}
                      aria-hidden
                    />
                    {renderNRR(team.nrr)}
                  </td>
                </tr>
              );
            })}

            {teams.length === 0 && (
              <tr>
                <td colSpan="8" className="text-muted py-4">
                  No match data available.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Leaderboard;
