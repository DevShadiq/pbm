<template>
  <main class="min-h-screen bg-gray-100 text-gray-900">
    <aside class="fixed inset-y-0 left-0 hidden lg:flex w-72 bg-bdGreen-900 text-white flex-col">
      <div class="p-6 border-b border-white/10">
        <a href="/admin" class="flex items-center gap-3">
          <span class="w-11 h-11 rounded-lg bg-white/10 flex items-center justify-center">
            <i class="fas fa-school"></i>
          </span>
          <span>
            <strong class="block text-lg">PBM Admin</strong>
            <span class="text-xs text-white/50">Education Management</span>
          </span>
        </a>
      </div>

      <nav class="p-4 space-y-2 flex-1">
        <button
          v-for="item in navItems"
          :key="item.id"
          class="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors"
          :class="activeTab === item.id ? 'bg-white text-bdGreen-900' : 'text-white/70 hover:bg-white/10 hover:text-white'"
          @click="activeTab = item.id"
        >
          <i :class="item.icon" class="w-5 text-center"></i>
          {{ item.label }}
        </button>
      </nav>

      <div class="p-4 border-t border-white/10">
        <a href="/" class="flex items-center gap-3 px-4 py-3 rounded-lg text-white/70 hover:bg-white/10 hover:text-white">
          <i class="fas fa-globe"></i>
          Public website
        </a>
      </div>
    </aside>

    <section class="lg:pl-72">
      <header class="sticky top-0 z-30 bg-white/90 backdrop-blur border-b border-gray-200">
        <div class="px-4 md:px-8 py-4 flex items-center justify-between gap-4">
          <div>
            <p class="text-xs uppercase tracking-widest text-bdGreen-700 font-black">Administration</p>
            <h1 class="text-xl md:text-2xl font-black">{{ currentTitle }}</h1>
          </div>
          <div class="flex items-center gap-3">
            <span class="hidden sm:block text-sm text-gray-500">{{ user?.name }}</span>
            <button class="bg-gray-900 hover:bg-black text-white rounded-lg px-4 py-2 text-sm font-bold" @click="logout">
              <i class="fas fa-right-from-bracket mr-2"></i>
              Logout
            </button>
          </div>
        </div>

        <div class="lg:hidden px-4 pb-4 flex gap-2 overflow-x-auto">
          <button
            v-for="item in navItems"
            :key="item.id"
            class="shrink-0 px-4 py-2 rounded-lg text-sm font-bold"
            :class="activeTab === item.id ? 'bg-bdGreen-700 text-white' : 'bg-gray-100 text-gray-600'"
            @click="activeTab = item.id"
          >
            <i :class="item.icon" class="mr-2"></i>{{ item.label }}
          </button>
        </div>
      </header>

      <div class="p-4 md:p-8">
        <div v-if="message" class="mb-6 rounded-lg bg-bdGreen-50 border border-bdGreen-200 text-bdGreen-800 px-4 py-3 text-sm">
          {{ message }}
        </div>
        <div v-if="error" class="mb-6 rounded-lg bg-red-50 border border-red-200 text-red-700 px-4 py-3 text-sm">
          {{ error }}
        </div>

        <section v-if="activeTab === 'dashboard'" class="space-y-6">
          <div class="grid sm:grid-cols-2 xl:grid-cols-4 gap-4">
            <article v-for="card in statCards" :key="card.label" class="bg-white rounded-lg border border-gray-200 p-5">
              <div class="flex items-center justify-between">
                <div>
                  <p class="text-sm text-gray-500">{{ card.label }}</p>
                  <strong class="text-3xl font-black">{{ card.value }}</strong>
                </div>
                <span class="w-12 h-12 rounded-lg bg-bdGreen-50 text-bdGreen-700 flex items-center justify-center">
                  <i :class="card.icon"></i>
                </span>
              </div>
            </article>
          </div>

          <article class="bg-white rounded-lg border border-gray-200 p-6">
            <h2 class="text-lg font-black mb-4">System Modules Roadmap</h2>
            <div class="grid md:grid-cols-2 xl:grid-cols-3 gap-3">
              <div v-for="module in modules" :key="module" class="flex items-center gap-3 rounded-lg bg-gray-50 border border-gray-200 p-4">
                <i class="fas fa-circle-check text-bdGreen-600"></i>
                <span class="font-bold text-sm">{{ module }}</span>
              </div>
            </div>
          </article>
        </section>

        <section v-if="activeTab === 'settings'" class="bg-white rounded-lg border border-gray-200 p-6">
          <h2 class="text-lg font-black mb-5">School Website Settings</h2>
          <form class="grid md:grid-cols-2 gap-4" @submit.prevent="saveSettings">
            <label class="block">
              <span class="text-sm font-bold text-gray-700">Bangla Name</span>
              <input v-model="settings.name_bn" class="mt-2 w-full rounded-lg border border-gray-300 px-4 py-3">
            </label>
            <label class="block">
              <span class="text-sm font-bold text-gray-700">English Name</span>
              <input v-model="settings.name_en" class="mt-2 w-full rounded-lg border border-gray-300 px-4 py-3">
            </label>
            <label class="block">
              <span class="text-sm font-bold text-gray-700">EIIN</span>
              <input v-model="settings.eiin" class="mt-2 w-full rounded-lg border border-gray-300 px-4 py-3">
            </label>
            <label class="block">
              <span class="text-sm font-bold text-gray-700">Phone</span>
              <input v-model="settings.phone" class="mt-2 w-full rounded-lg border border-gray-300 px-4 py-3">
            </label>
            <label class="block">
              <span class="text-sm font-bold text-gray-700">Email</span>
              <input v-model="settings.email" class="mt-2 w-full rounded-lg border border-gray-300 px-4 py-3">
            </label>
            <label class="block">
              <span class="text-sm font-bold text-gray-700">Address</span>
              <input v-model="settings.address" class="mt-2 w-full rounded-lg border border-gray-300 px-4 py-3">
            </label>
            <label class="block md:col-span-2">
              <span class="text-sm font-bold text-gray-700">Breaking News</span>
              <textarea v-model="settings.breaking_news" rows="3" class="mt-2 w-full rounded-lg border border-gray-300 px-4 py-3"></textarea>
            </label>
            <div class="md:col-span-2">
              <button class="bg-bdGreen-700 hover:bg-bdGreen-800 text-white rounded-lg px-5 py-3 font-bold">
                <i class="fas fa-floppy-disk mr-2"></i>
                Save Settings
              </button>
            </div>
          </form>
        </section>

        <section v-if="activeTab === 'notices'" class="grid xl:grid-cols-[420px_1fr] gap-6">
          <form class="bg-white rounded-lg border border-gray-200 p-6 h-fit" @submit.prevent="saveNotice">
            <h2 class="text-lg font-black mb-5">{{ noticeForm.id ? 'Edit Notice' : 'New Notice' }}</h2>
            <label class="block mb-4">
              <span class="text-sm font-bold text-gray-700">Title</span>
              <input v-model="noticeForm.title" class="mt-2 w-full rounded-lg border border-gray-300 px-4 py-3" required>
            </label>
            <label class="block mb-4">
              <span class="text-sm font-bold text-gray-700">Category</span>
              <select v-model="noticeForm.category" class="mt-2 w-full rounded-lg border border-gray-300 px-4 py-3">
                <option>ভর্তি</option>
                <option>পরীক্ষা</option>
                <option>প্রশাসন</option>
              </select>
            </label>
            <label class="block mb-4">
              <span class="text-sm font-bold text-gray-700">Publish Date</span>
              <input v-model="noticeForm.published_at" type="date" class="mt-2 w-full rounded-lg border border-gray-300 px-4 py-3" required>
            </label>
            <label class="flex items-center gap-3 mb-4">
              <input v-model="noticeForm.urgent" type="checkbox" class="w-5 h-5">
              <span class="text-sm font-bold text-gray-700">Mark as urgent</span>
            </label>
            <label class="block mb-5">
              <span class="text-sm font-bold text-gray-700">Detail</span>
              <textarea v-model="noticeForm.detail" rows="5" class="mt-2 w-full rounded-lg border border-gray-300 px-4 py-3" required></textarea>
            </label>
            <div class="flex gap-3">
              <button class="bg-bdGreen-700 hover:bg-bdGreen-800 text-white rounded-lg px-5 py-3 font-bold">
                Save
              </button>
              <button type="button" class="bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg px-5 py-3 font-bold" @click="resetNotice">
                Clear
              </button>
            </div>
          </form>

          <div class="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <div class="p-5 border-b border-gray-200 flex items-center justify-between">
              <h2 class="text-lg font-black">Notices</h2>
              <span class="text-sm text-gray-500">{{ notices.length }} total</span>
            </div>
            <div class="divide-y divide-gray-200">
              <article v-for="notice in notices" :key="notice.id" class="p-5 flex gap-4 justify-between">
                <div>
                  <h3 class="font-black">{{ notice.title }}</h3>
                  <p class="text-sm text-gray-500 mt-1">{{ notice.category }} · {{ notice.published_at }}</p>
                  <p class="text-sm text-gray-600 mt-2 line-clamp-2">{{ notice.detail }}</p>
                </div>
                <div class="flex gap-2 shrink-0">
                  <button class="w-10 h-10 rounded-lg bg-gray-100 hover:bg-gray-200" @click="editNotice(notice)">
                    <i class="fas fa-pen"></i>
                  </button>
                  <button class="w-10 h-10 rounded-lg bg-red-50 text-red-600 hover:bg-red-100" @click="removeNotice(notice.id)">
                    <i class="fas fa-trash"></i>
                  </button>
                </div>
              </article>
            </div>
          </div>
        </section>

        <section v-if="activeTab === 'teachers'" class="grid xl:grid-cols-[420px_1fr] gap-6">
          <form class="bg-white rounded-lg border border-gray-200 p-6 h-fit" @submit.prevent="saveTeacher">
            <h2 class="text-lg font-black mb-5">{{ teacherForm.id ? 'Edit Teacher' : 'New Teacher' }}</h2>
            <label v-for="field in teacherFields" :key="field.key" class="block mb-4">
              <span class="text-sm font-bold text-gray-700">{{ field.label }}</span>
              <input v-model="teacherForm[field.key]" class="mt-2 w-full rounded-lg border border-gray-300 px-4 py-3" required>
            </label>
            <div class="flex gap-3">
              <button class="bg-bdGreen-700 hover:bg-bdGreen-800 text-white rounded-lg px-5 py-3 font-bold">
                Save
              </button>
              <button type="button" class="bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg px-5 py-3 font-bold" @click="resetTeacher">
                Clear
              </button>
            </div>
          </form>

          <div class="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
            <article v-for="teacher in teachers" :key="teacher.id" class="bg-white rounded-lg border border-gray-200 overflow-hidden">
              <img :src="teacher.photo" :alt="teacher.name" class="w-full h-40 object-cover">
              <div class="p-5">
                <h3 class="font-black">{{ teacher.name }}</h3>
                <p class="text-sm text-bdGreen-700 font-bold mt-1">{{ teacher.designation }}</p>
                <p class="text-sm text-gray-500">{{ teacher.subject }}</p>
                <div class="flex gap-2 mt-4">
                  <button class="flex-1 rounded-lg bg-gray-100 hover:bg-gray-200 py-2 text-sm font-bold" @click="editTeacher(teacher)">
                    Edit
                  </button>
                  <button class="flex-1 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 py-2 text-sm font-bold" @click="removeTeacher(teacher.id)">
                    Delete
                  </button>
                </div>
              </div>
            </article>
          </div>
        </section>
      </div>
    </section>
  </main>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue';
