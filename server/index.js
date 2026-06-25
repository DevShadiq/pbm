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

function signUser(user) {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    jwtSecret,
    { expiresIn: '8h' },
  );
}

function requireAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : '';

  if (!token) {
    return res.status(401).json({ message: 'Authentication required.' });
  }

  try {
    req.user = jwt.verify(token, jwtSecret);
    return next();
  } catch {
    return res.status(401).json({ message: 'Session expired. Please login again.' });
  }
}

function asyncHandler(handler) {
  return (req, res, next) => Promise.resolve(handler(req, res, next)).catch(next);
}

function publicSettings() {
  return queryOne('SELECT * FROM school_settings WHERE id = 1');
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
  const { email, password } = req.body || {};
  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required.' });
  }

  const user = await queryOne('SELECT * FROM users WHERE email = ?', [String(email).trim().toLowerCase()]);
  if (!user || !bcrypt.compareSync(password, user.password_hash)) {
    return res.status(401).json({ message: 'Invalid email or password.' });
  }

  const safeUser = { id: user.id, name: user.name, email: user.email, role: user.role };
  return res.json({ token: signUser(user), user: safeUser });
}));

app.get('/api/auth/me', requireAuth, asyncHandler(async (req, res) => {
  const user = await queryOne('SELECT id, name, email, role FROM users WHERE id = ?', [req.user.id]);
  if (!user) return res.status(404).json({ message: 'User not found.' });
  return res.json({ user });
}));

app.get('/api/admin/overview', requireAuth, asyncHandler(async (req, res) => {
  const totals = {
    notices: (await queryOne('SELECT COUNT(*) AS total FROM notices')).total,
    teachers: (await queryOne('SELECT COUNT(*) AS total FROM teachers')).total,
    admissions: (await queryOne('SELECT COUNT(*) AS total FROM admissions')).total,
    pendingAdmissions: (await queryOne("SELECT COUNT(*) AS total FROM admissions WHERE status = 'pending'")).total,
  };
  res.json({ totals, settings: await publicSettings() });
}));

app.get('/api/admin/settings', requireAuth, asyncHandler(async (req, res) => {
  res.json({ settings: await publicSettings() });
}));

app.put('/api/admin/settings', requireAuth, asyncHandler(async (req, res) => {
  const payload = req.body || {};
  const required = ['name_bn', 'name_en', 'eiin', 'phone', 'email', 'address', 'breaking_news'];
  const missing = required.filter((key) => !String(payload[key] || '').trim());
  if (missing.length) return res.status(400).json({ message: `Missing fields: ${missing.join(', ')}` });

  await query(`
    UPDATE school_settings
    SET name_bn = ?, name_en = ?, eiin = ?, phone = ?, email = ?, address = ?, breaking_news = ?, updated_at = CURRENT_TIMESTAMP
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

app.get('/api/admin/notices', requireAuth, asyncHandler(async (req, res) => {
  const notices = await query('SELECT * FROM notices ORDER BY published_at DESC, id DESC');
  res.json({ notices });
}));

app.post('/api/admin/notices', requireAuth, asyncHandler(async (req, res) => {
  const { title, category, detail, urgent = 0, published_at } = req.body || {};
  if (!title || !category || !detail) {
    return res.status(400).json({ message: 'Title, category, and detail are required.' });
  }

  const info = await query(`
    INSERT INTO notices (title, category, detail, urgent, published_at)
    VALUES (?, ?, ?, ?, ?)
  `, [title, category, detail, urgent ? 1 : 0, published_at || new Date().toISOString().slice(0, 10)]);

  const notice = await queryOne('SELECT * FROM notices WHERE id = ?', [info.insertId]);
  res.status(201).json({ notice });
}));

app.put('/api/admin/notices/:id', requireAuth, asyncHandler(async (req, res) => {
  const { title, category, detail, urgent = 0, published_at } = req.body || {};
  if (!title || !category || !detail) {
    return res.status(400).json({ message: 'Title, category, and detail are required.' });
  }

  await query(`
    UPDATE notices SET title = ?, category = ?, detail = ?, urgent = ?, published_at = ?
    WHERE id = ?
  `, [title, category, detail, urgent ? 1 : 0, published_at || new Date().toISOString().slice(0, 10), req.params.id]);

  const notice = await queryOne('SELECT * FROM notices WHERE id = ?', [req.params.id]);
  res.json({ notice });
}));

app.delete('/api/admin/notices/:id', requireAuth, asyncHandler(async (req, res) => {
  await query('DELETE FROM notices WHERE id = ?', [req.params.id]);
  res.status(204).end();
}));

app.get('/api/admin/teachers', requireAuth, asyncHandler(async (req, res) => {
  const teachers = await query('SELECT * FROM teachers ORDER BY id DESC');
  res.json({ teachers });
}));

app.post('/api/admin/teachers', requireAuth, asyncHandler(async (req, res) => {
  const { name, subject, designation, qualification, category, photo } = req.body || {};
  if (!name || !subject || !designation || !qualification || !category || !photo) {
    return res.status(400).json({ message: 'All teacher fields are required.' });
  }

  const info = await query(`
    INSERT INTO teachers (name, subject, designation, qualification, category, photo)
    VALUES (?, ?, ?, ?, ?, ?)
  `, [name, subject, designation, qualification, category, photo]);

  const teacher = await queryOne('SELECT * FROM teachers WHERE id = ?', [info.insertId]);
  res.status(201).json({ teacher });
}));

app.put('/api/admin/teachers/:id', requireAuth, asyncHandler(async (req, res) => {
  const { name, subject, designation, qualification, category, photo } = req.body || {};
  if (!name || !subject || !designation || !qualification || !category || !photo) {
    return res.status(400).json({ message: 'All teacher fields are required.' });
  }

  await query(`
    UPDATE teachers
    SET name = ?, subject = ?, designation = ?, qualification = ?, category = ?, photo = ?
    WHERE id = ?
  `, [name, subject, designation, qualification, category, photo, req.params.id]);

  const teacher = await queryOne('SELECT * FROM teachers WHERE id = ?', [req.params.id]);
  res.json({ teacher });
}));

app.delete('/api/admin/teachers/:id', requireAuth, asyncHandler(async (req, res) => {
  await query('DELETE FROM teachers WHERE id = ?', [req.params.id]);
  res.status(204).end();
}));

app.post('/api/admissions', asyncHandler(async (req, res) => {
  const payload = req.body || {};
  const required = ['student_name', 'father_name', 'mother_name', 'date_of_birth', 'class_name', 'phone'];
  const missing = required.filter((key) => !String(payload[key] || '').trim());
  if (missing.length) return res.status(400).json({ message: `Missing fields: ${missing.join(', ')}` });

  const info = await query(`
    INSERT INTO admissions
      (student_name, father_name, mother_name, date_of_birth, class_name, department, phone, previous_gpa)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `, [
    payload.student_name,
    payload.father_name,
    payload.mother_name,
    payload.date_of_birth,
    payload.class_name,
    payload.department || '',
    payload.phone,
    payload.previous_gpa || '',
  ]);

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
