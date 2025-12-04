// src/components/AuctionPlayerPoolImport.js
// Phase 9 – Player pool import UI (Excel/CSV → DB)

import React, { useState } from "react";
import * as XLSX from "xlsx"; // npm install xlsx
import { useNavigate } from "react-router-dom";
import { importPlayerPool } from "../services/auctionApi";
import "./AuctionPlayerPoolImport.css";

const AuctionPlayerPoolImport = () => {
  const navigate = useNavigate();
  const isAdmin = localStorage.getItem("isAdmin") === "true";

  const [fileName, setFileName] = useState("");
  const [rows, setRows] = useState([]); // parsed players ready for API
  const [previewRows, setPreviewRows] = useState([]); // first N rows for UI
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [importSummary, setImportSummary] = useState(null);

  if (!isAdmin) {
    return (
      <div className="pool-import-page">
        <div className="pool-import-header">
          <h1>Auction Player Pool Import</h1>
        </div>
        <div className="pool-import-alert error">
          You are not marked as admin (localStorage isAdmin !== "true").
          Please login as admin to access this page.
        </div>
        <button className="pool-btn-outline" onClick={() => navigate("/auction")}>
          ← Back to Auction Lobby
        </button>
      </div>
    );
  }

  const resetMessages = () => {
    setError("");
    setInfo("");
    setImportSummary(null);
  };

  const handleFileChange = async (e) => {
    resetMessages();
    const file = e.target.files?.[0];
    if (!file) {
      setRows([]);
      setPreviewRows([]);
      setFileName("");
      return;
    }

    setFileName(file.name);
    setLoading(true);

    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data, { type: "array" });

      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];

      // Get rows as 2D array: [[col1, col2, ...], ...]
      const raw = XLSX.utils.sheet_to_json(worksheet, { header: 1, blankRows: false });

      if (!raw || raw.length < 2) {
        setError("Sheet looks empty or has no data rows.");
        setRows([]);
        setPreviewRows([]);
        setLoading(false);
        return;
      }

      const headerRow = raw[0].map((h) => String(h || "").trim());
      const dataRows = raw.slice(1);

      // Normalize header names for flexible matching
      const norm = (s) => s.toLowerCase().replace(/\s+/g, "").replace(/_/g, "");

      const idxPlayerId = headerRow.findIndex(
        (h) => ["playerid", "playercode", "id"].includes(norm(h))
      );
      const idxPlayerName = headerRow.findIndex(
        (h) => ["playername", "name"].includes(norm(h))
      );
      const idxCountry = headerRow.findIndex(
        (h) => ["country", "team"].includes(norm(h))
      );
      const idxSkillType = headerRow.findIndex(
        (h) => ["skilltype", "skill", "role"].includes(norm(h))
      );
      const idxCategory = headerRow.findIndex(
        (h) => ["category", "cat"].includes(norm(h))
      );
      const idxBidAmount = headerRow.findIndex(
        (h) => ["bidamount", "baseprice", "amount"].includes(norm(h))
      );

      if (
        idxPlayerName === -1 ||
        idxCountry === -1 ||
        idxSkillType === -1 ||
        idxCategory === -1 ||
        idxBidAmount === -1
      ) {
        setError(
          "Unable to detect required columns. Ensure headers contain: Player id, Player name, Country, Skill type, Category, Bid amount."
        );
        setRows([]);
        setPreviewRows([]);
        setLoading(false);
        return;
      }

      const parsedPlayers = [];

      for (let i = 0; i < dataRows.length; i++) {
        const row = dataRows[i];
        const playerName = String(row[idxPlayerName] || "").trim();
        const country = String(row[idxCountry] || "").trim();
        const skillType = String(row[idxSkillType] || "").trim();
        const category = String(row[idxCategory] || "").trim();
        const bidRaw = row[idxBidAmount];

        if (!playerName || !country || !skillType || !category || bidRaw == null) {
          // skip silently here; backend will also validate, but we avoid garbage
          continue;
        }

        const playerCode =
          idxPlayerId >= 0 ? String(row[idxPlayerId] || "").trim() : null;

        // *** IMPORTANT MAPPING ***
        // Excel -> API:
        // Player id      -> playerCode (optional)
        // Player name    -> playerName
        // Country        -> country
        // Skill type     -> skillType (Batsman/Bowler/Allrounder/WicketKeeper/Batsman)
        // Category       -> category  (Legend/Platinum/Gold)
        // Bid amount     -> bidAmount (number)
        const playerObj = {
          playerCode: playerCode || undefined,
          playerName,
          country,
          skillType,
          category,
          bidAmount: Number(bidRaw),
        };

        parsedPlayers.push(playerObj);
      }

      if (parsedPlayers.length === 0) {
        setError("No valid player rows found after parsing the sheet.");
        setRows([]);
        setPreviewRows([]);
        setLoading(false);
        return;
      }

      setRows(parsedPlayers);
      setPreviewRows(parsedPlayers.slice(0, 30)); // show first 30 in preview
      setInfo(
        `Parsed ${parsedPlayers.length} players from "${file.name}". Review preview and click "Upload to Auction Pool".`
      );
    } catch (err) {
      console.error("Error reading file:", err);
      setError(err.message || "Failed to read Excel/CSV file.");
      setRows([]);
      setPreviewRows([]);
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async () => {
    resetMessages();

    if (!rows || rows.length === 0) {
      setError("No parsed players available. Please select a file first.");
      return;
    }

    setLoading(true);
    try {
      const res = await importPlayerPool(rows);
      setImportSummary(res);
      setInfo(
        `Import completed: Inserted=${res.inserted}, Updated=${res.updated}, Skipped=${res.skipped}.`
      );
    } catch (err) {
      console.error("Error uploading player pool:", err);
      const msg =
        err?.response?.data?.error ||
        err?.message ||
        "Failed to import player pool.";
      setError(msg);
      setImportSummary(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="pool-import-page">
      <div className="pool-import-header">
        <div>
          <h1>Auction Player Pool Import</h1>
          <p className="pool-import-subtitle">
            Upload Excel/CSV with player list. This will populate
            <strong> auction_player_pool</strong>.
          </p>
        </div>
        <div className="pool-import-header-actions">
          <button
            className="pool-btn-outline"
            onClick={() => navigate("/auction")}
          >
            ← Auction Lobby
          </button>
        </div>
      </div>

      {error && <div className="pool-import-alert error">{error}</div>}
      {info && <div className="pool-import-alert info">{info}</div>}

      <div className="pool-import-card">
        <h3>1. Upload Excel / CSV</h3>
        <p className="pool-import-note">
          Expected columns (any order, case-insensitive):
          <br />
          <code>
            Player id, Player name, Country, Skill type, Category, Bid amount
          </code>
          .
          <br />
          Skill type must be one of:{" "}
          <strong>
            Batsman, Bowler, Allrounder, WicketKeeper/Batsman
          </strong>
          . Category must be{" "}
          <strong>Legend, Platinum, Gold</strong>. Bid amount as{" "}
          <strong>number</strong> (cr).
        </p>

        <label className="pool-file-label">
          <span>Choose file</span>
          <input
            type="file"
            accept=".xlsx,.xls,.csv"
            onChange={handleFileChange}
          />
        </label>

        {fileName && (
          <div className="pool-file-name">
            Selected file: <strong>{fileName}</strong>
          </div>
        )}

        <button
          className="pool-btn-primary"
          disabled={loading || rows.length === 0}
          onClick={handleUpload}
        >
          {loading ? "Uploading..." : "⬆ Upload to Auction Pool"}
        </button>
      </div>

      <div className="pool-import-card">
        <h3>2. Preview (first {previewRows.length} rows)</h3>
        {previewRows.length === 0 ? (
          <div className="pool-import-empty">
            No data parsed yet. Upload a file to see preview.
          </div>
        ) : (
          <div className="pool-table-wrap">
            <table className="pool-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Player Code</th>
                  <th>Player Name</th>
                  <th>Country</th>
                  <th>Skill Type</th>
                  <th>Category</th>
                  <th>Bid Amount (cr)</th>
                </tr>
              </thead>
              <tbody>
                {previewRows.map((p, idx) => (
                  <tr key={`${p.playerName}-${idx}`}>
                    <td>{idx + 1}</td>
                    <td>{p.playerCode || "-"}</td>
                    <td>{p.playerName}</td>
                    <td>{p.country}</td>
                    <td>{p.skillType}</td>
                    <td>{p.category}</td>
                    <td>{p.bidAmount}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {importSummary && (
        <div className="pool-import-card">
          <h3>3. Server Summary</h3>
          <div className="pool-summary-grid">
            <div className="summary-item">
              <span>Total rows sent</span>
              <strong>{importSummary.total}</strong>
            </div>
            <div className="summary-item">
              <span>Inserted</span>
              <strong>{importSummary.inserted}</strong>
            </div>
            <div className="summary-item">
              <span>Updated</span>
              <strong>{importSummary.updated}</strong>
            </div>
            <div className="summary-item">
              <span>Skipped</span>
              <strong>{importSummary.skipped}</strong>
            </div>
          </div>

          {importSummary.errors && importSummary.errors.length > 0 && (
            <div className="pool-import-errors">
              <h4>Row-level issues</h4>
              <ul>
                {importSummary.errors.slice(0, 50).map((err, i) => (
                  <li key={i}>
                    Row #{err.index + 2}: {err.reason}
                  </li>
                ))}
              </ul>
              {importSummary.errors.length > 50 && (
                <p className="pool-import-note">
                  Showing first 50 errors only.
                </p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AuctionPlayerPoolImport;
