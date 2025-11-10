import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import "./TeamRanking.css";

/* ---------- Flags ---------- */
const getFlagData = (teamName = "") => {
  const n = String(teamName).trim().toLowerCase();
  const EMOJI = {
    india: "🇮🇳",
    australia: "🇦🇺",
    england: "🏴",
    "new zealand": "🇳🇿",
    pakistan: "🇵🇰",
    "south africa": "🇿🇦",
    "sri lanka": "🇱🇰",
    ireland: "🇮🇪",
    kenya: "🇰🇪",
    namibia: "🇳🇦",
    bangladesh: "🇧🇩",
    afghanistan: "🇦🇫",
    zimbabwe: "🇿🇼",
    netherlands: "🇳🇱",
    scotland: "🏴",
    nepal: "🇳🇵",
    oman: "🇴🇲",
    uae: "🇦🇪",
    "united arab emirates": "🇦🇪",
    usa: "🇺🇸",
    "united states": "🇺🇸",
    "hong kong": "🇭🇰",
    hongkong: "🇭🇰",
    "papua new guinea": "🇵🇬",
    png: "🇵🇬",
  };

  if (/(^|\b)west indies(\b|$)|\bwi\b/.test(n)) {
    return { type: "img", src: "/flags/wi.svg", alt: "West Indies" };
  }
  const emoji = EMOJI[n];
  return emoji
    ? { type: "emoji", value: emoji, alt: teamName }
    : { type: "emoji", value: "🏳️", alt: teamName || "Unknown" };
};

const Flag = ({ team }) => {
  const f = getFlagData(team);
  if (f.type === "img") {
    return (
      <img
        className="flag-icon"
        src={f.src}
        alt={f.alt}
        style={{ width: 20, height: 14, objectFit: "contain" }}
      />
    );
  }
  return (
    <span className="flag-emoji" role="img" aria-label={f.alt}>
      {f.value}
    </span>
  );
};

/* ---------- Small rank badge ---------- */
const RankBadge = ({ idx }) => {
  if (idx > 2) return null;
  const map = [
    { cls: "gold", text: "🥇" },
    { cls: "silver", text: "🥈" },
    { cls: "bronze", text: "🥉" },
  ];
  const { cls, text } = map[idx];
  return <span className={`rank-badge ${cls}`}>{text}</span>;
};

/* ---------- Info Popup ---------- */
const InfoModal = ({ onClose }) => {
  return (
    <div className="info-overlay" onClick={onClose}>
      <div className="info-modal" onClick={(e) => e.stopPropagation()}>
        <h3>How Rankings Are Calculated</h3>
        <p>
          Rankings are computed based on the team’s <b>rating</b> and{" "}
          <b>points</b> accumulated from the match history in CrickEdge. Points
          depend on match results, while ratings adjust dynamically based on the
          opponent’s strength and performance.
        </p>
        <button className="info-close-btn" onClick={onClose}>
          Close
        </button>
      </div>
    </div>
  );
};

