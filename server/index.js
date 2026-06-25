import express from 'express';
import cors from 'cors';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { initDatabase, query, queryOne } from './database.js';

const app = express();
const port = Number(process.env.PORT || 3001);
const jwtSecret = process.env.JWT_SECRET || 'pbm-local-development-secret';

app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: '1mb' }));

function asyncHandler(handler) {
  return (req, res, next) => Promise.resolve(handler(req, res, next)).catch(next);
}

function signUser(user) {
  return jwt.sign(
    { userId: user.user_id, username: user.username },
    jwtSecret,
    { expiresIn: '8h' },
  );
}

async function getUserAuthContext(userId) {
  const user = await queryOne(
    `SELECT user_id AS userId, full_name AS fullName, username, email, phone, status
     FROM users
     WHERE user_id = ?`,
    [userId],
  );
  if (!user || user.status !== 'ACTIVE') return null;

  const roles = await query(
    `SELECT r.role_id AS roleId, r.role_name AS roleName, r.role_code AS roleCode
     FROM roles r
     JOIN user_roles ur ON r.role_id = ur.role_id
     WHERE ur.user_id = ? AND r.is_active = TRUE
     ORDER BY r.role_name`,
    [userId],
  );

  const permissionRows = await query(
    `SELECT ap.page_code AS pageCode, p.permission_code AS permissionCode
     FROM users u
     JOIN user_roles ur ON u.user_id = ur.user_id
     JOIN roles r ON ur.role_id = r.role_id
     JOIN role_permissions rp ON r.role_id = rp.role_id
     JOIN app_pages ap ON rp.page_id = ap.page_id
     JOIN permissions p ON rp.permission_id = p.permission_id
     WHERE u.user_id = ?
       AND rp.is_allowed = TRUE
       AND r.is_active = TRUE
       AND ap.is_active = TRUE`,
    [userId],
  );

  const permissions = {};
  for (const row of permissionRows) {
    if (!permissions[row.pageCode]) permissions[row.pageCode] = [];
    if (!permissions[row.pageCode].includes(row.permissionCode)) {
      permissions[row.pageCode].push(row.permissionCode);
    }
  }

  const menus = await query(
    `SELECT
        m.menu_id AS menuId,
        m.parent_menu_id AS parentMenuId,
        m.menu_name AS menuName,
        m.icon,
        m.sort_order AS sortOrder,
        ap.page_code AS pageCode,
        ap.route_path AS routePath,
        ap.component_name AS componentName
     FROM menus m
     LEFT JOIN app_pages ap ON m.page_id = ap.page_id
     WHERE m.is_active = TRUE
       AND (
        m.page_id IS NULL OR EXISTS (
          SELECT 1
          FROM role_permissions rp
          JOIN user_roles ur ON rp.role_id = ur.role_id
          JOIN permissions p ON rp.permission_id = p.permission_id
          WHERE ur.user_id = ?
            AND rp.page_id = m.page_id
            AND rp.is_allowed = TRUE
            AND p.permission_code = 'VIEW'
        )
       )
     ORDER BY m.sort_order, m.menu_name`,
    [userId],
  );

  return {
    user,
    roles: roles.map((role) => role.roleCode),
    roleDetails: roles,
    menus,
    permissions,
  };
}

function requireAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : '';

  if (!token) {
    return res.status(401).json({ message: 'Authentication required.' });
  }

  try {
    req.tokenUser = jwt.verify(token, jwtSecret);
    return next();
  } catch {
    return res.status(401).json({ message: 'Session expired. Please login again.' });
  }
}

async function attachAuthContext(req, res, next) {
  const context = await getUserAuthContext(req.tokenUser.userId);
  if (!context) {
    return res.status(401).json({ message: 'User is inactive or no longer exists.' });
  }
  req.auth = context;
  req.user = context.user;
  return next();
}

