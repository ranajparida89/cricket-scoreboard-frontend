// src/components/ImportPreviewGrid.jsx
import React from "react";

const ROLE_OPTIONS = [
  "Batsman",
  "Wicketkeeper/Batsman",
  "All Rounder",
  "Bowler"
];
const BAT_OPTIONS = ["RHB", "LHB"];
const BOWL_OPTIONS = ["RM","RFM","RF","LF","LM","LHM","SLO","OS","LS"];

// Row background by status (used in preview table)
const rowClass = (status) => {
  switch (status) {
    case "OK":   return "bg-green-50";
    case "DUP":  return "bg-gray-50";
    case "FIX":  return "bg-yellow-50";
    case "ERROR":return "bg-red-50";
    default:     return "";
  }
};

/**
 * Editable preview table with status chips.
 * Parent passes rows + setRows + duplicateNames (Set of lowercased names).
 */
export default function ImportPreviewGrid({ rows, setRows, duplicateNames = new Set() }) {
  const update = (i, patch) => {
    const next = rows.slice();
    next[i] = { ...next[i], ...patch };

    // Recompute status client-side whenever user edits
    const r = next[i];
    const hasAll =
      r.player_name &&
      r.role &&
      BAT_OPTIONS.includes(r.bat) &&
      BOWL_OPTIONS.includes(r.bowl);

    next[i].status = hasAll
      ? (duplicateNames.has((r.player_name || "").toLowerCase()) ? "DUP" : "OK")
      : "FIX";

    setRows(next);
  };

  const remove = (i) => setRows(rows.filter((_, idx) => idx !== i));

  return (
    <div className="w-full overflow-auto">
      <table className="min-w-full border rounded-md">
        <thead className="bg-slate-100">
          <tr>
            <th className="p-2 text-left">#</th>
            <th className="p-2 text-left">Status</th>
            <th className="p-2 text-left">Name</th>
            <th className="p-2 text-left">Role</th>
            <th className="p-2 text-left">Bat</th>
            <th className="p-2 text-left">Bowl</th>
            <th className="p-2 text-left">Actions</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i} className={rowClass(r.status)}>
              <td className="p-2">{i + 1}</td>
              <td className="p-2">
                <span className={`px-2 py-1 rounded text-xs
                  ${r.status === "OK" ? "bg-green-200" :
                    r.status === "DUP" ? "bg-gray-300" :
                    r.status === "FIX" ? "bg-yellow-200" : "bg-red-200"}`}>
                  {r.status}
                </span>
              </td>
              <td className="p-2">
                <input
                  className="border rounded p-1 w-64"
                  value={r.player_name || ""}
                  onChange={(e) => update(i, { player_name: e.target.value })}
                  placeholder="Player name"
                />
              </td>
              <td className="p-2">
                <select
                  className="border rounded p-1"
                  value={r.role || ""}
                  onChange={(e) => update(i, { role: e.target.value })}
                >
                  <option value="">Select role</option>
                  {ROLE_OPTIONS.map((opt) => <option key={opt} value={opt}>{opt}</option>)}
                </select>
              </td>
              <td className="p-2">
                <select
                  className="border rounded p-1"
                  value={r.bat || ""}
                  onChange={(e) => update(i, { bat: e.target.value.toUpperCase() })}
                >
                  <option value="">-</option>
                  {BAT_OPTIONS.map((b) => <option key={b} value={b}>{b}</option>)}
                </select>
              </td>
              <td className="p-2">
                <select
                  className="border rounded p-1"
                  value={r.bowl || ""}
                  onChange={(e) => update(i, { bowl: e.target.value.toUpperCase() })}
                >
                  <option value="">-</option>
                  {BOWL_OPTIONS.map((b) => <option key={b} value={b}>{b}</option>)}
                </select>
              </td>
              <td className="p-2">
                <button
                  className="px-3 py-1 rounded bg-rose-500 text-white"
                  onClick={() => remove(i)}
                >
                  Delete
                </button>
              </td>
            </tr>
          ))}
          {rows.length === 0 && (
            <tr>
              <td colSpan={7} className="p-6 text-center text-slate-500">
                No rows yet. Upload an image to preview.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
