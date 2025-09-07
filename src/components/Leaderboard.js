// src/components/Leaderboard.jsx
import React, { useEffect, useState } from "react";
import { getTeams } from "../services/api";
import { io } from "socket.io-client";
import "./Leaderboard.css";

// 🔹 NEW: Team abbreviations (same scheme used on TournamentPoints)
const TEAM_ABBR = {
  "south africa": "SA",
  england: "ENG",
  india: "IND",
  kenya: "KEN",
  scotland: "SCT",
  "new zealand": "NZ",
  "hong kong": "HKG",
  afghanistan: "AFG",
  bangladesh: "BAN",
  pakistan: "PAK",
  australia: "AUS",
  ireland: "IRE",
  netherlands: "NED",
  namibia: "NAM",
  zimbabwe: "ZIM",
  nepal: "NEP",
  oman: "OMA",
  canada: "CAN",
  "united arab emirates": "UAE",
  "west indies": "WI",
  "papua new guinea": "PNG",
  "sri lanka": "SL",
  "united states": "USA",
  usa: "USA",
};
// 🔹 Helper: fallback abbreviation (1 word → first 3; multiword → initials up to 3)
const abbreviateTeamName = (name) => {
  const s = (name ?? "").toString().trim();
  if (!s) return s;
  const key = s.toLowerCase();
  if (TEAM_ABBR[key]) return TEAM_ABBR[key];
  const words = s.split(/\s+/).filter(Boolean);
  if (words.length === 1) return words[0].slice(0, 3).toUpperCase();
  return words.map((w) => w[0]).join("").slice(0, 3).toUpperCase();
};
// 🔹 ALWAYS abbreviate (as requested for “same as TournamentPoints”)
const displayTeam = (name) => abbreviateTeamName(name);

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
      {/* 🔹 NEW: Title text updated + bright green styling */}
      <h2
        className="lb-title"
        style={{
          textAlign: "center",
          margin: "0 0 12px",
          fontWeight: 900,
          color: "#22ff99",              // bright green
          textShadow: "0 0 12px rgba(34,255,153,.25)",
        }}
      >
        Leaderboard Summary (ODI/T20)
      </h2>

      {/* 🔹 Tiny scoped CSS for header abbreviations weight (optional, safe) */}
      <style>{`
        .leaderboard-table thead th { font-weight: 900; }
      `}</style>

      <div className="table-responsive leaderboard-table-wrapper">
        <table className="table table-dark text-center mb-0 leaderboard-table">
          <thead>
            <tr>
              {/* 🔹 CHANGED: # → Rnk, and short labels across the board */}
              <th>Rnk</th>
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
                <tr
                  key={team.team_name}
                  className="lb-row"
                  data-bucket={bucket}
                >
                  {/* 🔹 CHANGED: header says Rank; content remains medal + number */}
                  <td>{getMedal(index)} {index + 1}</td>

                  {/* 🔹 CHANGED: abbreviate team label (same behavior as TournamentPoints) */}
                  <td className="team-name">{displayTeam(team.team_name)}</td>

                  {/* 🔹 CHANGED: columns already numeric; headers shortened above */}
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
