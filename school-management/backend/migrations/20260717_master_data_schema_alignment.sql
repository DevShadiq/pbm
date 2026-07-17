-- Aligns older MySQL databases with the current Master Data API and forms.

CREATE TABLE IF NOT EXISTS academic_levels (
  level_id BIGINT AUTO_INCREMENT PRIMARY KEY,
  institution_id BIGINT NULL,
  level_code VARCHAR(30) NOT NULL,
  level_name VARCHAR(100) NOT NULL,
  level_name_bn VARCHAR(100) NULL,
  sort_order INT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT uk_academic_levels_code UNIQUE (institution_id, level_code),
  CONSTRAINT fk_academic_levels_institution
    FOREIGN KEY (institution_id) REFERENCES institutions(institution_id) ON DELETE CASCADE
);

ALTER TABLE class_levels
  ADD COLUMN level_id BIGINT NULL AFTER institution_id,
  ADD COLUMN class_name_bn VARCHAR(100) NULL AFTER class_name,
  ADD CONSTRAINT fk_class_levels_academic_level
    FOREIGN KEY (level_id) REFERENCES academic_levels(level_id) ON DELETE SET NULL;

ALTER TABLE `groups`
  ADD COLUMN group_name_bn VARCHAR(100) NULL AFTER group_name;

ALTER TABLE sections
  ADD COLUMN section_name_bn VARCHAR(50) NULL AFTER section_name;

ALTER TABLE mediums
  ADD COLUMN medium_name_bn VARCHAR(80) NULL AFTER medium_name;

ALTER TABLE shifts
  ADD COLUMN shift_name_bn VARCHAR(80) NULL AFTER shift_name;
