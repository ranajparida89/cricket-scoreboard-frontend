// src/components/HomeHighlights.js
import React, { useEffect, useState } from "react";
import axios from "axios";
import "./HomeHighlights.css";

const API_BASE = "https://cricket-scoreboard-backend.onrender.com";

const HomeHighlights = () => {
  const [items, setItems] = useState([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        // 1) normal highlights for players
        const hlReq = axios.get(`${API_BASE}/api/home-highlights`);

        // 2) boards -> summary -> top_board
        const boardsReq = axios.get(`${API_BASE}/api/boards/analytics/boards`);

        const [hlRes, boardsRes] = await Promise.all([hlReq, boardsReq]);

        const baseHighlights = hlRes.data || [];
        const boards = boardsRes.data?.boards || [];

        let finalHighlights = [...baseHighlights];

        // if we have boards, call summary to know the best board by points
        if (boards.length) {
          const boardIdsCsv = boards.map((b) => b.board_id).join(",");
          try {
            const sumRes = await axios.get(
              `${API_BASE}/api/boards/analytics/summary`,
              {
                params: {
                  board_ids: boardIdsCsv,
                },
              }
            );

            const top = sumRes.data?.top_board;
            if (top) {
              finalHighlights.push({
                _synthetic: true,
                tag: "Best Board",
                title: top.board_name || "Top Board",
                meta: [
                  {
                    label: "Points",
                    value:
                      top.totals?.points ??
                      top.points ??
                      "-",
                  },
                  {
                    label: "Matches",
                    value:
                      top.totals?.matches ??
                      top.matches ??
                      "-",
                  },
                ],
              });
            }
          } catch (err) {
            console.error("Error fetching board summary", err);
          }
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
    setActiveIndex((prev) => (prev === 0 ? items.length - 1 : prev - 1));
  };

  const handleNext = () => {
    setActiveIndex((prev) => (prev === items.length - 1 ? 0 : prev + 1));
  };

  if (loading) {
    return (
      <div className="ce-hl-wrapper">
        <div className="ce-hl-card">
          <p>Loading highlights…</p>
        </div>
      </div>
    );
  }

  if (!items.length) {
    return (
      <div className="ce-hl-wrapper">
        <div className="ce-hl-card">
          <p>No highlights available.</p>
        </div>
      </div>
    );
  }

  const current = items[activeIndex];
  const displayTag = current.tag ? current.tag.split("(")[0].trim() : "";

  // drop technical/meta like "PLAYER ID"
  const displayMeta = Array.isArray(current.meta)
    ? current.meta.filter(
        (m) => m.label && !/player\s*id/i.test(m.label)
      )
    : [];

  return (
    <div className="ce-hl-wrapper">
      <button className="ce-hl-nav left" onClick={handlePrev}>
        &lt;
      </button>

      <div className="ce-hl-card">
        {/* tiny particle confetti */}
        <div className="ce-hl-confetti">
          {Array.from({ length: 110 }).map((_, i) => (
            <span
              key={i}
              className={`ce-confetti c-${(i % 5) + 1}`}
              style={{
                "--x": `${(i * 0.9) % 100}%`,
                "--delay": `${(i % 14) * 0.12}s`,
                "--duration": `${2.3 + (i % 5) * 0.25}s`,
              }}
            />
          ))}
        </div>

        <div className="ce-hl-content">
          {displayTag && <div className="ce-hl-tag">{displayTag}</div>}
          <h2 className="ce-hl-title">{current.title}</h2>

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
            className={`ce-hl-dot ${i === activeIndex ? "active" : ""}`}
            onClick={() => setActiveIndex(i)}
          />
        ))}
      </div>
    </div>
  );
};

export default HomeHighlights;
