/**
 * Real auth service — talks to Django /api/auth/ endpoints via JWT.
 */
import axios from 'axios';

const api = axios.create({ baseURL: '/api' });

// Attach access token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Auto-refresh on 401
api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true;
      const refresh = localStorage.getItem('refresh_token');
      if (refresh) {
        try {
          const res = await axios.post('/api/auth/refresh/', { refresh });
          const newAccess = res.data.access;
          localStorage.setItem('access_token', newAccess);
          original.headers.Authorization = `Bearer ${newAccess}`;
          return api(original);
        } catch {
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
          window.location.href = '/login';
        }
      }
    }
    return Promise.reject(error);
  }
);

export default api;

// ── Types ──────────────────────────────────────────────────────────────────
export interface AuthTokens { access: string; refresh: string; }
export interface DjangoUser {
  id: number;
  email: string;
  username: string;
  first_name: string;
  last_name: string;
  full_name: string;
  photo: string | null;
  provider: string;
  is_staff: boolean;
  date_joined: string;
  profile: DjangoProfile | null;
}
export interface DjangoProfile {
  id: number;
  phone: string;
  address: string;
  wilaya: string;
  baladia: string;
  bio: string;
  is_seller: boolean;
  store_name: string;
  store_description: string;
  store_category: string;
  store_logo: string | null;
  commercial_register: string;
}

// ── Auth API calls ─────────────────────────────────────────────────────────

export async function loginDjango(email: string, password: string): Promise<AuthTokens> {
  try {
    const res = await axios.post('/api/auth/login/', { email, password });
    return res.data;
  } catch (err: any) {
    const data = err.response?.data;
    const detail = Array.isArray(data?.detail) ? data.detail[0] : data?.detail;
    const userEmail = Array.isArray(data?.email) ? data.email[0] : data?.email;

    if (err.response?.status === 400 && detail === 'verification_required') {
      throw { type: 'VERIFICATION_REQUIRED', email: userEmail };
    }
    throw err;
  }
}

export async function loginSocialDjango(data: {
  provider: 'google' | 'facebook';
  provider_id: string;
  email: string;
  first_name: string;
  last_name: string;
  photo?: string;
}): Promise<AuthTokens & { user: DjangoUser }> {
  try {
    const res = await axios.post('/api/auth/social/', data);
    return res.data;
  } catch (err: any) {
    const resData = err.response?.data;
    const detail = Array.isArray(resData?.detail) ? resData.detail[0] : resData?.detail;
    const userEmail = Array.isArray(resData?.email) ? resData.email[0] : resData?.email;

    if (err.response?.status === 400 && detail === 'verification_required') {
      throw { type: 'VERIFICATION_REQUIRED', email: userEmail };
    }
    throw err;
  }
}

export async function verifyIpOtpDjango(email: string, otp: string): Promise<AuthTokens & { user: DjangoUser }> {
  const res = await axios.post('/api/auth/verify-ip/', { email, otp });
  return res.data;
}

export async function registerDjango(data: {
  email: string;
  username: string;
  password: string;
  password2: string;
  is_seller?: boolean;
  phone?: string;
  wilaya?: string;
  baladia?: string;
  address?: string;
  store_name?: string;
  store_description?: string;
  store_category?: string;
}) {
  const res = await axios.post('/api/auth/register/', data);
  return res.data;
}

export async function logoutDjango(refresh: string) {
  try {
    await api.post('/auth/logout/', { refresh });
  } catch { /* already expired — ignore */ }
}

export async function fetchProfileDjango(): Promise<DjangoUser> {
  const res = await api.get<DjangoUser>('/auth/profile/');
  return res.data;
}

export async function updateProfileDjango(data: Partial<DjangoProfile & { first_name: string; last_name: string; username: string }>) {
  const res = await api.patch<DjangoUser>('/auth/profile/', data);
  return res.data;
}

export async function changePasswordDjango(old_password: string, new_password: string, new_password2: string) {
  const res = await api.post('/auth/change-password/', { old_password, new_password, new_password2 });
  return res.data;
}

// ── Token helpers ──────────────────────────────────────────────────────────

export function saveTokens(tokens: AuthTokens) {
  localStorage.setItem('access_token', tokens.access);
  localStorage.setItem('refresh_token', tokens.refresh);
}

export function clearTokens() {
  localStorage.removeItem('access_token');
  localStorage.removeItem('refresh_token');
}
