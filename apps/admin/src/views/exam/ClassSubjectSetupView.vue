<template>
  <section class="curriculum-page">
    <header class="hero">
      <div>
        <span class="eyebrow">ACADEMIC MASTER SETUP</span>
        <h1>Class defaults & exam method</h1>
        <p>{{ curriculumNote }}</p>
      </div>
      <div class="hero-actions">
        <div class="lock-state" :class="{ locked: policy.is_locked }">
          <span class="lock-icon">{{ policy.is_locked ? '●' : '○' }}</span>
          <div><b>{{ policy.is_locked ? 'Curriculum locked' : 'Curriculum editable' }}</b><small>{{ policy.is_locked ? 'Subject setup is protected' : 'Changes are currently allowed' }}</small></div>
        </div>
        <button v-if="canManageLock" class="ghost" :disabled="policyBusy" @click="togglePolicyLock">{{ policy.is_locked ? 'Unlock setup' : 'Lock setup' }}</button>
        <button :disabled="!classId || policy.is_locked" @click="openAssign">+ Assign subject</button>
      </div>
    </header>

    <p v-if="msg" :class="['notice', kind]">{{ msg }}</p>

    <section class="summary-grid">
      <article><span>Assigned subjects</span><strong>{{ scopeRows.length }}</strong><small>{{ scopeSummary }}</small></article>
      <article><span>Mandatory</span><strong>{{ countType('MANDATORY') }}</strong><small>Result determining</small></article>
      <article><span>Optional</span><strong>{{ countType('OPTIONAL') }}</strong><small>Student choice</small></article>
      <article><span>4th subjects</span><strong>{{ countType('FOURTH_SUBJECT') }}</strong><small>Additional GPA rule</small></article>
    </section>

    <section class="toolbar-card">
      <BaseSelect v-model="classId" label="Class / শ্রেণি" :options="classOptions" placeholder="Select a class" @change="changeClass" />
      <label v-if="supportsGroups" class="native-field">Curriculum group
        <select v-model="scopeFilter"><option value="ALL">All groups & common</option><option value="COMMON">Common subjects only</option><option v-for="group in groups" :key="group.group_id" :value="String(group.group_id)">{{ groupLabel(group) }}</option></select>
      </label>
      <label class="search-field">Search assigned subject
        <span><svg viewBox="0 0 20 20" aria-hidden="true"><circle cx="8.5" cy="8.5" r="4.5"/><path d="m12 12 4 4"/></svg><input v-model.trim="search" type="search" placeholder="Code, English or Bangla name" /></span>
      </label>
      <label class="native-field">Assignment type
        <select v-model="typeFilter"><option value="">All types</option><option value="MANDATORY">Mandatory</option><option v-if="editing && f.assignment_type !== 'MANDATORY'" :value="f.assignment_type">{{ typeLabel(f.assignment_type) }} (existing setup)</option></select>
      </label>
    </section>

    <section class="table-card">
      <div class="table-heading">
        <div><h2>Subject distribution</h2><p>Class-specific subject role এবং Written, MCQ, Practical, Viva marks.</p></div>
        <span>{{ filteredRows.length }} item{{ filteredRows.length === 1 ? '' : 's' }}</span>
      </div>
      <div class="table-wrap">
        <table>
          <thead><tr><th>Order</th><th>Subject</th><th>Scope</th><th>Category</th><th>Exam methods</th><th>Marks</th><th>Status</th><th class="right">Action</th></tr></thead>
          <tbody>
            <tr v-for="row in filteredRows" :key="row.class_subject_id">
              <td><span class="order">{{ row.sort_order || 0 }}</span></td>
              <td><b>{{ row.subject_name }}{{ paperLabel(row.paper_no) }}</b><small>{{ row.subject_name_bn || row.subject_code }}<template v-if="row.paper_no"> · {{ paperLabelBn(row.paper_no) }}</template></small></td>
              <td><span class="scope-pill" :class="{ common: !row.group_id }">{{ row.group_name || 'Common' }}</span></td>
              <td><span class="type-pill" :class="typeClass(normalizedType(row))">{{ typeLabel(normalizedType(row)) }}</span></td>
              <td><div class="method-list"><span v-for="method in activeMethods(row)" :key="method.code">{{ method.label }} <b>{{ method.full }}</b></span><em v-if="!activeMethods(row).length">Not configured</em></div></td>
              <td><b>{{ assessmentTotal(row) }}</b><small>Pass {{ componentPassTotal(row) }}</small></td>
              <td><span class="status-pill" :class="{ locked: row.is_locked || policy.is_locked }">{{ row.is_locked || policy.is_locked ? 'Locked' : 'Active' }}</span></td>
              <td class="right"><button class="row-action" :disabled="policy.is_locked || row.is_locked" @click="openEdit(row)">Edit</button><button class="row-action danger" :disabled="policy.is_locked || row.is_locked" @click="remove(row)">Remove</button></td>
            </tr>
            <tr v-if="classId && !filteredRows.length"><td colspan="8" class="empty"><div>📚</div><b>No matching subject</b><small>Assign a common or group-wise subject, or change the filters.</small></td></tr>
            <tr v-else-if="!classId"><td colspan="8" class="empty"><div>↖</div><b>Select a class first</b><small>The assigned curriculum will appear here.</small></td></tr>
          </tbody>
        </table>
      </div>
    </section>

    <div v-if="modal" class="backdrop" role="presentation">
      <form class="modal" @submit.prevent="assign">
        <div class="modal-head"><div><span class="eyebrow">CLASS CURRICULUM</span><h2>{{ editing ? 'Modify subject setup' : 'Assign a subject' }}</h2><p>Set the class-specific role and examination breakdown.</p></div><button class="close" type="button" aria-label="Close" @click="closeModal">×</button></div>

        <div class="form-grid">
          <label>Applies to<select v-model="f.group_id" :disabled="Boolean(editing) || !supportsGroups" @change="changeAssignmentGroup"><option value="">Common / সব group</option><option v-for="group in groups" :key="group.group_id" :value="String(group.group_id)">{{ groupLabel(group) }}</option></select><small>{{ supportsGroups ? 'Common রাখলে সব group-এর শিক্ষার্থীর জন্য প্রযোজ্য' : 'Group setup শুধু Class 9–12-এর জন্য' }}</small></label>
          <BaseSelect v-model="f.subject_id" label="Subject" :options="subjectOptions" :disabled="Boolean(editing)" placeholder="Select active subject" required @change="applySubjectDefaults" />
          <label>Paper<select v-model.number="f.paper_no" required><option v-for="option in paperOptions" :key="option.value" :value="option.value">{{ option.label }}</option></select><small v-if="selectedSubject.paper_mode === 'FLEXIBLE'">১ম পত্র save করার পর একই subject আবার assign করে ২য় পত্র দিন</small></label>
          <label>Subject category<select v-model="f.assignment_type" required><option value="MANDATORY">Mandatory</option><option v-if="editing && f.assignment_type !== 'MANDATORY'" :value="f.assignment_type">{{ typeLabel(f.assignment_type) }} (existing setup)</option></select></label>
          <label>Display order<input v-model.number="f.sort_order" type="number" min="0" /></label>
        </div>

        <div class="scheme-head"><div><h3>Exam method & marks distribution</h3><p>Enable only the methods used for this class and subject.</p></div><span :class="{ invalid: !schemeValid }">{{ schemeTotal }} / {{ selectedFullMarks }}</span></div>
        <div class="component-grid">
          <article v-for="method in methodDefinitions" :key="method.code" :class="{ active: Number(f[method.fullKey]) > 0 }">
            <div class="component-title"><span>{{ method.short }}</span><div><b>{{ method.label }}</b><small>{{ method.bn }}</small></div></div>
            <label>Full marks<input v-model.number="f[method.fullKey]" type="number" min="0" step="0.01" @input="fitPass(method)" /></label>
            <label>Pass marks<input v-model.number="f[method.passKey]" type="number" min="0" step="0.01" :max="Number(f[method.fullKey])" /></label>
          </article>
        </div>
        <p v-if="!schemeValid" class="validation">Component full marks must equal subject full marks ({{ selectedFullMarks }}), and each pass mark cannot exceed its full mark.</p>

        <div class="modal-actions"><button class="ghost" type="button" @click="closeModal">Cancel</button><button :disabled="saving || !schemeValid">{{ saving ? 'Saving…' : 'Save assignment' }}</button></div>
      </form>
    </div>
  </section>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue';
