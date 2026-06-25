<template>
  <div class="auth-card">
    <div class="logo-box">
      <div class="logo">S</div>
      <h2>{{ title }}</h2>
      <p>{{ subtitle }}</p>
    </div>

    <slot />
  </div>
</template>

<script setup>
defineProps({
  title: String,
  subtitle: String
})
</script>

<style scoped>
.auth-card {
  width: 100%;
  max-width: 440px;
  background: white;
  padding: 34px;
  border-radius: 22px;
  box-shadow: 0 20px 50px rgba(15, 23, 42, 0.15);
}

.logo-box {
  text-align: center;
  margin-bottom: 28px;
}

.logo {
  width: 58px;
  height: 58px;
  background: linear-gradient(135deg, #2563eb, #7c3aed);
  color: white;
  font-size: 28px;
  font-weight: 800;
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 14px;
}

h2 {
  margin: 0;
  font-size: 26px;
  color: #111827;
}

p {
  margin-top: 8px;
  color: #6b7280;
  font-size: 14px;
}
</style>