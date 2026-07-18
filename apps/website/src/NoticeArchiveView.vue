<template>
  <main class="min-h-screen bg-slate-50 text-slate-800">
    <header class="bg-gradient-to-r from-bdGreen-800 via-bdGreen-700 to-bdGreen-600 text-white shadow-lg">
      <div class="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-5">
        <a href="/" class="inline-flex items-center gap-2 rounded-xl bg-white/15 px-4 py-2 text-sm font-semibold transition hover:bg-white/25">
          <i class="fas fa-arrow-left"></i> মূল ওয়েবসাইট
        </a>
        <img src="/logo.png" alt="প্রতিষ্ঠানের লোগো" class="h-12 w-12 rounded-full bg-white/10 p-1 object-contain">
      </div>
      <div class="mx-auto max-w-7xl px-4 pb-12 pt-5 text-center">
        <span class="rounded-full bg-white/15 px-4 py-1 text-xs font-bold tracking-wide">NOTICE ARCHIVE</span>
        <h1 class="mt-4 text-3xl font-black md:text-5xl">সকল নোটিশ ও বিজ্ঞপ্তি</h1>
        <p class="mt-3 text-sm text-green-100 md:text-base">ভর্তি, পরীক্ষা, প্রশাসন ও সাধারণ সকল নোটিশ এক জায়গায় খুঁজুন</p>
      </div>
    </header>

    <section class="mx-auto max-w-7xl px-4 pb-16">
      <div class="relative -mt-7 rounded-2xl border border-slate-100 bg-white p-4 shadow-xl md:p-6">
        <div class="grid gap-3 md:grid-cols-[minmax(0,1fr)_180px_190px]">
          <label class="relative block">
            <i class="fas fa-search absolute left-4 top-1/2 -translate-y-1/2 text-sm text-slate-400"></i>
            <input v-model.trim="search" type="search" placeholder="শিরোনাম বা নোটিশের লেখা খুঁজুন..." class="w-full rounded-xl border border-slate-200 py-3 pl-10 pr-4 text-sm outline-none transition focus:border-bdGreen-500 focus:ring-4 focus:ring-bdGreen-100">
          </label>
          <select v-model="year" class="rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-bdGreen-500">
            <option value="">সকল বছর</option>
            <option v-for="item in years" :key="item" :value="item">{{ item }} সাল</option>
          </select>
          <select v-model="category" class="rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-bdGreen-500">
            <option value="">সকল বিভাগ</option>
            <option v-for="item in categories" :key="item" :value="item">{{ item }}</option>
          </select>
        </div>
        <div class="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4 text-sm">
          <p class="text-slate-500"><b class="text-bdGreen-700">{{ filteredNotices.length }}</b> টি নোটিশ পাওয়া গেছে</p>
          <button v-if="search || year || category" type="button" class="font-bold text-bdGreen-700 hover:text-bdGreen-900" @click="resetFilters">
            <i class="fas fa-times-circle mr-1"></i> ফিল্টার মুছুন
          </button>
        </div>
      </div>

      <div v-if="loading" class="py-20 text-center text-slate-500"><i class="fas fa-spinner fa-spin mr-2"></i>নোটিশ লোড হচ্ছে...</div>
      <div v-else-if="error" class="mx-auto mt-10 max-w-xl rounded-2xl border border-red-100 bg-red-50 p-6 text-center text-red-700">{{ error }}</div>
      <div v-else-if="!filteredNotices.length" class="mx-auto mt-10 max-w-xl rounded-2xl border border-slate-100 bg-white p-10 text-center shadow-sm">
        <i class="fas fa-search text-3xl text-slate-300"></i><p class="mt-4 font-bold text-slate-600">আপনার খোঁজ অনুযায়ী কোনো নোটিশ পাওয়া যায়নি।</p>
      </div>

      <div v-else class="mt-10 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        <article v-for="notice in filteredNotices" :key="notice.notice_id" class="group flex cursor-pointer flex-col rounded-2xl border border-slate-100 bg-white p-5 shadow-sm transition duration-200 hover:-translate-y-1 hover:border-bdGreen-200 hover:shadow-xl" @click="selected = notice">
          <div class="flex items-start justify-between gap-3">
            <span class="rounded-full bg-bdGreen-50 px-3 py-1 text-xs font-bold text-bdGreen-700">{{ notice.category }}</span>
            <span v-if="notice.urgent" class="rounded-full bg-red-50 px-3 py-1 text-xs font-bold text-red-600">জরুরি</span>
          </div>
          <h2 class="mt-5 line-clamp-2 text-lg font-black leading-snug text-slate-800 group-hover:text-bdGreen-700">{{ notice.title }}</h2>
          <p class="mt-3 line-clamp-3 text-sm leading-6 text-slate-500">{{ notice.detail }}</p>
          <div class="mt-5 flex items-center justify-between border-t border-slate-100 pt-4 text-xs text-slate-400">
            <span><i class="far fa-calendar mr-1"></i>{{ notice.date }}</span>
            <span class="font-bold text-bdGreen-700">বিস্তারিত <i class="fas fa-arrow-right ml-1"></i></span>
          </div>
        </article>
      </div>
    </section>

    <transition name="fade">
      <div v-if="selected" class="fixed inset-0 z-50 flex items-center justify-center p-4" @click="selected = null">
        <div class="absolute inset-0 bg-slate-950/60 backdrop-blur-sm"></div>
        <article class="relative max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-3xl bg-white shadow-2xl" @click.stop>
          <header class="bg-bdGreen-700 px-7 py-6 text-white">
            <button type="button" class="absolute right-4 top-4 grid h-9 w-9 place-items-center rounded-full bg-white/15 hover:bg-white/25" @click="selected = null"><i class="fas fa-times"></i></button>
            <span class="rounded-full bg-white/15 px-3 py-1 text-xs">{{ selected.category }}</span>
            <h2 class="mt-3 pr-8 text-xl font-black">{{ selected.title }}</h2>
            <p class="mt-2 text-sm text-green-100"><i class="far fa-calendar mr-1"></i>{{ selected.date }}</p>
          </header>
          <div class="notice-content p-7 text-slate-600">
            <div v-if="selected.detail_html" v-html="selected.detail_html"></div>
            <p v-else>{{ selected.detail }}</p>
            <div v-if="selected.attachment_url" class="mt-8 flex flex-wrap gap-3 border-t border-slate-100 pt-5">
              <a :href="selected.attachment_url" target="_blank" rel="noopener" class="rounded-xl bg-bdGreen-50 px-4 py-2 text-sm font-bold text-bdGreen-700"><i class="fas fa-external-link-alt mr-2"></i>ওপেন</a>
              <a :href="selected.attachment_url" download class="rounded-xl bg-slate-100 px-4 py-2 text-sm font-bold text-slate-600"><i class="fas fa-download mr-2"></i>ডাউনলোড</a>
            </div>
          </div>
        </article>
      </div>
    </transition>
  </main>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue';