import api from '../../services/api';
import { confirmAction, notify } from '../../services/notification';
import { withPreservedScroll } from '../../utils/preserveScroll';
import BaseSelect from '../../components/common/BaseSelect.vue';

const methodDefinitions = [
  { code: 'WRITTEN', label: 'Written', bn: 'লিখিত', short: 'W', fullKey: 'written_marks', passKey: 'written_pass_marks' },
  { code: 'MCQ', label: 'MCQ', bn: 'বহুনির্বাচনী', short: 'M', fullKey: 'mcq_marks', passKey: 'mcq_pass_marks' },
  { code: 'PRACTICAL', label: 'Practical', bn: 'ব্যবহারিক', short: 'P', fullKey: 'practical_marks', passKey: 'practical_pass_marks' },
  { code: 'VIVA', label: 'Viva', bn: 'মৌখিক', short: 'V', fullKey: 'viva_marks', passKey: 'viva_pass_marks' },
];
const classes = ref([]), groups = ref([]), subjects = ref([]), rows = ref([]), classId = ref(''), scopeFilter = ref('ALL'), modal = ref(false), editing = ref(null), msg = ref(''), kind = ref('success'), search = ref(''), typeFilter = ref(''), saving = ref(false), policyBusy = ref(false);
const policy = reactive({ is_locked: false, locked_at: null, locked_by: null });
const currentUser = (() => { try { return JSON.parse(localStorage.getItem('sms_user') || '{}'); } catch { return {}; } })();
const canManageLock = Boolean(currentUser.is_super_admin || currentUser.isSuperAdmin);
const blankForm = () => ({ group_id: '', subject_id: '', paper_no: 0, sort_order: 0, assignment_type: 'MANDATORY', written_marks: 100, written_pass_marks: 33, mcq_marks: 0, mcq_pass_marks: 0, practical_marks: 0, practical_pass_marks: 0, viva_marks: 0, viva_pass_marks: 0, is_locked: false });
const f = reactive(blankForm());

