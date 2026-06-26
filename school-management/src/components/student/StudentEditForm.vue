<template>
  <BaseCard
    title="Edit Student Admission"
    subtitle="Update student profile, admission, guardian, address and academic information"
  >
    <AlertMessage
      v-if="alert.message"
      :type="alert.type"
      :message="alert.message"
      @close="alert.message = ''"
    />

    <div v-if="pageLoading" class="loading-area">
      <LoadingSpinner />
      <p>Loading student information...</p>
    </div>

    <form v-else @submit.prevent="updateStudent" class="admission-form">
      <!-- ================= STUDENT BASIC INFO ================= -->
      <section class="form-section">
        <div class="section-header">
          <h3>Student Information</h3>
          <p>Basic identity and contact information</p>
        </div>

        <div class="form-grid">
          <BaseSelect
            v-model="form.student.institution_id"
            label="Institution"
            :options="institutions"
            placeholder="Select institution"
            required
          />

          <BaseInput
            v-model="form.student.student_no"
            label="Student No"
            placeholder="STU-0001"
            required
          />

          <BaseInput
            v-model="form.student.admission_no"
            label="Admission No"
            placeholder="ADM-0001"
          />

          <BaseInput
            v-model="form.student.registration_no"
            label="Registration No"
            placeholder="Registration no"
          />

          <BaseInput
            v-model="form.student.first_name"
            label="First Name"
            placeholder="Enter first name"
            required
          />

          <BaseInput
            v-model="form.student.last_name"
            label="Last Name"
            placeholder="Enter last name"
          />

          <BaseSelect
            v-model="form.student.gender"
            label="Gender"
            :options="genderOptions"
            placeholder="Select gender"
          />

          <BaseDatePicker
            v-model="form.student.date_of_birth"
            label="Date of Birth"
          />

          <BaseInput
            v-model="form.student.birth_certificate_no"
            label="Birth Certificate No"
            placeholder="Birth certificate no"
          />

          <BaseInput
            v-model="form.student.nid_no"
            label="NID No"
            placeholder="NID no"
          />

          <BaseSelect
            v-model="form.student.blood_group"
            label="Blood Group"
            :options="bloodGroups"
            placeholder="Select blood group"
          />

          <BaseInput
            v-model="form.student.religion"
            label="Religion"
            placeholder="Islam / Hindu / Christian"
          />

          <BaseInput
            v-model="form.student.nationality"
            label="Nationality"
            placeholder="Bangladeshi"
          />

          <BaseInput
            v-model="form.student.mobile"
            label="Mobile"
            placeholder="01XXXXXXXXX"
          />

          <BaseInput
            v-model="form.student.email"
            label="Email"
            type="email"
            placeholder="student@email.com"
          />

          <div class="upload-field">
  <label class="upload-label">Student Photo</label>

  <div class="photo-upload-box">
    <div class="photo-preview">
      <img
        v-if="form.student.photo_url"
        :src="getFileUrl(form.student.photo_url)"
        alt="Student photo"
      />
      <span v-else>No Photo</span>
    </div>

    <div class="upload-actions">
      <input
        type="file"
        accept="image/*"
        @change="uploadStudentPhoto"
      />

      <p v-if="form.student.photo_url" class="upload-path">
        {{ form.student.photo_url }}
      </p>

      <button
        v-if="form.student.photo_url"
        type="button"
        class="clear-file-btn"
        @click="clearStudentPhoto"
      >
        Remove Photo
      </button>
    </div>
  </div>
