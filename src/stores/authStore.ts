import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import axios from 'axios';
import type { User, Profile } from '@/types';
import { loginUser, verifyLoginOtp, getProfile, registerUser, updateUserSellerStatus } from '@/services/mockAuth';

const DB = '/db';

interface AuthStore {
  user: User | null;
  profile: Profile | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  profileLoading: boolean;

  login: (username: string, password: string) => Promise<{ requiresOtp: true; pendingUserId: string; maskedEmail: string } | void>;
  loginWithOtp: (userId: string, otp: string) => Promise<void>;
  loginSocial: (userData: User, token: string) => Promise<void>;
  register: (data: {
    username: string; email: string; password: string; is_seller: boolean;
    phone?: string; address?: string; wilaya?: string; baladia?: string;
    store_name?: string; store_description?: string; store_category?: string;
  }) => Promise<void>;
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
          const result = await loginUser(username, password);
          if (result.requiresOtp) {
            set({ isLoading: false });
            return result;
          }
          const { token, user } = result;
          localStorage.setItem('token', token);
          set({ token, user: user as unknown as User, isAuthenticated: true, isLoading: false });
          await get().fetchProfile();
        } catch (err) {
          set({ isLoading: false });
          throw err;
        }
      },

      // إكمال الدخول بعد التحقق من OTP
      loginWithOtp: async (userId, otp) => {
        set({ isLoading: true });
        try {
          const { token, user } = await verifyLoginOtp(userId, otp);
          localStorage.setItem('token', token);
          set({ token, user: user as unknown as User, isAuthenticated: true, isLoading: false });
          await get().fetchProfile();
        } catch (err) {
          set({ isLoading: false });
          throw err;
        }
      },

      // تسجيل الدخول الاجتماعي (Google/Facebook)
      // لا نستدعي fetchProfile هنا - App.tsx useEffect سيفعل ذلك عند تغيير isAuthenticated
      loginSocial: async (userData, token) => {
        localStorage.setItem('token', token);
        set({ token, user: userData, isAuthenticated: true });
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
        // منع الاستدعاء المتزامن (race condition → ملفات مكررة)
        if (get().profileLoading) return;
        set({ profileLoading: true });
        try {
          const userId = localStorage.getItem('mock_user_id') ?? String(get().user?.id ?? '');
          if (!userId) { set({ profileLoading: false }); return; }
          // اضمن تخزين mock_user_id دائماً
          localStorage.setItem('mock_user_id', userId);
          const profile = await getProfile(userId);
          set({ profile: profile as unknown as Profile, profileLoading: false });
        } catch {
          set({ profileLoading: false });
        }
      },

      updateProfile: async (data) => {
        const current = get().profile;
        const currentUser = get().user;
        if (!current) return;

        // Separate user-level fields from profile-level fields
        const { first_name, last_name, ...profileData } = data as any;

        // Persist profile fields to JSON Server
        if (Object.keys(profileData).length > 0) {
          await axios.patch(`${DB}/profiles/${(current as any).id}`, profileData);
        }

        // Persist user name fields to JSON Server
        if ((first_name !== undefined || last_name !== undefined) && currentUser) {
          const userPatch: Record<string, string> = {};
          if (first_name !== undefined) userPatch.first_name = first_name;
          if (last_name !== undefined) userPatch.last_name = last_name;
          await axios.patch(`${DB}/users/${currentUser.id}`, userPatch);
        }

        // Update Zustand state
        set({
          profile: { ...current, ...profileData, user: { ...(current as any).user, first_name: first_name ?? (current as any).user?.first_name, last_name: last_name ?? (current as any).user?.last_name } },
          user: currentUser ? { ...currentUser, first_name: first_name ?? currentUser.first_name, last_name: last_name ?? currentUser.last_name } : currentUser,
        });
      },
      changeAccountType: async (isSeller: boolean) => {
        const userId = localStorage.getItem('mock_user_id');
        if (!userId) return;
        try {
          await updateUserSellerStatus(userId, isSeller);
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

