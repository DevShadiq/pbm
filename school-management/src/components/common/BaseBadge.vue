<template>
  <span class="base-badge" :class="[`variant-${variant}`, `size-${size}`, { pill }]">
    <span v-if="dot" class="dot"></span>
    <slot>{{ label }}</slot>
  </span>
</template>

<script setup>
defineProps({
  label: { type: String, default: '' },
  variant: { type: String, default: 'primary' },
  size: { type: String, default: 'md' },
  pill: { type: Boolean, default: true },
  dot: { type: Boolean, default: false }
})
</script>

<style scoped>
.base-badge { display: inline-flex; align-items: center; gap: 6px; font-weight: 800; border-radius: 10px; line-height: 1; white-space: nowrap; }
.pill { border-radius: 999px; }
.size-sm { padding: 5px 8px; font-size: 11px; }
.size-md { padding: 7px 10px; font-size: 12px; }
.size-lg { padding: 9px 13px; font-size: 13px; }
.dot { width: 7px; height: 7px; border-radius: 50%; background: currentColor; }
.variant-primary { color: #1d4ed8; background: #dbeafe; }
.variant-success { color: #15803d; background: #dcfce7; }
.variant-warning { color: #b45309; background: #ffedd5; }
.variant-danger { color: #b91c1c; background: #fee2e2; }
.variant-info { color: #0369a1; background: #e0f2fe; }
.variant-gray { color: #475569; background: #f1f5f9; }
</style>