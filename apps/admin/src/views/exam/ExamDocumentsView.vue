<template>
  <section class="document-studio">
    <header class="studio-hero">
      <div>
        <span class="eyebrow">ACADEMIC DOCUMENT STUDIO</span>
        <h1>Marksheet & Certificate Designer</h1>
        <p>Admin panel থেকে marksheet ও certificate-এর design, content, preview, issue এবং print নিয়ন্ত্রণ করুন।</p>
      </div>
      <div class="hero-stats">
        <div><strong>{{ templates.length }}</strong><span>Templates</span></div>
        <div><strong>{{ documents.length }}</strong><span>Issued</span></div>
      </div>
    </header>

    <nav class="studio-tabs" aria-label="Document studio sections">
      <button
        v-for="tab in tabs"
        :key="tab.value"
        type="button"
        :class="{ active: activeTab === tab.value }"
        @click="activeTab = tab.value"
      >
        <span aria-hidden="true">{{ tab.icon }}</span>
        <span><strong>{{ tab.label }}</strong><small>{{ tab.caption }}</small></span>
      </button>
    </nav>

    <div v-if="errorMessage" class="feedback error-feedback" role="alert">
      <span aria-hidden="true">!</span>
      <div><strong>Something needs attention</strong><p>{{ errorMessage }}</p></div>
      <button type="button" @click="loadStudio">Retry</button>
    </div>

    <div v-if="successMessage" class="feedback success-feedback" role="status">
      <span aria-hidden="true">✓</span>
      <div><strong>Completed</strong><p>{{ successMessage }}</p></div>
    </div>

    <div v-if="initialLoading" class="loading-state">
      <span class="spinner"></span>
      Loading document studio…
    </div>

    <template v-else>
      <section v-if="activeTab === 'templates'" class="templates-workspace">
        <article class="section-panel template-toolbar">
          <div>
            <span class="eyebrow">DESIGN LIBRARY</span>
            <h2>Document templates</h2>
            <p>Create and maintain separate institutional designs for marksheets and certificates.</p>
          </div>
          <div class="toolbar-actions">
            <label>
              <span>Type</span>
              <select v-model="templateTypeFilter">
                <option value="">All templates</option>
                <option value="MARKSHEET">Marksheet</option>
                <option value="TESTIMONIAL">Certificate</option>
              </select>
            </label>
            <button class="primary-button" type="button" @click="openTemplateForm()">＋ New Template</button>
          </div>
        </article>

        <div v-if="filteredTemplates.length" class="template-grid">
          <article
            v-for="template in filteredTemplates"
            :key="templateId(template)"
            class="template-card"
            :style="{ '--template-accent': templateDesign(template).accent_color }"
          >
            <div class="template-preview-mark">
              <span></span><span></span><span></span><span></span>
            </div>
            <div class="template-card-body">
              <div class="card-badges">
                <span class="type-badge">{{ friendlyType(template.document_type) }}</span>
                <span v-if="toBoolean(template.is_default)" class="default-badge">Default</span>
                <span class="status-badge" :class="String(template.status || 'ACTIVE').toLowerCase()">
                  {{ template.status || "ACTIVE" }}
                </span>
              </div>
              <h3>{{ template.template_name }}</h3>
              <p>{{ templateDesign(template).header_title }}</p>
              <small>{{ templateDesign(template).subtitle }}</small>
              <div class="template-card-actions">
                <button type="button" @click="previewFromTemplate(template)">Preview</button>
                <button type="button" @click="openTemplateForm(template)">Edit design</button>
              </div>
            </div>
          </article>
        </div>

        <article v-else class="empty-selection">
          <div aria-hidden="true">◇</div>
          <h2>No templates found</h2>
          <p>Create a {{ templateTypeFilter ? friendlyType(templateTypeFilter).toLowerCase() : "document" }} template to start issuing documents.</p>
          <button class="primary-button" type="button" @click="openTemplateForm()">Create Template</button>
        </article>
      </section>

      <section v-else-if="activeTab === 'preview'" class="preview-workspace">
        <aside class="preview-controls print-hidden">
          <div class="control-heading">
            <span class="eyebrow">PREVIEW SETTINGS</span>
            <h2>Prepare document</h2>
            <p>Select the document, exam and student before issuing.</p>
          </div>

          <div class="document-type-switch" role="group" aria-label="Document type">
            <button
              v-for="type in documentTypes"
              :key="type.value"
              type="button"
              :class="{ active: documentType === type.value }"
              @click="changeDocumentType(type.value)"
            >
              <span aria-hidden="true">{{ type.icon }}</span>
              {{ type.label }}
            </button>
          </div>

          <label class="native-field">
            <span>Design template</span>
            <select v-model="selectedTemplateId">
              <option value="">Select template</option>
              <option v-for="template in availableTemplates" :key="templateId(template)" :value="templateId(template)">
                {{ template.template_name }}{{ toBoolean(template.is_default) ? " · Default" : "" }}
              </option>
            </select>
            <small v-if="!availableTemplates.length">Create an active {{ friendlyType(documentType).toLowerCase() }} template first.</small>
          </label>

          <div class="select-field">
            <span>Exam / পরীক্ষা</span>
            <BaseSelect
              v-model="selectedExamId"
              :options="examOptions"
              placeholder="Select exam"
              :disabled="loadingPreviewData"
              @change="selectExam"
            />
          </div>

          <div class="select-field">
            <span>Student / শিক্ষার্থী</span>
            <BaseSelect
              v-model="selectedStudentId"
              :options="studentOptions"
              placeholder="Select result or candidate"
              :disabled="!selectedExamId || loadingExamStudents || loadingPreviewData"
              @change="selectStudent"
            />
            <small v-if="selectedExamId && !loadingExamStudents && !examStudents.length">
              No result or candidate is available for this exam.
            </small>
          </div>

          <div class="preview-status">
            <div><span>Exam</span><strong>{{ selectedExam?.exam_name || "Not selected" }}</strong></div>
            <div><span>Student</span><strong>{{ studentRecord.full_name || "Not selected" }}</strong></div>
            <div><span>Result</span><strong>{{ previewResultStatus }}</strong></div>
          </div>

          <div class="control-actions">
            <button class="secondary-button" type="button" :disabled="!previewReady || loadingPreviewData" @click="printDocument">
              Print Preview
            </button>
            <button class="primary-button" type="button" :disabled="!issueReady || issuing" @click="issueAndPrint">
              {{ issuing ? "Issuing…" : "Issue & Print" }}
            </button>
          </div>
          <p class="issue-note">Issuing creates an official register entry and verification code before printing.</p>
        </aside>

        <main class="preview-stage">
          <div v-if="loadingExamStudents || loadingPreviewData" class="preview-loading">
            <span class="spinner"></span>
            {{ loadingExamStudents ? "Loading exam students…" : "Loading student result…" }}
          </div>

          <article v-else-if="previewReady" class="paper-frame">
            <section
              v-if="documentType === 'MARKSHEET'"
              class="document-sheet marksheet-sheet"
              :class="activeDesign.layout_style"
              :style="{ '--document-accent': activeDesign.accent_color }"
            >
              <DocumentHeader
                :institution-name="institutionName"
                :institution-address="institutionAddress"
                :logo-url="studentRecord.logo_url || resultHeader.logo_url || selectedExam.logo_url"
                :show-logo="activeDesign.show_logo"
                :title="activeDesign.header_title"
                :subtitle="activeDesign.subtitle"
              />

              <div class="document-title-row">
                <div>
                  <span>Academic result statement</span>
                  <h2>{{ selectedExam.exam_name }}</h2>
                </div>
                <div class="result-seal" :class="String(resultHeader.result_status || '').toLowerCase()">
                  <span>Result</span>
                  <strong>{{ resultHeader.result_status || "PENDING" }}</strong>
                </div>
              </div>

              <dl class="student-details-grid">
                <div><dt>Student name</dt><dd>{{ studentRecord.full_name || "—" }}</dd></div>
                <div><dt>Student ID</dt><dd>{{ studentRecord.student_no || studentRecord.student_id || "—" }}</dd></div>
                <div><dt>Class</dt><dd>{{ resultHeader.class_name || selectedExam.class_name || studentRecord.class_name || "—" }}</dd></div>
                <div><dt>Academic year</dt><dd>{{ resultHeader.year_name || selectedExam.year_name || "—" }}</dd></div>
                <div><dt>Candidate no.</dt><dd>{{ studentRecord.candidate_no || "—" }}</dd></div>
                <div><dt>Published</dt><dd>{{ displayDate(resultHeader.published_at || selectedExam.result_publish_date) }}</dd></div>
              </dl>

              <div class="result-table-wrap">
                <table class="result-table">
                  <thead>
                    <tr>
                  <th>SL</th>
                      <th>Subject</th>
                      <th v-if="activeDesign.show_assignment">Assignment</th>
                      <th>Full</th>
                      <th>Pass</th>
                      <th>Obtained</th>
                      <th>Grade</th>
                      <th>Point</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="(subject, index) in resultSubjects" :key="subject.result_detail_id || subject.subject_id || index">
                      <td>{{ index + 1 }}</td>
                      <td><strong>{{ subject.subject_name }}{{ paperLabel(subject.paper_no) }}</strong><small>{{ subject.subject_code }}{{ paperLabelBn(subject.paper_no) }}</small></td>
                      <td v-if="activeDesign.show_assignment">{{ assignmentLabel(subject.assignment_type || subject.subject_type) }}</td>
                      <td>{{ displayNumber(subject.full_marks) }}</td>
                      <td>{{ displayNumber(subject.pass_marks) }}</td>
                      <td><strong>{{ displayNumber(subject.obtained_marks) }}</strong></td>
                      <td><span class="grade-chip">{{ subject.letter_grade || "—" }}</span></td>
                      <td>{{ displayNumber(subject.grade_point) }}</td>
                    </tr>
                    <tr v-if="!resultSubjects.length"><td :colspan="activeDesign.show_assignment ? 8 : 7" class="document-empty">No subject result rows available.</td></tr>
                  </tbody>
                </table>
              </div>

              <section class="result-summary" :style="{ gridTemplateColumns: `repeat(${activeDesign.show_merit ? 6 : 5}, 1fr)` }">
                <div><span>Total marks</span><strong>{{ displayNumber(resultHeader.total_marks) }}</strong></div>
                <div><span>Obtained</span><strong>{{ displayNumber(resultHeader.obtained_marks) }}</strong></div>
                <div><span>Percentage</span><strong>{{ resultPercentage }}%</strong></div>
                <div><span>GPA</span><strong>{{ displayNumber(resultHeader.gpa) }}</strong></div>
                <div><span>Grade</span><strong>{{ resultHeader.letter_grade || "—" }}</strong></div>
                <div v-if="activeDesign.show_merit"><span>Merit</span><strong>{{ resultHeader.merit_position || "—" }}</strong></div>
              </section>

              <DocumentFooter
                :footer-note="activeDesign.footer_note"
                :left-signature="activeDesign.left_signature"
                :right-signature="activeDesign.right_signature"
                :document-number="issuedDocument?.document_no"
                :verification-code="activeDesign.show_verification ? issuedDocument?.verification_code : ''"
              />
            </section>

            <section
              v-else
              class="document-sheet testimonial-sheet"
              :class="activeDesign.layout_style"
              :style="{ '--document-accent': activeDesign.accent_color }"
            >
              <div class="certificate-border">
                <DocumentHeader
                  :institution-name="institutionName"
                  :institution-address="institutionAddress"
                  :logo-url="studentRecord.logo_url || resultHeader.logo_url || selectedExam.logo_url"
                  :show-logo="activeDesign.show_logo"
                  :title="activeDesign.header_title"
                  :subtitle="activeDesign.subtitle"
                />

                <div class="testimonial-heading">
                  <span>প্রত্যয়নপত্র / CERTIFICATE</span>
                  <h2>{{ activeDesign.header_title }}</h2>
                  <p>Serial: {{ issuedDocument?.document_no || "DRAFT PREVIEW" }}</p>
                </div>

                <div class="testimonial-copy">
                  <p>
                    {{ activeDesign.certificate_intro }} <strong>{{ studentRecord.full_name || "________________" }}</strong>,
                    Student ID <strong>{{ studentRecord.student_no || studentRecord.student_id || "____________" }}</strong>,
                    son/daughter of <strong>{{ guardianName }}</strong>, was a bona fide student of
                    <strong>{{ institutionName }}</strong> in class
                    <strong>{{ resultHeader.class_name || selectedExam.class_name || studentRecord.class_name || "________" }}</strong>
                    during the academic year <strong>{{ resultHeader.year_name || selectedExam.year_name || "________" }}</strong>.
                  </p>
                  <p v-if="activeDesign.show_result">
                    The student appeared in <strong>{{ selectedExam.exam_name }}</strong>
                    <template v-if="resultHeader.result_status">
                      and the recorded result was <strong>{{ resultHeader.result_status }}</strong>
                      <template v-if="resultHeader.gpa != null"> with GPA <strong>{{ displayNumber(resultHeader.gpa) }}</strong></template>
                    </template>.
                  </p>
                  <p>{{ activeDesign.certificate_conduct }}</p>
                  <p>
                    {{ activeDesign.certificate_wish }}
                  </p>
                </div>

                <dl class="testimonial-facts" :style="{ gridTemplateColumns: `repeat(${1 + (activeDesign.show_date_of_birth ? 1 : 0) + (activeDesign.show_verification ? 1 : 0)}, 1fr)` }">
                  <div v-if="activeDesign.show_date_of_birth"><dt>Date of birth</dt><dd>{{ displayDate(studentRecord.date_of_birth) }}</dd></div>
                  <div><dt>Issue date</dt><dd>{{ displayDate(issuedDocument?.issue_date || today) }}</dd></div>
                  <div v-if="activeDesign.show_verification"><dt>Verification</dt><dd>{{ issuedDocument?.verification_code || "Generated after issue" }}</dd></div>
                </dl>

                <DocumentFooter
                  :footer-note="activeDesign.footer_note"
                  :left-signature="activeDesign.left_signature"
                  :right-signature="activeDesign.right_signature"
                  :document-number="issuedDocument?.document_no"
                  :verification-code="activeDesign.show_verification ? issuedDocument?.verification_code : ''"
                />
              </div>
            </section>
          </article>

          <article v-else class="preview-placeholder">
            <div class="paper-illustration" aria-hidden="true"><span></span><span></span><span></span></div>
            <h2>Document preview will appear here</h2>
            <p>Select an active template, exam and student to prepare an A4 document.</p>
          </article>
        </main>
      </section>

      <section v-else class="register-workspace">
        <article class="section-panel register-toolbar">
          <div>
            <span class="eyebrow">OFFICIAL REGISTER</span>
            <h2>Issued documents</h2>
            <p>Search issued marksheets and certificates by document, student or verification code.</p>
          </div>
          <div class="register-filters">
            <label class="search-field">
              <span aria-hidden="true">⌕</span>
              <input v-model.trim="registerSearch" type="search" placeholder="Document, student or verification" />
            </label>
            <select v-model="registerTypeFilter">
              <option value="">All types</option>
              <option value="MARKSHEET">Marksheet</option>
              <option value="TESTIMONIAL">Certificate</option>
            </select>
          </div>
        </article>

        <article class="register-panel">
          <div v-if="loadingRegister" class="table-loading"><span class="spinner"></span> Updating register…</div>
          <div v-else class="table-scroll">
            <table class="register-table">
              <thead><tr><th>Document</th><th>Student</th><th>Exam</th><th>Issued</th><th>Verification</th><th>Status</th></tr></thead>
              <tbody>
                <tr v-for="document in filteredDocuments" :key="document.issued_document_id || document.document_id || document.document_no">
                  <td><strong>{{ document.document_no }}</strong><small>{{ friendlyType(document.document_type) }}</small></td>
                  <td><strong>{{ document.full_name || document.student_name || `Student #${document.student_id}` }}</strong><small>{{ document.student_no || "—" }}</small></td>
                  <td>{{ document.exam_name || (document.exam_id ? `Exam #${document.exam_id}` : "Not applicable") }}</td>
                  <td>{{ displayDate(document.issue_date || document.created_at) }}</td>
                  <td><code>{{ document.verification_code || "—" }}</code></td>
                  <td><span class="register-status" :class="String(document.status || 'ISSUED').toLowerCase()">{{ document.status || "ISSUED" }}</span></td>
                </tr>
                <tr v-if="!filteredDocuments.length"><td colspan="6" class="empty-cell">No issued documents match the selected filters.</td></tr>
              </tbody>
            </table>
          </div>
        </article>
      </section>
    </template>

    <div v-if="templateFormOpen" class="modal-backdrop" @click.self="closeTemplateForm">
      <form class="template-modal" @submit.prevent="saveTemplate">
        <div class="modal-heading">
          <div><span class="eyebrow">TEMPLATE DESIGNER</span><h2>{{ editingTemplateId ? "Edit" : "Create" }} template</h2><p>Control the visible content, colours and official signature labels.</p></div>
          <button class="close-button" type="button" aria-label="Close" @click="closeTemplateForm">×</button>
        </div>

        <div class="template-form-grid">
          <label><span>Template name</span><input v-model.trim="templateForm.template_name" required placeholder="e.g. Annual Marksheet 2026" /></label>
          <label><span>Document type</span><select v-model="templateForm.document_type" :disabled="Boolean(editingTemplateId)" @change="resetDesignDefaults"><option value="MARKSHEET">Marksheet</option><option value="TESTIMONIAL">Certificate</option></select></label>
          <label class="accent-field"><span>Accent colour</span><div><input v-model="templateForm.design.accent_color" type="color" /><input v-model.trim="templateForm.design.accent_color" pattern="^#[0-9A-Fa-f]{6}$" required /></div></label>
          <label><span>Status</span><select v-model="templateForm.status"><option value="ACTIVE">Active</option><option value="INACTIVE">Inactive</option></select></label>
          <label><span>Layout style</span><select v-model="templateForm.design.layout_style"><option value="classic">Classic</option><option value="clean">Clean</option><option value="modern">Modern</option></select></label>
          <label class="wide-field"><span>Header title</span><input v-model.trim="templateForm.design.header_title" required /></label>
          <label class="wide-field"><span>Subtitle</span><input v-model.trim="templateForm.design.subtitle" /></label>
          <label><span>Left signature</span><input v-model.trim="templateForm.design.left_signature" /></label>
          <label><span>Right signature</span><input v-model.trim="templateForm.design.right_signature" /></label>
          <label class="wide-field"><span>Footer note</span><textarea v-model.trim="templateForm.design.footer_note" rows="3"></textarea></label>
          <template v-if="templateForm.document_type === 'MARKSHEET'">
            <label class="option-check"><input v-model="templateForm.design.show_assignment" type="checkbox" /><span>Show subject assignment type</span></label>
            <label class="option-check"><input v-model="templateForm.design.show_merit" type="checkbox" /><span>Show merit position</span></label>
          </template>
          <template v-else>
            <label class="wide-field"><span>Opening sentence</span><textarea v-model.trim="templateForm.design.certificate_intro" rows="2"></textarea></label>
            <label class="wide-field"><span>Conduct statement</span><textarea v-model.trim="templateForm.design.certificate_conduct" rows="2"></textarea></label>
            <label class="wide-field"><span>Closing wish</span><textarea v-model.trim="templateForm.design.certificate_wish" rows="2"></textarea></label>
            <label class="option-check"><input v-model="templateForm.design.show_result" type="checkbox" /><span>Include exam result</span></label>
            <label class="option-check"><input v-model="templateForm.design.show_date_of_birth" type="checkbox" /><span>Show date of birth</span></label>
          </template>
          <label class="option-check wide-field"><input v-model="templateForm.design.show_verification" type="checkbox" /><span>Show verification code on issued documents</span></label>
          <label class="option-check wide-field"><input v-model="templateForm.design.show_logo" type="checkbox" /><span>Show institution logo</span></label>
          <label class="default-check wide-field"><input v-model="templateForm.is_default" type="checkbox" /><span><strong>Default template</strong><small>Use automatically for this document type.</small></span></label>
        </div>

        <details class="json-preview"><summary>design_json preview</summary><pre>{{ JSON.stringify(templateForm.design, null, 2) }}</pre></details>

        <div class="modal-actions">
          <button class="secondary-button" type="button" @click="closeTemplateForm">Cancel</button>
          <button class="primary-button" type="submit" :disabled="savingTemplate">{{ savingTemplate ? "Saving…" : "Save Template" }}</button>
        </div>
      </form>
    </div>
  </section>
