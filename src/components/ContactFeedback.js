// src/components/ContactFeedback.jsx
import React, { useMemo, useState } from "react";
import axios from "axios";
import { API_URL } from "../services/api";
import "./ContactFeedback.css";

// Optional: EmailJS (only used if env vars are present)
let emailjs = null;
try {
  // lazy import so the app still builds even if package isn't installed
  emailjs = require("@emailjs/browser");
} catch (_) {
  emailjs = null;
}

/**
 * Delivery strategy:
 * 1) If REACT_APP_CONTACT_ENDPOINT or API_URL exists and returns 2xx -> send via backend.
 * 2) Else, if EmailJS env vars exist -> send via EmailJS.
 * 3) Else, fallback to `mailto:` open.
 */
function detectDelivery() {
  const hasBackend =
    typeof API_URL === "string" && API_URL &&
    process.env.REACT_APP_CONTACT_ENDPOINT !== "disabled";

  const ejService = process.env.REACT_APP_EMAILJS_SERVICE_ID;
  const ejTemplate = process.env.REACT_APP_EMAILJS_TEMPLATE_ID;
  const ejPublic = process.env.REACT_APP_EMAILJS_PUBLIC_KEY;
  const hasEmailJS = !!(ejService && ejTemplate && ejPublic && emailjs);

  return { hasBackend, hasEmailJS, ejService, ejTemplate, ejPublic };
}

const ContactFeedback = () => {
  const [formData, setFormData] = useState({ name: "", email: "", message: "" });
  const [status, setStatus] = useState({ sending: false, ok: false, err: "" });

  const delivery = useMemo(() => detectDelivery(), []);

  const onChange = (e) => {
    const { name, value } = e.target;
    setFormData((p) => ({ ...p, [name]: value }));
  };

  async function sendViaBackend() {
    // Prefer explicit endpoint if provided, else fall back to `${API_URL}/contact`
    const endpoint =
      process.env.REACT_APP_CONTACT_ENDPOINT ||
      `${API_URL.replace(/\/$/,"")}/contact`;
    await axios.post(endpoint, formData, {
      headers: { "Content-Type": "application/json" },
      timeout: 15000,
    });
  }

  async function sendViaEmailJS() {
    const { ejService, ejTemplate, ejPublic } = delivery;
    // You can map fields to your EmailJS template variables
    const payload = {
      from_name: formData.name,
      from_email: formData.email,
      message: formData.message,
      to_email: "ranajparida89@gmail.com", // ← change later to official id
      site: window.location.hostname,
    };
    await emailjs.send(ejService, ejTemplate, payload, { publicKey: ejPublic });
  }

  function sendViaMailto() {
    const subject = encodeURIComponent(`CrickEdge Feedback from ${formData.name}`);
    const body = encodeURIComponent(
      `Name: ${formData.name}\nEmail: ${formData.email}\n\nMessage:\n${formData.message}`
    );
    window.location.href = `mailto:ranajparida89@gmail.com?subject=${subject}&body=${body}`;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus({ sending: true, ok: false, err: "" });

    try {
      if (delivery.hasBackend) {
        await sendViaBackend();
      } else if (delivery.hasEmailJS) {
        await sendViaEmailJS();
      } else {
        sendViaMailto();
      }

      setStatus({ sending: false, ok: true, err: "" });
      setFormData({ name: "", email: "", message: "" });
    } catch (err) {
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        "Failed to send. Please try again.";
      setStatus({ sending: false, ok: false, err: msg });
    }
  };

  const disabled =
    status.sending ||
    !formData.name.trim() ||
    !formData.email.trim() ||
    !formData.message.trim();

  return (
    <div className="cf-wrap">
      <div className="cf-head">
        <span className="cf-emoji" role="img" aria-label="mail">📬</span>
        <h2>Contact / Feedback</h2>

        {/* small status pill to show how it's configured right now */}
        <span className="cf-pill">
          {delivery.hasBackend
            ? "Backend"
            : delivery.hasEmailJS
            ? "EmailJS"
            : "mailto fallback"}
        </span>
      </div>

      {status.ok && (
        <div className="cf-alert ok">✅ Thank you! Your message has been sent.</div>
      )}
      {!!status.err && (
        <div className="cf-alert err">⚠️ {status.err}</div>
      )}

      <form className="cf-card" onSubmit={handleSubmit} noValidate>
        <label className="cf-label" htmlFor="cf-name">Name</label>
        <input
          id="cf-name"
          className="cf-input"
          name="name"
          type="text"
          placeholder="Your name"
          value={formData.name}
          onChange={onChange}
          required
        />

        <label className="cf-label" htmlFor="cf-email">Email</label>
        <input
          id="cf-email"
          className="cf-input"
          name="email"
          type="email"
          placeholder="you@example.com"
          value={formData.email}
          onChange={onChange}
          required
        />

        <label className="cf-label" htmlFor="cf-message">Message</label>
        <textarea
          id="cf-message"
          className="cf-textarea"
          name="message"
          rows={6}
          placeholder="Type your feedback or question…"
          value={formData.message}
          onChange={onChange}
          required
        />

        {/* Honeypot for simple bot filtering */}
        <input
          type="text"
          name="website"
          tabIndex="-1"
          autoComplete="off"
          className="cf-hp"
          aria-hidden="true"
        />

        <div className="cf-actions">
          <button className="cf-btn" disabled={disabled}>
            {status.sending ? "Sending…" : "Submit Feedback"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ContactFeedback;
