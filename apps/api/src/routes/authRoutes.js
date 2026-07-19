import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import pool from "../config/db.js";
import { verifyToken } from "../middleware/authMiddleware.js";
import { sendPasswordResetEmail } from "../services/brevoEmailService.js";
import { sendBulkSmsBd } from "../services/bulkSmsBdService.js";

const router = express.Router();
const RESET_RESPONSE_MESSAGE =
  "If an active account exists for this email, a password reset link has been sent.";
const MAX_MOBILE_RESET_OTPS_PER_DAY = 2;
const resetRequestAttempts = new Map();

function getResetUrl(token) {
  const configuredUrl = process.env.PASSWORD_RESET_URL?.trim();

  if (!configuredUrl) {
    throw new Error("PASSWORD_RESET_URL is not configured.");
  }

  const url = new URL(configuredUrl);

  if (!["http:", "https:"].includes(url.protocol)) {
    throw new Error("PASSWORD_RESET_URL must use http or https.");
  }

  url.searchParams.set("token", token);
  return url.toString();
}

function allowResetRequest(key) {
  const now = Date.now();
  const windowMs = 15 * 60 * 1000;
  const maxAttempts = 3;
  const attemptTimes = (resetRequestAttempts.get(key) || []).filter(
    (time) => now - time < windowMs
  );

  if (attemptTimes.length >= maxAttempts) {
    resetRequestAttempts.set(key, attemptTimes);
    return false;
  }

  attemptTimes.push(now);
  resetRequestAttempts.set(key, attemptTimes);
  return true;
}

function isStrongPassword(password) {
  return (
    typeof password === "string" &&
    password.length >= 8 &&
    /[a-z]/.test(password) &&
    /[A-Z]/.test(password) &&
    /\d/.test(password)
  );
}

function normalizeBangladeshiMobile(value) {
  const compact = String(value || "").replace(/[\s()-]/g, "");
  const normalized = compact.startsWith("+880") ? compact.slice(1) : compact.startsWith("01") ? `880${compact.slice(1)}` : compact;
  return /^8801[3-9]\d{8}$/.test(normalized) ? normalized : null;
}

function mobileVariants(mobile) {
  return [mobile, `+${mobile}`, `0${mobile.slice(3)}`];
}

function otpHash(otp) {
  const secret = process.env.OTP_HASH_SECRET?.trim();
  if (!secret) throw new Error("OTP_HASH_SECRET is not configured.");
  return crypto.createHmac("sha256", secret).update(otp).digest("hex");
}

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

router.post("/forgot-password", async (req, res) => {
  const email = String(req.body.email || "").trim().toLowerCase();
  const rateLimitKey = `${req.ip}:${email}`;

  if (!email || !allowResetRequest(rateLimitKey)) {
    return res.json({ success: true, message: RESET_RESPONSE_MESSAGE });
  }

  try {
    const userResult = await pool.query(
      `
      SELECT user_id, email, full_name
      FROM sms.app_users
      WHERE LOWER(email) = LOWER($1) AND is_active = TRUE
      LIMIT 1
      `,
      [email]
    );

    if (userResult.rowCount === 0) {
      return res.json({ success: true, message: RESET_RESPONSE_MESSAGE });
    }

    const user = userResult.rows[0];
    const token = crypto.randomBytes(32).toString("hex");
    const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
    const configuredTtl = Number(process.env.PASSWORD_RESET_TTL_MINUTES || 60);
    const ttlMinutes = Number.isFinite(configuredTtl)
      ? Math.min(24 * 60, Math.max(5, configuredTtl))
      : 60;
    const expiresAt = new Date(Date.now() + ttlMinutes * 60 * 1000);
    const client = await pool.connect();

    try {
      await client.query("BEGIN");
      await client.query(
        `DELETE FROM sms.password_reset_tokens WHERE user_id = $1 AND used_at IS NULL`,
        [user.user_id]
      );
      await client.query(
        `
        INSERT INTO sms.password_reset_tokens (user_id, token_hash, expires_at)
        VALUES ($1, $2, $3)
        `,
        [user.user_id, tokenHash, expiresAt]
      );
      await client.query("COMMIT");
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }

    await sendPasswordResetEmail({
      email: user.email,
      fullName: user.full_name,
      resetUrl: getResetUrl(token),
    });

    return res.json({ success: true, message: RESET_RESPONSE_MESSAGE });
  } catch (error) {
    console.error("Password reset email failed:", error.message);
    const response = { success: true, message: RESET_RESPONSE_MESSAGE };

    if (process.env.PASSWORD_RESET_DEBUG === "true") {
      response.deliveryError = error.message;
    }

    return res.json(response);
  }
});

