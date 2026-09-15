<template>
  <aside
    class="sidebar"
    :class="{
      collapsed: props.collapsed,
      'mobile-open': props.mobileOpen
    }"
  >
    <div class="brand">
      <div class="brand-logo">S</div>

      <div class="brand-text">
        <h2>School ERP</h2>
        <p>Management System</p>
      </div>
    </div>

    <nav class="menu-list">
      <template v-for="menu in menus" :key="menu.menu_id || menu.menu_code">
        <div v-if="menu.children && menu.children.length" class="menu-group">
          <button class="menu-parent" type="button" @click="toggle(menu.menu_code)">
            <span class="menu-icon">
              <MenuIcon :name="menu.icon_name" :code="menu.menu_code" :title="menu.menu_title" />
            </span>
            <span class="menu-text">{{ menu.menu_title }}</span>
            <span class="menu-arrow">{{ opened[menu.menu_code] ? "−" : "+" }}</span>
          </button>

          <div v-show="submenuVisible(menu.menu_code)" class="submenu">
            <RouterLink
              v-for="child in menu.children"
              :key="child.menu_id || child.menu_code"
              :to="child.route_path || '#'"
              class="menu-link"
              active-class="active"
              @click="closeMobile"
            >
              <span class="menu-icon">
                <MenuIcon :name="child.icon_name" :code="child.menu_code" :title="child.menu_title" />
              </span>
              <span class="menu-text">{{ child.menu_title }}</span>
            </RouterLink>
          </div>
        </div>

        <RouterLink
          v-else
          :to="menu.route_path || '#'"
          class="menu-link"
          active-class="active"
          @click="closeMobile"
        >
          <span class="menu-icon">
            <MenuIcon :name="menu.icon_name" :code="menu.menu_code" :title="menu.menu_title" />
          </span>
          <span class="menu-text">{{ menu.menu_title }}</span>
        </RouterLink>
      </template>
    </nav>
  </aside>
</template>

<script setup>
import { ref, onMounted, watch } from "vue";
import { useRoute } from "vue-router";
import api from "../../services/api";
import MenuIcon from "../common/MenuIcon.vue";

const props = defineProps({
  collapsed: {
    type: Boolean,
    default: false,
  },
  mobileOpen: {
    type: Boolean,
    default: false,
  },
});
const emit = defineEmits(["close-mobile"]);

const route = useRoute();
const menus = ref([]);
const opened = ref({});

const fallbackMenus = [
  {
    menu_code: "DASHBOARD",
    menu_title: "Dashboard",
    route_path: "/dashboard",
    icon_name: "dashboard",
    children: [],
  },
  {
    menu_code: "master-data",
    menu_title: "Academic Master Setup",
    route_path: "#",
    icon_name: "settings",
    children: [
      { menu_code: "ACADEMIC_MASTER_DATA", menu_title: "Class & Master Entry", route_path: "/master-data", icon_name: "settings" },
      { menu_code: "EXAM_SUBJECT_ENTRY", menu_title: "Subject Master", route_path: "/exams/subjects", icon_name: "book" },
      { menu_code: "EXAM_CLASS_SUBJECTS", menu_title: "Class Subject & Exam Method", route_path: "/exams/class-subjects", icon_name: "book" },
    ],
  },
  {
    menu_code: "USERS",
    menu_title: "Users",
    route_path: "/users",
    icon_name: "users",
    children: [],
  },
  {
    menu_code: "STUDENTS",
    menu_title: "Students",
    route_path: null,
    icon_name: "students",
    children: [
      {
        menu_code: "STUDENT_LIST",
        menu_title: "Student List",
        route_path: "/students",
        icon_name: "students",
      },
      {
        menu_code: "STUDENT_ADMISSION",
        menu_title: "Student Admission",
        route_path: "/students/admission",
        icon_name: "admission",
      },
    ],
  },
  {
    menu_code: "EXAM_MANAGEMENT",
    menu_title: "Exam & Results",
    route_path: "#",
    icon_name: "exam",
    children: [
      { menu_code: "EXAM_DASHBOARD", menu_title: "Exam Dashboard", route_path: "/exams", icon_name: "exam" },
      { menu_code: "EXAM_SETUP", menu_title: "Exam Setup", route_path: "/exams/setup", icon_name: "settings" },
      { menu_code: "EXAM_ROUTINE", menu_title: "Routine & Seating", route_path: "/exams/routine", icon_name: "clock" },
      { menu_code: "EXAM_CANDIDATES", menu_title: "Candidates & Admit Cards", route_path: "/exams/candidates", icon_name: "students" },
      { menu_code: "EXAM_MARKS", menu_title: "Fast Marks Entry", route_path: "/exams/marks", icon_name: "exam" },
      { menu_code: "EXAM_RESULTS", menu_title: "Full Result Sheet", route_path: "/exams/results", icon_name: "report" },
      { menu_code: "EXAM_DOCUMENTS", menu_title: "Marksheet & Certificates", route_path: "/exams/documents", icon_name: "report" },
      { menu_code: "EXAM_REPORTS", menu_title: "Exam Reports", route_path: "/exams/reports", icon_name: "report" },
    ],
  },
];