</div>

          <BaseSelect
            v-model="form.student.status"
            label="Status"
            :options="studentStatusOptions"
            placeholder="Select status"
          />
        </div>
      </section>

      <!-- ================= ADMISSION INFO ================= -->
      <section class="form-section">
        <div class="section-header">
          <h3>Admission Information</h3>
          <p>Admission date, branch and previous institute</p>
        </div>

        <div class="form-grid">
          <BaseSelect
            v-model="form.admission.branch_id"
            label="Branch"
            :options="branches"
            placeholder="Select branch"
            required
          />

          <BaseSelect
            v-model="form.admission.academic_year_id"
            label="Academic Year"
            :options="academicYears"
            placeholder="Select academic year"
            required
          />

          <BaseDatePicker
            v-model="form.admission.admission_date"
            label="Admission Date"
            required
          />

          <BaseSelect
            v-model="form.admission.admission_type"
            label="Admission Type"
            :options="admissionTypes"
            placeholder="Select admission type"
          />

          <BaseInput
            v-model="form.admission.previous_institute"
            label="Previous Institute"
            placeholder="Previous school / college"
          />

          <BaseInput
            v-model="form.admission.previous_class"
            label="Previous Class"
            placeholder="Previous class"
          />

          <BaseSelect
            v-model="form.admission.approval_status"
            label="Approval Status"
            :options="approvalStatusOptions"
          />

          <BaseInput
            v-model="form.admission.remarks"
            label="Remarks"
            placeholder="Admission remarks"
          />
        </div>
      </section>

      <!-- ================= ACADEMIC ENROLLMENT ================= -->
      <section class="form-section">
        <div class="section-header">
          <h3>Academic Enrollment</h3>
          <p>Class, batch, section, medium, shift and roll</p>
        </div>

        <div class="form-grid">
          <BaseSelect
            v-model="form.enrollment.batch_id"
            label="Batch"
            :options="batches"
            placeholder="Select batch"
            required
          />

          <BaseInput
            v-model="form.enrollment.roll_no"
            label="Roll No"
            placeholder="Roll no"
          />

          <BaseSelect
            v-model="form.enrollment.class_id"
            label="Class"
            :options="classLevels"
            placeholder="Select class"
            required
          />

          <BaseSelect
            v-model="form.enrollment.group_id"
            label="Group"
            :options="groups"
            placeholder="Select group"
          />

          <BaseSelect
            v-model="form.enrollment.section_id"
            label="Section"
            :options="sections"
            placeholder="Select section"
          />

          <BaseSelect
            v-model="form.enrollment.medium_id"
            label="Medium"
            :options="mediums"
            placeholder="Select medium"
          />

          <BaseSelect
            v-model="form.enrollment.shift_id"
            label="Shift"
            :options="shifts"
            placeholder="Select shift"
          />

          <BaseSelect
            v-model="form.enrollment.enrollment_status"
            label="Enrollment Status"
            :options="enrollmentStatusOptions"
          />

          <BaseDatePicker
            v-model="form.enrollment.start_date"
            label="Start Date"
          />

          <BaseDatePicker
            v-model="form.enrollment.end_date"
            label="End Date"
          />
        </div>
      </section>

      <!-- ================= GUARDIAN INFO ================= -->
      <section class="form-section">
        <div class="section-header with-action">
          <div>
            <h3>Guardian Information</h3>
            <p>Father, mother or local guardian information</p>
          </div>

          <BaseButton type="button" variant="secondary" @click="addGuardian">
            + Add Guardian
          </BaseButton>
        </div>

        <div
          v-for="(item, index) in form.guardians"
          :key="index"
          class="repeat-card"
        >
          <div class="repeat-header">
            <h4>Guardian {{ index + 1 }}</h4>

            <button
              v-if="form.guardians.length > 1"
              type="button"
              class="remove-btn"
              @click="removeGuardian(index)"
            >
              Remove
            </button>
          </div>

          <div class="form-grid">
            <BaseSelect
              v-model="item.relation_type"
              label="Relation Type"
              :options="relationTypeOptions"
              placeholder="Select relation"
              required
            />

            <BaseInput
              v-model="item.guardian.guardian_name"
              label="Guardian Name"
              placeholder="Guardian full name"
              required
            />

            <BaseInput
              v-model="item.guardian.relation_name"
              label="Relation Name"
              placeholder="Father / Mother / Uncle"
            />

            <BaseInput
              v-model="item.guardian.occupation"
              label="Occupation"
              placeholder="Occupation"
            />

            <BaseInput
              v-model="item.guardian.nid_no"
              label="Guardian NID"
              placeholder="NID no"
            />

            <BaseInput
              v-model="item.guardian.mobile"
              label="Mobile"
              placeholder="01XXXXXXXXX"
            />

            <BaseInput
              v-model="item.guardian.alternate_mobile"
              label="Alternate Mobile"
              placeholder="01XXXXXXXXX"
            />

            <BaseInput
              v-model="item.guardian.email"
              label="Email"
              type="email"
              placeholder="guardian@email.com"
            />

            <BaseInput
              v-model="item.guardian.monthly_income"
              label="Monthly Income"
              type="number"
              placeholder="Monthly income"
            />

            <BaseInput
              v-model="item.guardian.address_line"
              label="Address"
              placeholder="Guardian address"
            />

            <BaseInput
              v-model="item.guardian.photo_url"
              label="Photo URL"
              placeholder="/uploads/guardians/photo.jpg"
            />

            <BaseSelect
              v-model="item.guardian.status"
              label="Guardian Status"
              :options="activeStatusOptions"
            />
          </div>

          <div class="checkbox-row">
            <label>
              <input v-model="item.is_primary" type="checkbox" />
              Primary Guardian
            </label>

            <label>
              <input v-model="item.is_emergency_contact" type="checkbox" />
              Emergency Contact
            </label>
          </div>
        </div>
      </section>

      <!-- ================= ADDRESS INFO ================= -->
      <section class="form-section">
        <div class="section-header">
          <h3>Student Address</h3>
          <p>Present and permanent address</p>
        </div>

        <div
          v-for="(address, index) in form.addresses"
          :key="address.address_type"
          class="repeat-card"
        >
          <div class="repeat-header">
            <h4>{{ address.address_type }} Address</h4>
          </div>

          <div class="form-grid">
            <BaseInput
              v-model="address.village_road"
              label="Village / Road"
              placeholder="Village or road"
            />

            <BaseInput
              v-model="address.post_office"
              label="Post Office"
              placeholder="Post office"
            />

            <BaseInput
              v-model="address.thana_upazila"
              label="Thana / Upazila"
              placeholder="Thana / Upazila"
            />

            <BaseInput
              v-model="address.district"
              label="District"
              placeholder="District"
            />

            <BaseInput
              v-model="address.division"
              label="Division"
              placeholder="Division"
            />

            <BaseInput
              v-model="address.postal_code"
              label="Postal Code"
              placeholder="Postal code"
            />

            <BaseInput
              v-model="address.country"
              label="Country"
              placeholder="Bangladesh"
            />
          </div>

          <button
            v-if="index === 0"
            type="button"
            class="copy-btn"
            @click="copyPresentToPermanent"
          >
            Copy Present Address to Permanent
          </button>
        </div>
      </section>

      <!-- ================= DOCUMENTS ================= -->
      <section class="form-section">
        <div class="section-header with-action">
          <div>
            <h3>Documents</h3>
            <p>Birth certificate, photo, TC, marksheet etc.</p>
          </div>

          <BaseButton type="button" variant="secondary" @click="addDocument">
            + Add Document
          </BaseButton>
        </div>

        <div
          v-for="(doc, index) in form.documents"
          :key="index"
          class="repeat-card"
        >
          <div class="repeat-header">
            <h4>Document {{ index + 1 }}</h4>

            <button
              type="button"
              class="remove-btn"
              @click="removeDocument(index)"
            >
              Remove
            </button>
          </div>

          <div class="form-grid">
            <BaseSelect
              v-model="doc.document_type"
              label="Document Type"
              :options="documentTypeOptions"
              placeholder="Select document type"
            />

            <BaseInput
              v-model="doc.document_title"
              label="Document Title"
              placeholder="Document title"
            />

          <div class="upload-field">
  <label class="upload-label">Document File</label>

  <div v-if="doc.file_url" class="existing-file-box">
    <a :href="getFileUrl(doc.file_url)" target="_blank">
      View Existing File
    </a>

    <button
      type="button"
      class="clear-file-btn"
      @click="clearDocumentFile(index)"
    >
      Remove File
    </button>
  </div>

  <input
    type="file"
    accept=".jpg,.jpeg,.png,.webp,.pdf,.doc,.docx"
    @change="uploadDocumentFile($event, index)"
  />

  <p v-if="doc.file_url" class="upload-path">
    {{ doc.file_url }}
  </p>
