const API_BASE = import.meta.env.VITE_API_URL || '/api';
const TOKEN_KEY = 'pbm_admin_token';
const USER_KEY = 'pbm_admin_user';
const PUBLIC_DATA_CACHE_KEY = 'pbm_public_data_cache';

const generatedPublicData = {
  settings: {
    name_bn: 'পয়লা বানিয়াবাড়ী ফাজিল মাদরাসা',
    name_en: 'PAILA BANIABARI FAZIL MADRASAH',
    eiin: '110124',
    phone: '০১৫১৮৩৬৬১৭৮',
    email: 'pbm@yahoo.com',
    address: 'বানিয়াবাড়ী, মাহমুদপুর, মেলান্দহ, জামালপুর',
    breaking_news: 'ভর্তি, পরীক্ষা ও প্রতিষ্ঠানের সকল গুরুত্বপূর্ণ তথ্য এই ওয়েবসাইটে প্রকাশ করা হয়।',
  },
  institution: null,
  notices: [],
  teachers: [],
  source: 'generated',
};

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function getStoredUser() {
  const raw = localStorage.getItem(USER_KEY);
  return raw ? JSON.parse(raw) : null;
}

export function saveSession({ token, user }) {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function clearSession() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

export async function apiRequest(path, options = {}) {
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;

  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
  });

  if (response.status === 204) return null;

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.message || 'Request failed.');
  }

  return data;
}

function readPublicDataCache() {
  try {
    const raw = localStorage.getItem(PUBLIC_DATA_CACHE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function writePublicDataCache(data) {
  try {
    localStorage.setItem(PUBLIC_DATA_CACHE_KEY, JSON.stringify({
      ...data,
      cachedAt: new Date().toISOString(),
    }));
  } catch {
    // The public site should keep rendering even if storage is unavailable.
  }
}

function createGeneratedPublicData() {
  return {
    ...generatedPublicData,
    settings: { ...generatedPublicData.settings },
    generatedAt: new Date().toISOString(),
  };
}

export const api = {
  login(email, password) {
    return apiRequest('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  },
  me() {
    return apiRequest('/auth/me');
  },
  overview() {
    return apiRequest('/admin/overview');
  },
  access() {
    return apiRequest('/admin/access');
  },
  saveUser(user) {
    const isEdit = Boolean(user.userId);
    return apiRequest(`/admin/users${isEdit ? `/${user.userId}` : ''}`, {
      method: isEdit ? 'PUT' : 'POST',
      body: JSON.stringify(user),
    });
  },
  saveRole(role) {
    const isEdit = Boolean(role.roleId);
    return apiRequest(`/admin/roles${isEdit ? `/${role.roleId}` : ''}`, {
      method: isEdit ? 'PUT' : 'POST',
      body: JSON.stringify(role),
    });
  },
  saveRolePermissions(roleId, grants) {
    return apiRequest(`/admin/roles/${roleId}/permissions`, {
      method: 'PUT',
      body: JSON.stringify({ grants }),
    });
  },
  async publicData() {
    try {
      const data = await apiRequest('/public');
      if (data && (data.settings || data.notices || data.teachers)) {
        writePublicDataCache(data);
      }
      return data;
    } catch (error) {
      const cached = readPublicDataCache();
      if (cached) return cached;

      const generated = createGeneratedPublicData();
      writePublicDataCache(generated);
      return generated;
    }
  },
  submitAdmission(payload) {
    return apiRequest('/admissions', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },
  updateSettings(settings) {
    return apiRequest('/admin/settings', {
      method: 'PUT',
      body: JSON.stringify(settings),
    });
  },
  notices() {
    return apiRequest('/admin/notices');
  },
  saveNotice(notice) {
    const isEdit = Boolean(notice.id);
    return apiRequest(`/admin/notices${isEdit ? `/${notice.id}` : ''}`, {
      method: isEdit ? 'PUT' : 'POST',
      body: JSON.stringify(notice),
    });
  },
  deleteNotice(id) {
    return apiRequest(`/admin/notices/${id}`, { method: 'DELETE' });
  },
  teachers() {
    return apiRequest('/admin/teachers');
  },
  saveTeacher(teacher) {
    const isEdit = Boolean(teacher.id);
    return apiRequest(`/admin/teachers${isEdit ? `/${teacher.id}` : ''}`, {
      method: isEdit ? 'PUT' : 'POST',
      body: JSON.stringify(teacher),
    });
  },
  deleteTeacher(id) {
    return apiRequest(`/admin/teachers/${id}`, { method: 'DELETE' });
  },
};
