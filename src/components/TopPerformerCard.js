import React from "react";
import "./TopPerformerCard.css";

const TopPerformerCard = ({ performers, period, matchType }) => {
  if (!performers || performers.length === 0) {
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
    <div>
      {performers.map((performer, idx) => (
        <div
          className={`top-performer-card${performer.mvp_badge ? " mvp" : ""}`}
          key={idx}
        >
          {performer.mvp_badge && (
            <div className="mvp-badge" title="MVP of the Month">
              🏆 MVP of the Month
            </div>
          )}
          <div className="tp-row">
            <div className="tp-title">
              {period === "month" ? "Top Performer (This Month)" : "Top Performer"}
            </div>
            <div className="tp-player-name">{performer.player_name}</div>
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
      ))}
    </div>
  );
};

export default TopPerformerCard;
