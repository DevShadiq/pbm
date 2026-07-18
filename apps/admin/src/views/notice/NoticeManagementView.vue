<template>
  <section class="notice-management">
    <div class="page-heading">
      <div>
        <h1>Notice Management</h1>
        <p>Create and publish notices by category for the public website.</p>
      </div>
      <BaseButton v-if="can('notice.management', 'create')" @click="openCreate">
        + Add Notice
      </BaseButton>
    </div>

    <p v-if="message" class="alert" :class="messageType">{{ message }}</p>

    <BaseCard v-if="showForm" :title="editingId ? 'Edit Notice' : 'Create Notice'" class="form-card">
      <form class="notice-form" @submit.prevent="saveNotice">
        <label>
          Category
          <select v-model="form.category_code" required>
            <option v-for="category in categories" :key="category.category_code" :value="category.category_code">
              {{ category.category_name_bn || category.category_name }}
            </option>
          </select>
        </label>
        <label>
          Status
          <select v-model="form.status">
            <option value="DRAFT">Draft</option>
            <option value="PUBLISHED">Published</option>
            <option value="ARCHIVED">Archived</option>
          </select>
        </label>
        <label>
          Title (Bangla or English)
          <input v-model.trim="form.title" required maxlength="255" />
        </label>
        <label>
          Bangla title (optional)
          <input v-model.trim="form.title_bn" maxlength="255" />
        </label>
        <label>
          Publish date
          <input v-model="form.published_at" type="datetime-local" />
        </label>
        <label>
          Expiry date (optional)
          <input v-model="form.expires_at" type="datetime-local" />
        </label>
        <div class="full-width editor-field">
          <div class="editor-label-row">
            <span class="field-label">Notice details <span class="required">*</span></span>
            <span class="editor-hint">Select text, then choose a format.</span>
          </div>
          <div class="editor-toolbar" aria-label="Text formatting">
            <div class="toolbar-group">
              <button type="button" title="Bold" aria-label="Bold" @mousedown.prevent="formatText('bold')"><strong>B</strong></button>
              <button type="button" title="Italic" aria-label="Italic" @mousedown.prevent="formatText('italic')"><em>I</em></button>
              <button type="button" title="Underline" aria-label="Underline" @mousedown.prevent="formatText('underline')"><u>U</u></button>
            </div>
            <div class="toolbar-group">
              <button type="button" title="Heading" @mousedown.prevent="formatText('formatBlock', 'h2')">Heading</button>
              <button type="button" title="Bulleted list" @mousedown.prevent="formatText('insertUnorderedList')">• List</button>
              <button type="button" title="Numbered list" @mousedown.prevent="formatText('insertOrderedList')">1. List</button>
            </div>
            <div class="toolbar-group">
              <button type="button" title="Add link" @mousedown.prevent="addLink">Link</button>
              <button type="button" title="Clear formatting" @mousedown.prevent="formatText('removeFormat')">Clear</button>
            </div>
          </div>
          <div ref="editor" class="rich-editor" contenteditable="true" role="textbox" aria-label="Notice details" aria-multiline="true" data-placeholder="এখানে নোটিশের বিস্তারিত লিখুন..." @input="syncEditor" @focus="captureSelection" @keyup="captureSelection" @mouseup="captureSelection"></div>
          <small>Use the toolbar for bold text, headings, lists, and links. The same layout is used when the notice is printed.</small>
        </div>
        <label class="full-width">
          Attachment (PDF or image, maximum 10 MB)
          <input type="file" accept="application/pdf,image/jpeg,image/png,image/webp" :disabled="attachmentUploading" @change="uploadAttachment" />
          <small v-if="attachmentUploading">Uploading attachment…</small>
          <small v-else-if="form.attachment_url" class="attachment-ready">
            Attachment ready: <a :href="form.attachment_url" target="_blank" rel="noopener">Open uploaded file</a>
            <button type="button" @click="form.attachment_url = ''">Remove</button>
          </small>
          <input v-model.trim="form.attachment_url" type="text" placeholder="Or paste an attachment URL" />
        </label>
        <label class="checkbox-label">
          <input v-model="form.is_urgent" type="checkbox" /> Mark as urgent
        </label>
        <div class="form-actions">
          <BaseButton type="button" variant="secondary" @click="closeForm">Cancel</BaseButton>
          <BaseButton type="submit" :loading="saving">{{ editingId ? 'Update Notice' : 'Publish Notice' }}</BaseButton>
        </div>
      </form>
    </BaseCard>

    <BaseCard title="All Notices" subtitle="Published notices are visible on the public website.">
      <div class="toolbar">
        <input v-model.trim="search" type="search" placeholder="Search notices..." />
        <select v-model="statusFilter">
          <option value="">All statuses</option>
          <option value="PUBLISHED">Published</option>
          <option value="DRAFT">Draft</option>
          <option value="ARCHIVED">Archived</option>
        </select>
      </div>

      <div class="table-wrap">
        <table>
          <thead>
            <tr><th>Notice</th><th>Category</th><th>Published</th><th>Status</th><th>Priority</th><th>Actions</th></tr>
          </thead>
          <tbody>
            <tr v-if="loading"><td colspan="6" class="empty">Loading notices…</td></tr>
            <tr v-else-if="!filteredNotices.length"><td colspan="6" class="empty">No notices found.</td></tr>
            <tr v-for="notice in filteredNotices" :key="notice.notice_id">
              <td><strong>{{ notice.title_bn || notice.title }}</strong><small v-if="notice.title_bn">{{ notice.title }}</small></td>
              <td>{{ notice.category_name }}</td>
              <td>{{ formatDate(notice.published_at || notice.created_at) }}</td>
              <td><span class="badge" :class="notice.status.toLowerCase()">{{ notice.status }}</span></td>
              <td>{{ Number(notice.is_urgent) ? 'Urgent' : 'Normal' }}</td>
              <td class="actions">
                <button v-if="can('notice.management', 'update')" type="button" @click="editNotice(notice)">Edit</button>
                <button v-if="can('notice.management', 'delete')" type="button" class="danger" @click="removeNotice(notice)">Delete</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </BaseCard>
  </section>