</template>

<script setup>
import { computed, defineComponent, h, nextTick, onBeforeUnmount, onMounted, reactive, ref } from "vue";
import { useRoute } from "vue-router";
import api from "../../services/api";
import BaseSelect from "../../components/common/BaseSelect.vue";
import { confirmAction, notify } from "../../services/notification";

const route = useRoute();

const tabs = [
  { value: "templates", label: "Templates", caption: "Design library", icon: "◇" },
  { value: "preview", label: "Preview & Issue", caption: "A4 documents", icon: "▤" },
  { value: "register", label: "Issue Register", caption: "Official history", icon: "✓" },
];

const documentTypes = [
  { value: "MARKSHEET", label: "Marksheet", icon: "▦" },
  { value: "TESTIMONIAL", label: "Certificate", icon: "✦" },
];
const paperLabel = (value) => Number(value) === 1 ? " — 1st Paper" : Number(value) === 2 ? " — 2nd Paper" : "";
const paperLabelBn = (value) => Number(value) === 1 ? " · ১ম পত্র" : Number(value) === 2 ? " · ২য় পত্র" : "";

const DocumentHeader = defineComponent({
  name: "DocumentHeader",
  props: {
    institutionName: { type: String, default: "School Management System" },
    institutionAddress: { type: String, default: "" },
    logoUrl: { type: String, default: "" },
    showLogo: { type: Boolean, default: true },
    title: { type: String, default: "" },
    subtitle: { type: String, default: "" },
  },
  setup(props) {
    return () => h("header", { class: "academic-document-header" }, [
      h("div", { class: "academic-logo" }, props.showLogo && props.logoUrl
        ? [h("img", { src: props.logoUrl, alt: "Institution logo" })]
        : "S"),
      h("div", { class: "academic-heading" }, [
        h("h1", props.institutionName),
        props.institutionAddress ? h("p", props.institutionAddress) : null,
        props.title ? h("strong", props.title) : null,
        props.subtitle ? h("small", props.subtitle) : null,
      ]),
      h("div", { class: "document-emblem" }, "ERP"),
    ]);
  },
});

