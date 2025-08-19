// src/services/ocrImportApi.js
import axios from "axios";

// Backend base URL
const BASE_URL = "https://cricket-scoreboard-backend.onrender.com";

/**
 * Commit OCR rows (server only inserts; OCR happens in the browser).
 * Returns: { ok, created, created_names[], skipped[], errors[] }
 */
export async function ocrCommit({ team_name, lineup_type, rows, preview_id = null, user_id }) {
  return axios.post(`${BASE_URL}/api/squads/ocr/commit`, {
    team_name,
    lineup_type,
    rows,
    preview_id
  }, {
    headers: {
      "Content-Type": "application/json",
      ...(user_id ? { "X-User-Id": user_id } : {})
    }
  });
}
