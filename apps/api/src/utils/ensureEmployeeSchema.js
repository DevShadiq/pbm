import pool from "../config/db.js";

const banglaNameColumns = [
  { table: "departments", column: "department_name_bn", after: "department_name" },
  { table: "designations", column: "designation_name_bn", after: "designation_name" },
  { table: "employees", column: "first_name_bn", after: "first_name" },
  { table: "employees", column: "last_name_bn", after: "last_name" },
];

export async function ensureEmployeeSchema() {
  for (const item of banglaNameColumns) {
    const result = await pool.query(
      `
      SELECT COUNT(*) AS total
      FROM information_schema.columns
      WHERE table_schema = DATABASE()
        AND table_name = $1
        AND column_name = $2
      `,
      [item.table, item.column]
    );

    if (Number(result.rows[0]?.total || 0) === 0) {
      await pool.query(
        `ALTER TABLE sms.${item.table} ADD COLUMN ${item.column} VARCHAR(120) NULL AFTER ${item.after}`
      );
    }
  }
}
