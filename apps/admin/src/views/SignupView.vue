<template>
  <div class="signup-page">
    <AuthCard
      title="Create Account"
      subtitle="Sign up to access School Management System"
    >
      <form @submit.prevent="submitForm">
        <BaseInput
          label="Full Name"
          placeholder="Enter your full name"
          v-model="form.name"
          :error="errors.name"
        />

        <BaseInput
          label="Email Address"
          type="email"
          placeholder="Enter your email"
          v-model="form.email"
          :error="errors.email"
        />

        <BaseInput
          label="Password"
          type="password"
          placeholder="Enter password"
          v-model="form.password"
          :error="errors.password"
        />

        <BaseInput
          label="Confirm Password"
          type="password"
          placeholder="Confirm password"
          v-model="form.confirmPassword"
          :error="errors.confirmPassword"
        />

        <BaseButton
          text="Create Account"
          type="submit"
          :loading="loading"
        />
      </form>

      <p class="login-text">
        Already have an account?
        <a href="#">Login</a>
      </p>
    </AuthCard>
  </div>
</template>

<script setup>
import { reactive, ref } from 'vue'

import AuthCard from '../components/AuthCard.vue'
import BaseInput from '../components/BaseInput.vue'
import BaseButton from '../components/BaseButton.vue'

const loading = ref(false)

const form = reactive({
  name: '',
  email: '',
  password: '',
  confirmPassword: ''
})

const errors = reactive({
  name: '',
  email: '',
  password: '',
  confirmPassword: ''
})

const validateForm = () => {
  errors.name = ''
  errors.email = ''
  errors.password = ''
  errors.confirmPassword = ''

  let isValid = true

  if (!form.name) {
    errors.name = 'Full name is required'
    isValid = false
  }

  if (!form.email) {
    errors.email = 'Email is required'
    isValid = false
  }

  if (!form.password) {
    errors.password = 'Password is required'
    isValid = false
  } else if (form.password.length < 6) {
    errors.password = 'Password must be at least 6 characters'
    isValid = false
  }

  if (form.password !== form.confirmPassword) {
    errors.confirmPassword = 'Password does not match'
    isValid = false
  }

  return isValid
}

const submitForm = async () => {
  if (!validateForm()) return

  loading.value = true

  const payload = {
    name: form.name,
    email: form.email,
    password: form.password
  }

  console.log('Signup Data:', payload)

  // Later you can call Laravel API here:
  // await api.post('/register', payload)

  setTimeout(() => {
    loading.value = false
    alert('Account created successfully')
  }, 1000)
}
</script>

<style scoped>
.signup-page {
  min-height: 100vh;
  background:
    radial-gradient(circle at top left, #dbeafe, transparent 35%),
    linear-gradient(135deg, #eff6ff, #f8fafc);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
}

.login-text {
  text-align: center;
  margin-top: 20px;
  color: #6b7280;
  font-size: 14px;
}

.login-text a {
  color: #2563eb;
  font-weight: 700;
  text-decoration: none;
}
</style>