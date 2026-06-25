<template>
  <div class="base-field">
    <label v-if="label" class="base-label">
      {{ label }}
      <span v-if="required" class="required">*</span>
    </label>

    <div :class="['input-wrapper', { 'has-error': error }]">
      <span v-if="prefixIcon" class="input-icon">
        {{ prefixIcon }}
      </span>

      <input
        :type="type"
        :value="modelValue"
        :placeholder="placeholder"
        :disabled="disabled"
        :readonly="readonly"
        class="base-input"
        v-bind="$attrs"
        @input="$emit('update:modelValue', $event.target.value)"
      />
    </div>

    <small v-if="error" class="error-text">
      {{ error }}
    </small>

    <small v-else-if="hint" class="hint-text">
      {{ hint }}
    </small>
  </div>
</template>

<script setup>
defineOptions({
  inheritAttrs: false
})

defineProps({
  modelValue: {
    type: [String, Number],
    default: ''
  },
  label: {
    type: String,
    default: ''
  },
  placeholder: {
    type: String,
    default: ''
  },
  type: {
    type: String,
    default: 'text'
  },
  error: {
    type: String,
    default: ''
  },
  hint: {
    type: String,
    default: ''
  },
  prefixIcon: {
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
  },
  readonly: {
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
  line-height: 1.3;
}

.required {
  color: #dc2626;
}

.input-wrapper {
  width: 100%;
  min-height: 44px;
  display: flex;
  align-items: center;
  gap: 8px;
  border: 1px solid #dbe3ef;
  border-radius: 14px;
  background: #ffffff;
  padding: 0 13px;
  transition: 0.2s ease;
  box-sizing: border-box;
}

.input-wrapper:focus-within {
  border-color: #2563eb;
  box-shadow: 0 0 0 4px rgba(37, 99, 235, 0.12);
}

.input-wrapper.has-error {
  border-color: #ef4444;
  background: #fffafa;
}

.input-icon {
  color: #64748b;
  font-size: 14px;
  flex-shrink: 0;
}

.base-input {
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

.base-input::placeholder {
  color: #94a3b8;
  font-weight: 400;
}

.base-input:disabled {
  cursor: not-allowed;
  color: #94a3b8;
}

.input-wrapper:has(.base-input:disabled) {
  background: #f8fafc;
}

.error-text {
  color: #dc2626;
  font-size: 12px;
  font-weight: 600;
}

.hint-text {
  color: #64748b;
  font-size: 12px;
}
</style>