import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Store, ShoppingBag, User, Phone, ArrowLeft, Save } from 'lucide-react';
import { useAuthStore } from '@souq/stores/authStore';
import { useToast } from '@souq/stores/toastStore';
import AddressFields from '@souq/components/common/AddressFields';
import axios from 'axios';

const DB = '/db';

type Step = 'type' | 'details';

export default function CompleteProfile() {
  const { profile, user, fetchProfile } = useAuthStore();
  const toast = useToast();
  const navigate = useNavigate();

  const [step, setStep] = useState<Step>('type');
  const [isSeller, setIsSeller] = useState(false);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    phone: profile?.phone ?? '',
    wilaya: profile?.wilaya ?? '',
    baladia: profile?.baladia ?? '',
    address: profile?.address ?? '',
    store_name: profile?.store_name ?? '',
    store_description: profile?.store_description ?? '',
    store_category: profile?.store_category ?? '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setForm((p) => ({ ...p, [e.target.name]: e.target.value }));
  };

  const handleTypeSelect = (seller: boolean) => {
    setIsSeller(seller);
    setStep('details');
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.phone.trim()) { toast.error('رقم الهاتف مطلوب'); return; }
    if (!form.wilaya) { toast.error('يرجى اختيار الولاية'); return; }
    if (isSeller && !form.store_name.trim()) { toast.error('اسم المتجر مطلوب'); return; }

    setSaving(true);
    try {
      if (profile?.id) {
        await axios.patch(`${DB}/profiles/${profile.id}`, {
          is_seller: isSeller,
          phone: form.phone,
          wilaya: form.wilaya,
          baladia: form.baladia,
          address: form.address,
          store_name: form.store_name,
          store_description: form.store_description,
          store_category: form.store_category,
        });
      }

      await fetchProfile();
      toast.success('🎉 تم حفظ بياناتك بنجاح!');
      navigate(isSeller ? '/merchant/dashboard' : '/');
    } catch {
      toast.error('تعذّر حفظ البيانات');
    } finally {
      setSaving(false);
    }
  };

  /* ══════════════════════════════════════════
     الخطوة 1 — اختيار نوع الحساب
  ══════════════════════════════════════════ */
  if (step === 'type') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-sage-light/10 flex items-center justify-center px-4 py-10">
        <div className="w-full max-w-lg">

          <div className="text-center mb-10">
            <div className="w-16 h-16 bg-primary-400 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-primary-400/30">
              <Store className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 font-arabic mb-2">
              مرحباً {user?.first_name || user?.username}! 👋
            </h1>
            <p className="text-gray-500 font-arabic">
              أخبرنا كيف ستستخدم سوق؟
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-8">
            {/* مشتري */}
            <button
              onClick={() => handleTypeSelect(false)}
              className="group flex flex-col items-center gap-4 p-8 bg-white rounded-3xl border-2 border-gray-200 hover:border-blue-400 hover:shadow-xl hover:shadow-blue-100 transition-all duration-300 text-center"
            >
              <div className="w-20 h-20 bg-blue-100 group-hover:bg-blue-500 rounded-2xl flex items-center justify-center transition-colors duration-300">
                <ShoppingBag className="w-10 h-10 text-blue-500 group-hover:text-white transition-colors duration-300" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900 font-arabic mb-1">مشتري</h2>
                <p className="text-sm text-gray-500 font-arabic">أتسوق وأشتري منتجات</p>
              </div>
              <span className="flex items-center gap-1.5 text-blue-600 font-arabic text-sm font-medium">
                اختر <ArrowLeft className="w-4 h-4" />
              </span>
            </button>

            {/* تاجر */}
            <button
              onClick={() => handleTypeSelect(true)}
              className="group flex flex-col items-center gap-4 p-8 bg-white rounded-3xl border-2 border-gray-200 hover:border-primary-400 hover:shadow-xl hover:shadow-primary-100 transition-all duration-300 text-center"
            >
              <div className="w-20 h-20 bg-primary-100 group-hover:bg-primary-400 rounded-2xl flex items-center justify-center transition-colors duration-300">
                <Store className="w-10 h-10 text-primary-500 group-hover:text-white transition-colors duration-300" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900 font-arabic mb-1">تاجر</h2>
                <p className="text-sm text-gray-500 font-arabic">أبيع منتجاتي عبر سوق</p>
              </div>
              <span className="flex items-center gap-1.5 text-primary-600 font-arabic text-sm font-medium">
                اختر <ArrowLeft className="w-4 h-4" />
              </span>
            </button>
          </div>

          <p className="text-center text-xs text-gray-400 font-arabic">
            يمكنك تغيير هذا لاحقاً من الملف الشخصي
          </p>
        </div>
      </div>
    );
  }

  /* ══════════════════════════════════════════
     الخطوة 2 — إكمال البيانات
  ══════════════════════════════════════════ */
  return (
    <div className="min-h-screen bg-page-bg flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-lg">

        <div className="text-center mb-6">
          <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-arabic font-medium mb-4 ${
            isSeller ? 'bg-primary-100 text-primary-700' : 'bg-blue-100 text-blue-700'
          }`}>
            {isSeller ? <Store className="w-4 h-4" /> : <ShoppingBag className="w-4 h-4" />}
            {isSeller ? 'حساب تاجر' : 'حساب مشتري'}
          </div>
          <h1 className="text-2xl font-bold text-gray-900 font-arabic">
            {isSeller ? '🏪 أكمل بيانات متجرك' : '✨ أكمل ملفك الشخصي'}
          </h1>
          <p className="text-sm text-gray-500 font-arabic mt-1">
            بضع معلومات إضافية لتفعيل حسابك بالكامل
          </p>
        </div>

        <div className="bg-white rounded-3xl shadow-xl border border-gray-100 p-7">
          <form onSubmit={handleSave} className="space-y-4">

            {/* ─── معلومات الاتصال والموقع ─── */}
            <div className="bg-gray-50 rounded-2xl p-4 space-y-3">
              <p className="text-xs font-semibold text-gray-500 font-arabic">معلومات التواصل والموقع</p>

              <div>
                <label className="block text-sm font-medium text-gray-700 font-arabic mb-1.5">
                  رقم الهاتف *
                </label>
                <div className="relative">
                  <Phone className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    name="phone" value={form.phone} onChange={handleChange} required
                    type="tel" placeholder="05XXXXXXXX"
                    className="w-full pr-9 pl-4 py-2.5 rounded-xl border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-primary-400/30 font-arabic text-sm"
                  />
                </div>
              </div>

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
                <label className="block text-sm font-medium text-gray-700 font-arabic mb-1.5">العنوان</label>
                <input
                  name="address" value={form.address} onChange={handleChange}
                  placeholder="الشارع، الحي..."
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-primary-400/30 font-arabic text-sm"
                />
              </div>
            </div>

            {/* ─── معلومات المتجر (تاجر فقط) ─── */}
            {isSeller && (
              <div className="bg-primary-50 rounded-2xl p-4 space-y-3 border border-primary-200">
                <p className="text-xs font-semibold text-primary-600 font-arabic">🏪 معلومات المتجر</p>

                <div>
                  <label className="block text-sm font-medium text-gray-700 font-arabic mb-1.5">اسم المتجر *</label>
                  <input
                    name="store_name" value={form.store_name} onChange={handleChange}
                    required={isSeller} placeholder="مثال: متجر سامي للإلكترونيات"
                    className="w-full px-4 py-2.5 rounded-xl border border-primary-200 bg-white focus:outline-none focus:ring-2 focus:ring-primary-400/30 font-arabic text-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 font-arabic mb-1.5">فئة المتجر</label>
                  <input
                    name="store_category" value={form.store_category} onChange={handleChange}
                    placeholder="مثال: إلكترونيات، ملابس..."
                    className="w-full px-4 py-2.5 rounded-xl border border-primary-200 bg-white focus:outline-none focus:ring-2 focus:ring-primary-400/30 font-arabic text-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 font-arabic mb-1.5">وصف المتجر</label>
                  <textarea
                    name="store_description" value={form.store_description} onChange={handleChange}
                    rows={3} placeholder="وصف مختصر لمتجرك ومنتجاتك..."
                    className="w-full px-4 py-2.5 rounded-xl border border-primary-200 bg-white focus:outline-none focus:ring-2 focus:ring-primary-400/30 font-arabic text-sm resize-none"
                  />
                </div>
              </div>
            )}

            <div className="flex gap-3 pt-2">
              <button type="submit" disabled={saving}
                className={`flex-1 py-3.5 font-bold rounded-xl transition-colors font-arabic flex items-center justify-center gap-2 disabled:opacity-60 shadow-md ${
                  isSeller
                    ? 'bg-primary-400 hover:bg-primary-500 text-white shadow-primary-400/20'
                    : 'bg-blue-500 hover:bg-blue-600 text-white shadow-blue-400/20'
                }`}
              >
                {saving
                  ? <><span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> جاري الحفظ...</>
                  : <><Save className="w-5 h-5" /> حفظ وإكمال</>
                }
              </button>
              <Link to="/"
                className="px-4 py-3.5 bg-white border border-gray-200 text-gray-500 rounded-xl hover:bg-gray-50 transition-colors font-arabic text-sm text-center"
              >
                تخطي
              </Link>
            </div>
          </form>

          <p className="text-center text-xs text-gray-400 font-arabic mt-4">
            <button onClick={() => setStep('type')} className="flex items-center gap-1 mx-auto hover:text-gray-600 transition-colors">
              <User className="w-3 h-3" />
              تغيير نوع الحساب
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
