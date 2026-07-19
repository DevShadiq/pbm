import express from "express";
import bcrypt from "bcryptjs";
import pool from "../config/db.js";
import { verifyToken } from "../middleware/authMiddleware.js";
import { requirePermission } from "../middleware/permissionMiddleware.js";

const router = express.Router();

function toBoolean(value, fallback = true) {
  if (value === undefined || value === null || value === "") {
    return fallback;
  }

  return ![false, 0, "0", "false"].includes(value);
}

async function getActiveRole(userType, institutionId) {
  const result = await pool.query(
    `
    SELECT role_id, role_code
    FROM sms.roles
    WHERE UPPER(role_code) = UPPER($1)
      AND status = 'ACTIVE'
      AND ($2 IS NULL OR institution_id = $2)
    LIMIT 1
    `,
    [userType, institutionId]
  );

  return result.rows[0] || null;
}

router.get(
  "/",
  verifyToken,
  requirePermission("user.management", "view"),
  async (req, res) => {
    try {
      let result;

      if (req.user.is_super_admin) {
        result = await pool.query(
          `
          SELECT
            user_id,
            institution_id,
            branch_id,
            username,
            email,
            mobile,
            full_name,
            user_type,
            avatar_url,
            is_super_admin,
            is_active,
            last_login_at,
            created_at
          FROM sms.app_users
          ORDER BY user_id DESC
          `
        );
      } else {
        result = await pool.query(
          `
          SELECT
            user_id,
            institution_id,
            branch_id,
            username,
            email,
            mobile,
            full_name,
            user_type,
            avatar_url,
            is_super_admin,
            is_active,
            last_login_at,
            created_at
          FROM sms.app_users
          WHERE institution_id = $1
          ORDER BY user_id DESC
          `,
          [req.user.institution_id]
        );
      }

      return res.json({
        success: true,
        users: result.rows,
      });
    } catch (error) {
      console.error("User list error:", error);

      return res.status(500).json({
        success: false,
        message: "Server error",
      });
    }
  }
);

router.get(
  "/:user_id",
  verifyToken,
  requirePermission("user.management", "view"),
  async (req, res) => {
    try {
      let result;

      if (req.user.is_super_admin) {
        result = await pool.query(
          `
        SELECT
          user_id,
          institution_id,
          branch_id,
          username,
          email,
          mobile,
          full_name,
          user_type,
          avatar_url,
          is_super_admin,
          is_active
        FROM sms.app_users
        WHERE user_id = $1
        `,
          [req.params.user_id]
        );
      } else {
        result = await pool.query(
          `
        SELECT
          user_id,
          institution_id,
          branch_id,
          username,
          email,
          mobile,
          full_name,
          user_type,
          avatar_url,
          is_super_admin,
          is_active
        FROM sms.app_users
        WHERE user_id = $1
          AND institution_id = $2
        `,
          [req.params.user_id, req.user.institution_id]
        );
      }

      if (result.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: "User not found",
        });
      }

      return res.json({
        success: true,
        user: result.rows[0],
      });
    } catch (error) {
      console.error("User get error:", error);

      return res.status(500).json({
        success: false,
        message: "Server error",
      });
    }
  }
);

