<template>
  <section class="candidates-page">
    <header class="hero-panel">
      <div>
        <span class="eyebrow">EXAM OPERATIONS</span>
        <h1>Candidates & Admit Cards</h1>
        <p>পরীক্ষার্থী তালিকা, ফি ছাড়, যোগ্যতা এবং প্রবেশপত্র এক জায়গা থেকে পরিচালনা করুন।</p>
      </div>
      <button
        class="primary-button"
        type="button"
        :disabled="!examId || generating"
        @click="generateCandidates"
      >
        <span aria-hidden="true">＋</span>
        {{ generating ? "Generating…" : "Generate Candidates" }}
      </button>
    </header>

    <article class="selector-panel">
      <div class="selector-copy">
        <strong>Exam / পরীক্ষা নির্বাচন</strong>
        <small>Candidate list and admit cards are prepared for one exam at a time.</small>
      </div>
      <BaseSelect
        v-model="examId"
        class="exam-select"
        :options="examOptions"
        placeholder="Select an exam"
        :disabled="initialLoading"
        @change="selectExam"
      />
    </article>

    <div v-if="errorMessage" class="feedback error-feedback" role="alert">
      <span aria-hidden="true">!</span>
      <div><strong>Could not complete the request</strong><p>{{ errorMessage }}</p></div>
      <button v-if="examId" type="button" @click="loadCandidates">Retry</button>
    </div>

    <div v-if="initialLoading" class="loading-state" aria-live="polite">
      <span class="spinner"></span>
      Loading exam information…
    </div>

    <template v-else-if="currentExam">
      <section class="summary-grid" aria-label="Candidate summary">
        <article class="summary-card tone-indigo">
          <span>Total candidates</span>
          <strong>{{ summary.total }}</strong>
          <small>{{ currentExam.class_name || "All classes" }}</small>
        </article>
        <article class="summary-card tone-green">
          <span>Eligible</span>
          <strong>{{ summary.eligible }}</strong>
          <small>Ready for examination</small>
        </article>
        <article class="summary-card tone-amber">
          <span>On hold</span>
          <strong>{{ summary.onHold }}</strong>
          <small>Review required</small>
        </article>
        <article class="summary-card tone-blue">
          <span>Fee clear / waived</span>
          <strong>{{ summary.feeClear }}</strong>
          <small>{{ summary.waived }} waiver{{ summary.waived === 1 ? "" : "s" }}</small>
        </article>
      </section>

      <article class="list-panel">
        <div class="list-toolbar">
          <div>
            <span class="eyebrow">CANDIDATE REGISTER</span>
            <h2>{{ currentExam.exam_name }}</h2>
            <p>{{ examMeta }}</p>
          </div>
          <div class="filters">
            <label class="search-field">
              <span aria-hidden="true">⌕</span>
              <input
                v-model.trim="search"
                type="search"
                placeholder="Search candidate, student ID or name"
                aria-label="Search candidates"
              />
            </label>
            <label class="filter-field">
              <span>Status</span>
              <select v-model="eligibilityFilter">
                <option value="">All</option>
                <option v-for="status in eligibilityOptions" :key="status.value" :value="status.value">
                  {{ status.label }}
                </option>
              </select>
            </label>
          </div>
        </div>

        <div v-if="loadingCandidates" class="table-loading" aria-live="polite">
          <span class="spinner"></span> Loading candidates…
        </div>

        <div v-else class="table-scroll">
          <table>
            <thead>
              <tr>
                <th>Candidate</th>
                <th>Student</th>
                <th>Eligibility</th>
                <th>Exam fee</th>
                <th>Hold / remarks</th>
                <th class="actions-heading">Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="candidate in filteredCandidates" :key="candidate.candidate_id">
                <td>
                  <strong class="candidate-number">{{ candidate.candidate_no || "Pending" }}</strong>
                  <small>#{{ candidate.candidate_id }}</small>
                </td>
                <td>
                  <strong>{{ candidate.full_name || "Unnamed student" }}</strong>
                  <small>{{ candidate.student_no || `Student #${candidate.student_id}` }}</small>
                </td>
                <td>
                  <span class="badge" :class="eligibilityTone(candidate.eligibility_status)">
                    {{ statusLabel(candidate.eligibility_status) }}
                  </span>
                </td>
                <td>
                  <span class="badge" :class="feeTone(candidate)">{{ feeLabel(candidate) }}</span>
                  <small v-if="candidate.fee_due_amount != null">
                    Due ৳ {{ money(candidate.fee_due_amount) }}
                  </small>
                </td>
                <td class="remarks-cell">{{ candidate.hold_reason || "—" }}</td>
                <td>
                  <div class="row-actions">
                    <button class="text-button" type="button" @click="openEdit(candidate)">Edit</button>
                    <button
                      class="text-button admit-button"
                      type="button"
                      :disabled="!isEligible(candidate)"
                      :title="isEligible(candidate) ? 'Preview admit card' : 'Only eligible candidates can receive an admit card'"
                      @click="openAdmitCard(candidate)"
                    >
                      Admit Card
                    </button>
                  </div>
                </td>
              </tr>
              <tr v-if="!filteredCandidates.length">
                <td colspan="6" class="empty-cell">
                  <div class="empty-icon" aria-hidden="true">◎</div>
                  <strong>{{ candidates.length ? "No candidate matches the filters" : "No candidates generated yet" }}</strong>
                  <p v-if="!candidates.length">Use “Generate Candidates” to create the list from active enrolments.</p>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </article>
    </template>

    <article v-else-if="!initialLoading" class="empty-selection">
      <div aria-hidden="true">▣</div>
      <h2>Select an exam to begin</h2>
      <p>পরীক্ষা নির্বাচন করলে প্রার্থী তালিকা, ফি অবস্থা ও প্রবেশপত্র দেখা যাবে।</p>
    </article>

    <div v-if="editCandidate" class="modal-backdrop" @click.self="closeEdit">
      <form class="edit-modal" @submit.prevent="saveCandidate">
        <div class="modal-heading">
          <div>
            <span class="eyebrow">CANDIDATE REVIEW</span>
            <h2>{{ editCandidate.full_name }}</h2>
            <p>{{ editCandidate.candidate_no || "Candidate number pending" }}</p>
          </div>
          <button class="close-button" type="button" aria-label="Close" @click="closeEdit">×</button>
        </div>

        <div class="edit-grid">
          <label>
            <span>Eligibility status</span>
            <select v-model="candidateForm.eligibility_status" required>
              <option v-for="status in eligibilityOptions" :key="status.value" :value="status.value">
                {{ status.label }}
              </option>
            </select>
          </label>
          <label>
            <span>Fee status</span>
            <select v-model="candidateForm.fee_status">
              <option v-for="status in feeOptions" :key="status.value" :value="status.value">
                {{ status.label }}
              </option>
            </select>
          </label>
          <label class="waiver-check">
            <input v-model="candidateForm.fee_waived" type="checkbox" />
            <span><strong>Exam fee waived</strong><small>Mark an approved fee exemption for this candidate.</small></span>
          </label>
          <label class="wide-field">
            <span>Hold reason / remarks</span>
            <textarea
              v-model.trim="candidateForm.hold_reason"
              rows="4"
              placeholder="Reason for hold, ineligibility, or an internal note"
            ></textarea>
          </label>
        </div>

        <div class="modal-actions">
          <button class="secondary-button" type="button" @click="closeEdit">Cancel</button>
          <button class="primary-button" type="submit" :disabled="savingCandidate">
            {{ savingCandidate ? "Saving…" : "Save Candidate" }}
          </button>
        </div>
      </form>
    </div>

    <div v-if="admitCandidate" class="modal-backdrop admit-backdrop" @click.self="closeAdmitCard">
      <section class="admit-dialog" role="dialog" aria-modal="true" aria-label="Admit card preview">
        <div class="preview-toolbar print-hidden">
          <div><strong>Admit Card Preview</strong><small>Check details before printing.</small></div>
          <div>
            <button class="secondary-button" type="button" @click="closeAdmitCard">Close</button>
            <button class="primary-button" type="button" @click="printAdmitCard">Print Admit Card</button>
          </div>
        </div>

        <article class="admit-card">
          <header class="admit-header">
            <div class="institution-mark">S</div>
            <div>
              <p>প্রবেশপত্র / ADMIT CARD</p>
              <h2>{{ institutionName }}</h2>
              <strong>{{ currentExam.exam_name }}</strong>
            </div>
            <span class="session-chip">{{ currentExam.year_name || "Academic Exam" }}</span>
          </header>

          <div class="candidate-identity">
            <div class="photo-box"><span>Student<br />Photo</span></div>
            <dl>
              <div><dt>Candidate name</dt><dd>{{ admitCandidate.full_name }}</dd></div>
              <div><dt>Student ID</dt><dd>{{ admitCandidate.student_no || admitCandidate.student_id }}</dd></div>
              <div><dt>Candidate no.</dt><dd>{{ admitCandidate.candidate_no || "—" }}</dd></div>
              <div><dt>Class</dt><dd>{{ currentExam.class_name || admitCandidate.class_name || "All classes" }}</dd></div>
              <div><dt>Exam period</dt><dd>{{ examPeriod }}</dd></div>
              <div><dt>Fee status</dt><dd>{{ feeLabel(admitCandidate) }}</dd></div>
            </dl>
          </div>

          <div class="instructions">
            <strong>পরীক্ষার্থীর জন্য নির্দেশনা / Instructions</strong>
            <ol>
              <li>পরীক্ষা শুরুর অন্তত ৩০ মিনিট আগে কেন্দ্রে উপস্থিত হতে হবে।</li>
              <li>This admit card must be presented when requested by the invigilator.</li>
              <li>Mobile phones and unauthorized materials are not permitted in the exam room.</li>
            </ol>
          </div>

          <footer class="signature-row">
            <div><span></span><small>Candidate signature</small></div>
            <div><span></span><small>Class teacher</small></div>
            <div><span></span><small>Head of institution</small></div>
          </footer>
        </article>
      </section>
    </div>
  </section>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, reactive, ref } from "vue";
