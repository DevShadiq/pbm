<template>
  <div class="page-title">
    <div>
      <h1>{{ title }}</h1>
      <p v-if="subtitle">{{ subtitle }}</p>
    </div>

    <slot name="actions"></slot>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'

const props = defineProps({
  title: {
    type: String,
    default: ''
  },
  subtitle: {
    type: String,
    default: ''
  }
})

const route = useRoute()

const title = computed(() => {
  return props.title || route.meta?.title || 'Dashboard'
})

const subtitle = computed(() => {
  return props.subtitle || route.meta?.subtitle || ''
})
</script>

<style scoped>
.page-title {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
  margin-bottom: 18px;
}

.page-title h1 {
  margin: 0;
  font-size: 26px;
  color: #0f172a;
  font-weight: 800;
}

.page-title p {
  margin: 6px 0 0;
  color: #64748b;
  font-size: 14px;
}

@media (max-width: 700px) {
  .page-title {
    align-items: flex-start;
    flex-direction: column;
  }

  .page-title h1 {
    font-size: 22px;
  }
}
</style>