</div>
            <BaseSelect
              v-model="doc.status"
              label="Status"
              :options="activeStatusOptions"
            />
          </div>
        </div>
      </section>

      <!-- ================= ACTIONS ================= -->
      <div class="form-actions">
        <BaseButton type="button" variant="secondary" @click="goBack">
          Back
        </BaseButton>

        <BaseButton type="submit" :loading="loading">
          Update Student Admission
        </BaseButton>
      </div>
    </form>
  </BaseCard>
</template>

<script setup>
import { reactive, ref, watch, onMounted } from "vue";
import { useRoute, useRouter } from "vue-router";
import api, { getFileUrl } from "../../services/api";

import BaseCard from "../common/BaseCard.vue";
import BaseInput from "../common/BaseInput.vue";
import BaseSelect from "../common/BaseSelect.vue";
import BaseDatePicker from "../common/BaseDatePicker.vue";
import BaseButton from "../common/BaseButton.vue";
import AlertMessage from "../common/AlertMessage.vue";
import LoadingSpinner from "../common/LoadingSpinner.vue";
import { getTodayIsoDate, toIsoDate } from "../../utils/dateFormat";

const route = useRoute();
const router = useRouter();

const studentId = route.params.id;

const loading = ref(false);
const pageLoading = ref(false);
const isFillingEditData = ref(false);

const alert = reactive({
  type: "success",
  message: ""
});

const institutions = ref([]);
const branches = ref([]);
const academicYears = ref([]);
const batches = ref([]);
const classLevels = ref([]);
const groups = ref([]);
const sections = ref([]);
const mediums = ref([]);
const shifts = ref([]);

const today = getTodayIsoDate();