const DocumentFooter = defineComponent({
  name: "DocumentFooter",
  props: {
    footerNote: { type: String, default: "" },
    leftSignature: { type: String, default: "Class Teacher" },
    rightSignature: { type: String, default: "Head of Institution" },
    documentNumber: { type: String, default: "" },
    verificationCode: { type: String, default: "" },
  },
  setup(props) {
    return () => h("footer", { class: "academic-document-footer" }, [
      h("div", { class: "signature-line" }, [h("span"), h("small", props.leftSignature)]),
      h("div", { class: "document-verification" }, [
        props.footerNote ? h("p", props.footerNote) : null,
        h("small", props.documentNumber ? `Document: ${props.documentNumber}` : "DRAFT PREVIEW"),
        props.verificationCode ? h("code", `Verification: ${props.verificationCode}`) : null,
      ]),
      h("div", { class: "signature-line" }, [h("span"), h("small", props.rightSignature)]),
    ]);
  },
});

const templates = ref([]);
const documents = ref([]);
const exams = ref([]);
const examStudents = ref([]);
const resultDetail = ref(null);
const issuedDocument = ref(null);
const lookups = reactive({});
const activeTab = ref("templates");
const templateTypeFilter = ref("");
const documentType = ref("MARKSHEET");
const selectedTemplateId = ref("");
const selectedExamId = ref("");
const selectedStudentId = ref("");
const registerSearch = ref("");
const registerTypeFilter = ref("");
const initialLoading = ref(true);
const loadingExamStudents = ref(false);
const loadingPreviewData = ref(false);
const loadingRegister = ref(false);
const savingTemplate = ref(false);
const issuing = ref(false);
const errorMessage = ref("");
const successMessage = ref("");
const templateFormOpen = ref(false);
const editingTemplateId = ref("");

