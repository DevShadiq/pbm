<template>
  <BaseCard title="Master Data Setup" subtitle="Manage academic and institutional master data">
    <AlertMessage
      v-if="alert.message"
      :type="alert.type"
      :message="alert.message"
      @close="alert.message = ''"
    />

    <div class="master-layout">
      <!-- Left menu -->
      <aside class="master-sidebar">
        <button
          v-for="item in modules"
          :key="item.key"
          type="button"
          class="master-menu-item"
          :class="{ active: activeKey === item.key }"
          @click="changeModule(item.key)"
        >
          <span>{{ item.icon }}</span>
          <div>
            <strong>{{ item.title }}</strong>
            <small>{{ item.subtitle }}</small>
          </div>
        </button>
      </aside>

      <!-- Right content -->
      <section class="master-content">
        <div class="section-header">
          <div>
            <h2>{{ activeModule.title }}</h2>
            <p>{{ activeModule.subtitle }}</p>
          </div>

          <BaseButton
            type="button"
            variant="primary"
            @click="openCreate"
          >
            + New {{ activeModule.singleTitle }}
          </BaseButton>
        </div>

        <!-- Form -->
        <form v-if="showForm" class="master-form" @submit.prevent="saveData">
          <div class="form-title">
            <h3>{{ isEdit ? 'Update' : 'Create' }} {{ activeModule.singleTitle }}</h3>
            <button type="button" class="close-btn" @click="closeForm">×</button>
          </div>

          <div class="form-grid">
            <template v-for="field in activeModule.fields" :key="field.name">
              <BaseInput
                v-if="field.type === 'text' || field.type === 'number' || field.type === 'email' || field.type === 'time'"
                v-model="form[field.name]"
                :label="field.label"
                :type="field.type"
                :placeholder="field.placeholder || field.label"
                :required="field.required"
              />

              <BaseDatePicker
                v-else-if="field.type === 'date'"
                v-model="form[field.name]"
                :label="field.label"
                :required="field.required"
              />

              <BaseSelect
                v-else-if="field.type === 'select'"
                v-model="form[field.name]"
                :label="field.label"
                :options="getOptions(field)"
                :placeholder="field.placeholder || `Select ${field.label}`"
                :required="field.required"
              />

              <BaseInput
                v-else-if="field.type === 'textarea'"
                v-model="form[field.name]"
                :label="field.label"
                type="text"
                :placeholder="field.placeholder || field.label"
              />
            </template>
          </div>

          <div class="form-actions">
            <BaseButton type="submit" variant="primary">
              {{ isEdit ? 'Update' : 'Save' }}
            </BaseButton>

            <BaseButton type="button" variant="secondary" @click="closeForm">
              Cancel
            </BaseButton>
          </div>
        </form>

        <!-- Loading -->
        <LoadingSpinner v-if="loading" />

        <!-- Table -->
        <BaseTable
          v-else
          :columns="activeModule.columns"
          :rows="rows"
        >
          <template #actions="{ row }">
            <div class="table-actions">
              <BaseButton type="button" size="sm" variant="secondary" @click="openEdit(row)">
                Edit
              </BaseButton>

              <BaseButton type="button" size="sm" variant="danger" @click="deleteData(row)">
                Delete
              </BaseButton>
            </div>
          </template>
        </BaseTable>
      </section>
    </div>
  </BaseCard>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from "vue";
import api from "../../services/api";

import BaseCard from "../../components/common/BaseCard.vue";
import BaseInput from "../../components/common/BaseInput.vue";
import BaseSelect from "../../components/common/BaseSelect.vue";
import BaseDatePicker from "../../components/common/BaseDatePicker.vue";
import BaseButton from "../../components/common/BaseButton.vue";
import BaseTable from "../../components/common/BaseTable.vue";
import AlertMessage from "../../components/common/AlertMessage.vue";
import LoadingSpinner from "../../components/common/LoadingSpinner.vue";
import { toIsoDate } from "../../utils/dateFormat";

const loading = ref(false);
const showForm = ref(false);
const isEdit = ref(false);
const activeKey = ref("branches");
const rows = ref([]);

const form = reactive({});

