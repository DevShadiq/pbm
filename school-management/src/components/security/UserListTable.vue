<template>
  <BaseCard>
    <div class="card-header">
      <div>
        <h2>User List</h2>
        <p>Manage system users.</p>
      </div>

      <BaseButton variant="primary" @click="$emit('create')">
        + Add User
      </BaseButton>
    </div>

    <AlertMessage
      v-if="message"
      type="info"
      :message="message"
    />

    <LoadingSpinner v-if="loading" />

    <div v-else class="table-wrap">
      <table>
        <thead>
          <tr>
            <th>SL</th>
            <th>Username</th>
            <th>Name</th>
            <th>Email</th>
            <th>Mobile</th>
            <th>Status</th>
            <th class="text-right">Action</th>
          </tr>
        </thead>

        <tbody>
          <tr v-if="users.length === 0">
            <td colspan="7" class="empty">No user found</td>
          </tr>

          <tr v-for="(user, index) in users" :key="user.user_id">
            <td>{{ index + 1 }}</td>
            <td>{{ user.username }}</td>
            <td>{{ user.full_name || user.name || "-" }}</td>
            <td>{{ user.email || "-" }}</td>
            <td>{{ user.mobile_no || user.phone || "-" }}</td>
            <td>
              <BaseBadge :type="user.status === 'ACTIVE' ? 'success' : 'danger'">
                {{ user.status }}
              </BaseBadge>
            </td>
            <td class="text-right">
              <BaseButton size="sm" variant="secondary" @click="$emit('edit', user)">
                Edit
              </BaseButton>

              <BaseButton size="sm" variant="danger" @click="deleteUser(user.user_id)">
                Delete
              </BaseButton>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </BaseCard>
</template>

<script setup>
import { onMounted, ref } from "vue";
import { userApi } from  "../../services/api";

import BaseButton from "../common/BaseButton.vue";
import BaseCard from "../common/BaseCard.vue";
import BaseBadge from "../common/BaseBadge.vue";
import AlertMessage from "../common/AlertMessage.vue";
import LoadingSpinner from "../common/LoadingSpinner.vue";

defineEmits(["create", "edit"]);

const users = ref([]);
const loading = ref(false);
const message = ref("");

async function loadUsers() {
  loading.value = true;
  message.value = "";

  try {
    const res = await userApi.getAll();
    users.value = res.data.data || [];
  } catch (error) {
    message.value = error.response?.data?.message || "Failed to load users";
  } finally {
    loading.value = false;
  }
}

async function deleteUser(userId) {
  if (!confirm("Are you sure you want to delete this user?")) return;

  try {
    await userApi.delete(userId);
    message.value = "User deleted successfully";
    await loadUsers();
  } catch (error) {
    message.value = error.response?.data?.message || "Failed to delete user";
  }
}

defineExpose({
  loadUsers,
});

onMounted(loadUsers);
</script>

<style scoped>
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 18px;
}

.card-header h2 {
  margin: 0;
  color: #172033;
}

.card-header p {
  margin: 5px 0 0;
  color: #64748b;
}

.table-wrap {
  overflow-x: auto;
}

table {
  width: 100%;
  border-collapse: collapse;
}

th {
  background: #f8fafc;
  color: #334155;
  font-size: 13px;
  text-align: left;
  padding: 14px;
  border-bottom: 1px solid #e5e7eb;
}

td {
  padding: 14px;
  border-bottom: 1px solid #f1f5f9;
  color: #374151;
  font-size: 14px;
}

.empty {
  text-align: center;
  padding: 28px;
  color: #64748b;
}

.text-right {
  text-align: right;
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}
</style>