import React, { useEffect, useMemo, useState } from "react";
import { PRESET_TOURNAMENTS } from "./tournaments";
import "./ScopeBar.css";

/**
 * ScopeBar
 * Props:
 *  - onApply(filtersObject)  // { matchType, tournamentName, seasonYear }
 *  - defaultType: "All" | "T20" | "ODI" | "Test"  (default "All")
 *  - compact?: boolean
 */
export default function ScopeBar({ onApply, defaultType = "All", compact = false }) {
  const [type, setType] = useState(defaultType);
  const [tour, setTour] = useState("");
  const [year, setYear] = useState("");

  // Distinct tournament names (custom + presets)
  const options = useMemo(() => {
    const custom = JSON.parse(localStorage.getItem("crickedge.customTournaments") || "[]");
    const names = [...custom, ...PRESET_TOURNAMENTS.map((t) => t.name)];
    return Array.from(new Set(names)).sort((a, b) => a.localeCompare(b));
  }, []);

  // initial apply on mount
  useEffect(() => {
    onApply &&
      onApply({
        matchType: defaultType,
        tournamentName: "",
        seasonYear: "",
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function apply() {
    const cleanYear = String(year || "").trim();
    const onlyYear = /^\d{4}$/.test(cleanYear) ? cleanYear : "";
    onApply &&
      onApply({
        matchType: type,
        tournamentName: (tour || "").trim(),
        seasonYear: onlyYear,
      });
  }

  function reset() {
    setType("All");
    setTour("");
    setYear("");
    onApply &&
      onApply({
        matchType: "All",
        tournamentName: "",
        seasonYear: "",
      });
  }

  return (
    <div className={`scope ${compact ? "scope--compact" : ""}`}>
      {/* Match Type */}
      <div className="scope-group">
        <label className="scope-label">
          <i className="fas fa-stream scope-label-icon" aria-hidden="true" /> Match Type
        </label>
        <div className="scope-field with-icon">
          <i className="fas fa-layer-group scope-icon" aria-hidden="true" />
          <select
            value={type}
            onChange={(e) => setType(e.target.value)}
            className="scope-input has-icon"
            aria-label="Match Type"
          >
            <option>All</option>
            <option>T20</option>
            <option>ODI</option>
            <option>Test</option>
          </select>
        </div>
      </div>

      {/* Tournament */}
      <div className="scope-group">
        <label className="scope-label">
          <i className="fas fa-trophy scope-label-icon" aria-hidden="true" /> Tournament
        </label>
        <div className="scope-field with-icon">
          <i className="fas fa-medal scope-icon" aria-hidden="true" />
          <input
            className="scope-input has-icon"
            list="scope-t"
            placeholder="All tournaments"
            value={tour}
            onChange={(e) => setTour(e.target.value)}
            aria-label="Tournament"
          />
          <datalist id="scope-t">
            {options.map((o) => (
              <option key={o} value={o} />
            ))}
          </datalist>
        </div>
      </div>

      {/* Year */}
      <div className="scope-group">
        <label className="scope-label">
          <i className="fas fa-calendar-alt scope-label-icon" aria-hidden="true" /> Year
        </label>
        <div className="scope-field with-icon">
          <i className="fas fa-clock scope-icon" aria-hidden="true" />
          <input
            className="scope-input has-icon"
            type="number"
            min="1860"
            max="2100"
            placeholder="All years"
            value={year}
            onChange={(e) => setYear(e.target.value)}
            aria-label="Season Year"
          />
        </div>
      </div>

      {/* Actions */}
      <div className="scope-actions">
        <button className="scope-apply" type="button" onClick={apply}>
          <i className="fas fa-filter" aria-hidden="true" /> Apply
        </button>
        <button className="scope-clear" type="button" onClick={reset}>
          <i className="fas fa-undo" aria-hidden="true" /> Reset
        </button>
      </div>
    </div>
  );
}
