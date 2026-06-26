<template>
  <div class="page">
    <div class="page-header">
      <div>
        <h1>{{ isEditMode ? "Edit Menu" : "Create Menu" }}</h1>
        <p>Setup parent menu, route path, icon and visibility.</p>
      </div>

      <RouterLink to="/security/menus">
        <BaseButton variant="secondary">
          Back
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

      <form v-else @submit.prevent="saveMenu">
        <div class="form-grid">
          <BaseSelect
            v-model="form.parent_menu_id"
            label="Parent Menu"
            :options="parentMenuOptions"
            option-label="label"
            option-value="value"
            placeholder="No Parent / Main Menu"
          />

          <BaseInput
            v-model="form.menu_code"
            label="Menu Code"
            placeholder="example: student_admission"
            required
          />

          <BaseInput
            v-model="form.menu_title"
            label="Menu Title"
            placeholder="Example: Student Admission"
            required
          />

          <BaseInput
            v-model="form.route_path"
            label="Route Path"
            placeholder="/students/admission"
          />

          <div class="field icon-field">
            <BaseInput
              v-model="form.icon_name"
              label="Icon Name"
              placeholder="users, menu, shield"
            />

            <div class="icon-picker">
              <div class="selected-icon">
                <MenuIcon :name="form.icon_name" :code="form.menu_code" :title="form.menu_title" />
              </div>

              <button
                v-for="icon in iconOptions"
                :key="icon.value"
                type="button"
                class="icon-option"
                :class="{ selected: form.icon_name === icon.value }"
                :title="icon.label"
                @click="selectIcon(icon.value)"
              >
                <MenuIcon :name="icon.value" :title="icon.label" />
              </button>
            </div>
          </div>

          <BaseInput
            v-model="form.sort_order"
            label="Sort Order"
            type="number"
            placeholder="0"
          />

          <BaseSelect
            v-model="form.status"
            label="Status"
            :options="statusOptions"
            option-label="label"
            option-value="value"
          />

          <div class="field checkbox-field">
            <label class="checkbox-label">
              <input v-model="form.is_visible" type="checkbox" />
              Visible in Sidebar
            </label>
          </div>
        </div>

        <div class="actions">
          <BaseButton type="submit" variant="primary" :disabled="saving">
            {{ saving ? "Saving..." : isEditMode ? "Update Menu" : "Create Menu" }}
          </BaseButton>

          <RouterLink to="/security/menus">
            <BaseButton type="button" variant="secondary">
              Cancel
            </BaseButton>
          </RouterLink>
        </div>
      </form>
    </BaseCard>
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from "vue";
import { RouterLink, useRoute, useRouter } from "vue-router";
import { menuApi } from "../../services/api";

import BaseInput from "../../components/common/BaseInput.vue";
import BaseSelect from "../../components/common/BaseSelect.vue";
import BaseButton from "../../components/common/BaseButton.vue";
import BaseCard from "../../components/common/BaseCard.vue";
import AlertMessage from "../../components/common/AlertMessage.vue";
import LoadingSpinner from "../../components/common/LoadingSpinner.vue";
import MenuIcon from "../../components/common/MenuIcon.vue";

const route = useRoute();
const router = useRouter();

const menuId = computed(() => route.params.id);
const isEditMode = computed(() => Boolean(menuId.value));

const menus = ref([]);
const loading = ref(false);
const saving = ref(false);
const message = ref("");

const statusOptions = [
  { label: "ACTIVE", value: "ACTIVE" },
  { label: "INACTIVE", value: "INACTIVE" },
];

const iconOptions = [
  { label: "Dashboard", value: "dashboard" },
  { label: "Students", value: "students" },
  { label: "Admission", value: "admission" },
  { label: "Users", value: "users" },
  { label: "Roles", value: "role" },
  { label: "Permissions", value: "key" },
  { label: "Menu", value: "menu" },
  { label: "Institution", value: "building" },
  { label: "Master Data", value: "database" },
  { label: "Attendance", value: "attendance" },
  { label: "Fees", value: "fees" },
  { label: "Exam", value: "exam" },
  { label: "Reports", value: "report" },
  { label: "Notice", value: "notice" },
  { label: "Settings", value: "settings" },
];

