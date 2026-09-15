<template>
  <div class="subject-picker" aria-live="polite">
    <div class="heading"><h4>Student subjects</h4><span v-if="classId">{{ assignedCount }} {{ assignedCount === 1 ? 'paper' : 'papers' }} selected</span></div>
    <p v-if="loading">Loading subjects…</p>
    <p v-else-if="error" class="error">{{ error }} <button type="button" @click="load">Retry</button></p>
    <p v-else-if="!classId">Select a class to choose subjects.</p>
    <p v-else-if="requiresGroup && !groupId">Select the student’s group first.</p>
    <template v-else>
      <p>Class mandatory subjects are included automatically. Add other subjects directly for this student.</p>
      <div v-if="automatic.length" class="automatic-subjects">
        <span v-for="row in automatic" :key="key(row)">{{ row.subject_name }} · {{ paperLabel(row.paper_no) }} <small>Auto · Required</small></span>
      </div>
      <p v-else class="muted">No automatic subjects for this class. Select the student’s subjects below.</p>
      <div class="subject-add">
        <BaseSelect :model-value="''" label="Add subject" :options="availableOptions" placeholder="Search the subject list…" @change="addSubject" />
        <small>Choose any active subject. Class assignment is not required.</small>
      </div>
      <p v-if="!catalog.length" class="muted">No active subjects found. Add subjects in Subject Entry.</p>
      <div class="selected-subjects">
        <div v-for="subject in selected" :key="subject.subject_id" class="selected-row">
          <div class="subject-name"><b>{{ subject.subject_name }}</b><small>{{ subject.subject_code }}</small></div>
          <label><span>Paper</span><select :value="subject.papers.join(',')" :aria-label="`Paper for ${subject.subject_name}`" @change="changePapers(subject, $event.target.value)"><option v-for="option in paperOptions(subject)" :key="option.value" :value="option.value">{{ option.label }}</option></select></label>
          <label><span>Category</span><select :value="subject.assignment_type" :disabled="hasAutomatic(subject.subject_id)" :aria-label="`Category for ${subject.subject_name}`" @change="changeType(subject, $event.target.value)"><option value="MANDATORY">Required</option><option value="OPTIONAL">Optional</option><option value="FOURTH_SUBJECT" :disabled="hasOtherFourth(subject.subject_id)">4th subject</option></select></label>
          <button type="button" class="remove" :aria-label="`Remove ${subject.subject_name}`" @click="removeSubject(subject.subject_id)">×</button>
        </div>
      </div>
      <small v-if="selected.length" class="muted">Choose at most one fourth subject. Use “Both papers” when needed.</small>
    </template>
  </div>
</template>

