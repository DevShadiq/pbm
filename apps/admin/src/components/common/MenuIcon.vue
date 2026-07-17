<template>
  <span class="menu-svg-icon" :title="label" aria-hidden="true">
    <svg :width="size" :height="size" viewBox="0 0 24 24" fill="none">
      <path
        v-for="path in iconPaths"
        :key="path"
        :d="path"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
      />
    </svg>
  </span>
</template>

<script setup>
import { computed } from "vue";

const props = defineProps({
  name: {
    type: String,
    default: "",
  },
  code: {
    type: String,
    default: "",
  },
  title: {
    type: String,
    default: "",
  },
  size: {
    type: [Number, String],
    default: 18,
  },
});

const icons = {
  dashboard: [
    "M3 13a9 9 0 1 1 18 0",
    "M12 13l4-4",
    "M8 21h8",
  ],
  building: [
    "M3 21h18",
    "M5 21V7l7-4 7 4v14",
    "M9 21v-6h6v6",
    "M9 10h.01",
    "M15 10h.01",
  ],
  database: [
    "M4 6c0 1.66 3.58 3 8 3s8-1.34 8-3-3.58-3-8-3-8 1.34-8 3Z",
    "M4 6v6c0 1.66 3.58 3 8 3s8-1.34 8-3V6",
    "M4 12v6c0 1.66 3.58 3 8 3s8-1.34 8-3v-6",
  ],
  students: [
    "M22 10L12 5 2 10l10 5 10-5Z",
    "M6 12v5c3 2 9 2 12 0v-5",
    "M22 10v6",
  ],
  admission: [
    "M15 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2",
    "M8.5 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z",
    "M19 8v6",
    "M16 11h6",
  ],
  users: [
    "M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2",
    "M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z",
    "M22 21v-2a4 4 0 0 0-3-3.87",
    "M16 3.13a4 4 0 0 1 0 7.75",
  ],
  role: [
    "M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z",
    "M9 12l2 2 4-4",
  ],
  key: [
    "M21 2l-2 2",
    "M15.5 7.5l-8.8 8.8a4 4 0 1 1-2.8-2.8l8.8-8.8a4 4 0 0 1 2.8 2.8Z",
    "M7 17h.01",
  ],
  menu: [
    "M4 6h16",
    "M4 12h16",
    "M4 18h16",
  ],
  settings: [
    "M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z",
    "M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06A1.65 1.65 0 0 0 15 19.4a1.65 1.65 0 0 0-1 .6 1.65 1.65 0 0 0-.4 1v.2a2 2 0 1 1-4 0V21a1.65 1.65 0 0 0-.4-1 1.65 1.65 0 0 0-1-.6 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.6 15a1.65 1.65 0 0 0-.6-1 1.65 1.65 0 0 0-1-.4h-.2a2 2 0 1 1 0-4H3a1.65 1.65 0 0 0 1-.4 1.65 1.65 0 0 0 .6-1 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.6c.36 0 .7-.12 1-.35.3-.23.4-.62.4-1V3a2 2 0 1 1 4 0v.2c0 .38.1.77.4 1 .3.23.64.35 1 .35a1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9c0 .36.12.7.35 1 .23.3.62.4 1 .4h.2a2 2 0 1 1 0 4h-.2c-.38 0-.77.1-1 .4-.23.3-.35.64-.35 1Z",
  ],
  report: [
    "M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z",
    "M14 2v6h6",
    "M8 17v-4",
    "M12 17v-6",
    "M16 17v-2",
  ],
  attendance: [
    "M8 2v4",
    "M16 2v4",
    "M3 10h18",
    "M5 4h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Z",
    "M9 16l2 2 4-4",
  ],
  fees: [
    "M3 7h18v10H3Z",
    "M7 7V5h10v2",
    "M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z",
  ],
  exam: [
    "M9 5h6",
    "M9 3h6v4H9Z",
    "M5 5h2a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h2",
    "M9 13h6",
    "M9 17h4",
  ],
  employee: [
    "M10 6V5a2 2 0 0 1 2-2h0a2 2 0 0 1 2 2v1",
    "M3 8h18v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2Z",
    "M3 13h18",
  ],
  notice: [
    "M10 21h4",
    "M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9Z",
  ],
  book: [
    "M4 19.5A2.5 2.5 0 0 1 6.5 17H20",
    "M4 4.5A2.5 2.5 0 0 1 6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5Z",
  ],
  clock: [
    "M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20Z",
    "M12 6v6l4 2",
  ],
};

const aliases = {
  "chart-pie": "dashboard",
  chart: "dashboard",
  home: "dashboard",
  institution: "building",
  school: "building",
  branch: "building",
  "master-data": "database",
  master: "database",
  data: "database",
  database: "database",
  student: "students",
  students: "students",
  "graduation-cap": "students",
  admission: "admission",
  "user-plus": "admission",
  user: "users",
  users: "users",
  role: "role",
  roles: "role",
  shield: "role",
  permission: "key",
  permissions: "key",
  key: "key",
  menu: "menu",
  menus: "menu",
  list: "menu",
  settings: "settings",
  gear: "settings",
  report: "report",
  reports: "report",
  attendance: "attendance",
  calendar: "attendance",
  fees: "fees",
  fee: "fees",
  wallet: "fees",
  exam: "exam",
  exams: "exam",
  result: "exam",
  employee: "employee",
  employees: "employee",
  teacher: "employee",
  teachers: "employee",
  notice: "notice",
  notices: "notice",
  bell: "notice",
  bullhorn: "notice",
  class: "book",
  classes: "book",
  subject: "book",
  subjects: "book",
  routine: "clock",
  clock: "clock",
};

const normalize = (value) =>
  String(value || "")
    .toLowerCase()
    .replace(/\b(fas|far|fal|fad|fa-solid|fa-regular|fa)\b/g, "")
    .replace(/[_\s]+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/^-+|-+$/g, "");

const resolveIconKey = (value) => {
  const normalized = normalize(value);
  if (!normalized) return "";

  if (icons[normalized]) return normalized;
  if (aliases[normalized]) return aliases[normalized];

  const parts = normalized.split("-");
  return parts.map((part) => aliases[part]).find(Boolean) || "";
};

const iconKey = computed(() => {
  return (
    resolveIconKey(props.name) ||
    resolveIconKey(props.code) ||
    resolveIconKey(props.title) ||
    "menu"
  );
});

const iconPaths = computed(() => icons[iconKey.value] || icons.menu);

const label = computed(() => props.title || props.name || props.code || "Menu icon");
</script>

<style scoped>
.menu-svg-icon {
  display: inline-grid;
  place-items: center;
  line-height: 0;
}

.menu-svg-icon svg {
  display: block;
}
</style>