</template>

<script setup>
import { computed, nextTick, onMounted, ref } from "vue";
import { noticeApi } from "../../services/api";
import { can } from "../../utils/permission";
import BaseButton from "../../components/common/BaseButton.vue";
import BaseCard from "../../components/common/BaseCard.vue";

const notices = ref([]);
const categories = ref([]);
const loading = ref(false);
const saving = ref(false);
const showForm = ref(false);
const editingId = ref(null);
const search = ref("");
const statusFilter = ref("");
const message = ref("");
const messageType = ref("success");
const editor = ref(null);
const savedSelection = ref(null);
const attachmentUploading = ref(false);

const emptyForm = () => ({
  category_code: "GENERAL",
  status: "PUBLISHED",
  title: "",
  title_bn: "",
  content_html: "<p></p>",
  attachment_url: "",
  is_urgent: false,
  published_at: new Date().toISOString().slice(0, 16),
  expires_at: "",
});

const form = ref(emptyForm());

const filteredNotices = computed(() => {
  const keyword = search.value.toLowerCase();
  return notices.value.filter((notice) => {
    const matchesStatus = !statusFilter.value || notice.status === statusFilter.value;
    const text = [notice.title, notice.title_bn, notice.category_name].filter(Boolean).join(" ").toLowerCase();
    return matchesStatus && (!keyword || text.includes(keyword));
  });
});

function showMessage(text, type = "success") {
  message.value = text;
  messageType.value = type;
}

function formatDate(value) {
  if (!value) return "Not scheduled";
  return new Intl.DateTimeFormat("en-GB", { dateStyle: "medium" }).format(new Date(value));
}

function setEditorContent(content) {
  nextTick(() => {
    if (editor.value) editor.value.innerHTML = content || "<p></p>";
    savedSelection.value = null;
  });
}

function syncEditor() {
  form.value.content_html = editor.value?.innerHTML || "";
}

function captureSelection() {
  const selection = window.getSelection();
  if (!selection?.rangeCount || !editor.value) return;
  const range = selection.getRangeAt(0);
  if (editor.value.contains(range.commonAncestorContainer)) {
    savedSelection.value = range.cloneRange();
  }
}

function restoreSelection() {
  if (!editor.value) return;
  editor.value.focus({ preventScroll: true });
  if (!savedSelection.value) return;
  const selection = window.getSelection();
  selection.removeAllRanges();
  selection.addRange(savedSelection.value);
}

