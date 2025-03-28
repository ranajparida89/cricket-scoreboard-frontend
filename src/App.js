import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import AppNavbar from "./components/Navbar";
import MatchForm from "./components/MatchForm";
import Leaderboard from "./components/Leaderboard";
import MatchHistory from "./components/MatchHistory";
import TeamChart from "./components/TeamCharts";
import "bootstrap/dist/css/bootstrap.min.css";

// Optional placeholders for new pages
const TeamsPage = () => <div className="container text-white mt-4">Teams Page</div>;
const GraphsPage = () => <div className="container text-white mt-4">Graphs & Charts Coming Soon</div>;
const AboutPage = () => <div className="container text-white mt-4">About CrickEdge Info Here</div>;
const ContactPage = () => <div className="container text-white mt-4">Contact / Feedback Form</div>;

function HomePage() {
  return (
    <div className="container my-4">
      <div className="row">
        <div className="col-md-6">
          <MatchForm />
        </div>
        <div className="col-md-6">
          <Leaderboard />
        </div>
      </div>

      <div className="mt-5">
        <MatchHistory />
      </div>

      <div className="mt-5">
        <TeamChart />
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
        <Route path="/matches" element={<MatchForm />} />
        <Route path="/leaderboard" element={<Leaderboard />} />
        <Route path="/match-history" element={<MatchHistory />} />
        <Route path="/teams" element={<TeamsPage />} />
        <Route path="/add-match" element={<MatchForm />} />
        <Route path="/points" element={<Leaderboard />} />
        <Route path="/graphs" element={<GraphsPage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/contact" element={<ContactPage />} />
      </Routes>
    </Router>
  );
}

export default App;
