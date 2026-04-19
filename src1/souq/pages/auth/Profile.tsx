import { useEffect, useState } from 'react';
import { User, Camera, Save, Lock, Store, ShoppingBag, LayoutDashboard, Package, ClipboardList, ShieldCheck, Monitor, Globe, Clock } from 'lucide-react';
import { useAuthStore } from '@souq/stores/authStore';
import { useToast } from '@souq/stores/toastStore';
import AddressFields from '@souq/components/common/AddressFields';
import { Link } from 'react-router-dom';
import { sendPasswordChangedEmail } from '@souq/services/emailService';
import { getLoginHistory, type LoginRecord } from '@souq/services/ipService';

export default function Profile() {
  const { user, profile, fetchProfile, updateProfile } = useAuthStore();
  const toast = useToast();
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'personal' | 'store' | 'password' | 'security'>('personal');
  const [loginHistory, setLoginHistory] = useState<LoginRecord[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  const [form, setForm] = useState({
    first_name: '',
    last_name: '',
    phone: '',
    address: '',
    wilaya: '',
    baladia: '',
    postal_code: '',
    bio: '',
    store_name: '',
    store_description: '',
    store_category: '',
  });

  const [passwordForm, setPasswordForm] = useState({
    old_password: '',
    new_password: '',
    confirm_password: '',
  });

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  useEffect(() => {
    if (activeTab === 'security' && user) {
      setHistoryLoading(true);
      const userId = localStorage.getItem('mock_user_id') ?? String(user.id ?? '');
      getLoginHistory(userId).then((data) => {
        setLoginHistory(data);
        setHistoryLoading(false);
      });
    }
  }, [activeTab, user]);

  useEffect(() => {
    if (profile) {
      setForm({
        first_name: user?.first_name ?? '',
        last_name: user?.last_name ?? '',
        phone: profile.phone ?? '',
        address: profile.address ?? '',
        wilaya: profile.wilaya ?? '',
        baladia: profile.baladia ?? '',
        postal_code: (profile as any).postal_code ?? '',
        bio: profile.bio ?? '',
        store_name: profile.store_name ?? '',
        store_description: profile.store_description ?? '',
        store_category: profile.store_category ?? '',
      });
    }
  }, [profile, user]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setForm((p) => ({ ...p, [e.target.name]: e.target.value }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (activeTab === 'password') {
      if (!passwordForm.old_password || !passwordForm.new_password) {
        toast.error('يرجى ملء جميع الحقول');
        return;
      }
      if (passwordForm.new_password !== passwordForm.confirm_password) {
        toast.error('كلمتا المرور غير متطابقتين');
        return;
      }
      setLoading(true);
      try {
        const userId = localStorage.getItem('mock_user_id');
        if (!userId) throw new Error('');
        const res = await fetch(`/db/users/${userId}`);
        const currentUser = await res.json();
        if (currentUser.password !== passwordForm.old_password) {
          throw new Error('كلمة المرور الحالية غير صحيحة');
        }
        await fetch(`/db/users/${userId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ password: passwordForm.new_password }),
        });
        setPasswordForm({ old_password: '', new_password: '', confirm_password: '' });
        toast.success('تم تغيير كلمة المرور بنجاح');
        // إرسال بريد إشعار تغيير كلمة المرور
        if (user?.email) sendPasswordChangedEmail(user.email, user.username ?? '').catch(() => {});
      } catch (err: any) {
        toast.error(err.message || 'تعذّر تغيير كلمة المرور');
      } finally {
        setLoading(false);
      }
      return;
    }
    setLoading(true);
    try {
      await updateProfile(form);
      toast.success('تم حفظ التغييرات بنجاح!');
    } catch {
      toast.error('تعذّر حفظ التغييرات');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 font-arabic mb-8">الملف الشخصي</h1>

      {/* Avatar + Account Type */}
      <div className="mb-8 p-6 bg-white dark:bg-[#1E1E1E] rounded-2xl border border-gray-200 dark:border-[#2E2E2E]">
        <div className="flex items-center gap-5">
          <div className="relative">
            <div className="w-20 h-20 bg-primary-100 rounded-2xl flex items-center justify-center overflow-hidden">
              {profile?.photo ? (
                <img src={profile.photo} alt="" className="w-full h-full object-cover" />
              ) : (
                <User className="w-10 h-10 text-primary-400" />
              )}
            </div>
            <button className="absolute -bottom-2 -left-2 p-2 bg-primary-400 text-white rounded-lg hover:bg-primary-500 transition-colors shadow-md">
              <Camera className="w-3 h-3" />
            </button>
          </div>
          <div className="flex-1">
            <h3 className="font-bold text-gray-900 dark:text-gray-100 font-arabic text-lg">{user?.username}</h3>
            <p className="text-gray-500 dark:text-gray-400 text-sm">{user?.email}</p>
            <div className="flex items-center gap-2 mt-2">
              {profile?.is_seller ? (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-primary-100 text-primary-700 text-xs rounded-full font-arabic font-medium">
                  <Store className="w-3 h-3" />
                  تاجر
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-100 text-blue-700 text-xs rounded-full font-arabic font-medium">
                  <ShoppingBag className="w-3 h-3" />
                  مشتري
                </span>
              )}
              {user?.is_staff && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-red-100 text-red-700 text-xs rounded-full font-arabic font-medium">
                  مدير
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Merchant quick links */}
        {profile?.is_seller && (
          <div className="mt-5 pt-5 border-t border-gray-200 dark:border-[#2E2E2E]">
            <p className="text-xs text-gray-400 dark:text-gray-500 font-arabic mb-3">روابط سريعة للتاجر</p>
            <div className="flex flex-wrap gap-2">
              <Link to="/merchant/dashboard"
                className="flex items-center gap-1.5 px-3 py-2 bg-primary-50 dark:bg-primary-900/20 text-primary-600 rounded-xl text-sm font-arabic hover:bg-primary-100 dark:hover:bg-primary-900/30 transition-colors border border-primary-200 dark:border-primary-800/40">
                <LayoutDashboard className="w-4 h-4" />
                لوحة التحكم
              </Link>
              <Link to="/merchant/products"
                className="flex items-center gap-1.5 px-3 py-2 bg-primary-50 dark:bg-primary-900/20 text-primary-600 rounded-xl text-sm font-arabic hover:bg-primary-100 dark:hover:bg-primary-900/30 transition-colors border border-primary-200 dark:border-primary-800/40">
                <Package className="w-4 h-4" />
                منتجاتي
              </Link>
              <Link to="/merchant/orders"
                className="flex items-center gap-1.5 px-3 py-2 bg-primary-50 dark:bg-primary-900/20 text-primary-600 rounded-xl text-sm font-arabic hover:bg-primary-100 dark:hover:bg-primary-900/30 transition-colors border border-primary-200 dark:border-primary-800/40">
                <ClipboardList className="w-4 h-4" />
                إدارة الطلبات
              </Link>
            </div>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 dark:bg-[#252525] rounded-xl p-1 mb-6">
        {[
          { key: 'personal', label: 'البيانات الشخصية', icon: <User className="w-4 h-4" /> },
          ...(profile?.is_seller ? [{ key: 'store', label: 'المتجر', icon: <Store className="w-4 h-4" /> }] : []),
          { key: 'password', label: 'كلمة المرور', icon: <Lock className="w-4 h-4" /> },
          { key: 'security', label: 'سجل الدخول', icon: <ShieldCheck className="w-4 h-4" /> },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as 'personal' | 'store' | 'password' | 'security')}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-arabic transition-all ${
              activeTab === tab.key
                ? 'bg-white dark:bg-[#1E1E1E] text-primary-600 shadow-md shadow-black/10 dark:shadow-black/30 font-medium'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      <form onSubmit={handleSave}>
        {activeTab === 'personal' && (
          <div className="bg-white dark:bg-[#1E1E1E] rounded-2xl border border-gray-200 dark:border-[#2E2E2E] p-6 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 font-arabic mb-2">الاسم الأول</label>
                <input name="first_name" value={form.first_name} onChange={handleChange}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-[#2E2E2E] bg-gray-50 dark:bg-[#1A1A1A] text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-400/30 font-arabic" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 font-arabic mb-2">اسم العائلة</label>
                <input name="last_name" value={form.last_name} onChange={handleChange}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-[#2E2E2E] bg-gray-50 dark:bg-[#1A1A1A] text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-400/30 font-arabic" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 font-arabic mb-2">رقم الهاتف</label>
                <input name="phone" value={form.phone} onChange={handleChange} type="tel"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-[#2E2E2E] bg-gray-50 dark:bg-[#1A1A1A] text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-400/30 font-arabic" />
              </div>
              <AddressFields
                wilaya={form.wilaya}
                baladia={form.baladia}
                postal_code={form.postal_code}
                onChange={(field, value) => setForm((p) => ({ ...p, [field]: value }))}
                required={false}
                className="sm:col-span-2"
              />
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 font-arabic mb-2">العنوان</label>
                <input name="address" value={form.address} onChange={handleChange}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-[#2E2E2E] bg-gray-50 dark:bg-[#1A1A1A] text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-400/30 font-arabic" />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 font-arabic mb-2">نبذة عنك</label>
                <textarea name="bio" value={form.bio} onChange={handleChange} rows={3}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-[#2E2E2E] bg-gray-50 dark:bg-[#1A1A1A] text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-400/30 font-arabic resize-none" />
              </div>
            </div>
          </div>
        )}

        {activeTab === 'store' && profile?.is_seller && (
          <div className="bg-white dark:bg-[#1E1E1E] rounded-2xl border border-gray-200 dark:border-[#2E2E2E] p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 font-arabic mb-2">اسم المتجر</label>
              <input name="store_name" value={form.store_name} onChange={handleChange}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-[#2E2E2E] bg-gray-50 dark:bg-[#1A1A1A] text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-400/30 font-arabic" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 font-arabic mb-2">فئة المتجر</label>
              <input name="store_category" value={form.store_category} onChange={handleChange}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-[#2E2E2E] bg-gray-50 dark:bg-[#1A1A1A] text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-400/30 font-arabic" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 font-arabic mb-2">وصف المتجر</label>
              <textarea name="store_description" value={form.store_description} onChange={handleChange} rows={4}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-[#2E2E2E] bg-gray-50 dark:bg-[#1A1A1A] text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-400/30 font-arabic resize-none" />
            </div>
          </div>
        )}

        {activeTab === 'password' && (
          <div className="bg-white dark:bg-[#1E1E1E] rounded-2xl border border-gray-200 dark:border-[#2E2E2E] p-6 space-y-4">
            {['old_password', 'new_password', 'confirm_password'].map((field) => (
              <div key={field}>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 font-arabic mb-2">
                  {field === 'old_password' ? 'كلمة المرور الحالية' : field === 'new_password' ? 'كلمة المرور الجديدة' : 'تأكيد كلمة المرور'}
                </label>
                <input
                  type="password"
                  name={field}
                  value={passwordForm[field as keyof typeof passwordForm]}
                  onChange={(e) => setPasswordForm((p) => ({ ...p, [field]: e.target.value }))}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-[#2E2E2E] bg-gray-50 dark:bg-[#1A1A1A] text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-400/30 font-arabic"
                />
              </div>
            ))}
          </div>
        )}

        {activeTab === 'security' && (
          <div className="bg-white dark:bg-[#1E1E1E] rounded-2xl border border-gray-200 dark:border-[#2E2E2E] overflow-hidden">
            <div className="flex items-center gap-3 px-6 py-4 border-b border-gray-200 dark:border-[#2E2E2E]">
              <ShieldCheck className="w-5 h-5 text-primary-400" />
              <h3 className="font-bold text-gray-900 dark:text-gray-100 font-arabic">سجل تسجيل الدخول</h3>
            </div>
            {historyLoading ? (
              <div className="flex items-center justify-center py-12">
                <span className="w-6 h-6 border-2 border-primary-400/30 border-t-primary-400 rounded-full animate-spin" />
              </div>
            ) : loginHistory.length === 0 ? (
              <div className="text-center py-12 text-gray-400 dark:text-gray-500 font-arabic">لا يوجد سجل دخول حتى الآن</div>
            ) : (
              <div className="divide-y divide-gray-100 dark:divide-[#2E2E2E]">
                {loginHistory.map((record, i) => {
                  const date = new Date(record.logged_at);
                  const isRecent = Date.now() - date.getTime() < 24 * 60 * 60 * 1000;
                  return (
                    <div key={record.id ?? i} className={`flex items-start gap-4 px-6 py-4 hover:bg-gray-50 dark:hover:bg-[#252525] transition-colors ${i === 0 ? 'bg-green-50/50 dark:bg-green-900/5' : ''}`}>
                      <div className={`mt-0.5 w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${i === 0 ? 'bg-green-100 dark:bg-green-900/20' : 'bg-gray-100 dark:bg-[#252525]'}`}>
                        <Monitor className={`w-4 h-4 ${i === 0 ? 'text-green-600' : 'text-gray-500 dark:text-gray-400'}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="flex items-center gap-1 text-sm font-medium text-gray-800 dark:text-gray-200 font-mono">
                            <Globe className="w-3.5 h-3.5 text-gray-400" />
                            {record.ip}
                          </span>
                          {i === 0 && (
                            <span className="px-2 py-0.5 bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400 text-xs rounded-full font-arabic">الجلسة الحالية</span>
                          )}
                          {isRecent && i !== 0 && (
                            <span className="px-2 py-0.5 bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 text-xs rounded-full font-arabic">اليوم</span>
                          )}
                        </div>
                        <p className="text-xs text-gray-400 dark:text-gray-500 mt-1 truncate font-arabic" title={record.user_agent}>
                          {record.user_agent?.split(' ').slice(0, 5).join(' ')}
                        </p>
                        <p className="flex items-center gap-1 text-xs text-gray-400 dark:text-gray-500 mt-1">
                          <Clock className="w-3 h-3" />
                          {date.toLocaleDateString('ar-DZ', { year: 'numeric', month: 'long', day: 'numeric' })}
                          {' — '}
                          {date.toLocaleTimeString('ar-DZ', { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {activeTab !== 'security' && (
          <button
            type="submit"
            disabled={loading}
            className="mt-4 w-full py-3.5 bg-primary-400 text-white font-bold rounded-xl hover:bg-primary-500 transition-colors font-arabic flex items-center justify-center gap-2 disabled:opacity-60"
          >
            {loading ? <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Save className="w-5 h-5" />}
            {activeTab === 'password' ? 'تغيير كلمة المرور' : 'حفظ التغييرات'}
          </button>
        )}
      </form>
    </div>
  );
}