function formatText(command, value = null) {
  restoreSelection();
  document.execCommand(command, false, value);
  syncEditor();
  captureSelection();
}

function addLink() {
  const url = window.prompt("Enter the link URL (https://...)");
  if (!url) return;
  restoreSelection();
  document.execCommand("createLink", false, url.trim());
  syncEditor();
  captureSelection();
}

async function uploadAttachment(event) {
  const file = event.target.files?.[0];
  if (!file) return;

  attachmentUploading.value = true;
  try {
    const response = await noticeApi.uploadAttachment(file);
    form.value.attachment_url = response.data?.data?.attachment_url || "";
    showMessage("Attachment uploaded successfully.");
  } catch (error) {
    showMessage(error.response?.data?.message || "Attachment upload failed. Use PDF, JPG, PNG, or WEBP up to 10 MB.", "error");
  } finally {
    event.target.value = "";
    attachmentUploading.value = false;
  }
}

function toLocalDateTime(value) {
  if (!value) return "";
  const date = new Date(value);
  const timezoneOffset = date.getTimezoneOffset() * 60 * 1000;
  return new Date(date.getTime() - timezoneOffset).toISOString().slice(0, 16);
}

async function loadData() {
  loading.value = true;
  try {
    const [noticeRes, categoryRes] = await Promise.all([noticeApi.getAll(), noticeApi.getCategories()]);
    notices.value = noticeRes.data.data || [];
    categories.value = categoryRes.data.data || [];
    if (!categories.value.some((category) => category.category_code === form.value.category_code)) {
      form.value.category_code = categories.value[0]?.category_code || "GENERAL";
    }
  } catch (error) {
    showMessage(error.response?.data?.message || "Failed to load notices.", "error");
  } finally {
    loading.value = false;
  }
}

function openCreate() {
  editingId.value = null;
  form.value = emptyForm();
  if (categories.value.length) form.value.category_code = categories.value[0].category_code;
  showForm.value = true;
  setEditorContent(form.value.content_html);
}

function closeForm() {
  showForm.value = false;
  editingId.value = null;
}

function editNotice(notice) {
  editingId.value = notice.notice_id;
  form.value = {
    category_code: notice.category_code,
    status: notice.status,
    title: notice.title || "",
    title_bn: notice.title_bn || "",
    content_html: notice.content_html || notice.description || "<p></p>",
    attachment_url: notice.attachment_url || "",
    is_urgent: Boolean(Number(notice.is_urgent)),
    published_at: toLocalDateTime(notice.published_at),
    expires_at: toLocalDateTime(notice.expires_at),
  };
  showForm.value = true;
  setEditorContent(form.value.content_html);
}

async function saveNotice() {
  syncEditor();
  if (!editor.value?.innerText?.trim()) {
    showMessage("Notice details are required.", "error");
    return;
  }
  saving.value = true;
  try {
    if (editingId.value) await noticeApi.update(editingId.value, form.value);
    else await noticeApi.create(form.value);
    showMessage(editingId.value ? "Notice updated successfully." : "Notice created successfully.");
    closeForm();
    await loadData();
  } catch (error) {
    showMessage(error.response?.data?.message || "Failed to save notice.", "error");
  } finally {
    saving.value = false;
  }
}

async function removeNotice(notice) {
  if (!confirm(`Delete “${notice.title_bn || notice.title}”?`)) return;
  try {
    await noticeApi.delete(notice.notice_id);
    showMessage("Notice deleted successfully.");
    await loadData();
  } catch (error) {
    showMessage(error.response?.data?.message || "Failed to delete notice.", "error");
  }
}

onMounted(loadData);
</script>

