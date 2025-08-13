// ✅ TeamRanking.js — Neutral glass table + tiny top-3 badges (no colored rows)

import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import "./TeamRanking.css";

/* ---------- Flags ---------- */
const getFlagData = (teamName = "") => {
  const n = String(teamName).trim().toLowerCase();

  const EMOJI = {
    india: "🇮🇳",
    australia: "🇦🇺",
    england: "🏴",             // St George’s Cross
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
    scotland: "🏴",            // Saltire
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

/* ---------- Small rank badge for top-3 ---------- */
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

/* ---------- Component ---------- */
const TeamRanking = () => {
  const [rankings, setRankings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await axios.get(
          "https://cricket-scoreboard-backend.onrender.com/api/team-rankings"
        );
        setRankings(Array.isArray(res.data) ? res.data : []);
      } catch (e) {
        console.error("Error fetching rankings:", e);
        setRankings([]);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

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

  const Row = ({ team, idx, maxRating }) => {
    const rating = Math.max(0, parseFloat(team?.rating) || 0);
    const pct = maxRating > 0 ? Math.min(100, (rating / maxRating) * 100) : 0;

    return (
      <div className="tr-row">
        <div className="td rank">
          <span className="pos">{idx + 1}</span>
        </div>

        <div className="td team">
          <RankBadge idx={idx} />
          <Flag team={team?.team_name} />
          <span className="name">{team?.team_name || "-"}</span>
        </div>

        <div className="td">{team?.matches ?? 0}</div>
        <div className="td">{team?.points ?? 0}</div>

        <div className="td">
          <div className="rating-wrap">
            <div className="rating-track" />
            <div className="rating-bar" style={{ width: `${pct}%` }} />
            <div className="rating-num">{Number(rating).toFixed(2)}</div>
          </div>
        </div>
      </div>
    );
  };

  const Section = ({ type, data }) => {
    const sorted = sortRankList(data);
    const maxRating = Math.max(...sorted.map((r) => parseFloat(r?.rating) || 0), 0);

    return (
      <section className="tr-section">
        <h4 className="tr-subhead">{type} Rankings</h4>

        <div className="tr-table">
          <div className="tr-thead">
            <div className="th">Rank</div>
            <div className="th">Team</div>
            <div className="th">Matches</div>
            <div className="th">Points</div>
            <div className="th">Rating</div>
          </div>

          <div className="tr-tbody">
            {loading && (
              <>
                <div className="skeleton-row" />
                <div className="skeleton-row" />
                <div className="skeleton-row" />
              </>
            )}
            {!loading && sorted.length === 0 && (
              <div className="tr-empty">No {type} rankings available.</div>
            )}
            {!loading &&
              sorted.map((team, idx) => (
                <Row
                  key={`${type}-${team?.team_name}-${idx}`}
                  team={team}
                  idx={idx}
                  maxRating={maxRating}
                />
              ))}
          </div>
        </div>
      </section>
    );
  };

  return (
    <div className="tr-wrap">
      <div className="tr-card">
        <header className="tr-header">
          <h2 className="tr-title">🌍 ODI and T20 Team Rankings</h2>
          <div className="tr-sub">Live table with subtle badges for the top 3</div>
        </header>

        {grouped.ODI?.length > 0 && <Section type="ODI" data={grouped.ODI} />}
        {grouped.T20?.length > 0 && <Section type="T20" data={grouped.T20} />}
      </div>
    </div>
  );
};

export default TeamRanking;
