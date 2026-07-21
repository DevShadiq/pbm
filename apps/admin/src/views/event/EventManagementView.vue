<template>
  <section class="events-page">
    <div class="heading"><div><h1>Event Management</h1><p>Create date-based events for the public upcoming-events calendar.</p></div><BaseButton @click="openForm()">+ Add Event</BaseButton></div>
    <p v-if="message" :class="['message', messageType]">{{ message }}</p>
    <form v-if="showForm" class="event-form" @submit.prevent="save">
      <BaseInput v-model="form.title" label="Title" required />
      <BaseInput v-model="form.title_bn" label="Bangla Title (optional)" />
      <BaseInput v-model="form.event_date" label="Event Date" type="date" required />
      <BaseInput v-model="form.start_time" label="Start Time" type="time" />
      <BaseInput v-model="form.end_time" label="End Time" type="time" />
      <label>Status<select v-model="form.status"><option value="DRAFT">Draft</option><option value="PUBLISHED">Published</option><option value="ARCHIVED">Archived</option></select></label>
      <label class="full">Description<textarea v-model.trim="form.description" rows="3" /></label>
      <div class="actions"><BaseButton type="button" variant="secondary" @click="showForm=false">Cancel</BaseButton><BaseButton type="submit" :loading="saving">{{ editingId ? 'Update Event' : 'Save Event' }}</BaseButton></div>
    </form>
    <table><thead><tr><th>Date</th><th>Event</th><th>Time</th><th>Status</th><th></th></tr></thead><tbody><tr v-for="event in events" :key="event.event_id"><td>{{ formatDate(event.event_date) }}</td><td>{{ event.title_bn || event.title }}</td><td>{{ event.start_time || '—' }}</td><td>{{ event.status }}</td><td><button @click="openForm(event)">Edit</button><button @click="remove(event)">Delete</button></td></tr><tr v-if="!events.length"><td colspan="5">No events found.</td></tr></tbody></table>
  </section>
</template>
<script setup>
import { onMounted, reactive, ref } from "vue";
import BaseButton from "../../components/common/BaseButton.vue";
import BaseInput from "../../components/common/BaseInput.vue";
import { eventApi } from "../../services/api";
const events = ref([]), showForm = ref(false), saving = ref(false), editingId = ref(null), message = ref(""), messageType = ref("success");
const form = reactive({ title: "", title_bn: "", description: "", event_date: "", start_time: "", end_time: "", status: "DRAFT" });
const monthLabels = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];
function parseEventDate(value) { const raw = String(value || ""); const date = new Date(raw.includes("T") ? raw : `${raw}T00:00:00`); return Number.isNaN(date.getTime()) ? null : date; }
function formatDate(value) { const date = parseEventDate(value); return date ? `${String(date.getDate()).padStart(2, "0")}-${monthLabels[date.getMonth()]}-${date.getFullYear()}` : "—"; }
function toInputDate(value) { const date = parseEventDate(value); return date ? `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}` : ""; }
function reset() { Object.assign(form, { title: "", title_bn: "", description: "", event_date: "", start_time: "", end_time: "", status: "DRAFT" }); }
async function load() { try { events.value = (await eventApi.getAll()).data.data || []; } catch { message.value = "Failed to load events."; messageType.value = "error"; } }
function openForm(event = null) { reset(); editingId.value = event?.event_id || null; if (event) Object.assign(form, { ...event, event_date: toInputDate(event.event_date), start_time: String(event.start_time || "").slice(0, 5), end_time: String(event.end_time || "").slice(0, 5) }); showForm.value = true; }
async function save() { saving.value = true; try { editingId.value ? await eventApi.update(editingId.value, form) : await eventApi.create(form); message.value = "Event saved successfully."; messageType.value = "success"; showForm.value = false; await load(); } catch (error) { message.value = error.response?.data?.message || "Failed to save event."; messageType.value = "error"; } finally { saving.value = false; } }
async function remove(event) { if (!confirm(`Delete ${event.title}?`)) return; try { await eventApi.delete(event.event_id); await load(); } catch { message.value = "Failed to delete event."; messageType.value = "error"; } }
onMounted(load);
</script>
<style scoped>.events-page{display:grid;gap:18px}.heading{display:flex;justify-content:space-between;align-items:center;padding:22px;border:1px solid #e2e8f0;border-radius:18px}.heading h1{margin:0}.heading p{margin:6px 0 0;color:#64748b}.event-form{display:grid;grid-template-columns:repeat(3,1fr);gap:14px;padding:20px;border:1px solid #dbeafe;border-radius:18px;background:#f8fbff}.event-form label{display:grid;gap:6px;font-size:13px;font-weight:700;color:#334155}.event-form select,.event-form textarea{border:1px solid #cbd5e1;border-radius:9px;padding:9px;font:inherit}.full,.actions{grid-column:1/-1}.actions{display:flex;justify-content:flex-end;gap:10px}table{width:100%;border-collapse:collapse;background:#fff;border:1px solid #e2e8f0}th,td{padding:12px;text-align:left;border-bottom:1px solid #e2e8f0;font-size:14px}td button{margin-right:8px;border:0;background:transparent;color:#2563eb;cursor:pointer}.message{padding:12px;border-radius:10px}.message.success{background:#dcfce7;color:#166534}.message.error{background:#fee2e2;color:#b91c1c}@media(max-width:800px){.event-form{grid-template-columns:1fr}.heading{align-items:flex-start;flex-direction:column}}</style>
