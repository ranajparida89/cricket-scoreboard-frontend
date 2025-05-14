import './App.css';
import React, { useState, useEffect } from "react"; // ✅ FIXED: Added useEffect
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
import TestMatchForm from "./components/TestMatchForm";
import TestMatchHistory from "./components/TestMatchHistory";
import TeamRanking from "./components/TeamRanking";
import TestRanking from "./components/TestRanking"; // ✅ [Ranaj Parida - 2025-04-21 | Test Ranking Page]
import PointTable from "./components/PointTable";
import MatchTicker from "./components/MatchTicker";
import AuthModal from "./components/AuthModal"; // ✅ [Ranaj Parida - 2025-04-22 | User Auth Modal]
import ProtectedRoute from "./components/ProtectedRoute"; // ✅ [Ranaj Parida - 22-Apr-2025 | Route Guard for login-only pages]
import AddPlayers from "./components/AddPlayers"; // AddPlayer Ranaj Parida 23-04-2025
import SidebarMenu from "./components/SidebarMenu"; // ✅ Import sidebar Ranaj Parida 23-04-2025
import PlayerRouteWrapper from "./components/PlayerRouteWrapper"; // ✅ Import this
import SquadLineup from "./components/SquadLineup"; // ✅ Squad Page
import PlayerStats from "./components/PlayerStats"; // PlayerStats page 
import PlayerPerformance from "./components/PlayerPerformance"; // Playerperformance page
import QualificationScenario from './components/QualificationScenario'; // qualifiaction
import AddUpcomingMatch from "./components/AddUpcomingMatch";// for Addupcoming match
import UpcomingMatches from "./components/UpcomingMatches"; // upcoming match details
import PlayerRankings from "./components/PlayerRankings"; // playerratings
import MatchStory from "./components/MatchStory"; // for matchstory 14th MAY 2025 Ranaj Parida
import H2HRecords from "./components/H2HRecords"; // H2H 15th May 2025 Ranaj Parida


import "bootstrap/dist/css/bootstrap.min.css";

// ✅ Homepage = Match Summary (ODI + T20) + Leaderboard (Restricted for guests)
function HomePage() {
  // ✅ Homepage = Match Summary (ODI + T20) + Leaderboard (Allowed for all users)
function HomePage() {
  return (
    <div className="container mt-4">
      {/* 🏏 Match Summary Section (ODI + T20) */}
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
  const [showAuthModal, setShowAuthModal] = useState(false); // ✅ [Added for Auth Modal Toggle]
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [theme, setTheme] = useState('dark');

      useEffect(() => {
        document.body.className = theme === 'dark' ? 'bg-dark text-light' : 'bg-light text-dark';
      }, [theme]);
      
      const toggleTheme = () => {
        setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
      };
  
  // ✅ Listen for custom "toggleSidebar" event from Navbar's hamburger button
  useEffect(() => {
    const toggleHandler = () => {
      setSidebarOpen(prev => !prev);
    };
    window.addEventListener("toggleSidebar", toggleHandler);
    return () => window.removeEventListener("toggleSidebar", toggleHandler);
  }, []);
  
  return (
    <div className={theme}>
      <Router>  
            <AppNavbar 
            onAuthClick={() => setShowAuthModal(true)} 
            toggleTheme={toggleTheme}
            theme={theme} // added theme 
          />
{/* ✅ Trigger modal */}
      <MatchTicker />
      <AuthModal show={showAuthModal} onClose={() => setShowAuthModal(false)} /> {/* ✅ Auth Modal Entry */}
      <SidebarMenu isOpen={isSidebarOpen} onClose={() => setSidebarOpen(false)} /> {/* ✅ Sidebar Menu Entry */}

      <Routes>
        <Route path="/" element={<HomePage />} />

        <Route
          path="/add-match"
          element={
            <PageWrapper>
              <MatchForm />
            </PageWrapper>
          }
        />

        <Route
          path="/add-test-match"
          element={
            <PageWrapper>
              <TestMatchForm />
            </PageWrapper>
          }
        />

<Route
  path="/test-history"
  element={
    <ProtectedRoute> {/* ✅ [Protected | Requires Login] */}
      <PageWrapper>
        <TestMatchHistory />
      </PageWrapper>
    </ProtectedRoute>
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
    <ProtectedRoute> {/* ✅ [Protected | Requires Login] */}
      <PageWrapper>
        <MatchHistory />
      </PageWrapper>
    </ProtectedRoute>
  }
/>
<Route
  path="/graphs"
  element={
    <ProtectedRoute> {/* ✅ [Protected | Requires Login] */}
      <PageWrapper>
        <TeamChart />
      </PageWrapper>
    </ProtectedRoute>
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

<Route
  path="/points"
  element={
    <ProtectedRoute> {/* ✅ [Protected | Requires Login] */}
      <PageWrapper>
        <PointTable />
      </PageWrapper>
    </ProtectedRoute>
  }
/>

        <Route path="/matches" element={<HomePage />} />

        <Route
  path="/ranking"
  element={
    <ProtectedRoute> {/* ✅ [Protected | Requires Login] */}
      <PageWrapper>
        <TeamRanking />
      </PageWrapper>
    </ProtectedRoute>
  }
/>

        {/* ✅ Separate Test Ranking Route */}
        <Route
  path="/test-ranking"
  element={
    <ProtectedRoute> {/* ✅ [Protected | Requires Login] */}
      <PageWrapper>
        <TestRanking />
      </PageWrapper>
    </ProtectedRoute>
  }
/>
<Route
  path="/add-player"
  element={
    <ProtectedRoute>
      <PlayerRouteWrapper>
        <AddPlayers />
      </PlayerRouteWrapper>
    </ProtectedRoute>
  }
/>
<Route path="/player-stats" element={
  <ProtectedRoute>
    <PlayerStats />
  </ProtectedRoute>
} />

<Route path="/player-performance" element={
  <ProtectedRoute>
    <PlayerPerformance />
  </ProtectedRoute>
} />


<Route
  path="/squad-lineup"
  element={
    <ProtectedRoute>
      <PageWrapper>
        <SquadLineup />
      </PageWrapper>
    </ProtectedRoute>
  }
/>
<Route path="/qualification-scenario" element={<QualificationScenario />} />
<Route path="/add-upcoming-match" element={<AddUpcomingMatch />} />
<Route path="/upcoming-matches" element={<UpcomingMatches />} />
<Route path="/player-rankings" element={<PlayerRankings />} />
<Route path="/match-story" element={<MatchStory />} />  
<Route path="/h2h-records" element={<H2HRecords />} />



      </Routes>
    </Router>
    </div>
  );
}

export default App;
