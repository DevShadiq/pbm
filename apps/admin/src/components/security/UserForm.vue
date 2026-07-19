<template>
  <BaseCard>
    <div class="form-header">
      <div>
        <h2>{{ userId ? "Edit User" : "Create User" }}</h2>
        <p>Create or update application user.</p>
      </div>
    </div>

    <AlertMessage
      v-if="message"
      type="info"
      :message="message"
    />

    <form @submit.prevent="saveUser">
      <div class="form-grid">
        <BaseInput
          v-model="form.institution_id"
          label="Institution ID"
          type="number"
          placeholder="Institution ID"
        />

        <BaseInput
          v-model="form.branch_id"
          label="Branch ID"
          type="number"
          placeholder="Branch ID"
        />

        <BaseInput
          v-model="form.username"
          label="Username"
          placeholder="admin"
          required
        />

        <BaseInput
          v-model="form.full_name"
          label="Full Name"
          placeholder="Full name"
          required
        />

        <BaseInput
          v-model="form.email"
          label="Email"
          type="email"
          placeholder="user@example.com"
        />

        <BaseInput
          v-model="form.mobile"
          label="Mobile"
          placeholder="01XXXXXXXXX"
        />

        <BaseSelect
          v-model="form.user_type"
          label="User Type"
          :options="userTypeOptions"
          required
        />

        <BaseInput
          v-model="form.password"
          label="Password"
          type="password"
          placeholder="Password"
          :required="!userId"
        />

        <BaseSelect
          v-model="form.is_active"
          label="Status"
          :options="statusOptions"
        />
      </div>

      <div class="actions">
        <BaseButton type="submit" variant="primary" :disabled="saving">
          {{ saving ? "Saving..." : userId ? "Update User" : "Create User" }}
        </BaseButton>

        <BaseButton type="button" variant="secondary" @click="resetForm">
          Reset
        </BaseButton>
      </div>
    </form>
  </BaseCard>
</template>

<script setup>
import { computed, onMounted, reactive, ref, watch } from "vue";
import { roleApi, userApi } from "../../services/api";

import BaseInput from "../common/BaseInput.vue";
import BaseSelect from "../common/BaseSelect.vue";
import BaseButton from "../common/BaseButton.vue";
import BaseCard from "../common/BaseCard.vue";
import AlertMessage from "../common/AlertMessage.vue";

const props = defineProps({
  userId: {
    type: [Number, String],
    default: null,
  },
});

const emit = defineEmits(["saved"]);

const saving = ref(false);
const message = ref("");

const statusOptions = [
  { label: "1 - Active", value: "1" },
  { label: "0 - Inactive", value: "0" },
];

const roles = ref([]);

const userTypeOptions = computed(() => {
  return roles.value
    .filter((role) => role.status === "ACTIVE")
    .map((role) => ({
      label: `${role.role_name} - ${role.role_code}`,
      value: role.role_code,
    }));
});

const form = reactive({
  institution_id: "",
  branch_id: "",
  username: "",
  full_name: "",
  email: "",
  mobile: "",
  user_type: "STAFF",
  password: "",
  is_active: "1",
});

function resetForm() {
  form.institution_id = "";
  form.branch_id = "";
  form.username = "";
  form.full_name = "";
  form.email = "";
  form.mobile = "";
  form.user_type = "STAFF";
  form.password = "";
  form.is_active = "1";
}

function fillForm(data) {
  form.institution_id = data.institution_id || "";
  form.branch_id = data.branch_id || "";
  form.username = data.username || "";
  form.full_name = data.full_name || data.name || "";
  form.email = data.email || "";
  form.mobile = data.mobile || data.mobile_no || data.phone || "";
  form.user_type = String(data.user_type || "STAFF").toUpperCase();
  form.password = "";
  form.is_active = [false, 0, "0", "false"].includes(data.is_active)
    ? "0"
    : "1";
}

function buildPayload() {
  const payload = {
    institution_id: form.institution_id || null,
    branch_id: form.branch_id || null,
    username: form.username,
    full_name: form.full_name,
    email: form.email || null,
    mobile: form.mobile || null,
    user_type: form.user_type,
    is_active: form.is_active === "1",
  };

  if (form.password) {
    payload.password = form.password;
  }

  return payload;
}

async function loadUser() {
  if (!props.userId) return;

  try {
    const res = await userApi.getById(props.userId);
    fillForm(res.data.data || res.data.user);
  } catch (error) {
    message.value = error.response?.data?.message || "Failed to load user";
  }
}

async function loadRoles() {
  try {
    const response = await roleApi.getAll();
    roles.value = response.data.data || [];
  } catch (error) {
    message.value = error.response?.data?.message || "Failed to load roles";
  }
}

async function saveUser() {
  saving.value = true;
  message.value = "";

  try {
    const payload = buildPayload();

    if (props.userId) {
      await userApi.update(props.userId, payload);
      message.value = "User updated successfully";
    } else {
      await userApi.create(payload);
      message.value = "User created successfully";
      resetForm();
    }

    emit("saved");
  } catch (error) {
    message.value = error.response?.data?.message || "Failed to save user";
  } finally {
    saving.value = false;
  }
}

watch(
  () => props.userId,
  () => {
    resetForm();
    loadUser();
  }
);

onMounted(async () => {
  await loadRoles();
  await loadUser();
});
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
