import jwt from "jsonwebtoken";
import pool from "../config/db.js";

export const authenticateUser = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized. Token missing.",
      });
    }

    const token = authHeader.split(" ")[1];

    if (!process.env.JWT_SECRET) {
      return res.status(500).json({
        success: false,
        message: "JWT_SECRET missing in .env file.",
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const userId = decoded.user_id || decoded.id || decoded.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Invalid token payload. user_id not found.",
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
        full_name,
        user_type,
        is_super_admin,
        is_active
      FROM sms.app_users
      WHERE user_id = $1
      `,
      [userId]
    );

    if (result.rowCount === 0) {
      return res.status(401).json({
        success: false,
        message: "Invalid user.",
      });
    }

    const user = result.rows[0];

    if (!user.is_active) {
      return res.status(403).json({
        success: false,
        message: "User account is inactive.",
      });
    }

    req.user = user;

    next();
  } catch (error) {
    console.error("Auth middleware error:", error);

    return res.status(401).json({
      success: false,
      message: "Invalid or expired token.",
    });
  }
};

// Old authRoutes.js compatibility
export const verifyToken = authenticateUser;

// Old userRoutes.js compatibility
export const allowRoles = (...allowedRoles) => {
  return (req, res, next) => {
    try {
      const user = req.user;

      if (!user) {
        return res.status(401).json({
          success: false,
          message: "Unauthorized.",
        });
      }

      // Super admin can access all old role-based routes
      if (user.is_super_admin) {
        return next();
      }

      const normalizedAllowedRoles = allowedRoles
        .flat()
        .map((role) => String(role).toUpperCase());

      const userType = String(user.user_type || "").toUpperCase();

      if (!normalizedAllowedRoles.includes(userType)) {
        return res.status(403).json({
          success: false,
          message: "Access denied. Role not allowed.",
        });
      }

      next();
    } catch (error) {
      console.error("Allow roles error:", error);

      return res.status(500).json({
        success: false,
        message: "Role check failed.",
      });
    }
  };
};

export default authenticateUser;