const genderOptions = [
  { label: "Male", value: "MALE" },
  { label: "Female", value: "FEMALE" },
  { label: "Other", value: "OTHER" }
];

const bloodGroups = [
  { label: "A+", value: "A+" },
  { label: "A-", value: "A-" },
  { label: "B+", value: "B+" },
  { label: "B-", value: "B-" },
  { label: "AB+", value: "AB+" },
  { label: "AB-", value: "AB-" },
  { label: "O+", value: "O+" },
  { label: "O-", value: "O-" }
];

const studentStatusOptions = [
  { label: "Active", value: "ACTIVE" },
  { label: "Inactive", value: "INACTIVE" },
  { label: "TC", value: "TC" },
  { label: "Graduated", value: "GRADUATED" },
  { label: "Dropout", value: "DROPOUT" }
];

const activeStatusOptions = [
  { label: "Active", value: "ACTIVE" },
  { label: "Inactive", value: "INACTIVE" }
];

const admissionTypes = [
  { label: "New", value: "NEW" },
  { label: "Transfer", value: "TRANSFER" },
  { label: "Re Admission", value: "RE_ADMISSION" }
];

const approvalStatusOptions = [
  { label: "Pending", value: "PENDING" },
  { label: "Approved", value: "APPROVED" },
  { label: "Rejected", value: "REJECTED" }
];

const enrollmentStatusOptions = [
  { label: "Active", value: "ACTIVE" },
  { label: "Promoted", value: "PROMOTED" },
  { label: "Transferred", value: "TRANSFERRED" },
  { label: "Dropped", value: "DROPPED" }
];

const relationTypeOptions = [
  { label: "Father", value: "FATHER" },
  { label: "Mother", value: "MOTHER" },
  { label: "Local Guardian", value: "LOCAL_GUARDIAN" }
];

const documentTypeOptions = [
  { label: "Birth Certificate", value: "Birth Certificate" },
  { label: "Photo", value: "Photo" },
  { label: "Transfer Certificate", value: "TC" },
  { label: "Marksheet", value: "Marksheet" },
  { label: "NID", value: "NID" },
  { label: "Other", value: "Other" }
];

const emptyGuardian = () => ({
  relation_type: "FATHER",
  is_primary: false,
  is_emergency_contact: false,
  guardian: {
    guardian_id: null,
    guardian_name: "",
    relation_name: "",
    occupation: "",
    nid_no: "",
    mobile: "",
    alternate_mobile: "",
    email: "",
    monthly_income: "",
    address_line: "",
    photo_url: "",
    status: "ACTIVE"
  }
});

const emptyDocument = () => ({
  document_id: null,
  document_type: "",
  document_title: "",
  file_url: "",
  status: "ACTIVE"
});

const defaultForm = () => ({
  student: {
    student_id: studentId,
    institution_id: "",
    student_no: "",
    admission_no: "",
    registration_no: "",
    first_name: "",
    last_name: "",
    gender: "",
    date_of_birth: "",
    birth_certificate_no: "",
    nid_no: "",
    blood_group: "",
    religion: "",
    nationality: "Bangladeshi",
    photo_url: "",
    mobile: "",
    email: "",
    status: "ACTIVE"
  },

  admission: {
    admission_id: null,
    branch_id: "",
    academic_year_id: "",
    admission_date: today,
    admission_type: "NEW",
    previous_institute: "",
    previous_class: "",
    approval_status: "PENDING",
    remarks: ""
  },

  enrollment: {
    enrollment_id: null,
    branch_id: "",
    academic_year_id: "",
    batch_id: "",
    roll_no: "",
    class_id: "",
    group_id: "",
    section_id: "",
    medium_id: "",
    shift_id: "",
    enrollment_status: "ACTIVE",
    start_date: today,
    end_date: ""
  },

  guardians: [emptyGuardian()],

  addresses: [
    {
      address_id: null,
      address_type: "PRESENT",
      village_road: "",
      post_office: "",
      thana_upazila: "",
      district: "",
      division: "",
      postal_code: "",
      country: "Bangladesh"
    },
    {
      address_id: null,
      address_type: "PERMANENT",
      village_road: "",
      post_office: "",
      thana_upazila: "",
      district: "",
      division: "",
      postal_code: "",
      country: "Bangladesh"
    }
  ],

  documents: []
});

const form = reactive(defaultForm());

const getRows = (response) => {
  const data = response?.data ?? response;

  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.data)) return data.data;
  if (Array.isArray(data?.rows)) return data.rows;
  if (Array.isArray(data?.result)) return data.result;
  if (Array.isArray(data?.items)) return data.items;

  return [];
};

