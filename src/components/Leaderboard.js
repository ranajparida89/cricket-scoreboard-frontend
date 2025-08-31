import React, { useEffect, useRef, useState } from "react";
import { getTeams } from "../services/api";
import { io } from "socket.io-client";
import "./Leaderboard.css";

// Connect to backend socket
const socket = io("https://cricket-scoreboard-backend.onrender.com");

/* ---------- helpers ---------- */
// Map |NRR| to 0..100% for the bar
const nrrWidth = (nrr) => {
  if (nrr === null || Number.isNaN(nrr)) return 0;
  const max = 8; // clamp for UI
  const mag = Math.min(max, Math.max(0, Math.abs(nrr)));
  return Math.round((mag / max) * 100);
};

// Bucket rule (row tint + bar color)
const nrrBucket = (nrr) => {
  if (nrr === null) return { bucket: "none", neg: false };
  if (nrr < 0) return { bucket: "red", neg: true };
  if (nrr < 0.5) return { bucket: "purple", neg: false };
  if (nrr < 2) return { bucket: "orange", neg: false };
  if (nrr < 4) return { bucket: "yellow", neg: false };
  return { bucket: "green", neg: false };
};

// Bar gradient by bucket
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

/* Team → code (for chip) + accent color (UI only) */
const teamCode = (name = "") => {
  const n = String(name).trim().toLowerCase();
  const MAP = {
    india: "IND", australia: "AUS", england: "ENG", "new zealand": "NZ",
    pakistan: "PAK", "south africa": "RSA", "sri lanka": "SL",
    ireland: "IRE", kenya: "KEN", namibia: "NAM", bangladesh: "BAN",
    afghanistan: "AFG", zimbabwe: "ZIM", netherlands: "NED", scotland: "SCO",
    nepal: "NEP", oman: "OMA", uae: "UAE", "united arab emirates": "UAE",
    usa: "USA", "hong kong": "HKG", "papua new guinea": "PNG", "west indies": "WI",
  };
  if (MAP[n]) return MAP[n];
  const letters = n.replace(/[^a-z]/g, "");
  return (letters.slice(0, 3) || "UNK").toUpperCase();
};

const ACCENTS = {
  IND: "#4cc9f0", AUS: "#f9c74f", ENG: "#64dfdf", NZ: "#90e0ef",
  PAK: "#80ed99", RSA: "#00f5d4", SL: "#ffd166", AFG: "#ef476f",
  BAN: "#06d6a0", WI: "#b5179e", SCO: "#4895ef", NED: "#ff7b00",
  ZIM: "#ffba08", IRE: "#38b000", HKG: "#ff4d4f", UAE: "#00bcd4",
  USA: "#3b82f6", NEP: "#ff2e63", OMA: "#ff7f50", NAM: "#40c4ff", PNG: "#ffd166"
};
const pickAccent = (name) => ACCENTS[teamCode(name)] || "#5fd0c7";

const Leaderboard = () => {
  const [teams, setTeams] = useState([]);
  const [shadowTop, setShadowTop] = useState(false);
  const [shadowBottom, setShadowBottom] = useState(false);
  const wrapRef = useRef(null);

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

  // scroll shadows for the table wrapper
  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const update = () => {
      const t = el.scrollTop;
      const max = el.scrollHeight - el.clientHeight - 1;
      setShadowTop(t > 0);
      setShadowBottom(t < max);
    };
    update();
    el.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      el.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, []);

  const getMedal = (index) => {
    if (index === 0) return <span className="medal-emoji">🥇</span>;
    if (index === 1) return <span className="medal-emoji">🥈</span>;
    if (index === 2) return <span className="medal-emoji">🥉</span>;
    return null;
  };

  const renderNRR = (nrr) => (nrr === null ? "—" : nrr.toFixed(2));
  const calculateDraws = (t) => Math.max(0, t.matches_played - t.wins - t.losses);

  return (
    <div className="leaderboard-glass">
      <div
        ref={wrapRef}
        className={`leaderboard-table-wrapper scrollable ${shadowTop ? "shadow-top" : ""} ${shadowBottom ? "shadow-bottom" : ""}`}
      >
        <table className="table table-dark text-center mb-0 leaderboard-table">
          <thead>
            <tr>
              <th className="sticky-col left-col">#</th>
              <th className="sticky-col team-col">Team</th>
              <th>Matches</th>
              <th>Wins</th>
              <th>Losses</th>
              <th>Draws</th>
              <th>Win%</th>
              <th>
                Points
                <span className="th-tip" data-tip="Total points; tie-breaker uses NRR.">i</span>
              </th>
              <th>
                NRR
                <span className="th-tip" data-tip="Net Run Rate (higher is better).">i</span>
              </th>
            </tr>
          </thead>

          <tbody>
            {teams.map((team, index) => {
              const { bucket, neg } = nrrBucket(team.nrr);
              const width = nrrWidth(team.nrr);
              const podium =
                index === 0 ? "lb-top1" : index === 1 ? "lb-top2" : index === 2 ? "lb-top3" : "";
              const winpct = team.matches_played ? Math.round((team.wins / team.matches_played) * 100) : 0;
              const accent = pickAccent(team.team_name);

              return (
                <tr
                  key={team.team_name}
                  className={`lb-row ${podium}`}
                  data-bucket={bucket}
                  style={{ ["--i"]: index, ["--accent"]: accent }}
                >
                  <td className="sticky-col left-col rank-cell">
                    {getMedal(index)} {index + 1}
                  </td>

                  <td className="sticky-col team-col team-name">
                    <span className="team-chip" style={{ ["--accent"]: accent }}>
                      {teamCode(team.team_name)}
                    </span>
                    <span className="team-text">{team.team_name}</span>
                  </td>

                  <td>{team.matches_played}</td>
                  <td className="pos">{team.wins}</td>
                  <td className="neg">{team.losses}</td>
                  <td>{calculateDraws(team)}</td>

                  {/* Simple Win% micro bar + number */}
                  <td className="winpct-cell">
                    <span className="mini-track" aria-hidden>
                      <span className="mini-bar" style={{ ["--w"]: `${winpct}%` }} aria-hidden />
                    </span>
                    {winpct}%
                  </td>

                  <td className="pos">
                    <span className="points-pill">{team.points}</span>
                  </td>

                  {/* NRR bar + value (subtle) */}
                  <td className={`nrr-cell ${neg ? "neg" : "pos"}`}>
                    <div className="nrr-track" aria-hidden />
                    <div
                      className={`nrr-bar ${neg ? "from-right" : "from-left"}`}
                      style={{ ["--w"]: `${width}%`, backgroundImage: bucketGradient(bucket) }}
                      aria-hidden
                    />
                    {renderNRR(team.nrr)}
                  </td>
                </tr>
              );
            })}

            {teams.length === 0 && (
              <tr>
                <td colSpan="9" className="text-muted py-4">
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
