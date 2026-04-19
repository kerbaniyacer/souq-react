import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCartStore } from '@stores/cartStore';
import { useAuthStore } from '@stores/authStore';
import { ordersApi } from '@services/api';
import { useToast } from '@stores/toastStore';
import { WILAYA_CHOICES } from '@types';
import type { CheckoutData } from '@types';

export default function Checkout() {
  const { cart, fetchCart, clearCart } = useCartStore();
  const { profile, isAuthenticated } = useAuthStore();
  const toast = useToast();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState<CheckoutData>({
    full_name: '',
    phone: '',
    email: '',
    address: '',
    wilaya: '',
    baladia: '',
    postal_code: '',
    notes: '',
    payment_method: 'cod',
  });

  useEffect(() => {
    fetchCart();
    if (profile) {
      setForm((p) => ({
        ...p,
        full_name: `${profile.user.first_name} ${profile.user.last_name}`.trim(),
        phone: profile.phone,
        email: profile.user.email,
        address: profile.address,
        wilaya: profile.wilaya,
        baladia: profile.baladia,
      }));
    }
  }, [fetchCart, profile]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setForm((p) => ({ ...p, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cart?.items?.length) {
      toast.error('السلة فارغة');
      return;
    }
    setLoading(true);
    try {
      const res = await ordersApi.create(form);
      await clearCart();
      toast.success('تم تقديم طلبك بنجاح!');
      navigate(`/orders/${res.data.id}`);
    } catch {
      toast.error('حدث خطأ أثناء تقديم الطلب');
    } finally {
      setLoading(false);
    }
  };

  const items = cart?.items ?? [];
  const subtotal = items.reduce((s, i) => s + i.subtotal, 0);
  const shipping = subtotal > 5000 ? 0 : 500;
  const total = subtotal + shipping;

  if (!isAuthenticated) {
    navigate('/login', { state: { from: '/checkout' } });
    return null;
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 font-arabic mb-8">إتمام الطلب</h1>

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Shipping info */}
            <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-6">
              <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 font-arabic mb-5">معلومات الشحن</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 font-arabic mb-2">الاسم الكامل *</label>
                  <input name="full_name" value={form.full_name} onChange={handleChange} required
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-primary-400/30 font-arabic transition-colors" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 font-arabic mb-2">رقم الهاتف *</label>
                  <input name="phone" value={form.phone} onChange={handleChange} required type="tel"
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-primary-400/30 font-arabic transition-colors" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 font-arabic mb-2">البريد الإلكتروني *</label>
                  <input name="email" value={form.email} onChange={handleChange} required type="email"
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-primary-400/30 font-arabic transition-colors" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 font-arabic mb-2">الولاية *</label>
                  <select name="wilaya" value={form.wilaya} onChange={handleChange} required
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-primary-400/30 font-arabic transition-colors">
                    <option value="">اختر الولاية</option>
                    {WILAYA_CHOICES.map((w) => (
                      <option key={w} value={w}>{w}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 font-arabic mb-2">البلدية *</label>
                  <input name="baladia" value={form.baladia} onChange={handleChange} required placeholder="اسم البلدية"
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-primary-400/30 font-arabic transition-colors" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 font-arabic mb-2">الرمز البريدي</label>
                  <input name="postal_code" value={form.postal_code} onChange={handleChange}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-primary-400/30 font-arabic transition-colors" />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 font-arabic mb-2">العنوان التفصيلي *</label>
                  <input name="address" value={form.address} onChange={handleChange} required placeholder="الشارع، الحي، رقم المبنى..."
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-primary-400/30 font-arabic transition-colors" />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 font-arabic mb-2">ملاحظات إضافية</label>
                  <textarea name="notes" value={form.notes} onChange={handleChange} rows={3}
                    placeholder="أي تعليمات خاصة للتوصيل..."
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-primary-400/30 font-arabic resize-none transition-colors" />
                </div>
              </div>
            </div>

            {/* Payment */}
            <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-6">
              <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 font-arabic mb-5">طريقة الدفع</h3>
              <div className="space-y-3">
                {[
                  { value: 'cod', label: 'الدفع عند الاستلام', icon: '💵' },
                  { value: 'card', label: 'بطاقة بنكية', icon: '💳' },
                  { value: 'apple_pay', label: 'Apple Pay', icon: '' },
                ].map((pm) => (
                  <label key={pm.value} className={`flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                    form.payment_method === pm.value ? 'border-primary-400 bg-primary-50' : 'border-gray-200 hover:border-gray-300'
                  }`}>
                    <input
                      type="radio"
                      name="payment_method"
                      value={pm.value}
                      checked={form.payment_method === pm.value}
                      onChange={handleChange}
                      className="accent-primary-400"
                    />
                    <span className="text-xl">{pm.icon}</span>
                    <span className="font-arabic text-gray-800 dark:text-gray-200">{pm.label}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          {/* Summary */}
          <div>
            <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-6 sticky top-20">
              <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 font-arabic mb-5">ملخص الطلب</h3>
              <div className="space-y-3 mb-5 max-h-60 overflow-y-auto">
                {items.map((item) => (
                  <div key={item.id} className="flex justify-between text-sm font-arabic">
                    <span className="text-gray-600 dark:text-gray-400 line-clamp-1 flex-1 ml-2">{item.variant?.name} × {item.quantity}</span>
                    <span className="font-mono shrink-0">{Number(item.subtotal).toLocaleString('ar-DZ')} دج</span>
                  </div>
                ))}
              </div>
              <div className="border-t border-gray-100 dark:border-gray-800 pt-4 space-y-2">
                <div className="flex justify-between text-sm font-arabic">
                  <span className="text-gray-600 dark:text-gray-400">المجموع الفرعي</span>
                  <span className="font-mono">{Number(subtotal).toLocaleString('ar-DZ')} دج</span>
                </div>
                <div className="flex justify-between text-sm font-arabic">
                  <span className="text-gray-600 dark:text-gray-400">الشحن</span>
                  <span className={`font-mono ${shipping === 0 ? 'text-green-600' : ''}`}>
                    {shipping === 0 ? 'مجاني' : `${shipping} دج`}
                  </span>
                </div>
                <div className="border-t border-gray-100 dark:border-gray-800 pt-2 flex justify-between font-bold font-arabic">
                  <span>الإجمالي</span>
                  <span className="text-primary-600 font-mono text-lg">{Number(total).toLocaleString('ar-DZ')} دج</span>
                </div>
              </div>
              <button
                type="submit"
                disabled={loading || !items.length}
                className="w-full mt-5 py-3.5 bg-primary-400 text-white font-bold rounded-xl hover:bg-primary-500 transition-colors font-arabic disabled:opacity-60 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <><span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> جاري المعالجة...</>
                ) : 'تأكيد الطلب'}
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
