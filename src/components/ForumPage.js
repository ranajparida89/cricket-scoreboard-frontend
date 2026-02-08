import React, { useEffect, useState } from "react";
import axios from "axios";
import "./ForumPage.css";
import CreatePostModal from "./CreatePostModal";

const API = "https://cricket-scoreboard-backend.onrender.com";

export default function ForumPage() {
  const [posts, setPosts] = useState([]);
  const [expandedPost, setExpandedPost] = useState(null);
  const [replies, setReplies] = useState({});
  const [replyText, setReplyText] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editPost, setEditPost] = useState(null);
  const [showRules, setShowRules] = useState(false);
  const [filterType, setFilterType] = useState("ALL"); // ALL | STORY | COMMENT


  const token = localStorage.getItem("token");
  const currentUser = JSON.parse(localStorage.getItem("user"));

  /* ---------------- FETCH POSTS ---------------- */
  const fetchPosts = async () => {
    const res = await axios.get(`${API}/api/forum/posts`);
    setPosts(res.data);
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  /* ---------------- REPLIES ---------------- */
  const loadReplies = async (postId) => {
    const res = await axios.get(`${API}/api/forum/replies/${postId}`);
    setReplies((prev) => ({ ...prev, [postId]: res.data }));
    setExpandedPost(postId);
  };

  const submitReply = async (postId) => {
    if (!replyText.trim()) return;

    await axios.post(
      `${API}/api/forum/reply`,
      { postId, content: replyText },
      { headers: { Authorization: `Bearer ${token}` } }
    );

    setReplyText("");
    loadReplies(postId);
  };

  /* ---------------- DELETE POST ---------------- */
  const deletePost = async (postId) => {
    if (!window.confirm("Are you sure you want to delete this post?")) return;

    try {
      await axios.delete(`${API}/api/forum/post/${postId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchPosts();
    } catch {
      alert("Failed to delete post");
    }
  };

  /* ---------------- SCROLL TO POST ---------------- */
const scrollToPost = (postId) => {
  const el = document.getElementById(`post-${postId}`);
  if (el) {
    el.scrollIntoView({ behavior: "smooth", block: "start" });
    el.classList.add("forum-highlight");
    setTimeout(() => el.classList.remove("forum-highlight"), 1800);
  }
};

  return (
    <div className="forum-wrapper forum-layout">
        <div className="forum-main">
      {/* HEADER */}
      <div className="forum-header">
  <h1>🗣️ CrickEdge Talk</h1>

  <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
    <select
      className="forum-filter"
      value={filterType}
      onChange={(e) => setFilterType(e.target.value)}
    >
      <option value="ALL">All</option>
      <option value="STORY">Posts</option>
      <option value="COMMENT">Comments</option>
    </select>

    {token && (
      <button
        className="forum-primary-btn"
        onClick={() => {
          setEditPost(null);
          setShowCreateModal(true);
        }}
      >
        ✍️ Create Post
      </button>
    )}
  </div>
</div>
      {/* CRICKEDGE GUIDELINES */}
      <div className="forum-rules">
        <div className="rules-header" onClick={() => setShowRules(!showRules)}>
          📜 Crickedge.in – Community Guidelines{" "}
          <span>{showRules ? "▲" : "▼"}</span>
        </div>

        {showRules && (
          <div className="rules-content">
            <p>
              <strong>Welcome to Crickedge.in</strong>, a community built by and
              for cricket lovers who enjoy virtual cricket gaming.
              <br />
              We connect daily to play cricket games on PlayStation, track match
              records, and grow together as players and friends.
            </p>

            <p>
              To keep Crickedge.in fun, fair, and respectful for everyone, all
              members are expected to follow these community guidelines.
            </p>

            <h4>1. Our Community Values</h4>
            <ul>
              <li>Friendship – Play hard, but stay friendly</li>
              <li>Integrity – Fair play always comes first</li>
              <li>Mutual Respect – Respect players, teams, and decisions</li>
              <li>Community Spirit – We grow together, win or lose</li>
            </ul>
            <p>
              Every member is expected to uphold these values, both on and off
              the field.
            </p>

            <h4>2. Respect Every Player</h4>
            <ul>
              <li>
                Treat all members with respect, regardless of skill level or
                experience
              </li>
              <li>
                No abusive language, harassment, bullying, or personal attacks
              </li>
              <li>Friendly banter is okay, but crossing the line is not</li>
              <li>
                Racist, sexist, or hateful comments are strictly not allowed
              </li>
            </ul>
            <p>
              <em>Remember: Competitive cricket is fun. Disrespect is not.</em>
            </p>

            <h4>3. Fair Play & Integrity</h4>
            <ul>
              <li>Play honestly and follow agreed match rules</li>
              <li>No cheating, exploiting game bugs, or unfair advantages</li>
              <li>
                Accept match results gracefully—wins and losses are part of the
                game
              </li>
              <li>Match records must be entered truthfully</li>
            </ul>
            <p>Integrity keeps the community strong and trustworthy.</p>

            <h4>4. Match Records & Updates</h4>
            <ul>
              <li>Update match results accurately and on time</li>
              <li>Do not manipulate scores, stats, or player records</li>
              <li>
                If there’s a dispute, resolve it calmly or raise it to moderators
              </li>
            </ul>
            <p>
              Transparency is key to a healthy competitive environment.
            </p>

            <h4>5. Communication Guidelines</h4>
            <ul>
              <li>Keep discussions relevant to cricket and gaming</li>
              <li>
                Avoid spamming, repeated messages, or promotional content
                without permission
              </li>
              <li>
                Disagreements are normal—handle them maturely and respectfully
              </li>
              <li>
                Use clear and polite language in chats, comments, and forums
              </li>
            </ul>

            <h4>6. New Members Expectations</h4>
            <ul>
              <li>Take time to understand the rules and match formats</li>
              <li>Be open to learning and improving your gameplay</li>
              <li>Respect senior members and moderators</li>
              <li>Ask questions—this is a supportive community</li>
            </ul>
            <p>Everyone was a beginner once.</p>

            <h4>7. Moderation & Actions</h4>
            <ul>
              <li>
                Moderators may warn, mute, or suspend members who break
                guidelines
              </li>
              <li>
                Serious or repeated violations may lead to permanent removal
              </li>
              <li>
                Moderator decisions are made in the best interest of the
                community
              </li>
            </ul>

            <h4>8. One Simple Rule to Remember</h4>
            <p>
              <strong>
                Play with passion. Compete with honesty. Treat everyone like a
                teammate.
              </strong>
            </p>
            <p>If you follow this, you’ll always belong at Crickedge.in.</p>
          </div>
        )}
      </div>

      {/* POSTS */}
          {filteredPosts.map((post) => {
        const isOwner =
          currentUser && currentUser.email === post.author_name;

        return (
          <div key={post.id} id={`post-${post.id}`} className="forum-card">
            <h3>{post.subject}</h3>
            <p className="forum-text">{post.content}</p>

            <div className="forum-meta">
              <span>👤 {post.author_name}</span>
              <span>
                📅 {post.post_date} · {post.post_time}
              </span>
            </div>

            {isOwner && (
              <div className="forum-owner-actions">
                <button
                  className="forum-secondary-btn"
                  onClick={() => {
                    setEditPost(post);
                    setShowCreateModal(true);
                  }}
                >
                  ✏️ Edit
                </button>

                <button
                  className="forum-danger-btn"
                  onClick={() => deletePost(post.id)}
                >
                  🗑 Delete
                </button>
              </div>
            )}

            <button
              className="forum-secondary-btn"
              onClick={() => loadReplies(post.id)}
            >
              View Replies
            </button>

            {expandedPost === post.id && (
              <div className="forum-replies">
                {(replies[post.id] || []).map((r) => (
                  <div key={r.id} className="forum-reply">
                    <strong>{r.author_name}</strong>
                    <p>{r.content}</p>
                    <small>
                      {r.reply_date} · {r.reply_time}
                    </small>
                  </div>
                ))}

                {token && (
                  <div className="forum-reply-box">
                    <textarea
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      placeholder="Write a thoughtful reply…"
                    />
                    <button
                      className="forum-primary-btn"
                      onClick={() => submitReply(post.id)}
                    >
                      Reply
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
      </div> {/* ✅ CLOSE forum-main */}
     {/* ================= RECENT DISCUSSIONS ================= */}
    <div className="forum-recent">
      <h4>🕘 Recent Discussions</h4>

     <ul>
  {[...posts].reverse().map((post) => (
    <li
      key={post.id}
      onClick={() => scrollToPost(post.id)}
      title={post.subject}
    >
      {post.subject}
    </li>
  ))}
</ul>
</div> {/* ✅ CLOSE forum-recent */}

<CreatePostModal
  show={showCreateModal}
  onClose={() => setShowCreateModal(false)}
  onPostCreated={fetchPosts}
  editPost={editPost}
/>

</div> 
);
}
