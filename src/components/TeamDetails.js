// src/components/TeamDetails.js
import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import "./TeamDetails.css"; // optional for styling

const trophyData = {
  India: {
    flag: "🇮🇳",
    achievements: [
      "🏆 World Cups: 2 (1983, 2011)",
      "🔥 T20 World Cups: 2 (2007, 2024)",
      "🥇 Champions Trophies: 3 (2002*, 2013, 2025)",
    ],
    about: "India is a cricketing superpower with dominance across formats and a massive fanbase.",
  },
  Australia: {
    flag: "🇦🇺",
    achievements: [
      "🏆 World Cups: 6 (1987, 1999, 2003, 2007, 2015, 2023)",
      "🔥 T20 World Cups: 1 (2021)",
      "🥇 Champions Trophies: 2 (2006, 2009)",
    ],
    about: "The most successful team in ICC history — unmatched consistency and true champion mentality.",
  },
  // ➕ Add more teams as needed
};

const normalizeTeam = (name) => {
  const map = {
    ind: "India", india: "India",
    aus: "Australia", australia: "Australia",
    eng: "England", england: "England",
    pak: "Pakistan", pakistan: "Pakistan",
    nz: "New Zealand", "new zealand": "New Zealand",
    sa: "South Africa", "south africa": "South Africa",
    sl: "Sri Lanka", "sri lanka": "Sri Lanka",
    wi: "West Indies", "west indies": "West Indies",
    afg: "Afghanistan", afghanistan: "Afghanistan",
  };
  return map[name.toLowerCase()] || name;
};

const TeamDetails = () => {
  const { teamName } = useParams();
  const navigate = useNavigate();
  const [matches, setMatches] = useState([]);
  const [stats, setStats] = useState(null);

  const normalized = normalizeTeam(teamName);
  const teamInfo = trophyData[normalized];

  useEffect(() => {
    const fetchMatches = async () => {
      try {
        const res = await axios.get(`/api/match-history?team=${normalized}`);
        if (Array.isArray(res.data)) {
          setMatches(res.data);
        } else {
          console.error("Invalid match data format (not an array):", res.data);
        }
      } catch (err) {
        console.error("Error fetching team matches:", err);
      }
    };
    fetchMatches();
  }, [normalized]);

  useEffect(() => {
    if (Array.isArray(matches) && matches.length > 0) {
      let total = 0, wins = 0, losses = 0;
      let totalRuns = 0, totalOvers = 0, totalConceded = 0, totalBowled = 0;

      matches.forEach((match) => {
        const isTeam1 = match.team1.toLowerCase() === normalized.toLowerCase();
        const teamRuns = isTeam1 ? match.runs1 : match.runs2;
        const teamOvers = parseFloat(isTeam1 ? match.overs1 : match.overs2);
        const oppRuns = isTeam1 ? match.runs2 : match.runs1;
        const oppOvers = parseFloat(isTeam1 ? match.overs2 : match.overs1);

        total++;
        if (match.winner?.toLowerCase().includes(normalized.toLowerCase())) wins++;
        else if (match.winner && match.winner !== "Match Draw") losses++;

        totalRuns += teamRuns;
        totalOvers += teamOvers;
        totalConceded += oppRuns;
        totalBowled += oppOvers;
      });

      const winPercent = ((wins / total) * 100).toFixed(2);
      const nrr = (
        totalOvers > 0 && totalBowled > 0
          ? (totalRuns / totalOvers) - (totalConceded / totalBowled)
          : 0
      ).toFixed(2);

      setStats({ total, wins, losses, winPercent, nrr });
    } else {
      console.warn("No valid match data to calculate stats.");
    }
  }, [matches, normalized]);

  return (
    <div className="container mt-4 text-white">
      {/* ❌ Close Button */}
      <button
        onClick={() => navigate("/")}
        className="btn btn-outline-light mb-3"
      >
        ❌ Close
      </button>

      <h2 className="mb-3">{teamInfo?.flag || "🏏"} {normalized} - Team Profile</h2>

      {teamInfo && (
        <div className="mb-4">
          <h5>Trophies & Achievements:</h5>
          <ul className="list-group list-group-flush bg-dark p-3 rounded">
            {teamInfo.achievements.map((achieve, idx) => (
              <li key={idx} className="list-group-item bg-transparent text-light">
                {achieve}
              </li>
            ))}
          </ul>
          <p className="mt-3">{teamInfo.about}</p>
        </div>
      )}

      {stats ? (
        <>
          <div className="row mb-4">
            <div className="col-md-4">
              <div className="card bg-dark text-light p-3 shadow">
                <h5>Total Matches</h5>
                <h3>{stats.total}</h3>
              </div>
            </div>
            <div className="col-md-4">
              <div className="card bg-dark text-light p-3 shadow">
                <h5>Wins / Losses</h5>
                <h3>{stats.wins} / {stats.losses}</h3>
              </div>
            </div>
            <div className="col-md-4">
              <div className="card bg-dark text-light p-3 shadow">
                <h5>Win %</h5>
                <h3>{stats.winPercent}%</h3>
              </div>
            </div>
          </div>

          <h5>Net Run Rate (NRR): <strong>{stats.nrr}</strong></h5>

          <div className="mt-4">
            <h5>🕒 Last 5 Matches</h5>
            <ul className="list-group list-group-flush">
              {matches.slice(0, 5).map((m, i) => (
                <li key={i} className="list-group-item bg-transparent text-light border-bottom">
                  <strong>{m.match_name}</strong> - {m.team1} vs {m.team2} — <em>{m.winner}</em>
                </li>
              ))}
            </ul>
          </div>
        </>
      ) : (
        <p>Loading team stats or no match data available.</p>
      )}
    </div>
  );
};

export default TeamDetails;
