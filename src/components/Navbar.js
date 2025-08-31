// ✅ src/components/Navbar.js — Sleek Glass Nav + Progress/Aura (UI-only)
// - Keeps: PWA install, sounds, auth badge, Logout, More, actions
// - Adds: scroll progress bar, active-pill highlight, brand dot bounce
// - Needs: ./Navbar.css

import React, { useEffect, useState } from "react";
import { Navbar, Nav, Container, Button, NavDropdown } from "react-bootstrap";
import { Link, useLocation } from "react-router-dom";
import { playSound } from "../utils/playSound";
import "../styles/theme.css";
import "./Navbar.css";

const AppNavbar = ({ onAuthClick }) => {
  const [loggedInUser, setLoggedInUser] = useState(null);
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [progress, setProgress] = useState(0); // page scroll progress %

  // ----- PWA install flow -----
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

  // ----- active tab helpers -----
  const { pathname } = useLocation();
  const isActive = (path) => pathname.startsWith(path);

  // ----- page scroll progress (for the aurora bar) -----
  useEffect(() => {
    const onScroll = () => {
      const doc = document.documentElement;
      const max = doc.scrollHeight - window.innerHeight;
      const p = max > 0 ? Math.min(100, Math.max(0, (window.scrollY / max) * 100)) : 0;
      setProgress(p);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  return (
    <Navbar
      expand="lg"
      variant="dark"
      className="px-3 py-2 sticky-top ce-navbar slumber-nav"
      style={{ zIndex: 1030, ["--ce-prog"]: `${progress}%` }}
    >
      <Container fluid>
        {/* Hamburger */}
        <Button
          variant="dark"
          className="p-0 me-2 slumber-icon-btn ce-icon-btn"
          aria-label="Toggle sidebar"
          title="Menu"
          onClick={() => window.dispatchEvent(new CustomEvent("toggleSidebar"))}
        >
          <i className="fas fa-bars" />
        </Button>

        {/* Brand */}
        <Navbar.Brand
          as={Link}
          to="/"
          className="fw-bold slumber-brand ce-brand"
          onClick={() => playSound("click")}
          onMouseEnter={() => playSound("hover")}
        >
          <span className="slumber-brand-word ce-brand-word">Crick</span>
          <span className="slumber-brand-accent ce-brand-accent">Edge</span>
          <span className="slumber-brand-dot ce-brand-dot" aria-hidden>
            .in
          </span>
        </Navbar.Brand>

        <Navbar.Toggle aria-controls="navbarScroll" className="slumber-toggler ce-toggler" />

        <Navbar.Collapse id="navbarScroll" style={{ overflow: "visible" }}>
          {/* ----- MAIN LINKS ----- */}
          <Nav className="me-auto my-2 my-lg-0" navbarScroll>
            <Nav.Link
              as={Link}
              to="/matches"
              className={`slumber-link ce-link ${isActive("/matches") ? "active" : ""}`}
              aria-current={isActive("/matches") ? "page" : undefined}
              onClick={() => playSound("click")}
              onMouseEnter={() => playSound("hover")}
            >
              Matches
            </Nav.Link>

            <Nav.Link
              as={Link}
              to="/leaderboard"
              className={`slumber-link ce-link ${isActive("/leaderboard") ? "active" : ""}`}
              aria-current={isActive("/leaderboard") ? "page" : undefined}
              onClick={() => playSound("click")}
              onMouseEnter={() => playSound("hover")}
            >
              Leaderboard
            </Nav.Link>

            <Nav.Link
              as={Link}
              to="/teams"
              className={`slumber-link ce-link ${isActive("/teams") ? "active" : ""}`}
              aria-current={isActive("/teams") ? "page" : undefined}
              onClick={() => playSound("click")}
              onMouseEnter={() => playSound("hover")}
            >
              Teams
            </Nav.Link>

            <Nav.Link
              as={Link}
              to="/ranking"
              className={`slumber-link ce-link ${isActive("/ranking") ? "active" : ""}`}
              aria-current={isActive("/ranking") ? "page" : undefined}
              onClick={() => playSound("click")}
              onMouseEnter={() => playSound("hover")}
            >
              Ranking
            </Nav.Link>

            {/* More Dropdown */}
            <NavDropdown
              title="More"
              id="navbarScrollingDropdown"
              menuVariant="dark"
              className="more-dropdown slumber-dropdown ce-dropdown"
              onMouseEnter={() => playSound("hover")}
            >
              <NavDropdown.Item
                as={Link}
                to="/match-history"
                className="ce-dd-item"
                onClick={() => playSound("click")}
                onMouseEnter={() => playSound("hover")}
              >
                Match History
              </NavDropdown.Item>

              <NavDropdown.Item
                as={Link}
                to="/test-history"
                className="ce-dd-item"
                onClick={() => playSound("click")}
                onMouseEnter={() => playSound("hover")}
              >
                🧾 Test Match History
              </NavDropdown.Item>

              <NavDropdown.Item
                as={Link}
                to="/points"
                className="ce-dd-item"
                onClick={() => playSound("click")}
                onMouseEnter={() => playSound("hover")}
              >
                Point Table
              </NavDropdown.Item>

              <NavDropdown.Item
                as={Link}
                to="/test-ranking"
                className="ce-dd-item"
                onClick={() => playSound("click")}
                onMouseEnter={() => playSound("hover")}
              >
                📘 Test Rankings
              </NavDropdown.Item>

              <NavDropdown.Divider />

              <NavDropdown.Item
                as={Link}
                to="/graphs"
                className="ce-dd-item"
                onClick={() => playSound("click")}
                onMouseEnter={() => playSound("hover")}
              >
                Graphs & Charts
              </NavDropdown.Item>

              <NavDropdown.Item
                as={Link}
                to="/about"
                className="ce-dd-item"
                onClick={() => playSound("click")}
                onMouseEnter={() => playSound("hover")}
              >
                About CrickEdge
              </NavDropdown.Item>

              <NavDropdown.Item
                as={Link}
                to="/contact"
                className="ce-dd-item"
                onClick={() => playSound("click")}
                onMouseEnter={() => playSound("hover")}
              >
                Contact / Feedback
              </NavDropdown.Item>
            </NavDropdown>
          </Nav>

          {/* ----- Right side ----- */}
          {loggedInUser ? (
            <div className="d-flex align-items-center me-lg-3 mt-2 mt-lg-0 ce-userwrap">
              <img
                src="/verified-ribbon.png"
                alt="Verified"
                className="me-2"
                style={{ width: 22, height: 22 }}
              />
              <span className="slumber-user small ce-user">{loggedInUser}</span>

              <Button
                size="sm"
                className="ms-2 py-0 px-2 fw-bold slumber-ghost-btn ce-ghost"
                onClick={() => {
                  localStorage.clear();
                  window.location.reload();
                }}
                title="Log out"
              >
                🔒 Logout
              </Button>

              <Button
                as={Link}
                to="/my-dashboard"
                className="dashboard-glow-btn ms-2 slumber-cta ce-cta"
                onMouseEnter={() => playSound("hover")}
                onClick={() => playSound("click")}
              >
                🏠 Dashboard
              </Button>
            </div>
          ) : (
            <Button
              className="fw-bold ms-lg-3 mt-2 mt-lg-0 slumber-cta ce-cta"
              onClick={onAuthClick}
              onMouseEnter={() => playSound("hover")}
            >
              🔐 Sign In / Create User
            </Button>
          )}

          {/* ----- Actions ----- */}
          <div className="navbar-actions-group ms-auto d-flex flex-row align-items-center gap-2">
            <Button
              onClick={handleInstallClick}
              className="btn slumber-ghost-btn ce-ghost"
              onMouseEnter={() => playSound("hover")}
              title="Install the app to your device"
            >
              📥 Get App
            </Button>

            <Button
              as={Link}
              to="/add-match"
              className="navbar-action-btn slumber-ghost-btn ce-ghost"
              onClick={() => playSound("click")}
              onMouseEnter={() => playSound("hover")}
            >
              + Add Match
            </Button>

            <Button
              as={Link}
              to="/add-test-match"
              className="navbar-action-btn slumber-ghost-btn ce-ghost"
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