const mapOptions = (response, valueKeys, labelKeys) => {
  const rows = getRows(response);

  return rows
    .map((item) => {
      const valueKey = Array.isArray(valueKeys)
        ? valueKeys.find((key) => item[key] !== undefined)
        : valueKeys;

      const labelKey = Array.isArray(labelKeys)
        ? labelKeys.find((key) => item[key] !== undefined)
        : labelKeys;

      return {
        value: item[valueKey],
        label: item[labelKey]
      };
    })
    .filter((item) => item.value !== undefined && item.label !== undefined);
};

const normalizeDate = (value) => {
  return toIsoDate(value);
};

const loadInstitutions = async () => {
  const res = await api.get("/institutions");
  institutions.value = mapOptions(res, "institution_id", "institution_name");
};

const loadBranches = async () => {
  if (!form.student.institution_id) return;

  const res = await api.get("/branches", {
    params: {
      institution_id: form.student.institution_id
    }
  });

  branches.value = mapOptions(res, "branch_id", "branch_name");
};

const loadAcademicYears = async () => {
  if (!form.student.institution_id) return;

  const res = await api.get("/academic-years", {
    params: {
      institution_id: form.student.institution_id
    }
  });

  academicYears.value = mapOptions(
    res,
    ["academic_year_id", "year_id", "id"],
    [
      "academic_year_name",
      "year_name",
      "academic_year",
      "session_name",
      "name",
      "title"
    ]
  );
};

const loadClassLevels = async () => {
  if (!form.student.institution_id) return;

  const res = await api.get("/class-levels", {
    params: {
      institution_id: form.student.institution_id
    }
  });

  classLevels.value = mapOptions(
    res,
    ["class_id", "class_level_id", "id"],
    ["class_name", "class_level_name", "name"]
  );
};

const loadGroups = async () => {
  if (!form.student.institution_id) return;

  const res = await api.get("/groups", {
    params: {
      institution_id: form.student.institution_id
    }
  });

  groups.value = mapOptions(res, "group_id", "group_name");
};

const loadMediums = async () => {
  if (!form.student.institution_id) return;

  const res = await api.get("/mediums", {
    params: {
      institution_id: form.student.institution_id
    }
  });

  mediums.value = mapOptions(res, "medium_id", "medium_name");
};

const loadShifts = async () => {
  if (!form.student.institution_id) return;

  const res = await api.get("/shifts", {
    params: {
      institution_id: form.student.institution_id
    }
  });

  shifts.value = mapOptions(res, "shift_id", "shift_name");
};

const loadBatches = async () => {
  if (!form.admission.branch_id || !form.admission.academic_year_id) return;

  const res = await api.get("/academic-batches", {
    params: {
      branch_id: form.admission.branch_id,
      academic_year_id: form.admission.academic_year_id
    }
  });

  batches.value = mapOptions(res, "batch_id", "batch_name");
};

const loadSections = async () => {
  if (!form.enrollment.class_id) return;

  const res = await api.get("/sections", {
    params: {
      class_id: form.enrollment.class_id
    }
  });

  sections.value = mapOptions(res, "section_id", "section_name");
};

const loadInstitutionBasedLookups = async () => {
  branches.value = [];
  academicYears.value = [];
  classLevels.value = [];
  groups.value = [];
  mediums.value = [];
  shifts.value = [];

  await Promise.all([
    loadBranches(),
    loadAcademicYears(),
    loadClassLevels(),
    loadGroups(),
    loadMediums(),
    loadShifts()
  ]);
};

watch(
  () => form.student.institution_id,
  async () => {
    if (isFillingEditData.value) return;

    form.admission.branch_id = "";
    form.admission.academic_year_id = "";
    form.enrollment.branch_id = "";
    form.enrollment.academic_year_id = "";
    form.enrollment.batch_id = "";
    form.enrollment.class_id = "";
    form.enrollment.section_id = "";

    batches.value = [];
    sections.value = [];

    await loadInstitutionBasedLookups();
  }
);

watch(
  () => [form.admission.branch_id, form.admission.academic_year_id],
  async () => {
    if (isFillingEditData.value) return;

    form.enrollment.branch_id = form.admission.branch_id;
    form.enrollment.academic_year_id = form.admission.academic_year_id;
    form.enrollment.batch_id = "";

    batches.value = [];
    await loadBatches();
  }
);

watch(
  () => form.enrollment.class_id,
  async () => {
    if (isFillingEditData.value) return;

    form.enrollment.section_id = "";
    sections.value = [];
    await loadSections();
  }
);

