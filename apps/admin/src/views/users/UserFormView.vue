<template>
  <div class="page">
    <UserCreateUpdateForm />
  </div>
</template>

<script setup>
import UserCreateUpdateForm from "../../components/auth/UserCreateUpdateForm.vue";
</script>

<style scoped>
.page {
  min-height: 100vh;
  background: #f8fafc;
  padding: 28px;
}
</style>