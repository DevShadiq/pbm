<template>
  <div class="table-card">
    <div v-if="$slots.header" class="table-header">
      <slot name="header" />
    </div>

    <div class="table-scroll">
      <table class="base-table">
        <thead>
          <tr>
            <th v-if="selectable" class="check-col">
              <input type="checkbox" :checked="allSelected" @change="toggleAll" />
            </th>
            <th
              v-for="column in columns"
              :key="column.key"
              :style="{ width: column.width || 'auto', textAlign: column.align || 'left' }"
              :class="{ sortable: column.sortable }"
              @click="column.sortable && $emit('sort', column.key)"
            >
              <span>{{ column.label }}</span>
              <span v-if="column.sortable" class="sort-icon">↕</span>
            </th>
            <th v-if="$slots.actions" class="action-col">Action</th>
          </tr>
        </thead>

        <tbody>
          <tr v-if="loading">
            <td :colspan="totalColumns" class="state-cell">Loading data...</td>
          </tr>

          <tr v-else-if="rows.length === 0">
            <td :colspan="totalColumns" class="state-cell">{{ emptyText }}</td>
          </tr>

          <tr
            v-for="(row, rowIndex) in rows"
            v-else
            :key="getKey(row, rowIndex)"
            :class="{ selected: isSelected(row, rowIndex) }"
            @click="$emit('row-click', row)"
          >
            <td v-if="selectable" class="check-col" @click.stop>
              <input
                type="checkbox"
                :checked="isSelected(row, rowIndex)"
                @change="toggleRow(row, rowIndex)"
              />
            </td>

            <td
              v-for="column in columns"
              :key="column.key"
              :style="{ textAlign: column.align || 'left' }"
            >
              <slot :name="`cell-${column.key}`" :row="row" :value="row[column.key]" :index="rowIndex">
                {{ formatValue(row, column) }}
              </slot>
            </td>

            <td v-if="$slots.actions" class="action-col" @click.stop>
              <slot name="actions" :row="row" :index="rowIndex" />
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'

const props = defineProps({
  columns: { type: Array, default: () => [] },
  rows: { type: Array, default: () => [] },
  rowKey: { type: String, default: 'id' },
  loading: { type: Boolean, default: false },
  selectable: { type: Boolean, default: false },
  emptyText: { type: String, default: 'No data found' }
})

const emit = defineEmits(['row-click', 'sort', 'selection-change'])
const selectedKeys = ref([])

const totalColumns = computed(() => props.columns.length + (props.selectable ? 1 : 0) + 1)
const getKey = (row, index) => row?.[props.rowKey] ?? index
const isSelected = (row, index) => selectedKeys.value.includes(getKey(row, index))

const allSelected = computed(() => {
  return props.rows.length > 0 && props.rows.every((row, index) => selectedKeys.value.includes(getKey(row, index)))
})

const emitSelection = () => {
  const selectedRows = props.rows.filter((row, index) => selectedKeys.value.includes(getKey(row, index)))
  emit('selection-change', selectedRows)
}

const toggleRow = (row, index) => {
  const key = getKey(row, index)
  selectedKeys.value = selectedKeys.value.includes(key)
    ? selectedKeys.value.filter(item => item !== key)
    : [...selectedKeys.value, key]
  emitSelection()
}

const toggleAll = event => {
  selectedKeys.value = event.target.checked ? props.rows.map((row, index) => getKey(row, index)) : []
  emitSelection()
}

const formatValue = (row, column) => {
  const value = row[column.key]
  return typeof column.formatter === 'function' ? column.formatter(value, row) : value
}
</script>

<style scoped>
.table-card { background: #fff; border: 1px solid #e5edf7; border-radius: 18px; box-shadow: 0 16px 40px rgba(15, 23, 42, .07); overflow: hidden; }
.table-header { padding: 16px 18px; border-bottom: 1px solid #e5edf7; background: linear-gradient(180deg, #f8fafc, #fff); }
.table-scroll { width: 100%; overflow-x: auto; }
.base-table { width: 100%; border-collapse: collapse; min-width: 760px; }
th { padding: 14px 16px; background: #f8fafc; color: #475569; font-size: 12px; font-weight: 900; text-transform: uppercase; letter-spacing: .04em; border-bottom: 1px solid #e5edf7; white-space: nowrap; }
td { padding: 14px 16px; color: #0f172a; font-size: 14px; border-bottom: 1px solid #edf2f7; }
tbody tr { transition: .16s ease; cursor: pointer; }
tbody tr:hover { background: #f8fbff; }
tbody tr.selected { background: #eff6ff; }
.sortable { cursor: pointer; user-select: none; }
.sort-icon { margin-left: 6px; color: #94a3b8; }
.check-col { width: 45px; text-align: center; }
.action-col { width: 120px; text-align: right; }
.state-cell { text-align: center; padding: 32px 16px; color: #64748b; }
</style>