const loadStudentForEdit = async () => {
  pageLoading.value = true;
  isFillingEditData.value = true;
  alert.message = "";

  try {
    const res = await api.get(`/student-admissions/full/${studentId}`);

    console.log("Edit student response:", res.data);

    const data = res.data?.data || res.data;

    const student = data.student || {};
    const admission = data.admission || {};
    const enrollment = data.enrollment || {};
    const guardians = Array.isArray(data.guardians) ? data.guardians : [];
    const addresses = Array.isArray(data.addresses) ? data.addresses : [];
    const documents = Array.isArray(data.documents) ? data.documents : [];

    Object.assign(form.student, {
      student_id: student.student_id ?? studentId,
      institution_id: student.institution_id ?? "",
      student_no: student.student_no ?? "",
      admission_no: student.admission_no ?? "",
      registration_no: student.registration_no ?? "",
      first_name: student.first_name ?? "",
      last_name: student.last_name ?? "",
      gender: student.gender ?? "",
      date_of_birth: normalizeDate(student.date_of_birth),
      birth_certificate_no: student.birth_certificate_no ?? "",
      nid_no: student.nid_no ?? "",
      blood_group: student.blood_group ?? "",
      religion: student.religion ?? "",
      nationality: student.nationality ?? "Bangladeshi",
     // photo_url: student.photo_url ?? "",
      photo_url: student.photo_url ?? "",
      mobile: student.mobile ?? "",
      email: student.email ?? "",
      status: student.status ?? "ACTIVE"
    });

    await loadInstitutionBasedLookups();

    Object.assign(form.admission, {
      admission_id: admission.admission_id ?? null,
      branch_id: admission.branch_id ?? "",
      academic_year_id: admission.academic_year_id ?? "",
      admission_date: normalizeDate(admission.admission_date) || today,
      admission_type: admission.admission_type ?? "NEW",
      previous_institute: admission.previous_institute ?? "",
      previous_class: admission.previous_class ?? "",
      approval_status: admission.approval_status ?? "PENDING",
      remarks: admission.remarks ?? ""
    });

    Object.assign(form.enrollment, {
      enrollment_id: enrollment.enrollment_id ?? null,
      branch_id: enrollment.branch_id ?? admission.branch_id ?? "",
      academic_year_id:
        enrollment.academic_year_id ?? admission.academic_year_id ?? "",
      batch_id: enrollment.batch_id ?? "",
      roll_no: enrollment.roll_no ?? "",
      class_id: enrollment.class_id ?? "",
      group_id: enrollment.group_id ?? "",
      section_id: enrollment.section_id ?? "",
      medium_id: enrollment.medium_id ?? "",
      shift_id: enrollment.shift_id ?? "",
      enrollment_status: enrollment.enrollment_status ?? "ACTIVE",
      start_date: normalizeDate(enrollment.start_date) || today,
      end_date: normalizeDate(enrollment.end_date)
    });

    await loadBatches();
    await loadSections();

    form.guardians.splice(
      0,
      form.guardians.length,
      ...(guardians.length
        ? guardians.map((item) => ({
            relation_type: item.relation_type ?? "FATHER",
            is_primary: !!item.is_primary,
            is_emergency_contact: !!item.is_emergency_contact,
            guardian: {
              guardian_id: item.guardian?.guardian_id ?? item.guardian_id ?? null,
              guardian_name:
                item.guardian?.guardian_name ?? item.guardian_name ?? "",
              relation_name:
                item.guardian?.relation_name ?? item.relation_name ?? "",
              occupation: item.guardian?.occupation ?? item.occupation ?? "",
              nid_no: item.guardian?.nid_no ?? item.nid_no ?? "",
              mobile: item.guardian?.mobile ?? item.mobile ?? "",
              alternate_mobile:
                item.guardian?.alternate_mobile ??
                item.alternate_mobile ??
                "",
              email: item.guardian?.email ?? item.email ?? "",
              monthly_income:
                item.guardian?.monthly_income ?? item.monthly_income ?? "",
              address_line:
                item.guardian?.address_line ?? item.address_line ?? "",
              photo_url: item.guardian?.photo_url ?? item.photo_url ?? "",
              status: item.guardian?.status ?? item.status ?? "ACTIVE"
            }
          }))
        : [emptyGuardian()])
    );

    form.addresses.splice(
      0,
      form.addresses.length,
      ...(addresses.length
        ? addresses.map((address) => ({
            address_id: address.address_id ?? null,
            address_type: address.address_type ?? "PRESENT",
            village_road: address.village_road ?? "",
            post_office: address.post_office ?? "",
            thana_upazila: address.thana_upazila ?? "",
            district: address.district ?? "",
            division: address.division ?? "",
            postal_code: address.postal_code ?? "",
            country: address.country ?? "Bangladesh"
          }))
        : defaultForm().addresses)
    );

    form.documents.splice(
      0,
      form.documents.length,
      ...documents.map((doc) => ({
        document_id: doc.document_id ?? null,
        document_type: doc.document_type ?? "",
        document_title: doc.document_title ?? "",
       // file_url: doc.file_url ?? "",
        file_url: doc.file_url ?? "",
        status: doc.status ?? "ACTIVE"
      }))
    );
  } catch (err) {
    console.error("Student edit load error:", err);

    alert.type = "error";
    alert.message =
      err?.response?.data?.message || "Failed to load student edit data";
  } finally {
    isFillingEditData.value = false;
    pageLoading.value = false;
  }
};

