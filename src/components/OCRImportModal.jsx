// src/components/OCRImportModal.jsx
// Changes for OCR: client-side OCR (browser) + server only for commit

import React, { useMemo, useState } from "react";
import Tesseract from "tesseract.js";
import ImportPreviewGrid from "./ImportPreviewGrid";
import { ocrCommit } from "../services/ocrImportApi";
import { fetchPlayers } from "../services/api";

const FORMATS = ["T20", "ODI", "TEST"];

// --- parsing helpers (same rules as backend) ---
const ALLOWED_BAT = new Set(["RHB", "LHB"]);
const ALLOWED_BOWL = new Set(["RM","RFM","RF","LF","LM","LHM","SLO","OS","LS"]);

const batMap = { RHB: "Right-hand Bat", LHB: "Left-hand Bat" };
const bowlMap = {
  RM: "Right-arm Medium",
  RFM: "Right-arm Medium Fast",
  RF: "Right-arm Fast",
  LF: "Left-arm Fast",
  LM: "Left-arm Medium",
  LHM: "Left-arm Medium",
  SLO: "Left-arm Orthodox",
  OS: "Off Spin",
  LS: "Leg Spin",
};

const ROLE_LIST = ["Batsman","Wicketkeeper/Batsman","All Rounder","Bowler"];
const toTitle = (s="") => s.toLowerCase().replace(/\b([a-z])/g,(m,c)=>c.toUpperCase()).replace(/\s+/g," ").trim();
const ci = (s="") => s.trim().toLowerCase();

function validateRow(row) {
  const nameOk = !!(row.player_name || "").trim();
  const batOk  = ALLOWED_BAT.has((row.bat || "").toUpperCase());
  const bowlOk = ALLOWED_BOWL.has((row.bowl || "").toUpperCase());
  const roleOk = ROLE_LIST.includes(row.role);
  const missing = [];
  if (!nameOk) missing.push("name");
  if (!batOk)  missing.push("bat");
  if (!bowlOk) missing.push("bowl");
  if (!roleOk) missing.push("role");
  return { ok: missing.length === 0, missing };
}

function statusFrom(row, duplicateSet) {
  const v = validateRow(row);
  if (!v.ok) return "FIX";
  return duplicateSet.has(ci(row.player_name)) ? "DUP" : "OK";
}

// Extract rows like:  "… NAME …  RHB/LHB   RM|RFM|RF|LF|LM|LHM|SLO|OS|LS"
function parseRows(plain) {
  const rows = [];
  const seen = new Set();
  const rx = /^\s*(\d{1,2})?\s*([A-Z' .-]+?)\s+(RHB|LHB)\s+(RM|RFM|RF|LF|LM|LHM|SLO|OS|LS)\b/gi;
  let m;
  while ((m = rx.exec(plain)) !== null) {
    const name = toTitle(m[2]);
    const bat  = m[3].toUpperCase();
    const bowl = m[4].toUpperCase();
    const k = `${name}|${bat}|${bowl}`;
    if (seen.has(k)) continue;
    seen.add(k);

    rows.push({
      player_name: name,
      role: null, // user can fix in grid
      bat,
      bowl,
      status: "FIX",
      normalized: {
        batting_style: batMap[bat] || null,
        bowling_type: bowlMap[bowl] || null,
        skill_type: null
      }
    });
  }
  return rows;
}

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
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(0);
  const [rows, setRows] = useState([]);
  const [dupNames, setDupNames] = useState(new Set());
  const [previewText, setPreviewText] = useState("");

  const canImport = useMemo(
    () => rows.some(r => r.status === "OK" || r.status === "DUP" || r.status === "FIX"),
    [rows]
  );

  const doPreview = async () => {
    if (!file) return alert("Choose a PNG/JPG roster image first.");
    if (!format) return alert("Pick a format (T20/ODI/TEST).");

    setBusy(true);
    setRows([]);
    setProgress(0);
    try {
      // 1) OCR in the browser
      const { data } = await Tesseract.recognize(file, "eng", {
        logger: (m) => {
          if (m?.progress) setProgress(Math.round(m.progress * 100));
        }
      });
      const plain = data?.text || "";
      setPreviewText(plain);

      // 2) Parse text -> rows
      const parsed = parseRows(plain);

      // 3) Build duplicate set from current squad
      const current = await fetchPlayers(team || defaultTeam, format || defaultFormat);
      const dset = new Set((current || []).map(p => ci(p.player_name)));
      setDupNames(dset);

      // 4) Status annotate
      for (const r of parsed) {
        r.status = statusFrom(r, dset);
      }
      setRows(parsed);
    } catch (e) {
      console.error(e);
      alert("Preview failed.");
    } finally {
      setBusy(false);
    }
  };

  const doCommit = async () => {
    const okRows = rows
      .map(r => ({
        player_name: r.player_name,
        role: r.role,
        bat: r.bat,
        bowl: r.bowl
      }))
      .filter(r => validateRow(r).ok);

    if (okRows.length === 0) return alert("Nothing to import. Fix rows first.");

    setBusy(true);
    try {
      const user_id = localStorage.getItem("user_id") || undefined;
      const { data } = await ocrCommit({
        team_name: team,
        lineup_type: format,
        rows: okRows,
        preview_id: null,
        user_id
      });

      alert(`Imported: ${data.created}, Skipped: ${data.skipped?.length || 0}`);
      if (onImported) onImported(data.created_names || []);
      onClose?.();
    } catch (e) {
      console.error(e);
      alert("Import failed.");
    } finally {
      setBusy(false);
    }
  };

  if (!open) return null;

  return (
    <div className="sq-modal" role="dialog" aria-modal="true" onClick={onClose}>
      <div className="sq-modal-card" onClick={(e)=>e.stopPropagation()}>
        <div className="sq-modal-title">Bulk Import (OCR)</div>

        <div className="ocr-head">
          <div>
            <label className="sq-mini">Team</label>
            <input className="sq-input" value={team}
                   onChange={(e)=>setTeam(e.target.value)}
                   placeholder="e.g., Afghanistan" />
          </div>

          <div>
            <label className="sq-mini">Format</label>
            <select className="sq-input" value={format} onChange={(e)=>setFormat(e.target.value)}>
              {FORMATS.map(f => <option key={f} value={f}>{f}</option>)}
            </select>
          </div>

          <div className="fileinput">
            <label className="sq-mini">Roster Image (PNG/JPG)</label>
            <input type="file" accept="image/png,image/jpeg"
                   onChange={(e)=>setFile(e.target.files?.[0] || null)} />
          </div>

          <button className="sq-btn primary" disabled={busy || !file} onClick={doPreview}>
            {busy ? `Reading… ${progress}%` : "Preview"}
          </button>
        </div>

        <ImportPreviewGrid rows={rows} setRows={setRows} duplicateNames={dupNames} />

        <div className="ocr-actions">
          <button className="sq-btn" onClick={onClose}>Cancel</button>
          <button className="sq-btn primary" disabled={busy || !canImport} onClick={doCommit}>
            {busy ? "Importing…" : `Import ${rows.length} players`}
          </button>
        </div>

        {/* Optional: collapsed OCR raw text for debugging */}
        {process.env.NODE_ENV === "development" && previewText && (
          <details style={{marginTop:10, opacity:.75}}>
            <summary>OCR raw text</summary>
            <pre style={{whiteSpace:"pre-wrap"}}>{previewText}</pre>
          </details>
        )}
      </div>
    </div>
  );
}
