import React, { useState } from "react";
import { Modal, Button, Form } from "react-bootstrap";

const CreatePostModal = ({ show, onClose, onPostCreated }) => {
  const [postType, setPostType] = useState("STORY");
  const [subject, setSubject] = useState("");
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);

  const token = localStorage.getItem("token");

  const handleSubmit = async () => {
    if (!token) {
      alert("Please login to create a post");
      return;
    }

    if (postType === "STORY" && !subject.trim()) {
      alert("Subject is required");
      return;
    }

    if (!content.trim()) {
      alert("Content is required");
      return;
    }

    try {
      setLoading(true);
      const res = await fetch(
        "https://cricket-scoreboard-backend.onrender.com/api/forum/post",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            subject,
            content,
            postType,
          }),
        }
      );

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      onPostCreated();
      onClose();
      setSubject("");
      setContent("");
    } catch (err) {
      alert(err.message || "Failed to create post");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal show={show} onHide={onClose} centered>
      <Modal.Header closeButton>
        <Modal.Title>Create CrickEdge Talk</Modal.Title>
      </Modal.Header>

      <Modal.Body>
        <Form>
          <Form.Group className="mb-3">
            <Form.Label>Post Type</Form.Label>
            <Form.Select
              value={postType}
              onChange={(e) => setPostType(e.target.value)}
            >
              <option value="STORY">Story</option>
              <option value="COMMENT">Comment</option>
            </Form.Select>
          </Form.Group>

          {postType === "STORY" && (
            <Form.Group className="mb-3">
              <Form.Label>Subject</Form.Label>
              <Form.Control
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
              />
            </Form.Group>
          )}

          <Form.Group>
            <Form.Label>Content</Form.Label>
            <Form.Control
              as="textarea"
              rows={4}
              value={content}
              onChange={(e) => setContent(e.target.value)}
            />
          </Form.Group>
        </Form>
      </Modal.Body>

      <Modal.Footer>
        <Button variant="secondary" onClick={onClose}>
          Cancel
        </Button>
        <Button variant="warning" onClick={handleSubmit} disabled={loading}>
          {loading ? "Posting..." : "Post"}
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default CreatePostModal;
