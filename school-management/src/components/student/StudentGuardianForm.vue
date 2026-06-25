<template>
  <BaseBadge :class="['student-status-badge', statusClass]">
    <span class="dot"></span>
    {{ statusLabel }}
  </BaseBadge>
</template>

<script setup>
import { computed } from 'vue'
import BaseBadge from '@/components/common/BaseBadge.vue'

const props = defineProps({
  status: {
    type: String,
    default: 'active'
  }
})

const normalizedStatus = computed(() => props.status?.toLowerCase() || 'active')

const statusMap = {
  active: {
    label: 'Active',
    class: 'is-active'
  },
  inactive: {
    label: 'Inactive',
    class: 'is-inactive'
  },
  pending: {
    label: 'Pending',
    class: 'is-pending'
  },
  transferred: {
    label: 'Transferred',
    class: 'is-transferred'
  },
  alumni: {
    label: 'Alumni',
    class: 'is-alumni'
  },
  suspended: {
    label: 'Suspended',
    class: 'is-suspended'
  },
  withdrawn: {
    label: 'Withdrawn',
    class: 'is-withdrawn'
  }
}

const statusLabel = computed(() => {
  return statusMap[normalizedStatus.value]?.label || props.status
})

const statusClass = computed(() => {
  return statusMap[normalizedStatus.value]?.class || 'is-default'
})
</script>

<style scoped>
.student-status-badge {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  padding: 7px 12px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.2px;
}

.dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: currentColor;
}

.is-active {
  color: #047857;
  background: #ecfdf5;
}

.is-inactive {
  color: #64748b;
  background: #f1f5f9;
}

.is-pending {
  color: #b45309;
  background: #fffbeb;
}

.is-transferred {
  color: #2563eb;
  background: #eff6ff;
}

.is-alumni {
  color: #7c3aed;
  background: #f5f3ff;
}

.is-suspended,
.is-withdrawn {
  color: #dc2626;
  background: #fef2f2;
}

.is-default {
  color: #334155;
  background: #f8fafc;
}
</style>