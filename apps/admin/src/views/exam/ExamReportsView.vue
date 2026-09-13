<template>
  <section class="reports-page">
    <header class="hero">
      <div><span class="eyebrow">EXAM ANALYTICS</span><h1>Exam Reports</h1><p>Pass/fail, marks completion, subject performance এবং merit tabulation একসাথে দেখুন।</p></div>
      <div class="actions"><button class="ghost" :disabled="!examId || !results.length" @click="downloadCsv">Export CSV</button><button :disabled="!examId" @click="printReport">Print report</button></div>
    </header>

    <p v-if="message" :class="['notice', messageType]">{{ message }}</p>

    <section class="filters no-print">
      <BaseSelect v-model="examId" label="Examination" :options="examOptions" placeholder="Select an exam" @change="loadReport" />
      <label>Search student<input v-model.trim="search" type="search" placeholder="Student name or ID" /></label>
      <label>Result<select v-model="status"><option value="">All results</option><option value="PASSED">Passed</option><option value="FAILED">Failed</option><option value="ABSENT">Absent</option></select></label>
      <label>View<select v-model="view"><option value="OVERVIEW">Overview & tabulation</option><option value="SUBJECTS">Subject performance</option><option value="PROGRESS">Marks progress</option></select></label>
    </section>

    <section v-if="examId" class="print-heading"><h2>{{ selectedExam?.exam_name }}</h2><p>{{ selectedExam?.class_name || 'All classes' }} · {{ selectedExam?.year_name }} · Generated {{ generatedAt }}</p></section>

    <section class="stats">
      <article><span>Candidates</span><strong>{{ candidateCount }}</strong><small>{{ resultCount }} result(s) processed</small></article>
      <article class="green"><span>Pass rate</span><strong>{{ passRate }}%</strong><small>{{ passed }} passed</small></article>
      <article class="red"><span>Failed / absent</span><strong>{{ failed }}</strong><small>Needs academic review</small></article>
      <article class="blue"><span>Marks completion</span><strong>{{ completionRate }}%</strong><small>{{ enteredMarks }} / {{ expectedMarks }} entries</small></article>
    </section>

    <template v-if="view === 'OVERVIEW'">
      <section class="analytics-grid">
        <article class="panel"><div class="panel-head"><div><span>RESULT DISTRIBUTION</span><h2>Pass / fail overview</h2></div><b>{{ passRate }}%</b></div><div class="bar"><i class="pass" :style="{ width: `${passRate}%` }"></i><i class="fail" :style="{ width: `${100 - passRate}%` }"></i></div><div class="legend"><span><i class="dot pass"></i>Passed <b>{{ passed }}</b></span><span><i class="dot fail"></i>Failed/absent <b>{{ failed }}</b></span><span><i class="dot pending"></i>Pending <b>{{ pending }}</b></span></div></article>
        <article class="panel"><div class="panel-head"><div><span>CLASS AVERAGE</span><h2>Academic performance</h2></div><b>{{ averagePercent }}%</b></div><div class="gpa-row"><div><span>Average GPA</span><strong>{{ averageGpa }}</strong></div><div><span>Highest marks</span><strong>{{ highestMarks }}</strong></div><div><span>Published</span><strong>{{ published }}</strong></div></div></article>
      </section>
      <section class="table-card"><div class="table-head"><div><h2>Merit & tabulation sheet</h2><p>One row per student, ready to print or export.</p></div><span>{{ filteredResults.length }} student(s)</span></div><div class="table-wrap"><table><thead><tr><th>Position</th><th>Student</th><th>Total marks</th><th>Percentage</th><th>GPA</th><th>Grade</th><th>Failed</th><th>Result</th><th>Published</th></tr></thead><tbody><tr v-for="row in filteredResults" :key="row.result_id"><td><span class="rank">{{ row.merit_position || '—' }}</span></td><td><b>{{ row.full_name }}</b><small>{{ row.student_no }}</small></td><td>{{ number(row.obtained_marks) }} / {{ number(row.total_marks) }}</td><td>{{ rowPercent(row) }}%</td><td><b>{{ fixed(row.gpa) }}</b></td><td>{{ row.letter_grade || '—' }}</td><td>{{ number(row.failed_subject_count) }}</td><td><span class="pill" :class="String(row.result_status).toLowerCase()">{{ row.result_status }}</span></td><td>{{ row.published_at ? 'Yes' : 'No' }}</td></tr><tr v-if="!filteredResults.length"><td colspan="9" class="empty">No result rows match the current filter.</td></tr></tbody></table></div></section>
    </template>

    <template v-else-if="view === 'SUBJECTS'">
      <section class="table-card"><div class="table-head"><div><h2>Subject-wise performance</h2><p>Component entries are consolidated by subject.</p></div><span>{{ subjectPerformance.length }} subject(s)</span></div><div class="table-wrap"><table><thead><tr><th>Subject</th><th>Students</th><th>Full marks</th><th>Average</th><th>Highest</th><th>Lowest</th><th>Absent</th><th>Completion</th></tr></thead><tbody><tr v-for="row in subjectPerformance" :key="row.exam_subject_id"><td><b>{{ row.subject_name }}</b><small>{{ row.subject_code }}</small></td><td>{{ row.students }}</td><td>{{ row.full_marks }}</td><td>{{ row.average }}</td><td>{{ row.highest }}</td><td>{{ row.lowest }}</td><td>{{ row.absent }}</td><td><div class="mini-progress"><i :style="{ width: `${row.completion}%` }"></i></div><small>{{ row.completion }}%</small></td></tr><tr v-if="!subjectPerformance.length"><td colspan="8" class="empty">No marks have been entered for this exam.</td></tr></tbody></table></div></section>
    </template>

    <template v-else>
      <section class="table-card"><div class="table-head"><div><h2>Marks entry progress</h2><p>Track draft, verified, absent and missing entries by subject.</p></div></div><div class="progress-list"><article v-for="row in subjectPerformance" :key="row.exam_subject_id"><div><b>{{ row.subject_name }}</b><small>{{ row.entered }} of {{ row.expected }} marks recorded · {{ row.verified }} verified · {{ row.absent }} absent</small></div><span>{{ row.completion }}%</span><div class="mini-progress"><i :style="{ width: `${row.completion}%` }"></i></div></article><p v-if="!subjectPerformance.length" class="empty">Select an exam with candidates and marks.</p></div></section>
    </template>
  </section>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue';