const addGuardian = () => {
  form.guardians.push(emptyGuardian());
};

const removeGuardian = (index) => {
  form.guardians.splice(index, 1);
};

const addDocument = () => {
  form.documents.push(emptyDocument());
};

const removeDocument = (index) => {
  form.documents.splice(index, 1);
};

const copyPresentToPermanent = () => {
  const present = form.addresses.find(
    (item) => item.address_type === "PRESENT"
  );

  const permanent = form.addresses.find(
    (item) => item.address_type === "PERMANENT"
  );

  if (!present || !permanent) return;

  Object.assign(permanent, {
    ...present,
    address_id: permanent.address_id,
    address_type: "PERMANENT"
  });
};

const validateForm = () => {
  if (!form.student.institution_id) return "Institution is required";
  if (!form.student.student_no) return "Student No is required";
  if (!form.student.first_name) return "First Name is required";
  if (!form.admission.branch_id) return "Branch is required";
  if (!form.admission.academic_year_id) return "Academic Year is required";
  if (!form.enrollment.batch_id) return "Batch is required";
  if (!form.enrollment.class_id) return "Class is required";

  const hasGuardian = form.guardians.some(
    (item) => item.guardian.guardian_name && item.relation_type
  );

  if (!hasGuardian) return "At least one guardian is required";

  return "";
};

// const buildPayload = () => {
//   return {
//     student: {
//       ...form.student,
//       student_id: studentId
//     },

//     admission: {
//       ...form.admission
//     },

//     enrollment: {
//       ...form.enrollment,
//       branch_id: form.admission.branch_id,
//       academic_year_id: form.admission.academic_year_id
//     },

//     guardians: form.guardians.map((item) => ({
//       relation_type: item.relation_type,
//       is_primary: item.is_primary,
//       is_emergency_contact: item.is_emergency_contact,
//       guardian: {
//         ...item.guardian,
//         institution_id: form.student.institution_id
//       }
//     })),

//     addresses: form.addresses,

//     documents: form.documents.filter(
//       (doc) => doc.document_type || doc.document_title || doc.file_url
//     )
//   };
// };
const buildPayload = () => {
  return {
    student: {
      ...form.student,
      student_id: studentId,
      date_of_birth: toIsoDate(form.student.date_of_birth) || null
    },

    admission: {
      ...form.admission,
      admission_date: toIsoDate(form.admission.admission_date) || null
    },

    enrollment: {
      ...form.enrollment,
      branch_id: form.admission.branch_id,
      academic_year_id: form.admission.academic_year_id,
      start_date: toIsoDate(form.enrollment.start_date) || null,
      end_date: toIsoDate(form.enrollment.end_date) || null
    },

    guardians: form.guardians.map((item) => ({
      relation_type: item.relation_type,
      is_primary: item.is_primary,
      is_emergency_contact: item.is_emergency_contact,
      guardian: {
        ...item.guardian,
        institution_id: form.student.institution_id
      }
    })),

    addresses: form.addresses,

    documents: form.documents.filter(
      (doc) => doc.document_type || doc.document_title || doc.file_url
    )
  };
};

const uploadFile = async (file, type) => {
  const formData = new FormData();
  formData.append("file", file);

  const res = await api.post(`/student-admissions/upload/${type}`, formData, {
    headers: {
      "Content-Type": "multipart/form-data"
    }
  });

  return res.data?.data?.file_url;
};

const uploadStudentPhoto = async (event) => {
  const file = event.target.files?.[0];

  if (!file) return;

  try {
    loading.value = true;
    alert.message = "";

    const fileUrl = await uploadFile(file, "student-photo");

    form.student.photo_url = fileUrl;

    alert.type = "success";
    alert.message = "Student photo updated successfully";
  } catch (err) {
    console.error("Student photo upload error:", err);

    alert.type = "error";
    alert.message =
      err?.response?.data?.message || "Failed to upload student photo";
  } finally {
    loading.value = false;
    event.target.value = "";
  }
};

