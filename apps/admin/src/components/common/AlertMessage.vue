<template>
  <div
    class="alert"
    :class="alertClass"
    role="alert"
  >
    <div class="alert-icon">
      {{ icon }}
    </div>

    <div class="alert-content">
      <strong v-if="title">{{ title }}</strong>
      <p>{{ message }}</p>
    </div>

    <button
      v-if="dismissible"
      type="button"
      class="close-btn"
      @click="$emit('close')"
    >
      ×
    </button>
  </div>
</template>

<script setup>
import { computed } from "vue";

const props = defineProps({
  type: {
    type: String,
    default: "info",
  },
  title: {
    type: String,
    default: "",
  },
  message: {
    type: String,
    required: true,
  },
  dismissible: {
    type: Boolean,
    default: false,
  },
});

defineEmits(["close"]);

const alertClass = computed(() => {
  return {
    success: props.type === "success",
    danger: props.type === "danger" || props.type === "error",
    warning: props.type === "warning",
    info: props.type === "info",
  };
});

const icon = computed(() => {
  if (props.type === "success") return "✓";
  if (props.type === "danger" || props.type === "error") return "!";
  if (props.type === "warning") return "!";
  return "i";
});
</script>

<style scoped>
.alert {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 13px 15px;
  border-radius: 14px;
  margin-bottom: 16px;
  border: 1px solid transparent;
}

.alert-icon {
  width: 24px;
  height: 24px;
  border-radius: 999px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-weight: 800;
  font-size: 13px;
  flex-shrink: 0;
}

.alert-content {
  flex: 1;
}

.alert-content strong {
  display: block;
  margin-bottom: 3px;
  font-size: 14px;
}

.alert-content p {
  margin: 0;
  font-size: 14px;
  line-height: 1.5;
}

.alert.info {
  background: #eef2ff;
  border-color: #c7d2fe;
  color: #3730a3;
}

.alert.info .alert-icon {
  background: #3730a3;
  color: #ffffff;
}

.alert.success {
  background: #dcfce7;
  border-color: #bbf7d0;
  color: #166534;
}

.alert.success .alert-icon {
  background: #166534;
  color: #ffffff;
}

.alert.danger {
  background: #fee2e2;
  border-color: #fecaca;
  color: #991b1b;
}

.alert.danger .alert-icon {
  background: #991b1b;
  color: #ffffff;
}

.alert.warning {
  background: #fef3c7;
  border-color: #fde68a;
  color: #92400e;
}

.alert.warning .alert-icon {
  background: #92400e;
  color: #ffffff;
}

.close-btn {
  border: none;
  background: transparent;
  color: inherit;
  cursor: pointer;
  font-size: 22px;
  line-height: 1;
  padding: 0 2px;
}
</style>