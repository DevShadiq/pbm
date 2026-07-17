import pool from "../config/db.js";
import { buildMenuTree } from "../utils/buildMenuTree.js";

export const getMyAccess = async (req, res) => {
  try {
    const user = req.user;

    let menuResult;
    let permissionResult;

    if (user.is_super_admin) {
      menuResult = await pool.query(`
        SELECT 
          menu_id,
          parent_menu_id,
          menu_code,
          menu_title,
          route_path,
          icon_name,
          sort_order
        FROM sms.menus
        WHERE status = 'ACTIVE'
          AND is_visible = TRUE
        ORDER BY sort_order, menu_id
      `);

      permissionResult = await pool.query(`
        SELECT 
          permission_code,
          permission_name,
          module_name,
          TRUE AS can_view,
          TRUE AS can_create,
          TRUE AS can_update,
          TRUE AS can_delete,
          TRUE AS can_approve
        FROM sms.permissions
        WHERE status = 'ACTIVE'
        ORDER BY module_name, permission_name
      `);
    } else {
      menuResult = await pool.query(
        `
        SELECT DISTINCT
          m.menu_id,
          m.parent_menu_id,
          m.menu_code,
          m.menu_title,
          m.route_path,
          m.icon_name,
          m.sort_order
        FROM sms.user_roles ur
        JOIN sms.roles r 
          ON r.role_id = ur.role_id
         AND r.status = 'ACTIVE'
        JOIN sms.role_menus rm 
          ON rm.role_id = r.role_id
         AND rm.can_access = TRUE
        JOIN sms.menus m 
          ON m.menu_id = rm.menu_id
         AND m.status = 'ACTIVE'
         AND m.is_visible = TRUE
        WHERE ur.user_id = $1
          AND (
            r.institution_id = $2
            OR $2 IS NULL
          )
          AND (
            ur.branch_id IS NULL
            OR ur.branch_id = $3
            OR $3 IS NULL
          )
        ORDER BY m.sort_order, m.menu_id
        `,
        [user.user_id, user.institution_id, user.branch_id]
      );

      permissionResult = await pool.query(
        `
        SELECT 
          p.permission_code,
          p.permission_name,
          p.module_name,
          BOOL_OR(rp.can_view) AS can_view,
          BOOL_OR(rp.can_create) AS can_create,
          BOOL_OR(rp.can_update) AS can_update,
          BOOL_OR(rp.can_delete) AS can_delete,
          BOOL_OR(rp.can_approve) AS can_approve
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
          AND (
            ur.branch_id IS NULL
            OR ur.branch_id = $3
            OR $3 IS NULL
          )
        GROUP BY 
          p.permission_code,
          p.permission_name,
          p.module_name
        ORDER BY p.module_name, p.permission_name
        `,
        [user.user_id, user.institution_id, user.branch_id]
      );
    }

    const permissionMap = {};

    permissionResult.rows.forEach((p) => {
      permissionMap[p.permission_code] = {
        view: Boolean(p.can_view),
        create: Boolean(p.can_create),
        update: Boolean(p.can_update),
        delete: Boolean(p.can_delete),
        approve: Boolean(p.can_approve),
      };
    });

    return res.json({
      success: true,
      data: {
        user,
        menus: buildMenuTree(menuResult.rows),
        permissions: permissionMap,
      },
    });
  } catch (error) {
    console.error("Get my access error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to load user access.",
    });
  }
};

export const getRoles = async (req, res) => {
  try {
    const result = await pool.query(
      `
      SELECT *
      FROM sms.roles
      WHERE institution_id = $1
      ORDER BY role_name
      `,
      [req.user.institution_id]
    );

    return res.json({
      success: true,
      data: result.rows,
    });
  } catch (error) {
    console.error("Get roles error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to load roles.",
    });
  }
};

