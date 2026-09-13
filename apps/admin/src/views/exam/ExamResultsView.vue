<template>
  <section class="result-page">
    <header class="page-heading print-hidden">
      <div><span class="eyebrow">EXAM RESULT WORKSPACE</span><h1>Full result sheet</h1><p>এক স্ক্রিনে সব শিক্ষার্থী, সব বিষয়, GPA, merit এবং publication status দেখুন।</p></div>
      <div class="heading-actions">
        <button class="secondary-button" type="button" :disabled="!rows.length" @click="exportCsv">Export CSV</button>
        <button class="secondary-button" type="button" :disabled="!rows.length" @click="printSheet">Print sheet</button>
        <button class="primary-button" type="button" :disabled="!examId || busy" @click="generateResults">{{ busy ? "Working…" : "Generate results" }}</button>
      </div>
    </header>

    <p v-if="message" :class="['notice', messageType]" class="print-hidden">{{ message }}</p>

    <section class="filter-bar print-hidden">
      <div class="exam-field"><BaseSelect v-model="examId" label="Examination" :options="examOptions" placeholder="Select examination" @change="loadResultSheet" /></div>
      <label class="field search-field"><span>Search</span><input v-model.trim="search" type="search" placeholder="Student, ID, roll or candidate" /></label>
      <label class="field"><span>Result</span><select v-model="statusFilter"><option value="">All</option><option value="PASSED">Passed</option><option value="FAILED">Failed</option><option value="ABSENT">Absent</option><option value="PENDING">Pending</option></select></label>
      <label class="field"><span>Online</span><select v-model="publishFilter"><option value="">All</option><option value="PUBLISHED">Published</option><option value="UNPUBLISHED">Unpublished</option></select></label>
    </section>

    <section v-if="examId" class="summary-strip print-hidden">
      <div><span>Students</span><strong>{{ rows.length }}</strong></div>
      <div><span>Subjects</span><strong>{{ subjects.length }}</strong></div>
      <div class="passed"><span>Passed</span><strong>{{ passedCount }}</strong><small>{{ passRate }}%</small></div>
      <div class="failed"><span>Failed / absent</span><strong>{{ failedCount }}</strong></div>
      <div class="published"><span>Published</span><strong>{{ publishedCount }}</strong><small>{{ publishedRate }}%</small></div>
    </section>

    <section class="sheet-panel">
      <div class="sheet-heading">
        <div>
          <span class="print-kicker">CLASS RESULT SHEET</span>
          <h2>{{ selectedExam?.exam_name || "Select an examination" }}</h2>
          <p v-if="selectedExam">{{ selectedExam.class_name || "Class" }}<template v-if="selectedExam.year_name"> · {{ selectedExam.year_name }}</template><template v-if="selectedExam.branch_name"> · {{ selectedExam.branch_name }}</template></p>
          <p v-else>Choose an examination to load the complete subject-wise result matrix.</p>
        </div>
        <div v-if="examId && rows.length" class="sheet-actions print-hidden">
          <span>{{ selectedIds.length }} selected</span>
          <button type="button" :disabled="!selectedIds.length || busy" @click="publish('STUDENTS')">Publish selected</button>
          <button class="danger-button" type="button" :disabled="!selectedIds.length || busy" @click="unpublish">Unpublish</button>
          <button class="primary-button" type="button" :disabled="busy" @click="publish('ALL')">Publish all</button>
        </div>
      </div>

      <div v-if="loading" class="loading-state"><span></span>Loading full result sheet…</div>

      <div v-else-if="rows.length" class="matrix-scroll">
        <table class="result-matrix">
          <thead><tr>
            <th class="select-column print-hidden"><input type="checkbox" :checked="allVisibleSelected" aria-label="Select visible students" @change="toggleVisible" /></th>
            <th class="merit-column">Merit</th><th class="student-column">Student</th><th class="identity-column">Roll / Group</th>
            <th v-for="subject in subjects" :key="subjectKey(subject)" class="subject-column"><strong>{{ subject.subject_name }}{{ paperLabel(subject.paper_no) }}</strong><small>{{ subject.subject_code }} · {{ displayNumber(subject.full_marks) }}</small></th>
            <th>Total</th><th>GPA</th><th>Grade</th><th>Result</th><th class="print-hidden">Online</th><th class="print-hidden"></th>
          </tr></thead>
          <tbody>
            <tr v-for="row in filteredRows" :key="row.result_id || row.student_id">
              <td class="select-column print-hidden"><input v-model="selectedIds" type="checkbox" :value="String(row.student_id)" :aria-label="`Select ${row.full_name}`" /></td>
              <td class="merit-column"><span class="merit-badge">{{ row.merit_position || "—" }}</span></td>
              <td class="student-column"><strong>{{ row.full_name || "Unnamed student" }}</strong><small>{{ row.student_no || `#${row.student_id}` }}<template v-if="row.candidate_no"> · {{ row.candidate_no }}</template></small></td>
              <td class="identity-column"><strong>{{ row.roll_no || "—" }}</strong><small>{{ [row.group_name, row.section_name].filter(Boolean).join(" · ") || "General" }}</small></td>
              <td v-for="subject in subjects" :key="subjectKey(subject)" class="mark-cell" :class="cellClass(subjectResult(row, subject))">
                <template v-if="subjectResult(row, subject)">
                  <strong>{{ subjectResult(row, subject).subject_status === "ABSENT" ? "ABS" : displayNumber(subjectResult(row, subject).obtained_marks) }}</strong>
                  <small>{{ subjectResult(row, subject).letter_grade || "—" }}<template v-if="subjectResult(row, subject).assignment_type === 'FOURTH_SUBJECT'"> · 4th</template><template v-else-if="subjectResult(row, subject).assignment_type === 'OPTIONAL'"> · Opt</template></small>
                </template>
                <span v-else class="not-assigned">—</span>
              </td>
              <td class="total-cell"><strong>{{ displayNumber(row.obtained_marks) }}</strong><small>/ {{ displayNumber(row.total_marks) }}</small></td>
              <td><strong>{{ fixed(row.gpa) }}</strong></td><td><strong>{{ row.letter_grade || "—" }}</strong></td>
              <td><span class="status-pill" :class="String(row.result_status || '').toLowerCase()">{{ row.result_status || "PENDING" }}</span><small v-if="Number(row.failed_subject_count)">{{ row.failed_subject_count }} failed</small></td>
              <td class="print-hidden"><span class="publish-pill" :class="{ online: row.published_at }">{{ row.published_at ? "Published" : "Offline" }}</span></td>
              <td class="print-hidden"><button class="text-button" type="button" @click="openResult(row)">Details</button></td>
            </tr>
            <tr v-if="!filteredRows.length"><td :colspan="matrixColumnCount" class="empty-cell">No students match the selected filters.</td></tr>
          </tbody>
        </table>
      </div>

      <div v-else class="empty-state">
        <span aria-hidden="true">▦</span><h3>{{ examId ? "No generated result found" : "Select an examination" }}</h3>
        <p>{{ examId ? "Enter marks and generate results to create the full result sheet." : "The subject matrix, totals, grades and merit positions will appear here." }}</p>
        <button v-if="examId" class="primary-button print-hidden" type="button" :disabled="busy" @click="generateResults">Generate results</button>
      </div>

      <footer v-if="rows.length" class="print-footer"><span>Prepared by</span><span>Checked by</span><span>Head of Institution</span></footer>
    </section>

    <div v-if="preview" class="modal-backdrop print-hidden" @click.self="closePreview">
      <article class="result-modal">
        <header><div><span class="eyebrow">STUDENT RESULT</span><h2>{{ detailStudent.full_name || preview.full_name }}</h2><p>{{ selectedExam?.exam_name }} · {{ detailStudent.student_no || preview.student_no }}</p></div><button class="close-button" type="button" aria-label="Close" @click="closePreview">×</button></header>
        <section class="student-summary">
          <div><span>Obtained</span><strong>{{ displayNumber(detailResult.obtained_marks ?? preview.obtained_marks) }} / {{ displayNumber(detailResult.total_marks ?? preview.total_marks) }}</strong></div>
          <div><span>GPA</span><strong>{{ fixed(detailResult.gpa ?? preview.gpa) }}</strong></div><div><span>Grade</span><strong>{{ detailResult.letter_grade || preview.letter_grade || "—" }}</strong></div><div><span>Result</span><strong>{{ detailResult.result_status || preview.result_status }}</strong></div>
        </section>
        <div class="detail-scroll"><table class="detail-table"><thead><tr><th>Subject</th><th>Type</th><th>Full</th><th>Pass</th><th>Marks</th><th>Grade / Point</th><th>Status</th></tr></thead><tbody><tr v-for="line in detailLines" :key="line.result_detail_id || subjectKey(line)"><td><strong>{{ line.subject_name }}{{ paperLabel(line.paper_no) }}</strong><small>{{ line.subject_code }}</small></td><td>{{ assignmentLabel(line.assignment_type) }}</td><td>{{ displayNumber(line.full_marks) }}</td><td>{{ displayNumber(line.pass_marks) }}</td><td><strong>{{ displayNumber(line.obtained_marks) }}</strong></td><td>{{ line.letter_grade || "—" }} · {{ displayNumber(line.grade_point) }}</td><td><span class="status-pill" :class="String(line.subject_status || '').toLowerCase()">{{ line.subject_status }}</span></td></tr></tbody></table></div>
        <footer class="modal-actions"><button class="secondary-button" type="button" @click="closePreview">Close</button><RouterLink class="primary-button document-link" :to="{ path: '/exams/documents', query: { exam: examId, student: preview.student_id } }">Open marksheet</RouterLink></footer>
      </article>
    </div>
  </section>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from "vue";
