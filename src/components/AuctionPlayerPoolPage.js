// src/components/AuctionPlayerPoolPage.js
// Shows all players currently in the global auction player pool

import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { listPlayerPool } from "../services/auctionApi";
import "./AuctionPlayerPoolPage.css";

const SKILLS = ["Batsman", "Bowler", "Allrounder", "WicketKeeper/Batsman"];
const CATEGORIES = ["Legend", "Platinum", "Gold"];

const AuctionPlayerPoolPage = () => {
  const { auctionId } = useParams();
  const navigate = useNavigate();

  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [skillFilter, setSkillFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [countryFilter, setCountryFilter] = useState("");

  const loadPool = async () => {
    try {
      setLoading(true);
      setError("");

      const data = await listPlayerPool();

      // ✅ Support both shapes: array or { players: [...] }
      const playersArray = Array.isArray(data)
        ? data
        : data?.players || data?.data || [];

      setPlayers(playersArray || []);
    } catch (err) {
      console.error(err);
      setError(
        err?.response?.data?.error ||
          err?.message ||
          "Failed to load player pool."
      );
      setPlayers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPool();
  }, []);

  // FILTER LOGIC
  const filteredPlayers = players.filter((p) => {
    const name = (p.playerName || "").toLowerCase();
    if (search && !name.includes(search.toLowerCase())) return false;
    if (skillFilter && p.skillType !== skillFilter) return false;
    if (categoryFilter && p.category !== categoryFilter) return false;
    if (countryFilter && p.country !== countryFilter) return false;
    return true;
  });

  const countries = [...new Set(players.map((p) => p.country))].sort();

  return (
    <div className="pool-page">
      <div className="pool-header">
        <h1>Player Pool</h1>

        <div className="pool-header-actions">
          <button
            className="btn-outline"
            onClick={() => navigate(`/auction/${auctionId}/admin`)}
          >
            ← Back to Admin Console
          </button>

          <button className="btn-outline" onClick={loadPool}>
            ⟳ Refresh
          </button>
        </div>
      </div>

      {error && <div className="pool-alert error">{error}</div>}

      {/* FILTER BAR */}
      <div className="pool-filter-bar">
        <input
          type="text"
          placeholder="Search player name..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <select
          value={countryFilter}
          onChange={(e) => setCountryFilter(e.target.value)}
        >
          <option value="">Country</option>
          {countries.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>

        <select
          value={skillFilter}
          onChange={(e) => setSkillFilter(e.target.value)}
        >
          <option value="">Skill</option>
          {SKILLS.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>

        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
        >
          <option value="">Category</option>
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>

      {/* TABLE */}
      <div className="pool-table-wrap">
        {loading ? (
          <div className="pool-empty">Loading player pool...</div>
        ) : filteredPlayers.length === 0 ? (
          <div className="pool-empty">No players found.</div>
        ) : (
          <table className="pool-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Player Name</th>
                <th>Country</th>
                <th>Skill</th>
                <th>Category</th>
                <th>Base Bid</th>
              </tr>
            </thead>
            <tbody>
              {filteredPlayers.map((p, idx) => (
                <tr
                  key={
                    p.playerId ||
                    p.playerCode ||
                    `${p.playerName}-${idx}`
                  }
                >
                  <td>{idx + 1}</td>
                  <td>{p.playerName}</td>
                  <td>{p.country}</td>
                  <td>{p.skillType}</td>
                  <td>{p.category}</td>
                  <td>{p.baseBidAmount ?? p.bidAmount} cr</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default AuctionPlayerPoolPage;
