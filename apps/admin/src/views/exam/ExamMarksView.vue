<template>
  <section class="marks-page">
    <header class="hero-panel">
      <div>
        <span class="eyebrow">ASSESSMENT WORKSPACE</span>
        <h1>Fast Marks Entry</h1>
        <p>শ্রেণি ও বিষয়ভিত্তিক Written, MCQ, Practical, Viva অথবা Total নম্বর দ্রুত সংরক্ষণ করুন।</p>
      </div>
      <div class="save-actions print-hidden">
        <button
          class="secondary-button"
          type="button"
          :disabled="!hasGrid || saving || !dirtyCount"
          @click="saveMarks('DRAFT')"
        >
          {{ savingMode === "DRAFT" ? "Saving…" : `Save Draft${dirtyCount ? ` (${dirtyCount})` : ""}` }}
        </button>
        <button
          v-if="canVerify"
          class="primary-button"
          type="button"
          :disabled="!canVerifyGrid || saving"
          @click="saveMarks('VERIFIED')"
        >
          {{ savingMode === "VERIFIED" ? "Verifying…" : "Verify & Save" }}
        </button>
      </div>
    </header>

    <article class="selector-panel print-hidden">
      <div class="select-control">
        <span>Exam / পরীক্ষা</span>
        <BaseSelect
          v-model="examId"
          :options="examOptions"
          placeholder="Select an exam"
          :disabled="initialLoading || saving"
          @change="selectExam"
        />
      </div>
      <div class="select-control">
        <span>Subject / বিষয়</span>
        <BaseSelect
          v-model="subjectId"
          :options="subjectOptions"
          placeholder="Select a subject"
          :disabled="!examId || loadingSubjects || saving"
          @change="selectSubject"
        />
      </div>
      <div class="selector-note">
        <strong>Keyboard tip</strong>
        <small>Enter চাপলে পরের নম্বর ঘরে যাবে। অনুপস্থিত হলে “A” টিক দিন।</small>
      </div>
    </article>

    <div v-if="errorMessage" class="feedback error-feedback" role="alert">
      <span aria-hidden="true">!</span>
      <div><strong>Marks workspace error</strong><p>{{ errorMessage }}</p></div>
      <button v-if="examId && subjectId" type="button" @click="loadMarks">Retry</button>
    </div>

    <div v-if="successMessage" class="feedback success-feedback" role="status">
      <span aria-hidden="true">✓</span>
      <div><strong>Saved successfully</strong><p>{{ successMessage }}</p></div>
    </div>

    <div v-if="initialLoading" class="loading-state"><span class="spinner"></span> Loading examinations…</div>

    <div v-else-if="loadingSubjects || loadingMarks" class="loading-state">
      <span class="spinner"></span>
      {{ loadingSubjects ? "Loading exam subjects…" : "Preparing marks grid…" }}
    </div>

    <template v-else-if="hasGrid">
      <section class="summary-grid print-hidden" aria-label="Marks entry summary">
        <article class="summary-card tone-indigo"><span>Students</span><strong>{{ students.length }}</strong><small>{{ selectedSubject?.subject_name }}{{ paperLabel(selectedSubject?.paper_no) }}</small></article>
        <article class="summary-card tone-blue"><span>Progress</span><strong>{{ progressPercent }}%</strong><small>{{ completedCount }} of {{ totalCellCount }} entries</small></article>
        <article class="summary-card" :class="invalidCount ? 'tone-red' : 'tone-green'"><span>Validation</span><strong>{{ invalidCount }}</strong><small>{{ invalidCount ? "Invalid marks need attention" : "All entered marks are valid" }}</small></article>
        <article class="summary-card tone-amber"><span>Unsaved</span><strong>{{ dirtyCount }}</strong><small>{{ verifiedCellCount }} verified entries</small></article>
      </section>

      <article class="grid-panel">
        <div class="grid-toolbar print-hidden">
          <div>
            <span class="eyebrow">{{ selectedSubject?.subject_code || "SUBJECT" }}</span>
            <h2>{{ selectedSubject?.subject_name }}{{ paperLabel(selectedSubject?.paper_no) }}</h2>
            <p>{{ currentExam?.exam_name }} · {{ currentExam?.class_name || "All classes" }}</p>
          </div>
          <label class="search-field">
            <span aria-hidden="true">⌕</span>
            <input v-model.trim="search" type="search" placeholder="Search candidate or student" aria-label="Search students" />
          </label>
        </div>

        <div v-if="loadingMarks" class="table-loading"><span class="spinner"></span> Preparing marks grid…</div>

        <div v-else ref="gridRoot" class="marks-table-scroll">
          <table class="marks-table">
            <thead>
              <tr>
                <th class="student-heading sticky-column">Candidate / Student</th>
                <th v-for="component in components" :key="component.key" class="component-heading">
                  <strong>{{ component.name }}</strong>
                  <span>Max {{ displayMark(component.fullMarks) }}</span>
                  <small v-if="component.passMarks != null">Pass {{ displayMark(component.passMarks) }}</small>
                </th>
                <th class="status-heading">Status</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(student, rowIndex) in filteredStudents" :key="student.studentId">
                <td class="student-cell sticky-column">
                  <strong>{{ student.candidateNo || "Candidate pending" }}</strong>
                  <span>{{ student.fullName }}</span>
                  <small>{{ student.studentNo || `Student #${student.studentId}` }}</small>
                </td>
                <td v-for="(component, columnIndex) in components" :key="component.key" class="mark-cell">
                  <div
                    class="mark-control"
                    :class="{
                      invalid: isInvalid(student.cells[component.key], component),
                      absent: student.cells[component.key].isAbsent,
                      dirty: student.cells[component.key].dirty,
                    }"
                  >
                    <input
                      v-model="student.cells[component.key].value"
                      data-mark-input
                      type="number"
                      inputmode="decimal"
                      min="0"
                      :max="component.fullMarks"
                      step="0.01"
                      :disabled="student.cells[component.key].isAbsent || saving || isLocked(student.cells[component.key])"
                      :title="isLocked(student.cells[component.key]) ? 'Verified marks require approval permission to edit' : ''"
                      :aria-label="`${component.name} marks for ${student.fullName}`"
                      @input="markDirty(student.cells[component.key])"
                      @keydown.enter.prevent="focusNext($event)"
                    />
                    <label class="absent-toggle" :title="`Mark ${student.fullName} absent for ${component.name}`">
                      <input
                        v-model="student.cells[component.key].isAbsent"
                        type="checkbox"
                        :disabled="saving || isLocked(student.cells[component.key])"
                        @change="toggleAbsent(student.cells[component.key])"
                      />
                      <span>A</span>
                    </label>
                  </div>
                  <small v-if="isInvalid(student.cells[component.key], component)" class="cell-error">
                    Use 0–{{ displayMark(component.fullMarks) }}
                  </small>
                </td>
                <td class="row-status">
                  <span class="status-badge" :class="rowStatus(student).tone">{{ rowStatus(student).label }}</span>
                </td>
              </tr>
              <tr v-if="!filteredStudents.length">
                <td :colspan="components.length + 2" class="empty-cell">
                  <strong>No student matches your search.</strong>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <footer class="grid-footer print-hidden">
          <div class="progress-copy">
            <div><strong>{{ progressPercent }}% complete</strong><span>{{ completedCount }} / {{ totalCellCount }} cells</span></div>
            <div class="progress-track"><span :style="{ width: `${progressPercent}%` }"></span></div>
          </div>
          <div class="footer-actions">
            <span v-if="invalidCount" class="validation-warning">{{ invalidCount }} invalid</span>
            <button class="secondary-button" type="button" :disabled="saving || !dirtyCount" @click="saveMarks('DRAFT')">Save Draft</button>
            <button v-if="canVerify" class="primary-button" type="button" :disabled="!canVerifyGrid || saving" @click="saveMarks('VERIFIED')">Verify & Save</button>
          </div>
        </footer>
      </article>
    </template>

    <article v-else-if="examId && subjectId && !loadingMarks" class="empty-selection">
      <div aria-hidden="true">∅</div>
      <h2>No candidate rows available</h2>
      <p>Generate the exam candidate list before entering marks.</p>
    </article>

    <article v-else-if="!initialLoading" class="empty-selection">
      <div aria-hidden="true">✎</div>
      <h2>{{ examId ? "Select a subject" : "Select an exam" }}</h2>
      <p>{{ examId ? "বিষয় নির্বাচন করলে component-wise marks grid তৈরি হবে।" : "পরীক্ষা নির্বাচন করে দ্রুত নম্বর এন্ট্রি শুরু করুন।" }}</p>
    </article>
  </section>
