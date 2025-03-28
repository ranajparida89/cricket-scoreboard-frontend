// src/App.js
import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import AppNavbar from "./components/Navbar";
import MatchForm from "./components/MatchForm";
import Leaderboard from "./components/Leaderboard";
import MatchHistory from "./components/MatchHistory";
import TeamChart from "./components/TeamCharts";
import "bootstrap/dist/css/bootstrap.min.css";

// 🆕 Placeholder pages
const TeamsPage = () => <div className="container text-white mt-4">Teams Page</div>;
const GraphsPage = () => <TeamChart />;
const AboutPage = () => <div className="container text-white mt-4">About CrickEdge Info</div>;
const ContactPage = () => <div className="container text-white mt-4">Contact / Feedback</div>;

// 🆕 Placeholder for matches (for now just text)
const MatchesPage = () => (
  <div className="container text-white mt-4">
    <h3>🏏 ODI Matches (Match Summary Cards Coming Soon)</h3>
    {/* Later: map match summary cards here */}
  </div>
);

function App() {
  return (
    <Router>
      <AppNavbar />
      <Routes>
        <Route path="/" element={<Leaderboard />} />
        <Route path="/matches" element={<MatchesPage />} />
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