import api from "../../services/api";
import BaseSelect from "../../components/common/BaseSelect.vue";
import { confirmAction, notify } from "../../services/notification";

const exams = ref([]), rows = ref([]), subjects = ref([]), sheetExam = ref(null), examId = ref(""), search = ref(""), statusFilter = ref(""), publishFilter = ref(""), selectedIds = ref([]), loading = ref(false), busy = ref(false), message = ref(""), messageType = ref("success"), preview = ref(null), detail = ref({});
const examOptions = computed(() => exams.value.map((exam) => ({ value: exam.exam_id, label: [exam.exam_name, exam.class_name, exam.year_name].filter(Boolean).join(" · ") })));
const selectedExam = computed(() => sheetExam.value || exams.value.find((exam) => String(exam.exam_id) === String(examId.value)) || null);
const filteredRows = computed(() => rows.value.filter((row) => {
  const text = `${row.full_name || ""} ${row.student_no || ""} ${row.roll_no || ""} ${row.candidate_no || ""} ${row.group_name || ""}`.toLowerCase();
  const publication = row.published_at ? "PUBLISHED" : "UNPUBLISHED";
  return (!search.value || text.includes(search.value.toLowerCase())) && (!statusFilter.value || row.result_status === statusFilter.value) && (!publishFilter.value || publication === publishFilter.value);
}));
const passedCount = computed(() => rows.value.filter((row) => row.result_status === "PASSED").length);
const failedCount = computed(() => rows.value.filter((row) => ["FAILED", "ABSENT"].includes(row.result_status)).length);
const publishedCount = computed(() => rows.value.filter((row) => row.published_at).length);
const passRate = computed(() => rows.value.length ? Math.round(passedCount.value * 100 / rows.value.length) : 0);
const publishedRate = computed(() => rows.value.length ? Math.round(publishedCount.value * 100 / rows.value.length) : 0);
const allVisibleSelected = computed(() => filteredRows.value.length > 0 && filteredRows.value.every((row) => selectedIds.value.includes(String(row.student_id))));
const matrixColumnCount = computed(() => subjects.value.length + 10);
const detailStudent = computed(() => detail.value.student || detail.value.result || detail.value || {});
const detailResult = computed(() => detail.value.result || detail.value.student_result || detail.value || {});
const detailLines = computed(() => detail.value.subjects || detail.value.details || detail.value.result_details || []);
const paperLabel = (value) => Number(value) === 1 ? " — 1st" : Number(value) === 2 ? " — 2nd" : "";
const subjectKey = (subject) => `${subject.exam_subject_id || subject.subject_id}-${Number(subject.paper_no || 0)}`;
const displayNumber = (value) => { if (value === null || value === undefined || value === "") return "—"; const parsed = Number(value); return Number.isFinite(parsed) ? (Number.isInteger(parsed) ? String(parsed) : parsed.toFixed(2).replace(/0+$/, "").replace(/\.$/, "")) : String(value); };
const fixed = (value) => Number(value || 0).toFixed(2);

