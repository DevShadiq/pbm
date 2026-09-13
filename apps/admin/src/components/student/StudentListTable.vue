<template>
  <div class="student-directory">
    <header class="directory-heading">
      <div><div class="title-line"><h1>Students</h1><span class="record-count">{{ students.length }}</span></div><p>Find a student, update their details or add a new admission.</p></div>
      <BaseButton type="button" @click="$emit('add')"><span aria-hidden="true">＋</span> Add student</BaseButton>
    </header>

    <section class="directory-surface" aria-label="Student directory">
      <div class="directory-toolbar">
        <label class="directory-search"><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="10.5" cy="10.5" r="6.5"/><path d="m16 16 4.5 4.5"/></svg><input v-model="searchText" type="search" aria-label="Search students" placeholder="Search name, ID, roll or contact…" /></label>
        <label class="filter-control"><span>Class</span><select v-model="selectedClass" aria-label="Filter by class"><option value="">All classes</option><option v-for="name in classOptions" :key="name" :value="name">{{ name }}</option></select></label>
        <label class="filter-control"><span>Status</span><select v-model="selectedStatus" aria-label="Filter by status"><option v-for="option in statusOptions" :key="option.value" :value="option.value">{{ option.label }}</option></select></label>
        <button type="button" class="refresh-button" :disabled="loading" aria-label="Refresh students" title="Refresh students" @click="$emit('refresh')"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 7v5h-5M4 17v-5h5"/><path d="M6.2 7a7 7 0 0 1 11.6-1L20 9M4 15l2.2 3A7 7 0 0 0 17.8 17"/></svg></button>
      </div>
      <div v-if="hasFilters" class="filter-summary" aria-live="polite"><span>{{ filteredStudents.length }} matching {{ filteredStudents.length === 1 ? 'student' : 'students' }}</span><button type="button" @click="clearFilters">Clear filters</button></div>
      <div v-if="loading" class="directory-empty" role="status"><LoadingSpinner /><p>Loading students…</p></div>
      <div v-else-if="!filteredStudents.length" class="directory-empty">
        <div class="empty-icon" aria-hidden="true">⌕</div><h3>{{ hasFilters ? 'No matching students' : 'Your student list starts here' }}</h3>
        <p>{{ hasFilters ? 'Try another name, class or status.' : 'Add your first student to manage enrollment and subjects.' }}</p>
        <button v-if="hasFilters" type="button" class="text-button" @click="clearFilters">Clear filters</button>
        <BaseButton v-else type="button" @click="$emit('add')">Add student</BaseButton>
      </div>
      <div v-else class="directory-table-scroll" tabindex="0" aria-label="Student records">
        <table class="directory-table">
          <thead><tr><th scope="col">Student</th><th scope="col">Class & group</th><th scope="col">Roll / section</th><th scope="col">Guardian / contact</th><th scope="col">Status</th><th scope="col" class="actions-heading">Actions</th></tr></thead>
          <tbody>
            <tr v-for="student in paginatedStudents" :key="getStudentId(student)">
              <td><div class="student-identity"><div class="directory-avatar"><img v-if="getPhotoUrl(student) && !failedPhotos.has(getStudentId(student))" :src="getFileUrl(getPhotoUrl(student))" alt="" @error="hideBrokenImage(student)" /><span v-else>{{ getInitials(student) }}</span></div><div class="student-name"><button type="button" @click="$emit('view', student)">{{ getFullName(student) }}</button><small>{{ getStudentNo(student) }}<span v-if="getAdmissionNo(student)"> · {{ getAdmissionNo(student) }}</span></small></div></div></td>
              <td><span class="cell-primary">{{ value(getClassName(student)) }}</span><small v-if="getGroupName(student)">{{ getGroupName(student) }}</small></td>
              <td><span class="cell-primary">{{ value(getRollNo(student)) }}</span><small v-if="getSectionName(student)">Section {{ getSectionName(student) }}</small></td>
              <td><span class="cell-primary">{{ value(getGuardianName(student)) }}</span><small>{{ value(getContactMobile(student)) }}</small></td>
              <td><StudentStatusBadge :status="getStatus(student)" /></td>
              <td><div class="directory-actions"><button type="button" class="edit-button" :aria-label="`Edit ${getFullName(student)}`" @click="$emit('edit', student)">Edit</button><button type="button" class="delete-button" :aria-label="`Delete ${getFullName(student)}`" :title="`Delete ${getFullName(student)}`" @click="$emit('delete', student)"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13M10 11v5M14 11v5"/></svg></button></div></td>
            </tr>
          </tbody>
        </table>
      </div>
      <footer v-if="!loading && filteredStudents.length" class="directory-footer">
        <label class="page-size">Rows <select v-model.number="rowsPerPage" aria-label="Rows per page"><option v-for="size in [...new Set([pageSize, 10, 25, 50])]" :key="size" :value="size">{{ size }}</option></select></label>
        <Pagination v-model:current-page="currentPage" :per-page="rowsPerPage" :total="filteredStudents.length" />
      </footer>
    </section>
  </div>
