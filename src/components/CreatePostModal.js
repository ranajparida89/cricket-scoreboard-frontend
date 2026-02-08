import React, { useEffect, useState } from "react";
import { Modal, Button, Form } from "react-bootstrap";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";

const API = "https://cricket-scoreboard-backend.onrender.com";

const CreatePostModal = ({ show, onClose, onPostCreated, editPost }) => {
  const [postType, setPostType] = useState("STORY");
  const [subject, setSubject] = useState("");
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);

  const token = localStorage.getItem("token");

  const quillModules = {
  toolbar: [
    [{ header: [1, 2, 3, false] }],
    ["bold", "italic", "underline", "strike"],
    [{ color: [] }, { background: [] }],
    [{ list: "ordered" }, { list: "bullet" }],
    [{ align: [] }],
    ["link"],
    ["clean"],
  ],
};

const quillFormats = [
  "header",
  "bold",
  "italic",
  "underline",
  "strike",
  "color",
  "background",
  "list",
  "bullet",
  "align",
  "link",
];
  /* --------------------------------------------------
     PREFILL DATA WHEN EDITING
  -------------------------------------------------- */
  useEffect(() => {
    if (editPost) {
      setPostType(editPost.post_type);
      setSubject(editPost.subject || "");
      setContent(editPost.content || "");
    } else {
      setPostType("STORY");
      setSubject("");
      setContent("");
    }
  }, [editPost]);

  /* --------------------------------------------------
     SUBMIT (CREATE or UPDATE)
  -------------------------------------------------- */
  const handleSubmit = async () => {
    if (!token) {
      alert("Please login to continue");
      return;
    }

    if (postType === "STORY" && !subject.trim()) {
      alert("Subject is required");
      return;
    }

 if (!content || content.replace(/<(.|\n)*?>/g, "").trim().length === 0) {
  alert("Content is required");
  return;
}

    // ✅ FIX: auto-subject for COMMENT
    const finalSubject =
      postType === "COMMENT"
        ? "Comment"
        : subject.trim();

    try {
      setLoading(true);

      const url = editPost
        ? `${API}/api/forum/post/${editPost.id}`
        : `${API}/api/forum/post`;

      const method = editPost ? "PUT" : "POST";

      const res = await fetch(url, {
  method,
  headers: {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  },
  body: JSON.stringify({
    subject: finalSubject,
    content: content.trim(),
    postType,
  }),
});

/* ✅ HANDLE AUTH ERRORS FIRST */
if (res.status === 401 || res.status === 403) {
  localStorage.clear();
  alert("Session expired. Please logout and login again.");
  window.location.reload();
  return;
}

/* ✅ SAFE JSON PARSE */
const data = await res.json();

/* ✅ OTHER BACKEND ERRORS */
if (!res.ok) {
  throw new Error(data.error || data.message || "Action failed");
}
      onPostCreated();
      onClose();
    } catch (err) {
      alert(err.message || "Action failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      show={show}
      onHide={onClose}
      centered
      size="lg"
      dialogClassName="forum-modal-dialog"
      contentClassName="forum-modal"
      backdropClassName="forum-modal-backdrop"
    >
      <Modal.Header closeButton>
        <Modal.Title>
          {editPost ? "✏️ Edit CrickEdge Talk" : "✍️ Create CrickEdge Talk"}
        </Modal.Title>
      </Modal.Header>

      <Modal.Body className="forum-modal-body">
        <Form className="forum-modal-form">
          {/* POST TYPE */}
          <Form.Group className="mb-4">
            <Form.Label>Post Type</Form.Label>
            <Form.Select
              value={postType}
              onChange={(e) => setPostType(e.target.value)}
              disabled={!!editPost}
            >
              <option value="STORY">Story</option>
              <option value="COMMENT">Comment</option>
            </Form.Select>
          </Form.Group>

          {/* SUBJECT (ONLY FOR STORY) */}
          {postType === "STORY" && (
            <Form.Group className="mb-4">
              <Form.Label>Subject</Form.Label>
              <Form.Control
                type="text"
                placeholder="Enter a meaningful subject"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
              />
            </Form.Group>
          )}

          {/* CONTENT */}
          <Form.Group>
            <Form.Label>Content</Form.Label>
            <ReactQuill
              theme="snow"
              value={content}
              onChange={setContent}
              modules={quillModules}
              formats={quillFormats}
              placeholder="Share your thoughts with the CrickEdge community…"
            />
          </Form.Group>
        </Form>
      </Modal.Body>

      <Modal.Footer>
        <Button variant="secondary" onClick={onClose}>
          Cancel
        </Button>

        <Button
          variant="primary"
          onClick={handleSubmit}
          disabled={loading}
        >
          {loading ? "Saving..." : editPost ? "Update Post" : "Post"}
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default CreatePostModal;
