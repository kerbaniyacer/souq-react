import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { BarChart2, Monitor, Star, Package, TrendingUp, Eye } from 'lucide-react';
import axios from 'axios';
import { useAuthStore } from '@/stores/authStore';
import type { Product, Order } from '@/types';

const DB = '/db';

const STATUS_MAP: Record<string, { label: string; className: string }> = {
  shipped:    { label: 'تم الشحن',     className: 'bg-blue-500/20 text-blue-400' },
  processing: { label: 'قيد المعالجة', className: 'bg-amber-500/20 text-amber-400' },
  delivered:  { label: 'تم التوصيل',   className: 'bg-green-500/20 text-green-400' },
  pending:    { label: 'قيد الانتظار', className: 'bg-orange-500/20 text-orange-400' },
  on_hold:    { label: 'معلّق',         className: 'bg-orange-500/20 text-orange-400' },
};

function formatDate(dateStr: string) {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const yyyy = d.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
}

export default function MerchantDashboard() {
  const { user } = useAuthStore();
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const sellerId = user?.id;
    Promise.all([
      axios.get(`${DB}/products`),
      axios.get(`${DB}/orders`),
    ])
      .then(([pRes, oRes]) => {
        const allProducts: any[] = pRes.data;
        setProducts(
          allProducts.filter(
            (p) =>
              String(p.seller_id) === String(sellerId) ||
              String(p.seller?.id) === String(sellerId)
          ) as Product[]
        );
        const allOrders: any[] = oRes.data;
        setOrders(
          allOrders.filter((o) =>
            (o.items ?? []).some(
              (item: any) => String(item.seller_id) === String(sellerId)
            )
          ) as Order[]
        );
      })
      .finally(() => setLoading(false));
  }, [user?.id]);

  const totalRevenue = orders.reduce((s, o) => s + Number(o.total_amount), 0);
  const activeProducts = products.filter((p) => p.is_active).length;

  const ratedProducts = products.filter((p) => p.rating && p.rating > 0);
  const avgRating =
    ratedProducts.length > 0
      ? (ratedProducts.reduce((s, p) => s + Number(p.rating), 0) / ratedProducts.length).toFixed(1)
      : '4.7';

  const stats = [
    {
      label: 'إجمالي المبيعات',
      value: `${totalRevenue.toLocaleString('ar-DZ')} دج`,
      badge: '+12.5%',
      badgeColor: 'bg-green-500/20 text-green-400',
      icon: <BarChart2 className="w-5 h-5 text-blue-400" />,
      iconBg: 'bg-blue-500/20',
    },
    {
      label: 'إجمالي الطلبات',
      value: orders.length,
      badge: '+8.2%',
      badgeColor: 'bg-green-500/20 text-green-400',
      icon: <Package className="w-5 h-5 text-orange-400" />,
      iconBg: 'bg-orange-500/20',
    },
    {
      label: 'المنتجات النشطة',
      value: activeProducts,
      badge: '+3',
      badgeColor: 'bg-green-500/20 text-green-400',
      icon: <Monitor className="w-5 h-5 text-teal-400" />,
      iconBg: 'bg-teal-500/20',
    },
    {
      label: 'متوسط التقييم',
      value: avgRating,
      badge: '-0.3',
      badgeColor: 'bg-red-500/20 text-red-400',
      icon: <Star className="w-5 h-5 text-yellow-400" />,
      iconBg: 'bg-yellow-500/20',
    },
  ];

  const lastOrders = [...orders].slice(0, 5);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0F0F0F] font-arabic" dir="rtl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">

        {/* Header */}
        <div className="flex flex-col items-center text-center mb-10 gap-3">
          <span className="px-4 py-1 rounded-full text-xs font-semibold bg-primary-400/15 text-primary-300 border border-primary-400/20">
            لوحة التاجر
          </span>
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-gray-100">
            لوحة التحكم
          </h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm">
            إدارة متجرك ومتابعة أداء المبيعات
          </p>

          {/* Quick actions */}
          <div className="flex gap-3 mt-2">
            <Link
              to="/merchant/products/add"
              className="flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-semibold text-white transition-all hover:-translate-y-0.5"
              style={{ background: 'linear-gradient(135deg, #5C8A6E, #7AA88C)' }}
            >
              <TrendingUp className="w-4 h-4" />
              منتج جديد
            </Link>
            <Link
              to="/merchant/orders"
              className="flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-semibold bg-white dark:bg-[#1A1A1A] border border-gray-200 dark:border-[#2E2E2E] text-gray-700 dark:text-gray-300 hover:border-primary-400/40 transition-all"
            >
              <Eye className="w-4 h-4" />
              عرض الطلبات
            </Link>
          </div>
        </div>

        {/* Stat cards */}
        {loading ? (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-36 bg-gray-200 dark:bg-[#1A1A1A] rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
            {stats.map((stat) => (
              <div
                key={stat.label}
                className="bg-white dark:bg-[#1A1A1A] rounded-2xl p-6 relative flex flex-col gap-3"
              >
                {/* Badge top-left (RTL: visual left = DOM left) */}
                <div className="absolute top-4 left-4">
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${stat.badgeColor}`}>
                    {stat.badge}
                  </span>
                </div>

                {/* Icon top-right */}
                <div className="flex justify-end">
                  <div className={`w-11 h-11 rounded-full flex items-center justify-center ${stat.iconBg}`}>
                    {stat.icon}
                  </div>
                </div>

                {/* Value */}
                <div className="text-2xl font-bold text-gray-900 dark:text-gray-100 font-mono text-right leading-none">
                  {stat.value}
                </div>

                {/* Label */}
                <div className="text-xs text-gray-500 dark:text-gray-400 text-right">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Orders table */}
        <div className="bg-white dark:bg-[#1A1A1A] rounded-2xl overflow-hidden">
          <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100 dark:border-[#2E2E2E]">
            <h3 className="font-bold text-gray-900 dark:text-gray-100 text-base">آخر الطلبات</h3>
            <Link
              to="/merchant/orders"
              className="text-sm text-primary-300 hover:text-primary-400 transition-colors"
            >
              عرض الكل
            </Link>
          </div>

          {loading ? (
            <div className="p-6 space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-12 bg-gray-100 dark:bg-[#252525] rounded-xl animate-pulse" />
              ))}
            </div>
          ) : lastOrders.length === 0 ? (
            <p className="text-center py-12 text-gray-400 text-sm">لا توجد طلبات بعد</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm" style={{ direction: 'rtl' }}>
                <thead>
                  <tr className="border-b border-gray-100 dark:border-[#2E2E2E]">
                    {['رقم الطلب', 'العميل', 'المبلغ', 'الحالة', 'التاريخ'].map((h) => (
                      <th
                        key={h}
                        className="px-6 py-3 text-right text-xs font-medium text-gray-400 dark:text-gray-500 whitespace-nowrap"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-[#2E2E2E]">
                  {lastOrders.map((o) => {
                    const st = STATUS_MAP[o.status] ?? { label: o.status, className: 'bg-gray-500/20 text-gray-400' };
                    return (
                      <tr
                        key={o.id}
                        className="hover:bg-gray-50 dark:hover:bg-[#222222] transition-colors"
                      >
                        <td className="px-6 py-4 font-mono text-gray-900 dark:text-gray-100 whitespace-nowrap">
                          #{o.order_number}
                        </td>
                        <td className="px-6 py-4 text-gray-700 dark:text-gray-300 whitespace-nowrap">
                          {o.full_name}
                        </td>
                        <td className="px-6 py-4 font-mono font-semibold text-primary-300 whitespace-nowrap">
                          {Number(o.total_amount).toLocaleString('ar-DZ')} دج
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${st.className}`}>
                            {st.label}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-gray-500 dark:text-gray-400 whitespace-nowrap font-mono text-xs">
                          {formatDate((o as any).created_at ?? (o as any).date ?? '')}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
