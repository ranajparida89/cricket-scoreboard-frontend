import React, { useEffect, useState } from "react";
import { getTeams } from "../services/api";
import { io } from "socket.io-client";
import "./Leaderboard.css";

/* =========================================================
 * Shared title style (same green + same size as Test board)
 * ======================================================= */
const TITLE_STYLE = {
  textAlign: "center",
  margin: "0 0 12px",
  fontWeight: 900,
  fontSize: "22px",              // ← unified size
  color: "#22ff99",              // ← unified bright green
  textShadow: "0 0 12px rgba(34,255,153,.25)",
};

// 🔹 Team abbreviations (same as TournamentPoints)
const TEAM_ABBR = {
  "south africa": "SA", england: "ENG", india: "IND", kenya: "KEN", scotland: "SCT",
  "new zealand": "NZ", "hong kong": "HKG", afghanistan: "AFG", bangladesh: "BAN",
  pakistan: "PAK", australia: "AUS", ireland: "IRE", netherlands: "NED", namibia: "NAM",
  zimbabwe: "ZIM", nepal: "NEP", oman: "OMA", canada: "CAN", "united arab emirates": "UAE",
  "west indies": "WI", "papua new guinea": "PNG", "sri lanka": "SL", "united states": "USA", usa: "USA",
};
const abbreviateTeamName = (name) => {
  const s = (name ?? "").toString().trim();
  if (!s) return s;
  const key = s.toLowerCase();
  if (TEAM_ABBR[key]) return TEAM_ABBR[key];
  const words = s.split(/\s+/).filter(Boolean);
  if (words.length === 1) return words[0].slice(0, 3).toUpperCase();
  return words.map((w) => w[0]).join("").slice(0, 3).toUpperCase();
};
const displayTeam = (name) => abbreviateTeamName(name);

// Socket
const socket = io("https://cricket-scoreboard-backend.onrender.com");

// NRR helpers
const nrrWidth = (nrr) => {
  if (nrr === null || Number.isNaN(nrr)) return 0;
  const max = 8;
  const mag = Math.min(max, Math.max(0, Math.abs(nrr)));
  return Math.round((mag / max) * 100);
};
const nrrBucket = (nrr) => {
  if (nrr === null) return { bucket: "none", neg: false };
  if (nrr < 0)     return { bucket: "red",    neg: true  };
  if (nrr < 0.5)   return { bucket: "purple", neg: false };
  if (nrr < 2)     return { bucket: "orange", neg: false };
  if (nrr < 4)     return { bucket: "yellow", neg: false };
  return { bucket: "green",  neg: false };
};
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

  const fetchTeams = async () => {
    try {
      const data = await getTeams();
      const parsed = data.map((team) => ({
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
    }
  };

  useEffect(() => {
    fetchTeams();
    const deb = { current: null };
    socket.on("matchUpdate", () => {
      if (deb.current) clearTimeout(deb.current);
      deb.current = setTimeout(fetchTeams, 1200);
    });
    return () => {
      socket.off("matchUpdate");
      clearTimeout(deb.current);
    };
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
      {/* Single title only (duplicate external headings should be removed outside) */}
      <h2 className="lb-title" style={TITLE_STYLE}>
        Leaderboard Summary(ODI/T20)
      </h2>

      <div className="table-responsive leaderboard-table-wrapper">
        <table className="table table-dark text-center mb-0 leaderboard-table">
          <thead>
            <tr>
              {/* Short headers with “Rank” spelled out */}
              <th>R</th>
              <th>T</th>
              <th>M</th>
              <th>W</th>
              <th>L</th>
              <th>D</th>
              <th>Pts</th>
              <th>NRR</th>
            </tr>
          </thead>

          <tbody>
            {teams.map((team, index) => {
              const { bucket, neg } = nrrBucket(team.nrr);
              const width = nrrWidth(team.nrr);
              return (
                <tr key={team.team_name} className="lb-row" data-bucket={bucket}>
                  <td>{getMedal(index)} {index + 1}</td>
                  <td className="team-name">{displayTeam(team.team_name)}</td>
                  <td>{team.matches_played}</td>
                  <td className="pos">{team.wins}</td>
                  <td className="neg">{team.losses}</td>
                  <td>{calculateDraws(team)}</td>
                  <td className="pos">{team.points}</td>
                  <td className={`nrr-cell ${neg ? "neg" : "pos"}`}>
                    <div className="nrr-track" aria-hidden />
                    <div
                      className={`nrr-bar ${neg ? "from-right" : "from-left"}`}
                      style={{ "--w": `${width}%`, backgroundImage: bucketGradient(bucket) }}
                      aria-hidden
                    />
                    {renderNRR(team.nrr)}
                  </td>
                </tr>
              );
            })}
            {teams.length === 0 && (
              <tr>
                <td colSpan="8" className="text-muted py-4">No match data available.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Leaderboard;
