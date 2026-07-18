import express from "express";
import multer from "multer";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import pool from "../config/db.js";
import { authenticateUser } from "../middleware/authMiddleware.js";
import { requirePermission } from "../middleware/permissionMiddleware.js";
import { htmlToPlainText, sanitizeNoticeHtml } from "../utils/noticeContent.js";

const router = express.Router();
const statuses = new Set(["DRAFT", "PUBLISHED", "ARCHIVED"]);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const noticeUploadDirectory = path.resolve(__dirname, "../../uploads/notices");

fs.mkdirSync(noticeUploadDirectory, { recursive: true });

const safeFileName = (value) =>
  String(value || "attachment")
    .replace(/[^a-zA-Z0-9._-]/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 100);

const noticeUpload = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, callback) => callback(null, noticeUploadDirectory),
    filename: (_req, file, callback) => {
      const extension = path.extname(file.originalname).toLowerCase();
      const baseName = safeFileName(path.basename(file.originalname, extension));
      callback(null, `notice-${Date.now()}-${baseName}${extension}`);
    },
  }),
  fileFilter: (_req, file, callback) => {
    const allowedTypes = ["application/pdf", "image/jpeg", "image/png", "image/webp"];
    callback(allowedTypes.includes(file.mimetype) ? null : new Error("Only PDF, JPG, PNG, and WEBP files are allowed."), allowedTypes.includes(file.mimetype));
  },
  limits: { fileSize: 10 * 1024 * 1024 },
});

const normalizeStatus = (status) => String(status || "DRAFT").trim().toUpperCase();
const nullable = (value) => (value === "" || value === undefined ? null : value);

const localNoticeAttachmentPath = (attachmentUrl) => {
  if (typeof attachmentUrl !== "string" || !attachmentUrl) return null;

  let pathname;
  try {
    pathname = new URL(attachmentUrl, "http://localhost").pathname;
  } catch {
    return null;
  }

  if (!pathname.startsWith("/uploads/notices/")) return null;

  const candidate = path.resolve(noticeUploadDirectory, `.${pathname.slice("/uploads/notices".length)}`);
  const relativePath = path.relative(noticeUploadDirectory, candidate);
  if (relativePath.startsWith("..") || path.isAbsolute(relativePath)) return null;
  return candidate;
};

const deleteLocalNoticeAttachment = async (attachmentUrl) => {
  const localPath = localNoticeAttachmentPath(attachmentUrl);
  if (!localPath) return;
  try {
    await fs.promises.unlink(localPath);
  } catch (error) {
    if (error.code !== "ENOENT") console.error("Notice attachment cleanup error:", error.message);
  }
};

async function categoryExists(categoryCode) {
  const result = await pool.query(
    `SELECT 1 FROM sms.notice_categories WHERE category_code = $1 AND status = 'ACTIVE'`,
    [categoryCode]
  );
  return result.rowCount > 0;
}

async function resolveInstitutionId(user) {
  if (user.institution_id) return user.institution_id;

  const result = await pool.query(`
    SELECT institution_id
    FROM sms.institutions
    WHERE status = 'ACTIVE'
    ORDER BY institution_id
    LIMIT 1
  `);
  return result.rows[0]?.institution_id || null;
}

router.get(
  "/categories",
  authenticateUser,
  requirePermission("notice.management", "view"),
  async (_req, res) => {
    try {
      const result = await pool.query(`
        SELECT category_code, category_name, category_name_bn, sort_order
        FROM sms.notice_categories
        WHERE status = 'ACTIVE'
        ORDER BY sort_order, category_name
      `);
      res.json({ success: true, data: result.rows });
    } catch (error) {
      console.error("Notice category list error:", error);
      res.status(500).json({ success: false, message: "Failed to load notice categories." });
    }
  }
);

router.post(
  "/upload",
  authenticateUser,
  requirePermission("notice.management", "create"),
  noticeUpload.single("attachment"),
  (req, res) => {
    if (!req.file) {
      return res.status(400).json({ success: false, message: "Select a PDF or image attachment." });
    }

    return res.status(201).json({
      success: true,
      message: "Attachment uploaded successfully.",
      data: {
        attachment_url: `/uploads/notices/${req.file.filename}`,
        original_name: req.file.originalname,
        mime_type: req.file.mimetype,
        size: req.file.size,
      },
    });
  }
);