router.post(
  "/",
  verifyToken,
  requirePermission("user.management", "create"),
  async (req, res) => {
    try {
      const {
        institution_id,
        branch_id,
        username,
        email,
        mobile,
        password,
        full_name,
        user_type,
        avatar_url,
        is_active,
      } = req.body;

      const normalizedUserType = String(user_type || "").trim().toUpperCase();

      if (!username || !password || !full_name || !normalizedUserType) {
        return res.status(400).json({
          success: false,
          message:
            "Username, password, full name and user type are required",
        });
      }

      if (!req.user.is_super_admin && normalizedUserType === "SUPER_ADMIN") {
        return res.status(403).json({
          success: false,
          message: "Only super admin can create super admin user",
        });
      }

      const finalInstitutionId = req.user.is_super_admin
        ? institution_id || null
        : req.user.institution_id;

      const role = normalizedUserType === "SUPER_ADMIN"
        ? null
        : await getActiveRole(normalizedUserType, finalInstitutionId);
      if (normalizedUserType !== "SUPER_ADMIN" && !role) {
        return res.status(400).json({
          success: false,
          message: "User type must match an active role for the institution.",
        });
      }

      const finalIsSuperAdmin = Boolean(req.user.is_super_admin) && normalizedUserType === "SUPER_ADMIN";

      const passwordHash = await bcrypt.hash(password, 10);

      const result = await pool.query(
        `
        INSERT INTO sms.app_users
          (
            institution_id,
            branch_id,
            username,
            email,
            mobile,
            password_hash,
            full_name,
            user_type,
            avatar_url,
            is_super_admin,
            is_active,
            password_changed_at
          )
        VALUES
          ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW())
        RETURNING
          user_id,
          institution_id,
          branch_id,
          username,
          email,
          mobile,
          full_name,
          user_type,
          avatar_url,
          is_super_admin,
          is_active
        `,
        [
          finalInstitutionId,
          branch_id || null,
          username,
          email || null,
          mobile || null,
          passwordHash,
          full_name,
          normalizedUserType,
          avatar_url || null,
          finalIsSuperAdmin,
          toBoolean(is_active),
        ]
      );

      return res.status(201).json({
        success: true,
        message: "User created successfully",
        user: result.rows[0],
      });
    } catch (error) {
      console.error("User create error:", error);

      if (error.code === "23505") {
        return res.status(409).json({
          success: false,
          message: "Username or email already exists",
        });
      }

      return res.status(500).json({
        success: false,
        message: "Server error",
      });
    }
  }
);

router.put(
  "/:user_id",
  verifyToken,
  requirePermission("user.management", "update"),
  async (req, res) => {
    try {
      const {
        institution_id,
        branch_id,
        username,
        email,
        mobile,
        password,
        full_name,
        user_type,
        avatar_url,
        is_active,
      } = req.body;

      const normalizedUserType = String(user_type || "").trim().toUpperCase();

      if (!username || !full_name || !normalizedUserType) {
        return res.status(400).json({
          success: false,
          message: "Username, full name and user type are required",
        });
      }

      const targetUserResult = await pool.query(
        `
        SELECT user_id, institution_id, is_super_admin, user_type
        FROM sms.app_users
        WHERE user_id = $1
        `,
        [req.params.user_id]
      );

      const targetUser = targetUserResult.rows[0];
      if (!targetUser) {
        return res.status(404).json({
          success: false,
          message: "User not found",
        });
      }

      if (
        !req.user.is_super_admin &&
        (targetUser.is_super_admin || String(targetUser.user_type).toUpperCase() === "SUPER_ADMIN")
      ) {
        return res.status(403).json({
          success: false,
          message: "Only super admin can update super admin user",
        });
      }

      if (!req.user.is_super_admin && normalizedUserType === "SUPER_ADMIN") {
        return res.status(403).json({
          success: false,
          message: "Only super admin can update super admin user",
        });
      }

      const finalInstitutionId = req.user.is_super_admin
        ? institution_id || null
        : req.user.institution_id;

      const role = normalizedUserType === "SUPER_ADMIN"
        ? null
        : await getActiveRole(normalizedUserType, finalInstitutionId);
      if (normalizedUserType !== "SUPER_ADMIN" && !role) {
        return res.status(400).json({
          success: false,
          message: "User type must match an active role for the institution.",
        });
      }

      const finalIsSuperAdmin = Boolean(req.user.is_super_admin) && normalizedUserType === "SUPER_ADMIN";

      let result;

      if (password) {
        const passwordHash = await bcrypt.hash(password, 10);

        if (req.user.is_super_admin) {
          result = await pool.query(
            `
          UPDATE sms.app_users
          SET
            institution_id = $1,
            branch_id = $2,
            username = $3,
            email = $4,
            mobile = $5,
            password_hash = $6,
            full_name = $7,
            user_type = $8,
            avatar_url = $9,
            is_super_admin = $10,
            is_active = $11,
            password_changed_at = NOW()
          WHERE user_id = $12
          RETURNING
            user_id,
            institution_id,
            branch_id,
            username,
            email,
            mobile,
            full_name,
            user_type,
            avatar_url,
            is_super_admin,
            is_active
          `,
            [
              finalInstitutionId,
              branch_id || null,
              username,
              email || null,
              mobile || null,
              passwordHash,
              full_name,
              normalizedUserType,
              avatar_url || null,
              finalIsSuperAdmin,
              toBoolean(is_active),
              req.params.user_id,
            ]
          );
        } else {
          result = await pool.query(
            `
          UPDATE sms.app_users
          SET
            institution_id = $1,
            branch_id = $2,
            username = $3,
            email = $4,
            mobile = $5,
            password_hash = $6,
            full_name = $7,
            user_type = $8,
            avatar_url = $9,
            is_super_admin = $10,
            is_active = $11,
            password_changed_at = NOW()
          WHERE user_id = $12
            AND institution_id = $13
          RETURNING
            user_id,
            institution_id,
            branch_id,
            username,
            email,
            mobile,
            full_name,
            user_type,
            avatar_url,
            is_super_admin,
            is_active
          `,
            [
              finalInstitutionId,
              branch_id || null,
              username,
              email || null,
              mobile || null,
              passwordHash,
              full_name,
              normalizedUserType,
              avatar_url || null,
              finalIsSuperAdmin,
              toBoolean(is_active),
              req.params.user_id,
              req.user.institution_id,
            ]
          );
        }
      } else {
        if (req.user.is_super_admin) {
          result = await pool.query(
            `
          UPDATE sms.app_users
          SET
            institution_id = $1,
            branch_id = $2,
            username = $3,
            email = $4,
            mobile = $5,
            full_name = $6,
            user_type = $7,
            avatar_url = $8,
            is_super_admin = $9,
            is_active = $10
          WHERE user_id = $11
          RETURNING
            user_id,
            institution_id,
            branch_id,
            username,
            email,
            mobile,
            full_name,
            user_type,
            avatar_url,
            is_super_admin,
            is_active
          `,
            [
              finalInstitutionId,
              branch_id || null,
              username,
              email || null,
              mobile || null,
              full_name,
              normalizedUserType,
              avatar_url || null,
              finalIsSuperAdmin,
              toBoolean(is_active),
              req.params.user_id,
            ]
          );
        } else {
          result = await pool.query(
            `
          UPDATE sms.app_users
          SET
            institution_id = $1,
            branch_id = $2,
            username = $3,
            email = $4,
            mobile = $5,
            full_name = $6,
            user_type = $7,
            avatar_url = $8,
            is_super_admin = $9,
            is_active = $10
          WHERE user_id = $11
            AND institution_id = $12
          RETURNING
            user_id,
            institution_id,
            branch_id,
            username,
            email,
            mobile,
            full_name,
            user_type,
            avatar_url,
            is_super_admin,
            is_active
          `,
            [
              finalInstitutionId,
              branch_id || null,
              username,
              email || null,
              mobile || null,
              full_name,
              normalizedUserType,
              avatar_url || null,
              finalIsSuperAdmin,
              toBoolean(is_active),
              req.params.user_id,
              req.user.institution_id,
            ]
          );
        }
      }

      if (result.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: "User not found",
        });
      }

      return res.json({
        success: true,
        message: "User updated successfully",
        user: result.rows[0],
      });
    } catch (error) {
      console.error("User update error:", error);

      if (error.code === "23505") {
        return res.status(409).json({
          success: false,
          message: "Username or email already exists",
        });
      }

      return res.status(500).json({
        success: false,
        message: "Server error",
      });
    }
  }
);

