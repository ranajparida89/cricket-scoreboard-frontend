// ✅ src/components/MatchCards.js — compact dark cards + gold accents + LIVE/Recent badges
// ✅ Matches MatchCards.css classes:
//    • Tabs: .format-toggle + .format-btn (.odi | .t20 | .test) + .active
//    • Card: .match-card.simple (+ .live when a game is live)
//    • Section title: .section-heading
// ✅ Only ripple animation kept (no GSAP/Framer).

import React, { useEffect, useMemo, useState } from "react";
import { getMatchHistory, getTestMatches } from "../services/api";
import "./MatchCards.css";

/* ---------- helpers ---------- */
const formatOvers = (decimalOvers = 0) => {
  const fullOvers = Math.floor(decimalOvers);
  const balls = Math.round((decimalOvers - fullOvers) * 6);
  return `${fullOvers}.${balls}`;
};

const formatMatchTitle = (raw = "") => {
  let s = String(raw).split(":")[0];
  s = s
    .replace(/(?<=[A-Za-z])(?=\d)/g, " ")
    .replace(/(?<=\d)(?=[A-Za-z])/g, " ")
    .replace(/(ODI|T20|TEST|Test|Final|Qualifier|Semi|Quarter)/g, " $1 ")
    .replace(/\s{2,}/g, " ")
    .trim();
  return s.replace(/^(\w)/, (m) => m.toUpperCase());
};

const getFlag = (teamName) => {
  const n = teamName?.trim().toLowerCase();
  const f = {
    india: "🇮🇳", australia: "🇦🇺", england: "🏴", "new zealand": "🇳🇿",
    pakistan: "🇵🇰", "south africa": "🇿🇦", "sri lanka": "🇱🇰", ireland: "🇮🇪",
    kenya: "🇰🇪", namibia: "🇳🇦", bangladesh: "🇧🇩", afghanistan: "🇦🇫",
    zimbabwe: "🇿🇼", "west indies": "🏴‍☠️", usa: "🇺🇸", uae: "🇦🇪",
    oman: "🇴🇲", scotland: "🏴", netherlands: "🇳🇱", nepal: "🇳🇵",
  };
  return f[n] || "🏳️";
};

/* Status helpers
   - We consider a match LIVE if `is_live` is true OR winner text is empty/looks "in progress".
   - We consider a match RECENT if played within ~36h; fall back to first two items. */
const isLive = (m) => {
  const w = (m?.winner || "").toLowerCase();
  return (
    m?.is_live === true ||
    (!w || /live|in progress|stumps|day\s+\d|session/.test(w))
  );
};
const isRecent = (m, idx) => {
  const t = m?.match_time ? Date.parse(m.match_time) : NaN;
  if (!Number.isNaN(t)) {
    const hours = (Date.now() - t) / 36e5;
    return hours >= 0 && hours <= 36;
  }
  return idx < 2; // fallback
};

/* ---------- ripple-only card ---------- */
function RippleCard({ children, live, recent }) {
  const onPointerDown = (e) => {
    const el = e.currentTarget;
    const rect = el.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const ripple = document.createElement("span");
    ripple.className = "tap-ripple";
    ripple.style.left = `${x}px`;
    ripple.style.top = `${y}px`;
    el.appendChild(ripple);
    ripple.addEventListener("animationend", () => ripple.remove());
  };

  return (
    <div
      className={`match-card simple${live ? " live" : ""}`}
      onPointerDown={onPointerDown}
      role="article"
    >
      <div className="status-badges">
        {live && (
          <span className="badge-chip badge-live">
            LIVE
          </span>
        )}
        {!live && recent && (
          <span className="badge-chip badge-recent">
            <span className="dot-red" /> Recent
          </span>
        )}
      </div>
      {children}
    </div>
  );
}

