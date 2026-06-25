import 'dotenv/config';
import mysql from 'mysql2/promise';
import bcrypt from 'bcryptjs';

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'pbm',
  waitForConnections: true,
  connectionLimit: Number(process.env.DB_CONNECTION_LIMIT || 10),
  charset: 'utf8mb4',
  dateStrings: true,
};

let pool;

export function getPool() {
  if (!pool) pool = mysql.createPool(dbConfig);
  return pool;
}

export async function query(sql, params = []) {
  const [rows] = await getPool().execute(sql, params);
  return rows;
}

export async function queryOne(sql, params = []) {
  const rows = await query(sql, params);
  return rows[0] || null;
}

export async function initDatabase() {
  await ensureDatabase();
  await migrateLegacyUsersTable();
  await createAuthTables();
  await createSchoolTables();
  await seedAuthCore();
  await seedSchoolCore();
}

async function ensureDatabase() {
  const connection = await mysql.createConnection({
    host: dbConfig.host,
    port: dbConfig.port,
    user: dbConfig.user,
    password: dbConfig.password,
    charset: 'utf8mb4',
  });

  await connection.query(
    `CREATE DATABASE IF NOT EXISTS \`${dbConfig.database}\`
     CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`,
  );
  await connection.end();
}

async function migrateLegacyUsersTable() {
  const table = await queryOne(`
    SELECT TABLE_NAME AS tableName
    FROM INFORMATION_SCHEMA.TABLES
    WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'users'
  `, [dbConfig.database]);
  if (!table) return;

  const column = await queryOne(`
    SELECT COLUMN_NAME AS columnName
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'users' AND COLUMN_NAME = 'user_id'
  `, [dbConfig.database]);
  if (column) return;

  const archiveName = `legacy_users_${Date.now()}`;
  await query(`RENAME TABLE users TO \`${archiveName}\``);
}

