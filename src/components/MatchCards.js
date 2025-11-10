// ✅ src/components/MatchCards.js
// now with front-end match detail modal

import React, { useEffect, useMemo, useRef, useState } from "react";
import { getMatchHistory, getTestMatches } from "../services/api";
import "./MatchCards.css";

/* ---------- team codes ---------- */
const getTeamCode = (teamName = "") => {
  const n = String(teamName).trim().toLowerCase();
  const MAP = {
    india: "IND",
    australia: "AUS",
    aus: "AUS",
    england: "ENG",
    eng: "ENG",
    "new zealand": "NZ",
    nz: "NZ",
    pakistan: "PAK",
    "south africa": "RSA",
    sa: "RSA",
    rsa: "RSA",
    "sri lanka": "SL",
    sl: "SL",
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
    uae: "UAE",
    "united arab emirates": "UAE",
    usa: "USA",
    "united states": "USA",
    "hong kong": "HKG",
    hongkong: "HKG",
    "papua new guinea": "PNG",
    png: "PNG",
    "west indies": "WI",
    wi: "WI",
  };
  if (MAP[n]) return MAP[n];
  const letters = n.replace(/[^a-z]/g, "");
  return (letters.slice(0, 3) || "UNK").toUpperCase();
};

/* ---------- helpers ---------- */
const formatOvers = (decimalOvers = 0) => {
  const full = Math.floor(decimalOvers || 0);
  const balls = Math.round(((decimalOvers || 0) - full) * 6);
  const clamped = isFinite(balls) ? Math.max(0, Math.min(5, balls)) : 0;
  return `${full}.${clamped}`;
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
const isLiveRow = (m) =>
  m?.is_live === true || !(m?.winner) || LIVE_RE.test(m?.winner || "");

/* accent (UI only) */
const ACCENTS = {
  IND: "#4cc9f0",
  AUS: "#f9c74f",
  ENG: "#64dfdf",
  NZ: "#90e0ef",
  PAK: "#80ed99",
  RSA: "#00f5d4",
  SL: "#ffd166",
  AFG: "#ef476f",
  BAN: "#06d6a0",
  WI: "#b5179e",
  SCO: "#4895ef",
  NED: "#ff7b00",
  ZIM: "#ffba08",
};
const pickAccent = (team) => ACCENTS[getTeamCode(team)] || "#5fd0c7";

/* ---------- MODAL: narration builder ---------- */

// simple points rule: win=2, loss=0, draw/tie=1
const calcPoints = (winner, team) => {
  if (!winner) return 1;
  const lower = winner.toLowerCase();
  if (lower.includes("draw") || lower.includes("no result")) return 1;
  if (lower.includes((team || "").toLowerCase())) return 2;
  return 0;
};

const buildLimitedNarrative = (m) => {
  const team1 = m.team1;
  const team2 = m.team2;
  const w = m.winner || "";
  const t1code = getTeamCode(team1);
  const t2code = getTeamCode(team2);

  const lines = [];

  // who won
  if (!w) {
    lines.push(
      `This ${m.match_type || "ODI"} fixture between ${team1} and ${team2} is recorded without a final result.`
    );
  } else if (w.toLowerCase().includes("won")) {
    lines.push(`${w} It was a solid finish to the game.`);
  } else {
    lines.push(`Result: ${w}.`);
  }

  // batting wrap
  lines.push(
    `${t1code} posted ${m.runs1}/${m.wickets1} in ${formatOvers(
      m.overs1
    )} overs, while ${t2code} replied with ${m.runs2}/${m.wickets2} off ${formatOvers(
      m.overs2
    )} overs.`
  );

  // flavour
  lines.push(
    `The match data comes from CrickEdge submissions, so totals, overs and the winning line all reflect what was entered for this game.`
  );

  // man of match
  if (m.mom_player) {
    lines.push(
      `Player of the Match was ${m.mom_player}${
        m.mom_reason ? ` — ${m.mom_reason}.` : "."
      }`
    );
  }

  return lines;
};

const buildTestNarrative = (m) => {
  const team1 = m.team1;
  const team2 = m.team2;
  const t1code = getTeamCode(team1);
  const t2code = getTeamCode(team2);
  const w = m.winner || "";

  const lines = [];
  if (w.toLowerCase().includes("won")) {
    lines.push(`${w} A good outcome in a multi-day contest.`);
  } else if (w.toLowerCase().includes("draw")) {
    lines.push(`The match ended in a draw — both ${t1code} and ${t2code} stayed in the fight.`);
  } else {
    lines.push(`Result recorded: ${w || "not available"}.`);
  }

  lines.push(
    `${t1code} had totals of ${m.runs1}/${m.wickets1} (${formatOvers(
      m.overs1
    )} ov) and ${m.runs1_2}/${m.wickets1_2} (${formatOvers(
      m.overs1_2
    )} ov). ${t2code} answered with ${m.runs2}/${m.wickets2} (${formatOvers(
      m.overs2
    )} ov) and ${m.runs2_2}/${m.wickets2_2} (${formatOvers(m.overs2_2)} ov).`
  );

  if (m.mom_player) {
    lines.push(
      `Player of the Match: ${m.mom_player}${
        m.mom_reason ? ` — ${m.mom_reason}.` : "."
      }`
    );
  }

  lines.push(
    `All innings details above are pulled directly from the Test match results table for this fixture.`
  );

  return lines;
};

/* ---------- card shell (ripple + tilt) ---------- */
function RippleCard({ children, live, recent, accent, onClick }) {
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
      window.matchMedia &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
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
      className={`match-card poster${live ? " live" : ""}${
        recent ? " recent" : ""
      }`}
      role="article"
      onPointerDown={onPointerDown}
      onMouseMove={onMouseMove}
      onMouseLeave={onMouseLeave}
      onClick={onClick}
      style={{ ["--accent"]: accent }}
    >
      <div className="status-badges">
        {live && <span className="badge-chip badge-live">LIVE</span>}
        {!live && recent && (
          <span className="badge-chip badge-recent">
            <span className="pulse-ring" /> Recent
          </span>
        )}
      </div>
      {children}
    </div>
  );
}

