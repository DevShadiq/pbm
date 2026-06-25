<template>
  <div class="pagination-wrap">
    <p class="pagination-info">
      Showing <b>{{ from }}</b> to <b>{{ to }}</b> of <b>{{ total }}</b>
    </p>

    <div class="pagination">
      <button class="page-btn" :disabled="currentPage <= 1" @click="goTo(currentPage - 1)">‹</button>

      <button
        v-for="page in visiblePages"
        :key="page"
        class="page-btn"
        :class="{ active: page === currentPage }"
        @click="goTo(page)"
      >
        {{ page }}
      </button>

      <button class="page-btn" :disabled="currentPage >= totalPages" @click="goTo(currentPage + 1)">›</button>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  currentPage: { type: Number, default: 1 },
  perPage: { type: Number, default: 10 },
  total: { type: Number, default: 0 },
  maxPages: { type: Number, default: 5 }
})

const emit = defineEmits(['update:currentPage', 'change'])

const totalPages = computed(() => Math.max(1, Math.ceil(props.total / props.perPage)))
const from = computed(() => props.total === 0 ? 0 : (props.currentPage - 1) * props.perPage + 1)
const to = computed(() => Math.min(props.currentPage * props.perPage, props.total))

const visiblePages = computed(() => {
  const pages = []
  const half = Math.floor(props.maxPages / 2)
  let start = Math.max(1, props.currentPage - half)
  let end = Math.min(totalPages.value, start + props.maxPages - 1)

  if (end - start + 1 < props.maxPages) start = Math.max(1, end - props.maxPages + 1)
  for (let page = start; page <= end; page++) pages.push(page)
  return pages
})

const goTo = page => {
  const nextPage = Math.min(Math.max(page, 1), totalPages.value)
  emit('update:currentPage', nextPage)
  emit('change', nextPage)
}
</script>

<style scoped>
.pagination-wrap { display: flex; align-items: center; justify-content: space-between; gap: 14px; flex-wrap: wrap; padding: 14px 0; }
.pagination-info { margin: 0; color: #64748b; font-size: 13px; }
.pagination { display: flex; align-items: center; gap: 7px; }
.page-btn { min-width: 36px; height: 36px; border: 1px solid #dbe3ef; background: #fff; color: #334155; border-radius: 11px; cursor: pointer; font-weight: 800; transition: .18s ease; }
.page-btn:hover:not(:disabled) { border-color: #2563eb; color: #2563eb; }
.page-btn.active { background: #2563eb; color: #fff; border-color: #2563eb; box-shadow: 0 10px 20px rgba(37, 99, 235, .20); }
.page-btn:disabled { opacity: .45; cursor: not-allowed; }
</style>