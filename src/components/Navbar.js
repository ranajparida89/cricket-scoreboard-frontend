import React from "react";
import { Navbar, Nav, Container, Button, NavDropdown } from "react-bootstrap";
import { Link } from "react-router-dom";

const AppNavbar = () => {
  return (
    <Navbar bg="dark" variant="dark" expand="lg" className="px-3 py-2 shadow-sm">
      <Container fluid>
        <Navbar.Brand as={Link} to="/" className="fw-bold fs-4">
          🏏 CrickEdge
        </Navbar.Brand>
        <Navbar.Toggle aria-controls="navbarScroll" />
        <Navbar.Collapse id="navbarScroll">
          <Nav className="me-auto my-2 my-lg-0" navbarScroll>
            <Nav.Link as={Link} to="/matches">Matches</Nav.Link>
            <Nav.Link as={Link} to="/leaderboard">Leaderboard</Nav.Link>
            <Nav.Link as={Link} to="/teams">Teams</Nav.Link>

            <NavDropdown title="More" id="navbarScrollingDropdown">
              <NavDropdown.Item as={Link} to="/match-history">Match History</NavDropdown.Item>
              <NavDropdown.Item as={Link} to="/points">Point Table</NavDropdown.Item>
              <NavDropdown.Divider />
              <NavDropdown.Item as={Link} to="/graphs">Graphs & Charts</NavDropdown.Item>
              <NavDropdown.Item as={Link} to="/about">About CrickEdge</NavDropdown.Item>
              <NavDropdown.Item as={Link} to="/contact">Contact / Feedback</NavDropdown.Item>
            </NavDropdown>
          </Nav>

          <Button as={Link} to="/add-match" variant="success" className="fw-bold">
            + Add Match
          </Button>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
};

export default AppNavbar;
