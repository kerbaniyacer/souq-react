import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Eye, EyeOff, Store } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useAuthStore } from '@souq/stores/authStore';
import { useToast } from '@souq/stores/toastStore';
import SocialAuthButtons from '@souq/components/common/SocialAuthButtons';
import { loginSchema, type LoginFormData } from '@souq/lib/schemas';

export default function Login() {
  const [showPass, setShowPass] = useState(false);

  const { login } = useAuthStore();
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
      await login(data.email, data.password);
      toast.success('تم تسجيل الدخول بنجاح! 👋');
      navigate(from, { replace: true });
    } catch (err: unknown) {
      toast.error((err as Error).message ?? 'البريد الإلكتروني أو كلمة المرور غير صحيحة');
    }
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
          <SocialAuthButtons mode="login" />

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 mt-5" noValidate>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 font-arabic mb-2">
                البريد الإلكتروني
              </label>
              <input
                {...register('email')}
                type="email"
                placeholder="example@email.com"
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
    </div>
  );
}