function assignmentLabel(value) { const type = String(value || "MANDATORY").toUpperCase(); return type === "FOURTH_SUBJECT" ? "4th Subject" : type === "OPTIONAL" ? "Optional" : "Mandatory"; }
function subjectResult(row, subject) { return row.subjectMap?.[subjectKey(subject)] || null; }
function cellClass(result) { return { failed: result?.subject_status === "FAILED", absent: result?.subject_status === "ABSENT", optional: ["OPTIONAL", "FOURTH_SUBJECT"].includes(result?.assignment_type) }; }
function normalizeSheet(payload) { return (Array.isArray(payload?.students) ? payload.students : []).map((student) => ({ ...student, subjectMap: Object.fromEntries((student.subjects || []).map((subject) => [subjectKey(subject), subject])) })); }
function show(text, type = "success") { message.value = text; messageType.value = type; type === "error" ? notify.error(text) : notify.success(text); }
function toggleVisible(event) { const ids = filteredRows.value.map((row) => String(row.student_id)); selectedIds.value = event.target.checked ? [...new Set([...selectedIds.value, ...ids])] : selectedIds.value.filter((id) => !ids.includes(id)); }

async function loadResultSheet() {
  selectedIds.value = []; rows.value = []; subjects.value = []; sheetExam.value = null;
  if (!examId.value) return;
  loading.value = true;
  try {
    const payload = (await api.get(`/exams/exams/${examId.value}/result-sheet`)).data?.data || {};
    subjects.value = Array.isArray(payload.subjects) ? payload.subjects : [];
    rows.value = normalizeSheet(payload);
    sheetExam.value = { ...(exams.value.find((exam) => String(exam.exam_id) === String(examId.value)) || {}), ...(payload.exam || {}) };
  } catch (error) { show(error.response?.data?.message || "Could not load the full result sheet.", "error"); }
  finally { loading.value = false; }
}

