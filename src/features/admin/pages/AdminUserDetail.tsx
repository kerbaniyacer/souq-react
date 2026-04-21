import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowRight, Trash2, Package, ShoppingBag, TrendingUp } from 'lucide-react';
import api from '@features/auth/services/authService';
import { useToast } from '@shared/stores/toastStore';

export default function AdminUserDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const toast = useToast();

  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [products, setProducts] = useState<any[]>([]);
  const [boughtOrders, setBoughtOrders] = useState<any[]>([]);
  const [soldOrders, setSoldOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    Promise.all([
      api.get(`/auth/users/${id}/`),
      api.get(`/products/?seller=${id}&page_size=1000`),
      api.get(`/orders/?user=${id}`),
      api.get(`/orders/?seller=${id}`),
    ]).then(([uRes, prRes, boRes, soRes]) => {
      setUser(uRes.data);
      setProfile(uRes.data.profile);
      setProducts(prRes.data.results ?? prRes.data);
      setBoughtOrders(boRes.data.results ?? boRes.data);
      setSoldOrders(soRes.data.results ?? soRes.data);
    }).catch(() => {
      // toast.error('فشل جلب بيانات المستخدم');
    }).finally(() => setLoading(false));
  }, [id]);

  const handleDeleteUser = async () => {
    if (!confirm('تحذير: هل أنت متأكد من حذف هذا الحساب وجميع بياناته نهائياً؟ لا يمكن التراجع.')) return;
    setDeleting(true);
    try {
      await api.delete(`/auth/users/${id}/delete/`);
      toast.success('تم حذف الحساب بنجاح');
      navigate('/admin-panel');
    } catch {
      toast.error('تعذّر حذف الحساب');
    } finally {
      setDeleting(false);
    }
  };

  const handleDeleteProduct = async (productId: string | number) => {
    if (!confirm('هل تريد حذف هذا المنتج نهائياً؟')) return;
    try {
      await api.delete(`/merchant/products/${productId}/`);
      setProducts((prev) => prev.filter((p) => String(p.id) !== String(productId)));
      toast.success('تم حذف المنتج');
    } catch {
      toast.error('تعذّر حذف المنتج');
    }
  };


  const sellerRevenue = soldOrders
    .filter((o) => o.status === 'delivered')
    .reduce((total, order) => {
        const merchantItems = order.items?.filter((item: any) => String(item.seller_id) === String(id));
        const orderMerchantSubtotal = merchantItems?.reduce((sub: number, item: any) => sub + Number(item.subtotal), 0) || 0;
        return total + orderMerchantSubtotal;
    }, 0);

  const totalSpent = boughtOrders.reduce((s, o) => s + Number(o.total_amount), 0);

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-10 space-y-4 animate-pulse">
        <div className="h-10 bg-gray-100 rounded-xl w-48" />
        <div className="h-32 bg-gray-100 rounded-2xl" />
        <div className="h-64 bg-gray-100 rounded-2xl" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="text-center py-20">
        <p className="text-gray-500 font-arabic">المستخدم غير موجود</p>
        <Link to="/admin-panel" className="mt-4 inline-block text-primary-600 font-arabic">← العودة للوحة التحكم</Link>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm font-arabic text-gray-400 mb-6">
        <Link to="/admin-panel" className="hover:text-primary-600 transition-colors">لوحة التحكم</Link>
        <ArrowRight className="w-3 h-3" />
        <span className="text-gray-700">{user.username}</span>
      </div>

      {/* User Info Card */}
      <div className="bg-white dark:bg-[#1A1A1A] rounded-2xl border border-gray-100 dark:border-[#2E2E2E] p-6 mb-6">
        <div className="flex flex-col sm:flex-row items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center shrink-0">
              {user.photo
                ? <img src={user.photo} alt="" className="w-full h-full rounded-full object-cover" />
                : <span className="text-primary-600 font-bold text-2xl">{user.username?.slice(0,1).toUpperCase()}</span>
              }
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 font-arabic">
                {user.first_name || user.last_name ? `${user.first_name} ${user.last_name}`.trim() : user.username}
              </h2>
              <p className="text-gray-500 dark:text-gray-400 text-sm">{user.email}</p>
              <div className="flex items-center gap-2 mt-2 flex-wrap">
                <span className={`text-xs px-2.5 py-1 rounded-full font-arabic font-medium ${
                  profile?.is_seller ? 'bg-primary-100 text-primary-700' : 'bg-blue-100 text-blue-700'
                }`}>
                  {profile?.is_seller ? 'تاجر' : 'مشتري'}
                </span>
                {user.is_staff && (
                  <span className="text-xs px-2.5 py-1 rounded-full bg-red-100 text-red-700 font-arabic font-medium">مدير</span>
                )}
                <span className="text-xs text-gray-400 font-arabic">
                  انضم في: {new Date(user.date_joined).toLocaleDateString('ar-DZ', { year: 'numeric', month: 'long' })}
                </span>
              </div>
            </div>
          </div>
          {!user.is_staff && (
            <button
              onClick={handleDeleteUser}
              disabled={deleting}
              className="flex items-center gap-2 px-4 py-2.5 bg-red-500 text-white rounded-xl text-sm font-arabic hover:bg-red-600 transition-colors disabled:opacity-60 shrink-0"
            >
              <Trash2 className="w-4 h-4" />
              حذف الحساب نهائياً
            </button>
          )}
        </div>
      </div>

      {/* Seller Section */}
      {profile?.is_seller && (
        <div className="mb-10">
          <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100 font-arabic mb-6 flex items-center gap-2 border-b border-gray-100 pb-2">
            <Package className="w-5 h-5 text-primary-500" />
            نشاط التاجر
          </h2>
          
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            {[
              { label: 'إجمالي المبيعات', value: `${sellerRevenue.toLocaleString('ar-DZ')} دج`, icon: <TrendingUp className="w-5 h-5" />, color: 'text-green-600 bg-green-50' },
              { label: 'عدد المنتجات', value: products.length, icon: <Package className="w-5 h-5" />, color: 'text-blue-600 bg-blue-50' },
              { label: 'الطلبات المستلمة', value: soldOrders.length, icon: <ShoppingBag className="w-5 h-5" />, color: 'text-primary-600 bg-primary-50' },
            ].map((s) => (
              <div key={s.label} className="bg-white dark:bg-[#1A1A1A] rounded-2xl border border-gray-100 dark:border-[#2E2E2E] p-5">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${s.color}`}>{s.icon}</div>
                <div className="text-xl font-bold text-gray-900 dark:text-gray-100 font-mono">{s.value}</div>
                <div className="text-xs text-gray-500 dark:text-gray-400 font-arabic mt-1">{s.label}</div>
              </div>
            ))}
          </div>

          {profile?.store_name && (
            <div className="bg-white dark:bg-[#1A1A1A] rounded-2xl border border-gray-100 dark:border-[#2E2E2E] p-5 mb-6">
              <h3 className="font-bold text-gray-800 dark:text-gray-200 font-arabic mb-2">معلومات المتجر</h3>
              <p className="text-gray-700 dark:text-gray-300 font-arabic font-medium">{profile.store_name}</p>
              {profile.store_description && <p className="text-gray-500 text-sm font-arabic mt-1">{profile.store_description}</p>}
            </div>
          )}

          <div className="bg-white dark:bg-[#1A1A1A] rounded-2xl border border-gray-100 dark:border-[#2E2E2E] p-6">
            <h3 className="font-bold text-gray-900 dark:text-gray-100 font-arabic mb-4">المنتجات المعروضة ({products.length})</h3>
            {products.length === 0 ? (
              <p className="text-center py-8 text-gray-400 font-arabic text-sm">لا توجد منتجات لهذا التاجر</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 dark:bg-[#252525] text-gray-500 dark:text-gray-400 font-arabic">
                      <th className="px-4 py-3 text-right rounded-r-xl">المنتج</th>
                      <th className="px-4 py-3 text-right">السعر</th>
                      <th className="px-4 py-3 text-right">الحالة</th>
                      <th className="px-4 py-3 text-right rounded-l-xl">إجراء</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50 dark:divide-[#2E2E2E]">
                    {products.map((p) => {
                      const mainVariant = p.variants?.find((v: any) => v.is_main) ?? p.variants?.[0];
                      return (
                        <tr key={p.id} className="hover:bg-gray-50/50 dark:hover:bg-[#252525]/50">
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-gray-50 dark:bg-[#252525] rounded-lg overflow-hidden shrink-0">
                                {p.main_image
                                  ? <img src={p.main_image} alt="" className="w-full h-full object-cover" />
                                  : <div className="w-full h-full flex items-center justify-center text-gray-300"><Package className="w-4 h-4" /></div>
                                }
                              </div>
                              <Link to={`/products/${p.slug}`} className="font-medium text-gray-800 dark:text-gray-200 font-arabic hover:text-primary-600 transition-colors line-clamp-1">
                                {p.name}
                              </Link>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-primary-600 dark:text-primary-400 font-mono font-bold">
                            {mainVariant ? `${Number(mainVariant.price).toLocaleString('ar-DZ')} دج` : '-'}
                          </td>
                          <td className="px-4 py-3">
                            <span className={`text-xs px-2 py-1 rounded-full font-arabic ${p.is_active ? 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400' : 'bg-gray-100 text-gray-500 dark:bg-[#252525] dark:text-gray-400'}`}>
                              {p.is_active ? 'نشط' : 'متوقف'}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <button
                              onClick={() => handleDeleteProduct(p.id)}
                              className="text-red-500 hover:text-red-700 font-arabic text-xs font-medium transition-colors"
                            >
                              حذف
                            </button>
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
      )}

      {/* Buyer Section */}
      <div className="mb-10">
        <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100 font-arabic mb-6 flex items-center gap-2 border-b border-gray-100 pb-2">
          <ShoppingBag className="w-5 h-5 text-primary-500" />
          نشاط المشتري
        </h2>

        <div className="bg-white dark:bg-[#1A1A1A] rounded-2xl border border-gray-100 dark:border-[#2E2E2E] p-5 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-50 dark:bg-green-900/20 rounded-xl flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400 font-arabic">إجمالي الإنفاق</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100 font-mono">{totalSpent.toLocaleString('ar-DZ')} دج</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-[#1A1A1A] rounded-2xl border border-gray-100 dark:border-[#2E2E2E] p-6">
          <h3 className="font-bold text-gray-900 dark:text-gray-100 font-arabic mb-4">طلبات الشراء ({boughtOrders.length})</h3>
          {boughtOrders.length === 0 ? (
            <p className="text-center py-8 text-gray-400 font-arabic text-sm">لم يقم هذا المستخدم بأي طلبات بعد</p>
          ) : (
            <div className="space-y-3">
              {boughtOrders.map((o) => (
                <div key={o.id} className="p-4 bg-gray-50 dark:bg-[#252525] rounded-xl flex flex-col sm:flex-row justify-between gap-3">
                  <div>
                    <p className="font-medium text-gray-800 dark:text-gray-200 font-mono text-sm leading-none mb-1">#{o.order_number}</p>
                    <p className="text-xs text-gray-400 dark:text-gray-500 font-arabic">
                      {new Date(o.created_at).toLocaleDateString('ar-DZ', { year: 'numeric', month: 'short', day: 'numeric' })}
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-left sm:text-right">
                      <p className="font-bold text-primary-600 dark:text-primary-400 font-mono">{Number(o.total_amount).toLocaleString('ar-DZ')} دج</p>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-arabic ${
                        o.status === 'delivered' ? 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400' :
                        o.status === 'pending' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400' :
                        o.status === 'cancelled' ? 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400' :
                        'bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400'
                      }`}>
                        {o.status === 'delivered' ? 'مُسلَّم' : o.status === 'pending' ? 'معلّق' : o.status === 'cancelled' ? 'ملغى' : o.status}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
