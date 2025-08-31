// ✅ src/components/MatchCards.js — compact dark cards + gold accents + LIVE/Recent (no flags)
// - Exactly ONE “Recent” per format (ODI/T20/Test)
// - LIVE uses blue-tinted card + "LIVE" chip
// - Alignment stable (two equal columns; name+score in a single rowline)
// - Only ripple kept (no heavy animations)
// - Team codes: ENG, AUS, SL, RSA (per your request) + ICC-style codes for others

import React, { useEffect, useMemo, useState } from "react";
import { getMatchHistory, getTestMatches } from "../services/api";
import "./MatchCards.css";

/* ------------------------------------------
   Team codes (per your request)
   - England → ENG
   - Australia → AUS
   - Sri Lanka → SL
   - South Africa → RSA
   - Plus common ICC codes for others
-------------------------------------------*/
const getTeamCode = (teamName = "") => {
  const n = String(teamName).trim().toLowerCase();
  const MAP = {
    india: "IND",
    australia: "AUS", aus: "AUS",
    england: "ENG", eng: "ENG",
    "new zealand": "NZ", nz: "NZ",
    pakistan: "PAK",
    "south africa": "RSA", sa: "RSA", rsa: "RSA",
    "sri lanka": "SL", sl: "SL",
    ireland: "IRE",
    kenya: "KEN",
    namibia: "NAM",
    bangladesh: "BAN",
    afghanistan: "AFG",
    zimbabwe: "ZIM",
    netherlands: "NED",
    scotland: "SCO",
    nepal: "NEP",
    oman: "OMA",
    uae: "UAE", "united arab emirates": "UAE",
    usa: "USA", "united states": "USA",
    "hong kong": "HKG", hongkong: "HKG",
    "papua new guinea": "PNG", png: "PNG",
    "west indies": "WI", wi: "WI",
  };
  if (MAP[n]) return MAP[n];

  // Fallback: first 3 letters uppercased
  const letters = n.replace(/[^a-z]/g, "");
  return (letters.slice(0, 3) || "UNK").toUpperCase();
};

/* ---------- helpers ---------- */
const formatOvers = (decimalOvers = 0) => {
  const fullOvers = Math.floor(decimalOvers || 0);
  const balls = Math.round(((decimalOvers || 0) - fullOvers) * 6);
  const clamped = isFinite(balls) ? Math.max(0, Math.min(5, balls)) : 0;
  return `${fullOvers}.${clamped}`;
};

const formatMatchTitle = (raw = "") => {
  let s = String(raw || "").split(":")[0];
  s = s
    .replace(/(?<=[A-Za-z])(?=\d)/g, " ")
    .replace(/(?<=\d)(?=[A-Za-z])/g, " ")
    .replace(/(ODI|T20|TEST|Test|Final|Qualifier|Semi|Quarter)/g, " $1 ")
    .replace(/\s{2,}/g, " ")
    .trim();
  return s.replace(/^(\w)/, (m) => m.toUpperCase());
};

/* Timestamps (best-effort) */
const getWhen = (m) => {
  const tried = m?.match_time || m?.created_at || m?.updated_at;
  const t = tried ? Date.parse(tried) : NaN;
  return Number.isNaN(t) ? null : t;
};

/* Stable row id */
const getUid = (m) =>
  m?.match_id ??
  `${m?.match_name || ""}|${m?.team1 || ""}|${m?.team2 || ""}|${m?.runs1 || ""}|${m?.runs2 || ""}|${m?.created_at || ""}`;

/* Live detection */
const LIVE_RE = /\b(live|in progress|stumps|day\s*\d|session)\b/i;
const isLiveRow = (m) => {
  const w = m?.winner || "";
  return m?.is_live === true || (!w || LIVE_RE.test(w));
};