function checkPermission(pageCode, permissionCode) {
  return (req, res, next) => {
    const userPermissions = req.auth?.permissions || {};
    if (userPermissions[pageCode]?.includes(permissionCode)) {
      return next();
    }
    return res.status(403).json({ message: 'Access denied' });
  };
}

const adminAuth = [requireAuth, asyncHandler(attachAuthContext)];

function publicSettings() {
  return queryOne('SELECT * FROM school_settings WHERE id = 1');
}

function normalizeUser(row) {
  return {
    userId: row.user_id,
    fullName: row.full_name,
    username: row.username,
    email: row.email,
    phone: row.phone,
    status: row.status,
    roles: row.roles ? row.roles.split(',').filter(Boolean) : [],
  };
}

app.get('/api/health', (req, res) => {
  res.json({ ok: true, service: 'pbm-education-api' });
});

app.get('/api/public', asyncHandler(async (req, res) => {
  const settings = await publicSettings();
  const notices = await query('SELECT * FROM notices ORDER BY urgent DESC, published_at DESC, id DESC LIMIT 8');
  const teachers = await query('SELECT * FROM teachers ORDER BY id DESC LIMIT 12');

  res.json({ settings, notices, teachers });
}));

app.post('/api/auth/login', asyncHandler(async (req, res) => {
  const { email, username, password } = req.body || {};
  const login = String(email || username || '').trim().toLowerCase();
  if (!login || !password) {
    return res.status(400).json({ message: 'Username/email and password are required.' });
  }

  const user = await queryOne(
    `SELECT *
     FROM users
     WHERE LOWER(username) = ? OR LOWER(email) = ?`,
    [login, login],
  );
  if (!user || !bcrypt.compareSync(password, user.password_hash)) {
    return res.status(401).json({ message: 'Invalid username/email or password.' });
  }
  if (user.status !== 'ACTIVE') {
    return res.status(403).json({ message: `User status is ${user.status}.` });
  }

  const context = await getUserAuthContext(user.user_id);
  return res.json({ token: signUser(user), ...context });
}));

app.get('/api/auth/me', adminAuth, asyncHandler(async (req, res) => {
  res.json(req.auth);
}));

app.get('/api/admin/overview', ...adminAuth, checkPermission('DASHBOARD', 'VIEW'), asyncHandler(async (req, res) => {
  const totals = {
    notices: (await queryOne('SELECT COUNT(*) AS total FROM notices')).total,
    teachers: (await queryOne('SELECT COUNT(*) AS total FROM teachers')).total,
    admissions: (await queryOne('SELECT COUNT(*) AS total FROM admissions')).total,
    pendingAdmissions: (await queryOne("SELECT COUNT(*) AS total FROM admissions WHERE status = 'pending'")).total,
    users: (await queryOne('SELECT COUNT(*) AS total FROM users')).total,
    roles: (await queryOne('SELECT COUNT(*) AS total FROM roles')).total,
  };
  res.json({ totals, settings: await publicSettings() });
}));

