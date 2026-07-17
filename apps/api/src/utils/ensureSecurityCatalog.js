import pool from "../config/db.js";

const permissions = [
  ["dashboard.access", "Dashboard Access", "Dashboard", "Open the dashboard"],
  ["institution.management", "Institution Management", "Administration", "Manage institutions"],
  ["master-data.management", "Master Data Management", "Administration", "Manage academic and branch setup"],
  ["student.management", "Student Management", "Students", "View student records"],
  ["student.admission", "Student Admission", "Students", "Admit new students"],
  ["employee.management", "Employee Management", "HR", "Manage departments, designations, and employees"],
  ["user.management", "User Management", "Security", "Manage application users"],
  ["role.management", "Role Management", "Security", "Manage security roles"],
  ["role.permission", "Role Permissions", "Security", "Assign permissions to roles"],
  ["menu.management", "Menu Management", "Security", "Manage sidebar menus"],
  ["menu.permission", "Menu Permissions", "Security", "Assign sidebar menu access"],
  ["user.role", "User Role Assignment", "Security", "Assign roles to users"],
];

async function ensureUserRolesTableShape() {
  const result = await pool.query(`
    SELECT COUNT(*) AS total
    FROM information_schema.columns
    WHERE table_schema = DATABASE()
      AND table_name = 'user_roles'
      AND column_name = 'user_role_id'
  `);

  if (Number(result.rows[0]?.total || 0) > 0) {
    return;
  }

  await pool.query("ALTER TABLE sms.user_roles DROP PRIMARY KEY");
  await pool.query("ALTER TABLE sms.user_roles MODIFY branch_id BIGINT NULL");
  await pool.query(
    "ALTER TABLE sms.user_roles ADD COLUMN user_role_id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY FIRST"
  );
  await pool.query(
    "CREATE UNIQUE INDEX uk_user_roles_branch ON sms.user_roles (user_id, role_id, branch_id)"
  );
}

export async function ensureSecurityCatalog() {
  await ensureUserRolesTableShape();

  await pool.query(`
    INSERT INTO sms.menus
      (parent_menu_id, menu_code, menu_title, route_path, icon_name, sort_order, is_visible, status)
    VALUES
      (NULL, 'EMPLOYEE_MANAGEMENT', 'Employee Management', '/employees', 'employee', 40, TRUE, 'ACTIVE')
    ON DUPLICATE KEY UPDATE
      menu_title = VALUES(menu_title),
      route_path = VALUES(route_path),
      icon_name = VALUES(icon_name),
      sort_order = VALUES(sort_order),
      is_visible = VALUES(is_visible),
      status = VALUES(status)
  `);

  for (const permission of permissions) {
    await pool.query(
      `
      INSERT INTO sms.permissions
        (permission_code, permission_name, module_name, description, status)
      VALUES
        ($1, $2, $3, $4, 'ACTIVE')
      ON DUPLICATE KEY UPDATE
        permission_name = VALUES(permission_name),
        module_name = VALUES(module_name),
        description = VALUES(description),
        status = 'ACTIVE'
      `,
      permission
    );
  }

  await pool.query(`
    INSERT INTO sms.role_permissions
      (role_id, permission_id, can_view, can_create, can_update, can_delete, can_approve)
    SELECT
      r.role_id,
      p.permission_id,
      TRUE,
      TRUE,
      TRUE,
      TRUE,
      TRUE
    FROM sms.roles r
    CROSS JOIN sms.permissions p
    LEFT JOIN sms.role_permissions rp
      ON rp.role_id = r.role_id
     AND rp.permission_id = p.permission_id
    WHERE r.role_code = 'ADMIN'
      AND p.status = 'ACTIVE'
      AND rp.permission_id IS NULL
  `);

  await pool.query(`
    INSERT INTO sms.role_menus (role_id, menu_id, can_access)
    SELECT
      r.role_id,
      m.menu_id,
      TRUE
    FROM sms.roles r
    CROSS JOIN sms.menus m
    LEFT JOIN sms.role_menus rm
      ON rm.role_id = r.role_id
     AND rm.menu_id = m.menu_id
    WHERE r.role_code = 'ADMIN'
      AND m.status = 'ACTIVE'
      AND rm.menu_id IS NULL
  `);

  await pool.query(`
    INSERT INTO sms.role_permissions
      (role_id, permission_id, can_view, can_create, can_update, can_delete, can_approve)
    SELECT
      r.role_id,
      p.permission_id,
      TRUE,
      FALSE,
      FALSE,
      FALSE,
      FALSE
    FROM sms.roles r
    JOIN sms.permissions p
      ON p.permission_code IN ('dashboard.access', 'student.management')
    LEFT JOIN sms.role_permissions rp
      ON rp.role_id = r.role_id
     AND rp.permission_id = p.permission_id
    WHERE r.role_code = 'STAFF'
      AND p.status = 'ACTIVE'
      AND rp.permission_id IS NULL
  `);

  await pool.query(`
    INSERT INTO sms.role_menus (role_id, menu_id, can_access)
    SELECT
      r.role_id,
      m.menu_id,
      TRUE
    FROM sms.roles r
    JOIN sms.menus m
      ON m.menu_code IN ('DASHBOARD', 'STUDENT', 'STUDENT_LIST')
    LEFT JOIN sms.role_menus rm
      ON rm.role_id = r.role_id
     AND rm.menu_id = m.menu_id
    WHERE r.role_code = 'STAFF'
      AND m.status = 'ACTIVE'
      AND rm.menu_id IS NULL
  `);
}
