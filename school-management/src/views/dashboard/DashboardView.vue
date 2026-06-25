<template>
  <div class="dashboard-page">
    <section class="dashboard-hero">
      <div>
        <p class="eyebrow">School ERP</p>
        <h1>Dashboard</h1>
        <p class="hero-copy">
          {{ userLabel }} has access to {{ menuCount }} menu areas and {{ permissionCount }} permission rules.
        </p>
      </div>

      <div class="hero-status">
        <span class="status-dot"></span>
        <span>{{ userRole }}</span>
      </div>
    </section>

    <section class="stat-grid">
      <article v-for="item in stats" :key="item.key" class="stat-card">
        <div class="stat-icon">{{ item.icon }}</div>
        <div>
          <span>{{ item.label }}</span>
          <strong>{{ item.value }}</strong>
        </div>
      </article>
    </section>

    <section class="dashboard-grid">
      <div class="panel">
        <div class="panel-header">
          <h2>Role Based Access</h2>
          <RouterLink to="/security/role-permissions">Manage</RouterLink>
        </div>

        <div class="access-steps">
          <div v-for="step in accessSteps" :key="step.title" class="access-step">
            <span>{{ step.number }}</span>
            <div>
              <strong>{{ step.title }}</strong>
              <p>{{ step.text }}</p>
            </div>
          </div>
        </div>
      </div>

      <div class="panel">
        <div class="panel-header">
          <h2>Visible Menus</h2>
          <RouterLink to="/security/menus">Edit</RouterLink>
        </div>

        <div class="menu-preview">
          <div v-for="menu in menus" :key="menu.menu_id || menu.menu_code" class="menu-preview-row">
            <span>{{ menu.menu_title?.charAt(0) }}</span>
            <div>
              <strong>{{ menu.menu_title }}</strong>
              <small>{{ menu.children?.length || 0 }} child items</small>
            </div>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from "vue";
import { dashboardApi } from "../../services/api";

const summary = ref({});
const menus = ref([]);
const permissions = ref({});
const user = ref(null);

const stats = computed(() => [
  { key: "students", label: "Students", value: summary.value.students || 0, icon: "S" },
  { key: "users", label: "Users", value: summary.value.users || 0, icon: "U" },
  { key: "roles", label: "Roles", value: summary.value.roles || 0, icon: "R" },
  { key: "menus", label: "Menus", value: summary.value.menus || 0, icon: "M" },
  { key: "permissions", label: "Permissions", value: summary.value.permissions || 0, icon: "P" },
  { key: "branches", label: "Branches", value: summary.value.branches || 0, icon: "B" },
]);

const menuCount = computed(() => menus.value.length);
const permissionCount = computed(() => Object.keys(permissions.value).length || summary.value.permissions || 0);
const userLabel = computed(() => user.value?.full_name || user.value?.username || "Current user");
const userRole = computed(() => user.value?.user_type || "USER");

const accessSteps = [
  {
    number: "01",
    title: "Create roles",
    text: "Define job-based roles for administration, office staff, teachers, and guardians.",
  },
  {
    number: "02",
    title: "Assign permissions",
    text: "Control view, create, update, delete, and approval actions per module.",
  },
  {
    number: "03",
    title: "Assign menus",
    text: "Show each role only the navigation areas needed for daily work.",
  },
  {
    number: "04",
    title: "Attach users",
    text: "Give each user one or more roles, optionally scoped by branch.",
  },
];

function readStorage() {
  user.value = JSON.parse(localStorage.getItem("sms_user") || "null");
  menus.value = JSON.parse(localStorage.getItem("sms_menus") || "[]");
  permissions.value = JSON.parse(localStorage.getItem("sms_permissions") || "{}");
}

async function loadSummary() {
  try {
    const res = await dashboardApi.getSummary();
    summary.value = res.data.data || {};
  } catch (error) {
    summary.value = {};
  }
}

onMounted(() => {
  readStorage();
  loadSummary();
});
</script>

<style scoped>
.dashboard-page {
  display: grid;
  gap: 18px;
}

.dashboard-hero {
  min-height: 180px;
  border-radius: 8px;
  padding: 28px;
  color: #ffffff;
  background:
    linear-gradient(90deg, rgba(15, 23, 42, 0.88), rgba(30, 64, 175, 0.72)),
    url("https://images.unsplash.com/photo-1523050854058-8df90110c9f1?auto=format&fit=crop&w=1400&q=80");
  background-size: cover;
  background-position: center;
  display: flex;
  justify-content: space-between;
  gap: 22px;
  align-items: flex-start;
}

.eyebrow {
  margin: 0 0 6px;
  text-transform: uppercase;
  font-size: 12px;
  font-weight: 800;
  letter-spacing: 0;
  color: #bfdbfe;
}

.dashboard-hero h1 {
  margin: 0;
  font-size: 34px;
  line-height: 1.1;
}

.hero-copy {
  max-width: 620px;
  margin: 12px 0 0;
  color: #dbeafe;
}

.hero-status {
  display: inline-flex;
  align-items: center;
  gap: 9px;
  padding: 9px 12px;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.14);
  font-weight: 800;
}

.status-dot {
  width: 9px;
  height: 9px;
  border-radius: 50%;
  background: #22c55e;
}

.stat-grid {
  display: grid;
  grid-template-columns: repeat(6, minmax(0, 1fr));
  gap: 12px;
}

.stat-card,
.panel {
  border: 1px solid #dbe3ef;
  border-radius: 8px;
  background: #ffffff;
  box-shadow: 0 10px 28px rgba(15, 23, 42, 0.06);
}

.stat-card {
  padding: 16px;
  display: flex;
  gap: 12px;
  align-items: center;
}

.stat-icon {
  width: 38px;
  height: 38px;
  border-radius: 8px;
  display: grid;
  place-items: center;
  color: #ffffff;
  background: #2563eb;
  font-weight: 900;
}

.stat-card span {
  display: block;
  color: #64748b;
  font-size: 12px;
  font-weight: 700;
}

.stat-card strong {
  display: block;
  margin-top: 2px;
  color: #0f172a;
  font-size: 24px;
}

.dashboard-grid {
  display: grid;
  grid-template-columns: minmax(0, 1.3fr) minmax(300px, 0.7fr);
  gap: 18px;
}

.panel {
  padding: 18px;
}

.panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 14px;
}

.panel-header h2 {
  margin: 0;
  font-size: 18px;
}

.panel-header a {
  color: #2563eb;
  font-weight: 800;
  text-decoration: none;
}

.access-steps,
.menu-preview {
  display: grid;
  gap: 10px;
}

.access-step,
.menu-preview-row {
  display: flex;
  gap: 12px;
  align-items: flex-start;
  padding: 13px;
  border: 1px solid #eef2f7;
  border-radius: 8px;
  background: #f8fafc;
}

.access-step span,
.menu-preview-row span {
  width: 30px;
  height: 30px;
  border-radius: 8px;
  display: grid;
  place-items: center;
  flex: 0 0 30px;
  color: #ffffff;
  background: #0f766e;
  font-weight: 900;
  font-size: 12px;
}

.access-step strong,
.menu-preview-row strong {
  display: block;
  color: #0f172a;
}

.access-step p,
.menu-preview-row small {
  display: block;
  margin: 4px 0 0;
  color: #64748b;
  font-size: 13px;
}

@media (max-width: 1100px) {
  .stat-grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }

  .dashboard-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 700px) {
  .dashboard-hero {
    flex-direction: column;
    padding: 22px;
  }

  .dashboard-hero h1 {
    font-size: 28px;
  }

  .stat-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
</style>
