// ✅ src/components/Navbar.js
// ✅ [Ranaj Parida - 2025-04-21 | Final Fix: Add 📘 Test Rankings in More menu without affecting other menus]
// ✅ [Ranaj Parida - 2025-04-22 | Show Logged-in Username with Ribbon Badge in Navbar (All Devices)]

import React, { useEffect, useState } from "react"; // ✅ Added useEffect/useState for login detection
import { Navbar, Nav, Container, Button, NavDropdown } from "react-bootstrap";
import { Link } from "react-router-dom";
import { playSound } from "../utils/playSound"; // ✅ Sound utility
import "../styles/theme.css"; // ✅ [Added for emoji hover styles]

const AppNavbar = ({ onAuthClick }) => {
  const [loggedInUser, setLoggedInUser] = useState(null); // ✅ [2025-04-22] For showing user name on top-right

  // ✅ Fetch from localStorage (on mount)
  useEffect(() => {
    const user = localStorage.getItem("user");
    if (user) {
      const parsed = JSON.parse(user);
      setLoggedInUser(parsed.first_name || parsed.email?.split("@")[0]);
    }
  }, []);
      // ✅ [Ranaj Parida - 22-Apr-2025 | Show Logged-in Username with Verified Ribbon]
        const user = JSON.parse(localStorage.getItem("user"));
        const firstName = user?.first_name || null;

  return (
    <Navbar
      bg="dark"
      variant="dark"
      expand="lg"
      className="px-3 py-2 shadow-sm sticky-top"
      style={{ zIndex: 1030 }}
    >
      <Container fluid>
        <Navbar.Brand
          as={Link}
          to="/"
          className="fw-bold fs-4 hover-slide-emoji"
          onClick={() => playSound("click")}
          onMouseEnter={() => playSound("hover")}
        >
          🏏 CrickEdge
        </Navbar.Brand>

        <Navbar.Toggle aria-controls="navbarScroll" />

        <Navbar.Collapse id="navbarScroll" style={{ overflow: "visible" }}>
          <Nav className="me-auto my-2 my-lg-0" navbarScroll>
            <Nav.Link
              as={Link}
              to="/matches"
              className="hover-slide-emoji"
              onClick={() => playSound("click")}
              onMouseEnter={() => playSound("hover")}
            >
              Matches
            </Nav.Link>

            <Nav.Link
              as={Link}
              to="/leaderboard"
              className="hover-slide-emoji"
              onClick={() => playSound("click")}
              onMouseEnter={() => playSound("hover")}
            >
              Leaderboard
            </Nav.Link>

            <Nav.Link
              as={Link}
              to="/teams"
              className="hover-slide-emoji"
              onClick={() => playSound("click")}
              onMouseEnter={() => playSound("hover")}
            >
              Teams
            </Nav.Link>

            <Nav.Link
              as={Link}
              to="/ranking"
              className="hover-slide-emoji"
              onClick={() => playSound("click")}
              onMouseEnter={() => playSound("hover")}
            >
              Ranking
            </Nav.Link>

            <NavDropdown
              title="More"
              id="navbarScrollingDropdown"
              menuVariant="dark"
              className="more-dropdown"
              onMouseEnter={() => playSound("hover")}
            >
              <NavDropdown.Item
                as={Link}
                to="/match-history"
                onClick={() => playSound("click")}
                onMouseEnter={() => playSound("hover")}
              >
                Match History
              </NavDropdown.Item>

              <NavDropdown.Item
                as={Link}
                to="/test-history"
                onClick={() => playSound("click")}
                onMouseEnter={() => playSound("hover")}
              >
                🧾 Test Match History
              </NavDropdown.Item>

              <NavDropdown.Item
                as={Link}
                to="/points"
                onClick={() => playSound("click")}
                onMouseEnter={() => playSound("hover")}
              >
                Point Table
              </NavDropdown.Item>

              {/* ✅ [Added by Ranaj Parida | 21-Apr-2025] Test Ranking Route */}
              <NavDropdown.Item
                as={Link}
                to="/test-ranking"
                onClick={() => playSound("click")}
                onMouseEnter={() => playSound("hover")}
              >
                📘 Test Rankings
              </NavDropdown.Item>

              <NavDropdown.Divider />

              <NavDropdown.Item
                as={Link}
                to="/graphs"
                onClick={() => playSound("click")}
                onMouseEnter={() => playSound("hover")}
              >
                Graphs & Charts
              </NavDropdown.Item>

              <NavDropdown.Item
                as={Link}
                to="/about"
                onClick={() => playSound("click")}
                onMouseEnter={() => playSound("hover")}
              >
                About CrickEdge
              </NavDropdown.Item>

              <NavDropdown.Item
                as={Link}
                to="/contact"
                onClick={() => playSound("click")}
                onMouseEnter={() => playSound("hover")}
              >
                Contact / Feedback
              </NavDropdown.Item>
            </NavDropdown>
          </Nav>

          {/* ✅ [22-April-2025] User Ribbon Badge Display on Top-Right */}
          {loggedInUser && (
            <div className="d-flex align-items-center me-lg-3 mt-2 mt-lg-0">
              <img
                src="/verified-badge.png"
                alt="Verified"
                style={{ width: "26px", height: "26px", marginRight: "8px" }}
              />
              <span className="text-white fw-bold small">{loggedInUser}</span>
              <Button
                size="sm"
                variant="outline-light"
                className="ms-2 py-0 px-2 fw-bold"
                 onClick={() => {
                 localStorage.clear();
                   window.location.reload();
                   }}
              >
                  🔓 Logout
                </Button>

            </div>
          )}
            {/* ✅ Show Auth Buttons Based on Login State */}
{loggedInUser && (
  <div className="d-flex align-items-center me-lg-3 mt-2 mt-lg-0">
    <img
      src="/verified-badge.png"
      alt="Verified"
      style={{ width: "26px", height: "26px", marginRight: "8px" }}
    />
    <span className="text-white fw-bold small">{loggedInUser}</span>
    <Button
      size="sm"
      variant="outline-light"
      className="ms-2 py-0 px-2 fw-bold"
      onClick={() => {
        localStorage.clear();
        window.location.reload();
      }}
    >
      🔓 Logout
    </Button>
  </div>
)}

{!loggedInUser && (
  <Button
    variant="info"
    className="fw-bold hover-slide-emoji ms-lg-3 mt-2 mt-lg-0"
    onClick={onAuthClick}
  >
    🔐 Sign In / Create User
  </Button>
)}

          {/* ✅ Button Section for Matches */}
          <div className="d-flex flex-column flex-lg-row gap-2 mt-2 mt-lg-0 w-100 position-relative z-1">
            <Button
              as={Link}
              to="/add-match"
              variant="success"
              className="fw-bold hover-slide-emoji w-100 w-lg-auto"
              onClick={() => playSound("click")}
              onMouseEnter={() => playSound("hover")}
            >
              + Add Match
            </Button>

            <Button
              as={Link}
              to="/add-test-match"
              variant="warning"
              className="fw-bold text-dark hover-slide-emoji w-100 w-lg-auto"
              onClick={() => playSound("click")}
              onMouseEnter={() => playSound("hover")}
            >
              + Test Match
            </Button>
          </div>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
};

export default AppNavbar;
