<template>
  <BaseCard>
    <div class="card-header">
      <div>
        <h2>User Role Assign</h2>
        <p>Assign role and branch access to users.</p>
      </div>
    </div>

    <AlertMessage
      v-if="message"
      type="info"
      :message="message"
    />

    <form class="assign-form" @submit.prevent="assignRole">
      <BaseSelect
        v-model="form.user_id"
        label="User"
        :options="userOptions"
        option-label="label"
        option-value="value"
        placeholder="Select User"
        required
      />

      <BaseSelect
        v-model="form.role_id"
        label="Role"
        :options="roleOptions"
        option-label="label"
        option-value="value"
        placeholder="Select Role"
        required
      />

      <BaseSelect
        v-model="form.branch_id"
        label="Branch"
        :options="branchOptions"
        option-label="label"
        option-value="value"
        placeholder="All / No Branch"
      />

      <div class="action-field">
        <BaseButton type="submit" variant="primary" :disabled="saving">
          {{ saving ? "Assigning..." : "Assign Role" }}
        </BaseButton>
      </div>
    </form>

    <LoadingSpinner v-if="loading" />

    <div v-else class="assigned-box">
      <h3>Assigned Roles</h3>

      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>SL</th>
              <th>Role</th>
              <th>Branch</th>
              <th>Assigned At</th>
              <th class="text-right">Action</th>
            </tr>
          </thead>

          <tbody>
            <tr v-if="!form.user_id">
              <td colspan="5" class="empty">Select a user to view assigned roles.</td>
            </tr>

            <tr v-else-if="assignedRoles.length === 0">
              <td colspan="5" class="empty">No role assigned.</td>
            </tr>

            <tr
              v-for="(item, index) in assignedRoles"
              :key="`${item.user_id}-${item.role_id}-${item.branch_id}`"
            >
              <td>{{ index + 1 }}</td>
              <td>{{ item.role_name || item.role_id }}</td>
              <td>{{ item.branch_name || item.branch_id || "All / No Branch" }}</td>
              <td>{{ formatDate(item.assigned_at) }}</td>
              <td class="text-right">
                <BaseButton size="sm" variant="danger" @click="removeRole(item)">
                  Remove
                </BaseButton>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </BaseCard>
</template>

<script setup>
import { computed, onMounted, reactive, ref, watch } from "vue";
// import { userRoleApi } from "../../api/api";
import api, { userRoleApi } from "../../services/api";

import BaseSelect from "../common/BaseSelect.vue";
import BaseButton from "../common/BaseButton.vue";
import BaseCard from "../common/BaseCard.vue";
import AlertMessage from "../common/AlertMessage.vue";
import LoadingSpinner from "../common/LoadingSpinner.vue";
import { formatDateForDisplay } from "../../utils/dateFormat";

const users = ref([]);
const roles = ref([]);
const branches = ref([]);
const assignedRoles = ref([]);

const saving = ref(false);
const loading = ref(false);
const message = ref("");

const form = reactive({
  user_id: "",
  role_id: "",
  branch_id: "",
});

const userOptions = computed(() => {
  return users.value.map((user) => ({
    label: `${user.full_name || user.name || user.username} - ${user.username}`,
    value: user.user_id,
  }));
});

const roleOptions = computed(() => {
  return roles.value.map((role) => ({
    label: `${role.role_name} - ${role.role_code}`,
    value: role.role_id,
  }));
});

const branchOptions = computed(() => {
  return [
    { label: "All / No Branch", value: "" },
    ...branches.value.map((branch) => ({
      label: branch.branch_name || branch.name,
      value: branch.branch_id,
    })),
  ];
});

function formatDate(value) {
  return formatDateForDisplay(value, "-");
}

async function refreshCurrentAccess() {
  const currentUser = JSON.parse(localStorage.getItem("sms_user") || "null");

  if (!currentUser || String(currentUser.user_id) !== String(form.user_id)) {
    return;
  }

  const accessRes = await api.get("/security/me/access");
  localStorage.setItem("sms_menus", JSON.stringify(accessRes.data.data.menus || []));
  localStorage.setItem("sms_permissions", JSON.stringify(accessRes.data.data.permissions || {}));
}

async function loadInitialData() {
  loading.value = true;

  try {
    const [userRes, roleRes, branchRes] = await Promise.all([
      userRoleApi.getUsers(),
      userRoleApi.getRoles(),
      userRoleApi.getBranches(),
    ]);

    users.value = userRes.data.data || userRes.data.users || [];
    roles.value = roleRes.data.data || [];
    branches.value = branchRes.data.data || [];
  } catch (error) {
    message.value = error.response?.data?.message || "Failed to load assign data";
  } finally {
    loading.value = false;
  }
}

async function loadUserRoles() {
  assignedRoles.value = [];

  if (!form.user_id) return;

  try {
    const res = await userRoleApi.getByUser(form.user_id);
    assignedRoles.value = res.data.data || [];
  } catch (error) {
    message.value = error.response?.data?.message || "Failed to load user roles";
  }
}

async function assignRole() {
  saving.value = true;
  message.value = "";

  try {
    await userRoleApi.assign({
      user_id: form.user_id,
      role_id: form.role_id,
      branch_id: form.branch_id || null,
    });

    message.value = "Role assigned successfully";
    form.role_id = "";
    form.branch_id = "";
    await loadUserRoles();
    await refreshCurrentAccess();
  } catch (error) {
    message.value = error.response?.data?.message || "Failed to assign role";
  } finally {
    saving.value = false;
  }
}

async function removeRole(item) {
  if (!confirm("Remove this role from user?")) return;

  try {
    await userRoleApi.remove({
      user_id: item.user_id,
      role_id: item.role_id,
      branch_id: item.branch_id || null,
    });

    message.value = "Role removed successfully";
    await loadUserRoles();
    await refreshCurrentAccess();
  } catch (error) {
    message.value = error.response?.data?.message || "Failed to remove role";
  }
}

watch(
  () => form.user_id,
  () => {
    loadUserRoles();
  }
);

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

.assign-form {
  display: grid;
  grid-template-columns: 1.3fr 1.2fr 1fr auto;
  gap: 14px;
  align-items: end;
  margin-bottom: 24px;
}

.action-field {
  display: flex;
  align-items: end;
}

.assigned-box h3 {
  margin: 0 0 12px;
  color: #172033;
}

.table-wrap {
  overflow-x: auto;
  border: 1px solid #e5e7eb;
  border-radius: 14px;
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
}

@media (max-width: 992px) {
  .assign-form {
    grid-template-columns: 1fr;
  }
}
</style>
