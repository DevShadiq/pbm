<template>
  <BaseCard
    :title="isEdit ? 'Update Institution' : 'Create Institution'"
    :subtitle="isEdit ? 'Update institution information' : 'Create a new institution profile'"
  >
    <AlertMessage
      v-if="alert.message"
      :type="alert.type"
      :message="alert.message"
      @close="alert.message = ''"
    />

    <form class="institution-form" @submit.prevent="handleSubmit">
      <div class="form-grid">
        <BaseInput
          v-model="form.institution_code"
          label="Institution Code"
          placeholder="e.g. SCH001"
          required
        />

        <BaseInput
          v-model="form.institution_name"
          label="Institution Name"
          placeholder="Enter institution name"
          required
        />

        <BaseInput
          v-model="form.institution_name_bn"
          label="Institution Name (Bangla)"
          placeholder="যেমন: পয়লা বানিয়াবাড়ী ফাজিল মাদরাসা"
        />

        <BaseInput
          v-model="form.short_name_bn"
          label="Short Name (Bangla)"
          placeholder="যেমন: পিবিএম"
        />

        <BaseSelect
          v-model="form.institution_type"
          label="Institution Type"
          :options="institutionTypeOptions"
          placeholder="Select institution type"
          required
        />

        <BaseSelect
          v-model="form.status"
          label="Status"
          :options="statusOptions"
          placeholder="Select status"
          required
        />

        <BaseInput
          v-model="form.eiin_no"
          label="EIIN No"
          placeholder="যেমন: 110124"
        />

        <BaseInput
          v-model="form.registration_no"
          label="Registration No"
          placeholder="নিবন্ধন নম্বর লিখুন"
        />

        <BaseInput
          v-model="form.phone"
          label="Phone"
          placeholder="Enter phone number"
        />

        <BaseInput
          v-model="form.phone_bn"
          label="Phone (Bangla)"
          placeholder="যেমন: ০১৫১৮৩৬৬১৭৮"
        />

        <BaseInput
          v-model="form.email"
          label="Email"
          placeholder="Enter email address"
          type="email"
        />

        <BaseInput
          v-model="form.website"
          label="Website"
          placeholder="https://example.com"
        />

        <BaseInput
          v-model="form.logo_url"
          label="Logo URL"
          placeholder="/logo.png অথবা logo image URL"
        />
      </div>

      <div class="form-group full">
        <label class="textarea-label">Address</label>
        <textarea
          v-model="form.address_line"
          class="textarea-control"
          placeholder="Enter full address"
          rows="4"
        ></textarea>
      </div>

      <div class="form-grid">
        <BaseInput
          v-model="form.post_office_bn"
          label="Post Office (Bangla)"
          placeholder="যেমন: মাহমুদপুর"
        />

        <BaseInput
          v-model="form.upazila_bn"
          label="Upazila (Bangla)"
          placeholder="যেমন: মেলান্দহ"
        />

        <BaseInput
          v-model="form.district_bn"
          label="District (Bangla)"
          placeholder="যেমন: জামালপুর"
        />
      </div>

      <div class="form-group full">
        <label class="textarea-label">Address (Bangla)</label>
        <textarea
          v-model="form.address_line_bn"
          class="textarea-control"
          placeholder="যেমন: বানিয়াবাড়ী"
          rows="4"
        ></textarea>
      </div>

      <div class="form-actions">
        <BaseButton type="button" variant="secondary" @click="handleCancel">
          Cancel
        </BaseButton>

        <BaseButton type="submit" :disabled="saving">
          {{ saving ? "Saving..." : isEdit ? "Update Institution" : "Create Institution" }}
        </BaseButton>
      </div>
    </form>
  </BaseCard>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from "vue";

import BaseCard from "../common/BaseCard.vue";
import BaseInput from "../common/BaseInput.vue";
import BaseSelect from "../common/BaseSelect.vue";
import BaseButton from "../common/BaseButton.vue";
import AlertMessage from "../common/AlertMessage.vue";

import {
  createInstitution,
  getInstitutionById,
  updateInstitution,
} from "../../services/institutionService";

const props = defineProps({
  mode: {
    type: String,
    default: "create",
  },
  institutionId: {
    type: [String, Number],
    default: null,
  },
});

const emit = defineEmits(["saved", "cancel"]);

const isEdit = computed(() => props.mode === "edit");

const saving = ref(false);

const alert = reactive({
  type: "success",
  message: "",
});

const form = reactive({
  institution_code: "",
  institution_name: "",
  institution_name_bn: "",
  short_name_bn: "",
  institution_type: "",
  eiin_no: "",
  registration_no: "",
  phone: "",
  phone_bn: "",
  email: "",
  website: "",
  logo_url: "",
  address_line: "",
  address_line_bn: "",
  district_bn: "",
  upazila_bn: "",
  post_office_bn: "",
  status: "ACTIVE",
});

