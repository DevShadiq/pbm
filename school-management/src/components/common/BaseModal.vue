<template>
  <Teleport to="body">
    <Transition name="modal-fade">
      <div v-if="modelValue" class="modal-backdrop" @click.self="closeOnBackdrop && close()">
        <div class="modal-panel" :class="`size-${size}`">
          <div class="modal-header">
            <div>
              <h3 class="modal-title">{{ title }}</h3>
              <p v-if="subtitle" class="modal-subtitle">{{ subtitle }}</p>
            </div>
            <button type="button" class="close-btn" @click="close">×</button>
          </div>

          <div class="modal-body">
            <slot />
          </div>

          <div v-if="$slots.footer" class="modal-footer">
            <slot name="footer" />
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
defineProps({
  modelValue: { type: Boolean, default: false },
  title: { type: String, default: 'Modal Title' },
  subtitle: { type: String, default: '' },
  size: { type: String, default: 'md' },
  closeOnBackdrop: { type: Boolean, default: true }
})

const emit = defineEmits(['update:modelValue', 'close'])
const close = () => {
  emit('update:modelValue', false)
  emit('close')
}
</script>

<style scoped>
.modal-backdrop { position: fixed; inset: 0; background: rgba(15, 23, 42, .58); backdrop-filter: blur(8px); display: grid; place-items: center; z-index: 9999; padding: 20px; }
.modal-panel { width: 100%; background: #fff; border-radius: 22px; overflow: hidden; box-shadow: 0 24px 80px rgba(15, 23, 42, .28); }
.size-sm { max-width: 420px; }
.size-md { max-width: 620px; }
.size-lg { max-width: 860px; }
.size-xl { max-width: 1120px; }
.modal-header { padding: 18px 22px; display: flex; align-items: flex-start; justify-content: space-between; gap: 16px; border-bottom: 1px solid #e5edf7; background: linear-gradient(135deg, #f8fafc, #eef6ff); }
.modal-title { margin: 0; color: #0f172a; font-size: 19px; font-weight: 900; }
.modal-subtitle { margin: 4px 0 0; color: #64748b; font-size: 13px; }
.close-btn { width: 34px; height: 34px; border: 0; border-radius: 50%; background: #fff; color: #475569; cursor: pointer; font-size: 22px; box-shadow: 0 8px 18px rgba(15, 23, 42, .08); }
.modal-body { padding: 22px; max-height: 70vh; overflow-y: auto; }
.modal-footer { padding: 16px 22px; border-top: 1px solid #e5edf7; display: flex; justify-content: flex-end; gap: 10px; background: #f8fafc; }
.modal-fade-enter-active, .modal-fade-leave-active { transition: opacity .18s ease; }
.modal-fade-enter-from, .modal-fade-leave-to { opacity: 0; }
</style>