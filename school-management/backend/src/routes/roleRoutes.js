import express from "express";
import pool from "../config/db.js";
import { authenticateUser } from "../middleware/authMiddleware.js";
import { requirePermission } from "../middleware/permissionMiddleware.js";

const router = express.Router();

function normalizeRolePayload(body) {
  return {
    institution_id: body.institution_id ? Number(body.institution_id) : null,
    role_code: body.role_code ? String(body.role_code).trim().toUpperCase() : "",
    role_name: body.role_name ? String(body.role_name).trim() : "",
    description: body.description ? String(body.description).trim() : null,
    is_system_role: Boolean(body.is_system_role),
    status: body.status || "ACTIVE",
  };
}

// GET all roles
router.get("/", authenticateUser, requirePermission("role.management", "view"), async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        role_id,
        institution_id,
        role_code,
        role_name,
        description,
        is_system_role,
        status,
        created_at,
        updated_at
      FROM sms.roles
      ORDER BY role_id DESC
    `);

    res.json({
      success: true,
      data: result.rows,
    });
  } catch (error) {
    console.error("Role list error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to load roles",
      error: error.message,
    });
  }
});

// GET single role
router.get("/:id", authenticateUser, requirePermission("role.management", "view"), async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `
      SELECT
        role_id,
        institution_id,
        role_code,
        role_name,
        description,
        is_system_role,
        status,
        created_at,
        updated_at
      FROM sms.roles
      WHERE role_id = $1
      `,
      [id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({
        success: false,
        message: "Role not found",
      });
    }

    res.json({
      success: true,
      data: result.rows[0],
    });
  } catch (error) {
    console.error("Role get error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to load role",
      error: error.message,
    });
  }
});

// CREATE role
router.post("/", authenticateUser, requirePermission("role.management", "create"), async (req, res) => {
  try {
    const payload = normalizeRolePayload(req.body);

    if (!payload.institution_id || !payload.role_code || !payload.role_name) {
      return res.status(400).json({
        success: false,
        message: "Institution ID, role code and role name are required",
      });
    }

    const result = await pool.query(
      `
      INSERT INTO sms.roles
      (
        institution_id,
        role_code,
        role_name,
        description,
        is_system_role,
        status
      )
      VALUES
      ($1, $2, $3, $4, $5, $6)
      RETURNING
        role_id,
        institution_id,
        role_code,
        role_name,
        description,
        is_system_role,
        status,
        created_at,
        updated_at
      `,
      [
        payload.institution_id,
        payload.role_code,
        payload.role_name,
        payload.description,
        payload.is_system_role,
        payload.status,
      ]
    );

    res.status(201).json({
      success: true,
      message: "Role created successfully",
      data: result.rows[0],
    });
  } catch (error) {
    console.error("Role create error:", error);

    if (error.code === "23503") {
      return res.status(400).json({
        success: false,
        message: "Invalid institution ID. This institution does not exist.",
      });
    }

    if (error.code === "23505") {
      return res.status(409).json({
        success: false,
        message: "Role code already exists for this institution.",
      });
    }

    res.status(500).json({
      success: false,
      message: "Failed to create role",
      error: error.message,
    });
  }
});

// UPDATE role
router.put("/:id", authenticateUser, requirePermission("role.management", "update"), async (req, res) => {
  try {
    const { id } = req.params;
    const payload = normalizeRolePayload(req.body);

    if (!payload.institution_id || !payload.role_code || !payload.role_name) {
      return res.status(400).json({
        success: false,
        message: "Institution ID, role code and role name are required",
      });
    }

    const result = await pool.query(
      `
      UPDATE sms.roles
      SET
        institution_id = $1,
        role_code = $2,
        role_name = $3,
        description = $4,
        is_system_role = $5,
        status = $6,
        updated_at = NOW()
      WHERE role_id = $7
      RETURNING
        role_id,
        institution_id,
        role_code,
        role_name,
        description,
        is_system_role,
        status,
        created_at,
        updated_at
      `,
      [
        payload.institution_id,
        payload.role_code,
        payload.role_name,
        payload.description,
        payload.is_system_role,
        payload.status,
        id,
      ]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({
        success: false,
        message: "Role not found",
      });
    }

    res.json({
      success: true,
      message: "Role updated successfully",
      data: result.rows[0],
    });
  } catch (error) {
    console.error("Role update error:", error);

    if (error.code === "23503") {
      return res.status(400).json({
        success: false,
        message: "Invalid institution ID. This institution does not exist.",
      });
    }

    if (error.code === "23505") {
      return res.status(409).json({
        success: false,
        message: "Role code already exists for this institution.",
      });
    }

    res.status(500).json({
      success: false,
      message: "Failed to update role",
      error: error.message,
    });
  }
});

// DELETE role
router.delete("/:id", authenticateUser, requirePermission("role.management", "delete"), async (req, res) => {
  try {
    const { id } = req.params;

    const checkRole = await pool.query(
      `
      SELECT role_id, is_system_role
      FROM sms.roles
      WHERE role_id = $1
      `,
      [id]
    );

    if (checkRole.rowCount === 0) {
      return res.status(404).json({
        success: false,
        message: "Role not found",
      });
    }

    if (checkRole.rows[0].is_system_role) {
      return res.status(400).json({
        success: false,
        message: "System role cannot be deleted",
      });
    }

    await pool.query(
      `
      DELETE FROM sms.roles
      WHERE role_id = $1
      `,
      [id]
    );

    res.json({
      success: true,
      message: "Role deleted successfully",
    });
  } catch (error) {
    console.error("Role delete error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to delete role",
      error: error.message,
    });
  }
});

export default router;
