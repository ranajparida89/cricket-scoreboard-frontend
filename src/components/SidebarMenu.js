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
import { FaWallet } from "react-icons/fa";

const SidebarMenu = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  /* ✅ Sidebar section expand states */
  const [tournamentOpen, setTournamentOpen] = useState(false);
  const [fundsOpen, setFundsOpen] = useState(false);
  const [analyticsOpen, setAnalyticsOpen] = useState(false);

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

        {/* PLAYER MODULES */}

        <li>
          <Link to="/player-performance" onClick={handleClose}>
            <FaUserCheck /> Add Player Performance
          </Link>
        </li>

        <li>
          <Link to="/player-stats" onClick={handleClose}>
            <FaChartLine /> Player Stats
          </Link>
        </li>

        <li>
          <Link to="/player-rankings" onClick={handleClose}>
            🏆 CrickEdge Rankings
          </Link>
        </li>

        <li>
          <Link to="/player-report-card" onClick={handleClose}>
            Player Report Card
          </Link>
        </li>

        <li>
          <Link to="/squad-lineup" onClick={handleClose}>
            Squad / Lineup
          </Link>
        </li>

        {/* MATCH TOOLS */}

        <li>
          <Link to="/match-story" onClick={handleClose}>
            Match Story
          </Link>
        </li>

        <li>
          <Link to="/h2h-records" onClick={handleClose}>
            H2H Records
          </Link>
        </li>

        <li>
          <Link to="/smart-analyzer" onClick={handleClose}>
            Smart Analyzer
          </Link>
        </li>

        <li>
          <Link to="/pitch-randomizer" onClick={handleClose}>
            Pitch Randomizer
          </Link>
        </li>

        <li>
          <Link to="/scheduler" onClick={handleClose}>
            Match Fixture & Scheduler
          </Link>
        </li>

        <li>
          <Link to="/team-distributor" onClick={handleClose}>
            Team Distributor
          </Link>
        </li>

        {/* AUCTION */}

        {isAdmin && (

          <li>
            <Link to="/player-auction" onClick={handleClose}>
              Player Auction
            </Link>
          </li>

        )}

        <li>
          <Link to="/live-auction" onClick={handleClose}>
            Live Auction
          </Link>
        </li>

        <li>
          <Link to="/live-match" onClick={handleClose}>
            Live Match
          </Link>
        </li>

        {/* UPCOMING */}

        {isAdmin && (

          <li>
            <Link to="/add-upcoming-match" onClick={handleClose}>
              Add Upcoming Match
            </Link>
          </li>

        )}

        <li>
          <Link to="/upcoming-matches" onClick={handleClose}>
            Upcoming Match Details
          </Link>
        </li>


        {/* TOURNAMENT SECTION */}

        <li
          className="sidebar-section"
          onClick={() => setTournamentOpen(!tournamentOpen)}
        >

          🏆 Tournament Management {tournamentOpen ? "▼" : "▶"}

        </li>

        {tournamentOpen && (

          <>

            {isAdmin && (

              <li>
                <Link to="/create-tournament" onClick={handleClose}>
                  Create Tournament
                </Link>
              </li>

            )}

            <li>
              <Link to="/tournament-registration" onClick={handleClose}>
                Tournament Registration
              </Link>
            </li>

            <li>
              <Link to="/tournament-interest" onClick={handleClose}>
                Tournament Interest
              </Link>
            </li>

            <li>
              <Link to="/admin/tournaments" onClick={handleClose}>
                Tournament Admin
              </Link>
            </li>

            <li>
              <Link to="/tournament-points" onClick={handleClose}>
                Tournament Points
              </Link>
            </li>

          </>

        )}


        {/* BOARD */}

        <li>
          <Link to="/all-boards" onClick={handleClose}>
            View Boards & Teams
          </Link>
        </li>

        <li>
          <Link to="/boards/analytics" onClick={handleClose}>
            Board Analytics
          </Link>
        </li>


        {/* FUNDS SECTION */}

        <li
          className="sidebar-section"
          onClick={() => setFundsOpen(!fundsOpen)}
        >

          💰 CrickEdge Funds {fundsOpen ? "▼" : "▶"}

        </li>

        {fundsOpen && (

          <>

            <li>
              <Link to="/funds-wallet" onClick={handleClose}>
                Funds Wallet
              </Link>
            </li>

            <li>
              <Link to="/funds-analytics" onClick={handleClose}>
                Funds Analytics
              </Link>
            </li>

            <li>
              <Link to="/reward-banks" onClick={handleClose}>
                Reward Pools
              </Link>
            </li>

            <li>
              <Link to="/funds-leaderboard" onClick={handleClose}>
                Funds Leaderboard
              </Link>
            </li>

            {isAdmin && (

              <>

                <li>
                  <Link to="/failed-registrations" onClick={handleClose}>
                    Failed Registrations
                  </Link>
                </li>

                <li>
                  <Link to="/admin/funds-alerts" onClick={handleClose}>
                    Funds Alerts
                  </Link>
                </li>

                <li>
                  <Link to="/admin/match-rewards" onClick={handleClose}>
                    Match Reward Audit
                  </Link>
                </li>

              </>

            )}

          </>

        )}


        {/* OTHER */}

        <li>
          <Link to="/season-leaderboard" onClick={handleClose}>
            Season Leaderboard
          </Link>
        </li>

        <li>
          <Link to="/rules-and-regulations" onClick={handleClose}>
            Rules & Regulations
          </Link>
        </li>

        <li>
          <Link to="/mom-insights" onClick={handleClose}>
            MoM Insights
          </Link>
        </li>


        {/* ADMIN */}

        {isAdmin && (

          <>

            <li>
              <Link to="/admin/manage" onClick={handleClose}>
                Manage Admins
              </Link>
            </li>

            <li>
              <Link to="/register-board" onClick={handleClose}>
                Create New Board
              </Link>
            </li>

          </>

        )}

        <li>
          <Link to="/gallery" onClick={handleClose}>
            Gallery
          </Link>
        </li>

      </ul>
    </div>
  );
};

export default SidebarMenu;
