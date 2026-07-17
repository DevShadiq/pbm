<template>
  <div class="page">
    <div class="page-header">
      <div>
        <h1>Employee Management</h1>
        <p>Maintain departments, designations, and teacher, staff, or administrator records.</p>
      </div>
      <BaseButton v-if="activeTab === 'employees'" @click="openEmployeeForm()">+ Add Employee</BaseButton>
      <BaseButton v-else @click="openMasterForm()">+ Add {{ activeTab === 'departments' ? 'Department' : 'Designation' }}</BaseButton>
    </div>

    <AlertMessage v-if="alert.message" :type="alert.type" :message="alert.message" @close="alert.message = ''" />

    <div v-if="isSuperAdmin" class="institution-card">
      <BaseSelect v-model="institutionId" label="Institution" :options="institutionOptions" placeholder="Select an institution" @change="reload" />
    </div>

    <div class="tabs" role="tablist">
      <button v-for="tab in tabs" :key="tab.key" type="button" :class="{ active: activeTab === tab.key }" @click="changeTab(tab.key)">{{ tab.label }}</button>
    </div>

    <div v-if="showForm" class="modal-backdrop" @click.self="closeForm">
      <section class="modal-dialog" role="dialog" aria-modal="true" :aria-label="`${editingId ? 'Edit' : 'Add'} employee management record`">
        <div class="form-header">
          <h2>{{ editingId ? 'Edit' : 'Add' }} {{ activeTab === 'employees' ? 'Employee' : activeTab === 'departments' ? 'Department' : 'Designation' }}</h2>
          <button type="button" class="close-button" aria-label="Close form" @click="closeForm">×</button>
        </div>

        <form v-if="activeTab === 'employees'" class="form-grid" @submit.prevent="saveEmployee">
        <BaseInput v-model="employeeForm.employee_no" label="Employee No." required />
        <BaseInput v-model="employeeForm.first_name" label="First Name" required />
        <BaseInput v-model="employeeForm.first_name_bn" label="First Name (Bangla)" />
        <BaseInput v-model="employeeForm.last_name" label="Last Name" />
        <BaseInput v-model="employeeForm.last_name_bn" label="Last Name (Bangla)" />
        <BaseSelect v-model="employeeForm.employee_type" label="Employee Type" required :options="employeeTypeOptions" />
        <BaseSelect v-model="employeeForm.branch_id" label="Branch" :options="lookups.branches" placeholder="Select branch" />
        <BaseSelect v-model="employeeForm.department_id" label="Department" :options="lookups.departments" placeholder="Select department" />
        <BaseSelect v-model="employeeForm.designation_id" label="Designation" :options="lookups.designations" placeholder="Select designation" />
        <BaseInput v-model="employeeForm.joining_date" label="Joining Date" type="date" />
        <BaseInput v-model="employeeForm.date_of_birth" label="Date of Birth" type="date" />
        <BaseSelect v-model="employeeForm.gender" label="Gender" :options="genderOptions" placeholder="Select gender" />
        <BaseInput v-model="employeeForm.mobile" label="Mobile" type="tel" />
        <BaseInput v-model="employeeForm.email" label="Email" type="email" />
        <BaseInput v-model="employeeForm.nid_no" label="NID No." />
        <BaseSelect v-model="employeeForm.blood_group" label="Blood Group" :options="bloodGroupOptions" placeholder="Select blood group" />
        <BaseSelect v-model="employeeForm.religion" label="Religion" :options="religionOptions" placeholder="Select religion" />
        <BaseSelect v-model="employeeForm.employment_status" label="Employment Status" required :options="employmentStatusOptions" />
        <div class="photo-field">
          <label class="photo-label">Employee Photo</label>
          <div class="photo-control">
            <img v-if="employeeForm.photo_url" :src="getFileUrl(employeeForm.photo_url)" alt="Employee photo preview" class="photo-preview" />
            <div v-else class="photo-placeholder">No photo</div>
            <input type="file" accept="image/jpeg,image/png,image/webp" :disabled="uploadingPhoto" @change="uploadPhoto" />
          </div>
          <small>{{ uploadingPhoto ? 'Uploading photo…' : 'JPG, PNG, or WebP. Maximum 5 MB.' }}</small>
        </div>
        <div class="form-actions"><BaseButton type="submit" :loading="saving">{{ editingId ? 'Update Employee' : 'Save Employee' }}</BaseButton><BaseButton type="button" variant="secondary" @click="closeForm">Cancel</BaseButton></div>
        </form>

        <form v-else class="form-grid master-form" @submit.prevent="saveMaster">
        <BaseInput v-model="masterForm.code" :label="activeTab === 'departments' ? 'Department Code' : 'Designation Code'" required />
        <BaseInput v-model="masterForm.name" :label="activeTab === 'departments' ? 'Department Name' : 'Designation Name'" required />
        <BaseInput v-model="masterForm.name_bn" :label="activeTab === 'departments' ? 'Department Name (Bangla)' : 'Designation Name (Bangla)'" />
        <BaseSelect v-model="masterForm.status" label="Status" :options="statusOptions" required />
        <div class="form-actions"><BaseButton type="submit" :loading="saving">{{ editingId ? 'Update' : 'Save' }}</BaseButton><BaseButton type="button" variant="secondary" @click="closeForm">Cancel</BaseButton></div>
        </form>
      </section>
    </div>

    <div v-if="activeTab === 'employees'" class="filters">
      <BaseInput v-model="filters.search" label="Search" placeholder="Name, employee no. or mobile" @keyup.enter="loadEmployees" />
      <BaseSelect v-model="filters.employee_type" label="Type" :options="employeeTypeOptions" placeholder="All types" @change="loadEmployees" />
      <BaseSelect v-model="filters.status" label="Status" :options="employmentStatusOptions" placeholder="All statuses" @change="loadEmployees" />
      <BaseButton variant="secondary" @click="loadEmployees">Search</BaseButton>
    </div>

    <BaseTable v-if="activeTab === 'employees'" :rows="employees" :columns="employeeColumns" row-key="employee_id" :loading="loading">
      <template #cell-photo_url="{ value }"><img v-if="value" :src="getFileUrl(value)" alt="Employee photo" class="list-photo" /><span v-else class="list-photo-fallback" aria-label="No employee photo">👤</span></template>
      <template #cell-full_name="{ row }"><strong>{{ displayEmployeeName(row) }}</strong><small class="muted">{{ row.employee_no }}</small></template>
      <template #cell-employee_type="{ value }"><span class="type-pill">{{ value }}</span></template>
      <template #cell-department_name="{ row, value }">{{ row.department_name_bn || value || '—' }}</template>
      <template #cell-designation_name="{ row, value }">{{ row.designation_name_bn || value || '—' }}</template>
      <template #cell-employment_status="{ value }"><span :class="['status-pill', value?.toLowerCase()]">{{ value }}</span></template>
      <template #actions="{ row }"><div class="actions"><BaseButton size="sm" variant="secondary" @click="openEmployeeForm(row)">Edit</BaseButton><BaseButton size="sm" variant="danger" @click="removeEmployee(row)">Delete</BaseButton></div></template>
    </BaseTable>

    <BaseTable v-else :rows="masterRows" :columns="masterColumns" :row-key="activeTab === 'departments' ? 'department_id' : 'designation_id'" :loading="loading">
      <template #cell-status="{ value }"><span :class="['status-pill', value?.toLowerCase()]">{{ value }}</span></template>
      <template #actions="{ row }"><div class="actions"><BaseButton size="sm" variant="secondary" @click="openMasterForm(row)">Edit</BaseButton><BaseButton size="sm" variant="danger" @click="removeMaster(row)">Delete</BaseButton></div></template>
    </BaseTable>
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from "vue";
import BaseButton from "../../components/common/BaseButton.vue";
import BaseInput from "../../components/common/BaseInput.vue";
import BaseSelect from "../../components/common/BaseSelect.vue";
import BaseTable from "../../components/common/BaseTable.vue";
import AlertMessage from "../../components/common/AlertMessage.vue";
import { employeeApi, getFileUrl } from "../../services/api";
import { getInstitutions } from "../../services/institutionService";
import { getCurrentUser, isSuperAdmin as userIsSuperAdmin } from "../../utils/permission";
import { toIsoDate } from "../../utils/dateFormat";

