// MatchStory.js – Premium redesign (JS + CSS)
// Libraries used: react-icons (already in your app)

import React, { useEffect, useMemo, useState } from "react";
import "./MatchStory.css";
import {
  FaRegNewspaper,
  FaInfoCircle,
  FaSearch,
  FaCopy,
  FaCalendarAlt,
} from "react-icons/fa";
import { GiCrossedSwords } from "react-icons/gi";

const API_URL =
  "https://cricket-scoreboard-backend.onrender.com/api/match-stories";

const FORMATS = ["ALL", "ODI", "T20", "TEST"];

export default function MatchStory() {
  const [matchStories, setMatchStories] = useState([]);
  const [selectedFormat, setSelectedFormat] = useState("ALL");
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expanded, setExpanded] = useState({});
  const [infoOpen, setInfoOpen] = useState(false);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await fetch(API_URL);
        if (!res.ok) throw new Error("Network error");
        const data = await res.json();
        if (mounted) setMatchStories(Array.isArray(data) ? data : []);
      } catch (e) {
        if (mounted) setError("Failed to fetch match stories. Please try again.");
        // eslint-disable-next-line no-console
        console.error("Match stories fetch error:", e);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  // counts for tabs
  const counts = useMemo(() => {
    const c = { ALL: matchStories.length, ODI: 0, T20: 0, TEST: 0 };
    matchStories.forEach((s) => {
      const k = String(s.type || "").toUpperCase();
      if (c[k] !== undefined) c[k] += 1;
    });
    return c;
  }, [matchStories]);

  // filtered + sorted stories
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return matchStories
      .filter(
        (s) =>
          selectedFormat === "ALL" ||
          String(s.type || "").toUpperCase() === selectedFormat
      )
      .filter((s) =>
        q
          ? `${s.title ?? ""} ${s.story ?? ""}`.toLowerCase().includes(q)
          : true
      )
      .sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
      );
  }, [matchStories, selectedFormat, query]);

  const toggleExpand = (id) =>
    setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));

  const copyStory = async (s) => {
    try {
      await navigator.clipboard.writeText(`${s.title}\n${s.story}`);
    } catch {
      // ignore
    }
  };

  const FormatBadge = ({ fmt }) => {
    const f = String(fmt || "").toUpperCase();
    return <span className={`badge badge-${f.toLowerCase()}`}>{f}</span>;
  };

  return (
    <div className="msg-wrap">
      {/* Header */}
      <div className="msg-head">
        <h2 className="msg-title shimmer-gold">
          <FaRegNewspaper className="ico" />
          Match Story Generator
        </h2>
        <p className="msg-sub">Auto-generated recaps for ODI, T20 & Test.</p>
      </div>

      {/* Controls */}
      <div className="msg-controls">
        <div className="tabs">
          {FORMATS.map((f) => (
            <button
              key={f}
              className={`tab ${selectedFormat === f ? "active" : ""}`}
              onClick={() => setSelectedFormat(f)}
            >
              {f !== "ALL" ? <FormatBadge fmt={f} /> : <span className="badge">ALL</span>}
              <span className="tab-count">{counts[f] ?? 0}</span>
            </button>
          ))}
        </div>

        <div className="search">
          <FaSearch className="search-ico" />
          <input
            className="search-input"
            placeholder="Search team or text…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="grid">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="card skeleton">
              <div className="sk-line w40" />
              <div className="sk-line w75" />
              <div className="sk-line w100" />
              <div className="sk-line w90" />
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="error-card">{error}</div>
      ) : filtered.length === 0 ? (
        <div className="empty-card">No stories found.</div>
      ) : (
        <div className="grid">
          {filtered.map((story, idx) => (
            <div
              key={story.id ?? idx}
              className="card card-gold"
              style={{ animationDelay: `${idx * 50}ms` }}
            >
              <div className="card-top">
                <div className="left">
                  <FormatBadge fmt={story.type} />
                  <span className="datechip">
                    <FaCalendarAlt />{" "}
                    {new Date(story.date).toLocaleDateString()}
                  </span>
                </div>

                <button
                  className="icon-btn"
                  title="Copy"
                  onClick={() => copyStory(story)}
                  aria-label="Copy story"
                >
                  <FaCopy />
                </button>
              </div>

              <h3 className="card-title">
                <GiCrossedSwords className="sword" /> {story.title}
              </h3>

              <div
                className={`card-text ${
                  expanded[story.id] ? "" : "clamp-5"
                }`}
              >
                {story.story}
              </div>

              <div className="card-actions">
                <button
                  className="btn-ghost"
                  onClick={() => toggleExpand(story.id)}
                >
                  {expanded[story.id] ? "Show less" : "Read more"}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Floating Info button */}
      <button
        className="float-info golden-glow"
        onClick={() => setInfoOpen(true)}
        title="About Match Story"
        aria-label="About Match Story"
      >
        <FaInfoCircle />
      </button>

      {/* Modal */}
      {infoOpen && (
        <div className="modal" onClick={() => setInfoOpen(false)}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="modal-head">
              <FaRegNewspaper />
              <span>About Match Story Generator</span>
            </div>
            <ul className="modal-list">
              <li>Filter by format using the tabs (counts live update).</li>
              <li>Use the search box to find teams or keywords.</li>
              <li>Click the copy icon to share a story.</li>
              <li>“Read more” expands longer summaries.</li>
            </ul>
            <div className="modal-actions">
              <button className="btn-primary" onClick={() => setInfoOpen(false)}>
                Got it
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