router.post("/forgot-password/mobile", async (req, res) => {
  const mobile = normalizeBangladeshiMobile(req.body.mobile);
  const message = "If an active account exists for this mobile number, an OTP has been sent.";

  if (!mobile || !allowResetRequest(`mobile:${req.ip}:${mobile}`)) {
    return res.json({ success: true, message });
  }

  try {
    const userResult = await pool.query(
      `SELECT user_id FROM sms.app_users WHERE mobile IN ($1, $2, $3) AND is_active = TRUE LIMIT 1`,
      mobileVariants(mobile)
    );
    if (userResult.rowCount === 0) return res.json({ success: true, message });

    const userId = userResult.rows[0].user_id;
    const otp = crypto.randomInt(100000, 1000000).toString();
    const requestedTtl = Number(process.env.PASSWORD_RESET_OTP_TTL_MINUTES || 5);
    const ttlMinutes = Number.isFinite(requestedTtl) ? Math.min(30, Math.max(2, requestedTtl)) : 5;
    const client = await pool.connect();

    try {
      await client.query("BEGIN");
      // Lock the user row so simultaneous requests cannot bypass the two-SMS daily limit.
      await client.query(`SELECT user_id FROM sms.app_users WHERE user_id = $1 FOR UPDATE`, [userId]);
      const dailyOtpCount = await client.query(
        `SELECT COUNT(*) AS total FROM sms.password_reset_otps WHERE user_id = $1 AND created_at >= CURDATE()`,
        [userId]
      );
      if (Number(dailyOtpCount.rows[0].total) >= MAX_MOBILE_RESET_OTPS_PER_DAY) {
        await client.query("COMMIT");
        return res.json({ success: true, message: "If an active account exists for this mobile number, an OTP has been sent." });
      }
      // Retain prior requests for the daily charge-control limit, but make old codes unusable.
      await client.query(`UPDATE sms.password_reset_otps SET used_at = NOW() WHERE user_id = $1 AND used_at IS NULL`, [userId]);
      await client.query(
        `INSERT INTO sms.password_reset_otps (user_id, otp_hash, expires_at) VALUES ($1, $2, $3)`,
        [userId, otpHash(otp), new Date(Date.now() + ttlMinutes * 60 * 1000)]
      );
      await client.query("COMMIT");
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }

    await sendBulkSmsBd({
      mobile,
      message: `Your password reset OTP is ${otp}. It expires in ${ttlMinutes} minutes. Do not share this code.`,
    });
    return res.json({ success: true, message });
  } catch (error) {
    console.error("Password reset OTP SMS failed:", error.message);
    return res.json({
      success: true,
      message,
      ...(process.env.PASSWORD_RESET_DEBUG === "true" ? { deliveryError: error.message } : {}),
    });
  }
});

