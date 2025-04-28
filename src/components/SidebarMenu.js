// ✅ src/components/SidebarMenu.js
// ✅ [Ranaj Parida - 2025-04-23 | Enhanced with toggleSidebar listener + mobile close handling]

import React, { useEffect, useState } from "react"; // ✅ Added useState/useEffect
import { Link } from "react-router-dom";
import { FaUsers, FaPlus, FaChartLine, FaUserCheck, FaTimes } from "react-icons/fa";
import "./SidebarMenu.css";

const SidebarMenu = () => {
  // ✅ Local state for toggling sidebar visibility
  const [isOpen, setIsOpen] = useState(false);

  // ✅ Listen for custom event dispatched from Navbar.js
  useEffect(() => {
    const handleToggle = () => setIsOpen((prev) => !prev);
    window.addEventListener("toggleSidebar", handleToggle);
    return () => window.removeEventListener("toggleSidebar", handleToggle);
  }, []);

  // ✅ Close sidebar on link click or ❌ close icon
  const handleClose = () => setIsOpen(false);

  return (
    <div className={`sidebar-menu ${isOpen ? "open" : ""}`}>
      <div className="sidebar-header">
        <h4>📘 CrickEdge</h4>
        <button className="close-btn" onClick={handleClose}><FaTimes /></button>
      </div>
      <ul>
        <li><Link to="/add-player" onClick={handleClose}><FaPlus className="me-2" /> Add Player</Link></li>
        <li><Link to="/player-performance" onClick={handleClose}><FaUserCheck className="me-2" /> Player Performance</Link></li>
        <li><Link to="/player-stats" onClick={handleClose}><FaChartLine className="me-2" /> Player Stats</Link></li>
        <li><Link to="/squad-lineup" onClick={handleClose}><FaUsers className="me-2" /> Squad / Lineup</Link></li>
        <li><Link to="/qualification-scenario" onClick={handleClose}><FaChartLine className="me-2" /> Qualification Scenario</Link> {/* NEW */}</li>
      </ul>
    </div>
  );
};

export default SidebarMenu;
