import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User, Profile } from '@souq/types';
import {
  loginDjango, registerDjango, logoutDjango,
  fetchProfileDjango, updateProfileDjango, changePasswordDjango,
  saveTokens, clearTokens,
  type DjangoUser,
} from '@souq/services/authService';

interface AuthStore {
  user: User | null;
  profile: Profile | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  profileLoading: boolean;

  login: (email: string, password: string) => Promise<void>;
  loginSocial: (userData: User, token: string) => Promise<void>;
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
  }) => Promise<void>;
  logout: () => Promise<void>;
  fetchProfile: () => Promise<void>;
  updateProfile: (data: Partial<Profile>) => Promise<void>;
  changePassword: (old_password: string, new_password: string, new_password2: string) => Promise<void>;
  changeAccountType: (isSeller: boolean) => Promise<void>;
}

function djangoUserToUser(d: DjangoUser): User {
  return {
    id: d.id as unknown as number,
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
  } as unknown as User;
}

function djangoProfileToProfile(d: DjangoUser): Profile | null {
  if (!d.profile) return null;
  return {
    id: d.profile.id,
    user_id: d.id,
    is_seller: d.profile.is_seller,
    phone: d.profile.phone,
    address: d.profile.address,
    wilaya: d.profile.wilaya,
    baladia: d.profile.baladia,
    bio: d.profile.bio,
    photo: d.photo,
    store_name: d.profile.store_name,
    store_description: d.profile.store_description,
    store_category: d.profile.store_category,
    store_logo: d.profile.store_logo,
    commercial_register: d.profile.commercial_register,
  } as unknown as Profile;
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      user: null,
      profile: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
      profileLoading: false,

      login: async (email, password) => {
        set({ isLoading: true });
        try {
          const tokens = await loginDjango(email, password);
          saveTokens(tokens);
          set({ token: tokens.access, isAuthenticated: true, isLoading: false });
          await get().fetchProfile();
        } catch (err) {
          set({ isLoading: false });
          throw err;
        }
      },

      loginSocial: async (userData, token) => {
        localStorage.setItem('access_token', token);
        set({ token, user: userData, isAuthenticated: true });
        await get().fetchProfile();
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
        const refresh = localStorage.getItem('refresh_token') ?? '';
        await logoutDjango(refresh);
        clearTokens();
        set({ user: null, profile: null, token: null, isAuthenticated: false });
      },

      fetchProfile: async () => {
        set({ profileLoading: true });
        try {
          const data = await fetchProfileDjango();
          set({
            user: djangoUserToUser(data),
            profile: djangoProfileToProfile(data),
            profileLoading: false,
          });
        } catch {
          set({ profileLoading: false });
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
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        profile: state.profile,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
