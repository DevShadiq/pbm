<template>
  <LoginForm
    :loading="loading"
    @submit="handleLogin"
  />
</template>

<script setup>
import { ref } from "vue";
import { useRouter } from "vue-router";

import LoginForm from "../../components/auth/LoginForm.vue";
import api from "../../services/api";

const router = useRouter();
const loading = ref(false);
const handleLogin = async (payload) => {
  try {
    loading.value = true;

    const loginRes = await api.post("/auth/login", {
      username: payload.email,
      email: payload.email,
      password: payload.password,
    });

    console.log("Login response:", loginRes.data);

    const token =
      loginRes.data.token ||
      loginRes.data.accessToken ||
      loginRes.data.data?.token ||
      loginRes.data.data?.accessToken;

    if (!token) {
      alert("Login success but token not found.");
      return;
    }

    localStorage.setItem("sms_token", token);

    const accessRes = await api.get("/security/me/access");

    localStorage.setItem("sms_user", JSON.stringify(accessRes.data.data.user));
    localStorage.setItem("sms_menus", JSON.stringify(accessRes.data.data.menus || []));
    localStorage.setItem(
      "sms_permissions",
      JSON.stringify(accessRes.data.data.permissions || {})
    );

    router.push("/dashboard");
  } catch (error) {
    console.error("Login error response:", error.response?.data);
    console.error("Login error:", error);

    alert(error.response?.data?.message || "Login failed");
  } finally {
    loading.value = false;
  }
};

;
</script>
