// src/components/forum/ForumPage.js
import React, { useEffect, useState } from "react";
import axios from "axios";
import "./ForumPage.css";

const API = "https://cricket-scoreboard-backend.onrender.com";

export default function ForumPage() {
  const [posts, setPosts] = useState([]);
  const [expandedPost, setExpandedPost] = useState(null);
  const [replies, setReplies] = useState({});
  const [replyText, setReplyText] = useState("");

  const token = localStorage.getItem("token");

  // 🔹 Load posts
  useEffect(() => {
    axios.get(`${API}/api/forum/posts`)
      .then(res => setPosts(res.data))
      .catch(err => console.error(err));
  }, []);

  // 🔹 Load replies
  const loadReplies = async (postId) => {
    const res = await axios.get(`${API}/api/forum/replies/${postId}`);
    setReplies(prev => ({ ...prev, [postId]: res.data }));
    setExpandedPost(postId);
  };

  // 🔹 Add reply
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
    <div className="forum-container">
      <h2>🗣️ CrickEdge Talk</h2>

      {posts.map(post => (
        <div key={post.id} className="forum-post">
          <h3>{post.subject}</h3>
          <p className="content">{post.content}</p>

          <div className="meta">
            <span>👤 {post.author_name}</span>
            <span>📅 {post.post_date} · {post.post_time}</span>
          </div>

          <button onClick={() => loadReplies(post.id)}>
            View Replies
          </button>

          {expandedPost === post.id && (
            <div className="replies">
              {(replies[post.id] || []).map(r => (
                <div key={r.id} className="reply">
                  <b>{r.author_name}</b>
                  <p>{r.content}</p>
                  <small>{r.reply_date} · {r.reply_time}</small>
                </div>
              ))}

              {token && (
                <div className="reply-box">
                  <textarea
                    value={replyText}
                    onChange={e => setReplyText(e.target.value)}
                    placeholder="Write a reply..."
                  />
                  <button onClick={() => submitReply(post.id)}>
                    Reply
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
