-- Exam/subject workflow alignment for MySQL 8.x.
--
-- This migration is intentionally re-runnable.  Column and index DDL is
-- guarded through information_schema because MySQL 8 releases do not all
-- support IF NOT EXISTS on every ALTER TABLE operation.
--
-- Run with the application database selected (normally `sms`).  MySQL DDL
-- performs implicit commits, so take a normal database backup before applying
-- this migration to production.

SET @exam_workflow_schema := DATABASE();

/* -------------------------------------------------------------------------
   Class subject assignment and component defaults
   ------------------------------------------------------------------------- */

SET @add_cs_assignment_type := NOT EXISTS (
  SELECT 1 FROM information_schema.columns
  WHERE table_schema = @exam_workflow_schema
    AND table_name = 'class_subjects'
    AND column_name = 'assignment_type'
);
SET @exam_workflow_ddl := IF(
  @add_cs_assignment_type,
  'ALTER TABLE `class_subjects` ADD COLUMN `assignment_type` VARCHAR(30) NOT NULL DEFAULT ''MANDATORY'' AFTER `subject_id`',
  'SELECT 1'
);
PREPARE exam_workflow_stmt FROM @exam_workflow_ddl;
EXECUTE exam_workflow_stmt;
DEALLOCATE PREPARE exam_workflow_stmt;

SET @add_cs_written_marks := NOT EXISTS (
  SELECT 1 FROM information_schema.columns
  WHERE table_schema = @exam_workflow_schema
    AND table_name = 'class_subjects'
    AND column_name = 'written_marks'
);
SET @exam_workflow_ddl := IF(
  @add_cs_written_marks,
  'ALTER TABLE `class_subjects` ADD COLUMN `written_marks` DECIMAL(8,2) NOT NULL DEFAULT 100.00 AFTER `assignment_type`',
  'SELECT 1'
);
PREPARE exam_workflow_stmt FROM @exam_workflow_ddl;
EXECUTE exam_workflow_stmt;
DEALLOCATE PREPARE exam_workflow_stmt;

SET @add_cs_written_pass_marks := NOT EXISTS (
  SELECT 1 FROM information_schema.columns
  WHERE table_schema = @exam_workflow_schema
    AND table_name = 'class_subjects'
    AND column_name = 'written_pass_marks'
);
SET @exam_workflow_ddl := IF(
  @add_cs_written_pass_marks,
  'ALTER TABLE `class_subjects` ADD COLUMN `written_pass_marks` DECIMAL(8,2) NOT NULL DEFAULT 33.00 AFTER `written_marks`',
  'SELECT 1'
);
PREPARE exam_workflow_stmt FROM @exam_workflow_ddl;
EXECUTE exam_workflow_stmt;
DEALLOCATE PREPARE exam_workflow_stmt;

SET @add_cs_mcq_marks := NOT EXISTS (
  SELECT 1 FROM information_schema.columns
  WHERE table_schema = @exam_workflow_schema
    AND table_name = 'class_subjects'
    AND column_name = 'mcq_marks'
);
SET @exam_workflow_ddl := IF(
  @add_cs_mcq_marks,
  'ALTER TABLE `class_subjects` ADD COLUMN `mcq_marks` DECIMAL(8,2) NOT NULL DEFAULT 0.00 AFTER `written_pass_marks`',
  'SELECT 1'
);
PREPARE exam_workflow_stmt FROM @exam_workflow_ddl;
EXECUTE exam_workflow_stmt;
DEALLOCATE PREPARE exam_workflow_stmt;

SET @add_cs_mcq_pass_marks := NOT EXISTS (
  SELECT 1 FROM information_schema.columns
  WHERE table_schema = @exam_workflow_schema
    AND table_name = 'class_subjects'
    AND column_name = 'mcq_pass_marks'
);
SET @exam_workflow_ddl := IF(
  @add_cs_mcq_pass_marks,
  'ALTER TABLE `class_subjects` ADD COLUMN `mcq_pass_marks` DECIMAL(8,2) NOT NULL DEFAULT 0.00 AFTER `mcq_marks`',
  'SELECT 1'
);
PREPARE exam_workflow_stmt FROM @exam_workflow_ddl;
EXECUTE exam_workflow_stmt;
DEALLOCATE PREPARE exam_workflow_stmt;

SET @add_cs_practical_marks := NOT EXISTS (
  SELECT 1 FROM information_schema.columns
  WHERE table_schema = @exam_workflow_schema
    AND table_name = 'class_subjects'
    AND column_name = 'practical_marks'
);
SET @exam_workflow_ddl := IF(
  @add_cs_practical_marks,
  'ALTER TABLE `class_subjects` ADD COLUMN `practical_marks` DECIMAL(8,2) NOT NULL DEFAULT 0.00 AFTER `mcq_pass_marks`',
  'SELECT 1'
);
PREPARE exam_workflow_stmt FROM @exam_workflow_ddl;
EXECUTE exam_workflow_stmt;
DEALLOCATE PREPARE exam_workflow_stmt;

SET @add_cs_practical_pass_marks := NOT EXISTS (
  SELECT 1 FROM information_schema.columns
  WHERE table_schema = @exam_workflow_schema
    AND table_name = 'class_subjects'
    AND column_name = 'practical_pass_marks'
);
SET @exam_workflow_ddl := IF(
  @add_cs_practical_pass_marks,
  'ALTER TABLE `class_subjects` ADD COLUMN `practical_pass_marks` DECIMAL(8,2) NOT NULL DEFAULT 0.00 AFTER `practical_marks`',
  'SELECT 1'
);
PREPARE exam_workflow_stmt FROM @exam_workflow_ddl;
EXECUTE exam_workflow_stmt;
DEALLOCATE PREPARE exam_workflow_stmt;

