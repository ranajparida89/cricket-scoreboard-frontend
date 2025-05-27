// ✅ AuthModal.js
// ✅ [Ranaj Parida - 22-Apr-2025 | Full Auth Modal UI + OTP + Password Reset]

import React, { useState, useEffect } from "react";
import axios from "axios";
import "../styles/AuthModal.css"; // ✅ Custom floating modal styles
import { API_URL } from "../services/api"; // ✅ Base URL for backend

const AuthModal = ({ show, onClose, mode = "login" }) => {
  const [step, setStep] = useState(mode); // login | signup | otp | reset-request | reset-form
  useEffect(() => {
    // ✅ Auto-fill email/password from localStorage on modal open
    const rememberedEmail = localStorage.getItem("rememberEmail");
    const rememberedPassword = localStorage.getItem("rememberPassword");
    if (rememberedEmail && rememberedPassword) {
      setForm((prev) => ({
        ...prev,
        email: rememberedEmail,
        password: rememberedPassword,
        remember: true,
      }));
    }
  }, []);
  
  const [form, setForm] = useState({
    first_name: "",
    last_name: "",
    email: localStorage.getItem("rememberEmail") || "",
    password: localStorage.getItem("rememberPassword") || "",
    confirm_password: "",
    otp: "",
    token: "",
    newPassword: "",
    confirmNewPassword: "",
    remember: localStorage.getItem("rememberEmail") ? true : false
  });
  
  const [timer, setTimer] = useState(25);
  const [resendVisible, setResendVisible] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    let interval;
    if (step === "otp" && timer > 0) {
      interval = setInterval(() => setTimer((t) => t - 1), 1000);
    } else if (timer <= 0) {
      setResendVisible(true);
    }
    return () => clearInterval(interval);
  }, [step, timer]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSignup = async () => {
    const { first_name, last_name, email, password, confirm_password } = form;
    if (!first_name || !last_name || !email || !password || !confirm_password)
      return setMessage("All fields required");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      return setMessage("Invalid email");
    if (password.length < 8 || !/[A-Z]/.test(password) || !/[0-9]/.test(password) || !/[^A-Za-z0-9]/.test(password))
      return setMessage("Password must be strong");
    if (password !== confirm_password)
      return setMessage("Passwords do not match");

    try {
        await axios.post(`${API_URL}/signup`, { first_name, last_name, email, password });
      setStep("otp");
      setTimer(25);
      setMessage("OTP sent to your email");
    } catch (err) {
      setMessage(err.response?.data?.error || "Signup failed");
    }
  };

  const handleVerifyOtp = async () => {
    try {
      const res = await axios.post(`${API_URL}/verify-otp`, { email: form.email, otp: form.otp });
      console.log("✅ OTP Verified:", res.data);
      setMessage("OTP Verified. Happy Cricket");
      setTimeout(() => setStep("login"), 1500);
    } catch (err) {
      console.error("❌ OTP Verify Error:", err.response?.data || err);
      setMessage(err.response?.data?.error || "Invalid OTP");
    }
  };  
  
  const handleResendOtp = async () => {
    try {
      await axios.post(`${API_URL}/resend-otp`, { email: form.email });
      setTimer(25);
      setResendVisible(false);
      setMessage("New OTP sent to email");
    } catch (err) {
      setMessage("Failed to resend OTP");
    }
  };
  
  // -------------- FIXED: Save as currentUser, remove old user key -------------
  const handleLogin = async () => {
    try {
      const res = await axios.post(`${API_URL}/login`, {
        email: form.email,
        password: form.password,
      });

      localStorage.setItem("token", res.data.token);
      localStorage.setItem("currentUser", JSON.stringify(res.data.user)); // <-- THE FIX!
      localStorage.removeItem("user"); // Remove old key if present

      if (form.remember) {
        localStorage.setItem("rememberEmail", form.email);
        localStorage.setItem("rememberPassword", form.password);
      } else {
        localStorage.removeItem("rememberEmail");
        localStorage.removeItem("rememberPassword");
      }

      setMessage("Login successful");
      setTimeout(() => window.location.reload(), 1500);
    } catch (err) {
      setMessage("Invalid credentials");
    }
  };
  // ----------------------------------------------------------------------------

  const handleRequestReset = async () => {
    try {
      await axios.post("/api/request-reset", { email: form.email });
      setMessage("Reset link sent to email");
    } catch (err) {
      setMessage("Reset failed");
    }
  };

  const handleResetPassword = async () => {
    const { newPassword, confirmNewPassword } = form;
    if (newPassword !== confirmNewPassword) return setMessage("Passwords don't match");
    try {
      await axios.post("/api/reset-password", { token: form.token, newPassword });
      setMessage("Password reset successfully");
      setTimeout(() => setStep("login"), 1500);
    } catch (err) {
      setMessage("Reset error");
    }
  };

  if (!show) return null;

  return (
    <div className="auth-modal-overlay">
      <div className="auth-modal-card">
        <button className="close-btn" onClick={onClose}>❌</button>
        <h4 className="text-center text-info">
          {step === "signup" && "Create Account"}
          {step === "login" && "Sign In"}
          {step === "otp" && "Enter OTP"}
          {step === "reset-request" && "Reset Password"}
          {step === "reset-form" && "Set New Password"}
        </h4>

        {message && <div className="alert alert-info py-1 my-2">⚡ {message}</div>}

        {step === "signup" && (
          <>
            <input name="first_name" placeholder="First Name" onChange={handleChange} />
            <input name="last_name" placeholder="Last Name" onChange={handleChange} />
            <input name="email" placeholder="Email" onChange={handleChange} />
            <input name="password" type="password" placeholder="Password" onChange={handleChange} />
            <input name="confirm_password" type="password" placeholder="Confirm Password" onChange={handleChange} />
            <button onClick={handleSignup}>Create User</button>
          </>
        )}

        {step === "otp" && (
          <>
            <input name="otp" placeholder="Enter OTP" onChange={handleChange} />
            {timer > 0 ? <p>⏳ {timer}s</p> : resendVisible && <button onClick={handleResendOtp}>Resend OTP</button>}
            <button onClick={handleVerifyOtp}>Verify</button>
          </>
        )}

        {step === "login" && (
          <>
            <input name="email" placeholder="Email" onChange={handleChange} />
            <input name="password" type="password" placeholder="Password" onChange={handleChange} />
            <div className="d-flex align-items-center mb-2">
            <input
                type="checkbox"
                className="form-check-input me-2"
                checked={form.remember}
                onChange={(e) => setForm({ ...form, remember: e.target.checked })}
                /> Remember me

            </div>
            <button onClick={handleLogin}>Sign In</button>
            <p className="text-info small mt-2" onClick={() => setStep("reset-request")}>Forgot Password?</p>
          </>
        )}

        {step === "reset-request" && (
          <>
            <input name="email" placeholder="Registered Email" onChange={handleChange} />
            <button onClick={handleRequestReset}>Request Reset</button>
          </>
        )}

        {step === "reset-form" && (
          <>
            <input name="token" placeholder="Token from email" onChange={handleChange} />
            <input name="newPassword" placeholder="New Password" onChange={handleChange} />
            <input name="confirmNewPassword" placeholder="Confirm Password" onChange={handleChange} />
            <button onClick={handleResetPassword}>Set New Password</button>
          </>
        )}

        <div className="text-center mt-3">
          {step === "login" ? (
            <p>New User? <span className="text-warning" onClick={() => setStep("signup")}>Create Account</span></p>
          ) : (
            <p>Have Account? <span className="text-success" onClick={() => setStep("login")}>Sign In</span></p>
          )}
        </div>
      </div>
    </div>
  );
};

export default AuthModal;
