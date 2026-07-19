<template>
  <ForgotPasswordForm :loading="loading" @submit="requestReset" @back-login="router.push('/login')" />
</template>

<script setup>
import { ref } from "vue";
import { useRouter } from "vue-router";
import ForgotPasswordForm from "../../components/auth/ForgotPasswordForm.vue";
import api from "../../services/api";

const router = useRouter();
const loading = ref(false);

async function requestReset({ email }) {
  try {
    loading.value = true;
    const response = await api.post("/auth/forgot-password", { email });
    alert(response.data.message);
    router.push("/login");
  } catch (error) {
    alert(error.response?.data?.message || "Unable to send a reset email. Please try again.");
  } finally {
    loading.value = false;
  }
}
</script>