SET @add_cs_viva_marks := NOT EXISTS (
  SELECT 1 FROM information_schema.columns
  WHERE table_schema = @exam_workflow_schema
    AND table_name = 'class_subjects'
    AND column_name = 'viva_marks'
);
SET @exam_workflow_ddl := IF(
  @add_cs_viva_marks,
  'ALTER TABLE `class_subjects` ADD COLUMN `viva_marks` DECIMAL(8,2) NOT NULL DEFAULT 0.00 AFTER `practical_pass_marks`',
  'SELECT 1'
);
PREPARE exam_workflow_stmt FROM @exam_workflow_ddl;
EXECUTE exam_workflow_stmt;
DEALLOCATE PREPARE exam_workflow_stmt;

SET @add_cs_viva_pass_marks := NOT EXISTS (
  SELECT 1 FROM information_schema.columns
  WHERE table_schema = @exam_workflow_schema
    AND table_name = 'class_subjects'
    AND column_name = 'viva_pass_marks'
);
SET @exam_workflow_ddl := IF(
  @add_cs_viva_pass_marks,
  'ALTER TABLE `class_subjects` ADD COLUMN `viva_pass_marks` DECIMAL(8,2) NOT NULL DEFAULT 0.00 AFTER `viva_marks`',
  'SELECT 1'
);
PREPARE exam_workflow_stmt FROM @exam_workflow_ddl;
EXECUTE exam_workflow_stmt;
DEALLOCATE PREPARE exam_workflow_stmt;

SET @add_cs_is_locked := NOT EXISTS (
  SELECT 1 FROM information_schema.columns
  WHERE table_schema = @exam_workflow_schema
    AND table_name = 'class_subjects'
    AND column_name = 'is_locked'
);
SET @exam_workflow_ddl := IF(
  @add_cs_is_locked,
  'ALTER TABLE `class_subjects` ADD COLUMN `is_locked` TINYINT(1) NOT NULL DEFAULT 0 AFTER `viva_pass_marks`',
  'SELECT 1'
);
PREPARE exam_workflow_stmt FROM @exam_workflow_ddl;
EXECUTE exam_workflow_stmt;
DEALLOCATE PREPARE exam_workflow_stmt;

-- Only columns added by this run are backfilled.  A later re-run therefore
-- never overwrites marks or assignment types customized by an institution.
UPDATE class_subjects cs
JOIN subjects s ON s.subject_id = cs.subject_id
SET cs.assignment_type = CASE
  WHEN UPPER(COALESCE(s.subject_type, '')) IN ('FOURTH_SUBJECT', 'FOURTH', '4TH_SUBJECT')
    THEN 'FOURTH_SUBJECT'
  WHEN UPPER(COALESCE(s.subject_type, '')) = 'OPTIONAL' OR cs.is_mandatory = 0
    THEN 'OPTIONAL'
  ELSE 'MANDATORY'
END
WHERE @add_cs_assignment_type = 1;

UPDATE class_subjects
SET is_mandatory = CASE WHEN assignment_type = 'MANDATORY' THEN 1 ELSE 0 END
WHERE @add_cs_assignment_type = 1;

SET @subjects_has_written_marks := EXISTS (
  SELECT 1 FROM information_schema.columns
  WHERE table_schema = @exam_workflow_schema
    AND table_name = 'subjects'
    AND column_name = 'written_marks'
);
SET @exam_workflow_ddl := CASE
  WHEN @add_cs_written_marks = 0 THEN 'SELECT 1'
  WHEN @subjects_has_written_marks = 1 THEN
    'UPDATE `class_subjects` cs JOIN `subjects` s ON s.subject_id = cs.subject_id SET cs.written_marks = GREATEST(COALESCE(s.written_marks, s.full_marks, 100.00), 0.00)'
  ELSE
    'UPDATE `class_subjects` cs JOIN `subjects` s ON s.subject_id = cs.subject_id SET cs.written_marks = GREATEST(COALESCE(s.full_marks, 100.00), 0.00)'
END;
PREPARE exam_workflow_stmt FROM @exam_workflow_ddl;
EXECUTE exam_workflow_stmt;
DEALLOCATE PREPARE exam_workflow_stmt;

UPDATE class_subjects cs
JOIN subjects s ON s.subject_id = cs.subject_id
SET cs.written_pass_marks = CASE
  WHEN cs.written_marks > 0
    THEN LEAST(cs.written_marks, GREATEST(COALESCE(s.pass_marks, 0.00), 0.00))
  ELSE 0.00
END
WHERE @add_cs_written_pass_marks = 1;

SET @subjects_has_mcq_marks := EXISTS (
  SELECT 1 FROM information_schema.columns
  WHERE table_schema = @exam_workflow_schema
    AND table_name = 'subjects'
    AND column_name = 'mcq_marks'
);
SET @exam_workflow_ddl := IF(
  @add_cs_mcq_marks = 1 AND @subjects_has_mcq_marks = 1,
  'UPDATE `class_subjects` cs JOIN `subjects` s ON s.subject_id = cs.subject_id SET cs.mcq_marks = GREATEST(COALESCE(s.mcq_marks, 0.00), 0.00)',
  'SELECT 1'
);
PREPARE exam_workflow_stmt FROM @exam_workflow_ddl;
EXECUTE exam_workflow_stmt;
DEALLOCATE PREPARE exam_workflow_stmt;

