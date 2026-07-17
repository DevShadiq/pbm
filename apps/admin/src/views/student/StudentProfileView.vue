<template>
  <div>
    <AlertMessage
      v-if="alert.message"
      :type="alert.type"
      :message="alert.message"
      @close="alert.message = ''"
    />

    <div v-if="loading" class="page-loading">
      <LoadingSpinner />
      <p>Loading student profile...</p>
    </div>

    <StudentProfile
      v-else-if="profile"
      :profile="profile"
      @back="goBack"
      @edit="editStudent"
      @print="printProfile"
    />

    <BaseCard v-else class="not-found-card">
      <h3>Student profile not found</h3>
      <p>No student data found for this ID.</p>

      <BaseButton type="button" @click="goBack">
        Back to Student List
      </BaseButton>
    </BaseCard>
  </div>
</template>

<script setup>
import { onMounted, ref } from "vue";
import { useRoute, useRouter } from "vue-router";

import api from "../../services/api";

import StudentProfile from "../../components/student/StudentProfile.vue";
import BaseCard from "../../components/common/BaseCard.vue";
import BaseButton from "../../components/common/BaseButton.vue";
import AlertMessage from "../../components/common/AlertMessage.vue";
import LoadingSpinner from "../../components/common/LoadingSpinner.vue";

const route = useRoute();
const router = useRouter();

const studentId = route.params.id;

const loading = ref(false);
const profile = ref(null);

const alert = ref({
  type: "success",
  message: ""
});

onMounted(() => {
  loadStudentProfile();
});

async function loadStudentProfile() {
  if (!studentId) {
    alert.value = {
      type: "error",
      message: "Student ID not found in route"
    };
    return;
  }

  loading.value = true;
  alert.value.message = "";

  try {
    const res = await api.get(`/student-admissions/full/${studentId}`);

    console.log("Student profile response:", res.data);

    const data = res.data?.data || res.data;

    profile.value = normalizeProfile(data);
  } catch (error) {
    console.error("Student profile load error:", error);

    alert.value = {
      type: "error",
      message:
        error?.response?.data?.message || "Failed to load student profile"
    };

    profile.value = null;
  } finally {
    loading.value = false;
  }
}

function normalizeProfile(data) {
  if (!data) return null;

  return {
    student: data.student || {
      student_id: data.student_id,
      institution_id: data.institution_id,
      institution_name: data.institution_name,
      student_no: data.student_no,
      admission_no: data.admission_no,
      registration_no: data.registration_no,
      first_name: data.first_name,
      last_name: data.last_name,
      gender: data.gender,
      date_of_birth: data.date_of_birth,
      birth_certificate_no: data.birth_certificate_no,
      nid_no: data.nid_no,
      blood_group: data.blood_group,
      religion: data.religion,
      nationality: data.nationality,
      photo_url: data.photo_url,
      mobile: data.mobile,
      email: data.email,
      status: data.status
    },

    admission: data.admission || {
      admission_id: data.admission_id,
      branch_id: data.branch_id,
      branch_name: data.branch_name,
      academic_year_id: data.academic_year_id,
      academic_year_name: data.academic_year_name,
      admission_date: data.admission_date,
      admission_type: data.admission_type,
      previous_institute: data.previous_institute,
      previous_class: data.previous_class,
      approval_status: data.approval_status,
      remarks: data.remarks
    },

    enrollment: data.enrollment || {
      enrollment_id: data.enrollment_id,
      branch_id: data.branch_id,
      branch_name: data.branch_name,
      academic_year_id: data.academic_year_id,
      academic_year_name: data.academic_year_name,
      batch_id: data.batch_id,
      batch_name: data.batch_name,
      roll_no: data.roll_no,
      class_id: data.class_id,
      class_name: data.class_name,
      group_id: data.group_id,
      group_name: data.group_name,
      section_id: data.section_id,
      section_name: data.section_name,
      medium_id: data.medium_id,
      medium_name: data.medium_name,
      shift_id: data.shift_id,
      shift_name: data.shift_name,
      enrollment_status: data.enrollment_status,
      start_date: data.start_date,
      end_date: data.end_date
    },

    guardians: Array.isArray(data.guardians) ? data.guardians : [],
    addresses: Array.isArray(data.addresses) ? data.addresses : [],
    documents: Array.isArray(data.documents) ? data.documents : []
  };
}

function goBack() {
  router.push("/students");
}

function editStudent() {
  router.push(`/students/${studentId}/edit`);
}

function printProfile() {
  window.print();
}
</script>

<style scoped>
.page-loading {
  min-height: 260px;
  display: grid;
  place-items: center;
  gap: 12px;
  color: #64748b;
}

.not-found-card {
  padding: 28px;
  text-align: center;
}

.not-found-card h3 {
  margin: 0;
  color: #0f172a;
}

.not-found-card p {
  margin: 8px 0 20px;
  color: #64748b;
}
</style>