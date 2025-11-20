// src/components/PlayerRankings.js
// CrickEdge Player Rankings with MoM bonus + CSV/PDF export + Search + MoM filter
// Updated:
//  - When "MoM players only" is ON, fetches GLOBAL MoM leaderboard (all formats & roles)
//  - Global MoM view ignores Bat/Bowl/All-rounder tabs and TEST/ODI/T20 chips
//  - Global MoM is sorted by total MoM awards (highest first)
//  - CSV/PDF headers & filenames adapt in MoM-only mode
//  - Small info note added in modal
//  - [20-Nov-2025] Hero banner with #1 player's photo on the right
//      • Uses photo_key from backend
//      • Background gradient changes by format (TEST/ODI/T20)
//      • Works for normal & MoM-only modes
//  - [20-Nov-2025] Hero photo tuning:
//      • Better crop (centered) so heads are not cut
//      • Info icon aligned to banner’s top-right
//  - [20-Nov-2025] Hero photo blending:
//      • Gradient is background
//      • Photo is separate layer with mix-blend-mode
//      • White studio backgrounds pick up green/pink/blue tint

import React, { useEffect, useMemo, useRef, useState } from "react";
import axios from "axios";
import jsPDF from "jspdf";
import "./PlayerRankings.css";

const TAB_LABELS = {
  batting: "Batting",
  bowling: "Bowling",
  allrounder: "All-rounders",
};

const API_BASE = "https://cricket-scoreboard-backend.onrender.com";

/* ----------------------------------------------------------
   Hero helpers (background + labels)
---------------------------------------------------------- */

const heroRoleLabel = (tabKey) => {
  if (tabKey === "bowling") return "BOWLING";
  if (tabKey === "allrounder") return "ALL-ROUNDERS";
  return "BATTING";
};

// Only returns gradient; photo is handled by .pr-hero-photo
const buildHeroBackgroundStyle = (matchType, momOnly) => {
  const mt = (matchType || "").toUpperCase();
  let gradient;

  if (momOnly) {
    gradient =
      "linear-gradient(90deg, #171a2c 0%, #3d1d5a 40%, rgba(23,26,44,0) 85%)";
  } else if (mt === "TEST") {
    gradient =
      "linear-gradient(90deg, #e3f6e5 0%, #189b3d 40%, rgba(24,155,61,0) 85%)";
  } else if (mt === "T20") {
    gradient =
      "linear-gradient(90deg, #ffe3ff 0%, #b1028c 40%, rgba(177,2,140,0) 85%)";
  } else {
    // ODI default
    gradient =
      "linear-gradient(90deg, #e4f1ff 0%, #0474ff 40%, rgba(4,116,255,0) 85%)";
  }

  return {
    backgroundRepeat: "no-repeat",
    backgroundSize: "cover",
    backgroundPosition: "left center",
    backgroundImage: gradient,
  };
};