SET @subjects_has_practical_marks := EXISTS (
  SELECT 1 FROM information_schema.columns
  WHERE table_schema = @exam_workflow_schema
    AND table_name = 'subjects'
    AND column_name = 'practical_marks'
);
SET @exam_workflow_ddl := IF(
  @add_cs_practical_marks = 1 AND @subjects_has_practical_marks = 1,
  'UPDATE `class_subjects` cs JOIN `subjects` s ON s.subject_id = cs.subject_id SET cs.practical_marks = GREATEST(COALESCE(s.practical_marks, 0.00), 0.00)',
  'SELECT 1'
);
PREPARE exam_workflow_stmt FROM @exam_workflow_ddl;
EXECUTE exam_workflow_stmt;
DEALLOCATE PREPARE exam_workflow_stmt;

SET @subjects_has_viva_marks := EXISTS (
  SELECT 1 FROM information_schema.columns
  WHERE table_schema = @exam_workflow_schema
    AND table_name = 'subjects'
    AND column_name = 'viva_marks'
);
SET @exam_workflow_ddl := IF(
  @add_cs_viva_marks = 1 AND @subjects_has_viva_marks = 1,
  'UPDATE `class_subjects` cs JOIN `subjects` s ON s.subject_id = cs.subject_id SET cs.viva_marks = GREATEST(COALESCE(s.viva_marks, 0.00), 0.00)',
  'SELECT 1'
);
PREPARE exam_workflow_stmt FROM @exam_workflow_ddl;
EXECUTE exam_workflow_stmt;
DEALLOCATE PREPARE exam_workflow_stmt;

/* -------------------------------------------------------------------------
   Institution-level subject setup lock
   ------------------------------------------------------------------------- */

