// src/App.js
import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import AppNavbar from "./components/Navbar";
import MatchForm from "./components/MatchForm";
import Leaderboard from "./components/Leaderboard";
import MatchHistory from "./components/MatchHistory";
import TeamChart from "./components/TeamCharts";
import MatchCards from "./components/MatchCards";
import TeamsPage from "./components/TeamsPage";          // ✅ New
import TeamDetails from "./components/TeamDetails";      // ✅ New
import AboutCrickEdge from "./components/AboutCrickEdge"; // ✅ New
import ContactFeedback from "./components/ContactFeedback"; // ✅ New
import PageWrapper from "./components/PageWrapper";      // ✅ For Close Button Support

import "bootstrap/dist/css/bootstrap.min.css";

// Homepage = Match Summary + Leaderboard
function HomePage() {
  return (
    <div className="container mt-4">
      <div className="row">
        <div className="col-lg-8">
          <MatchCards />
        </div>
        <div className="col-lg-4">
          <Leaderboard />
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

        {/* ✅ Alias for Points */}
        <Route path="/points" element={<Leaderboard />} />
        <Route path="/matches" element={<HomePage />} />
      </Routes>
    </Router>
  );
}

export default App;