/* Ripple-only shell */
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
    <div className={`match-card simple${live ? " live" : ""}`} onPointerDown={onPointerDown} role="article">
      <div className="status-badges">
        {live && <span className="badge-chip badge-live">LIVE</span>}
        {!live && recent && (
          <span className="badge-chip badge-recent"><span className="dot-red" /> Recent</span>
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
  const [tab, setTab] = useState("ODI"); // "ODI" | "T20" | "Test"

  useEffect(() => {
    (async () => {
      try {
        const [mh, th] = await Promise.all([getMatchHistory(), getTestMatches()]);
        setMatches(Array.isArray(mh) ? mh : []);
        setTestMatches(Array.isArray(th) ? th : []);
      } catch (e) {
        console.error("❌ Fetch error (MatchCards):", e);
      }
    })();
  }, []);

  /* Split + sort by time DESC when possible */
  const odiMatches = useMemo(() => {
    const list = matches.filter((m) => m.match_type === "ODI");
    const anyTime = list.some((m) => getWhen(m));
    return anyTime ? [...list].sort((a, b) => (getWhen(b) ?? 0) - (getWhen(a) ?? 0)) : list;
  }, [matches]);

  const t20Matches = useMemo(() => {
    const list = matches.filter((m) => m.match_type === "T20");
    const anyTime = list.some((m) => getWhen(m));
    return anyTime ? [...list].sort((a, b) => (getWhen(b) ?? 0) - (getWhen(a) ?? 0)) : list;
  }, [matches]);

  const testList = useMemo(() => {
    const list = Array.isArray(testMatches) ? testMatches : [];
    const anyTime = list.some((m) => getWhen(m));
    return anyTime ? [...list].sort((a, b) => (getWhen(b) ?? 0) - (getWhen(a) ?? 0)) : list;
  }, [testMatches]);

  /* Exactly one “recent” per format */
  const recentUID = useMemo(() => {
    const pick = (list) => {
      if (!list.length) return null;
      const withTime = list.map((m) => ({ m, t: getWhen(m) ?? -Infinity })).sort((a, b) => b.t - a.t);
      const best = isFinite(withTime[0].t) ? withTime[0].m : list[0];
      return getUid(best);
    };
    return { ODI: pick(odiMatches), T20: pick(t20Matches), Test: pick(testList) };
  }, [odiMatches, t20Matches, testList]);

  /* ---------- UI bits ---------- */
  const Section = ({ title, list, render }) => (
    <>
      <h3 className="section-heading">{title}</h3>
      <div className="row g-3">
        {list.length === 0 ? (
          <p className="text-white mt-1">No {title} available.</p>
        ) : (
          list.map((match, i) => (
            <div key={`${getUid(match)}-${i}`} className="col-sm-6 col-lg-4">
              {render(match, i)}
            </div>
          ))
        )}
      </div>
    </>
  );

  const renderLOICard = (m) => {
    const live = isLiveRow(m);
    const recent = recentUID[m.match_type] === getUid(m);
    return (
      <RippleCard live={live} recent={recent}>
        <div className="match-title">{formatMatchTitle(m.match_name)}</div>

        <div className="teams-row">
          {/* LEFT */}
          <div className="team">
            <div className="rowline">
              <div className="name">{getTeamCode(m.team1)}</div>
              <div className="score">{m.runs1}/{m.wickets1}</div>
            </div>
            <div className="meta">Overs: {formatOvers(m.overs1)}</div>
          </div>

          {/* RIGHT */}
          <div className="team team--right">
            <div className="rowline">
              <div className="name">{getTeamCode(m.team2)}</div>
              <div className="score">{m.runs2}/{m.wickets2}</div>
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
                : (m.winner || "").toLowerCase().includes("won the match")
                ? m.winner
                : `${m.winner} won the match!`}
            </strong>
          </div>
        )}
      </RippleCard>
    );
  };

  const renderTestCard = (m) => {
    const live = isLiveRow(m);
    const recent = recentUID.Test === getUid(m);
    return (
      <RippleCard live={live} recent={recent}>
        <div className="match-title">{formatMatchTitle(m.match_name)}</div>

        <div className="team-block">
          <div className="name">{getTeamCode(m.team1)}</div>
          <div className="meta">1st Innings: {m.runs1}/{m.wickets1} ({formatOvers(m.overs1)} ov)</div>
          <div className="meta">2nd Innings: {m.runs1_2}/{m.wickets1_2} ({formatOvers(m.overs1_2)} ov)</div>
        </div>

        <div className="team-block" style={{ marginTop: 6 }}>
          <div className="name">{getTeamCode(m.team2)}</div>
          <div className="meta">1st Innings: {m.runs2}/{m.wickets2} ({formatOvers(m.overs2)} ov)</div>
          <div className="meta">2nd Innings: {m.runs2_2}/{m.wickets2_2} ({formatOvers(m.overs2_2)} ov)</div>
        </div>

        {!live && (
          <div className="result-line">
            <strong>
              🏆{" "}
              {m.winner === "Draw"
                ? "Match is drawn."
                : (m.winner || "").toLowerCase().includes("won the match")
                ? m.winner
                : `${m.winner} won the match!`}
            </strong>
          </div>
        )}
      </RippleCard>
    );
  };

  return (
    <div className="container mt-4 mc-container">
      {/* Sticky format toggle (dark + gold) */}
      <div className="format-toggle">
        <button className={`format-btn odi ${tab === "ODI" ? "active" : ""}`} onClick={() => setTab("ODI")} type="button">🏏 ODI</button>
        <button className={`format-btn t20 ${tab === "T20" ? "active" : ""}`} onClick={() => setTab("T20")} type="button">🔥 T20</button>
        <button className={`format-btn test ${tab === "Test" ? "active" : ""}`} onClick={() => setTab("Test")} type="button">🧪 Test</button>
      </div>

      {tab === "ODI"  && <Section title="ODI Matches"  list={odiMatches} render={renderLOICard} />}
      {tab === "T20"  && <Section title="T20 Matches"  list={t20Matches} render={renderLOICard} />}
      {tab === "Test" && <Section title="Test Matches" list={testList}   render={renderTestCard} />}
    </div>
  );
};

export default MatchCards;