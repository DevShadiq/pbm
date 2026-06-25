<template>
  <div class="search-box" :class="{ focused }">
    <span class="search-icon">⌕</span>
    <input
      type="search"
      class="search-input"
      :value="modelValue"
      :placeholder="placeholder"
      @input="$emit('update:modelValue', $event.target.value)"
      @focus="focused = true"
      @blur="focused = false"
      @keyup.enter="$emit('search', modelValue)"
    />
    <button v-if="modelValue" type="button" class="clear-btn" @click="$emit('update:modelValue', '')">×</button>
  </div>
</template>

<script setup>
import { ref } from 'vue'

defineProps({
  modelValue: { type: String, default: '' },
  placeholder: { type: String, default: 'Search student, class, roll, mobile...' }
})

defineEmits(['update:modelValue', 'search'])
const focused = ref(false)
</script>

<style scoped>
.search-box { height: 46px; display: flex; align-items: center; gap: 10px; padding: 0 12px; background: #fff; border: 1px solid #dbe3ef; border-radius: 999px; box-shadow: 0 10px 24px rgba(15, 23, 42, .06); transition: .2s ease; }
.search-box.focused { border-color: #2563eb; box-shadow: 0 0 0 4px rgba(37, 99, 235, .12); }
.search-icon { font-size: 20px; color: #64748b; }
.search-input { flex: 1; border: 0; outline: 0; background: transparent; color: #0f172a; font-size: 14px; min-width: 160px; }
.search-input::placeholder { color: #94a3b8; }
.clear-btn { width: 25px; height: 25px; border: 0; border-radius: 50%; background: #eef2ff; color: #475569; cursor: pointer; }
</style>