<template>
  <header class="header-bar">
    <div class="header-left">
      <button class="icon-btn mobile-btn" @click="$emit('toggle-sidebar')">
        ☰
      </button>

      <button class="icon-btn desktop-btn" @click="$emit('toggle-collapse')">
        ☰
      </button>

      <div>
        <h3>School Management</h3>
        <p>ERP Dashboard</p>
      </div>
    </div>

    <div class="header-search">
      <span>🔍</span>
      <input type="text" placeholder="Search student, teacher, fee..." />
    </div>

    <div class="header-right">
      <a class="visit-site-btn" href="/" title="Visit public website">
        Visit Website
      </a>

      <button class="notification-btn">
        🔔
        <span></span>
      </button>

      <div class="user-box">
        <div class="avatar">{{ userInitials }}</div>
        <div class="user-info">
          <strong>{{ userName }}</strong>
          <small>{{ userRole }}</small>
        </div>

        <button class="logout-btn" type="button" title="Logout" @click="handleLogout">
          Logout
        </button>
      </div>
    </div>
  </header>
</template>

<script setup>
import { computed } from "vue";
import { useRouter } from "vue-router";
import { getLoggedUser, logoutUser } from "../../services/authService";

defineEmits(['toggle-sidebar', 'toggle-collapse'])

const router = useRouter();

const user = computed(() => getLoggedUser() || {});

const userName = computed(() => user.value.full_name || user.value.username || "User");
const userRole = computed(() => String(user.value.user_type || "User").replace("_", " "));
const userInitials = computed(() => {
  const source = userName.value.trim();
  const parts = source.split(/\s+/).filter(Boolean);

  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  }

  return source.slice(0, 2).toUpperCase() || "U";
});

function handleLogout() {
  logoutUser();
  router.replace("/login");
}
</script>

<style scoped>
.header-bar {
  height: 72px;
  background: #ffffff;
  border-bottom: 1px solid #e5eaf3;
  padding: 0 22px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 18px;
  position: sticky;
  top: 0;
  z-index: 70;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 14px;
}

.header-left h3 {
  margin: 0;
  font-size: 18px;
  color: #0f172a;
}

.header-left p {
  margin: 2px 0 0;
  font-size: 12px;
  color: #64748b;
}

.icon-btn {
  width: 40px;
  height: 40px;
  border: none;
  border-radius: 12px;
  background: #eef4ff;
  color: #2563eb;
  cursor: pointer;
  font-size: 20px;
}

.mobile-btn {
  display: none;
}

.header-search {
  max-width: 420px;
  flex: 1;
  height: 42px;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 14px;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 0 14px;
}

.header-search input {
  width: 100%;
  border: none;
  outline: none;
  background: transparent;
  color: #0f172a;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 14px;
}

.visit-site-btn {
  height: 38px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 10px;
  padding: 0 14px;
  background: #eff6ff;
  border: 1px solid #bfdbfe;
  color: #1d4ed8;
  font-size: 13px;
  font-weight: 800;
  text-decoration: none;
  white-space: nowrap;
}

.visit-site-btn:hover {
  background: #dbeafe;
  color: #1e40af;
}

.notification-btn {
  position: relative;
  width: 42px;
  height: 42px;
  border: none;
  border-radius: 14px;
  background: #f8fafc;
  cursor: pointer;
}

.notification-btn span {
  position: absolute;
  top: 9px;
  right: 10px;
  width: 8px;
  height: 8px;
  background: #ef4444;
  border-radius: 50%;
}

.user-box {
  display: flex;
  align-items: center;
  gap: 10px;
}

.avatar {
  width: 42px;
  height: 42px;
  border-radius: 14px;
  background: linear-gradient(135deg, #2563eb, #0f172a);
  color: #ffffff;
  display: grid;
  place-items: center;
  font-weight: 700;
}

.user-info {
  display: flex;
  flex-direction: column;
}

.user-info strong {
  font-size: 14px;
  color: #0f172a;
}

.user-info small {
  font-size: 12px;
  color: #64748b;
}

.logout-btn {
  height: 36px;
  border: 1px solid #fecaca;
  border-radius: 8px;
  padding: 0 12px;
  background: #fff5f5;
  color: #b91c1c;
  font-size: 13px;
  font-weight: 800;
}

.logout-btn:hover {
  background: #fee2e2;
}

@media (max-width: 900px) {
  .header-bar {
    padding: 0 14px;
  }

  .mobile-btn {
    display: block;
  }

  .desktop-btn {
    display: none;
  }

  .header-search {
    display: none;
  }

  .visit-site-btn {
    height: 36px;
    padding: 0 10px;
    font-size: 12px;
  }

  .user-info {
    display: none;
  }

  .logout-btn {
    padding: 0 10px;
  }
}
</style>
