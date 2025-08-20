// src/components/tournaments.js
// All-in-one tournament utilities for CrickEdge UI.
// - Preset tournament catalog (rich metadata + formats + defunct flags)
// - Validation & normalization utilities (diacritics-safe, punctuation-tolerant)
// - Custom tournament management (localStorage) + recent picks
// - Fuzzy search/suggestions with scoring
// - Helpers for year/edition + filter building for API calls (degrade gracefully if BE not ready)
//
// Author: ChatGPT for Ranaj Parida (2025-08-21)

//////////////////////////
// Config & constants  //
//////////////////////////

/** localStorage keys (scoped) */
const LS_CUSTOM = "crickedge.customTournaments";
const LS_RECENT = "crickedge.recentTournaments";

/** Accept only readable, printable chars users actually type (incl. typographic dashes/apostrophes) */
export const allowedTournamentChars = /^[A-Za-z0-9\s&/–—'’.():-]{3,80}$/;

/** Default max list sizes */
const MAX_RECENTS = 8;

/** Known stage labels (UI may offer dropdown; safe fallback list) */
export const DEFAULT_STAGES = [
  "League",
  "Group",
  "Super Four",
  "Knockout",
  "Quarter-Final",
  "Semi-Final",
  "Final",
  "Bilateral",
  "Friendly"
];

/** Minimal “formats” taxonomy */
export const FORMATS = Object.freeze({
  T20: "T20",
  ODI: "ODI",
  TEST: "Test",
});

/**
 * Canonical preset tournaments with light metadata.
 * - name: Display name (what users see)
 * - formats: formats this tournament typically uses (for suggestions/filtering; **non-binding**)
 * - defunct: historical only (optional)
 * - tags: quick search keywords/aliases
 */
export const PRESET_TOURNAMENTS = [
  // ICC globals
  { name: "ICC Cricket World Cup",           formats: [FORMATS.ODI], tags: ["world cup", "icc odi wc"] },
  { name: "ICC Champions Trophy",            formats: [FORMATS.ODI], tags: ["champions trophy", "icc ct"] },
  { name: "ICC Men’s T20 World Cup",         formats: [FORMATS.T20], tags: ["t20 wc", "world t20"] },
  { name: "ICC World Test Championship",     formats: [FORMATS.TEST],tags: ["wtc", "world test"] },

  // ACC / continental / multi-sport
  { name: "Asia Cup",                         formats: [FORMATS.ODI, FORMATS.T20], tags: ["acc asia cup"] },
  { name: "ACC Men’s Premier Cup",            formats: [FORMATS.ODI, FORMATS.T20], tags: ["premier cup"] },
  { name: "ACC Men’s Challenger Cup",         formats: [FORMATS.ODI, FORMATS.T20], tags: ["challenger cup"] },
  { name: "ACC Emerging Teams Asia Cup",      formats: [FORMATS.ODI, FORMATS.T20], tags: ["emerging"] },
  { name: "Asian Test Championship",          formats: [FORMATS.TEST], defunct: true, tags: ["atc"] },
  { name: "Austral-Asia Cup",                 formats: [FORMATS.ODI], defunct: true, tags: ["austral asia"] },
  { name: "European Cricket Championship",    formats: [FORMATS.T20], tags: ["ecc", "european"] },
  { name: "Cricket at the Commonwealth Games",formats: [FORMATS.T20], tags: ["commonwealth games"] },
  { name: "Cricket at the Asian Games",       formats: [FORMATS.T20], tags: ["asian games"] },
  { name: "Cricket at the South Asian Games", formats: [FORMATS.T20], tags: ["sag"] },
  { name: "Cricket at the Pacific Games",     formats: [FORMATS.T20], tags: ["pacific games"] },

  // Iconic bilateral trophies (mostly Test-focused historically)
  { name: "The Ashes",                        formats: [FORMATS.TEST], tags: ["ashes", "aus-eng"] },
  { name: "Anderson–Tendulkar Trophy",        formats: [FORMATS.TEST], tags: ["eng-ind", "anderson tendulkar"] },
  { name: "Border–Gavaskar Trophy",           formats: [FORMATS.TEST], tags: ["aus-ind", "bgt"] },
  { name: "Basil D’Oliveira Trophy",          formats: [FORMATS.TEST], tags: ["eng-sa"] },
  { name: "Richards–Botham Trophy",           formats: [FORMATS.TEST], tags: ["eng-wi"] },
  { name: "Frank Worrell Trophy",             formats: [FORMATS.TEST], tags: ["wi-aus"] },
  { name: "Trans-Tasman Trophy",              formats: [FORMATS.TEST], tags: ["aus-nz"] },
  { name: "Sir Vivian Richards Trophy",       formats: [FORMATS.TEST], tags: ["sa-wi"] },
  { name: "Sobers–Tissera Trophy",            formats: [FORMATS.TEST], tags: ["wi-sl"] },
  { name: "Warne–Muralitharan Trophy",        formats: [FORMATS.TEST], tags: ["aus-sl"] },
  { name: "Benaud–Qadir Trophy",              formats: [FORMATS.TEST], tags: ["aus-pak"] },
  { name: "Freedom Trophy / Gandhi–Mandela Trophy", formats: [FORMATS.TEST], tags: ["ind-sa","freedom","gandhi mandela"] },
  { name: "Anthony de Mello Trophy",          formats: [FORMATS.TEST], defunct: true, tags: ["eng-ind in india"] },
  { name: "Pataudi Trophy",                   formats: [FORMATS.TEST], defunct: true, tags: ["eng-ind in england"] },
  { name: "Clive Lloyd Trophy",               formats: [FORMATS.TEST], tags: ["wi-zim"] },
  { name: "Crowe–Thorpe Trophy",              formats: [FORMATS.TEST], tags: ["eng-nz"] },
  { name: "Chappell–Hadlee Trophy",           formats: [FORMATS.ODI, FORMATS.T20], tags: ["aus-nz","odi t20"] },
];

/////////////////////////////
// Normalization helpers  //
/////////////////////////////

/** Remove diacritics; keep ASCII-ish */
function stripDiacritics(s) {
  try {
    return s.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  } catch {
    return s;
  }
}

/** Canonical key for dedupe/compare: lowercase, trimmed, diacritics- and punctuation-light */
export function canon(s) {
  const t = (s || "").toString().trim();
  const u = stripDiacritics(t)
    .replace(/[’']/g, "'")
    .replace(/[–—]/g, "-")
    .replace(/[^\w\s&/().:'-]/g, " "); // keep readable punctuation
  return u.replace(/\s+/g, " ").toLowerCase();
}

/** Title-case-ish for display when user types lowercase */
export function titleize(s) {
  return (s || "")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\w\S*/g, (w) => w.charAt(0).toUpperCase() + w.slice(1));
}

/** Basic validation for UI input */
export function isValidTournamentName(name) {
  return !!name && allowedTournamentChars.test(name.trim());
}

/////////////////////////////
// Custom list management  //
/////////////////////////////

function lsGet(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}
function lsSet(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch { /* ignore quota */ }
}

/** Get array of custom tournament strings */
export function getCustomTournaments() {
  const arr = lsGet(LS_CUSTOM, []);
  return Array.isArray(arr) ? arr : [];
}

/** Add custom tournament if valid and not duplicated (case/diacritic-insensitive) */
export function addCustomTournament(name) {
  const clean = (name || "").trim();
  if (!isValidTournamentName(clean)) {
    throw new Error("Invalid tournament name.");
  }
  const customs = getCustomTournaments();
  const exists = customs.some((n) => canon(n) === canon(clean));
  if (!exists) {
    lsSet(LS_CUSTOM, [clean, ...customs].slice(0, 100)); // cap to sane limit
  }
  return getCustomTournaments();
}

export function removeCustomTournament(name) {
  const customs = getCustomTournaments();
  const filtered = customs.filter((n) => canon(n) !== canon(name));
  lsSet(LS_CUSTOM, filtered);
  return filtered;
}

export function clearCustomTournaments() {
  lsSet(LS_CUSTOM, []);
  return [];
}

/////////////////////////////
// Recent selections (UX)  //
/////////////////////////////

export function getRecentTournaments() {
  const arr = lsGet(LS_RECENT, []);
  return Array.isArray(arr) ? arr : [];
}

export function pushRecentTournament(name) {
  const clean = (name || "").trim();
  if (!clean) return getRecentTournaments();
  const recents = getRecentTournaments().filter((n) => canon(n) !== canon(clean));
  const next = [clean, ...recents].slice(0, MAX_RECENTS);
  lsSet(LS_RECENT, next);
  return next;
}

/////////////////////////////
// Catalog (merged list)  //
/////////////////////////////

/**
 * Get unified tournament list with metadata.
 * - Merges PRESET + Customs (customs have minimal metadata)
 * - De-duplicates by canonical key (preset wins; custom supplements)
 */
export function getCatalog() {
  const customs = getCustomTournaments();
  const customObjs = customs.map((n) => ({
    name: n, formats: [FORMATS.T20, FORMATS.ODI, FORMATS.TEST], tags: ["custom"]
  }));

  const map = new Map();
  for (const item of [...PRESET_TOURNAMENTS, ...customObjs]) {
    const key = canon(item.name);
    if (!map.has(key)) map.set(key, item);
  }
  // Sort: Presets alphabetically; customs appended alphabetically after presets
  const arr = Array.from(map.values());
  arr.sort((a, b) => a.name.localeCompare(b.name));
  return arr;
}

/** Quick helper to check if a name is in presets (for tagging) */
export function isPreset(name) {
  const key = canon(name);
  return PRESET_TOURNAMENTS.some((p) => canon(p.name) === key);
}

/////////////////////////////
// Fuzzy search (no deps) //
/////////////////////////////

/**
 * Very light fuzzy match scoring:
 * - exact canonical prefix = +3
 * - substring match = +2
 * - token intersection (tags + name) = +1 each
 * - format preference (if provided) = +0.5
 */
export function searchTournaments(query, { format, limit = 10, includeDefunct = true } = {}) {
  const q = canon(query || "");
  const catalog = getCatalog().filter((t) => includeDefunct || !t.defunct);

  if (!q) {
    // no query: return top recents then some popular presets
    const recents = getRecentTournaments();
    const deduped = [];
    for (const r of recents) {
      const item = catalog.find((t) => canon(t.name) === canon(r));
      if (item) deduped.push({ ...item, _score: 5, _source: "recent" });
    }
    // Fill remaining with “popular” picks (ICC + Asia Cup, etc.)
    const popularNames = [
      "ICC Cricket World Cup",
      "ICC Men’s T20 World Cup",
      "ICC Champions Trophy",
      "ICC World Test Championship",
      "Asia Cup",
      "Border–Gavaskar Trophy",
      "The Ashes",
      "Chappell–Hadlee Trophy",
    ];
    const popular = catalog
      .filter((t) => popularNames.some((n) => canon(n) === canon(t.name)))
      .map((t) => ({ ...t, _score: 4, _source: "popular" }));

    const mergedKeys = new Set(deduped.map((x) => canon(x.name)));
    for (const p of popular) {
      if (!mergedKeys.has(canon(p.name))) deduped.push(p);
    }
    return deduped.slice(0, limit);
  }

  const qTokens = q.split(/\s+/).filter(Boolean);
  const scored = catalog.map((t) => {
    const nameC = canon(t.name);
    const tags = (t.tags || []).map(canon);
    let score = 0;

    if (nameC.startsWith(q)) score += 3;
    else if (nameC.includes(q)) score += 2;

    for (const tok of qTokens) {
      if (nameC.includes(tok)) score += 1;
      if (tags.some((tg) => tg.includes(tok))) score += 1;
    }

    if (format && Array.isArray(t.formats) && t.formats.includes(format)) score += 0.5;

    return { ...t, _score: score, _source: isPreset(t.name) ? "preset" : "custom" };
  });

  return scored
    .filter((x) => x._score > 0)
    .sort((a, b) => b._score - a._score || a.name.localeCompare(b.name))
    .slice(0, limit);
}

/**
 * Suggestions pack for dropdowns:
 * { recents:[], featured:[], results:[] }
 */
export function getSuggestions(query, opts = {}) {
  const recents = getRecentTournaments();
  return {
    recents,
    featured: searchTournaments("", opts).filter((x) => x._source === "popular").map((x) => x.name),
    results: searchTournaments(query, opts).map((x) => x.name),
  };
}

/////////////////////////////
// Year & edition helpers //
/////////////////////////////

export function yearFromISO(isoDate) {
  if (!isoDate) return undefined;
  const d = new Date(isoDate);
  if (!Number.isFinite(d.getTime())) return undefined;
  return d.getFullYear();
}

export function isValidYear(y) {
  const n = Number(y);
  return Number.isInteger(n) && n >= 1860 && n <= 2100;
}

/**
 * Smart default year:
 * - Uses selected date if valid; else current year
 */
export function suggestEditionYear(matchDateISO) {
  return yearFromISO(matchDateISO) ?? new Date().getFullYear();
}

/////////////////////////////
// Backend filter helpers //
/////////////////////////////

/**
 * Build query object for API calls — works now even if backend ignores extra params.
 * Use with your services like: getTeams(buildFilters({matchType, tournamentName, seasonYear}))
 */
export function buildFilters({ matchType, tournamentName, seasonYear } = {}) {
  const q = {};
  if (matchType && matchType !== "All") q.match_type = matchType;
  if (tournamentName) q.tournament_name = tournamentName.trim();
  if (seasonYear && isValidYear(seasonYear)) q.season_year = Number(seasonYear);
  return q;
}

/** Build URL query string from object */
export function toQuery(params = {}) {
  const sp = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== "") sp.set(k, String(v));
  });
  const s = sp.toString();
  return s ? `?${s}` : "";
}

/**
 * Try fetching tournaments+editions from backend (optional).
 * Graceful fallback to local catalog if BE not ready.
 *
 * @param {Object} opts
 * @param {string} [opts.matchType] Optional filter on server
 * @param {string} [opts.baseUrl]   e.g. "https://cricket-scoreboard-backend.onrender.com/api"
 * @returns {Promise<{name:string, editions?:Array}[]>}
 */
export async function fetchBackendCatalog({ matchType, baseUrl } = {}) {
  const api = (baseUrl || process.env.REACT_APP_API_BASE || "/api") + "/tournaments";
  const url = api + (matchType ? `?match_type=${encodeURIComponent(matchType)}` : "");
  try {
    const res = await fetch(url, { credentials: "include" });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const rows = await res.json();
    // Expected shape from our BE plan:
    // [{ tournament_id, name, editions: [{edition_id, season_year, match_type, ...}] }, ...]
    if (Array.isArray(rows)) return rows.map(r => ({ name: r.name, editions: r.editions || [] }));
    return getCatalog().map((t) => ({ name: t.name, editions: [] }));
  } catch {
    // fallback to local catalog if backend not available
    return getCatalog().map((t) => ({ name: t.name, editions: [] }));
  }
}

/////////////////////////////
// Glue for UI components //
/////////////////////////////

/**
 * On select handler (from TournamentPicker):
 * - normalizes name, enforces validation
 * - stores recent
 * - returns clean payload: { tournamentName, seasonYear, matchDate, stage }
 */
export function onTournamentChosen({ name, year, date, stage }) {
  const cleanName = titleize((name || "").trim());
  if (!isValidTournamentName(cleanName)) {
    throw new Error("Tournament name must be 3–80 chars with letters, numbers, spaces, and basic punctuation.");
  }
  if (!isValidYear(year)) {
    throw new Error("Edition year must be between 1860 and 2100.");
  }
  pushRecentTournament(cleanName);
  return {
    tournamentName: cleanName,
    seasonYear: Number(year),
    matchDate: date || new Date().toISOString().slice(0, 10),
    stage: (stage || "").trim()
  };
}

/**
 * Given user-typed query, produce menu items:
 *  - Recents (pinned)
 *  - Results (fuzzy)
 *  - Option to "Add: <typed>" when not found & valid
 */
export function composeMenu(query, { format, limit = 10 } = {}) {
  const q = (query || "").trim();
  const recents = getRecentTournaments();
  const results = searchTournaments(q, { format, limit }).map((x) => x.name);
  const exists = results.some((n) => canon(n) === canon(q)) || recents.some((n) => canon(n) === canon(q));
  const canAdd = !!q && !exists && isValidTournamentName(q);
  return { recents, results, canAdd, addLabel: canAdd ? `+ Add "${titleize(q)}"` : "" };
}

/** Add-then-return latest list for UI menus */
export function addTournamentAndRefresh(name, opts = {}) {
  const added = addCustomTournament(titleize(name));
  const menu = composeMenu(name, opts);
  return { added, menu };
}

/////////////////////////////
// Export convenience bag //
/////////////////////////////

export default {
  FORMATS,
  PRESET_TOURNAMENTS,
  DEFAULT_STAGES,
  allowedTournamentChars,
  getCatalog,
  searchTournaments,
  getSuggestions,
  getCustomTournaments,
  addCustomTournament,
  removeCustomTournament,
  clearCustomTournaments,
  getRecentTournaments,
  pushRecentTournament,
  isPreset,
  canon,
  titleize,
  isValidTournamentName,
  yearFromISO,
  suggestEditionYear,
  isValidYear,
  buildFilters,
  toQuery,
  fetchBackendCatalog,
  onTournamentChosen,
  composeMenu,
  addTournamentAndRefresh,
};
