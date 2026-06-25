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
            <span class="menu-icon">{{ getMenuInitial(menu) }}</span>
            <span class="menu-text">{{ menu.menu_title }}</span>
            <span class="menu-arrow">{{ opened[menu.menu_code] ? "−" : "+" }}</span>
          </button>

          <div v-show="opened[menu.menu_code] && !props.collapsed" class="submenu">
            <RouterLink
              v-for="child in menu.children"
              :key="child.menu_id || child.menu_code"
              :to="child.route_path || '#'"
              class="menu-link"
              active-class="active"
            >
              <span class="menu-icon">{{ getMenuInitial(child) }}</span>
              <span class="menu-text">{{ child.menu_title }}</span>
            </RouterLink>
          </div>
        </div>

        <RouterLink
          v-else
          :to="menu.route_path || '#'"
          class="menu-link"
          active-class="active"
        >
          <span class="menu-icon">{{ getMenuInitial(menu) }}</span>
          <span class="menu-text">{{ menu.menu_title }}</span>
        </RouterLink>
      </template>
    </nav>
  </aside>
</template>

<script setup>
import { ref, onMounted } from "vue";
import api from "../../services/api";

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

const menus = ref([]);
const opened = ref({});

const fallbackMenus = [
  {
    menu_code: "USERS",
    menu_title: "Users",
    route_path: "/users",
    children: [],
  },
  {
    menu_code: "STUDENTS",
    menu_title: "Students",
    route_path: null,
    children: [
      {
        menu_code: "STUDENT_LIST",
        menu_title: "Student List",
        route_path: "/students",
      },
      {
        menu_code: "STUDENT_ADMISSION",
        menu_title: "Student Admission",
        route_path: "/students/admission",
      },
    ],
  },
];

const openParentMenus = () => {
  const nextOpened = {};

  menus.value.forEach((menu) => {
    if (menu.children?.length) {
      nextOpened[menu.menu_code] = true;
    }
  });

  opened.value = nextOpened;
};

const getMenuInitial = (menu) => {
  return String(menu.menu_title || menu.menu_code || "?").trim().charAt(0).toUpperCase();
};

const setMenus = (nextMenus) => {
  menus.value = nextMenus.length ? nextMenus : fallbackMenus;
  openParentMenus();
};

const loadMenus = async () => {
  try {
    const savedMenus = JSON.parse(localStorage.getItem("sms_menus") || "[]");

    if (savedMenus.length) {
      setMenus(savedMenus);
      return;
    }

    const accessRes = await api.get("/security/me/access");
    const accessMenus = accessRes.data?.data?.menus || [];

    localStorage.setItem("sms_menus", JSON.stringify(accessMenus));
    setMenus(accessMenus);
  } catch (error) {
    console.error("Menu parse error:", error);
    setMenus(fallbackMenus);
  }
};

const toggle = (code) => {
  if (props.collapsed) return;
  opened.value[code] = !opened.value[code];
};

onMounted(() => {
  loadMenus();
});
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
  border-radius: 12px;
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
}

.menu-icon {
  width: 24px;
  height: 24px;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.08);
  color: #ffffff;
  display: grid;
  place-items: center;
  font-size: 12px;
  font-weight: 700;
  flex: 0 0 24px;
}

.menu-parent:hover,
.menu-link:hover,
.menu-link.active {
  background: #1d4ed8;
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
}
</style>