import { api, clearSession, getStoredUser } from './api.js';

const user = ref(getStoredUser());
const activeTab = ref('dashboard');
const error = ref('');
const message = ref('');
const overview = ref({ totals: {} });
const notices = ref([]);
const teachers = ref([]);

const settings = reactive({
  name_bn: '',
  name_en: '',
  eiin: '',
  phone: '',
  email: '',
  address: '',
  breaking_news: '',
});

const blankNotice = () => ({
  id: null,
  title: '',
  category: 'ভর্তি',
  detail: '',
  urgent: false,
  published_at: new Date().toISOString().slice(0, 10),
});

const blankTeacher = () => ({
  id: null,
  name: '',
  subject: '',
  designation: '',
  qualification: '',
  category: '',
  photo: 'https://picsum.photos/seed/newteacher/400/400.jpg',
});

const noticeForm = reactive(blankNotice());
const teacherForm = reactive(blankTeacher());

const navItems = [
  { id: 'dashboard', label: 'Dashboard', icon: 'fas fa-chart-pie' },
  { id: 'settings', label: 'Settings', icon: 'fas fa-gear' },
  { id: 'notices', label: 'Notices', icon: 'fas fa-bullhorn' },
  { id: 'teachers', label: 'Teachers', icon: 'fas fa-chalkboard-user' },
];