router.get(
  "/",
  authenticateUser,
  requirePermission("notice.management", "view"),
  async (req, res) => {
    try {
      const params = [];
      const where = [];
      const { status, category, search } = req.query;

      if (!req.user.is_super_admin && req.user.institution_id) {
        params.push(req.user.institution_id);
        where.push(`n.institution_id = $${params.length}`);
      }

      if (status && statuses.has(String(status).toUpperCase())) {
        params.push(String(status).toUpperCase());
        where.push(`n.status = $${params.length}`);
      }

      if (category) {
        params.push(String(category).toUpperCase());
        where.push(`n.category_code = $${params.length}`);
      }

      if (search) {
        params.push(`%${String(search).trim()}%`);
        where.push(`(n.title LIKE $${params.length} OR n.title_bn LIKE $${params.length} OR n.description LIKE $${params.length})`);
      }

      const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";
      const result = await pool.query(
        `
        SELECT
          n.notice_id,
          n.institution_id,
          n.category_code,
          COALESCE(c.category_name_bn, c.category_name, n.category_code) AS category_name,
          COALESCE(c.category_name, n.category_code) AS category_name_en,
          COALESCE(NULLIF(n.title, ''), n.notice_title) AS title,
          n.title_bn,
          COALESCE(NULLIF(n.description, ''), n.notice_body) AS description,
          n.content_html,
          n.attachment_url,
          n.is_urgent,
          n.status,
          COALESCE(n.published_at, n.publish_date) AS published_at,
          COALESCE(n.expires_at, n.expire_date) AS expires_at,
          n.created_at,
          n.updated_at
        FROM sms.notices n
        LEFT JOIN sms.notice_categories c ON c.category_code = n.category_code
        ${whereSql}
        ORDER BY COALESCE(n.published_at, n.created_at) DESC, n.notice_id DESC
        `,
        params
      );
      res.json({ success: true, data: result.rows });
    } catch (error) {
      console.error("Notice list error:", error);
      res.status(500).json({ success: false, message: "Failed to load notices." });
    }
  }
);

router.get(
  "/:id",
  authenticateUser,
  requirePermission("notice.management", "view"),
  async (req, res) => {
    try {
      const result = await pool.query(
        `SELECT * FROM sms.notices WHERE notice_id = $1`,
        [req.params.id]
      );
      if (!result.rowCount) return res.status(404).json({ success: false, message: "Notice not found." });

      const notice = result.rows[0];
      if (!req.user.is_super_admin && req.user.institution_id && Number(notice.institution_id) !== Number(req.user.institution_id)) {
        return res.status(403).json({ success: false, message: "Permission denied." });
      }
      res.json({ success: true, data: notice });
    } catch (error) {
      console.error("Notice get error:", error);
      res.status(500).json({ success: false, message: "Failed to load notice." });
    }
  }
);

router.post(
  "/",
  authenticateUser,
  requirePermission("notice.management", "create"),
  async (req, res) => {
    try {
      const categoryCode = String(req.body.category_code || "GENERAL").trim().toUpperCase();
      const status = normalizeStatus(req.body.status);
      const title = String(req.body.title || "").trim();
      const contentHtml = sanitizeNoticeHtml(req.body.content_html || req.body.description);
      const description = htmlToPlainText(contentHtml);
      const institutionId = await resolveInstitutionId(req.user);

      if (!title || !description) return res.status(400).json({ success: false, message: "Title and description are required." });
      if (!institutionId) return res.status(400).json({ success: false, message: "An active institution is required before creating a notice." });
      if (!statuses.has(status)) return res.status(400).json({ success: false, message: "Invalid notice status." });
      if (!(await categoryExists(categoryCode))) return res.status(400).json({ success: false, message: "Invalid notice category." });

      const result = await pool.query(
        `
        INSERT INTO sms.notices
          (institution_id, category_code, notice_title, notice_body, audience_type, publish_date, expire_date, is_published, title, title_bn, description, content_html, attachment_url, is_urgent, status, published_at, expires_at, created_by, updated_by)
        VALUES ($1, $2, $3, $5, 'ALL', DATE(COALESCE($10, NOW())), DATE($11), IF($9 = 'PUBLISHED', TRUE, FALSE), $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $12)
        RETURNING *
        `,
        [
          institutionId,
          categoryCode,
          title,
          nullable(req.body.title_bn),
          description,
          contentHtml,
          nullable(req.body.attachment_url),
          req.body.is_urgent ? 1 : 0,
          status,
          nullable(req.body.published_at) || (status === "PUBLISHED" ? new Date() : null),
          nullable(req.body.expires_at),
          req.user.user_id,
        ]
      );
      res.status(201).json({ success: true, message: "Notice created successfully.", data: result.rows[0] });
    } catch (error) {
      console.error("Notice create error:", error);
      res.status(500).json({ success: false, message: "Failed to create notice." });
    }
  }
);

