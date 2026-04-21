import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Users, ShoppingBag, Package, TrendingUp, Trash2, Shield, Search, ChevronLeft, Mail, Monitor, Globe, Clock, ShieldCheck, CheckCircle2, AlertCircle, Gavel } from 'lucide-react';
import api from '@souq/services/authService';
import { getLoginHistory } from '@souq/services/ipService';
import { useAuthStore } from '@souq/stores/authStore';
import { useToast } from '@souq/stores/toastStore';
import type { Order } from '@souq/types';

interface AdminUser {
  id: string;
  username: string;
  email: string;
  is_staff: boolean;
  date_joined: string;
  provider?: string;
  photo?: string;
  profile?: { is_seller: boolean };
  status: 'active' | 'suspended';
  suspension_reason?: string;
}

interface AdminProduct {
  id: string;
  name: string;
  slug: string;
  is_active: boolean;
  status: 'active' | 'suspended';
  suspension_reason?: string;
  is_featured: boolean;
  seller_id: string;
  seller?: { id: string; username: string; first_name?: string };
  category?: { name: string };
  variants?: { price: number }[];
}

interface AdminReport {
  id: string;
  reporter: string;
  reporter_name: string;
  report_type: 'product' | 'seller' | 'buyer';
  target_product?: string;
  target_product_name?: string;
  target_product_slug?: string;
  target_user?: string;
  target_user_name?: string;
  reason: string;
  description: string;
  status: string;
  created_at: string;
}

interface AdminLoginRecord {
  id: string;
  ip: string;
  user_agent: string;
  logged_at: string;
  user_id: string;
  username: string;
}

interface AdminActionLogRecord {
  id: number;
  admin_name: string;
  action: 'suspend' | 'restore' | 'delete' | 'permanent_delete';
  target_model: string;
  target_id: string;
  target_name: string;
  reason: string;
  created_at: string;
}

