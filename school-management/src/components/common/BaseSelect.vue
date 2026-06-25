<template>
  <div class="base-field">
    <label v-if="label" class="base-label">
      {{ label }}
      <span v-if="required" class="required">*</span>
    </label>

    <div :class="['select-wrapper', { 'has-error': error }]">
      <select
        :value="modelValue"
        :disabled="disabled"
        class="base-select"
        v-bind="$attrs"
        @change="$emit('update:modelValue', $event.target.value)"
      >
        <option v-if="placeholder" value="">
          {{ placeholder }}
        </option>

        <option
          v-for="option in options"
          :key="option.value"
          :value="option.value"
        >
          {{ option.label }}
        </option>
      </select>
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
    type: [String, Number, Boolean],
    default: ''
  },
  label: {
    type: String,
    default: ''
  },
  placeholder: {
    type: String,
    default: 'Select option'
  },
  options: {
    type: Array,
    default: () => []
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

.select-wrapper {
  width: 100%;
  min-height: 44px;
  border: 1px solid #dbe3ef;
  border-radius: 14px;
  background: #ffffff;
  padding: 0 13px;
  transition: 0.2s ease;
  box-sizing: border-box;
}

.select-wrapper:focus-within {
  border-color: #2563eb;
  box-shadow: 0 0 0 4px rgba(37, 99, 235, 0.12);
}

.select-wrapper.has-error {
  border-color: #ef4444;
  background: #fffafa;
}

.base-select {
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

.base-select:disabled {
  cursor: not-allowed;
  color: #94a3b8;
}

.error-text {
  color: #dc2626;
  font-size: 12px;
  font-weight: 600;
}
</style>
