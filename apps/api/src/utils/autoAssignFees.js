/**
 * Create the default fee assignments for matching active enrolments.
 *
 * A class-wise structure is the source of truth.  Assignments are still kept
 * per enrolment so invoices and individual waivers continue to work, but no
 * member of staff needs to create those assignments one by one.
 */
export async function assignStructureToMatchingEnrollments(client, structure, assignedBy = null) {
  const result = await client.query(
    `INSERT INTO sms.student_fee_assignments
      (student_id, enrollment_id, fee_structure_id, discount_percent, discount_amount, reason, status, assigned_by)
      SELECT se.student_id, se.enrollment_id, $1, 0, 0, 'Automatically assigned from class-wise fee structure', 'ACTIVE', $2
      FROM sms.student_enrollments se
      JOIN sms.students s ON s.student_id = se.student_id
      WHERE se.branch_id = $3
        AND se.academic_year_id = $4
        AND se.class_id = $5
        AND se.enrollment_status = 'ACTIVE'
        AND s.status = 'ACTIVE'
        AND ($6 IS NULL OR se.group_id = $6)
        AND ($7 IS NULL OR se.medium_id = $7)
      ON DUPLICATE KEY UPDATE status = 'ACTIVE', assigned_by = VALUES(assigned_by), assigned_at = CURRENT_TIMESTAMP`,
    [
      structure.fee_structure_id,
      assignedBy,
      structure.branch_id,
      structure.academic_year_id,
      structure.class_id,
      structure.group_id || null,
      structure.medium_id || null,
    ],
  );

  return result.rowCount || 0;
}

/**
 * Give a newly created or updated active enrolment every active structure that
 * applies to its class.  The effective period is evaluated against the
 * enrolment start date so an expired structure is not added to a new student.
 */
export async function assignApplicableStructuresToEnrollment(client, { studentId, enrollmentId, assignedBy = null }) {
  const result = await client.query(
    `INSERT INTO sms.student_fee_assignments
      (student_id, enrollment_id, fee_structure_id, discount_percent, discount_amount, reason, status, assigned_by)
      SELECT se.student_id, se.enrollment_id, fs.fee_structure_id, 0, 0,
        'Automatically assigned from class-wise fee structure', 'ACTIVE', $3
      FROM sms.student_enrollments se
      JOIN sms.students s ON s.student_id = se.student_id
      JOIN sms.fee_structures fs ON fs.branch_id = se.branch_id
        AND fs.academic_year_id = se.academic_year_id
        AND fs.class_id = se.class_id
        AND (fs.group_id IS NULL OR fs.group_id = se.group_id)
        AND (fs.medium_id IS NULL OR fs.medium_id = se.medium_id)
        AND fs.status = 'ACTIVE'
        AND fs.effective_from <= COALESCE(se.start_date, CURRENT_DATE)
        AND (fs.effective_to IS NULL OR fs.effective_to >= COALESCE(se.start_date, CURRENT_DATE))
      WHERE se.student_id = $1
        AND se.enrollment_id = $2
        AND se.enrollment_status = 'ACTIVE'
        AND s.status = 'ACTIVE'
      ON DUPLICATE KEY UPDATE assignment_id = assignment_id`,
    [studentId, enrollmentId, assignedBy],
  );

  return result.rowCount || 0;
}
