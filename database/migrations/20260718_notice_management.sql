CREATE TABLE IF NOT EXISTS notice_categories (
  notice_category_id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  category_code VARCHAR(40) NOT NULL UNIQUE,
  category_name VARCHAR(100) NOT NULL,
  category_name_bn VARCHAR(100) NULL,
  sort_order INT NOT NULL DEFAULT 0,
  status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS notices (
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
);

INSERT INTO notice_categories (category_code, category_name, category_name_bn, sort_order, status)
VALUES
  ('GENERAL', 'General', 'সাধারণ', 10, 'ACTIVE'),
  ('ADMISSION', 'Admission', 'ভর্তি', 20, 'ACTIVE'),
  ('EXAMINATION', 'Examination', 'পরীক্ষা', 30, 'ACTIVE'),
  ('ADMINISTRATION', 'Administration', 'প্রশাসন', 40, 'ACTIVE')
ON DUPLICATE KEY UPDATE
  category_name = VALUES(category_name),
  category_name_bn = VALUES(category_name_bn),
  sort_order = VALUES(sort_order),
  status = 'ACTIVE';
