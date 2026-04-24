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

// ── Cross-tab token sync via BroadcastChannel ────────────────────────────────
// Prevents token-rotation race condition when multiple tabs open simultaneously.
// Tab 2 asks Tab 1 for its current access token instead of hitting /refresh
// with the same (already-rotated) cookie, which would trigger a 401 blacklist error.

let _bc: BroadcastChannel | null = null;
function getBC(): BroadcastChannel | null {
  if (!_bc && typeof BroadcastChannel !== 'undefined') {
    _bc = new BroadcastChannel('souq_auth_sync');
  }
  return _bc;
}

/** Sets up the listener that answers TOKEN_REQUEST messages from sibling tabs */
export function initTokenSync() {
  const channel = getBC();
  if (!channel) return;

  channel.addEventListener('message', (e: MessageEvent) => {
    if (e.data?.type === 'TOKEN_REQUEST') {
      const token = useAuthStore.getState().accessToken;
      if (token) channel.postMessage({ type: 'TOKEN_RESPONSE', token });
    }
    if (e.data?.type === 'TOKEN_REFRESHED') {
      // Another tab just refreshed — adopt its token to avoid double-refresh
      useAuthStore.getState().setAccessToken(e.data.token);
    }
  });
}

/** Asks sibling tabs for their current access token (resolves null if no reply within 300ms) */
export function requestTokenFromSiblingTab(): Promise<string | null> {
  const channel = getBC();
  if (!channel) return Promise.resolve(null);

  return new Promise((resolve) => {
    const timer = setTimeout(() => {
      channel.removeEventListener('message', handler);
      resolve(null);
    }, 300);

    const handler = (e: MessageEvent) => {
      if (e.data?.type === 'TOKEN_RESPONSE' && e.data.token) {
        clearTimeout(timer);
        channel.removeEventListener('message', handler);
        resolve(e.data.token as string);
      }
    };

    channel.addEventListener('message', handler);
    channel.postMessage({ type: 'TOKEN_REQUEST' });
  });
}

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
      // Broadcast the new token so sibling tabs don't need to refresh again
      getBC()?.postMessage({ type: 'TOKEN_REFRESHED', token: newAccessToken });
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
        processQueue(null, newAccessToken);
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        useAuthStore.getState().logout();
        // PrivateRoute in App.tsx handles redirect to /login when isAuthenticated becomes false
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
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
  last_seen?: string | null;
  is_online?: boolean;
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
        // DRF ValidationError wraps dict values in lists: {"email": ["x@y.z"]}
        const rawEmail = data.email;
        const resolvedEmail = Array.isArray(rawEmail) ? rawEmail[0] : (rawEmail || email);
        throw { type: 'VERIFICATION_REQUIRED', email: resolvedEmail };
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
  access_token: string;
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
        const rawEmail = responseData.email;
        const resolvedEmail = Array.isArray(rawEmail) ? rawEmail[0] : (rawEmail || data.email);
        throw { type: 'VERIFICATION_REQUIRED', email: resolvedEmail };
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
