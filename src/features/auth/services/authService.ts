/**
 * Auth service — implements split-token architecture.
 * Access Token: Stored in-memory (Zustand) and sent via Authorization header.
 * Refresh Token: Stored in HttpOnly cookie and managed by the browser.
 */
import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { useAuthStore } from '../stores/authStore';
import { env } from '@shared/lib/env';

const api = axios.create({
  baseURL: env.apiUrl,

  withCredentials: true,
  headers: {
    'ngrok-skip-browser-warning': 'true',
  },
});

// ── Request Interceptor (Inject Token) ──────────────────────────────────────
api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ── Response Interceptor (Auto-Refresh on 401) ──────────────────────────────
let isRefreshing = false;
let failedQueue: { resolve: (v: any) => void; reject: (e: any) => void }[] = [];

function processQueue(error: any, token: string | null = null) {
  failedQueue.forEach(p => (error ? p.reject(error) : p.resolve(token)));
  failedQueue = [];
}

let refreshPromise: Promise<string> | null = null;

export async function refreshAccessToken() {
  if (refreshPromise) {
    return refreshPromise;
  }

  refreshPromise = (async () => {
    try {
      const res = await axios.post(`${env.apiUrl}/auth/refresh/`, {}, { 
        withCredentials: true,
        headers: { 'ngrok-skip-browser-warning': 'true' }
      });
      const newAccessToken = res.data.access;
      useAuthStore.getState().setAccessToken(newAccessToken);
      return newAccessToken;
    } finally {
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}

api.interceptors.response.use(
  (res) => res,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    if (error.response?.status === 401 && !originalRequest._retry) {
      console.warn(`[API] 401 Unauthorized on ${originalRequest.url}. Attempting refresh...`);
      
      if (isRefreshing) {
        console.log('[API] Already refreshing, queuing request...');
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return api(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const newAccessToken = await refreshAccessToken();
        console.log('[API] Refresh successful, retrying original request...');
        processQueue(null, newAccessToken);
        isRefreshing = false;
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        console.error('[API] Refresh failed, logging out:', refreshError);
        processQueue(refreshError, null);
        isRefreshing = false;
        useAuthStore.getState().logout();
        if (window.location.pathname !== '/login') {
          window.location.href = '/login';
        }
        return Promise.reject(refreshError);
      }
    }
    return Promise.reject(error);
  }
);

export default api;

// ── Types ──────────────────────────────────────────────────────────────────
export interface AuthTokens { 
  access: string; 
  refresh?: string; 
  user?: DjangoUser; 
}

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
  role: string;
  date_joined: string;
  profile: DjangoProfile | null;
  is_onboarded?: boolean;
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
  ccp_number: string;
  ccp_name: string;
  baridimob_id: string;
}

// ── Auth API calls ─────────────────────────────────────────────────────────

export async function loginDjango(email: string, password: string, rememberMe = false): Promise<AuthTokens> {
  try {
    const res = await axios.post(`${env.apiUrl}/auth/login/`, 
      { email, password, remember_me: rememberMe }, 
      { 
        withCredentials: true,
        headers: { 'ngrok-skip-browser-warning': 'true' }
      }
    );
    return res.data;
  } catch (err: unknown) {
    if (axios.isAxiosError(err)) {
      const status = err.response?.status;
      const data = err.response?.data;

      const detail = Array.isArray(data?.detail) ? data.detail[0] : (data?.detail || '');
      const stringDetail = String(detail).toLowerCase();

      // Account suspended (Consistent handling)
      if (status === 403 || (status === 400 && stringDetail.includes('account_suspended'))) {
        throw {
          type: 'ACCOUNT_SUSPENDED',
          reason: data.reason || 'مخالفة شروط الاستخدام',
          email: data.email || email
        };
      }

      if (status === 400 && stringDetail.includes('verification_required')) {
        throw { type: 'VERIFICATION_REQUIRED', email: data.email || email };
      }
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
  remember_me?: boolean;
}): Promise<AuthTokens & { user: DjangoUser }> {
  try {
    const res = await axios.post(`${env.apiUrl}/auth/social/`, data, { 
      withCredentials: true,
      headers: { 'ngrok-skip-browser-warning': 'true' }
    });
    return res.data;
  } catch (err: unknown) {
    if (axios.isAxiosError(err)) {
      const status = err.response?.status;
      const responseData = err.response?.data;
      const detail = Array.isArray(responseData?.detail) ? responseData.detail[0] : (responseData?.detail || '');
      const stringDetail = String(detail).toLowerCase();

      // Mapping for common auth issues:
      if (status === 403 && responseData?.code === 'ACCOUNT_SUSPENDED') {
        throw {
          type: 'ACCOUNT_SUSPENDED',
          reason: responseData.reason || 'مخالفة شروط الاستخدام',
          email: responseData.email || data.email
        };
      }

      if (status === 400 && stringDetail.includes('verification_required')) {
        throw {
          type: 'VERIFICATION_REQUIRED',
          email: responseData.email || data.email
        };
      }
    }
    throw err;
  }
}

export async function verifyIpOtpDjango(email: string, otp: string, rememberMe = false): Promise<AuthTokens & { user: DjangoUser }> {
  const res = await axios.post(`${env.apiUrl}/auth/verify-ip/`, { email, otp, remember_me: rememberMe }, { 
    withCredentials: true,
    headers: { 'ngrok-skip-browser-warning': 'true' }
  });
  return res.data;
}

export async function registerDjango(data: any) {
  const res = await axios.post(`${env.apiUrl}/auth/register/`, data, {
    headers: { 'ngrok-skip-browser-warning': 'true' }
  });
  return res.data;
}

export async function logoutDjango() {
  try {
    await axios.post(`${env.apiUrl}/auth/logout/`, {}, { 
      withCredentials: true,
      headers: { 'ngrok-skip-browser-warning': 'true' }
    });
  } catch { /* already expired */ }
}

export async function fetchProfileDjango(): Promise<DjangoUser> {
  const res = await api.get<DjangoUser>('/auth/profile/');
  return res.data;
}

export async function fetchPublicProfileDjango(username: string): Promise<any> {
  const res = await api.get(`/auth/profile/${username}/`);
  return res.data;
}

export async function updateProfileDjango(data: any) {
  const res = await api.patch<DjangoUser>('/auth/profile/', data);
  return res.data;
}

export async function changePasswordDjango(old_password: string, new_password: string, new_password2: string) {
  const res = await api.post('/auth/change-password/', { old_password, new_password, new_password2 });
  return res.data;
}

// ── Token helpers ──
export function saveTokens(_tokens: AuthTokens) {
  // Clear any legacy localStorage tokens
  localStorage.removeItem('access_token');
  localStorage.removeItem('refresh_token');
}

export function clearTokens() {
  localStorage.removeItem('access_token');
  localStorage.removeItem('refresh_token');
}