const form = reactive({
  parent_menu_id: "",
  menu_code: "",
  menu_title: "",
  route_path: "",
  icon_name: "",
  sort_order: 0,
  is_visible: true,
  status: "ACTIVE",
});

const parentMenuOptions = computed(() => {
  return [
    {
      label: "No Parent / Main Menu",
      value: "",
    },
    ...menus.value
      .filter((menu) => Number(menu.menu_id) !== Number(menuId.value))
      .map((menu) => ({
        label: menu.menu_title,
        value: menu.menu_id,
      })),
  ];
});

function fillForm(data) {
  form.parent_menu_id = data.parent_menu_id || "";
  form.menu_code = data.menu_code || "";
  form.menu_title = data.menu_title || "";
  form.route_path = data.route_path || "";
  form.icon_name = data.icon_name || "";
  form.sort_order = data.sort_order || 0;
  form.is_visible = Boolean(data.is_visible);
  form.status = data.status || "ACTIVE";
}

function buildPayload() {
  return {
    parent_menu_id: form.parent_menu_id || null,
    menu_code: form.menu_code,
    menu_title: form.menu_title,
    route_path: form.route_path || null,
    icon_name: form.icon_name || null,
    sort_order: Number(form.sort_order || 0),
    is_visible: Boolean(form.is_visible),
    status: form.status,
  };
}

function selectIcon(iconName) {
  form.icon_name = iconName;
}

async function loadMenus() {
  const res = await menuApi.getAll();
  menus.value = res.data.data || [];
}

async function loadMenuForEdit() {
  if (!isEditMode.value) return;

  const res = await menuApi.getById(menuId.value);
  fillForm(res.data.data);
}

async function loadData() {
  loading.value = true;
  message.value = "";

  try {
    await loadMenus();
    await loadMenuForEdit();
  } catch (error) {
    message.value = error.response?.data?.message || "Failed to load menu information";
  } finally {
    loading.value = false;
  }
}

async function saveMenu() {
  saving.value = true;
  message.value = "";

  try {
    const payload = buildPayload();

    if (isEditMode.value) {
      await menuApi.update(menuId.value, payload);
    } else {
      await menuApi.create(payload);
    }

    router.push("/security/menus");
  } catch (error) {
    message.value = error.response?.data?.message || "Failed to save menu";
  } finally {
    saving.value = false;
  }
}

onMounted(loadData);
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

.form-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 18px;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 7px;
}

.checkbox-field {
  justify-content: end;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 9px;
  height: 44px;
  color: #334155;
  font-weight: 700;
}

.checkbox-label input {
  width: 17px;
  height: 17px;
}

.icon-field {
  gap: 10px;
}

.icon-picker {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.selected-icon,
.icon-option {
  width: 38px;
  height: 38px;
  border-radius: 10px;
  display: grid;
  place-items: center;
  color: #1d4ed8;
  background: #eff6ff;
  box-shadow: inset 0 0 0 1px #bfdbfe;
}

.selected-icon {
  color: #ffffff;
  background: #1d4ed8;
  box-shadow: 0 10px 18px rgba(29, 78, 216, 0.22);
}

.icon-option {
  border: 0;
  transition: background 0.2s ease, color 0.2s ease, transform 0.2s ease;
}

.icon-option:hover,
.icon-option.selected {
  color: #ffffff;
  background: #2563eb;
  transform: translateY(-1px);
}

.actions {
  display: flex;
  gap: 12px;
  margin-top: 24px;
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

  .form-grid {
    grid-template-columns: 1fr;
  }
}
</style>
