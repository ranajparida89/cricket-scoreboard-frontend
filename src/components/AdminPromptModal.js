// routes/admin.js
const express = require('express');
const router = express.Router();
// const bcrypt = require('bcryptjs'); // NO LONGER NEEDED
const pool = require('../db'); // Postgres connection

// --- Debug logging for every load
console.log("[ADMIN] admin.js loaded and route file imported.");

// Test endpoint to verify router is active
router.get('/test', (req, res) => {
  console.log("[ADMIN] /test endpoint hit!");
  res.json({ status: "ok" });
});

/**
 * POST /api/admin/login
 * Allows admin login with username OR email (using plain text password check)
 */
router.post('/login', async (req, res) => {
  console.log("[ADMIN][POST] /api/admin/login called. Body:", req.body);

  const { username, password } = req.body;
  // 1. Basic validation
  if (!username || !password) {
    console.log("[ADMIN][POST] Missing username or password");
    return res.status(400).json({ error: "Username/email and password are required." });    
  }

  try {
    // 2. Find admin by username or email (case-insensitive)
    const result = await pool.query(
      `SELECT * FROM admins WHERE LOWER(username) = LOWER($1) OR LOWER(email) = LOWER($1) LIMIT 1`,
      [username]
    );
    const admin = result.rows[0];
    if (!admin) {
      console.log("[ADMIN][POST] Invalid username/email.");
      return res.status(401).json({ error: "Invalid username/email or password." });
    }

    // 3. Check plain text password (no bcrypt!)
    if (password !== admin.password_hash) {
      console.log("[ADMIN][POST] Password did not match for", username);
      return res.status(401).json({ error: "Invalid username/email or password." });
    }

    // 4. Log successful login
    try {
      await pool.query(
        `INSERT INTO admin_audit_log (admin_id, action, action_detail, ip_address, user_agent)
         VALUES ($1, 'login', 'Successful admin login', $2, $3)`,
        [admin.id, req.ip, req.get('user-agent')]
      );
      console.log("[ADMIN][POST] Login audit log inserted.");
    } catch (e) {
      console.warn('[ADMIN][POST] Admin audit log failed:', e);
    }

    // 5. Respond success
    res.json({
      isAdmin: true,
      admin: {
        id: admin.id,
        username: admin.username,
        full_name: admin.full_name,
        email: admin.email,
        is_super_admin: admin.is_super_admin,
      }
    });
    console.log("[ADMIN][POST] Login successful for", username);
  } catch (err) {
    console.error("[ADMIN][POST] Admin login error:", err);
    res.status(500).json({ error: "Server error during admin login." });
  }
});

console.log("[ADMIN] admin.js routes loaded.");
module.exports = router;
