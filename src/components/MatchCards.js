// ✅ src/components/MatchCards.js — Cinematic + visible upgrades (UI only)
// - Adds team-code watermarks, stronger neon border, Recent pulse, mobile swipe hint
// - Same data shape & API calls

import React, { useEffect, useMemo, useRef, useState } from "react";
import { getMatchHistory, getTestMatches } from "../services/api";
import "./MatchCards.css";

/* ---------- team codes ---------- */
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

/* time + ids */
const getWhen = (m) => {
  const tried = m?.match_time || m?.created_at || m?.updated_at;
  const t = tried ? Date.parse(tried) : NaN;
  return Number.isNaN(t) ? null : t;
};
const getUid = (m) =>
  m?.match_id ??
  `${m?.match_name || ""}|${m?.team1 || ""}|${m?.team2 || ""}|${m?.runs1 || ""}|${m?.runs2 || ""}|${m?.created_at || ""}`;

/* live */
const LIVE_RE = /\b(live|in progress|stumps|day\s*\d|session)\b/i;
const isLiveRow = (m) => m?.is_live === true || !(m?.winner) || LIVE_RE.test(m?.winner || "");

/* accent (UI only) */
const ACCENTS = {
  IND: "#4cc9f0", AUS: "#f9c74f", ENG: "#64dfdf", NZ: "#90e0ef",
  PAK: "#80ed99", RSA: "#00f5d4", SL: "#ffd166", AFG: "#ef476f",
  BAN: "#06d6a0", WI: "#b5179e", SCO: "#4895ef", NED: "#ff7b00", ZIM: "#ffba08",
};
const pickAccent = (team) => ACCENTS[getTeamCode(team)] || "#5fd0c7";

/* ---------- card shell (ripple + tilt) ---------- */
function RippleCard({ children, live, recent, accent }) {
  const ref = useRef(null);

  const onPointerDown = (e) => {
    const el = e.currentTarget;
    const rect = el.getBoundingClientRect();
    const ripple = document.createElement("span");
    ripple.className = "tap-ripple";
    ripple.style.left = `${e.clientX - rect.left}px`;
    ripple.style.top = `${e.clientY - rect.top}px`;
    el.appendChild(ripple);
    ripple.addEventListener("animationend", () => ripple.remove());
  };

  const onMouseMove = (e) => {
    const rm =
      window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const coarse =
      window.matchMedia && window.matchMedia("(pointer: coarse)").matches;
    if (rm || coarse) return;
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width;
    const py = (e.clientY - r.top) / r.height;
    el.style.setProperty("--rx", `${(0.5 - py) * 10}deg`);
    el.style.setProperty("--ry", `${(px - 0.5) * 12}deg`);
    el.style.setProperty("--mx", `${px * 100}%`);
    el.style.setProperty("--my", `${py * 100}%`);
  };
  const onMouseLeave = () => {
    const el = ref.current;
    if (!el) return;
    el.style.setProperty("--rx", `0deg`);
    el.style.setProperty("--ry", `0deg`);
  };

  return (
    <div
      ref={ref}
      className={`match-card poster${live ? " live" : ""}${recent ? " recent" : ""}`}
      role="article"
      onPointerDown={onPointerDown}
      onMouseMove={onMouseMove}
      onMouseLeave={onMouseLeave}
      style={{ ["--accent"]: accent }}
    >
      <div className="status-badges">
        {live && <span className="badge-chip badge-live">LIVE</span>}
        {!live && recent && (
          <span className="badge-chip badge-recent"><span className="pulse-ring" /> Recent</span>
        )}
      </div>
      {children}
    </div>
  );
}