const curriculumNote = 'Set common and mandatory subjects here to assign automatically when a student profile is saved. Select other subjects directly on each student profile.';
const selectedClass = computed(() => classes.value.find((item) => String(item.class_id) === String(classId.value)) || {});
const supportsGroups = computed(() => Number(selectedClass.value.numeric_level) >= 9 && Number(selectedClass.value.numeric_level) <= 12);
const groupLabel = (group) => group.group_name_bn ? `${group.group_name} · ${group.group_name_bn}` : group.group_name;
const sameGroup = (row, groupId) => String(row.group_id || '') === String(groupId || '');
const scopeRows = computed(() => {
  if (!supportsGroups.value || scopeFilter.value === 'COMMON') return rows.value.filter((row) => !row.group_id);
  if (scopeFilter.value === 'ALL') return rows.value;
  return rows.value.filter((row) => !row.group_id || String(row.group_id) === String(scopeFilter.value));
});
const scopeSummary = computed(() => {
  if (!supportsGroups.value || scopeFilter.value === 'COMMON') return 'Common subjects';
  if (scopeFilter.value === 'ALL') return 'All curriculum scopes';
  return groups.value.find((group) => String(group.group_id) === String(scopeFilter.value))?.group_name || 'Selected group';
});
const available = computed(() => subjects.value.filter((subject) => {
  const assignedPapers = rows.value.filter((row) => String(row.subject_id) === String(subject.subject_id) && sameGroup(row, f.group_id)).map((row) => Number(row.paper_no || 0));
  if (subject.paper_mode !== 'FLEXIBLE') return !assignedPapers.includes(0);
  if (assignedPapers.includes(0)) return true;
  return !assignedPapers.includes(1) || !assignedPapers.includes(2);
}));
const classOptions = computed(() => classes.value.map((item) => ({ value: item.class_id, label: item.class_name_bn ? `${item.class_name_bn} · ${item.class_name}` : item.class_name })));
const subjectOptions = computed(() => (editing.value ? [editing.value] : available.value).map((subject) => ({ value: subject.subject_id, label: `${subject.subject_code} — ${subject.subject_name}${subject.paper_mode === 'FLEXIBLE' ? ' · Paper selectable' : ''}${subject.subject_name_bn ? ` · ${subject.subject_name_bn}` : ''}` })));
const filteredRows = computed(() => scopeRows.value.filter((row) => {
  const haystack = `${row.subject_code || ''} ${row.subject_name || ''} ${row.subject_name_bn || ''}`.toLowerCase();
  return (!search.value || haystack.includes(search.value.toLowerCase())) && (!typeFilter.value || normalizedType(row) === typeFilter.value);
}));
const selectedSubject = computed(() => subjects.value.find((subject) => String(subject.subject_id) === String(f.subject_id)) || editing.value || {});
const paperOptions = computed(() => {
  if (selectedSubject.value.paper_mode !== 'FLEXIBLE') return [{ value: 0, label: 'Single paper / একক পত্র' }];
  const used = rows.value
    .filter((row) => String(row.subject_id) === String(f.subject_id) && sameGroup(row, f.group_id) && String(row.class_subject_id) !== String(editing.value?.class_subject_id || ''))
    .map((row) => Number(row.paper_no || 0));
  if (!editing.value && used.includes(0)) {
    return [{ value: 2, label: '2nd Paper / ২য় পত্র (বর্তমানটি ১ম পত্র হবে)' }];
  }
  const candidates = used.some((value) => value === 1 || value === 2) ? [{ value: 1, label: '1st Paper / ১ম পত্র' }, { value: 2, label: '2nd Paper / ২য় পত্র' }] : [{ value: 0, label: 'Single paper / একক পত্র' }, { value: 1, label: '1st Paper / ১ম পত্র' }, { value: 2, label: '2nd Paper / ২য় পত্র' }];
  const availablePapers = candidates.filter((option) => !used.includes(option.value));
  if (editing.value && !availablePapers.some((option) => option.value === Number(f.paper_no))) {
    availablePapers.unshift({ value: Number(f.paper_no || 0), label: Number(f.paper_no) === 1 ? '1st Paper / ১ম পত্র' : Number(f.paper_no) === 2 ? '2nd Paper / ২য় পত্র' : 'Single paper / একক পত্র' });
  }
  return availablePapers;
});
const selectedFullMarks = computed(() => Number(selectedSubject.value.full_marks || 100));
const schemeTotal = computed(() => methodDefinitions.reduce((sum, method) => sum + Number(f[method.fullKey] || 0), 0));
const schemeValid = computed(() => Math.abs(schemeTotal.value - selectedFullMarks.value) < 0.001 && methodDefinitions.every((method) => Number(f[method.fullKey] || 0) >= 0 && Number(f[method.passKey] || 0) >= 0 && Number(f[method.passKey] || 0) <= Number(f[method.fullKey] || 0)));