const alert = reactive({
  type: "success",
  message: "",
});

const statusOptions = [
  { label: "Active", value: "ACTIVE" },
  { label: "Inactive", value: "INACTIVE" },
];

const booleanOptions = [
  { label: "Yes", value: true },
  { label: "No", value: false },
];

const branchTypeOptions = [
  { label: "Main", value: "Main" },
  { label: "Sub Branch", value: "Sub Branch" },
  { label: "Campus", value: "Campus" },
];

const sessionTypeOptions = [
  { label: "Academic", value: "ACADEMIC" },
  { label: "Board Exam", value: "BOARD_EXAM" },
  { label: "Spring", value: "SPRING" },
  { label: "Summer", value: "SUMMER" },
  { label: "Winter", value: "WINTER" },
];

const lookups = reactive({
  institutions: [],
  branches: [],
  academicYears: [],
  classLevels: [],
  groups: [],
  sections: [],
  mediums: [],
  shifts: [],
  classrooms: [],
  lookupTypes: [],
  academicLevels: [],
});

const modules = [
  {
    key: "branches",
    title: "Branches",
    singleTitle: "Branch",
    subtitle: "Branch, campus, main/sub branch setup",
    icon: "🏫",
    endpoint: "/branches",
    id: "branch_id",
    fields: [
      { name: "institution_id", label: "Institution", type: "select", source: "institutions", required: true },
      { name: "branch_code", label: "Branch Code", type: "text", required: true },
      { name: "branch_name", label: "Branch Name", type: "text", required: true },
      { name: "branch_type", label: "Branch Type", type: "select", options: branchTypeOptions },
      { name: "phone", label: "Phone", type: "text" },
      { name: "email", label: "Email", type: "email" },
      { name: "address_line", label: "Address", type: "textarea" },
      { name: "is_main_branch", label: "Main Branch", type: "select", options: booleanOptions },
      { name: "status", label: "Status", type: "select", options: statusOptions, required: true },
    ],
    columns: [
      { key: "branch_code", label: "Code" },
      { key: "branch_name", label: "Branch Name" },
      { key: "branch_type", label: "Type" },
      { key: "phone", label: "Phone" },
      { key: "status", label: "Status" },
      { key: "actions", label: "Action" },
    ],
  },

  {
    key: "academicYears",
    title: "Academic Years",
    singleTitle: "Academic Year",
    subtitle: "Year setup with start and end date",
    icon: "📅",
    endpoint: "/academic-years",
    id: "academic_year_id",
    fields: [
      { name: "institution_id", label: "Institution", type: "select", source: "institutions", required: true },
      { name: "year_name", label: "Year Name", type: "text", required: true },
      { name: "start_date", label: "Start Date", type: "date", required: true },
      { name: "end_date", label: "End Date", type: "date", required: true },
      { name: "is_current", label: "Current Year", type: "select", options: booleanOptions },
      { name: "status", label: "Status", type: "select", options: statusOptions, required: true },
    ],
    columns: [
      { key: "year_name", label: "Year" },
      { key: "start_date", label: "Start Date", type: "date" },
      { key: "end_date", label: "End Date", type: "date" },
      { key: "is_current", label: "Current" },
      { key: "status", label: "Status" },
      { key: "actions", label: "Action" },
    ],
  },

  {
    key: "academicSessions",
    title: "Academic Sessions",
    singleTitle: "Session",
    subtitle: "Academic, board exam, semester session setup",
    icon: "🗓️",
    endpoint: "/academic-sessions",
    id: "session_id",
    fields: [
      { name: "institution_id", label: "Institution", type: "select", source: "institutions", required: true },
      { name: "academic_year_id", label: "Academic Year", type: "select", source: "academicYears" },
      { name: "session_name", label: "Session Name", type: "text", required: true },
      { name: "session_type", label: "Session Type", type: "select", options: sessionTypeOptions },
      { name: "start_date", label: "Start Date", type: "date" },
      { name: "end_date", label: "End Date", type: "date" },
      { name: "is_current", label: "Current Session", type: "select", options: booleanOptions },
      { name: "status", label: "Status", type: "select", options: statusOptions, required: true },
    ],
    columns: [
      { key: "session_name", label: "Session" },
      { key: "session_type", label: "Type" },
      { key: "start_date", label: "Start Date", type: "date" },
      { key: "end_date", label: "End Date", type: "date" },
      { key: "is_current", label: "Current" },
      { key: "status", label: "Status" },
      { key: "actions", label: "Action" },
    ],
  },

  {
    key: "academicLevels",
    title: "Academic Levels",
    singleTitle: "Academic Level",
    subtitle: "Primary, secondary, higher secondary, degree level setup",
    icon: "🏷️",
    endpoint: "/academic-levels",
    id: "level_id",
    fields: [
      { name: "institution_id", label: "Institution", type: "select", source: "institutions" },
      { name: "level_code", label: "Level Code", type: "text", required: true },
      { name: "level_name", label: "Level Name", type: "text", required: true },
      { name: "level_name_bn", label: "Level Name (Bangla)", type: "text", placeholder: "যেমন: মাধ্যমিক" },
      { name: "sort_order", label: "Sort Order", type: "number" },
      { name: "status", label: "Status", type: "select", options: statusOptions, required: true },
    ],
    columns: [
      { key: "institution_id", label: "Institution" },
      { key: "level_code", label: "Code" },
      { key: "level_name", label: "Level Name" },
      { key: "level_name_bn", label: "Bangla Name" },
      { key: "sort_order", label: "Sort" },
      { key: "status", label: "Status" },
      { key: "actions", label: "Action" },
    ],
  },

  {
    key: "classLevels",
    title: "Class Levels",
    singleTitle: "Class",
    subtitle: "Play, One, Ten, HSC 1st Year etc.",
    icon: "🎓",
    endpoint: "/class-levels",
    id: "class_id",
    fields: [
      { name: "institution_id", label: "Institution", type: "select", source: "institutions", required: true },
      { name: "level_id", label: "Academic Level", type: "select", source: "academicLevels" },
      { name: "class_code", label: "Class Code", type: "text", required: true },
      { name: "class_name", label: "Class Name", type: "text", required: true },
      { name: "class_name_bn", label: "Class Name (Bangla)", type: "text", placeholder: "যেমন: ষষ্ঠ শ্রেণি" },
      { name: "numeric_level", label: "Numeric Level", type: "number" },
      { name: "status", label: "Status", type: "select", options: statusOptions, required: true },
    ],
    columns: [
      { key: "class_code", label: "Code" },
      { key: "level_name", label: "Level" },
      { key: "class_name", label: "Class Name" },
      { key: "class_name_bn", label: "Bangla Name" },
      { key: "numeric_level", label: "Level" },
      { key: "status", label: "Status" },
      { key: "actions", label: "Action" },
    ],
  },

  {
    key: "groups",
    title: "Groups",
    singleTitle: "Group",
    subtitle: "Science, Business Studies, Humanities etc.",
    icon: "📚",
    endpoint: "/groups",
    id: "group_id",
    fields: [
      { name: "institution_id", label: "Institution", type: "select", source: "institutions", required: true },
      { name: "group_code", label: "Group Code", type: "text", required: true },
      { name: "group_name", label: "Group Name", type: "text", required: true },
      { name: "group_name_bn", label: "Group Name (Bangla)", type: "text", placeholder: "যেমন: বিজ্ঞান" },
      { name: "status", label: "Status", type: "select", options: statusOptions, required: true },
    ],
    columns: [
      { key: "group_code", label: "Code" },
      { key: "group_name", label: "Group Name" },
      { key: "group_name_bn", label: "Bangla Name" },
      { key: "status", label: "Status" },
      { key: "actions", label: "Action" },
    ],
  },

  {
    key: "sections",
    title: "Sections",
    singleTitle: "Section",
    subtitle: "A, B, C section setup",
    icon: "🔖",
    endpoint: "/sections",
    id: "section_id",
    fields: [
      { name: "institution_id", label: "Institution", type: "select", source: "institutions", required: true },
      { name: "section_code", label: "Section Code", type: "text", required: true },
      { name: "section_name", label: "Section Name", type: "text", required: true },
      { name: "section_name_bn", label: "Section Name (Bangla)", type: "text", placeholder: "যেমন: ক" },
      { name: "capacity", label: "Capacity", type: "number" },
      { name: "status", label: "Status", type: "select", options: statusOptions, required: true },
    ],
    columns: [
      { key: "section_code", label: "Code" },
      { key: "section_name", label: "Section Name" },
      { key: "section_name_bn", label: "Bangla Name" },
      { key: "capacity", label: "Capacity" },
      { key: "status", label: "Status" },
      { key: "actions", label: "Action" },
    ],
  },

  {
    key: "mediums",
    title: "Mediums",
    singleTitle: "Medium",
    subtitle: "Bangla, English, English Version etc.",
    icon: "🌐",
    endpoint: "/mediums",
    id: "medium_id",
    fields: [
      { name: "institution_id", label: "Institution", type: "select", source: "institutions", required: true },
      { name: "medium_code", label: "Medium Code", type: "text", required: true },
      { name: "medium_name", label: "Medium Name", type: "text", required: true },
      { name: "medium_name_bn", label: "Medium Name (Bangla)", type: "text", placeholder: "যেমন: বাংলা ভার্সন" },
      { name: "status", label: "Status", type: "select", options: statusOptions, required: true },
    ],
    columns: [
      { key: "medium_code", label: "Code" },
      { key: "medium_name", label: "Medium Name" },
      { key: "medium_name_bn", label: "Bangla Name" },
      { key: "status", label: "Status" },
      { key: "actions", label: "Action" },
    ],
  },

  {
    key: "shifts",
    title: "Shifts",
    singleTitle: "Shift",
    subtitle: "Morning, Day, Evening shift setup",
    icon: "⏰",
    endpoint: "/shifts",
    id: "shift_id",
    fields: [
      { name: "institution_id", label: "Institution", type: "select", source: "institutions", required: true },
      { name: "shift_name", label: "Shift Name", type: "text", required: true },
      { name: "shift_name_bn", label: "Shift Name (Bangla)", type: "text", placeholder: "যেমন: মর্নিং" },
      { name: "start_time", label: "Start Time", type: "time" },
      { name: "end_time", label: "End Time", type: "time" },
      { name: "status", label: "Status", type: "select", options: statusOptions, required: true },
    ],
    columns: [
      { key: "shift_name", label: "Shift Name" },
      { key: "shift_name_bn", label: "Bangla Name" },
      { key: "start_time", label: "Start Time" },
      { key: "end_time", label: "End Time" },
      { key: "status", label: "Status" },
      { key: "actions", label: "Action" },
    ],
  },

  {
    key: "classrooms",
    title: "Classrooms",
    singleTitle: "Classroom",
    subtitle: "Room, building, floor and capacity setup",
    icon: "🏛️",
    endpoint: "/classrooms",
    id: "classroom_id",
    fields: [
      { name: "branch_id", label: "Branch", type: "select", source: "branches", required: true },
      { name: "room_no", label: "Room No.", type: "text", required: true },
      { name: "building_name", label: "Building Name", type: "text" },
      { name: "floor_no", label: "Floor No.", type: "text" },
      { name: "capacity", label: "Capacity", type: "number" },
      { name: "status", label: "Status", type: "select", options: statusOptions, required: true },
    ],
    columns: [
      { key: "room_no", label: "Room" },
      { key: "branch_name", label: "Branch" },
      { key: "building_name", label: "Building" },
      { key: "floor_no", label: "Floor" },
      { key: "capacity", label: "Capacity" },
      { key: "status", label: "Status" },
      { key: "actions", label: "Action" },
    ],
  },

  {
    key: "academicBatches",
    title: "Academic Batches",
    singleTitle: "Batch",
    subtitle: "Branch, year, class, group, section, medium and shift wise batch",
    icon: "👥",
    endpoint: "/academic-batches",
    id: "batch_id",
    fields: [
      { name: "branch_id", label: "Branch", type: "select", source: "branches", required: true },
      { name: "academic_year_id", label: "Academic Year", type: "select", source: "academicYears", required: true },
      { name: "class_id", label: "Class", type: "select", source: "classLevels", required: true },
      { name: "group_id", label: "Group", type: "select", source: "groups" },
      { name: "section_id", label: "Section", type: "select", source: "sections" },
      { name: "medium_id", label: "Medium", type: "select", source: "mediums" },
      { name: "shift_id", label: "Shift", type: "select", source: "shifts" },
      { name: "classroom_id", label: "Classroom", type: "select", source: "classrooms" },
      { name: "batch_name", label: "Batch Name", type: "text", required: true },
      { name: "capacity", label: "Capacity", type: "number" },
      { name: "status", label: "Status", type: "select", options: statusOptions, required: true },
    ],
    columns: [
      { key: "batch_name", label: "Batch Name" },
      { key: "branch_name", label: "Branch" },
      { key: "year_name", label: "Year" },
      { key: "class_name", label: "Class" },
      { key: "capacity", label: "Capacity" },
      { key: "status", label: "Status" },
      { key: "actions", label: "Action" },
    ],
  },

  {
    key: "lookupTypes",
    title: "Lookup Types",
    singleTitle: "Lookup Type",
    subtitle: "Reusable dropdown type setup",
    icon: "🧩",
    endpoint: "/lookup-types",
    id: "lookup_type_id",
    fields: [
      { name: "type_code", label: "Type Code", type: "text", required: true },
      { name: "type_name", label: "Type Name", type: "text", required: true },
      { name: "description", label: "Description", type: "textarea" },
      { name: "status", label: "Status", type: "select", options: statusOptions, required: true },
    ],
    columns: [
      { key: "type_code", label: "Code" },
      { key: "type_name", label: "Type Name" },
      { key: "description", label: "Description" },
      { key: "status", label: "Status" },
      { key: "actions", label: "Action" },
    ],
  },

  {
    key: "lookupValues",
    title: "Lookup Values",
    singleTitle: "Lookup Value",
    subtitle: "Reusable dropdown value setup",
    icon: "📌",
    endpoint: "/lookup-values",
    id: "lookup_value_id",
    fields: [
      { name: "lookup_type_id", label: "Lookup Type", type: "select", source: "lookupTypes", required: true },
      { name: "value_code", label: "Value Code", type: "text", required: true },
      { name: "value_name", label: "Value Name", type: "text", required: true },
      { name: "sort_order", label: "Sort Order", type: "number" },
      { name: "status", label: "Status", type: "select", options: statusOptions, required: true },
    ],
    columns: [
      { key: "type_name", label: "Lookup Type" },
      { key: "value_code", label: "Code" },
      { key: "value_name", label: "Value Name" },
      { key: "sort_order", label: "Sort" },
      { key: "status", label: "Status" },
      { key: "actions", label: "Action" },
    ],
  },
];

