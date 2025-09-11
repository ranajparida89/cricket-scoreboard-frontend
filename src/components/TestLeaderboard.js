import React, {
  useEffect,
  useMemo,
  useRef,
  useState,
  forwardRef,
  memo,
} from "react";
import { getTestMatchLeaderboard } from "../services/api";
import "./TestLeaderboard.css";

/* =======================================================================
   Simple unified title (matches white-ball leaderboard)
   ======================================================================= */
const TITLE_STYLE = {
  textAlign: "center",
  margin: "0 0 12px",
  fontWeight: 900,
  fontSize: "22px",
  color: "#22ff99",
};

/* =======================================================================
   Abbreviation helpers (same map used elsewhere)
   ======================================================================= */
const TEAM_ABBR = {
  "south africa": "SA",
  england: "ENG",
  india: "IND",
  kenya: "KEN",
  scotland: "SCT",
  "new zealand": "NZ",
  "hong kong": "HKG",
  australia: "AUS",
  afghanistan: "AFG",
  bangladesh: "BAN",
  pakistan: "PAK",
  ireland: "IRE",
  netherlands: "NED",
  namibia: "NAM",
  zimbabwe: "ZIM",
  nepal: "NEP",
  oman: "OMA",
  canada: "CAN",
  "united arab emirates": "UAE",
  "west indies": "WI",
  "papua new guinea": "PNG",
  "sri lanka": "SL",
  "united states": "USA",
  usa: "USA",
};
const norm = (s) => (s ?? "").toString().trim();
const abbreviateTeamName = (name) => {
  const s = norm(name);
  if (!s) return s;
  const key = s.toLowerCase();
  if (TEAM_ABBR[key]) return TEAM_ABBR[key];
  const words = s.split(/\s+/).filter(Boolean);
  if (words.length === 1) return words[0].slice(0, 3).toUpperCase();
  return words
    .map((w) => w[0])
    .join("")
    .slice(0, 3)
    .toUpperCase();
};
const displayTeam = (name) => abbreviateTeamName(name);

/* =======================================================================
   Pure helpers (no animations)
   ======================================================================= */
const toNum = (v) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};
const safeDraws = (m, w, l) => Math.max(0, toNum(m) - toNum(w) - toNum(l));

/* =======================================================================
   Row component (static)
   - NO GSAP, NO react-spring, NO react-move
   - Top 3 get soft gold/silver/bronze highlight via CSS classes
   ======================================================================= */
const TLRow = memo(
  forwardRef(function TLRow({ index, row }, ref) {
    const tierClass =
      index === 0 ? "top1" : index === 1 ? "top2" : index === 2 ? "top3" : "";

    return (
      <tr ref={ref} className={`tlfx-row ${tierClass}`}>
        <td className="rank">{index + 1}</td>
        <td className="team">{displayTeam(row.team_name)}</td>
        <td>{row.matches}</td>
        <td className="pos">{row.wins}</td>
        <td className="neg">{row.losses}</td>
        <td>{row.draws}</td>
        <td className="pos">{row.points}</td>
      </tr>
    );
  })
);

/* =======================================================================
   Main component
   ======================================================================= */
export default function TestLeaderboard() {
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);

  // Refs kept to mirror the original structure (even though no animation now)
  const wrapRef = useRef(null);
  const rowRefs = useRef([]);
  rowRefs.current = [];
  const addRowRef = (el) => {
    if (el && !rowRefs.current.includes(el)) rowRefs.current.push(el);
  };

  /* -------------------------------------------------------------------
     Fetch & normalize once on mount
     ------------------------------------------------------------------- */
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const data = await getTestMatchLeaderboard();
        const arr = Array.isArray(data) ? data : [];
        const normalized = arr.map((t) => {
          const matches = toNum(t.matches);
          const wins = toNum(t.wins);
          const losses = toNum(t.losses);
          return {
            team_name: t.team_name,
            matches,
            wins,
            losses,
            draws:
              t.draws != null ? toNum(t.draws) : safeDraws(matches, wins, losses),
            points: toNum(t.points),
          };
        });
        // Sort by points, then wins (tie-breaker)
        const sorted = normalized.sort(
          (a, b) => b.points - a.points || b.wins - a.wins
        );
        if (mounted) setTeams(sorted);
      } catch (_e) {
        if (mounted) setTeams([]);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  // Derive some memoized snapshot info (kept for parity with “full” code)
  const maxPoints = useMemo(
    () => Math.max(10, ...teams.map((t) => t.points || 0)),
    [teams]
  );
  const summary = useMemo(() => {
    // Optional: expose totals; not displayed but handy for future badges
    const totalMatches = teams.reduce((s, t) => s + toNum(t.matches), 0);
    const totalWins = teams.reduce((s, t) => s + toNum(t.wins), 0);
    const totalLosses = teams.reduce((s, t) => s + toNum(t.losses), 0);
    const totalDraws = teams.reduce((s, t) => s + toNum(t.draws), 0);
    return { totalMatches, totalWins, totalLosses, totalDraws, maxPoints };
  }, [teams, maxPoints]);

  // Keep an interface-compatible placeholder “register ref” (no animations now)
  const attachRowRef = (idx) => (el) => addRowRef(el);

  /* -------------------------------------------------------------------
     Render
     ------------------------------------------------------------------- */
  return (
    <div className="tlfx-shell">
      <div ref={wrapRef} className="tlfx-glass">
        {/* Page title (single; avoid external duplicates) */}
        <h2 className="tlfx-title" style={TITLE_STYLE}>
          Test Leaderboard
        </h2>

        <div className="tlfx-table-wrap">
          <table className="tlfx-table">
            <thead>
              <tr>
                {/* Short headers */}
                <th>R</th>
                <th>T</th>
                <th>M</th>
                <th>W</th>
                <th>L</th>
                <th>D</th>
                <th>Pts</th>
              </tr>
            </thead>

            <tbody>
              {/* Loading state — static skeleton (no shimmer/motion) */}
              {loading && (
                <>
                  <tr className="skeleton">
                    <td colSpan="7" />
                  </tr>
                  <tr className="skeleton">
                    <td colSpan="7" />
                  </tr>
                  <tr className="skeleton">
                    <td colSpan="7" />
                  </tr>
                </>
              )}

              {/* Empty state */}
              {!loading && teams.length === 0 && (
                <tr>
                  <td className="tlfx-empty" colSpan="7">
                    No Test match leaderboard data available.
                  </td>
                </tr>
              )}

              {/* Rows */}
              {!loading &&
                teams.map((t, i) => (
                  <TLRow
                    key={`${t.team_name}-${i}`}
                    ref={attachRowRef(i)}
                    index={i}
                    row={t}
                  />
                ))}
            </tbody>
          </table>
        </div>

        {/* Optional future: summary strip (kept commented; no UI now)
        <div className="tlfx-summary subtle">
          <span>Total M: {summary.totalMatches}</span>
          <span>Total W: {summary.totalWins}</span>
          <span>Total L: {summary.totalLosses}</span>
          <span>Total D: {summary.totalDraws}</span>
        </div>
        */}
      </div>
    </div>
  );
}
