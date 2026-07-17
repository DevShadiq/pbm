import express from "express";
import { authenticateUser } from "../middleware/authMiddleware.js";
import { requirePermission } from "../middleware/permissionMiddleware.js";


import {
  getMyAccess,
  getRoles,
  getPermissions,
  getMenus,
  getRolePermissions,
  getRoleMenus,
  getBranches,
  getUserRoles,
  assignRolePermissions,
  assignRoleMenus,
  assignSingleUserRole,
  removeSingleUserRole,
  assignUserRoles,
} from "../controllers/securityController.js";

const router = express.Router();

// Login করার পরে frontend এই route call করবে
router.get("/me/access", authenticateUser, getMyAccess);

router.get(
  "/roles",
  authenticateUser,
  requirePermission("role.management", "view"),
  getRoles
);

router.get(
  "/permissions",
  authenticateUser,
  requirePermission("role.permission", "view"),
  getPermissions
);

router.get(
  "/menus",
  authenticateUser,
  requirePermission("menu.management", "view"),
  getMenus
);

router.get(
  "/branches",
  authenticateUser,
  requirePermission("user.role", "view"),
  getBranches
);

router.get(
  "/roles/:role_id/permissions",
  authenticateUser,
  requirePermission("role.permission", "view"),
  getRolePermissions
);

router.post(
  "/roles/:role_id/permissions",
  authenticateUser,
  requirePermission("role.permission", "update"),
  assignRolePermissions
);

router.get(
  "/roles/:role_id/menus",
  authenticateUser,
  requirePermission("menu.permission", "view"),
  getRoleMenus
);

router.post(
  "/roles/:role_id/menus",
  authenticateUser,
  requirePermission("menu.permission", "update"),
  assignRoleMenus
);

router.get(
  "/users/:user_id/roles",
  authenticateUser,
  requirePermission("user.role", "view"),
  getUserRoles
);

router.post(
  "/users/:user_id/roles",
  authenticateUser,
  requirePermission("user.management", "update"),
  assignUserRoles
);

router.post(
  "/user-roles",
  authenticateUser,
  requirePermission("user.role", "update"),
  assignSingleUserRole
);

router.delete(
  "/user-roles",
  authenticateUser,
  requirePermission("user.role", "delete"),
  removeSingleUserRole
);

export default router;
