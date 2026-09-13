<template>
  <BaseCard class="student-profile-card">
    <div class="profile-actions no-print">
      <BaseButton type="button" variant="secondary" @click="$emit('back')">Back</BaseButton>
      <div class="right-actions">
        <BaseButton type="button" variant="secondary" @click="$emit('edit')">Edit student</BaseButton>
        <BaseButton type="button" @click="$emit('print')">Print</BaseButton>
      </div>
    </div>
    <div id="student-profile-print" class="profile-report">
      <header class="compact-header">
        <div class="student-photo"><img v-if="student.photo_url" :src="getFileUrl(student.photo_url)" alt="Student photo" /><span v-else>{{ initials }}</span></div>
        <div class="student-heading"><h2>{{ fullName }}</h2><p>{{ student.student_no }} · {{ institutionName }}</p></div>
        <span class="compact-status">{{ student.status }}</span>
      </header>
      <section class="report-section">
        <div class="info-grid">
          <InfoItem label="Class" :value="className" />
          <InfoItem v-if="enrollment.group_id" label="Group" :value="groupName" />
          <InfoItem label="Roll" :value="enrollment.roll_no" />
          <InfoItem label="Section" :value="sectionName" />
          <InfoItem label="Academic year" :value="academicYearName" />
          <InfoItem label="Batch" :value="batchName" />
          <InfoItem label="Branch" :value="branchName" />
          <InfoItem label="Mobile" :value="student.mobile" />
        </div>
      </section>
      <section v-if="guardians.length" class="report-section">
        <h3>Guardian contact</h3>
        <div v-for="(item, index) in guardians" :key="index" class="info-grid guardian-contact">
          <InfoItem :label="(item.relation_type || 'Guardian').replaceAll('_', ' ')" :value="guardianValue(item, 'guardian_name')" />
          <InfoItem label="Mobile" :value="guardianValue(item, 'mobile')" />
          <InfoItem label="Address" :value="guardianValue(item, 'address_line')" />
        </div>
      </section>
      <section class="report-section">
        <h3>Assigned subjects <span class="subject-count">{{ subjects.length }} {{ subjects.length === 1 ? 'paper' : 'papers' }}</span></h3>
        <div v-if="subjects.length" class="subject-list">
          <div v-for="subject in subjects" :key="`${subject.subject_id}:${subject.paper_no}`" class="subject-chip">
            <b>{{ subject.subject_name }}{{ Number(subject.paper_no) ? ` · Paper ${subject.paper_no}` : '' }}</b>
            <small>{{ ({ MANDATORY: 'Required', OPTIONAL: 'Optional', FOURTH_SUBJECT: '4th subject' })[subject.assignment_type] }}</small>
          </div>
        </div>
        <p v-else class="empty-text">No subjects assigned. Edit the student to choose a group and save subjects.</p>
      </section>
      <details class="profile-details">
        <summary>More profile details</summary>
        <section class="report-section">
          <h3>Personal & admission details</h3>
          <div class="info-grid">
            <InfoItem label="Admission no" :value="student.admission_no" />
            <InfoItem label="Registration no" :value="student.registration_no" />
            <InfoItem label="Gender" :value="student.gender" />
            <InfoItem label="Date of birth" :value="formatDate(student.date_of_birth)" />
            <InfoItem label="Birth certificate" :value="student.birth_certificate_no" />
            <InfoItem label="NID" :value="student.nid_no" />
            <InfoItem label="Blood group" :value="student.blood_group" />
            <InfoItem label="Religion" :value="student.religion" />
            <InfoItem label="Nationality" :value="student.nationality" />
            <InfoItem label="Email" :value="student.email" />
            <InfoItem label="Admission date" :value="formatDate(admission.admission_date)" />
            <InfoItem label="Approval" :value="admission.approval_status" />
            <InfoItem label="Previous institute" :value="admission.previous_institute" />
            <InfoItem label="Previous class" :value="admission.previous_class" />
            <InfoItem label="Remarks" :value="admission.remarks" />
            <InfoItem label="Medium" :value="mediumName" />
            <InfoItem label="Shift" :value="shiftName" />
          </div>
        </section>
      <!-- ================= ADDRESS INFO ================= -->
      <section class="report-section">
        <h3>Student Address</h3>

        <div v-if="addresses.length" class="address-grid">
          <div
            v-for="(address, index) in addresses"
            :key="address.address_type || index"
            class="sub-card"
          >
            <div class="sub-card-title">
              <strong>{{ value(address.address_type) }} Address</strong>
            </div>

            <p class="address-line">
              {{ fullAddress(address) }}
            </p>

            <div class="info-grid two-col">
              <InfoItem label="Village / Road" :value="address.village_road" />
              <InfoItem label="Post Office" :value="address.post_office" />
              <InfoItem label="Thana / Upazila" :value="address.thana_upazila" />
              <InfoItem label="District" :value="address.district" />
              <InfoItem label="Division" :value="address.division" />
              <InfoItem label="Postal Code" :value="address.postal_code" />
              <InfoItem label="Country" :value="address.country" />
            </div>
          </div>
        </div>

        <div v-else class="empty-text">
          No address information found.
        </div>
      </section>

      <!-- ================= DOCUMENTS ================= -->
      <section class="report-section">
        <h3>Documents</h3>

        <div v-if="documents.length" class="document-table">
          <table>
            <thead>
              <tr>
                <th>SL</th>
                <th>Document Type</th>
                <th>Title</th>
                <th>File</th>
                <th>Status</th>
              </tr>
            </thead>

            <tbody>
              <tr v-for="(doc, index) in documents" :key="index">
                <td>{{ index + 1 }}</td>
                <td>{{ value(doc.document_type) }}</td>
                <td>{{ value(doc.document_title) }}</td>
                <td>
                  <a
                    v-if="doc.file_url"
                    :href="getFileUrl(doc.file_url)"
                    target="_blank"
                    class="doc-link"
                  >
                    View File
                  </a>
                  <span v-else>N/A</span>
                </td>
                <td>{{ value(doc.status) }}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div v-else class="empty-text">
          No document information found.
        </div>
      </section>

      </details>
    </div>
  </BaseCard>