import api from '../../services/api';
import BaseSelect from '../../components/common/BaseSelect.vue';
import { notify } from '../../services/notification';

const exams = ref([]), results = ref([]), marks = ref([]), examId = ref(''), search = ref(''), status = ref(''), view = ref('OVERVIEW'), message = ref(''), messageType = ref('success'), loading = ref(false);
const examOptions = computed(() => exams.value.map((exam) => ({ value: exam.exam_id, label: `${exam.exam_name} — ${exam.class_name || 'All classes'} · ${exam.year_name || ''}` })));
const selectedExam = computed(() => exams.value.find((exam) => String(exam.exam_id) === String(examId.value)));
const filteredResults = computed(() => results.value.filter((row) => (!status.value || row.result_status === status.value) && (!search.value || `${row.full_name || ''} ${row.student_no || ''}`.toLowerCase().includes(search.value.toLowerCase()))));
const resultCount = computed(() => results.value.length);
const candidateCount = computed(() => new Set([...results.value.map((row) => row.student_id), ...marks.value.map((row) => row.student_id)]).size);
const passed = computed(() => results.value.filter((row) => row.result_status === 'PASSED').length);
const failed = computed(() => results.value.filter((row) => ['FAILED', 'ABSENT'].includes(row.result_status)).length);
const pending = computed(() => Math.max(0, candidateCount.value - passed.value - failed.value));
const passRate = computed(() => resultCount.value ? Math.round(passed.value * 100 / resultCount.value) : 0);
const published = computed(() => results.value.filter((row) => row.published_at).length);
const enteredMarks = computed(() => marks.value.filter((row) => row.mark_id || row.marks_obtained !== null && row.marks_obtained !== undefined).length);
const expectedMarks = computed(() => marks.value.length);
const completionRate = computed(() => expectedMarks.value ? Math.round(enteredMarks.value * 100 / expectedMarks.value) : 0);
const averageGpa = computed(() => resultCount.value ? (results.value.reduce((sum, row) => sum + number(row.gpa), 0) / resultCount.value).toFixed(2) : '0.00');
const averagePercent = computed(() => resultCount.value ? (results.value.reduce((sum, row) => sum + (number(row.total_marks) ? number(row.obtained_marks) * 100 / number(row.total_marks) : 0), 0) / resultCount.value).toFixed(1) : '0.0');
const highestMarks = computed(() => results.value.length ? Math.max(...results.value.map((row) => number(row.obtained_marks))) : 0);
const generatedAt = computed(() => new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }).format(new Date()).toUpperCase());
const paperLabel = (value) => Number(value) === 1 ? ' — 1st Paper' : Number(value) === 2 ? ' — 2nd Paper' : '';
const subjectPerformance = computed(() => {
  const groups = new Map();
  for (const row of marks.value) {
    const key = String(row.exam_subject_id);
    if (!groups.has(key)) groups.set(key, { exam_subject_id: row.exam_subject_id, subject_name: `${row.subject_name || ''}${paperLabel(row.paper_no)}`, subject_code: row.subject_code || '', componentIds: new Set(), studentsSet: new Set(), studentScores: new Map(), entered: 0, verified: 0, absent: 0, full_marks: number(row.subject_full_marks || row.full_marks), expected: 0 });
    const item = groups.get(key); item.studentsSet.add(row.student_id); if (row.component_id) item.componentIds.add(row.component_id); item.expected += 1;
    const entered = row.mark_id || row.marks_obtained !== null && row.marks_obtained !== undefined;
    if (entered) { item.entered += 1; if (row.entry_status === 'VERIFIED') item.verified += 1; if (Number(row.is_absent)) item.absent += 1; const old = item.studentScores.get(row.student_id) || 0; item.studentScores.set(row.student_id, old + (Number(row.is_absent) ? 0 : number(row.marks_obtained))); }
  }
  return [...groups.values()].map((item) => { const scores = [...item.studentScores.values()]; return { ...item, students: item.studentsSet.size, average: scores.length ? (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(2) : '0.00', highest: scores.length ? Math.max(...scores) : 0, lowest: scores.length ? Math.min(...scores) : 0, completion: item.expected ? Math.round(item.entered * 100 / item.expected) : 0 }; });
});
const number = (value) => Number(value || 0);
const fixed = (value) => number(value).toFixed(2);
const rowPercent = (row) => number(row.total_marks) ? (number(row.obtained_marks) * 100 / number(row.total_marks)).toFixed(1) : '0.0';
function show(text, type = 'success') { message.value = text; messageType.value = type; type === 'error' ? notify.error(text) : notify.success(text); }
async function loadReport() {
  results.value = []; marks.value = []; if (!examId.value) return;
  try { loading.value = true; const [resultResponse, marksResponse] = await Promise.all([api.get(`/exams/exams/${examId.value}/results`), api.get(`/exams/exams/${examId.value}/marks`)]); results.value = resultResponse.data.data || []; marks.value = marksResponse.data.data || []; }
  catch (error) { show(error.response?.data?.message || 'Could not load exam report.', 'error'); }
  finally { loading.value = false; }
}
function csvCell(value) { return `"${String(value ?? '').replaceAll('"', '""')}"`; }
function downloadCsv() {
  const headers = ['Merit Position','Student No','Student Name','Obtained Marks','Total Marks','Percentage','GPA','Grade','Failed Subjects','Result','Published'];
  const lines = filteredResults.value.map((row) => [row.merit_position,row.student_no,row.full_name,row.obtained_marks,row.total_marks,rowPercent(row),row.gpa,row.letter_grade,row.failed_subject_count,row.result_status,row.published_at ? 'Yes' : 'No'].map(csvCell).join(','));
  const blob = new Blob([`\uFEFF${headers.join(',')}\n${lines.join('\n')}`], { type: 'text/csv;charset=utf-8' }); const url = URL.createObjectURL(blob); const link = document.createElement('a'); link.href = url; link.download = `${selectedExam.value?.exam_name || 'exam'}-report.csv`; link.click(); URL.revokeObjectURL(url); notify.success('Exam report exported.');
}
function printReport() { window.print(); }
onMounted(async () => { try { exams.value = (await api.get('/exams/exams')).data.data || []; } catch (error) { show(error.response?.data?.message || 'Could not load examinations.', 'error'); } });
</script>

<style scoped>
.reports-page{display:grid;gap:18px;color:#172033}.hero{display:flex;align-items:center;justify-content:space-between;gap:20px;padding:23px 24px;border:1px solid #dfe7f2;border-radius:18px;background:linear-gradient(130deg,#f8faff,#eef6ff 60%,#fff)}.eyebrow{display:block;margin-bottom:5px;color:#2563eb;font-size:10px;font-weight:900;letter-spacing:.13em}.hero h1{margin:0;font-size:26px;letter-spacing:-.035em}.hero p,.table-head p{margin:6px 0 0;color:#64748b;font-size:13px}.actions{display:flex;gap:8px}button{padding:9px 12px;border:0;border-radius:9px;background:#2563eb;color:#fff;font:inherit;font-size:12px;font-weight:800;cursor:pointer}button:disabled{opacity:.45;cursor:not-allowed}.ghost{border:1px solid #cbd5e1;background:#fff;color:#334155}.notice{margin:0;padding:11px 13px;border-radius:10px;font-size:13px;font-weight:700}.notice.success{background:#ecfdf5;color:#047857}.notice.error{background:#fff1f2;color:#be123c}.filters{display:grid;grid-template-columns:1.4fr 1fr .65fr .8fr;gap:12px;align-items:end;padding:15px;border:1px solid #e3eaf4;border-radius:14px}.filters label{display:grid;gap:7px;color:#334155;font-size:12px;font-weight:750}.filters input,.filters select{height:46px;padding:0 12px;border:1px solid #d7e0ec;border-radius:10px;background:#fff;font:inherit}.print-heading{display:none}.stats{display:grid;grid-template-columns:repeat(4,1fr);gap:12px}.stats article{padding:16px 17px;border:1px solid #e3eaf4;border-radius:14px}.stats span,.stats small{display:block;color:#64748b;font-size:11px}.stats strong{display:block;margin:7px 0 3px;font-size:25px}.stats.green strong{color:#047857}.stats.red strong{color:#be123c}.stats.blue strong{color:#1d4ed8}.analytics-grid{display:grid;grid-template-columns:1fr 1fr;gap:12px}.panel,.table-card{overflow:hidden;border:1px solid #e3eaf4;border-radius:15px}.panel{padding:18px}.panel-head,.table-head{display:flex;align-items:center;justify-content:space-between;gap:15px}.panel-head span{color:#64748b;font-size:9px;font-weight:900;letter-spacing:.09em}.panel-head h2,.table-head h2{margin:4px 0 0;font-size:16px}.panel-head>b{font-size:24px}.bar{display:flex;height:11px;overflow:hidden;margin:18px 0;border-radius:99px;background:#eef2f7}.bar i{display:block;height:100%}.bar .pass{background:#10b981}.bar .fail{background:#f43f5e}.legend{display:flex;flex-wrap:wrap;gap:18px}.legend span{display:flex;align-items:center;gap:6px;color:#64748b;font-size:11px}.legend b{color:#334155}.dot{width:7px;height:7px;border-radius:50%}.dot.pass{background:#10b981}.dot.fail{background:#f43f5e}.dot.pending{background:#f59e0b}.gpa-row{display:grid;grid-template-columns:repeat(3,1fr);gap:9px;margin-top:17px}.gpa-row div{padding:12px;border-radius:10px;background:#f8fafc}.gpa-row span,.gpa-row strong{display:block}.gpa-row span{color:#64748b;font-size:10px}.gpa-row strong{margin-top:5px;font-size:18px}.table-head{padding:17px 18px;border-bottom:1px solid #edf1f6}.table-head>span{padding:5px 9px;border-radius:99px;background:#f1f5f9;color:#64748b;font-size:10px;font-weight:800}.table-wrap{overflow:auto}table{width:100%;border-collapse:collapse}th,td{padding:11px 12px;border-bottom:1px solid #edf1f6;text-align:left;font-size:12px}th{background:#f8fafc;color:#64748b;font-size:9px;font-weight:900;letter-spacing:.08em;text-transform:uppercase}td b,td small{display:block}td small{margin-top:3px;color:#64748b}.rank{display:grid;width:27px;height:27px;place-items:center;border-radius:50%;background:#eef2ff;color:#4338ca;font-weight:900}.pill{display:inline-flex;padding:4px 8px;border-radius:99px;background:#fef3c7;color:#92400e;font-size:10px;font-weight:900}.pill.passed{background:#dcfce7;color:#166534}.pill.failed,.pill.absent{background:#fee2e2;color:#b91c1c}.empty{padding:34px!important;text-align:center;color:#64748b}.mini-progress{height:7px;overflow:hidden;border-radius:99px;background:#e5e7eb}.mini-progress i{display:block;height:100%;border-radius:inherit;background:linear-gradient(90deg,#2563eb,#60a5fa)}.progress-list{display:grid;gap:0}.progress-list article{display:grid;grid-template-columns:1fr auto;gap:8px;padding:15px 18px;border-bottom:1px solid #edf1f6}.progress-list article>b,.progress-list small{display:block}.progress-list small{margin-top:4px;color:#64748b;font-size:11px}.progress-list article>span{font-size:12px;font-weight:900}.progress-list .mini-progress{grid-column:1/-1}@media(max-width:950px){.hero{align-items:flex-start;flex-direction:column}.filters{grid-template-columns:1fr 1fr}.stats{grid-template-columns:repeat(2,1fr)}.analytics-grid{grid-template-columns:1fr}}@media(max-width:620px){.filters,.stats,.gpa-row{grid-template-columns:1fr}.actions{width:100%}.hero{padding:18px}}@media print{.no-print,.hero .actions,.notice{display:none!important}.reports-page{gap:12px}.hero{padding:0;border:0;background:none}.hero p,.eyebrow{display:none}.print-heading{display:block}.stats article,.panel,.table-card{break-inside:avoid;box-shadow:none}th,td{padding:7px;font-size:10px}}
</style>
