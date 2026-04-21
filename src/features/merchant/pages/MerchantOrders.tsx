import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, Package } from 'lucide-react';
import { useToast } from '@shared/stores/toastStore';
import { ordersApi } from '@shared/services/api';
import type { Order, OrderStatus } from '@shared/types';

const statusConfig: Record<string, { label: string; color: string; next?: OrderStatus }> = {
  pending:    { label: 'معلّق',         color: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400',  next: 'confirmed' },
  confirmed:  { label: 'مؤكّد',         color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400',      next: 'processing' },
  processing: { label: 'جاري التجهيز',  color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/20 dark:text-purple-400',  next: 'shipped' },
  shipped:    { label: 'تم الشحن',       color: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/20 dark:text-indigo-400',  next: 'delivered' },
  delivered:  { label: 'تم التسليم',     color: 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400' },
  cancelled:  { label: 'ملغى',           color: 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400' },
  returned:   { label: 'مُرجَع',          color: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400' },
};

export default function MerchantOrders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [updating, setUpdating] = useState<string | null>(null);
  const toast = useToast();

  useEffect(() => {
    ordersApi.merchantList()
      .then((res) => setOrders(res.data as Order[]))
      .catch(() => toast.error('تعذّر تحميل الطلبات'))
      .finally(() => setLoading(false));
  }, []);

  const handleNextStatus = async (order: Order) => {
    const nextStatus = statusConfig[order.status]?.next;
    if (!nextStatus) return;
    setUpdating(String(order.id));
    try {
      await ordersApi.updateStatus(order.id, nextStatus);
      setOrders((prev) => prev.map((o) =>
        String(o.id) === String(order.id) ? { ...o, status: nextStatus } : o
      ));
      toast.success(`تم تحديث الحالة إلى: ${statusConfig[nextStatus].label}`);
    } catch {
      toast.error('تعذّر تحديث الحالة');
    } finally {
      setUpdating(null);
    }
  };

  const handleCancel = async (order: Order) => {
    if (!confirm('هل أنت متأكد من إلغاء هذا الطلب؟')) return;
    setUpdating(String(order.id));
    try {
      await ordersApi.updateStatus(order.id, 'cancelled');
      setOrders((prev) => prev.map((o) =>
        String(o.id) === String(order.id) ? { ...o, status: 'cancelled' } : o
      ));
      toast.success('تم إلغاء الطلب');
    } catch {
      toast.error('تعذّر إلغاء الطلب');
    } finally {
      setUpdating(null);
    }
  };

  const filtered = statusFilter === 'all' ? orders : orders.filter((o) => o.status === statusFilter);

  const counts = Object.fromEntries(
    Object.keys(statusConfig).map((s) => [s, orders.filter((o) => o.status === s).length])
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 font-arabic">إدارة الطلبات</h1>
          <p className="text-gray-500 dark:text-gray-400 font-arabic text-sm mt-1">{orders.length} طلب إجمالي</p>
        </div>
      </div>

      {/* Status filters */}
      <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2 mb-6">
        <button onClick={() => setStatusFilter('all')}
          className={`shrink-0 px-4 py-2 rounded-xl text-sm font-arabic font-medium transition-colors ${
            statusFilter === 'all' ? 'bg-primary-400 text-white' : 'bg-white dark:bg-[#1E1E1E] border border-gray-200 dark:border-[#2E2E2E] text-gray-600 dark:text-gray-400 hover:border-gray-300 dark:hover:border-gray-600'
          }`}>
          الكل ({orders.length})
        </button>
        {Object.entries(statusConfig).map(([key, cfg]) => counts[key] > 0 && (
          <button key={key} onClick={() => setStatusFilter(key)}
            className={`shrink-0 px-4 py-2 rounded-xl text-sm font-arabic font-medium transition-colors ${
              statusFilter === key ? 'bg-primary-400 text-white' : 'bg-white dark:bg-[#1E1E1E] border border-gray-200 dark:border-[#2E2E2E] text-gray-600 dark:text-gray-400 hover:border-gray-300 dark:hover:border-gray-600'
            }`}>
            {cfg.label} ({counts[key]})
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => <div key={i} className="h-24 bg-gray-100 dark:bg-[#252525] rounded-2xl animate-pulse" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20">
          <Package className="w-16 h-16 text-gray-200 dark:text-gray-700 mx-auto mb-4" />
          <p className="text-gray-400 dark:text-gray-500 font-arabic">لا توجد طلبات</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((order) => {
            const cfg = statusConfig[order.status] ?? { label: order.status, color: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400' };
            const isUpdating = updating === String(order.id);
            return (
              <div key={order.id} className="bg-white dark:bg-[#1A1A1A] rounded-2xl border border-gray-100 dark:border-[#2E2E2E] p-5 hover:border-gray-200 dark:hover:border-[#3E3E3E] transition-colors">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 flex-wrap">
                      <span className="font-bold text-gray-900 dark:text-gray-100 font-mono text-sm">#{order.order_number}</span>
                      <span className={`px-2.5 py-1 rounded-full text-xs font-medium font-arabic ${cfg.color}`}>{cfg.label}</span>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 font-arabic mt-1">{order.full_name} · {order.phone}</p>
                    <p className="text-xs text-gray-400 dark:text-gray-500 font-arabic">{order.wilaya}{order.baladia && ` - ${order.baladia}`}</p>
                    {order.items?.length > 0 && (
                      <p className="text-xs text-gray-400 dark:text-gray-500 font-arabic mt-1">
                        {order.items.length} منتج{order.items[0]?.product_name && ` · ${order.items[0].product_name}`}
                      </p>
                    )}
                  </div>
                  <div className="text-left shrink-0">
                    <p className="font-bold text-primary-600 font-mono">{Number(order.total_amount).toLocaleString('ar-DZ')} دج</p>
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{new Date(order.created_at).toLocaleDateString('ar-DZ')}</p>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 mt-4 pt-4 border-t border-gray-100 dark:border-[#2E2E2E] flex-wrap">
                  <Link to={`/merchant/orders/${order.id}`}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-50 dark:bg-[#252525] border border-gray-200 dark:border-[#2E2E2E] text-gray-600 dark:text-gray-400 rounded-lg text-xs font-arabic hover:bg-gray-100 dark:hover:bg-[#2E2E2E] transition-colors">
                    عرض التفاصيل <ChevronLeft className="w-3 h-3" />
                  </Link>

                  {statusConfig[order.status]?.next && (
                    <button onClick={() => handleNextStatus(order)} disabled={isUpdating}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400 border border-primary-200 dark:border-primary-800/40 rounded-lg text-xs font-arabic hover:bg-primary-100 dark:hover:bg-primary-900/30 transition-colors disabled:opacity-50">
                      {isUpdating
                        ? <span className="w-3 h-3 border border-primary-400 border-t-transparent rounded-full animate-spin" />
                        : '✓'
                      }
                      {statusConfig[statusConfig[order.status].next!]?.label}
                    </button>
                  )}

                  {!['cancelled', 'delivered', 'returned'].includes(order.status) && (
                    <button onClick={() => handleCancel(order)} disabled={isUpdating}
                      className="px-3 py-1.5 bg-red-50 dark:bg-red-900/20 text-red-500 dark:text-red-400 border border-red-200 dark:border-red-800/40 rounded-lg text-xs font-arabic hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors disabled:opacity-50">
                      إلغاء
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