</template>

<script setup>
import { computed, onMounted, ref } from "vue";
import api from "../../services/api";
import BaseSelect from "../../components/common/BaseSelect.vue";
import { can } from "../../utils/permission";
import { confirmAction, notify } from "../../services/notification";

const exams = ref([]);
const subjects = ref([]);
const students = ref([]);
const components = ref([]);
const examId = ref("");
const subjectId = ref("");
const search = ref("");
const initialLoading = ref(true);
const loadingSubjects = ref(false);
const loadingMarks = ref(false);
const saving = ref(false);
const savingMode = ref("");
const errorMessage = ref("");
const successMessage = ref("");
const gridRoot = ref(null);

const canVerify = computed(() => can("exam.management", "approve"));
const examOptions = computed(() => exams.value.map((exam) => ({
  value: exam.exam_id,
  label: [exam.exam_name, exam.class_name, exam.year_name].filter(Boolean).join(" · "),
})));
const subjectOptions = computed(() => subjects.value.map((subject) => ({
  value: subject.exam_subject_id,
  label: [subject.subject_code, `${subject.subject_name || ''}${paperLabel(subject.paper_no)}`].filter(Boolean).join(" — "),
})));
const currentExam = computed(() => exams.value.find((exam) => String(exam.exam_id) === String(examId.value)) || null);
const selectedSubject = computed(() => subjects.value.find((subject) => String(subject.exam_subject_id) === String(subjectId.value)) || null);
const paperLabel = (value) => Number(value) === 1 ? ' — 1st Paper' : Number(value) === 2 ? ' — 2nd Paper' : '';
const hasGrid = computed(() => students.value.length > 0 && components.value.length > 0);

