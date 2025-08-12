// ✅ src/components/MatchCards.js — compact dark cards + gold accents (complete)
// ✅ Only ripple effect remains. No 3D/gsap/framer animations.
// ✅ Buttons use dark theme + gold accent, cards have compact layout.

import React, { useEffect, useState, useMemo } from "react";
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
    india: "🇮🇳", australia: "🇦🇺", england: "🏴",
    "new zealand": "🇳🇿", pakistan: "🇵🇰", "south africa": "🇿🇦",
    "sri lanka": "🇱🇰", ireland: "🇮🇪", kenya: "🇰🇪", namibia: "🇳🇦",
    bangladesh: "🇧🇩", afghanistan: "🇦🇫", zimbabwe: "🇿🇼",
    "west indies": "🏴‍☠️", usa: "🇺🇸", uae: "🇦🇪", oman: "🇴🇲",
    scotland: "🏴", netherlands: "🇳🇱", nepal: "🇳🇵",
  };
  return f[n] || "🏳️";
};

/* ---------- very small ripple-only card shell ---------- */
function RippleCard({ children }) {
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
      className="match-card slumber-compact"
      onPointerDown={onPointerDown}
      role="article"
    >
      {children}
    </div>
  );
}

const MatchCards = () => {
  const [matches, setMatches] = useState([]);
  const [testMatches, setTestMatches] = useState([]);
  const [tab, setTab] = useState("ODI"); // ODI | T20 | Test

  useEffect(() => {
    (async () => {
      try {
        const [mh, th] = await Promise.all([
          getMatchHistory(), // returns ODI + T20 together
          getTestMatches(),
        ]);
        setMatches(Array.isArray(mh) ? mh : []);
        setTestMatches(Array.isArray(th) ? th : []);
      } catch (e) {
        console.error("Fetch error:", e);
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

  const Button = ({ active, onClick, children }) => (
    <button
      onClick={onClick}
      className="slumber-tab-btn"
      style={{
        background: active ? "#0f1b28" : "#0b1622",
        color: "#e8caa4",
        border: "1px solid rgba(232,202,164,.38)",
        boxShadow: active
          ? "0 0 0 1px rgba(232,202,164,.25), 0 10px 24px rgba(232,202,164,.15)"
          : "0 6px 16px rgba(0,0,0,.35)",
      }}
    >
      {children}
    </button>
  );

  const Section = ({ title, list, render }) => (
    <>
      <div className="d-flex align-items-center justify-content-between mb-3">
        <h3 className="text-light m-0" style={{ letterSpacing: ".2px" }}>
          {title}
        </h3>
        {/* gold divider under section head like the reference */}
      </div>
      <div className="slumber-gold-line" />
      <div className="row g-3 mt-1">
        {list.length === 0 ? (
          <p className="text-white mt-2">No {title} available.</p>
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

  const renderLOICard = (m) => (
    <RippleCard>
      <h6 className="mb-2 text-gold">{formatMatchTitle(m.match_name)}</h6>

      <div className="d-flex justify-content-between small">
        <div className="me-2">
          <div className="fw-bold">
            {getFlag(m.team1)} {m.team1?.toUpperCase()}{" "}
            <span className="score">{m.runs1}/{m.wickets1}</span>
          </div>
          <div className="muted">Overs: {formatOvers(m.overs1)}</div>
        </div>
        <div className="ms-2 text-end">
          <div className="fw-bold">
            {getFlag(m.team2)} {m.team2?.toUpperCase()}{" "}
            <span className="score">{m.runs2}/{m.wickets2}</span>
          </div>
          <div className="muted">Overs: {formatOvers(m.overs2)}</div>
        </div>
      </div>

      <div className="win-line mt-2">
        <strong>
          🏆{" "}
          {m.winner === "Draw"
            ? "Match is drawn."
            : m.winner?.toLowerCase().includes("won the match")
            ? m.winner
            : `${m.winner} won the match!`}
        </strong>
      </div>
    </RippleCard>
  );

  const renderTestCard = (m) => (
    <RippleCard>
      <h6 className="mb-2 text-gold">{formatMatchTitle(m.match_name)}</h6>

      <div className="small">
        <div className="fw-bold mb-1">
          {getFlag(m.team1)} {m.team1?.toUpperCase()}
        </div>
        <div className="muted">
          1st inns: {m.runs1}/{m.wickets1} ({formatOvers(m.overs1)} ov)
        </div>
        <div className="muted">
          2nd inns: {m.runs1_2}/{m.wickets1_2} ({formatOvers(m.overs1_2)} ov)
        </div>
      </div>

      <div className="small mt-2">
        <div className="fw-bold mb-1">
          {getFlag(m.team2)} {m.team2?.toUpperCase()}
        </div>
        <div className="muted">
          1st inns: {m.runs2}/{m.wickets2} ({formatOvers(m.overs2)} ov)
        </div>
        <div className="muted">
          2nd inns: {m.runs2_2}/{m.wickets2_2} ({formatOvers(m.overs2_2)} ov)
        </div>
      </div>

      <div className="win-line mt-2">
        <strong>
          🏆{" "}
          {m.winner === "Draw"
            ? "Match is drawn."
            : m.winner?.toLowerCase().includes("won the match")
            ? m.winner
            : `${m.winner} won the match!`}
        </strong>
      </div>
    </RippleCard>
  );

  return (
    <div className="container mt-4">
      {/* tabs row */}
      <div className="d-flex flex-wrap gap-2 mb-3">
        <Button active={tab === "ODI"} onClick={() => setTab("ODI")}>
          🏏 ODI
        </Button>
        <Button active={tab === "T20"} onClick={() => setTab("T20")}>
          🔥 T20
        </Button>
        <Button active={tab === "Test"} onClick={() => setTab("Test")}>
          🧪 Test
        </Button>
      </div>

      {tab === "ODI" && (
        <Section title="ODI Matches" list={odiMatches} render={renderLOICard} />
      )}
      {tab === "T20" && (
        <Section title="T20 Matches" list={t20Matches} render={renderLOICard} />
      )}
      {tab === "Test" && (
        <Section
          title="Test Matches"
          list={testMatches}
          render={renderTestCard}
        />
      )}
    </div>
  );
};

export default MatchCards;
