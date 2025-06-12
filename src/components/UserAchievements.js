import React, { useEffect, useState } from "react";
import axios from "axios";
import { FaCrown, FaTrophy, FaMedal, FaStar, FaUsers } from "react-icons/fa";
import "./UserAchievements.css"; // Create this CSS file

const API_BASE = "https://cricket-scoreboard-backend.onrender.com/api";

const badgeIcons = {
  runs: <FaCrown className="badge-icon runs" />,
  centuries: <FaTrophy className="badge-icon centuries" />,
  wickets: <FaMedal className="badge-icon wickets" />,
  wins: <FaUsers className="badge-icon wins" />,
  rating: <FaStar className="badge-icon rating" />,
};

const ratingLabels = {
  batting: "Batting",
  bowling: "Bowling",
  allrounder: "All-rounder"
};

const UserAchievements = ({ userId, matchType = "All" }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) return;
    setLoading(true);
    axios
      .get(`${API_BASE}/user-achievements`, {
        params: { user_id: userId, match_type: matchType }
      })
      .then(res => setData(res.data))
      .finally(() => setLoading(false));
  }, [userId, matchType]);

  if (loading) {
    return <div className="ua-loading">Loading achievements...</div>;
  }
  if (!data) {
    return <div className="ua-error">No data found for this user.</div>;
  }

  const { achievements, top_ratings } = data;

  return (
    <div className="ua-dashboard">
      <h2 className="ua-heading">
        <FaStar style={{ color: "#fbc02d", marginRight: 10 }} />
        Achievements & Milestones
        <span className="ua-format">{data.match_type !== "All" && ` (${data.match_type})`}</span>
      </h2>
      <div className="ua-cards">
        {/* Highest Run Scorer */}
        <div className="ua-card runs">
          {badgeIcons.runs}
          <div className="ua-title">Highest Run Scorer</div>
          {achievements.highest_run_scorer ? (
            <>
              <div className="ua-value">{achievements.highest_run_scorer.player_name}</div>
              <div className="ua-stat">{achievements.highest_run_scorer.total_runs} Runs</div>
            </>
          ) : (
            <div className="ua-na">N/A</div>
          )}
        </div>
        {/* Highest Centuries */}
        <div className="ua-card centuries">
          {badgeIcons.centuries}
          <div className="ua-title">Most Centuries</div>
          {achievements.highest_centuries ? (
            <>
              <div className="ua-value">{achievements.highest_centuries.player_name}</div>
              <div className="ua-stat">{achievements.highest_centuries.total_centuries} 100s</div>
            </>
          ) : (
            <div className="ua-na">N/A</div>
          )}
        </div>
        {/* Highest Wicket Taker */}
        <div className="ua-card wickets">
          {badgeIcons.wickets}
          <div className="ua-title">Highest Wickets</div>
          {achievements.highest_wicket_taker ? (
            <>
              <div className="ua-value">{achievements.highest_wicket_taker.player_name}</div>
              <div className="ua-stat">{achievements.highest_wicket_taker.total_wickets} Wickets</div>
            </>
          ) : (
            <div className="ua-na">N/A</div>
          )}
        </div>
        {/* Team with Most Wins */}
        <div className="ua-card wins">
          {badgeIcons.wins}
          <div className="ua-title">Team with Most Wins</div>
          {achievements.team_most_wins ? (
            <>
              <div className="ua-value">{achievements.team_most_wins.team_name}</div>
              <div className="ua-stat">{achievements.team_most_wins.wins} Wins</div>
            </>
          ) : (
            <div className="ua-na">N/A</div>
          )}
        </div>
      </div>
      <div className="ua-ratings-section">
        <h3 className="ua-subheading">
          <FaStar className="rating" />
          Top 5 Player Ratings
        </h3>
        <div className="ua-ratings-table">
          {["batting", "bowling", "allrounder"].map(key => (
            <div key={key} className="ua-rating-col">
              <div className="ua-rating-title">{ratingLabels[key]}</div>
              {top_ratings[key] && top_ratings[key].length > 0 ? (
                <ol className={`ua-rating-list ${key}`}>
                  {top_ratings[key].map(player => (
                    <li key={player.player_id}>
                      <span className="ua-player-name">{player.player_name}</span>
                      <span className="ua-player-team">{player.team_name}</span>
                      <span className="ua-player-rating">{player.rating || player[`${key}_rating`]}</span>
                    </li>
                  ))}
                </ol>
              ) : (
                <div className="ua-na">N/A</div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default UserAchievements;
