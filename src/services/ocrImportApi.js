// src/services/ocrImportApi.js
// Hardcoded backend URL as per your convention
const BASE_URL = "https://cricket-scoreboard-backend.onrender.com";
import axios from "axios";

/**
 * Call /preview to extract rows from the uploaded roster image.
 * Returns: { team_name, lineup_type, preview_id, rows[], duplicates[], errors[] }
 */
export async function ocrPreview({ file, team_name, lineup_type, user_id }) {
  const form = new FormData();
  form.append("image", file);
  if (team_name) form.append("team_name", team_name);
  form.append("lineup_type", lineup_type);

  return axios.post(`${BASE_URL}/api/squads/ocr/preview`, form, {
    headers: {
      "Content-Type": "multipart/form-data",
      ...(user_id ? { "X-User-Id": user_id } : {})
    }
  });
}

/**
 * Call /commit to bulk-insert validated rows.
 * Returns: { ok, created, created_names[], skipped[], errors[] }
 */
export async function ocrCommit({ team_name, lineup_type, rows, preview_id, user_id }) {
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
