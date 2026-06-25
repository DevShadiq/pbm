<template>
  <BaseCard class="photo-card">
    <div class="section-header">
      <div>
        <h3>Student Photo</h3>
        <p>Upload a clear passport size photo.</p>
      </div>
    </div>

    <div class="photo-upload">
      <div class="preview-box">
        <img v-if="previewUrl" :src="previewUrl" alt="Student photo" />
        <div v-else class="empty-photo">
          <span>👤</span>
          <p>No photo selected</p>
        </div>
      </div>

      <div class="photo-actions">
        <input
          ref="fileInput"
          type="file"
          accept="image/*"
          hidden
          @change="handleFileChange"
        />

        <BaseButton type="button" @click="openFilePicker">
          Upload Photo
        </BaseButton>

        <BaseButton
          v-if="previewUrl"
          type="button"
          class="danger-button"
          @click="clearPhoto"
        >
          Remove
        </BaseButton>

        <small>Recommended: JPG/PNG, max 2MB.</small>
      </div>
    </div>
  </BaseCard>
</template>

<script setup>
import { ref, watch } from 'vue'
import BaseCard from '@/components/common/BaseCard.vue'
import BaseButton from '@/components/common/BaseButton.vue'

const props = defineProps({
  modelValue: {
    type: [File, String, Object, null],
    default: null
  },
  preview: {
    type: String,
    default: ''
  }
})

const emit = defineEmits(['update:modelValue', 'selected', 'removed'])

const fileInput = ref(null)
const previewUrl = ref(props.preview || '')

watch(
  () => props.preview,
  value => {
    previewUrl.value = value || ''
  }
)

function openFilePicker() {
  fileInput.value?.click()
}

function handleFileChange(event) {
  const file = event.target.files?.[0]

  if (!file) return

  const reader = new FileReader()

  reader.onload = () => {
    previewUrl.value = reader.result

    emit('update:modelValue', file)
    emit('selected', {
      file,
      previewUrl: reader.result
    })
  }

  reader.readAsDataURL(file)
}

function clearPhoto() {
  previewUrl.value = ''
  if (fileInput.value) {
    fileInput.value.value = ''
  }

  emit('update:modelValue', null)
  emit('removed')
}
</script>

<style scoped>
.photo-card {
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

.photo-upload {
  display: flex;
  align-items: center;
  gap: 20px;
}

.preview-box {
  width: 130px;
  height: 130px;
  border-radius: 22px;
  overflow: hidden;
  border: 1px dashed #cbd5e1;
  background: #f8fafc;
}

.preview-box img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.empty-photo {
  width: 100%;
  height: 100%;
  display: grid;
  place-items: center;
  text-align: center;
  color: #94a3b8;
}

.empty-photo span {
  font-size: 34px;
}

.empty-photo p {
  margin: 0;
  font-size: 12px;
}

.photo-actions {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.photo-actions small {
  color: #64748b;
}

.danger-button {
  background: #fee2e2 !important;
  color: #b91c1c !important;
}

@media (max-width: 640px) {
  .photo-upload {
    align-items: flex-start;
    flex-direction: column;
  }
}
</style>