const openParentMenus = () => {
  // Restore only the parent that owns the active page after login/reload.
  const activeParent = menus.value.find((menu) =>
    menu.children?.some((child) => child.route_path === route.path)
  );
  opened.value = activeParent ? { [activeParent.menu_code]: true } : {};
};

const setMenus = (nextMenus) => {
  menus.value = nextMenus.length ? nextMenus : fallbackMenus;
  openParentMenus();
};

const loadMenus = async () => {
  let savedMenus = [];
  try {
    savedMenus = JSON.parse(localStorage.getItem("sms_menus") || "[]");
    const accessRes = await api.get("/security/me/access");
    const accessMenus = accessRes.data?.data?.menus || [];

    const nextMenus = accessMenus.length ? accessMenus : savedMenus;
    localStorage.setItem("sms_menus", JSON.stringify(nextMenus));
    setMenus(nextMenus);
  } catch (error) {
    console.error("Menu parse error:", error);
    // Preserve the last successful access menu during a transient API failure.
    setMenus(savedMenus.length ? savedMenus : fallbackMenus);
  }
};

const submenuVisible = (code) => opened.value[code] && (!props.collapsed || props.mobileOpen);
const closeMobile = () => {
  if (props.mobileOpen) emit("close-mobile");
};

const toggle = (code) => {
  if (props.collapsed && !props.mobileOpen) return;
  const willOpen = !opened.value[code];
  // Accordion behavior: only one parent menu can stay open at a time.
  opened.value = willOpen ? { [code]: true } : {};
};

onMounted(() => {
  loadMenus();
});

watch(
  () => route.path,
  () => openParentMenus()
);

watch(
  () => props.mobileOpen,
  (isOpen) => { if (isOpen) openParentMenus(); }
);
</script>

<style scoped>
.sidebar {
  width: 270px;
  height: 100vh;
  min-height: 100vh;
  position: fixed;
  left: 0;
  top: 0;
  bottom: 0;
  float: left;
  z-index: 100;
  background: #0f172a;
  color: #e5e7eb;
  padding: 18px;
  overflow-y: auto;
  transition: width 0.25s ease, transform 0.25s ease;
  box-sizing: border-box;
  border-radius: 0;
  box-shadow: 12px 0 28px rgba(15, 23, 42, 0.16);
}

.sidebar.collapsed {
  width: 86px;
}

.brand {
  display: flex;
  align-items: center;
  gap: 12px;
  padding-bottom: 18px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
}

.brand-logo {
  width: 42px;
  height: 42px;
  border-radius: 14px;
  background: #2563eb;
  color: white;
  display: grid;
  place-items: center;
  font-weight: 800;
  font-size: 20px;
  flex-shrink: 0;
}

.brand h2 {
  margin: 0;
  font-size: 18px;
  color: white;
  white-space: nowrap;
}

.brand p {
  margin: 2px 0 0;
  font-size: 12px;
  color: #94a3b8;
  white-space: nowrap;
}

.menu-list {
  margin-top: 18px;
}

.menu-parent,
.menu-link {
  width: 100%;
  display: flex;
  justify-content: flex-start;
  align-items: center;
  gap: 10px;
  padding: 11px 13px;
  border-radius: 10px;
  color: #cbd5e1;
  background: transparent;
  border: 0;
  text-decoration: none;
  cursor: pointer;
  margin-bottom: 6px;
  font-size: 14px;
  text-align: left;
}

.menu-text {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.menu-arrow {
  margin-left: auto;
  width: 20px;
  height: 20px;
  border-radius: 999px;
  background: rgba(148, 163, 184, 0.15);
  color: #e2e8f0;
  display: grid;
  place-items: center;
  font-size: 15px;
  line-height: 1;
}

.menu-icon {
  width: 34px;
  height: 34px;
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.09);
  color: #bfdbfe;
  display: grid;
  place-items: center;
  flex: 0 0 34px;
  box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.06);
}

.menu-parent:hover,
.menu-link:hover,
.menu-link.active {
  background: #1d4ed8;
  color: white;
}

.menu-parent:hover .menu-icon,
.menu-link:hover .menu-icon,
.menu-link.active .menu-icon {
  background: rgba(255, 255, 255, 0.18);
  color: white;
}

.submenu {
  margin-left: 12px;
  padding-left: 10px;
  border-left: 1px dashed rgba(255, 255, 255, 0.18);
}

.sidebar.collapsed .brand-text,
.sidebar.collapsed .menu-text,
.sidebar.collapsed .menu-arrow,
.sidebar.collapsed .submenu {
  display: none;
}

.sidebar.collapsed .brand {
  justify-content: center;
}

.sidebar.collapsed .menu-parent,
.sidebar.collapsed .menu-link {
  justify-content: center;
  padding-left: 0;
  padding-right: 0;
}

@media (max-width: 900px) {
  .sidebar {
    transform: translateX(-100%);
  }

  .sidebar.mobile-open {
    transform: translateX(0);
  }

  .sidebar.collapsed {
    width: 270px;
  }

  .sidebar.collapsed .brand-text,
  .sidebar.collapsed .menu-text,
  .sidebar.collapsed .menu-arrow {
    display: block;
  }

  .sidebar.collapsed .menu-parent,
  .sidebar.collapsed .menu-link {
    justify-content: space-between;
    padding: 11px 13px;
  }

  .sidebar.collapsed.mobile-open .submenu {
    display: block;
  }
}
</style>
