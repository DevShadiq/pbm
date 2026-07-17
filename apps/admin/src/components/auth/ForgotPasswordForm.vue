<template>
  <div class="auth-page">
    <div class="auth-card">
      <div class="brand-box">
        <div class="brand-icon">🔐</div>
        <h2>Forgot Password?</h2>
        <p>Enter your email address and we will send a reset link</p>
      </div>

      <form class="auth-form" @submit.prevent="handleSubmit">
        <div class="form-group">
          <label>Email Address</label>
          <input
            v-model.trim="email"
            type="email"
            placeholder="example@email.com"
          />
          <small v-if="error">{{ error }}</small>
        </div>

        <button class="primary-btn" type="submit" :disabled="loading">
          {{ loading ? 'Sending...' : 'Send Reset Link' }}
        </button>
      </form>

      <button class="back-btn" type="button" @click="$emit('back-login')">
        ← Back to Login
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'

defineProps({
  loading: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['submit', 'back-login'])

const email = ref('')
const error = ref('')

const handleSubmit = () => {
  error.value = ''

  if (!email.value) {
    error.value = 'Email is required'
    return
  }

  emit('submit', {
    email: email.value
  })
}
</script>

<style scoped>
.auth-page {
  min-height: 100vh;
  display: grid;
  place-items: center;
  background: linear-gradient(135deg, #f8fafc, #eff6ff);
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
  background: linear-gradient(135deg, #7c3aed, #2563eb);
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
  line-height: 1.5;
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

.primary-btn {
  height: 50px;
  border: none;
  border-radius: 16px;
  background: linear-gradient(135deg, #7c3aed, #2563eb);
  color: white;
  font-size: 16px;
  font-weight: 800;
  cursor: pointer;
  transition: 0.2s;
}

.primary-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 12px 30px rgba(124, 58, 237, 0.25);
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