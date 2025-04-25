// src/components/ContactFeedback.js
import React, { useState } from "react";

const ContactFeedback = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    message: ""
  });

  const [submitted, setSubmitted] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    // Here you can handle backend integration or email forwarding
    console.log("Submitted:", formData);

    setSubmitted(true);

    setFormData({
      name: "",
      email: "",
      message: ""
    });
  };

  return (
    <div className="container py-4 text-white">
      <h2 className="mb-4">📬 Contact / Feedback</h2>

      {submitted && (
        <div className="alert alert-success" role="alert">
          ✅ Thank you! Your message has been submitted.
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-dark p-4 rounded shadow-sm">
        <div className="mb-3">
          <label htmlFor="name" className="form-label text-light">Name</label>
          <input
            type="text"
            className="form-control"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            required
          />
        </div>

        <div className="mb-3">
          <label htmlFor="email" className="form-label text-light">Email</label>
          <input
            type="email"
            className="form-control"
            id="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            required
          />
        </div>

        <div className="mb-3">
          <label htmlFor="message" className="form-label text-light">Message</label>
          <textarea
            className="form-control"
            id="message"
            name="message"
            rows="4"
            value={formData.message}
            onChange={handleChange}
            required
          ></textarea>
        </div>

        <button type="submit" className="btn btn-success">
          Submit Feedback
        </button>
      </form>
    </div>
  );
};

export default ContactFeedback;
