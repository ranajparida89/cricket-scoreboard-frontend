import React, { useEffect, useState } from "react";
import "./SeasonLeaderboard.css";
import CrickedgeSeasonAdmin from "./CrickedgeSeasonAdmin";
const SeasonLeaderboard = () => {
    const [data, setData] = useState([]);
    const [matchType, setMatchType] = useState("ALL");
    const [loading, setLoading] = useState(true);
    const [matches, setMatches] = useState({
        odiT20: [], test: []
    });

    /* SEASONS */

    const [seasons, setSeasons] = useState([]);
    const [selectedSeason, setSelectedSeason] = useState(null);

    /* ADMIN DETECTION */
    const [isAdmin, setIsAdmin] = useState(false);
    useEffect(() => {
        const token = localStorage.getItem("admin_jwt");
        if (token)
            setIsAdmin(true)
    }, [])

    const loadData = async (type, seasonId) => {
        setLoading(true);
        let url =
            "https://cricket-scoreboard-backend.onrender.com/api/crickedge-season/leaderboard";
        let params = [];
        if (type !== "ALL")
            params.push(`match_type=${type}`);
        if (seasonId)
            params.push(`season_id=${seasonId}`);
        if (params.length > 0)
            url += "?" + params.join("&");
        const res = await fetch(url);
        const json = await res.json();
        setData(json);
        setLoading(false);

    };

    /* LOAD ALL SEASONS */
    const loadSeasons = async () => {
        const res = await fetch(
            "https://cricket-scoreboard-backend.onrender.com/api/crickedge-season/all"
        );
        const json = await res.json();
        setSeasons(json);
        /* AUTO SELECT FIRST SEASON */
        if (json.length > 0) {
            setSelectedSeason(json[0].id);
            loadData("ALL", json[0].id);
            loadMatches(json[0].id);
        }
    };
    useEffect(() => {
        loadSeasons();
    },
        []);
    const loadMatches = async (seasonId) => {
        const res = await fetch(
            `https://cricket-scoreboard-backend.onrender.com/api/crickedge-season/matches?season_id=${seasonId}`
        );
        const json = await res.json();
        setMatches(json);
    };


    return (
        <div className="seasonContainer">
            <h2>🏆 CrickEdge Season Leaderboard</h2>
            {/* SEASON TABS */}
            <div className="seasonTabs">
                {seasons.map((s) => (
                    <button
                        key={s.id}

                        className={
                            selectedSeason === s.id
                                ?
                                "seasonTab active"
                                :
                                "seasonTab"
                        }
                        onClick={() => {
                            setSelectedSeason(s.id);
                            loadData(matchType, s.id);
                            loadMatches(s.id);
                        }}
                    >
                        {s.season_name}
                    </button>
                ))}
            </div>
            {/* ADMIN PANEL */}
            {isAdmin && (
                <div className="seasonAdminBox">
                    <CrickedgeSeasonAdmin />
                </div>
            )}
            <div className="filterBox">
                <select
                    value={matchType}
                    onChange={(e) => {
                        setMatchType(e.target.value);
                        loadData(e.target.value, selectedSeason);
                    }}
                >
                    <option value="ALL">All Matches</option>
                    <option value="ODI">ODI</option>
                    <option value="T20">T20</option>
                    <option value="Test">Test</option>
                </select>
            </div>
            {loading ?

                <div className="loadingBox">
                    Loading Season Leaderboard...
                </div>
                :
                <>
                    <table className="seasonTable">
                        <thead>
                            <tr>
                                <th>Rank</th>
                                <th>Team</th>
                                <th>Matches</th>
                                <th>Wins</th>
                                <th>Losses</th>
                                <th>Draws</th>
                                <th>Points</th>
                            </tr>
                        </thead>
                        <tbody>
                            {data.map((t, i) => (
                                <tr key={i}
                                    className={t.rank === 1 ? "topTeam" : ""}
                                >
                                    <td>
                                        {t.rank === 1 ? "👑 " + t.rank : t.rank}
                                    </td>
                                    <td>{t.team}</td>
                                    <td>{t.matches}</td>
                                    <td>{t.wins}</td>
                                    <td>{t.losses}</td>
                                    <td>{t.draws}</td>
                                    <td className="points">
                                        {t.points}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    {/* ODI + T20 MATCHES */}

                    <div className="matchSection">
                    <h3>Latest ODI / T20 Matches</h3>
                        <div className="matchGrid">
                            {matches.odiT20.map(m => (
                                <div key={m.match_id} className="matchCard">
                                    <div className="matchTitle">
                                        {m.match_name}
                                    </div>
                                  <div className="matchTeams">
                                        {m.team1} vs {m.team2}
                                    </div>
                                    <div className="matchWinner">
                                        Winner: {m.winner || "Draw"}
                                    </div>
                                    <div className="matchDate">
                                        {m.match_date}
                                    </div>
                               </div>
                            ))}
                        </div>
                    </div>
                    {/* TEST MATCHES */}
                    <div className="matchSection">
                        <h3>Latest Test Matches</h3>
                        <div className="matchGrid">
                            {matches.test.map(m => (
                                <div key={m.match_id} className="matchCard">
                                    <div className="matchTitle">
                                        {m.match_name}
                                    </div>
                                    <div className="matchTeams">
                                        {m.team1} vs {m.team2}
                                    </div>
                                    <div className="matchWinner">
                                        Winner: {m.winner || "Draw"}
                                    </div>
                                    <div className="matchDate">
                                        {m.match_date}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </>
            }
        </div>
    );
};
export default SeasonLeaderboard;