const institutionTypeOptions = [
  { label: "School", value: "School" },
  { label: "College", value: "College" },
  { label: "School & College", value: "School & College" },
  { label: "Madrasa", value: "Madrasa" },
  { label: "Coaching Center", value: "Coaching Center" },
  { label: "University", value: "University" },
  { label: "Polytechnic", value: "Polytechnic" },
  { label: "Vocational Institute", value: "Vocational Institute" },
];

const statusOptions = [
  { label: "Active", value: "ACTIVE" },
  { label: "Inactive", value: "INACTIVE" },
];

const setAlert = (type, message) => {
  alert.type = type;
  alert.message = message;
};

const normalizeResponse = (response) => {
  return response?.data?.data || response?.data || {};
};

const loadInstitution = async () => {
  if (!isEdit.value || !props.institutionId) return;

  try {
    const response = await getInstitutionById(props.institutionId);
    const data = normalizeResponse(response);

    Object.assign(form, {
      institution_code: data.institution_code || "",
      institution_name: data.institution_name || "",
      institution_name_bn: data.institution_name_bn || "",
      short_name_bn: data.short_name_bn || "",
      institution_type: data.institution_type || "",
      eiin_no: data.eiin_no || "",
      registration_no: data.registration_no || "",
      phone: data.phone || "",
      phone_bn: data.phone_bn || "",
      email: data.email || "",
      website: data.website || "",
      logo_url: data.logo_url || "",
      address_line: data.address_line || "",
      address_line_bn: data.address_line_bn || "",
      district_bn: data.district_bn || "",
      upazila_bn: data.upazila_bn || "",
      post_office_bn: data.post_office_bn || "",
      status: data.status || "ACTIVE",
    });
  } catch (error) {
    console.error(error);
    setAlert("error", "Failed to load institution data.");
  }
};

const validateForm = () => {
  if (!form.institution_code.trim()) {
    setAlert("error", "Institution code is required.");
    return false;
  }

  if (!form.institution_name.trim()) {
    setAlert("error", "Institution name is required.");
    return false;
  }

  if (!form.institution_type) {
    setAlert("error", "Institution type is required.");
    return false;
  }

  if (!form.status) {
    setAlert("error", "Status is required.");
    return false;
  }

  return true;
};

const buildPayload = () => {
  return {
    institution_code: form.institution_code.trim(),
    institution_name: form.institution_name.trim(),
    institution_name_bn: form.institution_name_bn || null,
    short_name_bn: form.short_name_bn || null,
    institution_type: form.institution_type,
    eiin_no: form.eiin_no || null,
    registration_no: form.registration_no || null,
    phone: form.phone || null,
    phone_bn: form.phone_bn || null,
    email: form.email || null,
    website: form.website || null,
    logo_url: form.logo_url || null,
    address_line: form.address_line || null,
    address_line_bn: form.address_line_bn || null,
    district_bn: form.district_bn || null,
    upazila_bn: form.upazila_bn || null,
    post_office_bn: form.post_office_bn || null,
    status: form.status,
  };
};

const handleSubmit = async () => {
  if (!validateForm()) return;

  saving.value = true;

  try {
    const payload = buildPayload();

    if (isEdit.value) {
      await updateInstitution(props.institutionId, payload);
      setAlert("success", "Institution updated successfully.");
    } else {
      await createInstitution(payload);
      setAlert("success", "Institution created successfully.");
    }

    emit("saved");
  } catch (error) {
    console.error(error);

    const message =
      error?.response?.data?.message ||
      error?.response?.data?.error ||
      "Failed to save institution.";

    setAlert("error", message);
  } finally {
    saving.value = false;
  }
};

const handleCancel = () => {
  emit("cancel");
};

onMounted(loadInstitution);
</script>

<style scoped>
.institution-form {
  display: flex;
  flex-direction: column;
  gap: 22px;
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 18px;
}

.form-group.full {
  width: 100%;
}

.textarea-label {
  display: block;
  margin-bottom: 8px;
  font-size: 14px;
  font-weight: 700;
  color: #334155;
}

.textarea-control {
  width: 100%;
  min-height: 110px;
  border: 1px solid #dbe3ef;
  border-radius: 14px;
  padding: 13px 15px;
  font-size: 14px;
  color: #0f172a;
  background: #ffffff;
  outline: none;
  transition: 0.2s ease;
  resize: vertical;
}

.textarea-control:focus {
  border-color: #2563eb;
  box-shadow: 0 0 0 4px rgba(37, 99, 235, 0.12);
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding-top: 10px;
}

@media (max-width: 768px) {
  .form-grid {
    grid-template-columns: 1fr;
  }

  .form-actions {
    flex-direction: column-reverse;
  }
}
</style>
