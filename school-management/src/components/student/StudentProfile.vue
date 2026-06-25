<template>
  <BaseCard class="student-profile-card">
    <div class="profile-actions no-print">
      <BaseButton type="button" variant="secondary" @click="$emit('back')">
        Back
      </BaseButton>

      <div class="right-actions">
        <BaseButton type="button" variant="secondary" @click="$emit('edit')">
          Edit
        </BaseButton>

        <BaseButton type="button" @click="$emit('print')">
          Print Profile
        </BaseButton>
      </div>
    </div>

    <div id="student-profile-print" class="profile-report">
      <!-- ================= REPORT HEADER ================= -->
      <div class="report-header">
        <div class="school-info">
          <h1>{{ institutionName }}</h1>
          <p>{{ branchName }}</p>
          <p>Student Profile / Admission Report</p>
        </div>

        <div class="student-photo">
          <img
            v-if="student.photo_url"
            :src="student.photo_url"
            alt="Student Photo"
          />
          <span v-else>{{ initials }}</span>
        </div>
        
      </div>

      <!-- ================= STUDENT SUMMARY ================= -->
      <section class="summary-section">
        <div>
          <h2>{{ fullName }}</h2>
          <p>
            Student No:
            <strong>{{ value(student.student_no) }}</strong>
          </p>
          <p>
            Admission No:
            <strong>{{ value(student.admission_no) }}</strong>
          </p>
        </div>

        <div class="status-box">
          <span>Status</span>
          <strong>{{ value(student.status) }}</strong>
        </div>
      </section>

      <!-- ================= BASIC INFO ================= -->
      <section class="report-section">
        <h3>Student Information</h3>

        <div class="info-grid">
          <InfoItem label="Student No" :value="student.student_no" />
          <InfoItem label="Admission No" :value="student.admission_no" />
          <InfoItem label="Registration No" :value="student.registration_no" />
          <InfoItem label="First Name" :value="student.first_name" />
          <InfoItem label="Last Name" :value="student.last_name" />
          <InfoItem label="Gender" :value="student.gender" />
          <InfoItem label="Date of Birth" :value="formatDate(student.date_of_birth)" />
          <InfoItem label="Birth Certificate No" :value="student.birth_certificate_no" />
          <InfoItem label="NID No" :value="student.nid_no" />
          <InfoItem label="Blood Group" :value="student.blood_group" />
          <InfoItem label="Religion" :value="student.religion" />
          <InfoItem label="Nationality" :value="student.nationality" />
          <InfoItem label="Mobile" :value="student.mobile" />
          <InfoItem label="Email" :value="student.email" />
        </div>
      </section>

      <!-- ================= ADMISSION INFO ================= -->
      <section class="report-section">
        <h3>Admission Information</h3>

        <div class="info-grid">
          <InfoItem label="Branch" :value="branchName" />
          <InfoItem label="Academic Year" :value="academicYearName" />
          <InfoItem label="Admission Date" :value="formatDate(admission.admission_date)" />
          <InfoItem label="Admission Type" :value="admission.admission_type" />
          <InfoItem label="Approval Status" :value="admission.approval_status" />
          <InfoItem label="Previous Institute" :value="admission.previous_institute" />
          <InfoItem label="Previous Class" :value="admission.previous_class" />
          <InfoItem label="Remarks" :value="admission.remarks" />
        </div>
      </section>

      <!-- ================= ACADEMIC INFO ================= -->
      <section class="report-section">
        <h3>Academic Enrollment</h3>

        <div class="info-grid">
          <InfoItem label="Class" :value="className" />
          <InfoItem label="Batch" :value="batchName" />
          <InfoItem label="Group" :value="groupName" />
          <InfoItem label="Section" :value="sectionName" />
          <InfoItem label="Medium" :value="mediumName" />
          <InfoItem label="Shift" :value="shiftName" />
          <InfoItem label="Roll No" :value="enrollment.roll_no" />
          <InfoItem label="Enrollment Status" :value="enrollment.enrollment_status" />
          <InfoItem label="Start Date" :value="formatDate(enrollment.start_date)" />
          <InfoItem label="End Date" :value="formatDate(enrollment.end_date)" />
        </div>
      </section>

      <!-- ================= GUARDIAN INFO ================= -->
      <section class="report-section">
        <h3>Guardian Information</h3>

        <div v-if="guardians.length" class="guardian-list">
          <div
            v-for="(item, index) in guardians"
            :key="index"
            class="sub-card"
          >
            <div class="sub-card-title">
              <strong>Guardian {{ index + 1 }}</strong>
              <span>{{ value(item.relation_type) }}</span>
            </div>

            <div class="info-grid">
              <InfoItem label="Guardian Name" :value="guardianValue(item, 'guardian_name')" />
              <InfoItem label="Relation Name" :value="guardianValue(item, 'relation_name')" />
              <InfoItem label="Occupation" :value="guardianValue(item, 'occupation')" />
              <InfoItem label="NID No" :value="guardianValue(item, 'nid_no')" />
              <InfoItem label="Mobile" :value="guardianValue(item, 'mobile')" />
              <InfoItem label="Alternate Mobile" :value="guardianValue(item, 'alternate_mobile')" />
              <InfoItem label="Email" :value="guardianValue(item, 'email')" />
              <InfoItem label="Monthly Income" :value="guardianValue(item, 'monthly_income')" />
              <InfoItem label="Address" :value="guardianValue(item, 'address_line')" />
              <InfoItem label="Primary Guardian" :value="item.is_primary ? 'Yes' : 'No'" />
              <InfoItem label="Emergency Contact" :value="item.is_emergency_contact ? 'Yes' : 'No'" />
              <InfoItem label="Status" :value="guardianValue(item, 'status')" />
            </div>
          </div>
        </div>

        <div v-else class="empty-text">
          No guardian information found.
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
                    :href="doc.file_url"
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

      <!-- ================= SIGNATURE ================= -->
      <section class="signature-section">
        <div>
          <span></span>
          <p>Guardian Signature</p>
        </div>

        <div>
          <span></span>
          <p>Class Teacher</p>
        </div>

        <div>
          <span></span>
          <p>Principal / Admin</p>
        </div>
      </section>
    </div>
  </BaseCard>
