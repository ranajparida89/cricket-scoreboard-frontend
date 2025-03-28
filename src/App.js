// src/App.js
import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import AppNavbar from "./components/Navbar";
import MatchForm from "./components/MatchForm";
import Leaderboard from "./components/Leaderboard";
import MatchHistory from "./components/MatchHistory";
import TeamChart from "./components/TeamCharts";
import MatchCards from "./components/MatchCards"; // ✅ NEW: Import match summary cards
import "bootstrap/dist/css/bootstrap.min.css";

// ✅ NEW: Replaced placeholder with real match cards page
const MatchesPage = () => <MatchCards />;

// 🆕 Other placeholder pages
const TeamsPage = () => <div className="container text-white mt-4">Teams Page</div>;
const GraphsPage = () => <TeamChart />;
const AboutPage = () => <div className="container text-white mt-4">About CrickEdge Info</div>;
const ContactPage = () => <div className="container text-white mt-4">Contact / Feedback</div>;

function App() {
  return (
    <Router>
      <AppNavbar />
      <Routes>
        <Route path="/" element={<MatchesPage />} />                 {/* ✅ Set MatchCards as homepage */}
        <Route path="/matches" element={<MatchesPage />} />         {/* ✅ Match summary cards route */}
        <Route path="/leaderboard" element={<Leaderboard />} />
        <Route path="/add-match" element={<MatchForm />} />
        <Route path="/match-history" element={<MatchHistory />} />
        <Route path="/teams" element={<TeamsPage />} />
        <Route path="/points" element={<Leaderboard />} />
        <Route path="/graphs" element={<GraphsPage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/contact" element={<ContactPage />} />
      </Routes>
    </Router>
  );
}

export default App;