const activeModule = computed(() => {
  return modules.find((item) => item.key === activeKey.value);
});

onMounted(async () => {
  await loadLookups();
  await loadData();
});

async function changeModule(key) {
  activeKey.value = key;
  closeForm();
  await loadData();
}

function resetForm() {
  Object.keys(form).forEach((key) => delete form[key]);

  activeModule.value.fields.forEach((field) => {
    if (field.name === "status") {
      form[field.name] = "ACTIVE";
    } else if (field.type === "select" && field.options === booleanOptions) {
      form[field.name] = false;
    } else {
      form[field.name] = "";
    }
  });

  applySelectDefaults();
}

function openCreate() {
  isEdit.value = false;
  resetForm();
  showForm.value = true;
}

function openEdit(row) {
  isEdit.value = true;
  resetForm();

  Object.keys(row).forEach((key) => {
    const field = activeModule.value.fields.find((item) => item.name === key);
    form[key] = field?.type === "date" ? toIsoDate(row[key]) : row[key];
  });

  showForm.value = true;
}

function closeForm() {
  showForm.value = false;
  isEdit.value = false;
  resetForm();
}

async function loadData() {
  loading.value = true;

  try {
    const { data } = await api.get(activeModule.value.endpoint);
    rows.value = Array.isArray(data) ? data : data.data || [];
  } catch (error) {
    showAlert("danger", getErrorMessage(error, "Failed to load data"));
  } finally {
    loading.value = false;
  }
}

