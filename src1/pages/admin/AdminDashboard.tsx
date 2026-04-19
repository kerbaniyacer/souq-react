import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Users, ShoppingBag, Package, TrendingUp, Trash2, Shield, Search, ChevronLeft, Mail } from 'lucide-react';
import axios from 'axios';
import { useToast } from '@stores/toastStore';
import type { Order } from '@types';

const DB = '/db?XTransformPort=3001';

interface AdminUser {
  id: string;
  username: string;
  email: string;
  is_staff: boolean;
  date_joined: string;
  provider?: string;
  photo?: string;
}
interface AdminProduct {
  id: string;
  name: string;
  slug: string;
  is_active: boolean;
  is_featured: boolean;
  seller_id: string;
  category?: { name: string };
  variants?: { price: number }[];
}

export default function AdminDashboard() {
  const toast = useToast();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [products, setProducts] = useState<AdminProduct[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'overview' | 'users' | 'products' | 'orders'>('overview');
  const [search, setSearch] = useState('');
  const [deleting, setDeleting] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      axios.get(`${DB}/users`),
      axios.get(`${DB}/products`),
      axios.get(`${DB}/orders`),
    ]).then(([u, p, o]) => {
      setUsers(u.data);
      setProducts(p.data);
      setOrders(o.data);
    }).finally(() => setLoading(false));
  }, []);

  const handleDeleteUser = async (id: string) => {
    if (!confirm('هل أنت متأكد من حذف هذا المستخدم؟')) return;
    setDeleting(id);
    try {
      await axios.delete(`${DB}/users/${id}`);
      // JSON Server doesn't support query-based deletes — fetch then delete by ID
      const profRes = await axios.get(`${DB}/profiles`);
      const userProfiles = (profRes.data as any[]).filter((p) => String(p.user_id) === String(id));
      await Promise.all(userProfiles.map((p: any) => axios.delete(`${DB}/profiles/${p.id}`)));
      setUsers((p) => p.filter((u) => u.id !== id));
      toast.success('تم حذف المستخدم');
    } catch { toast.error('تعذّر الحذف'); }
    finally { setDeleting(null); }
  };

  const handleDeleteProduct = async (id: string) => {
    if (!confirm('هل أنت متأكد من حذف هذا المنتج؟')) return;
    setDeleting(id);
    try {
      await axios.delete(`${DB}/products/${id}`);
      setProducts((p) => p.filter((x) => x.id !== id));
      toast.success('تم حذف المنتج');
    } catch { toast.error('تعذّر الحذف'); }
    finally { setDeleting(null); }
  };

  const handleToggleProductStatus = async (product: AdminProduct) => {
    await axios.patch(`${DB}/products/${product.id}`, { is_active: !product.is_active });
    setProducts((p) => p.map((x) => x.id === product.id ? { ...x, is_active: !x.is_active } : x));
    toast.success(product.is_active ? 'تم إخفاء المنتج' : 'تم تفعيل المنتج');
  };

  const totalRevenue = orders.filter((o) => o.status === 'delivered').reduce((s, o) => s + Number(o.total_amount), 0);

  const stats = [
    { label: 'المستخدمون', value: users.length, icon: <Users className="w-6 h-6" />, color: 'bg-blue-100 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400', tab: 'users' as const },
    { label: 'المنتجات', value: products.length, icon: <ShoppingBag className="w-6 h-6" />, color: 'bg-purple-100 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400', tab: 'products' as const },
    { label: 'الطلبات', value: orders.length, icon: <Package className="w-6 h-6" />, color: 'bg-yellow-100 dark:bg-yellow-900/20 text-yellow-600 dark:text-yellow-400', tab: 'orders' as const },
    { label: 'الإيرادات', value: `${totalRevenue.toLocaleString('ar-DZ')} دج`, icon: <TrendingUp className="w-6 h-6" />, color: 'bg-green-100 dark:bg-green-900/20 text-green-600 dark:text-green-400', tab: 'overview' as const },
  ];

  const filteredUsers = users.filter((u) => u.username.includes(search) || u.email.includes(search));
  const filteredProducts = products.filter((p) => p.name.includes(search));

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-red-100 dark:bg-red-900/20 rounded-xl flex items-center justify-center">
            <Shield className="w-5 h-5 text-red-600 dark:text-red-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 font-arabic">لوحة الإدارة</h1>
            <p className="text-gray-500 dark:text-gray-400 font-arabic text-sm">إدارة كاملة للمنصة</p>
          </div>
        </div>
        <Link to="/admin/emails" className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-[#1E1E1E] border border-gray-200 dark:border-[#2E2E2E] text-gray-600 dark:text-gray-400 rounded-xl hover:border-primary-300 dark:hover:border-primary-700 hover:text-primary-600 dark:hover:text-primary-400 transition-colors text-sm font-arabic">
          <Mail className="w-4 h-4" />
          قوالب البريد
        </Link>
      </div>

      {/* Stats */}
      {loading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[...Array(4)].map((_, i) => <div key={i} className="h-28 bg-gray-100 dark:bg-[#252525] rounded-2xl animate-pulse" />)}
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {stats.map((s) => (
            <button key={s.label} onClick={() => setTab(s.tab)}
              className={`text-right p-5 rounded-2xl border transition-all hover:shadow-md ${tab === s.tab ? 'border-primary-300 dark:border-primary-700 bg-primary-50 dark:bg-primary-900/10' : 'border-gray-100 dark:border-[#2E2E2E] bg-white dark:bg-[#1A1A1A]'}`}>
              <div className={`w-11 h-11 rounded-xl flex items-center justify-center mb-3 ${s.color}`}>{s.icon}</div>
              <div className="text-2xl font-bold text-gray-900 dark:text-gray-100 font-mono">{s.value}</div>
              <div className="text-sm text-gray-500 dark:text-gray-400 font-arabic mt-1">{s.label}</div>
            </button>
          ))}
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 dark:bg-[#252525] rounded-xl p-1 mb-6 w-fit">
        {(['overview', 'users', 'products', 'orders'] as const).map((t) => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-lg text-sm font-arabic transition-all ${tab === t ? 'bg-white dark:bg-[#1E1E1E] text-primary-600 dark:text-primary-400 shadow-sm font-medium' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'}`}>
            {t === 'overview' ? 'نظرة عامة' : t === 'users' ? 'المستخدمون' : t === 'products' ? 'المنتجات' : 'الطلبات'}
          </button>
        ))}
      </div>

      {/* Search */}
      {(tab === 'users' || tab === 'products') && (
        <div className="relative mb-5">
          <input value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder={tab === 'users' ? 'ابحث عن مستخدم...' : 'ابحث عن منتج...'}
            className="w-full pr-4 pl-10 py-3 bg-white dark:bg-[#1E1E1E] border border-gray-200 dark:border-[#2E2E2E] text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-400/30 font-arabic text-sm" />
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        </div>
      )}

      {/* ── Overview ── */}
      {tab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white dark:bg-[#1A1A1A] rounded-2xl border border-gray-100 dark:border-[#2E2E2E] p-6">
            <h3 className="font-bold text-gray-800 dark:text-gray-200 font-arabic mb-4">آخر الطلبات</h3>
            {orders.length === 0 ? <p className="text-gray-400 dark:text-gray-500 font-arabic text-sm text-center py-6">لا توجد طلبات</p> : (
              <div className="space-y-3">
                {orders.slice(0, 5).map((o) => (
                  <div key={o.id} className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-mono font-bold text-gray-800 dark:text-gray-200">#{o.order_number}</p>
                      <p className="text-xs text-gray-400 dark:text-gray-500 font-arabic">{o.full_name}</p>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded-full font-arabic ${
                      o.status === 'delivered' ? 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400' :
                      o.status === 'pending' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400' :
                      'bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400'
                    }`}>{o.status}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="bg-white dark:bg-[#1A1A1A] rounded-2xl border border-gray-100 dark:border-[#2E2E2E] p-6">
            <h3 className="font-bold text-gray-800 dark:text-gray-200 font-arabic mb-4">آخر المستخدمين</h3>
            <div className="space-y-3">
              {users.slice(-5).reverse().map((u) => (
                <div key={u.id} className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-primary-100 dark:bg-primary-900/20 rounded-xl flex items-center justify-center shrink-0 overflow-hidden">
                    {u.photo ? <img src={u.photo} alt="" className="w-full h-full object-cover" /> :
                      <span className="text-primary-600 dark:text-primary-400 font-bold text-sm">{u.username[0]?.toUpperCase()}</span>}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">{u.username}</p>
                    <p className="text-xs text-gray-400 dark:text-gray-500 truncate">{u.email}</p>
                  </div>
                  <span className="text-xs text-gray-400 dark:text-gray-500 font-arabic shrink-0">
                    {u.provider === 'google' ? '🔵 Google' : u.provider === 'facebook' ? '🔵 FB' : '📧'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── Users ── */}
      {tab === 'users' && (
        <div className="bg-white dark:bg-[#1A1A1A] rounded-2xl border border-gray-100 dark:border-[#2E2E2E] overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-[#252525] border-b border-gray-100 dark:border-[#2E2E2E]">
              <tr>
                <th className="text-right px-5 py-3.5 text-xs font-semibold text-gray-500 dark:text-gray-400 font-arabic">المستخدم</th>
                <th className="text-right px-5 py-3.5 text-xs font-semibold text-gray-500 dark:text-gray-400 font-arabic hidden sm:table-cell">البريد</th>
                <th className="text-right px-5 py-3.5 text-xs font-semibold text-gray-500 dark:text-gray-400 font-arabic">النوع</th>
                <th className="text-right px-5 py-3.5 text-xs font-semibold text-gray-500 dark:text-gray-400 font-arabic">إجراء</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 dark:divide-[#2E2E2E]">
              {filteredUsers.map((u) => (
                <tr key={u.id} className="hover:bg-gray-50/50 dark:hover:bg-[#252525]/50">
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-primary-100 dark:bg-primary-900/20 rounded-lg flex items-center justify-center overflow-hidden shrink-0">
                        {u.photo ? <img src={u.photo} alt="" className="w-full h-full object-cover" /> :
                          <span className="text-primary-600 dark:text-primary-400 font-bold text-xs">{u.username[0]?.toUpperCase()}</span>}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-800 dark:text-gray-200">{u.username}</p>
                        {u.is_staff && <span className="text-xs text-red-500 dark:text-red-400 font-arabic">مسؤول</span>}
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3.5 hidden sm:table-cell">
                    <p className="text-sm text-gray-600 dark:text-gray-400 truncate max-w-48">{u.email}</p>
                  </td>
                  <td className="px-5 py-3.5">
                    <span className="text-xs text-gray-500 dark:text-gray-400 font-arabic">
                      {u.provider === 'google' ? '🔵 Google' : u.provider === 'facebook' ? '🔵 Facebook' : '📧 محلي'}
                    </span>
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-2">
                      <Link to={`/admin/users/${u.id}`}
                        className="p-1.5 text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-lg transition-colors">
                        <ChevronLeft className="w-4 h-4" />
                      </Link>
                      {!u.is_staff && (
                        <button onClick={() => handleDeleteUser(u.id)} disabled={deleting === u.id}
                          className="p-1.5 text-gray-400 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors disabled:opacity-40">
                          {deleting === u.id
                            ? <span className="w-4 h-4 border border-red-300 border-t-red-500 rounded-full animate-spin block" />
                            : <Trash2 className="w-4 h-4" />}
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

      {/* ── Products ── */}
      {tab === 'products' && (
        <div className="bg-white dark:bg-[#1A1A1A] rounded-2xl border border-gray-100 dark:border-[#2E2E2E] overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-[#252525] border-b border-gray-100 dark:border-[#2E2E2E]">
              <tr>
                <th className="text-right px-5 py-3.5 text-xs font-semibold text-gray-500 dark:text-gray-400 font-arabic">المنتج</th>
                <th className="text-right px-5 py-3.5 text-xs font-semibold text-gray-500 dark:text-gray-400 font-arabic hidden sm:table-cell">القسم</th>
                <th className="text-right px-5 py-3.5 text-xs font-semibold text-gray-500 dark:text-gray-400 font-arabic">الحالة</th>
                <th className="text-right px-5 py-3.5 text-xs font-semibold text-gray-500 dark:text-gray-400 font-arabic">إجراء</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 dark:divide-[#2E2E2E]">
              {filteredProducts.map((p) => (
                <tr key={p.id} className="hover:bg-gray-50/50 dark:hover:bg-[#252525]/50">
                  <td className="px-5 py-3.5">
                    <p className="text-sm font-medium text-gray-800 dark:text-gray-200 font-arabic line-clamp-1">{p.name}</p>
                    <p className="text-xs text-gray-400 dark:text-gray-500 font-mono">#{p.id}</p>
                  </td>
                  <td className="px-5 py-3.5 hidden sm:table-cell">
                    <span className="text-sm text-gray-600 dark:text-gray-400 font-arabic">{p.category?.name ?? '—'}</span>
                  </td>
                  <td className="px-5 py-3.5">
                    <button onClick={() => handleToggleProductStatus(p)}
                      className={`text-xs px-2.5 py-1 rounded-full font-arabic font-medium transition-colors ${
                        p.is_active
                          ? 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400 hover:bg-green-200 dark:hover:bg-green-900/30'
                          : 'bg-gray-100 text-gray-500 dark:bg-[#252525] dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-[#2E2E2E]'
                      }`}>
                      {p.is_active ? 'نشط' : 'مخفي'}
                    </button>
                  </td>
                  <td className="px-5 py-3.5">
                    <button onClick={() => handleDeleteProduct(p.id)} disabled={deleting === p.id}
                      className="p-1.5 text-gray-400 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors disabled:opacity-40">
                      {deleting === p.id
                        ? <span className="w-4 h-4 border border-red-300 border-t-red-500 rounded-full animate-spin block" />
                        : <Trash2 className="w-4 h-4" />}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ── Orders ── */}
      {tab === 'orders' && (
        <div className="space-y-3">
          {orders.length === 0
            ? <p className="text-center text-gray-400 dark:text-gray-500 font-arabic py-10">لا توجد طلبات</p>
            : orders.map((o) => (
              <Link key={o.id} to={`/orders/${o.id}`}
                className="flex items-center justify-between bg-white dark:bg-[#1A1A1A] rounded-2xl border border-gray-100 dark:border-[#2E2E2E] px-5 py-4 hover:border-gray-200 dark:hover:border-[#3E3E3E] hover:shadow-sm transition-all">
                <div>
                  <p className="font-mono font-bold text-gray-900 dark:text-gray-100 text-sm">#{o.order_number}</p>
                  <p className="text-xs text-gray-400 dark:text-gray-500 font-arabic mt-0.5">{o.full_name} · {new Date(o.created_at).toLocaleDateString('ar-DZ')}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`text-xs px-2.5 py-1 rounded-full font-arabic ${
                    o.status === 'delivered' ? 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400' :
                    o.status === 'pending' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400' :
                    o.status === 'cancelled' ? 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400' :
                    'bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400'
                  }`}>{o.status}</span>
                  <p className="font-mono font-bold text-primary-600 dark:text-primary-400 text-sm">{Number(o.total_amount).toLocaleString('ar-DZ')} دج</p>
                  <ChevronLeft className="w-4 h-4 text-gray-300 dark:text-gray-600" />
                </div>
              </Link>
            ))
          }
        </div>
      )}
    </div>
  );
}
