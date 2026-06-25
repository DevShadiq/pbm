<template>
  <BaseCard class="student-section-card">
    <div class="section-header">
      <div>
        <h3>Address Information</h3>
        <p>Present and permanent address details.</p>
      </div>
    </div>

    <div class="address-layout">
      <div class="address-box">
        <h4>Present Address</h4>

        <div class="form-grid">
          <BaseInput
            label="Village / House"
            placeholder="Village or house no"
            :model-value="field('present', 'line1')"
            @update:model-value="updateAddress('present', 'line1', $event)"
          />

          <BaseInput
            label="Road / Area"
            placeholder="Road or area"
            :model-value="field('present', 'line2')"
            @update:model-value="updateAddress('present', 'line2', $event)"
          />

          <BaseInput
            label="Post Office"
            placeholder="Post office"
            :model-value="field('present', 'postOffice')"
            @update:model-value="updateAddress('present', 'postOffice', $event)"
          />

          <BaseInput
            label="Police Station"
            placeholder="Police station"
            :model-value="field('present', 'policeStation')"
            @update:model-value="updateAddress('present', 'policeStation', $event)"
          />

          <BaseInput
            label="District"
            placeholder="District"
            :model-value="field('present', 'district')"
            @update:model-value="updateAddress('present', 'district', $event)"
          />

          <BaseInput
            label="Division"
            placeholder="Division"
            :model-value="field('present', 'division')"
            @update:model-value="updateAddress('present', 'division', $event)"
          />
        </div>
      </div>

      <label class="same-address">
        <input
          type="checkbox"
          :checked="props.modelValue.sameAsPresent"
          @change="toggleSameAddress"
        />
        Permanent address same as present address
      </label>

      <div class="address-box">
        <h4>Permanent Address</h4>

        <div class="form-grid">
          <BaseInput
            label="Village / House"
            placeholder="Village or house no"
            :model-value="field('permanent', 'line1')"
            @update:model-value="updateAddress('permanent', 'line1', $event)"
          />

          <BaseInput
            label="Road / Area"
            placeholder="Road or area"
            :model-value="field('permanent', 'line2')"
            @update:model-value="updateAddress('permanent', 'line2', $event)"
          />

          <BaseInput
            label="Post Office"
            placeholder="Post office"
            :model-value="field('permanent', 'postOffice')"
            @update:model-value="updateAddress('permanent', 'postOffice', $event)"
          />

          <BaseInput
            label="Police Station"
            placeholder="Police station"
            :model-value="field('permanent', 'policeStation')"
            @update:model-value="updateAddress('permanent', 'policeStation', $event)"
          />

          <BaseInput
            label="District"
            placeholder="District"
            :model-value="field('permanent', 'district')"
            @update:model-value="updateAddress('permanent', 'district', $event)"
          />

          <BaseInput
            label="Division"
            placeholder="Division"
            :model-value="field('permanent', 'division')"
            @update:model-value="updateAddress('permanent', 'division', $event)"
          />
        </div>
      </div>
    </div>
  </BaseCard>
</template>

<script setup>
import BaseCard from '@/components/common/BaseCard.vue'
import BaseInput from '@/components/common/BaseInput.vue'

const props = defineProps({
  modelValue: {
    type: Object,
    default: () => ({
      present: {},
      permanent: {},
      sameAsPresent: false
    })
  }
})

const emit = defineEmits(['update:modelValue'])

function field(type, key) {
  return props.modelValue?.[type]?.[key] ?? ''
}

function updateAddress(type, key, value) {
  const next = {
    ...props.modelValue,
    present: {
      ...(props.modelValue.present || {})
    },
    permanent: {
      ...(props.modelValue.permanent || {})
    }
  }

  next[type][key] = value

  if (type === 'present' && next.sameAsPresent) {
    next.permanent = { ...next.present }
  }

  emit('update:modelValue', next)
}

function toggleSameAddress(event) {
  const checked = event.target.checked

  emit('update:modelValue', {
    ...props.modelValue,
    sameAsPresent: checked,
    permanent: checked
      ? { ...(props.modelValue.present || {}) }
      : { ...(props.modelValue.permanent || {}) }
  })
}
</script>

<style scoped>
.student-section-card {
  padding: 22px;
  border-radius: 22px;
}

.section-header {
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

.address-layout {
  display: grid;
  gap: 18px;
}

.address-box {
  padding: 18px;
  border: 1px solid #e2e8f0;
  border-radius: 18px;
  background: #f8fafc;
}

.address-box h4 {
  margin: 0 0 15px;
  color: #1e293b;
  font-size: 15px;
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 16px;
}

.same-address {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  color: #334155;
  font-size: 14px;
  font-weight: 600;
}

.same-address input {
  width: 16px;
  height: 16px;
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