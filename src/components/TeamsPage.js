// src/components/TeamsPage.js
import React from "react";
import { Link } from "react-router-dom";
import "./TeamsPage.css";

const teams = [
  { name: "India", code: "IND", flag: "🇮🇳" },
  { name: "Australia", code: "AUS", flag: "🇦🇺" },
  { name: "England", code: "ENG", flag: "🏴" },
  { name: "Pakistan", code: "PAK", flag: "🇵🇰" },
  { name: "New Zealand", code: "NZ", flag: "🇳🇿" },
  { name: "South Africa", code: "SA", flag: "🇿🇦" },
  { name: "Sri Lanka", code: "SL", flag: "🇱🇰" },
  { name: "Bangladesh", code: "BAN", flag: "🇧🇩" },
  { name: "Afghanistan", code: "AFG", flag: "🇦🇫" },
  { name: "West Indies", code: "WI", flag: "🏴‍☠️" },
  { name: "Zimbabwe", code: "ZIM", flag: "🇿🇼" },
  { name: "Ireland", code: "IRE", flag: "🇮🇪" },
  { name: "Netherlands", code: "NED", flag: "🇳🇱" },
  { name: "Scotland", code: "SCO", flag: "🏴" },
  { name: "Nepal", code: "NEP", flag: "🇳🇵" },
  { name: "UAE", code: "UAE", flag: "🇦🇪" },
  { name: "Namibia", code: "NAM", flag: "🇳🇦" },
  { name: "USA", code: "USA", flag: "🇺🇸" },
  { name: "Oman", code: "OMA", flag: "🇴🇲" },
  { name: "Papua New Guinea", code: "PNG", flag: "🇵🇬" }
];

const TeamsPage = () => {
  return (
    <div className="container text-white py-4">
      <h2 className="mb-4 text-info">🌍 Teams Overview</h2>
      <div className="row">
        {teams.map((team, idx) => (
          <div key={idx} className="col-6 col-sm-4 col-md-3 col-lg-2 mb-4">
            <Link
              to={`/teams/${team.name.toLowerCase()}`}
              className="team-card text-center text-decoration-none"
            >
              <div className="team-box p-3 rounded shadow-sm h-100">
                <div className="fs-2">{team.flag}</div>
                <div className="fw-bold mt-2">{team.name}</div>
                <div className="text-muted small">{team.code}</div>
              </div>
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TeamsPage;
