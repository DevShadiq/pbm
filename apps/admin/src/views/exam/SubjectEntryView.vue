<template>
  <section class="page">
    <header>
      <div><small>ACADEMIC CURRICULUM</small><h1>Subjects</h1><p>{{ institutionNote }}</p></div>
      <button @click="open()">+ Add Subject</button>
    </header>

    <p v-if="msg" :class="kind">{{ msg }}</p>

    <article class="filters">
      <input v-model.trim="search" placeholder="Search code or subject name" />
      <select v-model="curriculum" @change="load">
        <option value="">All applicable subjects</option>
        <option v-for="option in availableCurriculums" :key="option.value" :value="option.value">{{ option.label }}</option>
      </select>
      <span>{{ filtered.length }} subject found</span>
    </article>

    <article class="table-wrap">
      <table>
        <thead><tr><th>Code</th><th>Subject</th><th>Institution curriculum</th><th>Type</th><th>Status</th><th>Assessment</th><th>Action</th></tr></thead>
        <tbody>
          <tr v-for="x in filtered" :key="x.subject_id">
            <td>{{ x.subject_code }}</td>
            <td>{{ x.subject_name }}<small v-if="x.institution_name">{{ x.institution_name }} · {{ x.institution_type }}</small></td>
            <td>
              <select v-if="canChooseCurriculum" class="inline" :value="x.curriculum_type" @change="changeCurriculum(x, $event)">
                <option v-for="option in availableCurriculums" :key="option.value" :value="option.value">{{ option.label }}</option>
              </select>
              <span v-else>{{ curriculumLabel(x.curriculum_type) }}</span>
            </td>
            <td>{{ x.subject_type }}</td>
            <td><span class="status" :class="x.status === 'ACTIVE' ? 'active' : 'inactive'">{{ x.status }}</span></td>
            <td>W {{ x.written_marks }} · MCQ {{ x.mcq_marks }} · P {{ x.practical_marks }} · V {{ x.viva_marks }}</td>
            <td><button class="mini" @click="open(x)">Edit</button><button class="mini danger" @click="remove(x)">Delete</button></td>
          </tr>
          <tr v-if="!filtered.length"><td colspan="7">No subject found for this institution type.</td></tr>
        </tbody>
      </table>
    </article>

    <div v-if="modal" class="backdrop">
      <form class="modal" @submit.prevent="save">
        <h2>{{ id ? 'Update' : 'Add' }} Subject</h2>
        <div class="fields">
          <label>Code<input v-model.trim="f.subject_code" :readonly="Boolean(id)" required /><small v-if="id">Subject code is fixed after creation.</small></label>
          <label>Name<input v-model.trim="f.subject_name" required /></label>
          <label>Institution curriculum
            <select v-model="f.curriculum_type">
              <option v-for="option in availableCurriculums" :key="option.value" :value="option.value">{{ option.label }}</option>
            </select>
          </label>
          <label>Status<select v-model="f.status"><option value="ACTIVE">Active</option><option value="INACTIVE">Inactive</option></select></label>
          <label>Type<select v-model="f.subject_type"><option value="MAIN">Main</option><option value="OPTIONAL">Optional</option><option value="FOURTH_SUBJECT">Fourth Subject</option></select></label>
          <label>Full<input v-model.number="f.full_marks" type="number" min="1" /></label>
          <label>Pass<input v-model.number="f.pass_marks" type="number" min="0" /></label>
          <label>Written<input v-model.number="f.written_marks" type="number" min="0" /></label>
          <label>MCQ<input v-model.number="f.mcq_marks" type="number" min="0" /></label>
          <label>Practical<input v-model.number="f.practical_marks" type="number" min="0" /></label>
          <label>Viva<input v-model.number="f.viva_marks" type="number" min="0" /></label>
        </div>
        <p>Total: <b :class="{ bad: total !== Number(f.full_marks) }">{{ total }} / {{ f.full_marks }}</b></p>
        <button :disabled="total !== Number(f.full_marks)">Save Subject</button>
        <button type="button" class="secondary" @click="modal = false">Cancel</button>
      </form>
    </div>
  </section>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue';
import api from '../../services/api';

