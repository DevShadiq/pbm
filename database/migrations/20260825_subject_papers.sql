-- One base subject in Subject Master; paper is configured on class/exam assignment.
-- MySQL 8+, idempotent. Data consolidation is completed by ensureExamSchema.js.

SET @ddl = IF((SELECT COUNT(*) FROM information_schema.columns WHERE table_schema=DATABASE() AND table_name='subjects' AND column_name='paper_mode')=0,
  'ALTER TABLE subjects ADD COLUMN paper_mode VARCHAR(20) NOT NULL DEFAULT ''SINGLE'' AFTER curriculum_type', 'SELECT 1');
PREPARE stmt FROM @ddl; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @ddl = IF((SELECT COUNT(*) FROM information_schema.columns WHERE table_schema=DATABASE() AND table_name='subjects' AND column_name='canonical_subject_id')=0,
  'ALTER TABLE subjects ADD COLUMN canonical_subject_id BIGINT NULL AFTER paper_mode', 'SELECT 1');
PREPARE stmt FROM @ddl; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @ddl = IF((SELECT COUNT(*) FROM information_schema.columns WHERE table_schema=DATABASE() AND table_name='class_subjects' AND column_name='paper_no')=0,
  'ALTER TABLE class_subjects ADD COLUMN paper_no TINYINT NOT NULL DEFAULT 0 AFTER subject_id', 'SELECT 1');
PREPARE stmt FROM @ddl; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @ddl = IF((SELECT COUNT(*) FROM information_schema.columns WHERE table_schema=DATABASE() AND table_name='exam_subjects' AND column_name='paper_no')=0,
  'ALTER TABLE exam_subjects ADD COLUMN paper_no TINYINT NOT NULL DEFAULT 0 AFTER subject_id', 'SELECT 1');
PREPARE stmt FROM @ddl; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @ddl = IF((SELECT COUNT(*) FROM information_schema.columns WHERE table_schema=DATABASE() AND table_name='student_result_details' AND column_name='paper_no')=0,
  'ALTER TABLE student_result_details ADD COLUMN paper_no TINYINT NOT NULL DEFAULT 0 AFTER subject_id', 'SELECT 1');
PREPARE stmt FROM @ddl; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @ddl = IF((SELECT COUNT(*) FROM information_schema.columns WHERE table_schema=DATABASE() AND table_name='class_routines' AND column_name='paper_no')=0,
  'ALTER TABLE class_routines ADD COLUMN paper_no TINYINT NOT NULL DEFAULT 0 AFTER subject_id', 'SELECT 1');
PREPARE stmt FROM @ddl; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @ddl = IF((SELECT COUNT(*) FROM information_schema.columns WHERE table_schema=DATABASE() AND table_name='teacher_subject_assignments' AND column_name='paper_no')=0,
  'ALTER TABLE teacher_subject_assignments ADD COLUMN paper_no TINYINT NOT NULL DEFAULT 0 AFTER subject_id', 'SELECT 1');
PREPARE stmt FROM @ddl; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @columns = (SELECT GROUP_CONCAT(column_name ORDER BY seq_in_index) FROM information_schema.statistics WHERE table_schema=DATABASE() AND table_name='class_subjects' AND index_name='uk_class_subject');
SET @ddl = IF(@columns IS NOT NULL AND @columns <> 'class_id,group_id,subject_id,paper_no', 'ALTER TABLE class_subjects DROP INDEX uk_class_subject', 'SELECT 1');
PREPARE stmt FROM @ddl; EXECUTE stmt; DEALLOCATE PREPARE stmt;
SET @ddl = IF((SELECT COUNT(*) FROM information_schema.statistics WHERE table_schema=DATABASE() AND table_name='class_subjects' AND index_name='uk_class_subject')=0,
  'ALTER TABLE class_subjects ADD UNIQUE KEY uk_class_subject (class_id,group_id,subject_id,paper_no)', 'SELECT 1');
