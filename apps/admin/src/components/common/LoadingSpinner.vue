<template>
  <div class="loading-wrap" :class="{ overlay }">
    <div class="spinner" :class="`size-${size}`"></div>
    <p v-if="text" class="loading-text">{{ text }}</p>
  </div>
</template>

<script setup>
defineProps({
  size: { type: String, default: 'md' },
  text: { type: String, default: 'Loading...' },
  overlay: { type: Boolean, default: false }
})
</script>

<style scoped>
.loading-wrap { display: inline-flex; align-items: center; justify-content: center; gap: 10px; color: #64748b; }
.overlay { position: absolute; inset: 0; background: rgba(255, 255, 255, .72); backdrop-filter: blur(4px); z-index: 20; }
.spinner { border-radius: 50%; border: 3px solid #dbeafe; border-top-color: #2563eb; animation: spin .75s linear infinite; }
.size-sm { width: 18px; height: 18px; }
.size-md { width: 28px; height: 28px; }
.size-lg { width: 42px; height: 42px; }
.loading-text { margin: 0; font-size: 14px; font-weight: 700; }
@keyframes spin { to { transform: rotate(360deg); } }
</style>