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
    const fetchHighlights = async () => {
      try {
        const res = await axios.get(`${API_BASE}/api/home-highlights`);
        setItems(res.data || []);
      } catch (err) {
        console.error("Error fetching highlights", err);
      } finally {
        setLoading(false);
      }
    };
    fetchHighlights();
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

  return (
    <div className="ce-hl-wrapper">
      <button className="ce-hl-nav left" onClick={handlePrev}>
        &lt;
      </button>

      <div className="ce-hl-card">
        {/* thin confetti strips */}
        <div className="ce-hl-confetti">
          {Array.from({ length: 55 }).map((_, i) => (
            <span key={i} className={`ce-confetti c-${(i % 5) + 1}`} style={{ "--x": `${i * 1.8}%`, "--d": `${(i % 7) * 0.4}s` }} />
          ))}
        </div>

        <div className="ce-hl-content">
          {displayTag && <div className="ce-hl-tag">{displayTag}</div>}
          <h2 className="ce-hl-title">{current.title}</h2>
          {current.subtitle && (
            <p className="ce-hl-subtitle">{current.subtitle}</p>
          )}

          {current.meta && current.meta.length > 0 && (
            <div className="ce-hl-meta-grid">
              {current.meta.map((m, i) => (
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
