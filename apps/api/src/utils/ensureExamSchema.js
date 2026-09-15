import pool from "../config/db.js";
import { consolidateSubjectMaster } from "./consolidateSubjectMaster.js";

async function columnExists(table, column) {
  const existing = await pool.query(
    `SELECT 1
       FROM information_schema.columns
      WHERE table_schema = DATABASE()
        AND table_name = $1
        AND column_name = $2`,
    [table, column]
  );
  return existing.rowCount > 0;
}

async function ensureColumn(table, column, definition) {
  if (!(await columnExists(table, column))) {
    await pool.query(`ALTER TABLE sms.${table} ADD COLUMN ${column} ${definition}`);
  }
}

async function indexColumns(table, indexName) {
  const result = await pool.query(
    `SELECT GROUP_CONCAT(column_name ORDER BY seq_in_index) AS columns_list
       FROM information_schema.statistics
      WHERE table_schema = DATABASE()
        AND table_name = $1
        AND index_name = $2
      GROUP BY index_name`,
    [table, indexName]
  );
  return String(result.rows[0]?.columns_list || "").toLowerCase();
}

async function ensureIndex(table, indexName, definition) {
  if (!(await indexColumns(table, indexName))) {
    await pool.query(`ALTER TABLE sms.${table} ADD ${definition}`);
  }
}

