<template>
  <div class="page">
    <div class="topbar">
      <div>
        <h1>User Management</h1>
        <p>Create, update and manage school login users.</p>
      </div>

      <div class="actions">
        <button class="logout-btn" @click="logout">Logout</button>
        <RouterLink to="/users/create" class="create-btn">
          + Create User
        </RouterLink>
      </div>
    </div>

    <div v-if="message" class="alert">
      {{ message }}
    </div>

    <div class="table-card">
      <table>
        <thead>
          <tr>
            <th>SL</th>
            <th>Name</th>
            <th>Username</th>
            <th>Email</th>
            <th>Type</th>
            <th>Active</th>
            <th class="right">Action</th>
          </tr>
        </thead>

        <tbody>
          <tr v-for="(user, index) in users" :key="user.user_id">
            <td>{{ index + 1 }}</td>
            <td>
              <div class="name-cell">
                <div class="avatar">
                  {{ getInitial(user.full_name) }}
                </div>
                <div>
                  <strong>{{ user.full_name }}</strong>
                  <small>{{ user.mobile || "No mobile" }}</small>
                </div>
              </div>
            </td>
            <td>{{ user.username }}</td>
            <td>{{ user.email || "-" }}</td>
            <td>
              <span class="badge type">
                {{ user.user_type }}
              </span>
            </td>
            <td>
              <span
                :class="[
                  'badge',
                  user.is_active ? 'active' : 'inactive'
                ]"
              >
                {{ user.is_active ? "ACTIVE" : "INACTIVE" }}
              </span>
            </td>
            <td class="right">
              <RouterLink
                :to="`/users/${user.user_id}/edit`"
                class="edit-btn"
              >
                Edit
              </RouterLink>
            </td>
          </tr>

          <tr v-if="users.length === 0">
            <td colspan="7" class="empty">
              No users found
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup>
import { onMounted, ref } from "vue";
import { useRouter } from "vue-router";
import { getUsers } from "../../services/userService";
import { logoutUser } from "../../services/authService";

const router = useRouter();

const users = ref([]);
const message = ref("");

function getInitial(name) {
  return name ? name.charAt(0).toUpperCase() : "U";
}

async function loadUsers() {
  try {
    const data = await getUsers();

    if (data.success) {
      users.value = data.users;
    }
  } catch (error) {
    message.value =
      error.response?.data?.message || "Unable to load users";
  }
}

function logout() {
  logoutUser();
  router.push("/login");
}

onMounted(loadUsers);
</script>

<style scoped>
.page {
  min-height: 100vh;
  background: #f8fafc;
  padding: 28px;
}

.topbar {
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 24px;
  padding: 22px 24px;
  margin-bottom: 22px;
  box-shadow: 0 15px 35px rgba(15, 23, 42, 0.06);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.topbar h1 {
  margin: 0;
  font-size: 30px;
  font-weight: 900;
  color: #0f172a;
}

.topbar p {
  margin: 6px 0 0;
  color: #64748b;
}

.actions {
  display: flex;
  gap: 10px;
}

.create-btn,
.logout-btn,
.edit-btn {
  border: none;
  text-decoration: none;
  border-radius: 14px;
  padding: 11px 16px;
  font-weight: 800;
  cursor: pointer;
}

.create-btn {
  background: #2563eb;
  color: white;
}

.logout-btn {
  background: #f1f5f9;
  color: #334155;
}

.edit-btn {
  background: #eef2ff;
  color: #3730a3;
  padding: 8px 12px;
  font-size: 13px;
}

.table-card {
  background: white;
  border-radius: 24px;
  overflow: hidden;
  border: 1px solid #e5e7eb;
  box-shadow: 0 15px 35px rgba(15, 23, 42, 0.06);
}

table {
  width: 100%;
  border-collapse: collapse;
}

th,
td {
  padding: 15px 18px;
  border-bottom: 1px solid #e5e7eb;
  text-align: left;
  font-size: 14px;
}

th {
  background: #f8fafc;
  color: #334155;
  font-weight: 900;
}

.right {
  text-align: right;
}

.name-cell {
  display: flex;
  align-items: center;
  gap: 12px;
}

.name-cell small {
  display: block;
  color: #64748b;
  margin-top: 3px;
}

.avatar {
  width: 38px;
  height: 38px;
  border-radius: 14px;
  background: #dbeafe;
  color: #1d4ed8;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 900;
}

.badge {
  display: inline-flex;
  padding: 6px 11px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 900;
}

.type {
  background: #f1f5f9;
  color: #334155;
}

.active {
  background: #dcfce7;
  color: #166534;
}

.inactive {
  background: #fee2e2;
  color: #991b1b;
}

.empty {
  text-align: center;
  color: #64748b;
  padding: 30px;
}

.alert {
  background: #fee2e2;
  color: #991b1b;
  padding: 12px 14px;
  border-radius: 14px;
  margin-bottom: 18px;
}
</style>