const filteredStudents = computed(() => {
  const term = search.value.toLowerCase();
  if (!term) return students.value;
  return students.value.filter((student) => `${student.candidateNo || ""} ${student.studentNo || ""} ${student.fullName || ""}`.toLowerCase().includes(term));
});

const allCells = computed(() => students.value.flatMap((student) => components.value.map((component) => ({
  student,
  component,
  cell: student.cells[component.key],
}))));

const totalCellCount = computed(() => allCells.value.length);
const completedCount = computed(() => allCells.value.filter(({ cell }) => isCompleted(cell)).length);
const invalidCount = computed(() => allCells.value.filter(({ cell, component }) => isInvalid(cell, component)).length);
const dirtyCount = computed(() => allCells.value.filter(({ cell }) => cell.dirty).length);
const verifiedCellCount = computed(() => allCells.value.filter(({ cell }) => String(cell.entryStatus).toUpperCase() === "VERIFIED").length);
const progressPercent = computed(() => totalCellCount.value ? Math.round((completedCount.value / totalCellCount.value) * 100) : 0);
const canVerifyGrid = computed(() => canVerify.value && hasGrid.value && completedCount.value === totalCellCount.value && invalidCount.value === 0 && !saving.value);

function responseRows(response) {
  const payload = response?.data?.data;
  return Array.isArray(payload) ? payload : payload?.rows || payload?.marks || [];
}

function clearMessages() {
  errorMessage.value = "";
  successMessage.value = "";
}

function displayMark(value) {
  const number = Number(value || 0);
  return Number.isInteger(number) ? number : number.toFixed(2).replace(/0+$/, "").replace(/\.$/, "");
}

function componentKey(row) {
  const id = row.component_id ?? row.mark_component_id;
  if (id !== null && id !== undefined && id !== "") return `component:${id}`;
  return "legacy:total";
}

