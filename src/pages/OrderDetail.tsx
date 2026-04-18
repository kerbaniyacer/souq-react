import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowRight, Package } from 'lucide-react';
import { ordersApi } from '@/services/api';
import type { Order } from '@/types';

const statusLabels: Record<string, { label: string; color: string }> = {
  pending:    { label: 'قيد الانتظار', color: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400' },
  confirmed:  { label: 'تم التأكيد',   color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400' },
  processing: { label: 'جاري التجهيز', color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/20 dark:text-purple-400' },
  shipped:    { label: 'تم الشحن',      color: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/20 dark:text-indigo-400' },
  delivered:  { label: 'تم التسليم',    color: 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400' },
  cancelled:  { label: 'ملغى',          color: 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400' },
  returned:   { label: 'مُرجَع',         color: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400' },
};

const paymentLabels: Record<string, string> = {
  cod: 'الدفع عند الاستلام',
  card: 'بطاقة بنكية',
  apple_pay: 'Apple Pay',
};

export default function OrderDetail() {
  const { id } = useParams<{ id: string }>();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    ordersApi.detail(id)
      .then((res) => setOrder(res.data))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-10 animate-pulse space-y-4">
        <div className="h-10 bg-gray-100 dark:bg-[#252525] rounded-xl w-48" />
        <div className="h-32 bg-gray-100 dark:bg-[#252525] rounded-2xl" />
        <div className="h-48 bg-gray-100 dark:bg-[#252525] rounded-2xl" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="text-center py-20">
        <p className="text-gray-500 dark:text-gray-400 font-arabic">الطلب غير موجود</p>
        <Link to="/orders" className="mt-4 inline-block text-primary-600 font-arabic">← العودة للطلبات</Link>
      </div>
    );
  }

  const status = statusLabels[order.status] ?? { label: order.status, color: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400' };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm font-arabic text-gray-400 dark:text-gray-500 mb-8">
        <Link to="/orders" className="hover:text-primary-600 transition-colors">طلباتي</Link>
        <ArrowRight className="w-3 h-3" />
        <span className="text-gray-600 dark:text-gray-300">#{order.order_number}</span>
      </div>

      {/* Header */}
      <div className="bg-white dark:bg-[#1E1E1E] rounded-2xl border border-gray-100 dark:border-[#2E2E2E] p-6 mb-5">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100 font-arabic">طلب #{order.order_number}</h1>
            <p className="text-sm text-gray-400 dark:text-gray-500 font-arabic mt-1">
              {new Date(order.created_at).toLocaleDateString('ar-DZ', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
            </p>
          </div>
          <span className={`px-3 py-1.5 rounded-full text-sm font-medium font-arabic ${status.color}`}>
            {status.label}
          </span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm">
          <div>
            <p className="text-gray-400 dark:text-gray-500 font-arabic">طريقة الدفع</p>
            <p className="font-medium text-gray-800 dark:text-gray-200 font-arabic mt-1">{paymentLabels[order.payment_method] ?? order.payment_method}</p>
          </div>
          {order.tracking_number && (
            <div>
              <p className="text-gray-400 dark:text-gray-500 font-arabic">رقم التتبع</p>
              <p className="font-mono font-medium text-gray-800 dark:text-gray-200 mt-1">{order.tracking_number}</p>
            </div>
          )}
        </div>
      </div>

      {/* Items */}
      <div className="bg-white dark:bg-[#1E1E1E] rounded-2xl border border-gray-100 dark:border-[#2E2E2E] p-6 mb-5">
        <h3 className="font-bold text-gray-900 dark:text-gray-100 font-arabic mb-4">المنتجات</h3>
        <div className="space-y-4">
          {order.items?.map((item) => (
            <div key={item.id} className="flex items-center gap-4 py-3 border-b border-gray-100 dark:border-[#2E2E2E] last:border-0">
              <div className="w-14 h-14 bg-gray-50 dark:bg-[#1A1A1A] rounded-xl flex items-center justify-center shrink-0">
                <Package className="w-6 h-6 text-gray-300 dark:text-gray-600" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-gray-800 dark:text-gray-200 font-arabic text-sm">{item.product_name}</p>
                <p className="text-xs text-gray-400 dark:text-gray-500 font-arabic mt-0.5">الكمية: {item.quantity}</p>
              </div>
              <div className="text-left">
                <p className="font-bold text-gray-800 dark:text-gray-200 font-mono text-sm">{Number(item.subtotal).toLocaleString('ar-DZ')} دج</p>
                <p className="text-xs text-gray-400 dark:text-gray-500 font-mono">{Number(item.product_price).toLocaleString('ar-DZ')} × {item.quantity}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Totals */}
        <div className="border-t border-gray-100 dark:border-[#2E2E2E] pt-4 mt-2 space-y-2">
          <div className="flex justify-between text-sm font-arabic">
            <span className="text-gray-500 dark:text-gray-400">المجموع الفرعي</span>
            <span className="font-mono text-gray-800 dark:text-gray-200">{Number(order.subtotal).toLocaleString('ar-DZ')} دج</span>
          </div>
          <div className="flex justify-between text-sm font-arabic">
            <span className="text-gray-500 dark:text-gray-400">الشحن</span>
            <span className={`font-mono ${Number(order.shipping_cost) === 0 ? 'text-green-600 dark:text-green-500' : 'text-gray-800 dark:text-gray-200'}`}>
              {Number(order.shipping_cost) === 0 ? 'مجاني' : `${Number(order.shipping_cost).toLocaleString('ar-DZ')} دج`}
            </span>
          </div>
          {Number(order.discount) > 0 && (
            <div className="flex justify-between text-sm font-arabic">
              <span className="text-gray-500 dark:text-gray-400">الخصم</span>
              <span className="text-green-600 dark:text-green-500 font-mono">-{Number(order.discount).toLocaleString('ar-DZ')} دج</span>
            </div>
          )}
          <div className="flex justify-between font-bold font-arabic border-t border-gray-100 dark:border-[#2E2E2E] pt-2">
            <span className="text-gray-900 dark:text-gray-100">الإجمالي</span>
            <span className="text-primary-600 font-mono text-lg">{Number(order.total_amount).toLocaleString('ar-DZ')} دج</span>
          </div>
        </div>
      </div>

      {/* Shipping info */}
      <div className="bg-white dark:bg-[#1E1E1E] rounded-2xl border border-gray-100 dark:border-[#2E2E2E] p-6">
        <h3 className="font-bold text-gray-900 dark:text-gray-100 font-arabic mb-4">معلومات التوصيل</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
          {[
            { label: 'المستلم', value: order.full_name },
            { label: 'الهاتف', value: order.phone, mono: true },
            { label: 'البريد الإلكتروني', value: order.email },
            { label: 'الولاية', value: order.wilaya },
            { label: 'البلدية', value: order.baladia },
            { label: 'العنوان', value: order.address },
          ].map((f) => f.value && (
            <div key={f.label}>
              <span className="text-gray-400 dark:text-gray-500 font-arabic block mb-0.5">{f.label}</span>
              <span className={`font-medium text-gray-800 dark:text-gray-200 ${f.mono ? 'font-mono' : 'font-arabic'}`}>{f.value}</span>
            </div>
          ))}
          {order.notes && (
            <div className="sm:col-span-2">
              <span className="text-gray-400 dark:text-gray-500 font-arabic block mb-0.5">ملاحظات</span>
              <span className="font-arabic text-gray-700 dark:text-gray-300">{order.notes}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
