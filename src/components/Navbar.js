// ✅ src/components/Navbar.js
// ✅ [Ranaj Parida - 2025-04-17 | Hover Slide Emoji Enhancement]
// ✅ Click & Hover sound on ALL nav elements without breaking logic

import React from "react";
import { Navbar, Nav, Container, Button, NavDropdown } from "react-bootstrap";
import { Link } from "react-router-dom";
import { playSound } from "../utils/playSound"; // ✅ Sound utility
import "../styles/theme.css"; // ✅ [Added for emoji hover styles]

const AppNavbar = () => {
  return (
    <Navbar
      bg="dark"
      variant="dark"
      expand="lg"
      className="px-3 py-2 shadow-sm sticky-top" // ✅ Sticky nav
      style={{ zIndex: 1030 }} // ✅ Ensure nav stays above content
    >
      <Container fluid>
        <Navbar.Brand
          as={Link}
          to="/"
          className="fw-bold fs-4 hover-slide-emoji" // ✅ [Hover emoji effect]
          onClick={() => playSound("click")}
          onMouseEnter={() => playSound("hover")}
        >
          🏏 CrickEdge
        </Navbar.Brand>

        <Navbar.Toggle aria-controls="navbarScroll" />

        <Navbar.Collapse id="navbarScroll">
          <Nav className="me-auto my-2 my-lg-0" navbarScroll>
            {/* ✅ Sound + Emoji Hover Enhancement */}
            <Nav.Link
              as={Link}
              to="/matches"
              className="hover-slide-emoji" // ✅ Emoji hover
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

            {/* ✅ Ranking Tab */}
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

          {/* ✅ Top-right action buttons */}
          <div className="d-flex gap-2">
            <Button
              as={Link}
              to="/add-match"
              variant="success"
              className="fw-bold hover-slide-emoji"
              onClick={() => playSound("click")}
              onMouseEnter={() => playSound("hover")}
            >
              + Add Match
            </Button>

            <Button
              as={Link}
              to="/add-test-match"
              variant="warning"
              className="fw-bold text-dark hover-slide-emoji"
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
