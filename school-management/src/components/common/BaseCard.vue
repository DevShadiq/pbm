<template>
  <section class="base-card" :class="[{ hoverable }, `tone-${tone}`]">
    <div v-if="$slots.header || title" class="card-header">
      <div>
        <h3 v-if="title" class="card-title">{{ title }}</h3>
        <p v-if="subtitle" class="card-subtitle">{{ subtitle }}</p>
      </div>
      <slot name="header-action" />
    </div>

    <div class="card-body">
      <slot />
    </div>

    <div v-if="$slots.footer" class="card-footer">
      <slot name="footer" />
    </div>
  </section>
</template>

<script setup>
defineProps({
  title: { type: String, default: '' },
  subtitle: { type: String, default: '' },
  tone: { type: String, default: 'default' },
  hoverable: { type: Boolean, default: false }
})
</script>

<style scoped>
.base-card { background: #fff; border: 1px solid #e5edf7; border-radius: 20px; box-shadow: 0 16px 40px rgba(15, 23, 42, .07); overflow: hidden; transition: .2s ease; }
.hoverable:hover { transform: translateY(-3px); box-shadow: 0 22px 55px rgba(15, 23, 42, .10); }
.card-header { padding: 18px 20px; border-bottom: 1px solid #e5edf7; display: flex; justify-content: space-between; gap: 16px; align-items: flex-start; background: linear-gradient(180deg, #f8fafc, #fff); }
.card-title { margin: 0; color: #0f172a; font-size: 17px; font-weight: 900; }
.card-subtitle { margin: 5px 0 0; color: #64748b; font-size: 13px; }
.card-body { padding: 20px; }
.card-footer { padding: 14px 20px; border-top: 1px solid #e5edf7; background: #f8fafc; }
.tone-primary { border-color: #bfdbfe; }
.tone-success { border-color: #bbf7d0; }
.tone-warning { border-color: #fed7aa; }
.tone-danger { border-color: #fecaca; }
</style>