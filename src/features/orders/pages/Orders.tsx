import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Package, ChevronLeft } from 'lucide-react';
import { ordersApi } from '@shared/services/api';
import type { Order } from '@shared/types';

const statusLabels: Record<string, { label: string; color: string }> = {
  pending: { label: 'قيد الانتظار', color: 'bg-yellow-100 text-yellow-700' },
  confirmed: { label: 'تم التأكيد', color: 'bg-blue-100 text-blue-700' },
  processing: { label: 'جاري التجهيز', color: 'bg-purple-100 text-purple-700' },
  shipped: { label: 'تم الشحن', color: 'bg-indigo-100 text-indigo-700' },
  delivered: { label: 'تم التسليم', color: 'bg-green-100 text-green-700' },
  cancelled: { label: 'ملغى', color: 'bg-red-100 text-red-700' },
  returned: { label: 'مُرجَع', color: 'bg-gray-100 text-gray-700' },
};

export default function Orders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    ordersApi.list().then((res) => {
      setOrders(res.data.results ?? res.data);
    }).finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-10 space-y-4">
        {[...Array(3)].map((_, i) => <div key={i} className="h-28 bg-gray-100 dark:bg-gray-800 rounded-2xl animate-pulse" />)}
      </div>
    );
  }

  if (!orders.length) {
    return (
      <div className="max-w-lg mx-auto px-4 py-20 text-center">
        <div className="w-24 h-24 bg-gray-100 dark:bg-gray-800 rounded-3xl flex items-center justify-center mx-auto mb-6">
          <Package className="w-12 h-12 text-gray-300" />
        </div>
        <h2 className="text-xl font-bold text-gray-800 dark:text-gray-200 font-arabic mb-2">لا توجد طلبات</h2>
        <p className="text-gray-500 dark:text-gray-400 font-arabic mb-8">لم تقدّم أي طلبات بعد</p>
        <Link to="/products" className="inline-flex items-center gap-2 px-6 py-3 bg-primary-400 text-white rounded-xl font-arabic hover:bg-primary-500 transition-colors">
          تسوّق الآن
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 font-arabic mb-8">طلباتي</h1>
      <div className="space-y-4">
        {orders.map((order) => {
          const status = statusLabels[order.status] ?? { label: order.status, color: 'bg-gray-100 text-gray-700' };
          return (
            <div key={order.id} className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 hover:border-primary-200 hover:shadow-md transition-all">
              <Link
                to={`/orders/${order.id}`}
                className="block p-5"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400 font-arabic">
                      طلب #{order.order_number}
                    </p>
                    <p className="font-bold text-gray-900 dark:text-gray-100 font-arabic mt-1">
                      {Number(order.total_amount).toLocaleString('ar-DZ')} دج
                    </p>
                    <p className="text-xs text-gray-400 dark:text-gray-500 font-arabic mt-1">
                      {new Date(order.created_at).toLocaleDateString('ar-DZ', { year: 'numeric', month: 'long', day: 'numeric' })}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium font-arabic ${status.color}`}>
                      {status.label}
                    </span>
                    <ChevronLeft className="w-4 h-4 text-gray-400 dark:text-gray-500" />
                  </div>
                </div>
                {order.items?.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-gray-50 dark:border-gray-800">
                    <p className="text-xs text-gray-400 dark:text-gray-500 font-arabic">
                      {order.items.length} منتج
                      {order.items[0]?.product_name && ` · ${order.items[0].product_name}`}
                      {order.items.length > 1 && ` وآخرون`}
                    </p>
                  </div>
                )}
              </Link>
              
              {/* Quick Actions */}
              <div className="px-5 pb-5 flex gap-3">
                {order.status !== 'delivered' && order.status !== 'cancelled' ? (
                  <>
                    <button
                      onClick={async (e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        try {
                          await ordersApi.confirmReceipt(order.id);
                          alert('تم إرسال إشعار استلام الطلب إلى البائعين.');
                        } catch {
                          alert('حدث خطأ أثناء إرسال الإشعار.');
                        }
                      }}
                      className="flex-1 px-3 py-2.5 bg-primary-50 text-primary-600 border border-primary-100 rounded-xl text-xs font-arabic font-bold hover:bg-primary-100 transition-all"
                    >
                      تأكيد الاستلام
                    </button>
                    <Link
                      to={`/orders/${order.id}`}
                      onClick={(e) => e.stopPropagation()}
                      className="flex-1 px-3 py-2.5 bg-gray-50 text-gray-600 border border-gray-100 rounded-xl text-xs font-arabic font-bold hover:bg-gray-100 transition-all flex items-center justify-center"
                    >
                      تتبع الطلبية
                    </Link>
                  </>
                ) : order.status === 'delivered' ? (
                  <>
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        window.location.href = `/orders/${order.id}/review`;
                      }}
                      className="flex-1 px-3 py-2.5 bg-yellow-50 text-yellow-600 border border-yellow-100 rounded-xl text-xs font-arabic font-bold hover:bg-yellow-100 transition-all flex items-center justify-center"
                    >
                      التقييم
                    </button>
                    <Link
                      to={`/orders/${order.id}`}
                      onClick={(e) => e.stopPropagation()}
                      className="flex-1 px-3 py-2.5 bg-gray-50 text-gray-600 border border-gray-100 rounded-xl text-xs font-arabic font-bold hover:bg-gray-100 transition-all flex items-center justify-center"
                    >
                      تتبع الطلبية
                    </Link>
                  </>
                ) : null}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
