<template>
  <div class="form-card">
    <div class="header">
      <div>
        <h1>{{ isEditMode ? "Update User" : "Create User" }}</h1>
        <p>
          Manage login account, user type, branch and active status.
        </p>
      </div>

      <RouterLink to="/users" class="back-btn">
        Back to List
      </RouterLink>
    </div>

    <div v-if="message" :class="['alert', messageType]">
      {{ message }}
    </div>

    <form @submit.prevent="submitForm" class="grid">
      <div class="field">
        <label>Full Name *</label>
        <input
          v-model="form.full_name"
          type="text"
          placeholder="Enter full name"
          required
        />
      </div>

      <div class="field">
        <label>Username *</label>
        <input
          v-model="form.username"
          type="text"
          placeholder="Enter username"
          required
        />
      </div>

      <div class="field">
        <label>Email</label>
        <input
          v-model="form.email"
          type="email"
          placeholder="Enter email"
        />
      </div>

      <div class="field">
        <label>Mobile</label>
        <input
          v-model="form.mobile"
          type="text"
          placeholder="Enter mobile"
        />
      </div>

      <div class="field">
        <label>User Type *</label>
        <select v-model="form.user_type" required>
          <option value="ADMIN">ADMIN</option>
          <option value="TEACHER">TEACHER</option>
          <option value="STAFF">STAFF</option>
          <option value="STUDENT">STUDENT</option>
          <option value="GUARDIAN">GUARDIAN</option>
          <option value="SUPER_ADMIN">SUPER_ADMIN</option>
        </select>
      </div>

      <div class="field">
        <label>Active Status *</label>
        <select v-model="form.is_active">
          <option :value="true">ACTIVE</option>
          <option :value="false">INACTIVE</option>
        </select>
      </div>

      <div class="field">
        <label>Institution ID</label>
        <input
          v-model="form.institution_id"
          type="number"
          placeholder="Example: 1"
        />
      </div>

      <div class="field">
        <label>Branch ID</label>
        <input
          v-model="form.branch_id"
          type="number"
          placeholder="Example: 1"
        />
      </div>

      <div class="field full">
        <label>Password {{ isEditMode ? "" : "*" }}</label>
        <input
          v-model="form.password"
          type="password"
          :placeholder="
            isEditMode
              ? 'Leave blank if password unchanged'
              : 'Enter password'
          "
          :required="!isEditMode"
        />
      </div>

      <div class="actions">
        <button type="submit" class="save-btn" :disabled="loading">
          {{
            loading
              ? "Saving..."
              : isEditMode
                ? "Update User"
                : "Create User"
          }}
        </button>

        <button type="button" class="reset-btn" @click="resetForm">
          Reset
        </button>
      </div>
    </form>
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import {
  createUser,
  getUserById,
  updateUser,
} from "../../services/userService";

const route = useRoute();
const router = useRouter();

const loading = ref(false);
const message = ref("");
const messageType = ref("success");

const isEditMode = computed(() => !!route.params.user_id);

const form = reactive({
  institution_id: "",
  branch_id: "",
  username: "",
  email: "",
  mobile: "",
  password: "",
  full_name: "",
  user_type: "STAFF",
  avatar_url: null,
  is_super_admin: false,
  is_active: true,
});

function toNumberOrNull(value) {
  return value === "" || value === null || value === undefined
    ? null
    : Number(value);
}

function buildPayload() {
  const payload = {
    institution_id: toNumberOrNull(form.institution_id),
    branch_id: toNumberOrNull(form.branch_id),
    username: form.username,
    email: form.email || null,
    mobile: form.mobile || null,
    full_name: form.full_name,
    user_type: form.user_type,
    avatar_url: form.avatar_url,
    is_super_admin: form.user_type === "SUPER_ADMIN",
    is_active: form.is_active,
  };

  if (form.password) {
    payload.password = form.password;
  }

  return payload;
}

