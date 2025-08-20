// ✅ src/components/PointTable.js
// ✅ [Ranaj Parida - 2025-04-14 | 8:45 AM] Unified point table with glowing medals, total matches & draws
// ✅ [Update | ScopeBar integration + dark UI polish | non-breaking]

import React, { useEffect, useState, useRef } from "react";
import { getPointTable } from "../services/api"; // ✅ Centralized Point Table API
import ScopeBar from "./ScopeBar";
import { buildFilters } from "./tournaments";
import "./PointTable.css";

const PointTable = () => {
  const [points, setPoints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ matchType: "All", tournamentName: "", seasonYear: "" });
  const abortRef = useRef(null);

  const fetchPoints = async (f = filters) => {
    try {
      setLoading(true);
      if (abortRef.current) abortRef.current.abort?.();
      abortRef.current = new AbortController();

      // Passing filters is a no-op if backend doesn’t use them yet — safe & non-breaking.
      const query = buildFilters(f); // { match_type, tournament_name, season_year }
      const data = await getPointTable(query, { signal: abortRef.current.signal });
      setPoints(Array.isArray(data) ? data : []);
    } catch (error) {
      if (error?.name !== "AbortError") {
        console.error("Error fetching point table:", error);
        setPoints([]);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPoints();
    return () => abortRef.current?.abort?.();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ✅ Glowing Medal Emoji
  const getMedal = (index) => {
    const emoji =
      index === 0 ? "🥇" : index === 1 ? "🥈" : index === 2 ? "🥉" : "";
    return emoji ? <span className="medal-emoji">{emoji}</span> : null;
  };

  const sorted = [...points].sort((a, b) => (b.points || 0) - (a.points || 0));

  return (
    <div className="pt-glass">
      {/* Scope controls (Tournament / Year / Type) */}
      <div className="pt-controls">
        <ScopeBar
          defaultType="All"
          onApply={(f) => {
            setFilters(f);
            fetchPoints(f);
          }}
        />
      </div>

      <div className="pt-header">
        <h2 className="pt-title">🏆 Point Table</h2>
        <div className="pt-sub">
          Live ranking • Win=2 • Draw/Tie/NR=1 (LOI)
        </div>
      </div>

      <div className="table-responsive pt-table-wrap">
        <table className="table table-dark table-hover pt-table">
          <thead>
            <tr>
              <th>Rank</th>
              <th>Team</th>
              <th>Total Matches</th>
              <th>Wins</th>
              <th>Losses</th>
              <th>Draws</th>
              <th>Points</th>
            </tr>
          </thead>

          <tbody>
            {loading && (
              <>
                <tr className="pt-skeleton"><td colSpan="7" /></tr>
                <tr className="pt-skeleton"><td colSpan="7" /></tr>
                <tr className="pt-skeleton"><td colSpan="7" /></tr>
              </>
            )}

            {!loading && sorted.map((team, idx) => {
              const totalMatches =
                team.total_matches ||
                team.matches ||
                ((team.wins || 0) + (team.losses || 0) + (team.draws || 0));

              const draws =
                team.draws != null
                  ? team.draws
                  : Math.max(0, totalMatches - (team.wins || 0) - (team.losses || 0));

              return (
                <tr key={`${team.team}-${idx}`}>
                  <td>{getMedal(idx)} {idx + 1}</td>
                  <td className="pt-team"><strong>{team.team}</strong></td>
                  <td>{String(totalMatches || 0).padStart(2, "0")}</td>
                  <td className="pos">{team.wins ?? 0}</td>
                  <td className="neg">{team.losses ?? 0}</td>
                  <td>{draws}</td>
                  <td className="pos">{team.points ?? 0}</td>
                </tr>
              );
            })}

            {!loading && sorted.length === 0 && (
              <tr>
                <td colSpan="7" className="text-muted py-4">
                  No match data available.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default PointTable;