<style scoped>
.notice-management { display: grid; gap: 20px; }
.page-heading { display: flex; justify-content: space-between; align-items: center; gap: 16px; }
.page-heading h1 { margin: 0; color: #0f172a; font-size: 25px; }
.page-heading p { margin: 5px 0 0; color: #64748b; }
.alert { margin: 0; padding: 12px 16px; border-radius: 12px; font-weight: 700; }
.alert.success { background: #dcfce7; color: #166534; }.alert.error { background: #fee2e2; color: #b91c1c; }
.notice-form { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 16px; }
label { display: grid; gap: 7px; color: #334155; font-size: 13px; font-weight: 800; }
input, select { width: 100%; box-sizing: border-box; border: 1px solid #dbe3ef; border-radius: 10px; padding: 10px 12px; color: #0f172a; font: inherit; }
.editor-field { display: grid; gap: 7px; }.editor-label-row { display: flex; justify-content: space-between; align-items: baseline; gap: 12px; }.field-label { color: #334155; font-size: 13px; font-weight: 800; }.required { color: #dc2626; }.editor-hint { color: #64748b; font-size: 12px; }.editor-toolbar { display: flex; gap: 8px; flex-wrap: wrap; padding: 8px; border: 1px solid #dbe3ef; border-bottom: 0; border-radius: 10px 10px 0 0; background: #f8fafc; }.toolbar-group { display: flex; gap: 6px; padding-right: 8px; border-right: 1px solid #e2e8f0; }.toolbar-group:last-child { padding-right: 0; border-right: 0; }.editor-toolbar button { border: 1px solid #dbe3ef; background: #fff; color: #334155; min-height: 30px; padding: 5px 9px; border-radius: 7px; cursor: pointer; font: inherit; font-size: 12px; }.editor-toolbar button:hover, .editor-toolbar button:focus-visible { background: #eff6ff; border-color: #93c5fd; color: #1d4ed8; outline: none; }
.rich-editor { min-height: 180px; border: 1px solid #dbe3ef; border-radius: 0 0 10px 10px; padding: 12px; color: #0f172a; background: #fff; outline: none; font-weight: 400; line-height: 1.65; }.rich-editor:empty::before { content: attr(data-placeholder); color: #94a3b8; pointer-events: none; }.rich-editor:focus { border-color: #60a5fa; box-shadow: 0 0 0 3px rgba(96,165,250,.18); }.rich-editor :deep(p), .rich-editor :deep(div) { margin: 0 0 10px; }.rich-editor :deep(h2) { margin: 12px 0 8px; font-size: 20px; }.rich-editor :deep(ul), .rich-editor :deep(ol) { margin: 8px 0; padding-left: 24px; }
label small, .editor-field small { color: #64748b; font-weight: 500; }.attachment-ready { display: flex; align-items: center; gap: 7px; }.attachment-ready a { color: #1d4ed8; }.attachment-ready button { border: 0; background: transparent; color: #b91c1c; cursor: pointer; font: inherit; }.full-width { grid-column: 1 / -1; }.checkbox-label { display: flex; align-items: center; grid-column: 1 / -1; }.checkbox-label input { width: auto; }
.form-actions { display: flex; gap: 10px; justify-content: flex-end; grid-column: 1 / -1; }
.toolbar { display: flex; gap: 12px; margin-bottom: 16px; }.toolbar input { flex: 1; }.toolbar select { max-width: 180px; }
.table-wrap { overflow-x: auto; border: 1px solid #e5edf7; border-radius: 14px; }table { width: 100%; min-width: 780px; border-collapse: collapse; }th, td { padding: 13px 14px; border-bottom: 1px solid #edf2f7; text-align: left; font-size: 13px; }th { color: #475569; background: #f8fafc; text-transform: uppercase; font-size: 11px; letter-spacing: .04em; }td strong, td small { display: block; }td small { margin-top: 3px; color: #64748b; }.empty { color: #64748b; text-align: center; padding: 30px; }
.badge { display: inline-block; padding: 4px 8px; border-radius: 999px; font-size: 11px; font-weight: 800; }.badge.published { color: #166534; background: #dcfce7; }.badge.draft { color: #92400e; background: #fef3c7; }.badge.archived { color: #475569; background: #e2e8f0; }
.actions { display: flex; gap: 8px; }.actions button { border: 0; border-radius: 8px; padding: 7px 9px; background: #eff6ff; color: #1d4ed8; cursor: pointer; font-weight: 700; }.actions .danger { background: #fef2f2; color: #b91c1c; }
@media (max-width: 700px) { .page-heading, .toolbar, .editor-label-row { align-items: stretch; flex-direction: column; }.toolbar select { max-width: none; }.notice-form { grid-template-columns: 1fr; } }
</style>
