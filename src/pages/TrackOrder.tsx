import { useState } from 'react';
import { Search, Package, CheckCircle, Truck, MapPin, Clock } from 'lucide-react';
import { ordersApi } from '@/services/api';
import type { Order, OrderStatus } from '@/types';

const steps: { status: OrderStatus; label: string; icon: React.ReactNode }[] = [
  { status: 'pending',    label: 'تم الاستلام',   icon: <Clock className="w-5 h-5" /> },
  { status: 'confirmed',  label: 'تم التأكيد',    icon: <CheckCircle className="w-5 h-5" /> },
  { status: 'processing', label: 'جاري التجهيز',  icon: <Package className="w-5 h-5" /> },
  { status: 'shipped',    label: 'تم الشحن',       icon: <Truck className="w-5 h-5" /> },
  { status: 'delivered',  label: 'تم التسليم',     icon: <MapPin className="w-5 h-5" /> },
];

const stepOrder: OrderStatus[] = ['pending', 'confirmed', 'processing', 'shipped', 'delivered'];

export default function TrackOrder() {
  const [orderNumber, setOrderNumber] = useState('');
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(false);
  const [notFound, setNotFound] = useState(false);

  const handleTrack = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orderNumber.trim()) return;
    setLoading(true);
    setNotFound(false);
    setOrder(null);
    try {
      const res = await ordersApi.track(orderNumber.trim());
      setOrder(res.data);
    } catch {
      setNotFound(true);
    } finally {
      setLoading(false);
    }
  };

  const currentStepIndex = order ? stepOrder.indexOf(order.status) : -1;

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-16">
      <div className="text-center mb-10">
        <div className="w-16 h-16 bg-primary-100 dark:bg-primary-900/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <Truck className="w-8 h-8 text-primary-600 dark:text-primary-400" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 font-arabic mb-2">تتبع طلبك</h1>
        <p className="text-gray-500 dark:text-gray-400 font-arabic">أدخل رقم الطلب لمتابعة حالته</p>
      </div>

      {/* Search form */}
      <form onSubmit={handleTrack} className="flex gap-3 mb-8">
        <input
          type="text"
          value={orderNumber}
          onChange={(e) => setOrderNumber(e.target.value)}
          placeholder="SOQ-2024-XXXXX"
          className="flex-1 px-5 py-3.5 rounded-xl border border-gray-200 dark:border-[#2E2E2E] bg-white dark:bg-[#1E1E1E] text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-400/30 focus:border-primary-400 font-arabic text-center text-lg tracking-widest"
          dir="ltr"
        />
        <button
          type="submit"
          disabled={loading}
          className="px-6 py-3.5 bg-primary-400 text-white rounded-xl hover:bg-primary-500 transition-colors font-arabic flex items-center gap-2 disabled:opacity-60"
        >
          {loading ? <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Search className="w-5 h-5" />}
          بحث
        </button>
      </form>

      {/* Not found */}
      {notFound && (
        <div className="text-center py-8 bg-white dark:bg-[#1A1A1A] rounded-2xl border border-gray-100 dark:border-[#2E2E2E]">
          <p className="text-4xl mb-3">🔍</p>
          <p className="text-gray-600 dark:text-gray-300 font-arabic font-medium">لم يتم العثور على الطلب</p>
          <p className="text-gray-400 dark:text-gray-500 font-arabic text-sm mt-1">تأكد من رقم الطلب وحاول مرة أخرى</p>
        </div>
      )}

      {/* Order found */}
      {order && (
        <div className="bg-white dark:bg-[#1A1A1A] rounded-2xl border border-gray-100 dark:border-[#2E2E2E] overflow-hidden">
          {/* Header */}
          <div className="bg-primary-50 dark:bg-primary-900/10 px-6 py-5 border-b border-primary-100 dark:border-primary-900/20">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm text-primary-600 dark:text-primary-400 font-arabic mb-1">رقم الطلب</p>
                <p className="font-bold text-gray-900 dark:text-gray-100 text-lg font-mono">{order.order_number}</p>
              </div>
              <div className="text-left">
                <p className="text-sm text-gray-500 dark:text-gray-400 font-arabic">{new Date(order.created_at).toLocaleDateString('ar-DZ')}</p>
                <p className="font-bold text-primary-600 font-mono mt-1">{Number(order.total_amount).toLocaleString('ar-DZ')} دج</p>
              </div>
            </div>
          </div>

          {/* Tracking steps */}
          {order.status !== 'cancelled' && order.status !== 'returned' ? (
            <div className="p-6">
              <h3 className="font-bold text-gray-800 dark:text-gray-200 font-arabic mb-6">مسار الطلب</h3>
              <div className="relative">
                {/* Progress line */}
                <div className="absolute top-5 right-5 left-5 h-0.5 bg-gray-200 dark:bg-[#2E2E2E] -z-0" />
                <div
                  className="absolute top-5 right-5 h-0.5 bg-primary-400 transition-all duration-500 -z-0"
                  style={{ width: currentStepIndex >= 0 ? `${(currentStepIndex / (steps.length - 1)) * 100}%` : '0%' }}
                />
                <div className="flex justify-between relative z-10">
                  {steps.map((step, idx) => {
                    const done = idx <= currentStepIndex;
                    const active = idx === currentStepIndex;
                    return (
                      <div key={step.status} className="flex flex-col items-center gap-2">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all ${
                          done ? 'bg-primary-400 border-primary-400 text-white' :
                          active ? 'bg-white dark:bg-[#1A1A1A] border-primary-400 text-primary-400' :
                          'bg-white dark:bg-[#1A1A1A] border-gray-200 dark:border-[#2E2E2E] text-gray-300 dark:text-gray-600'
                        }`}>
                          {step.icon}
                        </div>
                        <span className={`text-xs font-arabic text-center max-w-14 leading-tight ${done ? 'text-primary-600 dark:text-primary-400 font-medium' : 'text-gray-400 dark:text-gray-500'}`}>
                          {step.label}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          ) : (
            <div className="p-6 text-center">
              <p className={`text-lg font-bold font-arabic ${order.status === 'cancelled' ? 'text-red-600 dark:text-red-400' : 'text-gray-600 dark:text-gray-400'}`}>
                {order.status === 'cancelled' ? '❌ تم إلغاء هذا الطلب' : '↩️ تم إرجاع هذا الطلب'}
              </p>
            </div>
          )}

          {/* Shipping info */}
          <div className="px-6 pb-6 border-t border-gray-100 dark:border-[#2E2E2E] pt-5">
            <h4 className="font-semibold text-gray-700 dark:text-gray-300 font-arabic mb-3">معلومات التوصيل</h4>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <span className="text-gray-400 dark:text-gray-500 font-arabic">المستلم:</span>
                <p className="font-medium text-gray-800 dark:text-gray-200 font-arabic">{order.full_name}</p>
              </div>
              <div>
                <span className="text-gray-400 dark:text-gray-500 font-arabic">الهاتف:</span>
                <p className="font-medium text-gray-800 dark:text-gray-200 font-mono">{order.phone}</p>
              </div>
              <div className="col-span-2">
                <span className="text-gray-400 dark:text-gray-500 font-arabic">العنوان:</span>
                <p className="font-medium text-gray-800 dark:text-gray-200 font-arabic">{order.address}، {order.baladia}، {order.wilaya}</p>
              </div>
              {order.tracking_number && (
                <div>
                  <span className="text-gray-400 dark:text-gray-500 font-arabic">رقم التتبع:</span>
                  <p className="font-medium text-gray-800 dark:text-gray-200 font-mono">{order.tracking_number}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
