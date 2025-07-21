import React from "react";
import "./TopPerformerCard.css";

const TopPerformerCard = ({ performer, period, matchType }) => {
        if (!performer) {
        // You can use the period and matchType props for a more friendly message!
        return (
            <div className="top-performer-card">
            <div className="tp-title">
                Top Performer
                {matchType && matchType !== "All" ? ` (${matchType})` : ""}
                {period === "month" ? " (This Month)" : ""}
            </div>
            <div style={{ color: "#aaa", marginTop: 16, fontSize: 17, textAlign: "center" }}>
                No top performer found for {matchType && matchType !== "All" ? matchType : "this period"}.
            </div>
            </div>
        );
        }
  return (
    <div className={`top-performer-card${performer.mvp_badge ? " mvp" : ""}`}>
      {performer.mvp_badge && (
        <div className="mvp-badge" title="MVP of the Month">
          🏆 MVP of the Month
        </div>
      )}
      <div className="tp-row">
        <div className="tp-title">
          {period === "month" ? "Top Performer (This Month)" : "Top Performer"}
        </div>
        {/* ✅ Step 2: Profile Image + Name */}
          <div className="tp-player-header">
            {performer.profile_url && (
              <img
                src={performer.profile_url}
                alt={performer.player_name}
                className="tp-player-image"
              />
            )}
            <div className="tp-player-name">{performer.player_name}</div>
          </div>
      </div>
      <div className="tp-stats-grid">
        <div>
          <span className="tp-label">Total Runs</span>
          <span className="tp-value">{performer.total_runs ?? "-"}</span>
        </div>
        <div>
          <span className="tp-label">Wickets</span>
          <span className="tp-value">{performer.total_wickets ?? "-"}</span>
        </div>
        <div>
          <span className="tp-label">Innings</span>
          <span className="tp-value">{performer.innings ?? "-"}</span>
        </div>
        <div>
          <span className="tp-label">Bat Avg</span>
          <span className="tp-value">{performer.batting_avg ?? "-"}</span>
        </div>
        <div>
          <span className="tp-label">Bowl Avg</span>
          <span className="tp-value">{performer.bowling_avg ?? "-"}</span>
        </div>
        <div>
          <span className="tp-label">Strike Rate</span>
          <span className="tp-value">{performer.strike_rate ?? "-"}</span>
        </div>
      </div>
    </div>
  );
};

export default TopPerformerCard;
