import pool from "../config/db.js";

const defaultCategories = [
  ["GENERAL", "General", "সাধারণ", 10],
  ["ADMISSION", "Admission", "ভর্তি", 20],
  ["EXAMINATION", "Examination", "পরীক্ষা", 30],
  ["ADMINISTRATION", "Administration", "প্রশাসন", 40],
];

export async function ensureNoticeSchema() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS sms.notice_categories (
      notice_category_id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
      category_code VARCHAR(40) NOT NULL UNIQUE,
      category_name VARCHAR(100) NOT NULL,
      category_name_bn VARCHAR(100) NULL,
      sort_order INT NOT NULL DEFAULT 0,
      status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS sms.notices (
      notice_id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
      institution_id BIGINT NULL,
      category_code VARCHAR(40) NOT NULL DEFAULT 'GENERAL',
      notice_title VARCHAR(255) NULL,
      notice_body TEXT NULL,
      audience_type VARCHAR(50) NOT NULL DEFAULT 'ALL',
      publish_date DATE NULL,
      expire_date DATE NULL,
      is_published TINYINT(1) NOT NULL DEFAULT 0,
      title VARCHAR(255) NOT NULL,
      title_bn VARCHAR(255) NULL,
      description TEXT NOT NULL,
      content_html TEXT NULL,
      attachment_url VARCHAR(500) NULL,
      is_urgent TINYINT(1) NOT NULL DEFAULT 0,
      status VARCHAR(20) NOT NULL DEFAULT 'DRAFT',
      published_at DATETIME NULL,
      expires_at DATETIME NULL,
      created_by BIGINT NULL,
      updated_by BIGINT NULL,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_notices_public (institution_id, status, published_at),
      INDEX idx_notices_category (category_code, status)
    )
  `);

  const noticeColumns = [
    ["category_code", "VARCHAR(40) NOT NULL DEFAULT 'GENERAL'"],
    ["notice_title", "VARCHAR(255) NULL"],
    ["notice_body", "TEXT NULL"],
    ["audience_type", "VARCHAR(50) NOT NULL DEFAULT 'ALL'"],
    ["publish_date", "DATE NULL"],
    ["expire_date", "DATE NULL"],
    ["is_published", "TINYINT(1) NOT NULL DEFAULT 0"],
    ["title", "VARCHAR(255) NULL"],
    ["title_bn", "VARCHAR(255) NULL"],
    ["description", "TEXT NULL"],
    ["content_html", "TEXT NULL"],
    ["is_urgent", "TINYINT(1) NOT NULL DEFAULT 0"],
    ["status", "VARCHAR(20) NOT NULL DEFAULT 'DRAFT'"],
    ["published_at", "DATETIME NULL"],
    ["expires_at", "DATETIME NULL"],
    ["updated_by", "BIGINT NULL"],
  ];

  for (const [column, definition] of noticeColumns) {
    const result = await pool.query(
      `
      SELECT COUNT(*) AS total
      FROM information_schema.columns
      WHERE table_schema = DATABASE() AND table_name = 'notices' AND column_name = $1
      `,
      [column]
    );
    if (Number(result.rows[0]?.total || 0) === 0) {
      await pool.query(`ALTER TABLE sms.notices ADD COLUMN ${column} ${definition}`);
    }
  }

  // Keep records created by the earlier notices module usable in the new UI.
  await pool.query(`
    UPDATE sms.notices
    SET category_code = COALESCE(NULLIF(category_code, ''), 'GENERAL'),
        title = COALESCE(NULLIF(title, ''), notice_title),
        description = COALESCE(NULLIF(description, ''), notice_body),
        published_at = COALESCE(published_at, publish_date),
        expires_at = COALESCE(expires_at, expire_date),
        status = CASE WHEN is_published = TRUE AND status = 'DRAFT' THEN 'PUBLISHED' ELSE status END
  `);

  for (const category of defaultCategories) {
    await pool.query(
      `
      INSERT INTO sms.notice_categories
        (category_code, category_name, category_name_bn, sort_order, status)
      VALUES ($1, $2, $3, $4, 'ACTIVE')
      ON DUPLICATE KEY UPDATE
        category_name = VALUES(category_name),
        category_name_bn = VALUES(category_name_bn),
        sort_order = VALUES(sort_order),
        status = 'ACTIVE'
      `,
      category
    );
  }
}