export const getPermissions = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT *
      FROM sms.permissions
      WHERE status = 'ACTIVE'
      ORDER BY module_name, permission_name
    `);

    return res.json({
      success: true,
      data: result.rows,
    });
  } catch (error) {
    console.error("Get permissions error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to load permissions.",
    });
  }
};

export const getMenus = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT *
      FROM sms.menus
      WHERE status = 'ACTIVE'
      ORDER BY sort_order, menu_id
    `);

    return res.json({
      success: true,
      data: buildMenuTree(result.rows),
      flatData: result.rows,
    });
  } catch (error) {
    console.error("Get menus error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to load menus.",
    });
  }
};

export const getRolePermissions = async (req, res) => {
  try {
    const { role_id } = req.params;

    const result = await pool.query(
      `
      SELECT
        p.permission_id,
        p.permission_code,
        p.permission_name,
        p.module_name,
        COALESCE(rp.can_view, FALSE) AS can_view,
        COALESCE(rp.can_create, FALSE) AS can_create,
        COALESCE(rp.can_update, FALSE) AS can_update,
        COALESCE(rp.can_delete, FALSE) AS can_delete,
        COALESCE(rp.can_approve, FALSE) AS can_approve
      FROM sms.permissions p
      JOIN sms.role_permissions rp
        ON rp.permission_id = p.permission_id
       AND rp.role_id = $1
      WHERE p.status = 'ACTIVE'
      ORDER BY p.module_name, p.permission_name
      `,
      [role_id]
    );

    return res.json({
      success: true,
      data: result.rows,
    });
  } catch (error) {
    console.error("Get role permissions error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to load role permissions.",
    });
  }
};

export const getRoleMenus = async (req, res) => {
  try {
    const { role_id } = req.params;

    const result = await pool.query(
      `
      SELECT
        m.menu_id,
        m.menu_code,
        m.menu_title,
        m.route_path,
        COALESCE(rm.can_access, FALSE) AS can_access
      FROM sms.menus m
      JOIN sms.role_menus rm
        ON rm.menu_id = m.menu_id
       AND rm.role_id = $1
      WHERE m.status = 'ACTIVE'
      ORDER BY m.sort_order, m.menu_title
      `,
      [role_id]
    );

    return res.json({
      success: true,
      data: result.rows,
    });
  } catch (error) {
    console.error("Get role menus error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to load role menus.",
    });
  }
};

export const getBranches = async (req, res) => {
  try {
    const values = [];
    let where = "WHERE status = 'ACTIVE'";

    if (!req.user.is_super_admin) {
      values.push(req.user.institution_id);
      where += " AND institution_id = $1";
    }

    const result = await pool.query(
      `
      SELECT branch_id, institution_id, branch_code, branch_name
      FROM sms.branches
      ${where}
      ORDER BY branch_name
      `,
      values
    );

    return res.json({
      success: true,
      data: result.rows,
    });
  } catch (error) {
    console.error("Get branches error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to load branches.",
    });
  }
};

export const getUserRoles = async (req, res) => {
  try {
    const { user_id } = req.params;

    const result = await pool.query(
      `
      SELECT
        ur.user_id,
        ur.role_id,
        ur.branch_id,
        ur.assigned_at,
        r.role_code,
        r.role_name,
        b.branch_name
      FROM sms.user_roles ur
      JOIN sms.roles r ON r.role_id = ur.role_id
      LEFT JOIN sms.branches b ON b.branch_id = ur.branch_id
      WHERE ur.user_id = $1
      ORDER BY r.role_name, b.branch_name
      `,
      [user_id]
    );

    return res.json({
      success: true,
      data: result.rows,
    });
  } catch (error) {
    console.error("Get user roles error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to load user roles.",
    });
  }
};

