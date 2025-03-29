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

import "bootstrap/dist/css/bootstrap.min.css";

// ✅ Homepage = Match Summary (ODI + T20) + Leaderboard
function HomePage() {
  return (
    <div className="container mt-4">
      <div className="row">
        {/* 🏏 ODI + T20 Match Cards */}
        <div className="col-lg-8 mb-4">
          <MatchCards />
        </div>

        {/* 🏆 Team Leaderboard */}
        <div className="col-lg-4 mb-4">
          <div className="card bg-dark text-white p-3 shadow">
            <h4 className="text-center text-success mb-3">🏆 Team Leaderboard</h4>
            <Leaderboard />
          </div>
        </div>
      </div>
    </div>
  );
}

function App() {
  return (
    <Router>
      <AppNavbar />
      <Routes>
        {/* ✅ Default Landing Page */}
        <Route path="/" element={<HomePage />} />

        {/* ✅ Match Form */}
        <Route
          path="/add-match"
          element={
            <PageWrapper>
              <MatchForm />
            </PageWrapper>
          }
        />

        {/* ✅ Leaderboard */}
        <Route
          path="/leaderboard"
          element={
            <PageWrapper>
              <Leaderboard />
            </PageWrapper>
          }
        />

        {/* ✅ Match History */}
        <Route
          path="/match-history"
          element={
            <PageWrapper>
              <MatchHistory />
            </PageWrapper>
          }
        />

        {/* ✅ Graphs & Charts */}
        <Route
          path="/graphs"
          element={
            <PageWrapper>
              <TeamChart />
            </PageWrapper>
          }
        />

        {/* ✅ Teams Overview Page */}
        <Route
          path="/teams"
          element={
            <PageWrapper>
              <TeamsPage />
            </PageWrapper>
          }
        />

        {/* ✅ Team Details Page */}
        <Route
          path="/teams/:teamName"
          element={
            <PageWrapper>
              <TeamDetails />
            </PageWrapper>
          }
        />

        {/* ✅ About Page */}
        <Route
          path="/about"
          element={
            <PageWrapper>
              <AboutCrickEdge />
            </PageWrapper>
          }
        />

        {/* ✅ Contact/Feedback */}
        <Route
          path="/contact"
          element={
            <PageWrapper>
              <ContactFeedback />
            </PageWrapper>
          }
        />

        {/* ✅ Aliases */}
        <Route path="/points" element={<Leaderboard />} />
        <Route path="/matches" element={<HomePage />} />
      </Routes>
    </Router>
  );
}

export default App;