router.delete(
  "/:user_id",
  verifyToken,
  requirePermission("user.management", "delete"),
  async (req, res) => {
    try {
      const targetUserId = Number(req.params.user_id);

      if (!Number.isInteger(targetUserId) || targetUserId <= 0) {
        return res.status(400).json({
          success: false,
          message: "A valid user ID is required",
        });
      }

      if (targetUserId === req.user.user_id) {
        return res.status(400).json({
          success: false,
          message: "You cannot delete your own account.",
        });
      }

      const sql = req.user.is_super_admin
        ? "DELETE FROM sms.app_users WHERE user_id = $1 RETURNING user_id"
        : "DELETE FROM sms.app_users WHERE user_id = $1 AND institution_id = $2 RETURNING user_id";
      const values = req.user.is_super_admin
        ? [targetUserId]
        : [targetUserId, req.user.institution_id];
      const result = await pool.query(sql, values);

      if (result.rowCount === 0) {
        return res.status(404).json({
          success: false,
          message: "User not found",
        });
      }

      return res.json({
        success: true,
        message: "User deleted successfully",
      });
    } catch (error) {
      console.error("User delete error:", error);

      if (error.code === "ER_ROW_IS_REFERENCED_2") {
        return res.status(409).json({
          success: false,
          message: "This user cannot be deleted because it is referenced by other records.",
        });
      }

      return res.status(500).json({
        success: false,
        message: "Server error",
      });
    }
  }
);

export default router;
