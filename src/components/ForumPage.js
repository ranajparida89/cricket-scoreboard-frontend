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

  const token = localStorage.getItem("token");
  const currentUser = JSON.parse(localStorage.getItem("user")); // 👈 owner check

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

  return (
    <div className="forum-wrapper">
      {/* HEADER */}
      <div className="forum-header">
        <h1>🗣️ CrickEdge Talk</h1>

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

      {/* RULES */}
      <div className="forum-rules">
        <div className="rules-header" onClick={() => setShowRules(!showRules)}>
          📜 Forum Rules <span>{showRules ? "▲" : "▼"}</span>
        </div>

        {showRules && (
          <ul className="rules-content">
            <li>Respect all cricketers and members</li>
            <li>No abusive, hateful, or misleading content</li>
            <li>No unverified allegations</li>
            <li>Admins may remove content anytime</li>
          </ul>
        )}
      </div>

      {/* POSTS */}
      {posts.map((post) => {
        const isOwner =
          currentUser && currentUser.email === post.author_name;

        return (
          <div key={post.id} className="forum-card">
            <h3>{post.subject}</h3>
            <p className="forum-text">{post.content}</p>

            <div className="forum-meta">
              <span>👤 {post.author_name}</span>
              <span>
                📅 {post.post_date} · {post.post_time}
              </span>
            </div>

            {/* OWNER ACTIONS */}
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

            {/* REPLIES */}
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

      {/* CREATE / EDIT MODAL */}
      <CreatePostModal
        show={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onPostCreated={fetchPosts}
        editPost={editPost}   // 👈 NEW
      />
    </div>
  );
}