import api from "../../services/api";
import BaseSelect from "../../components/common/BaseSelect.vue";
import { confirmAction, notify } from "../../services/notification";

const eligibilityOptions = [
  { value: "ELIGIBLE", label: "Eligible" },
  { value: "HOLD", label: "On hold" },
  { value: "INELIGIBLE", label: "Ineligible" },
];

const feeOptions = [
  { value: "DUE", label: "Due" },
  { value: "PAID", label: "Paid" },
  { value: "WAIVED", label: "Waived" },
];

const exams = ref([]);
const candidates = ref([]);
const lookups = reactive({});
const examId = ref("");
const search = ref("");
const eligibilityFilter = ref("");
const initialLoading = ref(true);
const loadingCandidates = ref(false);
const generating = ref(false);
const savingCandidate = ref(false);
const errorMessage = ref("");
const editCandidate = ref(null);
const admitCandidate = ref(null);

const candidateForm = reactive({
  eligibility_status: "ELIGIBLE",
  hold_reason: "",
  fee_status: "DUE",
  fee_waived: false,
});

const examOptions = computed(() => exams.value.map((exam) => ({
  value: exam.exam_id,
  label: [exam.exam_name, exam.class_name, exam.year_name].filter(Boolean).join(" · "),
})));

const currentExam = computed(() => exams.value.find((exam) => String(exam.exam_id) === String(examId.value)) || null);