async function saveData() {
  try {
    const payload = preparePayload();
    const missingFields = getMissingRequiredFields(payload);

    if (missingFields.length > 0) {
      showAlert("danger", `${missingFields.join(", ")} required`);
      return;
    }

    if (isEdit.value) {
      const idValue = form[activeModule.value.id];
      await api.put(`${activeModule.value.endpoint}/${idValue}`, payload);
      showAlert("success", `${activeModule.value.singleTitle} updated successfully`);
    } else {
      await api.post(activeModule.value.endpoint, payload);
      showAlert("success", `${activeModule.value.singleTitle} created successfully`);
    }

    closeForm();
    await loadLookups();
    await loadData();
  } catch (error) {
    showAlert("danger", getErrorMessage(error, "Save failed"));
  }
}

async function deleteData(row) {
  const idValue = row[activeModule.value.id];

  if (!confirm(`Delete this ${activeModule.value.singleTitle}?`)) return;

  try {
    await api.delete(`${activeModule.value.endpoint}/${idValue}`);
    showAlert("success", `${activeModule.value.singleTitle} deleted successfully`);
    await loadLookups();
    await loadData();
  } catch (error) {
    showAlert("danger", getErrorMessage(error, "Delete failed"));
  }
}

function preparePayload() {
  const payload = {};

  activeModule.value.fields.forEach((field) => {
    let value = form[field.name];

    if (value === "") {
      value = null;
    }

    if (field.type === "number" && value !== null) {
      value = Number(value);
    }

    if (field.type === "date" && value !== null) {
      value = toIsoDate(value) || null;
    }

    if (field.type === "select" && field.source && value !== null) {
      value = Number(value);
    }

    if (field.type === "select" && field.options === booleanOptions) {
      value = value === true || value === "true";
    }

    payload[field.name] = value;
  });

  return payload;
}

