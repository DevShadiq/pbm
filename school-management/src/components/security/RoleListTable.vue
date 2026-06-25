<template>
  <BaseCard>
    <div class="card-header">
      <div>
        <h2>Role List</h2>
        <p>Manage roles for institution users.</p>
      </div>

      <BaseButton variant="primary" @click="$emit('create')">
        + Add Role
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
            <th>Role Code</th>
            <th>Role Name</th>
            <th>Institution</th>
            <th>System</th>
            <th>Status</th>
            <th class="text-right">Action</th>
          </tr>
        </thead>

        <tbody>
          <tr v-if="roles.length === 0">
            <td colspan="7" class="empty">No role found</td>
          </tr>

          <tr v-for="(role, index) in roles" :key="role.role_id">
            <td>{{ index + 1 }}</td>
            <td>{{ role.role_code }}</td>
            <td>
              <strong>{{ role.role_name }}</strong>
              <small v-if="role.description">{{ role.description }}</small>
            </td>
            <td>{{ role.institution_id }}</td>
            <td>
              <BaseBadge :type="role.is_system_role ? 'success' : 'default'">
                {{ role.is_system_role ? "Yes" : "No" }}
              </BaseBadge>
            </td>
            <td>
              <BaseBadge :type="role.status === 'ACTIVE' ? 'success' : 'danger'">
                {{ role.status }}
              </BaseBadge>
            </td>
            <td class="text-right">
              <BaseButton size="sm" variant="secondary" @click="$emit('edit', role)">
                Edit
              </BaseButton>

              <BaseButton
                size="sm"
                variant="danger"
                :disabled="role.is_system_role"
                @click="deleteRole(role.role_id)"
              >
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
import { roleApi } from "../../services/api";

import BaseButton from "../common/BaseButton.vue";
import BaseCard from "../common/BaseCard.vue";
import BaseBadge from "../common/BaseBadge.vue";
import AlertMessage from "../common/AlertMessage.vue";
import LoadingSpinner from "../common/LoadingSpinner.vue";

defineEmits(["create", "edit"]);

const roles = ref([]);
const loading = ref(false);
const message = ref("");

async function loadRoles() {
  loading.value = true;
  message.value = "";

  try {
    const res = await roleApi.getAll();
    roles.value = res.data.data || [];
  } catch (error) {
    message.value = error.response?.data?.message || "Failed to load roles";
  } finally {
    loading.value = false;
  }
}

async function deleteRole(roleId) {
  if (!confirm("Are you sure you want to delete this role?")) return;

  try {
    await roleApi.delete(roleId);
    message.value = "Role deleted successfully";
    await loadRoles();
  } catch (error) {
    message.value = error.response?.data?.message || "Failed to delete role";
  }
}

defineExpose({
  loadRoles,
});

onMounted(loadRoles);
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

td small {
  display: block;
  margin-top: 3px;
  color: #64748b;
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