const TeamRanking = () => {
  const [rankings, setRankings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showInfo, setShowInfo] = useState(false);

  // fetch rankings
  useEffect(() => {
    (async () => {
      try {
        const res = await axios.get(
          "https://cricket-scoreboard-backend.onrender.com/api/team-rankings"
        );
        setRankings(Array.isArray(res.data) ? res.data : []);
      } catch (e) {
        console.error("Error fetching rankings:", e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // group by type
  const grouped = useMemo(() => {
    const out = { ODI: [], T20: [] };
    if (!Array.isArray(rankings)) return out;
    for (const r of rankings) {
      if (r?.match_type === "ODI") out.ODI.push(r);
      if (r?.match_type === "T20") out.T20.push(r);
    }
    return out;
  }, [rankings]);

  const sortRankList = (list) =>
    [...list].sort((a, b) => {
      const ar = parseFloat(a?.rating) || 0;
      const br = parseFloat(b?.rating) || 0;
      if (br !== ar) return br - ar;
      const ap = parseInt(a?.points) || 0;
      const bp = parseInt(b?.points) || 0;
      return bp - ap;
    });

  const Row = ({ team, idx, barPct, showRating, ratingVal }) => (
    <div className="tr-row">
      <div className="td rank">
        <span className="pos">{idx + 1}</span>
      </div>
      <div className="td team">
        <RankBadge idx={idx} />
        <Flag team={team?.team_name} />
        <span className="name">{team?.team_name || "-"}</span>
      </div>
      <div className="td td-center">{team?.matches ?? 0}</div>
      <div className="td td-center">{team?.points ?? 0}</div>
      <div className="td rating-td">
        <div className="rating-wrap">
          <div className="rating-track" />
          <div className="rating-bar" style={{ width: `${barPct}%` }} />
        </div>
        <div className="rating-num">
          {showRating ? Number(ratingVal).toFixed(2) : "—"}
        </div>
      </div>
    </div>
  );

  const Section = ({ type, data }) => {
    const sorted = sortRankList(data);
    const allRatingZero = sorted.every(
      (r) => !r?.rating || Number(r.rating) === 0
    );
    const maxMetric = allRatingZero
      ? Math.max(...sorted.map((r) => Number(r.points) || 0), 0)
      : Math.max(...sorted.map((r) => Number(r.rating) || 0), 0);

    return (
      <section className="tr-section">
        <div className="tr-section-head">
          <h4 className="tr-subhead">{type} Rankings</h4>
          <p className="tr-small-note">
            {allRatingZero
              ? "Rating data not available — showing relative strength by points."
              : "Teams are ordered by rating, then points."}
          </p>
        </div>
        <div className="tr-table">
          <div className="tr-thead">
            <div className="th">Rank</div>
            <div className="th th-team">Team</div>
            <div className="th th-center">Matches</div>
            <div className="th th-center">Points</div>
            <div className="th th-right">Rating</div>
          </div>
          <div className="tr-tbody">
            {loading ? (
              <>
                <div className="skeleton-row" />
                <div className="skeleton-row" />
              </>
            ) : sorted.length === 0 ? (
              <div className="tr-empty">No {type} rankings available.</div>
            ) : (
              sorted.map((team, idx) => {
                const ratingVal = Number(team?.rating) || 0;
                const metric = allRatingZero
                  ? Number(team?.points) || 0
                  : ratingVal;
                const barPct =
                  maxMetric > 0 ? Math.min(100, (metric / maxMetric) * 100) : 0;
                return (
                  <Row
                    key={`${type}-${team?.team_name}-${idx}`}
                    team={team}
                    idx={idx}
                    barPct={barPct}
                    showRating={!allRatingZero}
                    ratingVal={ratingVal}
                  />
                );
              })
            )}
          </div>
        </div>
      </section>
    );
  };

  return (
    <div className="tr-wrap">
      <div className="tr-card">
        {/* Close Button */}
        <button className="tr-close-btn" onClick={() => window.history.back()}>
          ✕
        </button>

        {/* Header */}
        <header className="tr-header">
          <div className="tr-header-topline">
            <span className="page-pill">Rankings</span>
            <span className="page-subtext">
              Pulled from match history of CrickEdge
            </span>
            <button
              type="button"
              className="tr-info-btn"
              onClick={() => setShowInfo(true)}
            >
              i
            </button>
          </div>
          <h2 className="tr-title">International Team Rankings</h2>
          <p className="tr-desc">
            This page compares ODI & T20 teams by rating and points. Top 3 get
            highlighted. If rating data is not available, a points-based bar is
            shown for fair comparison.
          </p>

          <div className="tr-metric-row">
            <div className="metric-box">
              <span className="metric-label">Formats</span>
              <span className="metric-value">
                {grouped.ODI?.length > 0 && grouped.T20?.length > 0
                  ? "ODI & T20"
                  : "Live"}
              </span>
            </div>
            <div className="metric-box">
              <span className="metric-label">Total Teams</span>
              <span className="metric-value">{rankings.length}</span>
            </div>
            <div className="metric-box">
              <span className="metric-label">Last refresh</span>
              <span className="metric-value">real-time</span>
            </div>
          </div>
        </header>

        {grouped.ODI?.length > 0 && <Section type="ODI" data={grouped.ODI} />}
        {grouped.T20?.length > 0 && <Section type="T20" data={grouped.T20} />}

        {!loading &&
          grouped.ODI?.length === 0 &&
          grouped.T20?.length === 0 && (
            <div className="tr-empty tr-empty-global">
              No team ranking data found.
            </div>
          )}
      </div>

      {/* Info popup */}
      {showInfo && <InfoModal onClose={() => setShowInfo(false)} />}
    </div>
  );
};

export default TeamRanking;
