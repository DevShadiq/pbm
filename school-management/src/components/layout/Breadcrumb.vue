<template>
  <div class="breadcrumb">
    <RouterLink to="/dashboard">Home</RouterLink>

    <template v-for="item in breadcrumbItems" :key="item.path">
      <span>/</span>
      <RouterLink v-if="item.path" :to="item.path">
        {{ item.title }}
      </RouterLink>
      <strong v-else>{{ item.title }}</strong>
    </template>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()

const breadcrumbItems = computed(() => {
  if (route.meta?.breadcrumb) {
    return route.meta.breadcrumb
  }

  const parts = route.path.split('/').filter(Boolean)

  return parts.map((part, index) => {
    const path = '/' + parts.slice(0, index + 1).join('/')

    return {
      title: part
        .replaceAll('-', ' ')
        .replace(/\b\w/g, char => char.toUpperCase()),
      path: index === parts.length - 1 ? null : path
    }
  })
})
</script>

<style scoped>
.breadcrumb {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 14px;
  font-size: 13px;
  color: #64748b;
  flex-wrap: wrap;
}

.breadcrumb a {
  color: #2563eb;
  text-decoration: none;
  font-weight: 500;
}

.breadcrumb a:hover {
  text-decoration: underline;
}

.breadcrumb span {
  color: #94a3b8;
}

.breadcrumb strong {
  color: #334155;
  font-weight: 600;
}
</style>