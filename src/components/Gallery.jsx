import React, { useState, useEffect, useRef } from "react";

// Your deployed backend for gallery API and static images
const API_BASE = "https://cricket-scoreboard-backend.onrender.com/api/gallery";
const BACKEND_STATIC_BASE = "https://cricket-scoreboard-backend.onrender.com";

function getCurrentUser() {
  try { return JSON.parse(localStorage.getItem("user")); } catch { return null; }
}

export default function Gallery() {
  const user = getCurrentUser();
  const [images, setImages] = useState([]);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [comment, setComment] = useState("");
  const [uploading, setUploading] = useState(false);
  const [err, setErr] = useState("");
  const [success, setSuccess] = useState("");
  const fileInputRef = useRef();

  // Modal state for preview
  const [modalOpen, setModalOpen] = useState(false);
  const [modalImg, setModalImg] = useState(null);

  useEffect(() => { fetchImages(); }, []);
  function fetchImages() {
    fetch(`${API_BASE}/list`)
      .then(r => r.json())
      .then(data => setImages(data.images || []))
      .catch(() => setErr("Could not load gallery images"));
  }

  async function handleUpload(e) {
    e.preventDefault();
    if (!selectedFiles.length) return setErr("Select at least one image!");
    if (!user) return setErr("Please log in.");
    setErr(""); setSuccess("");
    setUploading(true);
    let uploadedCount = 0;
    let errorCount = 0;

    for (let file of selectedFiles) {
      const formData = new FormData();
      formData.append("image", file);
      formData.append("comment", comment);
      formData.append("user_id", user.id);
      formData.append("user_name", user.first_name || user.email);

      try {
        const res = await fetch(`${API_BASE}/upload`, { method: "POST", body: formData });
        if (!res.ok) errorCount++;
        else uploadedCount++;
      } catch {
        errorCount++;
      }
    }
    if (uploadedCount) setSuccess(`${uploadedCount} photo(s) uploaded!`);
    if (errorCount) setErr(`Error uploading ${errorCount} photo(s)`);
    setSelectedFiles([]);
    setComment("");
    fileInputRef.current.value = "";
    fetchImages();
    setUploading(false);
  }

  async function handleDelete(id) {
    if (!window.confirm("Delete this photo?")) return;
    try {
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

  // MODAL: Open with image obj
  function openModal(img) {
    setModalImg(img);
    setModalOpen(true);
  }
  function closeModal() {
    setModalOpen(false);
    setModalImg(null);
  }

  // --- MODAL: Zoom/Pan (touch)
  const imgZoomRef = useRef(null);
  useEffect(() => {
    if (!modalOpen) return;
    const img = imgZoomRef.current;
    if (!img) return;
    let scale = 1, lastScale = 1;
    let pos = { x: 0, y: 0 }, lastPos = { x: 0, y: 0 };
    let dragging = false, pinch = false, startDist = 1;

    function getDist(e) {
      if (e.touches.length < 2) return 1;
      const [a, b] = e.touches;
      return Math.sqrt((a.clientX - b.clientX)**2 + (a.clientY - b.clientY)**2);
    }

    function onTouchStart(e) {
      if (e.touches.length === 2) {
        pinch = true;
        startDist = getDist(e);
        lastScale = scale;
      } else if (e.touches.length === 1) {
        dragging = true;
        lastPos = { x: e.touches[0].clientX - pos.x, y: e.touches[0].clientY - pos.y };
      }
    }
    function onTouchMove(e) {
      if (pinch && e.touches.length === 2) {
        const dist = getDist(e);
        scale = Math.min(4, Math.max(1, lastScale * (dist / startDist)));
        img.style.transform = `scale(${scale}) translate(${pos.x/scale}px, ${pos.y/scale}px)`;
      } else if (dragging && e.touches.length === 1 && scale > 1) {
        pos.x = e.touches[0].clientX - lastPos.x;
        pos.y = e.touches[0].clientY - lastPos.y;
        img.style.transform = `scale(${scale}) translate(${pos.x/scale}px, ${pos.y/scale}px)`;
      }
    }
    function onTouchEnd(e) {
      if (pinch && e.touches.length < 2) pinch = false;
      if (dragging && e.touches.length === 0) dragging = false;
    }
    img.addEventListener("touchstart", onTouchStart, { passive: false });
    img.addEventListener("touchmove", onTouchMove, { passive: false });
    img.addEventListener("touchend", onTouchEnd, { passive: false });
    // Double-tap zoom
    let lastTap = 0;
    img.addEventListener("touchend", e => {
      const now = Date.now();
      if (now - lastTap < 350) {
        scale = scale > 1 ? 1 : 2;
        img.style.transform = `scale(${scale}) translate(0,0)`;
      }
      lastTap = now;
    });

    // Mousewheel zoom (desktop)
    img.addEventListener("wheel", e => {
      e.preventDefault();
      scale += e.deltaY < 0 ? 0.15 : -0.15;
      scale = Math.max(1, Math.min(scale, 4));
      img.style.transform = `scale(${scale}) translate(0,0)`;
    });

    return () => {
      img.removeEventListener("touchstart", onTouchStart);
      img.removeEventListener("touchmove", onTouchMove);
      img.removeEventListener("touchend", onTouchEnd);
    };
  }, [modalOpen]);

  return (
    <div className="gallery-root">
      <div className="gallery-upload-card">
        <h2 style={{marginBottom: 10}}>📸 Share your cricket moments!</h2>
        <form onSubmit={handleUpload} className="gallery-form">
          <input
            type="file"
            accept="image/*"
            className="gallery-file"
            ref={fileInputRef}
            multiple
            onChange={e => setSelectedFiles(Array.from(e.target.files))}
          />
          <textarea
            className="gallery-comment"
            rows={2}
            placeholder="Write a comment (applied to all selected images)"
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
        {selectedFiles.length > 1 &&
          <div style={{fontSize:"0.96em", color:"#31ffc3", marginTop:"7px"}}>
            {selectedFiles.length} images selected
          </div>
        }
      </div>
      <div className="gallery-grid">
        {images.map(img => (
          <div className="gallery-card" key={img.id}>
            <img
              src={BACKEND_STATIC_BASE + img.image_url}
              className="gallery-image"
              alt="gallery"
              onClick={() => openModal(img)}
              style={{cursor:"zoom-in"}}
              onError={e => { e.target.src = "https://via.placeholder.com/400x220/2e3440/ffffff?text=No+Image"; }}
            />
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
      {/* ----------- Image Modal ------------ */}
      {modalOpen && modalImg && (
        <div className="gallery-modal-bg" onClick={closeModal}>
          <div className="gallery-modal-content" onClick={e => e.stopPropagation()}>
            <img
              src={BACKEND_STATIC_BASE + modalImg.image_url}
              ref={imgZoomRef}
              className="gallery-modal-img"
              alt="Full"
              draggable="false"
            />
            <div className="gallery-modal-details">
              <div className="gallery-modal-comment">{modalImg.comment}</div>
              <div className="gallery-modal-meta">
                By <b>{modalImg.uploaded_by_name}</b> | {new Date(modalImg.uploaded_at).toLocaleString()}
              </div>
              <button className="gallery-modal-close" onClick={closeModal}>✖</button>
            </div>
          </div>
        </div>
      )}
      {/* Modern Responsive CSS */}
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
        /* -------- Modal CSS -------- */
        .gallery-modal-bg {
          position: fixed; top: 0; left: 0; right: 0; bottom: 0;
          background: rgba(14,22,40,0.90);
          z-index: 1003;
          display: flex;
          align-items: center;
          justify-content: center;
          animation: galleryModalBgIn 0.23s;
        }
        @keyframes galleryModalBgIn {
          from { background:rgba(14,22,40,0.0); }
          to   { background:rgba(14,22,40,0.90);}
        }
        .gallery-modal-content {
          position: relative;
          background: none;
          box-shadow: none;
          display: flex;
          flex-direction: column;
          align-items: center;
        }
        .gallery-modal-img {
          max-width: 94vw;
          max-height: 66vh;
          border-radius: 1.3em;
          box-shadow: 0 4px 33px #0aeff455;
          margin-bottom: 1em;
          transition: transform 0.18s;
          background: #111;
          touch-action: pinch-zoom;
        }
        .gallery-modal-details {
          text-align: center;
          color: #33e7ff;
          font-size: 1.08em;
          margin-bottom: 0.3em;
        }
        .gallery-modal-comment {
          font-size: 1.18em;
          color: #00ffe4;
          font-weight: 600;
          margin-bottom: 0.25em;
        }
        .gallery-modal-meta {
          font-size: 0.96em;
          color: #bafffd;
        }
        .gallery-modal-close {
          position: absolute;
          top: 0.25em; right: 0.65em;
          background: #fff;
          color: #1f3f4f;
          font-size: 1.55em;
          border-radius: 2.3em;
          border: none;
          font-weight: bold;
          width: 38px; height: 38px;
          cursor: pointer;
          box-shadow: 0 1px 8px #2aeefb33;
          transition: background 0.13s;
        }
        .gallery-modal-close:active { background: #30dff7; color: #fff;}
        @media (max-width:700px) {
          .gallery-upload-card { padding:1.2em .5em;}
          .gallery-grid { gap: 1.3em;}
          .gallery-card { font-size: .96em;}
          .gallery-image { height: 155px;}
          .gallery-modal-img { max-width: 99vw; max-height: 54vh;}
        }
      `}</style>
    </div>
  );
}