function getMissingRequiredFields(payload) {
  return activeModule.value.fields
    .filter((field) => field.required)
    .filter((field) => {
      const value = payload[field.name];
      return value === null || value === undefined || value === "";
    })
    .map((field) => field.label);
}

async function loadLookups() {
  try {
    const [
      institutions,
      branches,
      academicYears,
      classLevels,
      groups,
      sections,
      mediums,
      shifts,
      classrooms,
      lookupTypes,
      academicLevels,
    ] = await Promise.allSettled([
      api.get("/institutions"),
      api.get("/branches"),
      api.get("/academic-years"),
      api.get("/class-levels"),
      api.get("/groups"),
      api.get("/sections"),
      api.get("/mediums"),
      api.get("/shifts"),
      api.get("/classrooms"),
      api.get("/lookup-types"),
      api.get("/academic-levels"),
    ]);

    lookups.institutions = normalize(institutions);
    lookups.branches = normalize(branches);
    lookups.academicYears = normalize(academicYears);
    lookups.classLevels = normalize(classLevels);
    lookups.groups = normalize(groups);
    lookups.sections = normalize(sections);
    lookups.mediums = normalize(mediums);
    lookups.shifts = normalize(shifts);
    lookups.classrooms = normalize(classrooms);
    lookups.lookupTypes = normalize(lookupTypes);
    lookups.academicLevels = normalize(academicLevels);
    applySelectDefaults();
  } catch {
    // lookup loading error should not block the page
  }
}