const uploadDocumentFile = async (event, index) => {
  const file = event.target.files?.[0];

  if (!file) return;

  try {
    loading.value = true;
    alert.message = "";

    const fileUrl = await uploadFile(file, "document");

    form.documents[index].file_url = fileUrl;

    if (!form.documents[index].document_title) {
      form.documents[index].document_title = file.name;
    }

    alert.type = "success";
    alert.message = "Document file updated successfully";
  } catch (err) {
    console.error("Document upload error:", err);

    alert.type = "error";
    alert.message =
      err?.response?.data?.message || "Failed to upload document";
  } finally {
    loading.value = false;
    event.target.value = "";
  }
};

const clearStudentPhoto = () => {
  form.student.photo_url = "";
};

const clearDocumentFile = (index) => {
  form.documents[index].file_url = "";
};

const updateStudent = async () => {
  const error = validateForm();

  if (error) {
    alert.type = "error";
    alert.message = error;
    return;
  }

  loading.value = true;
  alert.message = "";

  try {
    const payload = buildPayload();

    await api.put(`/student-admissions/full/${studentId}`, payload);

    alert.type = "success";
    alert.message = "Student admission updated successfully";

    setTimeout(() => {
      router.push("/students");
    }, 700);
  } catch (err) {
    console.error("Student update error:", err);

    alert.type = "error";
    alert.message =
      err?.response?.data?.message || "Failed to update student admission";
  } finally {
    loading.value = false;
  }
};

const goBack = () => {
  router.push("/students");
};

onMounted(async () => {
  if (!studentId) {
    alert.type = "error";
    alert.message = "Student ID not found in route";
    return;
  }

  try {
    await loadInstitutions();
    await loadStudentForEdit();
  } catch (err) {
    console.error("Edit page load error:", err);

    alert.type = "error";
    alert.message = "Failed to open student edit page";
  }
});
</script>

<style scoped>

.upload-field {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.upload-label {
  font-size: 13px;
  font-weight: 700;
  color: #334155;
}

.photo-upload-box {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 12px;
  border: 1px solid #e2e8f0;
  border-radius: 14px;
  background: #f8fafc;
}

.photo-preview {
  width: 90px;
  height: 105px;
  display: grid;
  place-items: center;
  border-radius: 12px;
  overflow: hidden;
  background: #e2e8f0;
  color: #64748b;
  font-size: 12px;
  font-weight: 700;
  flex-shrink: 0;
}

.photo-preview img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.upload-actions {
  flex: 1;
}

.upload-field input[type="file"] {
  width: 100%;
  padding: 10px;
  border: 1px dashed #94a3b8;
  border-radius: 12px;
  background: #ffffff;
  color: #334155;
}

.upload-path {
  margin: 6px 0 0;
  font-size: 12px;
  color: #64748b;
  word-break: break-all;
}

.existing-file-box {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 10px 12px;
  border-radius: 12px;
  background: #eff6ff;
  border: 1px solid #bfdbfe;
}

.existing-file-box a {
  color: #2563eb;
  font-weight: 700;
  text-decoration: none;
}

.clear-file-btn {
  border: none;
  background: #fee2e2;
  color: #dc2626;
  padding: 7px 10px;
  border-radius: 10px;
  font-size: 12px;
  font-weight: 700;
  cursor: pointer;
}

.admission-form {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.loading-area {
  min-height: 220px;
  display: grid;
  place-items: center;
  gap: 12px;
  color: #64748b;
}

.form-section {
  background: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: 18px;
  padding: 22px;
  box-shadow: 0 10px 30px rgba(15, 23, 42, 0.04);
}

.section-header {
  margin-bottom: 18px;
  border-bottom: 1px solid #eef2f7;
  padding-bottom: 14px;
}

.section-header h3 {
  margin: 0;
  font-size: 18px;
  font-weight: 700;
  color: #0f172a;
}

.section-header p {
  margin: 4px 0 0;
  color: #64748b;
  font-size: 14px;
}

.with-action {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 16px;
}

.repeat-card {
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 16px;
  padding: 18px;
  margin-bottom: 16px;
}

.repeat-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 14px;
}

.repeat-header h4 {
  margin: 0;
  color: #1e293b;
  font-size: 15px;
  font-weight: 700;
}

.checkbox-row {
  display: flex;
  gap: 24px;
  margin-top: 16px;
  color: #334155;
  font-size: 14px;
}

.checkbox-row label {
  display: flex;
  align-items: center;
  gap: 8px;
}

.remove-btn,
.copy-btn {
  border: none;
  background: transparent;
  color: #dc2626;
  font-weight: 600;
  cursor: pointer;
}

.copy-btn {
  color: #2563eb;
  margin-top: 12px;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding-top: 8px;
}

@media (max-width: 1100px) {
  .form-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 700px) {
  .form-grid {
    grid-template-columns: 1fr;
  }

  .with-action {
    align-items: flex-start;
    flex-direction: column;
  }

  .form-actions {
    flex-direction: column;
  }
}
</style>
