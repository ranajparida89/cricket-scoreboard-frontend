// ✅ src/components/SidebarMenu.js
// ✅ [Ranaj Parida - 2025-04-23 | Enhanced with toggleSidebar listener + mobile close handling]

import React, { useEffect, useState } from "react"; // ✅ Added useState/useEffect
import { Link } from "react-router-dom";
import { FaUsers, FaPlus, FaChartLine, FaUserCheck, FaTimes } from "react-icons/fa";
import { FaRegNewspaper } from "react-icons/fa"; // added for matchstory 14MAY2025 Ranaj Parida
import { FaHandshake } from "react-icons/fa"; // for head to head comprision 15 MAY 2025 Ranaj Parida
import { FaBrain } from "react-icons/fa";

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
        <li><Link to="/player-performance" onClick={handleClose}><FaUserCheck className="me-2" /> Add Player Performance</Link></li>
        <li><Link to="/player-stats" onClick={handleClose}><FaChartLine className="me-2" /> Player Stats</Link></li>
        <li><Link to="/squad-lineup" onClick={handleClose}><FaUsers className="me-2" /> Squad / Lineup</Link></li>
        <li><Link to="/add-upcoming-match" onClick={handleClose}><FaPlus className="me-2" /> Add Upcoming Match</Link></li>
        <li><Link to="/upcoming-matches" onClick={handleClose}><FaChartLine className="me-2" /> Upcoming Match Details</Link> {/* NEW */}</li>
        <li><Link to="/player-rankings" onClick={handleClose}><FaChartLine className="me-2" /> 🏆 CrickEdge Rankings</Link></li>
        <li><Link to="/match-story" onClick={handleClose}><FaRegNewspaper className="me-2" /> Match Story</Link></li>  
        <li><Link to="/h2h-records" onClick={handleClose}><FaHandshake className="me-2" /> H2H Records</Link></li> {/* for h2h */}
        <li><Link to="/smart-analyzer" onClick={handleClose}><FaBrain className="me-2" /> Smart Analyzer</Link></li> {/* for AI module */}



     


      </ul>
    </div>
  );
};

export default SidebarMenu;

// <li><Link to="/player-rankings" onClick={handleClose}><FaChartLine className="me-2" /> 🏆 CrickEdge Rankings</Link></li>

// <li><Link to="/qualification-scenario" onClick={handleClose}><FaChartLine className="me-2" /> Qualification Scenario</Link> {/* NEW */}</li>