</template>
<script setup>
import { computed, defineComponent, h } from "vue";

import BaseCard from "../common/BaseCard.vue";
import BaseButton from "../common/BaseButton.vue";
import { getFileUrl } from "../../services/api";
import { formatDateForDisplay } from "../../utils/dateFormat";

const props = defineProps({
  profile: {
    type: Object,
    default: () => ({})
  }
});

defineEmits(["back", "edit", "print"]);

const InfoItem = defineComponent({
  name: "InfoItem",
  props: {
    label: {
      type: String,
      required: true
    },
    value: {
      type: [String, Number, Boolean, null],
      default: ""
    }
  },
  setup(itemProps) {
    const displayValue = computed(() => {
      if (
        itemProps.value === null ||
        itemProps.value === undefined ||
        itemProps.value === ""
      ) {
        return "N/A";
      }

      return itemProps.value;
    });

    return () =>
      displayValue.value === "N/A" ? null : h("div", { class: "info-item" }, [
        h("span", itemProps.label),
        h("strong", displayValue.value)
      ]);
  }
});

const data = computed(() => props.profile?.data || props.profile || {});

const student = computed(() => data.value.student || data.value || {});
const admission = computed(() => data.value.admission || {});
const enrollment = computed(() => data.value.enrollment || {});
const guardians = computed(() =>
  Array.isArray(data.value.guardians) ? data.value.guardians : []
);
const addresses = computed(() =>
  Array.isArray(data.value.addresses) ? data.value.addresses : []
);
const subjects = computed(() => data.value.subjects || []);
const documents = computed(() =>
  Array.isArray(data.value.documents) ? data.value.documents : []
);

const fullName = computed(() => {
  const firstName = student.value.first_name || "";
  const lastName = student.value.last_name || "";
  const name = `${firstName} ${lastName}`.trim();

  return name || student.value.student_name || "Unnamed Student";
});

const initials = computed(() => {
  return fullName.value
    .split(" ")
    .map((part) => part.charAt(0))
    .join("")
    .slice(0, 2)
    .toUpperCase();
});

const institutionName = computed(() => {
  return (
    student.value.institution_name ||
    data.value.institution_name ||
    "School Management System"
  );
});

const branchName = computed(() => {
  return (
    admission.value.branch_name ||
    enrollment.value.branch_name ||
    data.value.branch_name ||
    "N/A"
  );
});

