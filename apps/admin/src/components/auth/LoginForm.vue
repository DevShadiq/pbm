<template>
  <div class="auth-page">
    <div class="auth-card">
      <div class="brand-box">
        <div class="brand-icon">🎓</div>
        <h2>School Management</h2>
        <p>Login to your account</p>
      </div>

      <form @submit.prevent="handleSubmit" class="auth-form">
        <div class="form-group">
          <label>Email / Username</label>
          <input
            v-model.trim="form.email"
            type="text"
            placeholder="Enter email or username"
          />
          <small v-if="errors.email">{{ errors.email }}</small>
        </div>

        <div class="form-group">
          <label>Password</label>
          <div class="password-field">
            <input
              v-model="form.password"
              :type="showPassword ? 'text' : 'password'"
              placeholder="Enter password"
            />
            <button type="button" @click="showPassword = !showPassword">
              {{ showPassword ? 'Hide' : 'Show' }}
            </button>
          </div>
          <small v-if="errors.password">{{ errors.password }}</small>
        </div>

        <div class="form-row">
          <label class="check-label">
            <input v-model="form.remember" type="checkbox" />
            Remember me
          </label>

          <button type="button" class="link-btn" @click="$emit('forgot-password')">
            Forgot Password?
          </button>
        </div>

        <button class="primary-btn" type="submit" :disabled="loading">
          {{ loading ? 'Signing in...' : 'Login' }}
        </button>
      </form>

      <p class="bottom-text">
        Don’t have an account?
        <button type="button" @click="$emit('signup')">Create Account</button>
      </p>
    </div>
  </div>
</template>

<script setup>
import { reactive, ref } from 'vue'

defineProps({
  loading: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['submit', 'forgot-password', 'signup'])

const showPassword = ref(false)

const form = reactive({
  email: '',
  password: '',
  remember: false
})

const errors = reactive({
  email: '',
  password: ''
})

const validate = () => {
  errors.email = ''
  errors.password = ''

  if (!form.email) errors.email = 'Email or username is required'
  if (!form.password) errors.password = 'Password is required'

  return !errors.email && !errors.password
}

const handleSubmit = () => {
  if (!validate()) return

  emit('submit', {
    email: form.email,
    password: form.password,
    remember: form.remember
  })
}

</script>

<style scoped>
.auth-page {
  min-height: 100vh;
  display: grid;
  place-items: center;
  background: linear-gradient(135deg, #eef2ff, #f8fafc);
  padding: 24px;
}

.auth-card {
  width: 100%;
  max-width: 430px;
  background: #ffffff;
  border-radius: 24px;
  padding: 34px;
  box-shadow: 0 24px 70px rgba(15, 23, 42, 0.12);
  border: 1px solid #e5e7eb;
}

.brand-box {
  text-align: center;
  margin-bottom: 28px;
}

.brand-icon {
  width: 66px;
  height: 66px;
  margin: 0 auto 14px;
  display: grid;
  place-items: center;
  border-radius: 20px;
  background: linear-gradient(135deg, #2563eb, #7c3aed);
  font-size: 30px;
}

.brand-box h2 {
  margin: 0;
  font-size: 25px;
  color: #0f172a;
}

.brand-box p {
  margin: 8px 0 0;
  color: #64748b;
}

.auth-form {
  display: grid;
  gap: 18px;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  color: #334155;
  font-weight: 600;
  font-size: 14px;
}

.form-group input,
.password-field input {
  width: 100%;
  height: 48px;
  border: 1px solid #cbd5e1;
  border-radius: 14px;
  padding: 0 15px;
  font-size: 15px;
  outline: none;
  transition: 0.2s;
}

.form-group input:focus,
.password-field input:focus {
  border-color: #2563eb;
  box-shadow: 0 0 0 4px rgba(37, 99, 235, 0.12);
}

.form-group small {
  display: block;
  color: #dc2626;
  margin-top: 6px;
  font-size: 13px;
}

.password-field {
  display: flex;
  gap: 8px;
}

.password-field button {
  border: none;
  padding: 0 14px;
  border-radius: 14px;
  background: #eff6ff;
  color: #2563eb;
  font-weight: 700;
  cursor: pointer;
}

.form-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
}

.check-label {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #475569;
  font-size: 14px;
}

.link-btn {
  border: none;
  background: transparent;
  color: #2563eb;
  font-weight: 700;
  cursor: pointer;
}

.primary-btn {
  height: 50px;
  border: none;
  border-radius: 16px;
  background: linear-gradient(135deg, #2563eb, #7c3aed);
  color: white;
  font-size: 16px;
  font-weight: 800;
  cursor: pointer;
  transition: 0.2s;
}

.primary-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 12px 30px rgba(37, 99, 235, 0.25);
}

.primary-btn:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.bottom-text {
  text-align: center;
  color: #64748b;
  margin-top: 22px;
}

.bottom-text button {
  border: none;
  background: transparent;
  color: #2563eb;
  font-weight: 800;
  cursor: pointer;
}

@media (max-width: 480px) {
  .auth-card {
    padding: 24px;
    border-radius: 20px;
  }

  .form-row {
    align-items: flex-start;
    flex-direction: column;
  }
}
</style>