/* ---------- main ---------- */
const MatchCards = () => {
  const [matches, setMatches] = useState([]);
  const [testMatches, setTestMatches] = useState([]);
  const [tab, setTab] = useState("ODI"); // ODI | T20 | Test

  useEffect(() => {
    (async () => {
      try {
        const [mh, th] = await Promise.all([
          getMatchHistory(), // ODI + T20
          getTestMatches(),  // Test table
        ]);
        setMatches(Array.isArray(mh) ? mh : []);
        setTestMatches(Array.isArray(th) ? th : []);
      } catch (e) {
        console.error("❌ Fetch error (MatchCards):", e);
      }
    })();
  }, []);

  const odiMatches = useMemo(
    () => matches.filter((m) => m.match_type === "ODI"),
    [matches]
  );
  const t20Matches = useMemo(
    () => matches.filter((m) => m.match_type === "T20"),
    [matches]
  );

  /* ---------- UI bits ---------- */
  const Section = ({ title, list, render }) => (
    <>
      <h3 className="section-heading">{title}</h3>
      <div className="row g-3">
        {list.length === 0 ? (
          <p className="text-white mt-1">No {title} available.</p>
        ) : (
          list.map((match, i) => (
            <div key={match.match_name + i} className="col-sm-6 col-lg-4">
              {render(match, i)}
            </div>
          ))
        )}
      </div>
    </>
  );

  const renderLOICard = (m, i) => {
    const live = isLive(m);
    const recent = isRecent(m, i);
    return (
      <RippleCard live={live} recent={recent}>
        <div className="match-title">{formatMatchTitle(m.match_name)}</div>

        <div className="teams-row">
          <div className="team">
            <div className="name">
              {getFlag(m.team1)} {m.team1?.toUpperCase()}
            </div>
            <div className="score">
              {m.runs1}/{m.wickets1}
            </div>
            <div className="meta">Overs: {formatOvers(m.overs1)}</div>
          </div>

          <div className="team team--right">
            <div className="name">
              {getFlag(m.team2)} {m.team2?.toUpperCase()}
            </div>
            <div className="score">
              {m.runs2}/{m.wickets2}
            </div>
            <div className="meta">Overs: {formatOvers(m.overs2)}</div>
          </div>
        </div>

        {!live && (
          <div className="result-line">
            <strong>
              🏆{" "}
              {m.winner === "Draw"
                ? "Match is drawn."
                : m.winner?.toLowerCase().includes("won the match")
                ? m.winner
                : `${m.winner} won the match!`}
            </strong>
          </div>
        )}
      </RippleCard>
    );
  };

  const renderTestCard = (m, i) => {
    const live = isLive(m);
    const recent = isRecent(m, i);
    return (
      <RippleCard live={live} recent={recent}>
        <div className="match-title">{formatMatchTitle(m.match_name)}</div>

        <div className="team-block">
          <div className="name">
            {getFlag(m.team1)} {m.team1?.toUpperCase()}
          </div>
          <div className="meta">
            1st Innings: {m.runs1}/{m.wickets1} ({formatOvers(m.overs1)} ov)
          </div>
          <div className="meta">
            2nd Innings: {m.runs1_2}/{m.wickets1_2} ({formatOvers(m.overs1_2)} ov)
          </div>
        </div>

        <div className="team-block" style={{ marginTop: 6 }}>
          <div className="name">
            {getFlag(m.team2)} {m.team2?.toUpperCase()}
          </div>
          <div className="meta">
            1st Innings: {m.runs2}/{m.wickets2} ({formatOvers(m.overs2)} ov)
          </div>
          <div className="meta">
            2nd Innings: {m.runs2_2}/{m.wickets2_2} ({formatOvers(m.overs2_2)} ov)
          </div>
        </div>

        {!live && (
          <div className="result-line">
            <strong>
              🏆{" "}
              {m.winner === "Draw"
                ? "Match is drawn."
                : m.winner?.toLowerCase().includes("won the match")
                ? m.winner
                : `${m.winner} won the match!`}
            </strong>
          </div>
        )}
      </RippleCard>
    );
  };

  return (
    <div className="container mt-4">
      {/* Sticky format toggle row (dark + gold) */}
      <div className="format-toggle">
        <button
          className={`format-btn odi ${tab === "ODI" ? "active" : ""}`}
          onClick={() => setTab("ODI")}
          type="button"
        >
          🏏 ODI
        </button>

        <button
          className={`format-btn t20 ${tab === "T20" ? "active" : ""}`}
          onClick={() => setTab("T20")}
          type="button"
        >
          🔥 T20
        </button>

        <button
          className={`format-btn test ${tab === "Test" ? "active" : ""}`}
          onClick={() => setTab("Test")}
          type="button"
        >
          🧪 Test
        </button>
      </div>

      {/* Lists */}
      {tab === "ODI" && (
        <Section title="ODI Matches" list={odiMatches} render={renderLOICard} />
      )}
      {tab === "T20" && (
        <Section title="T20 Matches" list={t20Matches} render={renderLOICard} />
      )}
      {tab === "Test" && (
        <Section title="Test Matches" list={testMatches} render={renderTestCard} />
      )}
    </div>
  );
};

export default MatchCards;
