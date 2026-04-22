import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Eye, EyeOff, Store } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useAuthStore } from '@features/auth/stores/authStore';
import { useToast } from '@shared/stores/toastStore';
import SocialAuthButtons from '@shared/components/common/SocialAuthButtons';
import OtpModal from '@shared/components/common/OtpModal';
import { verifyIpOtpDjango, saveTokens } from '@features/auth/services/authService';
import { loginSchema, type LoginFormData } from '@shared/lib/schemas';
import type { User } from '@shared/types';
import SuspensionModal from '@features/auth/components/SuspensionModal';
import { getErrorMessage } from '@shared/lib/api-errors';

export default function Login() {
  const [showPass, setShowPass] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [otpModalData, setOtpModalData] = useState<{ isOpen: boolean; email: string }>({ isOpen: false, email: '' });
  const [suspensionData, setSuspensionData] = useState<{ isOpen: boolean; userId: number }>({ isOpen: false, userId: 0 });

  const { login, loginSocial } = useAuthStore();
  const toast = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: string })?.from ?? '/';

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormData) => {
    try {
      await login(data.email, data.password, rememberMe);
      toast.success('تم تسجيل الدخول بنجاح! 👋');
      navigate(from, { replace: true });
    } catch (err: any) {
      if (err?.type === 'ONBOARDING_REQUIRED') {
        toast.info('يرجى إكمال ملفك الشخصي أولاً.');
        navigate('/complete-profile', { replace: true });
        return;
      }
      if (err?.type === 'VERIFICATION_REQUIRED') {
        setOtpModalData({ isOpen: true, email: err.email });
        return;
      }
      if (err?.type === 'ACCOUNT_SUSPENDED') {
        navigate(`/account-suspended?email=${encodeURIComponent(err.email)}&reason=${encodeURIComponent(err.reason)}`);
        return;
      }
      
      console.error('Login failed with error:', err);
      toast.error(getErrorMessage(err));
    }
  };

  const handleVerifyOtp = async (otp: string) => {
    const tokens = await verifyIpOtpDjango(otpModalData.email, otp, rememberMe);
    saveTokens(tokens);
    await loginSocial(tokens.user as unknown as User, tokens.access, tokens.refresh);
    setOtpModalData({ isOpen: false, email: '' });
    toast.success('تم التحقق وتسجيل الدخول بنجاح!');
    navigate(from, { replace: true });
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0F0F0F] flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2">
            <div className="w-12 h-12 bg-primary-400 rounded-2xl flex items-center justify-center shadow-lg shadow-primary-400/30">
              <Store className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-bold text-primary-400 font-arabic">سوق</span>
          </Link>
        </div>

        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 font-arabic text-center mb-2">مرحباً بعودتك 👋</h1>
        <p className="text-gray-500 dark:text-gray-400 font-arabic text-center mb-8">سجّل دخولك للمتابعة</p>

        <div className="bg-white dark:bg-[#1A1A1A] rounded-3xl shadow-xl border border-gray-100 dark:border-[#2E2E2E] p-8">
          <SocialAuthButtons 
            mode="login" 
            onVerificationRequired={(email) => setOtpModalData({ isOpen: true, email })} 
            rememberMe={rememberMe}
          />

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 mt-5" noValidate>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 font-arabic mb-2">
                البريد الإلكتروني أو اسم المستخدم
              </label>
              <input
                {...register('email')}
                type="text"
                placeholder="example@email.com أو username"
                className={`w-full px-4 py-3 rounded-xl border bg-gray-50 dark:bg-[#1E1E1E] text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-400/30 focus:border-primary-400 font-arabic transition-all ${
                  errors.email ? 'border-red-400 dark:border-red-500' : 'border-gray-200 dark:border-[#2E2E2E]'
                }`}
                autoComplete="email"
              />
              {errors.email && (
                <p className="mt-1.5 text-xs text-red-500 font-arabic">{errors.email.message}</p>
              )}
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 font-arabic">كلمة المرور</label>
                <Link to="/forgot-password" className="text-xs text-primary-600 hover:underline font-arabic">
                  نسيت كلمة المرور؟
                </Link>
              </div>
              <div className="relative">
                <input
                  {...register('password')}
                  type={showPass ? 'text' : 'password'}
                  placeholder="أدخل كلمة المرور"
                  className={`w-full px-4 py-3 pl-11 rounded-xl border bg-gray-50 dark:bg-[#1E1E1E] text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-400/30 focus:border-primary-400 font-arabic transition-all ${
                    errors.password ? 'border-red-400 dark:border-red-500' : 'border-gray-200 dark:border-[#2E2E2E]'
                  }`}
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                >
                  {showPass ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {errors.password && (
                <p className="mt-1.5 text-xs text-red-500 font-arabic">{errors.password.message}</p>
              )}
            </div>

            {/* Remember Me row */}
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2.5 cursor-pointer group" htmlFor="remember-me">
                <div
                  onClick={() => setRememberMe(v => !v)}
                  className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all cursor-pointer ${
                    rememberMe
                      ? 'bg-primary-400 border-primary-400'
                      : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-[#1E1E1E] group-hover:border-primary-300'
                  }`}
                >
                  {rememberMe && (
                    <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </div>
                <input
                  type="checkbox"
                  id="remember-me"
                  checked={rememberMe}
                  onChange={e => setRememberMe(e.target.checked)}
                  className="sr-only"
                />
                <span className="text-sm text-gray-600 dark:text-gray-400 font-arabic select-none">تذكرني</span>
              </label>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3.5 bg-primary-400 text-white font-bold rounded-xl hover:bg-primary-500 transition-colors font-arabic disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-md shadow-primary-400/20"
            >
              {isSubmitting
                ? <><span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> جاري الدخول...</>
                : 'تسجيل الدخول'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-500 dark:text-gray-400 font-arabic">
              ليس لديك حساب؟{' '}
              <Link to="/register" className="text-primary-600 font-semibold hover:underline">
                سجّل الآن مجاناً
              </Link>
            </p>
          </div>
        </div>
      </div>
      <OtpModal 
        isOpen={otpModalData.isOpen} 
        email={otpModalData.email} 
        onVerify={handleVerifyOtp} 
        onCancel={() => setOtpModalData({ isOpen: false, email: '' })} 
      />
      <SuspensionModal 
        isOpen={suspensionData.isOpen}
        userId={suspensionData.userId}
        onClose={() => setSuspensionData({ isOpen: false, userId: 0 })}
      />
    </div>
  );
}
