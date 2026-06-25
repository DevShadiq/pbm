<template>
  <BaseCard>
    <div class="card-header">
      <div>
        <h2>Menu Permission Tree</h2>
        <p>Assign sidebar menu access to selected role.</p>
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
      />

      <BaseButton
        variant="primary"
        :disabled="!selectedRoleId || saving"
        @click="saveRoleMenus"
      >
        {{ saving ? "Saving..." : "Save Menu Access" }}
      </BaseButton>
    </div>

    <LoadingSpinner v-if="loading" />

    <div v-else-if="!selectedRoleId" class="empty-box">
      Please select a role to manage menu access.
    </div>

    <div v-else class="tree-box">
      <div class="tree-toolbar">
        <BaseButton variant="secondary" size="sm" @click="selectAll">
          Select All
        </BaseButton>

        <BaseButton variant="secondary" size="sm" @click="clearAll">
          Clear All
        </BaseButton>
      </div>

      <div
        v-for="menu in flatMenus"
        :key="menu.menu_id"
        class="menu-row"
        :style="{ paddingLeft: `${menu.level * 24 + 14}px` }"
      >
        <label class="menu-check">
          <input
            type="checkbox"
            :checked="selectedMenuIds.includes(menu.menu_id)"
            @change="toggleMenu(menu.menu_id, $event.target.checked)"
          />

          <span class="menu-title">{{ menu.menu_title }}</span>

          <BaseBadge type="info">
            {{ menu.menu_code }}
          </BaseBadge>

          <span v-if="menu.route_path" class="menu-route">
            {{ menu.route_path }}
          </span>
        </label>
      </div>
    </div>
  </BaseCard>
</template>

<script setup>
import { computed, onMounted, ref, watch } from "vue";
// import { roleApi, roleMenuApi } from "../../api/api";
import api, {  roleApi, roleMenuApi } from "../../services/api";

import BaseSelect from "../common/BaseSelect.vue";
import BaseButton from "../common/BaseButton.vue";
import BaseCard from "../common/BaseCard.vue";
import BaseBadge from "../common/BaseBadge.vue";
import AlertMessage from "../common/AlertMessage.vue";
import LoadingSpinner from "../common/LoadingSpinner.vue";

const roles = ref([]);
const menus = ref([]);
const selectedRoleId = ref("");
const selectedMenuIds = ref([]);
const saving = ref(false);
const loading = ref(false);
const message = ref("");

const roleOptions = computed(() => {
  return roles.value.map((role) => ({
    label: `${role.role_name} - ${role.role_code}`,
    value: role.role_id,
  }));
});

const flatMenus = computed(() => {
  const result = [];

  function walk(items, level = 0) {
    items.forEach((item) => {
      result.push({
        ...item,
        level,
      });

      if (item.children && item.children.length) {
        walk(item.children, level + 1);
      }
    });
  }

  walk(menus.value);
  return result;
});

const menuById = computed(() => {
  const map = {};
  flatMenus.value.forEach((menu) => {
    map[menu.menu_id] = menu;
  });
  return map;
});

const childIdsByParent = computed(() => {
  const map = {};

  flatMenus.value.forEach((menu) => {
    if (!menu.parent_menu_id) return;

    if (!map[menu.parent_menu_id]) {
      map[menu.parent_menu_id] = [];
    }

    map[menu.parent_menu_id].push(menu.menu_id);
  });

  return map;
});

function getDescendantIds(menuId) {
  const children = childIdsByParent.value[menuId] || [];

  return children.flatMap((childId) => [
    childId,
    ...getDescendantIds(childId),
  ]);
}

function getAncestorIds(menuId) {
  const ancestors = [];
  let current = menuById.value[menuId];

  while (current?.parent_menu_id) {
    ancestors.push(current.parent_menu_id);
    current = menuById.value[current.parent_menu_id];
  }

  return ancestors;
}

function setSelected(ids) {
  selectedMenuIds.value = Array.from(new Set(ids));
}

async function loadInitialData() {
  loading.value = true;

  try {
    const [roleRes, menuRes] = await Promise.all([
      roleApi.getAll(),
      roleMenuApi.getMenus(),
    ]);

    roles.value = roleRes.data.data || [];
    menus.value = menuRes.data.data || [];
  } catch (error) {
    message.value = error.response?.data?.message || "Failed to load menu tree";
  } finally {
    loading.value = false;
  }
}

async function loadRoleMenus() {
  selectedMenuIds.value = [];

  if (!selectedRoleId.value) return;

  try {
    const res = await roleMenuApi.getByRole(selectedRoleId.value);
    const assignedMenus = res.data.data || [];

    selectedMenuIds.value = assignedMenus
      .filter((item) => item.can_access)
      .map((item) => item.menu_id);
  } catch (error) {
    message.value = error.response?.data?.message || "Failed to load role menus";
  }
}

function toggleMenu(menuId, checked) {
  const relatedIds = [menuId, ...getDescendantIds(menuId)];

  if (checked) {
    setSelected([
      ...selectedMenuIds.value,
      ...relatedIds,
      ...getAncestorIds(menuId),
    ]);
  } else {
    selectedMenuIds.value = selectedMenuIds.value.filter((id) => !relatedIds.includes(id));
  }
}

function selectAll() {
  selectedMenuIds.value = flatMenus.value.map((item) => item.menu_id);
}

function clearAll() {
  selectedMenuIds.value = [];
}

async function saveRoleMenus() {
  saving.value = true;
  message.value = "";

  try {
    await roleMenuApi.saveRoleMenus(selectedRoleId.value, {
      menus: selectedMenuIds.value.map((menuId) => ({
        menu_id: menuId,
        can_access: true,
      })),
    });

    const accessRes = await api.get("/security/me/access");
    localStorage.setItem("sms_menus", JSON.stringify(accessRes.data.data.menus || []));
    localStorage.setItem("sms_permissions", JSON.stringify(accessRes.data.data.permissions || {}));

    message.value = "Menu access saved successfully";
  } catch (error) {
    message.value = error.response?.data?.message || "Failed to save menu access";
  } finally {
    saving.value = false;
  }
}

watch(selectedRoleId, loadRoleMenus);

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

.tree-box {
  border: 1px solid #e5e7eb;
  border-radius: 14px;
  overflow: hidden;
}

.tree-toolbar {
  display: flex;
  gap: 10px;
  padding: 12px;
  background: #f8fafc;
  border-bottom: 1px solid #e5e7eb;
}

.menu-row {
  border-bottom: 1px solid #f1f5f9;
  padding-top: 12px;
  padding-bottom: 12px;
}

.menu-row:last-child {
  border-bottom: none;
}

.menu-check {
  display: flex;
  align-items: center;
  gap: 10px;
  font-weight: 600;
}

.menu-check input {
  width: 17px;
  height: 17px;
}

.menu-title {
  color: #172033;
}

.menu-route {
  color: #64748b;
  font-size: 13px;
}

@media (max-width: 768px) {
  .filter-row {
    grid-template-columns: 1fr;
  }

  .menu-check {
    flex-wrap: wrap;
  }
}
</style>
