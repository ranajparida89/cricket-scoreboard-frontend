// App.js
import "./App.css";
import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import AppNavbar from "./components/Navbar";
import MatchForm from "./components/MatchForm";
import Leaderboard from "./components/Leaderboard";
import TestLeaderboard from "./components/TestLeaderboard";
import MatchHistory from "./components/MatchHistory";
import TeamChart from "./components/TeamCharts";
import MatchCards from "./components/MatchCards";
// ❌ old landing component no longer used
// import TeamsPage from "./components/TeamsPage";
import TeamDetails from "./components/TeamDetails";
import AboutCrickEdge from "./components/AboutCrickEdge";
import ContactFeedback from "./components/ContactFeedback";
import PageWrapper from "./components/PageWrapper";
import TestMatchForm from "./components/TestMatchForm";
import TestMatchHistory from "./components/TestMatchHistory";
import TeamRanking from "./components/TeamRanking";
import TestRanking from "./components/TestRanking";
import PointTable from "./components/PointTable";
import MatchTicker from "./components/MatchTicker";
import AuthModal from "./components/AuthModal";
import ProtectedRoute from "./components/ProtectedRoute";
import AddPlayers from "./components/AddPlayers";
import SidebarMenu from "./components/SidebarMenu";
import PlayerRouteWrapper from "./components/PlayerRouteWrapper";
import SquadLineup from "./components/SquadLineup";
import PlayerStats from "./components/PlayerStats";
import PlayerPerformance from "./components/PlayerPerformance";
import QualificationScenario from "./components/QualificationScenario";
import AddUpcomingMatch from "./components/AddUpcomingMatch";
import UpcomingMatches from "./components/UpcomingMatches";
import PlayerRankings from "./components/PlayerRankings";
import MatchStory from "./components/MatchStory";
import H2HRecords from "./components/H2HRecords";
import SmartAnalyzer from "./components/SmartAnalyzer";
import FavoritesManager from "./components/FavoritesManager";
import UserCricketStatsDashboardV2 from "./components/UserCricketStatsDashboardV2";
import AdminPromptModal from "./components/AdminPromptModal";
import PendingMatches from "./components/Admin/PendingMatches";
import { useAuth } from "./services/auth";
import UserDashboardV2Page from "./components/UserDashboardV2Page";
import ManageAdmins from "./components/Admin/ManageAdmins";
import Gallery from "./components/Gallery";
import Footer from "./components/Footer";
import DownloadAppButton from "./components/DownloadAppButton";
import * as serviceWorkerRegistration from "./serviceWorkerRegistration";
import DeleteAccount from "./components/DeleteAccount";
import SchedulerPage from "./components/SchedulerPage";
import TeamDistributor from "./components/TeamDistributor";
import AllBoardsView from "./components/AllBoardsView";
import BoardRegistrationForm from "./components/BoardRegistrationForm";
import BoardAnalyticsPro from "./components/BoardAnalyticsPro";
import TournamentPoints from "./components/TournamentPoints";

// 🔥 NEW
import PitchRandomizer from "./components/PitchRandomizer";
import MoMInsights from "./components/MoMInsights";

// ✅ NEW: Home highlights carousel
import HomeHighlights from "./components/HomeHighlights";

// ✅ NEW: FAQ page
import FaqPage from "./components/FaqPage";
import PastMatchesHub from "./components/PastMatchesHub";

import "bootstrap/dist/css/bootstrap.min.css";
import PlayerReportCard from "./components/PlayerReportCard";
import AuctionLobby from "./components/AuctionLobby";
import AuctionRoom from "./components/AuctionRoom";
import AuctionMyPlayers from "./components/AuctionMyPlayers";
import AuctionAdminConsole from "./components/AuctionAdminConsole";
import AuctionPlayerPoolImport from "./components/AuctionPlayerPoolImport";
import AuctionSummary from "./components/AuctionSummary";
import AuctionPlayerImport from "./components/AuctionPlayerImport";
import AuctionPlayerPoolPage from "./components/AuctionPlayerPoolPage";


