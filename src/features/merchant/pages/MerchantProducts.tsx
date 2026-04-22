import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Pencil, Trash2, Eye, EyeOff, ShoppingBag, Search, ShieldAlert } from 'lucide-react';
import { useToast } from '@shared/stores/toastStore';
import { productsApi } from '@shared/services/api';
import api from '@shared/services/api';
import type { Product } from '@shared/types';
import { DEFAULT_PRODUCT_IMAGE } from '@shared/lib/assets';

export default function MerchantProducts() {
  const toast = useToast();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [deleting, setDeleting] = useState<string | null>(null);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const res = await productsApi.myProducts();
      setProducts(res.data as Product[]);
    } catch {
      toast.error('تعذّر تحميل المنتجات');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchProducts(); }, []);

  const handleDelete = async (id: string | number) => {
    if (!confirm('هل أنت متأكد من حذف هذا المنتج؟')) return;
    setDeleting(String(id));
    try {
      await productsApi.delete(Number(id));
      setProducts((p) => p.filter((x) => String(x.id) !== String(id)));
      toast.success('تم حذف المنتج');
    } catch {
      toast.error('تعذّر حذف المنتج');
    } finally {
      setDeleting(null);
    }
  };

  const handleToggleActive = async (product: Product) => {
    try {
      await api.patch(`/merchant/products/${product.id}/`, { is_active: !product.is_active });
      setProducts((p) => p.map((x) =>
        String(x.id) === String(product.id) ? { ...x, is_active: !x.is_active } : x
      ));
      toast.success(product.is_active ? 'تم إخفاء المنتج' : 'تم تفعيل المنتج');
    } catch {
      toast.error('تعذّر تحديث الحالة');
    }
  };

  const filtered = products.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 font-arabic">منتجاتي</h1>
          <p className="text-gray-500 dark:text-gray-400 font-arabic text-sm mt-1">{products.length} منتج</p>
        </div>
        <Link
          to="/merchant/products/add"
          className="flex items-center gap-2 px-4 py-2.5 bg-primary-400 text-white rounded-xl hover:bg-primary-500 transition-colors font-arabic text-sm font-medium"
        >
          <Plus className="w-4 h-4" />
          إضافة منتج
        </Link>
      </div>

      {/* Search */}
      <div className="relative mb-6">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="ابحث في منتجاتك..."
          className="w-full pr-4 pl-10 py-3 bg-white dark:bg-[#1E1E1E] border border-gray-200 dark:border-[#2E2E2E] text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-400/30 font-arabic text-sm"
        />
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
      </div>

      {loading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => <div key={i} className="h-20 bg-gray-100 dark:bg-[#252525] rounded-2xl animate-pulse" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20">
          <div className="w-20 h-20 bg-gray-100 dark:bg-[#252525] rounded-3xl flex items-center justify-center mx-auto mb-4">
            <ShoppingBag className="w-10 h-10 text-gray-300 dark:text-gray-600" />
          </div>
          <h3 className="text-lg font-bold text-gray-700 dark:text-gray-300 font-arabic mb-2">لا توجد منتجات</h3>
          <p className="text-gray-400 dark:text-gray-500 font-arabic mb-6">ابدأ بإضافة منتجك الأول</p>
          <Link to="/merchant/products/add" className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary-400 text-white rounded-xl font-arabic text-sm hover:bg-primary-500 transition-colors">
            <Plus className="w-4 h-4" /> إضافة منتج
          </Link>
        </div>
      ) : (
        <div className="bg-white dark:bg-[#1A1A1A] rounded-2xl border border-gray-100 dark:border-[#2E2E2E] overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-[#252525] border-b border-gray-100 dark:border-[#2E2E2E]">
              <tr>
                <th className="text-right px-5 py-3.5 text-xs font-semibold text-gray-500 dark:text-gray-400 font-arabic">المنتج</th>
                <th className="text-right px-5 py-3.5 text-xs font-semibold text-gray-500 dark:text-gray-400 font-arabic hidden sm:table-cell">القسم</th>
                <th className="text-right px-5 py-3.5 text-xs font-semibold text-gray-500 dark:text-gray-400 font-arabic hidden md:table-cell">السعر</th>
                <th className="text-right px-5 py-3.5 text-xs font-semibold text-gray-500 dark:text-gray-400 font-arabic">الحالة</th>
                <th className="text-right px-5 py-3.5 text-xs font-semibold text-gray-500 dark:text-gray-400 font-arabic">إجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 dark:divide-[#2E2E2E]">
              {filtered.map((p) => {
                const mainVariant = p.variants?.find((v) => v.is_main) ?? p.variants?.[0];
                return (
                  <tr key={p.id} className="hover:bg-gray-50/50 dark:hover:bg-[#252525]/50 transition-colors">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-gray-100 dark:bg-[#252525] rounded-xl overflow-hidden shrink-0 flex items-center justify-center">
                          <img
                            src={p.main_image || DEFAULT_PRODUCT_IMAGE}
                            alt=""
                            className="w-full h-full object-cover"
                            onError={(e) => { (e.target as HTMLImageElement).src = DEFAULT_PRODUCT_IMAGE; }}
                          />
                        </div>
                        <div>
                          <Link
                            to={`/products/${p.slug}`}
                            className="font-medium text-gray-800 dark:text-gray-200 font-arabic text-sm line-clamp-1 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
                            title="عرض صفحة المنتج"
                          >
                            {p.name}
                          </Link>
                          <p className="text-xs text-gray-400 dark:text-gray-500 font-mono mt-0.5">{mainVariant?.sku ?? '—'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4 hidden sm:table-cell">
                      <span className="text-sm text-gray-600 dark:text-gray-400 font-arabic">{p.category?.name ?? '—'}</span>
                    </td>
                    <td className="px-5 py-4 hidden md:table-cell">
                      <span className="font-mono text-sm font-bold text-primary-600">
                        {mainVariant ? `${Number(mainVariant.price).toLocaleString('ar-DZ')} دج` : '—'}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      {p.status === 'suspended' ? (
                        <div className="flex flex-col gap-1.5">
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-arabic font-bold bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400">
                            <ShieldAlert className="w-3 h-3" /> مجمد من الإدارة
                          </span>
                          <Link 
                            to={`/appeals/new?type=product&id=${p.id}`}
                            className="text-[10px] text-primary-600 dark:text-primary-400 font-arabic font-bold hover:underline px-1"
                          >
                            تقديم طعن
                          </Link>
                        </div>
                      ) : (
                        <button onClick={() => handleToggleActive(p)}
                          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-arabic font-medium transition-colors ${
                            p.is_active
                              ? 'bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400 hover:bg-green-200 dark:hover:bg-green-900/30'
                              : 'bg-gray-100 dark:bg-[#252525] text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-[#2E2E2E]'
                          }`}
                        >
                          {p.is_active ? <><Eye className="w-3 h-3" /> نشط</> : <><EyeOff className="w-3 h-3" /> مخفي</>}
                        </button>
                      )}
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        <Link
                          to={`/products/${p.slug}?preview=customer`}
                          className="inline-flex items-center gap-1.5 px-2.5 py-2 text-xs font-arabic text-primary-600 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-lg transition-colors"
                          title="معاينة صفحة المنتج كما تظهر للزبون"
                        >
                          <Eye className="w-4 h-4" />
                          <span className="hidden lg:inline">معاينة</span>
                        </Link>
                        <Link to={`/merchant/products/${p.id}/edit`}
                          className="p-2 text-gray-400 hover:text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-lg transition-colors"
                          title="تعديل المنتج"
                        >
                          <Pencil className="w-4 h-4" />
                        </Link>
                        <button
                          onClick={() => handleDelete(p.id)}
                          disabled={deleting === String(p.id)}
                          className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors disabled:opacity-40"
                          title="حذف المنتج"
                        >
                          {deleting === String(p.id)
                            ? <span className="w-4 h-4 border-2 border-red-300 border-t-red-500 rounded-full animate-spin block" />
                            : <Trash2 className="w-4 h-4" />
                          }
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