app.get('/api/admin/access', ...adminAuth, checkPermission('PERMISSION_MANAGEMENT', 'VIEW'), asyncHandler(async (req, res) => {
  const users = await query(`
    SELECT u.*, GROUP_CONCAT(r.role_code ORDER BY r.role_code) AS roles
    FROM users u
    LEFT JOIN user_roles ur ON u.user_id = ur.user_id
    LEFT JOIN roles r ON ur.role_id = r.role_id
    GROUP BY u.user_id
    ORDER BY u.user_id DESC
  `);
  const roles = await query('SELECT role_id AS roleId, role_name AS roleName, role_code AS roleCode, description, is_active AS isActive FROM roles ORDER BY role_name');
  const modules = await query('SELECT module_id AS moduleId, module_name AS moduleName, module_code AS moduleCode, icon, sort_order AS sortOrder, is_active AS isActive FROM app_modules ORDER BY sort_order, module_name');
  const pages = await query('SELECT page_id AS pageId, module_id AS moduleId, page_name AS pageName, page_code AS pageCode, route_path AS routePath, component_name AS componentName, icon, sort_order AS sortOrder, is_active AS isActive FROM app_pages ORDER BY sort_order, page_name');
  const menus = await query('SELECT menu_id AS menuId, parent_menu_id AS parentMenuId, page_id AS pageId, menu_name AS menuName, icon, sort_order AS sortOrder, is_active AS isActive FROM menus ORDER BY sort_order, menu_name');
  const permissions = await query('SELECT permission_id AS permissionId, permission_code AS permissionCode, permission_name AS permissionName FROM permissions ORDER BY permission_id');
  const rolePermissions = await query(`
    SELECT role_id AS roleId, page_id AS pageId, permission_id AS permissionId, is_allowed AS isAllowed
    FROM role_permissions
  `);

  res.json({
    users: users.map(normalizeUser),
    roles,
    modules,
    pages,
    menus,
    permissions,
    rolePermissions,
  });
}));

