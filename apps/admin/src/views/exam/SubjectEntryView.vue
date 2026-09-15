<template>
  <section class="subject-page">
    <header class="hero">
      <div class="hero-copy"><span class="hero-icon">Aa</span><div><small>ACADEMIC MASTER SETUP</small><h1>Subject Master</h1><p>একটি subject একবারই রাখুন; ১ম/২য় পত্র Class Subject Setup থেকে assign করুন।</p></div></div>
      <div class="hero-actions"><span class="lock-chip" :class="{ locked: policyLocked }">{{ policyLocked ? '● Setup locked' : '○ Setup editable' }}</span><button :disabled="policyLocked" @click="open()">+ New subject</button></div>
    </header>
    <p v-if="msg" :class="['notice', kind]">{{ msg }}</p>

    <section class="overview">
      <div><span>Total subjects</span><b>{{ filtered.length }}</b></div><div><span>Paper selectable</span><b>{{ twoPaperCount }}</b></div><div><span>Active subjects</span><b>{{ activeCount }}</b></div>
      <div class="rule"><b>One subject · many papers</b><small>Bangla, English, Accounting ইত্যাদি master-এ একবার থাকবে।</small></div>
    </section>

    <section class="toolbar">
      <label class="search"><span>⌕</span><input v-model.trim="search" type="search" placeholder="Search subject or neutral code" /></label>
      <select v-model="paperFilter"><option value="">All paper structures</option><option value="SINGLE">Single paper only</option><option value="FLEXIBLE">Paper selectable</option></select>
    </section>

    <section class="subject-grid">
      <article v-for="subject in filtered" :key="subject.subject_id" class="subject-card">
        <div class="subject-mark">{{ initials(subject.subject_name) }}</div>
        <div class="subject-main">
          <div class="subject-title"><div><h2>{{ subject.subject_name }}</h2><p>{{ subject.subject_name_bn || 'বাংলা নাম দেওয়া হয়নি' }}</p></div><span class="status" :class="String(subject.status).toLowerCase()">{{ subject.status }}</span></div>
          <div class="meta-row"><span class="code">{{ subject.subject_code }}</span><span class="paper" :class="{ split: subject.paper_mode === 'FLEXIBLE' }">{{ paperModeLabel(subject.paper_mode) }}</span></div>
          <div class="assessment"><span>Default {{ subject.full_marks }} · Pass {{ subject.pass_marks }}</span><span>W {{ compactNumber(subject.written_marks) }} · M {{ compactNumber(subject.mcq_marks) }} · P {{ compactNumber(subject.practical_marks) }} · V {{ compactNumber(subject.viva_marks) }}</span></div>
        </div>
        <div class="card-actions"><button class="icon-button" :disabled="policyLocked" @click="open(subject)">Edit</button><button class="icon-button danger" :disabled="policyLocked" @click="remove(subject)">Delete</button></div>
      </article>
      <article v-if="!filtered.length" class="empty"><span>◎</span><h2>No subject found</h2><p>Search/filter পরিবর্তন করুন অথবা একটি নতুন base subject যোগ করুন।</p></article>
    </section>

    <div v-if="modal" class="backdrop">
      <form class="modal" @submit.prevent="save">
        <header class="modal-head"><div><small>BASE SUBJECT</small><h2>{{ id ? 'Edit subject' : 'Create subject' }}</h2><p>Class, level বা paper number subject name/code-এ লিখবেন না।</p></div><button type="button" class="close" @click="modal = false">×</button></header>
        <div class="form-grid">
          <label>Neutral code<input v-model.trim="f.subject_code" :readonly="Boolean(id)" required placeholder="ACC" /><small>ACC, BAN, ENG-এর মতো ছোট code</small></label>
          <label>Paper structure<select v-model="f.paper_mode"><option value="SINGLE">Single paper only / শুধু একক পত্র</option><option value="FLEXIBLE">Selectable / একক, ১ম বা ২য় পত্র</option></select><small>Choose papers on student profiles or in class defaults</small></label>
          <label>Subject name<input v-model.trim="f.subject_name" required placeholder="Accounting" /></label><label>বাংলা নাম<input v-model.trim="f.subject_name_bn" placeholder="হিসাববিজ্ঞান" /></label>
          <label>Status<select v-model="f.status"><option value="ACTIVE">Active</option><option value="INACTIVE">Inactive</option></select></label>
        </div>
        <details class="advanced">
          <summary><span><b>Default assessment</b><small>Class assignment-এর সময় পরিবর্তন করা যাবে</small></span><strong :class="{ invalid: !assessmentValid }">{{ total }} / {{ f.full_marks }}</strong></summary>
          <div class="marks-grid"><label>Full marks<input v-model.number="f.full_marks" type="number" min="1" step="0.01" /></label><label>Pass marks<input v-model.number="f.pass_marks" type="number" min="0" :max="f.full_marks" step="0.01" /></label><label>Written<input v-model.number="f.written_marks" type="number" min="0" step="0.01" /></label><label>MCQ<input v-model.number="f.mcq_marks" type="number" min="0" step="0.01" /></label><label>Practical<input v-model.number="f.practical_marks" type="number" min="0" step="0.01" /></label><label>Viva<input v-model.number="f.viva_marks" type="number" min="0" step="0.01" /></label></div>
        </details>
        <p v-if="!identityValid" class="validation">Subject name-এ 1st/2nd Paper এবং code-এ SSC/HSC prefix ব্যবহার করবেন না।</p>
        <div class="modal-actions"><button type="button" class="secondary" @click="modal = false">Cancel</button><button :disabled="saving || !assessmentValid || !identityValid">{{ saving ? 'Saving…' : 'Save subject' }}</button></div>
      </form>
    </div>
  </section>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue';
