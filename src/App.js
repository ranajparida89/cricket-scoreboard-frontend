// ✅ src/App.js
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
import TestMatchForm from "./components/TestMatchForm"; // ✅ Test Match Form
import TestMatchHistory from "./components/TestMatchHistory"; // ✅ Test Match History
import TeamRanking from "./components/TeamRanking"; // ✅ Team Ranking View
import PointTable from "./components/PointTable"; // ✅ [Ranaj - 2025-04-14 | Test Match Point Table]

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
        {/* ✅ Home Page */}
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

        {/* ✅ Test Match History */}
        <Route
          path="/test-history"
          element={
            <PageWrapper>
              <TestMatchHistory />
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

        {/* ✅ Graphs and Charts */}
        <Route
          path="/graphs"
          element={
            <PageWrapper>
              <TeamChart />
            </PageWrapper>
          }
        />

        {/* ✅ Teams Overview */}
        <Route
          path="/teams"
          element={
            <PageWrapper>
              <TeamsPage />
            </PageWrapper>
          }
        />

        {/* ✅ Team Details */}
        <Route
          path="/teams/:teamName"
          element={
            <PageWrapper>
              <TeamDetails />
            </PageWrapper>
          }
        />

        {/* ✅ About CrickEdge */}
        <Route
          path="/about"
          element={
            <PageWrapper>
              <AboutCrickEdge />
            </PageWrapper>
          }
        />

        {/* ✅ Contact Feedback */}
        <Route
          path="/contact"
          element={
            <PageWrapper>
              <ContactFeedback />
            </PageWrapper>
          }
        />

        {/* ✅ Test Match Points Table */}
        <Route
          path="/points"
          element={
            <PageWrapper>
              <PointTable />
            </PageWrapper>
          }
        />

        {/* ✅ Matches (same as home) */}
        <Route path="/matches" element={<HomePage />} />

        {/* ✅ Team Rankings */}
        <Route
          path="/ranking"
          element={
            <PageWrapper>
              <TeamRanking />
            </PageWrapper>
          }
        />
      </Routes>
    </Router>
  );
}

export default App;