const templateForm = reactive({
  template_name: "",
  document_type: "MARKSHEET",
  design: defaultDesign("MARKSHEET"),
  is_default: false,
  status: "ACTIVE",
});

const today = new Date().toISOString().slice(0, 10);

const filteredTemplates = computed(() => templates.value.filter((template) => !templateTypeFilter.value || template.document_type === templateTypeFilter.value));
const availableTemplates = computed(() => templates.value.filter((template) => template.document_type === documentType.value && String(template.status || "ACTIVE").toUpperCase() === "ACTIVE"));
const selectedTemplate = computed(() => availableTemplates.value.find((template) => String(templateId(template)) === String(selectedTemplateId.value)) || null);
const activeDesign = computed(() => selectedTemplate.value ? templateDesign(selectedTemplate.value) : defaultDesign(documentType.value));
const examOptions = computed(() => exams.value.map((exam) => ({ value: exam.exam_id, label: [exam.exam_name, exam.class_name, exam.year_name].filter(Boolean).join(" · ") })));
const selectedExam = computed(() => exams.value.find((exam) => String(exam.exam_id) === String(selectedExamId.value)) || {});
const studentOptions = computed(() => examStudents.value.map((student) => ({
  value: student.student_id,
  label: `${student.student_no || student.candidate_no || `#${student.student_id}`} — ${student.full_name || "Unnamed student"}${student.has_result ? " · Result" : " · Candidate"}`,
})));
const selectedExamStudent = computed(() => examStudents.value.find((student) => String(student.student_id) === String(selectedStudentId.value)) || {});
const resultHeader = computed(() => resultDetail.value?.result || (selectedExamStudent.value.has_result ? selectedExamStudent.value : {}));
const resultSubjects = computed(() => resultDetail.value?.details || []);
const studentRecord = computed(() => {
  const lookupStudent = studentLookupRows().find((student) => String(student.student_id) === String(selectedStudentId.value)) || {};
  return {
    ...lookupStudent,
    ...selectedExamStudent.value,
    ...(resultDetail.value?.student || {}),
    ...resultHeader.value,
    student_id: selectedStudentId.value || resultHeader.value.student_id || selectedExamStudent.value.student_id,
  };
});
const institutionName = computed(() => resultHeader.value.institution_name || selectedExam.value.institution_name || lookups.institution?.institution_name || lookups.institution_name || "School Management System");
const institutionAddress = computed(() => resultHeader.value.institution_address || resultHeader.value.address_line || selectedExam.value.institution_address || lookups.institution?.address_line || "");
const guardianName = computed(() => studentRecord.value.father_name || studentRecord.value.mother_name || studentRecord.value.guardian_name || "________________________");
const resultPercentage = computed(() => {
  const total = Number(resultHeader.value.total_marks || 0);
  const obtained = Number(resultHeader.value.obtained_marks || 0);
  return total ? (obtained * 100 / total).toFixed(2).replace(/\.00$/, "") : "0";
});
const previewResultStatus = computed(() => {
  if (!selectedStudentId.value) return "Not loaded";
  if (loadingPreviewData.value) return "Loading";
  return resultHeader.value.result_status || (documentType.value === "TESTIMONIAL" ? "Optional" : "Not available");
});
const previewReady = computed(() => Boolean(selectedTemplateId.value && selectedExamId.value && selectedStudentId.value && (documentType.value === "TESTIMONIAL" || resultHeader.value.result_id || resultSubjects.value.length)));
const issueReady = computed(() => previewReady.value && !loadingPreviewData.value && !issuing.value);

const filteredDocuments = computed(() => {
  const term = registerSearch.value.toLowerCase();
  return documents.value.filter((document) => {
    const text = `${document.document_no || ""} ${document.full_name || document.student_name || ""} ${document.student_no || ""} ${document.verification_code || ""} ${document.exam_name || ""}`.toLowerCase();
    return (!term || text.includes(term)) && (!registerTypeFilter.value || document.document_type === registerTypeFilter.value);
  });
});

function defaultDesign(type) {
  return type === "TESTIMONIAL" ? {
    accent_color: "#1d4ed8",
    header_title: "Academic & Character Certificate",
    subtitle: "প্রত্যয়নপত্র / Certificate",
    footer_note: "This document is valid only with the authorized signature and verification code.",
    left_signature: "Class Teacher",
    right_signature: "Head of Institution",
    certificate_intro: "This is to certify that",
    certificate_conduct: "To the best of our knowledge, the student's conduct and character were satisfactory.",
    certificate_wish: "We wish the student every success in future academic and personal pursuits.",
    layout_style: "classic",
    show_result: true,
    show_date_of_birth: true,
    show_verification: true,
    show_logo: true,
  } : {
    accent_color: "#4f46e5",
    header_title: "Academic Marksheet",
    subtitle: "ফলাফল বিবরণী / Statement of Results",
    footer_note: "This is a system-generated academic result statement.",
    left_signature: "Class Teacher",
    right_signature: "Head of Institution",
    layout_style: "clean",
    show_assignment: true,
    show_merit: true,
    show_verification: true,
    show_logo: true,
  };
}

function templateId(template) {
  return template?.template_id ?? template?.document_template_id ?? "";
}

function toBoolean(value) {
  return value === true || value === 1 || value === "1" || String(value).toLowerCase() === "true";
}

function templateDesign(template) {
  const defaults = defaultDesign(template?.document_type || "MARKSHEET");
  let design = template?.design_json || template?.layout_json || {};
  if (typeof design === "string") {
    try { design = JSON.parse(design); } catch { design = {}; }
  }
  return { ...defaults, ...(design && typeof design === "object" ? design : {}) };
}

function friendlyType(value) {
  return String(value || "DOCUMENT").toUpperCase() === "MARKSHEET" ? "Marksheet" : "Certificate";
}

function assignmentLabel(value) {
  const status = String(value || "MANDATORY").toUpperCase();
  if (status === "FOURTH_SUBJECT") return "4th Subject";
  return status.charAt(0) + status.slice(1).toLowerCase();
}

