import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  FORMATS,
  DEFAULT_STAGES,
  allowedTournamentChars,
  composeMenu,
  addTournamentAndRefresh,
  suggestEditionYear,
  isValidYear,
  isValidTournamentName,
  titleize,
  getCatalog,
  pushRecentTournament,
} from "./tournaments";
import "./TournamentPicker.css";

/**
 * TournamentPicker
 * Props:
 *  - matchType: "T20" | "ODI" | "Test" (required)
 *  - value: { tournamentName, seasonYear, matchDate, stage } (optional)
 *  - onChange(nextValue)
 *  - allowStage?: boolean (default=true)
 *
 * Emits a normalized payload on every field change.
 */
export default function TournamentPicker({
  matchType = FORMATS.T20,
  value = {},
  onChange,
  allowStage = true,
}) {
  const [query, setQuery] = useState(value.tournamentName || "");
  const [year, setYear] = useState(value.seasonYear ?? suggestEditionYear(value.matchDate));
  const [date, setDate] = useState(value.matchDate || todayISO());
  const [stage, setStage] = useState(value.stage || "");

  const [menu, setMenu] = useState(() => composeMenu(query, { format: matchType }));
  const [open, setOpen] = useState(false);

  const menuRef = useRef(null);
  const inputRef = useRef(null);

  // Refresh menu when query or matchType changes
  useEffect(() => {
    setMenu(composeMenu(query, { format: matchType }));
  }, [query, matchType]);

  // Emit changes upward
  useEffect(() => {
    onChange &&
      onChange({
        tournamentName: query.trim(),
        seasonYear: isValidYear(year) ? Number(year) : undefined,
        matchDate: date,
        stage,
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, year, date, stage]);

  // Click-outside to close menu
  useEffect(() => {
    const onDocClick = (e) => {
      if (!menuRef.current || !open) return;
      if (!menuRef.current.contains(e.target) && e.target !== inputRef.current) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, [open]);

  function pickName(name) {
    const nice = titleize(name);
    setQuery(nice);
    pushRecentTournament(nice);
    setOpen(false);
  }

  function addCustom() {
    const nice = titleize(query.trim());
    if (!isValidTournamentName(nice)) {
      return alert(
        "Tournament name must be 3–80 chars with letters, numbers, spaces, and basic punctuation."
      );
    }
    const { menu: nextMenu } = addTournamentAndRefresh(nice, { format: matchType });
    setMenu(nextMenu);
    pickName(nice);
    alert(`✅ Added "${nice}"`);
  }

  function onDateChange(v) {
    setDate(v);
    const d = new Date(v);
    if (Number.isFinite(d.getTime())) {
      const yFromDate = d.getFullYear();
      if (yFromDate !== Number(year)) setYear(yFromDate);
    }
  }

  function validateBlur() {
    const name = query.trim();
    if (!name) return;
    if (!allowedTournamentChars.test(name)) {
      alert(
        "Invalid characters in tournament name.\nAllowed: letters, numbers, spaces, & / – — ' ’ . ( ) -"
      );
      // snap back to nearest catalog match if any
      const cat = getCatalog();
      const nearest = cat.find((c) => c.name.toLowerCase().includes(name.toLowerCase()));
      if (nearest) setQuery(nearest.name);
    }
  }

  const canAdd = menu.canAdd;
  const suggestions = dedupe([
    ...menu.recents.map((n) => ({ label: n, key: `r:${n}`, kind: "recent" })),
    ...menu.results.map((n) => ({ label: n, key: `s:${n}`, kind: "result" })),
  ]).slice(0, 12);

  return (
    <div className="tpkr">
      <div className="tpkr-head">
        <div className="tpkr-pill">{matchType}</div>
        <div className="tpkr-head-text">Select Tournament, Edition & Date</div>
      </div>

      <div className="tpkr-row">
        <label className="tpkr-label">Tournament</label>
        <div className="tpkr-combo" ref={menuRef}>
          <input
            ref={inputRef}
            className="tpkr-input"
            placeholder="Search or type (e.g., Asia Cup)"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setOpen(true);
            }}
            onFocus={() => setOpen(true)}
            onBlur={validateBlur}
          />
          {canAdd && (
            <button type="button" className="tpkr-add" onMouseDown={addCustom}>
              + Add
            </button>
          )}
          {open && (suggestions.length > 0 || canAdd) && (
            <div className="tpkr-menu">
              {suggestions.length > 0 && (
                <>
                  {suggestions.map((s) => (
                    <button
                      key={s.key}
                      type="button"
                      className={`tpkr-item ${s.kind}`}
                      onMouseDown={() => pickName(s.label)}
                      title={s.kind === "recent" ? "Recent" : "Suggestion"}
                    >
                      {s.label}
                      {s.kind === "recent" && <span className="tpkr-chip">Recent</span>}
                    </button>
                  ))}
                </>
              )}
              {canAdd && (
                <button
                  type="button"
                  className="tpkr-item addline"
                  onMouseDown={addCustom}
                  title="Add custom tournament"
                >
                  + Add “{titleize(query.trim())}”
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="tpkr-grid">
        <div className="tpkr-col">
          <label className="tpkr-label">Match Date</label>
          <input className="tpkr-input" type="date" value={date} onChange={(e) => onDateChange(e.target.value)} required />
        </div>

        <div className="tpkr-col">
          <label className="tpkr-label">Edition (Year)</label>
          <input
            className="tpkr-input"
            type="number"
            min="1860"
            max="2100"
            value={year ?? ""}
            onChange={(e) => setYear(e.target.value)}
            required
          />
          {!isValidYear(year) && <small className="tpkr-err">Enter a valid year (1860–2100)</small>}
        </div>

        {allowStage && (
          <div className="tpkr-col">
            <label className="tpkr-label">Stage (optional)</label>
            <select className="tpkr-input" value={stage} onChange={(e) => setStage(e.target.value)}>
              <option value="">—</option>
              {DEFAULT_STAGES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      <div className="tpkr-hint">
        <span className="tpkr-note">
          NRR is applicable to <b>T20/ODI</b>. Test uses <b>Win/Draw/Points</b>.
        </span>
      </div>
    </div>
  );
}

function dedupe(items) {
  const seen = new Set();
  const out = [];
  for (const it of items) {
    const k = it.label.toLowerCase();
    if (!seen.has(k)) {
      seen.add(k);
      out.push(it);
    }
  }
  return out;
}
function todayISO() {
  const d = new Date();
  const m = `${d.getMonth() + 1}`.padStart(2, "0");
  const dd = `${d.getDate()}`.padStart(2, "0");
  return `${d.getFullYear()}-${m}-${dd}`;
}
