import React, { useState, useEffect } from "react";

// USE YOUR RENDER BACKEND!
const API_BASE = "https://cricket-scoreboard-backend.onrender.com/api/gallery";

function getCurrentUser() {
  try { return JSON.parse(localStorage.getItem("user")); } catch { return null; }
}

export default function Gallery() {
  const user = getCurrentUser();
  const [images, setImages] = useState([]);
  const [selected, setSelected] = useState(null);
  const [comment, setComment] = useState("");
  const [uploading, setUploading] = useState(false);
  const [err, setErr] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => { fetchImages(); }, []);
  function fetchImages() {
    fetch(`${API_BASE}/list`)
      .then(r => r.json())
      .then(data => setImages(data.images || []));
  }

  async function handleUpload(e) {
    e.preventDefault();
    if (!selected) return setErr("Select an image!");
    if (!user) return setErr("Please log in.");
    setErr(""); setSuccess("");
    const formData = new FormData();
    formData.append("image", selected);
    formData.append("comment", comment);
    formData.append("user_id", user.id);
    formData.append("user_name", user.first_name || user.email);

    setUploading(true);
    try {
      const res = await fetch(`${API_BASE}/upload`, { method: "POST", body: formData });
      if (!res.ok) throw new Error("Failed to upload");
      setSuccess("Photo uploaded!");
      setSelected(null);
      setComment("");
      fetchImages();
    } catch {
      setErr("Error uploading photo");
    }
    setUploading(false);
  }

  async function handleDelete(id) {
    if (!window.confirm("Delete this photo?")) return;
    try {
      // You may need to send auth headers or a JWT here if required by your backend.
      const res = await fetch(`${API_BASE}/${id}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: user.id })
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      fetchImages();
    } catch (err) { setErr(err.message); }
  }

  return (
    <div className="gallery-root">
      <div className="gallery-upload-card">
        <h2>📸 Share your cricket moments!</h2>
        <form onSubmit={handleUpload} className="gallery-form">
          <input
            type="file"
            accept="image/*"
            className="gallery-file"
            onChange={e => setSelected(e.target.files[0])}
          />
          <textarea
            className="gallery-comment"
            rows={2}
            placeholder="Write a comment (e.g., Match highlight, Milestone, etc)"
            value={comment}
            onChange={e => setComment(e.target.value)}
            maxLength={160}
          />
          <button className="gallery-upload-btn" disabled={uploading}>
            {uploading ? "Uploading..." : "Upload"}
          </button>
          {err && <div className="gallery-error">{err}</div>}
          {success && <div className="gallery-success">{success}</div>}
        </form>
      </div>
      <div className="gallery-grid">
        {images.map(img => (
          <div className="gallery-card" key={img.id}>
            <img src={img.image_url} className="gallery-image" alt="gallery" />
            <div className="gallery-meta">
              <span className="gallery-comment-text">{img.comment}</span>
              <span className="gallery-meta-info">
                <span className="gallery-uploader">By <b>{img.uploaded_by_name}</b></span>
                <span className="gallery-date">{new Date(img.uploaded_at).toLocaleString()}</span>
              </span>
              {user && img.uploaded_by === user.id && (
                <button className="gallery-delete-btn" onClick={() => handleDelete(img.id)}>🗑️ Delete</button>
              )}
            </div>
          </div>
        ))}
      </div>
      {/* MODERN CSS */}
      <style>{`
        .gallery-root {
          min-height: 100vh;
          background: linear-gradient(120deg,#1e2335 0%,#263554 100%);
          padding: 2rem 0;
        }
        .gallery-upload-card {
          max-width: 460px;
          margin: 0 auto 2rem auto;
          background: rgba(38,48,80,0.92);
          border-radius: 1.6em;
          padding: 2.3em 2em;
          box-shadow: 0 4px 38px #0aeff444;
        }
        .gallery-form {
          display: flex; flex-direction: column; gap: 1.3em;
        }
        .gallery-file {
          background: #fff;
          border-radius: 0.6em;
          font-size: 1.1em;
          padding: 8px 6px;
          border: none;
          box-shadow: 0 1px 4px #0036;
        }
        .gallery-comment {
          font-size: 1.08em;
          border-radius: .7em;
          padding: .7em 1.2em;
          border: 1.4px solid #13fffe44;
          background: rgba(28,32,60,0.16);
          color: #fff;
        }
        .gallery-upload-btn {
          background: linear-gradient(90deg,#25df9d 20%,#18e8e4 100%);
          color: #193039;
          border: none;
          font-weight: 800;
          font-size: 1.13em;
          padding: .6em 2em;
          border-radius: 1em;
          cursor: pointer;
          box-shadow: 0 3px 13px #12e8e422;
          transition: background .13s, transform .11s;
        }
        .gallery-upload-btn:active { transform: scale(.97);}
        .gallery-error { color: #FFD700; font-weight: 600; }
        .gallery-success { color: #29ffa9; font-weight: 600; }
        .gallery-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
          gap: 2.4em;
          max-width: 1200px;
          margin: 0 auto;
        }
        .gallery-card {
          background: rgba(31,38,63,0.94);
          border-radius: 1.5em;
          box-shadow: 0 4px 23px #1affee22;
          overflow: hidden;
          display: flex;
          flex-direction: column;
          transition: transform 0.14s;
        }
        .gallery-card:hover { transform: translateY(-3px) scale(1.02);}
        .gallery-image {
          width: 100%; height: 230px; object-fit: cover;
          background: #333;
          border-radius: 1.5em 1.5em 0 0;
          box-shadow: 0 2px 9px #22e8f222;
        }
        .gallery-meta {
          padding: 1em 1.3em 1.2em 1.3em;
          display: flex;
          flex-direction: column;
          gap: .65em;
        }
        .gallery-comment-text {
          color: #30faff;
          font-size: 1.12em;
          font-weight: 600;
          word-break: break-word;
        }
        .gallery-meta-info {
          display: flex;
          flex-direction: row;
          justify-content: space-between;
          font-size: .98em;
          color: #b2fff9;
        }
        .gallery-uploader b { color: #13ffe4;}
        .gallery-delete-btn {
          margin-top: 1em;
          background: linear-gradient(90deg,#ff6a9d 20%,#f13a6e 100%);
          color: #fff;
          border: none;
          border-radius: 1.2em;
          font-weight: bold;
          padding: .45em 1.5em;
          cursor: pointer;
          box-shadow: 0 2px 10px #ffb6f122;
          font-size: 1em;
          transition: background .12s, transform .1s;
        }
        .gallery-delete-btn:active { transform: scale(.97);}
        @media (max-width:700px) {
          .gallery-upload-card { padding:1.2em .5em;}
          .gallery-grid { gap: 1.3em;}
          .gallery-card { font-size: .96em;}
          .gallery-image { height: 155px;}
        }
      `}</style>
    </div>
  );
}