export async function ensureExamSchema() {
  const hadAssignmentType = await columnExists("class_subjects", "assignment_type");
  const hadClassComponents = await columnExists("class_subjects", "written_marks");
  const hadCandidateFeeStatus = await columnExists("exam_candidates", "fee_status");

  const statements = [
    `CREATE TABLE IF NOT EXISTS sms.class_subjects (
      class_subject_id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
      institution_id BIGINT NOT NULL,
      class_id BIGINT NOT NULL,
      group_id BIGINT NULL,
      subject_id BIGINT NOT NULL,
      paper_no TINYINT NOT NULL DEFAULT 0,
      is_mandatory TINYINT(1) NOT NULL DEFAULT 1,
      assignment_type VARCHAR(30) NOT NULL DEFAULT 'MANDATORY',
      written_marks DECIMAL(8,2) NOT NULL DEFAULT 100,
      written_pass_marks DECIMAL(8,2) NOT NULL DEFAULT 33,
      mcq_marks DECIMAL(8,2) NOT NULL DEFAULT 0,
      mcq_pass_marks DECIMAL(8,2) NOT NULL DEFAULT 0,
      practical_marks DECIMAL(8,2) NOT NULL DEFAULT 0,
      practical_pass_marks DECIMAL(8,2) NOT NULL DEFAULT 0,
      viva_marks DECIMAL(8,2) NOT NULL DEFAULT 0,
      viva_pass_marks DECIMAL(8,2) NOT NULL DEFAULT 0,
      is_locked TINYINT(1) NOT NULL DEFAULT 0,
      sort_order INT NOT NULL DEFAULT 0,
      status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
      UNIQUE KEY uk_class_subject (class_id, group_id, subject_id, paper_no)
    )`,
    `CREATE TABLE IF NOT EXISTS sms.institution_subject_settings (
      setting_id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
      institution_id BIGINT NOT NULL,
      is_locked TINYINT(1) NOT NULL DEFAULT 0,
      locked_by BIGINT NULL,
      locked_at DATETIME NULL,
      updated_by BIGINT NULL,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      UNIQUE KEY uk_institution_subject_settings (institution_id)
    )`,
    `CREATE TABLE IF NOT EXISTS sms.exam_types (
      exam_type_id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
      institution_id BIGINT NOT NULL,
      exam_type_code VARCHAR(30) NOT NULL,
      exam_type_name VARCHAR(120) NOT NULL,
      status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
      UNIQUE KEY uk_exam_type (institution_id, exam_type_code)
    )`,
    `CREATE TABLE IF NOT EXISTS sms.grading_scales (
      grading_scale_id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
      institution_id BIGINT NOT NULL,
      scale_name VARCHAR(100) NOT NULL,
      max_gpa DECIMAL(4,2) NOT NULL DEFAULT 5.00,
      status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
      UNIQUE KEY uk_grade_scale (institution_id, scale_name)
    )`,
    `CREATE TABLE IF NOT EXISTS sms.grading_scale_details (
      grade_detail_id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
      grading_scale_id BIGINT NOT NULL,
      min_marks DECIMAL(8,2) NOT NULL,
      max_marks DECIMAL(8,2) NOT NULL,
      letter_grade VARCHAR(10) NOT NULL,
      grade_point DECIMAL(4,2) NOT NULL,
      remarks VARCHAR(100) NULL,
      UNIQUE KEY uk_grade_band (grading_scale_id, min_marks, max_marks)
    )`,
    `CREATE TABLE IF NOT EXISTS sms.exams (
      exam_id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
      branch_id BIGINT NOT NULL,
      academic_year_id BIGINT NOT NULL,
      exam_type_id BIGINT NOT NULL,
      grading_scale_id BIGINT NULL,
      exam_name VARCHAR(150) NOT NULL,
      class_id BIGINT NULL,
      start_date DATE NULL,
      end_date DATE NULL,
      result_publish_date DATE NULL,
      exam_fee_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
      fee_required TINYINT(1) NOT NULL DEFAULT 0,
      exam_status VARCHAR(30) NOT NULL DEFAULT 'DRAFT',
      created_by BIGINT NULL,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      UNIQUE KEY uk_exam (branch_id, academic_year_id, exam_type_id, exam_name, class_id)
    )`,
    `CREATE TABLE IF NOT EXISTS sms.exam_subjects (
      exam_subject_id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
      exam_id BIGINT NOT NULL,
      subject_id BIGINT NOT NULL,
      paper_no TINYINT NOT NULL DEFAULT 0,
      full_marks DECIMAL(8,2) NOT NULL DEFAULT 100,
      pass_marks DECIMAL(8,2) NOT NULL DEFAULT 33,
      exam_date DATE NULL,
      start_time TIME NULL,
      end_time TIME NULL,
      room_no VARCHAR(40) NULL,
      status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
      UNIQUE KEY uk_exam_subject (exam_id, subject_id, paper_no)
    )`,
    `CREATE TABLE IF NOT EXISTS sms.mark_components (
      component_id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
      institution_id BIGINT NOT NULL,
      component_code VARCHAR(30) NOT NULL,
      component_name VARCHAR(100) NOT NULL,
      status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
      UNIQUE KEY uk_mark_components (institution_id, component_code)
    )`,
    `CREATE TABLE IF NOT EXISTS sms.exam_subject_components (
      exam_subject_component_id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
      exam_subject_id BIGINT NOT NULL,
      component_id BIGINT NOT NULL,
      full_marks DECIMAL(8,2) NOT NULL,
      pass_marks DECIMAL(8,2) NOT NULL DEFAULT 0,
      sort_order INT NOT NULL DEFAULT 0,
      UNIQUE KEY uk_exam_subject_components (exam_subject_id, component_id)
    )`,
    `CREATE TABLE IF NOT EXISTS sms.exam_candidates (
      candidate_id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
      exam_id BIGINT NOT NULL,
      student_id BIGINT NOT NULL,
      enrollment_id BIGINT NULL,
      candidate_no VARCHAR(40) NULL,
      eligibility_status VARCHAR(20) NOT NULL DEFAULT 'ELIGIBLE',
      hold_reason VARCHAR(255) NULL,
      fee_status VARCHAR(20) NOT NULL DEFAULT 'DUE',
      fee_waived TINYINT(1) NOT NULL DEFAULT 0,
      UNIQUE KEY uk_exam_candidate (exam_id, student_id),
      UNIQUE KEY uk_exam_candidate_no (exam_id, candidate_no)
    )`,
    `CREATE TABLE IF NOT EXISTS sms.exam_seating_assignments (
      seating_assignment_id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
      exam_id BIGINT NOT NULL,
      candidate_id BIGINT NOT NULL,
      classroom_id BIGINT NOT NULL,
      seat_no VARCHAR(30) NOT NULL,
      UNIQUE KEY uk_exam_seat_candidate (exam_id, candidate_id),
      UNIQUE KEY uk_exam_room_seat (exam_id, classroom_id, seat_no)
    )`,
    `CREATE TABLE IF NOT EXISTS sms.exam_marks (
      mark_id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
      exam_id BIGINT NULL,
      exam_subject_id BIGINT NOT NULL,
      student_id BIGINT NOT NULL,
      component_id BIGINT NULL,
      marks_obtained DECIMAL(8,2) NOT NULL DEFAULT 0,
      is_absent TINYINT(1) NOT NULL DEFAULT 0,
      remarks TEXT NULL,
      entry_status VARCHAR(20) NOT NULL DEFAULT 'DRAFT',
      entered_by BIGINT NULL,
      entered_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      UNIQUE KEY uk_exam_marks (exam_subject_id, student_id, component_id)
    )`,
    `CREATE TABLE IF NOT EXISTS sms.student_results (
      result_id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
      exam_id BIGINT NOT NULL,
      student_id BIGINT NOT NULL,
      enrollment_id BIGINT NULL,
      total_marks DECIMAL(10,2) NOT NULL DEFAULT 0,
      obtained_marks DECIMAL(10,2) NOT NULL DEFAULT 0,
      gpa DECIMAL(4,2) NULL,
      letter_grade VARCHAR(10) NULL,
      merit_position INT NULL,
      result_status VARCHAR(30) NOT NULL DEFAULT 'PENDING',
      failed_subject_count INT NOT NULL DEFAULT 0,
      published_at DATETIME NULL,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      UNIQUE KEY uk_exam_result (exam_id, student_id)
    )`,
    `CREATE TABLE IF NOT EXISTS sms.student_result_details (
      result_detail_id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
      result_id BIGINT NOT NULL,
      subject_id BIGINT NOT NULL,
      paper_no TINYINT NOT NULL DEFAULT 0,
      full_marks DECIMAL(8,2) NOT NULL,
      pass_marks DECIMAL(8,2) NOT NULL,
      obtained_marks DECIMAL(8,2) NOT NULL DEFAULT 0,
      letter_grade VARCHAR(10) NULL,
      grade_point DECIMAL(4,2) NULL,
      subject_status VARCHAR(30) NOT NULL DEFAULT 'PENDING',
      UNIQUE KEY uk_result_subject (result_id, subject_id)
    )`,
    `CREATE TABLE IF NOT EXISTS sms.document_templates (
      template_id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
      institution_id BIGINT NOT NULL,
      document_type VARCHAR(30) NOT NULL,
      template_name VARCHAR(120) NOT NULL,
      design_json JSON NULL,
      is_default TINYINT(1) NOT NULL DEFAULT 0,
      status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
      created_by BIGINT NULL,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      UNIQUE KEY uk_document_template (institution_id, document_type, template_name)
    )`,
    `CREATE TABLE IF NOT EXISTS sms.issued_documents (
      issued_document_id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
      document_type VARCHAR(30) NOT NULL,
      student_id BIGINT NOT NULL,
      exam_id BIGINT NULL,
      template_id BIGINT NULL,
      design_snapshot JSON NULL,
      document_no VARCHAR(60) NOT NULL,
      issue_date DATE NOT NULL,
      verification_code VARCHAR(80) NOT NULL,
      status VARCHAR(20) NOT NULL DEFAULT 'ISSUED',
      issued_by BIGINT NULL,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      UNIQUE KEY uk_document_no (document_no),
      UNIQUE KEY uk_verification_code (verification_code)
    )`,
  ];

  for (const statement of statements) await pool.query(statement);

  // Existing deployments may already have an earlier form of these tables.
  await ensureColumn("subjects", "written_marks", "DECIMAL(8,2) NOT NULL DEFAULT 100 AFTER pass_marks");
  await ensureColumn("subjects", "mcq_marks", "DECIMAL(8,2) NOT NULL DEFAULT 0 AFTER written_marks");
  await ensureColumn("subjects", "practical_marks", "DECIMAL(8,2) NOT NULL DEFAULT 0 AFTER mcq_marks");
  await ensureColumn("subjects", "viva_marks", "DECIMAL(8,2) NOT NULL DEFAULT 0 AFTER practical_marks");
  await ensureColumn("subjects", "curriculum_type", "VARCHAR(20) NOT NULL DEFAULT 'SCHOOL' AFTER subject_type");
  await ensureColumn("subjects", "subject_name_bn", "VARCHAR(255) NULL AFTER subject_name");
  await ensureColumn("subjects", "paper_mode", "VARCHAR(20) NOT NULL DEFAULT 'SINGLE' AFTER curriculum_type");
  await ensureColumn("subjects", "canonical_subject_id", "BIGINT NULL AFTER paper_mode");

  await ensureColumn("class_subjects", "paper_no", "TINYINT NOT NULL DEFAULT 0 AFTER subject_id");
  await ensureColumn("class_subjects", "assignment_type", "VARCHAR(30) NOT NULL DEFAULT 'MANDATORY' AFTER is_mandatory");
  await ensureColumn("class_subjects", "written_marks", "DECIMAL(8,2) NOT NULL DEFAULT 100 AFTER assignment_type");
  await ensureColumn("class_subjects", "written_pass_marks", "DECIMAL(8,2) NOT NULL DEFAULT 33 AFTER written_marks");
  await ensureColumn("class_subjects", "mcq_marks", "DECIMAL(8,2) NOT NULL DEFAULT 0 AFTER written_pass_marks");
  await ensureColumn("class_subjects", "mcq_pass_marks", "DECIMAL(8,2) NOT NULL DEFAULT 0 AFTER mcq_marks");
  await ensureColumn("class_subjects", "practical_marks", "DECIMAL(8,2) NOT NULL DEFAULT 0 AFTER mcq_pass_marks");
  await ensureColumn("class_subjects", "practical_pass_marks", "DECIMAL(8,2) NOT NULL DEFAULT 0 AFTER practical_marks");
  await ensureColumn("class_subjects", "viva_marks", "DECIMAL(8,2) NOT NULL DEFAULT 0 AFTER practical_pass_marks");
  await ensureColumn("class_subjects", "viva_pass_marks", "DECIMAL(8,2) NOT NULL DEFAULT 0 AFTER viva_marks");
  await ensureColumn("class_subjects", "is_locked", "TINYINT(1) NOT NULL DEFAULT 0 AFTER viva_pass_marks");

  await ensureColumn("exams", "grading_scale_id", "BIGINT NULL AFTER exam_type_id");
  await ensureColumn("exams", "exam_fee_amount", "DECIMAL(12,2) NOT NULL DEFAULT 0 AFTER result_publish_date");
  await ensureColumn("exams", "fee_required", "TINYINT(1) NOT NULL DEFAULT 0 AFTER exam_fee_amount");
  await ensureColumn("exam_subjects", "paper_no", "TINYINT NOT NULL DEFAULT 0 AFTER subject_id");
  await ensureColumn("exam_subjects", "room_no", "VARCHAR(40) NULL AFTER end_time");
  await ensureColumn("student_result_details", "paper_no", "TINYINT NOT NULL DEFAULT 0 AFTER subject_id");
  await ensureColumn("class_routines", "paper_no", "TINYINT NOT NULL DEFAULT 0 AFTER subject_id");
  await ensureColumn("teacher_subject_assignments", "paper_no", "TINYINT NOT NULL DEFAULT 0 AFTER subject_id");
  await ensureColumn("exam_candidates", "fee_status", "VARCHAR(20) NOT NULL DEFAULT 'DUE' AFTER hold_reason");
  await ensureColumn("exam_candidates", "fee_waived", "TINYINT(1) NOT NULL DEFAULT 0 AFTER fee_status");
  await ensureColumn("exam_marks", "exam_id", "BIGINT NULL AFTER mark_id");
  await ensureColumn("exam_marks", "component_id", "BIGINT NULL AFTER student_id");
  await ensureColumn("exam_marks", "entry_status", "VARCHAR(20) NOT NULL DEFAULT 'DRAFT' AFTER remarks");
  await ensureColumn("issued_documents", "template_id", "BIGINT NULL AFTER exam_id");
  await ensureColumn("issued_documents", "design_snapshot", "JSON NULL AFTER template_id");

  const classSubjectIndex = await indexColumns("class_subjects", "uk_class_subject");
  if (classSubjectIndex && classSubjectIndex !== "class_id,group_id,subject_id,paper_no") {
    await pool.query("ALTER TABLE sms.class_subjects DROP INDEX uk_class_subject");
  }
  await ensureIndex(
    "class_subjects",
    "uk_class_subject",
    "UNIQUE KEY uk_class_subject (class_id, group_id, subject_id, paper_no)"
  );
  const examSubjectIndex = await indexColumns("exam_subjects", "uk_exam_subject");
  if (examSubjectIndex && examSubjectIndex !== "exam_id,subject_id,paper_no") {
    await pool.query("ALTER TABLE sms.exam_subjects DROP INDEX uk_exam_subject");
  }
  await ensureIndex(
    "exam_subjects",
    "uk_exam_subject",
    "UNIQUE KEY uk_exam_subject (exam_id, subject_id, paper_no)"
  );
  const teacherSubjectIndex = await indexColumns("teacher_subject_assignments", "uk_teacher_subject");
  if (teacherSubjectIndex && teacherSubjectIndex !== "employee_id,academic_year_id,batch_id,subject_id,paper_no") {
    await pool.query("ALTER TABLE sms.teacher_subject_assignments DROP INDEX uk_teacher_subject");
  }
  await ensureIndex(
    "teacher_subject_assignments",
    "uk_teacher_subject",
    "UNIQUE KEY uk_teacher_subject (employee_id, academic_year_id, batch_id, subject_id, paper_no)"
  );
  const resultDetailIndex = await indexColumns("student_result_details", "uk_student_result_details");
  if (resultDetailIndex && resultDetailIndex !== "result_id,subject_id,paper_no") {
    await pool.query("ALTER TABLE sms.student_result_details DROP INDEX uk_student_result_details");
  }
  await ensureIndex(
    "student_result_details",
    "uk_student_result_details",
    "UNIQUE KEY uk_student_result_details (result_id, subject_id, paper_no)"
  );

  if (!hadAssignmentType) {
    await pool.query(`UPDATE sms.class_subjects cs
      JOIN sms.subjects s ON s.subject_id = cs.subject_id
      SET cs.assignment_type = CASE
        WHEN UPPER(COALESCE(s.subject_type, '')) = 'FOURTH_SUBJECT' THEN 'FOURTH_SUBJECT'
        WHEN cs.is_mandatory = 0 OR UPPER(COALESCE(s.subject_type, '')) = 'OPTIONAL' THEN 'OPTIONAL'
        ELSE 'MANDATORY'
      END`);
  }
  await pool.query(`UPDATE sms.class_subjects
    SET assignment_type = CASE WHEN is_mandatory = 0 THEN 'OPTIONAL' ELSE 'MANDATORY' END
    WHERE assignment_type IS NULL OR assignment_type NOT IN ('MANDATORY','OPTIONAL','FOURTH_SUBJECT')`);
  await pool.query(`UPDATE sms.class_subjects
    SET is_mandatory = CASE WHEN assignment_type = 'MANDATORY' THEN 1 ELSE 0 END`);

  if (!hadClassComponents) {
    await pool.query(`UPDATE sms.class_subjects cs
      JOIN sms.subjects s ON s.subject_id = cs.subject_id
      SET cs.written_marks = COALESCE(s.written_marks, s.full_marks, 100),
          cs.written_pass_marks = CASE WHEN COALESCE(s.written_marks, s.full_marks, 0) > 0 THEN COALESCE(s.pass_marks, 0) ELSE 0 END,
          cs.mcq_marks = COALESCE(s.mcq_marks, 0),
          cs.mcq_pass_marks = 0,
          cs.practical_marks = COALESCE(s.practical_marks, 0),
          cs.practical_pass_marks = 0,
          cs.viva_marks = COALESCE(s.viva_marks, 0),
          cs.viva_pass_marks = 0`);
  }

  await pool.query(`UPDATE sms.exam_marks em
    JOIN sms.exam_subjects es ON es.exam_subject_id = em.exam_subject_id
    SET em.exam_id = es.exam_id
    WHERE em.exam_id IS NULL`);

  if (!hadCandidateFeeStatus) {
    await pool.query(`UPDATE sms.exam_candidates ec
      JOIN sms.exams e ON e.exam_id=ec.exam_id
      SET ec.fee_status=CASE WHEN e.fee_required=1 THEN 'DUE' ELSE 'WAIVED' END,
          ec.fee_waived=CASE WHEN e.fee_required=1 THEN 0 ELSE 1 END`);
  }

  const legacyIndex = await indexColumns("exam_marks", "uk_exam_mark");
  if (legacyIndex === "exam_subject_id,student_id") {
    await pool.query("ALTER TABLE sms.exam_marks DROP INDEX uk_exam_mark");
  }
  await ensureIndex(
    "exam_marks",
    "uk_exam_marks",
    "UNIQUE KEY uk_exam_marks (exam_subject_id, student_id, component_id)"
  );

  await consolidateSubjectMaster(pool);

  await pool.query(`INSERT INTO sms.institution_subject_settings (institution_id, is_locked)
    SELECT institution_id, 0 FROM sms.institutions
    ON DUPLICATE KEY UPDATE institution_id = VALUES(institution_id)`);

  const components = [
    ["WRITTEN", "Written"],
    ["MCQ", "MCQ"],
    ["PRACTICAL", "Practical"],
    ["VIVA", "Viva"],
  ];
  for (const [code, name] of components) {
    await pool.query(`INSERT INTO sms.mark_components
      (institution_id, component_code, component_name, status)
      SELECT institution_id, $1, $2, 'ACTIVE' FROM sms.institutions
      ON DUPLICATE KEY UPDATE component_name = VALUES(component_name), status = 'ACTIVE'`, [code, name]);
  }

  const defaultTemplates = [
    ["MARKSHEET", "Default Marksheet", JSON.stringify({ version: 2, paper: "A4", accent_color: "#4f46e5", layout_style: "clean", show_logo: true, show_assignment: true, show_merit: true, show_verification: true })],
    ["TESTIMONIAL", "Default Certificate", JSON.stringify({ version: 2, paper: "A4", accent_color: "#1d4ed8", layout_style: "classic", show_logo: true, show_result: true, show_date_of_birth: true, show_verification: true })],
  ];
  for (const [type, name, design] of defaultTemplates) {
    await pool.query(`INSERT INTO sms.document_templates
      (institution_id, document_type, template_name, design_json, is_default, status)
      SELECT i.institution_id, $1, $2, $3, 1, 'ACTIVE'
      FROM sms.institutions i
      WHERE NOT EXISTS (
        SELECT 1 FROM sms.document_templates dt
        WHERE dt.institution_id = i.institution_id AND dt.document_type = $1
      )`, [type, name, design]);
  }
  await pool.query(`UPDATE sms.document_templates legacy
    LEFT JOIN sms.document_templates current
      ON current.institution_id=legacy.institution_id
      AND current.document_type=legacy.document_type
      AND current.template_name='Default Certificate'
    SET legacy.template_name='Default Certificate'
    WHERE legacy.document_type='TESTIMONIAL'
      AND legacy.template_name='Default Testimonial'
      AND current.template_id IS NULL`);

  await pool.query(`INSERT INTO sms.exam_types (institution_id, exam_type_code, exam_type_name, status)
    SELECT institution_id, 'CLASS_TEST', 'Class Test', 'ACTIVE' FROM sms.institutions
    ON DUPLICATE KEY UPDATE exam_type_name = VALUES(exam_type_name), status = 'ACTIVE'`);
  await pool.query(`INSERT INTO sms.exam_types (institution_id, exam_type_code, exam_type_name, status)
    SELECT institution_id, 'HALF_YEARLY', 'Half Yearly Examination', 'ACTIVE' FROM sms.institutions
    ON DUPLICATE KEY UPDATE exam_type_name = VALUES(exam_type_name), status = 'ACTIVE'`);
  await pool.query(`INSERT INTO sms.exam_types (institution_id, exam_type_code, exam_type_name, status)
    SELECT institution_id, 'ANNUAL', 'Annual Examination', 'ACTIVE' FROM sms.institutions
    ON DUPLICATE KEY UPDATE exam_type_name = VALUES(exam_type_name), status = 'ACTIVE'`);
  await pool.query(`INSERT INTO sms.grading_scales (institution_id, scale_name, max_gpa, status)
    SELECT institution_id, 'GPA 5', 5.00, 'ACTIVE' FROM sms.institutions
    ON DUPLICATE KEY UPDATE max_gpa = VALUES(max_gpa), status = 'ACTIVE'`);
  for (const [min, max, grade, point] of [[80,100,"A+",5],[70,79.99,"A",4],[60,69.99,"A-",3.5],[50,59.99,"B",3],[40,49.99,"C",2],[33,39.99,"D",1],[0,32.99,"F",0]]) {
    await pool.query(`INSERT INTO sms.grading_scale_details
      (grading_scale_id, min_marks, max_marks, letter_grade, grade_point)
      SELECT grading_scale_id, $1, $2, $3, $4
      FROM sms.grading_scales WHERE scale_name = 'GPA 5'
      ON DUPLICATE KEY UPDATE letter_grade = VALUES(letter_grade), grade_point = VALUES(grade_point)`, [min, max, grade, point]);
  }
}
