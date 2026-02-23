// ✅ src/components/SidebarMenu.js
// ✅ [01-JUL-2025 Ranaj Parida | Admin-only "Manage Admins" menu item]
// ✅ [04-NOV-2025 Ranaj Parida | Added "Man of the Match Insights" module + Squad/Lineup restored safely]
// ✅ [27-NOV-2025 Ranaj Parida | Added "Crickedge Player Report Card" module]
// ✅ [30-NOV-2025 Ranaj Parida | Add Upcoming Match visible for Admin only]

import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  FaUsers,
  FaPlus,
  FaChartLine,
  FaUserCheck,
  FaTimes,
  FaDiceD20,      // 🎯 Pitch Randomizer icon
  FaMedal,        // 🏅 MoM Insights
  FaPeopleArrows, // 👥 Squad/Lineup icon
  FaIdCard,       // 🪪 Player Report Card
  FaGavel,        // 💰 Player Auction
} from "react-icons/fa";
import { FaRegNewspaper } from "react-icons/fa";
import { FaHandshake } from "react-icons/fa";
import { FaBrain } from "react-icons/fa";
import { FaBook } from "react-icons/fa"; // 📘 Rules & Regulations
import "./SidebarMenu.css";

const SidebarMenu = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  // ✅ Listen for global sidebar toggle event
  useEffect(() => {
    const handleToggle = () => setIsOpen((prev) => !prev);
    window.addEventListener("toggleSidebar", handleToggle);
    return () => window.removeEventListener("toggleSidebar", handleToggle);
  }, []);

  // ✅ Load admin flag
  useEffect(() => {
    setIsAdmin(localStorage.getItem("isAdmin") === "true");
  }, []);

  const handleClose = () => setIsOpen(false);

  return (
    <div className={`sidebar-menu ${isOpen ? "open" : ""}`}>
      <div className="sidebar-header">
        <h4>CrickEdge</h4>
        <button className="close-btn" onClick={handleClose}>
          <FaTimes />
        </button>
      </div>

      <ul>
        {/* 🧩 Player Modules */}
        <li>
          <Link to="/player-performance" onClick={handleClose}>
            <FaUserCheck className="me-2" /> Add Player Performance
          </Link>
        </li>
        <li>
          <Link to="/player-stats" onClick={handleClose}>
            <FaChartLine className="me-2" /> Player Stats
          </Link>
        </li>
        <li>
          <Link to="/player-rankings" onClick={handleClose}>
            <FaChartLine className="me-2" /> 🏆 CrickEdge Rankings
          </Link>
        </li>
        <li>
          <Link to="/player-report-card" onClick={handleClose}>
            <FaIdCard className="me-2 text-warning" /> Player Report Card
          </Link>
        </li>

        {/* 👥 Squad / Lineup */}
        <li>
          <Link to="/squad-lineup" onClick={handleClose}>
            <FaPeopleArrows className="me-2 text-info" /> Squad / Lineup
          </Link>
        </li>

        {/* 🧠 Analyzer + Head-to-Head */}
        <li>
          <Link to="/match-story" onClick={handleClose}>
            <FaRegNewspaper className="me-2" /> Match Story
          </Link>
        </li>
        <li>
          <Link to="/h2h-records" onClick={handleClose}>
            <FaHandshake className="me-2" /> H2H Records
          </Link>
        </li>
        <li>
          <Link to="/smart-analyzer" onClick={handleClose}>
            <FaBrain className="me-2" /> Smart Analyzer
          </Link>
        </li>

        {/* 🎯 Pitch + Scheduler Tools */}
        <li>
          <Link to="/pitch-randomizer" onClick={handleClose}>
            <FaDiceD20 className="me-2 text-success" /> Pitch Randomizer
          </Link>
        </li>
       <li>
            <Link to="/scheduler" onClick={handleClose}>
              <span role="img" aria-label="scheduler" style={{ marginRight: 6 }}>
                🗓️
              </span>
              <span className="glow-text">
                Match Fixture & Scheduler
              </span>
            </Link>
          </li>
        <li>
          <Link to="/team-distributor" onClick={handleClose}>
            <span role="img" aria-label="wheel" style={{ marginRight: 6 }}>
              🎡
            </span>
            Team Distributor
          </Link>
                  </li>
          {/* 💰 Player Auction (Admin Only) */}
          {isAdmin && (
            <li>
              <Link to="/player-auction" onClick={handleClose}>
                <FaGavel className="me-2 text-warning" /> Player Auction
              </Link>
            </li>
          )}

        {/* 🧮 Upcoming Matches */}
        {isAdmin && (
          <li>
            <Link to="/add-upcoming-match" onClick={handleClose}>
              <FaPlus className="me-2" /> Add Upcoming Match
            </Link>
          </li>
        )}
        <li>
          <Link to="/upcoming-matches" onClick={handleClose}>
            <FaChartLine className="me-2" /> Upcoming Match Details
          </Link>
        </li>

        {/* 🏏 Boards & Analytics */}
        <li>
          <Link to="/all-boards" onClick={handleClose}>
            <span role="img" aria-label="view" style={{ marginRight: 6 }}>
              📋
            </span>
            View Boards & Teams
          </Link>
        </li>
        <li>
          <Link to="/boards/analytics" onClick={handleClose}>
            <FaChartLine className="me-2" /> Board Analytics (Pro)
          </Link>
        </li>
        <li>
          <Link to="/tournament-points" onClick={handleClose}>
            <FaChartLine className="me-2" /> Tournament Points
          </Link>
        </li>

                <li>
          <Link to="/season-leaderboard" onClick={handleClose}>
            <FaChartLine className="me-2 text-success" /> Season Leaderboard
          </Link>
        </li>
               
            <li>
      <Link to="/rules-and-regulations" onClick={handleClose}>
        <FaBook className="me-2 text-primary" /> Rules & Regulations
      </Link>
    </li>

        {/* ✅ NEW MODULE – Man of the Match Insights */}
        <li>
          <Link to="/mom-insights" onClick={handleClose}>
            <FaMedal className="me-2 text-warning" /> MoM Insights
          </Link>
        </li>

        {/* 🧰 Admin-only Section */}
        {isAdmin && (
          <>
            <li>
              <Link to="/admin/manage" onClick={handleClose}>
                <FaUsers className="me-2" /> Manage Admins
              </Link>
            </li>
            <li>
              <Link to="/register-board" onClick={handleClose}>
                <span
                  role="img"
                  aria-label="create"
                  style={{ marginRight: 6 }}
                >
                  ➕
                </span>
                Create New Board
              </Link>
            </li>
          </>
        )}

        {/* 🎨 Gallery */}
        <li>
          <Link to="/gallery" onClick={handleClose}>
            <span role="img" aria-label="gallery" style={{ marginRight: 6 }}>
              🖼️
            </span>
            Gallery
          </Link>
        </li>
      </ul>
    </div>
  );
};

export default SidebarMenu;