const modules = [
  'Student information',
  'Teacher profiles',
  'Attendance tracking',
  'Exam and result management',
  'Admission applications',
  'Fees and accounts',
  'Guardian portal',
  'SMS/email notifications',
  'Website content management',
];

const teacherFields = [
  { key: 'name', label: 'Name' },
  { key: 'subject', label: 'Subject' },
  { key: 'designation', label: 'Designation' },
  { key: 'qualification', label: 'Qualification' },
  { key: 'category', label: 'Category' },
  { key: 'photo', label: 'Photo URL' },
];

const currentTitle = computed(() => navItems.find((item) => item.id === activeTab.value)?.label || 'Dashboard');

const statCards = computed(() => [
  { label: 'Notices', value: overview.value.totals?.notices || 0, icon: 'fas fa-bullhorn' },
  { label: 'Teachers', value: overview.value.totals?.teachers || 0, icon: 'fas fa-chalkboard-user' },
  { label: 'Admissions', value: overview.value.totals?.admissions || 0, icon: 'fas fa-user-plus' },
  { label: 'Pending', value: overview.value.totals?.pendingAdmissions || 0, icon: 'fas fa-clock' },
]);

function setMessage(text) {
  message.value = text;
  error.value = '';
  setTimeout(() => {
    if (message.value === text) message.value = '';
  }, 3000);
}

