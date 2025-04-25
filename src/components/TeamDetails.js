// src/components/TeamDetails.js
import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getMatchesByTeam } from "../services/api";
import "./TeamDetails.css";

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
  England: {
    flag: "🏴",
    achievements: [
      "🏆 World Cup: 1 (2019)",
      "🔥 T20 World Cup: 1 (2010)",
      "🥇 Champions Trophy: 1 (2004)",
    ],
    about: "England reinvented white-ball cricket and won their first World Cup at home in 2019.",
  },
  Pakistan: {
    flag: "🇵🇰",
    achievements: [
      "🏆 World Cup: 1 (1992)",
      "🔥 T20 World Cup: 1 (2009)",
      "🥇 Champions Trophy: 1 (2017)",
    ],
    about: "Known for unpredictability and pace power. 2017 CT win over India was iconic.",
  },
  "New Zealand": {
    flag: "🇳🇿",
    achievements: [
      "🔥 T20 World Cup: 1 (2021)",
      "🥇 Champions Trophy: 1 (2000)",
    ],
    about: "Loved for their spirit and sportsmanship. One of cricket's most consistent sides.",
  },
  "South Africa": {
    flag: "🇿🇦",
    achievements: [
      "🥇 Champions Trophy: 1 (1998)",
    ],
    about: "The 'nearly men' of cricket. Full of talent but heartbreak in knockouts.",
  },
  "Sri Lanka": {
    flag: "🇱🇰",
    achievements: [
      "🏆 World Cup: 1 (1996)",
      "🔥 T20 World Cup: 1 (2014)",
      "🥇 Champions Trophy: 1 (2002*)",
    ],
    about: "Known for their surprise 1996 World Cup win and cricketing legends.",
  },
  Bangladesh: {
    flag: "🇧🇩",
    achievements: ["🌱 No ICC trophies (yet)"],
    about: "The Tigers have shown immense growth and potential in world cricket.",
  },
  Afghanistan: {
    flag: "🇦🇫",
    achievements: ["🌍 No ICC trophies"],
    about: "Fearless, rising force in world cricket. Known for players like Rashid Khan.",
  },
  "West Indies": {
    flag: "🌴",
    achievements: [
      "🏆 World Cups: 2 (1975, 1979)",
      "🔥 T20 World Cups: 2 (2012, 2016)",
      "🥇 Champions Trophy: 1 (2004)",
    ],
    about: "Flair and fire! Two-time T20 WC champs known for explosive style.",
  },
  Zimbabwe: {
    flag: "🇿🇼",
    achievements: ["🌱 No ICC trophies"],
    about: "Has produced legends like Andy Flower and many iconic moments.",
  },
  Ireland: {
    flag: "🇮🇪",
    achievements: ["🌱 No ICC trophies"],
    about: "Famous for stunning upsets like beating England in 2011.",
  },
  Netherlands: {
    flag: "🇳🇱",
    achievements: ["🌱 No ICC trophies"],
    about: "Fearless batting style and known for upsetting top teams in T20s.",
  },
  Scotland: {
    flag: "🏴",
    achievements: ["🌱 No ICC trophies"],
    about: "Rising performance and grit. Known for passion and improvement.",
  },
  Nepal: {
    flag: "🇳🇵",
    achievements: ["🌱 No ICC trophies"],
    about: "Fan-favorite team with a massive following and growing potential.",
  },
  UAE: {
    flag: "🇦🇪",
    achievements: ["🌱 No ICC trophies"],
    about: "Host to many ICC events. A base for rising associate talent.",
  },
  Namibia: {
    flag: "🇳🇦",
    achievements: ["🌱 No ICC trophies"],
    about: "Surprise package in T20 WCs. Known for passion and underdog story.",
  },
  USA: {
    flag: "🇺🇸",
    achievements: ["🌱 No ICC trophies"],
    about: "With MLC and ICC events, USA is emerging as a global cricket market.",
  },
  Oman: {
    flag: "🇴🇲",
    achievements: ["🌱 No ICC trophies"],
    about: "Fast-rising associate that has hosted T20 World Cup matches.",
  },
  "Papua New Guinea": {
    flag: "🇵🇬",
    achievements: ["🌱 No ICC trophies"],
    about: "Known for spirit and debut in T20 World Cup. A proud associate team.",
  },
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
    ban: "Bangladesh", bangladesh: "Bangladesh",
    zim: "Zimbabwe", zimbabwe: "Zimbabwe",
    ire: "Ireland", ireland: "Ireland",
    ned: "Netherlands", netherlands: "Netherlands",
    sco: "Scotland", scotland: "Scotland",
    nep: "Nepal", nepal: "Nepal",
    uae: "UAE",
    nam: "Namibia", namibia: "Namibia",
    usa: "USA",
    oma: "Oman",
    png: "Papua New Guinea", "papua new guinea": "Papua New Guinea",
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
        const res = await getMatchesByTeam(normalized);
        if (Array.isArray(res)) {
          setMatches(res);
        }
      } catch (err) {
        console.error("Error fetching team matches:", err);
      }
    };
    fetchMatches();
  }, [normalized]);  

  useEffect(() => {
    if (!matches?.length) return;
    let total = 0, wins = 0, losses = 0, totalRuns = 0, totalOvers = 0, conceded = 0, bowled = 0;

    matches.forEach((m) => {
      const isTeam1 = m.team1.toLowerCase() === normalized.toLowerCase();
      const teamRuns = isTeam1 ? m.runs1 : m.runs2;
      const teamOvers = parseFloat(isTeam1 ? m.overs1 : m.overs2);
      const oppRuns = isTeam1 ? m.runs2 : m.runs1;
      const oppOvers = parseFloat(isTeam1 ? m.overs2 : m.overs1);

      total++;
      if (m.winner?.toLowerCase().includes(normalized.toLowerCase())) wins++;
      else if (m.winner && m.winner !== "Match Draw") losses++;

      totalRuns += teamRuns;
      totalOvers += teamOvers;
      conceded += oppRuns;
      bowled += oppOvers;
    });

    const winPercent = ((wins / total) * 100).toFixed(2);
    const nrr = (totalOvers > 0 && bowled > 0)
      ? ((totalRuns / totalOvers) - (conceded / bowled)).toFixed(2)
      : "0.00";

    setStats({ total, wins, losses, winPercent, nrr });
  }, [matches, normalized]);

  return (
    <div className="container mt-4 text-white">
      <button onClick={() => navigate("/")} className="btn btn-outline-light mb-3">
        ❌ Close
      </button>

      <h2 className="mb-3">{teamInfo?.flag || "🏏"} {normalized} - Team Profile</h2>

      {teamInfo && (
        <>
          <div className="mb-3">
            <h5>Trophies & Achievements:</h5>
            <ul className="list-group bg-dark rounded">
              {teamInfo.achievements.map((ach, i) => (
                <li key={i} className="list-group-item bg-transparent text-light">{ach}</li>
              ))}
            </ul>
            <p className="mt-3">{teamInfo.about}</p>
          </div>
        </>
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
        <p>No match data available.</p>
      )}
    </div>
  );
};

export default TeamDetails;