async function createAuthTables() {
  await query(`
    CREATE TABLE IF NOT EXISTS users (
      user_id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
      full_name VARCHAR(150) NOT NULL,
      username VARCHAR(100) NOT NULL UNIQUE,
      email VARCHAR(150) UNIQUE,
      phone VARCHAR(30),
      password_hash VARCHAR(255) NOT NULL,
      status ENUM('ACTIVE','INACTIVE','LOCKED') DEFAULT 'ACTIVE',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

  await query(`
    CREATE TABLE IF NOT EXISTS roles (
      role_id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
      role_name VARCHAR(100) NOT NULL UNIQUE,
      role_code VARCHAR(50) NOT NULL UNIQUE,
      description VARCHAR(255),
      is_active BOOLEAN DEFAULT TRUE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

  await query(`
    CREATE TABLE IF NOT EXISTS user_roles (
      user_role_id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
      user_id BIGINT UNSIGNED NOT NULL,
      role_id BIGINT UNSIGNED NOT NULL,
      assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE KEY uq_user_role (user_id, role_id),
      CONSTRAINT fk_user_roles_user FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
      CONSTRAINT fk_user_roles_role FOREIGN KEY (role_id) REFERENCES roles(role_id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

  await query(`
    CREATE TABLE IF NOT EXISTS app_modules (
      module_id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
      module_name VARCHAR(150) NOT NULL,
      module_code VARCHAR(80) NOT NULL UNIQUE,
      icon VARCHAR(100),
      sort_order INT DEFAULT 0,
      is_active BOOLEAN DEFAULT TRUE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

  await query(`
    CREATE TABLE IF NOT EXISTS app_pages (
      page_id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
      module_id BIGINT UNSIGNED NOT NULL,
      page_name VARCHAR(150) NOT NULL,
      page_code VARCHAR(100) NOT NULL UNIQUE,
      route_path VARCHAR(255) NOT NULL,
      component_name VARCHAR(150),
      icon VARCHAR(100),
      sort_order INT DEFAULT 0,
      is_active BOOLEAN DEFAULT TRUE,
      CONSTRAINT fk_app_pages_module FOREIGN KEY (module_id) REFERENCES app_modules(module_id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

  await query(`
    CREATE TABLE IF NOT EXISTS menus (
      menu_id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
      parent_menu_id BIGINT UNSIGNED NULL,
      page_id BIGINT UNSIGNED NULL,
      menu_name VARCHAR(150) NOT NULL,
      icon VARCHAR(100),
      sort_order INT DEFAULT 0,
      is_active BOOLEAN DEFAULT TRUE,
      CONSTRAINT fk_menus_parent FOREIGN KEY (parent_menu_id) REFERENCES menus(menu_id) ON DELETE SET NULL,
      CONSTRAINT fk_menus_page FOREIGN KEY (page_id) REFERENCES app_pages(page_id) ON DELETE SET NULL
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

  await query(`
    CREATE TABLE IF NOT EXISTS permissions (
      permission_id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
      permission_code VARCHAR(50) NOT NULL UNIQUE,
      permission_name VARCHAR(100) NOT NULL
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

  await query(`
    CREATE TABLE IF NOT EXISTS role_permissions (
      role_permission_id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
      role_id BIGINT UNSIGNED NOT NULL,
      page_id BIGINT UNSIGNED NOT NULL,
      permission_id BIGINT UNSIGNED NOT NULL,
      is_allowed BOOLEAN DEFAULT TRUE,
      UNIQUE KEY uq_role_page_permission (role_id, page_id, permission_id),
      CONSTRAINT fk_role_permissions_role FOREIGN KEY (role_id) REFERENCES roles(role_id) ON DELETE CASCADE,
      CONSTRAINT fk_role_permissions_page FOREIGN KEY (page_id) REFERENCES app_pages(page_id) ON DELETE CASCADE,
      CONSTRAINT fk_role_permissions_permission FOREIGN KEY (permission_id) REFERENCES permissions(permission_id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
}

async function createSchoolTables() {
  await query(`
    CREATE TABLE IF NOT EXISTS school_settings (
      id TINYINT UNSIGNED NOT NULL PRIMARY KEY,
      name_bn VARCHAR(255) NOT NULL,
      name_en VARCHAR(255) NOT NULL,
      eiin VARCHAR(50) NOT NULL,
      phone VARCHAR(80) NOT NULL,
      email VARCHAR(190) NOT NULL,
      address TEXT NOT NULL,
      breaking_news TEXT NOT NULL,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

  await query(`
    CREATE TABLE IF NOT EXISTS notices (
      id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
      title VARCHAR(255) NOT NULL,
      category VARCHAR(80) NOT NULL,
      detail TEXT NOT NULL,
      urgent TINYINT(1) NOT NULL DEFAULT 0,
      published_at DATE NOT NULL,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_notices_published (published_at)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

  await query(`
    CREATE TABLE IF NOT EXISTS teachers (
      id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(150) NOT NULL,
      subject VARCHAR(150) NOT NULL,
      designation VARCHAR(150) NOT NULL,
      qualification VARCHAR(150) NOT NULL,
      category VARCHAR(80) NOT NULL,
      photo VARCHAR(500) NOT NULL,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

  await query(`
    CREATE TABLE IF NOT EXISTS admissions (
      id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
      student_name VARCHAR(150) NOT NULL,
      father_name VARCHAR(150) NOT NULL,
      mother_name VARCHAR(150) NOT NULL,
      date_of_birth DATE NOT NULL,
      class_name VARCHAR(80) NOT NULL,
      department VARCHAR(120),
      phone VARCHAR(80) NOT NULL,
      previous_gpa VARCHAR(30),
      status ENUM('pending', 'approved', 'rejected') NOT NULL DEFAULT 'pending',
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
}

async function seedAuthCore() {
  const permissionRows = [
    ['VIEW', 'View'],
    ['CREATE', 'Create'],
    ['EDIT', 'Edit'],
    ['UPDATE', 'Update'],
    ['DELETE', 'Delete'],
    ['APPROVE', 'Approve'],
    ['EXPORT', 'Export'],
    ['PRINT', 'Print'],
  ];
  await Promise.all(permissionRows.map(([code, name]) => (
    query(
      'INSERT IGNORE INTO permissions (permission_code, permission_name) VALUES (?, ?)',
      [code, name],
    )
  )));

  const roleRows = [
    ['Super Admin', 'SUPER_ADMIN', 'Full system access'],
    ['Admin', 'ADMIN', 'Administrative access'],
    ['Manager', 'MANAGER', 'Management level access'],
    ['User', 'USER', 'Normal user access'],
    ['Viewer', 'VIEWER', 'Read only access'],
  ];
  await Promise.all(roleRows.map(([name, code, description]) => (
    query(
      'INSERT IGNORE INTO roles (role_name, role_code, description) VALUES (?, ?, ?)',
      [name, code, description],
    )
  )));

  await seedAppStructure();
  await seedAdminUser();
  await grantSuperAdminAccess();
}

async function seedAppStructure() {
  const modules = [
    ['Dashboard', 'DASHBOARD', 'fas fa-chart-pie', 1],
    ['Website CMS', 'WEBSITE_CMS', 'fas fa-globe', 2],
    ['Access Control', 'ACCESS_CONTROL', 'fas fa-user-shield', 3],
    ['School Management', 'SCHOOL_MANAGEMENT', 'fas fa-school', 4],
  ];
  for (const item of modules) {
    await query(
      'INSERT IGNORE INTO app_modules (module_name, module_code, icon, sort_order) VALUES (?, ?, ?, ?)',
      item,
    );
  }

  const moduleMap = await getModuleMap();
  const pages = [
    [moduleMap.DASHBOARD, 'Dashboard', 'DASHBOARD', '/admin', 'AdminDashboard', 'fas fa-chart-pie', 1],
    [moduleMap.WEBSITE_CMS, 'Website Settings', 'WEBSITE_SETTINGS', '/admin/settings', 'WebsiteSettings', 'fas fa-gear', 1],
    [moduleMap.WEBSITE_CMS, 'Notices', 'NOTICE_MANAGEMENT', '/admin/notices', 'NoticeManagement', 'fas fa-bullhorn', 2],
    [moduleMap.SCHOOL_MANAGEMENT, 'Teachers', 'TEACHER_MANAGEMENT', '/admin/teachers', 'TeacherManagement', 'fas fa-chalkboard-user', 1],
    [moduleMap.ACCESS_CONTROL, 'Users', 'USER_MANAGEMENT', '/admin/users', 'UserManagement', 'fas fa-users', 1],
    [moduleMap.ACCESS_CONTROL, 'Roles', 'ROLE_MANAGEMENT', '/admin/roles', 'RoleManagement', 'fas fa-id-badge', 2],
    [moduleMap.ACCESS_CONTROL, 'Permissions', 'PERMISSION_MANAGEMENT', '/admin/permissions', 'PermissionManagement', 'fas fa-key', 3],
  ];
  for (const page of pages) {
    await query(
      `INSERT IGNORE INTO app_pages
        (module_id, page_name, page_code, route_path, component_name, icon, sort_order)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      page,
    );
  }

  const pageMap = await getPageMap();
  const menus = [
    [null, pageMap.DASHBOARD, 'Dashboard', 'fas fa-chart-pie', 1],
    [null, pageMap.WEBSITE_SETTINGS, 'Website Settings', 'fas fa-gear', 2],
    [null, pageMap.NOTICE_MANAGEMENT, 'Notices', 'fas fa-bullhorn', 3],
    [null, pageMap.TEACHER_MANAGEMENT, 'Teachers', 'fas fa-chalkboard-user', 4],
    [null, pageMap.USER_MANAGEMENT, 'Users', 'fas fa-users', 5],
    [null, pageMap.ROLE_MANAGEMENT, 'Roles', 'fas fa-id-badge', 6],
    [null, pageMap.PERMISSION_MANAGEMENT, 'Permissions', 'fas fa-key', 7],
  ];
  for (const menu of menus) {
    const existing = await queryOne('SELECT menu_id FROM menus WHERE page_id <=> ? AND menu_name = ?', [menu[1], menu[2]]);
    if (!existing) {
      await query(
        'INSERT INTO menus (parent_menu_id, page_id, menu_name, icon, sort_order) VALUES (?, ?, ?, ?, ?)',
        menu,
      );
    }
  }
}

async function seedAdminUser() {
  const user = await queryOne('SELECT user_id FROM users WHERE username = ? OR email = ?', ['admin', 'admin@pbm.edu.bd']);
  if (!user) {
    await query(
      `INSERT INTO users (full_name, username, email, password_hash, status)
       VALUES (?, ?, ?, ?, 'ACTIVE')`,
      [
        'PBM Administrator',
        'admin',
        'admin@pbm.edu.bd',
        bcrypt.hashSync('Admin@12345', 10),
      ],
    );
  }

  const admin = await queryOne('SELECT user_id FROM users WHERE username = ?', ['admin']);
  const superRole = await queryOne('SELECT role_id FROM roles WHERE role_code = ?', ['SUPER_ADMIN']);
  if (admin && superRole) {
    await query(
      'INSERT IGNORE INTO user_roles (user_id, role_id) VALUES (?, ?)',
      [admin.user_id, superRole.role_id],
    );
  }
}

async function grantSuperAdminAccess() {
  const superRole = await queryOne('SELECT role_id FROM roles WHERE role_code = ?', ['SUPER_ADMIN']);
  if (!superRole) return;

  const pages = await query('SELECT page_id FROM app_pages');
  const permissions = await query('SELECT permission_id FROM permissions');
  for (const page of pages) {
    for (const permission of permissions) {
      await query(
        `INSERT INTO role_permissions (role_id, page_id, permission_id, is_allowed)
         VALUES (?, ?, ?, TRUE)
         ON DUPLICATE KEY UPDATE is_allowed = TRUE`,
        [superRole.role_id, page.page_id, permission.permission_id],
      );
    }
  }
}

async function seedSchoolCore() {
  await query(
    `INSERT IGNORE INTO school_settings
      (id, name_bn, name_en, eiin, phone, email, address, breaking_news)
     VALUES (1, ?, ?, ?, ?, ?, ?, ?)`,
    [
      'পয়লা বানিয়াবাড়ী ফাজিল মাদরাসা',
      'PAILA BANIABARI FAZIL MADRASAH',
      '110124',
      '০১৫১৮৩৬۶۱۷۸',
      'pbm@yahoo.com',
      'বানিয়াবাড়ী, মাহমুদপুর, মেলান্দহ, জামালপুর',
      'পয়লা বানিয়াবাড়ী ফাজিল মাদরাসায় নতুন শিক্ষাবর্ষের ভর্তি কার্যক্রম চলছে।',
    ],
  );

  const noticeCount = await queryOne('SELECT COUNT(*) AS total FROM notices');
  if (Number(noticeCount.total) === 0) {
    const notices = [
      ['২০২৫ শিক্ষাবর্ষে ভর্তি বিজ্ঞপ্তি', 'ভর্তি', 'ষষ্ঠ থেকে দ্বাদশ শ্রেণি পর্যন্ত ভর্তি কার্যক্রম শুরু হবে।', 1, '2025-01-12'],
      ['বার্ষিক পরীক্ষা ২০২৪ এর সময়সূচি প্রকাশ', 'পরীক্ষা', 'বার্ষিক পরীক্ষা ২০২৪ এর সম্পূর্ণ সময়সূচি প্রকাশ করা হয়েছে।', 1, '2025-01-10'],
      ['অধ্যক্ষ মহোদয়ের অফিস পরিদর্শন সময়সূচি', 'প্রশাসন', 'প্রতি রবিবার ও বুধবার সকাল ১০টা থেকে দুপুর ১টা পর্যন্ত সাক্ষাৎ করা যাবে।', 0, '2025-01-08'],
    ];
    await Promise.all(notices.map((notice) => (
      query(
        'INSERT INTO notices (title, category, detail, urgent, published_at) VALUES (?, ?, ?, ?, ?)',
        notice,
      )
    )));
  }

  const teacherCount = await queryOne('SELECT COUNT(*) AS total FROM teachers');
  if (Number(teacherCount.total) === 0) {
    const teachers = [
      ['মো: আবদুল করিম', 'প্রধান শিক্ষক ও অধ্যক্ষ', 'অধ্যক্ষ', 'এম.এড, বি.এড', 'প্রশাসন', 'https://picsum.photos/seed/teacher1/400/400.jpg'],
      ['মোসা: ফাতেমা বেগম', 'উপাধ্যক্ষ', 'উপাধ্যক্ষ', 'এম.এসসি, বি.এড', 'প্রশাসন', 'https://picsum.photos/seed/teacher2/400/400.jpg'],
      ['ড. মো: রফিকুল ইসলাম', 'পদার্থবিজ্ঞান', 'প্রফেসর', 'পিএইচডি', 'বিজ্ঞান', 'https://picsum.photos/seed/teacher3/400/400.jpg'],
    ];
    await Promise.all(teachers.map((teacher) => (
      query(
        'INSERT INTO teachers (name, subject, designation, qualification, category, photo) VALUES (?, ?, ?, ?, ?, ?)',
        teacher,
      )
    )));
  }
}

async function getModuleMap() {
  const rows = await query('SELECT module_id, module_code FROM app_modules');
  return Object.fromEntries(rows.map((row) => [row.module_code, row.module_id]));
}

async function getPageMap() {
  const rows = await query('SELECT page_id, page_code FROM app_pages');
  return Object.fromEntries(rows.map((row) => [row.page_code, row.page_id]));
}