function setError(err) {
  error.value = err.message || 'Something went wrong.';
  message.value = '';
}

function fillSettings(row) {
  Object.assign(settings, {
    name_bn: row.name_bn || '',
    name_en: row.name_en || '',
    eiin: row.eiin || '',
    phone: row.phone || '',
    email: row.email || '',
    address: row.address || '',
    breaking_news: row.breaking_news || '',
  });
}

async function loadData() {
  try {
    const [overviewData, noticeData, teacherData] = await Promise.all([
      api.overview(),
      api.notices(),
      api.teachers(),
    ]);
    overview.value = overviewData;
    notices.value = noticeData.notices;
    teachers.value = teacherData.teachers;
    fillSettings(overviewData.settings);
  } catch (err) {
    if (err.message.includes('Session')) logout();
    setError(err);
  }
}

async function saveSettings() {
  try {
    const data = await api.updateSettings(settings);
    fillSettings(data.settings);
    setMessage('Settings saved.');
  } catch (err) {
    setError(err);
  }
}

function resetNotice() {
  Object.assign(noticeForm, blankNotice());
}

function editNotice(notice) {
  Object.assign(noticeForm, {
    ...notice,
    urgent: Boolean(notice.urgent),
  });
  activeTab.value = 'notices';
}

async function saveNotice() {
  try {
    await api.saveNotice(noticeForm);
    resetNotice();
    await loadData();
    setMessage('Notice saved.');
  } catch (err) {
    setError(err);
  }
}

async function removeNotice(id) {
  if (!window.confirm('Delete this notice?')) return;
  try {
    await api.deleteNotice(id);
    await loadData();
    setMessage('Notice deleted.');
  } catch (err) {
    setError(err);
  }
}

function resetTeacher() {
  Object.assign(teacherForm, blankTeacher());
}

function editTeacher(teacher) {
  Object.assign(teacherForm, teacher);
  activeTab.value = 'teachers';
}

async function saveTeacher() {
  try {
    await api.saveTeacher(teacherForm);
    resetTeacher();
    await loadData();
    setMessage('Teacher saved.');
  } catch (err) {
    setError(err);
  }
}

async function removeTeacher(id) {
  if (!window.confirm('Delete this teacher?')) return;
  try {
    await api.deleteTeacher(id);
    await loadData();
    setMessage('Teacher deleted.');
  } catch (err) {
    setError(err);
  }
}

function logout() {
  clearSession();
  window.location.href = '/login';
}

onMounted(async () => {
  try {
    const session = await api.me();
    user.value = session.user;
    await loadData();
  } catch {
    logout();
  }
});
</script>