<script setup>
import { computed, ref, watch } from 'vue';
import api from '../../services/api';
import BaseSelect from '../common/BaseSelect.vue';
const props = defineProps({ institutionId: [String, Number], classId: [String, Number], groupId: [String, Number], modelValue: { type: Array, default: () => [] } });
const emit = defineEmits(['update:modelValue', 'requires-group', 'busy']);
const rows = ref([]), catalog = ref([]), loading = ref(false), error = ref(''), requiresGroup = ref(false);
let requestId = 0;
const key = row => `${row.subject_id}:${Number(row.paper_no || 0)}`;
const paperLabel = paper => ({ 0: 'Single paper', 1: '1st paper', 2: '2nd paper' })[Number(paper)];
const automatic = computed(() => rows.value.filter(row => row.assignment_type === 'MANDATORY'));
const automaticKeys = computed(() => new Set(automatic.value.map(key)));
const hasAutomatic = id => automatic.value.some(row => String(row.subject_id) === String(id));
const choices = computed(() => props.modelValue.flatMap(selection => {
  if (selection !== null && typeof selection === 'object') return [selection];
  const configured = rows.value.filter(row => String(row.subject_id) === String(selection));
  return configured.length ? configured : [{ subject_id: selection, paper_no: 0, assignment_type: 'OPTIONAL' }];
}).filter(row => !automaticKeys.value.has(key(row))));
const selected = computed(() => {
  const grouped = new Map();
  for (const row of choices.value) {
    const id = String(row.subject_id);
    if (!grouped.has(id)) grouped.set(id, { ...(catalog.value.find(subject => String(subject.subject_id) === id) || { subject_id: id, subject_name: 'Unavailable subject — remove to continue' }), papers: [], assignment_type: hasAutomatic(id) ? 'MANDATORY' : row.assignment_type });
    const subject = grouped.get(id);
    if (!subject.papers.includes(Number(row.paper_no || 0))) subject.papers.push(Number(row.paper_no || 0));
  }
  return [...grouped.values()].map(subject => ({ ...subject, papers: subject.papers.sort() }));
});
const assignedCount = computed(() => new Set([...automatic.value, ...choices.value].map(key)).size);
const availableOptions = computed(() => catalog.value.filter(subject => !selected.value.some(item => String(item.subject_id) === String(subject.subject_id)) && paperOptions(subject).length).map(subject => ({ value: subject.subject_id, label: `${subject.subject_code} · ${subject.subject_name}` })));
const hasOtherFourth = id => selected.value.some(subject => String(subject.subject_id) !== String(id) && subject.assignment_type === 'FOURTH_SUBJECT');
function paperOptions(subject) {
  const auto = automatic.value.filter(row => String(row.subject_id) === String(subject.subject_id)).map(row => Number(row.paper_no));
  if (auto.includes(0)) return [];
  if (subject.paper_mode !== 'FLEXIBLE') return auto.length ? [] : [{ value: '0', label: 'Single paper' }];
  const result = [];
  if (!auto.length) result.push({ value: '0', label: 'Single paper' });
  if (!auto.includes(1)) result.push({ value: '1', label: '1st paper' });
  if (!auto.includes(2)) result.push({ value: '2', label: '2nd paper' });
  if (!auto.length) result.push({ value: '1,2', label: 'Both papers' });
  return result;
}
function replaceSubject(id, papers, type) {
  const remaining = choices.value.filter(row => String(row.subject_id) !== String(id));
  emit('update:modelValue', [...remaining, ...papers.map(paper_no => ({ subject_id: id, paper_no, assignment_type: type }))]);
}
function addSubject(id) {
  const subject = catalog.value.find(item => String(item.subject_id) === String(id));
  if (!subject) return;
  const option = paperOptions(subject)[0];
  if (!option) return;
  replaceSubject(id, option.value.split(',').map(Number), 'MANDATORY');
}
function removeSubject(id) { replaceSubject(id, [], 'MANDATORY'); }
function changePapers(subject, value) { replaceSubject(subject.subject_id, value.split(',').map(Number), subject.assignment_type); }
function changeType(subject, value) { replaceSubject(subject.subject_id, subject.papers, value); }
async function load() {
  const current = ++requestId;
  rows.value = []; catalog.value = []; error.value = '';
  if (!props.institutionId || !props.classId) { loading.value = false; requiresGroup.value = false; emit('requires-group', false); emit('busy', false); return; }
  loading.value = true; emit('busy', true);
  try {
    const response = await api.get('/student-admissions/subject-options', { params: { institution_id: props.institutionId, class_id: props.classId, group_id: props.groupId || undefined } });
    if (current !== requestId) return;
    requiresGroup.value = response.data.data.requires_group;
    rows.value = response.data.data.subjects;
    catalog.value = response.data.data.catalog || [];
    emit('requires-group', requiresGroup.value);
  } catch (err) {
    if (current === requestId) error.value = err.response?.data?.message || 'Could not load subjects.';
  } finally {
    if (current === requestId) { loading.value = false; emit('busy', Boolean(error.value)); }
  }
}
watch(() => [props.institutionId, props.classId, props.groupId], load, { immediate: true });
</script>

<style scoped>
.subject-picker{margin-top:16px;padding-top:12px;border-top:1px dashed #e2e8f0}.heading{display:flex;justify-content:space-between;gap:12px}.heading h4{margin:0;font-size:14px;color:#1e293b}.heading span,small,p{font-size:12px;color:#64748b}p{margin:8px 0}.automatic-subjects{display:flex;gap:8px;flex-wrap:wrap;margin:12px 0}.automatic-subjects>span{border-radius:6px;padding:7px 10px;background:#f1f5f9;font-size:12px;color:#334155}.automatic-subjects small{margin-left:6px;color:#4f46e5;font-size:10px}.subject-add{display:flex;align-items:flex-end;gap:14px;margin:12px 0}.subject-add>:first-child{max-width:440px;flex:1}.subject-add>small{padding-bottom:10px}.selected-row{display:grid;grid-template-columns:minmax(140px,1fr) 140px 140px 28px;gap:12px;align-items:center;padding:10px 0;border-top:1px solid #f1f5f9}.subject-name b{display:block;font-size:13px;color:#334155}.subject-name small{display:block;margin-top:3px}.selected-row label{display:flex;flex-direction:column;gap:4px}.selected-row label span{font-size:10px;color:#94a3b8}.selected-row select{width:100%;height:32px;border:1px solid #dce3ed;border-radius:6px;background:#fff;color:#334155;font:inherit;font-size:12px}.remove{width:28px;height:28px;border:0;border-radius:5px;background:transparent;color:#94a3b8;font-size:20px;cursor:pointer}.remove:hover{background:#fff1f2;color:#e11d48}.error{color:#b91c1c}.muted{display:block}button:focus-visible,select:focus-visible{outline:2px solid #818cf8;outline-offset:2px}@media(max-width:650px){.subject-add{align-items:stretch;flex-direction:column;gap:6px}.subject-add>:first-child{max-width:none}.subject-add>small{padding-bottom:0}.selected-row{grid-template-columns:1fr 1fr 28px;gap:8px}.subject-name{grid-column:1 / -1}.selected-row select{max-width:100%}}
</style>
