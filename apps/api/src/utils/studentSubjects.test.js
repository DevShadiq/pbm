import test from 'node:test';
import assert from 'node:assert/strict';
import { needsStudentGroup, selectStudentSubjects, studentCurriculum, saveStudentSubjects } from './studentSubjects.js';
const catalog = [
  { subject_id: 1, paper_mode: 'FLEXIBLE' },
  { subject_id: 2, paper_mode: 'FLEXIBLE' },
  { subject_id: 3, paper_mode: 'SINGLE' },
  { subject_id: 4, paper_mode: 'SINGLE' },
];
const defaults = [
  { subject_id: 1, paper_no: 1, assignment_type: 'MANDATORY' },
  { subject_id: 1, paper_no: 2, assignment_type: 'MANDATORY' },
  { subject_id: 3, paper_no: 0, assignment_type: 'OPTIONAL' },
];
const choice = (id, paper = 0, type = 'MANDATORY') => ({ subject_id: id, paper_no: paper, assignment_type: type });
const select = (selections, rows = defaults) => selectStudentSubjects(rows, selections, catalog);

test('only classes 9–12 require groups, with class-name fallback', () => {
  for (let level = 1; level <= 13; level++) assert.equal(needsStudentGroup({ numeric_level: level }), level >= 9 && level <= 12);
  assert.ok(needsStudentGroup({ class_name: 'HSC 1st Year' }));
  assert.equal(needsStudentGroup({ class_name: 'Class Eight' }), false);
});
test('only mandatory class defaults are automatic', () => {
  assert.deepEqual(select([]).map(row => row.subject_id), [1, 1]);
});
test('students can choose master subjects without any class setup', () => {
  assert.deepEqual(select([choice(2, 1), choice(2, 2), choice(4, 0, 'FOURTH_SUBJECT')], []).map(row => row.subject_id), [2, 2, 4]);
});
test('class defaults and direct student choices save together without duplicate papers', () => {
  const result = select([choice(1, 1), choice(2, 0, 'OPTIONAL')]);
  assert.equal(result.length, 3);
  assert.equal(result.at(-1).assignment_type, 'OPTIONAL');
});
test('rejects subjects outside the active institution catalog', () => {
  assert.throws(() => select([choice(99)]), /active subject/);
  assert.throws(() => select('2'), /must be a list/);
});
test('validates papers, including mixed single and split papers and invalid categories', () => {
  assert.throws(() => select([choice(3, 1)]), /Invalid paper/);
  assert.throws(() => select([choice(2, 3)]), /Invalid paper/);
  assert.throws(() => select([choice(2, 0), choice(2, 1)]), /either a single paper/);
  assert.throws(() => select([choice(2, 0, 'OTHER')]), /Choose Required/);
});
test('both papers share a category and only one fourth subject is allowed', () => {
  assert.throws(() => select([choice(2, 1), choice(2, 2, 'FOURTH_SUBJECT')]), /same category/);
  assert.throws(() => select([choice(3, 0, 'FOURTH_SUBJECT'), choice(4, 0, 'FOURTH_SUBJECT')]), /only one fourth/);
  assert.equal(select([choice(2, 1, 'FOURTH_SUBJECT'), choice(2, 2, 'FOURTH_SUBJECT')]).length, 4);
});
test('legacy ID selections remain supported', () => {
  assert.equal(select([3]).at(-1).assignment_type, 'OPTIONAL');
  assert.equal(select([4]).at(-1).paper_no, 0);
});
test('required group is validated, while lower classes ignore stale groups', async () => {
  const high = { query: async sql => ({ rows: sql.includes('class_levels') ? [{ numeric_level: 9 }] : [] }) };
  await assert.rejects(studentCurriculum(high, 1, 9, null), /Group is required/);
  await assert.rejects(studentCurriculum(high, 1, 9, 22), /active group/);
  const lower = { query: async (sql, params) => {
    if (sql.includes('class_levels')) return { rows: [{ numeric_level: 8 }] };
    if (sql.includes('FROM sms.class_subjects')) { assert.equal(params[2], null); return { rows: [] }; }
    return { rows: catalog };
  } };
  const result = await studentCurriculum(lower, 1, 8, 999);
  assert.equal(result.group_id, null);
  assert.equal(result.catalog.length, 4);
  assert.equal(result.subjects.length, 0);
});
test('omitted choices retain saved paper/category; explicit empty selection removes manual subjects', async () => {
  const writes = [];
  const client = { query: async (sql, params) => { writes.push({ sql, params }); return { rows: sql.startsWith('SELECT') ? [choice(2, 1, 'FOURTH_SUBJECT'), choice(2, 2, 'FOURTH_SUBJECT'), choice(99)] : [] }; } };
  await saveStudentSubjects(client, 7, { subjects: defaults, catalog }, undefined);
  const inserted = writes.filter(row => row.sql.includes('INSERT'));
  assert.equal(inserted.length, 4);
  assert.deepEqual(inserted.at(-1).params, [7, 2, 2, 'FOURTH_SUBJECT']);
  writes.length = 0;
  await saveStudentSubjects(client, 7, { subjects: defaults, catalog }, []);
  assert.equal(writes.filter(row => row.sql.includes('INSERT')).length, 2);
});

test('common mandatory defaults are not hidden by legacy optional group mappings', async () => {
  const client = { query: async sql => {
    if (sql.includes('class_levels')) return { rows: [{ numeric_level: 9 }] };
    if (sql.includes('SELECT group_id')) return { rows: [{ group_id: 2 }] };
    if (sql.includes('FROM sms.class_subjects')) return { rows: [
      { subject_id: 1, paper_no: 1, assignment_type: 'OPTIONAL', group_id: 2 },
      { subject_id: 1, paper_no: 1, assignment_type: 'MANDATORY', group_id: null },
    ] };
    return { rows: catalog };
  } };
  const curriculum = await studentCurriculum(client, 1, 9, 2);
  assert.equal(selectStudentSubjects(curriculum.subjects, [], curriculum.catalog).length, 1);
});