async function generateResults() {
  if (!await confirmAction({ title: "Generate examination results?", message: "Marks will be validated and every student's subject result, GPA and merit position will be recalculated.", confirmText: "Generate results", type: "warning" })) return;
  busy.value = true;
  try { const response = await api.post(`/exams/exams/${examId.value}/results/generate`); show(`${response.data.data?.processed || 0} student result(s) generated.`); await loadResultSheet(); }
  catch (error) { show(error.response?.data?.message || "Result generation failed.", "error"); }
  finally { busy.value = false; }
}

async function publish(scope) {
  const ids = scope === "STUDENTS" ? selectedIds.value : [];
  if (!await confirmAction({ title: scope === "ALL" ? "Publish all class results?" : "Publish selected results?", message: "Published results become available in the online student result view.", confirmText: "Publish results", type: "warning" })) return;
  busy.value = true;
  try { await api.post(`/exams/exams/${examId.value}/publish`, { scope, student_ids: ids }); show(scope === "ALL" ? "All class results are published." : `${ids.length} selected result(s) published.`); await loadResultSheet(); }
  catch (error) { show(error.response?.data?.message || "Could not publish results.", "error"); }
  finally { busy.value = false; }
}

async function unpublish() {
  if (!await confirmAction({ title: "Unpublish selected results?", message: "The selected students will no longer see these results online.", confirmText: "Unpublish", type: "warning" })) return;
  busy.value = true;
  try { const count = selectedIds.value.length; await api.post(`/exams/exams/${examId.value}/unpublish`, { scope: "STUDENTS", student_ids: selectedIds.value }); show(`${count} selected result(s) unpublished.`); await loadResultSheet(); }
  catch (error) { show(error.response?.data?.message || "Could not unpublish results.", "error"); }
  finally { busy.value = false; }
}