</template>

<script setup>
import { computed, defineComponent, h } from "vue";

import BaseCard from "../common/BaseCard.vue";
import BaseButton from "../common/BaseButton.vue";

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
      h("div", { class: "info-item" }, [
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
  if (!input) return "N/A";
  return String(input).slice(0, 10);
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
.student-profile-card {
  padding: 24px;
  border-radius: 24px;
}

.profile-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  margin-bottom: 18px;
}

.right-actions {
  display: flex;
  gap: 10px;
}

.profile-report {
  background: #ffffff;
  color: #0f172a;
}

.report-header {
  display: flex;
  justify-content: space-between;
  gap: 24px;
  padding: 24px;
  border: 1px solid #e2e8f0;
  border-radius: 18px;
  background: linear-gradient(135deg, #f8fafc, #eef2ff);
}

.school-info h1 {
  margin: 0;
  font-size: 26px;
  font-weight: 800;
  color: #0f172a;
}

.school-info p {
  margin: 6px 0 0;
  color: #475569;
  font-size: 14px;
}

.student-photo {
  width: 120px;
  height: 135px;
  border-radius: 16px;
  border: 2px solid #cbd5e1;
  overflow: hidden;
  background: #eff6ff;
  display: grid;
  place-items: center;
  color: #2563eb;
  font-size: 32px;
  font-weight: 800;
}

.student-photo img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.summary-section {
  display: flex;
  justify-content: space-between;
  gap: 20px;
  margin-top: 18px;
  padding: 22px;
  border-radius: 18px;
  background: #0f172a;
  color: #ffffff;
}

.summary-section h2 {
  margin: 0;
  font-size: 24px;
}

.summary-section p {
  margin: 7px 0 0;
  color: #cbd5e1;
}

.status-box {
  min-width: 150px;
  padding: 16px;
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.12);
  text-align: center;
}

.status-box span {
  display: block;
  color: #cbd5e1;
  font-size: 13px;
}

.status-box strong {
  display: block;
  margin-top: 6px;
  font-size: 18px;
}

.report-section {
  margin-top: 18px;
  padding: 22px;
  border: 1px solid #e2e8f0;
  border-radius: 18px;
  background: #ffffff;
}

.report-section h3 {
  margin: 0 0 16px;
  padding-bottom: 10px;
  border-bottom: 1px solid #e2e8f0;
  color: #0f172a;
  font-size: 18px;
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12px;
}

.info-grid.two-col {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.info-item {
  padding: 12px;
  border-radius: 12px;
  background: #f8fafc;
  border: 1px solid #edf2f7;
}

.info-item span {
  display: block;
  color: #64748b;
  font-size: 12px;
  margin-bottom: 4px;
}

.info-item strong {
  display: block;
  color: #0f172a;
  font-size: 14px;
  word-break: break-word;
}

.guardian-list,
.address-grid {
  display: grid;
  gap: 14px;
}

.sub-card {
  padding: 16px;
  border-radius: 16px;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
}

.sub-card-title {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 12px;
  color: #0f172a;
}

.sub-card-title span {
  color: #2563eb;
  font-weight: 700;
}

.address-line {
  margin: 0 0 12px;
  color: #334155;
  line-height: 1.6;
}

.document-table {
  overflow-x: auto;
}

.document-table table {
  width: 100%;
  border-collapse: collapse;
}

.document-table th,
.document-table td {
  padding: 12px;
  border: 1px solid #e2e8f0;
  text-align: left;
  font-size: 14px;
}

.document-table th {
  background: #f8fafc;
  color: #475569;
  text-transform: uppercase;
  font-size: 12px;
}

.doc-link {
  color: #2563eb;
  font-weight: 700;
  text-decoration: none;
}

.empty-text {
  padding: 18px;
  border-radius: 14px;
  background: #f8fafc;
  color: #64748b;
  text-align: center;
}

.signature-section {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 24px;
  margin-top: 55px;
  padding: 0 22px 22px;
}

.signature-section div {
  text-align: center;
}

.signature-section span {
  display: block;
  height: 1px;
  background: #0f172a;
  margin-bottom: 8px;
}

.signature-section p {
  margin: 0;
  color: #334155;
  font-weight: 700;
}

@media (max-width: 1100px) {
  .info-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 700px) {
  .profile-actions,
  .summary-section,
  .report-header {
    flex-direction: column;
  }

  .right-actions {
    width: 100%;
  }

  .info-grid,
  .info-grid.two-col,
  .signature-section {
    grid-template-columns: 1fr;
  }

  .student-photo {
    width: 100px;
    height: 115px;
  }
}

@media print {
  .no-print {
    display: none !important;
  }

  .student-profile-card {
    padding: 0 !important;
    box-shadow: none !important;
    border: none !important;
  }

  .profile-report {
    padding: 0;
  }

  .report-header,
  .summary-section,
  .report-section,
  .sub-card,
  .info-item {
    box-shadow: none !important;
    break-inside: avoid;
  }

  .report-section {
    page-break-inside: avoid;
  }

  .summary-section {
    background: #ffffff !important;
    color: #0f172a !important;
    border: 1px solid #0f172a;
  }

  .summary-section p,
  .status-box span {
    color: #334155 !important;
  }

  .status-box {
    background: #ffffff !important;
    border: 1px solid #0f172a;
  }

  a {
    color: #0f172a !important;
    text-decoration: none !important;
  }

  @page {
    size: A4;
    margin: 12mm;
  }
}
</style>