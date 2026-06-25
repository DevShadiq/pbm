<template>
  <div>
    <AlertMessage
      v-if="alert.message"
      :type="alert.type"
      :message="alert.message"
      @close="alert.message = ''"
    />

    <StudentListTable
      :students="students"
      :loading="loading"
      @add="goToAdd"
      @view="viewStudent"
      @edit="editStudent"
      @delete="deleteStudent"
    />
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import { useRouter } from "vue-router";

import api from "../../services/api";

import StudentListTable from "../../components/student/StudentListTable.vue";
import AlertMessage from "../../components/common/AlertMessage.vue";

const router = useRouter();

const students = ref([]);
const loading = ref(false);

const alert = ref({
  type: "success",
  message: ""
});

onMounted(() => {
  loadStudents();
});

async function loadStudents() {
  loading.value = true;
  alert.value.message = "";

  try {
    const res = await api.get("/student-admissions/list");

    console.log("Student list raw response:", res.data);

    const rows = getRows(res.data);

    console.log("Student list rows:", rows);

    students.value = rows.map((s) => ({
      id: s.student_id || s.id,
      student_id: s.student_id || s.id,

      student_no: s.student_no || s.studentNo || "",
      admission_no: s.admission_no || s.admissionNo || "",
      first_name: s.first_name || s.firstName || "",
      last_name: s.last_name || s.lastName || "",
      mobile: s.mobile || s.phone || "",
     // photo_url: s.photo_url || s.photoUrl || "",
      photo_url: s.photo_url || "",
      photoUrl: s.photo_url || "",
      status: s.status || "ACTIVE",

      class_name: s.class_name || s.className || s.class_level_name || "",
      section_name: s.section_name || s.sectionName || "",
      roll_no: s.roll_no || s.rollNo || "",

      guardian_name: s.guardian_name || s.guardianName || "",
      father_name: s.father_name || s.fatherName || "",
      mother_name: s.mother_name || s.motherName || "",

      academic: {
        class_name: s.class_name || s.className || s.class_level_name || "",
        section_name: s.section_name || s.sectionName || "",
        roll_no: s.roll_no || s.rollNo || ""
      },

      guardian: {
        guardian_name: s.guardian_name || s.guardianName || "",
        father_name: s.father_name || s.fatherName || "",
        mother_name: s.mother_name || s.motherName || ""
      }
    }));

    console.log("Mapped students:", students.value);

    if (!students.value.length) {
      alert.value.message = "";
    }
  } catch (error) {
    console.error("Student list load error:", error);

    alert.value = {
      type: "error",
      message:
        error?.response?.data?.message ||
        error?.message ||
        "Failed to load student list"
    };

    students.value = [];
  } finally {
    loading.value = false;
  }
}

function getRows(data) {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.data)) return data.data;
  if (Array.isArray(data?.rows)) return data.rows;
  if (Array.isArray(data?.result)) return data.result;
  if (Array.isArray(data?.items)) return data.items;

  return [];
}

function goToAdd() {
  router.push("/students/admission");
}

function viewStudent(student) {
  const id = student.id || student.student_id || student.studentId;

  if (!id) {
    alert.value = {
      type: "error",
      message: "Student ID not found"
    };
    return;
  }

  router.push(`/students/${id}`);
}

function editStudent(student) {
  const id = student.id || student.student_id || student.studentId;

  if (!id) {
    alert.value = {
      type: "error",
      message: "Student ID not found"
    };
    return;
  }

  router.push(`/students/${id}/edit`);
}

async function deleteStudent(student) {
  const id = student.id || student.student_id || student.studentId;

  if (!id) {
    alert.value = {
      type: "error",
      message: "Student ID not found"
    };
    return;
  }

  if (!confirm("Are you sure you want to delete this student?")) return;

  try {
    await api.delete(`/student-admissions/full/${id}`);
    await loadStudents();
  } catch (error) {
    console.error("Student delete error:", error);

    alert.value = {
      type: "error",
      message: error?.response?.data?.message || "Failed to delete student"
    };
  }
}
</script>

<style scoped></style>
