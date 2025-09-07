import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./UserDashboard.css";

const API = "https://cricket-scoreboard-backend.onrender.com/api";

const UserDashboard = () => {
  const [user, setUser] = useState(null);
  const [favorites, setFavorites] = useState([]);
  const [myPosts, setMyPosts] = useState([]);
  const [achievements, setAchievements] = useState([]);
  const [widgets, setWidgets] = useState({});
  const [activity, setActivity] = useState([]);
  const [profileStats, setProfileStats] = useState({});
  const [notifications, setNotifications] = useState([]);
  const [settings, setSettings] = useState({});
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState("");
  const [showNotif, setShowNotif] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const userData = localStorage.getItem("user");
    if (!userData) {
      navigate("/");
      return;
    }
    const userParsed = JSON.parse(userData);
    setUser(userParsed);
    fetchDashboardData(userParsed.id);
  }, [navigate]);

  const fetchDashboardData = async (userId) => {
    setLoading(true);
    setApiError("");
    try {
      const results = await Promise.allSettled([
        fetch(`${API}/dashboard/favorites?userId=${userId}`),
        fetch(`${API}/dashboard/posts?userId=${userId}`),
        fetch(`${API}/dashboard/achievements?userId=${userId}`),
        fetch(`${API}/dashboard/widgets?userId=${userId}`),
        fetch(`${API}/dashboard/activity?userId=${userId}`),
        fetch(`${API}/dashboard/profile?userId=${userId}`),
        fetch(`${API}/dashboard/notifications?userId=${userId}`),
        fetch(`${API}/dashboard/settings?userId=${userId}`),
      ]);

      if (results[0].status === "fulfilled") setFavorites(await results[0].value.json());
      if (results[1].status === "fulfilled") setMyPosts(await results[1].value.json());
      if (results[2].status === "fulfilled") setAchievements(await results[2].value.json());
      if (results[3].status === "fulfilled") setWidgets(await results[3].value.json());
      if (results[4].status === "fulfilled") setActivity(await results[4].value.json());
      if (results[5].status === "fulfilled") setProfileStats(await results[5].value.json());
      if (results[6].status === "fulfilled") setNotifications(await results[6].value.json());
      if (results[7].status === "fulfilled") {
        const s = await results[7].value.json();
        setSettings(s && typeof s === "object" ? s : {});
      }
    } catch (err) {
      setApiError("Error loading dashboard: " + (err?.message || ""));
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="ud-loading">Loading your dashboard…</div>;
  }
  if (apiError) {
    return (
      <div className="ud-error">
        <span>❌ {apiError}</span>
        <button onClick={() => fetchDashboardData(user.id)}>Retry</button>
      </div>
    );
  }

  return (
    <div className="ud-shell card-3d glass">
      {/* Header */}
      <header className="ud-header">
        <div className="ud-identity">
          <img
            className="ud-avatar"
            src={user?.photo_url || "/default-profile.png"}
            alt="Profile"
          />
          <div className="ud-welcome">
            <h2>My Cricket Dashboard</h2>
            <p>
              Welcome, <b>{user?.first_name || user?.name || user?.email}</b>
            </p>
            <div className="ud-quick">
              <span>🏏 Matches: <b>{profileStats?.match_count ?? 0}</b></span>
              <span>⭐ Favorites: <b>{profileStats?.favorite_count ?? 0}</b></span>
              <span>🏅 Achievements: <b>{profileStats?.achievement_count ?? 0}</b></span>
              <span>🕒 Activity: <b>{profileStats?.activity_count ?? 0}</b></span>
            </div>
          </div>
        </div>

        <button
          className="ud-bell"
          onClick={() => setShowNotif((v) => !v)}
          aria-label="Toggle notifications"
        >
          🔔
          {!!(Array.isArray(notifications) && notifications.length) && (
            <span className="ud-bell-dot">{notifications.length}</span>
          )}
        </button>

        {showNotif && (
          <div className="ud-notifs card-3d glass">
            <h5>Notifications</h5>
            {(!Array.isArray(notifications) || notifications.length === 0) && (
              <div className="ud-empty">No new notifications.</div>
            )}
            {Array.isArray(notifications) &&
              notifications.map((n, idx) => (
                <div key={idx} className={`ud-notif ${n.read ? "read" : "unread"}`}>
                  <div className="ud-notif-text">{n.text}</div>
                  <div className="ud-notif-date">
                    {n.created_at ? new Date(n.created_at).toLocaleString() : ""}
                  </div>
                </div>
              ))}
          </div>
        )}
      </header>

      {/* Content grid */}
      <div className="ud-grid">
        {/* Quick widgets */}
        <section className="ud-card card-3d glass">
          <h3 className="ud-sec-title">📊 Quick Stats</h3>
          <div className="ud-widgets">
            <div className="ud-widget">
              <b>Next Match</b>
              <div>
                {widgets?.nextMatch
                  ? `${widgets.nextMatch.match_name} (${widgets.nextMatch.team_playing}) — ${
                      widgets.nextMatch.match_date
                        ? new Date(widgets.nextMatch.match_date).toLocaleDateString()
                        : ""
                    } @ ${widgets.nextMatch.location}`
                  : "No upcoming matches"}
              </div>
            </div>
            <div className="ud-widget">
              <b>Last Prediction</b>
              <div>{widgets?.lastPrediction?.prediction || "—"}</div>
              <small>
                {widgets?.lastPrediction
                  ? widgets.lastPrediction.is_correct
                    ? "✅ Correct"
                    : "❌ Incorrect"
                  : ""}
              </small>
            </div>
            <div className="ud-widget">
              <b>Prediction Accuracy</b>
              <div>{widgets?.accuracy != null ? `${widgets.accuracy}%` : "—"}</div>
            </div>
            <div className="ud-widget">
              <b>Total Posts</b>
              <div>{widgets?.totalPosts ?? "—"}</div>
            </div>
          </div>
        </section>

        {/* Favorites */}
        <section className="ud-card card-3d glass">
          <h3 className="ud-sec-title">⭐ Favorites</h3>
          <div className="ud-favs">
            {(!Array.isArray(favorites) || favorites.length === 0) && (
              <div className="ud-empty">No favorites yet.</div>
            )}
            {Array.isArray(favorites) &&
              favorites.map((item, idx) => (
                <div className="ud-fav" key={idx}>
                  {item.type === "team" ? (
                    <>
                      <img
                        src={item.logo || item.flag_url}
                        alt={item.name}
                        className="ud-fav-img"
                      />
                      <div className="ud-fav-name">{item.name}</div>
                    </>
                  ) : (
                    <>
                      <img
                        src={item.avatar || item.avatar_url}
                        alt={item.name}
                        className="ud-fav-img"
                      />
                      <div className="ud-fav-name">{item.name}</div>
                    </>
                  )}
                </div>
              ))}
          </div>
        </section>

        {/* Posts */}
        <section className="ud-card card-3d glass">
          <h3 className="ud-sec-title">📝 My Recent Match Posts</h3>
          <ul className="ud-posts">
            {(!Array.isArray(myPosts) || myPosts.length === 0) && (
              <li className="ud-empty">No match posts yet.</li>
            )}
            {Array.isArray(myPosts) &&
              myPosts.map((post, idx) => (
                <li key={idx} className="ud-post">
                  <b className="ud-post-title">{post.match}</b>
                  <span className="ud-post-meta">
                    {post.date || post.created_at}
                  </span>
                  <span className="ud-post-views">👁️ {post.views || post.view_count} views</span>
                </li>
              ))}
          </ul>
        </section>

        {/* Achievements (mini) */}
        <section className="ud-card card-3d glass">
          <h3 className="ud-sec-title">🏅 Recent Achievements</h3>
          <div className="ud-ach">
            {(!Array.isArray(achievements) || achievements.length === 0) && (
              <div className="ud-empty">No achievements yet.</div>
            )}
            {Array.isArray(achievements) &&
              achievements.slice(0, 6).map((a, idx) => (
                <div key={idx} className="ud-ach-item" title={a.label}>
                  <span className="ud-ach-icon" style={{ color: a.color }}>
                    {a.icon}
                  </span>
                  <span className="ud-ach-text">{a.label}</span>
                </div>
              ))}
          </div>
        </section>

        {/* Activity */}
        <section className="ud-card card-3d glass">
          <h3 className="ud-sec-title">🕒 Recent Activity</h3>
          <ul className="ud-activity">
            {(!Array.isArray(activity) || activity.length === 0) && (
              <li className="ud-empty">No recent activity yet.</li>
            )}
            {Array.isArray(activity) &&
              activity.map((a, idx) => (
                <li key={idx} className="ud-activity-row">
                  <span className="ud-act-emoji">{a.icon || "📈"}</span>
                  <span className="ud-act-text">{a.activity_text}</span>
                  <span className="ud-act-date">
                    {a.activity_date ? new Date(a.activity_date).toLocaleString() : ""}
                  </span>
                </li>
              ))}
          </ul>
        </section>

        {/* Settings */}
        <section className="ud-card card-3d glass">
          <h3 className="ud-sec-title">⚙️ Dashboard Settings</h3>
          <div className="ud-settings">
            {(!settings || typeof settings !== "object" || Object.keys(settings).length === 0) && (
              <div className="ud-empty">No settings found.</div>
            )}
            {settings &&
              typeof settings === "object" &&
              Object.keys(settings).map((key, idx) => (
                <div key={idx} className="ud-setting">
                  <b>{key.replace(/_/g, " ")}</b>
                  <span className="ud-setting-val">{String(settings[key])}</span>
                </div>
              ))}
          </div>
        </section>
      </div>
    </div>
  );
};

export default UserDashboard;
