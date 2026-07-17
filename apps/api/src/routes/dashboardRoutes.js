import express from "express";
import pool from "../config/db.js";
import { authenticateUser } from "../middleware/authMiddleware.js";
import { requirePermission } from "../middleware/permissionMiddleware.js";

const router = express.Router();

router.get("/summary", authenticateUser, requirePermission("dashboard.access", "view"), async (req, res) => {
  try {
    const [
      institutions,
      branches,
      students,
      users,
      roles,
      menus,
      permissions,
      roleMenus,
      rolePermissions,
    ] = await Promise.all([
      pool.query("SELECT COUNT(*) AS total FROM sms.institutions"),
      pool.query("SELECT COUNT(*) AS total FROM sms.branches"),
      pool.query("SELECT COUNT(*) AS total FROM sms.students"),
      pool.query("SELECT COUNT(*) AS total FROM sms.app_users"),
      pool.query("SELECT COUNT(*) AS total FROM sms.roles WHERE status = 'ACTIVE'"),
      pool.query("SELECT COUNT(*) AS total FROM sms.menus WHERE status = 'ACTIVE'"),
      pool.query("SELECT COUNT(*) AS total FROM sms.permissions WHERE status = 'ACTIVE'"),
      pool.query("SELECT COUNT(*) AS total FROM sms.role_menus WHERE can_access = TRUE"),
      pool.query("SELECT COUNT(*) AS total FROM sms.role_permissions"),
    ]);

    return res.json({
      success: true,
      data: {
        institutions: institutions.rows[0].total,
        branches: branches.rows[0].total,
        students: students.rows[0].total,
        users: users.rows[0].total,
        roles: roles.rows[0].total,
        menus: menus.rows[0].total,
        permissions: permissions.rows[0].total,
        roleMenus: roleMenus.rows[0].total,
        rolePermissions: rolePermissions.rows[0].total,
      },
    });
  } catch (error) {
    console.error("Dashboard summary error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to load dashboard summary.",
    });
  }
});

export default router;