</template>

<script setup>
import { computed, ref, watch } from "vue";
import { getFileUrl } from "@/services/api";


import BaseButton from "@/components/common/BaseButton.vue";


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

defineEmits(["add", "view", "edit", "delete", "refresh"]);

const searchText = ref("");
const selectedStatus = ref("");
const selectedClass = ref("");
const failedPhotos = ref(new Set());
const rowsPerPage = ref(props.pageSize);
const classOptions = computed(() => [...new Set(props.students.map(getClassName).filter(Boolean))].sort((a,b) => a.localeCompare(b, undefined, { numeric: true })));
const hasFilters = computed(() => Boolean(searchText.value || selectedClass.value || selectedStatus.value));
function clearFilters() { searchText.value = ''; selectedClass.value = ''; selectedStatus.value = ''; }
function getGroupName(student) { return student.group_name || student.academic?.group_name || ''; }
function getContactMobile(student) { return student.guardian_mobile || getMobile(student); }
function hideBrokenImage(student) { failedPhotos.value.add(getStudentId(student)); }
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
      getContactMobile(student),
      getGroupName(student),
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

    return matchesSearch && matchesStatus && (!selectedClass.value || getClassName(student) === selectedClass.value);
  });
});

const paginatedStudents = computed(() => {
  const start = (currentPage.value - 1) * rowsPerPage.value;
  const end = start + rowsPerPage.value;

  return filteredStudents.value.slice(start, end);
});

watch([searchText, selectedStatus, selectedClass, rowsPerPage, () => props.students], () => {
  currentPage.value = 1;
});