export default function AdminDashboard() {
  const toast = useToast();
  const { user: currentUser } = useAuthStore();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [products, setProducts] = useState<AdminProduct[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [reports, setReports] = useState<AdminReport[]>([]);
  const [loginHistory, setLoginHistory] = useState<AdminLoginRecord[]>([]);
  const [adminLogs, setAdminLogs] = useState<AdminActionLogRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [tab, setTab] = useState<'overview' | 'users' | 'products' | 'orders' | 'reports' | 'appeals' | 'history' | 'actions'>('overview');
  const [search, setSearch] = useState('');
  const [userTypeFilter, setUserTypeFilter] = useState<'all' | 'buyer' | 'seller'>('all');
  const [historyDate, setHistoryDate] = useState(new Date().toLocaleDateString('en-CA'));
  const [actionHistoryDate, setActionHistoryDate] = useState(new Date().toLocaleDateString('en-CA'));
  const [deleting, setDeleting] = useState<string | null>(null);
  const [deleteModal, setDeleteModal] = useState<{ id: string, type: 'user' | 'product', name: string } | null>(null);
  const [viewingReport, setViewingReport] = useState<AdminReport | null>(null);
  const [deleteReason, setDeleteReason] = useState('');

  const fetchData = async () => {
    setLoading(true);
    try {
      const [u, p, o, r] = await Promise.all([
        api.get('/auth/profiles/'),
        api.get('/products/'),
        api.get('/orders/'),
        api.get('/auth/admin/reports/'),
      ]);
      setUsers(u.data.results ?? u.data);
      setProducts(p.data.results ?? p.data);
      setOrders(o.data.results ?? o.data);
      setReports(r.data.results ?? r.data);
    } catch {
      // toast.error('فشل جلب البيانات الأساسية');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (tab === 'history') {
      setHistoryLoading(true);
      getLoginHistory(historyDate).then((data) => {
        setLoginHistory(data);
      }).finally(() => setHistoryLoading(false));
    } else if (tab === 'actions') {
      setLoading(true);
      api.get(`/auth/admin/action-log/?day=${actionHistoryDate}`)
        .then((res) => setAdminLogs(res.data))
        .finally(() => setLoading(false));
    }
  }, [tab, historyDate, actionHistoryDate]);

  const confirmDelete = async () => {
    if (!deleteModal || !deleteReason.trim()) {
        toast.error('يرجى كتابة سبب الإجراء');
        return;
    }
    
    const { id, type } = deleteModal;
    setDeleting(id);
    setDeleteModal(null);
    
    try {
        if (type === 'user') {
            await api.delete(`/auth/users/${id}/delete/`, { data: { reason: deleteReason } });
            toast.success('تم تجميد المستخدم وإعلامه بالسبب');
        } else {
            await api.delete(`/merchant/products/${id}/`, { data: { reason: deleteReason } });
            toast.success('تم تجميد المنتج وإعلام التاجر');
        }
        fetchData();
    } catch {
        toast.error('تعذرت العملية');
    } finally {
        setDeleting(null);
        setDeleteReason('');
    }
  };

  const handleManageAction = async (logId: number, action: 'restore' | 'finalize_delete') => {
    try {
      await api.post(`/auth/admin/manage-action/${logId}/`, { action });
      toast.success(action === 'restore' ? 'تمت الاستعادة بنجاح' : 'تم الحذف النهائي');
      if (tab === 'actions') {
        const res = await api.get('/auth/admin/action-log/');
        setAdminLogs(res.data);
      }
      fetchData();
    } catch {
      toast.error('فشلت العملية');
    }
  };

  const handleDeleteUser = (user: AdminUser) => {
    setDeleteReason('');
    setDeleteModal({ id: user.id, type: 'user', name: user.username });
  };

  const handleDeleteProduct = (product: AdminProduct) => {
    setDeleteReason('');
    setDeleteModal({ id: product.id, type: 'product', name: product.name });
  };

  const handleToggleProductStatus = async (product: AdminProduct) => {
    try {
      await api.patch(`/merchant/products/${product.id}/`, { is_active: !product.is_active });
      setProducts((p) => p.map((x) => x.id === product.id ? { ...x, is_active: !x.is_active } : x));
      toast.success(product.is_active ? 'تم إخفاء المنتج' : 'تم تفعيل المنتج');
    } catch {
      toast.error('حدث خطأ');
    }
  };

  const filteredUsers = users.filter((u) => {
    const matchesSearch = 
      u.username.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase());
    
    const matchesType = 
       userTypeFilter === 'all' ||
       (userTypeFilter === 'seller' && u.profile?.is_seller) ||
       (userTypeFilter === 'buyer' && !u.profile?.is_seller);

    return matchesSearch && matchesType;
  });

  const filteredProducts = products.filter((p) => p.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8 bg-white dark:bg-[#1A1A1A] p-6 rounded-3xl border border-gray-100 dark:border-[#2E2E2E] shadow-sm">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-gradient-to-br from-primary-500 to-primary-700 rounded-2xl flex items-center justify-center shadow-lg shadow-primary-500/20">
            <Shield className="w-7 h-7 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-gray-900 dark:text-gray-100 font-arabic tracking-tight">لوحة التحكم الإدارية</h1>
            <p className="text-gray-500 dark:text-gray-400 font-arabic text-sm mt-0.5">نظام المراقبة والتدقيق والمراجعة</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => setTab('actions')} className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl text-sm font-arabic font-bold transition-all ${tab === 'actions' ? 'bg-primary-600 text-white shadow-lg shadow-primary-600/30' : 'bg-gray-50 dark:bg-[#252525] text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-[#2E2E2E]'}`}>
            <Clock className="w-4 h-4" />
            سجل العمليات
          </button>
          <Link to="/admin/appeals" className="flex items-center gap-2 px-5 py-2.5 bg-amber-50 dark:bg-amber-900/10 text-amber-600 rounded-2xl hover:bg-amber-100 dark:hover:bg-amber-900/20 transition-all text-sm font-arabic font-bold border border-amber-100 dark:border-amber-900/10">
            <Gavel className="w-4 h-4" />
            إدارة الطعون
          </Link>
          <Link to="/admin/emails" className="flex items-center gap-2 px-5 py-2.5 bg-gray-50 dark:bg-[#252525] text-gray-600 dark:text-gray-400 rounded-2xl hover:bg-gray-100 dark:hover:bg-[#2E2E2E] transition-all text-sm font-arabic font-bold">
            <Mail className="w-4 h-4" />
            قوالب البريد
          </Link>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 bg-gray-100 dark:bg-[#252525] rounded-2xl p-1.5 mb-8 w-fit overflow-x-auto no-scrollbar max-w-full">
        {(['overview', 'users', 'products', 'orders', 'reports', 'appeals', 'history', 'actions'] as const).map((t) => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-5 py-2.5 rounded-xl text-sm font-arabic font-bold transition-all whitespace-nowrap ${tab === t ? 'bg-white dark:bg-[#1E1E1E] text-primary-600 dark:text-primary-400 shadow-sm' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}>
            {t === 'overview' ? 'نظرة عامة' : t === 'users' ? 'المستخدمون' : t === 'products' ? 'المنتجات' : t === 'orders' ? 'الطلبات' : t === 'reports' ? 'البلاغات' : t === 'appeals' ? 'الطعون' : t === 'history' ? 'سجل الدخول' : 'العمليات'}
          </button>
        ))}
      </div>

      {(tab === 'users' || tab === 'products' || tab === 'history' || tab === 'actions') && (
        <div className="flex flex-col sm:flex-row gap-4 mb-8">
            {(tab === 'users' || tab === 'products') && (
                <div className="relative flex-1">
                  <input value={search} onChange={(e) => setSearch(e.target.value)}
                    placeholder="ابحث هنا..."
                    className="w-full pr-12 pl-4 py-3.5 bg-white dark:bg-[#1A1A1A] border border-gray-100 dark:border-[#2E2E2E] text-gray-900 dark:text-gray-100 rounded-2xl focus:outline-none focus:ring-4 focus:ring-primary-500/5 font-arabic transition-all" />
                  <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                </div>
            )}
            {tab === 'users' && (
              <select value={userTypeFilter} onChange={(e) => setUserTypeFilter(e.target.value as any)}
                className="px-6 py-3.5 bg-white dark:bg-[#1A1A1A] border border-gray-100 dark:border-[#2E2E2E] text-gray-900 dark:text-gray-100 rounded-2xl focus:outline-none focus:ring-4 focus:ring-primary-500/5 font-arabic font-bold outline-none">
                <option value="all">الكل</option>
                <option value="buyer">المشترون</option>
                <option value="seller">التجار</option>
              </select>
            )}
            {(tab === 'history' || tab === 'actions') && (
               <input type="date" value={tab === 'history' ? historyDate : actionHistoryDate} 
                onChange={(e) => tab === 'history' ? setHistoryDate(e.target.value) : setActionHistoryDate(e.target.value)}
                className="px-6 py-3.5 bg-white dark:bg-[#1A1A1A] border border-gray-100 dark:border-[#2E2E2E] text-gray-900 dark:text-gray-100 rounded-2xl focus:outline-none focus:ring-4 focus:ring-primary-500/5 font-arabic outline-none" />
            )}
        </div>
      )}

      {/* Main Content Areas */}
      {loading ? (
        <div className="grid grid-cols-1 gap-6">
          {[...Array(4)].map((_, i) => <div key={i} className="h-32 bg-gray-100 dark:bg-[#1A1A1A] rounded-3xl animate-pulse" />)}
        </div>
      ) : (
        <>
          {/* Overview */}
          {tab === 'overview' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="bg-white dark:bg-[#1A1A1A] rounded-3xl border border-gray-100 dark:border-[#2E2E2E] p-8">
                <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 font-arabic mb-6 flex items-center gap-2">
                  <Package className="w-5 h-5 text-primary-500" />
                  آخر الطلبات
                </h3>
                <div className="space-y-4">
                  {orders.slice(0, 5).map((o) => (
                    <div key={o.id} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-[#252525] rounded-2xl border border-gray-100/50 dark:border-[#2E2E2E]/50">
                      <div>
                        <p className="text-sm font-bold text-gray-900 dark:text-gray-100 font-mono">#{o.order_number}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 font-arabic mt-0.5">{o.full_name}</p>
                      </div>
                      <span className={`text-[10px] px-3 py-1 rounded-full font-arabic font-bold ${
                        o.status === 'delivered' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                      }`}>{o.status}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white dark:bg-[#1A1A1A] rounded-3xl border border-gray-100 dark:border-[#2E2E2E] p-8">
                <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 font-arabic mb-6 flex items-center gap-2">
                  <Users className="w-5 h-5 text-primary-500" />
                  أعضاء جدد
                </h3>
                <div className="space-y-4">
                  {users.slice(-5).reverse().map((u) => (
                    <div key={u.id} className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-[#252525] rounded-2xl border border-gray-100/50 dark:border-[#2E2E2E]/50">
                      <div className="w-10 h-10 bg-primary-100 rounded-xl flex items-center justify-center shrink-0">
                        <span className="text-primary-700 font-bold">{u.username[0].toUpperCase()}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-gray-900 dark:text-gray-100 truncate">{u.username}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{u.email}</p>
                      </div>
                      <Link to={`/admin/users/${u.id}`} className="p-2 text-gray-400 hover:text-primary-600 transition-colors">
                        <ChevronLeft className="w-5 h-5" />
                      </Link>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Users List */}
          {tab === 'users' && (
            <div className="bg-white dark:bg-[#1A1A1A] rounded-3xl border border-gray-100 dark:border-[#2E2E2E] overflow-hidden">
               <table className="w-full">
                  <thead className="bg-gray-50 dark:bg-[#252525] border-b border-gray-100 dark:border-[#2E2E2E]">
                    <tr>
                      <th className="text-right px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider font-arabic">المستخدم</th>
                      <th className="text-right px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider font-arabic">الحالة</th>
                      <th className="text-right px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider font-arabic">الإجراء الإداري</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-[#2E2E2E]">
                    {filteredUsers.map((u) => (
                      <tr key={u.id} className="hover:bg-gray-50 dark:hover:bg-[#252525] transition-colors">
                        <td className="px-6 py-5">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-primary-50 rounded-xl flex items-center justify-center text-primary-600 font-bold">{u.username[0].toUpperCase()}</div>
                            <div>
                              <p className="text-sm font-bold text-gray-900 dark:text-gray-100">{u.username}</p>
                              <p className="text-xs text-gray-400">{u.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-5">
                          <span className={`text-[10px] px-3 py-1 rounded-full font-bold font-arabic ${
                            u.status === 'suspended' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
                          }`}>
                            {u.status === 'suspended' ? 'مجمد' : 'نشط'}
                          </span>
                        </td>
                        <td className="px-6 py-5">
                          {!u.is_staff && u.status === 'active' && (
                            <button onClick={() => handleDeleteUser(u)} className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all">
                              <Trash2 className="w-5 h-5" />
                            </button>
                          )}
                          {u.status === 'suspended' && (
                             <span className="text-xs text-gray-400 italic font-arabic">في انتظار المراجعة</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
               </table>
            </div>
          )}

          {/* Products List */}
          {tab === 'products' && (
            <div className="bg-white dark:bg-[#1A1A1A] rounded-3xl border border-gray-100 dark:border-[#2E2E2E] overflow-hidden">
               <table className="w-full">
                  <thead className="bg-gray-50 dark:bg-[#252525] border-b border-gray-100 dark:border-[#2E2E2E]">
                    <tr>
                      <th className="text-right px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider font-arabic">المنتج</th>
                      <th className="text-right px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider font-arabic">التاجر</th>
                      <th className="text-right px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider font-arabic">الحالة</th>
                      <th className="text-right px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider font-arabic">إجراء</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-[#2E2E2E]">
                    {filteredProducts.map((p) => (
                      <tr key={p.id} className="hover:bg-gray-50 dark:hover:bg-[#252525] transition-colors">
                        <td className="px-6 py-5">
                          <p className="text-sm font-bold text-gray-900 dark:text-gray-100 font-arabic">{p.name}</p>
                          <p className="text-[10px] text-gray-400 font-mono">#{p.id}</p>
                        </td>
                        <td className="px-6 py-5">
                          <span className="text-sm text-gray-600 dark:text-gray-400 font-arabic">{p.seller?.username || '—'}</span>
                        </td>
                        <td className="px-6 py-5">
                          <span className={`text-[10px] px-3 py-1 rounded-full font-bold font-arabic ${
                            p.status === 'suspended' ? 'bg-red-100 text-red-700' : p.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                          }`}>
                            {p.status === 'suspended' ? 'مجمد' : p.is_active ? 'نشط' : 'مخفي'}
                          </span>
                        </td>
                        <td className="px-6 py-5">
                          <div className="flex items-center gap-2">
                             <button onClick={() => handleToggleProductStatus(p)} className="p-2 text-gray-400 hover:text-primary-600 transition-all">
                                {p.is_active ? <AlertCircle className="w-5 h-5" /> : <CheckCircle2 className="w-5 h-5" />}
                             </button>
                             {p.status === 'active' && (
                               <button onClick={() => handleDeleteProduct(p)} disabled={deleting === p.id} className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all">
                                 <Trash2 className="w-5 h-5" />
                               </button>
                             )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
               </table>
            </div>
          )}

          {/* Action Log / Audit Trail */}
          {tab === 'actions' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 font-arabic">سجل الرقابة الإدارية</h3>
                <span className="text-[11px] px-3 py-1 bg-primary-50 text-primary-600 rounded-full font-arabic font-bold animate-pulse">تحديث مباشر</span>
              </div>
              {adminLogs.length === 0 ? (
                <div className="p-20 bg-white dark:bg-[#1A1A1A] rounded-3xl border border-dashed border-gray-200 text-center text-gray-400 font-arabic">لا توجد سجلات حالياً</div>
              ) : adminLogs.map((log) => (
                <div key={log.id} className="bg-white dark:bg-[#1A1A1A] rounded-2xl border border-gray-100 dark:border-[#2E2E2E] p-5 shadow-sm hover:shadow-md transition-all">
                   <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="flex items-start gap-4">
                         <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${
                            log.action === 'suspend' ? 'bg-yellow-100 text-yellow-600' : 
                            log.action === 'restore' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'
                         }`}>
                            {log.action === 'suspend' ? <Shield className="w-6 h-6" /> : <ShieldCheck className="w-6 h-6" />}
                         </div>
                         <div>
                            <div className="flex items-center gap-2 flex-wrap text-sm font-arabic">
                               <span className="font-bold text-gray-900 dark:text-gray-100">{log.admin_name}</span>
                               <span className="text-gray-400">قام بـ</span>
                               <span className={`px-2 py-0.5 rounded-lg text-xs font-bold ${
                                  log.action === 'suspend' ? 'bg-yellow-100 text-yellow-700' :
                                  log.action === 'restore' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                               }`}>
                                  {log.action === 'suspend' ? 'تجميد' : log.action === 'restore' ? 'استعادة' : 'حذف نهائي'}
                               </span>
                               <span className="text-gray-400">لـ {log.target_model === 'User' ? 'مستخدم' : 'منتج'}:</span>
                               <span className="font-bold text-primary-600">{log.target_name}</span>
                            </div>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 font-arabic italic">السبب: {log.reason}</p>
                            <div className="flex items-center gap-2 mt-4 text-[10px] text-gray-400">
                               <Clock className="w-3 h-3" />
                               <span>{new Date(log.created_at).toLocaleString('ar-DZ')}</span>
                            </div>
                         </div>
                      </div>

                      {log.action === 'suspend' && (
                        <div className="flex gap-2">
                           <button 
                             onClick={() => handleManageAction(log.id, 'restore')} 
                             disabled={log.is_processed}
                             className={`px-4 py-2 text-xs font-bold rounded-xl transition-colors font-arabic ${
                               log.is_processed 
                               ? 'bg-gray-100 text-gray-400 cursor-not-allowed opacity-60' 
                               : 'bg-green-50 text-green-600 hover:bg-green-100'
                             }`}
                           >
                             استعادة
                           </button>
                           <button 
                             onClick={() => handleManageAction(log.id, 'finalize_delete')} 
                             disabled={log.is_processed}
                             className={`px-4 py-2 text-xs font-bold rounded-xl transition-colors font-arabic ${
                               log.is_processed 
                               ? 'bg-gray-100 text-gray-400 cursor-not-allowed opacity-60' 
                               : 'bg-red-50 text-red-600 hover:bg-red-100'
                             }`}
                           >
                             حذف نهائي
                           </button>
                        </div>
                      )}
                   </div>
                </div>
              ))}
            </div>
          )}

          {/* Reports */}
          {tab === 'reports' && (
            <div className="bg-white dark:bg-[#1A1A1A] rounded-3xl border border-gray-100 dark:border-[#2E2E2E] overflow-hidden">
                <table className="w-full">
                  <thead className="bg-gray-50 dark:bg-[#252525] border-b border-gray-100 dark:border-[#2E2E2E]">
                    <tr>
                      <th className="text-right px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider font-arabic">المُبلِغ</th>
                      <th className="text-right px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider font-arabic">المستهدف</th>
                      <th className="text-right px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider font-arabic">السبب</th>
                      <th className="text-right px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider font-arabic">إجراء</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reports.map((r) => (
                      <tr key={r.id} className="hover:bg-gray-50 transition-colors border-b last:border-0 border-gray-50 dark:border-[#2E2E2E]">
                        <td className="px-6 py-5 text-sm font-bold text-gray-900 dark:text-gray-100">{r.reporter_name}</td>
                        <td className="px-6 py-5 text-sm text-primary-600 font-bold">{r.target_product_name || r.target_user_name}</td>
                        <td className="px-6 py-5 text-xs text-gray-500 font-arabic truncate max-w-xs">{r.reason}</td>
                        <td className="px-6 py-5">
                          <button onClick={() => setViewingReport(r)} className="p-2 text-gray-400 hover:text-primary-600 transition-colors"><Search className="w-5 h-5" /></button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
            </div>
          )}

          {/* Appeals List */}
          {tab === 'appeals' && (
             <div className="animate-in fade-in duration-300">
               {/* 
                  Since we have a dedicated page for AdminAppeals, 
                  we can either import the same logic or just link to it.
                  I'll add a simplified iframe-like call or just redirect for now.
               */}
               <div className="bg-white dark:bg-[#1A1A1A] rounded-3xl border border-gray-100 dark:border-[#2E2E2E] p-12 text-center">
                  <Gavel size={64} className="mx-auto mb-6 text-amber-500 opacity-50" />
                  <h3 className="text-xl font-bold font-arabic mb-4">إدارة طعون المستخدمين</h3>
                  <p className="text-gray-500 font-arabic mb-8">يمكنك مراجعة كافة طلبات التظلم للمستخدمين والتجار وتغيير حالتهم من هنا.</p>
                  <Link to="/admin/appeals" className="px-8 py-3 bg-primary-600 text-white rounded-2xl font-bold font-arabic shadow-lg shadow-primary-600/20">فتح لوحة الطعون المخصصة</Link>
               </div>
             </div>
          )}

          {/* Login History */}
          {tab === 'history' && (
            <div className="bg-white dark:bg-[#1A1A1A] rounded-3xl border border-gray-100 dark:border-[#2E2E2E] divide-y divide-gray-50 dark:divide-[#2E2E2E]">
              {loginHistory.map((h, i) => (
                <div key={i} className="p-5 flex items-center justify-between">
                   <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-gray-50 dark:bg-[#252525] rounded-xl flex items-center justify-center text-gray-500">
                         <Monitor className="w-5 h-5" />
                      </div>
                      <div>
                         <p className="text-sm font-bold text-gray-900 dark:text-gray-100">{h.username}</p>
                         <p className="text-xs text-gray-400 font-mono">{h.ip}</p>
                      </div>
                   </div>
                   <div className="text-left">
                      <p className="text-[10px] text-gray-400">{new Date(h.logged_at).toLocaleString('ar-DZ')}</p>
                   </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* Modals */}
      {deleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
           <div className="bg-white dark:bg-[#1A1A1A] w-full max-w-md rounded-3xl p-8 border border-gray-100 dark:border-[#2E2E2E] shadow-2xl animate-in zoom-in-95 duration-200">
              <div className="w-16 h-16 bg-red-50 dark:bg-red-900/20 rounded-2xl flex items-center justify-center mb-6 mx-auto">
                 <AlertCircle className="w-8 h-8 text-red-600" />
              </div>
              <h3 className="text-xl font-bold text-center text-gray-900 dark:text-gray-100 font-arabic mb-2">تأكيد التجميد المؤقت</h3>
              <p className="text-sm text-center text-gray-500 dark:text-gray-400 font-arabic mb-6">سيتم إخفاء هذا العنصر فوراً وإعطاء المهلة للطعن. يرجى ذكر السبب الإداري.</p>
              
              <textarea 
                value={deleteReason} onChange={(e) => setDeleteReason(e.target.value)}
                placeholder="اكتب سبب التجميد هنا..."
                className="w-full h-32 bg-gray-50 dark:bg-[#252525] p-4 rounded-2xl border border-gray-100 dark:border-[#2E2E2E] text-sm font-arabic outline-none focus:ring-2 focus:ring-primary-500 shadow-inner resize-none"
              />
              
              <div className="flex gap-3 mt-6">
                 <button onClick={confirmDelete} className="flex-1 py-3.5 bg-red-600 text-white rounded-2xl font-bold font-arabic shadow-lg shadow-red-600/20 hover:bg-red-700 transition-colors">تأكيد الإجراء</button>
                 <button onClick={() => setDeleteModal(null)} className="flex-1 py-3.5 bg-gray-100 dark:bg-[#252525] text-gray-600 dark:text-gray-400 rounded-2xl font-bold font-arabic">إلغاء</button>
              </div>
           </div>
        </div>
      )}

      {viewingReport && (
         <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
           <div className="bg-white dark:bg-[#1A1A1A] w-full max-w-lg rounded-3xl p-8 border border-gray-100 dark:border-[#2E2E2E] shadow-2xl animate-in zoom-in-95 duration-200">
              <div className="flex items-center justify-between mb-6">
                 <h3 className="text-xl font-bold font-arabic">تفاصيل البلاغ</h3>
                 <button onClick={() => setViewingReport(null)} className="p-2 hover:bg-gray-100 rounded-lg transition-all"><Trash2 className="w-5 h-5 text-gray-400" /></button>
              </div>
              <div className="space-y-4">
                 <div className="p-4 bg-gray-50 dark:bg-[#252525] rounded-2xl border border-gray-100">
                    <p className="text-xs text-gray-400 font-arabic mb-1">السبب الرئيسي</p>
                    <p className="text-sm font-bold">{viewingReport.reason}</p>
                 </div>
                 <div className="p-4 bg-gray-50 dark:bg-[#252525] rounded-2xl border border-gray-100 min-h-[100px]">
                    <p className="text-xs text-gray-400 font-arabic mb-1">الوصف</p>
                    <p className="text-xs leading-relaxed">{viewingReport.description || 'لا يوجد وصف تفصيلي'}</p>
                 </div>
                 {viewingReport.report_type === 'product' && viewingReport.target_product && (
                    <button onClick={() => {
                        handleDeleteProduct({ id: viewingReport.target_product!, name: viewingReport.target_product_name!, slug: viewingReport.target_product_slug!, is_active: true, status: 'active', is_featured: false, seller_id: '' });
                        setViewingReport(null);
                    }} className="w-full py-4 bg-orange-600 text-white rounded-2xl font-bold font-arabic shadow-lg shadow-orange-600/20">تجميد المنتج فوراً</button>
                 )}
              </div>
           </div>
         </div>
      )}
    </div>
  );
}
