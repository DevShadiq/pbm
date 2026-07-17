<template>
  <div class="page">
    <div class="page-header">
      <h1>Security Setup</h1>
      <p>User, role, permission and menu access management.</p>
    </div>

    <div class="tabs">
      <button
        v-for="tab in tabs"
        :key="tab.key"
        :class="{ active: activeTab === tab.key }"
        type="button"
        @click="activeTab = tab.key"
      >
        {{ tab.label }}
      </button>
    </div>

    <div v-if="activeTab === 'users'" class="section">
      <UserForm
        v-if="showUserForm"
        :user-id="selectedUserId"
        @saved="afterUserSaved"
      />

      <UserListTable
        ref="userListRef"
        @create="createUser"
        @edit="editUser"
      />
    </div>

    <div v-if="activeTab === 'roles'" class="section">
      <RoleForm
        v-if="showRoleForm"
        :role-id="selectedRoleId"
        @saved="afterRoleSaved"
      />

      <RoleListTable
        ref="roleListRef"
        @create="createRole"
        @edit="editRole"
      />
    </div>

    <div v-if="activeTab === 'permissions'" class="section">
      <PermissionMatrix />
    </div>

    <div v-if="activeTab === 'menus'" class="section">
      <MenuPermissionTree />
    </div>

    <div v-if="activeTab === 'userRoles'" class="section">
      <UserRoleAssignForm />
    </div>
  </div>
</template>

<script setup>
import { ref } from "vue";

import UserForm from "../../components/security/UserForm.vue";
import UserListTable from "../../components/security/UserListTable.vue";
import RoleForm from "../../components/security/RoleForm.vue";
import RoleListTable from "../../components/security/RoleListTable.vue";
import PermissionMatrix from "../../components/security/PermissionMatrix.vue";
import MenuPermissionTree from "../../components/security/MenuPermissionTree.vue";
import UserRoleAssignForm from "../../components/security/UserRoleAssignForm.vue";

const activeTab = ref("users");

const tabs = [
  { key: "users", label: "Users" },
  { key: "roles", label: "Roles" },
  { key: "permissions", label: "Permissions" },
  { key: "menus", label: "Menu Access" },
  { key: "userRoles", label: "User Role Assign" },
];

const userListRef = ref(null);
const roleListRef = ref(null);

const showUserForm = ref(false);
const selectedUserId = ref(null);

const showRoleForm = ref(false);
const selectedRoleId = ref(null);

function createUser() {
  selectedUserId.value = null;
  showUserForm.value = true;
}

function editUser(user) {
  selectedUserId.value = user.user_id;
  showUserForm.value = true;
}

function afterUserSaved() {
  showUserForm.value = false;
  selectedUserId.value = null;
  userListRef.value?.loadUsers();
}

function createRole() {
  selectedRoleId.value = null;
  showRoleForm.value = true;
}

function editRole(role) {
  selectedRoleId.value = role.role_id;
  showRoleForm.value = true;
}

function afterRoleSaved() {
  showRoleForm.value = false;
  selectedRoleId.value = null;
  roleListRef.value?.loadRoles();
}
</script>

<style scoped>
.page {
  padding: 24px;
}

.page-header {
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

.tabs {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-bottom: 18px;
}

.tabs button {
  border: none;
  padding: 10px 16px;
  border-radius: 999px;
  background: #e5e7eb;
  color: #374151;
  font-weight: 700;
  cursor: pointer;
}

.tabs button.active {
  background: #2563eb;
  color: #ffffff;
}

.section {
  display: grid;
  gap: 18px;
}
</style>