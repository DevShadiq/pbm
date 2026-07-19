<template>
  <div class="auth-page">
    <div class="auth-card">
      <div class="brand-box">
        <div class="brand-icon">🔑</div>
        <h2>Reset Password</h2>
        <p>Create a new secure password for your account</p>
      </div>

      <form class="auth-form" @submit.prevent="handleSubmit">
        <div class="form-group">
          <label>New Password</label>
          <input
            v-model="form.password"
            type="password"
            placeholder="Enter new password"
          />
          <small v-if="errors.password">{{ errors.password }}</small>

          <div class="strength-box" v-if="form.password">
            <span>Password Strength</span>
            <strong :class="strengthClass">{{ passwordStrength }}</strong>
          </div>
        </div>

        <div class="form-group">
          <label>Confirm Password</label>
          <input
            v-model="form.confirmPassword"
            type="password"
            placeholder="Confirm new password"
          />
          <small v-if="errors.confirmPassword">{{ errors.confirmPassword }}</small>
        </div>

        <button class="primary-btn" type="submit" :disabled="loading">
          {{ loading ? 'Updating...' : 'Update Password' }}
        </button>
      </form>

      <button class="back-btn" type="button" @click="$emit('back-login')">
        ← Back to Login
      </button>
    </div>
  </div>
</template>

<script setup>
import { computed, reactive } from 'vue'

const props = defineProps({
  token: {
    type: String,
    default: ''
  },
  loading: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['submit', 'back-login'])

const form = reactive({
  password: '',
  confirmPassword: ''
})

const errors = reactive({
  password: '',
  confirmPassword: ''
})

const passwordStrength = computed(() => {
  const value = form.password

  if (value.length < 8) return 'Weak'
  if (value.length >= 8 && value.length < 10) return 'Medium'
  if (/[A-Z]/.test(value) && /[0-9]/.test(value) && /[^A-Za-z0-9]/.test(value)) {
    return 'Strong'
  }

  return 'Medium'
})

const strengthClass = computed(() => {
  return {
    weak: passwordStrength.value === 'Weak',
    medium: passwordStrength.value === 'Medium',
    strong: passwordStrength.value === 'Strong'
  }
})

const validate = () => {
  errors.password = ''
  errors.confirmPassword = ''

  if (!form.password) errors.password = 'New password is required'
  else if (!/[a-z]/.test(form.password) || !/[A-Z]/.test(form.password) || !/[0-9]/.test(form.password)) errors.password = 'Use uppercase, lowercase, and a number'
  else if (form.password.length < 8) errors.password = 'Password must be at least 8 characters'

  if (!form.confirmPassword) errors.confirmPassword = 'Confirm password is required'
  else if (form.password !== form.confirmPassword) errors.confirmPassword = 'Password does not match'

  return !errors.password && !errors.confirmPassword
}

const handleSubmit = () => {
  if (!validate()) return

  emit('submit', {
    token: props.token,
    password: form.password
  })
}
</script>

<style scoped>
.auth-page {
  min-height: 100vh;
  display: grid;
  place-items: center;
  background: linear-gradient(135deg, #ecfeff, #f8fafc);
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
  background: linear-gradient(135deg, #0891b2, #2563eb);
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

.form-group input {
  width: 100%;
  height: 48px;
  border: 1px solid #cbd5e1;
  border-radius: 14px;
  padding: 0 15px;
  font-size: 15px;
  outline: none;
  transition: 0.2s;
}

.form-group input:focus {
  border-color: #2563eb;
  box-shadow: 0 0 0 4px rgba(37, 99, 235, 0.12);
}

.form-group small {
  display: block;
  color: #dc2626;
  margin-top: 6px;
  font-size: 13px;
}

.strength-box {
  margin-top: 10px;
  display: flex;
  justify-content: space-between;
  background: #f8fafc;
  border-radius: 12px;
  padding: 10px 12px;
  font-size: 13px;
  color: #64748b;
}

.weak {
  color: #dc2626;
}

.medium {
  color: #d97706;
}

.strong {
  color: #16a34a;
}

.primary-btn {
  height: 50px;
  border: none;
  border-radius: 16px;
  background: linear-gradient(135deg, #0891b2, #2563eb);
  color: white;
  font-size: 16px;
  font-weight: 800;
  cursor: pointer;
  transition: 0.2s;
}

.primary-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 12px 30px rgba(8, 145, 178, 0.25);
}

.primary-btn:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.back-btn {
  width: 100%;
  margin-top: 20px;
  border: none;
  background: transparent;
  color: #2563eb;
  font-weight: 800;
  cursor: pointer;
}
</style>
