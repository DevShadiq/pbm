<template>
  <div class="access-page">
    <div class="access-header">
      <div>
        <h1>Role Access Control</h1>
        <p>Role permissions, sidebar access, and user role assignment.</p>
      </div>
    </div>

    <div class="access-tabs">
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

    <PermissionMatrix v-if="activeTab === 'permissions'" />
    <MenuPermissionTree v-if="activeTab === 'menus'" />
    <UserRoleAssignForm v-if="activeTab === 'users'" />
  </div>
</template>

<script setup>
import { ref } from "vue";
import PermissionMatrix from "../../components/security/PermissionMatrix.vue";
import MenuPermissionTree from "../../components/security/MenuPermissionTree.vue";
import UserRoleAssignForm from "../../components/security/UserRoleAssignForm.vue";

const activeTab = ref("permissions");

const tabs = [
  { key: "permissions", label: "Permissions" },
  { key: "menus", label: "Menu Access" },
  { key: "users", label: "User Roles" },
];
</script>

<style scoped>
.access-page {
  display: grid;
  gap: 18px;
}

.access-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 16px;
}

.access-header h1 {
  margin: 0;
  color: #0f172a;
  font-size: 28px;
}

.access-header p {
  margin: 6px 0 0;
  color: #64748b;
}

.access-tabs {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  padding: 6px;
  width: fit-content;
  border: 1px solid #dbe3ef;
  border-radius: 8px;
  background: #ffffff;
}

.access-tabs button {
  border: 0;
  border-radius: 6px;
  padding: 10px 14px;
  background: transparent;
  color: #475569;
  font-weight: 800;
}

.access-tabs button.active {
  color: #ffffff;
  background: #2563eb;
}
</style>