/* ---------- main component ---------- */
const MatchCards = () => {
  const [matches, setMatches] = useState([]);
  const [testMatches, setTestMatches] = useState([]);
  const [tab, setTab] = useState("ODI");

  // modal state
  const [selectedMatch, setSelectedMatch] = useState(null); // { type: 'LOI'|'Test', data: {...} }

  const MAX_SHOW = 10;

  useEffect(() => {
    (async () => {
      try {
        const [mh, th] = await Promise.all([
          getMatchHistory(),
          getTestMatches(),
        ]);
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
    const sorted = anyTime
      ? [...list].sort((a, b) => (getWhen(b) ?? 0) - (getWhen(a) ?? 0))
      : list;
    return sorted.slice(0, MAX_SHOW);
  }, [matches]);

  const t20Matches = useMemo(() => {
    const list = matches.filter((m) => m.match_type === "T20");
    const anyTime = list.some(getWhen);
    const sorted = anyTime
      ? [...list].sort((a, b) => (getWhen(b) ?? 0) - (getWhen(a) ?? 0))
      : list;
    return sorted.slice(0, MAX_SHOW);
  }, [matches]);

  const testList = useMemo(() => {
    const list = Array.isArray(testMatches) ? testMatches : [];
    const anyTime = list.some(getWhen);
    const sorted = anyTime
      ? [...list].sort((a, b) => (getWhen(b) ?? 0) - (getWhen(a) ?? 0))
      : list;
    return sorted.slice(0, MAX_SHOW);
  }, [testMatches]);

  const recentUID = useMemo(() => {
    const pick = (list) => {
      if (!list.length) return null;
      const withTime = list
        .map((m) => ({ m, t: getWhen(m) ?? -Infinity }))
        .sort((a, b) => b.t - a.t);
      const best = isFinite(withTime[0].t) ? withTime[0].m : list[0];
      return getUid(best);
    };
    return {
      ODI: pick(odiMatches),
      T20: pick(t20Matches),
      Test: pick(testList),
    };
  }, [odiMatches, t20Matches, testList]);

  const Section = ({ title, list, render }) => (
    <>
      <h3 className="section-heading">{title}</h3>
      <div className="row g-3 mc-row-snap">
        {list.length === 0 ? (
          <p className="text-white mt-1">No {title} available.</p>
        ) : (
          list.map((match, i) => (
            <div
              key={`${getUid(match)}-${i}`}
              className="col-sm-6 col-lg-4 mc-col-snap"
            >
              {render(match, i)}
            </div>
          ))
        )}
      </div>
    </>
  );

  const openLimitedModal = (m) => {
    setSelectedMatch({
      type: "LOI",
      data: m,
    });
  };

  const openTestModal = (m) => {
    setSelectedMatch({
      type: "Test",
      data: m,
    });
  };

  const closeModal = () => setSelectedMatch(null);

  const renderLOICard = (m) => {
    const live = isLiveRow(m);
    const recent = recentUID[m.match_type] === getUid(m);
    const accent = pickAccent(
      (m?.winner || "").includes(m?.team1)
        ? m?.team1
        : (m?.winner || "").includes(m?.team2)
        ? m?.team2
        : m?.team1
    );

    return (
      <RippleCard
        live={live}
        recent={recent}
        accent={accent}
        onClick={() => openLimitedModal(m)}
      >
        <div className="match-title">{formatMatchTitle(m.match_name)}</div>

        <div className="teams-row">
          <div className="team" data-code={getTeamCode(m.team1)}>
            <div className="rowline">
              <div className="name">{getTeamCode(m.team1)}</div>
              <div className="score">
                {m.runs1}/{m.wickets1}
              </div>
            </div>
            <div className="meta">Overs: {formatOvers(m.overs1)}</div>
          </div>

          <div className="team team--right" data-code={getTeamCode(m.team2)}>
            <div className="rowline">
              <div className="name">{getTeamCode(m.team2)}</div>
              <div className="score">
                {m.runs2}/{m.wickets2}
              </div>
            </div>
            <div className="meta">Overs: {formatOvers(m.overs2)}</div>
          </div>
        </div>

        {!live && (
          <div className="result-line winner-banner">
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
    const accent = pickAccent(
      (m?.winner || "").includes(m?.team1)
        ? m?.team1
        : (m?.winner || "").includes(m?.team2)
        ? m?.team2
        : m?.team1
    );

    return (
      <RippleCard
        live={live}
        recent={recent}
        accent={accent}
        onClick={() => openTestModal(m)}
      >
        <div className="match-title">{formatMatchTitle(m.match_name)}</div>

        <div className="team-block" data-code={getTeamCode(m.team1)}>
          <div className="name">{getTeamCode(m.team1)}</div>
          <div className="meta">
            1st Innings: {m.runs1}/{m.wickets1} ({formatOvers(m.overs1)} ov)
          </div>
          <div className="meta">
            2nd Innings: {m.runs1_2}/{m.wickets1_2} ({formatOvers(m.overs1_2)} ov)
          </div>
        </div>

        <div
          className="team-block team-block--right"
          data-code={getTeamCode(m.team2)}
          style={{ marginTop: 6 }}
        >
          <div className="name">{getTeamCode(m.team2)}</div>
          <div className="meta">
            1st Innings: {m.runs2}/{m.wickets2} ({formatOvers(m.overs2)} ov)
          </div>
          <div className="meta">
            2nd Innings: {m.runs2_2}/{m.wickets2_2} ({formatOvers(m.overs2_2)} ov)
          </div>
        </div>

        {!live && (
          <div className="result-line winner-banner">
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
    <>
      <div className="container mt-4 mc-container">
        {/* Sticky format toggle */}
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

        {tab === "ODI" && (
          <Section title="ODI Matches" list={odiMatches} render={renderLOICard} />
        )}
        {tab === "T20" && (
          <Section title="T20 Matches" list={t20Matches} render={renderLOICard} />
        )}
        {tab === "Test" && (
          <Section title="Test Matches" list={testList} render={renderTestCard} />
        )}
      </div>

      {/* Modal */}
      {selectedMatch && (
        <div className="mc-detail-overlay" onClick={closeModal}>
          <div
            className="mc-detail-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <button className="mc-detail-close" onClick={closeModal} aria-label="Close">
              ✕
            </button>

            <div className="mc-detail-head">
              <span className="mc-badge-format">
                {selectedMatch.type === "LOI"
                  ? selectedMatch.data.match_type || "Match"
                  : "Test"}
              </span>
              <h2 className="mc-detail-title">
                {formatMatchTitle(selectedMatch.data.match_name)}
              </h2>
              <p className="mc-detail-sub">
                {selectedMatch.data.team1} vs {selectedMatch.data.team2}
              </p>
            </div>

            {/* score panel */}
            <div className="mc-detail-scorewrap">
              {selectedMatch.type === "LOI" ? (
                <>
                  <div className="mc-team-score" data-code={getTeamCode(selectedMatch.data.team1)}>
                    <div className="mc-team-name">{selectedMatch.data.team1}</div>
                    <div className="mc-team-runs">
                      {selectedMatch.data.runs1}/{selectedMatch.data.wickets1}
                    </div>
                    <div className="mc-team-meta">
                      Overs {formatOvers(selectedMatch.data.overs1)}
                    </div>
                    <div className="mc-team-points">
                      Points:{" "}
                      {calcPoints(
                        selectedMatch.data.winner,
                        selectedMatch.data.team1
                      )}
                    </div>
                  </div>
                  <div className="mc-team-score" data-code={getTeamCode(selectedMatch.data.team2)}>
                    <div className="mc-team-name">{selectedMatch.data.team2}</div>
                    <div className="mc-team-runs">
                      {selectedMatch.data.runs2}/{selectedMatch.data.wickets2}
                    </div>
                    <div className="mc-team-meta">
                      Overs {formatOvers(selectedMatch.data.overs2)}
                    </div>
                    <div className="mc-team-points">
                      Points:{" "}
                      {calcPoints(
                        selectedMatch.data.winner,
                        selectedMatch.data.team2
                      )}
                    </div>
                  </div>
                </>
              ) : (
                <>
                  {/* team 1 test */}
                  <div className="mc-team-score" data-code={getTeamCode(selectedMatch.data.team1)}>
                    <div className="mc-team-name">{selectedMatch.data.team1}</div>
                    <div className="mc-team-meta">
                      1st: {selectedMatch.data.runs1}/{selectedMatch.data.wickets1} (
                      {formatOvers(selectedMatch.data.overs1)} ov)
                    </div>
                    <div className="mc-team-meta">
                      2nd: {selectedMatch.data.runs1_2}/{selectedMatch.data.wickets1_2} (
                      {formatOvers(selectedMatch.data.overs1_2)} ov)
                    </div>
                    <div className="mc-team-points">
                      Points:{" "}
                      {calcPoints(
                        selectedMatch.data.winner,
                        selectedMatch.data.team1
                      )}
                    </div>
                  </div>
                  {/* team 2 test */}
                  <div className="mc-team-score" data-code={getTeamCode(selectedMatch.data.team2)}>
                    <div className="mc-team-name">{selectedMatch.data.team2}</div>
                    <div className="mc-team-meta">
                      1st: {selectedMatch.data.runs2}/{selectedMatch.data.wickets2} (
                      {formatOvers(selectedMatch.data.overs2)} ov)
                    </div>
                    <div className="mc-team-meta">
                      2nd: {selectedMatch.data.runs2_2}/{selectedMatch.data.wickets2_2} (
                      {formatOvers(selectedMatch.data.overs2_2)} ov)
                    </div>
                    <div className="mc-team-points">
                      Points:{" "}
                      {calcPoints(
                        selectedMatch.data.winner,
                        selectedMatch.data.team2
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* narrative */}
            <div className="mc-detail-body">
              <h4 className="mc-detail-block-title">Match story</h4>
              <div className="mc-detail-text">
                {(selectedMatch.type === "LOI"
                  ? buildLimitedNarrative(selectedMatch.data)
                  : buildTestNarrative(selectedMatch.data)
                ).map((line, idx) => (
                  <p key={idx}>{line}</p>
                ))}
              </div>

              <h4 className="mc-detail-block-title">Extra info</h4>
              <div className="mc-detail-grid">
                <div>
                  <span className="mc-label">Winner</span>
                  <span className="mc-value">
                    {selectedMatch.data.winner || "Not recorded"}
                  </span>
                </div>
                <div>
                  <span className="mc-label">Match date</span>
                  <span className="mc-value">
                    {selectedMatch.data.match_date ||
                      selectedMatch.data.match_time ||
                      "Not recorded"}
                  </span>
                </div>
                {selectedMatch.data.mom_player && (
                  <div className="mc-detail-mom">
                    <span className="mc-label">Player of the match</span>
                    <span className="mc-value">
                      {selectedMatch.data.mom_player}
                      {selectedMatch.data.mom_reason
                        ? ` — ${selectedMatch.data.mom_reason}`
                        : ""}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default MatchCards;