const currentUser = getCurrentUser();
const isSuperAdmin = userIsSuperAdmin();
const activeTab = ref("employees");
const loading = ref(false);
const saving = ref(false);
const uploadingPhoto = ref(false);
const showForm = ref(false);
const editingId = ref(null);
const employees = ref([]);
const masterRows = ref([]);
const institutions = ref([]);
const institutionId = ref(currentUser?.institution_id || "");
const lookups = reactive({ branches: [], departments: [], designations: [] });
const filters = reactive({ search: "", employee_type: "", status: "" });
const employeeForm = reactive({});
const masterForm = reactive({ code: "", name: "", name_bn: "", status: "ACTIVE" });
const alert = reactive({ type: "success", message: "" });

const tabs = [{ key: "employees", label: "Employees" }, { key: "departments", label: "Departments" }, { key: "designations", label: "Designations" }];
const employeeTypeOptions = [{ label: "Teacher", value: "TEACHER" }, { label: "Staff", value: "STAFF" }, { label: "Admin", value: "ADMIN" }];
const genderOptions = [{ label: "Male", value: "MALE" }, { label: "Female", value: "FEMALE" }, { label: "Other", value: "OTHER" }];
const bloodGroupOptions = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"].map((value) => ({ label: value, value }));
const religionOptions = ["Islam", "Hinduism", "Buddhism", "Christianity", "Other"].map((value) => ({ label: value, value }));
const statusOptions = [{ label: "Active", value: "ACTIVE" }, { label: "Inactive", value: "INACTIVE" }];
const employmentStatusOptions = [{ label: "Active", value: "ACTIVE" }, { label: "Resigned", value: "RESIGNED" }, { label: "Terminated", value: "TERMINATED" }];
const institutionOptions = computed(() => institutions.value.map((item) => ({ value: item.institution_id, label: item.institution_name })));
const employeeColumns = [{ key: "photo_url", label: "Photo", width: "74px" }, { key: "full_name", label: "Employee" }, { key: "employee_type", label: "Type" }, { key: "department_name", label: "Department" }, { key: "designation_name", label: "Designation" }, { key: "branch_name", label: "Branch" }, { key: "mobile", label: "Mobile" }, { key: "employment_status", label: "Status" }];
const masterColumns = computed(() => activeTab.value === "departments" ? [{ key: "department_code", label: "Code" }, { key: "department_name", label: "Department" }, { key: "department_name_bn", label: "Department (Bangla)" }, { key: "status", label: "Status" }] : [{ key: "designation_code", label: "Code" }, { key: "designation_name", label: "Designation" }, { key: "designation_name_bn", label: "Designation (Bangla)" }, { key: "status", label: "Status" }]);

