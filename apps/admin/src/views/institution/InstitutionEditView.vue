<template>
  <div class="page">
    <InstitutionForm
      mode="edit"
      :institution-id="institutionId"
      @saved="handleSaved"
      @cancel="goBack"
    />
  </div>
</template>

<script setup>
import { computed } from "vue";
import { useRoute, useRouter } from "vue-router";

import InstitutionForm from "../../components/institution/InstitutionForm.vue";

const route = useRoute();
const router = useRouter();

const institutionId = computed(() => route.params.id);

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