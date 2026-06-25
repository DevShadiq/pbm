import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import pool from "../config/db.js";
import { verifyToken } from "../middleware/authMiddleware.js";

const router = express.Router();

function isDatabaseAccessError(error) {
  return ["ER_ACCESS_DENIED_ERROR", "ER_BAD_DB_ERROR", "ECONNREFUSED"].includes(
    error?.code
  );
}

router.post("/login", async (req, res) => {
  try {
    const loginId = req.body.username || req.body.email;
    const { password } = req.body;

    if (!loginId || !password) {
      return res.status(400).json({
        success: false,
        message: "Username/email and password are required.",
      });
    }

    const result = await pool.query(
      `
      SELECT 
        user_id,
        institution_id,
        branch_id,
        username,
        email,
        password_hash,
        full_name,
        user_type,
        is_super_admin,
        is_active
      FROM sms.app_users
      WHERE LOWER(username) = LOWER($1)
         OR LOWER(email) = LOWER($1)
      LIMIT 1
      `,
      [loginId]
    );

    if (result.rowCount === 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid username/email or password.",
      });
    }

    const user = result.rows[0];

    if (!user.is_active) {
      return res.status(403).json({
        success: false,
        message: "User account is inactive.",
      });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password_hash);

    if (!isPasswordValid) {
      return res.status(400).json({
        success: false,
        message: "Invalid username/email or password.",
      });
    }

    if (!process.env.JWT_SECRET) {
      return res.status(500).json({
        success: false,
        message: "JWT_SECRET missing in .env file.",
      });
    }

    const token = jwt.sign(
      {
        user_id: user.user_id,
        username: user.username,
        institution_id: user.institution_id,
        branch_id: user.branch_id,
        is_super_admin: user.is_super_admin,
      },
      process.env.JWT_SECRET,
      {
        expiresIn: process.env.JWT_EXPIRES_IN || "1d",
      }
    );

    await pool.query(
      `
      UPDATE sms.app_users
      SET last_login_at = NOW()
      WHERE user_id = $1
      `,
      [user.user_id]
    );

    delete user.password_hash;

    return res.json({
      success: true,
      message: "Login successful.",
      token,
      user,
    });
  } catch (error) {
    console.error("Login error:", error);

    if (isDatabaseAccessError(error)) {
      return res.status(503).json({
        success: false,
        message: `Database connection failed: ${error.message}`,
      });
    }

    return res.status(500).json({
      success: false,
      message: "Login failed.",
    });
  }
});

router.get("/me", verifyToken, async (req, res) => {
  return res.json({
    success: true,
    user: req.user,
  });
});

export default router;
