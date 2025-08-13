// ✅ src/components/TeamRanking.js — Glass leaderboard-style rankings (ODI & T20)
// - Top-3 animated (gold/silver/bronze) with golden shadow pulse
// - Rating bar scaled to max rating per format
// - Correct flags (🇭🇰 Hong Kong; West Indies uses crest image /flags/wi.svg)

import React, { useEffect, useState, useMemo } from "react";
import axios from "axios";
import "./TeamRanking.css";

/* ---------- Flag helpers ---------- */
// West Indies uses a crest image; others use emoji
const getFlagData = (teamName = "") => {
  const n = String(teamName).trim().toLowerCase();

  // Emoji flags
  const EMOJI = {
    india: "🇮🇳",
    australia: "🇦🇺",
    england: "🏴",           // St George’s Cross
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
    scotland: "🏴",          // Saltire
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

  // West Indies => crest
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

/* ---------- Component ---------- */
const TeamRanking = () => {
  const [rankings, setRankings] = useState([]);
  const [loading, setLoading] = useState(true);

  // fetch
  useEffect(() => {
    const fetchRankings = async () => {
      try {
        const res = await axios.get(
          "https://cricket-scoreboard-backend.onrender.com/api/team-rankings"
        );
        setRankings(Array.isArray(res.data) ? res.data : []);
      } catch (err) {
        console.error("Error fetching rankings:", err);
        setRankings([]);
      } finally {
        setLoading(false);
      }
    };
    fetchRankings();
  }, []);

  // group by match type (only ODI & T20)
  const grouped = useMemo(() => {
    const out = { ODI: [], T20: [] };
    if (!Array.isArray(rankings)) return out;
    for (const t of rankings) {
      if (t?.match_type === "ODI") out.ODI.push(t);
      if (t?.match_type === "T20") out.T20.push(t);
    }
    return out;
  }, [rankings]);

  const sortRankList = (list) =>
    [...list].sort((a, b) => {
      const ar = parseFloat(a?.rating) || 0;
      const br = parseFloat(b?.rating) || 0;
      if (br !== ar) return br - ar; // rating desc
      const ap = parseInt(a?.points) || 0;
      const bp = parseInt(b?.points) || 0;
      return bp - ap; // then points desc
    });

  const Medal = ({ idx }) =>
    idx === 0 ? (
      <span className="medal sparkle">🥇</span>
    ) : idx === 1 ? (
      <span className="medal sparkle">🥈</span>
    ) : idx === 2 ? (
      <span className="medal sparkle">🥉</span>
    ) : null;

  const Row = ({ team, idx, maxRating }) => {
    const rowClass =
      idx === 0 ? "gold" : idx === 1 ? "silver" : idx === 2 ? "bronze" : "";
    const rating = Math.max(0, parseFloat(team?.rating) || 0);
    const pct = maxRating > 0 ? Math.min(100, (rating / maxRating) * 100) : 0;
    const barClass = idx === 0 ? "g" : idx === 1 ? "s" : idx === 2 ? "b" : "";

    return (
      <div className={`tr-row ${rowClass}`}>
        <div className="td rank">
          <span className="medal-spot">
            <Medal idx={idx} />
          </span>
          <span className="pos">{idx + 1}</span>
        </div>

        <div className="td team">
          <span className="flag">
            <Flag team={team?.team_name} />
          </span>
          <span className="name">{team?.team_name || "-"}</span>
        </div>

        <div className="td">{team?.matches ?? 0}</div>
        <div className="td">{team?.points ?? 0}</div>

        <div className="td">
          <div className="rating-wrap">
            <div className="rating-track" />
            <div className={`rating-bar ${barClass}`} style={{ width: `${pct}%` }} />
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
                <Row key={`${type}-${team?.team_name}-${idx}`} team={team} idx={idx} maxRating={maxRating} />
              ))}
          </div>
        </div>
      </section>
    );
  };

  return (
    <div className="tr-wrap">
      <div className="tr-orbs">
        <span className="orb o1" />
        <span className="orb o2" />
      </div>

      <div className="tr-card">
        <header className="tr-header">
          <h2 className="tr-title">🌍 ODI and T20 Team Rankings</h2>
          <div className="tr-sub">Live table with animated top-3 & gold glow</div>
        </header>

        {grouped.ODI && grouped.ODI.length > 0 && <Section type="ODI" data={grouped.ODI} />}
        {grouped.T20 && grouped.T20.length > 0 && <Section type="T20" data={grouped.T20} />}
      </div>
    </div>
  );
};

export default TeamRanking;
