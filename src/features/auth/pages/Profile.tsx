import { useEffect, useState } from 'react';
import { User, Camera, Save, Lock, Store, ShoppingBag, LayoutDashboard, Package, ClipboardList, CreditCard, ShieldAlert } from 'lucide-react';
import { useAuthStore } from '@features/auth/stores/authStore';
import { useToast } from '@shared/stores/toastStore';
import AddressFields from '@shared/components/common/AddressFields';
import { Link } from 'react-router-dom';
import { useRef } from 'react';
import ImageCropperModal from '@features/auth/components/ImageCropperModal';
import StarRating from '@features/products/components/StarRating';

export default function Profile() {
  const { user, profile, fetchProfile, updateProfile, changePassword } = useAuthStore();
  const toast = useToast();
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'personal' | 'store' | 'password'>('personal');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({
    first_name: '',
    last_name: '',
    phone: '',
    address: '',
    wilaya: '',
    baladia: '',
    bio: '',
    store_name: '',
    store_description: '',
    store_category: '',
    ccp_number: '',
    ccp_name: '',
    baridimob_id: '',
  });

  const [passwordForm, setPasswordForm] = useState({
    old_password: '',
    new_password: '',
    confirm_password: '',
  });

  useEffect(() => {
    fetchProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Run once on mount to get fresh data

  useEffect(() => {
    if (profile) {
      setForm({
        first_name: user?.first_name ?? '',
        last_name: user?.last_name ?? '',
        phone: profile.phone ?? '',
        address: profile.address ?? '',
        wilaya: profile.wilaya ?? '',
        baladia: profile.baladia ?? '',
        bio: profile.bio ?? '',
        store_name: profile.store_name ?? '',
        store_description: profile.store_description ?? '',
        store_category: profile.store_category ?? '',
        ccp_number: profile.ccp_number ?? '',
        ccp_name: profile.ccp_name ?? '',
        baridimob_id: profile.baridimob_id ?? '',
      });
    }
  }, [profile, user]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setForm((p) => ({ ...p, [e.target.name]: e.target.value }));
  };
  const handlePhotoClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => setSelectedImage(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleCropComplete = async (croppedImage: string) => {
    setSelectedImage(null);
    setLoading(true);
    try {
      await updateProfile({ photo: croppedImage });
      toast.success('تم تحديث الصورة الشخصية بنجاح');
    } catch (err: any) {
      toast.error(err.message || 'فشل تحديث الصورة');
    } finally {
      setLoading(false);
    }
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
        await changePassword(
          passwordForm.old_password,
          passwordForm.new_password,
          passwordForm.new_password,
        );
        setPasswordForm({ old_password: '', new_password: '', confirm_password: '' });
        toast.success('تم تغيير كلمة المرور بنجاح');
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
            <button 
              onClick={handlePhotoClick}
              className="absolute -bottom-2 -left-2 p-2 bg-primary-400 text-white rounded-lg hover:bg-primary-500 transition-colors shadow-md"
            >
              <Camera className="w-3 h-3" />
            </button>
            <input 
              type="file" 
              ref={fileInputRef} 
              className="hidden" 
              accept="image/*" 
              onChange={handleFileChange} 
            />
          </div>
          <div className="flex-1">
            <h3 className="font-bold text-gray-900 dark:text-gray-100 font-arabic text-lg">{user?.username}</h3>
            <p className="text-gray-500 dark:text-gray-400 text-sm">{user?.email}</p>
            <div className="flex flex-wrap items-center gap-2 mt-2">
              {profile?.is_seller ? (
                <div className="flex items-center gap-2 px-3 py-1 bg-primary-100 text-primary-700 text-xs rounded-full font-arabic font-medium border border-primary-200">
                  <Store className="w-3 h-3" />
                  تاجر
                  <span className="mx-1 text-primary-300">|</span>
                  <StarRating rating={profile?.seller_rating ?? 0} size={10} />
                  <span className="font-mono">({profile?.seller_reviews_count ?? 0})</span>
                </div>
              ) : (
                <div className="flex items-center gap-2 px-3 py-1 bg-blue-100 text-blue-700 text-xs rounded-full font-arabic font-medium border border-blue-200">
                  <ShoppingBag className="w-3 h-3" />
                  مشتري
                  <span className="mx-1 text-blue-300">|</span>
                  <StarRating rating={profile?.buyer_rating ?? 0} size={10} />
                  <span className="font-mono">({profile?.buyer_reviews_count ?? 0})</span>
                </div>
              )}
              {user?.is_staff && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-red-100 text-red-700 text-xs rounded-full font-arabic font-medium border border-red-200">
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
              <Link to="/appeals/list"
                className="flex items-center gap-1.5 px-3 py-2 bg-amber-50 dark:bg-amber-900/20 text-amber-600 rounded-xl text-sm font-arabic hover:bg-amber-100 dark:hover:bg-amber-900/30 transition-colors border border-amber-200 dark:border-amber-800/40">
                <ShieldAlert className="w-4 h-4" />
                الطعون
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
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as 'personal' | 'store' | 'password')}
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

            <div className="pt-4 border-t border-gray-100 dark:border-[#2E2E2E]">
              <h4 className="text-sm font-bold text-gray-900 dark:text-gray-100 font-arabic mb-4 flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-primary-500" /> معلومات الحساب البنكي (للمدفوعات)
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 font-arabic mb-2">رقم الحساب البريدي (CCP)</label>
                  <input name="ccp_number" value={form.ccp_number} onChange={handleChange}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-[#2E2E2E] bg-gray-50 dark:bg-[#1A1A1A] text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-400/30 font-arabic" placeholder="00XXX... المفتاح: XX" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 font-arabic mb-2">الاسم الكامل في الحساب</label>
                  <input name="ccp_name" value={form.ccp_name} onChange={handleChange}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-[#2E2E2E] bg-gray-50 dark:bg-[#1A1A1A] text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-400/30 font-arabic" placeholder="الاسم كما يظهر في الصك" />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 font-arabic mb-2">رقم الـ RIP أو البريدي موب (BaridiMob)</label>
                  <input name="baridimob_id" value={form.baridimob_id} onChange={handleChange}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-[#2E2E2E] bg-gray-50 dark:bg-[#1A1A1A] text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-400/30 font-arabic font-mono" placeholder="رقم الـ RIP المكون من 20 رقم" />
                </div>
              </div>
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

        <button
          type="submit"
          disabled={loading}
          className="mt-4 w-full py-3.5 bg-primary-400 text-white font-bold rounded-xl hover:bg-primary-500 transition-colors font-arabic flex items-center justify-center gap-2 disabled:opacity-60"
        >
          {loading ? <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Save className="w-5 h-5" />}
          {activeTab === 'password' ? 'تغيير كلمة المرور' : 'حفظ التغييرات'}
        </button>
      </form>

      {selectedImage && (
        <ImageCropperModal 
          image={selectedImage} 
          onClose={() => setSelectedImage(null)} 
          onCropComplete={handleCropComplete} 
        />
      )}
    </div>
  );
}
