<template>
  <div class="auth-page">
    <div class="auth-card large">
      <div class="brand-box">
        <div class="brand-icon">🏫</div>
        <h2>Create Account</h2>
        <p>Register a new user for school management system</p>
      </div>

      <form class="auth-form" @submit.prevent="handleSubmit">
        <div class="grid-2">
          <div class="form-group">
            <label>Full Name</label>
            <input v-model.trim="form.fullName" type="text" placeholder="Enter full name" />
            <small v-if="errors.fullName">{{ errors.fullName }}</small>
          </div>

          <div class="form-group">
            <label>Phone</label>
            <input v-model.trim="form.phone" type="text" placeholder="01XXXXXXXXX" />
          </div>
        </div>

        <div class="form-group">
          <label>Email</label>
          <input v-model.trim="form.email" type="email" placeholder="example@email.com" />
          <small v-if="errors.email">{{ errors.email }}</small>
        </div>

        <div class="form-group">
          <label>User Role</label>
          <select v-model="form.role">
            <option value="">Select role</option>
            <option value="Admin">Admin</option>
            <option value="Teacher">Teacher</option>
            <option value="Staff">Staff</option>
            <option value="Student">Student</option>
            <option value="Guardian">Guardian</option>
          </select>
          <small v-if="errors.role">{{ errors.role }}</small>
        </div>

        <div class="grid-2">
          <div class="form-group">
            <label>Password</label>
            <input v-model="form.password" type="password" placeholder="Minimum 6 characters" />
            <small v-if="errors.password">{{ errors.password }}</small>
          </div>

          <div class="form-group">
            <label>Confirm Password</label>
            <input v-model="form.confirmPassword" type="password" placeholder="Re-enter password" />
            <small v-if="errors.confirmPassword">{{ errors.confirmPassword }}</small>
          </div>
        </div>

        <label class="check-label">
          <input v-model="form.agree" type="checkbox" />
          I agree to the terms and privacy policy
        </label>
        <small v-if="errors.agree" class="error">{{ errors.agree }}</small>

        <button class="primary-btn" type="submit" :disabled="loading">
          {{ loading ? 'Creating Account...' : 'Sign Up' }}
        </button>
      </form>

      <p class="bottom-text">
        Already have an account?
        <button type="button" @click="$emit('login')">Login</button>
      </p>
    </div>
  </div>
</template>

<script setup>
import { reactive } from 'vue'

defineProps({
  loading: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['submit', 'login'])

const form = reactive({
  fullName: '',
  phone: '',
  email: '',
  role: '',
  password: '',
  confirmPassword: '',
  agree: false
})

const errors = reactive({
  fullName: '',
  email: '',
  role: '',
  password: '',
  confirmPassword: '',
  agree: ''
})

const validate = () => {
  Object.keys(errors).forEach(key => (errors[key] = ''))

  if (!form.fullName) errors.fullName = 'Full name is required'
  if (!form.email) errors.email = 'Email is required'
  if (!form.role) errors.role = 'Role is required'
  if (!form.password) errors.password = 'Password is required'
  else if (form.password.length < 6) errors.password = 'Password must be at least 6 characters'

  if (!form.confirmPassword) errors.confirmPassword = 'Confirm password is required'
  else if (form.password !== form.confirmPassword) errors.confirmPassword = 'Password does not match'

  if (!form.agree) errors.agree = 'You must agree before signup'

  return !Object.values(errors).some(Boolean)
}

const handleSubmit = () => {
  if (!validate()) return

  emit('submit', {
    fullName: form.fullName,
    phone: form.phone,
    email: form.email,
    role: form.role,
    password: form.password
  })
}
</script>

<style scoped>
.auth-page {
  min-height: 100vh;
  display: grid;
  place-items: center;
  background: linear-gradient(135deg, #f0f9ff, #f8fafc);
  padding: 24px;
}

.auth-card {
  width: 100%;
  max-width: 460px;
  background: #ffffff;
  border-radius: 24px;
  padding: 34px;
  box-shadow: 0 24px 70px rgba(15, 23, 42, 0.12);
  border: 1px solid #e5e7eb;
}

.auth-card.large {
  max-width: 620px;
}

.brand-box {
  text-align: center;
  margin-bottom: 26px;
}

.brand-icon {
  width: 66px;
  height: 66px;
  margin: 0 auto 14px;
  display: grid;
  place-items: center;
  border-radius: 20px;
  background: linear-gradient(135deg, #0ea5e9, #2563eb);
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
  gap: 17px;
}

.grid-2 {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 14px;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  color: #334155;
  font-weight: 600;
  font-size: 14px;
}

.form-group input,
.form-group select {
  width: 100%;
  height: 48px;
  border: 1px solid #cbd5e1;
  border-radius: 14px;
  padding: 0 15px;
  font-size: 15px;
  outline: none;
  background: white;
  transition: 0.2s;
}

.form-group input:focus,
.form-group select:focus {
  border-color: #2563eb;
  box-shadow: 0 0 0 4px rgba(37, 99, 235, 0.12);
}

.form-group small,
.error {
  display: block;
  color: #dc2626;
  margin-top: 6px;
  font-size: 13px;
}

.check-label {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #475569;
  font-size: 14px;
}

.primary-btn {
  height: 50px;
  border: none;
  border-radius: 16px;
  background: linear-gradient(135deg, #0ea5e9, #2563eb);
  color: white;
  font-size: 16px;
  font-weight: 800;
  cursor: pointer;
  transition: 0.2s;
}

.primary-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 12px 30px rgba(14, 165, 233, 0.25);
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

@media (max-width: 620px) {
  .grid-2 {
    grid-template-columns: 1fr;
  }

  .auth-card {
    padding: 24px;
  }
}
</style>