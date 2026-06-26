<template>
  <div class="base-field">
    <label v-if="label" class="base-label">
      {{ label }}
      <span v-if="required" class="required">*</span>
    </label>

    <div :class="['date-wrapper', { 'has-error': error }]">
      <input
        type="text"
        :value="inputValue"
        :disabled="disabled"
        :placeholder="placeholder"
        maxlength="11"
        class="base-date"
        v-bind="$attrs"
        @input="handleInput"
        @blur="handleBlur"
      />

      <button
        type="button"
        class="date-picker-btn"
        :disabled="disabled"
        title="Select date"
        @click="openPicker"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M8 2v4" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
          <path d="M16 2v4" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
          <path d="M3 10h18" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
          <path d="M5 4h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Z" stroke="currentColor" stroke-width="2" stroke-linejoin="round" />
        </svg>
      </button>

      <input
        ref="pickerInput"
        type="date"
        :value="pickerValue"
        :disabled="disabled"
        class="native-date"
        tabindex="-1"
        aria-hidden="true"
        @input="handlePickerInput"
      />
    </div>

    <small v-if="error" class="error-text">
      {{ error }}
    </small>
  </div>
</template>

<script setup>
import { computed, ref, watch } from "vue";
import { formatDateForDisplay, toIsoDate } from "../../utils/dateFormat";

defineOptions({
  inheritAttrs: false
})

const props = defineProps({
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
  },
  placeholder: {
    type: String,
    default: 'DD-MON-YYYY'
  }
})

const emit = defineEmits(['update:modelValue'])
const inputValue = ref(formatDateForDisplay(props.modelValue));
const pickerInput = ref(null);
const pickerValue = computed(() => toIsoDate(props.modelValue));

watch(
  () => props.modelValue,
  (value) => {
    inputValue.value = formatDateForDisplay(value);
  }
);

function handleInput(event) {
  const value = event.target.value.toUpperCase();
  inputValue.value = value;

  if (!value) {
    emit('update:modelValue', '');
    return;
  }

  const isoDate = toIsoDate(value);
  if (isoDate) {
    emit('update:modelValue', isoDate);
  }
}

function handleBlur() {
  inputValue.value = formatDateForDisplay(props.modelValue, inputValue.value.toUpperCase());
}

function handlePickerInput(event) {
  emit('update:modelValue', event.target.value || '');
}

function openPicker() {
  if (props.disabled || !pickerInput.value) return;

  if (typeof pickerInput.value.showPicker === 'function') {
    pickerInput.value.showPicker();
    return;
  }

  pickerInput.value.click();
}
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
  padding: 0 9px 0 13px;
  transition: 0.2s ease;
  box-sizing: border-box;
  display: flex;
  align-items: center;
  position: relative;
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

.date-picker-btn {
  width: 34px;
  height: 34px;
  border: 0;
  border-radius: 10px;
  color: #2563eb;
  background: #eff6ff;
  display: grid;
  place-items: center;
  flex: 0 0 34px;
  transition: 0.2s ease;
}

.date-picker-btn:hover:not(:disabled) {
  color: #ffffff;
  background: #2563eb;
}

.date-picker-btn:disabled {
  cursor: not-allowed;
  opacity: 0.55;
}

.native-date {
  position: absolute;
  right: 9px;
  bottom: 4px;
  width: 34px;
  height: 34px;
  opacity: 0;
  pointer-events: none;
}

.error-text {
  color: #dc2626;
  font-size: 12px;
  font-weight: 600;
}
</style>
