<template>
  <ResetPasswordForm :token="token" :loading="loading" @submit="resetPassword" @back-login="router.push('/login')" />
</template>

<script setup>
import { computed, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import ResetPasswordForm from "../../components/auth/ResetPasswordForm.vue";
import api from "../../services/api";

const route = useRoute();
const router = useRouter();
const loading = ref(false);
const token = computed(() => String(route.query.token || ""));

async function resetPassword({ token: resetToken, password }) {
  try {
    loading.value = true;
    const response = await api.post("/auth/reset-password", { token: resetToken, password });
    alert(response.data.message);
    router.push("/login");
  } catch (error) {
    alert(error.response?.data?.message || "Unable to reset the password. Please request a new link.");
  } finally {
    loading.value = false;
  }
}
</script>
