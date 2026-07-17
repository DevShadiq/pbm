<template>
  <div class="page">
    <div class="page-header">
      <div>
        <h1>Menu Setup</h1>
        <p>Create, edit and manage application sidebar menus.</p>
      </div>

      <RouterLink to="/security/menus/create">
        <BaseButton variant="primary">
          + Add Menu
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
              <th>Menu Title</th>
              <th>Code</th>
              <th>Parent</th>
              <th>Route</th>
              <th>Icon</th>
              <th>Sort</th>
              <th>Visible</th>
              <th>Status</th>
              <th class="text-right">Action</th>
            </tr>
          </thead>

          <tbody>
            <tr v-if="menus.length === 0">
              <td colspan="10" class="empty">No menu found</td>
            </tr>

            <tr v-for="(menu, index) in menus" :key="menu.menu_id">
              <td>{{ index + 1 }}</td>

              <td>
                <strong>{{ menu.menu_title }}</strong>
              </td>

              <td>{{ menu.menu_code }}</td>
              <td>{{ menu.parent_menu_title || "-" }}</td>
              <td>{{ menu.route_path || "-" }}</td>
              <td>
                <div class="icon-cell">
                  <span class="icon-preview">
                    <MenuIcon :name="menu.icon_name" :code="menu.menu_code" :title="menu.menu_title" />
                  </span>
                  <span>{{ menu.icon_name || "auto" }}</span>
                </div>
              </td>
              <td>{{ menu.sort_order }}</td>

              <td>
                <BaseBadge :type="menu.is_visible ? 'success' : 'danger'">
                  {{ menu.is_visible ? "Yes" : "No" }}
                </BaseBadge>
              </td>

              <td>
                <BaseBadge :type="menu.status === 'ACTIVE' ? 'success' : 'danger'">
                  {{ menu.status }}
                </BaseBadge>
              </td>

              <td class="text-right">
                <RouterLink :to="`/security/menus/${menu.menu_id}/edit`">
                  <BaseButton size="sm" variant="secondary">
                    Edit
                  </BaseButton>
                </RouterLink>

                <BaseButton
                  size="sm"
                  variant="danger"
                  @click="deleteMenu(menu.menu_id)"
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
import { menuApi } from "../../services/api";

import BaseButton from "../../components/common/BaseButton.vue";
import BaseCard from "../../components/common/BaseCard.vue";
import BaseBadge from "../../components/common/BaseBadge.vue";
import AlertMessage from "../../components/common/AlertMessage.vue";
import LoadingSpinner from "../../components/common/LoadingSpinner.vue";
import MenuIcon from "../../components/common/MenuIcon.vue";

const menus = ref([]);
const loading = ref(false);
const message = ref("");

async function loadMenus() {
  loading.value = true;
  message.value = "";

  try {
    const res = await menuApi.getAll();
    menus.value = res.data.data || [];
  } catch (error) {
    message.value = error.response?.data?.message || "Failed to load menus";
  } finally {
    loading.value = false;
  }
}

async function deleteMenu(menuId) {
  if (!confirm("Are you sure you want to delete this menu?")) return;

  try {
    await menuApi.delete(menuId);
    message.value = "Menu deleted successfully";
    await loadMenus();
  } catch (error) {
    message.value = error.response?.data?.message || "Failed to delete menu";
  }
}

onMounted(loadMenus);
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

.icon-cell {
  display: inline-flex;
  align-items: center;
  gap: 9px;
  color: #475569;
  font-weight: 700;
}

.icon-preview {
  width: 34px;
  height: 34px;
  border-radius: 10px;
  display: grid;
  place-items: center;
  color: #1d4ed8;
  background: #eff6ff;
  box-shadow: inset 0 0 0 1px #bfdbfe;
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