function normalize(result) {
  if (result.status !== "fulfilled") return [];

  const data = result.value.data;
  return Array.isArray(data) ? data : data.data || [];
}

function getOptions(field) {
  if (field.options) return field.options;

  const sourceData = lookups[field.source] || [];

  return sourceData.map((item) => ({
    label: getOptionLabel(field.source, item),
    value: getOptionValue(field.source, item),
  }));
}

function getOptionLabel(source, item) {
  const labelMap = {
    institutions: "institution_name",
    branches: "branch_name",
    academicYears: "year_name",
    classLevels: "class_name",
    groups: "group_name",
    sections: "section_name",
    mediums: "medium_name",
    shifts: "shift_name",
    classrooms: "classroom_name",
    lookupTypes: "type_name",
    academicLevels: "level_name",
  };

  const primary = source === "classrooms"
    ? `Room ${item.room_no || "-"}${item.branch_name ? ` - ${item.branch_name}` : ""}`
    : item[labelMap[source]] || item.name || item.title || "N/A";
  const banglaMap = {
    institutions: "institution_name_bn",
    classLevels: "class_name_bn",
    groups: "group_name_bn",
    sections: "section_name_bn",
    mediums: "medium_name_bn",
    shifts: "shift_name_bn",
    academicLevels: "level_name_bn",
  };
  const bangla = item[banglaMap[source]];

  return bangla ? `${primary} - ${bangla}` : primary;
}

