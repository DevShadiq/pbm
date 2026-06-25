<template>
  <BaseCard>
    <div class="form-header">
      <div>
        <h2>{{ roleId ? "Edit Role" : "Create Role" }}</h2>
        <p>Setup application role.</p>
      </div>
    </div>

    <AlertMessage
      v-if="message"
      type="info"
      :message="message"
    />

    <form @submit.prevent="saveRole">
      <div class="form-grid">
        <BaseInput
          v-model="form.institution_id"
          label="Institution ID"
          type="number"
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
            rows="3"
            placeholder="Role description"
          ></textarea>
        </div>

        <div class="field full">
          <label class="check-label">
            <input v-model="form.is_system_role" type="checkbox" />
            System Role
          </label>
        </div>
      </div>

      <div class="actions">
        <BaseButton type="submit" variant="primary" :disabled="saving">
          {{ saving ? "Saving..." : roleId ? "Update Role" : "Create Role" }}
        </BaseButton>

        <BaseButton type="button" variant="secondary" @click="resetForm">
          Reset
        </BaseButton>
      </div>
    </form>
  </BaseCard>
</template>

<script setup>
import { onMounted, reactive, ref, watch } from "vue";
import { roleApi } from "../../services/api";

import BaseInput from "../common/BaseInput.vue";
import BaseSelect from "../common/BaseSelect.vue";
import BaseButton from "../common/BaseButton.vue";
import BaseCard from "../common/BaseCard.vue";
import AlertMessage from "../common/AlertMessage.vue";

const props = defineProps({
  roleId: {
    type: [Number, String],
    default: null,
  },
});

const emit = defineEmits(["saved"]);

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

function resetForm() {
  form.institution_id = "";
  form.role_code = "";
  form.role_name = "";
  form.description = "";
  form.is_system_role = false;
  form.status = "ACTIVE";
}

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
    role_code: form.role_code,
    role_name: form.role_name,
    description: form.description || null,
    is_system_role: Boolean(form.is_system_role),
    status: form.status,
  };
}

async function loadRole() {
  if (!props.roleId) return;

  try {
    const res = await roleApi.getById(props.roleId);
    fillForm(res.data.data);
  } catch (error) {
    message.value = error.response?.data?.message || "Failed to load role";
  }
}

async function saveRole() {
  saving.value = true;
  message.value = "";

  try {
    const payload = buildPayload();

    if (props.roleId) {
      await roleApi.update(props.roleId, payload);
      message.value = "Role updated successfully";
    } else {
      await roleApi.create(payload);
      message.value = "Role created successfully";
      resetForm();
    }

    emit("saved");
  } catch (error) {
    message.value = error.response?.data?.message || "Failed to save role";
  } finally {
    saving.value = false;
  }
}

watch(
  () => props.roleId,
  () => {
    resetForm();
    loadRole();
  }
);

onMounted(loadRole);
</script>

<style scoped>
.form-header {
  margin-bottom: 18px;
}

.form-header h2 {
  margin: 0;
  color: #172033;
}

.form-header p {
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
}

textarea:focus {
  border-color: #2563eb;
  box-shadow: 0 0 0 4px rgba(37, 99, 235, 0.1);
}

.check-label {
  display: flex;
  align-items: center;
  gap: 10px;
}

.check-label input {
  width: 17px;
  height: 17px;
}

.actions {
  display: flex;
  gap: 12px;
  margin-top: 22px;
}

@media (max-width: 768px) {
  .form-grid {
    grid-template-columns: 1fr;
  }
}
</style>