function HomePage() {
  return (
    <div className="container mt-4">
      <HomeHighlights />

      <div className="mb-5">
        <MatchCards />
      </div>

      <div className="card bg-dark text-white p-4 shadow mb-5">
        <h4 className="text-center text-success mb-3">
          Limited-Overs Cricket Leaderboard
        </h4>
        <Leaderboard />
      </div>

      <div className="card bg-dark text-white p-4 shadow mb-5">
        <h4 className="text-center text-info mb-3">
          World Test Match Team Rankings
        </h4>
        <TestLeaderboard />
      </div>
    </div>
  );
}

function App() {
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [theme, setTheme] = useState("dark");
  const [checkedAdmin, setCheckedAdmin] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [waitingWorker, setWaitingWorker] = useState(null);

  const { currentUser } = useAuth();

  useEffect(() => {
    document.body.className =
      theme === "dark" ? "bg-dark text-light" : "bg-light text-dark";
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === "dark" ? "light" : "dark"));
  };

  const handleAppUpdate = () => {
    if (waitingWorker) {
      waitingWorker.postMessage({ type: "SKIP_WAITING" });
      waitingWorker.addEventListener("statechange", (e) => {
        if (e.target.state === "activated") {
          window.location.reload();
        }
      });
    }
  };

  useEffect(() => {
    const toggleHandler = () => {
      setSidebarOpen((prev) => !prev);
    };
    window.addEventListener("toggleSidebar", toggleHandler);
    return () => window.removeEventListener("toggleSidebar", toggleHandler);
  }, []);

  useEffect(() => {
    serviceWorkerRegistration.register({
      onUpdate: (registration) => {
        setUpdateAvailable(true);
        setWaitingWorker(registration.waiting);
      },
    });
  }, []);

  if (!checkedAdmin) {
    return (
      <AdminPromptModal
        onAdminResponse={(admin) => {
          setIsAdmin(admin);
          setCheckedAdmin(true);
        }}
      />
    );
  }

  return (
    <div className={theme}>
      {/* ✅ golden slanted watermark background */}
      <div className="crickedge-bg" aria-hidden="true"></div>

      <Router>
        <AppNavbar
          onAuthClick={() => setShowAuthModal(true)}
          toggleTheme={toggleTheme}
          theme={theme}
        />

        {updateAvailable && (
          <div
            role="status"
            aria-live="polite"
            style={{
              position: "fixed",
              bottom: 20,
              left: 20,
              zIndex: 1000,
              background: "#ffc107",
              padding: "12px 18px",
              borderRadius: "8px",
              boxShadow: "0 2px 10px rgba(0,0,0,0.15)",
              color: "#000",
            }}
          >
            <strong>Update available</strong>
            <br />
            <span>Please update your application to get latest features.</span>
            <div className="mt-2 d-flex gap-2">
              <button className="btn btn-success btn-sm" onClick={handleAppUpdate}>
                Update
              </button>
              <button
                className="btn btn-secondary btn-sm"
                onClick={() => setUpdateAvailable(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        <DownloadAppButton />
        <MatchTicker />
        <AuthModal
          show={showAuthModal}
          onClose={() => setShowAuthModal(false)}
        />
        <SidebarMenu
          isOpen={isSidebarOpen}
          onClose={() => setSidebarOpen(false)}
        />

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
              <ProtectedRoute>
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
              <ProtectedRoute>
                <PageWrapper>
                  <MatchHistory />
                </PageWrapper>
              </ProtectedRoute>
            }
          />
          <Route
            path="/graphs"
            element={
              <ProtectedRoute>
                <PageWrapper>
                  <TeamChart />
                </PageWrapper>
              </ProtectedRoute>
            }
          />
          <Route
            path="/all-boards"
            element={
              <ProtectedRoute>
                <PageWrapper>
                  <AllBoardsView />
                </PageWrapper>
              </ProtectedRoute>
            }
          />
          <Route
            path="/boards/analytics"
            element={
              <ProtectedRoute>
                <PageWrapper>
                  <BoardAnalyticsPro />
                </PageWrapper>
              </ProtectedRoute>
            }
          />
          <Route
            path="/pitch-randomizer"
            element={
              <ProtectedRoute>
                <PageWrapper>
                  <PitchRandomizer />
                </PageWrapper>
              </ProtectedRoute>
            }
          />
          <Route
            path="/create-board"
            element={<Navigate to="/register-board" replace />}
          />
          <Route
            path="/register-board"
            element={
              <ProtectedRoute>
                <PageWrapper>
                  <BoardRegistrationForm />
                </PageWrapper>
              </ProtectedRoute>
            }
          />

          {/* ✅ Teams: overview + detail in TeamDetails */}
          <Route
            path="/teams"
            element={
              <PageWrapper>
                <TeamDetails />
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
            path="/faq"
            element={
              <PageWrapper>
                <FaqPage />
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
              <ProtectedRoute>
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
              <ProtectedRoute>
                <PageWrapper>
                  <TeamRanking />
                </PageWrapper>
              </ProtectedRoute>
            }
          />
          <Route
            path="/test-ranking"
            element={
              <ProtectedRoute>
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
                  {isAdmin ? (
                    <AddPlayers isAdmin={isAdmin} />
                  ) : (
                    <div
                      style={{
                        padding: 24,
                        color: "red",
                        textAlign: "center",
                      }}
                    >
                      You are not authorized to access this page.
                    </div>
                  )}
                </PlayerRouteWrapper>
              </ProtectedRoute>
            }
          />
          <Route
            path="/player-stats"
            element={
              <ProtectedRoute>
                <PlayerStats />
              </ProtectedRoute>
            }
          />
          <Route
            path="/player-performance"
            element={
              <ProtectedRoute>
                {isAdmin ? (
                  <PlayerPerformance />
                ) : (
                  <div
                    style={{
                      padding: 24,
                      color: "red",
                      textAlign: "center",
                    }}
                  >
                    You are not authorized to access this page.
                  </div>
                )}
              </ProtectedRoute>
            }
          />
          <Route
            path="/squad-lineup"
            element={
              <ProtectedRoute>
                <PageWrapper>
                  <SquadLineup isAdmin={isAdmin} />
                </PageWrapper>
              </ProtectedRoute>
            }
          />
          <Route
            path="/qualification-scenario"
            element={<QualificationScenario />}
          />
          <Route
            path="/add-upcoming-match"
            element={
              <ProtectedRoute>
                {isAdmin ? (
                  <AddUpcomingMatch isAdmin={isAdmin} />
                ) : (
                  <div
                    style={{
                      padding: 24,
                      color: "red",
                      textAlign: "center",
                    }}
                  >
                    You are not authorized to access this page.
                  </div>
                )}
              </ProtectedRoute>
            }
          />
          <Route
            path="/upcoming-matches"
            element={
              <PageWrapper>
                <UpcomingMatches />
              </PageWrapper>
            }
          />
          <Route path="/player-rankings" element={<PlayerRankings />} />
          <Route path="/match-story" element={<MatchStory />} />
          <Route path="/h2h-records" element={<H2HRecords />} />
          <Route path="/smart-analyzer" element={<SmartAnalyzer />} />
          <Route
            path="/my-dashboard"
            element={
              currentUser ? (
                <UserCricketStatsDashboardV2 />
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
          <Route path="/privacy/delete-account" element={<DeleteAccount />} />
          <Route path="/scheduler" element={<SchedulerPage />} />
          <Route path="/team-distributor" element={<TeamDistributor />} />
          <Route path="/past-matches" element={<PastMatchesHub />} />
          <Route path="/player-report-card" element={<PlayerReportCard />} />
          <Route path="/auction" element={<AuctionLobby />} />
          <Route path="/auction/:auctionId" element={<AuctionRoom />} />
          <Route path="/auction/:auctionId/my-players" element={<AuctionMyPlayers />} />
          <Route path="/auction/:auctionId/admin" element={<AuctionAdminConsole />} />
          <Route path="/auction-player-pool" element={<AuctionPlayerPoolImport />} />
          <Route path="/auction/:auctionId/summary" element={<AuctionSummary />} />
          <Route path="/auction/:auctionId/import-players" element={<AuctionPlayerImport />} />
          <Route path="/auction/:auctionId/player-pool" element={<AuctionPlayerPoolPage />} />

          <Route
            path="/tournament-points"
            element={
              <PageWrapper>
                <TournamentPoints />
              </PageWrapper>
            }
          />
          <Route
            path="/mom-insights"
            element={
              <ProtectedRoute>
                <PageWrapper>
                  <MoMInsights />
                </PageWrapper>
              </ProtectedRoute>
            }
          />
        </Routes>

        <Footer />
      </Router>
    </div>
  );
}

export default App;
