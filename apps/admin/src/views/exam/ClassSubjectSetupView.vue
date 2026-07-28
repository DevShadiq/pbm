<template>
  <section class="page">
    <header>
      <div><small>ACADEMIC CURRICULUM</small><h1>Class-wise Subjects</h1><p>{{ curriculumNote }}</p></div>
      <button :disabled="!classId" @click="openAssign">+ Assign Subject</button>
    </header>
    <p v-if="msg" :class="kind">{{ msg }}</p>

    <article class="filter"><BaseSelect v-model="classId" label="Class" :options="classOptions" placeholder="Select class" @change="load" /></article>
    <article class="table-wrap">
      <table><thead><tr><th>Order</th><th>Subject</th><th>Curriculum</th><th>Type</th><th>Action</th></tr></thead><tbody>
        <tr v-for="x in rows" :key="x.class_subject_id"><td>{{ x.sort_order }}</td><td>{{ x.subject_code }} — {{ x.subject_name }}</td><td>{{ curriculumLabel(x.curriculum_type) }}</td><td>{{ Number(x.is_mandatory) ? 'Mandatory' : 'Optional' }}</td><td><button class="edit" @click="openEdit(x)">Edit</button><button class="remove" @click="remove(x)">Remove</button></td></tr>
        <tr v-if="classId && !rows.length"><td colspan="5">No subject assigned.</td></tr>
      </tbody></table>
    </article>

    <div v-if="modal" class="backdrop">
      <form class="modal" @submit.prevent="assign">
        <h2>{{ editing ? 'Modify Class Subject' : 'Assign Subject' }}</h2>
        <BaseSelect v-model="f.subject_id" label="Subject" :options="subjectOptions" :disabled="Boolean(editing)" placeholder="Select active subject" required />
        <small v-if="!editing">{{ available.length }} active, applicable subject(s) available for this institution.</small>
        <label>Order<input v-model.number="f.sort_order" type="number" min="0" /></label>
        <label class="check"><input v-model="f.is_mandatory" type="checkbox" /> Mandatory</label>
        <div><button>Save Assignment</button><button class="secondary" type="button" @click="modal = false">Cancel</button></div>
      </form>
    </div>
  </section>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue';
import api from '../../services/api';
import BaseSelect from '../../components/common/BaseSelect.vue';

const labels = { ALL: 'All Institutions', SCHOOL: 'School', COLLEGE: 'College', MADRASA: 'Madrasa', COACHING_CENTER: 'Coaching Center', UNIVERSITY: 'University', POLYTECHNIC: 'Polytechnic', VOCATIONAL_INSTITUTE: 'Vocational Institute' };
const classes = ref([]), subjects = ref([]), rows = ref([]), classId = ref(''), modal = ref(false), editing = ref(null), msg = ref(''), kind = ref('success'), institutionType = ref(''), allowedTypes = ref([]);
const f = reactive({ subject_id: '', sort_order: 0, is_mandatory: true });
const curriculumLabel = (value) => labels[value] || value;
const curriculumNote = computed(() => institutionType.value ? `${institutionType.value}: only active ${allowedTypes.value.map(curriculumLabel).join(', ')} subjects are available in this LOV.` : 'Institution Type is not selected: all active subject curriculums are available.');
const available = computed(() => subjects.value.filter((subject) => !rows.value.some((row) => row.subject_id == subject.subject_id)));
const classOptions = computed(() => classes.value.map((item) => ({ value: item.class_id, label: item.class_name })));
const subjectOptions = computed(() => (editing.value ? [editing.value] : available.value).map((subject) => ({ value: subject.subject_id, label: `${subject.subject_code} — ${subject.subject_name} [${curriculumLabel(subject.curriculum_type)}]` })));
function openAssign() { editing.value = null; Object.assign(f, { subject_id: '', sort_order: 0, is_mandatory: true }); modal.value = true; }
function openEdit(row) { editing.value = row; Object.assign(f, { subject_id: row.subject_id, sort_order: Number(row.sort_order || 0), is_mandatory: Boolean(Number(row.is_mandatory)) }); modal.value = true; }
async function load() { if (classId.value) rows.value = (await api.get(`/exams/classes/${classId.value}/subjects`)).data.data || []; }
async function assign() { try { if (editing.value) await api.put(`/exams/class-subjects/${editing.value.class_subject_id}`, f); else await api.post(`/exams/classes/${classId.value}/subjects`, f); modal.value = false; editing.value = null; Object.assign(f, { subject_id: '', sort_order: 0, is_mandatory: true }); msg.value = 'Class subject saved.'; kind.value = 'success'; await load(); } catch (error) { msg.value = error.response?.data?.message || 'Save failed.'; kind.value = 'error'; } }
async function remove(row) { if (!confirm(`Remove ${row.subject_name}?`)) return; try { await api.delete(`/exams/class-subjects/${row.class_subject_id}`); await load(); } catch (error) { msg.value = error.response?.data?.message || 'Remove failed.'; kind.value = 'error'; } }
onMounted(async () => { const data = (await api.get('/exams/lookups')).data.data; classes.value = data.classes || []; subjects.value = data.subjects || []; institutionType.value = data.institution_type || ''; allowedTypes.value = data.allowed_curriculum_types || []; });
</script>

<style scoped>
.page{display:grid;gap:16px;padding:20px}header,article{padding:18px;border:1px solid #e2e8f0;border-radius:14px;background:#fff}header{display:flex;justify-content:space-between;align-items:center;gap:16px}h1,h2{margin:0 0 6px}p,small{color:#64748b}button{padding:9px 12px;border:0;border-radius:8px;background:#4338ca;color:#fff;font:inherit;font-weight:800;cursor:pointer}.secondary{margin-left:8px;background:#64748b}.edit{margin-right:6px;padding:6px 8px;background:#2563eb}.remove{padding:6px 8px;background:#dc2626}.filter label,.modal label{display:grid;gap:5px;font-size:12px;font-weight:800;max-width:430px}.filter select,.modal select,.modal input{padding:9px;border:1px solid #cbd5e1;border-radius:7px;font:inherit}.modal select:disabled{background:#f1f5f9;color:#64748b}.table-wrap{overflow:auto;padding:0}table{width:100%;border-collapse:collapse}th,td{padding:10px;border-bottom:1px solid #e2e8f0;text-align:left;font-size:13px}th{background:#f8fafc;color:#475569;text-transform:uppercase;font-size:11px}.backdrop{position:fixed;inset:0;z-index:1000;display:grid;place-items:center;background:#0f172a88}.modal{width:min(480px,calc(100% - 36px));display:grid;gap:12px;padding:22px;border-radius:16px;background:#fff}.check{display:flex!important;align-items:center;gap:7px}.success,.error{padding:10px;border-radius:8px}.success{background:#dcfce7;color:#166534}.error{background:#fee2e2;color:#b91c1c}@media(max-width:700px){header{align-items:flex-start;flex-direction:column}}
</style>
