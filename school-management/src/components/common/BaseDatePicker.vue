<template>
  <div class="base-field">
    <label v-if="label" class="base-label">
      {{ label }}
      <span v-if="required" class="required">*</span>
    </label>

    <div :class="['date-wrapper', { 'has-error': error }]">
      <input
        type="date"
        :value="modelValue"
        :disabled="disabled"
        class="base-date"
        v-bind="$attrs"
        @input="$emit('update:modelValue', $event.target.value)"
      />
    </div>

    <small v-if="error" class="error-text">
      {{ error }}
    </small>
  </div>
</template>

<script setup>
defineOptions({
  inheritAttrs: false
})

defineProps({
  modelValue: {
    type: String,
    default: ''
  },
  label: {
    type: String,
    default: ''
  },
  error: {
    type: String,
    default: ''
  },
  required: {
    type: Boolean,
    default: false
  },
  disabled: {
    type: Boolean,
    default: false
  }
})

defineEmits(['update:modelValue'])
</script>

<style scoped>
.base-field {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 7px;
}

.base-label {
  font-size: 13px;
  font-weight: 700;
  color: #334155;
}

.required {
  color: #dc2626;
}

.date-wrapper {
  width: 100%;
  min-height: 44px;
  border: 1px solid #dbe3ef;
  border-radius: 14px;
  background: #ffffff;
  padding: 0 13px;
  transition: 0.2s ease;
  box-sizing: border-box;
}

.date-wrapper:focus-within {
  border-color: #2563eb;
  box-shadow: 0 0 0 4px rgba(37, 99, 235, 0.12);
}

.date-wrapper.has-error {
  border-color: #ef4444;
  background: #fffafa;
}

.base-date {
  width: 100%;
  height: 42px;
  border: 0;
  outline: none;
  background: transparent;
  color: #0f172a;
  font-size: 14px;
  font-weight: 500;
  box-sizing: border-box;
}

.error-text {
  color: #dc2626;
  font-size: 12px;
  font-weight: 600;
}
</style>