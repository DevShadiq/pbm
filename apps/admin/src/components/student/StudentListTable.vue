<template>
  <BaseCard class="student-list-card">
    <div class="table-header">
      <div>
        <h3>Student List</h3>
        <p>Manage admitted students, profile and status.</p>
      </div>

      <BaseButton type="button" @click="$emit('add')">
        + Add Student
      </BaseButton>
    </div>

    <div class="table-toolbar">
      <SearchBox
        placeholder="Search by name, admission no, mobile, class, guardian..."
        v-model="searchText"
      />

      <BaseSelect
        class="status-filter"
        :options="statusOptions"
        v-model="selectedStatus"
      />
    </div>

    <div v-if="loading" class="loading-area">
      <LoadingSpinner />
    </div>

    <div v-else class="table-wrapper">
      <table>
        <thead>
          <tr>
            <th>Student</th>
            <th>Admission No</th>
            <th>Class</th>
            <th>Section</th>
            <th>Roll</th>
            <th>Guardian</th>
            <th>Mobile</th>
            <th>Status</th>
            <th class="text-right">Action</th>
          </tr>
        </thead>

        <tbody>
          <tr
            v-for="student in paginatedStudents"
            :key="getStudentId(student)"
          >
            <td>
              <div class="student-cell">
                <div class="student-avatar">
               <img
  v-if="getPhotoUrl(student)"
  :src="getFileUrl(getPhotoUrl(student))"
  alt="Student photo"
  @error="hideBrokenImage"
    />
                </div>

                <div>
                  <strong>{{ getFullName(student) }}</strong>
                  <small>{{ getStudentNo(student) }}</small>
                </div>
              </div>
            </td>

            <td>{{ value(getAdmissionNo(student)) }}</td>
            <td>{{ value(getClassName(student)) }}</td>
            <td>{{ value(getSectionName(student)) }}</td>
            <td>{{ value(getRollNo(student)) }}</td>
            <td>{{ value(getGuardianName(student)) }}</td>
            <td>{{ value(getMobile(student)) }}</td>

            <td>
              <StudentStatusBadge :status="getStatus(student)" />
            </td>

            <td>
              <div class="action-buttons">
                <button type="button" @click="$emit('view', student)">
                  View
                </button>

                <button type="button" @click="$emit('edit', student)">
                  Edit
                </button>

                <button
                  type="button"
                  class="danger"
                  @click="$emit('delete', student)"
                >
                  Delete
                </button>
              </div>
            </td>
          </tr>

          <tr v-if="!paginatedStudents.length">
            <td colspan="9">
              <div class="empty-state">
                No students found.
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div class="pagination-wrap">
      <Pagination
        v-model:current-page="currentPage"
        :per-page="pageSize"
        :total="filteredStudents.length"
      />
    </div>
  </BaseCard>
</template>

<script setup>
import { computed, ref, watch } from "vue";
import { getFileUrl } from "@/services/api";

import BaseCard from "@/components/common/BaseCard.vue";
import BaseButton from "@/components/common/BaseButton.vue";
import BaseSelect from "@/components/common/BaseSelect.vue";
import SearchBox from "@/components/common/SearchBox.vue";
import Pagination from "@/components/common/Pagination.vue";
import LoadingSpinner from "@/components/common/LoadingSpinner.vue";
import StudentStatusBadge from "./StudentStatusBadge.vue";



const props = defineProps({
  students: {
    type: Array,
    default: () => []
  },
  loading: {
    type: Boolean,
    default: false
  },
  pageSize: {
    type: Number,
    default: 10
  }
});

defineEmits(["add", "view", "edit", "delete"]);

const searchText = ref("");
const selectedStatus = ref("");
const currentPage = ref(1);

const statusOptions = [
  { label: "All Status", value: "" },
  { label: "Active", value: "ACTIVE" },
  { label: "Inactive", value: "INACTIVE" },
  { label: "TC", value: "TC" },
  { label: "Graduated", value: "GRADUATED" },
  { label: "Dropout", value: "DROPOUT" }
];

