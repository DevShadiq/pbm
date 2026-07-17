const API_BASE = import.meta.env.VITE_API_URL || '/api';
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

async function apiRequest(path, options = {}) {
  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
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
    // The public site should render even when browser storage is unavailable.
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
  async publicData() {
    try {
      const data = await apiRequest('/public');
      if (data && (data.settings || data.notices || data.teachers)) {
        writePublicDataCache(data);
      }
      return data;
    } catch {
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
};
