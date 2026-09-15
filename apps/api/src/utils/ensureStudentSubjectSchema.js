import pool from '../config/db.js';

export async function ensureStudentSubjectSchema() {
  await pool.query(`CREATE TABLE IF NOT EXISTS sms.student_subject_assignments (
    enrollment_id BIGINT NOT NULL,
    subject_id BIGINT NOT NULL,
    paper_no TINYINT NOT NULL DEFAULT 0,
    assignment_type VARCHAR(30) NOT NULL DEFAULT 'MANDATORY',
    PRIMARY KEY (enrollment_id,subject_id,paper_no),
    CONSTRAINT fk_student_subject_enrollment FOREIGN KEY (enrollment_id)
      REFERENCES student_enrollments(enrollment_id) ON DELETE CASCADE,
    CONSTRAINT fk_student_subject_subject FOREIGN KEY (subject_id)
      REFERENCES subjects(subject_id)
  )`);
  const column = await pool.query(`SELECT 1 FROM information_schema.columns
    WHERE table_schema=DATABASE() AND table_name='student_enrollments' AND column_name='subjects_assigned'`);
  if (!column.rows.length) {
    await pool.query('ALTER TABLE sms.student_enrollments ADD COLUMN subjects_assigned TINYINT(1) NOT NULL DEFAULT 0');
  }
}
