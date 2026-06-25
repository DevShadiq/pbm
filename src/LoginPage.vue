<template>
  <main class="min-h-screen bg-gray-100 text-gray-900 flex">
    <section class="hidden lg:flex w-1/2 bg-bdGreen-900 text-white p-14 flex-col justify-between">
      <a href="/" class="inline-flex items-center gap-3 text-white/90 hover:text-white">
        <span class="w-11 h-11 rounded-lg bg-white/10 flex items-center justify-center">
          <i class="fas fa-school"></i>
        </span>
        <span>
          <strong class="block text-xl">PBM Admin</strong>
          <span class="text-sm text-white/60">Education management system</span>
        </span>
      </a>

      <div>
        <p class="text-sm uppercase tracking-widest text-gold-400 font-bold mb-4">Secure school operations</p>
        <h1 class="text-5xl font-black leading-tight mb-6">Manage notices, teachers, admissions, and school data.</h1>
        <p class="text-lg text-white/70 max-w-xl">
          This admin panel is the starting point for the full education management system.
        </p>
      </div>

     
    </section>

    <section class="w-full lg:w-1/2 flex items-center justify-center p-6">
      <form class="w-full max-w-md bg-white rounded-xl shadow-xl border border-gray-200 p-8" @submit.prevent="submit">
        <a href="/" class="inline-flex items-center gap-2 text-sm text-bdGreen-700 hover:text-bdGreen-800 mb-8">
          <i class="fas fa-arrow-left"></i>
          Public website
        </a>

        <h2 class="text-3xl font-black text-gray-900">Admin Login</h2>
        <p class="text-sm text-gray-500 mt-2 mb-8">Sign in to manage website and school data.</p>

        <div v-if="error" class="mb-5 rounded-lg bg-red-50 border border-red-200 text-red-700 px-4 py-3 text-sm">
          {{ error }}
        </div>

        <label class="block text-sm font-bold text-gray-700 mb-2" for="email">Email</label>
        <input
          id="email"
          v-model="form.email"
          type="email"
          class="w-full rounded-lg border border-gray-300 px-4 py-3 mb-5"
          autocomplete="email"
          required
        >

        <label class="block text-sm font-bold text-gray-700 mb-2" for="password">Password</label>
        <input
          id="password"
          v-model="form.password"
          type="password"
          class="w-full rounded-lg border border-gray-300 px-4 py-3 mb-6"
          autocomplete="current-password"
          required
        >

        <button
          type="submit"
          class="w-full bg-bdGreen-700 hover:bg-bdGreen-800 text-white rounded-lg py-3 font-bold transition-colors disabled:opacity-60"
          :disabled="loading"
        >
          <i class="fas fa-lock mr-2"></i>
          {{ loading ? 'Signing in...' : 'Sign in' }}
        </button>

        <div class="mt-6 rounded-lg bg-gray-50 border border-gray-200 p-4 text-sm text-gray-600">
          <p class="font-bold text-gray-800 mb-1">Seed admin</p>
          <p>Email: <span class="font-en">admin@pbm.edu.bd</span></p>
          <p>Password: <span class="font-en">Admin@12345</span></p>
        </div>
      </form>
    </section>
  </main>
</template>

<script setup>
import { reactive, ref } from 'vue';
import { api, saveSession } from './api.js';

const form = reactive({
  email: 'admin@pbm.edu.bd',
  password: 'Admin@12345',
});

const loading = ref(false);
const error = ref('');

async function submit() {
  loading.value = true;
  error.value = '';

  try {
    const session = await api.login(form.email, form.password);
    saveSession(session);
    window.location.href = '/admin';
  } catch (err) {
    error.value = err.message;
  } finally {
    loading.value = false;
  }
}
</script>

