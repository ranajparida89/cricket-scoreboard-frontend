import React, { useEffect, useRef, useState } from "react";
import { getTeams } from "../services/api";
import { io } from "socket.io-client";
import { Animate } from "react-move";
import { gsap } from "gsap";
import "./Leaderboard.css";

// Socket
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
  if (nrr < 0)     return { bucket: "red",    neg: true  };
  if (nrr < 0.5)   return { bucket: "purple", neg: false };
  if (nrr < 2)     return { bucket: "orange", neg: false };
  if (nrr < 4)     return { bucket: "yellow", neg: false };
  return { bucket: "green",  neg: false };
};

const Leaderboard = () => {
  const [teams, setTeams] = useState([]);
  const rowRefs = useRef([]); // for gsap stagger

  // keep list fresh on render
  rowRefs.current = [];

  const setRowRef = (el) => {
    if (el && !rowRefs.current.includes(el)) rowRefs.current.push(el);
  };

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

  // GSAP: reveal rows smoothly whenever the list changes
  useEffect(() => {
    if (!rowRefs.current.length) return;
    gsap.fromTo(
      rowRefs.current,
      { y: 18, opacity: 0, filter: "blur(4px)" },
      {
        y: 0,
        opacity: 1,
        filter: "blur(0px)",
        duration: 0.55,
        stagger: 0.07,
        ease: "power2.out",
      }
    );
    // subtle crown-glow for first place
    if (rowRefs.current[0]) {
      gsap.fromTo(
        rowRefs.current[0],
        { boxShadow: "0 0 0px rgba(0,255,170,0)" },
        {
          boxShadow: "0 0 22px rgba(0,255,170,.35)",
          duration: 1.1,
          repeat: 1,
          yoyo: true,
          ease: "sine.inOut",
        }
      );
    }
  }, [teams]);

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
                  ref={setRowRef}
                  key={team.team_name}
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

                  {/* NRR value + animated bar (react-move) */}
                  <td className={`nrr-cell ${neg ? "neg" : "pos"}`}>
                    <div className="nrr-track" aria-hidden />
                    <Animate
                      start={{ w: 0 }}
                      update={{ w: [width], timing: { duration: 600 } }}
                    >
                      {({ w }) => (
                        <div
                          className={`nrr-bar ${neg ? "from-right" : "from-left"}`}
                          style={{ width: `${w}%` }}
                          aria-hidden
                        />
                      )}
                    </Animate>
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
