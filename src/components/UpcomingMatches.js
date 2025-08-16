// ✅ src/components/UpcomingMatches.js
import React, { useEffect, useState } from "react";
import { getUpcomingMatchList } from "../services/api";
import { FaClock, FaCalendarAlt, FaGlobeAsia, FaSyncAlt } from "react-icons/fa";

export default function UpcomingMatches() {
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const fetchMatches = async () => {
    try {
      setLoading(true);
      setError(false);
      const data = await getUpcomingMatchList();
      setMatches(data || []);
    } catch (err) {
      console.error("Error fetching upcoming matches:", err);
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchMatches(); }, []);

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
  };

  return (
    <div style={styles.container} data-component="UpcomingMatches.list">
      <div style={styles.header}>
        <h2>📅 Upcoming Match Details</h2>
        <button onClick={fetchMatches} style={styles.refreshBtn}><FaSyncAlt /> Refresh</button>
      </div>

      {loading ? (
        <p style={styles.info}>Loading matches...</p>
      ) : error ? (
        <p style={styles.error}>Failed to load upcoming matches. Please try again.</p>
      ) : matches.length === 0 ? (
        <p style={styles.info}>No upcoming matches scheduled.</p>
      ) : (
        <div style={styles.cardGrid}>
          {matches.map((m, i) => (
            <div key={i} style={styles.card}>
              <h3 style={styles.title}>{m.match_name} ({m.match_type})</h3>
              <p><strong>Teams:</strong> {m.team_playing}</p>
              <p><FaGlobeAsia /> {m.location}</p>
              <p><FaCalendarAlt /> {formatDate(m.match_date)}</p>
              <p><FaClock /> {m.match_time} | <strong>{m.day_night} Match</strong></p>
              <p><strong>Series:</strong> {m.series_name}</p>
              <p>Status: <span style={styles.status(m.match_status)}>{m.match_status}</span></p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const styles = {
  container: { padding: "20px", color: "#fff" },
  header: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 },
  refreshBtn: { padding: "6px 14px", background: "#0d6efd", color: "#fff", border: "none", borderRadius: 5, cursor: "pointer" },
  cardGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 16 },
  card: { background: "#1e293b", padding: 15, borderRadius: 10, boxShadow: "0 4px 10px rgba(0,0,0,0.2)" },
  title: { marginBottom: 8, fontSize: 18 },
  info: { fontSize: 16, color: "#aaa" },
  error: { color: "#ff4d4f" },
  status: (type) => ({ color: type === "Scheduled" ? "#22c55e" : type === "Postponed" ? "#facc15" : "#ef4444", fontWeight: "bold" }),
};