const filteredCandidates = computed(() => {
  const term = search.value.toLowerCase();
  return candidates.value.filter((candidate) => {
    const haystack = `${candidate.candidate_no || ""} ${candidate.student_no || ""} ${candidate.full_name || ""}`.toLowerCase();
    const matchesSearch = !term || haystack.includes(term);
    const matchesStatus = !eligibilityFilter.value || normalizedEligibility(candidate.eligibility_status) === eligibilityFilter.value;
    return matchesSearch && matchesStatus;
  });
});

const summary = computed(() => ({
  total: candidates.value.length,
  eligible: candidates.value.filter(isEligible).length,
  onHold: candidates.value.filter((candidate) => normalizedEligibility(candidate.eligibility_status) === "HOLD").length,
  feeClear: candidates.value.filter(isFeeClear).length,
  waived: candidates.value.filter((candidate) => asBoolean(candidate.fee_waived) || String(candidate.fee_status).toUpperCase() === "WAIVED").length,
}));

const examMeta = computed(() => [
  currentExam.value?.class_name || "All classes",
  currentExam.value?.year_name,
  examPeriod.value,
].filter(Boolean).join(" · "));

const examPeriod = computed(() => {
  const start = formatDate(currentExam.value?.start_date);
  const end = formatDate(currentExam.value?.end_date);
  if (start === "—" && end === "—") return "Schedule pending";
  return end !== "—" && end !== start ? `${start} – ${end}` : start;
});

