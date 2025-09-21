import React, { useEffect, useState, useMemo } from "react";
import axios from "axios";
import { FaCrown, FaTrophy, FaMedal, FaStar, FaUsers } from "react-icons/fa";
import "./UserAchievements.css";

const API_BASE = "https://cricket-scoreboard-backend.onrender.com/api";

const ratingLabels = {
  batting: "Batting",
  bowling: "Bowling",
  allrounder: "All-rounder",
};

const iconMap = {
  runs: <FaCrown className="ua-icon runs" aria-hidden="true" />,
  centuries: <FaTrophy className="ua-icon centuries" aria-hidden="true" />,
  wickets: <FaMedal className="ua-icon wickets" aria-hidden="true" />,
  wins: <FaUsers className="ua-icon wins" aria-hidden="true" />,
};

export default function UserAchievements({
  userId,
  matchType = "All",
  tournamentName = "",
  seasonYear = "",
}) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState("");

  useEffect(() => {
    if (!userId) return;
    let cancelled = false;

    setLoading(true);
    setApiError("");

    // Build params cleanly, omit empty filters
    const params = { user_id: userId, match_type: matchType };
    if (tournamentName) params.tournament_name = tournamentName;
    if (seasonYear) params.season_year = Number(seasonYear);

    axios
      .get(`${API_BASE}/user-achievements`, { params })
      .then((res) => {
        if (!cancelled) setData(res.data || null);
      })
      .catch(() => !cancelled && setApiError("Failed to load achievements"))
      .finally(() => !cancelled && setLoading(false));

    return () => {
      cancelled = true;
    };
  }, [userId, matchType, tournamentName, seasonYear]);

  const achievements = data?.achievements || {};
  const topRatings = data?.top_ratings || {};

  const cards = useMemo(
    () => [
      {
        key: "runs",
        title: "Highest Run Scorer",
        primary: achievements?.highest_run_scorer?.player_name,
        stat:
          achievements?.highest_run_scorer?.total_runs != null
            ? `${achievements.highest_run_scorer.total_runs} Runs`
            : null,
      },
      {
        key: "centuries",
        title: "Most Centuries",
        primary: achievements?.highest_centuries?.player_name,
        stat:
          achievements?.highest_centuries?.total_centuries != null
            ? `${achievements.highest_centuries.total_centuries} × 100s`
            : null,
      },
      {
        key: "wickets",
        title: "Highest Wickets",
        primary: achievements?.highest_wicket_taker?.player_name,
        stat:
          achievements?.highest_wicket_taker?.total_wickets != null
            ? `${achievements.highest_wicket_taker.total_wickets} Wickets`
            : null,
      },
      {
        key: "wins",
        title: "Team with Most Wins",
        primary: achievements?.team_most_wins?.team_name,
        stat:
          achievements?.team_most_wins?.wins != null
            ? `${achievements.team_most_wins.wins} Wins`
            : null,
      },
    ],
    [achievements]
  );

  if (loading) {
    return (
      <div className="ua-dashboard card-3d glass" aria-live="polite">
        <div className="ua-header">
          <FaStar className="ua-star" />
          <h2>Achievements &amp; Milestones</h2>
          {matchType !== "All" && <span className="ua-pill">({matchType})</span>}
        </div>
        <div className="ua-skeleton-cards">
          {Array.from({ length: 4 }).map((_, i) => (
            <div className="ua-skel" key={i} />
          ))}
        </div>
        <div className="ua-skeleton-ratings">
          {["batting", "bowling", "allrounder"].map((k) => (
            <div className="ua-skel-col" key={k} />
          ))}
        </div>
      </div>
    );
  }

  if (apiError) {
    return (
      <div className="ua-dashboard card-3d glass">
        <div className="ua-state error">{apiError}</div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="ua-dashboard card-3d glass">
        <div className="ua-state">No data found for this user.</div>
      </div>
    );
  }

  return (
    <div className="ua-dashboard card-3d glass">
      <div className="ua-header">
        <FaStar className="ua-star" />
        <h2>Achievements &amp; Milestones</h2>
        {matchType !== "All" && <span className="ua-pill">({matchType})</span>}
        {tournamentName && <span className="ua-pill">({tournamentName})</span>}
        {seasonYear && <span className="ua-pill">({seasonYear})</span>}
      </div>

      {/* Highlight cards */}
      <div className="ua-cards">
        {cards.map((c) => (
          <div className={`ua-card ${c.key}`} key={c.key}>
            <div className="ua-card-top">
              {iconMap[c.key]}
              <div className="ua-card-title">{c.title}</div>
            </div>
            {c.primary ? (
              <>
                <div className="ua-card-primary" title={c.primary}>
                  {c.primary}
                </div>
                {c.stat && <div className="ua-card-stat">{c.stat}</div>}
              </>
            ) : (
              <div className="ua-card-na">N/A</div>
            )}
            <div className="ua-glow" aria-hidden="true" />
          </div>
        ))}
      </div>

      {/* Ratings */}
      <div className="ua-ratings">
        <h3 className="ua-subhead">
          <FaStar className="ua-subicon" />
          Top 5 Player Ratings
        </h3>

        <div className="ua-ratings-grid">
          {["batting", "bowling", "allrounder"].map((key) => {
            const list = Array.isArray(topRatings[key]) ? topRatings[key] : [];
            return (
              <div className="ua-rating-col card-3d glass" key={key}>
                <div className="ua-rating-title">{ratingLabels[key]}</div>

                {list.length === 0 ? (
                  <div className="ua-card-na">N/A</div>
                ) : (
                  <ol className={`ua-rating-list ${key}`}>
                    {list.map((p, idx) => {
                      const ratingVal =
                        p.rating ??
                        p[`${key}_rating`] ??
                        p.value ??
                        p.score ??
                        "-";
                      return (
                        <li
                          key={p.player_id || `${key}-${idx}`}
                          className={`rank-${idx + 1}`}
                        >
                          <span className="ua-rank">{idx + 1}</span>
                          <span className="ua-player">
                            <span className="ua-name" title={p.player_name}>
                              {p.player_name}
                            </span>
                            <span className="ua-team">{p.team_name}</span>
                          </span>
                          <span className="ua-rating">{ratingVal}</span>
                        </li>
                      );
                    })}
                  </ol>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
