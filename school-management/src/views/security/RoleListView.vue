<template>
  <div class="page">
    <div class="page-header">
      <div>
        <h1>Role Setup</h1>
        <p>Create, edit and manage user roles.</p>
      </div>

      <RouterLink to="/security/roles/create">
        <BaseButton variant="primary">
          + Add Role
        </BaseButton>
      </RouterLink>
    </div>

    <BaseCard>
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
              <th>Description</th>
              <th>System Role</th>
              <th>Status</th>
              <th class="text-right">Action</th>
            </tr>
          </thead>

          <tbody>
            <tr v-if="roles.length === 0">
              <td colspan="8" class="empty">No role found</td>
            </tr>

            <tr v-for="(role, index) in roles" :key="role.role_id">
              <td>{{ index + 1 }}</td>

              <td>
                <strong>{{ role.role_code }}</strong>
              </td>

              <td>{{ role.role_name }}</td>

              <td>
                {{ role.institution_name || role.institution_id || "-" }}
              </td>

              <td>{{ role.description || "-" }}</td>

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
                <RouterLink :to="`/security/roles/${role.role_id}/edit`">
                  <BaseButton size="sm" variant="secondary">
                    Edit
                  </BaseButton>
                </RouterLink>

                <BaseButton
                  size="sm"
                  variant="danger"
                  :disabled="role.is_system_role"
                  @click="deleteRole(role)"
                >
                  Delete
                </BaseButton>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </BaseCard>
  </div>
</template>

<script setup>
import { onMounted, ref } from "vue";
import { RouterLink } from "vue-router";
import { roleApi } from "../../services/api";

import BaseButton from "../../components/common/BaseButton.vue";
import BaseCard from "../../components/common/BaseCard.vue";
import BaseBadge from "../../components/common/BaseBadge.vue";
import AlertMessage from "../../components/common/AlertMessage.vue";
import LoadingSpinner from "../../components/common/LoadingSpinner.vue";

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

async function deleteRole(role) {
  if (role.is_system_role) {
    message.value = "System role cannot be deleted";
    return;
  }

  const confirmDelete = confirm(
    `Are you sure you want to delete role "${role.role_name}"?`
  );

  if (!confirmDelete) return;

  try {
    await roleApi.delete(role.role_id);
    message.value = "Role deleted successfully";
    await loadRoles();
  } catch (error) {
    message.value = error.response?.data?.message || "Failed to delete role";
  }
}

onMounted(loadRoles);
</script>

<style scoped>
.page {
  padding: 24px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 18px;
}

.page-header h1 {
  margin: 0;
  color: #172033;
  font-size: 28px;
}

.page-header p {
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
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}

a {
  text-decoration: none;
}

@media (max-width: 768px) {
  .page-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }
}
</style>