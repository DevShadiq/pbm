<template>
  <div class="page">
    <div class="page-header">
      <div>
        <h1>Institutions</h1>
        <p>Manage school, college, madrasa, coaching and other institutions.</p>
      </div>

      <BaseButton @click="goToCreate">
        + Create Institution
      </BaseButton>
    </div>

    <div class="filter-card">
      <BaseInput
        v-model="search"
        label="Search"
        placeholder="Search by name, code, phone or email"
      />

      <BaseSelect
        v-model="selectedType"
        label="Institution Type"
        :options="typeFilterOptions"
        placeholder="All types"
      />

      <BaseSelect
        v-model="selectedStatus"
        label="Status"
        :options="statusFilterOptions"
        placeholder="All status"
      />
    </div>

    <AlertMessage
      v-if="alert.message"
      :type="alert.type"
      :message="alert.message"
      @close="alert.message = ''"
    />

    <InstitutionListTable
      :institutions="filteredInstitutions"
      :loading="loading"
      @edit="goToEdit"
    />
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from "vue";
import { useRouter } from "vue-router";

import BaseInput from "../../components/common/BaseInput.vue";
import BaseSelect from "../../components/common/BaseSelect.vue";
import BaseButton from "../../components/common/BaseButton.vue";
import AlertMessage from "../../components/common/AlertMessage.vue";

import InstitutionListTable from "../../components/institution/InstitutionListTable.vue";
import { getInstitutions } from "../../services/institutionService";

const router = useRouter();

const loading = ref(false);
const institutions = ref([]);

const search = ref("");
const selectedType = ref("");
const selectedStatus = ref("");

const alert = reactive({
  type: "success",
  message: "",
});

const typeFilterOptions = [
  { label: "All Types", value: "" },
  { label: "School", value: "School" },
  { label: "College", value: "College" },
  { label: "School & College", value: "School & College" },
  { label: "Madrasa", value: "Madrasa" },
  { label: "Coaching Center", value: "Coaching Center" },
  { label: "University", value: "University" },
  { label: "Polytechnic", value: "Polytechnic" },
  { label: "Vocational Institute", value: "Vocational Institute" },
];

const statusFilterOptions = [
  { label: "All Status", value: "" },
  { label: "Active", value: "ACTIVE" },
  { label: "Inactive", value: "INACTIVE" },
];

const normalizeList = (response) => {
  const data = response?.data;

  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.data)) return data.data;
  if (Array.isArray(data?.rows)) return data.rows;

  return [];
};

const loadInstitutions = async () => {
  loading.value = true;

  try {
    const response = await getInstitutions();
    institutions.value = normalizeList(response);
  } catch (error) {
    console.error(error);
    alert.type = "error";
    alert.message = "Failed to load institution list.";
  } finally {
    loading.value = false;
  }
};

const filteredInstitutions = computed(() => {
  const keyword = search.value.toLowerCase().trim();

  return institutions.value.filter((item) => {
    const matchKeyword =
      !keyword ||
      item.institution_code?.toLowerCase().includes(keyword) ||
      item.institution_name?.toLowerCase().includes(keyword) ||
      item.institution_name_bn?.toLowerCase().includes(keyword) ||
      item.phone?.toLowerCase().includes(keyword) ||
      item.phone_bn?.toLowerCase().includes(keyword) ||
      item.district_bn?.toLowerCase().includes(keyword) ||
      item.upazila_bn?.toLowerCase().includes(keyword) ||
      item.post_office_bn?.toLowerCase().includes(keyword) ||
      item.email?.toLowerCase().includes(keyword);

    const matchType =
      !selectedType.value || item.institution_type === selectedType.value;

    const matchStatus =
      !selectedStatus.value || item.status === selectedStatus.value;

    return matchKeyword && matchType && matchStatus;
  });
});

const goToCreate = () => {
  router.push("/institutions/create");
};

const goToEdit = (item) => {
  router.push(`/institutions/${item.institution_id}/edit`);
};

onMounted(loadInstitutions);
</script>

<style scoped>
.page {
  display: flex;
  flex-direction: column;
  gap: 22px;
}

.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 18px;
  background: linear-gradient(135deg, #eef6ff, #ffffff);
  border: 1px solid #e2e8f0;
  border-radius: 22px;
  padding: 24px;
}

.page-header h1 {
  margin: 0;
  color: #0f172a;
  font-size: 28px;
  font-weight: 900;
}

.page-header p {
  margin: 6px 0 0;
  color: #64748b;
}

.filter-card {
  display: grid;
  grid-template-columns: 2fr 1fr 1fr;
  gap: 16px;
  background: #ffffff;
  border: 1px solid #e5edf7;
  border-radius: 20px;
  padding: 18px;
  box-shadow: 0 10px 28px rgba(15, 23, 42, 0.05);
}

@media (max-width: 900px) {
  .page-header {
    align-items: flex-start;
    flex-direction: column;
  }

  .filter-card {
    grid-template-columns: 1fr;
  }
}
</style>
