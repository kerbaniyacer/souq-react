import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Phone, Save } from 'lucide-react';
import { useAuthStore } from '@features/auth/stores/authStore';
import { useToast } from '@shared/stores/toastStore';
import AddressFields from '@shared/components/common/AddressFields';
import api from '@features/auth/services/authService';

export default function CompleteProfile() {
  const { profile, user, fetchProfile, finalizeLogin, isAuthenticated, accessToken } = useAuthStore();
  const toast = useToast();
  const navigate = useNavigate();

  const [saving, setSaving] = useState(false);
  const [pendingToken, setPendingToken] = useState<string | null>(null);

  useEffect(() => {
    const raw = localStorage.getItem('pending_auth');
    if (raw) {
      const pending = JSON.parse(raw);
      setPendingToken(pending.access);
    } else if (!isAuthenticated) {
      navigate('/login', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const [form, setForm] = useState({
    phone:   profile?.phone   ?? '',
    wilaya:  profile?.wilaya  ?? '',
    baladia: profile?.baladia ?? '',
    address: profile?.address ?? '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setForm(p => ({ ...p, [e.target.name]: e.target.value }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.phone.trim()) { toast.error('رقم الهاتف مطلوب'); return; }
    if (!form.wilaya)        { toast.error('يرجى اختيار الولاية'); return; }

    setSaving(true);
    try {
      const token = pendingToken ?? accessToken;
      await api.post(
        '/auth/complete-profile/',
        { phone: form.phone, wilaya: form.wilaya, baladia: form.baladia, address: form.address },
        token ? { headers: { Authorization: `Bearer ${token}` } } : undefined,
      );

      if (pendingToken) {
        await finalizeLogin();
      } else {
        await fetchProfile(true);
      }

      toast.success('🎉 تم حفظ بياناتك بنجاح!');
      navigate('/');
    } catch {
      toast.error('تعذّر حفظ البيانات');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-page-bg flex items-center justify-center px-4 py-8" dir="rtl">
      <div className="w-full max-w-lg">

        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 font-arabic">
            ✨ أكمل ملفك الشخصي
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 font-arabic mt-1">
            مرحباً {user?.first_name || user?.username}! بضع معلومات لتفعيل حسابك
          </p>
          <p className="text-xs text-gray-400 dark:text-gray-500 font-arabic mt-1">
            يمكنك إضافة متاجرك لاحقاً من لوحة التحكم
          </p>
        </div>

        <div className="bg-white dark:bg-[#1A1A1A] rounded-3xl shadow-xl border border-gray-100 dark:border-gray-800 p-7">
          <form onSubmit={handleSave} className="space-y-4">

            <div className="bg-gray-50 dark:bg-[#252525] rounded-2xl p-4 space-y-3">
              <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 font-arabic uppercase tracking-wider">معلومات التواصل والموقع</p>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 font-arabic mb-1.5">رقم الهاتف *</label>
                <div className="relative">
                  <Phone className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    name="phone" value={form.phone} onChange={handleChange} required
                    type="tel" placeholder="05XXXXXXXX"
                    className="w-full pr-9 pl-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#1E1E1E] text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-400/30 font-arabic text-sm"
                  />
                </div>
              </div>

              <AddressFields
                wilaya={form.wilaya}
                baladia={form.baladia}
                onChange={(field, value) => setForm(p => ({ ...p, [field]: value }))}
                required
                className="col-span-2"
              />

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 font-arabic mb-1.5">العنوان التفصيلي</label>
                <input
                  name="address" value={form.address} onChange={handleChange}
                  placeholder="الشارع، الحي..."
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#1E1E1E] text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-400/30 font-arabic text-sm"
                />
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="submit"
                disabled={saving}
                className="flex-1 py-3.5 font-bold rounded-xl bg-primary-500 hover:bg-primary-600 text-white font-arabic flex items-center justify-center gap-2 disabled:opacity-60 shadow-md shadow-primary-400/20 transition-colors"
              >
                {saving
                  ? <><span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> جاري الحفظ...</>
                  : <><Save className="w-5 h-5" /> حفظ وإكمال</>
                }
              </button>
              <Link
                to="/"
                className="px-4 py-3.5 bg-gray-50 dark:bg-[#252525] border border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 rounded-xl hover:bg-gray-100 dark:hover:bg-[#2E2E2E] transition-colors font-arabic text-sm text-center"
              >
                تخطي
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
