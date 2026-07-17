import bcrypt from "bcryptjs";
import pool from "./src/config/db.js";

async function createAdmin() {
  try {
    const passwordHash = await bcrypt.hash("Dhaka_123", 10);

    await pool.query(
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
          is_super_admin,
          is_active,
          password_changed_at
        )
      VALUES
        ($1, $2, $3, $4, $5, $6, $7, $8, TRUE, TRUE, NOW())
      ON DUPLICATE KEY UPDATE username = username
      `,
      [
        null,
        null,
        "sadiq",
        "sadiq@pbm.com",
        "01700000000",
        passwordHash,
        "System Super Admin",
        "SUPER_ADMIN",
      ]
    );

    console.log("Super admin created successfully");
    process.exit(0);
  } catch (error) {
    console.error("Admin create error:", error);
    process.exit(1);
  }
}

createAdmin();