import api from '../../services/api';
import { confirmAction, notify } from '../../services/notification';
import { withPreservedScroll } from '../../utils/preserveScroll';

const rows = ref([]), search = ref(''), paperFilter = ref(''), modal = ref(false), id = ref(''), msg = ref(''), kind = ref('success'), saving = ref(false);
const policyLocked = ref(false);
const blankForm = () => ({ subject_code: '', subject_name: '', subject_name_bn: '', curriculum_type: 'ALL', paper_mode: 'SINGLE', status: 'ACTIVE', subject_type: 'MAIN', full_marks: 100, pass_marks: 33, written_marks: 100, mcq_marks: 0, practical_marks: 0, viva_marks: 0 });
const f = reactive(blankForm());
const total = computed(() => Number(f.written_marks || 0) + Number(f.mcq_marks || 0) + Number(f.practical_marks || 0) + Number(f.viva_marks || 0));
const assessmentValid = computed(() => Number(f.full_marks) > 0 && Number(f.pass_marks) >= 0 && Number(f.pass_marks) <= Number(f.full_marks) && Math.abs(total.value - Number(f.full_marks)) < .001);
const identityValid = computed(() => !/\b(1st|2nd|first|second)\s+paper\s*$/i.test(f.subject_name) && !/[১২][য়য়ম]?\s*পত্র\s*$/u.test(f.subject_name_bn) && !/^(SSC|HSC|ALIM|DAK|EBT|SCH)-/i.test(f.subject_code));
const filtered = computed(() => rows.value.filter((subject) => { const text = `${subject.subject_code} ${subject.subject_name} ${subject.subject_name_bn || ''}`.toLowerCase(); return (!search.value || text.includes(search.value.toLowerCase())) && (!paperFilter.value || subject.paper_mode === paperFilter.value); }));
const twoPaperCount = computed(() => filtered.value.filter((subject) => subject.paper_mode === 'FLEXIBLE').length);
const activeCount = computed(() => filtered.value.filter((subject) => subject.status === 'ACTIVE').length);
const paperModeLabel = (value) => value === 'FLEXIBLE' ? 'Single · 1st · 2nd' : 'Single paper';
const compactNumber = (value) => Number(value || 0).toLocaleString('en-US', { maximumFractionDigits: 2 });
const initials = (name) => String(name || 'S').split(/\s+/).slice(0, 2).map((word) => word[0]).join('').toUpperCase();

