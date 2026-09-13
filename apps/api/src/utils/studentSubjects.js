// Student assignments are saved per enrollment, including both papers of a subject.
export function needsStudentGroup(classLevel) {
  const level = Number(classLevel?.numeric_level);
  if (level) return level >= 9 && level <= 12;
  return /\b(9|10|11|12|ix|x|xi|xii|nine|ten|eleven|twelve|hsc)\b/i.test(
    `${classLevel?.class_code || ''} ${classLevel?.class_name || ''}`
  );
}

function invalid(message) {
  return Object.assign(new Error(message), { status: 400 });
}

export async function studentCurriculum(client, institutionId, classId, groupId, requireGroup = true) {
  const level = (await client.query(
    'SELECT * FROM sms.class_levels WHERE class_id=$1 AND institution_id=$2',
    [classId, institutionId]
  )).rows[0];
  if (!level) throw invalid('Select a class from the student institution.');
  const requiresGroup = needsStudentGroup(level);
  if (requiresGroup && !groupId && requireGroup) throw invalid('Group is required for Class 9, Class 10 and HSC.');
  const selectedGroup = requiresGroup ? (groupId || null) : null;
  if (selectedGroup) {
    const group = await client.query("SELECT group_id FROM sms.groups WHERE group_id=$1 AND institution_id=$2 AND status='ACTIVE'", [selectedGroup, institutionId]);
    if (!group.rows.length) throw invalid('Select an active group from the student institution.');
  }
  const rows = (await client.query(
    `SELECT cs.*,s.subject_code,s.subject_name,s.subject_name_bn
       FROM sms.class_subjects cs JOIN sms.subjects s ON s.subject_id=cs.subject_id
      WHERE cs.institution_id=$1 AND cs.class_id=$2 AND cs.status='ACTIVE' AND s.status='ACTIVE'
        AND (cs.group_id IS NULL OR cs.group_id=$3)
      ORDER BY cs.group_id IS NULL,cs.sort_order,cs.class_subject_id`,
    [institutionId, classId, selectedGroup]
  )).rows;
  // Keep mandatory class defaults even when a legacy optional group mapping overlaps.
  const unique = new Map();
  for (const row of rows) {
    const key = `${row.subject_id}:${Number(row.paper_no || 0)}`;
    if (!unique.has(key) || (row.assignment_type === 'MANDATORY' && unique.get(key).assignment_type !== 'MANDATORY')) unique.set(key, row);
  }
  const catalog = (await client.query(
    `SELECT subject_id,subject_code,subject_name,subject_name_bn,paper_mode,subject_type
       FROM sms.subjects WHERE institution_id=$1 AND status='ACTIVE' ORDER BY subject_name`, [institutionId]
  )).rows;
  return { requires_group: requiresGroup, group_id: selectedGroup, subjects: [...unique.values()], catalog };
}

export function selectStudentSubjects(rows, selections = [], catalog = []) {
  if (!Array.isArray(selections)) throw invalid('Subject selection must be a list.');
  const available = new Map(catalog.map(subject => [String(subject.subject_id), subject]));
  const assigned = new Map();
  // Class setup supplies required defaults only. All other choices come from the master list.
  for (const row of rows.filter(row => row.assignment_type === 'MANDATORY')) {
    assigned.set(`${row.subject_id}:${Number(row.paper_no || 0)}`, { ...row, assignment_type: 'MANDATORY' });
  }
  for (const selection of selections) {
    const object = selection !== null && typeof selection === 'object';
    const id = String(object ? selection.subject_id : selection);
    const subject = available.get(id);
    if (!subject) throw invalid('Select an active subject from the student institution.');
    // Accept old clients that send subject IDs, using their existing class paper definitions.
    const legacyRows = rows.filter(row => String(row.subject_id) === id);
    const choices = object ? [selection] : legacyRows.length ? legacyRows : [{ subject_id: subject.subject_id, paper_no: 0, assignment_type: 'OPTIONAL' }];
    for (const choice of choices) {
      const paper = Number(choice.paper_no ?? 0);
      const requestedType = choice.assignment_type || 'OPTIONAL';
      if (!['MANDATORY', 'OPTIONAL', 'FOURTH_SUBJECT'].includes(requestedType)) throw invalid('Choose Required, Optional or 4th subject.');
      const type = rows.some(row => String(row.subject_id) === id && row.assignment_type === 'MANDATORY') ? 'MANDATORY' : requestedType;
      if (![0, 1, 2].includes(paper) || (subject.paper_mode !== 'FLEXIBLE' && paper !== 0)) throw invalid('Invalid paper selection for this subject.');
      const key = `${id}:${paper}`;
      if (!assigned.has(key)) assigned.set(key, { ...subject, paper_no: paper, assignment_type: type });
      else if (assigned.get(key).assignment_type !== 'MANDATORY' && assigned.get(key).assignment_type !== type) throw invalid('Choose one category for each subject paper.');
    }
  }
  const result = [...assigned.values()];
  const fourth = new Set(result.filter(row => row.assignment_type === 'FOURTH_SUBJECT').map(row => String(row.subject_id)));
  if (fourth.size > 1) throw invalid('Select only one fourth subject. Both papers can be selected together.');
  for (const id of new Set(result.map(row => String(row.subject_id)))) {
    const papers = result.filter(row => String(row.subject_id) === id).map(row => Number(row.paper_no));
    if (papers.includes(0) && papers.some(paper => paper !== 0)) throw invalid('Use either a single paper or separate 1st/2nd papers for a subject.');
    const types = new Set(result.filter(row => String(row.subject_id) === id).map(row => row.assignment_type));
    if (types.size > 1) throw invalid('Both papers of a subject must use the same category.');
  }
  return result;
}

export async function saveStudentSubjects(client, enrollmentId, curriculum, selections) {
  if (selections === undefined) {
    selections = (await client.query('SELECT subject_id,paper_no,assignment_type FROM sms.student_subject_assignments WHERE enrollment_id=$1', [enrollmentId])).rows
      .filter(row => curriculum.catalog.some(subject => String(subject.subject_id) === String(row.subject_id)));
  }
  const subjects = selectStudentSubjects(curriculum.subjects, selections, curriculum.catalog);
  await client.query('DELETE FROM sms.student_subject_assignments WHERE enrollment_id=$1', [enrollmentId]);
  for (const subject of subjects) {
    await client.query(
      `INSERT INTO sms.student_subject_assignments (enrollment_id,subject_id,paper_no,assignment_type)
       VALUES ($1,$2,$3,$4)`,
      [enrollmentId, subject.subject_id, Number(subject.paper_no || 0), subject.assignment_type]
    );
  }
  await client.query('UPDATE sms.student_enrollments SET subjects_assigned=1 WHERE enrollment_id=$1', [enrollmentId]);
}

export async function getStudentSubjects(client, enrollmentId) {
  if (!enrollmentId) return [];
  return (await client.query(
    `SELECT sa.*,s.subject_name,s.subject_name_bn,s.subject_code
       FROM sms.student_subject_assignments sa JOIN sms.subjects s ON s.subject_id=sa.subject_id
      WHERE sa.enrollment_id=$1 ORDER BY sa.assignment_type,s.subject_name,sa.paper_no`, [enrollmentId]
  )).rows;
}