function componentFromRow(row) {
  const id = row.component_id ?? row.mark_component_id ?? null;
  const name = row.component_name || row.component_code || "Total";
  return {
    key: componentKey(row),
    id,
    code: row.component_code || (id == null ? "TOTAL" : ""),
    name,
    fullMarks: Number(row.component_full_marks ?? row.full_marks ?? selectedSubject.value?.full_marks ?? 0),
    passMarks: row.component_pass_marks == null
      ? (id == null ? Number(row.pass_marks ?? selectedSubject.value?.pass_marks ?? 0) : null)
      : Number(row.component_pass_marks),
  };
}

function asBoolean(value) {
  return value === true || value === 1 || value === "1" || String(value).toLowerCase() === "true";
}

function cellFromRow(row) {
  const hasMark = row.mark_id != null || row.marks_obtained !== null && row.marks_obtained !== undefined;
  return {
    markId: row.mark_id ?? null,
    value: hasMark && !asBoolean(row.is_absent) ? String(row.marks_obtained ?? "") : "",
    isAbsent: asBoolean(row.is_absent),
    remarks: row.remarks || "",
    entryStatus: String(row.entry_status || "DRAFT").toUpperCase(),
    dirty: false,
  };
}

function buildGrid(rows) {
  const componentMap = new Map();
  const studentMap = new Map();

  rows.forEach((row) => {
    const component = componentFromRow(row);
    if (!componentMap.has(component.key)) componentMap.set(component.key, component);

    const studentId = row.student_id;
    if (studentId == null) return;
    if (!studentMap.has(String(studentId))) {
      studentMap.set(String(studentId), {
        studentId,
        candidateNo: row.candidate_no || "",
        studentNo: row.student_no || "",
        fullName: row.full_name || row.student_name || `Student #${studentId}`,
        cells: {},
      });
    }
    studentMap.get(String(studentId)).cells[component.key] = cellFromRow(row);
  });

  const nextComponents = [...componentMap.values()];
  const nextStudents = [...studentMap.values()];
  nextStudents.forEach((student) => {
    nextComponents.forEach((component) => {
      if (!student.cells[component.key]) student.cells[component.key] = cellFromRow({});
    });
  });

  components.value = nextComponents;
  students.value = nextStudents;
}

function isCompleted(cell) {
  return Boolean(cell?.isAbsent) || cell?.value !== "" && cell?.value !== null && cell?.value !== undefined;
}

function isInvalid(cell, component) {
  if (!cell || cell.isAbsent || cell.value === "") return false;
  const value = Number(cell.value);
  return !Number.isFinite(value) || value < 0 || value > Number(component.fullMarks);
}

function isLocked(cell) {
  return String(cell?.entryStatus || "").toUpperCase() === "VERIFIED" && !canVerify.value;
}

function markDirty(cell) {
  cell.dirty = true;
  successMessage.value = "";
}

function toggleAbsent(cell) {
  if (cell.isAbsent) cell.value = "";
  markDirty(cell);
}

function focusNext(event) {
  const inputs = [...(gridRoot.value?.querySelectorAll("input[data-mark-input]:not(:disabled)") || [])];
  const index = inputs.indexOf(event.currentTarget);
  const next = inputs[index + 1];
  if (next) {
    next.focus();
    next.select();
  }
}

function rowStatus(student) {
  const cells = components.value.map((component) => student.cells[component.key]);
  if (cells.some((cell, index) => isInvalid(cell, components.value[index]))) return { label: "Invalid", tone: "status-danger" };
  if (cells.every((cell) => String(cell.entryStatus).toUpperCase() === "VERIFIED")) return { label: "Verified", tone: "status-success" };
  if (cells.some((cell) => cell.dirty)) return { label: "Unsaved", tone: "status-warning" };
  if (cells.every(isCompleted)) return { label: "Complete", tone: "status-info" };
  return { label: "Pending", tone: "status-muted" };
}

