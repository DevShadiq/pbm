import axios from "axios";

// const api = axios.create({
//   baseURL: "http://localhost:5000/api",
// });

// const api = axios.create({
//   baseURL: import.meta.env.VITE_API_BASE_URL || "http://103.17.36.41:5000/api",
//   headers: {
//     "Content-Type": "application/json",
//   },
// });

// api.interceptors.request.use((config) => {
//   const token = localStorage.getItem("sms_token");

//   if (token) {
//     config.headers.Authorization = `Bearer ${token}`;
//   }

//   return config;
// });


// api.interceptors.response.use(
//   (response) => response,
//   (error) => {
//     if (error.response?.status === 401) {
//       localStorage.removeItem("sms_token");
//       localStorage.removeItem("sms_user");
//       localStorage.removeItem("sms_menus");
//       localStorage.removeItem("sms_permissions");
//     }

//     return Promise.reject(error);
//   }
// );



// ===============================
// Base URL Config
// ===============================
export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "/api";

// Convert:
// http://103.17.36.41:5000/api
// to:
// http://103.17.36.41:5000
export const SERVER_BASE_URL = API_BASE_URL.replace(/\/api\/?$/, "");

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// ===============================
// File URL Helper
// ===============================
export function getFileUrl(fileUrl) {
  if (!fileUrl) return "";

  // If already full URL, return directly
  if (fileUrl.startsWith("http://") || fileUrl.startsWith("https://")) {
    return fileUrl;
  }

  // If database stores: /uploads/students/file.png
  // Return: http://103.17.36.41:5000/uploads/students/file.png
  return `${SERVER_BASE_URL}${fileUrl.startsWith("/") ? "" : "/"}${fileUrl}`;
}

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("sms_token");

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("sms_token");
      localStorage.removeItem("sms_user");
      localStorage.removeItem("sms_menus");
      localStorage.removeItem("sms_permissions");
    }

    return Promise.reject(error);
  }
);

export const menuApi = {
  getAll() {
    return api.get("/menus");
  },

  getTree() {
    return api.get("/menus/tree");
  },

  getById(id) {
    return api.get(`/menus/${id}`);
  },

  create(data) {
    return api.post("/menus", data);
  },

  update(id, data) {
    return api.put(`/menus/${id}`, data);
  },

  updateStatus(id, data) {
    return api.patch(`/menus/${id}/status`, data);
  },

  delete(id) {
    return api.delete(`/menus/${id}`);
  },
};

export const dashboardApi = {
  getSummary() {
    return api.get("/dashboard/summary");
  },
};

// ===============================
// Student API
// ===============================
export const studentApi = {
  getLookups(institutionId) {
    return api.get("/students/lookups/all", {
      params: {
        institution_id: institutionId,
      },
    });
  },

  createAdmission(formData) {
    return api.post("/students/admission", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
  },

  getAll(params = {}) {
    return api.get("/students", { params });
  },

  getById(id) {
    return api.get(`/students/${id}`);
  },
};



// ===============================
// Security API
// ===============================

export const userApi = {
  getAll() {
    return api.get("/users");
  },

  getById(id) {
    return api.get(`/users/${id}`);
  },

  create(data) {
    return api.post("/users", data);
  },

  update(id, data) {
    return api.put(`/users/${id}`, data);
  },

  delete(id) {
    return api.delete(`/users/${id}`);
  },
};



export const roleApi = {
  getAll() {
    return api.get("/roles");
  },

  getById(id) {
    return api.get(`/roles/${id}`);
  },

  create(data) {
    return api.post("/roles", data);
  },

  update(id, data) {
    return api.put(`/roles/${id}`, data);
  },

  delete(id) {
    return api.delete(`/roles/${id}`);
  },
};



export const permissionApi = {
  getAll() {
    return api.get("/security/permissions");
  },

  getByRole(roleId) {
    return api.get(`/security/roles/${roleId}/permissions`);
  },

  saveRolePermissions(roleId, data) {
    return api.post(`/security/roles/${roleId}/permissions`, data);
  },
};

export const noticeApi = {
  getAll(params = {}) {
    return api.get("/notices", { params });
  },
  getCategories() {
    return api.get("/notices/categories");
  },
  create(data) {
    return api.post("/notices", data);
  },
  update(id, data) {
    return api.put(`/notices/${id}`, data);
  },
  uploadAttachment(file) {
    const formData = new FormData();
    formData.append("attachment", file);
    return api.post("/notices/upload", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },
  delete(id) {
    return api.delete(`/notices/${id}`);
  },
};

export const employeeApi = {
  getEmployees(params = {}) { return api.get("/employees", { params }); },
  getEmployee(id) { return api.get(`/employees/${id}`); },
  createEmployee(data) { return api.post("/employees", data); },
  updateEmployee(id, data) { return api.put(`/employees/${id}`, data); },
  deleteEmployee(id) { return api.delete(`/employees/${id}`); },
  uploadPhoto(formData) { return api.post("/employees/upload-photo", formData, { headers: { "Content-Type": "multipart/form-data" } }); },
  getDepartments(params = {}) { return api.get("/employees/departments", { params }); },
  createDepartment(data) { return api.post("/employees/departments", data); },
  updateDepartment(id, data) { return api.put(`/employees/departments/${id}`, data); },
  deleteDepartment(id) { return api.delete(`/employees/departments/${id}`); },
  getDesignations(params = {}) { return api.get("/employees/designations", { params }); },
  createDesignation(data) { return api.post("/employees/designations", data); },
  updateDesignation(id, data) { return api.put(`/employees/designations/${id}`, data); },
  deleteDesignation(id) { return api.delete(`/employees/designations/${id}`); },
  getLookups(institutionId) { return api.get("/employees/lookups", { params: { institution_id: institutionId } }); },
};

export const roleMenuApi = {
  getMenus() {
    return api.get("/security/menus");
  },

  getByRole(roleId) {
    return api.get(`/security/roles/${roleId}/menus`);
  },

  saveRoleMenus(roleId, data) {
    return api.post(`/security/roles/${roleId}/menus`, data);
  },
};

export const userRoleApi = {
  getUsers() {
    return api.get("/users");
  },

  getRoles() {
    return api.get("/roles");
  },

  getBranches() {
    return api.get("/security/branches");
  },

  getByUser(userId) {
    return api.get(`/security/users/${userId}/roles`);
  },

  assign(data) {
    return api.post("/security/user-roles", data);
  },

  remove(data) {
    return api.delete("/security/user-roles", {
      data,
    });
  },
};

export default api;
