// src/App.js
import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import AppNavbar from "./components/Navbar";
import MatchForm from "./components/MatchForm";
import Leaderboard from "./components/Leaderboard";
import MatchHistory from "./components/MatchHistory";
import TeamChart from "./components/TeamCharts";
import MatchCards from "./components/MatchCards";
import TeamsPage from "./components/TeamsPage";
import TeamDetails from "./components/TeamDetails";
import AboutCrickEdge from "./components/AboutCrickEdge";
import ContactFeedback from "./components/ContactFeedback";
import PageWrapper from "./components/PageWrapper";
import TestMatchForm from "./components/TestMatchForm"; // ✅ Added for test match support

import "bootstrap/dist/css/bootstrap.min.css";

// ✅ Homepage = Match Summary (ODI + T20) + Full Width Leaderboard
function HomePage() {
  return (
    <div className="container mt-4">
      {/* 🏏 Match Summary Section */}
      <div className="mb-5">
        <MatchCards />
      </div>

      {/* 🏆 Full Width Leaderboard Section */}
      <div className="card bg-dark text-white p-4 shadow mb-5">
        <h4 className="text-center text-success mb-3">🏆 Team Leaderboard</h4>
        <Leaderboard />
      </div>
    </div>
  );
}

function App() {
  return (
    <Router>
      <AppNavbar />
      <Routes>
        <Route path="/" element={<HomePage />} />
        
        {/* ✅ Add Match (ODI/T20) */}
        <Route
          path="/add-match"
          element={
            <PageWrapper>
              <MatchForm />
            </PageWrapper>
          }
        />

        {/* ✅ Add Test Match */}
        <Route
          path="/add-test-match"
          element={
            <PageWrapper>
              <TestMatchForm />
            </PageWrapper>
          }
        />

        <Route
          path="/leaderboard"
          element={
            <PageWrapper>
              <Leaderboard />
            </PageWrapper>
          }
        />
        <Route
          path="/match-history"
          element={
            <PageWrapper>
              <MatchHistory />
            </PageWrapper>
          }
        />
        <Route
          path="/graphs"
          element={
            <PageWrapper>
              <TeamChart />
            </PageWrapper>
          }
        />
        <Route
          path="/teams"
          element={
            <PageWrapper>
              <TeamsPage />
            </PageWrapper>
          }
        />
        <Route
          path="/teams/:teamName"
          element={
            <PageWrapper>
              <TeamDetails />
            </PageWrapper>
          }
        />
        <Route
          path="/about"
          element={
            <PageWrapper>
              <AboutCrickEdge />
            </PageWrapper>
          }
        />
        <Route
          path="/contact"
          element={
            <PageWrapper>
              <ContactFeedback />
            </PageWrapper>
          }
        />

        {/* ✅ Points Table route (optional wrapper) */}
        <Route path="/points" element={<Leaderboard />} />

        {/* ✅ Matches Page (Home Page reused) */}
        <Route path="/matches" element={<HomePage />} />
      </Routes>
    </Router>
  );
}

export default App;
