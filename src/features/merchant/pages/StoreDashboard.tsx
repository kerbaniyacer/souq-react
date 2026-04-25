import { useEffect, useState, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useStoreStore } from '@shared/stores/storeStore';
import { 
  Store, MapPin, Package, Users, DollarSign, Edit3, Image as ImageIcon, 
  Settings, TrendingUp, ShoppingBag, Eye, Star, Search
} from 'lucide-react';
import { productsApi } from '@shared/services/api';
import type { Product } from '@shared/types';
import { DEFAULT_PRODUCT_IMAGE } from '@shared/lib/assets';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart
} from 'recharts';
import api from '@shared/services/api';
import { useToast } from '@shared/stores/toastStore';

// Mock data for the profit chart
const profitData = [
  { name: 'يناير', profit: 4000 },
  { name: 'فبراير', profit: 3000 },
  { name: 'مارس', profit: 2000 },
  { name: 'أبريل', profit: 2780 },
  { name: 'مايو', profit: 1890 },
  { name: 'يونيو', profit: 2390 },
  { name: 'يوليو', profit: 3490 },
];

export default function StoreDashboard() {
  const { id } = useParams<{ id: string }>();
  const { stores, loadStores } = useStoreStore();
  const [activeTab, setActiveTab] = useState<'overview' | 'products' | 'settings'>('overview');
  const [products, setProducts] = useState<Product[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [page, setPage] = useState(1);
  const ITEMS_PER_PAGE = 10;
  
  const toast = useToast();
  const logoInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);
  const [uploadingImage, setUploadingImage] = useState(false);

  useEffect(() => {
    loadStores();
  }, [loadStores]);

  useEffect(() => {
    if (activeTab === 'products' && id) {
      setLoadingProducts(true);
      productsApi.myProducts({ store: id })
        .then(res => {
          const allProducts = res.data as Product[];
          // Explicitly filter in frontend in case backend doesn't support the store param yet
          const storeProducts = allProducts.filter(p => String(p.store?.id) === String(id));
          setProducts(storeProducts);
        })
        .catch(console.error)
        .finally(() => setLoadingProducts(false));
    }
  }, [activeTab, id]);

  const store = stores.find((s) => String(s.id) === id) || stores[0];

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>, type: 'logo' | 'cover') => {
    const file = event.target.files?.[0];
    if (!file || !store) return;

    const formData = new FormData();
    formData.append(type, file);

    setUploadingImage(true);
    try {
      await api.patch(`/auth/stores/${store.id}/`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      await loadStores(); // Refresh stores to get new images
      toast.success(type === 'logo' ? 'تم تحديث شعار المتجر' : 'تم تحديث الغلاف');
    } catch {
      toast.error('حدث خطأ أثناء رفع الصورة');
    } finally {
      setUploadingImage(false);
      // Reset input
      if (event.target) {
        event.target.value = '';
      }
    }
  };

  if (!store) {
    return (
      <div className="min-h-screen flex items-center justify-center font-arabic">
        <span className="w-10 h-10 border-4 border-primary-400 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0A0A0A] font-arabic" dir="rtl">
      {/* Hidden file inputs */}
      <input type="file" ref={logoInputRef} className="hidden" accept="image/*" onChange={(e) => handleImageUpload(e, 'logo')} />
      <input type="file" ref={coverInputRef} className="hidden" accept="image/*" onChange={(e) => handleImageUpload(e, 'cover')} />

      {/* Cover Image */}
      <div 
        className="h-64 md:h-80 w-full relative group bg-gradient-to-r from-primary-600 to-primary-800"
        style={{
           backgroundImage: (store as any).cover ? `url(${(store as any).cover})` : undefined,
           backgroundSize: 'cover',
           backgroundPosition: 'center'
        }}
      >
        <div className="absolute inset-0 bg-black/20" />
        <button 
          onClick={() => coverInputRef.current?.click()}
          disabled={uploadingImage}
          className="absolute bottom-4 right-4 bg-white/20 hover:bg-white/30 backdrop-blur-md text-white px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 transition-all opacity-0 group-hover:opacity-100 disabled:opacity-50"
        >
          <ImageIcon className="w-4 h-4" />
          تغيير الغلاف
        </button>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-24 relative z-10">
        {/* Store Header Info */}
        <div className="bg-white dark:bg-[#1A1A1A] rounded-3xl p-6 shadow-xl border border-gray-100 dark:border-gray-800 flex flex-col md:flex-row gap-6 items-start md:items-end">
          <div className="w-32 h-32 rounded-2xl bg-white dark:bg-[#252525] p-2 shadow-lg shrink-0 relative group">
            {store.logo ? (
              <img src={store.logo} alt={store.name} className="w-full h-full rounded-xl object-cover" />
            ) : (
              <div className="w-full h-full rounded-xl bg-primary-50 dark:bg-primary-900/20 flex items-center justify-center">
                <span className="text-4xl font-black text-primary-500">{store.name[0]?.toUpperCase()}</span>
              </div>
            )}
            <button 
              onClick={() => logoInputRef.current?.click()}
              disabled={uploadingImage}
              className="absolute inset-0 bg-black/50 rounded-2xl flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-50"
            >
              <Edit3 className="w-6 h-6" />
            </button>
          </div>

          <div className="flex-1 pb-2">
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-3xl font-black text-gray-900 dark:text-white">{store.name}</h1>
              <span className="px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-xs font-bold rounded-full">
                موثق
              </span>
            </div>
            <p className="text-gray-500 dark:text-gray-400 text-sm max-w-2xl mb-4 leading-relaxed">
              {store.description || 'لا يوجد وصف للمتجر حتى الآن. يمكنك إضافة وصف لتعريف العملاء بمتجرك وما تقدمه من منتجات مميزة.'}
            </p>
            <div className="flex flex-wrap gap-4 text-sm">
              <div className="flex items-center gap-1.5 text-gray-600 dark:text-gray-300">
                <MapPin className="w-4 h-4 text-primary-500" />
                الجزائر العاصمة، باب الزوار
              </div>
              <div className="flex items-center gap-1.5 text-gray-600 dark:text-gray-300">
                <Package className="w-4 h-4 text-primary-500" />
                {store.products_count || 0} منتج
              </div>
            </div>
          </div>

          <div className="flex gap-3 w-full md:w-auto pb-2">
            <Link to={`/merchant/products/add`} state={{ storeId: id }} className="flex-1 md:flex-none px-6 py-2.5 bg-primary-500 hover:bg-primary-600 text-white rounded-xl text-sm font-bold transition-all shadow-lg shadow-primary-500/30 flex items-center justify-center gap-2">
              <Store className="w-4 h-4" />
              إضافة منتج
            </Link>
            <button className="px-4 py-2.5 bg-gray-100 dark:bg-[#252525] hover:bg-gray-200 dark:hover:bg-[#303030] text-gray-700 dark:text-gray-300 rounded-xl transition-all">
              <Settings className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mt-8 mb-6 overflow-x-auto no-scrollbar border-b border-gray-200 dark:border-gray-800 pb-px">
          {[
            { id: 'overview', label: 'نظرة عامة وإحصائيات', icon: TrendingUp },
            { id: 'products', label: 'المنتجات', icon: ShoppingBag },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-5 py-3 text-sm font-bold border-b-2 transition-all whitespace-nowrap ${
                activeTab === tab.id
                  ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard title="إجمالي الزوار" value="12,450" icon={Eye} color="bg-blue-500" trend="+15%" />
              <StatCard title="الطلبات المكتملة" value="342" icon={Package} color="bg-emerald-500" trend="+8%" />
              <StatCard title="الأرباح الصافية" value="1,240,000 دج" icon={DollarSign} color="bg-amber-500" trend="+24%" />
              <StatCard title="تقييم المتجر" value="4.8/5" icon={Users} color="bg-purple-500" trend="+2%" />
            </div>

            {/* Chart Section */}
            <div className="bg-white dark:bg-[#1A1A1A] rounded-3xl p-6 border border-gray-100 dark:border-gray-800 shadow-sm">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-primary-500" />
                منحنى الأرباح (آخر 6 أشهر)
              </h3>
              <div className="w-full h-[300px]" dir="ltr">
                <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={300}>
                  <AreaChart data={profitData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10B981" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#333" opacity={0.2} />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#888', fontSize: 12}} dy={10} />
                    <YAxis axisLine={false} tickLine={false} tick={{fill: '#888', fontSize: 12}} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#1A1A1A', borderRadius: '12px', border: 'none', color: '#fff' }}
                      itemStyle={{ color: '#10B981', fontWeight: 'bold' }}
                    />
                    <Area type="monotone" dataKey="profit" stroke="#10B981" strokeWidth={3} fillOpacity={1} fill="url(#colorProfit)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'products' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">منتجات المتجر</h3>
              <Link to="/merchant/products/add" state={{ storeId: id }} className="flex items-center gap-2 px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-xl text-sm font-bold transition-all">
                <Store className="w-4 h-4" />
                إضافة منتج جديد
              </Link>
            </div>

            {loadingProducts ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="bg-white dark:bg-[#1A1A1A] rounded-2xl h-64 animate-pulse" />
                ))}
              </div>
            ) : products.length > 0 ? (
              <>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {products.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE).map(product => (
                    <div key={product.id} className="bg-white dark:bg-[#1A1A1A] border border-gray-100 dark:border-gray-800 rounded-3xl p-3 hover:shadow-lg transition-all group flex flex-col">
                      <div className="relative aspect-square rounded-2xl bg-gray-50 dark:bg-[#252525] overflow-hidden mb-3">
                        <img 
                          src={product.main_image || DEFAULT_PRODUCT_IMAGE} 
                          alt={product.name} 
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                          onError={(e) => { (e.target as HTMLImageElement).src = DEFAULT_PRODUCT_IMAGE; }}
                        />
                        <div className="absolute top-2 right-2 bg-black/50 backdrop-blur-md px-2 py-1 rounded-lg flex items-center gap-1 text-xs text-white font-bold">
                          <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                          {Number(product.rating || 0).toFixed(1)}
                        </div>
                      </div>
                      <h4 className="font-bold text-gray-900 dark:text-gray-100 text-sm line-clamp-1 mb-1">{product.name}</h4>
                      <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-1 mb-3 flex-1">{product.category?.name || 'بدون تصنيف'}</p>
                      <div className="flex items-center justify-between">
                        <span className="font-black text-primary-500">{product.variants[0]?.price || 0} دج</span>
                        <div className="flex items-center gap-1">
                          <Link to={`/products/${product.slug}`} title="معاينة" target="_blank" className="p-2 bg-indigo-50 dark:bg-indigo-900/20 hover:bg-indigo-100 dark:hover:bg-indigo-900/40 rounded-xl text-indigo-600 dark:text-indigo-400 transition-colors">
                            <Eye className="w-4 h-4" />
                          </Link>
                          <Link to={`/merchant/products/${product.id}/edit`} title="تعديل" className="p-2 bg-gray-100 dark:bg-[#252525] hover:bg-gray-200 dark:hover:bg-[#303030] rounded-xl text-gray-700 dark:text-gray-300 transition-colors">
                            <Edit3 className="w-4 h-4" />
                          </Link>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                
                {/* Pagination */}
                {products.length > ITEMS_PER_PAGE && (
                  <div className="flex items-center justify-center gap-2 mt-8">
                    <button 
                      disabled={page === 1}
                      onClick={() => setPage(p => p - 1)}
                      className="px-4 py-2 bg-gray-100 dark:bg-[#252525] disabled:opacity-50 text-gray-700 dark:text-gray-300 rounded-xl text-sm font-bold hover:bg-gray-200 dark:hover:bg-[#303030] transition-colors"
                    >
                      السابق
                    </button>
                    <span className="px-4 py-2 text-sm font-bold text-gray-500 dark:text-gray-400">
                      الصفحة {page} من {Math.ceil(products.length / ITEMS_PER_PAGE)}
                    </span>
                    <button 
                      disabled={page >= Math.ceil(products.length / ITEMS_PER_PAGE)}
                      onClick={() => setPage(p => p + 1)}
                      className="px-4 py-2 bg-gray-100 dark:bg-[#252525] disabled:opacity-50 text-gray-700 dark:text-gray-300 rounded-xl text-sm font-bold hover:bg-gray-200 dark:hover:bg-[#303030] transition-colors"
                    >
                      التالي
                    </button>
                  </div>
                )}
              </>
            ) : (
              <div className="bg-white dark:bg-[#1A1A1A] rounded-3xl p-12 border border-gray-100 dark:border-gray-800 text-center shadow-sm">
                <div className="w-20 h-20 bg-gray-50 dark:bg-[#252525] rounded-full flex items-center justify-center mx-auto mb-4">
                  <Package className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">لا توجد منتجات بعد</h3>
                <p className="text-gray-500 dark:text-gray-400 mb-6">لم تقم بإضافة أي منتجات لهذا المتجر بعد.</p>
                <Link to="/merchant/products/add" state={{ storeId: id }} className="inline-flex px-6 py-2.5 bg-primary-500 text-white font-bold rounded-xl hover:bg-primary-600 transition-colors">
                  إضافة منتجك الأول
                </Link>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({ title, value, icon: Icon, color, trend }: { title: string, value: string, icon: any, color: string, trend: string }) {
  const isPositive = trend.startsWith('+');
  return (
    <div className="bg-white dark:bg-[#1A1A1A] rounded-3xl p-6 border border-gray-100 dark:border-gray-800 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow group">
      <div className="flex justify-between items-start mb-4">
        <div className={`w-12 h-12 rounded-2xl ${color} bg-opacity-10 flex items-center justify-center group-hover:scale-110 transition-transform`}>
          <Icon className={`w-6 h-6 ${color.replace('bg-', 'text-')}`} />
        </div>
        <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${isPositive ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'}`}>
          {trend}
        </span>
      </div>
      <div>
        <p className="text-sm text-gray-500 dark:text-gray-400 font-medium mb-1">{title}</p>
        <h4 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">{value}</h4>
      </div>
    </div>
  );
}