const filteredStudents = computed(() => {
  const keyword = searchText.value.toLowerCase().trim();

  return props.students.filter((student) => {
    const searchableText = [
      getFullName(student),
      getStudentNo(student),
      getAdmissionNo(student),
      getMobile(student),
      getClassName(student),
      getSectionName(student),
      getRollNo(student),
      getGuardianName(student),
      getStatus(student)
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();

    const matchesSearch = !keyword || searchableText.includes(keyword);

    const status = String(getStatus(student) || "").toUpperCase();
    const selected = String(selectedStatus.value || "").toUpperCase();

    const matchesStatus = !selected || status === selected;

    return matchesSearch && matchesStatus;
  });
});

const totalPages = computed(() => {
  return Math.max(1, Math.ceil(filteredStudents.value.length / props.pageSize));
});

const paginatedStudents = computed(() => {
  const start = (currentPage.value - 1) * props.pageSize;
  const end = start + props.pageSize;

  return filteredStudents.value.slice(start, end);
});

watch([searchText, selectedStatus, () => props.students], () => {
  currentPage.value = 1;
});

function value(input) {
  if (input === null || input === undefined || input === "") return "N/A";
  return input;
}

function getStudentId(student) {
  return student.id || student.student_id || student.studentId;
}

function getStudentNo(student) {
  return student.student_no || student.studentNo || "No student no";
}

function getAdmissionNo(student) {
  return student.admission_no || student.admissionNo;
}

function getPhotoUrl(student) {
  return student.photo_url || student.photoUrl;
}

function getMobile(student) {
  return student.mobile || student.phone || student.contact_no;
}

function getStatus(student) {
  return student.status || "ACTIVE";
}

function getFullName(student) {
  const firstName = student.first_name || student.firstName || "";
  const lastName = student.last_name || student.lastName || "";
  const fullName = `${firstName} ${lastName}`.trim();

  return fullName || student.student_name || student.name || "Unnamed Student";
}

function getClassName(student) {
  return (
    student.academic?.className ||
    student.academic?.class_name ||
    student.className ||
    student.class_name ||
    student.class_level_name
  );
}

function getSectionName(student) {
  return (
    student.academic?.sectionName ||
    student.academic?.section_name ||
    student.sectionName ||
    student.section_name
  );
}

function getRollNo(student) {
  return (
    student.academic?.rollNo ||
    student.academic?.roll_no ||
    student.rollNo ||
    student.roll_no
  );
}

function getGuardianName(student) {
  return (
    student.guardian?.guardianName ||
    student.guardian?.guardian_name ||
    student.guardian?.fatherName ||
    student.guardian?.father_name ||
    student.guardianName ||
    student.guardian_name ||
    student.fatherName ||
    student.father_name ||
    student.motherName ||
    student.mother_name
  );
}

function getInitials(student) {
  return getFullName(student)
    .split(" ")
    .map((part) => part.charAt(0))
    .join("")
    .slice(0, 2)
    .toUpperCase();
}
</script>

<style scoped>
.student-list-card {
  padding: 24px;
  border-radius: 24px;
}

.table-header {
  display: flex;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 18px;
}

.table-header h3 {
  margin: 0;
  font-size: 20px;
  color: #0f172a;
}

.table-header p {
  margin: 5px 0 0;
  color: #64748b;
  font-size: 13px;
}

.table-toolbar {
  display: grid;
  grid-template-columns: 1fr 220px;
  gap: 14px;
  margin-bottom: 18px;
}

.table-wrapper {
  width: 100%;
  overflow-x: auto;
  border: 1px solid #e2e8f0;
  border-radius: 18px;
}

table {
  width: 100%;
  border-collapse: collapse;
  background: #fff;
}

th {
  text-align: left;
  padding: 14px;
  background: #f8fafc;
  color: #475569;
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 0.4px;
  white-space: nowrap;
}

td {
  padding: 14px;
  border-top: 1px solid #e2e8f0;
  color: #334155;
  font-size: 14px;
  white-space: nowrap;
}

.student-cell {
  display: flex;
  align-items: center;
  gap: 12px;
}

.student-avatar {
  width: 42px;
  height: 42px;
  display: grid;
  place-items: center;
  border-radius: 14px;
  overflow: hidden;
  background: linear-gradient(135deg, #2563eb, #7c3aed);
  color: #fff;
  font-weight: 800;
  flex-shrink: 0;
}

.student-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.student-cell strong {
  display: block;
  color: #0f172a;
}

.student-cell small {
  display: block;
  margin-top: 3px;
  color: #64748b;
}

.text-right {
  text-align: right;
}

.action-buttons {
  display: flex;
  justify-content: flex-end;
  gap: 7px;
}

.action-buttons button {
  border: 0;
  padding: 7px 10px;
  border-radius: 10px;
  background: #eff6ff;
  color: #2563eb;
  font-weight: 700;
  cursor: pointer;
}

.action-buttons .danger {
  background: #fef2f2;
  color: #dc2626;
}

.loading-area,
.empty-state {
  padding: 35px;
  display: grid;
  place-items: center;
  color: #64748b;
}

.pagination-wrap {
  margin-top: 18px;
}

@media (max-width: 768px) {
  .table-header {
    flex-direction: column;
  }

  .table-toolbar {
    grid-template-columns: 1fr;
  }
}
</style>