router.post("/reset-password/mobile-otp", async (req, res) => {
  const mobile = normalizeBangladeshiMobile(req.body.mobile);
  const otp = String(req.body.otp || "");
  const { password } = req.body;

  if (!mobile || !/^\d{6}$/.test(otp)) {
    return res.status(400).json({ success: false, message: "Enter a valid mobile number and six-digit OTP." });
  }
  if (!isStrongPassword(password)) {
    return res.status(400).json({ success: false, message: "Password must be at least 8 characters and include uppercase, lowercase, and a number." });
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const userResult = await client.query(
      `SELECT user_id FROM sms.app_users WHERE mobile IN ($1, $2, $3) AND is_active = TRUE LIMIT 1 FOR UPDATE`,
      mobileVariants(mobile)
    );
    if (userResult.rowCount === 0) {
      await client.query("ROLLBACK");
      return res.status(400).json({ success: false, message: "This OTP is invalid or has expired." });
    }

    const userId = userResult.rows[0].user_id;
    const otpResult = await client.query(
      `SELECT otp_id, otp_hash FROM sms.password_reset_otps WHERE user_id = $1 AND used_at IS NULL AND expires_at > NOW() ORDER BY created_at DESC LIMIT 1 FOR UPDATE`,
      [userId]
    );
    if (otpResult.rowCount === 0) {
      await client.query("ROLLBACK");
      return res.status(400).json({ success: false, message: "This OTP is invalid or has expired." });
    }

    const resetOtp = otpResult.rows[0];
    if (!crypto.timingSafeEqual(Buffer.from(resetOtp.otp_hash), Buffer.from(otpHash(otp)))) {
      await client.query(
        `UPDATE sms.password_reset_otps SET attempts = attempts + 1, used_at = CASE WHEN attempts + 1 >= 5 THEN NOW() ELSE used_at END WHERE otp_id = $1`,
        [resetOtp.otp_id]
      );
      await client.query("COMMIT");
      return res.status(400).json({ success: false, message: "This OTP is invalid or has expired." });
    }

    const passwordHash = await bcrypt.hash(password, 12);
    await client.query(`UPDATE sms.password_reset_otps SET used_at = NOW() WHERE user_id = $1 AND used_at IS NULL`, [userId]);
    await client.query(`UPDATE sms.password_reset_tokens SET used_at = NOW() WHERE user_id = $1 AND used_at IS NULL`, [userId]);
    await client.query(`UPDATE sms.app_users SET password_hash = $1, password_changed_at = NOW() WHERE user_id = $2`, [passwordHash, userId]);
    await client.query("COMMIT");
    return res.json({ success: true, message: "Your password has been reset. You can now sign in." });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Mobile OTP password reset failed:", error.message);
    return res.status(500).json({ success: false, message: "Unable to reset the password. Please try again." });
  } finally {
    client.release();
  }
});

router.post("/reset-password", async (req, res) => {
  const token = String(req.body.token || "");
  const { password } = req.body;

  if (!/^[a-f0-9]{64}$/i.test(token)) {
    return res.status(400).json({ success: false, message: "This reset link is invalid or has expired." });
  }

  if (!isStrongPassword(password)) {
    return res.status(400).json({
      success: false,
      message: "Password must be at least 8 characters and include uppercase, lowercase, and a number.",
    });
  }

  const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
  const client = await pool.connect();

  try {
    await client.query("BEGIN");
    const tokenResult = await client.query(
      `
      SELECT token_id, user_id
      FROM sms.password_reset_tokens
      WHERE token_hash = $1 AND used_at IS NULL AND expires_at > NOW()
      LIMIT 1
      FOR UPDATE
      `,
      [tokenHash]
    );

    if (tokenResult.rowCount === 0) {
      await client.query("ROLLBACK");
      return res.status(400).json({ success: false, message: "This reset link is invalid or has expired." });
    }

    const resetToken = tokenResult.rows[0];
    const passwordHash = await bcrypt.hash(password, 12);
    const consumeResult = await client.query(
      `UPDATE sms.password_reset_tokens SET used_at = NOW() WHERE token_id = $1 AND used_at IS NULL`,
      [resetToken.token_id]
    );

    if (consumeResult.rowCount !== 1) {
      await client.query("ROLLBACK");
      return res.status(400).json({ success: false, message: "This reset link is invalid or has expired." });
    }

    await client.query(
      `UPDATE sms.app_users SET password_hash = $1, password_changed_at = NOW() WHERE user_id = $2`,
      [passwordHash, resetToken.user_id]
    );
    await client.query(
      `UPDATE sms.password_reset_tokens SET used_at = NOW() WHERE user_id = $1 AND used_at IS NULL`,
      [resetToken.user_id]
    );
    await client.query("COMMIT");

    return res.json({ success: true, message: "Your password has been reset. You can now sign in." });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Password reset failed:", error.message);
    return res.status(500).json({ success: false, message: "Unable to reset the password. Please try again." });
  } finally {
    client.release();
  }
});

router.get("/me", verifyToken, async (req, res) => {
  return res.json({
    success: true,
    user: req.user,
  });
});

export default router;
