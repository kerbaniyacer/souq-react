import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User, Profile } from '@shared/types';
import {
  loginDjango, registerDjango, logoutDjango,
  fetchProfileDjango, updateProfileDjango, changePasswordDjango,
  saveTokens, clearTokens,
  type DjangoUser,
} from '../services/authService';

interface AuthStore {
  user: User | null;
  profile: Profile | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  profileLoading: boolean;

  setAccessToken: (token: string | null) => void;

  login: (email: string, password: string, rememberMe?: boolean) => Promise<void>;
  loginSocial: (userData: User, token: string, refresh?: string) => Promise<void>;
  register: (data: {
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
    ccp_number?: string;
    ccp_name?: string;
    baridimob_id?: string;
  }) => Promise<void>;
  logout: () => Promise<void>;
  fetchProfile: (force?: boolean) => Promise<void>;
  updateProfile: (data: Partial<Profile>) => Promise<void>;
  changePassword: (old_password: string, new_password: string, new_password2: string) => Promise<void>;
  changeAccountType: (isSeller: boolean) => Promise<void>;
  finalizeLogin: () => Promise<void>;
  clearAll: () => void;
}

function djangoUserToUser(d: DjangoUser): User {
  return {
    id: d.id,
    username: d.username,
    email: d.email,
    first_name: d.first_name,
    last_name: d.last_name,
    full_name: d.full_name,
    is_staff: d.is_staff,
    date_joined: d.date_joined,
    role: d.role as 'customer' | 'seller' | 'admin',
    photo: d.photo ?? undefined,
    provider: d.provider as 'local' | 'google' | 'facebook',
    is_onboarded: d.is_onboarded ?? true,
  };
}

function djangoProfileToProfile(d: DjangoUser): Profile | null {
  if (!d.profile) return null;
  const p = d.profile;
  return {
    id: p.id,
    user_id: d.id,
    is_seller: p.is_seller,
    phone: p.phone,
    address: p.address,
    wilaya: p.wilaya,
    baladia: p.baladia,
    bio: p.bio,
    photo: d.photo,
    store_name: p.store_name,
    store_description: p.store_description,
    store_category: p.store_category,
    store_logo: p.store_logo,
    commercial_register: p.commercial_register,
    ccp_number: p.ccp_number,
    ccp_name: p.ccp_name,
    baridimob_id: p.baridimob_id,
    // Add defaults for missing fields in Django response if necessary
  } as Profile;
}

/** Module-level lock + throttle — prevents rapid fetchProfile calls */
let fetchProfileLock = false;
let lastFetchProfileTime = 0;

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      accessToken: null,
      user: null,
      profile: null,
      isAuthenticated: false,
      isLoading: false,
      profileLoading: false,

      setAccessToken: (token) => set({ accessToken: token, isAuthenticated: token !== null }),

      login: async (email, password, rememberMe = false) => {
        set({ isLoading: true });
        try {
          const tokens = await loginDjango(email, password, rememberMe);
          const isOnboarded = tokens.user?.is_onboarded ?? true;

          if (!isOnboarded) {
            // Store tokens temporarily — user is NOT authenticated yet
          localStorage.setItem('pending_auth', JSON.stringify({
            access: tokens.access,
            refresh: tokens.refresh,
            user: tokens.user,
          }));
            set({ isLoading: false });
            throw Object.assign(new Error('onboarding_required'), { type: 'ONBOARDING_REQUIRED' });
          }

          // Save tokens (Refresh token goes to cookie, Access might be in localStorage for legacy but we prefer memory)
          saveTokens(tokens);
          set({ 
            accessToken: tokens.access ?? null,
            isAuthenticated: true, 
            isLoading: false 
          });
          await get().fetchProfile();
        } catch (err) {
          set({ isLoading: false });
          throw err;
        }
      },

      loginSocial: async (userData, token, refresh) => {
        saveTokens({ access: token, refresh });
        // Setting isAuthenticated: true will trigger App.tsx's useEffect to call fetchProfile()
        set({ accessToken: token, user: userData, isAuthenticated: true });
      },

      /** Finalizes login after profile completion (moves tokens from sessionStorage → authStore) */
      finalizeLogin: async () => {
        const raw = localStorage.getItem('pending_auth');
        if (!raw) return;
        const pending = JSON.parse(raw);
        saveTokens(pending);
        localStorage.removeItem('pending_auth');
        set({
          accessToken: pending.access,
          isAuthenticated: true,
        });
      },

      register: async (data) => {
        set({ isLoading: true });
        try {
          await registerDjango(data);
          set({ isLoading: false });
        } catch (err) {
          set({ isLoading: false });
          throw err;
        }
      },

      logout: async () => {
        await logoutDjango(); // Server clears HttpOnly cookies
        clearTokens();
        set({ user: null, profile: null, accessToken: null, isAuthenticated: false });
      },

      fetchProfile: async (force = false) => {
        // Throttle: at most 1 call per 10 seconds unless forced (e.g. after save)
        const now = Date.now();
        if (!force && (fetchProfileLock || now - lastFetchProfileTime < 10_000)) return;
        fetchProfileLock = true;
        lastFetchProfileTime = now;
        set({ profileLoading: true });
        try {
          const data = await fetchProfileDjango();
          set({
            user: djangoUserToUser(data),
            profile: djangoProfileToProfile(data),
            profileLoading: false,
          });
        } catch (err: any) {
          set({ profileLoading: false });
          // 401 handled by interceptor; 403 profile_incomplete is expected
        } finally {
          fetchProfileLock = false;
        }
      },

      updateProfile: async (data) => {
        const updated = await updateProfileDjango(data as any);
        set({
          user: djangoUserToUser(updated),
          profile: djangoProfileToProfile(updated),
        });
      },

      changePassword: async (old_password, new_password, new_password2) => {
        await changePasswordDjango(old_password, new_password, new_password2);
      },

      changeAccountType: async (isSeller: boolean) => {
        await get().updateProfile({ is_seller: isSeller } as any);
      },

      clearAll: () => {
        clearTokens();
        localStorage.removeItem('pending_auth');
        set({
          user: null,
          profile: null,
          accessToken: null,
          isAuthenticated: false,
          isLoading: false,
          profileLoading: false,
        });
      },
    }),
    {
      name: 'auth-storage',
      // Only persist non-sensitive UI state (user profile data).
      // isAuthenticated is derived from a valid session on boot (silent refresh).
      // accessToken is kept in memory only — never persisted to localStorage.
      partialize: (state) => ({
        user: state.user,
        profile: state.profile,
      }),
    }
  )
);