async function loadInitialData() {
  initialLoading.value = true;
  clearMessages();
  try {
    const [lookupResponse, examResponse] = await Promise.all([
      api.get("/exams/lookups"),
      api.get("/exams/exams"),
    ]);
    const lookupData = lookupResponse.data?.data || {};
    const examRows = responseRows(examResponse);
    exams.value = examRows.map((exam) => ({
      ...exam,
      class_name: exam.class_name || lookupData.classes?.find((item) => String(item.class_id) === String(exam.class_id))?.class_name,
      year_name: exam.year_name || lookupData.years?.find((item) => String(item.academic_year_id) === String(exam.academic_year_id))?.year_name,
    }));
  } catch (error) {
    errorMessage.value = error.response?.data?.message || "Failed to load exam information.";
  } finally {
    initialLoading.value = false;
  }
}

async function selectExam(value) {
  examId.value = value || "";
  subjectId.value = "";
  subjects.value = [];
  students.value = [];
  components.value = [];
  search.value = "";
  clearMessages();
  if (!examId.value) return;

  loadingSubjects.value = true;
  try {
    const response = await api.get(`/exams/exams/${examId.value}/subjects`);
    subjects.value = responseRows(response);
    if (subjects.value.length === 1) {
      subjectId.value = subjects.value[0].exam_subject_id;
      await loadMarks();
    }
  } catch (error) {
    errorMessage.value = error.response?.data?.message || "Failed to load exam subjects.";
  } finally {
    loadingSubjects.value = false;
  }
}

async function selectSubject(value) {
  subjectId.value = value || "";
  students.value = [];
  components.value = [];
  search.value = "";
  clearMessages();
  if (subjectId.value) await loadMarks();
}

async function loadMarks() {
  if (!examId.value || !subjectId.value) return;
  loadingMarks.value = true;
  clearMessages();
  try {
    const response = await api.get(`/exams/exams/${examId.value}/marks`, {
      params: { exam_subject_id: subjectId.value },
    });
    buildGrid(responseRows(response));
  } catch (error) {
    students.value = [];
    components.value = [];
    errorMessage.value = error.response?.data?.message || "Failed to prepare the marks grid.";
  } finally {
    loadingMarks.value = false;
  }
}

function payloadFor(mode) {
  const source = mode === "VERIFIED"
    ? allCells.value.filter(({ cell }) => isCompleted(cell))
    : allCells.value.filter(({ cell }) => cell.dirty);

  return source.map(({ student, component, cell }) => ({
    exam_subject_id: Number(subjectId.value),
    student_id: student.studentId,
    component_id: component.id,
    marks_obtained: cell.isAbsent ? 0 : Number(cell.value),
    is_absent: Boolean(cell.isAbsent),
    remarks: cell.remarks || null,
    entry_status: mode === "VERIFIED" && canVerify.value
      ? "VERIFIED"
      : cell.entryStatus === "VERIFIED" ? "VERIFIED" : "DRAFT",
  }));
}

async function saveMarks(mode) {
  if (saving.value || invalidCount.value) {
    if (invalidCount.value) notify.warning("Correct invalid marks before saving.");
    return;
  }

  if (mode === "VERIFIED") {
    if (!canVerify.value) {
      notify.error("You do not have approval permission to verify marks.");
      return;
    }
    if (completedCount.value !== totalCellCount.value) {
      notify.warning("Complete every candidate and component before verification.");
      return;
    }
    const confirmed = await confirmAction({
      title: "Verify all marks?",
      message: `This will save ${totalCellCount.value} entries as verified for ${selectedSubject.value?.subject_name || "this subject"}.`,
      confirmText: "Verify & save",
      type: "warning",
    });
    if (!confirmed) return;
  }

  const marks = payloadFor(mode);
  if (!marks.length) {
    notify.info("There are no changed marks to save.");
    return;
  }

  saving.value = true;
  savingMode.value = mode;
  clearMessages();
  try {
    const response = await api.put("/exams/marks", { marks });
    const saved = Number(response.data?.data?.saved ?? marks.length);
    successMessage.value = `${saved} mark entr${saved === 1 ? "y" : "ies"} saved as ${mode === "VERIFIED" ? "verified" : "draft"}.`;
    notify.success(successMessage.value);
    await loadMarks();
    successMessage.value = `${saved} mark entr${saved === 1 ? "y" : "ies"} saved as ${mode === "VERIFIED" ? "verified" : "draft"}.`;
  } catch (error) {
    errorMessage.value = error.response?.data?.message || "Could not save marks.";
    notify.error(errorMessage.value);
  } finally {
    saving.value = false;
    savingMode.value = "";
  }
}

