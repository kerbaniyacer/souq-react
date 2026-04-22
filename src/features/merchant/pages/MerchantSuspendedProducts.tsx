import { Link } from 'react-router-dom';
import { ChevronRight, Package, AlertCircle, Gavel, ExternalLink, Clock } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import api from '@shared/services/api';
import { queryKeys } from '@shared/lib/queryKeys';
import { Product } from '@shared/types';

export default function MerchantSuspendedProducts() {
  const { data: products, isLoading } = useQuery<Product[]>({
    queryKey: ['merchant-suspended-products'],
    queryFn: async () => {
      const { data } = await api.get('/merchant/products/');
      // Filter for suspended items only
      return (data.results ?? data).filter((p: Product) => p.status === 'suspended');
    },
  });

  return (
    <div className="min-h-screen bg-[#FDFCFB] dark:bg-[#0A0A0A] font-arabic" dir="rtl">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10">
        
        {/* Breadcrumbs */}
        <nav className="flex items-center gap-2 text-xs text-gray-400 mb-8 overflow-x-auto no-scrollbar pb-2">
          <Link to="/merchant/dashboard" className="hover:text-primary-600 transition-colors whitespace-nowrap">لوحة التاجر</Link>
          <ChevronRight size={14} className="shrink-0" />
          <span className="text-gray-900 dark:text-gray-100 font-bold whitespace-nowrap">المنتجات المجمدة</span>
        </nav>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
          <div>
            <h1 className="text-3xl font-black text-gray-900 dark:text-gray-100 tracking-tight flex items-center gap-3">
               المنتجات المجمدة
               <span className="px-3 py-1 bg-amber-100 dark:bg-amber-900/30 text-amber-600 rounded-full text-xs font-bold">{products?.length || 0}</span>
            </h1>
            <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">هذه المنتجات تم تجميدها إدارياً وتحتاج لمراجعة أو تقديم طعن.</p>
          </div>
        </div>

        {isLoading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => <div key={i} className="h-32 bg-white dark:bg-[#1A1A1A] rounded-3xl animate-pulse" />)}
          </div>
        ) : products?.length === 0 ? (
          <div className="bg-white dark:bg-[#1A1A1A] rounded-[2.5rem] p-20 text-center border border-gray-50 dark:border-gray-800 shadow-sm">
             <div className="w-20 h-20 bg-green-50 dark:bg-green-900/10 rounded-3xl flex items-center justify-center mx-auto mb-6">
                <Package className="w-10 h-10 text-green-500" />
             </div>
             <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">لا توجد منتجات مجمدة</h3>
             <p className="text-gray-500 dark:text-gray-400 max-w-xs mx-auto">كل منتجاتك تعمل بشكل طبيعي في المتجر حالياً.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6">
            {products?.map((product) => (
              <div key={product.id} className="bg-white dark:bg-[#1A1A1A] rounded-[2rem] p-6 border border-gray-50 dark:border-gray-800 shadow-sm hover:shadow-xl transition-all duration-300">
                <div className="flex flex-col md:flex-row gap-6">
                  <div className="w-full md:w-48 h-48 bg-gray-50 dark:bg-[#252525] rounded-2xl overflow-hidden shrink-0 border border-gray-100 dark:border-gray-800">
                    {product.image ? (
                      <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-300">
                        <Package size={48} />
                      </div>
                    )}
                  </div>

                  <div className="flex-1 flex flex-col">
                    <div className="flex items-start justify-between gap-4 mb-4">
                      <div>
                        <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-1">{product.name}</h3>
                        <p className="text-xs text-gray-400 font-mono tracking-widest uppercase">SKU: {product.sku || 'N/A'}</p>
                      </div>
                      <div className="px-3 py-1 bg-red-50 dark:bg-red-900/10 text-red-600 rounded-full text-[10px] font-bold border border-red-100 dark:border-red-900/20">
                        مجمد إدارياً
                      </div>
                    </div>

                    <div className="bg-amber-50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-900/20 rounded-2xl p-4 mb-6">
                       <div className="flex items-start gap-3">
                          <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                          <div>
                             <p className="text-xs font-bold text-amber-900 dark:text-amber-100">سبب التجميد:</p>
                             <p className="text-xs text-amber-700 dark:text-amber-400 leading-relaxed mt-1">{product.suspension_reason || 'مخالفة سياسة النشر.'}</p>
                          </div>
                       </div>
                    </div>

                    <div className="mt-auto flex flex-wrap items-center gap-4">
                      <div className="flex items-center gap-2 text-[10px] text-gray-400">
                         <Clock size={14} />
                         <span>تاريخ التجميد: {product.suspended_at ? new Date(product.suspended_at).toLocaleDateString('ar-DZ') : 'غير محدد'}</span>
                      </div>
                      <div className="flex items-center gap-2 text-[10px] text-gray-400">
                         <Gavel size={14} />
                         <span>آخر موعد للطعن: {product.appeal_deadline ? new Date(product.appeal_deadline).toLocaleDateString('ar-DZ') : 'انتهت المهلة'}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col gap-3 justify-center md:border-r md:pr-6 dark:border-gray-800">
                    <Link 
                      to={`/appeals/new?target_type=product&target_id=${product.id}`}
                      className="flex items-center justify-center gap-2 px-6 py-3 bg-primary-600 text-white rounded-xl text-sm font-bold shadow-lg shadow-primary-600/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
                    >
                      <Gavel size={16} />
                      تقديم طعن
                    </Link>
                    <Link 
                      to={`/products/${product.slug}`}
                      className="flex items-center justify-center gap-2 px-6 py-3 bg-gray-50 dark:bg-[#252525] text-gray-600 dark:text-gray-400 rounded-xl text-sm font-bold hover:bg-gray-100 dark:hover:bg-[#2E2E2E] transition-all"
                    >
                      <ExternalLink size={16} />
                      عرض المنتج
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
