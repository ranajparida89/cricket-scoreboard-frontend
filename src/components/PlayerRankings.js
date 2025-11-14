// src/components/PlayerRankings.js
// CrickEdge Player Rankings with MoM bonus + CSV/PDF export
// Requires: npm install jspdf

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
  const [activeTab, setActiveTab] = useState("batting"); // batting | bowling | allrounder
  const [matchType, setMatchType] = useState("TEST"); // TEST | ODI | T20
  const [rankingData, setRankingData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showInfo, setShowInfo] = useState(false);

  // subtle “pop while scrolling” effect
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

  // fetch rankings (rating already includes MoM bonus from backend)
  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const url = `https://cricket-scoreboard-backend.onrender.com/api/rankings/players?type=${activeTab}&match_type=${matchType}`;
        const res = await axios.get(url);
        const data = Array.isArray(res.data) ? res.data : [];
        // just sort again by rating (final rating already includes MoM)
        setRankingData(
          [...data].sort(
            (a, b) => Number(b.rating || 0) - Number(a.rating || 0)
          )
        );
      } catch (e) {
        console.error("Failed to fetch rankings:", e);
      } finally {
        setLoading(false);
      }
    })();
  }, [activeTab, matchType]);

  /* =========================================================
     CSV EXPORT (includes MoM columns)
  ========================================================= */
  const onExportCSV = () => {
    const rows = [
      [
        "Position",
        "Player",
        "Team",
        "Rating (Final)",
        "Index%",
        "MoM Awards",
        "MoM Bonus Points",
        "Base Rating (without MoM)",
      ],
    ];
    const top = Number(rankingData[0]?.rating || 0);

    rankingData.forEach((p, i) => {
      const rating = Number(p.rating || 0);
      const base = Number(p.base_rating || p.rating || 0);
      const momAwards = Number(p.mom_awards || 0);
      const momBonus = Number(p.mom_bonus || 0);
      const pct = top > 0 ? Math.round((rating / top) * 100) : 0;

      rows.push([
        i + 1,
        p.player_name,
        p.team_name,
        rating,
        pct,
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
     PDF EXPORT (simple tabular PDF with MoM info)
  ========================================================= */
  const onExportPDF = () => {
    const doc = new jsPDF("p", "mm", "a4");
    const marginLeft = 12;
    let y = 16;

    // header
    doc.setFontSize(14);
    doc.text(
      `CrickEdge Player Rankings - ${TAB_LABELS[activeTab]} (${matchType})`,
      marginLeft,
      y
    );
    y += 6;
    doc.setFontSize(10);
    doc.text(
      "Rating = Base performance rating + MoM bonus points",
      marginLeft,
      y
    );
    y += 8;

    // table header
    doc.setFontSize(9);
    doc.text("Pos", marginLeft, y);
    doc.text("Player", marginLeft + 12, y);
    doc.text("Team", marginLeft + 60, y);
    doc.text("Rating", marginLeft + 110, y);
    doc.text("MoM", marginLeft + 135, y);
    y += 4;

    const top = Number(rankingData[0]?.rating || 0);

    rankingData.forEach((p, i) => {
      if (y > 280) {
        doc.addPage();
        y = 16;
      }

      const rating = Number(p.rating || 0);
      const base = Number(p.base_rating || p.rating || 0);
      const momAwards = Number(p.mom_awards || 0);
      const momBonus = Number(p.mom_bonus || 0);
      const pct = top > 0 ? Math.round((rating / top) * 100) : 0;

      doc.text(String(i + 1), marginLeft, y);
      doc.text(String(p.player_name || ""), marginLeft + 12, y);
      doc.text(String(p.team_name || ""), marginLeft + 60, y);
      doc.text(`${rating} (${pct}%)`, marginLeft + 110, y);
      if (momAwards > 0) {
        doc.text(
          `+${momBonus} pts (${momAwards})`,
          marginLeft + 135,
          y
        );
      } else {
        doc.text("-", marginLeft + 135, y);
      }
      y += 4;
    });

    doc.save(`rankings_${activeTab}_${matchType}.pdf`);
  };

  const sorted = rankingData;
  const top3 = useMemo(() => sorted.slice(0, 3), [sorted]);
  const topRating = useMemo(
    () => Number(sorted[0]?.rating || 0),
    [sorted]
  );

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
          <button
            type="button"
            className="tool ghost"
            onClick={() => window.location.reload()}
          >
            ⟳ Refresh
          </button>
          <button
            type="button"
            className="tool ghost"
            onClick={onExportPDF}
          >
            ⧉ Export PDF
          </button>
          <button type="button" className="tool cta" onClick={onExportCSV}>
            ⤓ Export CSV
          </button>
        </div>
      </div>

      {/* Podium top-3 (dark tints) */}
      <section className="podium" aria-label="Top three players">
        {top3.map((p, i) => {
          const cls = i === 0 ? "gold" : i === 1 ? "silver" : "bronze";
          const medal = i === 0 ? "🥇" : i === 1 ? "🥈" : "🥉";
          const momBonus = Number(p.mom_bonus || 0);
          const momAwards = Number(p.mom_awards || 0);

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

              {momBonus > 0 && (
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

      {/* ===== Leaderboard-style GRID (not a <table>) ===== */}
      <div
        className={`lb-wrap ${isScrolling ? "is-scrolling" : ""}`}
        ref={tableWrapRef}
      >
        {/* Head */}
        <div className="lb-head" role="rowgroup">
          <div className="cell head num">Pos</div>
          <div className="cell head">Player</div>
          <div className="cell head">Team</div>
          <div className="cell head num">Rating</div>
          <div className="cell head">Index</div>
        </div>

        {/* Body */}
        <div className="lb-body" role="rowgroup">
          {loading
            ? [...Array(10)].map((_, i) => (
                <div className="lb-row sk" key={`sk-${i}`}>
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
                  <div className="cell">
                    <div className="rating-bar">
                      <span style={{ width: "30%" }} />
                      <em>—</em>
                    </div>
                  </div>
                </div>
              ))
            : sorted.map((p, i) => {
                const rating = Number(p.rating || 0);
                const pct =
                  topRating > 0 ? Math.max(2, (rating / topRating) * 100) : 0;
                const pctLabel = Math.round(pct);
                const smallMedal =
                  i < 3 ? (i === 0 ? "🥇" : i === 1 ? "🥈" : "🥉") : null;
                const momBonus = Number(p.mom_bonus || 0);

                return (
                  <div
                    className={`lb-row ${i < 3 ? "top" : ""}`}
                    key={p.player_name + i}
                    role="row"
                  >
                    <div className="cell num">{i + 1}</div>
                    <div className="cell player">
                      {smallMedal && (
                        <span className="mini-medal" aria-hidden>
                          {smallMedal}
                        </span>
                      )}
                      <strong>{p.player_name}</strong>
                    </div>
                    <div className="cell">{p.team_name}</div>
                    <div className="cell num">
                      {rating}
                      {momBonus > 0 && (
                        <span className="mom-chip">
                          +{momBonus} MoM
                        </span>
                      )}
                    </div>
                    <div className="cell">
                      <div className="rating-bar">
                        <span style={{ width: `${pct}%` }} />
                        <em>{pctLabel}%</em>
                      </div>
                    </div>
                  </div>
                );
              })}
        </div>
      </div>

      {/* Info modal */}
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
            <h3>About Player Rankings &amp; MoM Bonus</h3>
            <p>
              Category: <b>{TAB_LABELS[activeTab]}</b> · Format:{" "}
              <b>{matchType}</b>.
            </p>
            <p>
              Final rating shown here is:
              <br />
              <b>Final Rating = Base Rating + Man of the Match (MoM) Bonus</b>
            </p>

            <h4>Base Rating (from performance)</h4>
            <ul className="modal-bullets">
              <li>
                <b>Batting rating</b> = total runs × 1 +
                10 × fifties + 25 × hundreds
              </li>
              <li>
                <b>Bowling rating</b> = total wickets × 20
              </li>
              <li>
                <b>All-rounder rating</b> = (batting rating + bowling rating) ÷
                2
              </li>
            </ul>

            <h4>MoM Bonus (extra points)</h4>
            <p>Each Man of the Match increases the rating further:</p>
            <ul className="modal-bullets">
              <li>
                <b>TEST</b>: +40 pts per MoM for batting/bowling, +60 pts for
                all-rounders
              </li>
              <li>
                <b>ODI</b>: +30 pts per MoM for batting/bowling, +45 pts for
                all-rounders
              </li>
              <li>
                <b>T20</b>: +20 pts per MoM for batting/bowling, +30 pts for
                all-rounders
              </li>
            </ul>
            <p>
              On the leaderboard, you can see a{" "}
              <span className="mom-chip">+X MoM</span> tag next to the rating
              for players who have earned MoM bonus.
            </p>
            <ul className="modal-bullets">
              <li>Use tabs and format chips to change category/format.</li>
              <li>
                Use <b>Export CSV</b> or <b>Export PDF</b> to download the
                current rankings.
              </li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
};

export default PlayerRankings;
