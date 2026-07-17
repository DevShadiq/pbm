import express from "express";
import pool from "../config/db.js";
import { authenticateUser } from "../middleware/authMiddleware.js";
import { requirePermission } from "../middleware/permissionMiddleware.js";

const router = express.Router();

function buildMenuTree(rows) {
  const map = {};
  const roots = [];

  rows.forEach((row) => {
    map[row.menu_id] = {
      ...row,
      children: [],
    };
  });

  rows.forEach((row) => {
    if (row.parent_menu_id && map[row.parent_menu_id]) {
      map[row.parent_menu_id].children.push(map[row.menu_id]);
    } else {
      roots.push(map[row.menu_id]);
    }
  });

  return roots;
}

// GET: flat menu list
router.get("/", authenticateUser, requirePermission("menu.management", "view"), async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        m.menu_id,
        m.parent_menu_id,
        p.menu_title AS parent_menu_title,
        m.menu_code,
        m.menu_title,
        m.route_path,
        m.icon_name,
        m.sort_order,
        m.is_visible,
        m.status
      FROM sms.menus m
      LEFT JOIN sms.menus p ON p.menu_id = m.parent_menu_id
      ORDER BY
        COALESCE(m.parent_menu_id, m.menu_id),
        m.parent_menu_id NULLS FIRST,
        m.sort_order,
        m.menu_title
    `);

    res.json({
      success: true,
      data: result.rows,
    });
  } catch (error) {
    console.error("Menu list error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to load menus",
    });
  }
});

// GET: menu tree for sidebar
router.get("/tree", authenticateUser, requirePermission("menu.management", "view"), async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        menu_id,
        parent_menu_id,
        menu_code,
        menu_title,
        route_path,
        icon_name,
        sort_order,
        is_visible,
        status
      FROM sms.menus
      WHERE status = 'ACTIVE'
        AND is_visible = TRUE
      ORDER BY
        parent_menu_id NULLS FIRST,
        sort_order,
        menu_title
    `);

    const tree = buildMenuTree(result.rows);

    res.json({
      success: true,
      data: tree,
    });
  } catch (error) {
    console.error("Menu tree error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to load menu tree",
    });
  }
});

// GET: single menu
router.get("/:id", authenticateUser, requirePermission("menu.management", "view"), async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `
      SELECT
        menu_id,
        parent_menu_id,
        menu_code,
        menu_title,
        route_path,
        icon_name,
        sort_order,
        is_visible,
        status
      FROM sms.menus
      WHERE menu_id = $1
      `,
      [id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({
        success: false,
        message: "Menu not found",
      });
    }

    res.json({
      success: true,
      data: result.rows[0],
    });
  } catch (error) {
    console.error("Menu get error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to load menu",
    });
  }
});

// POST: create menu
router.post("/", authenticateUser, requirePermission("menu.management", "create"), async (req, res) => {
  try {
    const {
      parent_menu_id,
      menu_code,
      menu_title,
      route_path,
      icon_name,
      sort_order,
      is_visible,
      status,
    } = req.body;

    if (!menu_code || !menu_title) {
      return res.status(400).json({
        success: false,
        message: "Menu code and menu title are required",
      });
    }

    const result = await pool.query(
      `
      INSERT INTO sms.menus
      (
        parent_menu_id,
        menu_code,
        menu_title,
        route_path,
        icon_name,
        sort_order,
        is_visible,
        status
      )
      VALUES
      ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *
      `,
      [
        parent_menu_id || null,
        menu_code.trim(),
        menu_title.trim(),
        route_path || null,
        icon_name || null,
        Number(sort_order || 0),
        is_visible ?? true,
        status || "ACTIVE",
      ]
    );

    res.status(201).json({
      success: true,
      message: "Menu created successfully",
      data: result.rows[0],
    });
  } catch (error) {
    console.error("Menu create error:", error);

    if (error.code === "23505") {
      return res.status(409).json({
        success: false,
        message: "Menu code already exists",
      });
    }

    if (error.code === "23503") {
      return res.status(400).json({
        success: false,
        message: "Invalid parent menu",
      });
    }

    res.status(500).json({
      success: false,
      message: "Failed to create menu",
    });
  }
});

// PUT: update menu
router.put("/:id", authenticateUser, requirePermission("menu.management", "update"), async (req, res) => {
  try {
    const { id } = req.params;

    const {
      parent_menu_id,
      menu_code,
      menu_title,
      route_path,
      icon_name,
      sort_order,
      is_visible,
      status,
    } = req.body;

    if (!menu_code || !menu_title) {
      return res.status(400).json({
        success: false,
        message: "Menu code and menu title are required",
      });
    }

    if (Number(parent_menu_id) === Number(id)) {
      return res.status(400).json({
        success: false,
        message: "A menu cannot be its own parent",
      });
    }

    const result = await pool.query(
      `
      UPDATE sms.menus
      SET
        parent_menu_id = $1,
        menu_code = $2,
        menu_title = $3,
        route_path = $4,
        icon_name = $5,
        sort_order = $6,
        is_visible = $7,
        status = $8
      WHERE menu_id = $9
      RETURNING *
      `,
      [
        parent_menu_id || null,
        menu_code.trim(),
        menu_title.trim(),
        route_path || null,
        icon_name || null,
        Number(sort_order || 0),
        is_visible ?? true,
        status || "ACTIVE",
        id,
      ]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({
        success: false,
        message: "Menu not found",
      });
    }

    res.json({
      success: true,
      message: "Menu updated successfully",
      data: result.rows[0],
    });
  } catch (error) {
    console.error("Menu update error:", error);

    if (error.code === "23505") {
      return res.status(409).json({
        success: false,
        message: "Menu code already exists",
      });
    }

    if (error.code === "23503") {
      return res.status(400).json({
        success: false,
        message: "Invalid parent menu",
      });
    }

    res.status(500).json({
      success: false,
      message: "Failed to update menu",
    });
  }
});

// PATCH: status toggle
router.patch("/:id/status", authenticateUser, requirePermission("menu.management", "update"), async (req, res) => {
  try {
    const { id } = req.params;
    const { status, is_visible } = req.body;

    const result = await pool.query(
      `
      UPDATE sms.menus
      SET
        status = COALESCE($1, status),
        is_visible = COALESCE($2, is_visible)
      WHERE menu_id = $3
      RETURNING *
      `,
      [status || null, typeof is_visible === "boolean" ? is_visible : null, id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({
        success: false,
        message: "Menu not found",
      });
    }

    res.json({
      success: true,
      message: "Menu status updated",
      data: result.rows[0],
    });
  } catch (error) {
    console.error("Menu status error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update menu status",
    });
  }
});

// DELETE: menu
router.delete("/:id", authenticateUser, requirePermission("menu.management", "delete"), async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `
      DELETE FROM sms.menus
      WHERE menu_id = $1
      RETURNING menu_id
      `,
      [id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({
        success: false,
        message: "Menu not found",
      });
    }

    res.json({
      success: true,
      message: "Menu deleted successfully",
    });
  } catch (error) {
    console.error("Menu delete error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete menu",
    });
  }
});

export default router;
