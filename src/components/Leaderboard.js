import React, { useEffect, useState } from "react";
import { getTeams } from "../services/api";
import { io } from "socket.io-client";
import TeamMatchExplorerDrawer from "./TeamMatchExplorerDrawer"; // NEW
import "./Leaderboard.css";

/* Simple, unified title (no glow) */
const TITLE_STYLE = {
  textAlign: "center",
  margin: "0 0 8px",
  fontWeight: 900,
  fontSize: "22px",
  color: "#22ff99",
};

// Team abbreviations
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

// Socket (kept for live data; not a visual effect)
const socket = io("https://cricket-scoreboard-backend.onrender.com");

// NRR helpers (static, no animations)
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
// Solid (non-gradient) colors to avoid special-effects
const bucketColor = (bucket) => {
  switch (bucket) {
    case "green":  return "#16e28a";
    case "yellow": return "#ffd966";
    case "orange": return "#ff9a57";
    case "purple": return "#8fa4ff";
    case "red":    return "#ff6b6b";
    default:       return "#93a6bd";
  }
};

const Leaderboard = () => {
  const [teams, setTeams] = useState([]);
  const [selectedTeam, setSelectedTeam] = useState(null); // NEW

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
      deb.current = setTimeout(fetchTeams, 800);
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

  // Open details on row click / Enter / Space
  const openTeamDetails = (fullTeamName) => setSelectedTeam(fullTeamName);
  const onRowKeyDown = (e, fullTeamName) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      setSelectedTeam(fullTeamName);
    }
  };

  return (
    <div className="leaderboard-shell">
      <h2 className="lb-title" style={TITLE_STYLE}>
        Leaderboard Summary (ODI/T20)
      </h2>
      {/* subtle hint so users know rows are clickable */}
      <p className="lb-tip">Tip: Click or tap a team row to view full match details.</p>

      <div className="leaderboard-table-wrapper">
        {/* removed `table-dark` so our blue header styles apply */}
        <table className="table text-center mb-0 leaderboard-table">
          <thead>
            <tr>
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
              const color = bucketColor(bucket);
              const fullName = team.team_name;

              return (
                <tr
                  key={fullName}
                  className={`lb-row ${index < 3 ? "top3" : ""}`}
                  role="button"
                  tabIndex={0}
                  title={`View ${fullName} match details`}
                  onClick={() => openTeamDetails(fullName)}
                  onKeyDown={(e) => onRowKeyDown(e, fullName)}
                >
                  <td>{getMedal(index)} {index + 1}</td>
                  <td className="team-name">{displayTeam(fullName)}</td>
                  <td>{team.matches_played}</td>
                  <td className="pos">{team.wins}</td>
                  <td className="neg">{team.losses}</td>
                  <td>{calculateDraws(team)}</td>
                  <td className="pos">{team.points}</td>
                  <td className={`nrr-cell ${neg ? "neg" : "pos"}`}>
                    <div className="nrr-track" aria-hidden />
                    <div
                      className={`nrr-bar ${neg ? "from-right" : "from-left"}`}
                      style={{ width: `${width}%`, backgroundColor: color }}
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

      {/* Glass details drawer/modal */}
      {selectedTeam && (
        <TeamMatchExplorerDrawer
          team={selectedTeam}
          onClose={() => setSelectedTeam(null)}
        />
      )}
    </div>
  );
};

export default Leaderboard;
