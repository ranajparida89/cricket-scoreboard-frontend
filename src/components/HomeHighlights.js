import React, { useEffect, useState } from "react";
import axios from "axios";
import "./HomeHighlights.css";
import SidePhotoWall from "./SidePhotoWall";

const API_BASE = "https://cricket-scoreboard-backend.onrender.com";

const HomeHighlights = () => {
  const [items, setItems] = useState([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        // 1) player / general highlights
        const highlightsPromise = axios.get(
          `${API_BASE}/api/home-highlights`
        );

        // 2) board insight (optional slide)
        const boardInsightPromise = axios.get(
          `${API_BASE}/api/boards/analytics/home/top-board-insight`
        );

        const [hlRes, boardInsightRes] = await Promise.all([
          highlightsPromise,
          boardInsightPromise,
        ]);

        // ✅ FIX: backend returns { generated_at, highlights }
        const baseHighlights = Array.isArray(hlRes.data?.highlights)
          ? hlRes.data.highlights
          : [];

        const insight = boardInsightRes.data?.insight || null;

        const finalHighlights = [...baseHighlights];

        // optional board crown slide
        if (insight) {
          const meta = [
            {
              label: "Champion since Days",
              value: insight.days_at_top,
            },
          ];

          if (
            typeof insight.period_days === "number" &&
            !Number.isNaN(insight.period_days)
          ) {
            meta.push({
              label: "Period",
              value: `Last ${insight.period_days} days`,
            });
          }

          finalHighlights.push({
            tag: "Best Board",
            title: insight.board_name,
            subtitle: `Held the crown for ${insight.days_at_top} day(s) straight.`,
            meta,
          });
        }

        setItems(finalHighlights);
      } catch (err) {
        console.error("Error fetching highlights", err);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const handlePrev = () => {
    setActiveIndex((prev) =>
      prev === 0 ? items.length - 1 : prev - 1
    );
  };

  const handleNext = () => {
    setActiveIndex((prev) =>
      prev === items.length - 1 ? 0 : prev + 1
    );
  };

  const renderCard = (content) => (
    <div className="ce-hl-wrapper">
      <div className="ce-hl-card">{content}</div>
    </div>
  );

  if (loading) {
    return (
      <>
        <SidePhotoWall side="left" />
        <SidePhotoWall side="right" />
        {renderCard(<p>Loading highlights…</p>)}
      </>
    );
  }

  if (!items.length) {
    return (
      <>
        <SidePhotoWall side="left" />
        <SidePhotoWall side="right" />
        {renderCard(<p>No highlights available.</p>)}
      </>
    );
  }

  const current = items[activeIndex];
  const displayTag = current.tag
    ? current.tag.split("(")[0].trim()
    : "";

  // remove technical meta like Player ID
  const displayMeta = Array.isArray(current.meta)
    ? current.meta.filter(
        (m) => m.label && !/player\s*id/i.test(m.label)
      )
    : [];

  return (
    <>
      {/* 🎥 Cinematic side photo walls */}
      <SidePhotoWall side="left" />
      <SidePhotoWall side="right" />

      <div className="ce-hl-wrapper">
        <button className="ce-hl-nav left" onClick={handlePrev}>
          &lt;
        </button>

        <div className="ce-hl-card ce-hl-card-spot">
          <div className="ce-hl-spot-floor" />

          <div className="ce-hl-confetti">
            {Array.from({ length: 110 }).map((_, i) => (
              <span
                key={i}
                className={`ce-confetti c-${(i % 5) + 1}`}
                style={{
                  "--x": `${(i * 0.9) % 100}%`,
                  "--delay": `${(i % 18) * 0.18}s`,
                  "--duration": `${3 + (i % 6) * 0.28}s`,
                }}
              />
            ))}
          </div>

          <div className="ce-hl-content">
            {displayTag && (
              <div className="ce-hl-tag">{displayTag}</div>
            )}

            <h2 className="ce-hl-title">{current.title}</h2>

            {current.subtitle && (
              <p className="ce-hl-subtitle">{current.subtitle}</p>
            )}

            {displayMeta.length > 0 && (
              <div className="ce-hl-meta-grid">
                {displayMeta.map((m, i) => (
                  <div key={i} className="ce-hl-meta-item">
                    <span className="ce-hl-meta-label">{m.label}</span>
                    <span className="ce-hl-meta-value">{m.value}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <button className="ce-hl-nav right" onClick={handleNext}>
          &gt;
        </button>

        <div className="ce-hl-dots">
          {items.map((_, i) => (
            <span
              key={i}
              className={`ce-hl-dot ${
                i === activeIndex ? "active" : ""
              }`}
              onClick={() => setActiveIndex(i)}
            />
          ))}
        </div>
      </div>
    </>
  );
};

export default HomeHighlights;