PREPARE stmt FROM @ddl; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @columns = (SELECT GROUP_CONCAT(column_name ORDER BY seq_in_index) FROM information_schema.statistics WHERE table_schema=DATABASE() AND table_name='exam_subjects' AND index_name='uk_exam_subject');
SET @ddl = IF(@columns IS NOT NULL AND @columns <> 'exam_id,subject_id,paper_no', 'ALTER TABLE exam_subjects DROP INDEX uk_exam_subject', 'SELECT 1');
PREPARE stmt FROM @ddl; EXECUTE stmt; DEALLOCATE PREPARE stmt;
SET @ddl = IF((SELECT COUNT(*) FROM information_schema.statistics WHERE table_schema=DATABASE() AND table_name='exam_subjects' AND index_name='uk_exam_subject')=0,
  'ALTER TABLE exam_subjects ADD UNIQUE KEY uk_exam_subject (exam_id,subject_id,paper_no)', 'SELECT 1');
PREPARE stmt FROM @ddl; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @columns = (SELECT GROUP_CONCAT(column_name ORDER BY seq_in_index) FROM information_schema.statistics WHERE table_schema=DATABASE() AND table_name='teacher_subject_assignments' AND index_name='uk_teacher_subject');
SET @ddl = IF(@columns IS NOT NULL AND @columns <> 'employee_id,academic_year_id,batch_id,subject_id,paper_no', 'ALTER TABLE teacher_subject_assignments DROP INDEX uk_teacher_subject', 'SELECT 1');
PREPARE stmt FROM @ddl; EXECUTE stmt; DEALLOCATE PREPARE stmt;
SET @ddl = IF((SELECT COUNT(*) FROM information_schema.statistics WHERE table_schema=DATABASE() AND table_name='teacher_subject_assignments' AND index_name='uk_teacher_subject')=0,
  'ALTER TABLE teacher_subject_assignments ADD UNIQUE KEY uk_teacher_subject (employee_id,academic_year_id,batch_id,subject_id,paper_no)', 'SELECT 1');
PREPARE stmt FROM @ddl; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @columns = (SELECT GROUP_CONCAT(column_name ORDER BY seq_in_index) FROM information_schema.statistics WHERE table_schema=DATABASE() AND table_name='student_result_details' AND index_name='uk_student_result_details');
SET @ddl = IF(@columns IS NOT NULL AND @columns <> 'result_id,subject_id,paper_no', 'ALTER TABLE student_result_details DROP INDEX uk_student_result_details', 'SELECT 1');
PREPARE stmt FROM @ddl; EXECUTE stmt; DEALLOCATE PREPARE stmt;
SET @ddl = IF((SELECT COUNT(*) FROM information_schema.statistics WHERE table_schema=DATABASE() AND table_name='student_result_details' AND index_name='uk_student_result_details')=0,
  'ALTER TABLE student_result_details ADD UNIQUE KEY uk_student_result_details (result_id,subject_id,paper_no)', 'SELECT 1');
PREPARE stmt FROM @ddl; EXECUTE stmt; DEALLOCATE PREPARE stmt;

UPDATE subjects
SET paper_mode='FLEXIBLE'
WHERE subject_name REGEXP '[[:space:]]+(1st|2nd|First|Second)[[:space:]]+Paper$';
UPDATE class_subjects cs JOIN subjects s ON s.subject_id=cs.subject_id
SET cs.paper_no=CASE WHEN s.subject_name REGEXP '[[:space:]]+(1st|First)[[:space:]]+Paper$' THEN 1 WHEN s.subject_name REGEXP '[[:space:]]+(2nd|Second)[[:space:]]+Paper$' THEN 2 ELSE cs.paper_no END;
UPDATE exam_subjects es JOIN subjects s ON s.subject_id=es.subject_id
SET es.paper_no=CASE WHEN s.subject_name REGEXP '[[:space:]]+(1st|First)[[:space:]]+Paper$' THEN 1 WHEN s.subject_name REGEXP '[[:space:]]+(2nd|Second)[[:space:]]+Paper$' THEN 2 ELSE es.paper_no END;

-- Subject master is institution-neutral. Class assignment decides where and how a subject is used.
UPDATE subjects SET curriculum_type='ALL' WHERE canonical_subject_id IS NULL;
