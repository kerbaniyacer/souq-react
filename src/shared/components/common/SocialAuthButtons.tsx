import { useState } from 'react';
import { useGoogleLogin } from '@react-oauth/google';
import { useFacebookSDK } from '@shared/hooks/useFacebookSDK';
import { useAuthStore } from '@features/auth/stores/authStore';
import { useToast } from '@shared/stores/toastStore';
import { saveTokens, loginSocialDjango } from '@features/auth/services/authService';
import type { User } from '@shared/types';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { env } from '@shared/lib/env';


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
  onVerificationRequired?: (email: string) => void;
}

export default function SocialAuthButtons({ mode, onVerificationRequired }: Props) {
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
      let googleUser: any;
      let payload: any;
      try {
        // جلب بيانات المستخدم من Google API
        const userInfoRes = await axios.get(
          'https://www.googleapis.com/oauth2/v3/userinfo',
          { headers: { Authorization: `Bearer ${tokenResponse.access_token}` } }
        );
        googleUser = userInfoRes.data;

        // تسجيل الدخول في الواجهة الحقيقية لـ Django
        payload = {
          provider: 'google' as const,
          provider_id: googleUser.sub,
          email: googleUser.email,
          first_name: googleUser.given_name || googleUser.name?.split(' ')[0] || '',
          last_name: googleUser.family_name || googleUser.name?.split(' ').slice(1).join(' ') || '',
          photo: googleUser.picture
        };
        const tokens = await loginSocialDjango(payload);
        const isOnboarded = tokens.user?.is_onboarded ?? true;

        if (!isOnboarded) {
          // Store tokens temporarily — user remains a guest until profile is complete
          sessionStorage.setItem('pending_auth', JSON.stringify({
            access: tokens.access,
            refresh: tokens.refresh,
            user: tokens.user,
          }));
          toast.info('يرجى إكمال ملفك الشخصي أولاً 👋');
          navigate('/complete-profile');
          return;
        }

        // Save tokens and update store (user is fully onboarded)
        saveTokens(tokens);
        await loginSocial(tokens.user as unknown as User, tokens.access, tokens.refresh);
        toast.success(`مرحباً ${payload.first_name || googleUser.name}! 👋`);
        navigate('/');
      } catch (err: any) {
        // Handle suspension explicitly for social login
        const data = err?.response?.data;
        if (err?.response?.status === 403 && data?.code === 'ACCOUNT_SUSPENDED') {
          const email = data.email || payload?.email || googleUser?.email || '';
          const reason = data.reason || 'مخالفة شروط الاستخدام';
          navigate(`/account-suspended?email=${encodeURIComponent(email)}&reason=${encodeURIComponent(reason)}`);
          return;
        }

        if (err?.type === 'VERIFICATION_REQUIRED' && onVerificationRequired) {
          onVerificationRequired(err.email);
          return;
        }
        if (err?.type === 'USER_NOT_REGISTERED') {
          toast.error('تعذر إنشاء الحساب الاجتماعي تلقائياً.');
          return;
        }
        console.error(err);
        toast.error('أثناء تسجيل الدخول: ' + (data?.detail || err.message || 'حدث خطأ مجهول'));
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
    const clientId = env.googleClientId;
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
    const appId = env.facebookAppId;
    if (!appId || appId.startsWith('your-')) {
      toast.error('يرجى إعداد VITE_FACEBOOK_APP_ID في ملف .env');
      return;
    }
    if (!isSdkLoaded) {
      toast.warning('Facebook SDK لا يزال يُحمَّل، انتظر لحظة وحاول مجدداً');
      return;
    }
    setFbLoading(true);
    let payload: any;
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

      payload = {
        provider: 'facebook' as const,
        provider_id: userID,
        email: email,
        first_name: name.split(' ')[0] || '',
        last_name: name.split(' ').slice(1).join(' ') || '',
        photo: picture
      };
      
      const tokens = await loginSocialDjango(payload);
      const isOnboarded = tokens.user?.is_onboarded ?? true;

      if (!isOnboarded) {
        sessionStorage.setItem('pending_auth', JSON.stringify({
          access: tokens.access,
          refresh: tokens.refresh,
          user: tokens.user,
        }));
        toast.info('يرجى إكمال ملفك الشخصي أولاً!');
        navigate('/complete-profile');
        return;
      }

      saveTokens(tokens);
      await loginSocial(tokens.user as unknown as User, tokens.access, tokens.refresh);
      toast.success(`مرحباً ${payload.first_name}! 👋`);
      navigate('/');
    } catch (err: any) {
      // Handle suspension explicitly for social login
      const data = err?.response?.data;
      if (err?.response?.status === 403 && data?.code === 'ACCOUNT_SUSPENDED') {
        const email = data.email || payload?.email || '';
        const reason = data.reason || 'مخالفة شروط الاستخدام';
        navigate(`/account-suspended?email=${encodeURIComponent(email)}&reason=${encodeURIComponent(reason)}`);
        return;
      }

      if (err?.type === 'VERIFICATION_REQUIRED' && onVerificationRequired) {
        onVerificationRequired(err.email);
        return;
      }
      if (err?.type === 'USER_NOT_REGISTERED') {
        toast.error('تعذر إنشاء الحساب الاجتماعي تلقائياً.');
        return;
      }
      const msg = data?.detail || err.message || '';
      if (msg.includes('إلغاء')) {
        toast.info('تم إلغاء تسجيل الدخول');
      } else {
        toast.error('تعذّر تسجيل الدخول بـ Facebook: ' + msg);
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