const curriculumOptions = [
  { value: 'ALL', label: 'All Institutions' },
  { value: 'SCHOOL', label: 'School' },
  { value: 'COLLEGE', label: 'College' },
  { value: 'MADRASA', label: 'Madrasa' },
  { value: 'COACHING_CENTER', label: 'Coaching Center' },
  { value: 'UNIVERSITY', label: 'University' },
  { value: 'POLYTECHNIC', label: 'Polytechnic' },
  { value: 'VOCATIONAL_INSTITUTE', label: 'Vocational Institute' },
];
const rows = ref([]), search = ref(''), curriculum = ref(''), modal = ref(false), id = ref(''), msg = ref(''), kind = ref('success');
const meta = ref({ allowed_curriculum_types: ['SCHOOL'] });
const f = reactive({ subject_code: '', subject_name: '', curriculum_type: 'SCHOOL', status: 'ACTIVE', subject_type: 'MAIN', full_marks: 100, pass_marks: 33, written_marks: 100, mcq_marks: 0, practical_marks: 0, viva_marks: 0 });
const isSuperAdmin = computed(() => Boolean(meta.value.is_super_admin));
const availableCurriculums = computed(() => isSuperAdmin.value ? curriculumOptions : curriculumOptions.filter((option) => meta.value.allowed_curriculum_types?.includes(option.value)));
const canChooseCurriculum = computed(() => isSuperAdmin.value || availableCurriculums.value.length > 1);
const institutionNote = computed(() => {
  if (isSuperAdmin.value) return 'All institutions and curriculum subjects are available here.';
  if (!meta.value.institution_type) return 'Institution Type is not selected: all curriculum subjects are available.';
  return `${meta.value.institution_type}: only the applicable subjects are available.`;
});
const total = computed(() => +f.written_marks + +f.mcq_marks + +f.practical_marks + +f.viva_marks);
const filtered = computed(() => rows.value.filter((x) => {
  const matchesText = `${x.subject_code} ${x.subject_name}`.toLowerCase().includes(search.value.toLowerCase());
  return matchesText && (!curriculum.value || x.curriculum_type === curriculum.value);
}));
const curriculumLabel = (value) => curriculumOptions.find((option) => option.value === value)?.label || value;
const defaultCurriculum = () => availableCurriculums.value.find((option) => option.value !== 'ALL')?.value || 'ALL';
const resetForm = () => Object.assign(f, { subject_code: '', subject_name: '', curriculum_type: defaultCurriculum(), status: 'ACTIVE', subject_type: 'MAIN', full_marks: 100, pass_marks: 33, written_marks: 100, mcq_marks: 0, practical_marks: 0, viva_marks: 0 });
function open(subject) { id.value = subject?.subject_id || ''; subject ? Object.assign(f, { ...subject, status: subject.status || 'ACTIVE' }) : resetForm(); modal.value = true; }
async function load() {
  try {
    const response = await api.get('/exams/subjects', { params: { curriculum_type: curriculum.value } });
    rows.value = response.data.data || [];
    meta.value = response.data.meta || meta.value;
    if (!isSuperAdmin.value && curriculum.value && !meta.value.allowed_curriculum_types?.includes(curriculum.value)) curriculum.value = '';
  } catch (error) { msg.value = error.response?.data?.message || 'Failed to load subjects.'; kind.value = 'error'; }
}
async function save() {
  try {
    const response = id.value ? await api.put(`/exams/subjects/${id.value}`, f) : await api.post('/exams/subjects', f);
    const subjectId = id.value || response.data?.data?.subject_id;
    await api.put(`/exams/subjects/${subjectId}/status`, { status: f.status });
    modal.value = false; msg.value = 'Subject saved.'; kind.value = 'success'; await load();
  } catch (error) { msg.value = error.response?.data?.message || 'Save failed.'; kind.value = 'error'; }
}
async function changeCurriculum(subject, event) {
  try { await api.put(`/exams/subjects/${subject.subject_id}/curriculum`, { curriculum_type: event.target.value }); await load(); }
  catch (error) { msg.value = error.response?.data?.message || 'Permission denied.'; kind.value = 'error'; event.target.value = subject.curriculum_type; }
}
async function remove(subject) {
  if (!confirm(`Delete ${subject.subject_name}?`)) return;
  try { await api.delete(`/exams/subjects/${subject.subject_id}`); msg.value = 'Subject deleted.'; kind.value = 'success'; await load(); }
  catch (error) { msg.value = error.response?.data?.message || 'Delete failed.'; kind.value = 'error'; }
}
onMounted(load);
</script>

<style scoped>
.page{display:grid;gap:16px;padding:20px}.page header,.page article{padding:18px;border:1px solid #e2e8f0;border-radius:14px;background:#fff}.page header{display:flex;justify-content:space-between;align-items:center;gap:16px}h1,h2{margin:0 0 6px}p{margin:0;color:#475569}button{padding:8px 11px;border:0;border-radius:7px;background:#4338ca;color:#fff;font-weight:800;cursor:pointer}.secondary{background:#64748b}.mini{padding:6px;margin:2px}.danger{background:#dc2626}.filters{display:flex;gap:10px;align-items:center}.filters input,.filters select,.inline{padding:9px;border:1px solid #cbd5e1;border-radius:7px}.filters input{min-width:280px}.filters span{font-size:13px;color:#64748b}.table-wrap{overflow:auto;padding:0!important;border-color:#dbe4f0!important}table{width:100%;border-collapse:separate;border-spacing:0}th,td{padding:11px 12px;border-bottom:1px solid #e7edf5;text-align:left;font-size:13px;white-space:nowrap}th{background:#eef4ff;color:#334155;font-size:11px;font-weight:800;letter-spacing:.04em;text-transform:uppercase}tbody tr:nth-child(odd){background:#fff}tbody tr:nth-child(even){background:#f8fbff}tbody tr:hover{background:#eaf2ff;transition:background .15s ease}tbody tr:last-child td{border-bottom:0}small{display:block;color:#64748b}.status{display:inline-flex;padding:3px 7px;border-radius:999px;font-size:10px;font-weight:800}.status.active{background:#dcfce7;color:#166534}.status.inactive{background:#fee2e2;color:#b91c1c}.backdrop{position:fixed;inset:0;z-index:1000;display:grid;place-items:center;background:#0f172a88}.modal{width:min(660px,calc(100% - 32px));padding:22px;border-radius:16px;background:#fff}.fields{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin:12px 0}.fields label{display:grid;gap:4px;font-size:12px;font-weight:800}.fields input,.fields select{padding:8px;border:1px solid #cbd5e1;border-radius:7px}.fields input[readonly]{background:#f1f5f9;color:#64748b;cursor:not-allowed}.bad{color:#dc2626}.success,.error{padding:10px;border-radius:8px}.success{background:#dcfce7;color:#166534}.error{background:#fee2e2;color:#b91c1c}@media(max-width:750px){.page header,.filters{flex-direction:column;align-items:stretch}.fields{grid-template-columns:1fr}.filters input{min-width:0}}
</style>