app.post('/api/admin/users', ...adminAuth, checkPermission('USER_MANAGEMENT', 'CREATE'), asyncHandler(async (req, res) => {
  const { fullName, username, email, phone = '', password, status = 'ACTIVE', roleIds = [] } = req.body || {};
  if (!fullName || !username || !password) {
    return res.status(400).json({ message: 'Full name, username, and password are required.' });
  }

  const info = await query(
    `INSERT INTO users (full_name, username, email, phone, password_hash, status)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [fullName, username, email || null, phone, bcrypt.hashSync(password, 10), status],
  );
  for (const roleId of roleIds) {
    await query('INSERT IGNORE INTO user_roles (user_id, role_id) VALUES (?, ?)', [info.insertId, roleId]);
  }
  res.status(201).json({ userId: info.insertId });
}));

app.put('/api/admin/users/:userId', ...adminAuth, checkPermission('USER_MANAGEMENT', 'UPDATE'), asyncHandler(async (req, res) => {
  const { fullName, username, email, phone = '', password, status = 'ACTIVE', roleIds = [] } = req.body || {};
  if (!fullName || !username) {
    return res.status(400).json({ message: 'Full name and username are required.' });
  }

  if (password) {
    await query(
      `UPDATE users SET full_name = ?, username = ?, email = ?, phone = ?, password_hash = ?, status = ?
       WHERE user_id = ?`,
      [fullName, username, email || null, phone, bcrypt.hashSync(password, 10), status, req.params.userId],
    );
  } else {
    await query(
      `UPDATE users SET full_name = ?, username = ?, email = ?, phone = ?, status = ?
       WHERE user_id = ?`,
      [fullName, username, email || null, phone, status, req.params.userId],
    );
  }

  await query('DELETE FROM user_roles WHERE user_id = ?', [req.params.userId]);
  for (const roleId of roleIds) {
    await query('INSERT IGNORE INTO user_roles (user_id, role_id) VALUES (?, ?)', [req.params.userId, roleId]);
  }
  res.json({ ok: true });
}));

app.post('/api/admin/roles', ...adminAuth, checkPermission('ROLE_MANAGEMENT', 'CREATE'), asyncHandler(async (req, res) => {
  const { roleName, roleCode, description = '', isActive = true } = req.body || {};
  if (!roleName || !roleCode) {
    return res.status(400).json({ message: 'Role name and role code are required.' });
  }

  const info = await query(
    'INSERT INTO roles (role_name, role_code, description, is_active) VALUES (?, ?, ?, ?)',
    [roleName, roleCode.toUpperCase(), description, isActive ? 1 : 0],
  );
  res.status(201).json({ roleId: info.insertId });
}));

app.put('/api/admin/roles/:roleId', ...adminAuth, checkPermission('ROLE_MANAGEMENT', 'UPDATE'), asyncHandler(async (req, res) => {
  const { roleName, roleCode, description = '', isActive = true } = req.body || {};
  if (!roleName || !roleCode) {
    return res.status(400).json({ message: 'Role name and role code are required.' });
  }

  await query(
    'UPDATE roles SET role_name = ?, role_code = ?, description = ?, is_active = ? WHERE role_id = ?',
    [roleName, roleCode.toUpperCase(), description, isActive ? 1 : 0, req.params.roleId],
  );
  res.json({ ok: true });
}));

app.put('/api/admin/roles/:roleId/permissions', ...adminAuth, checkPermission('PERMISSION_MANAGEMENT', 'UPDATE'), asyncHandler(async (req, res) => {
  const { grants = [] } = req.body || {};
  await query('DELETE FROM role_permissions WHERE role_id = ?', [req.params.roleId]);
  for (const grant of grants) {
    if (!grant.pageId || !grant.permissionId) continue;
    await query(
      `INSERT INTO role_permissions (role_id, page_id, permission_id, is_allowed)
       VALUES (?, ?, ?, ?)`,
      [req.params.roleId, grant.pageId, grant.permissionId, grant.isAllowed === false ? 0 : 1],
    );
  }
  res.json({ ok: true });
}));

app.get('/api/admin/settings', ...adminAuth, checkPermission('WEBSITE_SETTINGS', 'VIEW'), asyncHandler(async (req, res) => {
  res.json({ settings: await publicSettings() });
}));

app.put('/api/admin/settings', ...adminAuth, checkPermission('WEBSITE_SETTINGS', 'UPDATE'), asyncHandler(async (req, res) => {
  const payload = req.body || {};
  const required = ['name_bn', 'name_en', 'eiin', 'phone', 'email', 'address', 'breaking_news'];
  const missing = required.filter((key) => !String(payload[key] || '').trim());
  if (missing.length) return res.status(400).json({ message: `Missing fields: ${missing.join(', ')}` });

  await query(`
    UPDATE school_settings
    SET name_bn = ?, name_en = ?, eiin = ?, phone = ?, email = ?, address = ?, breaking_news = ?
    WHERE id = 1
  `, [
    payload.name_bn,
    payload.name_en,
    payload.eiin,
    payload.phone,
    payload.email,
    payload.address,
    payload.breaking_news,
  ]);

  res.json({ settings: await publicSettings() });
}));

app.get('/api/admin/notices', ...adminAuth, checkPermission('NOTICE_MANAGEMENT', 'VIEW'), asyncHandler(async (req, res) => {
  const notices = await query('SELECT * FROM notices ORDER BY published_at DESC, id DESC');
  res.json({ notices });
}));

app.post('/api/admin/notices', ...adminAuth, checkPermission('NOTICE_MANAGEMENT', 'CREATE'), asyncHandler(async (req, res) => {
  const { title, category, detail, urgent = 0, published_at } = req.body || {};
  if (!title || !category || !detail) {
    return res.status(400).json({ message: 'Title, category, and detail are required.' });
  }

  const info = await query(
    'INSERT INTO notices (title, category, detail, urgent, published_at) VALUES (?, ?, ?, ?, ?)',
    [title, category, detail, urgent ? 1 : 0, published_at || new Date().toISOString().slice(0, 10)],
  );

  const notice = await queryOne('SELECT * FROM notices WHERE id = ?', [info.insertId]);
  res.status(201).json({ notice });
}));

app.put('/api/admin/notices/:id', ...adminAuth, checkPermission('NOTICE_MANAGEMENT', 'UPDATE'), asyncHandler(async (req, res) => {
  const { title, category, detail, urgent = 0, published_at } = req.body || {};
  if (!title || !category || !detail) {
    return res.status(400).json({ message: 'Title, category, and detail are required.' });
  }

  await query(
    'UPDATE notices SET title = ?, category = ?, detail = ?, urgent = ?, published_at = ? WHERE id = ?',
    [title, category, detail, urgent ? 1 : 0, published_at || new Date().toISOString().slice(0, 10), req.params.id],
  );

  const notice = await queryOne('SELECT * FROM notices WHERE id = ?', [req.params.id]);
  res.json({ notice });
}));

app.delete('/api/admin/notices/:id', ...adminAuth, checkPermission('NOTICE_MANAGEMENT', 'DELETE'), asyncHandler(async (req, res) => {
  await query('DELETE FROM notices WHERE id = ?', [req.params.id]);
  res.status(204).end();
}));

app.get('/api/admin/teachers', ...adminAuth, checkPermission('TEACHER_MANAGEMENT', 'VIEW'), asyncHandler(async (req, res) => {
  const teachers = await query('SELECT * FROM teachers ORDER BY id DESC');
  res.json({ teachers });
}));

app.post('/api/admin/teachers', ...adminAuth, checkPermission('TEACHER_MANAGEMENT', 'CREATE'), asyncHandler(async (req, res) => {
  const { name, subject, designation, qualification, category, photo } = req.body || {};
  if (!name || !subject || !designation || !qualification || !category || !photo) {
    return res.status(400).json({ message: 'All teacher fields are required.' });
  }

  const info = await query(
    'INSERT INTO teachers (name, subject, designation, qualification, category, photo) VALUES (?, ?, ?, ?, ?, ?)',
    [name, subject, designation, qualification, category, photo],
  );

  const teacher = await queryOne('SELECT * FROM teachers WHERE id = ?', [info.insertId]);
  res.status(201).json({ teacher });
}));

app.put('/api/admin/teachers/:id', ...adminAuth, checkPermission('TEACHER_MANAGEMENT', 'UPDATE'), asyncHandler(async (req, res) => {
  const { name, subject, designation, qualification, category, photo } = req.body || {};
  if (!name || !subject || !designation || !qualification || !category || !photo) {
    return res.status(400).json({ message: 'All teacher fields are required.' });
  }

  await query(
    `UPDATE teachers
     SET name = ?, subject = ?, designation = ?, qualification = ?, category = ?, photo = ?
     WHERE id = ?`,
    [name, subject, designation, qualification, category, photo, req.params.id],
  );

  const teacher = await queryOne('SELECT * FROM teachers WHERE id = ?', [req.params.id]);
  res.json({ teacher });
}));

app.delete('/api/admin/teachers/:id', ...adminAuth, checkPermission('TEACHER_MANAGEMENT', 'DELETE'), asyncHandler(async (req, res) => {
  await query('DELETE FROM teachers WHERE id = ?', [req.params.id]);
  res.status(204).end();
}));

app.post('/api/admissions', asyncHandler(async (req, res) => {
  const payload = req.body || {};
  const required = ['student_name', 'father_name', 'mother_name', 'date_of_birth', 'class_name', 'phone'];
  const missing = required.filter((key) => !String(payload[key] || '').trim());
  if (missing.length) return res.status(400).json({ message: `Missing fields: ${missing.join(', ')}` });

  const info = await query(
    `INSERT INTO admissions
      (student_name, father_name, mother_name, date_of_birth, class_name, department, phone, previous_gpa)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      payload.student_name,
      payload.father_name,
      payload.mother_name,
      payload.date_of_birth,
      payload.class_name,
      payload.department || '',
      payload.phone,
      payload.previous_gpa || '',
    ],
  );

  res.status(201).json({ id: info.insertId, status: 'pending' });
}));

app.use((req, res) => {
  res.status(404).json({ message: 'API route not found.' });
});

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ message: 'Server error.' });
});

initDatabase()
  .then(() => {
    app.listen(port, () => {
      console.log(`PBM education API running on http://localhost:${port}`);
    });
  })
  .catch((err) => {
    console.error('Unable to initialize MySQL database.');
    console.error(err);
    process.exit(1);
  });