/* ---------- component ---------- */
const MatchCards = () => {
  const [matches, setMatches] = useState([]);
  const [testMatches, setTestMatches] = useState([]);
  const [tab, setTab] = useState("ODI");

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

  const odiMatches = useMemo(() => {
    const list = matches.filter((m) => m.match_type === "ODI");
    const anyTime = list.some(getWhen);
    return anyTime ? [...list].sort((a, b) => (getWhen(b) ?? 0) - (getWhen(a) ?? 0)) : list;
  }, [matches]);

  const t20Matches = useMemo(() => {
    const list = matches.filter((m) => m.match_type === "T20");
    const anyTime = list.some(getWhen);
    return anyTime ? [...list].sort((a, b) => (getWhen(b) ?? 0) - (getWhen(a) ?? 0)) : list;
  }, [matches]);

  const testList = useMemo(() => {
    const list = Array.isArray(testMatches) ? testMatches : [];
    const anyTime = list.some(getWhen);
    return anyTime ? [...list].sort((a, b) => (getWhen(b) ?? 0) - (getWhen(a) ?? 0)) : list;
  }, [testMatches]);

  const recentUID = useMemo(() => {
    const pick = (list) => {
      if (!list.length) return null;
      const withTime = list.map((m) => ({ m, t: getWhen(m) ?? -Infinity })).sort((a,b)=>b.t-a.t);
      const best = isFinite(withTime[0].t) ? withTime[0].m : list[0];
      return getUid(best);
    };
    return { ODI: pick(odiMatches), T20: pick(t20Matches), Test: pick(testList) };
  }, [odiMatches, t20Matches, testList]);

  const Section = ({ title, list, render }) => (
    <>
      <h3 className="section-heading">{title}</h3>
      <div className="row g-3 mc-row-snap">
        {list.length === 0 ? (
          <p className="text-white mt-1">No {title} available.</p>
        ) : (
          list.map((match, i) => (
            <div key={`${getUid(match)}-${i}`} className="col-sm-6 col-lg-4 mc-col-snap">
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
    const accent = pickAccent(
      (m?.winner || "").includes(m?.team1) ? m?.team1 :
      (m?.winner || "").includes(m?.team2) ? m?.team2 : m?.team1
    );

    return (
      <RippleCard live={live} recent={recent} accent={accent}>
        <div className="match-title">{formatMatchTitle(m.match_name)}</div>

        <div className="teams-row">
          {/* LEFT */}
          <div className="team" data-code={getTeamCode(m.team1)}>
            <div className="rowline">
              <div className="name">{getTeamCode(m.team1)}</div>
              <div className="score">{m.runs1}/{m.wickets1}</div>
            </div>
            <div className="meta">Overs: {formatOvers(m.overs1)}</div>
          </div>

          {/* RIGHT */}
          <div className="team team--right" data-code={getTeamCode(m.team2)}>
            <div className="rowline">
              <div className="name">{getTeamCode(m.team2)}</div>
              <div className="score">{m.runs2}/{m.wickets2}</div>
            </div>
            <div className="meta">Overs: {formatOvers(m.overs2)}</div>
          </div>
        </div>

        {!live && (
          <div className="result-line winner-banner">
            <strong>🏆 {m.winner === "Draw"
              ? "Match is drawn."
              : (m.winner || "").toLowerCase().includes("won the match")
              ? m.winner
              : `${m.winner} won the match!`}</strong>
          </div>
        )}
      </RippleCard>
    );
  };

  const renderTestCard = (m) => {
  const live = isLiveRow(m);
  const recent = recentUID.Test === getUid(m);
  const accent = pickAccent(
    (m?.winner || "").includes(m?.team1) ? m?.team1 :
    (m?.winner || "").includes(m?.team2) ? m?.team2 : m?.team1
  );

  return (
    <RippleCard live={live} recent={recent} accent={accent}>
      <div className="match-title">{formatMatchTitle(m.match_name)}</div>

      {/* ✅ add data-code so watermark shows */}
      <div className="team-block" data-code={getTeamCode(m.team1)}>
        <div className="name">{getTeamCode(m.team1)}</div>
        <div className="meta">1st Innings: {m.runs1}/{m.wickets1} ({formatOvers(m.overs1)} ov)</div>
        <div className="meta">2nd Innings: {m.runs1_2}/{m.wickets1_2} ({formatOvers(m.overs1_2)} ov)</div>
      </div>

      {/* ✅ and for team2 as well */}
      <div className="team-block team-block--right" data-code={getTeamCode(m.team2)} style={{ marginTop: 6 }}>
        <div className="name">{getTeamCode(m.team2)}</div>
        <div className="meta">1st Innings: {m.runs2}/{m.wickets2} ({formatOvers(m.overs2)} ov)</div>
        <div className="meta">2nd Innings: {m.runs2_2}/{m.wickets2_2} ({formatOvers(m.overs2_2)} ov)</div>
      </div>

      {!live && (
        <div className="result-line winner-banner">
          <strong>🏆 {m.winner === "Draw"
            ? "Match is drawn."
            : (m.winner || "").toLowerCase().includes("won the match")
            ? m.winner
            : `${m.winner} won the match!`}</strong>
        </div>
      )}
    </RippleCard>
  );
};

  return (
    <div className="container mt-4 mc-container">
      {/* Sticky format toggle (unchanged) */}
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