CREATE TABLE IF NOT EXISTS institution_subject_settings (
  setting_id BIGINT NOT NULL AUTO_INCREMENT,
  institution_id BIGINT NOT NULL,
  is_locked TINYINT(1) NOT NULL DEFAULT 0,
  locked_by BIGINT NULL,
  locked_at DATETIME NULL,
  updated_by BIGINT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (setting_id),
  UNIQUE KEY uk_institution_subject_settings (institution_id),
  CONSTRAINT fk_institution_subject_settings_institution
    FOREIGN KEY (institution_id) REFERENCES institutions(institution_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

INSERT INTO institution_subject_settings (institution_id, is_locked)
SELECT i.institution_id, 0
FROM institutions i
ON DUPLICATE KEY UPDATE institution_id = institution_subject_settings.institution_id;

/* -------------------------------------------------------------------------
   Reusable mark components and per-exam-subject allocations
   ------------------------------------------------------------------------- */

CREATE TABLE IF NOT EXISTS mark_components (
  component_id BIGINT NOT NULL AUTO_INCREMENT,
  institution_id BIGINT NOT NULL,
  component_code VARCHAR(30) NOT NULL,
  component_name VARCHAR(100) NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
  PRIMARY KEY (component_id),
  UNIQUE KEY uk_mark_components (institution_id, component_code),
  CONSTRAINT fk_mark_components_institution
    FOREIGN KEY (institution_id) REFERENCES institutions(institution_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

SET @mark_components_named_columns := (
  SELECT GROUP_CONCAT(column_name ORDER BY seq_in_index SEPARATOR ',')
  FROM information_schema.statistics
  WHERE table_schema = @exam_workflow_schema
    AND table_name = 'mark_components'
    AND index_name = 'uk_mark_components'
    AND non_unique = 0
);
SET @exam_workflow_ddl := IF(
  @mark_components_named_columns IS NOT NULL
    AND @mark_components_named_columns <> 'institution_id,component_code',
  'ALTER TABLE `mark_components` DROP INDEX `uk_mark_components`',
  'SELECT 1'
);
PREPARE exam_workflow_stmt FROM @exam_workflow_ddl;
EXECUTE exam_workflow_stmt;
DEALLOCATE PREPARE exam_workflow_stmt;

SET @has_mark_components_unique := EXISTS (
  SELECT 1
  FROM (
    SELECT index_name,
           non_unique,
           GROUP_CONCAT(column_name ORDER BY seq_in_index SEPARATOR ',') AS indexed_columns
    FROM information_schema.statistics
    WHERE table_schema = @exam_workflow_schema
      AND table_name = 'mark_components'
    GROUP BY index_name, non_unique
  ) indexes_found
  WHERE indexes_found.non_unique = 0
    AND indexes_found.indexed_columns = 'institution_id,component_code'
);
SET @exam_workflow_ddl := IF(
  @has_mark_components_unique,
  'SELECT 1',
  'ALTER TABLE `mark_components` ADD UNIQUE INDEX `uk_mark_components` (`institution_id`, `component_code`)'
);
PREPARE exam_workflow_stmt FROM @exam_workflow_ddl;
EXECUTE exam_workflow_stmt;
DEALLOCATE PREPARE exam_workflow_stmt;

INSERT INTO mark_components (
  institution_id,
  component_code,
  component_name,
  status
)
SELECT
  i.institution_id,
  component_seed.component_code,
  component_seed.component_name,
  'ACTIVE'
FROM institutions i
CROSS JOIN (
  SELECT 'WRITTEN' AS component_code, 'Written' AS component_name
  UNION ALL SELECT 'MCQ', 'MCQ'
  UNION ALL SELECT 'PRACTICAL', 'Practical'
  UNION ALL SELECT 'VIVA', 'Viva'
) component_seed
WHERE 1 = 1
ON DUPLICATE KEY UPDATE component_name = mark_components.component_name;

CREATE TABLE IF NOT EXISTS exam_subject_components (
  exam_subject_component_id BIGINT NOT NULL AUTO_INCREMENT,
  exam_subject_id BIGINT NOT NULL,
  component_id BIGINT NOT NULL,
  full_marks DECIMAL(8,2) NOT NULL,
  pass_marks DECIMAL(8,2) NOT NULL DEFAULT 0.00,
  sort_order INT NOT NULL DEFAULT 0,
  PRIMARY KEY (exam_subject_component_id),
  UNIQUE KEY uk_exam_subject_components (exam_subject_id, component_id),
  CONSTRAINT fk_exam_subject_components_exam_subject
    FOREIGN KEY (exam_subject_id) REFERENCES exam_subjects(exam_subject_id) ON DELETE CASCADE,
  CONSTRAINT fk_exam_subject_components_component
    FOREIGN KEY (component_id) REFERENCES mark_components(component_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

SET @exam_subject_components_named_columns := (
  SELECT GROUP_CONCAT(column_name ORDER BY seq_in_index SEPARATOR ',')
  FROM information_schema.statistics
  WHERE table_schema = @exam_workflow_schema
    AND table_name = 'exam_subject_components'
    AND index_name = 'uk_exam_subject_components'
    AND non_unique = 0
);
SET @exam_workflow_ddl := IF(
  @exam_subject_components_named_columns IS NOT NULL
    AND @exam_subject_components_named_columns <> 'exam_subject_id,component_id',
  'ALTER TABLE `exam_subject_components` DROP INDEX `uk_exam_subject_components`',
  'SELECT 1'
);
PREPARE exam_workflow_stmt FROM @exam_workflow_ddl;
EXECUTE exam_workflow_stmt;
DEALLOCATE PREPARE exam_workflow_stmt;

SET @has_exam_subject_components_unique := EXISTS (
  SELECT 1
  FROM (
    SELECT index_name,
           non_unique,
           GROUP_CONCAT(column_name ORDER BY seq_in_index SEPARATOR ',') AS indexed_columns
    FROM information_schema.statistics
    WHERE table_schema = @exam_workflow_schema
      AND table_name = 'exam_subject_components'
    GROUP BY index_name, non_unique
  ) indexes_found
  WHERE indexes_found.non_unique = 0
    AND indexes_found.indexed_columns = 'exam_subject_id,component_id'
);
SET @exam_workflow_ddl := IF(
  @has_exam_subject_components_unique,
  'SELECT 1',
  'ALTER TABLE `exam_subject_components` ADD UNIQUE INDEX `uk_exam_subject_components` (`exam_subject_id`, `component_id`)'
);
PREPARE exam_workflow_stmt FROM @exam_workflow_ddl;
EXECUTE exam_workflow_stmt;
DEALLOCATE PREPARE exam_workflow_stmt;

-- Populate only exam subjects that have no component allocation at all.  This
-- protects every existing/manual distribution from being changed on re-run.
INSERT INTO exam_subject_components (
  exam_subject_id,
  component_id,
  full_marks,
  pass_marks,
  sort_order
)
SELECT
  component_defaults.exam_subject_id,
  component_defaults.component_id,
  component_defaults.full_marks,
  LEAST(component_defaults.full_marks, component_defaults.pass_marks),
  component_defaults.sort_order
FROM (
  SELECT
    es.exam_subject_id,
    mc.component_id,
    component_seed.sort_order,
    CASE component_seed.component_code
      WHEN 'WRITTEN' THEN COALESCE(
        (
          SELECT cs.written_marks
          FROM class_subjects cs
          WHERE cs.institution_id = b.institution_id
            AND cs.class_id = e.class_id
            AND cs.subject_id = es.subject_id
            AND cs.status = 'ACTIVE'
          ORDER BY (cs.group_id IS NULL) DESC, cs.class_subject_id
          LIMIT 1
        ),
        es.full_marks
      )
      WHEN 'MCQ' THEN COALESCE(
        (
          SELECT cs.mcq_marks
          FROM class_subjects cs
          WHERE cs.institution_id = b.institution_id
            AND cs.class_id = e.class_id
            AND cs.subject_id = es.subject_id
            AND cs.status = 'ACTIVE'
          ORDER BY (cs.group_id IS NULL) DESC, cs.class_subject_id
          LIMIT 1
        ),
        0.00
      )
      WHEN 'PRACTICAL' THEN COALESCE(
        (
          SELECT cs.practical_marks
          FROM class_subjects cs
          WHERE cs.institution_id = b.institution_id
            AND cs.class_id = e.class_id
            AND cs.subject_id = es.subject_id
            AND cs.status = 'ACTIVE'
          ORDER BY (cs.group_id IS NULL) DESC, cs.class_subject_id
          LIMIT 1
        ),
        0.00
      )
      WHEN 'VIVA' THEN COALESCE(
        (
          SELECT cs.viva_marks
          FROM class_subjects cs
          WHERE cs.institution_id = b.institution_id
            AND cs.class_id = e.class_id
            AND cs.subject_id = es.subject_id
            AND cs.status = 'ACTIVE'
          ORDER BY (cs.group_id IS NULL) DESC, cs.class_subject_id
          LIMIT 1
        ),
        0.00
      )
    END AS full_marks,
    CASE component_seed.component_code
      WHEN 'WRITTEN' THEN COALESCE(
        (
          SELECT cs.written_pass_marks
          FROM class_subjects cs
          WHERE cs.institution_id = b.institution_id
            AND cs.class_id = e.class_id
            AND cs.subject_id = es.subject_id
            AND cs.status = 'ACTIVE'
          ORDER BY (cs.group_id IS NULL) DESC, cs.class_subject_id
          LIMIT 1
        ),
        es.pass_marks
      )
      WHEN 'MCQ' THEN COALESCE(
        (
          SELECT cs.mcq_pass_marks
          FROM class_subjects cs
          WHERE cs.institution_id = b.institution_id
            AND cs.class_id = e.class_id
            AND cs.subject_id = es.subject_id
            AND cs.status = 'ACTIVE'
          ORDER BY (cs.group_id IS NULL) DESC, cs.class_subject_id
          LIMIT 1
        ),
        0.00
      )
      WHEN 'PRACTICAL' THEN COALESCE(
        (
          SELECT cs.practical_pass_marks
          FROM class_subjects cs
          WHERE cs.institution_id = b.institution_id
            AND cs.class_id = e.class_id
            AND cs.subject_id = es.subject_id
            AND cs.status = 'ACTIVE'
          ORDER BY (cs.group_id IS NULL) DESC, cs.class_subject_id
          LIMIT 1
        ),
        0.00
      )
      WHEN 'VIVA' THEN COALESCE(
        (
          SELECT cs.viva_pass_marks
          FROM class_subjects cs
          WHERE cs.institution_id = b.institution_id
            AND cs.class_id = e.class_id
            AND cs.subject_id = es.subject_id
            AND cs.status = 'ACTIVE'
          ORDER BY (cs.group_id IS NULL) DESC, cs.class_subject_id
          LIMIT 1
        ),
        0.00
      )
    END AS pass_marks
  FROM exam_subjects es
  JOIN exams e ON e.exam_id = es.exam_id
  JOIN branches b ON b.branch_id = e.branch_id
  CROSS JOIN (
    SELECT 'WRITTEN' AS component_code, 10 AS sort_order
    UNION ALL SELECT 'MCQ', 20
    UNION ALL SELECT 'PRACTICAL', 30
    UNION ALL SELECT 'VIVA', 40
  ) component_seed
  JOIN mark_components mc
    ON mc.institution_id = b.institution_id
   AND mc.component_code = component_seed.component_code
  WHERE NOT EXISTS (
    SELECT 1
    FROM exam_subject_components existing_component
    WHERE existing_component.exam_subject_id = es.exam_subject_id
  )
    AND NOT EXISTS (
      SELECT 1
      FROM exam_marks historical_mark
      WHERE historical_mark.exam_subject_id = es.exam_subject_id
    )
) component_defaults
WHERE component_defaults.full_marks > 0.00;

/* -------------------------------------------------------------------------
   Legacy/current exam_marks compatibility
   ------------------------------------------------------------------------- */

SET @add_exam_marks_exam_id := NOT EXISTS (
  SELECT 1 FROM information_schema.columns
  WHERE table_schema = @exam_workflow_schema
    AND table_name = 'exam_marks'
    AND column_name = 'exam_id'
);
SET @exam_workflow_ddl := IF(
  @add_exam_marks_exam_id,
  'ALTER TABLE `exam_marks` ADD COLUMN `exam_id` BIGINT NULL AFTER `mark_id`',
  'SELECT 1'
);
PREPARE exam_workflow_stmt FROM @exam_workflow_ddl;
EXECUTE exam_workflow_stmt;
DEALLOCATE PREPARE exam_workflow_stmt;

SET @add_exam_marks_component_id := NOT EXISTS (
  SELECT 1 FROM information_schema.columns
  WHERE table_schema = @exam_workflow_schema
    AND table_name = 'exam_marks'
    AND column_name = 'component_id'
);
SET @exam_workflow_ddl := IF(
  @add_exam_marks_component_id,
  'ALTER TABLE `exam_marks` ADD COLUMN `component_id` BIGINT NULL AFTER `student_id`',
  'SELECT 1'
);
PREPARE exam_workflow_stmt FROM @exam_workflow_ddl;
EXECUTE exam_workflow_stmt;
DEALLOCATE PREPARE exam_workflow_stmt;

UPDATE exam_marks em
JOIN exam_subjects es ON es.exam_subject_id = em.exam_subject_id
SET em.exam_id = es.exam_id
WHERE em.exam_id IS NULL;

-- A legacy total mark is mapped only when the exam subject has exactly one
-- configured component.  With two or more components there is no lossless way
-- to infer whether that historical value was Written, MCQ, Practical or Viva.
UPDATE exam_marks em
JOIN (
  SELECT exam_subject_id, MIN(component_id) AS component_id
  FROM exam_subject_components
  GROUP BY exam_subject_id
  HAVING COUNT(*) = 1
) one_component ON one_component.exam_subject_id = em.exam_subject_id
SET em.component_id = one_component.component_id
WHERE em.component_id IS NULL;

SET @legacy_exam_mark_index_columns := (
  SELECT GROUP_CONCAT(column_name ORDER BY seq_in_index SEPARATOR ',')
  FROM information_schema.statistics
  WHERE table_schema = @exam_workflow_schema
    AND table_name = 'exam_marks'
    AND index_name = 'uk_exam_mark'
    AND non_unique = 0
);
SET @exam_workflow_ddl := IF(
  @legacy_exam_mark_index_columns = 'exam_subject_id,student_id',
  'ALTER TABLE `exam_marks` DROP INDEX `uk_exam_mark`',
  'SELECT 1'
);
PREPARE exam_workflow_stmt FROM @exam_workflow_ddl;
EXECUTE exam_workflow_stmt;
DEALLOCATE PREPARE exam_workflow_stmt;

SET @current_exam_marks_index_columns := (
  SELECT GROUP_CONCAT(column_name ORDER BY seq_in_index SEPARATOR ',')
  FROM information_schema.statistics
  WHERE table_schema = @exam_workflow_schema
    AND table_name = 'exam_marks'
    AND index_name = 'uk_exam_marks'
    AND non_unique = 0
);
SET @exam_workflow_ddl := IF(
  @current_exam_marks_index_columns IS NOT NULL
    AND @current_exam_marks_index_columns <> 'exam_subject_id,student_id,component_id',
  'ALTER TABLE `exam_marks` DROP INDEX `uk_exam_marks`',
  'SELECT 1'
);
PREPARE exam_workflow_stmt FROM @exam_workflow_ddl;
EXECUTE exam_workflow_stmt;
DEALLOCATE PREPARE exam_workflow_stmt;

SET @has_exam_marks_component_unique := EXISTS (
  SELECT 1
  FROM (
    SELECT index_name,
           non_unique,
           GROUP_CONCAT(column_name ORDER BY seq_in_index SEPARATOR ',') AS indexed_columns
    FROM information_schema.statistics
    WHERE table_schema = @exam_workflow_schema
      AND table_name = 'exam_marks'
    GROUP BY index_name, non_unique
  ) indexes_found
  WHERE indexes_found.non_unique = 0
    AND indexes_found.indexed_columns = 'exam_subject_id,student_id,component_id'
);
SET @exam_workflow_ddl := IF(
  @has_exam_marks_component_unique,
  'SELECT 1',
  'ALTER TABLE `exam_marks` ADD UNIQUE INDEX `uk_exam_marks` (`exam_subject_id`, `student_id`, `component_id`)'
);
PREPARE exam_workflow_stmt FROM @exam_workflow_ddl;
EXECUTE exam_workflow_stmt;
DEALLOCATE PREPARE exam_workflow_stmt;

/* -------------------------------------------------------------------------
   Exam fee and candidate waiver state
   ------------------------------------------------------------------------- */

SET @add_exams_fee_amount := NOT EXISTS (
  SELECT 1 FROM information_schema.columns
  WHERE table_schema = @exam_workflow_schema
    AND table_name = 'exams'
    AND column_name = 'exam_fee_amount'
);
SET @exam_workflow_ddl := IF(
  @add_exams_fee_amount,
  'ALTER TABLE `exams` ADD COLUMN `exam_fee_amount` DECIMAL(12,2) NOT NULL DEFAULT 0.00 AFTER `result_publish_date`',
  'SELECT 1'
);
PREPARE exam_workflow_stmt FROM @exam_workflow_ddl;
EXECUTE exam_workflow_stmt;
DEALLOCATE PREPARE exam_workflow_stmt;

SET @add_exams_fee_required := NOT EXISTS (
  SELECT 1 FROM information_schema.columns
  WHERE table_schema = @exam_workflow_schema
    AND table_name = 'exams'
    AND column_name = 'fee_required'
);
SET @exam_workflow_ddl := IF(
  @add_exams_fee_required,
  'ALTER TABLE `exams` ADD COLUMN `fee_required` TINYINT(1) NOT NULL DEFAULT 0 AFTER `exam_fee_amount`',
  'SELECT 1'
);
PREPARE exam_workflow_stmt FROM @exam_workflow_ddl;
EXECUTE exam_workflow_stmt;
DEALLOCATE PREPARE exam_workflow_stmt;

UPDATE exams
SET fee_required = CASE WHEN exam_fee_amount > 0.00 THEN 1 ELSE 0 END
WHERE @add_exams_fee_required = 1;

SET @add_candidates_fee_status := NOT EXISTS (
  SELECT 1 FROM information_schema.columns
  WHERE table_schema = @exam_workflow_schema
    AND table_name = 'exam_candidates'
    AND column_name = 'fee_status'
);
SET @exam_workflow_ddl := IF(
  @add_candidates_fee_status,
  'ALTER TABLE `exam_candidates` ADD COLUMN `fee_status` VARCHAR(20) NOT NULL DEFAULT ''DUE'' AFTER `hold_reason`',
  'SELECT 1'
);
PREPARE exam_workflow_stmt FROM @exam_workflow_ddl;
EXECUTE exam_workflow_stmt;
DEALLOCATE PREPARE exam_workflow_stmt;

SET @add_candidates_fee_waived := NOT EXISTS (
  SELECT 1 FROM information_schema.columns
  WHERE table_schema = @exam_workflow_schema
    AND table_name = 'exam_candidates'
    AND column_name = 'fee_waived'
);
SET @exam_workflow_ddl := IF(
  @add_candidates_fee_waived,
  'ALTER TABLE `exam_candidates` ADD COLUMN `fee_waived` TINYINT(1) NOT NULL DEFAULT 0 AFTER `fee_status`',
  'SELECT 1'
);
PREPARE exam_workflow_stmt FROM @exam_workflow_ddl;
EXECUTE exam_workflow_stmt;
DEALLOCATE PREPARE exam_workflow_stmt;

UPDATE exam_candidates
SET fee_waived = CASE WHEN UPPER(COALESCE(fee_status, '')) = 'WAIVED' THEN 1 ELSE 0 END
WHERE @add_candidates_fee_waived = 1
  AND @add_candidates_fee_status = 0;

UPDATE exam_candidates ec
JOIN exams e ON e.exam_id = ec.exam_id
SET ec.fee_status = CASE
  WHEN ec.fee_waived = 1 THEN 'WAIVED'
  WHEN e.fee_required = 1 THEN 'DUE'
  ELSE 'WAIVED'
END
WHERE @add_candidates_fee_status = 1;

UPDATE exam_candidates
SET fee_waived = CASE WHEN UPPER(COALESCE(fee_status, '')) = 'WAIVED' THEN 1 ELSE 0 END
WHERE @add_candidates_fee_waived = 1;

/* -------------------------------------------------------------------------
   Reusable document designs and immutable issued-design snapshots
   ------------------------------------------------------------------------- */

-- `issued_documents` was introduced by the application's startup schema and
-- is absent from some older canonical dumps.  Create it here so this migration
-- can also be applied before the upgraded application is started.
CREATE TABLE IF NOT EXISTS issued_documents (
  issued_document_id BIGINT NOT NULL AUTO_INCREMENT,
  document_type VARCHAR(30) NOT NULL,
  student_id BIGINT NOT NULL,
  exam_id BIGINT NULL,
  document_no VARCHAR(60) NOT NULL,
  issue_date DATE NOT NULL,
  verification_code VARCHAR(80) NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'ISSUED',
  issued_by BIGINT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (issued_document_id),
  UNIQUE KEY uk_document_no (document_no),
  UNIQUE KEY uk_verification_code (verification_code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS document_templates (
  template_id BIGINT NOT NULL AUTO_INCREMENT,
  institution_id BIGINT NOT NULL,
  document_type VARCHAR(30) NOT NULL,
  template_name VARCHAR(120) NOT NULL,
  design_json JSON NULL,
  is_default TINYINT(1) NOT NULL DEFAULT 0,
  status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
  created_by BIGINT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (template_id),
  UNIQUE KEY uk_document_template (institution_id, document_type, template_name),
  KEY idx_document_templates_active (institution_id, document_type, status, is_default),
  CONSTRAINT fk_document_templates_institution
    FOREIGN KEY (institution_id) REFERENCES institutions(institution_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

INSERT INTO document_templates (
  institution_id,
  document_type,
  template_name,
  design_json,
  is_default,
  status
)
SELECT
  i.institution_id,
  'MARKSHEET',
  'Default Marksheet',
  JSON_OBJECT(
    'version', 2,
    'paper', 'A4',
    'accent_color', '#4f46e5',
    'layout_style', 'clean',
    'show_logo', CAST('true' AS JSON),
    'show_assignment', CAST('true' AS JSON),
    'show_merit', CAST('true' AS JSON),
    'show_verification', CAST('true' AS JSON)
  ),
  1,
  'ACTIVE'
FROM institutions i
WHERE NOT EXISTS (
  SELECT 1
  FROM document_templates existing_template
  WHERE existing_template.institution_id = i.institution_id
    AND existing_template.document_type = 'MARKSHEET'
);

INSERT INTO document_templates (
  institution_id,
  document_type,
  template_name,
  design_json,
  is_default,
  status
)
SELECT
  i.institution_id,
  'TESTIMONIAL',
  'Default Certificate',
  JSON_OBJECT(
    'version', 2,
    'paper', 'A4',
    'accent_color', '#1d4ed8',
    'layout_style', 'classic',
    'show_logo', CAST('true' AS JSON),
    'show_result', CAST('true' AS JSON),
    'show_date_of_birth', CAST('true' AS JSON),
    'show_verification', CAST('true' AS JSON)
  ),
  1,
  'ACTIVE'
FROM institutions i
WHERE NOT EXISTS (
  SELECT 1
  FROM document_templates existing_template
  WHERE existing_template.institution_id = i.institution_id
    AND existing_template.document_type = 'TESTIMONIAL'
);

SET @add_issued_template_id := NOT EXISTS (
  SELECT 1 FROM information_schema.columns
  WHERE table_schema = @exam_workflow_schema
    AND table_name = 'issued_documents'
    AND column_name = 'template_id'
);
SET @exam_workflow_ddl := IF(
  @add_issued_template_id,
  'ALTER TABLE `issued_documents` ADD COLUMN `template_id` BIGINT NULL AFTER `exam_id`',
  'SELECT 1'
);
PREPARE exam_workflow_stmt FROM @exam_workflow_ddl;
EXECUTE exam_workflow_stmt;
DEALLOCATE PREPARE exam_workflow_stmt;

SET @add_issued_design_snapshot := NOT EXISTS (
  SELECT 1 FROM information_schema.columns
  WHERE table_schema = @exam_workflow_schema
    AND table_name = 'issued_documents'
    AND column_name = 'design_snapshot'
);
SET @exam_workflow_ddl := IF(
  @add_issued_design_snapshot,
  'ALTER TABLE `issued_documents` ADD COLUMN `design_snapshot` JSON NULL AFTER `template_id`',
  'SELECT 1'
);
PREPARE exam_workflow_stmt FROM @exam_workflow_ddl;
EXECUTE exam_workflow_stmt;
DEALLOCATE PREPARE exam_workflow_stmt;

UPDATE issued_documents issued
JOIN document_templates template ON template.template_id = issued.template_id
SET issued.design_snapshot = template.design_json
WHERE issued.design_snapshot IS NULL;

/* -------------------------------------------------------------------------
   Helpful lookup indexes (all guarded for re-runs)
   ------------------------------------------------------------------------- */

SET @add_index := NOT EXISTS (
  SELECT 1 FROM information_schema.statistics
  WHERE table_schema = @exam_workflow_schema
    AND table_name = 'class_subjects'
    AND index_name = 'idx_class_subjects_workflow'
);
SET @exam_workflow_ddl := IF(
  @add_index,
  'ALTER TABLE `class_subjects` ADD INDEX `idx_class_subjects_workflow` (`institution_id`, `class_id`, `assignment_type`, `status`)',
  'SELECT 1'
);
PREPARE exam_workflow_stmt FROM @exam_workflow_ddl;
EXECUTE exam_workflow_stmt;
DEALLOCATE PREPARE exam_workflow_stmt;

SET @add_index := NOT EXISTS (
  SELECT 1 FROM information_schema.statistics
  WHERE table_schema = @exam_workflow_schema
    AND table_name = 'mark_components'
    AND index_name = 'idx_mark_components_status'
);
SET @exam_workflow_ddl := IF(
  @add_index,
  'ALTER TABLE `mark_components` ADD INDEX `idx_mark_components_status` (`institution_id`, `status`)',
  'SELECT 1'
);
PREPARE exam_workflow_stmt FROM @exam_workflow_ddl;
EXECUTE exam_workflow_stmt;
DEALLOCATE PREPARE exam_workflow_stmt;

SET @add_index := NOT EXISTS (
  SELECT 1 FROM information_schema.statistics
  WHERE table_schema = @exam_workflow_schema
    AND table_name = 'exam_subject_components'
    AND index_name = 'idx_exam_subject_components_component'
);
SET @exam_workflow_ddl := IF(
  @add_index,
  'ALTER TABLE `exam_subject_components` ADD INDEX `idx_exam_subject_components_component` (`component_id`, `exam_subject_id`)',
  'SELECT 1'
);
PREPARE exam_workflow_stmt FROM @exam_workflow_ddl;
EXECUTE exam_workflow_stmt;
DEALLOCATE PREPARE exam_workflow_stmt;

SET @add_index := NOT EXISTS (
  SELECT 1 FROM information_schema.statistics
  WHERE table_schema = @exam_workflow_schema
    AND table_name = 'exam_marks'
    AND index_name = 'idx_exam_marks_exam_student'
);
SET @exam_workflow_ddl := IF(
  @add_index,
  'ALTER TABLE `exam_marks` ADD INDEX `idx_exam_marks_exam_student` (`exam_id`, `student_id`, `exam_subject_id`)',
  'SELECT 1'
);
PREPARE exam_workflow_stmt FROM @exam_workflow_ddl;
EXECUTE exam_workflow_stmt;
DEALLOCATE PREPARE exam_workflow_stmt;

SET @add_index := NOT EXISTS (
  SELECT 1 FROM information_schema.statistics
  WHERE table_schema = @exam_workflow_schema
    AND table_name = 'exams'
    AND index_name = 'idx_exams_fee_required'
);
SET @exam_workflow_ddl := IF(
  @add_index,
  'ALTER TABLE `exams` ADD INDEX `idx_exams_fee_required` (`fee_required`, `exam_status`)',
  'SELECT 1'
);
PREPARE exam_workflow_stmt FROM @exam_workflow_ddl;
EXECUTE exam_workflow_stmt;
DEALLOCATE PREPARE exam_workflow_stmt;

SET @add_index := NOT EXISTS (
  SELECT 1 FROM information_schema.statistics
  WHERE table_schema = @exam_workflow_schema
    AND table_name = 'exam_candidates'
    AND index_name = 'idx_exam_candidates_fee_status'
);
SET @exam_workflow_ddl := IF(
  @add_index,
  'ALTER TABLE `exam_candidates` ADD INDEX `idx_exam_candidates_fee_status` (`exam_id`, `fee_status`, `fee_waived`)',
  'SELECT 1'
);
PREPARE exam_workflow_stmt FROM @exam_workflow_ddl;
EXECUTE exam_workflow_stmt;
DEALLOCATE PREPARE exam_workflow_stmt;

SET @add_index := NOT EXISTS (
  SELECT 1 FROM information_schema.statistics
  WHERE table_schema = @exam_workflow_schema
    AND table_name = 'issued_documents'
    AND index_name = 'idx_issued_documents_student_type'
);
SET @exam_workflow_ddl := IF(
  @add_index,
  'ALTER TABLE `issued_documents` ADD INDEX `idx_issued_documents_student_type` (`student_id`, `document_type`, `issue_date`)',
  'SELECT 1'
);
PREPARE exam_workflow_stmt FROM @exam_workflow_ddl;
EXECUTE exam_workflow_stmt;
DEALLOCATE PREPARE exam_workflow_stmt;

SET @add_index := NOT EXISTS (
  SELECT 1 FROM information_schema.statistics
  WHERE table_schema = @exam_workflow_schema
    AND table_name = 'issued_documents'
    AND index_name = 'idx_issued_documents_exam_type'
);
SET @exam_workflow_ddl := IF(
  @add_index,
  'ALTER TABLE `issued_documents` ADD INDEX `idx_issued_documents_exam_type` (`exam_id`, `document_type`)',
  'SELECT 1'
);
PREPARE exam_workflow_stmt FROM @exam_workflow_ddl;
EXECUTE exam_workflow_stmt;
DEALLOCATE PREPARE exam_workflow_stmt;

SET @add_index := NOT EXISTS (
  SELECT 1 FROM information_schema.statistics
  WHERE table_schema = @exam_workflow_schema
    AND table_name = 'issued_documents'
    AND index_name = 'idx_issued_documents_template'
);
SET @exam_workflow_ddl := IF(
  @add_index,
  'ALTER TABLE `issued_documents` ADD INDEX `idx_issued_documents_template` (`template_id`)',
  'SELECT 1'
);
PREPARE exam_workflow_stmt FROM @exam_workflow_ddl;
EXECUTE exam_workflow_stmt;
DEALLOCATE PREPARE exam_workflow_stmt;

-- Avoid leaking migration scratch values into a long-lived client session.
SET @exam_workflow_ddl := NULL;
SET @exam_workflow_schema := NULL;
SET @add_index := NULL;