function message(type, text) { alert.type = type; alert.message = text; }
function displayEmployeeName(row) { return [row.first_name_bn, row.last_name_bn].filter(Boolean).join(" ").trim() || row.full_name || [row.first_name, row.last_name].filter(Boolean).join(" "); }
function resetEmployee() { Object.assign(employeeForm, { employee_no: "", first_name: "", first_name_bn: "", last_name: "", last_name_bn: "", employee_type: "STAFF", branch_id: "", department_id: "", designation_id: "", joining_date: "", date_of_birth: "", gender: "", mobile: "", email: "", nid_no: "", blood_group: "", religion: "", photo_url: "", employment_status: "ACTIVE" }); }
function closeForm() { showForm.value = false; editingId.value = null; }
function requestParams() { return isSuperAdmin && institutionId.value ? { institution_id: institutionId.value } : {}; }

async function loadLookups() {
  if (!institutionId.value) { Object.assign(lookups, { branches: [], departments: [], designations: [] }); return; }
  const response = await employeeApi.getLookups(institutionId.value);
  Object.assign(lookups, response.data.data || {});
}
async function loadEmployees() {
  if (isSuperAdmin && !institutionId.value) { employees.value = []; return; }
  loading.value = true;
  try { const response = await employeeApi.getEmployees({ ...requestParams(), ...filters }); employees.value = response.data.data || []; } catch { message("error", "Failed to load employees."); } finally { loading.value = false; }
}
async function loadMaster() {
  if (isSuperAdmin && !institutionId.value) { masterRows.value = []; return; }
  loading.value = true;
  try { const response = activeTab.value === "departments" ? await employeeApi.getDepartments(requestParams()) : await employeeApi.getDesignations(requestParams()); masterRows.value = response.data.data || []; } catch { message("error", "Failed to load setup data."); } finally { loading.value = false; }
}
async function reload() { closeForm(); await loadLookups(); return activeTab.value === "employees" ? loadEmployees() : loadMaster(); }
async function changeTab(tab) { activeTab.value = tab; closeForm(); return reload(); }