export const assignRolePermissions = async (req, res) => {
  const client = await pool.connect();

  try {
    const { role_id } = req.params;
    const { permissions } = req.body;

    await client.query("BEGIN");

    await client.query(
      `DELETE FROM sms.role_permissions WHERE role_id = $1`,
      [role_id]
    );

    for (const p of permissions) {
      await client.query(
        `
        INSERT INTO sms.role_permissions
        (
          role_id,
          permission_id,
          can_view,
          can_create,
          can_update,
          can_delete,
          can_approve
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        `,
        [
          role_id,
          p.permission_id,
          p.can_view || false,
          p.can_create || false,
          p.can_update || false,
          p.can_delete || false,
          p.can_approve || false,
        ]
      );
    }

    await client.query("COMMIT");

    return res.json({
      success: true,
      message: "Role permissions updated successfully.",
    });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Assign role permissions error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to update role permissions.",
    });
  } finally {
    client.release();
  }
};

export const assignRoleMenus = async (req, res) => {
  const client = await pool.connect();

  try {
    const { role_id } = req.params;
    const { menus } = req.body;

    await client.query("BEGIN");

    await client.query(`DELETE FROM sms.role_menus WHERE role_id = $1`, [
      role_id,
    ]);

    for (const m of menus) {
      await client.query(
        `
        INSERT INTO sms.role_menus
        (
          role_id,
          menu_id,
          can_access
        )
        VALUES ($1, $2, $3)
        `,
        [role_id, m.menu_id, m.can_access || false]
      );
    }

    await client.query("COMMIT");

    return res.json({
      success: true,
      message: "Role menus updated successfully.",
    });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Assign role menus error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to update role menus.",
    });
  } finally {
    client.release();
  }
};

export const assignSingleUserRole = async (req, res) => {
  try {
    const { user_id, role_id, branch_id } = req.body;

    if (!user_id || !role_id) {
      return res.status(400).json({
        success: false,
        message: "User and role are required.",
      });
    }

    await pool.query(
      `
      DELETE FROM sms.user_roles
      WHERE user_id = $1
        AND role_id = $2
        AND (
          branch_id = $3
          OR ($3 IS NULL AND branch_id IS NULL)
        )
      `,
      [user_id, role_id, branch_id || null]
    );

    await pool.query(
      `
      INSERT INTO sms.user_roles (user_id, role_id, branch_id)
      VALUES ($1, $2, $3)
      `,
      [user_id, role_id, branch_id || null]
    );

    return res.json({
      success: true,
      message: "Role assigned successfully.",
    });
  } catch (error) {
    console.error("Assign single user role error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to assign role.",
    });
  }
};

export const removeSingleUserRole = async (req, res) => {
  try {
    const { user_id, role_id, branch_id } = req.body;

    if (!user_id || !role_id) {
      return res.status(400).json({
        success: false,
        message: "User and role are required.",
      });
    }

    await pool.query(
      `
      DELETE FROM sms.user_roles
      WHERE user_id = $1
        AND role_id = $2
        AND (
          branch_id = $3
          OR ($3 IS NULL AND branch_id IS NULL)
        )
      `,
      [user_id, role_id, branch_id || null]
    );

    return res.json({
      success: true,
      message: "Role removed successfully.",
    });
  } catch (error) {
    console.error("Remove user role error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to remove role.",
    });
  }
};

export const assignUserRoles = async (req, res) => {
  const client = await pool.connect();

  try {
    const { user_id } = req.params;
    const { roles } = req.body;

    await client.query("BEGIN");

    await client.query(`DELETE FROM sms.user_roles WHERE user_id = $1`, [
      user_id,
    ]);

    for (const r of roles) {
      await client.query(
        `
        INSERT INTO sms.user_roles
        (
          user_id,
          role_id,
          branch_id
        )
        VALUES ($1, $2, $3)
        `,
        [user_id, r.role_id, r.branch_id || null]
      );
    }

    await client.query("COMMIT");

    return res.json({
      success: true,
      message: "User roles assigned successfully.",
    });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Assign user roles error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to assign user roles.",
    });
  } finally {
    client.release();
  }
};
