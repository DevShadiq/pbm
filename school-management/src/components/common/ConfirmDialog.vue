<template>
  <BaseModal
    :model-value="modelValue"
    :title="title"
    size="sm"
    @update:model-value="$emit('update:modelValue', $event)"
  >
    <div class="confirm-content">
      <div class="confirm-icon" :class="`type-${type}`">!</div>
      <p class="confirm-message">{{ message }}</p>
    </div>

    <template #footer>
      <BaseButton variant="secondary" :label="cancelText" @click="$emit('update:modelValue', false)" />
      <BaseButton :variant="confirmVariant" :label="confirmText" @click="confirm" />
    </template>
  </BaseModal>
</template>

<script setup>
import BaseModal from './BaseModal.vue'
import BaseButton from './BaseButton.vue'

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  title: { type: String, default: 'Are you sure?' },
  message: { type: String, default: 'This action cannot be undone.' },
  type: { type: String, default: 'warning' },
  confirmText: { type: String, default: 'Confirm' },
  cancelText: { type: String, default: 'Cancel' }
})

const emit = defineEmits(['update:modelValue', 'confirm'])

const confirmVariant = props.type === 'danger' ? 'danger' : props.type === 'success' ? 'success' : 'warning'

const confirm = () => {
  emit('confirm')
  emit('update:modelValue', false)
}
</script>

<style scoped>
.confirm-content { display: grid; place-items: center; text-align: center; gap: 14px; padding: 8px 0 4px; }
.confirm-icon { width: 58px; height: 58px; border-radius: 50%; display: grid; place-items: center; font-size: 28px; font-weight: 900; }
.type-warning { background: #ffedd5; color: #c2410c; }
.type-danger { background: #fee2e2; color: #b91c1c; }
.type-success { background: #dcfce7; color: #15803d; }
.confirm-message { margin: 0; color: #475569; line-height: 1.6; }
</style>