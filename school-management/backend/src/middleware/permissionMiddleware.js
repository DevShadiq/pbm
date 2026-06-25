import pool from "../config/db.js";

const actionColumnMap = {
  view: "can_view",
  create: "can_create",
  update: "can_update",
  delete: "can_delete",
  approve: "can_approve",
};

export const requirePermission = (permissionCode, action = "view") => {
  return async (req, res, next) => {
    try {
      const user = req.user;

      if (!user) {
        return res.status(401).json({
          success: false,
          message: "Unauthorized.",
        });
      }

      if (user.is_super_admin) {
        return next();
      }

      const columnName = actionColumnMap[action];

      if (!columnName) {
        return res.status(400).json({
          success: false,
          message: "Invalid permission action.",
        });
      }

      const result = await pool.query(
        `
        SELECT 1
        FROM sms.user_roles ur
        JOIN sms.roles r 
          ON r.role_id = ur.role_id
         AND r.status = 'ACTIVE'
        JOIN sms.role_permissions rp 
          ON rp.role_id = r.role_id
        JOIN sms.permissions p 
          ON p.permission_id = rp.permission_id
         AND p.status = 'ACTIVE'
        WHERE ur.user_id = $1
          AND (
            r.institution_id = $2
            OR $2 IS NULL
          )
          AND p.permission_code = $3
          AND rp.${columnName} = TRUE
          AND (
            ur.branch_id IS NULL 
            OR ur.branch_id = $4
            OR $4 IS NULL
          )
        LIMIT 1
        `,
        [
          user.user_id,
          user.institution_id,
          permissionCode,
          user.branch_id,
        ]
      );

      if (result.rowCount === 0) {
        return res.status(403).json({
          success: false,
          message: "Permission denied.",
        });
      }

      next();
    } catch (error) {
      console.error("Permission middleware error:", error);

      return res.status(500).json({
        success: false,
        message: "Permission check failed.",
      });
    }
  };
};
