<template>
  <BaseCard class="student-section-card">
    <div class="section-header">
      <div>
        <h3>Guardian Information</h3>
        <p>Father, mother and local guardian details.</p>
      </div>
    </div>

    <div class="form-grid">
      <BaseInput
        label="Father Name"
        placeholder="Enter father name"
        :model-value="field('fatherName')"
        @update:model-value="updateField('fatherName', $event)"
      />

      <BaseInput
        label="Father Occupation"
        placeholder="Enter occupation"
        :model-value="field('fatherOccupation')"
        @update:model-value="updateField('fatherOccupation', $event)"
      />

      <BaseInput
        label="Mother Name"
        placeholder="Enter mother name"
        :model-value="field('motherName')"
        @update:model-value="updateField('motherName', $event)"
      />

      <BaseInput
        label="Mother Occupation"
        placeholder="Enter occupation"
        :model-value="field('motherOccupation')"
        @update:model-value="updateField('motherOccupation', $event)"
      />

      <BaseInput
        label="Guardian Name"
        placeholder="Enter guardian name"
        :model-value="field('guardianName')"
        @update:model-value="updateField('guardianName', $event)"
      />

      <BaseSelect
        label="Relation"
        :options="relationOptions"
        :model-value="field('relation')"
        @update:model-value="updateField('relation', $event)"
      />

      <BaseInput
        label="Guardian Mobile"
        placeholder="01XXXXXXXXX"
        :model-value="field('guardianMobile')"
        @update:model-value="updateField('guardianMobile', $event)"
      />

      <BaseInput
        label="Guardian NID"
        placeholder="Enter NID number"
        :model-value="field('guardianNid')"
        @update:model-value="updateField('guardianNid', $event)"
      />

      <BaseInput
        label="Emergency Contact"
        placeholder="Emergency phone number"
        :model-value="field('emergencyContact')"
        @update:model-value="updateField('emergencyContact', $event)"
      />
    </div>
  </BaseCard>
</template>

<script setup>
import BaseCard from '@/components/common/BaseCard.vue'
import BaseInput from '@/components/common/BaseInput.vue'
import BaseSelect from '@/components/common/BaseSelect.vue'

const props = defineProps({
  modelValue: {
    type: Object,
    default: () => ({})
  }
})

const emit = defineEmits(['update:modelValue'])

const relationOptions = [
  { label: 'Father', value: 'father' },
  { label: 'Mother', value: 'mother' },
  { label: 'Brother', value: 'brother' },
  { label: 'Sister', value: 'sister' },
  { label: 'Uncle', value: 'uncle' },
  { label: 'Aunt', value: 'aunt' },
  { label: 'Other', value: 'other' }
]

function field(key) {
  return props.modelValue?.[key] ?? ''
}

function updateField(key, value) {
  emit('update:modelValue', {
    ...props.modelValue,
    [key]: value
  })
}
</script>

<style scoped>
.student-section-card {
  padding: 22px;
  border-radius: 22px;
}

.section-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 18px;
}

.section-header h3 {
  margin: 0;
  font-size: 18px;
  color: #0f172a;
}

.section-header p {
  margin: 5px 0 0;
  color: #64748b;
  font-size: 13px;
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 16px;
}

@media (max-width: 992px) {
  .form-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 640px) {
  .form-grid {
    grid-template-columns: 1fr;
  }
}
</style>