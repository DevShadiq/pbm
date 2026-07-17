<template>
  <div class="profile-card">
    <div class="profile-header">
      <div class="avatar">
        <img v-if="user.avatar" :src="user.avatar" :alt="user.name" />
        <span v-else>{{ initials }}</span>
      </div>

      <div class="profile-info">
        <h3>{{ user.name }}</h3>
        <p>{{ user.email }}</p>

        <div class="badge-row">
          <span class="role-badge">{{ user.role }}</span>
          <span class="status-badge" :class="{ inactive: !user.active }">
            {{ user.active ? 'Active' : 'Inactive' }}
          </span>
        </div>
      </div>
    </div>

    <div class="info-grid">
      <div class="info-item">
        <span>Branch</span>
        <strong>{{ user.branch || 'N/A' }}</strong>
      </div>

      <div class="info-item">
        <span>Phone</span>
        <strong>{{ user.phone || 'N/A' }}</strong>
      </div>

      <div class="info-item">
        <span>User ID</span>
        <strong>{{ user.userId || 'N/A' }}</strong>
      </div>

      <div class="info-item">
        <span>Joined</span>
        <strong>{{ user.joinedAt || 'N/A' }}</strong>
      </div>
    </div>

    <div class="stats-row" v-if="stats.length">
      <div v-for="item in stats" :key="item.label" class="stat-box">
        <strong>{{ item.value }}</strong>
        <span>{{ item.label }}</span>
      </div>
    </div>

    <div class="action-row">
      <button class="outline-btn" type="button" @click="$emit('edit-profile')">
        Edit Profile
      </button>

      <button class="outline-btn" type="button" @click="$emit('change-password')">
        Change Password
      </button>

      <button class="danger-btn" type="button" @click="$emit('logout')">
        Logout
      </button>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  user: {
    type: Object,
    default: () => ({
      name: 'Sadiqur Rahman',
      email: 'user@example.com',
      role: 'Admin',
      active: true,
      avatar: '',
      branch: 'Main Branch',
      phone: '01XXXXXXXXX',
      userId: 'USR-1001',
      joinedAt: '2026-01-01'
    })
  },
  stats: {
    type: Array,
    default: () => [
      { label: 'Logins', value: 128 },
      { label: 'Tasks', value: 36 },
      { label: 'Reports', value: 12 }
    ]
  }
})

defineEmits(['edit-profile', 'change-password', 'logout'])

const initials = computed(() => {
  if (!props.user.name) return 'U'

  return props.user.name
    .split(' ')
    .map(word => word.charAt(0))
    .join('')
    .slice(0, 2)
    .toUpperCase()
})
</script>

<style scoped>
.profile-card {
  width: 100%;
  max-width: 760px;
  background: #ffffff;
  border-radius: 24px;
  padding: 28px;
  border: 1px solid #e5e7eb;
  box-shadow: 0 24px 70px rgba(15, 23, 42, 0.1);
}

.profile-header {
  display: flex;
  align-items: center;
  gap: 20px;
  padding-bottom: 22px;
  border-bottom: 1px solid #e5e7eb;
}

.avatar {
  width: 92px;
  height: 92px;
  flex: 0 0 92px;
  border-radius: 26px;
  overflow: hidden;
  display: grid;
  place-items: center;
  background: linear-gradient(135deg, #2563eb, #7c3aed);
  color: white;
  font-size: 30px;
  font-weight: 900;
}

.avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.profile-info h3 {
  margin: 0;
  font-size: 25px;
  color: #0f172a;
}

.profile-info p {
  margin: 7px 0 12px;
  color: #64748b;
}

.badge-row {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.role-badge,
.status-badge {
  display: inline-flex;
  align-items: center;
  height: 30px;
  padding: 0 12px;
  border-radius: 999px;
  font-size: 13px;
  font-weight: 800;
}

.role-badge {
  background: #eff6ff;
  color: #2563eb;
}

.status-badge {
  background: #dcfce7;
  color: #16a34a;
}

.status-badge.inactive {
  background: #fee2e2;
  color: #dc2626;
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 14px;
  margin-top: 22px;
}

.info-item {
  background: #f8fafc;
  border-radius: 18px;
  padding: 16px;
  border: 1px solid #e5e7eb;
}

.info-item span {
  display: block;
  color: #64748b;
  font-size: 13px;
  margin-bottom: 7px;
}

.info-item strong {
  color: #0f172a;
  font-size: 15px;
}

.stats-row {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 14px;
  margin-top: 18px;
}

.stat-box {
  text-align: center;
  padding: 18px;
  border-radius: 18px;
  background: linear-gradient(135deg, #f8fafc, #eff6ff);
  border: 1px solid #e5e7eb;
}

.stat-box strong {
  display: block;
  color: #0f172a;
  font-size: 24px;
}

.stat-box span {
  color: #64748b;
  font-size: 13px;
}

.action-row {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  flex-wrap: wrap;
  margin-top: 24px;
}

.outline-btn,
.danger-btn {
  height: 42px;
  border-radius: 14px;
  padding: 0 16px;
  font-weight: 800;
  cursor: pointer;
  transition: 0.2s;
}

.outline-btn {
  background: white;
  color: #2563eb;
  border: 1px solid #bfdbfe;
}

.outline-btn:hover {
  background: #eff6ff;
}

.danger-btn {
  background: #fee2e2;
  color: #dc2626;
  border: 1px solid #fecaca;
}

.danger-btn:hover {
  background: #fecaca;
}

@media (max-width: 760px) {
  .info-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .stats-row {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 520px) {
  .profile-header {
    flex-direction: column;
    text-align: center;
  }

  .badge-row {
    justify-content: center;
  }

  .info-grid {
    grid-template-columns: 1fr;
  }

  .action-row {
    flex-direction: column;
  }

  .outline-btn,
  .danger-btn {
    width: 100%;
  }
}
</style>