function normalizedType(row) { return row.assignment_type || (Number(row.is_mandatory) ? 'MANDATORY' : (row.subject_type === 'FOURTH_SUBJECT' ? 'FOURTH_SUBJECT' : 'OPTIONAL')); }
function typeLabel(value) { return ({ MANDATORY: 'Mandatory', OPTIONAL: 'Optional', FOURTH_SUBJECT: '4th Subject' })[value] || value; }
function typeClass(value) { return String(value || '').toLowerCase(); }
function countType(value) { return scopeRows.value.filter((row) => normalizedType(row) === value).length; }
function activeMethods(row) { return methodDefinitions.filter((method) => Number(row[method.fullKey] || 0) > 0).map((method) => ({ code: method.code, label: method.label, full: Number(row[method.fullKey]) })); }
function assessmentTotal(row) { return methodDefinitions.reduce((sum, method) => sum + Number(row[method.fullKey] || 0), 0); }
function componentPassTotal(row) { return methodDefinitions.reduce((sum, method) => sum + Number(row[method.passKey] || 0), 0); }
function paperLabel(value) { return Number(value) === 1 ? ' — 1st Paper' : Number(value) === 2 ? ' — 2nd Paper' : ''; }
function paperLabelBn(value) { return Number(value) === 1 ? '১ম পত্র' : Number(value) === 2 ? '২য় পত্র' : ''; }
function fitPass(method) { if (Number(f[method.passKey]) > Number(f[method.fullKey])) f[method.passKey] = Number(f[method.fullKey] || 0); }
function applySubjectDefaults(subjectId = f.subject_id) {
  const subject = subjects.value.find((item) => String(item.subject_id) === String(subjectId));
  if (!subject?.subject_id) return;
  const assignedPapers = rows.value.filter((row) => String(row.subject_id) === String(subject.subject_id) && sameGroup(row, f.group_id)).map((row) => Number(row.paper_no || 0));
  const defaultPaper = subject.paper_mode === 'FLEXIBLE'
    ? (assignedPapers.includes(0) ? 2 : ([1, 2].find((paper) => !assignedPapers.includes(paper)) ?? 0))
    : 0;
  Object.assign(f, {
    paper_no: defaultPaper,
    assignment_type: 'MANDATORY',
    written_marks: Number(subject.written_marks ?? subject.full_marks ?? 100),
    written_pass_marks: Number(subject.written_pass_marks ?? subject.pass_marks ?? 33),
    mcq_marks: Number(subject.mcq_marks || 0), mcq_pass_marks: Number(subject.mcq_pass_marks || 0),
    practical_marks: Number(subject.practical_marks || 0), practical_pass_marks: Number(subject.practical_pass_marks || 0),
    viva_marks: Number(subject.viva_marks || 0), viva_pass_marks: Number(subject.viva_pass_marks || 0),
  });
  if (schemeTotal.value !== Number(subject.full_marks || 100)) f.written_marks += Number(subject.full_marks || 100) - schemeTotal.value;
}
function changeClass() { scopeFilter.value = 'ALL'; load(); }
function changeAssignmentGroup() { const groupId = f.group_id; Object.assign(f, blankForm(), { group_id: groupId }); }
function openAssign() { editing.value = null; const groupId = supportsGroups.value && !['ALL', 'COMMON'].includes(scopeFilter.value) ? scopeFilter.value : ''; Object.assign(f, blankForm(), { group_id: groupId }); modal.value = true; }
function openEdit(row) { editing.value = row; Object.assign(f, blankForm(), row, { group_id: row.group_id ? String(row.group_id) : '', assignment_type: normalizedType(row), is_locked: Boolean(Number(row.is_locked)) }); modal.value = true; }
function closeModal() { modal.value = false; editing.value = null; }
async function load() { rows.value = classId.value ? ((await api.get(`/exams/classes/${classId.value}/subjects`)).data.data || []) : []; }
async function loadPolicy() { try { Object.assign(policy, (await api.get('/exams/subject-policy')).data.data || {}); } catch { Object.assign(policy, { is_locked: false }); } }
async function togglePolicyLock() {
  const next = !policy.is_locked;
  if (next && !await confirmAction({ title: 'Lock curriculum setup?', message: 'Subject and class-assignment changes will be protected until this setup is unlocked.', confirmText: 'Lock setup', type: 'warning' })) return;
  try { policyBusy.value = true; const response = await api.put('/exams/subject-policy', { is_locked: next }); Object.assign(policy, response.data.data || { is_locked: next }); notify.success(next ? 'Curriculum setup locked.' : 'Curriculum setup unlocked.'); }
  catch (error) { notify.error(error.response?.data?.message || 'Could not change curriculum lock.'); }
  finally { policyBusy.value = false; }
}
async function assign() {
  if (!schemeValid.value) return;
  try {
    saving.value = true;
    const payload = { ...f, group_id: f.group_id || null, is_mandatory: f.assignment_type === 'MANDATORY' };
    if (editing.value) await api.put(`/exams/class-subjects/${editing.value.class_subject_id}`, payload);
    else await api.post(`/exams/classes/${classId.value}/subjects`, payload);
    closeModal(); msg.value = 'Class subject and exam method saved successfully.'; kind.value = 'success'; notify.success(msg.value); await load();
  } catch (error) { msg.value = error.response?.data?.message || 'Could not save the class subject.'; kind.value = 'error'; notify.error(msg.value); }
  finally { saving.value = false; }
}
async function remove(row) {
  if (!await confirmAction({ title: 'Remove class subject?', message: `${row.subject_name} will no longer be assigned to this class. Existing exam records will remain.`, confirmText: 'Remove subject' })) return;
  try { await api.delete(`/exams/class-subjects/${row.class_subject_id}`); notify.success('Class subject removed.'); await withPreservedScroll(load); }
  catch (error) { msg.value = error.response?.data?.message || 'Could not remove the subject.'; kind.value = 'error'; notify.error(msg.value); }
}
onMounted(async () => {
  try { const data = (await api.get('/exams/lookups')).data.data; classes.value = data.classes || []; groups.value = data.groups || []; subjects.value = data.subjects || []; await loadPolicy(); }
  catch (error) { msg.value = error.response?.data?.message || 'Could not load curriculum setup.'; kind.value = 'error'; }
});
</script>

