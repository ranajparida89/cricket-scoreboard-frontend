import React, { useEffect, useMemo, useState } from "react";
import { PRESET_TOURNAMENTS, buildFilters } from "./tournaments";
import "./ScopeBar.css";

/**
 * ScopeBar
 * Props:
 *  - onApply(filtersObject)  // will be called with { matchType, tournamentName, seasonYear }
 *  - defaultType: "All" | "T20" | "ODI" | "Test"  (default "All")
 *  - compact?: boolean
 */
export default function ScopeBar({ onApply, defaultType = "All", compact = false }) {
  const [type, setType] = useState(defaultType);
  const [tour, setTour] = useState("");
  const [year, setYear] = useState("");

  const options = useMemo(() => {
    const custom = JSON.parse(localStorage.getItem("crickedge.customTournaments") || "[]");
    return Array.from(new Set([...custom, ...PRESET_TOURNAMENTS.map((t) => t.name)])).sort((a, b) =>
      a.localeCompare(b)
    );
  }, []);

  useEffect(() => {
    // initial apply
    onApply && onApply({ matchType: type, tournamentName: tour || "", seasonYear: year || "" });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function apply() {
    const obj = { matchType: type, tournamentName: (tour || "").trim(), seasonYear: year || "" };
    // Consumers may pass this directly to their API builder
    // Example: getTeams(buildFilters(obj))
    onApply && onApply(obj);
  }

  function reset() {
    setType("All");
    setTour("");
    setYear("");
    onApply && onApply({ matchType: "All", tournamentName: "", seasonYear: "" });
  }

  return (
    <div className={`scope ${compact ? "scope--compact" : ""}`}>
      <div className="scope-group">
        <label>Match Type</label>
        <select value={type} onChange={(e) => setType(e.target.value)}>
          <option>All</option>
          <option>T20</option>
          <option>ODI</option>
          <option>Test</option>
        </select>
      </div>

      <div className="scope-group">
        <label>Tournament</label>
        <input list="scope-t" placeholder="All tournaments" value={tour} onChange={(e) => setTour(e.target.value)} />
        <datalist id="scope-t">
          {options.map((o) => (
            <option key={o} value={o} />
          ))}
        </datalist>
      </div>

      <div className="scope-group">
        <label>Year</label>
        <input
          type="number"
          min="1860"
          max="2100"
          placeholder="All years"
          value={year}
          onChange={(e) => setYear(e.target.value)}
        />
      </div>

      <div className="scope-actions">
        <button className="scope-apply" type="button" onClick={apply}>
          Apply
        </button>
        <button className="scope-clear" type="button" onClick={reset}>
          Reset
        </button>
      </div>
    </div>
  );
}

// Optional helper export if you want to use it in your services:
// export { buildFilters } from "./tournaments";