const institutionName = computed(() => (
  currentExam.value?.institution_name ||
  admitCandidate.value?.institution_name ||
  lookups.institution?.institution_name ||
  lookups.institution_name ||
  "School Management System"
));

function asBoolean(value) {
  return value === true || value === 1 || value === "1" || String(value).toLowerCase() === "true";
}

function normalizedEligibility(value) {
  const status = String(value || "ELIGIBLE").toUpperCase().replace(/[-\s]+/g, "_");
  if (["ON_HOLD", "HELD", "WITHHELD"].includes(status)) return "HOLD";
  return status;
}

function statusLabel(value) {
  const status = normalizedEligibility(value);
  return eligibilityOptions.find((option) => option.value === status)?.label || status.replaceAll("_", " ");
}

function eligibilityTone(value) {
  const status = normalizedEligibility(value);
  if (status === "ELIGIBLE") return "badge-success";
  if (status === "HOLD") return "badge-warning";
  return "badge-danger";
}

function isEligible(candidate) {
  return normalizedEligibility(candidate?.eligibility_status) === "ELIGIBLE";
}

function feeLabel(candidate) {
  if (asBoolean(candidate?.fee_waived)) return "Waived";
  const status = String(candidate?.fee_status || "DUE").toUpperCase();
  return feeOptions.find((option) => option.value === status)?.label || status.replaceAll("_", " ");
}

function feeTone(candidate) {
  if (asBoolean(candidate?.fee_waived)) return "badge-info";
  const status = String(candidate?.fee_status || "DUE").toUpperCase();
  if (["PAID", "CLEAR"].includes(status)) return "badge-success";
  if (status === "WAIVED") return "badge-info";
  return "badge-danger";
}

function isFeeClear(candidate) {
  if (asBoolean(candidate?.fee_waived)) return true;
  return ["PAID", "CLEAR", "WAIVED"].includes(String(candidate?.fee_status || "DUE").toUpperCase());
}

