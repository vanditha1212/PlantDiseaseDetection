import type {
  AdminDashboardData,
  AdminReportRow,
  DashboardStats,
  DiseaseLibraryItem,
  DiseaseReport,
  FarmingTip,
  LanguageCode,
  UserProfile,
} from '../types/index.ts';

async function apiRequest<T>(
  url: string,
  options: RequestInit = {},
  token?: string | null
): Promise<T> {
  const headers = new Headers(options.headers);
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }
  if (!(options.body instanceof FormData) && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  const response = await fetch(url, { ...options, headers });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data?.error || `Request failed (${response.status})`);
  }
  return data as T;
}

export const api = {
  register(payload: {
    fullName: string;
    email: string;
    mobileNumber: string;
    password: string;
    state: string;
    district: string;
    preferredLanguage: LanguageCode;
  }) {
    return apiRequest<{ token: string; user: UserProfile }>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  login(email: string, password: string) {
    return apiRequest<{ token: string; user: UserProfile }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  },

  adminLogin(email: string, password: string) {
    return apiRequest<{ token: string; user: UserProfile }>('/api/admin/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  },

  syncGoogleUser(firebaseToken: string) {
    return apiRequest<{ user: UserProfile }>(
      '/api/auth/google-sync',
      { method: 'POST', body: JSON.stringify({}) },
      firebaseToken
    );
  },

  getProfile(token: string) {
    return apiRequest<{
      user: UserProfile;
      stats: DashboardStats;
      recentReports: DiseaseReport[];
    }>('/api/auth/profile', {}, token);
  },

  updateProfile(
    token: string,
    payload: {
      fullName: string;
      mobileNumber: string;
      state: string;
      district: string;
      preferredLanguage: LanguageCode;
    }
  ) {
    return apiRequest<{ user: UserProfile }>(
      '/api/auth/profile',
      { method: 'PUT', body: JSON.stringify(payload) },
      token
    );
  },

  analyzePlant(
    token: string,
    formData: FormData
  ) {
    return apiRequest<{ report: DiseaseReport }>(
      '/api/disease/analyze',
      { method: 'POST', body: formData },
      token
    );
  },

  getReports(token: string) {
    return apiRequest<{ reports: DiseaseReport[] }>('/api/disease/reports', {}, token);
  },

  getReportById(token: string, id: number) {
    return apiRequest<{ report: DiseaseReport }>(
      `/api/disease/reports/${id}`,
      {},
      token
    );
  },

  saveReportFlag(token: string, id: number, savedByFarmer: boolean) {
    return apiRequest<{ report: DiseaseReport }>(
      `/api/disease/reports/${id}/save`,
      { method: 'PATCH', body: JSON.stringify({ savedByFarmer }) },
      token
    );
  },

  deleteReport(token: string, id: number) {
    return apiRequest<{ success: boolean }>(
      `/api/disease/reports/${id}`,
      { method: 'DELETE' },
      token
    );
  },

  getLibrary(search?: string, crop?: string) {
    const params = new URLSearchParams();
    if (search) params.set('search', search);
    if (crop && crop !== 'All') params.set('crop', crop);
    const qs = params.toString() ? `?${params.toString()}` : '';
    return apiRequest<{ items: DiseaseLibraryItem[] }>(`/api/disease/library${qs}`);
  },

  getTips(category?: string, search?: string) {
    const params = new URLSearchParams();
    if (category && category !== 'All') params.set('category', category);
    if (search) params.set('search', search);
    const qs = params.toString() ? `?${params.toString()}` : '';
    return apiRequest<{ tips: FarmingTip[] }>(`/api/farming/tips${qs}`);
  },

  getAdminDashboard(token: string) {
    return apiRequest<AdminDashboardData>('/api/admin/dashboard', {}, token);
  },

  getAdminReports(token: string) {
    return apiRequest<{ reports: AdminReportRow[] }>('/api/admin/reports', {}, token);
  },

  getAdminUsers(token: string) {
    return apiRequest<{ users: UserProfile[] }>('/api/admin/users', {}, token);
  },

  deleteAdminUser(token: string, id: number) {
    return apiRequest<{ success: boolean }>(
      `/api/admin/users/${id}`,
      { method: 'DELETE' },
      token
    );
  },

  addLibraryEntry(
    token: string,
    payload: Omit<DiseaseLibraryItem, 'id' | 'createdAt'>
  ) {
    return apiRequest<{ item: DiseaseLibraryItem }>(
      '/api/admin/library',
      { method: 'POST', body: JSON.stringify(payload) },
      token
    );
  },

  deleteLibraryEntry(token: string, id: number) {
    return apiRequest<{ success: boolean }>(
      `/api/admin/library/${id}`,
      { method: 'DELETE' },
      token
    );
  },

  addFarmingTip(token: string, payload: Omit<FarmingTip, 'id' | 'createdAt'>) {
    return apiRequest<{ tip: FarmingTip }>(
      '/api/admin/tips',
      { method: 'POST', body: JSON.stringify(payload) },
      token
    );
  },

  deleteFarmingTip(token: string, id: number) {
    return apiRequest<{ success: boolean }>(
      `/api/admin/tips/${id}`,
      { method: 'DELETE' },
      token
    );
  },
};