function getOptionValue(source, item) {
  const valueMap = {
    institutions: "institution_id",
    branches: "branch_id",
    academicYears: "academic_year_id",
    classLevels: "class_id",
    groups: "group_id",
    sections: "section_id",
    mediums: "medium_id",
    shifts: "shift_id",
    classrooms: "classroom_id",
    lookupTypes: "lookup_type_id",
    academicLevels: "level_id",
  };

  return item[valueMap[source]];
}

function applySelectDefaults() {
  activeModule.value.fields.forEach((field) => {
    if (field.type !== "select" || !field.source || form[field.name]) return;

    const options = getOptions(field);
    if (field.required && options.length === 1) {
      form[field.name] = options[0].value;
    }
  });
}

function showAlert(type, message) {
  alert.type = type;
  alert.message = message;
}

function getErrorMessage(error, fallback) {
  return (
    error?.response?.data?.message ||
    error?.response?.data?.error ||
    error?.message ||
    fallback
  );
}
</script>

<style scoped>
.master-layout {
  display: grid;
  grid-template-columns: 280px 1fr;
  gap: 22px;
}

.master-sidebar {
  background: #f8fafc;
  border: 1px solid #e5e7eb;
  border-radius: 18px;
  padding: 12px;
  height: fit-content;
}

.master-menu-item {
  width: 100%;
  display: flex;
  gap: 12px;
  align-items: flex-start;
  border: none;
  background: transparent;
  padding: 12px;
  border-radius: 14px;
  cursor: pointer;
  text-align: left;
  transition: 0.2s;
  color: #334155;
}

.master-menu-item:hover {
  background: #eef2ff;
}

.master-menu-item.active {
  background: #2563eb;
  color: #ffffff;
  box-shadow: 0 12px 25px rgba(37, 99, 235, 0.22);
}

.master-menu-item span {
  font-size: 20px;
}

.master-menu-item strong {
  display: block;
  font-size: 14px;
}

.master-menu-item small {
  display: block;
  font-size: 12px;
  opacity: 0.8;
  margin-top: 2px;
}

.master-content {
  min-width: 0;
}

.section-header {
  display: flex;
  justify-content: space-between;
  gap: 16px;
  align-items: center;
  margin-bottom: 18px;
}

.section-header h2 {
  margin: 0;
  font-size: 22px;
  color: #0f172a;
}

.section-header p {
  margin: 4px 0 0;
  color: #64748b;
  font-size: 14px;
}

.master-form {
  background: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: 18px;
  padding: 20px;
  margin-bottom: 20px;
  box-shadow: 0 16px 35px rgba(15, 23, 42, 0.06);
}

.form-title {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 18px;
}

.form-title h3 {
  margin: 0;
  font-size: 18px;
  color: #0f172a;
}

.close-btn {
  border: none;
  background: #fee2e2;
  color: #b91c1c;
  width: 34px;
  height: 34px;
  border-radius: 50%;
  cursor: pointer;
  font-size: 22px;
  line-height: 1;
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 15px;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 18px;
}

.table-actions {
  display: flex;
  gap: 8px;
}

@media (max-width: 1100px) {
  .master-layout {
    grid-template-columns: 1fr;
  }

  .master-sidebar {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
  }

  .form-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 700px) {
  .section-header {
    flex-direction: column;
    align-items: stretch;
  }

  .master-sidebar {
    grid-template-columns: 1fr;
  }

  .form-grid {
    grid-template-columns: 1fr;
  }
}
</style>
