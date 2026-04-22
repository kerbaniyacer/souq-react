import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Star, Store, User as UserIcon, MapPin, Calendar, MessageSquare, ShoppingBag } from 'lucide-react';
import { authApi, productsApi, reviewsApi } from '@shared/services/api';
import { DEFAULT_PRODUCT_IMAGE } from '@shared/lib/assets';

export default function UserProfile() {
  const { username } = useParams();
  const [user, setUser] = useState<any>(null);
  const [products, setProducts] = useState<any[]>([]);
  const [sellerReviews, setSellerReviews] = useState<any[]>([]);
  const [buyerReviews, setBuyerReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'products' | 'reviews'>('products');

  useEffect(() => {
    if (!username) return;
    setLoading(true);
    authApi.publicProfile(username).then((res) => {
      const userData = res?.data;
      if (!userData) {
        setLoading(false);
        return;
      }
      setUser(userData);
      
      // If merchant, fetch products and seller reviews
      if (userData.profile?.is_seller) {
        productsApi.list({ seller: userData.id }).then(pRes => setProducts(pRes.data));
        reviewsApi.sellerList(userData.id).then(rRes => setSellerReviews(rRes.data));
      }

      // Always try to fetch buyer reviews (other merchants might have rated them)
      reviewsApi.buyerList(userData.id).then(brRes => setBuyerReviews(brRes.data));
      
      // Default tab
      if (!userData.profile?.is_seller) setActiveTab('reviews');

    }).catch(() => {
       setUser(null);
    }).finally(() => setLoading(false));
  }, [username]);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 flex justify-center">
        <span className="w-12 h-12 border-4 border-primary-400 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center">
        <h2 className="text-2xl font-bold text-gray-800 font-arabic">المستخدم غير موجود</h2>
        <Link to="/" className="text-primary-500 mt-4 inline-block font-arabic">العودة للرئيسية</Link>
      </div>
    );
  }

  const p = user.profile;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Profile Header Card */}
      <div className="bg-white dark:bg-gray-900 rounded-[2.5rem] border border-gray-100 dark:border-gray-800 p-8 shadow-sm mb-10">
        <div className="flex flex-col md:flex-row gap-8 items-center md:items-start">
          {/* Avatar */}
          <div className="relative group">
             <div className="w-32 h-32 rounded-[2rem] overflow-hidden bg-gray-50 dark:bg-gray-800 border-4 border-white dark:border-gray-900 shadow-xl">
                {user.photo ? (
                  <img src={user.photo} alt={user.username} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-300">
                    <UserIcon size={48} />
                  </div>
                )}
             </div>
             {p?.is_seller && (
                <div className="absolute -bottom-2 -right-2 bg-primary-500 text-white p-2 rounded-xl shadow-lg border-2 border-white dark:border-gray-900">
                  <Store size={18} />
                </div>
             )}
          </div>

          {/* Info */}
          <div className="flex-1 text-center md:text-right">
             <div className="flex flex-col md:flex-row md:items-center gap-4 mb-4">
                <h1 className="text-3xl font-black text-gray-900 dark:text-gray-100 font-arabic">
                  {p?.is_seller ? p.store_name : user.full_name}
                </h1>
                <span className="px-4 py-1 bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 rounded-full text-sm font-mono">
                  @{user.username}
                </span>
             </div>

             <div className="flex flex-wrap justify-center md:justify-start gap-6 text-sm text-gray-500 dark:text-gray-400 font-arabic mb-6">
                <div className="flex items-center gap-2">
                   <MapPin size={16} className="text-primary-400" />
                   <span>{p?.wilaya} {p?.baladia && `، ${p.baladia}`}</span>
                </div>
                <div className="flex items-center gap-2">
                   <Calendar size={16} className="text-primary-400" />
                   <span>عضو منذ {new Date(user.date_joined).toLocaleDateString('ar-DZ', { month: 'long', year: 'numeric' })}</span>
                </div>
             </div>

             {p?.bio && (
               <p className="text-gray-600 dark:text-gray-300 font-arabic leading-relaxed max-w-2xl mb-8">
                 {p.bio}
               </p>
             )}

             {/* Rating Badges */}
             <div className="flex flex-wrap justify-center md:justify-start gap-4">
                {p?.is_seller && (
                  <div className="bg-yellow-50 dark:bg-yellow-900/10 border border-yellow-100 dark:border-yellow-900/30 px-6 py-3 rounded-2xl transition-all duration-300 hover:scale-110 hover:-translate-y-1 hover:shadow-xl hover:shadow-yellow-200/40 dark:hover:shadow-yellow-900/20 hover:border-yellow-200 dark:hover:border-yellow-700/40">
                    <p className="text-[10px] text-yellow-600 dark:text-yellow-500 font-bold font-arabic mb-1">تقييم البائع</p>
                    <div className="flex items-center gap-2">
                       <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                       <span className="text-xl font-black text-gray-900 dark:text-gray-100 font-mono">{p.seller_rating}</span>
                       <span className="text-xs text-gray-400 font-arabic">({p.seller_reviews_count} تقييم)</span>
                    </div>
                  </div>
                )}
                
                <div className="bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/30 px-6 py-3 rounded-2xl transition-all duration-300 hover:scale-110 hover:-translate-y-1 hover:shadow-xl hover:shadow-blue-200/40 dark:hover:shadow-blue-900/20 hover:border-blue-200 dark:hover:border-blue-700/40">
                  <p className="text-[10px] text-blue-600 dark:text-blue-500 font-bold font-arabic mb-1">تقييم المشتري</p>
                  <div className="flex items-center gap-2">
                     <Star className="w-5 h-5 fill-blue-400 text-blue-400" />
                     <span className="text-xl font-black text-gray-900 dark:text-gray-100 font-mono">{p?.buyer_rating || 0}</span>
                     <span className="text-xs text-gray-400 font-arabic">({p?.buyer_reviews_count || 0} تقييم)</span>
                  </div>
                </div>
             </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-8 border-b border-gray-100 dark:border-gray-800 mb-8 px-4">
        {p?.is_seller && (
          <button 
            onClick={() => setActiveTab('products')}
            className={`pb-4 text-sm font-bold font-arabic transition-all relative ${activeTab === 'products' ? 'text-primary-500' : 'text-gray-400 hover:text-gray-600'}`}
          >
            المنتجات ({products.length})
            {activeTab === 'products' && <div className="absolute bottom-0 left-0 right-0 h-1 bg-primary-500 rounded-t-full" />}
          </button>
        )}
        <button 
          onClick={() => setActiveTab('reviews')}
          className={`pb-4 text-sm font-bold font-arabic transition-all relative ${activeTab === 'reviews' ? 'text-primary-500' : 'text-gray-400 hover:text-gray-600'}`}
        >
          التقييمات ({p?.is_seller ? sellerReviews.length + buyerReviews.length : buyerReviews.length})
          {activeTab === 'reviews' && <div className="absolute bottom-0 left-0 right-0 h-1 bg-primary-500 rounded-t-full" />}
        </button>
      </div>

      {/* Tab Content */}
      <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
        {activeTab === 'products' && p?.is_seller && (
           <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {products.map(product => (
                <Link key={product.id} to={`/products/${product.slug}`} className="group bg-white dark:bg-gray-950 rounded-3xl overflow-hidden border border-gray-100 dark:border-gray-900 hover:shadow-xl transition-all">
                  <div className="aspect-square bg-gray-50 dark:bg-gray-900 relative">
                    <img
                      src={product.main_image ?? product.images?.[0]?.image ?? DEFAULT_PRODUCT_IMAGE}
                      alt={product.name}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                      loading="lazy"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = DEFAULT_PRODUCT_IMAGE;
                      }}
                    />
                  </div>
                  <div className="p-4">
                    <h3 className="font-bold text-gray-900 dark:text-gray-100 font-arabic text-sm truncate">{product.name}</h3>
                    <div className="flex items-center justify-between mt-2">
                       <span className="text-primary-600 font-black font-mono">{Number(product.variants?.[0]?.price).toLocaleString()} دج</span>
                       <div className="flex items-center gap-1 text-[10px] text-yellow-500">
                          <Star size={12} className="fill-current" />
                          <span>{product.rating}</span>
                       </div>
                    </div>
                  </div>
                </Link>
              ))}
              {products.length === 0 && (
                <div className="col-span-full py-20 text-center">
                  <ShoppingBag size={48} className="mx-auto text-gray-200 mb-4" />
                  <p className="text-gray-400 font-arabic">لا توجد منتجات معروضة حالياً</p>
                </div>
              )}
           </div>
        )}

        {activeTab === 'reviews' && (
           <div className="space-y-12">
              {/* Merchant Reviews Section */}
              {p?.is_seller && sellerReviews.length > 0 && (
                <div className="space-y-6">
                  <h3 className="flex items-center gap-2 text-lg font-bold text-gray-900 dark:text-gray-100 font-arabic">
                    <Store size={20} className="text-primary-500" /> تقييمات المتجر
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {sellerReviews.map(rev => (
                      <div key={rev.id} className="bg-white dark:bg-gray-950 p-6 rounded-[2rem] border border-gray-100 dark:border-gray-800">
                         <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-2">
                               <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-400">
                                  <UserIcon size={16} />
                               </div>
                               <span className="font-bold text-sm dark:text-gray-200">@{rev.buyer_name}</span>
                            </div>
                            <span className="text-[10px] text-gray-400 font-mono">{new Date(rev.created_at).toLocaleDateString()}</span>
                         </div>
                         <div className="flex gap-4 mb-4">
                            <div className="flex items-center gap-1 text-yellow-400">
                               <Star size={14} className="fill-current" />
                               <span className="text-sm font-black font-mono">{rev.rating}</span>
                            </div>
                            <div className="text-[10px] bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400 px-3 py-1 rounded-full font-arabic">
                               شحن {rev.shipping_rating}/5
                            </div>
                            {rev.product_names && (
                              <div className="text-[10px] bg-gray-100 dark:bg-gray-800 text-gray-500 px-3 py-1 rounded-full font-arabic truncate max-w-[150px]" title={rev.product_names}>
                                {rev.product_names}
                              </div>
                            )}
                         </div>
                         <p className="text-sm text-gray-600 dark:text-gray-400 font-arabic">{rev.comment || 'بدون تعليق'}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Buyer Reviews Section */}
              {buyerReviews.length > 0 && (
                 <div className="space-y-6">
                    <h3 className="flex items-center gap-2 text-lg font-bold text-gray-900 dark:text-gray-100 font-arabic">
                      <ShoppingBag size={20} className="text-blue-500" /> تقييمات كـ مشتري
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {buyerReviews.map(rev => (
                        <div key={rev.id} className="bg-white dark:bg-gray-950 p-6 rounded-[2rem] border border-gray-100 dark:border-gray-800">
                           <div className="flex items-center justify-between mb-4">
                              <div className="flex items-center gap-2">
                                 <Store size={16} className="text-primary-500" />
                                 <span className="font-bold text-sm dark:text-gray-200">@{rev.seller_name}</span>
                              </div>
                              <span className="text-[10px] text-gray-400 font-mono">{new Date(rev.created_at).toLocaleDateString()}</span>
                           </div>
                           <div className="flex items-center gap-3 mb-4">
                              <div className="flex items-center gap-1 text-blue-400">
                                 <Star size={14} className="fill-current" />
                                 <span className="text-sm font-black font-mono">{rev.rating}</span>
                              </div>
                              {rev.product_names && (
                                <div className="text-[10px] bg-gray-100 dark:bg-gray-800 text-gray-500 px-3 py-1 rounded-full font-arabic truncate max-w-[150px]" title={rev.product_names}>
                                  {rev.product_names}
                                </div>
                              )}
                           </div>
                           <p className="text-sm text-gray-600 dark:text-gray-400 font-arabic">{rev.comment || 'بدون تعليق'}</p>
                        </div>
                      ))}
                    </div>
                 </div>
              )}

              {sellerReviews.length === 0 && buyerReviews.length === 0 && (
                <div className="py-20 text-center">
                  <MessageSquare size={48} className="mx-auto text-gray-200 mb-4" />
                  <p className="text-gray-400 font-arabic">لا توجد تقييمات بعد</p>
                </div>
              )}
           </div>
        )}
      </div>
    </div>
  );
}
