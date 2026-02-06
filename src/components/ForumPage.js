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
  const [showRules, setShowRules] = useState(false);

  const token = localStorage.getItem("token");

  const fetchPosts = async () => {
    const res = await axios.get(`${API}/api/forum/posts`);
    setPosts(res.data);
  };

  useEffect(() => {
    fetchPosts();
  }, []);

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

  return (
    <div className="forum-wrapper">
      <div className="forum-header">
        <h1>🗣️ CrickEdge Talk</h1>

        {token && (
          <button
            className="forum-primary-btn"
            onClick={() => setShowCreateModal(true)}
          >
            ✍️ Create Post
          </button>
        )}
      </div>

      {/* RULES – COLLAPSIBLE */}
      <div className="forum-rules">
        <div
          className="rules-header"
          onClick={() => setShowRules(!showRules)}
        >
          📜 Forum Rules
          <span>{showRules ? "▲" : "▼"}</span>
        </div>

        {showRules && (
          <ul className="rules-content">
            <li>Be respectful to all members</li>
            <li>No abusive or political content</li>
            <li>No spam or self-promotion</li>
            <li>Cricket-related discussions preferred</li>
            <li>Admin decisions are final</li>
          </ul>
        )}
      </div>

      {/* POSTS */}
      {posts.map((post) => (
        <div key={post.id} className="forum-card">
          <h3>{post.subject}</h3>
          <p className="forum-text">{post.content}</p>

          <div className="forum-meta">
            <span>👤 {post.author_name}</span>
            <span>
              📅 {post.post_date} · {post.post_time}
            </span>
          </div>

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
      ))}

      <CreatePostModal
        show={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onPostCreated={fetchPosts}
      />
    </div>
  );
}
