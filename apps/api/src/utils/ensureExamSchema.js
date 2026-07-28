import pool from "../config/db.js";

async function ensureColumn(table, column, definition) {
  const existing = await pool.query(`SELECT 1 FROM information_schema.columns WHERE table_schema=DATABASE() AND table_name=$1 AND column_name=$2`, [table, column]);
  if (!existing.rowCount) await pool.query(`ALTER TABLE sms.${table} ADD COLUMN ${column} ${definition}`);
}

export async function ensureExamSchema() {
  const statements = [
    `CREATE TABLE IF NOT EXISTS sms.class_subjects (class_subject_id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY, institution_id BIGINT NOT NULL, class_id BIGINT NOT NULL, group_id BIGINT NULL, subject_id BIGINT NOT NULL, is_mandatory TINYINT(1) NOT NULL DEFAULT 1, sort_order INT NOT NULL DEFAULT 0, status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE', UNIQUE KEY uk_class_subject (class_id,group_id,subject_id))`,
    `CREATE TABLE IF NOT EXISTS sms.exam_types (exam_type_id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY, institution_id BIGINT NOT NULL, exam_type_code VARCHAR(30) NOT NULL, exam_type_name VARCHAR(120) NOT NULL, status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE', UNIQUE KEY uk_exam_type (institution_id,exam_type_code))`,
    `CREATE TABLE IF NOT EXISTS sms.grading_scales (grading_scale_id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY, institution_id BIGINT NOT NULL, scale_name VARCHAR(100) NOT NULL, max_gpa DECIMAL(4,2) NOT NULL DEFAULT 5.00, status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE', UNIQUE KEY uk_grade_scale (institution_id,scale_name))`,
    `CREATE TABLE IF NOT EXISTS sms.grading_scale_details (grade_detail_id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY, grading_scale_id BIGINT NOT NULL, min_marks DECIMAL(8,2) NOT NULL, max_marks DECIMAL(8,2) NOT NULL, letter_grade VARCHAR(10) NOT NULL, grade_point DECIMAL(4,2) NOT NULL, remarks VARCHAR(100) NULL, UNIQUE KEY uk_grade_band (grading_scale_id,min_marks,max_marks))`,
    `CREATE TABLE IF NOT EXISTS sms.exams (exam_id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY, branch_id BIGINT NOT NULL, academic_year_id BIGINT NOT NULL, exam_type_id BIGINT NOT NULL, grading_scale_id BIGINT NULL, exam_name VARCHAR(150) NOT NULL, class_id BIGINT NULL, start_date DATE NULL, end_date DATE NULL, result_publish_date DATE NULL, exam_status VARCHAR(30) NOT NULL DEFAULT 'DRAFT', created_by BIGINT NULL, created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP, UNIQUE KEY uk_exam (branch_id,academic_year_id,exam_type_id,exam_name,class_id))`,
    `CREATE TABLE IF NOT EXISTS sms.exam_subjects (exam_subject_id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY, exam_id BIGINT NOT NULL, subject_id BIGINT NOT NULL, full_marks DECIMAL(8,2) NOT NULL DEFAULT 100, pass_marks DECIMAL(8,2) NOT NULL DEFAULT 33, exam_date DATE NULL, start_time TIME NULL, end_time TIME NULL, room_no VARCHAR(40) NULL, status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE', UNIQUE KEY uk_exam_subject (exam_id,subject_id))`,
    `CREATE TABLE IF NOT EXISTS sms.exam_candidates (candidate_id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY, exam_id BIGINT NOT NULL, student_id BIGINT NOT NULL, enrollment_id BIGINT NULL, candidate_no VARCHAR(40) NULL, eligibility_status VARCHAR(20) NOT NULL DEFAULT 'ELIGIBLE', hold_reason VARCHAR(255) NULL, UNIQUE KEY uk_exam_candidate (exam_id,student_id), UNIQUE KEY uk_exam_candidate_no (exam_id,candidate_no))`,
    `CREATE TABLE IF NOT EXISTS sms.exam_seating_assignments (seating_assignment_id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY, exam_id BIGINT NOT NULL, candidate_id BIGINT NOT NULL, classroom_id BIGINT NOT NULL, seat_no VARCHAR(30) NOT NULL, UNIQUE KEY uk_exam_seat_candidate (exam_id,candidate_id), UNIQUE KEY uk_exam_room_seat (exam_id,classroom_id,seat_no))`,
    `CREATE TABLE IF NOT EXISTS sms.exam_marks (mark_id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY, exam_subject_id BIGINT NOT NULL, student_id BIGINT NOT NULL, marks_obtained DECIMAL(8,2) NOT NULL DEFAULT 0, is_absent TINYINT(1) NOT NULL DEFAULT 0, remarks TEXT NULL, entry_status VARCHAR(20) NOT NULL DEFAULT 'DRAFT', entered_by BIGINT NULL, entered_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP, UNIQUE KEY uk_exam_mark (exam_subject_id,student_id))`,
    `CREATE TABLE IF NOT EXISTS sms.student_results (result_id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY, exam_id BIGINT NOT NULL, student_id BIGINT NOT NULL, enrollment_id BIGINT NULL, total_marks DECIMAL(10,2) NOT NULL DEFAULT 0, obtained_marks DECIMAL(10,2) NOT NULL DEFAULT 0, gpa DECIMAL(4,2) NULL, letter_grade VARCHAR(10) NULL, merit_position INT NULL, result_status VARCHAR(30) NOT NULL DEFAULT 'PENDING', failed_subject_count INT NOT NULL DEFAULT 0, published_at DATETIME NULL, created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP, UNIQUE KEY uk_exam_result (exam_id,student_id))`,
    `CREATE TABLE IF NOT EXISTS sms.student_result_details (result_detail_id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY, result_id BIGINT NOT NULL, subject_id BIGINT NOT NULL, full_marks DECIMAL(8,2) NOT NULL, pass_marks DECIMAL(8,2) NOT NULL, obtained_marks DECIMAL(8,2) NOT NULL DEFAULT 0, letter_grade VARCHAR(10) NULL, grade_point DECIMAL(4,2) NULL, subject_status VARCHAR(30) NOT NULL DEFAULT 'PENDING', UNIQUE KEY uk_result_subject (result_id,subject_id))`,
    `CREATE TABLE IF NOT EXISTS sms.issued_documents (issued_document_id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY, document_type VARCHAR(30) NOT NULL, student_id BIGINT NOT NULL, exam_id BIGINT NULL, document_no VARCHAR(60) NOT NULL, issue_date DATE NOT NULL, verification_code VARCHAR(80) NOT NULL, status VARCHAR(20) NOT NULL DEFAULT 'ISSUED', issued_by BIGINT NULL, created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, UNIQUE KEY uk_document_no (document_no), UNIQUE KEY uk_verification_code (verification_code))`,
  ];
  for (const statement of statements) await pool.query(statement);
  // Existing deployments may already have the original schema. Upgrade it in place.
  await ensureColumn("exams", "grading_scale_id", "BIGINT NULL AFTER exam_type_id");
  await ensureColumn("exam_subjects", "room_no", "VARCHAR(40) NULL AFTER end_time");
  await ensureColumn("exam_marks", "entry_status", "VARCHAR(20) NOT NULL DEFAULT 'DRAFT' AFTER remarks");
  await ensureColumn("subjects", "written_marks", "DECIMAL(8,2) NOT NULL DEFAULT 100 AFTER pass_marks");
  await ensureColumn("subjects", "mcq_marks", "DECIMAL(8,2) NOT NULL DEFAULT 0 AFTER written_marks");
  await ensureColumn("subjects", "practical_marks", "DECIMAL(8,2) NOT NULL DEFAULT 0 AFTER mcq_marks");
  await ensureColumn("subjects", "viva_marks", "DECIMAL(8,2) NOT NULL DEFAULT 0 AFTER practical_marks");
  await ensureColumn("subjects", "curriculum_type", "VARCHAR(20) NOT NULL DEFAULT 'SCHOOL' AFTER subject_type");
  // Keep existing subject records aligned with the exact Institution Type values.
  // School & College intentionally keeps SCHOOL records; College subjects can be added separately.
  await pool.query(`UPDATE sms.subjects s JOIN sms.institutions i ON i.institution_id=s.institution_id
    SET s.curriculum_type=CASE
      WHEN UPPER(i.institution_type) LIKE '%MADRASA%' THEN 'MADRASA'
      WHEN UPPER(i.institution_type) LIKE '%COACHING%' THEN 'COACHING_CENTER'
      WHEN UPPER(i.institution_type) LIKE '%UNIVERSITY%' THEN 'UNIVERSITY'
      WHEN UPPER(i.institution_type) LIKE '%POLYTECHNIC%' THEN 'POLYTECHNIC'
      WHEN UPPER(i.institution_type) LIKE '%VOCATIONAL%' THEN 'VOCATIONAL_INSTITUTE'
      WHEN UPPER(i.institution_type) LIKE '%COLLEGE%' AND UPPER(i.institution_type) NOT LIKE '%SCHOOL%' THEN 'COLLEGE'
      ELSE s.curriculum_type
    END
    WHERE s.curriculum_type IN ('MADRASAH','SCHOOL')`);

  await pool.query(`INSERT INTO sms.exam_types (institution_id,exam_type_code,exam_type_name,status)
    SELECT institution_id,'CLASS_TEST','Class Test','ACTIVE' FROM sms.institutions
    ON DUPLICATE KEY UPDATE exam_type_name=VALUES(exam_type_name),status='ACTIVE'`);
  await pool.query(`INSERT INTO sms.exam_types (institution_id,exam_type_code,exam_type_name,status)
    SELECT institution_id,'HALF_YEARLY','Half Yearly Examination','ACTIVE' FROM sms.institutions
    ON DUPLICATE KEY UPDATE exam_type_name=VALUES(exam_type_name),status='ACTIVE'`);
  await pool.query(`INSERT INTO sms.exam_types (institution_id,exam_type_code,exam_type_name,status)
    SELECT institution_id,'ANNUAL','Annual Examination','ACTIVE' FROM sms.institutions
    ON DUPLICATE KEY UPDATE exam_type_name=VALUES(exam_type_name),status='ACTIVE'`);
  await pool.query(`INSERT INTO sms.grading_scales (institution_id,scale_name,max_gpa,status)
    SELECT institution_id,'GPA 5',5.00,'ACTIVE' FROM sms.institutions
    ON DUPLICATE KEY UPDATE max_gpa=VALUES(max_gpa),status='ACTIVE'`);
  for (const [min, max, grade, point] of [[80,100,'A+',5],[70,79.99,'A',4],[60,69.99,'A-',3.5],[50,59.99,'B',3],[40,49.99,'C',2],[33,39.99,'D',1],[0,32.99,'F',0]]) {
    await pool.query(`INSERT INTO sms.grading_scale_details (grading_scale_id,min_marks,max_marks,letter_grade,grade_point)
      SELECT grading_scale_id,$1,$2,$3,$4 FROM sms.grading_scales WHERE scale_name='GPA 5'
      ON DUPLICATE KEY UPDATE letter_grade=VALUES(letter_grade),grade_point=VALUES(grade_point)`, [min, max, grade, point]);
  }
}