router.put(
  "/:id",
  authenticateUser,
  requirePermission("notice.management", "update"),
  async (req, res) => {
    try {
      const existing = await pool.query(`SELECT institution_id, attachment_url FROM sms.notices WHERE notice_id = $1`, [req.params.id]);
      if (!existing.rowCount) return res.status(404).json({ success: false, message: "Notice not found." });
      if (!req.user.is_super_admin && req.user.institution_id && Number(existing.rows[0].institution_id) !== Number(req.user.institution_id)) {
        return res.status(403).json({ success: false, message: "Permission denied." });
      }

      const categoryCode = String(req.body.category_code || "GENERAL").trim().toUpperCase();
      const status = normalizeStatus(req.body.status);
      const title = String(req.body.title || "").trim();
      const contentHtml = sanitizeNoticeHtml(req.body.content_html || req.body.description);
      const description = htmlToPlainText(contentHtml);
      const attachmentUrl = nullable(req.body.attachment_url);
      if (!title || !description) return res.status(400).json({ success: false, message: "Title and description are required." });
      if (!statuses.has(status)) return res.status(400).json({ success: false, message: "Invalid notice status." });
      if (!(await categoryExists(categoryCode))) return res.status(400).json({ success: false, message: "Invalid notice category." });

      const result = await pool.query(
        `
        UPDATE sms.notices
        SET category_code = $1, notice_title = $2, notice_body = $4, publish_date = DATE(COALESCE($9, NOW())),
            expire_date = DATE($10), is_published = IF($8 = 'PUBLISHED', TRUE, FALSE), title = $2, title_bn = $3,
            description = $4, content_html = $5, attachment_url = $6, is_urgent = $7, status = $8, published_at = $9,
            expires_at = $10, updated_by = $11
        WHERE notice_id = $12
        RETURNING *
        `,
        [
          categoryCode, title, nullable(req.body.title_bn), description, contentHtml,
          attachmentUrl, req.body.is_urgent ? 1 : 0, status,
          nullable(req.body.published_at) || (status === "PUBLISHED" ? new Date() : null),
          nullable(req.body.expires_at), req.user.user_id, req.params.id,
        ]
      );
      if (existing.rows[0].attachment_url && existing.rows[0].attachment_url !== attachmentUrl) {
        await deleteLocalNoticeAttachment(existing.rows[0].attachment_url);
      }
      res.json({ success: true, message: "Notice updated successfully.", data: result.rows[0] });
    } catch (error) {
      console.error("Notice update error:", error);
      res.status(500).json({ success: false, message: "Failed to update notice." });
    }
  }
);

router.delete(
  "/:id",
  authenticateUser,
  requirePermission("notice.management", "delete"),
  async (req, res) => {
    try {
      const existing = await pool.query(`SELECT institution_id, attachment_url FROM sms.notices WHERE notice_id = $1`, [req.params.id]);
      if (!existing.rowCount) return res.status(404).json({ success: false, message: "Notice not found." });
      if (!req.user.is_super_admin && req.user.institution_id && Number(existing.rows[0].institution_id) !== Number(req.user.institution_id)) {
        return res.status(403).json({ success: false, message: "Permission denied." });
      }
      await pool.query(`DELETE FROM sms.notices WHERE notice_id = $1`, [req.params.id]);
      await deleteLocalNoticeAttachment(existing.rows[0].attachment_url);
      res.json({ success: true, message: "Notice deleted successfully." });
    } catch (error) {
      console.error("Notice delete error:", error);
      res.status(500).json({ success: false, message: "Failed to delete notice." });
    }
  }
);

router.use((error, _req, res, next) => {
  if (error instanceof multer.MulterError && error.code === "LIMIT_FILE_SIZE") {
    return res.status(400).json({ success: false, message: "Attachment must be 10 MB or smaller." });
  }
  if (error?.message === "Only PDF, JPG, PNG, and WEBP files are allowed.") {
    return res.status(400).json({ success: false, message: error.message });
  }
  return next(error);
});

export default router;
