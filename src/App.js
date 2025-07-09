import './App.css';
import React, { useState, useEffect } from "react"; // ✅ FIXED: Added useEffect
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import AppNavbar from "./components/Navbar";
import MatchForm from "./components/MatchForm";
import Leaderboard from "./components/Leaderboard";
import TestLeaderboard from "./components/TestLeaderboard"; 
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
import SmartAnalyzer from "./components/SmartAnalyzer"; // AI enable 16th MAY 2025 ranaj Parida
import FavoritesManager from './components/FavoritesManager';
import UserCricketStatsDashboard from './components/UserCricketStatsDashboard';
import UserCricketStatsDashboardV2 from "./components/UserCricketStatsDashboardV2"; // new Dashboard 
import WinLossTrendDashboard from "./components/WinLossTrendDashboard";
import AdminPromptModal from "./components/AdminPromptModal"; // admin portal
import PendingMatches from "./components/Admin/PendingMatches"; //auto approval 2-July-2025

import { useAuth } from './services/auth'; 
import UserDashboardV2Page from './components/UserDashboardV2Page';
import ManageAdmins from './components/Admin/ManageAdmins'; // FOR MANAGE ADMIN 01-JULY-2025 RANAJ PARIDA
import Gallery from './components/Gallery'; // For Gallary 
import Footer from "./components/Footer"; // for Footer




import "bootstrap/dist/css/bootstrap.min.css";

// ✅ Homepage = Match Summary (ODI + T20) + Leaderboard (Restricted for guests)
function HomePage() {
  // ✅ Homepage = Match Summary (ODI + T20) + Leaderboard (Allowed for all users)

  return (
    <div className="container mt-4">
      {/* 🏏 Match Summary Section */}
      <div className="mb-5">
        <MatchCards />
      </div>

      
      <div className="card bg-dark text-white p-4 shadow mb-5">
        <h4 className="text-center text-success mb-3">Limited-Overs Cricket Leaderboard</h4>
        <Leaderboard />
      </div>
      <div className="card bg-dark text-white p-4 shadow mb-5">
        <h4 className="text-center text-info mb-3"></h4>
        <TestLeaderboard />
      </div>
    </div>
  );
}

function App() {
  const [showAuthModal, setShowAuthModal] = useState(false); // ✅ [Added for Auth Modal Toggle]
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [theme, setTheme] = useState('dark');
  const [checkedAdmin, setCheckedAdmin] = useState(false);  // <--- Added
  const [isAdmin, setIsAdmin] = useState(false);            // <--- Added

  const { currentUser } = useAuth();

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
// added for admin 26-June-2026
    if (!checkedAdmin) {
    return (
      <AdminPromptModal
        onAdminResponse={(admin) => {
          setIsAdmin(admin);
          setCheckedAdmin(true);
          // Optionally: localStorage.setItem("isAdmin", admin);
        }}
      />
    );
  }
  
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

<Route // added for admin only use 26 june 2026 Ranaj Parida
  path="/add-player"
  element={
    <ProtectedRoute>
      <PlayerRouteWrapper>
        {isAdmin ? (
          <AddPlayers isAdmin={isAdmin} />    // <-- Pass isAdmin here!
        ) : (
          <div style={{ padding: 24, color: "red", textAlign: "center" }}>
            You are not authorized to access this page.
          </div>
        )}
      </PlayerRouteWrapper>
    </ProtectedRoute>
  }
/>
<Route path="/player-stats" element={
  <ProtectedRoute>
    <PlayerStats />
  </ProtectedRoute>
} />

<Route  // added to restrict for Non-Admin users 27 June 2025 Ranaj Parida
  path="/player-performance"
  element={
    <ProtectedRoute>
      {isAdmin ? (
        <PlayerPerformance />
      ) : (
        <div style={{ padding: 24, color: "red", textAlign: "center" }}>
          You are not authorized to access this page.
        </div>
      )}
    </ProtectedRoute>
  }
/>

<Route  // Restricted for non-admin user
  path="/squad-lineup"
  element={
    <ProtectedRoute>
      <PageWrapper>
        <SquadLineup isAdmin={isAdmin} />
      </PageWrapper>
    </ProtectedRoute>
  }
/>

<Route path="/qualification-scenario" element={<QualificationScenario />} /> 
<Route
  path="/add-upcoming-match"  // Restricted for Non Admin user.
  element={
    <ProtectedRoute>
      {isAdmin ? (
        <AddUpcomingMatch isAdmin={isAdmin} />
      ) : (
        <div style={{ padding: 24, color: "red", textAlign: "center" }}>
          You are not authorized to access this page.
        </div>
      )}
    </ProtectedRoute>
  }
/>

<Route path="/upcoming-matches" element={<UpcomingMatches />} />
<Route path="/player-rankings" element={<PlayerRankings />} />
<Route path="/match-story" element={<MatchStory />} />  
<Route path="/h2h-records" element={<H2HRecords />} />
<Route path="/smart-analyzer" element={<SmartAnalyzer />} />
<Route
  path="/my-dashboard"
  element={
    currentUser ? (
      <UserCricketStatsDashboardV2 />  // <-- NEW Dashboard
    ) : (
      <div>Please log in to view your dashboard.</div>
    )
  }
/>

<Route
  path="/manage-favorites"
  element={
    currentUser ? (
      <FavoritesManager userId={currentUser.id} />
    ) : (
      <div>Please log in to view favorites.</div>
    )
    
  }
  
/>

<Route path="/dashboard-v2" element={<UserDashboardV2Page />} />

<Route path="/admin/manage" element={<ManageAdmins />} /> 

<Route path="/admin/pending" element={<PendingMatches />} />

<Route path="/gallery" element={<Gallery />} /> 
<Footer />

      </Routes>
    </Router>
    </div>
  );
}

export default App;
