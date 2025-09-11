import React, { useEffect, useState } from "react";
import { getTestMatchLeaderboard } from "../services/api";
import "./TestLeaderboard.css";

/* Simple, unified title (same as white-ball leaderboard) */
const TITLE_STYLE = {
  textAlign: "center",
  margin: "0 0 12px",
  fontWeight: 900,
  fontSize: "22px",
  color: "#22ff99",
};

// Abbreviations
const TEAM_ABBR = {
  "south africa": "SA", england: "ENG", india: "IND", kenya: "KEN", scotland: "SCT",
  "new zealand": "NZ", "hong kong": "HKG", australia: "AUS", afghanistan: "AFG",
  bangladesh: "BAN", pakistan: "PAK", ireland: "IRE", netherlands: "NED", namibia: "NAM",
  zimbabwe: "ZIM", nepal: "NEP", oman: "OMA", canada: "CAN", "united arab emirates": "UAE",
  "west indies": "WI", "papua new guinea": "PNG", "sri lanka": "SL", "united states": "USA", usa: "USA",
};
const norm = (s) => (s ?? "").toString().trim();
const abbreviateTeamName = (name) => {
  const s = norm(name);
  if (!s) return s;
  const key = s.toLowerCase();
  if (TEAM_ABBR[key]) return TEAM_ABBR[key];
  const words = s.split(/\s+/).filter(Boolean);
  if (words.length === 1) return words[0].slice(0, 3).toUpperCase();
  return words.map((w) => w[0]).join("").slice(0, 3).toUpperCase();
};
const displayTeam = (name) => abbreviateTeamName(name);

const medal = (i) => (i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : "");

export default function TestLeaderboard() {
  const [teams, setTeams] = useState([]);

  useEffect(() => {
    getTestMatchLeaderboard()
      .then((data) => {
        const arr = Array.isArray(data) ? data : [];
        const normalized = arr.map((t) => ({
          team_name: t.team_name,
          matches: Number(t.matches) || 0,
          wins: Number(t.wins) || 0,
          losses: Number(t.losses) || 0,
          draws:
            t.draws != null
              ? Number(t.draws)
              : Math.max(
                  0,
                  (Number(t.matches) || 0) -
                    (Number(t.wins) || 0) -
                    (Number(t.losses) || 0)
                ),
          points: Number(t.points) || 0,
        }));
        const sorted = normalized.sort(
          (a, b) => b.points - a.points || b.wins - a.wins
        );
        setTeams(sorted);
      })
      .catch(() => setTeams([]));
  }, []);

  return (
    <div className="tlfx-shell">
      <div className="tlfx-glass">
        <h2 className="tlfx-title" style={TITLE_STYLE}>
          Test Leaderboard
        </h2>

        <div className="tlfx-table-wrap">
          <table className="tlfx-table">
            <thead>
              <tr>
                <th>R</th>
                <th>T</th>
                <th>M</th>
                <th>W</th>
                <th>L</th>
                <th>D</th>
                <th>Pts</th>
              </tr>
            </thead>
            <tbody>
              {teams.length === 0 && (
                <tr>
                  <td className="tlfx-empty" colSpan="7">
                    No Test match leaderboard data available.
                  </td>
                </tr>
              )}

              {teams.map((t, i) => (
                <tr
                  key={`${t.team_name}-${i}`}
                  className={`tlfx-row ${i < 3 ? "top3" : ""}`}
                >
                  <td>
                    <span className="medal-emoji">{medal(i)}</span> {i + 1}
                  </td>
                  <td className="team">{displayTeam(t.team_name)}</td>
                  <td>{t.matches}</td>
                  <td className="pos">{t.wins}</td>
                  <td className="neg">{t.losses}</td>
                  <td>{t.draws}</td>
                  <td className="pos">{t.points}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