async function openResult(row) { preview.value = row; detail.value = { result: row, details: row.subjects || [] }; try { detail.value = (await api.get(`/exams/exams/${examId.value}/results/${row.student_id}`)).data.data || detail.value; } catch (error) { show(error.response?.data?.message || "Could not load result details.", "error"); } }
function closePreview() { preview.value = null; detail.value = {}; }
function csvCell(value) { return `"${String(value ?? "").replace(/"/g, '""')}"`; }
function exportCsv() {
  const headers = ["Merit", "Student ID", "Student", "Roll", "Group", ...subjects.value.map((subject) => `${subject.subject_name}${paperLabel(subject.paper_no)}`), "Obtained", "Total", "GPA", "Grade", "Result", "Published"];
  const lines = filteredRows.value.map((row) => [row.merit_position || "", row.student_no || row.student_id, row.full_name, row.roll_no || "", row.group_name || "", ...subjects.value.map((subject) => { const result = subjectResult(row, subject); return result ? `${result.subject_status === "ABSENT" ? "ABS" : displayNumber(result.obtained_marks)} (${result.letter_grade || "-"})` : ""; }), row.obtained_marks, row.total_marks, fixed(row.gpa), row.letter_grade, row.result_status, row.published_at ? "Published" : "Unpublished"]);
  const csv = `\ufeff${[headers, ...lines].map((line) => line.map(csvCell).join(",")).join("\r\n")}`;
  const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" })); const link = document.createElement("a"); link.href = url; link.download = `${String(selectedExam.value?.exam_name || "result-sheet").replace(/[^a-z0-9]+/gi, "-").replace(/^-|-$/g, "").toLowerCase()}-full-result.csv`; link.click(); URL.revokeObjectURL(url);
}
function printSheet() { document.body.classList.add("printing-result-sheet"); window.addEventListener("afterprint", clearPrintMode, { once: true }); window.print(); }
function clearPrintMode() { document.body.classList.remove("printing-result-sheet"); }
onMounted(async () => { try { exams.value = (await api.get("/exams/exams")).data.data || []; } catch (error) { show(error.response?.data?.message || "Could not load examinations.", "error"); } });
onBeforeUnmount(clearPrintMode);
</script>