function value(input) {
  if (input === null || input === undefined || input === "") return "—";
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
.student-directory{font-family:Inter,"Segoe UI",Arial,sans-serif;color:#172033;min-width:0}.directory-heading{display:flex;align-items:center;justify-content:space-between;gap:20px;margin-bottom:18px}.title-line{display:flex;align-items:center;gap:10px}.title-line h1{margin:0;font-size:24px;font-weight:700;letter-spacing:-.6px}.record-count{padding:3px 8px;border-radius:6px;background:#e8ecf7;color:#52617a;font-size:12px;font-weight:600}.directory-heading p{margin:6px 0 0;color:#64748b;font-size:13px}.directory-surface{border:1px solid #e2e8f0;border-radius:12px;background:#fff;min-width:0;overflow:hidden}.directory-toolbar{display:flex;align-items:center;gap:10px;padding:14px 16px;border-bottom:1px solid #edf0f5}.directory-search{flex:1;min-width:160px;position:relative}.directory-search svg{position:absolute;left:11px;top:11px;width:16px;height:16px;fill:none;stroke:#94a3b8;stroke-width:1.8}.directory-search input{width:100%;height:38px;padding:0 12px 0 35px;border:1px solid #dce3ed;border-radius:7px;background:#fff;font:inherit;font-size:13px;color:#1e293b;box-sizing:border-box}.directory-search input::placeholder{color:#94a3b8}.filter-control{display:flex;align-items:center;gap:8px;border:1px solid #dce3ed;border-radius:7px;padding:0 9px;height:36px;font-size:12px;white-space:nowrap}.filter-control>span{color:#94a3b8}.filter-control select{border:0;background:transparent;max-width:155px;min-width:85px;font:inherit;color:#334155;height:100%;cursor:pointer}.refresh-button{width:38px;height:38px;display:grid;place-items:center;border:1px solid #dce3ed;background:white;border-radius:7px;cursor:pointer;color:#64748b;flex-shrink:0}.refresh-button svg,.delete-button svg{width:17px;height:17px;fill:none;stroke:currentColor;stroke-width:1.7;stroke-linecap:round;stroke-linejoin:round}.filter-summary{display:flex;gap:12px;align-items:center;padding:9px 16px;background:#fafbff;font-size:12px;color:#64748b}.filter-summary button,.text-button{border:0;background:transparent;color:#4f46e5;font:inherit;cursor:pointer;font-weight:600}.directory-table-scroll{overflow:auto}.directory-table{width:100%;border-collapse:collapse;text-align:left;white-space:nowrap}.directory-table th{padding:11px 16px;font-size:11px;font-weight:600;color:#64748b;background:#fafbfc;border-bottom:1px solid #e9edf3}.directory-table td{padding:12px 16px;border-bottom:1px solid #f0f2f6;font-size:13px;color:#334155}.directory-table tbody tr:last-child td{border-bottom:0}.directory-table tbody tr:hover{background:#fafbff}.student-identity{display:flex;align-items:center;gap:10px}.directory-avatar{width:34px;height:34px;flex-shrink:0;border-radius:9px;overflow:hidden;display:grid;place-items:center;background:#eef2ff;color:#6366f1;font-size:11px;font-weight:700}.directory-avatar img{width:100%;height:100%;object-fit:cover}.student-name button{padding:0;border:0;background:none;color:#1e293b;cursor:pointer;font:inherit;font-weight:600;text-align:left}.student-name button:hover{color:#4f46e5;text-decoration:underline}.directory-table small{display:block;margin-top:4px;font-size:11px;color:#8490a4}.cell-primary{font-weight:500}.directory-actions{display:flex;justify-content:flex-end;align-items:center;gap:8px}.actions-heading{text-align:right}.edit-button{padding:6px 10px;border:1px solid #e2e8f0;border-radius:6px;background:#fff;color:#475569;font:inherit;font-size:12px;font-weight:500;cursor:pointer}.edit-button:hover{border-color:#a5b4fc;color:#4f46e5}.delete-button{display:grid;place-items:center;width:29px;height:29px;background:transparent;border:0;border-radius:6px;color:#94a3b8;cursor:pointer}.delete-button:hover{background:#fff1f2;color:#e11d48}.directory-footer{display:flex;align-items:center;justify-content:space-between;gap:20px;padding:6px 16px;border-top:1px solid #edf0f5}.page-size{display:flex;align-items:center;gap:8px;font-size:12px;color:#64748b}.page-size select{height:30px;border:1px solid #e2e8f0;border-radius:6px;padding:0 6px;background:white;color:#334155}.directory-footer :deep(.pagination-wrap){flex:1;padding:8px 0}.directory-footer :deep(.pagination-info){font-size:12px}.directory-footer :deep(.page-btn){min-width:30px;height:30px;border-radius:6px;font-size:12px;font-weight:500;box-shadow:none}.directory-footer :deep(.page-btn.active){background:#4f46e5;border-color:#4f46e5}.directory-empty{min-height:260px;padding:32px 16px;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;color:#64748b;gap:10px}.directory-empty h3{margin:0;color:#334155;font-size:15px}.directory-empty p{margin:0 0 6px;font-size:13px}.empty-icon{display:grid;place-items:center;width:42px;height:42px;border-radius:12px;background:#f1f5f9;font-size:30px;color:#94a3b8}.student-directory :deep(.base-button){border-radius:7px;padding:10px 15px;box-shadow:none;font-size:13px;font-weight:600;background:#4f46e5}.student-directory button:focus-visible,.student-directory input:focus-visible,.student-directory select:focus-visible,.directory-table-scroll:focus-visible{outline:2px solid #818cf8;outline-offset:2px}.refresh-button:disabled{opacity:.5;cursor:wait}
@media(max-width:700px){.directory-heading{align-items:flex-start;gap:12px}.directory-heading p{max-width:240px;line-height:1.5}.directory-heading :deep(.base-button){flex-shrink:0}.directory-toolbar{flex-wrap:wrap;padding:12px}.directory-search{flex-basis:100%}.filter-control{flex:1;justify-content:space-between}.filter-control select{max-width:130px;min-width:60px}.directory-footer{flex-wrap:wrap;gap:0;padding:10px 12px}.directory-footer :deep(.pagination-wrap){flex-basis:100%}.directory-heading h1{font-size:21px}}
</style>
