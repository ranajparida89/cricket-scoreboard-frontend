// src/components/OCRImportModal.jsx
// Drop-in modal to use INSIDE Squad/Lineup without changing its logic.

import React, { useEffect, useMemo, useState } from "react";
import ImportPreviewGrid from "./ImportPreviewGrid";
import { ocrPreview, ocrCommit } from "../services/ocrImportApi";

const FORMATS = ["T20", "ODI", "TEST"];

/**
 * Props:
 *  - open: boolean (show/hide)
 *  - onClose: () => void
 *  - defaultTeam: string (pre-filled from Squad/Lineup selection)
 *  - defaultFormat: "T20" | "ODI" | "TEST"
 *  - onImported: (createdNames: string[]) => void (notify parent to refresh + highlight)
 */
export default function OCRImportModal({
  open,
  onClose,
  defaultTeam,
  defaultFormat,
  onImported
}) {
  const [team, setTeam] = useState(defaultTeam || "");
  const [format, setFormat] = useState(defaultFormat || "T20");
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [rows, setRows] = useState([]);
  const [dupNames, setDupNames] = useState(new Set());
  const [previewId, setPreviewId] = useState(null);

  useEffect(() => {
    if (!open) return;
    // reset every time user opens the modal
    setTeam(defaultTeam || "");
    setFormat(defaultFormat || "T20");
    setFile(null);
    setRows([]);
    setDupNames(new Set());
    setPreviewId(null);
  }, [open, defaultTeam, defaultFormat]);

  const canImport = useMemo(
    () => rows.some(r => r.player_name && r.role && r.bat && r.bowl),
    [rows]
  );

  const onPreview = async () => {
    if (!file) return alert("Choose an image");
    if (!format) return alert("Select a format");

    setLoading(true);
    try {
      const user_id = localStorage.getItem("user_id") || undefined;
      const { data } = await ocrPreview({
        file,
        team_name: team || undefined,
        lineup_type: format,
        user_id
      });

      setTeam(data.team_name || team);
      setPreviewId(data.preview_id);
      setRows(data.rows || []);
      setDupNames(new Set(data.duplicates || []));
    } catch (e) {
      console.error(e);
      alert("Preview failed.");
    } finally {
      setLoading(false);
    }
  };

  const onCommit = async () => {
    const okRows = rows.filter(r => r.player_name && r.role && r.bat && r.bowl);
    if (okRows.length === 0) return alert("Nothing to import. Fix rows first.");

    setLoading(true);
    try {
      const user_id = localStorage.getItem("user_id") || undefined;
      const { data } = await ocrCommit({
        team_name: team,
        lineup_type: format,
        rows: okRows,
        preview_id: previewId,
        user_id
      });

      // Tell parent which names were created so it can refresh and highlight
      if (onImported) onImported(data.created_names || []);
      onClose();
    } catch (e) {
      console.error(e);
      alert("Import failed.");
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  // Lightweight modal (no Bootstrap JS dependency)
  return (
    <div style={styles.backdrop}>
      <div style={styles.modal}>
        <div style={styles.header}>
          <h3 style={{ margin: 0 }}>Bulk Import (OCR)</h3>
          <button onClick={onClose} style={styles.closeBtn} aria-label="Close">✕</button>
        </div>

        <div className="flex flex-wrap gap-3 items-end mb-3">
          <div>
            <label className="block text-sm font-medium">Team</label>
            <input
              className="border rounded p-2 w-64"
              placeholder="e.g., Afghanistan (optional — OCR detects)"
              value={team}
              onChange={(e) => setTeam(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium">Format</label>
            <select
              className="border rounded p-2"
              value={format}
              onChange={(e) => setFormat(e.target.value)}
            >
              {FORMATS.map((f) => <option key={f} value={f}>{f}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium">Roster Image (PNG/JPG)</label>
            <input
              type="file"
              accept="image/png,image/jpeg"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
            />
          </div>

          <button
            className="px-4 py-2 rounded bg-blue-600 text-white disabled:opacity-50"
            onClick={onPreview}
            disabled={loading || !file}
          >
            {loading ? "Reading..." : "Preview"}
          </button>
        </div>

        <ImportPreviewGrid rows={rows} setRows={setRows} duplicateNames={dupNames} />

        <div className="flex items-center gap-3 mt-4">
          <button
            className="px-5 py-2 rounded bg-emerald-600 text-white disabled:opacity-50"
            disabled={loading || !canImport}
            onClick={onCommit}
          >
            {loading ? "Importing..." : `Import ${rows.length} players`}
          </button>
          <button className="px-4 py-2 rounded bg-gray-200" onClick={onClose}>Cancel</button>
        </div>

        <div className="mt-4 text-slate-500 text-sm">
          <b>Legend:</b> <span className="bg-green-200 px-1 rounded">OK</span> new ·{" "}
          <span className="bg-gray-300 px-1 rounded">DUP</span> duplicate ·{" "}
          <span className="bg-yellow-200 px-1 rounded">FIX</span> needs edit.
        </div>
      </div>
    </div>
  );
}

const styles = {
  backdrop: {
    position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)",
    display: "flex", alignItems: "center", justifyContent: "center",
    zIndex: 2000
  },
  modal: {
    width: "min(1100px, 96vw)",
    maxHeight: "86vh",
    overflow: "auto",
    background: "var(--bs-dark, #0b1220)",
    color: "var(--bs-light, #e5e7eb)",
    borderRadius: 12,
    padding: 16,
    boxShadow: "0 12px 40px rgba(0,0,0,0.35)"
  },
  header: {
    display: "flex", alignItems: "center", justifyContent: "space-between",
    marginBottom: 12, paddingBottom: 8, borderBottom: "1px solid rgba(255,255,255,0.08)"
  },
  closeBtn: {
    background: "transparent", border: "none", color: "inherit",
    fontSize: 20, cursor: "pointer", lineHeight: 1
  }
};