const academicYearName = computed(() => {
  return (
    admission.value.academic_year_name ||
    admission.value.year_name ||
    enrollment.value.academic_year_name ||
    data.value.academic_year_name ||
    "N/A"
  );
});

const className = computed(() => {
  return (
    enrollment.value.class_name ||
    enrollment.value.class_level_name ||
    data.value.class_name ||
    "N/A"
  );
});

const batchName = computed(() => {
  return enrollment.value.batch_name || data.value.batch_name || "N/A";
});

const groupName = computed(() => {
  return enrollment.value.group_name || data.value.group_name || "N/A";
});

const sectionName = computed(() => {
  return enrollment.value.section_name || data.value.section_name || "N/A";
});

const mediumName = computed(() => {
  return enrollment.value.medium_name || data.value.medium_name || "N/A";
});

const shiftName = computed(() => {
  return enrollment.value.shift_name || data.value.shift_name || "N/A";
});

function value(input) {
  if (input === null || input === undefined || input === "") return "N/A";
  return input;
}

function formatDate(input) {
  return formatDateForDisplay(input, "N/A");
}

function guardianValue(item, key) {
  return item?.guardian?.[key] ?? item?.[key] ?? "N/A";
}

function fullAddress(address) {
  const parts = [
    address.village_road,
    address.post_office,
    address.thana_upazila,
    address.district,
    address.division,
    address.postal_code,
    address.country
  ].filter(Boolean);

  return parts.length ? parts.join(", ") : "N/A";
}
</script>

<style scoped>
.student-profile-card{max-width:1000px;margin:0 auto;padding:18px}.profile-actions,.right-actions{display:flex;justify-content:space-between;gap:10px}.profile-actions{margin-bottom:18px}.compact-header{display:flex;align-items:center;gap:14px;padding-bottom:16px}.student-heading{flex:1;min-width:0}.student-heading h2{margin:0;font-size:22px;color:#0f172a}.student-heading p{margin:5px 0 0;color:#64748b;font-size:13px}.student-photo{width:62px;height:70px;flex-shrink:0;border-radius:10px;overflow:hidden;display:grid;place-items:center;background:#eef2ff;color:#4f46e5;font-weight:700;font-size:22px}.student-photo img{width:100%;height:100%;object-fit:cover}.compact-status{padding:5px 9px;border-radius:6px;background:#ecfdf5;color:#047857;font-size:12px}.report-section{padding:16px 0;border-top:1px solid #e2e8f0}.report-section h3{margin:0 0 12px;font-size:14px;color:#334155}.info-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:14px}.guardian-contact+.guardian-contact{margin-top:12px}:deep(.info-item){display:flex;flex-direction:column;gap:4px;min-width:0}:deep(.info-item span){font-size:12px;color:#64748b}:deep(.info-item strong){font-size:14px;font-weight:600;color:#1e293b;overflow-wrap:anywhere}.subject-count{font-weight:400;color:#64748b;margin-left:8px}.subject-list{display:flex;flex-wrap:wrap;gap:8px}.subject-chip{border:1px solid #e2e8f0;border-radius:8px;padding:8px 12px;background:#f8fafc}.subject-chip b{display:block;font-size:13px;color:#334155}.subject-chip small{font-size:11px;color:#64748b}.profile-details{border-top:1px solid #e2e8f0;padding-top:14px}.profile-details summary{font-size:13px;color:#475569;cursor:pointer}.profile-details[open] summary{margin-bottom:14px}.empty-text,.address-line{font-size:13px;color:#64748b}.address-grid{display:grid;grid-template-columns:1fr 1fr;gap:16px}.sub-card-title{font-size:13px}.document-table{overflow:auto}table{width:100%;border-collapse:collapse;font-size:13px}th,td{padding:9px;text-align:left;border-bottom:1px solid #e2e8f0}a{color:#4f46e5}
@media(max-width:640px){.info-grid{grid-template-columns:repeat(2,minmax(0,1fr))}.address-grid{grid-template-columns:1fr}.student-heading h2{font-size:18px}.compact-header{flex-wrap:wrap}}
@media print{.no-print{display:none!important}.student-profile-card{max-width:none;padding:0}.report-section{break-inside:avoid}.profile-details:not([open]){display:none}}
</style>