const PlayerRankings = () => {
  const [activeTab, setActiveTab] = useState("batting");
  const [matchType, setMatchType] = useState("TEST");
  const [rankingData, setRankingData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showInfo, setShowInfo] = useState(false);
  const [searchText, setSearchText] = useState(""); // 🔍 search
  const [momOnly, setMomOnly] = useState(false); // ⭐ MoM-only filter

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

  // fetch rankings
  useEffect(() => {
    const fetchRankings = async () => {
      try {
        setLoading(true);

        let data = [];

        if (momOnly) {
          // ⭐ GLOBAL MoM leaderboard – ignores tab & format
          const url = `${API_BASE}/api/rankings/players/mom-leaderboard`;
          const res = await axios.get(url);
          data = Array.isArray(res.data) ? res.data : [];

          // sort by total MoM awards just to be extra safe
          data.sort(
            (a, b) => Number(b.mom_awards || 0) - Number(a.mom_awards || 0)
          );
        } else {
          // Normal per-format rating view
          const url = `${API_BASE}/api/rankings/players?type=${activeTab}&match_type=${matchType}`;
          const res = await axios.get(url);
          data = Array.isArray(res.data) ? res.data : [];

          data.sort((a, b) => Number(b.rating || 0) - Number(a.rating || 0));
        }

        setRankingData(data);
      } catch (e) {
        console.error("Failed to fetch rankings:", e);
      } finally {
        setLoading(false);
      }
    };

    fetchRankings();
  }, [activeTab, matchType, momOnly]);

  /* =========================================================
     CSV EXPORT
  ========================================================= */
  const onExportCSV = () => {
    let rows = [];

    if (momOnly) {
      // Global MoM leaderboard export
      rows = [["Position", "Player", "Team", "Total MoM Awards", "Formats"]];

      rankingData.forEach((p, i) => {
        const awards = Number(p.mom_awards || 0);
        const formats = Array.isArray(p.formats) ? p.formats.join(" / ") : "";
        rows.push([i + 1, p.player_name, p.team_name, awards, formats]);
      });
    } else {
      // Normal rating export
      rows = [
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
    }

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
    a.download = momOnly
      ? "mom_leaderboard_all_formats.csv"
      : `rankings_${activeTab}_${matchType}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  /* =========================================================
     PDF EXPORT
  ========================================================= */
  const onExportPDF = () => {
    const doc = new jsPDF("p", "mm", "a4");
    const left = 12;
    let y = 16;

    if (momOnly) {
      // Global MoM leaderboard PDF
      doc.setFontSize(14);
      doc.text("CrickEdge MoM Leaderboard (All formats & roles)", left, y);

      y += 8;
      doc.setFontSize(10);
      doc.text("Players sorted by total Man of the Match awards.", left, y);

      y += 10;
      doc.setFontSize(9);

      doc.text("Pos", left, y);
      doc.text("Player", left + 12, y);
      doc.text("Team", left + 60, y);
      doc.text("Total MoM", left + 110, y);

      y += 4;

      rankingData.forEach((p, i) => {
        if (y > 280) {
          doc.addPage();
          y = 16;
        }

        const awards = Number(p.mom_awards || 0);

        doc.text(String(i + 1), left, y);
        doc.text(p.player_name || "", left + 12, y);
        doc.text(p.team_name || "", left + 60, y);
        doc.text(String(awards), left + 110, y);

        y += 4;
      });

      doc.save("mom_leaderboard_all_formats.pdf");
      return;
    }

    // Normal rankings PDF
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

  // #1 player for current view (after search)
  const topPlayer = useMemo(() => {
    if (!filtered || filtered.length === 0) return null;
    return filtered[0];
  }, [filtered]);

  // 🆕 Photo URL for hero blend
  const topPlayerPhotoUrl = useMemo(() => {
    if (!topPlayer || !topPlayer.photo_key) return null;
    const encoded = encodeURIComponent(topPlayer.photo_key);
    return `/player-photos/${encoded}`;
  }, [topPlayer]);

  const handleSearchClick = () => {
    // filtering is already live; this keeps button functional if needed
    setSearchText((prev) => prev.trim());
  };

  const handleMomToggle = (e) => {
    const checked = e.target.checked;
    setMomOnly(checked);
  };

  return (
    <div className="pr-wrap">
      {/* Hero strip with background + #1 player's photo */}
      <div
        className={`pr-hero ${momOnly ? "pr-hero-mom" : ""}`}
        style={buildHeroBackgroundStyle(matchType, momOnly)}
      >
        {/* Photo layer on the right, blended with gradient */}
        {topPlayerPhotoUrl && (
          <div
            className="pr-hero-photo"
            style={{ backgroundImage: `url("${topPlayerPhotoUrl}")` }}
          />
        )}

        {/* Info icon pinned to banner corner */}
        <button
          className="pr-info"
          onClick={() => setShowInfo(true)}
          title="About ranking"
        >
          i
        </button>

        <div className="pr-hero-inner">
          <header className="pr-header">
            <h2 className="pr-title">
              <span className="bat">🏏</span>{" "}
              {momOnly
                ? "CrickEdge MoM Leaderboard"
                : "CrickEdge Player Rankings"}
            </h2>
          </header>

          <div className="pr-hero-sub">
            <div className="pr-hero-eyebrow">
              {momOnly
                ? "GLOBAL MOM LEADERBOARD"
                : `MEN'S ${matchType} ${heroRoleLabel(activeTab)}`}
            </div>

            {topPlayer && (
              <div className="pr-hero-topline">
                <span className="pr-hero-rank">#1</span>
                <span className="pr-hero-name">
                  {topPlayer.player_name || ""}
                </span>
                <span className="pr-hero-team">
                  {topPlayer.team_name ? `· ${topPlayer.team_name}` : ""}
                </span>
                <span className="pr-hero-rating">
                  {momOnly
                    ? `· ${Number(topPlayer.mom_awards || 0)} MoM`
                    : `· Rating ${Number(topPlayer.rating || 0)}`}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="pr-controls">
        {/* compact tabs */}
        <div className={`seg ${momOnly ? "seg-disabled" : ""}`}>
          {Object.keys(TAB_LABELS).map((k) => (
            <button
              key={k}
              className={`seg-btn ${activeTab === k ? "active" : ""}`}
              onClick={() => !momOnly && setActiveTab(k)}
              disabled={momOnly}
            >
              {TAB_LABELS[k]}
            </button>
          ))}
        </div>

        {/* format chips */}
        <div className={`chips ${momOnly ? "chips-disabled" : ""}`}>
          {["TEST", "ODI", "T20"].map((f) => (
            <button
              key={f}
              className={`chip ${matchType === f ? "active" : ""}`}
              onClick={() => !momOnly && setMatchType(f)}
              disabled={momOnly}
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
              onChange={handleMomToggle}
            />
            <span>MoM players only</span>
          </label>
          <button
            className="tool ghost"
            onClick={() => window.location.reload()}
          >
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

          // In MoM-only mode, show MoM awards as the “big number”
          const bigNumber = momOnly ? momAwards : p.rating;

          return (
            <article className={`podium-card ${cls}`} key={p.player_name + i}>
              <div className="sheen" />
              <div className="medal-badge">{medal}</div>
              <div className="podium-rank">#{i + 1}</div>
              <div className="podium-name">{p.player_name}</div>
              <div className="podium-team">{p.team_name}</div>
              <div className="podium-rating">
                {bigNumber}
                {momOnly && <span className="podium-sub"> MoM</span>}
              </div>

              {!momOnly && momAwards > 0 && (
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
        {/* Head */}
        <div className="lb-head">
          <div className="cell head num">Pos</div>
          <div className="cell head">Player</div>
          <div className="cell head">Team</div>
          <div className="cell head num">
            {momOnly ? "Total MoM" : "Rating"}
          </div>
          <div className="cell head num">
            {momOnly ? "Formats" : "MoM"}
          </div>
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
                const formats = Array.isArray(p.formats)
                  ? p.formats.join(" / ")
                  : "";

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
                      {momOnly ? momAwards : rating}
                      {!momOnly && momBonus > 0 && (
                        <span className="mom-chip">+{momBonus}</span>
                      )}
                    </div>

                    <div className="cell num">
                      {momOnly
                        ? formats || "—"
                        : momAwards > 0
                        ? `${momAwards} MoM`
                        : "No MoM yet"}
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

            {!momOnly && (
              <>
                <p>
                  The table shows <b>Pos, Player, Team, Rating</b> and{" "}
                  <b>MoM (Man of the Match) count</b> for the selected
                  category and format.
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
                  <b>“X MoM”</b> (number of awards) or <b>“No MoM yet”</b> if
                  the player hasn’t received any award so far.
                </p>
              </>
            )}

            {momOnly && (
              <>
                <p>
                  You are viewing the <b>global MoM leaderboard</b>. This
                  view ignores batting/bowling/all-rounder tabs and match
                  formats.
                </p>
                <p>
                  Players are ranked purely by{" "}
                  <b>total Man of the Match awards</b> collected across all
                  formats (Test, ODI, T20).
                </p>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default PlayerRankings;
