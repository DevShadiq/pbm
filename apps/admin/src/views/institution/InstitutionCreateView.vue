<template>
  <div class="page">
    <InstitutionForm
      mode="create"
      @saved="handleSaved"
      @cancel="goBack"
    />
  </div>
</template>

<script setup>
import { useRouter } from "vue-router";
import InstitutionForm from "../../components/institution/InstitutionForm.vue";

const router = useRouter();

const handleSaved = () => {
  router.push("/institutions");
};

const goBack = () => {
  router.push("/institutions");
};
</script>

<style scoped>
.page {
  display: flex;
  flex-direction: column;
  gap: 20px;
}
</style>