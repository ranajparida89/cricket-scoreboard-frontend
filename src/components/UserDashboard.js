import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./UserDashboard.css"; // Make sure your CSS covers all advanced 3D/section styles

const UserDashboard = () => {
  // 1. STATE: user info, all dashboard data, errors, loading
  const [user, setUser] = useState(null);

  // Main sections
  const [favorites, setFavorites] = useState([]);
  const [myPosts, setMyPosts] = useState([]);
  const [achievements, setAchievements] = useState([]);
  const [widgets, setWidgets] = useState({});
  const [activity, setActivity] = useState([]);
  const [profileStats, setProfileStats] = useState({});
  const [notifications, setNotifications] = useState([]);
  const [settings, setSettings] = useState({});

  // UI State
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState("");
  const [showNotif, setShowNotif] = useState(false);
  const navigate = useNavigate();

  // 2. On mount, check login and fetch everything
  useEffect(() => {
    const userData = localStorage.getItem("user");
    if (!userData) {
      navigate("/"); // not logged in
      return;
    }
    const userParsed = JSON.parse(userData);
    setUser(userParsed);
    fetchDashboardData(userParsed.id); // USER ID must be present
  }, [navigate]);

  // 3. Main fetch logic - pulls all endpoints (advance pattern!)
  const fetchDashboardData = async (userId) => {
    setLoading(true);
    setApiError("");
    try {
      const results = await Promise.allSettled([
        fetch(`https://cricket-scoreboard-backend.onrender.com/api/dashboard/favorites?userId=${userId}`),
        fetch(`https://cricket-scoreboard-backend.onrender.com/api/dashboard/posts?userId=${userId}`),
        fetch(`https://cricket-scoreboard-backend.onrender.com/api/dashboard/achievements?userId=${userId}`),
        fetch(`https://cricket-scoreboard-backend.onrender.com/api/dashboard/widgets?userId=${userId}`),
        fetch(`https://cricket-scoreboard-backend.onrender.com/api/dashboard/activity?userId=${userId}`),
        fetch(`https://cricket-scoreboard-backend.onrender.com/api/dashboard/profile?userId=${userId}`),
        fetch(`https://cricket-scoreboard-backend.onrender.com/api/dashboard/notifications?userId=${userId}`),
        fetch(`https://cricket-scoreboard-backend.onrender.com/api/dashboard/settings?userId=${userId}`),
      ]);
      // Validate all - each fallback to empty/blank if missing
      if (results[0].status === "fulfilled") setFavorites(await results[0].value.json());
      if (results[1].status === "fulfilled") setMyPosts(await results[1].value.json());
      if (results[2].status === "fulfilled") setAchievements(await results[2].value.json());
      if (results[3].status === "fulfilled") setWidgets(await results[3].value.json());
      if (results[4].status === "fulfilled") setActivity(await results[4].value.json());
      if (results[5].status === "fulfilled") setProfileStats(await results[5].value.json());
      if (results[6].status === "fulfilled") setNotifications(await results[6].value.json());
      // ✅ Defensive check: set {} if null/undefined
      if (results[7].status === "fulfilled") {
        const settingsData = await results[7].value.json();
        setSettings(settingsData && typeof settingsData === "object" ? settingsData : {});
      }
    } catch (err) {
      setApiError("Error loading dashboard: " + (err?.message || ""));
    } finally {
      setLoading(false);
    }
  };

  // 4. Loading/Error UI
  if (loading) {
    return <div className="dashboard-loading">Loading your dashboard...</div>;
  }
  if (apiError) {
    return (
      <div className="dashboard-error">
        <span>❌ {apiError}</span>
        <button onClick={() => fetchDashboardData(user.id)}>Retry</button>
      </div>
    );
  }

  // 5. MAIN RENDER: 3D Container, elegant sectioning, all validations
  return (
    <div className="dashboard-3d-container">
      {/* Dashboard Header */}
      <div className="dashboard-header-3d">
        <h2>
          <span role="img" aria-label="dashboard">🏠</span> My Cricket Dashboard
        </h2>
        <p>Welcome, <b>{user?.first_name || user?.email}</b>!</p>
        {/* Quick Profile Stats */}
        <div className="dashboard-profile-bar-3d">
          <span>🏏 Matches: <b>{profileStats?.match_count ?? 0}</b></span>
          <span>⭐ Favorites: <b>{profileStats?.favorite_count ?? 0}</b></span>
          <span>🏅 Achievements: <b>{profileStats?.achievement_count ?? 0}</b></span>
          <span>🕒 Activity: <b>{profileStats?.activity_count ?? 0}</b></span>
        </div>
        {/* Notification Bell */}
        <span className="notif-bell-3d" onClick={() => setShowNotif((v) => !v)} title="Show notifications">
          <span role="img" aria-label="notifications">🔔</span>
          {!!(Array.isArray(notifications) && notifications.length) && (
            <span className="notif-dot">{notifications.length}</span>
          )}
        </span>
        {/* Notification List */}
        {showNotif && (
          <div className="notif-list-3d">
            <h5>Notifications</h5>
            {/* ✅ Defensive check for notifications array */}
            {(!Array.isArray(notifications) || notifications.length === 0) && <div>No new notifications.</div>}
            {Array.isArray(notifications) && notifications.map((n, idx) => (
              <div key={idx} className={`notif-item-3d ${n.read ? "read" : "unread"}`}>
                {n.text}
                <span className="notif-date">{n.created_at ? new Date(n.created_at).toLocaleString() : ""}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 3D Quick Stats Widgets */}
      <section className="dashboard-section-3d widget-bar-3d">
        <h4>📊 Quick Stats</h4>
        <div className="widget-row-3d">
          <div className="widget-card-3d">
            <b>Next Match</b>
            <div>
              {widgets?.nextMatch
                ? `${widgets.nextMatch.match_name} (${widgets.nextMatch.team1} vs ${widgets.nextMatch.team2}) - ${widgets.nextMatch.match_date ? new Date(widgets.nextMatch.match_date).toLocaleDateString() : ""}`
                : "No upcoming matches"}
            </div>
          </div>
          <div className="widget-card-3d">
            <b>Last Prediction</b>
            <div>{widgets?.lastPrediction?.prediction || "—"}</div>
            <small>{widgets?.lastPrediction ? (widgets.lastPrediction.is_correct ? "✅ Correct" : "❌ Incorrect") : ""}</small>
          </div>
          <div className="widget-card-3d">
            <b>Prediction Accuracy</b>
            <div>{widgets?.accuracy != null ? `${widgets.accuracy}%` : "—"}</div>
          </div>
          <div className="widget-card-3d">
            <b>Total Posts</b>
            <div>{widgets?.totalPosts ?? "—"}</div>
          </div>
        </div>
      </section>

      {/* Favorite Teams/Players */}
      <section className="dashboard-section-3d">
        <h4>⭐ Favorites</h4>
        <div className="dashboard-favorites-list">
          {/* ✅ Defensive check for favorites array */}
          {(!Array.isArray(favorites) || favorites.length === 0) && <div>No favorites yet.</div>}
          {Array.isArray(favorites) && favorites.map((item, idx) => (
            <div className="favorite-card-3d" key={idx}>
              {item.type === "team" ? (
                <>
                  <img src={item.logo || item.flag_url} alt={item.name} className="favorite-logo" />
                  <div>{item.name}</div>
                </>
              ) : (
                <>
                  <img src={item.avatar || item.avatar_url} alt={item.name} className="favorite-avatar" />
                  <div>{item.name}</div>
                </>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* My Recent Match Posts */}
      <section className="dashboard-section-3d">
        <h4>📝 My Recent Match Posts</h4>
        <ul className="my-posts-list">
          {/* ✅ Defensive check for myPosts array */}
          {(!Array.isArray(myPosts) || myPosts.length === 0) && <li>No match posts yet.</li>}
          {Array.isArray(myPosts) && myPosts.map((post, idx) => (
            <li key={idx}>
              <b>{post.match}</b> &nbsp;
              <span className="post-date">{post.date || post.created_at}</span> &nbsp;
              <span className="post-views">👁️ {post.views || post.view_count} views</span>
            </li>
          ))}
        </ul>
      </section>

      {/* Achievements */}
      <section className="dashboard-section-3d">
        <h4>🏅 Achievements</h4>
        <div className="achievement-list-3d">
          {/* ✅ Defensive check for achievements array */}
          {(!Array.isArray(achievements) || achievements.length === 0) && <div>No achievements yet.</div>}
          {Array.isArray(achievements) && achievements.map((a, idx) => (
            <div className="achievement-card-3d" key={idx} style={{ borderColor: a.color }}>
              <span className="achievement-icon-3d" style={{ color: a.color }}>{a.icon}</span>
              <span>{a.label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Recent Activity */}
      <section className="dashboard-section-3d">
        <h4>🕒 Recent Activity</h4>
        <ul className="activity-list-3d">
          {/* ✅ Defensive check for activity array */}
          {(!Array.isArray(activity) || activity.length === 0) && <li>No recent activity yet.</li>}
          {Array.isArray(activity) && activity.map((a, idx) => (
            <li key={idx}>
              <span className="activity-emoji">{a.icon || "📈"}</span> {a.activity_text}
              <span className="activity-date">{a.activity_date ? new Date(a.activity_date).toLocaleString() : ""}</span>
            </li>
          ))}
        </ul>
      </section>

      {/* Dashboard Settings */}
      <section className="dashboard-section-3d">
        <h4>⚙️ Dashboard Settings</h4>
        <div className="settings-list-3d">
          {/* ✅ Defensive check for settings object */}
          {(!settings || typeof settings !== "object" || Object.keys(settings).length === 0) && <div>No settings found.</div>}
          {settings && typeof settings === "object" &&
            Object.keys(settings).map((key, idx) => (
              <div key={idx} className="setting-item-3d">
                <b>{key.replace(/_/g, " ")}</b>: {String(settings[key])}
              </div>
            ))}
        </div>
      </section>
    </div>
  );
};

export default UserDashboard;