function displayDate(value) {
  if (!value) return "—";
  const raw = String(value);
  if (/^\d{2}-[A-Z]{3}-\d{4}$/i.test(raw)) return raw.toUpperCase();
  const parsed = new Date(raw.includes("T") ? raw : `${raw.slice(0, 10)}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return raw;
  return new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "short", year: "numeric" }).format(parsed).toUpperCase();
}

function displayNumber(value) {
  if (value === null || value === undefined || value === "") return "—";
  const number = Number(value);
  if (!Number.isFinite(number)) return value;
  return Number.isInteger(number) ? String(number) : number.toFixed(2).replace(/0+$/, "").replace(/\.$/, "");
}

function unwrap(response) {
  return response?.data?.data ?? response?.data ?? null;
}

function rowsFrom(response, keys = []) {
  const payload = unwrap(response);
  if (Array.isArray(payload)) return payload;
  for (const key of [...keys, "rows", "items", "data"]) {
    if (Array.isArray(payload?.[key])) return payload[key];
  }
  return [];
}

function settledRows(result, keys = []) {
  return result.status === "fulfilled" ? rowsFrom(result.value, keys) : [];
}

function studentLookupRows() {
  const list = lookups.students || lookups.student_list || [];
  return Array.isArray(list) ? list : [];
}

function setError(error, fallback) {
  errorMessage.value = error?.response?.data?.message || error?.message || fallback;
}

function clearMessages() {
  errorMessage.value = "";
  successMessage.value = "";
}

async function loadStudio() {
  initialLoading.value = true;
  clearMessages();
  const requests = await Promise.allSettled([
    api.get("/exams/document-templates"),
    api.get("/exams/documents"),
    api.get("/exams/exams"),
    api.get("/exams/lookups"),
  ]);

  templates.value = settledRows(requests[0], ["templates"]);
  documents.value = settledRows(requests[1], ["documents"]);
  exams.value = settledRows(requests[2], ["exams"]);
  if (requests[3].status === "fulfilled") Object.assign(lookups, unwrap(requests[3].value) || {});

  const failures = requests.filter((result) => result.status === "rejected");
  if (failures.length) {
    errorMessage.value = `${failures.length} studio resource${failures.length === 1 ? "" : "s"} could not be loaded. Available sections remain usable.`;
  }
  chooseDefaultTemplate();
  initialLoading.value = false;
}

async function reloadTemplates() {
  const response = await api.get("/exams/document-templates");
  templates.value = rowsFrom(response, ["templates"]);
  chooseDefaultTemplate();
}

async function reloadDocuments() {
  loadingRegister.value = true;
  try {
    const response = await api.get("/exams/documents");
    documents.value = rowsFrom(response, ["documents"]);
  } catch (error) {
    setError(error, "The issue register could not be refreshed.");
  } finally {
    loadingRegister.value = false;
  }
}

function chooseDefaultTemplate(preferredId = "") {
  const matches = availableTemplates.value;
  const preferred = matches.find((template) => String(templateId(template)) === String(preferredId));
  const current = matches.find((template) => String(templateId(template)) === String(selectedTemplateId.value));
  const fallback = matches.find((template) => toBoolean(template.is_default)) || matches[0];
  selectedTemplateId.value = templateId(preferred || current || fallback) || "";
}

function previewFromTemplate(template) {
  documentType.value = template.document_type;
  selectedTemplateId.value = templateId(template);
  issuedDocument.value = null;
  activeTab.value = "preview";
  if (selectedStudentId.value && documentType.value === "MARKSHEET") loadStudentResult();
}

function openTemplateForm(template = null) {
  editingTemplateId.value = templateId(template);
  const type = template?.document_type || templateTypeFilter.value || documentType.value || "MARKSHEET";
  Object.assign(templateForm, {
    template_name: template?.template_name || "",
    document_type: type,
    design: template ? templateDesign(template) : defaultDesign(type),
    is_default: toBoolean(template?.is_default),
    status: template?.status || "ACTIVE",
  });
  templateFormOpen.value = true;
}

function closeTemplateForm() {
  if (!savingTemplate.value) templateFormOpen.value = false;
}

function resetDesignDefaults() {
  templateForm.design = defaultDesign(templateForm.document_type);
}

async function saveTemplate() {
  if (savingTemplate.value) return;
  savingTemplate.value = true;
  clearMessages();
  try {
    const payload = {
      template_name: templateForm.template_name,
      document_type: templateForm.document_type,
      design_json: { ...templateForm.design },
      is_default: Boolean(templateForm.is_default),
      status: templateForm.status,
    };
    const response = editingTemplateId.value
      ? await api.put(`/exams/document-templates/${editingTemplateId.value}`, payload)
      : await api.post("/exams/document-templates", payload);
    const saved = unwrap(response) || {};
    const savedId = templateId(saved) || editingTemplateId.value;
    await reloadTemplates();
    if (templateForm.document_type === documentType.value) chooseDefaultTemplate(savedId);
    templateFormOpen.value = false;
    successMessage.value = "Document template saved successfully.";
    notify.success(successMessage.value);
  } catch (error) {
    setError(error, "Could not save the document template.");
    notify.error(errorMessage.value);
  } finally {
    savingTemplate.value = false;
  }
}

function changeDocumentType(type) {
  documentType.value = type;
  resultDetail.value = null;
  issuedDocument.value = null;
  chooseDefaultTemplate();
  if (selectedStudentId.value && type === "MARKSHEET") loadStudentResult();
}

async function selectExam(value) {
  selectedExamId.value = value || "";
  selectedStudentId.value = "";
  examStudents.value = [];
  resultDetail.value = null;
  issuedDocument.value = null;
  clearMessages();
  if (!selectedExamId.value) return;

  loadingExamStudents.value = true;
  const [resultResponse, candidateResponse] = await Promise.allSettled([
    api.get(`/exams/exams/${selectedExamId.value}/results`),
    api.get(`/exams/exams/${selectedExamId.value}/candidates`),
  ]);

  const resultRows = settledRows(resultResponse, ["results"]);
  const candidateRows = settledRows(candidateResponse, ["candidates"]);
  const merged = new Map();
  resultRows.forEach((student) => merged.set(String(student.student_id), { ...student, has_result: true }));
  candidateRows.forEach((student) => {
    const key = String(student.student_id);
    merged.set(key, { ...student, ...(merged.get(key) || {}), candidate_no: student.candidate_no || merged.get(key)?.candidate_no });
  });
  examStudents.value = [...merged.values()];

  if (resultResponse.status === "rejected" && candidateResponse.status === "rejected") {
    errorMessage.value = "Neither results nor candidates could be loaded for this exam.";
  }
  loadingExamStudents.value = false;
}

async function selectStudent(value) {
  selectedStudentId.value = value || "";
  resultDetail.value = null;
  issuedDocument.value = null;
  clearMessages();
  if (selectedStudentId.value && documentType.value === "MARKSHEET") await loadStudentResult();
}

function normalizeResultDetail(response) {
  const payload = unwrap(response);
  if (Array.isArray(payload)) return { result: payload[0] || {}, details: payload, components: [] };
  if (!payload || typeof payload !== "object") return { result: {}, details: [], components: [] };
  const result = payload.result || payload.student_result || payload.summary || payload;
  const details = payload.details || payload.subjects || payload.result_details || result.details || [];
  const components = payload.components || payload.mark_components || [];
  return {
    result: result && typeof result === "object" ? result : {},
    student: payload.student || {},
    details: Array.isArray(details) ? details : [],
    components: Array.isArray(components) ? components : [],
  };
}

async function loadStudentResult() {
  if (!selectedExamId.value || !selectedStudentId.value) return;
  loadingPreviewData.value = true;
  clearMessages();
  try {
    const response = await api.get(`/exams/exams/${selectedExamId.value}/results/${selectedStudentId.value}`);
    resultDetail.value = normalizeResultDetail(response);
  } catch (error) {
    resultDetail.value = null;
    setError(error, "The detailed result could not be loaded for this student.");
  } finally {
    loadingPreviewData.value = false;
  }
}

async function issueAndPrint() {
  if (!issueReady.value) return;
  const confirmed = await confirmAction({
    title: `Issue ${friendlyType(documentType.value)}?`,
    message: `Create an official document for ${studentRecord.value.full_name || "the selected student"}. This will be recorded in the issue register.`,
    confirmText: "Issue document",
    type: "warning",
  });
  if (!confirmed) return;

  issuing.value = true;
  clearMessages();
  try {
    const response = await api.post("/exams/documents", {
      document_type: documentType.value,
      student_id: selectedStudentId.value,
      exam_id: selectedExamId.value || null,
      template_id: selectedTemplateId.value || null,
    });
    issuedDocument.value = unwrap(response) || {};
    successMessage.value = `${friendlyType(documentType.value)} ${issuedDocument.value.document_no || ""} issued successfully.`.trim();
    notify.success(successMessage.value);
    await reloadDocuments();
    await nextTick();
    startPrintMode();
  } catch (error) {
    setError(error, "Could not issue the document.");
    notify.error(errorMessage.value);
  } finally {
    issuing.value = false;
  }
}

function printDocument() {
  if (previewReady.value) startPrintMode();
}

function startPrintMode() {
  document.body.classList.add("printing-academic-document");
  window.addEventListener("afterprint", clearPrintMode, { once: true });
  window.print();
}

function clearPrintMode() {
  document.body.classList.remove("printing-academic-document");
}

onMounted(async () => {
  await loadStudio();
  const queryExam = String(route.query.exam || "");
  const queryStudent = String(route.query.student || "");
  if (!queryExam) return;
  documentType.value = "MARKSHEET";
  chooseDefaultTemplate();
  await selectExam(queryExam);
  if (queryStudent) await selectStudent(queryStudent);
  activeTab.value = "preview";
});
onBeforeUnmount(clearPrintMode);
</script>

<style scoped>
.document-studio{--ink:#172033;--muted:#64748b;--line:#dfe7f1;display:grid;gap:18px;color:var(--ink)}.studio-hero,.section-panel,.register-panel,.preview-controls,.preview-stage,.empty-selection{border:1px solid var(--line);border-radius:18px;background:#fff;box-shadow:0 8px 28px rgba(15,23,42,.055)}.studio-hero{display:flex;align-items:center;justify-content:space-between;gap:22px;padding:24px;background:linear-gradient(125deg,#f8faff,#eef2ff 52%,#f7fbff)}.eyebrow{display:block;margin-bottom:5px;color:#4f46e5;font-size:10px;font-weight:900;letter-spacing:.13em}.studio-hero h1,.section-panel h2,.control-heading h2,.grid-toolbar h2,.empty-selection h2,.preview-placeholder h2,.modal-heading h2{margin:0;color:var(--ink)}.studio-hero h1{font-size:28px;letter-spacing:-.035em}.studio-hero p,.section-panel p,.control-heading p,.empty-selection p,.preview-placeholder p,.modal-heading p{margin:6px 0 0;color:var(--muted);font-size:13px;line-height:1.55}.hero-stats{display:flex;overflow:hidden;border:1px solid #c7d2fe;border-radius:14px;background:#fff}.hero-stats div{min-width:92px;padding:11px 15px;text-align:center}.hero-stats div+div{border-left:1px solid #e0e7ff}.hero-stats strong,.hero-stats span{display:block}.hero-stats strong{color:#4338ca;font-size:21px}.hero-stats span{margin-top:2px;color:#64748b;font-size:9px;font-weight:800;text-transform:uppercase}.studio-tabs{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;padding:6px;border:1px solid #dce4ef;border-radius:16px;background:#eef2f7}.studio-tabs button{display:flex;align-items:center;justify-content:center;gap:10px;padding:11px 14px;border:0;border-radius:11px;background:transparent;color:#64748b;font:inherit;cursor:pointer}.studio-tabs button>span:first-child{display:grid;place-items:center;width:30px;height:30px;border-radius:9px;background:#fff;color:#818cf8;font-size:16px}.studio-tabs button>span:last-child{display:grid;text-align:left}.studio-tabs strong{font-size:12px}.studio-tabs small{margin-top:1px;font-size:9px}.studio-tabs button.active{background:#fff;color:#3730a3;box-shadow:0 5px 15px rgba(15,23,42,.08)}.studio-tabs button.active>span:first-child{background:#eef2ff;color:#4f46e5}.feedback{display:flex;align-items:center;gap:11px;padding:12px 14px;border-radius:12px;font-size:12px}.feedback>span{display:grid;place-items:center;width:25px;height:25px;border-radius:50%;font-weight:900}.feedback strong{display:block}.feedback p{margin:2px 0 0}.feedback button{margin-left:auto;border:0;background:transparent;color:inherit;font-weight:850}.error-feedback{border:1px solid #fecaca;background:#fff1f2;color:#9f1239}.error-feedback>span{background:#fecdd3}.success-feedback{border:1px solid #bbf7d0;background:#f0fdf4;color:#166534}.success-feedback>span{background:#dcfce7}.loading-state,.table-loading,.preview-loading{display:flex;align-items:center;justify-content:center;gap:10px;color:var(--muted);font-size:13px}.loading-state{min-height:220px;border:1px dashed #cbd5e1;border-radius:16px;background:#fff}.table-loading{min-height:240px}.preview-loading{min-height:560px}.spinner{width:20px;height:20px;border:2px solid #c7d2fe;border-top-color:#4f46e5;border-radius:50%;animation:spin .75s linear infinite}.templates-workspace,.register-workspace{display:grid;gap:16px}.template-toolbar,.register-toolbar{display:flex;align-items:flex-end;justify-content:space-between;gap:20px;padding:20px}.toolbar-actions,.register-filters{display:flex;align-items:end;gap:9px}.toolbar-actions label{display:grid;gap:4px}.toolbar-actions label span{color:#64748b;font-size:9px;font-weight:850;text-transform:uppercase}.toolbar-actions select,.register-filters select,.native-field select,.template-form-grid input,.template-form-grid select,.template-form-grid textarea{border:1px solid #d7e0ec;border-radius:10px;background:#fff;color:var(--ink);font:inherit;font-size:13px;outline:0}.toolbar-actions select,.register-filters select{height:42px;padding:0 32px 0 11px}.primary-button,.secondary-button{display:inline-flex;align-items:center;justify-content:center;gap:7px;min-height:42px;padding:0 15px;border-radius:10px;font:inherit;font-size:13px;font-weight:850;cursor:pointer}.primary-button{border:0;background:linear-gradient(135deg,#4f46e5,#2563eb);color:#fff;box-shadow:0 9px 20px rgba(79,70,229,.2)}.secondary-button{border:1px solid #cbd5e1;background:#fff;color:#334155}.primary-button:disabled,.secondary-button:disabled{cursor:not-allowed;opacity:.52;box-shadow:none}.template-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:15px}.template-card{overflow:hidden;border:1px solid #dfe7f1;border-radius:16px;background:#fff;box-shadow:0 7px 22px rgba(15,23,42,.05);transition:.18s}.template-card:hover{transform:translateY(-2px);box-shadow:0 14px 34px rgba(15,23,42,.09)}.template-preview-mark{display:grid;grid-template-columns:repeat(3,1fr);grid-template-rows:1fr 1fr;gap:5px;height:100px;padding:21px;background:linear-gradient(145deg,color-mix(in srgb,var(--template-accent) 12%,white),#f8fafc)}.template-preview-mark span{border-radius:4px;background:#fff;box-shadow:0 1px 5px rgba(15,23,42,.08)}.template-preview-mark span:first-child{grid-column:1/-1;border-top:4px solid var(--template-accent)}.template-preview-mark span:nth-child(2){grid-column:span 2}.template-card-body{padding:16px}.card-badges{display:flex;align-items:center;gap:5px}.type-badge,.default-badge,.status-badge{display:inline-flex;padding:4px 7px;border-radius:999px;font-size:8px;font-weight:900;text-transform:uppercase}.type-badge{background:#eef2ff;color:#4338ca}.default-badge{background:#dbeafe;color:#1d4ed8}.status-badge{margin-left:auto;background:#f1f5f9;color:#64748b}.status-badge.active{background:#dcfce7;color:#166534}.status-badge.inactive{background:#fee2e2;color:#b91c1c}.template-card h3{margin:12px 0 5px;font-size:16px}.template-card p{margin:0;color:#334155;font-size:12px;font-weight:700}.template-card small{display:block;min-height:32px;margin-top:3px;color:#64748b;font-size:10px}.template-card-actions{display:flex;gap:7px;margin-top:14px}.template-card-actions button{flex:1;padding:8px;border:1px solid #c7d2fe;border-radius:8px;background:#fff;color:#4338ca;font:inherit;font-size:10px;font-weight:850}.preview-workspace{display:grid;grid-template-columns:310px minmax(0,1fr);gap:16px;align-items:start}.preview-controls{position:sticky;top:92px;display:grid;gap:16px;padding:19px}.control-heading h2{font-size:18px}.document-type-switch{display:grid;grid-template-columns:1fr 1fr;gap:7px}.document-type-switch button{display:grid;place-items:center;gap:4px;padding:10px 6px;border:1px solid #dbe3ef;border-radius:10px;background:#fff;color:#64748b;font:inherit;font-size:10px;font-weight:850}.document-type-switch button>span{font-size:18px}.document-type-switch button.active{border-color:#a5b4fc;background:#eef2ff;color:#4338ca}.native-field,.select-field{display:grid;gap:6px}.native-field>span,.select-field>span{color:#334155;font-size:11px;font-weight:850}.native-field select{height:44px;padding:0 11px}.native-field small,.select-field>small{color:#b45309;font-size:9px;line-height:1.4}.preview-status{display:grid;border:1px solid #e2e8f0;border-radius:11px;background:#f8fafc}.preview-status div{display:grid;grid-template-columns:62px 1fr;gap:9px;padding:8px 10px}.preview-status div+div{border-top:1px solid #e2e8f0}.preview-status span{color:#64748b;font-size:9px;font-weight:850;text-transform:uppercase}.preview-status strong{overflow:hidden;color:#334155;font-size:10px;text-overflow:ellipsis;white-space:nowrap}.control-actions{display:grid;grid-template-columns:1fr 1fr;gap:7px}.control-actions button{padding:0 9px;font-size:10px}.issue-note{margin:0!important;padding:10px;border-radius:9px;background:#fffbeb;color:#92400e!important;font-size:9px!important;line-height:1.45!important}.preview-stage{min-width:0;overflow:auto;padding:20px;background:#e8edf5}.paper-frame{display:grid;place-items:start center;min-width:760px}.document-sheet{--document-accent:#4f46e5;width:210mm;min-height:277mm;padding:16mm 15mm;background:#fff;color:#172033;box-shadow:0 16px 45px rgba(15,23,42,.2);font-family:Inter,"Noto Sans Bengali",Arial,sans-serif}.academic-document-header{display:grid;grid-template-columns:62px 1fr 45px;gap:13px;align-items:center;padding-bottom:14px;border-bottom:3px solid var(--document-accent);text-align:center}.academic-logo{display:grid;place-items:center;width:58px;height:58px;border-radius:50%;background:var(--document-accent);color:#fff;font-family:Georgia,serif;font-size:30px;font-weight:900}.academic-heading h1{margin:0;color:#172033;font-family:Georgia,"Noto Serif Bengali",serif;font-size:23px;letter-spacing:.01em}.academic-heading p{margin:3px 0;color:#64748b;font-size:9px}.academic-heading strong{display:block;margin-top:5px;color:var(--document-accent);font-size:12px;text-transform:uppercase;letter-spacing:.08em}.academic-heading small{display:block;margin-top:2px;color:#64748b;font-size:9px}.document-emblem{display:grid;place-items:center;width:42px;height:42px;border:1px solid var(--document-accent);border-radius:50%;color:var(--document-accent);font-size:9px;font-weight:900}.document-title-row{display:flex;align-items:center;justify-content:space-between;gap:20px;margin-top:17px}.document-title-row span{color:#64748b;font-size:8px;font-weight:900;letter-spacing:.1em;text-transform:uppercase}.document-title-row h2{margin:4px 0 0;font-family:Georgia,"Noto Serif Bengali",serif;font-size:19px}.result-seal{min-width:82px;padding:7px 9px;border:1px solid #cbd5e1;border-radius:7px;text-align:center}.result-seal span,.result-seal strong{display:block}.result-seal span{color:#64748b;font-size:7px;text-transform:uppercase}.result-seal strong{margin-top:2px;font-size:10px}.result-seal.passed{border-color:#86efac;background:#f0fdf4;color:#166534}.result-seal.failed{border-color:#fca5a5;background:#fff1f2;color:#b91c1c}.student-details-grid{display:grid;grid-template-columns:repeat(3,1fr);margin:14px 0 16px;border-top:1px solid #cbd5e1;border-left:1px solid #cbd5e1}.student-details-grid>div{padding:8px 9px;border-right:1px solid #cbd5e1;border-bottom:1px solid #cbd5e1}.student-details-grid dt{color:#64748b;font-size:7px;font-weight:850;text-transform:uppercase;letter-spacing:.04em}.student-details-grid dd{margin:3px 0 0;font-size:10px;font-weight:800}.result-table{width:100%;border-collapse:collapse}.result-table th,.result-table td{padding:7px 6px;border:1px solid #cbd5e1;text-align:center;font-size:9px}.result-table th{background:color-mix(in srgb,var(--document-accent) 9%,white);color:#334155;font-size:7px;font-weight:900;text-transform:uppercase}.result-table th:nth-child(2),.result-table td:nth-child(2){text-align:left}.result-table td strong,.result-table td small{display:block}.result-table td small{margin-top:2px;color:#64748b;font-size:7px}.grade-chip{display:inline-grid;place-items:center;min-width:24px;padding:3px;border-radius:4px;background:color-mix(in srgb,var(--document-accent) 11%,white);color:var(--document-accent);font-weight:900}.document-empty{height:70px;color:#64748b!important;text-align:center!important}.result-summary{display:grid;grid-template-columns:repeat(6,1fr);margin-top:14px;border:1px solid #cbd5e1;border-radius:7px}.result-summary div{padding:8px 6px;text-align:center}.result-summary div+div{border-left:1px solid #cbd5e1}.result-summary span,.result-summary strong{display:block}.result-summary span{color:#64748b;font-size:7px;text-transform:uppercase}.result-summary strong{margin-top:3px;color:var(--document-accent);font-size:12px}.academic-document-footer{display:grid;grid-template-columns:1fr 1.6fr 1fr;gap:26px;align-items:end;margin-top:55px}.signature-line{text-align:center}.signature-line span{display:block;border-top:1px solid #334155}.signature-line small{display:block;margin-top:5px;color:#475569;font-size:8px}.document-verification{text-align:center}.document-verification p{margin:0 0 5px;color:#64748b;font-size:7px;line-height:1.4}.document-verification small,.document-verification code{display:block;color:#64748b;font-size:7px}.document-verification code{margin-top:2px;color:var(--document-accent);font-family:monospace}.testimonial-sheet{padding:11mm}.certificate-border{min-height:255mm;padding:15mm;border:4px double var(--document-accent)}.testimonial-heading{margin-top:35px;text-align:center}.testimonial-heading>span{display:block;color:var(--document-accent);font-size:9px;font-weight:900;letter-spacing:.16em}.testimonial-heading h2{margin:8px 0 5px;font-family:Georgia,"Noto Serif Bengali",serif;font-size:25px}.testimonial-heading p{margin:0;color:#64748b;font-size:8px}.testimonial-copy{margin-top:35px;color:#334155;font-family:Georgia,"Noto Serif Bengali",serif;font-size:13px;line-height:2;text-align:justify}.testimonial-copy p{margin:0 0 17px}.testimonial-copy strong{color:#172033;border-bottom:1px dotted #64748b}.testimonial-facts{display:grid;grid-template-columns:repeat(3,1fr);margin-top:28px;border-top:1px solid #cbd5e1;border-left:1px solid #cbd5e1}.testimonial-facts>div{padding:9px;border-right:1px solid #cbd5e1;border-bottom:1px solid #cbd5e1}.testimonial-facts dt{color:#64748b;font-size:7px;text-transform:uppercase}.testimonial-facts dd{margin:4px 0 0;font-size:9px;font-weight:800}.testimonial-sheet .academic-document-footer{margin-top:70px}.preview-placeholder{display:grid;place-items:center;min-width:650px;min-height:700px;text-align:center}.paper-illustration{width:170px;height:220px;padding:35px 25px;border:1px solid #cbd5e1;border-radius:4px;background:#fff;box-shadow:0 15px 35px rgba(15,23,42,.12)}.paper-illustration span{display:block;height:8px;margin-bottom:17px;border-radius:6px;background:#e2e8f0}.paper-illustration span:first-child{height:14px;background:#c7d2fe}.preview-placeholder h2{margin-top:18px;font-size:18px}.register-filters .search-field{width:300px}.search-field{display:flex;align-items:center;gap:7px;height:42px;padding:0 11px;border:1px solid #d7e0ec;border-radius:10px;background:#f8fafc;color:#94a3b8}.search-field input{width:100%;border:0;outline:0;background:transparent;color:var(--ink);font:inherit;font-size:12px}.register-panel{overflow:hidden}.table-scroll{width:100%;overflow:auto}.register-table{width:100%;min-width:850px;border-collapse:collapse}.register-table th,.register-table td{padding:12px 14px;border-bottom:1px solid #edf1f6;text-align:left;font-size:12px}.register-table th{background:#f8fafc;color:#64748b;font-size:9px;font-weight:900;text-transform:uppercase;letter-spacing:.055em}.register-table td strong,.register-table td small{display:block}.register-table td small{margin-top:3px;color:#64748b;font-size:9px}.register-table code{padding:4px 6px;border-radius:5px;background:#f1f5f9;color:#4338ca;font-size:9px}.register-status{display:inline-flex;padding:4px 7px;border-radius:999px;background:#dbeafe;color:#1d4ed8;font-size:8px;font-weight:900}.register-status.revoked,.register-status.cancelled{background:#fee2e2;color:#b91c1c}.empty-cell{height:150px;color:#64748b!important;text-align:center!important}.empty-selection{display:grid;place-items:center;min-height:300px;padding:35px;text-align:center}.empty-selection>div{display:grid;place-items:center;width:58px;height:58px;margin-bottom:12px;border-radius:18px;background:#eef2ff;color:#4f46e5;font-size:26px}.empty-selection .primary-button{margin-top:14px}.modal-backdrop{position:fixed;inset:0;z-index:1200;display:grid;place-items:center;padding:18px;background:rgba(15,23,42,.63);backdrop-filter:blur(3px)}.template-modal{width:min(760px,100%);max-height:92vh;overflow:auto;padding:22px;border-radius:18px;background:#fff;box-shadow:0 28px 70px rgba(15,23,42,.3)}.modal-heading{display:flex;justify-content:space-between;gap:18px;margin-bottom:18px}.modal-heading h2{font-size:20px}.close-button{width:36px;height:36px;border:0;border-radius:10px;background:#f1f5f9;color:#475569;font-size:23px;line-height:1}.template-form-grid{display:grid;grid-template-columns:1fr 1fr;gap:13px}.template-form-grid>label{display:grid;gap:6px;color:#334155;font-size:11px;font-weight:800}.template-form-grid input,.template-form-grid select{height:43px;padding:0 11px}.template-form-grid textarea{padding:10px;resize:vertical}.template-form-grid input:disabled{background:#f1f5f9;color:#64748b}.wide-field{grid-column:1/-1}.accent-field>div{display:grid;grid-template-columns:52px 1fr;gap:7px}.accent-field input[type=color]{width:52px;padding:4px}.default-check{display:flex!important;align-items:center;padding:11px;border:1px solid #dbeafe;border-radius:10px;background:#f8fbff}.default-check>input{width:18px;height:18px}.default-check>span{display:grid;gap:2px}.default-check small{color:#64748b;font-weight:500}.json-preview{margin-top:14px;border:1px solid #e2e8f0;border-radius:10px;background:#f8fafc}.json-preview summary{padding:9px 11px;color:#475569;font-size:10px;font-weight:850;cursor:pointer}.json-preview pre{max-height:170px;overflow:auto;margin:0;padding:11px;border-top:1px solid #e2e8f0;color:#334155;font-size:9px}.modal-actions{display:flex;justify-content:flex-end;gap:8px;margin-top:18px}@keyframes spin{to{transform:rotate(360deg)}}
.option-check{display:flex!important;align-items:center;gap:9px;min-height:43px;padding:0 11px;border:1px solid #e2e8f0;border-radius:10px;background:#f8fafc}.option-check input{width:17px!important;height:17px!important}.academic-logo img{width:100%;height:100%;border-radius:50%;object-fit:contain;background:#fff}.document-sheet.clean .academic-document-header{border-bottom-width:1px}.document-sheet.clean .academic-logo{border-radius:12px}.document-sheet.modern .academic-document-header{padding:12px;border:0;border-radius:9px;background:color-mix(in srgb,var(--document-accent) 9%,white)}.document-sheet.modern .result-table th{background:var(--document-accent);color:#fff}.document-sheet.modern .certificate-border{border-style:solid;border-width:7px}.document-sheet.modern .testimonial-heading h2{color:var(--document-accent)}
.academic-document-header :deep(.academic-logo){display:grid;place-items:center;width:58px;height:58px;border-radius:50%;background:var(--document-accent);color:#fff;font-family:Georgia,serif;font-size:30px;font-weight:900}.academic-document-header :deep(.academic-logo img){width:100%;height:100%;border-radius:inherit;object-fit:contain;background:#fff}.academic-document-header :deep(.academic-heading h1){margin:0;color:#172033;font-family:Georgia,"Noto Serif Bengali",serif;font-size:23px;letter-spacing:.01em}.academic-document-header :deep(.academic-heading p){margin:3px 0;color:#64748b;font-size:9px}.academic-document-header :deep(.academic-heading strong){display:block;margin-top:5px;color:var(--document-accent);font-size:12px;text-transform:uppercase;letter-spacing:.08em}.academic-document-header :deep(.academic-heading small){display:block;margin-top:2px;color:#64748b;font-size:9px}.academic-document-header :deep(.document-emblem){display:grid;place-items:center;width:42px;height:42px;border:1px solid var(--document-accent);border-radius:50%;color:var(--document-accent);font-size:9px;font-weight:900}.academic-document-footer :deep(.signature-line){text-align:center}.academic-document-footer :deep(.signature-line span){display:block;border-top:1px solid #334155}.academic-document-footer :deep(.signature-line small){display:block;margin-top:5px;color:#475569;font-size:8px}.academic-document-footer :deep(.document-verification){text-align:center}.academic-document-footer :deep(.document-verification p){margin:0 0 5px;color:#64748b;font-size:7px;line-height:1.4}.academic-document-footer :deep(.document-verification small),.academic-document-footer :deep(.document-verification code){display:block;color:#64748b;font-size:7px}.academic-document-footer :deep(.document-verification code){margin-top:2px;color:var(--document-accent);font-family:monospace}
@media(max-width:1150px){.template-grid{grid-template-columns:repeat(2,1fr)}.preview-workspace{grid-template-columns:1fr}.preview-controls{position:static;grid-template-columns:1fr 1fr}.control-heading,.document-type-switch,.preview-status,.control-actions,.issue-note{grid-column:1/-1}.preview-stage{max-width:100%}}
@media(max-width:760px){.studio-hero,.template-toolbar,.register-toolbar{align-items:flex-start;flex-direction:column}.hero-stats{width:100%}.hero-stats div{flex:1}.studio-tabs button>span:last-child small{display:none}.template-grid{grid-template-columns:1fr}.toolbar-actions,.register-filters{width:100%;align-items:stretch;flex-direction:column}.toolbar-actions label,.toolbar-actions select,.toolbar-actions button,.register-filters .search-field,.register-filters select{width:100%}.preview-controls{grid-template-columns:1fr}.template-form-grid{grid-template-columns:1fr}.wide-field{grid-column:auto}.studio-hero h1{font-size:24px}.preview-stage{padding:10px}.paper-frame{min-width:720px}}
@media(max-width:520px){.studio-tabs{gap:3px}.studio-tabs button{padding:9px 5px}.studio-tabs button>span:first-child{display:none}.studio-tabs button>span:last-child{text-align:center}.template-card-actions{flex-direction:column}.document-type-switch{grid-column:auto}.control-heading,.preview-status,.control-actions,.issue-note{grid-column:auto}}
@media print{:global(body.printing-academic-document *){visibility:hidden!important}.paper-frame,.paper-frame *{visibility:visible!important}.preview-stage,.paper-frame{position:absolute!important;inset:0!important;display:block!important;min-width:0!important;padding:0!important;background:#fff!important}.document-sheet{width:210mm!important;min-height:297mm!important;margin:0!important;padding:14mm!important;box-shadow:none!important;print-color-adjust:exact;-webkit-print-color-adjust:exact}.testimonial-sheet{padding:9mm!important}.certificate-border{min-height:270mm!important}.print-hidden{display:none!important}@page{size:A4 portrait;margin:0}}
</style>
