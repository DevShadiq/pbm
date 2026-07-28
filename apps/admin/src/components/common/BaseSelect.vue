<template>
  <div ref="root" class="base-field">
    <label v-if="label" class="base-label">{{ label }} <span v-if="required" class="required">*</span></label>
    <div :class="['select-wrapper', { 'has-error': error, disabled }]">
      <button type="button" class="select-trigger" :disabled="disabled" :aria-expanded="open" @click="toggle">
        <span class="trigger-text" :class="{ placeholder: !selected }">{{ selected?.label || placeholder }}</span>
        <svg class="chevron" :class="{ open }" viewBox="0 0 20 20" aria-hidden="true"><path d="m5 7 5 5 5-5" /></svg>
      </button>
      <div v-if="open" class="select-menu">
        <div class="search-wrap"><svg viewBox="0 0 20 20" aria-hidden="true"><circle cx="8.5" cy="8.5" r="4.5" /><path d="m12 12 4 4" /></svg><input ref="searchInput" v-model.trim="query" class="select-search" type="search" autocomplete="off" placeholder="Search options..." @keydown.esc="close" /></div>
        <div class="options" role="listbox">
          <button v-if="!required && placeholder" type="button" class="option" :class="{ selected: isSelected('') }" @click="choose(null)"><span>{{ placeholder }}</span><span v-if="isSelected('')" class="check">✓</span></button>
          <button v-for="option in filteredOptions" :key="String(option.value)" type="button" class="option" :class="{ selected: isSelected(option.value) }" @click="choose(option)"><span>{{ option.label }}</span><span v-if="isSelected(option.value)" class="check">✓</span></button>
          <p v-if="!filteredOptions.length" class="empty">No matching option.</p>
        </div>
      </div>
    </div>
    <small v-if="error" class="error-text">{{ error }}</small>
  </div>
</template>

<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref } from 'vue';

defineOptions({ inheritAttrs: false });
const props = defineProps({
  modelValue: { type: [String, Number, Boolean], default: '' },
  label: { type: String, default: '' },
  placeholder: { type: String, default: 'Select option' },
  options: { type: Array, default: () => [] },
  error: { type: String, default: '' },
  required: { type: Boolean, default: false },
  disabled: { type: Boolean, default: false },
});
const emit = defineEmits(['update:modelValue', 'change']);
const root = ref(null), searchInput = ref(null), open = ref(false), query = ref('');
const selected = computed(() => props.options.find((option) => String(option.value) === String(props.modelValue)));
const filteredOptions = computed(() => {
  const term = query.value.toLowerCase();
  return props.options.filter((option) => `${option.label} ${option.value}`.toLowerCase().includes(term));
});
const isSelected = (value) => String(value) === String(props.modelValue ?? '');
function close() { open.value = false; query.value = ''; }
function toggle() { if (props.disabled) return; open.value ? close() : (open.value = true, nextTick(() => searchInput.value?.focus())); }
function choose(option) { const value = option?.value ?? ''; emit('update:modelValue', value); emit('change', value); close(); }
function onDocumentClick(event) { if (root.value && !root.value.contains(event.target)) close(); }
onMounted(() => document.addEventListener('click', onDocumentClick));
onBeforeUnmount(() => document.removeEventListener('click', onDocumentClick));
</script>

<style scoped>
.base-field{width:100%;display:flex;flex-direction:column;gap:7px}.base-label{font-size:12px;font-weight:750;letter-spacing:.01em;color:#334155}.required{color:#dc2626}.select-wrapper{position:relative;width:100%;min-height:46px;border:1px solid #d7e0ec;border-radius:10px;background:#fff;box-shadow:0 1px 2px rgba(15,23,42,.03);transition:border-color .18s ease,box-shadow .18s ease,background .18s ease;box-sizing:border-box}.select-wrapper:focus-within{z-index:5;border-color:#4f46e5;box-shadow:0 0 0 3px rgba(79,70,229,.12)}.select-wrapper.has-error{border-color:#ef4444;background:#fffafa}.select-wrapper.disabled{background:#f8fafc}.select-trigger{display:flex;align-items:center;justify-content:space-between;width:100%;min-height:44px;padding:0 12px 0 13px;border:0;border-radius:10px;background:transparent;color:#172033;font-size:14px;font-weight:550;text-align:left;cursor:pointer}.trigger-text{min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.select-trigger:disabled{cursor:not-allowed;color:#94a3b8}.placeholder{color:#94a3b8;font-weight:450}.chevron{width:18px;height:18px;flex:0 0 auto;margin-left:10px;fill:none;stroke:#64748b;stroke-width:1.8;stroke-linecap:round;stroke-linejoin:round;transition:transform .18s ease}.chevron.open{transform:rotate(180deg)}.select-menu{position:absolute;z-index:50;top:calc(100% + 7px);left:0;width:100%;min-width:240px;padding:8px;border:1px solid #dbe3ef;border-radius:12px;background:#fff;box-shadow:0 18px 38px rgba(15,23,42,.16);animation:dropdown-in .14s ease-out}.search-wrap{position:relative}.search-wrap svg{position:absolute;top:50%;left:10px;width:16px;height:16px;fill:none;stroke:#94a3b8;stroke-width:1.8;stroke-linecap:round;transform:translateY(-50%);pointer-events:none}.select-search{width:100%;height:38px;padding:0 10px 0 33px;border:1px solid #d7e0ec;border-radius:8px;outline:none;background:#f8fafc;color:#1e293b;font:inherit;box-sizing:border-box}.select-search:focus{border-color:#818cf8;background:#fff;box-shadow:0 0 0 3px rgba(99,102,241,.1)}.options{max-height:230px;overflow:auto;margin-top:7px;padding-right:1px}.option{display:flex;align-items:center;justify-content:space-between;gap:12px;width:100%;padding:9px 10px;border:0;border-radius:7px;background:transparent;color:#334155;text-align:left;font:inherit;font-size:13px;cursor:pointer;transition:background .12s ease,color .12s ease}.option span:first-child{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.option:hover{background:#f1f5ff;color:#3730a3}.option.selected{background:#eef2ff;color:#4338ca;font-weight:700}.check{flex:0 0 auto;color:#4f46e5;font-size:14px;font-weight:900}.empty{margin:13px 10px;color:#64748b;font-size:13px;text-align:center}.error-text{color:#dc2626;font-size:12px;font-weight:600}@keyframes dropdown-in{from{opacity:0;transform:translateY(-4px)}to{opacity:1;transform:translateY(0)}}
</style>
