// ✅ src/components/Navbar.js — Slumber-themed navbar
// ✅ Brand in gold capsule, real hamburger, glassy "More"
// ✅ Single "Add Match Details" button → dropdown
// ✅ "Matches" now goes to /past-matches

import React, { useEffect, useRef, useState } from "react";
import { Navbar, Nav, Container, Button, NavDropdown } from "react-bootstrap";
import { Link, useNavigate } from "react-router-dom";
import { playSound } from "../utils/playSound";
import "../styles/theme.css";
import TournamentTicker from "./TournamentTicker";

const AppNavbar = ({ onAuthClick }) => {
  const [loggedInUser, setLoggedInUser] = useState(null);

  // ----- PWA install flow -----
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  useEffect(() => {
    const handler = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);
  useEffect(() => {
    const onInstalled = () => setDeferredPrompt(null);
    window.addEventListener("appinstalled", onInstalled);
    return () => window.removeEventListener("appinstalled", onInstalled);
  }, []);
  const handleInstallClick = async () => {
    if (!deferredPrompt) {
      alert(
        "ℹ️ Installation might not be available now.\nTry again later or use 'Add to Home Screen' from the browser menu."
      );
      return;
    }
    try {
      await deferredPrompt.prompt();
      await deferredPrompt.userChoice;
    } catch {}
    setDeferredPrompt(null);
  };

  // ----- read user name for badge -----
  useEffect(() => {
    const local = localStorage.getItem("user");
    if (local) {
      const u = JSON.parse(local);
      setLoggedInUser(u.first_name || u.email?.split("@")[0]);
    }
  }, []);

  // ----- new: add-match dropdown -----
  const [showAddMenu, setShowAddMenu] = useState(false);
  const addBtnRef = useRef(null);
  const addMenuRef = useRef(null);
  const navigate = useNavigate();

  // close on click outside
  useEffect(() => {
    const handler = (e) => {
      if (
        !addBtnRef.current ||
        !addMenuRef.current ||
        addBtnRef.current.contains(e.target) ||
        addMenuRef.current.contains(e.target)
      ) {
        return;
      }
      setShowAddMenu(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleAddOdiT20 = () => {
    playSound("click");
    setShowAddMenu(false);
    navigate("/add-match");
  };

  const handleAddTest = () => {
    playSound("click");
    setShowAddMenu(false);
    navigate("/add-test-match");
  };

  return (
    <Navbar
      expand="lg"
      variant="dark"
      className="px-3 py-2 sticky-top slumber-nav"
      style={{ zIndex: 1030 }}
    >
      <Container fluid>
        {/* ✅ pure-CSS hamburger, no FontAwesome */}
        <button
          type="button"
          className="slumber-hamburger-btn me-2"
          aria-label="Toggle sidebar"
          onClick={() => window.dispatchEvent(new CustomEvent("toggleSidebar"))}
        >
          <span></span>
          <span></span>
          <span></span>
        </button>

        {/* ✅ Brand inside light-gold capsule */}
        <Navbar.Brand
          as={Link}
          to="/"
          className="slumber-brand hover-slide-emoji slumber-brand-pill"
          onClick={() => playSound("click")}
          onMouseEnter={() => playSound("hover")}
        >
          <span className="slumber-brand-word">Crick</span>
          <span className="slumber-brand-accent">Edge</span>
          <span className="slumber-brand-dot">.in</span>
        </Navbar.Brand>

        <Navbar.Toggle aria-controls="navbarScroll" className="slumber-toggler" />

        <Navbar.Collapse id="navbarScroll" style={{ overflow: "visible" }}>
          {/* ----- MAIN LINKS ----- */}
          <Nav className="me-auto my-2 my-lg-0" navbarScroll>
            {/* ✅ now goes to our new page */}
            <Nav.Link
              as={Link}
              to="/past-matches"
              className="slumber-link hover-slide-emoji"
              onClick={() => playSound("click")}
              onMouseEnter={() => playSound("hover")}
            >
              Matches
            </Nav.Link>

            <Nav.Link
              as={Link}
              to="/leaderboard"
              className="slumber-link hover-slide-emoji"
              onClick={() => playSound("click")}
              onMouseEnter={() => playSound("hover")}
            >
              Leaderboard
            </Nav.Link>

            <Nav.Link
              as={Link}
              to="/teams"
              className="slumber-link hover-slide-emoji"
              onClick={() => playSound("click")}
              onMouseEnter={() => playSound("hover")}
            >
              Teams
            </Nav.Link>

            <Nav.Link
              as={Link}
              to="/ranking"
              className="slumber-link hover-slide-emoji"
              onClick={() => playSound("click")}
              onMouseEnter={() => playSound("hover")}
            >
              Ranking
            </Nav.Link>

            {/* ----- More Dropdown (glassy) ----- */}
            <NavDropdown
              title="More"
              id="navbarScrollingDropdown"
              menuVariant="dark"
              className="more-dropdown slumber-dropdown slumber-glassy-menu"
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
                Test Match History
              </NavDropdown.Item>

              <NavDropdown.Item
                as={Link}
                to="/points"
                onClick={() => playSound("click")}
                onMouseEnter={() => playSound("hover")}
              >
                Point Table
              </NavDropdown.Item>

              <NavDropdown.Item
                as={Link}
                to="/test-ranking"
                onClick={() => playSound("click")}
                onMouseEnter={() => playSound("hover")}
              >
                Test Rankings
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
                to="/faq"
                onClick={() => playSound("click")}
                onMouseEnter={() => playSound("hover")}
              >
                FAQ
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

          {/* ----- Right side: user badge or Sign in ----- */}
          {loggedInUser ? (
            <div className="d-flex align-items-center me-lg-3 mt-2 mt-lg-0">
              <img
                src="/verified-ribbon.png"
                alt="Verified"
                style={{ width: 26, height: 26, marginRight: 8 }}
              />
              <span className="slumber-user small">{loggedInUser}</span>

              <Button
                size="sm"
                className="ms-2 py-0 px-2 fw-bold slumber-ghost-btn"
                onClick={() => {
                  localStorage.clear();
                  window.location.reload();
                }}
              >
                🔒 Logout
              </Button>

              <Button
                as={Link}
                to="/my-dashboard"
                className="dashboard-glow-btn ms-2 slumber-cta"
                onMouseEnter={() => playSound("hover")}
                onClick={() => playSound("click")}
              >
                🏠 Dashboard
              </Button>
            </div>
          ) : (
            <Button
              className="fw-bold hover-slide-emoji ms-lg-3 mt-2 mt-lg-0 slumber-cta"
              onClick={onAuthClick}
            >
              🔐 Sign In / Create User
            </Button>
          )}

          {/* ----- Tournament countdown ticker (visible for all users) ----- */}
          <div className="ms-lg-3 mt-2 mt-lg-0 d-flex align-items-center">
            <TournamentTicker />
          </div>

          {/* ----- Actions ----- */}
          <div
            className="navbar-actions-group ms-auto d-flex flex-row align-items-center gap-2"
            style={{ position: "relative" }}
          >
            <Button
              onClick={handleInstallClick}
              className="btn slumber-ghost-btn hover-slide-emoji"
              onMouseEnter={() => playSound("hover")}
              title="Install the app to your device"
            >
              📥 Get App
            </Button>

            {/* ✅ Single "Add Match Details" button */}
            <Button
              ref={addBtnRef}
              className={
                "navbar-action-btn hover-slide-emoji slumber-ghost-btn ce-add-match-trigger" +
                (showAddMenu ? " is-open" : "")
              }
              onClick={() => {
                playSound("click");
                setShowAddMenu((v) => !v);
              }}
              onMouseEnter={() => playSound("hover")}
            >
              + Add Match Details
              <span className="ms-1 ce-add-caret">▼</span>
            </Button>

            {showAddMenu && (
              <div ref={addMenuRef} className="ce-add-match-menu">
                <button
                  type="button"
                  className="ce-add-match-item"
                  onClick={handleAddOdiT20}
                >
                  Add ODI / T20 Details
                </button>
                <button
                  type="button"
                  className="ce-add-match-item"
                  onClick={handleAddTest}
                >
                  Add Test Match Details
                </button>
              </div>
            )}
          </div>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
};

export default AppNavbar;
