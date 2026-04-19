import { useState } from 'react';
import { useGoogleLogin } from '@react-oauth/google';
import { useFacebookSDK } from '@souq/hooks/useFacebookSDK';
import { useAuthStore } from '@souq/stores/authStore';
import { useToast } from '@souq/stores/toastStore';
import { loginWithGoogle, loginWithFacebook } from '@souq/services/mockAuth';
import type { User } from '@souq/types';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

/* ───── أيقونة Google ───── */
function GoogleIcon({ spinning }: { spinning?: boolean }) {
  if (spinning) return <span className="w-5 h-5 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin inline-block" />;
  return (
    <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
    </svg>
  );
}

/* ───── أيقونة Facebook ───── */
function FacebookIcon({ spinning }: { spinning?: boolean }) {
  if (spinning) return <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin inline-block" />;
  return (
    <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24" fill="white">
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
    </svg>
  );
}

interface Props {
  mode: 'login' | 'register';
}

export default function SocialAuthButtons({ mode }: Props) {
  const [googleLoading, setGoogleLoading] = useState(false);
  const [fbLoading, setFbLoading] = useState(false);

  const { loginSocial } = useAuthStore();
  const { isSdkLoaded, login: fbLogin } = useFacebookSDK();
  const toast = useToast();
  const navigate = useNavigate();

  const label = mode === 'login' ? 'دخول' : 'تسجيل';

  /* ──────────────────────────────────────────
     Google
  ────────────────────────────────────────── */
  const loginGoogle = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      try {
        // جلب بيانات المستخدم من Google API
        const userInfoRes = await axios.get(
          'https://www.googleapis.com/oauth2/v3/userinfo',
          { headers: { Authorization: `Bearer ${tokenResponse.access_token}` } }
        );
        const googleUser = userInfoRes.data;

        // تسجيل/دخول في قاعدة البيانات المحلية
        const { token, user, isNewUser } = await loginWithGoogle(googleUser);
        await loginSocial(user as unknown as User, token);

        toast.success(`مرحباً ${googleUser.given_name || googleUser.name}! 👋`);
        navigate(isNewUser ? '/complete-profile' : '/');
      } catch (err) {
        console.error(err);
        toast.error('تعذّر الاتصال — تأكد أن JSON Server يعمل على المنفذ 3001');
      } finally {
        setGoogleLoading(false);
      }
    },
    onError: (err) => {
      console.error('Google error:', err);
      toast.error('تم إلغاء تسجيل الدخول بـ Google');
      setGoogleLoading(false);
    },
  });

  const handleGoogleClick = () => {
    const clientId = (import.meta.env.VITE_GOOGLE_CLIENT_ID as string) || '';
    if (!clientId || clientId.startsWith('your-') || !clientId.includes('.apps.googleusercontent.com')) {
      toast.error('الـ Client ID لـ Google غير صحيح — يجب أن ينتهي بـ .apps.googleusercontent.com');
      return;
    }
    setGoogleLoading(true);
    loginGoogle();
  };

  /* ──────────────────────────────────────────
     Facebook
  ────────────────────────────────────────── */
  const handleFacebookClick = async () => {
    const appId = (import.meta.env.VITE_FACEBOOK_APP_ID as string) || '';
    if (!appId || appId.startsWith('your-')) {
      toast.error('يرجى إعداد NEXT_PUBLIC_FACEBOOK_APP_ID في ملف .env');
      return;
    }
    if (!isSdkLoaded) {
      toast.warning('Facebook SDK لا يزال يُحمَّل، انتظر لحظة وحاول مجدداً');
      return;
    }
    setFbLoading(true);
    try {
      const { accessToken, userID, name, email } = await fbLogin();

      // جلب صورة الملف الشخصي
      let picture: string | undefined;
      try {
        const picRes = await axios.get(
          `https://graph.facebook.com/${userID}/picture?type=large&redirect=false&access_token=${accessToken}`
        );
        picture = picRes.data?.data?.url;
      } catch { /* اختياري */ }

      const { token, user, isNewUser } = await loginWithFacebook({ id: userID, name, email, picture });
      await loginSocial(user as unknown as User, token);

      toast.success(`مرحباً ${name.split(' ')[0]}! 👋`);
      navigate(isNewUser ? '/complete-profile' : '/');
    } catch (err: unknown) {
      const msg = (err as Error).message;
      if (msg?.includes('إلغاء')) {
        toast.info('تم إلغاء تسجيل الدخول');
      } else {
        toast.error('تعذّر تسجيل الدخول بـ Facebook');
        console.error(err);
      }
    } finally {
      setFbLoading(false);
    }
  };

  return (
    <div className="space-y-3">
      {/* Divider */}
      <div className="flex items-center gap-3">
        <div className="flex-1 h-px bg-gray-200" />
        <span className="text-xs text-gray-400 font-arabic whitespace-nowrap px-1">
          أو {label} عبر
        </span>
        <div className="flex-1 h-px bg-gray-200" />
      </div>

      {/* Google */}
      <button
        type="button"
        onClick={handleGoogleClick}
        disabled={googleLoading || fbLoading}
        className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-white border-2 border-gray-200 rounded-xl hover:border-gray-300 hover:bg-gray-50 active:scale-[0.98] transition-all font-arabic text-sm font-medium text-gray-700 disabled:opacity-60 disabled:cursor-not-allowed shadow-sm"
      >
        <GoogleIcon spinning={googleLoading} />
        <span>{googleLoading ? 'جاري التحقق...' : `${label} بـ Google`}</span>
      </button>

      {/* Facebook */}
      <button
        type="button"
        onClick={handleFacebookClick}
        disabled={fbLoading || googleLoading}
        className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-[#1877F2] text-white rounded-xl hover:bg-[#1565D8] active:scale-[0.98] transition-all font-arabic text-sm font-medium disabled:opacity-60 disabled:cursor-not-allowed shadow-sm"
      >
        <FacebookIcon spinning={fbLoading} />
        <span>{fbLoading ? 'جاري التحقق...' : `${label} بـ Facebook`}</span>
      </button>
    </div>
  );
}
