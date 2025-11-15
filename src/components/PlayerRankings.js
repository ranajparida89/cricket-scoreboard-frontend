// src/components/PlayerRankings.js
// CrickEdge Player Rankings with MoM bonus + CSV/PDF export + Search + MoM filter
// Updated: Impact column removed, MoM text, compact tabs, search button, MoM-only toggle

import React, { useEffect, useMemo, useRef, useState } from "react";
import axios from "axios";
import jsPDF from "jspdf";
import "./PlayerRankings.css";

const TAB_LABELS = {
  batting: "Batting",
  bowling: "Bowling",
  allrounder: "All-rounders",
};

const PlayerRankings = () => {
  const [activeTab, setActiveTab] = useState("batting");
  const [matchType, setMatchType] = useState("TEST");
  const [rankingData, setRankingData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showInfo, setShowInfo] = useState(false);
  const [searchText, setSearchText] = useState(""); // 🔍 search
  const [momOnly, setMomOnly] = useState(false);    // ⭐ MoM-only filter

  const [isScrolling, setIsScrolling] = useState(false);
  const tableWrapRef = useRef(null);
  const scrollTimerRef = useRef(null);

  // scrolling pop effect
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

  // fetch rankings (final rating already contains MoM bonus)
  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const url = `https://cricket-scoreboard-backend.onrender.com/api/rankings/players?type=${activeTab}&match_type=${matchType}&mom_only=${
          momOnly ? "true" : "false"
        }`;
        const res = await axios.get(url);
        const data = Array.isArray(res.data) ? res.data : [];
        setRankingData(
          [...data].sort((a, b) => Number(b.rating || 0) - Number(a.rating || 0))
        );
      } catch (e) {
        console.error("Failed to fetch rankings:", e);
      } finally {
        setLoading(false);
      }
    })();
  }, [activeTab, matchType, momOnly]);

  /* =========================================================
     CSV EXPORT  (Impact removed)
  ========================================================= */
  const onExportCSV = () => {
    const rows = [
      [
        "Position",
        "Player",
        "Team",
        "Rating (Final)",
        "MoM Awards",
        "MoM Bonus Points",
        "Base Rating",
      ],
    ];

    rankingData.forEach((p, i) => {
      const rating = Number(p.rating || 0);
      const base = Number(p.base_rating || 0);
      const momAwards = Number(p.mom_awards || 0);
      const momBonus = Number(p.mom_bonus || 0);

      rows.push([
        i + 1,
        p.player_name,
        p.team_name,
        rating,
        momAwards,
        momBonus,
        base,
      ]);
    });

    const csv = rows
      .map((r) =>
        r
          .map(String)
          .map((s) => `"${s.replace(/"/g, '""')}"`)
          .join(",")
      )
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `rankings_${activeTab}_${matchType}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  /* =========================================================
     PDF EXPORT  (Impact removed)
  ========================================================= */
  const onExportPDF = () => {
    const doc = new jsPDF("p", "mm", "a4");
    const left = 12;
    let y = 16;

    doc.setFontSize(14);
    doc.text(
      `CrickEdge Player Rankings - ${TAB_LABELS[activeTab]} (${matchType})`,
      left,
      y
    );

    y += 8;
    doc.setFontSize(10);
    doc.text("Final Rating = Base Rating + MoM Bonus Points", left, y);

    y += 10;
    doc.setFontSize(9);

    doc.text("Pos", left, y);
    doc.text("Player", left + 12, y);
    doc.text("Team", left + 60, y);
    doc.text("Rating", left + 110, y);
    doc.text("MoM", left + 140, y);

    y += 4;

    rankingData.forEach((p, i) => {
      if (y > 280) {
        doc.addPage();
        y = 16;
      }

      const rating = Number(p.rating || 0);
      const momAwards = Number(p.mom_awards || 0);
      const momBonus = Number(p.mom_bonus || 0);

      doc.text(String(i + 1), left, y);
      doc.text(p.player_name || "", left + 12, y);
      doc.text(p.team_name || "", left + 60, y);
      doc.text(String(rating), left + 110, y);

      if (momAwards > 0) {
        doc.text(`+${momBonus} pts (${momAwards} MoM)`, left + 140, y);
      } else {
        doc.text("No MoM yet", left + 140, y);
      }

      y += 4;
    });

    doc.save(`rankings_${activeTab}_${matchType}.pdf`);
  };

  const sorted = rankingData;
  const top3 = sorted.slice(0, 3);

  // 🔍 Search filter (player or team)
  const filtered = useMemo(() => {
    const q = searchText.trim().toLowerCase();
    if (!q) return sorted;
    return sorted.filter((p) => {
      const name = (p.player_name || "").toLowerCase();
      const team = (p.team_name || "").toLowerCase();
      return name.includes(q) || team.includes(q);
    });
  }, [sorted, searchText]);

  const handleSearchClick = () => {
    // filtering is already live; this keeps button functional if needed
    setSearchText((prev) => prev.trim());
  };

  return (
    <div className="pr-wrap">
      {/* Header */}
      <header className="pr-header">
        <h2 className="pr-title">
          <span className="bat">🏏</span> CrickEdge Player Rankings
        </h2>
        <button
          className="pr-info"
          onClick={() => setShowInfo(true)}
          title="About ranking"
        >
          i
        </button>
      </header>

      {/* Controls */}
      <div className="pr-controls">
        {/* compact tabs */}
        <div className="seg">
          {Object.keys(TAB_LABELS).map((k) => (
            <button
              key={k}
              className={`seg-btn ${activeTab === k ? "active" : ""}`}
              onClick={() => setActiveTab(k)}
            >
              {TAB_LABELS[k]}
            </button>
          ))}
        </div>

        {/* format chips */}
        <div className="chips">
          {["TEST", "ODI", "T20"].map((f) => (
            <button
              key={f}
              className={`chip ${matchType === f ? "active" : ""}`}
              onClick={() => setMatchType(f)}
            >
              {f}
            </button>
          ))}
        </div>

        {/* 🔍 Search bar + button */}
        <div className="pr-search">
          <span className="pr-search-icon">🔍</span>
          <input
            type="text"
            placeholder="Search player or team..."
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleSearchClick();
            }}
          />
          <button
            type="button"
            className="pr-search-btn"
            onClick={handleSearchClick}
          >
            Search
          </button>
        </div>

        {/* tools + MoM-only toggle */}
        <div className="tools">
          <label className="mom-toggle">
            <input
              type="checkbox"
              checked={momOnly}
              onChange={(e) => setMomOnly(e.target.checked)}
            />
            <span>MoM players only</span>
          </label>
          <button className="tool ghost" onClick={() => window.location.reload()}>
            ⟳ Refresh
          </button>
          <button className="tool ghost" onClick={onExportPDF}>
            ⧉ PDF
          </button>
          <button className="tool cta" onClick={onExportCSV}>
            ⤓ CSV
          </button>
        </div>
      </div>

      {/* Podium */}
      <section className="podium">
        {top3.map((p, i) => {
          const cls = i === 0 ? "gold" : i === 1 ? "silver" : "bronze";
          const medal = i === 0 ? "🥇" : i === 1 ? "🥈" : "🥉";
          const momBonus = Number(p.mom_bonus || 0);
          const momAwards = Number(p.mom_awards || 0);

          return (
            <article className={`podium-card ${cls}`} key={p.player_name + i}>
              <div className="sheen" />
              <div className="medal-badge">{medal}</div>
              <div className="podium-rank">#{i + 1}</div>
              <div className="podium-name">{p.player_name}</div>
              <div className="podium-team">{p.team_name}</div>
              <div className="podium-rating">{p.rating}</div>

              {momAwards > 0 && (
                <div className="podium-mom">
                  ⭐ MoM bonus: +{momBonus} pts{" "}
                  <span>
                    ({momAwards} award{momAwards > 1 ? "s" : ""})
                  </span>
                </div>
              )}
            </article>
          );
        })}
      </section>

      {/* Leaderboard */}
      <div
        className={`lb-wrap ${isScrolling ? "is-scrolling" : ""}`}
        ref={tableWrapRef}
      >
        {/* 5 columns: Pos | Player | Team | Rating | MoM */}
        <div className="lb-head">
          <div className="cell head num">Pos</div>
          <div className="cell head">Player</div>
          <div className="cell head">Team</div>
          <div className="cell head num">Rating</div>
          <div className="cell head num">MoM</div>
        </div>

        <div className="lb-body">
          {loading
            ? [...Array(10)].map((_, i) => (
                <div className="lb-row sk" key={i}>
                  <div className="cell num">—</div>
                  <div className="cell">
                    <span className="skbar w160" />
                  </div>
                  <div className="cell">
                    <span className="skbar w120" />
                  </div>
                  <div className="cell num">
                    <span className="skbar w60" />
                  </div>
                  <div className="cell num">
                    <span className="skbar w60" />
                  </div>
                </div>
              ))
            : filtered.map((p, i) => {
                const rating = Number(p.rating || 0);
                const momAwards = Number(p.mom_awards || 0);
                const momBonus = Number(p.mom_bonus || 0);

                return (
                  <div
                    className={`lb-row ${i < 3 ? "top" : ""}`}
                    key={p.player_name + i}
                  >
                    <div className="cell num">{i + 1}</div>
                    <div className="cell player">
                      <strong>{p.player_name}</strong>
                    </div>
                    <div className="cell">{p.team_name}</div>

                    <div className="cell num">
                      {rating}
                      {momBonus > 0 && (
                        <span className="mom-chip">+{momBonus}</span>
                      )}
                    </div>

                    <div className="cell num">
                      {momAwards > 0 ? `${momAwards} MoM` : "No MoM yet"}
                    </div>
                  </div>
                );
              })}
        </div>
      </div>

      {/* Info Modal */}
      {showInfo && (
        <div className="pr-modal">
          <div className="pr-modal-card">
            <button
              className="pr-modal-close"
              onClick={() => setShowInfo(false)}
            >
              ✖
            </button>
            <h3>About Rankings &amp; MoM Bonus</h3>

            <p>
              The table shows <b>Pos, Player, Team, Rating</b> and{" "}
              <b>MoM (Man of the Match) count</b> for the selected category and
              format.
            </p>

            <p>
              <b>Final Rating = Base Rating + MoM Bonus</b>
            </p>

            <h4>Base Rating</h4>
            <ul>
              <li>Batting = runs ×1 + 10×fifties + 25×hundreds</li>
              <li>Bowling = wickets ×20</li>
              <li>All-rounder = (batting + bowling) ÷ 2</li>
            </ul>

            <h4>MoM Bonus</h4>
            <ul>
              <li>TEST → +40 (Bat/Bowl), +60 (All-rounder) per MoM</li>
              <li>ODI → +30 (Bat/Bowl), +45 (All-rounder) per MoM</li>
              <li>T20 → +20 (Bat/Bowl), +30 (All-rounder) per MoM</li>
            </ul>

            <p>
              In the table, the <b>MoM</b> column shows either{" "}
              <b>“X MoM”</b> (number of awards) or <b>“No MoM yet”</b> if the
              player hasn’t received any award so far.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default PlayerRankings;
