<template>
  <BaseCard>
    <div class="card-header">
      <div>
        <h2>Permission Matrix</h2>
        <p>Assign module permissions to selected role.</p>
      </div>
    </div>

    <AlertMessage
      v-if="message"
      type="info"
      :message="message"
    />

    <div class="filter-row">
      <BaseSelect
        v-model="selectedRoleId"
        label="Select Role"
        :options="roleOptions"
        option-label="label"
        option-value="value"
        placeholder="Select Role"
        @change="loadRolePermissions"
      />

      <BaseButton
        variant="primary"
        :disabled="!selectedRoleId || saving"
        @click="savePermissions"
      >
        {{ saving ? "Saving..." : "Save Permissions" }}
      </BaseButton>
    </div>

    <LoadingSpinner v-if="loading" />

    <div v-else-if="!selectedRoleId" class="empty-box">
      Please select a role to manage permissions.
    </div>

    <div v-else class="matrix-wrap">
      <div
        v-for="group in groupedPermissions"
        :key="group.module_name"
        class="module-block"
      >
        <div class="module-title">
          {{ group.module_name }}
        </div>

        <div class="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Permission</th>
                <th>Code</th>
                <th>View</th>
                <th>Create</th>
                <th>Update</th>
                <th>Delete</th>
                <th>Approve</th>
              </tr>
            </thead>

            <tbody>
              <tr v-for="permission in group.items" :key="permission.permission_id">
                <td>
                  <strong>{{ permission.permission_name }}</strong>
                  <small v-if="permission.description">
                    {{ permission.description }}
                  </small>
                </td>
                <td>{{ permission.permission_code }}</td>
                <td>
                  <input v-model="matrix[permission.permission_id].can_view" type="checkbox" />
                </td>
                <td>
                  <input v-model="matrix[permission.permission_id].can_create" type="checkbox" />
                </td>
                <td>
                  <input v-model="matrix[permission.permission_id].can_update" type="checkbox" />
                </td>
                <td>
                  <input v-model="matrix[permission.permission_id].can_delete" type="checkbox" />
                </td>
                <td>
                  <input v-model="matrix[permission.permission_id].can_approve" type="checkbox" />
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </BaseCard>
</template>

<script setup>
import { computed, onMounted, reactive, ref, watch } from "vue";
import api, { permissionApi, roleApi } from "../../services/api";

import BaseSelect from "../common/BaseSelect.vue";
import BaseButton from "../common/BaseButton.vue";
import BaseCard from "../common/BaseCard.vue";
import AlertMessage from "../common/AlertMessage.vue";
import LoadingSpinner from "../common/LoadingSpinner.vue";

const roles = ref([]);
const permissions = ref([]);
const selectedRoleId = ref("");
const saving = ref(false);
const loading = ref(false);
const message = ref("");
const matrix = reactive({});

const roleOptions = computed(() => {
  return roles.value.map((role) => ({
    label: `${role.role_name} - ${role.role_code}`,
    value: role.role_id,
  }));
});

const groupedPermissions = computed(() => {
  const groups = {};

  permissions.value.forEach((item) => {
    const moduleName = item.module_name || "General";

    if (!groups[moduleName]) {
      groups[moduleName] = [];
    }

    groups[moduleName].push(item);
  });

  return Object.keys(groups).map((moduleName) => ({
    module_name: moduleName,
    items: groups[moduleName],
  }));
});

function initMatrix() {
  permissions.value.forEach((permission) => {
    matrix[permission.permission_id] = {
      permission_id: permission.permission_id,
      can_view: false,
      can_create: false,
      can_update: false,
      can_delete: false,
      can_approve: false,
    };
  });
}

async function loadInitialData() {
  loading.value = true;

  try {
    const [roleRes, permissionRes] = await Promise.all([
      roleApi.getAll(),
      permissionApi.getAll(),
    ]);

    roles.value = roleRes.data.data || [];
    permissions.value = permissionRes.data.data || [];

    initMatrix();
  } catch (error) {
    message.value = error.response?.data?.message || "Failed to load permissions";
  } finally {
    loading.value = false;
  }
}

async function loadRolePermissions() {
  initMatrix();

  if (!selectedRoleId.value) return;

  try {
    const res = await permissionApi.getByRole(selectedRoleId.value);
    const assigned = res.data.data || [];

    assigned.forEach((item) => {
      if (matrix[item.permission_id]) {
        matrix[item.permission_id].can_view = Boolean(item.can_view);
        matrix[item.permission_id].can_create = Boolean(item.can_create);
        matrix[item.permission_id].can_update = Boolean(item.can_update);
        matrix[item.permission_id].can_delete = Boolean(item.can_delete);
        matrix[item.permission_id].can_approve = Boolean(item.can_approve);
      }
    });
  } catch (error) {
    message.value = error.response?.data?.message || "Failed to load role permissions";
  }
}

async function savePermissions() {
  saving.value = true;
  message.value = "";

  try {
    const permissionsData = Object.values(matrix).filter((item) => {
      return (
        item.can_view ||
        item.can_create ||
        item.can_update ||
        item.can_delete ||
        item.can_approve
      );
    });

    await permissionApi.saveRolePermissions(selectedRoleId.value, {
      permissions: permissionsData,
    });

    const accessRes = await api.get("/security/me/access");
    localStorage.setItem("sms_menus", JSON.stringify(accessRes.data.data.menus || []));
    localStorage.setItem(
      "sms_permissions",
      JSON.stringify(accessRes.data.data.permissions || {})
    );

    message.value = "Permissions saved successfully";
  } catch (error) {
    message.value = error.response?.data?.message || "Failed to save permissions";
  } finally {
    saving.value = false;
  }
}

watch(selectedRoleId, loadRolePermissions);

onMounted(loadInitialData);
</script>

<style scoped>
.card-header {
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

.filter-row {
  display: grid;
  grid-template-columns: minmax(260px, 360px) auto;
  gap: 14px;
  align-items: end;
  margin-bottom: 18px;
}

.empty-box {
  padding: 25px;
  border: 1px dashed #cbd5e1;
  border-radius: 14px;
  text-align: center;
  color: #64748b;
}

.module-block {
  margin-top: 18px;
  border: 1px solid #e5e7eb;
  border-radius: 14px;
  overflow: hidden;
}

.module-title {
  background: #f8fafc;
  padding: 13px 15px;
  font-weight: 800;
  color: #172033;
}

.table-wrap {
  overflow-x: auto;
}

table {
  width: 100%;
  border-collapse: collapse;
}

th {
  font-size: 13px;
  text-align: left;
  padding: 13px;
  background: #ffffff;
  border-bottom: 1px solid #e5e7eb;
}

td {
  padding: 13px;
  border-bottom: 1px solid #f1f5f9;
  color: #374151;
  font-size: 14px;
}

td small {
  display: block;
  color: #64748b;
  margin-top: 3px;
}

input[type="checkbox"] {
  width: 17px;
  height: 17px;
}

@media (max-width: 768px) {
  .filter-row {
    grid-template-columns: 1fr;
  }
}
</style>
