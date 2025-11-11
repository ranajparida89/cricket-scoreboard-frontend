import React, { useEffect, useState } from "react";
import axios from "axios";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import "./MoMInsights.css";

const API_BASE = "https://cricket-scoreboard-backend.onrender.com/api";

export default function MoMInsights() {
  const [records, setRecords] = useState([]);
  const [summary, setSummary] = useState([]);

  // dropdown data from backend
  const [matchTypes, setMatchTypes] = useState([]);
  const [tournaments, setTournaments] = useState([]);
  const [seasons, setSeasons] = useState([]);

  // current filters
  const [filters, setFilters] = useState({
    match_type: "",
    tournament_name: "",
    season_year: "",
    player: "",
  });

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const perPage = 10;

  // 👉 helper: make ISO strings pretty
  const formatDate = (value) => {
    if (!value) return "—";
    const d = new Date(value);
    if (isNaN(d.getTime())) return value; // fallback if backend sends weird thing
    return d.toLocaleString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }); // e.g. 10 Nov 2025, 00:00
  };

  const fetchMeta = async () => {
    try {
      const { data } = await axios.get(`${API_BASE}/mom-insights/meta`);
      setMatchTypes(data.match_types || []);
      setTournaments(data.tournaments || []);
      setSeasons(data.seasons || []);
    } catch (err) {
      console.error("MoM meta error:", err);
      setError("Failed to load filter options.");
    }
  };

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
      const { data } = await axios.get(`${API_BASE}/mom-insights`, {
        params: filters,
      });
      setSummary(data.summary || []);
      setRecords(data.records || []);
      setPage(1);
    } catch (err) {
      console.error(err);
      setError("Failed to fetch data. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    (async () => {
      await fetchMeta();
      await fetchData();
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  const paginatedRecords = records.slice((page - 1) * perPage, page * perPage);
  const totalPages = Math.ceil(records.length / perPage) || 1;

  return (
    <div className="mom-container">
      <h2 className="title">🏆 Man of the Match Insights</h2>

      {/* Filters */}
      <div className="filters">
        <select
          name="match_type"
          value={filters.match_type}
          onChange={handleChange}
        >
          <option value="">All Formats</option>
          {(matchTypes || []).map((mt) => (
            <option key={mt} value={mt}>
              {mt}
            </option>
          ))}
        </select>

        <select
          name="tournament_name"
          value={filters.tournament_name}
          onChange={handleChange}
        >
          <option value="">All Tournaments</option>
          {(tournaments || []).map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>

        <select
          name="season_year"
          value={filters.season_year}
          onChange={handleChange}
        >
          <option value="">All Seasons</option>
          {(seasons || []).map((y) => (
            <option key={y} value={y}>
              {y}
            </option>
          ))}
        </select>

        <input
          name="player"
          placeholder="Player"
          value={filters.player}
          onChange={handleChange}
        />

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
                  <div key={i} className={`summary-card rank-${i + 1}`}>
                    <span className="rank-badge">#{i + 1}</span>
                    <h4>{s.player}</h4>
                    <p>{s.count} Awards</p>
                    {s.formats && s.formats.length > 0 && (
                      <small>{s.formats.join(", ")}</small>
                    )}
                  </div>
                ))}
              </div>

              <h3 className="subtitle">📊 MoM Count by Player</h3>
              <div className="chart-wrapper">
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart
                    data={summary.slice(0, 10)}
                    margin={{ top: 10, right: 20, bottom: 20, left: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                    <XAxis
                      dataKey="player"
                      tick={{ fill: "#ccc", fontSize: 12 }}
                      interval={0}
                      angle={-20}
                      textAnchor="end"
                      height={60}
                    />
                    <YAxis tick={{ fill: "#ccc" }} />
                    <Tooltip />
                    <Bar dataKey="count" fill="#00ffaa" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </>
          )}

          <h3 className="subtitle">📜 Detailed MoM Records</h3>
          {records.length === 0 ? (
            <p className="no-data">No records found for selected filters.</p>
          ) : (
            <>
              <div className="mom-table-wrapper">
                <table className="mom-table mom-table-pro">
                  <thead>
                    <tr>
                      <th>Date &amp; Time</th>
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
                        <td className="mom-date-cell">
                          {formatDate(r.match_date)}
                        </td>
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
              </div>

              <div className="pagination">
                <button
                  disabled={page === 1}
                  onClick={() => setPage((p) => p - 1)}
                >
                  Prev
                </button>
                <span>
                  Page {page} / {totalPages}
                </span>
                <button
                  disabled={page === totalPages}
                  onClick={() => setPage((p) => p + 1)}
                >
                  Next
                </button>
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}
