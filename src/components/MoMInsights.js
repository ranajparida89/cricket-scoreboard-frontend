import React, { useEffect, useState } from "react";
import axios from "axios";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import "./MoMInsights.css";

const API_BASE = "https://cricket-scoreboard-backend.onrender.com/api";

export default function MoMInsights() {
  const [records, setRecords] = useState([]);
  const [summary, setSummary] = useState([]);
  const [filters, setFilters] = useState({
    match_type: "",
    tournament_name: "",
    season_year: "",
    player: ""
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const perPage = 10;

  // ✅ Validation: prevent malformed year / inputs
  const validateFilters = () => {
    if (filters.season_year && !/^\d{4}$/.test(filters.season_year)) {
      setError("❌ Year must be in YYYY format");
      return false;
    }
    setError("");
    return true;
  };

  const fetchData = async () => {
    if (!validateFilters()) return;
    setLoading(true);
    try {
      const { data } = await axios.get(`${API_BASE}/mom-insights`, { params: filters });
      setSummary(data.summary);
      setRecords(data.records);
    } catch (err) {
      console.error(err);
      setError("Failed to fetch data. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleChange = (e) => setFilters({ ...filters, [e.target.name]: e.target.value });

  const paginatedRecords = records.slice((page - 1) * perPage, page * perPage);
  const totalPages = Math.ceil(records.length / perPage);

  return (
    <div className="mom-container">
      <h2 className="title">🏆 Man of the Match Insights</h2>

      <div className="filters">
        <select name="match_type" value={filters.match_type} onChange={handleChange}>
          <option value="">All Formats</option>
          <option value="T20">T20</option>
          <option value="ODI">ODI</option>
          <option value="Test">Test</option>
        </select>
        <input name="tournament_name" placeholder="Tournament" value={filters.tournament_name} onChange={handleChange}/>
        <input name="season_year" placeholder="Year (YYYY)" value={filters.season_year} onChange={handleChange}/>
        <input name="player" placeholder="Player" value={filters.player} onChange={handleChange}/>
        <button onClick={fetchData}>Analyze</button>
      </div>

      {error && <div className="error-box">{error}</div>}

      {loading ? (
        <div className="loading">Loading Insights...</div>
      ) : (
        <>
          {summary.length > 0 && (
            <>
              <h3 className="subtitle">🏅 Top Players by MoM Awards</h3>
              <div className="summary-grid">
                {summary.map((s, i) => (
                  <div key={i} className={`summary-card rank-${i+1}`}>
                    <span className="rank-badge">#{i + 1}</span>
                    <h4>{s.player}</h4>
                    <p>{s.count} Awards</p>
                    <small>{s.formats.join(", ")}</small>
                  </div>
                ))}
              </div>

              {/* ✅ Bar Chart Visualization */}
              <h3 className="subtitle">📊 MoM Count by Player</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={summary.slice(0, 10)} margin={{ top: 10, right: 20, bottom: 20, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                  <XAxis dataKey="player" tick={{ fill: "#ccc", fontSize: 12 }} />
                  <YAxis tick={{ fill: "#ccc" }} />
                  <Tooltip />
                  <Bar dataKey="count" fill="#00ffaa" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </>
          )}

          <h3 className="subtitle">📜 Detailed MoM Records</h3>
          {records.length === 0 ? (
            <p className="no-data">No records found for selected filters.</p>
          ) : (
            <>
              <table className="mom-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Match Name</th>
                    <th>Player</th>
                    <th>Reason</th>
                    <th>Format</th>
                    <th>Tournament</th>
                    <th>Year</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedRecords.map((r, i) => (
                    <tr key={i}>
                      <td>{r.match_date || "—"}</td>
                      <td>{r.match_name}</td>
                      <td>{r.player_name}</td>
                      <td>{r.reason}</td>
                      <td>{r.match_type}</td>
                      <td>{r.tournament_name}</td>
                      <td>{r.season_year}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* ✅ Pagination */}
              <div className="pagination">
                <button disabled={page === 1} onClick={() => setPage(page - 1)}>Prev</button>
                <span>Page {page} / {totalPages}</span>
                <button disabled={page === totalPages} onClick={() => setPage(page + 1)}>Next</button>
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}
