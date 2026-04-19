import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User, Profile } from '@types';
import { loginUser, getProfile, registerUser, updateUserSellerStatus } from '@services/mockAuth';

interface AuthStore {
  user: User | null;
  profile: Profile | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  profileLoading: boolean;

  login: (username: string, password: string) => Promise<void>;
  loginSocial: (userData: User, token: string) => Promise<void>;
  register: (data: { username: string; email: string; password: string; is_seller: boolean }) => Promise<void>;
  logout: () => void;
  fetchProfile: () => Promise<void>;
  updateProfile: (data: Partial<Profile>) => Promise<void>;
  changeAccountType: (isSeller: boolean) => Promise<void>;
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

      // تسجيل الدخول العادي
      login: async (username, password) => {
        set({ isLoading: true });
        try {
          const { token, user } = await loginUser(username, password);
          localStorage.setItem('token', token);
          set({ token, user: user as unknown as User, isAuthenticated: true, isLoading: false });
          await get().fetchProfile();
        } catch (err) {
          set({ isLoading: false });
          throw err;
        }
      },

      // تسجيل الدخول الاجتماعي (Google/Facebook)
      loginSocial: async (userData, token) => {
        localStorage.setItem('token', token);
        set({ token, user: userData, isAuthenticated: true });
        await get().fetchProfile();
      },

      // إنشاء حساب جديد
      register: async (data) => {
        set({ isLoading: true });
        try {
          await registerUser(data);
          set({ isLoading: false });
        } catch (err) {
          set({ isLoading: false });
          throw err;
        }
      },

      logout: () => {
        localStorage.removeItem('token');
        localStorage.removeItem('mock_user_id');
        set({ user: null, profile: null, token: null, isAuthenticated: false });
      },

      fetchProfile: async () => {
        set({ profileLoading: true });
        try {
          const userId = localStorage.getItem('mock_user_id');
          if (!userId) { set({ profileLoading: false }); return; }
          const profile = await getProfile(userId);
          set({ profile: profile as unknown as Profile, profileLoading: false });
        } catch {
          set({ profileLoading: false });
        }
      },

      updateProfile: async (data) => {
        const current = get().profile;
        if (!current) return;
        set({ profile: { ...current, ...data } });
      },

      changeAccountType: async (isSeller: boolean) => {
        const userId = localStorage.getItem('mock_user_id');
        if (!userId) return;
        try {
          await updateUserSellerStatus(userId, isSeller);
          // تحديث الحالة المحلية
          const current = get().profile;
          if (current) {
            set({ profile: { ...current, is_seller: isSeller } });
          }
        } catch (err) {
          console.error('Failed to update seller status:', err);
          throw err;
        }
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
