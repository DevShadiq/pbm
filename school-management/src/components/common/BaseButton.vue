<template>
  <button
    class="base-button"
    :class="[`variant-${variant}`, `size-${size}`, { block, rounded, loading }]"
    :type="type"
    :disabled="disabled || loading"
    @click="$emit('click', $event)"
  >
    <span v-if="loading" class="btn-spinner"></span>
    <span v-if="$slots.icon && !loading" class="btn-icon"><slot name="icon" /></span>
    <span><slot>{{ label }}</slot></span>
  </button>
</template>

<script setup>
defineProps({
  label: { type: String, default: '' },
  type: { type: String, default: 'button' },
  variant: { type: String, default: 'primary' },
  size: { type: String, default: 'md' },
  disabled: { type: Boolean, default: false },
  loading: { type: Boolean, default: false },
  block: { type: Boolean, default: false },
  rounded: { type: Boolean, default: false }
})

defineEmits(['click'])
</script>

<style scoped>
.base-button { border: 0; outline: 0; display: inline-flex; align-items: center; justify-content: center; gap: 8px; font-weight: 800; cursor: pointer; border-radius: 13px; transition: .2s ease; box-shadow: 0 10px 20px rgba(15, 23, 42, .10); }
.base-button:hover:not(:disabled) { transform: translateY(-1px); filter: brightness(.98); }
.base-button:disabled { opacity: .65; cursor: not-allowed; box-shadow: none; }
.block { width: 100%; }
.rounded { border-radius: 999px; }
.size-sm { padding: 9px 13px; font-size: 13px; }
.size-md { padding: 12px 18px; font-size: 14px; }
.size-lg { padding: 15px 22px; font-size: 15px; }
.variant-primary { background: linear-gradient(135deg, #2563eb, #4f46e5); color: #fff; }
.variant-secondary { background: #f1f5f9; color: #334155; }
.variant-success { background: linear-gradient(135deg, #16a34a, #22c55e); color: #fff; }
.variant-danger { background: linear-gradient(135deg, #dc2626, #ef4444); color: #fff; }
.variant-warning { background: linear-gradient(135deg, #f59e0b, #f97316); color: #fff; }
.variant-outline { background: #fff; color: #2563eb; border: 1px solid #bfdbfe; }
.variant-ghost { background: transparent; color: #334155; box-shadow: none; }
.btn-spinner { width: 16px; height: 16px; border: 2px solid currentColor; border-top-color: transparent; border-radius: 50%; animation: spin .75s linear infinite; }
.btn-icon { display: inline-flex; }
@keyframes spin { to { transform: rotate(360deg); } }
</style>