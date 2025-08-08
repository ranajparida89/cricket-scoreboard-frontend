// ✅ src/components/SidebarMenu.js
// ✅ [01-JULY-2025 Ranaj Parida | Admin-only "Manage Admins" menu item]

import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { FaUsers, FaPlus, FaChartLine, FaUserCheck, FaTimes } from "react-icons/fa";
import { FaRegNewspaper } from "react-icons/fa";
import { FaHandshake } from "react-icons/fa";
import { FaBrain } from "react-icons/fa";
import "./SidebarMenu.css";

const SidebarMenu = () => {
  // Sidebar toggle state
  const [isOpen, setIsOpen] = useState(false);
  // 01-JULY-2025 Ranaj Parida: Track admin state for menu rendering
  const [isAdmin, setIsAdmin] = useState(false);

  // Listen for toggleSidebar event
  useEffect(() => {
    const handleToggle = () => setIsOpen((prev) => !prev);
    window.addEventListener("toggleSidebar", handleToggle);
    return () => window.removeEventListener("toggleSidebar", handleToggle);
  }, []);

  // 01-JULY-2025 Ranaj Parida: Get admin state from localStorage (or context if you prefer)
  useEffect(() => {
    setIsAdmin(localStorage.getItem("isAdmin") === "true");
  }, []);

  // Close sidebar on link click or close icon
  const handleClose = () => setIsOpen(false);

  return (
    <div className={`sidebar-menu ${isOpen ? "open" : ""}`}>
      <div className="sidebar-header">
        <h4>📘 CrickEdge</h4>
        <button className="close-btn" onClick={handleClose}><FaTimes /></button>
      </div>
      <ul>
        <li><Link to="/add-player" onClick={handleClose}><FaPlus className="me-2" /> Add Player</Link></li>
        <li><Link to="/player-performance" onClick={handleClose}><FaUserCheck className="me-2" /> Add Player Performance</Link></li>
        <li><Link to="/player-stats" onClick={handleClose}><FaChartLine className="me-2" /> Player Stats</Link></li>
        <li><Link to="/squad-lineup" onClick={handleClose}><FaUsers className="me-2" /> Squad / Lineup</Link></li>
        <li><Link to="/add-upcoming-match" onClick={handleClose}><FaPlus className="me-2" /> Add Upcoming Match</Link></li>
        <li><Link to="/upcoming-matches" onClick={handleClose}><FaChartLine className="me-2" /> Upcoming Match Details</Link></li>
        <li><Link to="/player-rankings" onClick={handleClose}><FaChartLine className="me-2" /> 🏆 CrickEdge Rankings</Link></li>
        <li><Link to="/match-story" onClick={handleClose}><FaRegNewspaper className="me-2" /> Match Story</Link></li>  
        <li><Link to="/h2h-records" onClick={handleClose}><FaHandshake className="me-2" /> H2H Records</Link></li>
        <li><Link to="/smart-analyzer" onClick={handleClose}><FaBrain className="me-2" /> Smart Analyzer</Link></li>

                        <li>
              <Link to="/scheduler" onClick={handleClose}>
                <span role="img" aria-label="scheduler" style={{ marginRight: 6 }}>🗓️</span>
                Scheduler
              </Link>
            </li>

                      <li>
            <Link to="/team-distributor" onClick={handleClose}>
              <span role="img" aria-label="wheel" style={{ marginRight: 6 }}>🎡</span>
              Team Distributor
            </Link>
          </li>


        {/* 01-JULY-2025 Ranaj Parida: Only show for Admins */}
        {isAdmin && (
  <>
    <li>
      <Link to="/admin/manage" onClick={handleClose}>
        <FaUsers className="me-2" /> Manage Admins
      </Link>
    </li>
  </>
)}

<li>
  <Link to="/all-boards" onClick={handleClose}>
    <span role="img" aria-label="view" style={{ marginRight: 6 }}>📋</span>
    View Boards & Teams
  </Link>
</li>

<li>
  <Link to="/boards/analytics" onClick={handleClose}>
    <FaChartLine className="me-2" /> Board Analytics (Pro)
  </Link>
</li>


{isAdmin || localStorage.getItem("token") ? (
  <li>
  <Link to="/register-board" onClick={handleClose}>
    <span role="img" aria-label="create" style={{ marginRight: 6 }}>➕</span>
    Create New Board
  </Link>
</li>
) : null}

<li>
  <Link to="/gallery" onClick={handleClose}>
    <span role="img" aria-label="gallery" style={{ marginRight: 6 }}>🖼️</span>
    Gallery
  </Link>
</li>
      </ul>
    </div>
  );
};

export default SidebarMenu;
