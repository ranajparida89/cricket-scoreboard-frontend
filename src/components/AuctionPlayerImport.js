// src/components/AuctionPlayerImport.js
// Phase 9 – Player pool import UI (CSV → /player-pool/import)

import React, { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Papa from "papaparse";
import { importPlayerPool } from "../services/auctionApi";
import "./AuctionPlayerImport.css"; // optional – create later if needed

/**
 * Expected CSV headers (case-insensitive):
 *
 * PlayerCode, PlayerName, Country, SkillType, Category, BidAmount
 *
 * - PlayerCode can be blank (will become null)
 * - SkillType must be one of:
 *     Batsman, Bowler, Allrounder, WicketKeeper/Batsman
 * - Category must be one of:
 *     Legend, Platinum, Gold
 * - BidAmount should be numeric (e.g. 8.5, 5.0)
 */

const AuctionPlayerImport = () => {
  const { auctionId } = useParams(); // not strictly needed for import, but good for navigation context
  const navigate = useNavigate();

  const [file, setFile] = useState(null);
  const [previewRows, setPreviewRows] = useState([]);
  const [uploadResult, setUploadResult] = useState(null);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [busy, setBusy] = useState(false);

  const handleFileChange = (e) => {
    setError("");
    setInfo("");
    setUploadResult(null);
    setPreviewRows([]);

    const f = e.target.files?.[0] || null;
    setFile(f);

    if (!f) return;

    // Quick check: only CSV
    const name = f.name.toLowerCase();
    if (!name.endsWith(".csv")) {
      setError("Please select a .csv file. XLSX is not supported in this screen.");
      return;
    }

    // Parse CSV using Papa
    Papa.parse(f, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        if (results.errors && results.errors.length > 0) {
          console.error("CSV parse errors:", results.errors);
          setError("Failed to parse CSV. Please check file format.");
          return;
        }

        const rows = (results.data || []).map((raw) => {
          // Normalize headers – handle case-insensitive names
          const normalize = (obj, key) => {
            if (!obj) return "";
            const foundKey = Object.keys(obj).find(
              (k) => k.trim().toLowerCase() === key.toLowerCase()
            );
            return foundKey ? obj[foundKey] : "";
          };

          const playerCode = (normalize(raw, "PlayerCode") || "").trim() || null;
          const playerName = (normalize(raw, "PlayerName") || "").trim();
          const country = (normalize(raw, "Country") || "").trim();
          const skillType = (normalize(raw, "SkillType") || "").trim();
          const category = (normalize(raw, "Category") || "").trim();
          const bidAmountRaw = normalize(raw, "BidAmount");
          const bidAmount = bidAmountRaw !== undefined && bidAmountRaw !== null
            ? Number(String(bidAmountRaw).trim())
            : null;

          return {
            playerCode,
            playerName,
            country,
            skillType,
            category,
            bidAmount,
          };
        });

        // Filter out rows with no playerName
        const cleaned = rows.filter((r) => r.playerName);
        setPreviewRows(cleaned);

        if (cleaned.length === 0) {
          setError("CSV parsed, but no valid rows found. Please check headers and data.");
        } else {
          setInfo(
            `Parsed ${cleaned.length} player(s) from CSV. Review preview and click 'Import to Pool'.`
          );
        }
      },
      error: (err) => {
        console.error("Papa parse error:", err);
        setError("Failed to read CSV file.");
      },
    });
  };

  const handleImport = async () => {
    if (!previewRows || previewRows.length === 0) {
      setError("No player rows available to import. Please upload a valid CSV.");
      return;
    }

    setBusy(true);
    setError("");
    setInfo("");
    setUploadResult(null);

    try {
      const res = await importPlayerPool(previewRows);
      setUploadResult(res);
      // res is expected to be: { total, inserted, updated, skipped, errors: [...] }
      setInfo("Player pool import completed. See summary below.");
    } catch (err) {
      console.error("Error importing player pool:", err);
      const msg =
        err?.response?.data?.error ||
        err?.message ||
        "Failed to import player pool.";
      setError(msg);
    } finally {
      setBusy(false);
    }
  };

  const handleBack = () => {
    if (auctionId) {
      navigate(`/auction/${auctionId}/admin`);
    } else {
      navigate("/auction");
    }
  };

  return (
    <div className="player-import-page">
      <div className="player-import-header">
        <div>
          <h1>Player Pool Import</h1>
          <p className="player-import-subtitle">
            Upload your <code>Auction.csv</code> file to populate the auction player pool.
          </p>
          <p className="player-import-note">
            Expected columns:{" "}
            <strong>
              PlayerCode, PlayerName, Country, SkillType, Category, BidAmount
            </strong>
          </p>
        </div>
        <div className="player-import-header-actions">
          <button className="btn-outline" onClick={handleBack}>
            ← Back
          </button>
        </div>
      </div>

      {error && <div className="player-import-alert error">{error}</div>}
      {info && <div className="player-import-alert info">{info}</div>}

      <div className="player-import-card">
        <h3>Step 1 – Select CSV file</h3>
        <input
          type="file"
          accept=".csv"
          onChange={handleFileChange}
          disabled={busy}
        />
        {file && (
          <div className="player-import-file-info">
            Selected: <strong>{file.name}</strong>
          </div>
        )}
      </div>

      <div className="player-import-card">
        <h3>Step 2 – Preview (first 20 rows)</h3>
        {previewRows.length === 0 ? (
          <div className="player-import-empty">No preview yet. Upload a CSV file.</div>
        ) : (
          <div className="player-import-table-wrap">
            <table className="player-import-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Player Code</th>
                  <th>Player Name</th>
                  <th>Country</th>
                  <th>Skill Type</th>
                  <th>Category</th>
                  <th>Bid Amount</th>
                </tr>
              </thead>
              <tbody>
                {previewRows.slice(0, 20).map((p, idx) => (
                  <tr key={`${p.playerName}-${idx}`}>
                    <td>{idx + 1}</td>
                    <td>{p.playerCode || "-"}</td>
                    <td>{p.playerName}</td>
                    <td>{p.country}</td>
                    <td>{p.skillType}</td>
                    <td>{p.category}</td>
                    <td>
                      {p.bidAmount != null && !Number.isNaN(p.bidAmount)
                        ? p.bidAmount
                        : "-"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {previewRows.length > 20 && (
              <div className="player-import-more">
                + {previewRows.length - 20} more row(s) not shown in preview.
              </div>
            )}
          </div>
        )}
      </div>

      <div className="player-import-card">
        <h3>Step 3 – Import to CrickEdge Auction Pool</h3>
        <button
          className="btn-primary"
          disabled={busy || previewRows.length === 0}
          onClick={handleImport}
        >
          {busy ? "Importing..." : "Import to Pool"}
        </button>

        {uploadResult && (
          <div className="player-import-summary">
            <h4>Import Summary</h4>
            <ul>
              <li>
                Total rows processed: <strong>{uploadResult.total}</strong>
              </li>
              <li>
                Inserted: <strong>{uploadResult.inserted}</strong>
              </li>
              <li>
                Updated: <strong>{uploadResult.updated}</strong>
              </li>
              <li>
                Skipped: <strong>{uploadResult.skipped}</strong>
              </li>
            </ul>
            {uploadResult.errors && uploadResult.errors.length > 0 && (
              <details>
                <summary>View row-level errors ({uploadResult.errors.length})</summary>
                <ul className="player-import-errors">
                  {uploadResult.errors.slice(0, 50).map((e, idx) => (
                    <li key={idx}>
                      Row {e.index + 1}: {e.reason}
                    </li>
                  ))}
                  {uploadResult.errors.length > 50 && (
                    <li>+ more errors not shown…</li>
                  )}
                </ul>
              </details>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default AuctionPlayerImport;
