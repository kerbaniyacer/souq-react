import { useState } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { Eye, EyeOff, User, Phone } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useAuthStore } from '@features/auth/stores/authStore';
import { useToast } from '@shared/stores/toastStore';
import SocialAuthButtons from '@shared/components/common/SocialAuthButtons';
import AddressFields from '@shared/components/common/AddressFields';
import { registerSchema } from '@shared/lib/schemas';
import { z } from 'zod';

type RegisterFormData = z.infer<typeof registerSchema>;

interface RegisterFormProps {
  onToggleMode: () => void;
}

export default function RegisterForm({ onToggleMode }: RegisterFormProps) {
  const location = useLocation();
  const socialData = location.state as {
    email?: string;
    prefill?: { email?: string; full_name?: string; phone?: string };
  } | null;

  const [showPass, setShowPass] = useState(false);
  const toast = useToast();
  const { register: registerUser } = useAuthStore();

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema) as never,
    defaultValues: {
      username: socialData?.prefill?.full_name?.split(' ')[0]?.toLowerCase() ?? '',
      email: socialData?.email ?? socialData?.prefill?.email ?? '',
      password: '',
      password2: '',
      phone: socialData?.prefill?.phone ?? '',
      wilaya: '',
      baladia: '',
      address: '',
      acceptTerms: false,
    },
  });

  const wilayaValue = watch('wilaya');
  const baladiaValue = watch('baladia');

  const onSubmit = async (data: RegisterFormData) => {
    try {
      await registerUser({
        username: data.username,
        email: data.email,
        password: data.password,
        password2: data.password2,
        phone: data.phone,
        wilaya: data.wilaya,
        baladia: data.baladia ?? '',
        address: data.address ?? '',
      });
      toast.success('🎉 تم إنشاء الحساب! يرجى مراجعة بريدك الإلكتروني لتفعيل الحساب.');
      onToggleMode();
    } catch (err: unknown) {
      toast.error((err as Error).message ?? 'حدث خطأ، يرجى المحاولة مرة أخرى');
    }
  };

  const inputClass = (hasError: boolean) =>
    `w-full px-4 py-2.5 rounded-xl border bg-white dark:bg-[#1E1E1E] text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-400/30 font-arabic text-sm transition-all ${
      hasError ? 'border-red-400 dark:border-red-500' : 'border-gray-200 dark:border-[#2E2E2E]'
    }`;

  const FieldError = ({ msg }: { msg?: string }) =>
    msg ? <p className="mt-1 text-xs text-red-500 font-arabic">{msg}</p> : null;

  return (
    <div className="w-full max-w-lg mx-auto">
      <div className="text-center mb-6 mt-4">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 font-arabic mb-1">إنشاء حساب جديد</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 font-arabic">
          انضم إلى سوق — تسوّق وأضف متاجرك بكل حرية
        </p>
      </div>

      <div className="bg-white dark:bg-[#1E1E1E] rounded-3xl shadow-2xl shadow-black/10 dark:shadow-black/50 border border-gray-100 dark:border-[#2E2E2E] p-7">
        <SocialAuthButtons mode="register" />

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-5" noValidate>

          {/* ─── معلومات الحساب ─── */}
          <div className="bg-gray-50 dark:bg-[#1A1A1A] rounded-2xl p-4 space-y-4">
            <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 font-arabic uppercase tracking-wider">معلومات الحساب</p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 font-arabic mb-1.5">اسم المستخدم *</label>
                <div className="relative">
                  <User className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    {...register('username')}
                    placeholder="username"
                    className={`w-full pr-9 pl-4 py-2.5 rounded-xl border bg-white dark:bg-[#1E1E1E] text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-400/30 text-sm transition-all ${
                      errors.username ? 'border-red-400' : 'border-gray-200 dark:border-[#2E2E2E]'
                    }`}
                  />
                </div>
                <FieldError msg={errors.username?.message} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 font-arabic mb-1.5">رقم الهاتف *</label>
                <div className="relative">
                  <Phone className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    {...register('phone')}
                    type="tel"
                    placeholder="05XXXXXXXX"
                    className={`w-full pr-9 pl-4 py-2.5 rounded-xl border bg-white dark:bg-[#1E1E1E] text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-400/30 text-sm transition-all ${
                      errors.phone ? 'border-red-400' : 'border-gray-200 dark:border-[#2E2E2E]'
                    }`}
                  />
                </div>
                <FieldError msg={errors.phone?.message} />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 font-arabic mb-1.5">البريد الإلكتروني *</label>
              <input
                {...register('email')}
                type="email"
                placeholder="example@email.com"
                className={inputClass(Boolean(errors.email))}
              />
              <FieldError msg={errors.email?.message} />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 font-arabic mb-1.5">كلمة المرور *</label>
                <div className="relative">
                  <input
                    {...register('password')}
                    type={showPass ? 'text' : 'password'}
                    placeholder="8 أحرف على الأقل"
                    className={`w-full px-4 py-2.5 pl-10 rounded-xl border bg-white dark:bg-[#1E1E1E] text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-400/30 text-sm transition-all ${
                      errors.password ? 'border-red-400' : 'border-gray-200 dark:border-[#2E2E2E]'
                    }`}
                  />
                  <button type="button" onClick={() => setShowPass(!showPass)}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                    {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <FieldError msg={errors.password?.message} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 font-arabic mb-1.5">تأكيد كلمة المرور *</label>
                <input
                  {...register('password2')}
                  type="password"
                  placeholder="أعد الإدخال"
                  className={inputClass(Boolean(errors.password2))}
                />
                <FieldError msg={errors.password2?.message} />
              </div>
            </div>
          </div>

          {/* ─── بيانات الموقع ─── */}
          <div className="bg-gray-50 dark:bg-[#1A1A1A] rounded-2xl p-4 space-y-3">
            <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 font-arabic uppercase tracking-wider">معلومات الموقع</p>
            <AddressFields
              wilaya={wilayaValue}
              baladia={baladiaValue ?? ''}
              onChange={(field, value) => setValue(field as 'wilaya' | 'baladia', value)}
              required
              className="col-span-2"
            />
            {errors.wilaya && <FieldError msg={errors.wilaya.message} />}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 font-arabic mb-1.5">العنوان التفصيلي</label>
              <input
                {...register('address')}
                placeholder="الشارع، الحي، الرقم..."
                className={inputClass(Boolean(errors.address))}
              />
            </div>
          </div>

          {/* ─── الموافقة على الشروط ─── */}
          <div className={`flex items-start gap-3 p-4 rounded-2xl border transition-colors ${
            errors.acceptTerms
              ? 'bg-red-50 dark:bg-red-900/10 border-red-300 dark:border-red-700'
              : 'bg-gray-50 dark:bg-[#1A1A1A] border-gray-200 dark:border-[#2E2E2E]'
          }`}>
            <div className="relative flex-shrink-0 mt-0.5">
              <input type="checkbox" id="acceptTerms" {...register('acceptTerms')} className="sr-only peer" />
              <label
                htmlFor="acceptTerms"
                className="w-5 h-5 rounded-md border-2 flex items-center justify-center cursor-pointer transition-all border-gray-300 dark:border-gray-600 peer-checked:bg-primary-500 peer-checked:border-primary-500 hover:border-primary-400"
              />
              <label htmlFor="acceptTerms" className="absolute inset-0 flex items-center justify-center cursor-pointer">
                <svg
                  className={`w-3 h-3 text-white transition-opacity ${watch('acceptTerms') ? 'opacity-100' : 'opacity-0'}`}
                  fill="none" viewBox="0 0 12 12"
                >
                  <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </label>
            </div>
            <label htmlFor="acceptTerms" className="text-sm text-gray-700 dark:text-gray-300 font-arabic leading-relaxed cursor-pointer select-none">
              أوافق على{' '}
              <Link to="/terms-of-service" target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()} className="text-primary-600 dark:text-primary-400 font-semibold hover:underline">شروط الاستخدام</Link>
              {' '}و{' '}
              <Link to="/privacy-policy" target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()} className="text-primary-600 dark:text-primary-400 font-semibold hover:underline">سياسة الخصوصية</Link>
            </label>
          </div>
          {errors.acceptTerms && (
            <p className="text-xs text-red-500 font-arabic flex items-center gap-1 -mt-2 pr-1">
              <span>⚠</span> {errors.acceptTerms.message}
            </p>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3.5 font-bold rounded-xl bg-primary-500 hover:bg-primary-600 text-white font-arabic disabled:opacity-60 flex items-center justify-center gap-2 shadow-md shadow-primary-400/20 transition-colors"
          >
            {isSubmitting
              ? <><span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> جاري إنشاء الحساب...</>
              : 'إنشاء حساب جديد'
            }
          </button>
        </form>

        <div className="mt-5 text-center">
          <p className="text-sm text-gray-500 dark:text-gray-400 font-arabic">
            لديك حساب بالفعل؟{' '}
            <button type="button" onClick={onToggleMode} className="text-primary-600 font-semibold hover:underline">
              تسجيل الدخول
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
