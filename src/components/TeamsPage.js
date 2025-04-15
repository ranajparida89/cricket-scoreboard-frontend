// src/components/TeamsPage.js
import React from "react";
import { Link } from "react-router-dom";
import "./TeamsPage.css"; // ⬅️ make sure this exists and is styled

const teams = [
  {
    name: "India", code: "IND", flag: "🇮🇳",
    trophies: "🏆 2x World Cups, 2x T20 WC, 3x CT",
    description: "India is a cricketing superpower with dominance across formats and a massive fanbase."
  },
  {
    name: "Australia", code: "AUS", flag: "🇦🇺",
    trophies: "🏆 6x World Cups, 1x T20 WC, 2x CT",
    description: "The most successful team in ICC history — unmatched consistency and champion mentality."
  },
  {
    name: "England", code: "ENG", flag: "🏴",
    trophies: "🏆 1x World Cup, 1x T20 WC, 1x CT",
    description: "England reinvented their white-ball game post-2015 with a thrilling 2019 WC win."
  },
  {
    name: "Pakistan", code: "PAK", flag: "🇵🇰",
    trophies: "🏆 1x World Cup, 1x T20 WC, 1x CT",
    description: "Pakistan is known for its unpredictability and explosive pace attack."
  },
  {
    name: "New Zealand", code: "NZ", flag: "🇳🇿",
    trophies: "🏆 1x T20 WC, 1x CT",
    description: "NZ is loved for their sportsmanship, fair play, and consistent performance."
  },
  {
    name: "South Africa", code: "SA", flag: "🇿🇦",
    trophies: "🏆 1x CT",
    description: "The 'nearly men' of cricket, SA has talent and heartbreaks in equal measure."
  },
  {
    name: "Sri Lanka", code: "SL", flag: "🇱🇰",
    trophies: "🏆 1x World Cup, 1x T20 WC, 1x CT",
    description: "With a 1996 WC win and legends like Sangakkara, SL has a proud cricket legacy."
  },
  {
    name: "Bangladesh", code: "BAN", flag: "🇧🇩",
    trophies: "🌱 No ICC trophies yet",
    description: "Known as the Tigers, Bangladesh is an emerging force with passionate fans."
  },
  {
    name: "Afghanistan", code: "AFG", flag: "🇦🇫",
    trophies: "🌱 No ICC trophies",
    description: "Fearless players like Rashid Khan have made Afghanistan a rising cricketing nation."
  },
  {
    name: "West Indies", code: "WI", flag: "🏴‍☠️",
    trophies: "🏆 2x WC, 2x T20 WC, 1x CT",
    description: "Flair and fire! WI dominated early cricket and still entertain fans globally."
  },
];

const TeamsPage = () => {
  return (
    <div className="container text-white py-4">
      <h2 className="mb-4">🌍 Teams Overview</h2>
      <div className="row">
        {teams.map((team, idx) => (
          <div key={idx} className="col-md-6 col-lg-4 mb-4">
            <div className="team-card-custom bg-dark text-light rounded shadow p-3 h-100">
              <div className="d-flex justify-content-between align-items-center mb-2">
                <div className="fs-2">{team.flag}</div>
                <Link
                  to={`/teams/${team.name.toLowerCase()}`}
                  className="btn btn-outline-info btn-sm"
                >
                  View Stats
                </Link>
              </div>
              <h5 className="mb-1">{team.name} ({team.code})</h5>
              <p className="small text-info">{team.trophies}</p>
              <p className="small">{team.description}</p>
              <a
                href={`https://www.espncricinfo.com/team/${team.name.toLowerCase()}`}
                className="btn btn-sm btn-secondary"
                target="_blank"
                rel="noopener noreferrer"
              >
                🌐 Official Profile
              </a>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TeamsPage;
