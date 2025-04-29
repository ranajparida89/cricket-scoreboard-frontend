// ✅ src/components/UpcomingMatches.js
// ✅ Author: Ranaj Parida | Advanced UI for Viewing Scheduled Matches

import React, { useEffect, useState } from "react";
import { getUpcomingMatchList } from "../services/api";
import { FaClock, FaCalendarAlt, FaGlobeAsia, FaSyncAlt } from "react-icons/fa";

const UpcomingMatches = () => {
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

  useEffect(() => {
    fetchMatches();
  }, []);

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
  };

  return (
    <div style={styles.container}>
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
          {matches.map((match, index) => (
            <div key={index} style={styles.card}>
              <h3 style={styles.title}>{match.match_name} ({match.match_type})</h3>
              <p><strong>Teams:</strong> {match.team_playing}</p>
              <p><FaGlobeAsia /> {match.location}</p>
              <p><FaCalendarAlt /> {formatDate(match.match_date)}</p>
              <p><FaClock /> {match.match_time} | <strong>{match.day_night} Match</strong></p>
              <p><strong>Series:</strong> {match.series_name}</p>
              <p>Status: <span style={styles.status(match.match_status)}>{match.match_status}</span></p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const styles = {
  container: {
    padding: "20px",
    color: "#fff",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "20px",
  },
  refreshBtn: {
    padding: "6px 14px",
    background: "#0d6efd",
    color: "#fff",
    border: "none",
    borderRadius: "5px",
    cursor: "pointer",
  },
  cardGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
    gap: "16px",
  },
  card: {
    background: "#1e293b",
    padding: "15px",
    borderRadius: "10px",
    boxShadow: "0 4px 10px rgba(0,0,0,0.2)",
    transition: "transform 0.2s",
  },
  title: {
    marginBottom: "8px",
    fontSize: "18px",
  },
  info: {
    fontSize: "16px",
    color: "#aaa",
  },
  error: {
    color: "#ff4d4f",
  },
  status: (type) => ({
    color:
      type === "Scheduled"
        ? "#22c55e"
        : type === "Postponed"
        ? "#facc15"
        : "#ef4444",
    fontWeight: "bold",
  }),
};

export default UpcomingMatches;