<style scoped>
.result-page{--ink:#182033;--muted:#64748b;--line:#dfe6ef;display:grid;gap:14px;color:var(--ink)}.page-heading{display:flex;align-items:center;justify-content:space-between;gap:18px;padding:4px 1px 12px;border-bottom:1px solid var(--line)}.eyebrow,.print-kicker{display:block;margin-bottom:4px;color:#4f46e5;font-size:9px;font-weight:900;letter-spacing:.13em}.page-heading h1,.sheet-heading h2,.result-modal h2,.empty-state h3{margin:0;letter-spacing:-.025em}.page-heading h1{font-size:26px}.page-heading p,.sheet-heading p,.result-modal header p,.empty-state p{margin:5px 0 0;color:var(--muted);font-size:12px}.heading-actions,.sheet-actions,.modal-actions{display:flex;align-items:center;gap:7px}button,.document-link{font:inherit}.primary-button,.secondary-button,.sheet-actions button{display:inline-flex;align-items:center;justify-content:center;min-height:38px;padding:0 12px;border-radius:8px;font-size:11px;font-weight:850;text-decoration:none;cursor:pointer}.primary-button{border:1px solid #4f46e5;background:#4f46e5;color:#fff}.secondary-button,.sheet-actions button{border:1px solid #cbd5e1;background:#fff;color:#334155}.danger-button{border-color:#fecaca!important;color:#be123c!important}button:disabled{cursor:not-allowed;opacity:.45}.notice{margin:0;padding:9px 11px;border-radius:8px;font-size:12px;font-weight:700}.notice.success{background:#ecfdf5;color:#047857}.notice.error{background:#fff1f2;color:#be123c}
.filter-bar{display:grid;grid-template-columns:minmax(250px,1.35fr) minmax(210px,1fr) 130px 140px;gap:10px;align-items:end;padding:12px;border:1px solid var(--line);border-radius:10px;background:#fff}.field{display:grid;gap:5px}.field>span{color:#475569;font-size:9px;font-weight:900;text-transform:uppercase;letter-spacing:.05em}.field input,.field select{width:100%;height:42px;box-sizing:border-box;padding:0 10px;border:1px solid #d7e0ea;border-radius:8px;background:#fff;color:var(--ink);font:inherit;font-size:12px;outline:none}.field input:focus,.field select:focus{border-color:#818cf8;box-shadow:0 0 0 3px #eef2ff}.summary-strip{display:grid;grid-template-columns:repeat(5,1fr);overflow:hidden;border:1px solid var(--line);border-radius:10px;background:#fff}.summary-strip>div{display:flex;align-items:baseline;gap:8px;padding:10px 14px}.summary-strip>div+div{border-left:1px solid #edf1f5}.summary-strip span{color:var(--muted);font-size:9px;font-weight:850;text-transform:uppercase}.summary-strip strong{font-size:19px}.summary-strip small{color:var(--muted);font-size:9px}.summary-strip .passed strong{color:#047857}.summary-strip .failed strong{color:#be123c}.summary-strip .published strong{color:#1d4ed8}
.sheet-panel{overflow:hidden;border:1px solid var(--line);border-radius:11px;background:#fff}.sheet-heading{display:flex;align-items:center;justify-content:space-between;gap:14px;padding:15px 16px;border-bottom:1px solid var(--line)}.sheet-heading h2{font-size:17px}.sheet-actions>span{margin-right:4px;color:var(--muted);font-size:10px;font-weight:750}.sheet-actions button{min-height:32px;padding:0 9px;font-size:9px}.loading-state{display:flex;align-items:center;justify-content:center;gap:9px;min-height:280px;color:var(--muted);font-size:12px}.loading-state span{width:18px;height:18px;border:2px solid #c7d2fe;border-top-color:#4f46e5;border-radius:50%;animation:spin .75s linear infinite}
.matrix-scroll,.detail-scroll{width:100%;overflow:auto}.result-matrix{width:100%;min-width:max-content;border-collapse:separate;border-spacing:0}.result-matrix th,.result-matrix td{height:48px;padding:6px 8px;border-right:1px solid #edf1f5;border-bottom:1px solid #edf1f5;text-align:center;font-size:10px;vertical-align:middle}.result-matrix th{position:sticky;top:0;z-index:3;height:42px;background:#f7f9fc;color:#64748b;font-size:8px;font-weight:900;letter-spacing:.04em;text-transform:uppercase}.result-matrix th strong,.result-matrix th small,.result-matrix td strong,.result-matrix td small{display:block}.result-matrix th small,.result-matrix td small{margin-top:3px;color:#8390a3;font-size:8px;font-weight:600;text-transform:none}.result-matrix tbody tr:hover td{background:#fafbff}.result-matrix .select-column{width:32px}.result-matrix .merit-column{width:48px}.result-matrix .student-column{position:sticky;left:0;z-index:2;min-width:180px;max-width:210px;background:#fff;text-align:left}.result-matrix thead .student-column{z-index:4;background:#f7f9fc}.result-matrix .identity-column{min-width:95px;text-align:left}.subject-column{width:88px;max-width:105px;white-space:normal}.mark-cell{min-width:75px}.mark-cell.failed,.mark-cell.absent{background:#fff5f5;color:#b91c1c}.mark-cell.optional{box-shadow:inset 0 2px #bfdbfe}.not-assigned{color:#cbd5e1}.merit-badge{display:inline-grid!important;place-items:center;width:26px;height:26px;border-radius:50%;background:#eef2ff;color:#4338ca;font-weight:900}.total-cell{background:#f8fafc}.status-pill,.publish-pill{display:inline-flex;padding:4px 6px;border-radius:999px;background:#fef3c7;color:#92400e;font-size:8px;font-weight:900}.status-pill.passed,.publish-pill.online{background:#dcfce7;color:#166534}.status-pill.failed,.status-pill.absent{background:#fee2e2;color:#b91c1c}.publish-pill{background:#f1f5f9;color:#64748b}.text-button{border:0;background:transparent;color:#4f46e5;font-size:9px;font-weight:900;cursor:pointer}.empty-cell{height:130px!important;color:var(--muted);text-align:center!important}.empty-state{display:grid;place-items:center;min-height:300px;padding:30px;text-align:center}.empty-state>span{display:grid;place-items:center;width:48px;height:48px;border-radius:13px;background:#eef2ff;color:#4f46e5;font-size:23px}.empty-state h3{margin-top:12px;font-size:16px}.empty-state .primary-button{margin-top:14px}.print-footer{display:none}
.modal-backdrop{position:fixed;inset:0;z-index:1200;display:grid;place-items:center;padding:18px;background:#0f172a9e;backdrop-filter:blur(3px)}.result-modal{width:min(900px,100%);max-height:92vh;overflow:auto;padding:20px;border-radius:15px;background:#fff}.result-modal>header{display:flex;align-items:flex-start;justify-content:space-between;gap:15px}.result-modal h2{font-size:20px}.close-button{display:grid;place-items:center;width:34px;height:34px;border:0;border-radius:8px;background:#f1f5f9;color:#475569;font-size:22px;cursor:pointer}.student-summary{display:grid;grid-template-columns:repeat(4,1fr);gap:1px;margin:16px 0;background:var(--line);border:1px solid var(--line)}.student-summary div{padding:11px;background:#f8fafc}.student-summary span,.student-summary strong{display:block}.student-summary span{color:var(--muted);font-size:8px;font-weight:850;text-transform:uppercase}.student-summary strong{margin-top:4px;font-size:14px}.detail-table{width:100%;border-collapse:collapse}.detail-table th,.detail-table td{padding:9px;border-bottom:1px solid #e8edf3;text-align:left;font-size:10px}.detail-table th{background:#f8fafc;color:var(--muted);font-size:8px;text-transform:uppercase}.detail-table td strong,.detail-table td small{display:block}.detail-table td small{margin-top:2px;color:var(--muted);font-size:8px}.modal-actions{justify-content:flex-end;margin-top:16px}@keyframes spin{to{transform:rotate(360deg)}}
@media(max-width:1050px){.filter-bar{grid-template-columns:1fr 1fr}.summary-strip{grid-template-columns:repeat(3,1fr)}.summary-strip>div:nth-child(4){border-left:0}.page-heading,.sheet-heading{align-items:flex-start;flex-direction:column}}@media(max-width:650px){.filter-bar,.summary-strip,.student-summary{grid-template-columns:1fr}.summary-strip>div+div{border-top:1px solid #edf1f5;border-left:0}.heading-actions,.sheet-actions{width:100%;flex-wrap:wrap}.page-heading h1{font-size:23px}.result-modal{padding:15px}}
@media print{:global(body.printing-result-sheet *){visibility:hidden!important}.sheet-panel,.sheet-panel *{visibility:visible!important}.sheet-panel{position:absolute!important;inset:0!important;overflow:visible!important;border:0!important;border-radius:0!important}.sheet-heading{padding:0 0 7mm!important;border-bottom:1px solid #334155!important;text-align:center;justify-content:center!important}.sheet-heading>div:first-child{width:100%}.sheet-heading h2{font-size:15pt!important}.sheet-heading p{font-size:8pt!important}.print-kicker{font-size:7pt!important}.matrix-scroll{overflow:visible!important}.result-matrix{width:100%!important;min-width:0!important;border-collapse:collapse!important}.result-matrix th,.result-matrix td{position:static!important;height:auto!important;padding:2mm 1.2mm!important;border:1px solid #94a3b8!important;font-size:6.5pt!important}.result-matrix th{font-size:5.5pt!important}.result-matrix th small,.result-matrix td small{font-size:5pt!important}.result-matrix .student-column{min-width:28mm!important;max-width:35mm!important}.result-matrix .identity-column{min-width:15mm!important}.subject-column,.mark-cell{min-width:12mm!important;width:auto!important}.merit-badge{width:auto!important;height:auto!important;background:transparent!important}.status-pill{padding:0!important;background:transparent!important;color:#111827!important}.print-footer{display:grid!important;grid-template-columns:repeat(3,1fr);gap:25mm;margin-top:18mm}.print-footer span{padding-top:3mm;border-top:1px solid #334155;text-align:center;font-size:7pt}.print-hidden{display:none!important}@page{size:A4 landscape;margin:9mm}}
</style>
