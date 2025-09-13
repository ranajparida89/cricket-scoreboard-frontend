import React, { useEffect, useState } from "react";
import { getTeams } from "../services/api";
import { io } from "socket.io-client";
import "./Leaderboard.css";

/* Backend base (no trailing slash). Use CRA env only. */
const API_BASE = (
  process.env.REACT_APP_API_BASE ||
  "https://cricket-scoreboard-backend.onrender.com"
).replace(/\/$/, "");

/* Title */
const TITLE_STYLE = {
  textAlign: "center",
  margin: "0 0 12px",
  fontWeight: 900,
  fontSize: "22px",
  color: "#22ff99",
};

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

/* Socket to the same backend */
const socket = io(API_BASE);

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

  // Explorer modal state
  const [expOpen, setExpOpen] = useState(false);
  const [expLoading, setExpLoading] = useState(false);
  const [expError, setExpError] = useState("");
  const [expData, setExpData] = useState(null);
  const [expFilters, setExpFilters] = useState({
    team: "",
    format: "All",
    result: "All",
    season: "",
    tournament: "",
    page: 1,
    pageSize: 20,
  });

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

  // ------- Explorer fetchers -------
  const fetchExplorer = async (overrides = {}) => {
    const f = { ...expFilters, ...overrides };
    setExpFilters(f);
    setExpLoading(true);
    setExpError("");
    try {
      const qs = new URLSearchParams({
        team: f.team,
        format: f.format,
        result: f.result,
        ...(f.season ? { season: f.season } : {}),
        ...(f.tournament ? { tournament: f.tournament } : {}),
        page: String(f.page),
        pageSize: String(f.pageSize),
      }).toString();

      const url = `${API_BASE}/api/teams/explorer?${qs}`;
      const res = await fetch(url, { credentials: "include" });

      const ctype = res.headers.get("content-type") || "";
      if (!res.ok) {
        const body = await res.text().catch(() => "");
        throw new Error(`Explorer API failed (${res.status}): ${body.slice(0, 200)}`);
      }
      if (!ctype.includes("application/json")) {
        const body = await res.text().catch(() => "");
        throw new Error(`Explorer API returned non-JSON (${ctype}): ${body.slice(0, 160)}`);
      }

      const json = await res.json();
      setExpData(json);
    } catch (e) {
      console.error(e);
      setExpError("Failed to load match list.");
    } finally {
      setExpLoading(false);
    }
  };

  const openExplorer = (teamName) => {
    setExpOpen(true);
    setExpData(null);
    fetchExplorer({ team: teamName, page: 1 });
  };
  const closeExplorer = () => {
    setExpOpen(false);
    setExpData(null);
    setExpError("");
  };

  const changeFilter = (patch) => {
    const withReset = { ...patch, page: 1 };
    fetchExplorer(withReset);
  };

  const changePage = (delta) => {
    const next = Math.max(1, (expFilters.page || 1) + delta);
    fetchExplorer({ page: next });
  };

  return (
    <div className="leaderboard-shell">
      <h2 className="lb-title" style={TITLE_STYLE}>
        Leaderboard Summary (ODI/T20)
      </h2>

      <div className="leaderboard-table-wrapper">
        <table className="table table-dark text-center mb-0 leaderboard-table">
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
              return (
                <tr
                  key={team.team_name}
                  className={`lb-row ${index < 3 ? "top3" : ""}`}
                  style={{ cursor: "pointer" }}
                  onClick={() => openExplorer(team.team_name)}
                  title="Click for match explorer"
                >
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
                <td colSpan="8" className="text-muted py-4">No match data available.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* --------- Explorer Modal ---------- */}
      {expOpen && (
        <div className="me-overlay" onClick={closeExplorer}>
          <div className="me-modal" onClick={(e) => e.stopPropagation()}>
            <div className="me-head">
              <div>
                <div className="me-title">{expFilters.team || "Team"}</div>
                {expData && (
                  <div className="me-sub">
                    Played {expData.summary.played} · W {expData.summary.wins} · L {expData.summary.losses} · D {expData.summary.draws}
                 {expData.summary.last5?.length ? (
                    <span className="me-last5">
                      {" · Last 5: "}
                      {expData.summary.last5.map((r, i) => {
                        const R = String(r).trim().toUpperCase();   // W | L | D
                        return (
                          <span key={i} className={`last5-badge last5-${R}`}>
                            {R}
                          </span>
                        );
                      })}
                    </span>
                  ) : null}
                  </div>
                )}
              </div>
              <button className="me-close" onClick={closeExplorer}>✕</button>
            </div>

            {/* Filters */}
            <div className="me-filters">
              <div className="me-group">
                <span className="me-label">Format</span>
                {["All", "ODI", "T20"].map((v) => (
                  <button
                    key={v}
                    className={`me-chip ${expFilters.format === v ? "act" : ""}`}
                    onClick={() => changeFilter({ format: v })}
                  >
                    {v}
                  </button>
                ))}
              </div>

              <div className="me-group">
                <span className="me-label">Result</span>
                {["All", "W", "L", "D"].map((v) => (
                  <button
                    key={v}
                    className={`me-chip ${expFilters.result === v ? "act" : ""}`}
                    onClick={() => changeFilter({ result: v })}
                  >
                    {v}
                  </button>
                ))}
              </div>

              {/* Optional facets */}
              {expData?.facets?.seasons?.length ? (
                <div className="me-group">
                  <span className="me-label">Season</span>
                  <select
                    value={expFilters.season || ""}
                    onChange={(e) => changeFilter({ season: e.target.value || "" })}
                    className="me-select"
                  >
                    <option value="">All</option>
                    {expData.facets.seasons.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
              ) : null}

              {expData?.facets?.tournaments?.length ? (
                <div className="me-group">
                  <span className="me-label">Tournament</span>
                  <select
                    value={expFilters.tournament || ""}
                    onChange={(e) => changeFilter({ tournament: e.target.value || "" })}
                    className="me-select"
                  >
                    <option value="">All</option>
                    {expData.facets.tournaments.map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>
              ) : null}
            </div>

            {/* Body */}
            <div className="me-body">
              {expLoading && <div className="me-status">Loading…</div>}
              {expError && <div className="me-status err">{expError}</div>}

              {expData?.matches?.length ? (
                <table className="me-table">
                 <thead>
                          <tr>
                            <th>Date</th>
                            <th>Fmt</th>
                            <th>Tournament</th>
                            <th>Opponent</th>
                            <th className="right">
                              {`Team${expFilters.team ? ` (${displayTeam(expFilters.team)})` : ""} Score`}
                            </th>
                            <th className="right">Opp Score</th>
                            <th>Res</th>
                          </tr>
                        </thead>
                  <tbody>
                    {expData.matches.map((m) => (
                      <tr key={m.match_id}>
                        <td>{m.date}</td>
                        <td>{m.format}</td>
                        <td className="clip">{m.tournament || "—"}</td>
                        <td className="clip">{m.opponent}</td>
                        <td className="right">{m.team_runs}/{m.team_wkts} ({m.team_overs})</td>
                        <td className="right">{m.opp_runs}/{m.opp_wkts} ({m.opp_overs})</td>
                        <td>{m.result}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (!expLoading && !expError) ? (
                <div className="me-status">No matches found for the selected filters.</div>
              ) : null}
            </div>

            {/* Footer / Pagination */}
            <div className="me-foot">
              <button
                className="me-btn"
                onClick={() => changePage(-1)}
                disabled={expFilters.page <= 1 || expLoading}
              >
                Prev
              </button>
              <div className="me-page">Page {expFilters.page}</div>
              <button
                className="me-btn"
                onClick={() => changePage(1)}
                disabled={expLoading || (expData && expData.matches?.length < expFilters.pageSize)}
              >
                Next
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Leaderboard;