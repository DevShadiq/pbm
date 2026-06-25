<template>
  <BaseCard title="Student Admission" subtitle="Create full student profile with admission, guardian, address and academic info">
    <AlertMessage
      v-if="alert.message"
      :type="alert.type"
      :message="alert.message"
      @close="alert.message = ''"
    />

    <form @submit.prevent="submitAdmission" class="admission-form">
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

    <div>
      <input
        type="file"
        accept="image/*"
        @change="uploadStudentPhoto"
      />

      <p v-if="form.student.photo_url" class="upload-path">
        {{ form.student.photo_url }}
      </p>
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

  <input
    type="file"
    accept=".jpg,.jpeg,.png,.webp,.pdf,.doc,.docx"
    @change="uploadDocumentFile($event, index)"
  />

  <p v-if="doc.file_url" class="upload-path">
    <a :href="getFileUrl(doc.file_url)" target="_blank">
      View uploaded file
    </a>
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
        <BaseButton type="button" variant="secondary" @click="resetForm">
          Reset
        </BaseButton>

        <BaseButton type="submit" :loading="loading">
          Save Student Admission
        </BaseButton>
      </div>
    </form>
  </BaseCard>
</template>

<script setup>

import { reactive, ref, watch, onMounted } from "vue";
import api from "../../services/api";

import BaseCard from "../common/BaseCard.vue";
import BaseInput from "../common/BaseInput.vue";
import BaseSelect from "../common/BaseSelect.vue";
import BaseDatePicker from "../common/BaseDatePicker.vue";
import BaseButton from "../common/BaseButton.vue";
import AlertMessage from "../common/AlertMessage.vue";

const loading = ref(false);

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

const today = new Date().toISOString().slice(0, 10);

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
  document_type: "",
  document_title: "",
  file_url: "",
  status: "ACTIVE"
});

const defaultForm = () => ({
  student: {
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

// const mapOptions = (items, valueKey, labelKey) => {
//   return (items || []).map((item) => ({
//     value: item[valueKey],
//     label: item[labelKey]
//   }));
// };



// const getRows = (response) => {
//   const data = response?.data ?? response;

//   if (Array.isArray(data)) return data;
//   if (Array.isArray(data?.data)) return data.data;
//   if (Array.isArray(data?.rows)) return data.rows;
//   if (Array.isArray(data?.result)) return data.result;
//   if (Array.isArray(data?.items)) return data.items;

//   return [];
// };

// const mapOptions = (response, valueKey, labelKey) => {
//   const rows = getRows(response);

//   return rows.map((item) => ({
//     value: item[valueKey],
//     label: item[labelKey]
//   }));
// };


const getRows = (response) => {
  const data = response?.data ?? response;

  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.data)) return data.data;
  if (Array.isArray(data?.rows)) return data.rows;
  if (Array.isArray(data?.result)) return data.result;
  if (Array.isArray(data?.items)) return data.items;

  console.warn("Invalid response format:", data);
  return [];
};

const mapOptions = (response, valueKeys, labelKeys) => {
  const rows = getRows(response);

  return rows.map((item) => {
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
  }).filter((item) => item.value !== undefined && item.label !== undefined);
};



// const loadInstitutions = async () => {
//   const res = await api.get("/institutions");
//   institutions.value = mapOptions(res.data, "institution_id", "institution_name");
// };

const loadInstitutions = async () => {
  const res = await api.get("/institutions");

  console.log("Institutions response:", res.data);

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


// const loadAcademicYears = async () => {
//   if (!form.student.institution_id) return;

//   const res = await api.get("/academic-years", {
//     params: {
//       institution_id: form.student.institution_id
//     }
//   });

//   academicYears.value = mapOptions(res, "academic_year_id", "academic_year_name");
// };


const loadAcademicYears = async () => {
  if (!form.student.institution_id) return;

  const res = await api.get("/academic-years", {
    params: {
      institution_id: form.student.institution_id
    }
  });

  //console.log("Academic Years response:", res.data);

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

  console.log("Academic Years options:", academicYears.value);
};

const loadClassLevels = async () => {
  if (!form.student.institution_id) return;

  const res = await api.get("/class-levels", {
    params: {
      institution_id: form.student.institution_id
    }
  });

  classLevels.value = mapOptions(res, "class_id", "class_name");
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

watch(
  () => form.student.institution_id,
  async () => {
    form.admission.branch_id = "";
    form.admission.academic_year_id = "";
    form.enrollment.batch_id = "";
    form.enrollment.class_id = "";

    branches.value = [];
    academicYears.value = [];
    batches.value = [];
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
  }
);

watch(
  () => [form.admission.branch_id, form.admission.academic_year_id],
  async () => {
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
    form.enrollment.section_id = "";
    sections.value = [];
    await loadSections();
  }
);

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
  const present = form.addresses.find((item) => item.address_type === "PRESENT");
  const permanent = form.addresses.find((item) => item.address_type === "PERMANENT");

  if (!present || !permanent) return;

  Object.assign(permanent, {
    ...present,
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

const buildPayload = () => {
  return {
    student: {
      ...form.student
    },

    admission: {
      ...form.admission
    },

    enrollment: {
      ...form.enrollment,
      branch_id: form.admission.branch_id,
      academic_year_id: form.admission.academic_year_id
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

    documents: form.documents.filter((doc) => doc.document_type && doc.file_url)
  };
};


const getFileUrl = (fileUrl) => {
  if (!fileUrl) return "";

  if (fileUrl.startsWith("http")) {
    return fileUrl;
  }

  const baseURL = api.defaults.baseURL || "";

  return baseURL.replace("/api", "") + fileUrl;
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
    alert.message = "Student photo uploaded successfully";
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
    alert.message = "Document uploaded successfully";
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

const submitAdmission = async () => {
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

    await api.post("/student-admissions/full", payload);

    alert.type = "success";
    alert.message = "Student admission saved successfully";

    resetForm();
  } catch (err) {
    console.error("Admission save error:", err);

    alert.type = "error";
    alert.message =
      err?.response?.data?.message || "Failed to save student admission";
  } finally {
    loading.value = false;
  }
};

const resetForm = () => {
  Object.assign(form, defaultForm());
};

onMounted(async () => {
  try {
    await loadInstitutions();
  } catch (err) {
    console.error("Lookup load error:", err);
    alert.type = "error";
    alert.message = "Failed to load admission setup data";
  }
});
</script>

<style scoped>
.admission-form {
  display: flex;
  flex-direction: column;
  gap: 24px;
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
}

.photo-preview img {
  width: 100%;
  height: 100%;
  object-fit: cover;
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

.upload-path a {
  color: #2563eb;
  font-weight: 700;
  text-decoration: none;
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