import { Link } from 'react-router-dom';
import { Package, TrendingUp, Eye, ShoppingBag, DollarSign, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { useMerchantStats, useMerchantOrders } from '../hooks/useMerchantData';
import { XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';

const STATUS_MAP: Record<string, { label: string; className: string }> = {
  shipped:    { label: 'تم الشحن',     className: 'bg-blue-500/10 text-blue-500 border border-blue-500/20' },
  processing: { label: 'قيد المعالجة', className: 'bg-amber-500/10 text-amber-500 border border-amber-500/20' },
  delivered:  { label: 'تم التوصيل',   className: 'bg-green-500/10 text-green-500 border border-green-500/20' },
  pending:    { label: 'قيد الانتظار', className: 'bg-orange-500/10 text-orange-500 border border-orange-500/20' },
  confirmed:  { label: 'مؤكّد',         className: 'bg-primary-500/10 text-primary-500 border border-primary-500/20' },
};

function formatDate(dateStr: string) {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  return d.toLocaleDateString('ar-DZ', { day: '2-digit', month: '2-digit' });
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white dark:bg-[#1A1A1A] p-4 border border-gray-100 dark:border-gray-800 rounded-2xl shadow-xl">
        <p className="text-xs text-gray-500 dark:text-gray-400 font-mono mb-1">{label}</p>
        <p className="text-sm font-bold text-primary-400">
          {Number(payload[0].value).toLocaleString('ar-DZ')} دج
        </p>
      </div>
    );
  }
  return null;
};

export default function MerchantDashboard() {
  const { data: stats, isLoading: statsLoading } = useMerchantStats();
  const { data: orders, isLoading: ordersLoading } = useMerchantOrders();

  const loading = statsLoading || ordersLoading;

  const kpis = [
    {
      label: 'إجمالي المبيعات',
      value: stats?.revenue ?? 0,
      format: (v: number) => `${v.toLocaleString('ar-DZ')} دج`,
      icon: <DollarSign className="w-5 h-5" />,
      color: 'text-emerald-500',
      bg: 'bg-emerald-500/10',
      trend: '+12%',
      isUp: true
    },
    {
      label: 'إجمالي الطلبات',
      value: stats?.orders_count ?? 0,
      format: (v: number) => v.toString(),
      icon: <ShoppingBag className="w-5 h-5" />,
      color: 'text-blue-500',
      bg: 'bg-blue-500/10',
      trend: '+5%',
      isUp: true
    },
    {
      label: 'المنتجات النشطة',
      value: stats?.products_count ?? 0,
      format: (v: number) => v.toString(),
      icon: <Package className="w-5 h-5" />,
      color: 'text-purple-500',
      bg: 'bg-purple-500/10',
      trend: '0%',
      isUp: true
    }
  ];

  const lastOrders = orders?.slice(0, 5) ?? [];

  return (
    <div className="min-h-screen bg-[#FDFCFB] dark:bg-[#0A0A0A] font-arabic" dir="rtl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="w-2 h-2 bg-primary-400 rounded-full animate-pulse" />
              <span className="text-xs font-bold text-primary-400 uppercase tracking-widest">متصل الآن - لوحة التاجر</span>
            </div>
            <h1 className="text-3xl font-black text-gray-900 dark:text-gray-100 tracking-tight">مرحباً بك مجدداً! 👋</h1>
            <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">إليك نظرة سريعة على أداء متجرك اليوم.</p>
          </div>
          
          <div className="flex items-center gap-3">
             <Link to="/merchant/products/add" 
               className="group flex items-center gap-2 px-6 py-3.5 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-2xl text-sm font-bold transition-all hover:scale-[1.02] active:scale-[0.98] shadow-xl shadow-gray-200 dark:shadow-none">
               <TrendingUp className="w-4 h-4 group-hover:rotate-12 transition-transform" />
               إضافة منتج جديد
             </Link>
             <Link to="/merchant/orders" 
               className="flex items-center gap-2 px-6 py-3.5 bg-white dark:bg-[#1A1A1A] border border-gray-100 dark:border-gray-800 text-gray-700 dark:text-gray-300 rounded-2xl text-sm font-bold hover:bg-gray-50 dark:hover:bg-[#222222] transition-all">
               <Eye className="w-4 h-4" />
               الطلبات
             </Link>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {loading ? (
            [...Array(3)].map((_, i) => (
              <div key={i} className="h-32 bg-white dark:bg-[#1A1A1A] rounded-[2rem] border border-gray-50 dark:border-gray-800 animate-pulse" />
            ))
          ) : (
            kpis.map((kpi) => (
              <div key={kpi.label} className="group bg-white dark:bg-[#1A1A1A] rounded-[2rem] p-6 border border-gray-50 dark:border-gray-800 shadow-sm hover:shadow-xl hover:shadow-primary-400/5 transition-all duration-500">
                <div className="flex items-center justify-between mb-4">
                  <div className={`w-12 h-12 ${kpi.bg} ${kpi.color} rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110 duration-500`}>
                    {kpi.icon}
                  </div>
                  <div className={`flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-lg ${kpi.isUp ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
                    {kpi.isUp ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
                    {kpi.trend}
                  </div>
                </div>
                <div className="text-2xl font-black text-gray-900 dark:text-gray-100 font-mono mb-1">
                  {kpi.format(kpi.value)}
                </div>
                <div className="text-xs text-gray-400 font-arabic">{kpi.label}</div>
              </div>
            ))
          )}
        </div>

        {/* Charts & Table Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Main Chart */}
          <div className="lg:col-span-2 bg-white dark:bg-[#1A1A1A] rounded-[2.5rem] p-8 border border-gray-50 dark:border-gray-800 shadow-sm">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 font-arabic">إحصائيات المبيعات</h3>
                <p className="text-xs text-gray-400 font-arabic mt-1">تطور الإيرادات خلال الفترة الأخيرة</p>
              </div>
              <select className="bg-gray-50 dark:bg-[#252525] border-none text-xs font-bold font-arabic rounded-xl px-4 py-2 outline-none">
                <option>آخر 7 أيام</option>
                <option>آخر 30 يوم</option>
              </select>
            </div>

            <div className="h-[300px] w-full">
              {loading ? (
                <div className="w-full h-full bg-gray-50 dark:bg-[#151515] rounded-2xl animate-pulse" />
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={stats?.sales_history ?? []}>
                    <defs>
                      <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#5C8A6E" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#5C8A6E" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#88888810" />
                    <XAxis 
                      dataKey="date" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fontSize: 10, fill: '#888' }}
                      tickFormatter={formatDate}
                    />
                    <YAxis hide />
                    <Tooltip content={<CustomTooltip />} />
                    <Area 
                      type="monotone" 
                      dataKey="revenue" 
                      stroke="#5C8A6E" 
                      strokeWidth={3}
                      fillOpacity={1} 
                      fill="url(#colorRev)" 
                    />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* Side Panel: Top Products or Recent Activity */}
          <div className="bg-white dark:bg-[#1A1A1A] rounded-[2.5rem] p-8 border border-gray-50 dark:border-gray-800 shadow-sm">
            <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 font-arabic mb-6">الأكثر مبيعاً</h3>
            <div className="space-y-6">
              {loading ? (
                [...Array(4)].map((_, i) => (
                  <div key={i} className="flex items-center gap-4 animate-pulse">
                    <div className="w-12 h-12 bg-gray-100 dark:bg-gray-800 rounded-xl" />
                    <div className="flex-1 space-y-2">
                      <div className="h-3 bg-gray-100 dark:bg-gray-800 rounded w-3/4" />
                      <div className="h-2 bg-gray-50 dark:bg-gray-800/50 rounded w-1/2" />
                    </div>
                  </div>
                ))
              ) : stats?.top_products?.length === 0 ? (
                <p className="text-center py-10 text-gray-400 text-sm font-arabic">لا توجد بيانات كافية</p>
              ) : (
                stats?.top_products?.map((product) => (
                  <div key={product.id} className="flex items-center gap-4 group cursor-pointer">
                    <div className="w-12 h-12 bg-primary-50 dark:bg-primary-900/10 rounded-xl flex items-center justify-center text-primary-500 font-bold text-xs transition-transform group-hover:scale-110">
                      {product.name[0].toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-gray-900 dark:text-gray-100 truncate font-arabic">{product.name}</p>
                      <p className="text-[10px] text-gray-400 mt-0.5">{product.sales} مبيعات</p>
                    </div>
                    <div className="text-sm font-bold text-primary-400 font-mono">
                      {product.revenue.toLocaleString('ar-DZ')}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Recent Orders Table */}
          <div className="lg:col-span-3 bg-white dark:bg-[#1A1A1A] rounded-[2.5rem] border border-gray-50 dark:border-gray-800 shadow-sm overflow-hidden">
            <div className="px-8 py-6 border-b border-gray-50 dark:border-gray-800 flex items-center justify-between">
              <h3 className="font-bold text-gray-900 dark:text-gray-100 text-lg font-arabic">أحدث الطلبات</h3>
              <Link to="/merchant/orders" className="text-sm font-bold text-primary-400 hover:text-primary-500 transition-colors flex items-center gap-1">
                عرض كل الطلبات
                <ArrowUpRight size={14} />
              </Link>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-right">
                <thead>
                  <tr className="bg-gray-50/50 dark:bg-[#1F1F1F]">
                    {['المعرف', 'العميل', 'المبلغ', 'الحالة', 'التاريخ'].map((h) => (
                      <th key={h} className="px-8 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider font-arabic">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
                  {loading ? (
                    [...Array(3)].map((_, i) => (
                      <tr key={i} className="animate-pulse">
                        <td colSpan={5} className="px-8 py-6 h-16 bg-gray-50/20" />
                      </tr>
                    ))
                  ) : lastOrders.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-20 text-center text-gray-400 font-arabic">لا توجد طلبات حالياً</td>
                    </tr>
                  ) : (
                    lastOrders.map((order) => {
                      const st = STATUS_MAP[order.status] ?? { label: order.status, className: 'bg-gray-100 text-gray-500' };
                      return (
                        <tr key={order.id} className="hover:bg-gray-50/50 dark:hover:bg-[#222222] transition-colors group">
                          <td className="px-8 py-6">
                            <span className="text-sm font-bold text-gray-900 dark:text-gray-100 font-mono">#{order.order_number}</span>
                          </td>
                          <td className="px-8 py-6">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center text-[10px] font-bold">
                                {order.full_name[0]}
                              </div>
                              <span className="text-sm font-medium text-gray-700 dark:text-gray-300 font-arabic">{order.full_name}</span>
                            </div>
                          </td>
                          <td className="px-8 py-6">
                            <span className="text-sm font-black text-gray-900 dark:text-gray-100 font-mono">
                              {Number(order.total_amount).toLocaleString('ar-DZ')} دج
                            </span>
                          </td>
                          <td className="px-8 py-6">
                            <span className={`px-3 py-1 rounded-full text-[10px] font-bold font-arabic ${st.className}`}>
                              {st.label}
                            </span>
                          </td>
                          <td className="px-8 py-6 text-xs text-gray-400 font-mono">
                            {formatDate((order as any).created_at)}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