function open(subject) { id.value = subject?.subject_id || ''; Object.assign(f, blankForm(), subject || {}, { subject_type: 'MAIN', curriculum_type: 'ALL' }); modal.value = true; }
async function load() { try { const response = await api.get('/exams/subjects'); rows.value = response.data.data || []; } catch (error) { msg.value = error.response?.data?.message || 'Failed to load subjects.'; kind.value = 'error'; } }
async function loadPolicy() { try { policyLocked.value = Boolean((await api.get('/exams/subject-policy')).data.data?.is_locked); } catch { policyLocked.value = false; } }
async function save() {
  if (!assessmentValid.value || !identityValid.value) return;
  try { saving.value = true; const response = id.value ? await api.put(`/exams/subjects/${id.value}`, f) : await api.post('/exams/subjects', f); const subjectId = id.value || response.data?.data?.subject_id; await api.put(`/exams/subjects/${subjectId}/status`, { status: f.status }); modal.value = false; msg.value = 'Base subject saved successfully.'; kind.value = 'success'; notify.success(msg.value); await load(); }
  catch (error) { msg.value = error.response?.data?.message || 'Could not save subject.'; kind.value = 'error'; notify.error(msg.value); } finally { saving.value = false; }
}
async function remove(subject) { if (!await confirmAction({ title: 'Delete base subject?', message: `“${subject.subject_name}” এবং এর paper options নতুন assignment-এ আর পাওয়া যাবে না।`, confirmText: 'Delete subject' })) return; try { await api.delete(`/exams/subjects/${subject.subject_id}`); notify.success('Subject deleted.'); await withPreservedScroll(load); } catch (error) { msg.value = error.response?.data?.message || 'Assigned subject cannot be deleted.'; kind.value = 'error'; notify.error(msg.value); } }
onMounted(() => Promise.all([load(), loadPolicy()]));
</script>

