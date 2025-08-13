import React, { useEffect, useMemo, useRef, useState } from "react";
import axios from "axios";
import "./PlayerRankings.css";

const TAB_LABELS = {
  batting: "Batting",
  bowling: "Bowling",
  allrounder: "All-rounders",
};

const PlayerRankings = () => {
  const [activeTab, setActiveTab] = useState("batting"); // batting | bowling | allrounder
  const [matchType, setMatchType] = useState("TEST");    // TEST | ODI | T20
  const [rankingData, setRankingData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showInfo, setShowInfo] = useState(false);

  // for the “pop a little while scrolling” effect
  const [isScrolling, setIsScrolling] = useState(false);
  const tableWrapRef = useRef(null);
  const scrollTimerRef = useRef(null);

  useEffect(() => {
    const el = tableWrapRef.current;
    if (!el) return;
    const onScroll = () => {
      setIsScrolling(true);
      if (scrollTimerRef.current) clearTimeout(scrollTimerRef.current);
      scrollTimerRef.current = setTimeout(() => setIsScrolling(false), 160);
    };
    el.addEventListener("scroll", onScroll);
    return () => el.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    fetchRankings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, matchType]);

  const fetchRankings = async () => {
    try {
      setLoading(true);
      const url = `https://cricket-scoreboard-backend.onrender.com/api/rankings/players?type=${activeTab}&match_type=${matchType}`;
      const res = await axios.get(url);
      const data = Array.isArray(res.data) ? res.data : [];
      setRankingData(
        [...data].sort((a, b) => Number(b.rating || 0) - Number(a.rating || 0))
      );
    } catch (err) {
      console.error("Failed to fetch rankings:", err);
    } finally {
      setLoading(false);
    }
  };

  const onExportCSV = () => {
    const rows = [["Position", "Player", "Team", "Rating", "Index%"]];
    const top = Number(rankingData[0]?.rating || 0);
    rankingData.forEach((p, i) => {
      const pct = top > 0 ? Math.round((Number(p.rating || 0) / top) * 100) : 0;
      rows.push([i + 1, p.player_name, p.team_name, p.rating, pct]);
    });
    const csv = rows
      .map(r => r.map(String).map(s => `"${s.replace(/"/g,'""')}"`).join(","))
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `rankings_${activeTab}_${matchType}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const sorted = rankingData;
  const top3 = useMemo(() => sorted.slice(0, 3), [sorted]);
  const topRating = useMemo(() => Number(sorted[0]?.rating || 0), [sorted]);

  return (
    <div className="pr-wrap">
      {/* Header */}
      <header className="pr-header">
        <h2 className="pr-title">
          <span className="bat">🏏</span> CrickEdge Player Rankings
        </h2>

        <button
          type="button"
          className="pr-info"
          aria-label="About player rankings"
          onClick={() => setShowInfo(true)}
          title="What is this?"
        >
          i
        </button>
      </header>

      {/* Controls */}
      <div className="pr-controls">
        <div className="seg">
          {Object.keys(TAB_LABELS).map((key) => (
            <button
              key={key}
              type="button"
              className={`seg-btn ${activeTab === key ? "active" : ""}`}
              onClick={() => setActiveTab(key)}
            >
              {key === "batting" && "🏏 "}
              {key === "bowling" && "🎯 "}
              {key === "allrounder" && "🧩 "}
              {TAB_LABELS[key]}
            </button>
          ))}
        </div>

        <div className="chips">
          {["TEST", "ODI", "T20"].map((f) => (
            <button
              key={f}
              type="button"
              className={`chip ${matchType === f ? "active" : ""}`}
              onClick={() => setMatchType(f)}
            >
              {f}
            </button>
          ))}
        </div>

        <div className="tools">
          <button type="button" className="tool ghost" onClick={fetchRankings}>
            ⟳ Refresh
          </button>
          <button type="button" className="tool cta" onClick={onExportCSV}>
            ⤓ Export CSV
          </button>
        </div>
      </div>

      {/* Podium Top-3 (dark tints) */}
      <section className="podium" aria-label="Top three players">
        {top3.length === 0 && (
          <div className="empty">No data available for this selection.</div>
        )}

        {top3.map((p, i) => {
          const cls = i === 0 ? "gold" : i === 1 ? "silver" : "bronze";
          const medal = i === 0 ? "🥇" : i === 1 ? "🥈" : "🥉";
          return (
            <article key={p.player_name + i} className={`podium-card ${cls}`}>
              <div className="sheen" aria-hidden />
              <div className="medal-badge">{medal}</div>
              <div className="podium-rank">#{i + 1}</div>
              <div className="podium-name">{p.player_name}</div>
              <div className="podium-team">{p.team_name}</div>
              <div className="podium-rating">
                {Number(p.rating || 0).toLocaleString()}
              </div>
            </article>
          );
        })}
      </section>

      {/* Table */}
      <div
        className={`rk-table-wrap ${isScrolling ? "is-scrolling" : ""}`}
        ref={tableWrapRef}
      >
        <table className="ranking-table" role="table" aria-label="All rankings">
          <thead>
            <tr>
              <th className="num">Pos</th>
              <th>Player</th>
              <th>Team</th>
              <th className="num">Rating</th>
              <th className="bar">Index</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              [...Array(8)].map((_, i) => (
                <tr key={`sk-${i}`} className="sk-row">
                  <td className="num">—</td>
                  <td><span className="sk" /></td>
                  <td><span className="sk" /></td>
                  <td className="num"><span className="sk sk-num" /></td>
                  <td className="bar"><span className="sk sk-bar" /></td>
                </tr>
              ))
            ) : (
              sorted.map((p, i) => {
                const rating = Number(p.rating || 0);
                const pct = topRating > 0 ? Math.max(2, (rating / topRating) * 100) : 0;
                const pctLabel = Math.round(pct);
                const smallMedal = i < 3 ? (i === 0 ? "🥇" : i === 1 ? "🥈" : "🥉") : null;

                return (
                  <tr key={p.player_name + i} className={i < 3 ? "toprow" : ""}>
                    <td className="num">{i + 1}</td>
                    <td className="cell-player">
                      {smallMedal && <span className="mini-medal" aria-hidden>{smallMedal}</span>}
                      <strong>{p.player_name}</strong>
                    </td>
                    <td>{p.team_name}</td>
                    <td className="num">{rating}</td>
                    <td className="bar">
                      <div className="rating-bar">
                        <span style={{ width: `${pct}%` }} />
                        <em>{pctLabel}%</em>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Info Modal */}
      {showInfo && (
        <div className="pr-modal" role="dialog" aria-modal="true">
          <div className="pr-modal-card">
            <button
              className="pr-modal-close"
              onClick={() => setShowInfo(false)}
              aria-label="Close"
            >
              ✖
            </button>
            <h3>About Player Rankings</h3>
            <p>
              This page lists <b>{TAB_LABELS[activeTab]}</b> rankings for{" "}
              <b>{matchType}</b>. The top cards show the best three players
              (dark tinted medals). In the table, <b>Index</b> shows each rating
              as a percentage of the current #1.
            </p>
            <ul className="modal-bullets">
              <li>Switch category with the tabs.</li>
              <li>Toggle Test/ODI/T20 with the chips.</li>
              <li>Hover rows for a 3D lift; scrolling gives a subtle pop effect.</li>
              <li>Use <b>Refresh</b> and <b>Export CSV</b> on the right.</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
};

export default PlayerRankings;