async function openEmployeeForm(row = null) { if (isSuperAdmin && !institutionId.value) return message("error", "Select an institution first."); await loadLookups(); resetEmployee(); editingId.value = row?.employee_id || null; if (row) Object.assign(employeeForm, { ...row, joining_date: toIsoDate(row.joining_date), date_of_birth: toIsoDate(row.date_of_birth), branch_id: row.branch_id || "", department_id: row.department_id || "", designation_id: row.designation_id || "" }); showForm.value = true; }
function openMasterForm(row = null) { if (isSuperAdmin && !institutionId.value) return message("error", "Select an institution first."); editingId.value = row?.department_id || row?.designation_id || null; masterForm.code = row?.department_code || row?.designation_code || ""; masterForm.name = row?.department_name || row?.designation_name || ""; masterForm.name_bn = row?.department_name_bn || row?.designation_name_bn || ""; masterForm.status = row?.status || "ACTIVE"; showForm.value = true; }
async function uploadPhoto(event) { const file = event.target.files?.[0]; if (!file) return; const employeeNo = employeeForm.employee_no?.trim(); if (!employeeNo) { message("error", "Enter the employee number before uploading a photo."); event.target.value = ""; return; } uploadingPhoto.value = true; try { const formData = new FormData(); formData.append("employee_no", employeeNo); formData.append("previous_photo_url", employeeForm.photo_url || ""); formData.append("photo", file); const response = await employeeApi.uploadPhoto(formData); employeeForm.photo_url = response.data.data.photo_url; message("success", "Employee photo uploaded successfully."); } catch (error) { message("error", error.response?.data?.message || "Failed to upload employee photo."); } finally { uploadingPhoto.value = false; event.target.value = ""; } }
async function saveEmployee() { saving.value = true; try { const payload = { ...employeeForm, ...(isSuperAdmin ? { institution_id: institutionId.value } : {}) }; if (editingId.value) await employeeApi.updateEmployee(editingId.value, payload); else await employeeApi.createEmployee(payload); message("success", "Employee saved successfully."); closeForm(); await loadEmployees(); } catch (error) { message("error", error.response?.data?.message || "Failed to save employee."); } finally { saving.value = false; } }
async function saveMaster() { saving.value = true; try { const isDepartment = activeTab.value === "departments"; const payload = { ...(isDepartment ? { department_code: masterForm.code, department_name: masterForm.name, department_name_bn: masterForm.name_bn } : { designation_code: masterForm.code, designation_name: masterForm.name, designation_name_bn: masterForm.name_bn }), status: masterForm.status, ...(isSuperAdmin ? { institution_id: institutionId.value } : {}) }; if (editingId.value) isDepartment ? await employeeApi.updateDepartment(editingId.value, payload) : await employeeApi.updateDesignation(editingId.value, payload); else isDepartment ? await employeeApi.createDepartment(payload) : await employeeApi.createDesignation(payload); message("success", `${isDepartment ? "Department" : "Designation"} saved successfully.`); closeForm(); await reload(); } catch (error) { message("error", error.response?.data?.message || "Failed to save record."); } finally { saving.value = false; } }
async function removeEmployee(row) { if (!window.confirm(`Delete ${row.full_name || row.first_name}?`)) return; try { await employeeApi.deleteEmployee(row.employee_id); message("success", "Employee deleted successfully."); await loadEmployees(); } catch (error) { message("error", error.response?.data?.message || "Failed to delete employee."); } }
async function removeMaster(row) { const isDepartment = activeTab.value === "departments"; if (!window.confirm(`Delete this ${isDepartment ? "department" : "designation"}?`)) return; try { isDepartment ? await employeeApi.deleteDepartment(row.department_id) : await employeeApi.deleteDesignation(row.designation_id); message("success", "Record deleted successfully."); await loadMaster(); await loadLookups(); } catch (error) { message("error", error.response?.data?.message || "Failed to delete record."); } }
onMounted(async () => { if (isSuperAdmin) { try { const response = await getInstitutions(); institutions.value = Array.isArray(response.data) ? response.data : response.data?.data || []; } catch { message("error", "Failed to load institutions."); } } await reload(); });
</script>