<style scoped>
.subject-page{display:grid;gap:16px;color:#172033}.hero,.overview,.toolbar,.subject-card{border:1px solid #e2e8f0;background:#fff}.hero{display:flex;align-items:center;justify-content:space-between;gap:18px;padding:20px 22px;border-radius:18px;background:linear-gradient(125deg,#f8faff,#eef5ff 58%,#fff)}.hero-copy,.hero-actions{display:flex;align-items:center;gap:12px}.hero-icon{display:grid;width:48px;height:48px;place-items:center;border-radius:15px;background:#4338ca;color:#fff;font-size:17px;font-weight:900;box-shadow:0 10px 22px #4338ca33}.hero small,.modal-head small{color:#4f46e5;font-size:9px;font-weight:900;letter-spacing:.14em}.hero h1{margin:3px 0 4px;font-size:25px;letter-spacing:-.035em}.hero p,.modal-head p{margin:0;color:#64748b;font-size:12px}.hero button,.modal-actions button{height:40px;padding:0 14px;border:0;border-radius:9px;background:#4338ca;color:#fff;font:inherit;font-size:12px;font-weight:850;cursor:pointer}.hero button:disabled,.icon-button:disabled,.modal-actions button:disabled{cursor:not-allowed;opacity:.45}.lock-chip{padding:6px 9px;border-radius:999px;background:#dcfce7;color:#166534;font-size:10px;font-weight:850}.lock-chip.locked{background:#ffedd5;color:#9a3412}.notice{margin:0;padding:10px 12px;border-radius:10px;font-size:12px;font-weight:750}.notice.success{background:#ecfdf5;color:#047857}.notice.error{background:#fff1f2;color:#be123c}.overview{display:grid;grid-template-columns:repeat(3,150px) 1fr;border-radius:14px;overflow:hidden}.overview>div{padding:13px 15px;border-right:1px solid #edf1f6}.overview span,.overview small{display:block;color:#64748b;font-size:10px}.overview b{display:block;margin-top:5px;font-size:20px}.overview .rule{border:0;background:#f8fafc}.overview .rule b{margin:0;font-size:12px}.overview .rule small{margin-top:4px}.toolbar{display:grid;grid-template-columns:minmax(240px,1fr) 210px 190px;gap:10px;padding:12px;border-radius:13px}.toolbar input,.toolbar select,.form-grid input,.form-grid select,.marks-grid input{width:100%;height:42px;padding:0 11px;border:1px solid #d7e0ec;border-radius:9px;background:#fff;color:#172033;font:inherit;font-size:12px;box-sizing:border-box;outline:0}.toolbar input:focus,.toolbar select:focus,.form-grid input:focus,.form-grid select:focus,.marks-grid input:focus{border-color:#6366f1;box-shadow:0 0 0 3px #6366f119}.search{position:relative}.search span{position:absolute;top:50%;left:12px;color:#94a3b8;transform:translateY(-50%)}.search input{padding-left:34px}.subject-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}.subject-card{display:grid;grid-template-columns:40px minmax(0,1fr) auto;gap:11px;align-items:start;padding:13px;border-radius:13px;box-shadow:0 2px 6px #0f172a08;transition:.18s}.subject-card:hover{border-color:#c7d2fe;box-shadow:0 8px 20px #4338ca10;transform:translateY(-1px)}.subject-mark{display:grid;width:38px;height:38px;place-items:center;border-radius:11px;background:#eef2ff;color:#4338ca;font-size:11px;font-weight:900}.subject-title{display:flex;align-items:start;justify-content:space-between;gap:8px}.subject-title h2{margin:0;font-size:14px}.subject-title p{margin:3px 0 0;color:#475569;font-size:11px}.status{padding:3px 6px;border-radius:999px;background:#dcfce7;color:#166534;font-size:8px;font-weight:900}.status.inactive{background:#fee2e2;color:#b91c1c}.meta-row,.assessment{display:flex;align-items:center;flex-wrap:wrap;gap:6px;margin-top:8px}.meta-row span{padding:3px 6px;border-radius:6px;background:#f1f5f9;color:#475569;font-size:9px;font-weight:750}.meta-row .code{background:#e0e7ff;color:#3730a3}.meta-row .paper.split{background:#ede9fe;color:#6d28d9}.assessment{justify-content:space-between;padding-top:8px;border-top:1px solid #edf1f6;color:#64748b;font-size:9px}.card-actions{display:grid;gap:5px}.icon-button{padding:5px 7px;border:1px solid #dbe3ef;border-radius:7px;background:#fff;color:#4338ca;font:inherit;font-size:9px;font-weight:850;cursor:pointer}.icon-button.danger{color:#be123c}.empty{grid-column:1/-1;display:grid;min-height:230px;place-items:center;align-content:center;padding:25px;border:1px dashed #cbd5e1;border-radius:14px;background:#fff;text-align:center}.empty span{color:#a5b4fc;font-size:28px}.empty h2{margin:8px 0 3px;font-size:15px}.empty p{margin:0;color:#64748b;font-size:12px}.backdrop{position:fixed;inset:0;z-index:1100;display:grid;place-items:center;padding:16px;background:#0f172aa8;backdrop-filter:blur(3px)}.modal{width:min(660px,100%);max-height:92vh;overflow:auto;padding:20px;border-radius:17px;background:#fff;box-shadow:0 28px 70px #0f172a55}.modal-head{display:flex;align-items:start;justify-content:space-between;gap:15px;margin-bottom:16px}.modal-head h2{margin:3px 0 4px;font-size:19px}.close{width:34px;height:34px;border:0;border-radius:9px;background:#f1f5f9;color:#475569;font-size:21px}.form-grid{display:grid;grid-template-columns:1fr 1fr;gap:11px}.form-grid label,.marks-grid label{display:grid;gap:5px;color:#334155;font-size:10px;font-weight:850}.form-grid label small{color:#94a3b8;font-size:9px;font-weight:500}.form-grid input[readonly]{background:#f1f5f9;color:#64748b}.advanced{margin-top:14px;border:1px solid #e2e8f0;border-radius:11px;background:#f8fafc}.advanced summary{display:flex;align-items:center;justify-content:space-between;padding:11px 13px;cursor:pointer;list-style:none}.advanced summary span b,.advanced summary span small{display:block}.advanced summary b{font-size:11px}.advanced summary small{margin-top:2px;color:#64748b;font-size:9px}.advanced summary strong{color:#047857;font-size:11px}.advanced summary strong.invalid{color:#be123c}.marks-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:9px;padding:0 13px 13px}.validation{margin:11px 0 0;padding:9px;border-radius:8px;background:#fff1f2;color:#be123c;font-size:10px;font-weight:750}.modal-actions{display:flex;justify-content:flex-end;gap:8px;margin-top:16px}.modal-actions .secondary{border:1px solid #cbd5e1;background:#fff;color:#475569}@media(max-width:900px){.overview{grid-template-columns:repeat(3,1fr)}.overview .rule{grid-column:1/-1}.subject-grid{grid-template-columns:1fr}}@media(max-width:650px){.hero,.hero-actions{align-items:stretch;flex-direction:column}.hero-copy{align-items:flex-start}.toolbar,.form-grid,.marks-grid{grid-template-columns:1fr}.overview{grid-template-columns:1fr 1fr}.overview>div{border-bottom:1px solid #edf1f6}.overview .rule{grid-column:1/-1}.subject-card{grid-template-columns:36px minmax(0,1fr)}.card-actions{grid-column:1/-1;display:flex;justify-content:flex-end}}
.toolbar{grid-template-columns:minmax(240px,1fr) 190px}@media(max-width:650px){.toolbar{grid-template-columns:1fr}}
</style>