import { api } from './api.js';

const notices = ref([]);
const loading = ref(true);
const error = ref('');
const search = ref('');
const year = ref('');
const category = ref('');
const selected = ref(null);

const getYear = (notice) => String(notice.published_at_iso || notice.date || '').match(/\d{4}/)?.[0] || '';
const years = computed(() => [...new Set(notices.value.map(getYear).filter(Boolean))].sort((a, b) => Number(b) - Number(a)));
const categories = computed(() => [...new Set(notices.value.map((notice) => notice.category).filter(Boolean))]);
const filteredNotices = computed(() => {
  const keyword = search.value.toLocaleLowerCase();
  return notices.value.filter((notice) => {
    const text = [notice.title, notice.category, notice.detail].filter(Boolean).join(' ').toLocaleLowerCase();
    return (!keyword || text.includes(keyword))
      && (!year.value || getYear(notice) === year.value)
      && (!category.value || notice.category === category.value);
  });
});

function resetFilters() {
  search.value = '';
  year.value = '';
  category.value = '';
}

onMounted(async () => {
  try {
    const data = await api.publicNotices();
    notices.value = (data.notices || []).map((notice) => ({
      ...notice,
      date: notice.published_at,
      urgent: Boolean(notice.urgent),
    }));
  } catch (loadError) {
    error.value = loadError.message || 'নোটিশ লোড করা যায়নি।';
  } finally {
    loading.value = false;
  }
});
</script>

<style scoped>
.notice-content { line-height: 1.8; }.notice-content :deep(p) { margin: 0 0 1rem; }.notice-content :deep(h2), .notice-content :deep(h3), .notice-content :deep(h4) { color: #14532d; font-weight: 800; margin: 1.25rem 0 .75rem; }.notice-content :deep(ul), .notice-content :deep(ol) { margin: 0 0 1rem; padding-left: 1.5rem; }.notice-content :deep(table) { width: 100%; border-collapse: collapse; margin: 1rem 0; }.notice-content :deep(th), .notice-content :deep(td) { border: 1px solid #cbd5e1; padding: .55rem; text-align: left; }.fade-enter-active, .fade-leave-active { transition: opacity .2s ease; }.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>