<style scoped>
.curriculum-page{display:grid;gap:18px;color:#172033}.hero{display:flex;align-items:center;justify-content:space-between;gap:22px;padding:23px 24px;border:1px solid #dfe7f2;border-radius:18px;background:linear-gradient(135deg,#f8faff 0%,#eef6ff 55%,#fff 100%)}.eyebrow{display:block;margin-bottom:5px;color:#4f46e5;font-size:10px;font-weight:900;letter-spacing:.13em}.hero h1{margin:0;font-size:25px;letter-spacing:-.035em}.hero p,.table-heading p,.modal-head p,.scheme-head p{margin:6px 0 0;color:#64748b;font-size:13px}.hero-actions{display:flex;align-items:center;gap:9px}.lock-state{display:flex;align-items:center;gap:9px;margin-right:3px;padding:8px 11px;border:1px solid #bbf7d0;border-radius:11px;background:#f0fdf4;color:#166534}.lock-state.locked{border-color:#fed7aa;background:#fff7ed;color:#9a3412}.lock-icon{font-size:14px}.lock-state b,.lock-state small{display:block;font-size:11px}.lock-state small{margin-top:2px;color:inherit;opacity:.72}.hero button,.modal button{padding:10px 13px;border:0;border-radius:9px;background:#4f46e5;color:#fff;font:inherit;font-size:13px;font-weight:800;cursor:pointer}.hero button:disabled,.modal button:disabled,.row-action:disabled{cursor:not-allowed;opacity:.45}.ghost{border:1px solid #cbd5e1!important;background:#fff!important;color:#334155!important}.notice{margin:0;padding:11px 13px;border-radius:10px;font-size:13px;font-weight:700}.notice.success{background:#ecfdf5;color:#047857}.notice.error{background:#fff1f2;color:#be123c}.summary-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:12px}.summary-grid article{padding:16px 17px;border:1px solid #e3eaf4;border-radius:14px;background:#fff}.summary-grid span,.summary-grid small{display:block;color:#64748b;font-size:11px}.summary-grid strong{display:block;margin:7px 0 4px;font-size:25px}.toolbar-card{display:grid;grid-template-columns:minmax(230px,.9fr) minmax(260px,1.2fr) 210px;gap:12px;align-items:end;padding:15px;border:1px solid #e3eaf4;border-radius:14px;background:#fff}.search-field,.native-field,.form-grid>label,.component-grid label{display:grid;gap:7px;color:#334155;font-size:12px;font-weight:750}.search-field>span{position:relative}.search-field svg{position:absolute;top:50%;left:12px;width:16px;fill:none;stroke:#94a3b8;stroke-width:1.8;transform:translateY(-50%)}input,select{width:100%;height:46px;padding:0 12px;border:1px solid #d7e0ec;border-radius:10px;outline:none;background:#fff;color:#172033;font:inherit;box-sizing:border-box}.search-field input{padding-left:36px}input:focus,select:focus{border-color:#6366f1;box-shadow:0 0 0 3px rgba(99,102,241,.1)}.table-card{overflow:hidden;border:1px solid #e3eaf4;border-radius:15px;background:#fff}.table-heading{display:flex;align-items:center;justify-content:space-between;padding:17px 18px;border-bottom:1px solid #edf1f6}.table-heading h2,.modal h2,.scheme-head h3{margin:0;font-size:16px}.table-heading>span{padding:5px 9px;border-radius:999px;background:#f1f5f9;color:#475569;font-size:11px;font-weight:800}.table-wrap{overflow:auto}table{width:100%;border-collapse:collapse}th,td{padding:12px 13px;border-bottom:1px solid #edf1f6;text-align:left;font-size:12px;vertical-align:middle}th{background:#f8fafc;color:#64748b;font-size:9px;font-weight:900;letter-spacing:.08em;text-transform:uppercase;white-space:nowrap}td b,td small{display:block}td small{margin-top:4px;color:#64748b}.right{text-align:right}.order{display:grid;width:27px;height:27px;place-items:center;border-radius:8px;background:#f1f5f9;color:#475569;font-weight:800}.type-pill,.status-pill{display:inline-flex;padding:4px 8px;border-radius:999px;background:#e0f2fe;color:#075985;font-size:10px;font-weight:900}.type-pill.optional{background:#fef3c7;color:#92400e}.type-pill.fourth_subject{background:#f3e8ff;color:#7e22ce}.status-pill{background:#dcfce7;color:#166534}.status-pill.locked{background:#ffedd5;color:#9a3412}.method-list{display:flex;flex-wrap:wrap;gap:5px;min-width:180px}.method-list span{padding:4px 7px;border-radius:6px;background:#eef2ff;color:#4338ca;font-size:10px}.method-list span b{display:inline}.method-list em{color:#94a3b8;font-size:11px}.row-action{padding:5px;border:0;background:transparent;color:#4f46e5;font:inherit;font-size:11px;font-weight:800;cursor:pointer}.row-action.danger{color:#dc2626}.empty{padding:38px!important;text-align:center;color:#64748b}.empty div{margin-bottom:8px;font-size:25px}.empty b,.empty small{display:block}.backdrop{position:fixed;inset:0;z-index:1000;display:grid;place-items:center;padding:18px;background:rgba(15,23,42,.58);backdrop-filter:blur(3px)}.modal{width:min(840px,100%);max-height:92vh;overflow:auto;padding:22px;border-radius:18px;background:#fff;box-shadow:0 26px 70px rgba(15,23,42,.28)}.modal-head,.scheme-head,.modal-actions{display:flex;align-items:flex-start;justify-content:space-between;gap:16px}.close{padding:0!important;width:34px;height:34px;background:#eef2f7!important;color:#475569!important;font-size:22px!important}.form-grid{display:grid;grid-template-columns:2fr 1fr .7fr;gap:12px;margin-top:18px}.scheme-head{align-items:center;margin:22px 0 11px;padding-top:18px;border-top:1px solid #e5eaf3}.scheme-head>span{padding:6px 10px;border-radius:8px;background:#dcfce7;color:#166534;font-size:12px;font-weight:900}.scheme-head>span.invalid{background:#fee2e2;color:#b91c1c}.component-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:10px}.component-grid article{padding:12px;border:1px solid #e3eaf4;border-radius:12px;background:#fafcff}.component-grid article.active{border-color:#c7d2fe;background:#f6f7ff}.component-title{display:flex;align-items:center;gap:8px;margin-bottom:12px}.component-title>span{display:grid;width:31px;height:31px;place-items:center;border-radius:9px;background:#e0e7ff;color:#4338ca;font-weight:900}.component-title b,.component-title small{display:block;font-size:11px}.component-title small{margin-top:2px;color:#64748b}.component-grid label+label{margin-top:8px}.component-grid input{height:39px}.validation{margin:10px 0 0;color:#b91c1c;font-size:11px;font-weight:700}.modal-actions{justify-content:flex-end;margin-top:19px;padding-top:16px;border-top:1px solid #e5eaf3}@media(max-width:1050px){.hero{align-items:flex-start;flex-direction:column}.hero-actions{width:100%;flex-wrap:wrap}.summary-grid{grid-template-columns:repeat(2,1fr)}.component-grid{grid-template-columns:repeat(2,1fr)}}@media(max-width:720px){.hero{padding:18px}.hero-actions{align-items:stretch;flex-direction:column}.lock-state{margin:0}.summary-grid,.toolbar-card,.form-grid,.component-grid{grid-template-columns:1fr}.table-heading{align-items:flex-start;flex-direction:column}.modal{padding:17px}.scheme-head{align-items:flex-start}.curriculum-page{gap:14px}}
.toolbar-card{grid-template-columns:repeat(auto-fit,minmax(210px,1fr))}.scope-pill{display:inline-flex;padding:4px 8px;border-radius:999px;background:#dbeafe;color:#1d4ed8;font-size:10px;font-weight:900}.scope-pill.common{background:#f1f5f9;color:#475569}.form-grid>label small{color:#94a3b8;font-size:9px;font-weight:550}
</style>
