-- MySQL; the API also applies this upgrade on startup.
ALTER TABLE student_enrollments ADD COLUMN subjects_assigned TINYINT(1) NOT NULL DEFAULT 0;

CREATE TABLE student_subject_assignments (
  enrollment_id BIGINT NOT NULL,
  subject_id BIGINT NOT NULL,
  paper_no TINYINT NOT NULL DEFAULT 0,
  assignment_type VARCHAR(30) NOT NULL DEFAULT 'MANDATORY',
  PRIMARY KEY (enrollment_id, subject_id, paper_no),
  CONSTRAINT fk_student_subject_enrollment FOREIGN KEY (enrollment_id) REFERENCES student_enrollments(enrollment_id) ON DELETE CASCADE,
  CONSTRAINT fk_student_subject_subject FOREIGN KEY (subject_id) REFERENCES subjects(subject_id)
);
