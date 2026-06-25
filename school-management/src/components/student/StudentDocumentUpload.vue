<template>
  <BaseCard class="student-section-card">
    <div class="section-header">
      <div>
        <h3>Document Upload</h3>
        <p>Birth certificate, transfer certificate, mark sheet and other files.</p>
      </div>
    </div>

    <div class="upload-row">
      <BaseSelect
        label="Document Type"
        :options="documentTypeOptions"
        v-model="draft.type"
      />

      <BaseInput
        label="Document Title"
        placeholder="Example: Birth Certificate"
        v-model="draft.title"
      />

      <div class="file-field">
        <label>Choose File</label>
        <input type="file" @change="handleFileChange" />
      </div>

      <div class="add-action">
        <BaseButton type="button" @click="addDocument">
          Add Document
        </BaseButton>
      </div>
    </div>

    <div v-if="documents.length" class="document-list">
      <div
        v-for="document in documents"
        :key="document.id"
        class="document-item"
      >
        <div class="doc-icon">📄</div>

        <div class="doc-info">
          <strong>{{ document.title || document.name }}</strong>
          <span>{{ getTypeLabel(document.type) }} · {{ formatSize(document.size) }}</span>
        </div>

        <button type="button" class="remove-btn" @click="removeDocument(document.id)">
          Remove
        </button>
      </div>
    </div>

    <div v-else class="empty-documents">
      No documents uploaded yet.
    </div>
  </BaseCard>
</template>

<script setup>
import { computed, reactive } from 'vue'
import BaseCard from '@/components/common/BaseCard.vue'
import BaseInput from '@/components/common/BaseInput.vue'
import BaseSelect from '@/components/common/BaseSelect.vue'
import BaseButton from '@/components/common/BaseButton.vue'

const props = defineProps({
  modelValue: {
    type: Array,
    default: () => []
  }
})

const emit = defineEmits(['update:modelValue', 'added', 'removed'])

const documentTypeOptions = [
  { label: 'Birth Certificate', value: 'birth_certificate' },
  { label: 'Transfer Certificate', value: 'transfer_certificate' },
  { label: 'Previous Marksheet', value: 'previous_marksheet' },
  { label: 'NID / Birth ID', value: 'nid_birth_id' },
  { label: 'Guardian NID', value: 'guardian_nid' },
  { label: 'Other', value: 'other' }
]

const draft = reactive({
  type: 'birth_certificate',
  title: '',
  file: null
})

const documents = computed(() => props.modelValue || [])

function makeId() {
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`
}

function handleFileChange(event) {
  draft.file = event.target.files?.[0] || null
}

function addDocument() {
  if (!draft.file) return

  const document = {
    id: makeId(),
    type: draft.type,
    title: draft.title,
    file: draft.file,
    name: draft.file.name,
    size: draft.file.size
  }

  const nextDocuments = [...documents.value, document]

  emit('update:modelValue', nextDocuments)
  emit('added', document)

  draft.title = ''
  draft.file = null
}

function removeDocument(id) {
  const removedDocument = documents.value.find(item => item.id === id)
  const nextDocuments = documents.value.filter(item => item.id !== id)

  emit('update:modelValue', nextDocuments)
  emit('removed', removedDocument)
}

function getTypeLabel(type) {
  return documentTypeOptions.find(item => item.value === type)?.label || type
}

function formatSize(size = 0) {
  if (size < 1024) return `${size} B`
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`
  return `${(size / (1024 * 1024)).toFixed(1)} MB`
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

.upload-row {
  display: grid;
  grid-template-columns: 1fr 1.3fr 1fr auto;
  gap: 14px;
  align-items: end;
}

.file-field {
  display: flex;
  flex-direction: column;
  gap: 7px;
}

.file-field label {
  font-size: 13px;
  font-weight: 700;
  color: #334155;
}

.file-field input {
  padding: 10px;
  border: 1px dashed #cbd5e1;
  border-radius: 14px;
  background: #f8fafc;
}

.document-list {
  display: grid;
  gap: 12px;
  margin-top: 18px;
}

.document-item {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 14px;
  border-radius: 18px;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
}

.doc-icon {
  width: 42px;
  height: 42px;
  display: grid;
  place-items: center;
  border-radius: 14px;
  background: #e0f2fe;
}

.doc-info {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.doc-info strong {
  color: #0f172a;
}

.doc-info span {
  font-size: 12px;
  color: #64748b;
}

.remove-btn {
  border: 0;
  background: #fee2e2;
  color: #b91c1c;
  padding: 8px 12px;
  border-radius: 12px;
  cursor: pointer;
  font-weight: 700;
}

.empty-documents {
  margin-top: 18px;
  padding: 18px;
  text-align: center;
  border-radius: 18px;
  background: #f8fafc;
  color: #64748b;
}

@media (max-width: 992px) {
  .upload-row {
    grid-template-columns: 1fr 1fr;
  }
}

@media (max-width: 640px) {
  .upload-row {
    grid-template-columns: 1fr;
  }
}
</style>