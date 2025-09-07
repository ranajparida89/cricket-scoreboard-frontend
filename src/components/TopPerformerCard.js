import React from "react";
import "./TopPerformerCard.css";

const TopPerformerCard = ({ performer, period, matchType }) => {
  const periodLabel = period === "month" ? " (This Month)" : "";
  const typeLabel =
    matchType && matchType !== "All" ? ` (${matchType})` : "";

  // Empty state (no data)
  if (!performer) {
    return (
      <div className="tp-card card-3d glass tp-empty">
        <div className="tp-title">Top Performer{typeLabel}{periodLabel}</div>
        <div className="tp-empty-text">
          No top performer found for{" "}
          {matchType && matchType !== "All" ? matchType : "this period"}.
        </div>
      </div>
    );
  }

  const avatar =
    performer.player_avatar ||
    performer.photo_url ||
    performer.image_url ||
    "";

  return (
    <div className={`tp-card card-3d glass ${performer.mvp_badge ? "is-mvp" : ""}`}>
      {performer.mvp_badge && (
        <div className="tp-ribbon" title="MVP of the Month">
          🏆 MVP of the Month
        </div>
      )}

      <div className="tp-head">
        <div className="tp-avatar-wrap">
          {avatar ? (
            <img src={avatar} alt="player" className="tp-avatar" />
          ) : (
            <div className="tp-avatar tp-avatar-fallback" aria-hidden="true">🏏</div>
          )}
        </div>
        <div className="tp-head-text">
          <div className="tp-title">Top Performer{periodLabel}</div>
          <div className="tp-name" title={performer.player_name}>
            {performer.player_name}
          </div>
          <div className="tp-meta">{typeLabel.replace(" (", "").replace(")", "")}</div>
        </div>
      </div>

      <div className="tp-stats-grid">
        <Stat label="Total Runs"   value={safe(performer.total_runs)} />
        <Stat label="Wickets"      value={safe(performer.total_wickets)} />
        <Stat label="Innings"      value={safe(performer.innings)} />
        <Stat label="Bat Avg"      value={safe(performer.batting_avg)} />
        <Stat label="Bowl Avg"     value={safe(performer.bowling_avg)} />
        <Stat label="Strike Rate"  value={safe(performer.strike_rate)} />
      </div>

      <div className="tp-glow" aria-hidden="true" />
    </div>
  );
};

function Stat({ label, value }) {
  return (
    <div className="tp-stat">
      <span className="tp-label">{label}</span>
      <span className="tp-value">{value}</span>
    </div>
  );
}

function safe(v) {
  return v === null || v === undefined || v === "" ? "-" : v;
}

export default TopPerformerCard;
