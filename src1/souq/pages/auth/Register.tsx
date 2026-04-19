import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Eye, EyeOff, Store, User, ShoppingBag, ArrowLeft, ArrowRight, Phone
} from 'lucide-react';
import { useAuthStore } from '@souq/stores/authStore';
import { useToast } from '@souq/stores/toastStore';
import SocialAuthButtons from '@souq/components/common/SocialAuthButtons';
import AddressFields from '@souq/components/common/AddressFields';

type Step = 'type' | 'details';

interface FormData {
  username: string;
  email: string;
  password: string;
  password2: string;
  phone: string;
  wilaya: string;
  baladia: string;
  address: string;
  store_name: string;
  store_description: string;
  store_category: string;
}

const emptyForm: FormData = {
  username: '', email: '', password: '', password2: '',
  phone: '', wilaya: '', baladia: '', address: '',
  store_name: '', store_description: '', store_category: '',
};

export default function Register() {
  const [step, setStep] = useState<Step>('type');
  const [isSeller, setIsSeller] = useState<boolean | null>(null);
  const [form, setForm] = useState<FormData>(emptyForm);
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);

  const toast = useToast();
  const navigate = useNavigate();
  const { register } = useAuthStore();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setForm((p) => ({ ...p, [e.target.name]: e.target.value }));
  };

  const handleTypeSelect = (seller: boolean) => {
    setIsSeller(seller);
    setStep('details');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.password !== form.password2) { toast.error('كلمتا المرور غير متطابقتان'); return; }
    if (form.password.length < 8) { toast.error('كلمة المرور يجب أن تكون 8 أحرف على الأقل'); return; }
    if (!form.phone.trim()) { toast.error('رقم الهاتف مطلوب'); return; }
    if (!form.wilaya) { toast.error('يرجى اختيار الولاية'); return; }
    if (isSeller && !form.store_name.trim()) { toast.error('اسم المتجر مطلوب'); return; }

    setLoading(true);
    try {
      await register({
        username: form.username,
        email: form.email,
        password: form.password,
        is_seller: isSeller ?? false,
        phone: form.phone,
        wilaya: form.wilaya,
        baladia: form.baladia,
        address: form.address,
        store_name: form.store_name,
        store_description: form.store_description,
        store_category: form.store_category,
      });
      toast.success('🎉 تم إنشاء الحساب بنجاح! يمكنك تسجيل الدخول الآن');
      navigate('/login');
    } catch (err: unknown) {
      toast.error((err as Error).message ?? 'حدث خطأ، يرجى المحاولة مرة أخرى');
    } finally {
      setLoading(false);
    }
  };

  /* ══════════════════════════════════════════
     الخطوة 1 — اختيار نوع الحساب
  ══════════════════════════════════════════ */
  if (step === 'type') {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-[#0F0F0F] flex items-center justify-center px-4 py-10">
        <div className="w-full max-w-lg">

          {/* Logo */}
          <div className="text-center mb-10">
            <Link to="/" className="inline-flex items-center gap-2">
              <div className="w-12 h-12 bg-primary-400 rounded-2xl flex items-center justify-center shadow-lg shadow-primary-400/30">
                <Store className="w-6 h-6 text-white" />
              </div>
              <span className="text-2xl font-bold text-primary-400 font-arabic">سوق</span>
            </Link>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 font-arabic mt-6 mb-2">
              مرحباً بك في سوق!
            </h1>
            <p className="text-gray-500 dark:text-gray-400 font-arabic text-lg">كيف تريد استخدام المنصة؟</p>
          </div>

          {/* بطاقتا الاختيار */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-8">
            {/* مشتري */}
            <button
              onClick={() => handleTypeSelect(false)}
              className="group relative flex flex-col items-center gap-4 p-8 bg-white dark:bg-[#1E1E1E] rounded-3xl border-2 border-gray-200 dark:border-[#2E2E2E] hover:border-blue-400 hover:shadow-xl hover:shadow-blue-100 dark:hover:shadow-blue-900/20 transition-all duration-300 text-center"
            >
              <div className="w-20 h-20 bg-blue-100 group-hover:bg-blue-500 rounded-2xl flex items-center justify-center transition-colors duration-300">
                <ShoppingBag className="w-10 h-10 text-blue-500 group-hover:text-white transition-colors duration-300" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 font-arabic mb-2">مشتري</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400 font-arabic leading-relaxed">
                  أتسوق وأشتري منتجات من أفضل التجار في الجزائر
                </p>
              </div>
              <div className="flex items-center gap-1.5 text-blue-600 font-arabic text-sm font-medium">
                اختر <ArrowLeft className="w-4 h-4" />
              </div>
            </button>

            {/* تاجر */}
            <button
              onClick={() => handleTypeSelect(true)}
              className="group relative flex flex-col items-center gap-4 p-8 bg-white dark:bg-[#1E1E1E] rounded-3xl border-2 border-gray-200 dark:border-[#2E2E2E] hover:border-primary-400 hover:shadow-xl hover:shadow-primary-100 dark:hover:shadow-primary-900/20 transition-all duration-300 text-center"
            >
              <div className="w-20 h-20 bg-primary-100 group-hover:bg-primary-400 rounded-2xl flex items-center justify-center transition-colors duration-300">
                <Store className="w-10 h-10 text-primary-500 group-hover:text-white transition-colors duration-300" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 font-arabic mb-2">تاجر</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400 font-arabic leading-relaxed">
                  أبيع منتجاتي وأوصلها إلى آلاف الزبائن
                </p>
              </div>
              <div className="flex items-center gap-1.5 text-primary-600 font-arabic text-sm font-medium">
                اختر <ArrowLeft className="w-4 h-4" />
              </div>
            </button>
          </div>

          <p className="text-center text-sm text-gray-500 dark:text-gray-400 font-arabic">
            لديك حساب بالفعل؟{' '}
            <Link to="/login" className="text-primary-600 font-semibold hover:underline">
              تسجيل الدخول
            </Link>
          </p>
        </div>
      </div>
    );
  }

  /* ══════════════════════════════════════════
     الخطوة 2 — تعبئة البيانات
  ══════════════════════════════════════════ */
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0F0F0F] flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-lg">

        {/* Header */}
        <div className="text-center mb-6">
          <Link to="/" className="inline-flex items-center gap-2">
            <div className="w-10 h-10 bg-primary-400 rounded-xl flex items-center justify-center">
              <Store className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-primary-400 font-arabic">سوق</span>
          </Link>

          {/* مؤشر النوع المختار */}
          <div className="flex items-center justify-center gap-3 mt-4">
            <button
              onClick={() => setStep('type')}
              className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 dark:bg-[#252525] hover:bg-gray-200 dark:hover:bg-[#2E2E2E] rounded-lg transition-colors"
            >
              <ArrowRight className="w-4 h-4 text-gray-500 dark:text-gray-400" />
              <span className="text-xs text-gray-500 dark:text-gray-400 font-arabic">تغيير النوع</span>
            </button>
            <div className={`flex items-center gap-2 px-4 py-1.5 rounded-xl text-sm font-arabic font-medium ${
              isSeller ? 'bg-primary-100 text-primary-700' : 'bg-blue-100 text-blue-700'
            }`}>
              {isSeller ? <Store className="w-4 h-4" /> : <ShoppingBag className="w-4 h-4" />}
              {isSeller ? 'حساب تاجر' : 'حساب مشتري'}
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-[#1E1E1E] rounded-3xl shadow-2xl shadow-black/10 dark:shadow-black/50 border border-gray-100 dark:border-[#2E2E2E] p-7">
          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 font-arabic mb-1">
            {isSeller ? '🏪 بيانات التاجر' : '👤 بياناتك الشخصية'}
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 font-arabic mb-6">
            {isSeller ? 'أكمل بيانات حسابك ومتجرك' : 'أكمل بياناتك للبدء في التسوق'}
          </p>

          {/* أزرار التسجيل الاجتماعي */}
          <SocialAuthButtons mode="register" />

          <form onSubmit={handleSubmit} className="space-y-4 mt-5">

            {/* ─── معلومات الحساب ─── */}
            <div className="bg-gray-50 dark:bg-[#1A1A1A] rounded-2xl p-4 space-y-4">
              <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 font-arabic uppercase tracking-wider">معلومات الحساب</p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 font-arabic mb-1.5">
                    اسم المستخدم *
                  </label>
                  <div className="relative">
                    <User className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      name="username" value={form.username} onChange={handleChange} required
                      placeholder="username"
                      className="w-full pr-9 pl-4 py-2.5 rounded-xl border border-gray-200 dark:border-[#2E2E2E] bg-white dark:bg-[#1E1E1E] text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-400/30 font-arabic text-sm"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 font-arabic mb-1.5">
                    رقم الهاتف *
                  </label>
                  <div className="relative">
                    <Phone className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      name="phone" value={form.phone} onChange={handleChange} required
                      type="tel" placeholder="05XXXXXXXX"
                      className="w-full pr-9 pl-4 py-2.5 rounded-xl border border-gray-200 dark:border-[#2E2E2E] bg-white dark:bg-[#1E1E1E] text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-400/30 font-arabic text-sm"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 font-arabic mb-1.5">
                  البريد الإلكتروني *
                </label>
                <input
                  name="email" type="email" value={form.email} onChange={handleChange} required
                  placeholder="example@email.com"
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-[#2E2E2E] bg-white dark:bg-[#1E1E1E] text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-400/30 text-sm"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 font-arabic mb-1.5">
                    كلمة المرور *
                  </label>
                  <div className="relative">
                    <input
                      name="password" type={showPass ? 'text' : 'password'}
                      value={form.password} onChange={handleChange} required minLength={8}
                      placeholder="8 أحرف على الأقل"
                      className="w-full px-4 py-2.5 pl-10 rounded-xl border border-gray-200 dark:border-[#2E2E2E] bg-white dark:bg-[#1E1E1E] text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-400/30 font-arabic text-sm"
                    />
                    <button type="button" onClick={() => setShowPass(!showPass)}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                      {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 font-arabic mb-1.5">
                    تأكيد كلمة المرور *
                  </label>
                  <input
                    name="password2" type="password"
                    value={form.password2} onChange={handleChange} required
                    placeholder="أعد الإدخال"
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-[#2E2E2E] bg-white dark:bg-[#1E1E1E] text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-400/30 font-arabic text-sm"
                  />
                </div>
              </div>
            </div>

            {/* ─── بيانات الموقع ─── */}
            <div className="bg-gray-50 dark:bg-[#1A1A1A] rounded-2xl p-4 space-y-3">
              <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 font-arabic uppercase tracking-wider">معلومات الموقع</p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <AddressFields
                  wilaya={form.wilaya}
                  baladia={form.baladia}
                  postal_code={(form as any).postal_code ?? ''}
                  onChange={(field, value) => setForm((p) => ({ ...p, [field]: value }))}
                  required
                  className="col-span-2"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 font-arabic mb-1.5">
                  العنوان التفصيلي
                </label>
                <input
                  name="address" value={form.address} onChange={handleChange}
                  placeholder="الشارع، الحي، الرقم..."
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-[#2E2E2E] bg-white dark:bg-[#1E1E1E] text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-400/30 font-arabic text-sm"
                />
              </div>
            </div>

            {/* ─── معلومات المتجر (للتاجر فقط) ─── */}
            {isSeller && (
              <div className="bg-primary-50 dark:bg-primary-900/10 rounded-2xl p-4 space-y-3 border border-primary-200 dark:border-primary-800/40">
                <p className="text-xs font-semibold text-primary-600 dark:text-primary-400 font-arabic uppercase tracking-wider">
                  🏪 معلومات المتجر
                </p>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 font-arabic mb-1.5">
                    اسم المتجر *
                  </label>
                  <input
                    name="store_name" value={form.store_name} onChange={handleChange}
                    required={isSeller} placeholder="مثال: متجر سامي للإلكترونيات"
                    className="w-full px-4 py-2.5 rounded-xl border border-primary-200 dark:border-primary-800/40 bg-white dark:bg-[#1E1E1E] text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-400/30 font-arabic text-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 font-arabic mb-1.5">
                    فئة المتجر
                  </label>
                  <input
                    name="store_category" value={form.store_category} onChange={handleChange}
                    placeholder="مثال: إلكترونيات، ملابس، أغذية..."
                    className="w-full px-4 py-2.5 rounded-xl border border-primary-200 dark:border-primary-800/40 bg-white dark:bg-[#1E1E1E] text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-400/30 font-arabic text-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 font-arabic mb-1.5">
                    وصف المتجر
                  </label>
                  <textarea
                    name="store_description" value={form.store_description} onChange={handleChange}
                    rows={3} placeholder="اكتب وصفاً مختصراً لمتجرك..."
                    className="w-full px-4 py-2.5 rounded-xl border border-primary-200 dark:border-primary-800/40 bg-white dark:bg-[#1E1E1E] text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-400/30 font-arabic text-sm resize-none"
                  />
                </div>
              </div>
            )}

            <p className="text-xs text-gray-400 dark:text-gray-500 font-arabic text-center">
              بالتسجيل فأنت توافق على{' '}
              <span className="text-primary-600 cursor-pointer hover:underline">شروط الاستخدام</span>
              {' '}و{' '}
              <span className="text-primary-600 cursor-pointer hover:underline">سياسة الخصوصية</span>
            </p>

            <button
              type="submit" disabled={loading}
              className={`w-full py-3.5 font-bold rounded-xl transition-colors font-arabic disabled:opacity-60 flex items-center justify-center gap-2 shadow-md ${
                isSeller
                  ? 'bg-primary-400 hover:bg-primary-500 text-white shadow-primary-400/20'
                  : 'bg-blue-500 hover:bg-blue-600 text-white shadow-blue-400/20'
              }`}
            >
              {loading ? (
                <><span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> جاري إنشاء الحساب...</>
              ) : (
                <>
                  {isSeller ? <Store className="w-5 h-5" /> : <User className="w-5 h-5" />}
                  إنشاء حساب {isSeller ? 'تاجر' : 'مشتري'}
                </>
              )}
            </button>
          </form>

          <div className="mt-5 text-center">
            <p className="text-sm text-gray-500 dark:text-gray-400 font-arabic">
              لديك حساب بالفعل؟{' '}
              <Link to="/login" className="text-primary-600 font-semibold hover:underline">
                تسجيل الدخول
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