<style scoped>
.page { display: flex; flex-direction: column; gap: 20px; }.page-header { display:flex; justify-content:space-between; align-items:center; gap:16px; padding:24px; border:1px solid #e2e8f0; border-radius:22px; background:linear-gradient(135deg,#eef6ff,#fff); }.page-header h1 { margin:0; font-size:28px; color:#0f172a; }.page-header p { margin:6px 0 0; color:#64748b; }.institution-card,.filters { padding:18px; border:1px solid #e5edf7; border-radius:20px; background:#fff; box-shadow:0 10px 28px rgba(15,23,42,.05); }.tabs { display:flex; gap:8px; border-bottom:1px solid #e2e8f0; }.tabs button { border:0; background:transparent; padding:12px 16px; cursor:pointer; color:#64748b; font-weight:800; border-bottom:3px solid transparent; }.tabs button.active { color:#2563eb; border-bottom-color:#2563eb; }.modal-backdrop { position:fixed; z-index:1000; inset:0; display:flex; align-items:center; justify-content:center; padding:24px; background:rgba(15,23,42,.56); }.modal-dialog { width:min(980px,100%); max-height:calc(100vh - 48px); overflow:auto; padding:24px; border-radius:22px; background:#fff; box-shadow:0 28px 80px rgba(15,23,42,.34); }.form-header { display:flex; justify-content:space-between; align-items:center; margin-bottom:18px; }.form-header h2 { margin:0; font-size:18px; }.close-button { border:0; background:transparent; font-size:26px; cursor:pointer; color:#64748b; }.form-grid,.filters { display:grid; grid-template-columns:repeat(3,minmax(0,1fr)); gap:16px; }.master-form { grid-template-columns:repeat(3,minmax(0,1fr)); }.photo-field { display:flex; flex-direction:column; gap:7px; }.photo-label { color:#334155; font-size:13px; font-weight:700; }.photo-control { display:flex; align-items:center; gap:12px; min-height:72px; }.photo-preview,.photo-placeholder { width:68px; height:68px; border:1px solid #dbe3ef; border-radius:14px; object-fit:cover; }.photo-placeholder { display:grid; place-items:center; color:#94a3b8; background:#f8fafc; font-size:12px; }.photo-field small { color:#64748b; font-size:12px; }.list-photo,.list-photo-fallback { width:38px; height:38px; border:1px solid #dbe3ef; border-radius:50%; object-fit:cover; }.list-photo-fallback { display:grid; place-items:center; background:#eff6ff; font-size:18px; }.form-actions { display:flex; align-items:end; gap:10px; grid-column:1 / -1; }.filters { grid-template-columns:2fr 1fr 1fr auto; align-items:end; }.actions { display:flex; justify-content:flex-end; gap:8px; }.muted { display:block; margin-top:3px; color:#64748b; }.type-pill,.status-pill { display:inline-block; border-radius:999px; padding:4px 8px; font-size:11px; font-weight:900; background:#dbeafe; color:#1d4ed8; }.status-pill.active { background:#dcfce7; color:#166534; }.status-pill.resigned,.status-pill.terminated,.status-pill.inactive { background:#fee2e2; color:#b91c1c; }@media (max-width:900px) { .page-header { align-items:flex-start; flex-direction:column; }.form-grid,.master-form,.filters { grid-template-columns:1fr; }.modal-backdrop { align-items:flex-start; padding:12px; }.modal-dialog { max-height:calc(100vh - 24px); padding:18px; } }
</style>