onMounted(loadInitialData);
</script>

<style scoped>
.marks-page{--ink:#172033;--muted:#64748b;--line:#dfe7f1;display:grid;gap:18px;color:var(--ink)}.hero-panel,.selector-panel,.grid-panel,.empty-selection{border:1px solid var(--line);border-radius:18px;background:#fff;box-shadow:0 8px 28px rgba(15,23,42,.055)}.hero-panel{display:flex;align-items:center;justify-content:space-between;gap:20px;padding:24px;background:linear-gradient(125deg,#f7f9ff,#eef2ff 52%,#f8fbff)}.eyebrow{display:block;margin-bottom:5px;color:#4f46e5;font-size:10px;font-weight:900;letter-spacing:.13em}.hero-panel h1,.grid-toolbar h2,.empty-selection h2{margin:0;color:var(--ink)}.hero-panel h1{font-size:28px;letter-spacing:-.035em}.hero-panel p,.grid-toolbar p,.empty-selection p{margin:6px 0 0;color:var(--muted);font-size:13px;line-height:1.55}.save-actions,.footer-actions{display:flex;align-items:center;gap:9px}.primary-button,.secondary-button{display:inline-flex;align-items:center;justify-content:center;min-height:42px;padding:0 15px;border-radius:10px;font:inherit;font-size:13px;font-weight:850;cursor:pointer}.primary-button{border:0;background:linear-gradient(135deg,#4f46e5,#2563eb);color:#fff;box-shadow:0 9px 20px rgba(79,70,229,.2)}.secondary-button{border:1px solid #cbd5e1;background:#fff;color:#334155}.primary-button:disabled,.secondary-button:disabled{cursor:not-allowed;opacity:.52;box-shadow:none}.selector-panel{display:grid;grid-template-columns:minmax(240px,1fr) minmax(240px,1fr) minmax(220px,.8fr);gap:16px;align-items:end;padding:18px 20px}.select-control{display:grid;gap:6px}.select-control>span{color:#334155;font-size:11px;font-weight:850}.selector-note{display:grid;gap:3px;align-content:center;min-height:69px;padding:11px 13px;border:1px solid #dbeafe;border-radius:11px;background:#f8fbff}.selector-note strong{color:#1e40af;font-size:11px}.selector-note small{color:#64748b;font-size:10px;line-height:1.45}.feedback{display:flex;align-items:center;gap:11px;padding:12px 14px;border-radius:12px;font-size:12px}.feedback>span{display:grid;place-items:center;width:25px;height:25px;border-radius:50%;font-weight:900}.feedback strong{display:block}.feedback p{margin:2px 0 0}.feedback button{margin-left:auto;border:0;background:transparent;color:inherit;font-weight:850}.error-feedback{border:1px solid #fecaca;background:#fff1f2;color:#9f1239}.error-feedback>span{background:#fecdd3}.success-feedback{border:1px solid #bbf7d0;background:#f0fdf4;color:#166534}.success-feedback>span{background:#dcfce7}.summary-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:13px}.summary-card{min-height:110px;padding:16px 18px;border:1px solid transparent;border-radius:15px}.summary-card span{font-size:10px;font-weight:850;text-transform:uppercase;letter-spacing:.055em}.summary-card strong{display:block;margin:9px 0 5px;font-size:28px;line-height:1}.summary-card small{font-size:11px;opacity:.75}.tone-indigo{border-color:#c7d2fe;background:#eef2ff;color:#3730a3}.tone-blue{border-color:#bfdbfe;background:#eff6ff;color:#1d4ed8}.tone-green{border-color:#a7f3d0;background:#ecfdf5;color:#047857}.tone-red{border-color:#fecaca;background:#fff1f2;color:#be123c}.tone-amber{border-color:#fde68a;background:#fffbeb;color:#b45309}.grid-panel{overflow:hidden}.grid-toolbar{display:flex;align-items:flex-end;justify-content:space-between;gap:18px;padding:20px;border-bottom:1px solid var(--line)}.grid-toolbar h2{font-size:19px}.search-field{display:flex;align-items:center;gap:8px;width:min(340px,40vw);min-height:42px;padding:0 12px;border:1px solid #d7e0ec;border-radius:10px;background:#f8fafc;color:#94a3b8}.search-field:focus-within{border-color:#6366f1;background:#fff;box-shadow:0 0 0 3px rgba(99,102,241,.1)}.search-field input{width:100%;border:0;outline:0;background:transparent;color:var(--ink);font:inherit;font-size:13px}.marks-table-scroll{width:100%;overflow:auto;overscroll-behavior-inline:contain}.marks-table{width:100%;min-width:max(780px,100%);border-collapse:separate;border-spacing:0}.marks-table th,.marks-table td{padding:11px 12px;border-right:1px solid #edf1f6;border-bottom:1px solid #edf1f6;text-align:left;vertical-align:middle}.marks-table th{position:sticky;top:0;z-index:5;background:#f8fafc;color:#64748b;font-size:10px;font-weight:900;letter-spacing:.045em;text-transform:uppercase}.sticky-column{position:sticky!important;left:0;z-index:4!important;width:230px;min-width:230px;max-width:230px}.student-heading{z-index:7!important}.student-cell{background:#fff}.marks-table tbody tr:nth-child(even) .student-cell,.marks-table tbody tr:nth-child(even){background:#fbfdff}.marks-table tbody tr:hover,.marks-table tbody tr:hover .student-cell{background:#f5f8ff}.student-cell strong,.student-cell span,.student-cell small{display:block}.student-cell strong{color:#4338ca;font-size:12px}.student-cell span{margin-top:3px;color:#1e293b;font-size:13px;font-weight:750}.student-cell small{margin-top:2px;color:var(--muted);font-size:10px}.component-heading{min-width:155px;text-align:center!important}.component-heading strong,.component-heading span,.component-heading small{display:block}.component-heading strong{color:#334155;font-size:11px}.component-heading span{margin-top:3px;color:#4f46e5;font-size:9px}.component-heading small{margin-top:1px;color:#94a3b8;font-size:9px}.status-heading{min-width:95px}.mark-cell{min-width:155px}.mark-control{display:grid;grid-template-columns:minmax(72px,1fr) 36px;gap:7px;align-items:center;padding:4px;border:1px solid #dbe3ef;border-radius:10px;background:#fff;transition:.16s}.mark-control:focus-within{border-color:#6366f1;box-shadow:0 0 0 3px rgba(99,102,241,.1)}.mark-control.dirty{border-color:#f59e0b;background:#fffbeb}.mark-control.invalid{border-color:#ef4444;background:#fff1f2;box-shadow:0 0 0 3px rgba(239,68,68,.09)}.mark-control.absent{border-color:#fda4af;background:#fff1f2}.mark-control>input{width:100%;height:34px;padding:0 7px;border:0;outline:0;background:transparent;color:#172033;font:inherit;font-size:14px;font-weight:800}.mark-control>input:disabled{color:#94a3b8}.absent-toggle{position:relative;display:grid;place-items:center;width:32px;height:32px;cursor:pointer}.absent-toggle input{position:absolute;opacity:0;pointer-events:none}.absent-toggle span{display:grid;place-items:center;width:28px;height:28px;border:1px solid #cbd5e1;border-radius:7px;background:#f8fafc;color:#64748b;font-size:11px;font-weight:900}.absent-toggle input:checked+span{border-color:#fb7185;background:#ffe4e6;color:#be123c}.absent-toggle input:focus-visible+span{outline:3px solid rgba(99,102,241,.18)}.cell-error{display:block;margin-top:4px;color:#dc2626;font-size:9px;font-weight:750}.row-status{text-align:center!important}.status-badge{display:inline-flex;padding:5px 7px;border-radius:999px;font-size:9px;font-weight:900;text-transform:uppercase}.status-success{background:#dcfce7;color:#166534}.status-warning{background:#fef3c7;color:#92400e}.status-danger{background:#fee2e2;color:#b91c1c}.status-info{background:#dbeafe;color:#1d4ed8}.status-muted{background:#f1f5f9;color:#64748b}.empty-cell{height:150px;text-align:center!important;color:var(--muted)}.grid-footer{display:flex;align-items:center;justify-content:space-between;gap:20px;padding:15px 18px;background:#f8fafc}.progress-copy{display:grid;grid-template-columns:170px minmax(180px,300px);gap:14px;align-items:center}.progress-copy>div:first-child{display:flex;justify-content:space-between;gap:12px;font-size:11px}.progress-copy span{color:var(--muted)}.progress-track{height:7px;overflow:hidden;border-radius:999px;background:#e2e8f0}.progress-track span{display:block;height:100%;border-radius:inherit;background:linear-gradient(90deg,#4f46e5,#38bdf8);transition:width .2s}.validation-warning{padding:5px 8px;border-radius:999px;background:#fee2e2;color:#b91c1c;font-size:10px;font-weight:850}.loading-state,.table-loading{display:flex;align-items:center;justify-content:center;gap:10px;color:var(--muted);font-size:13px}.loading-state{min-height:190px;border:1px dashed #cbd5e1;border-radius:16px;background:#fff}.table-loading{min-height:260px}.spinner{width:20px;height:20px;border:2px solid #c7d2fe;border-top-color:#4f46e5;border-radius:50%;animation:spin .75s linear infinite}.empty-selection{display:grid;place-items:center;min-height:270px;padding:30px;text-align:center}.empty-selection>div{display:grid;place-items:center;width:58px;height:58px;margin-bottom:12px;border-radius:18px;background:#eef2ff;color:#4f46e5;font-size:26px}@keyframes spin{to{transform:rotate(360deg)}}
@media(max-width:1050px){.selector-panel{grid-template-columns:1fr 1fr}.selector-note{grid-column:1/-1}.summary-grid{grid-template-columns:repeat(2,1fr)}.grid-footer{align-items:stretch;flex-direction:column}.progress-copy{grid-template-columns:160px 1fr}.footer-actions{justify-content:flex-end}}
@media(max-width:680px){.hero-panel{align-items:flex-start;flex-direction:column;padding:20px}.hero-panel h1{font-size:24px}.save-actions{width:100%}.save-actions button{flex:1}.selector-panel{grid-template-columns:1fr}.selector-note{grid-column:auto}.summary-grid{grid-template-columns:1fr 1fr}.summary-card{min-height:102px;padding:14px}.summary-card strong{font-size:25px}.grid-toolbar{align-items:stretch;flex-direction:column}.search-field{width:100%}.grid-footer{padding:14px}.progress-copy{grid-template-columns:1fr}.footer-actions{display:grid;grid-template-columns:1fr 1fr}.validation-warning{grid-column:1/-1;text-align:center}.sticky-column{width:190px;min-width:190px;max-width:190px}}
@media print{:global(body:has(.marks-page) .sidebar),:global(body:has(.marks-page) .header-bar),:global(body:has(.marks-page) .breadcrumb),:global(body:has(.marks-page) .page-title),:global(body:has(.marks-page) footer){display:none!important}:global(body:has(.marks-page) .main-area){width:100%!important;margin:0!important}:global(body:has(.marks-page) .page-content),:global(body:has(.marks-page) .content-card){padding:0!important;border:0!important;box-shadow:none!important}.print-hidden{display:none!important}.marks-page{display:block}.grid-panel{border:0;box-shadow:none}.grid-toolbar{padding:0 0 12px;border-bottom:2px solid #0f172a}.marks-table-scroll{overflow:visible}.marks-table{min-width:100%;font-size:8px}.marks-table th{position:static!important;padding:5px}.sticky-column{position:static!important;width:auto;min-width:130px;max-width:none}.marks-table td{padding:5px}.mark-control{display:block;padding:2px;border:0;background:transparent!important;box-shadow:none!important}.mark-control>input{height:auto;padding:0;font-size:10px}.absent-toggle{display:none}.cell-error{display:none}.row-status{min-width:60px}}
</style>