function money(value) {
  return Number(value || 0).toLocaleString("en-BD", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function formatDate(value) {
  if (!value) return "—";
  const raw = String(value);
  if (/^\d{2}-[A-Z]{3}-\d{4}$/i.test(raw)) return raw.toUpperCase();
  const parsed = new Date(`${raw.slice(0, 10)}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return raw;
  return new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "short", year: "numeric" }).format(parsed).toUpperCase();
}

function responseRows(response) {
  const payload = response?.data?.data;
  return Array.isArray(payload) ? payload : payload?.rows || payload?.candidates || [];
}

function clearError() {
  errorMessage.value = "";
}

async function loadInitialData() {
  initialLoading.value = true;
  clearError();
  try {
    const [lookupResponse, examResponse] = await Promise.all([
      api.get("/exams/lookups"),
      api.get("/exams/exams"),
    ]);
    Object.assign(lookups, lookupResponse.data?.data || {});
    exams.value = responseRows(examResponse);
  } catch (error) {
    errorMessage.value = error.response?.data?.message || "Failed to load exams and candidate lookups.";
  } finally {
    initialLoading.value = false;
  }
}

async function selectExam(value) {
  examId.value = value || "";
  candidates.value = [];
  search.value = "";
  eligibilityFilter.value = "";
  clearError();
  if (examId.value) await loadCandidates();
}

async function loadCandidates() {
  if (!examId.value) return;
  loadingCandidates.value = true;
  clearError();
  try {
    const response = await api.get(`/exams/exams/${examId.value}/candidates`);
    candidates.value = responseRows(response);
  } catch (error) {
    candidates.value = [];
    errorMessage.value = error.response?.data?.message || "Failed to load the candidate list.";
  } finally {
    loadingCandidates.value = false;
  }
}

async function generateCandidates() {
  if (!examId.value || generating.value) return;
  generating.value = true;
  clearError();
  try {
    const response = await api.post(`/exams/exams/${examId.value}/candidates/generate`);
    const generated = Number(response.data?.data?.generated ?? response.data?.data?.count ?? 0);
    notify.success(`${generated} candidate${generated === 1 ? "" : "s"} prepared for this exam.`);
    await loadCandidates();
  } catch (error) {
    errorMessage.value = error.response?.data?.message || "Candidate generation failed.";
    notify.error(errorMessage.value);
  } finally {
    generating.value = false;
  }
}

function openEdit(candidate) {
  editCandidate.value = candidate;
  Object.assign(candidateForm, {
    eligibility_status: normalizedEligibility(candidate.eligibility_status),
    hold_reason: candidate.hold_reason || "",
    fee_status: String(candidate.fee_status || "DUE").toUpperCase(),
    fee_waived: asBoolean(candidate.fee_waived),
  });
}

function closeEdit() {
  if (savingCandidate.value) return;
  editCandidate.value = null;
}

async function saveCandidate() {
  if (!editCandidate.value || savingCandidate.value) return;
  savingCandidate.value = true;
  clearError();
  try {
    const payload = {
      eligibility_status: candidateForm.eligibility_status,
      hold_reason: candidateForm.hold_reason || null,
      fee_status: candidateForm.fee_waived ? "WAIVED" : candidateForm.fee_status,
      fee_waived: candidateForm.fee_waived,
    };
    await api.put(`/exams/candidates/${editCandidate.value.candidate_id}`, payload);
    notify.success("Candidate information updated.");
    editCandidate.value = null;
    await loadCandidates();
  } catch (error) {
    errorMessage.value = error.response?.data?.message || "Could not update the candidate.";
    notify.error(errorMessage.value);
  } finally {
    savingCandidate.value = false;
  }
}

function openAdmitCard(candidate) {
  if (!isEligible(candidate)) return;
  admitCandidate.value = candidate;
}

function closeAdmitCard() {
  admitCandidate.value = null;
}

async function printAdmitCard() {
  const confirmed = await confirmAction({
    title: "Print admit card?",
    message: `Print the admit card for ${admitCandidate.value?.full_name || "this candidate"}.`,
    confirmText: "Print",
    type: "info",
  });
  if (confirmed) {
    document.body.classList.add("printing-admit-card");
    window.addEventListener("afterprint", clearPrintMode, { once: true });
    window.print();
  }
}

function clearPrintMode() {
  document.body.classList.remove("printing-admit-card");
}

onMounted(loadInitialData);
onBeforeUnmount(clearPrintMode);
</script>

<style scoped>
.candidates-page{--ink:#172033;--muted:#64748b;--line:#dfe7f1;display:grid;gap:18px;color:var(--ink)}.hero-panel,.selector-panel,.list-panel,.empty-selection{border:1px solid var(--line);border-radius:18px;background:#fff;box-shadow:0 8px 28px rgba(15,23,42,.055)}.hero-panel{display:flex;align-items:center;justify-content:space-between;gap:20px;padding:24px;background:linear-gradient(125deg,#f7f9ff 0%,#eef2ff 52%,#f8fbff 100%)}.eyebrow{display:block;margin-bottom:5px;color:#4f46e5;font-size:10px;font-weight:900;letter-spacing:.13em}.hero-panel h1,.list-toolbar h2,.empty-selection h2,.modal-heading h2{margin:0;color:#172033}.hero-panel h1{font-size:28px;letter-spacing:-.035em}.hero-panel p,.list-toolbar p,.empty-selection p,.modal-heading p{margin:6px 0 0;color:var(--muted);font-size:13px;line-height:1.55}.primary-button,.secondary-button{display:inline-flex;align-items:center;justify-content:center;gap:7px;min-height:42px;padding:0 15px;border:0;border-radius:10px;font:inherit;font-size:13px;font-weight:850;cursor:pointer}.primary-button{background:linear-gradient(135deg,#4f46e5,#2563eb);color:#fff;box-shadow:0 9px 20px rgba(79,70,229,.2)}.secondary-button{border:1px solid #cbd5e1;background:#fff;color:#334155}.primary-button:disabled,.text-button:disabled{cursor:not-allowed;opacity:.52;box-shadow:none}.selector-panel{display:grid;grid-template-columns:minmax(220px,1fr) minmax(300px,520px);gap:20px;align-items:center;padding:18px 20px}.selector-copy{display:grid;gap:4px}.selector-copy strong{font-size:14px}.selector-copy small{color:var(--muted);font-size:12px}.exam-select{min-width:0}.summary-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:13px}.summary-card{position:relative;min-height:116px;overflow:hidden;padding:17px 18px;border:1px solid transparent;border-radius:15px}.summary-card:after{position:absolute;right:-28px;bottom:-40px;width:112px;height:112px;border-radius:50%;background:currentColor;content:"";opacity:.07}.summary-card span{font-size:11px;font-weight:850;text-transform:uppercase;letter-spacing:.05em}.summary-card strong{display:block;margin:9px 0 5px;font-size:30px;line-height:1}.summary-card small{position:relative;z-index:1;font-size:11px;opacity:.75}.tone-indigo{border-color:#c7d2fe;background:#eef2ff;color:#3730a3}.tone-green{border-color:#a7f3d0;background:#ecfdf5;color:#047857}.tone-amber{border-color:#fde68a;background:#fffbeb;color:#b45309}.tone-blue{border-color:#bfdbfe;background:#eff6ff;color:#1d4ed8}.list-panel{overflow:hidden}.list-toolbar{display:flex;align-items:flex-end;justify-content:space-between;gap:18px;padding:20px;border-bottom:1px solid var(--line)}.list-toolbar h2{font-size:19px}.filters{display:flex;align-items:end;gap:10px}.search-field{display:flex;align-items:center;gap:8px;width:min(340px,35vw);min-height:42px;padding:0 12px;border:1px solid #d7e0ec;border-radius:10px;background:#f8fafc;color:#94a3b8}.search-field:focus-within{border-color:#6366f1;background:#fff;box-shadow:0 0 0 3px rgba(99,102,241,.1)}.search-field input{width:100%;border:0;outline:0;background:transparent;color:var(--ink);font:inherit;font-size:13px}.filter-field{display:grid;gap:4px}.filter-field span{font-size:10px;font-weight:850;color:var(--muted);text-transform:uppercase}.filter-field select,.edit-grid select,.edit-grid textarea{border:1px solid #d7e0ec;border-radius:9px;background:#fff;color:var(--ink);font:inherit;font-size:13px;outline:0}.filter-field select{height:42px;padding:0 32px 0 10px}.table-scroll{width:100%;overflow:auto}table{width:100%;min-width:920px;border-collapse:collapse}th,td{padding:13px 15px;border-bottom:1px solid #edf1f6;text-align:left;font-size:13px;vertical-align:middle}th{background:#f8fafc;color:#64748b;font-size:10px;font-weight:900;letter-spacing:.065em;text-transform:uppercase;white-space:nowrap}tbody tr:hover{background:#fbfdff}tbody tr:last-child td{border-bottom:0}td strong{display:block;color:#1e293b}.candidate-number{color:#4338ca}td small{display:block;margin-top:3px;color:var(--muted);font-size:11px}.remarks-cell{max-width:250px;color:#64748b;line-height:1.45}.badge{display:inline-flex;align-items:center;padding:5px 8px;border-radius:999px;font-size:10px;font-weight:900;letter-spacing:.02em;text-transform:uppercase}.badge-success{background:#dcfce7;color:#166534}.badge-warning{background:#fef3c7;color:#92400e}.badge-danger{background:#fee2e2;color:#b91c1c}.badge-info{background:#dbeafe;color:#1d4ed8}.actions-heading{text-align:right}.row-actions{display:flex;justify-content:flex-end;gap:6px}.text-button{padding:7px 9px;border:1px solid #c7d2fe;border-radius:8px;background:#fff;color:#4338ca;font:inherit;font-size:11px;font-weight:850;white-space:nowrap}.admit-button{border-color:#bfdbfe;color:#1d4ed8}.empty-cell{padding:42px 18px!important;text-align:center;color:var(--muted)}.empty-cell strong{font-size:14px}.empty-cell p{margin:5px 0 0}.empty-icon{margin-bottom:8px;color:#a5b4fc;font-size:28px}.loading-state,.table-loading{display:flex;align-items:center;justify-content:center;gap:10px;color:var(--muted);font-size:13px}.loading-state{min-height:190px;border:1px dashed #cbd5e1;border-radius:16px;background:#fff}.table-loading{min-height:220px}.spinner{width:20px;height:20px;border:2px solid #c7d2fe;border-top-color:#4f46e5;border-radius:50%;animation:spin .75s linear infinite}.feedback{display:flex;align-items:center;gap:11px;padding:12px 14px;border-radius:12px;font-size:12px}.feedback>span{display:grid;place-items:center;width:25px;height:25px;border-radius:50%;font-weight:900}.feedback strong{display:block}.feedback p{margin:2px 0 0}.feedback button{margin-left:auto;border:0;background:transparent;color:inherit;font-weight:850}.error-feedback{border:1px solid #fecaca;background:#fff1f2;color:#9f1239}.error-feedback>span{background:#fecdd3}.empty-selection{display:grid;place-items:center;min-height:270px;padding:30px;text-align:center}.empty-selection>div{display:grid;place-items:center;width:58px;height:58px;margin-bottom:12px;border-radius:18px;background:#eef2ff;color:#4f46e5;font-size:26px}.modal-backdrop{position:fixed;inset:0;z-index:1100;display:grid;place-items:center;padding:18px;background:rgba(15,23,42,.62);backdrop-filter:blur(3px)}.edit-modal,.admit-dialog{width:min(720px,100%);max-height:92vh;overflow:auto;border-radius:18px;background:#fff;box-shadow:0 28px 70px rgba(15,23,42,.28)}.edit-modal{padding:22px}.modal-heading{display:flex;justify-content:space-between;gap:18px;margin-bottom:19px}.modal-heading h2{font-size:20px}.close-button{width:36px;height:36px;border:0;border-radius:10px;background:#f1f5f9;color:#475569;font-size:23px;line-height:1}.edit-grid{display:grid;grid-template-columns:1fr 1fr;gap:14px}.edit-grid>label{display:grid;gap:6px;color:#334155;font-size:12px;font-weight:800}.edit-grid select{height:44px;padding:0 11px}.edit-grid textarea{padding:11px;resize:vertical}.wide-field,.waiver-check{grid-column:1/-1}.waiver-check{display:flex!important;align-items:center;padding:12px;border:1px solid #dbeafe;border-radius:11px;background:#f8fbff}.waiver-check input{width:18px;height:18px}.waiver-check span{display:grid;gap:2px}.waiver-check small{color:var(--muted);font-weight:500}.modal-actions{display:flex;justify-content:flex-end;gap:9px;margin-top:20px}.admit-dialog{width:min(900px,100%);padding:18px;background:#e9eef6}.preview-toolbar{display:flex;align-items:center;justify-content:space-between;gap:16px;margin-bottom:14px;padding:3px 2px}.preview-toolbar>div:first-child{display:grid;gap:2px}.preview-toolbar small{color:var(--muted);font-size:11px}.preview-toolbar>div:last-child{display:flex;gap:8px}.admit-card{padding:30px;border:1px solid #cad4e1;background:#fff;color:#172033;box-shadow:0 8px 25px rgba(15,23,42,.08)}.admit-header{display:grid;grid-template-columns:62px 1fr auto;gap:15px;align-items:center;padding-bottom:20px;border-bottom:2px solid #172033;text-align:center}.institution-mark{display:grid;place-items:center;width:58px;height:58px;border-radius:50%;background:#172033;color:#fff;font-family:Georgia,serif;font-size:29px;font-weight:900}.admit-header p{margin:0 0 4px;color:#475569;font-size:11px;font-weight:900;letter-spacing:.14em}.admit-header h2{margin:0;font-family:Georgia,"Noto Serif Bengali",serif;font-size:23px}.admit-header strong{display:block;margin-top:5px;color:#3730a3;font-size:14px}.session-chip{align-self:start;padding:6px 9px;border:1px solid #94a3b8;border-radius:6px;font-size:10px;font-weight:850}.candidate-identity{display:grid;grid-template-columns:120px 1fr;gap:24px;margin-top:24px}.photo-box{display:grid;place-items:center;height:145px;border:1px dashed #94a3b8;background:#f8fafc;color:#94a3b8;font-size:11px;text-align:center}.candidate-identity dl{display:grid;grid-template-columns:1fr 1fr;gap:0;margin:0;border-top:1px solid #dbe2ea;border-left:1px solid #dbe2ea}.candidate-identity dl>div{padding:10px 12px;border-right:1px solid #dbe2ea;border-bottom:1px solid #dbe2ea}.candidate-identity dt{color:#64748b;font-size:9px;font-weight:850;letter-spacing:.06em;text-transform:uppercase}.candidate-identity dd{margin:4px 0 0;font-size:13px;font-weight:800}.instructions{margin-top:22px;padding:14px 16px;border:1px solid #dbe2ea;background:#fafafa;font-size:11px;line-height:1.55}.instructions strong{font-size:11px}.instructions ol{margin:7px 0 0;padding-left:19px}.signature-row{display:grid;grid-template-columns:repeat(3,1fr);gap:38px;margin-top:54px}.signature-row div{text-align:center}.signature-row span{display:block;border-top:1px solid #334155}.signature-row small{display:block;margin-top:6px;color:#475569;font-size:10px}@keyframes spin{to{transform:rotate(360deg)}}
@media(max-width:980px){.summary-grid{grid-template-columns:repeat(2,1fr)}.list-toolbar{align-items:stretch;flex-direction:column}.filters{justify-content:space-between}.search-field{width:100%}.selector-panel{grid-template-columns:1fr}}
@media(max-width:640px){.hero-panel{align-items:flex-start;flex-direction:column;padding:20px}.hero-panel .primary-button{width:100%}.hero-panel h1{font-size:24px}.summary-grid{grid-template-columns:1fr 1fr}.summary-card{min-height:105px;padding:15px}.summary-card strong{font-size:26px}.filters{align-items:stretch;flex-direction:column}.filter-field select{width:100%}.edit-grid{grid-template-columns:1fr}.candidate-identity{grid-template-columns:1fr}.photo-box{width:110px;height:130px;margin:auto}.candidate-identity dl{grid-template-columns:1fr}.admit-header{grid-template-columns:48px 1fr}.institution-mark{width:46px;height:46px}.session-chip{display:none}.admit-card{padding:20px}.signature-row{gap:14px}.preview-toolbar{align-items:flex-start;flex-direction:column}.preview-toolbar>div:last-child{width:100%}.preview-toolbar button{flex:1}}
@media print{:global(body.printing-admit-card *){visibility:hidden!important}.admit-backdrop,.admit-backdrop *{visibility:visible!important}.admit-backdrop{position:absolute!important;inset:0!important;display:block!important;padding:0!important;background:#fff!important;backdrop-filter:none!important}.admit-dialog{width:100%!important;max-height:none!important;overflow:visible!important;padding:0!important;border-radius:0!important;background:#fff!important;box-shadow:none!important}.print-hidden{display:none!important}.admit-card{width:100%!important;min-height:100vh!important;padding:18mm!important;border:0!important;box-shadow:none!important}.candidate-identity{grid-template-columns:110px 1fr!important}.candidate-identity dl{grid-template-columns:1fr 1fr!important}}
</style>