async function loadUser() {
  if (!isEditMode.value) return;

  try {
    loading.value = true;

    const data = await getUserById(route.params.user_id);

    if (data.success) {
      Object.assign(form, {
        institution_id: data.user.institution_id || "",
        branch_id: data.user.branch_id || "",
        username: data.user.username || "",
        email: data.user.email || "",
        mobile: data.user.mobile || "",
        password: "",
        full_name: data.user.full_name || "",
        user_type: data.user.user_type || "STAFF",
        avatar_url: data.user.avatar_url || null,
        is_super_admin: data.user.is_super_admin || false,
        is_active: data.user.is_active,
      });
    }
  } catch (error) {
    message.value =
      error.response?.data?.message || "Unable to load user information";
    messageType.value = "error";
  } finally {
    loading.value = false;
  }
}

async function submitForm() {
  try {
    loading.value = true;
    message.value = "";

    const payload = buildPayload();

    let data;

    if (isEditMode.value) {
      data = await updateUser(route.params.user_id, payload);
    } else {
      data = await createUser(payload);
    }

    if (data.success) {
      message.value = data.message;
      messageType.value = "success";

      setTimeout(() => {
        router.push("/users");
      }, 700);
    }
  } catch (error) {
    message.value =
      error.response?.data?.message || "Something went wrong";
    messageType.value = "error";
  } finally {
    loading.value = false;
  }
}

function resetForm() {
  form.institution_id = "";
  form.branch_id = "";
  form.username = "";
  form.email = "";
  form.mobile = "";
  form.password = "";
  form.full_name = "";
  form.user_type = "STAFF";
  form.avatar_url = null;
  form.is_super_admin = false;
  form.is_active = true;
}

onMounted(loadUser);
</script>

<style scoped>
.form-card {
  max-width: 980px;
  margin: 0 auto;
  background: white;
  border-radius: 26px;
  padding: 28px;
  border: 1px solid #e5e7eb;
  box-shadow: 0 18px 45px rgba(15, 23, 42, 0.08);
}

.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 26px;
}

.header h1 {
  margin: 0;
  font-size: 30px;
  font-weight: 900;
  color: #0f172a;
}

.header p {
  margin: 7px 0 0;
  color: #64748b;
}

.back-btn {
  text-decoration: none;
  background: #f1f5f9;
  color: #334155;
  border-radius: 14px;
  padding: 11px 16px;
  font-weight: 800;
}

.grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 18px;
}

.field {
  display: grid;
  gap: 7px;
}

.field.full {
  grid-column: span 2;
}

.field label {
  font-size: 14px;
  color: #334155;
  font-weight: 800;
}

.field input,
.field select {
  height: 48px;
  border: 1px solid #dbe3ef;
  border-radius: 14px;
  padding: 0 14px;
  outline: none;
  background: white;
  font-size: 15px;
}

.field input:focus,
.field select:focus {
  border-color: #2563eb;
  box-shadow: 0 0 0 4px rgba(37, 99, 235, 0.12);
}

.actions {
  grid-column: span 2;
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 8px;
}

.save-btn,
.reset-btn {
  border: none;
  border-radius: 14px;
  padding: 12px 18px;
  font-weight: 900;
  cursor: pointer;
}

.save-btn {
  background: #2563eb;
  color: white;
}

.reset-btn {
  background: #f1f5f9;
  color: #334155;
}

.alert {
  padding: 13px 15px;
  border-radius: 14px;
  margin-bottom: 18px;
  font-size: 14px;
  font-weight: 700;
}

.alert.success {
  background: #dcfce7;
  color: #166534;
}

.alert.error {
  background: #fee2e2;
  color: #991b1b;
}

@media (max-width: 768px) {
  .header,
  .actions {
    flex-direction: column;
    align-items: stretch;
  }

  .grid {
    grid-template-columns: 1fr;
  }

  .field.full,
  .actions {
    grid-column: span 1;
  }
}
</style>