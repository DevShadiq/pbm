<template>
  <div class="page">
    <div class="page-header">
      <div>
        <h1>{{ isEditMode ? "Edit Role" : "Create Role" }}</h1>
        <p>Setup role code, role name, institution and status.</p>
      </div>

      <RouterLink to="/security/roles">
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

      <form v-else @submit.prevent="saveRole">
        <div class="form-grid">
          <BaseInput
            v-model="form.institution_id"
            label="Institution ID"
            type="number"
            placeholder="Institution ID"
            required
          />

          <BaseInput
            v-model="form.role_code"
            label="Role Code"
            placeholder="ADMIN"
            required
          />

          <BaseInput
            v-model="form.role_name"
            label="Role Name"
            placeholder="Administrator"
            required
          />

          <BaseSelect
            v-model="form.status"
            label="Status"
            :options="statusOptions"
            option-label="label"
            option-value="value"
          />

          <div class="field full">
            <label>Description</label>
            <textarea
              v-model="form.description"
              rows="4"
              placeholder="Role description"
            ></textarea>
          </div>

          <div class="field full">
            <label class="checkbox-label">
              <input v-model="form.is_system_role" type="checkbox" />
              System Role
            </label>
          </div>
        </div>

        <div class="actions">
          <BaseButton type="submit" variant="primary" :disabled="saving">
            {{ saving ? "Saving..." : isEditMode ? "Update Role" : "Create Role" }}
          </BaseButton>

          <RouterLink to="/security/roles">
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
import { roleApi } from "../../services/api";

import BaseInput from "../../components/common/BaseInput.vue";
import BaseSelect from "../../components/common/BaseSelect.vue";
import BaseButton from "../../components/common/BaseButton.vue";
import BaseCard from "../../components/common/BaseCard.vue";
import AlertMessage from "../../components/common/AlertMessage.vue";
import LoadingSpinner from "../../components/common/LoadingSpinner.vue";

const route = useRoute();
const router = useRouter();

const roleId = computed(() => route.params.id);
const isEditMode = computed(() => Boolean(roleId.value));

const loading = ref(false);
const saving = ref(false);
const message = ref("");

const statusOptions = [
  { label: "ACTIVE", value: "ACTIVE" },
  { label: "INACTIVE", value: "INACTIVE" },
];

const form = reactive({
  institution_id: "",
  role_code: "",
  role_name: "",
  description: "",
  is_system_role: false,
  status: "ACTIVE",
});

function fillForm(data) {
  form.institution_id = data.institution_id || "";
  form.role_code = data.role_code || "";
  form.role_name = data.role_name || "";
  form.description = data.description || "";
  form.is_system_role = Boolean(data.is_system_role);
  form.status = data.status || "ACTIVE";
}

function buildPayload() {
  return {
    institution_id: form.institution_id,
    role_code: form.role_code.trim().toUpperCase(),
    role_name: form.role_name.trim(),
    description: form.description || null,
    is_system_role: Boolean(form.is_system_role),
    status: form.status,
  };
}

async function loadRole() {
  if (!isEditMode.value) return;

  loading.value = true;
  message.value = "";

  try {
    const res = await roleApi.getById(roleId.value);
    fillForm(res.data.data);
  } catch (error) {
    message.value = error.response?.data?.message || "Failed to load role";
  } finally {
    loading.value = false;
  }
}

async function saveRole() {
  saving.value = true;
  message.value = "";

  try {
    const payload = buildPayload();

    if (isEditMode.value) {
      await roleApi.update(roleId.value, payload);
    } else {
      await roleApi.create(payload);
    }

    router.push("/security/roles");
  } catch (error) {
    message.value = error.response?.data?.message || "Failed to save role";
  } finally {
    saving.value = false;
  }
}

onMounted(loadRole);
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

.field.full {
  grid-column: 1 / -1;
}

.field label {
  font-size: 14px;
  font-weight: 700;
  color: #334155;
}

textarea {
  border: 1px solid #dbe3ef;
  border-radius: 12px;
  padding: 12px 13px;
  outline: none;
  resize: vertical;
  font-size: 14px;
}

textarea:focus {
  border-color: #2563eb;
  box-shadow: 0 0 0 4px rgba(37, 99, 235, 0.1);
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 9px;
  color: #334155;
  font-weight: 700;
}

.checkbox-label input {
  width: 17px;
  height: 17px;
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