import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Star, Heart, ShoppingCart, Truck, Shield, ArrowRight, Minus, Plus } from 'lucide-react';
import { productsApi, reviewsApi } from '@/services/api';
import type { Product, ProductVariant, Review } from '@/types';
import { useCartStore } from '@/stores/cartStore';
import { useWishlistStore } from '@/stores/wishlistStore';
import { useToast } from '@/stores/toastStore';

export default function ProductDetail() {
  const { slug } = useParams<{ slug: string }>();
  const [product, setProduct] = useState<Product | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'desc' | 'specs' | 'reviews'>('desc');

  const { addItem: addToCart } = useCartStore();
  const { addItem: addToWishlist, removeItem: removeFromWishlist, isInWishlist } = useWishlistStore();
  const toast = useToast();

  useEffect(() => {
    if (!slug) return;
    setLoading(true);
    Promise.all([
      productsApi.detail(slug),
      reviewsApi.list(0), // will refetch with real id below
    ]).then(([pRes]) => {
      const p: Product = pRes.data;
      setProduct(p);
      const main = p.variants?.find((v) => v.is_main) ?? p.variants?.[0];
      setSelectedVariant(main ?? null);
      setSelectedImage(p.main_image ?? p.images?.[0]?.image ?? null);
      // now fetch reviews with real id
      return reviewsApi.list(p.id);
    }).then((rRes) => {
      setReviews(rRes?.data?.results ?? rRes?.data ?? []);
    }).catch(() => {}).finally(() => setLoading(false));
  }, [slug]);

  const handleAddToCart = async () => {
    if (!selectedVariant) return;
    try {
      await addToCart(selectedVariant.id, quantity);
      toast.success('تمت الإضافة إلى السلة');
    } catch {
      toast.error('تعذّر إضافة المنتج');
    }
  };

  const handleToggleWishlist = async () => {
    if (!product) return;
    try {
      if (isInWishlist(product.id)) {
        await removeFromWishlist(product.id);
        toast.info('تمت الإزالة من المفضلة');
      } else {
        await addToWishlist(product.id);
        toast.success('تمت الإضافة إلى المفضلة');
      }
    } catch {
      toast.error('تعذّر تحديث المفضلة');
    }
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 animate-pulse">
          <div className="aspect-square bg-gray-100 dark:bg-gray-800 rounded-2xl" />
          <div className="space-y-4">
            <div className="h-8 bg-gray-100 dark:bg-gray-800 rounded-xl w-3/4" />
            <div className="h-6 bg-gray-100 dark:bg-gray-800 rounded-xl w-1/2" />
            <div className="h-32 bg-gray-100 dark:bg-gray-800 rounded-xl" />
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="text-center py-20">
        <p className="text-gray-500 dark:text-gray-400 font-arabic">المنتج غير موجود</p>
        <Link to="/products" className="mt-4 inline-block text-primary-600 font-arabic">← العودة للمنتجات</Link>
      </div>
    );
  }

  const inWishlist = isInWishlist(product.id);
  const hasDiscount = selectedVariant?.old_price && selectedVariant.old_price > selectedVariant.price;
  const images = product.images ?? [];

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-gray-400 dark:text-gray-500 font-arabic mb-8">
        <Link to="/" className="hover:text-primary-600 transition-colors">الرئيسية</Link>
        <ArrowRight className="w-3 h-3" />
        <Link to="/products" className="hover:text-primary-600 transition-colors">المنتجات</Link>
        {product.category && (
          <>
            <ArrowRight className="w-3 h-3" />
            <Link to={`/products?category=${product.category.slug}`} className="hover:text-primary-600 transition-colors">
              {product.category.name}
            </Link>
          </>
        )}
        <ArrowRight className="w-3 h-3" />
        <span className="text-gray-600 dark:text-gray-400 truncate max-w-32">{product.name}</span>
      </nav>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 mb-12">
        {/* Images */}
        <div>
          <div className="aspect-square bg-gray-50 dark:bg-gray-800 rounded-2xl overflow-hidden mb-4 border border-gray-100 dark:border-gray-800">
            {selectedImage ? (
              <img src={selectedImage} alt={product.name} className="w-full h-full object-contain p-4" />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <ShoppingCart className="w-24 h-24 text-gray-200" />
              </div>
            )}
          </div>
          {images.length > 1 && (
            <div className="flex gap-3 overflow-x-auto no-scrollbar pb-1">
              {images.map((img) => (
                <button
                  key={img.id}
                  onClick={() => setSelectedImage(img.image)}
                  className={`w-20 h-20 rounded-xl overflow-hidden border-2 shrink-0 transition-all ${
                    selectedImage === img.image ? 'border-primary-400' : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <img src={img.image} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Details */}
        <div>
          {product.brand && (
            <p className="text-sm text-primary-600 font-arabic mb-2">{product.brand.name}</p>
          )}
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-gray-100 font-arabic mb-4 leading-tight">
            {product.name}
          </h1>

          {/* Rating */}
          <div className="flex items-center gap-3 mb-5">
            <div className="flex items-center gap-1">
              {[1,2,3,4,5].map((s) => (
                <Star key={s} className="w-4 h-4" fill={s <= Math.round(product.rating) ? '#f59e0b' : 'none'} color={s <= Math.round(product.rating) ? '#f59e0b' : '#d1d5db'} />
              ))}
            </div>
            <span className="text-sm text-gray-500 dark:text-gray-400 font-arabic">({product.reviews_count} تقييم)</span>
            <span className="text-sm text-gray-400 dark:text-gray-500">·</span>
            <span className="text-sm text-green-600 font-arabic">{product.sold_count}+ مبيع</span>
          </div>

          {/* Price */}
          <div className="flex items-end gap-3 mb-6">
            {selectedVariant ? (
              <>
                <span className="text-3xl font-bold text-primary-600 font-mono">
                  {Number(selectedVariant.price).toLocaleString('ar-DZ')} دج
                </span>
                {hasDiscount && (
                  <>
                    <span className="text-lg text-gray-400 dark:text-gray-500 line-through font-mono">
                      {Number(selectedVariant.old_price).toLocaleString('ar-DZ')} دج
                    </span>
                    <span className="px-2 py-1 bg-red-100 text-red-600 text-sm font-bold rounded-lg">
                      -{selectedVariant.discount}%
                    </span>
                  </>
                )}
              </>
            ) : (
              <span className="text-gray-400 dark:text-gray-500 font-arabic">السعر غير متوفر</span>
            )}
          </div>

          {/* Variants */}
          {product.variants && product.variants.length > 1 && (
            <div className="mb-6">
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300 font-arabic mb-3">اختر النسخة:</p>
              <div className="flex flex-wrap gap-2">
                {product.variants.map((v) => (
                  <button
                    key={v.id}
                    onClick={() => setSelectedVariant(v)}
                    disabled={!v.is_in_stock}
                    className={`px-4 py-2 rounded-xl border-2 text-sm font-arabic transition-all ${
                      selectedVariant?.id === v.id
                        ? 'border-primary-400 bg-primary-50 text-primary-700'
                        : 'border-gray-200 hover:border-gray-300 text-gray-600'
                    } ${!v.is_in_stock ? 'opacity-40 cursor-not-allowed line-through' : ''}`}
                  >
                    {v.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Quantity */}
          <div className="flex items-center gap-4 mb-6">
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300 font-arabic">الكمية:</p>
            <div className="flex items-center gap-2 bg-gray-50 dark:bg-gray-800 rounded-xl p-1">
              <button
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-white dark:bg-gray-900 transition-colors"
              >
                <Minus className="w-4 h-4" />
              </button>
              <span className="w-8 text-center font-bold text-gray-800 dark:text-gray-200">{quantity}</span>
              <button
                onClick={() => setQuantity(Math.min(selectedVariant?.stock ?? 99, quantity + 1))}
                className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-white dark:bg-gray-900 transition-colors"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
            {selectedVariant && (
              <span className="text-sm text-gray-400 dark:text-gray-500 font-arabic">
                ({selectedVariant.stock} متوفر)
              </span>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-3 mb-8">
            <button
              onClick={handleAddToCart}
              disabled={!selectedVariant?.is_in_stock}
              className="flex-1 py-3.5 bg-primary-400 text-white font-bold rounded-xl hover:bg-primary-500 active:scale-95 transition-all font-arabic flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ShoppingCart className="w-5 h-5" />
              {selectedVariant?.is_in_stock ? 'أضف إلى السلة' : 'غير متوفر'}
            </button>
            <button
              onClick={handleToggleWishlist}
              className={`p-3.5 rounded-xl border-2 transition-all ${
                inWishlist ? 'border-rose-300 bg-rose-50 text-rose-500' : 'border-gray-200 text-gray-500 hover:border-rose-200 hover:text-rose-400'
              }`}
            >
              <Heart className="w-5 h-5" fill={inWishlist ? 'currentColor' : 'none'} />
            </button>
          </div>

          {/* Trust badges */}
          <div className="grid grid-cols-2 gap-3">
            {[
              { icon: <Truck className="w-4 h-4" />, text: 'توصيل لجميع الولايات', color: 'text-blue-600 bg-blue-50' },
              { icon: <Shield className="w-4 h-4" />, text: 'ضمان الإرجاع 7 أيام', color: 'text-green-600 bg-green-50' },
            ].map((b) => (
              <div key={b.text} className={`flex items-center gap-2 px-3 py-2.5 rounded-xl ${b.color}`}>
                {b.icon}
                <span className="text-xs font-arabic">{b.text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden">
        <div className="flex border-b border-gray-100 dark:border-gray-800">
          {[
            { key: 'desc', label: 'الوصف' },
            { key: 'specs', label: 'المواصفات' },
            { key: 'reviews', label: `التقييمات (${reviews.length})` },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as typeof activeTab)}
              className={`flex-1 py-4 text-sm font-arabic font-medium transition-colors ${
                activeTab === tab.key
                  ? 'text-primary-600 border-b-2 border-primary-400'
                  : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="p-6">
          {activeTab === 'desc' && (
            <p className="text-gray-700 dark:text-gray-300 font-arabic leading-relaxed whitespace-pre-line">
              {product.description || 'لا يوجد وصف متاح'}
            </p>
          )}

          {activeTab === 'specs' && (
            product.attributes && product.attributes.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {product.attributes.map((attr) => (
                  <div key={attr.id} className="flex justify-between items-center px-4 py-3 bg-gray-50 dark:bg-gray-800 rounded-xl">
                    <span className="text-sm font-medium text-gray-600 dark:text-gray-400 font-arabic">{attr.name}</span>
                    <span className="text-sm text-gray-800 dark:text-gray-200 font-arabic">{attr.value}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-400 dark:text-gray-500 font-arabic text-center py-6">لا توجد مواصفات مدرجة</p>
            )
          )}

          {activeTab === 'reviews' && (
            reviews.length === 0 ? (
              <p className="text-gray-400 dark:text-gray-500 font-arabic text-center py-6">لا توجد تقييمات بعد</p>
            ) : (
              <div className="space-y-4">
                {reviews.map((r) => (
                  <div key={r.id} className="p-4 border border-gray-100 dark:border-gray-800 rounded-xl">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center text-primary-600 font-bold text-sm">
                          {r.user?.username?.[0]?.toUpperCase() ?? '؟'}
                        </div>
                        <span className="text-sm font-medium text-gray-800 dark:text-gray-200 font-arabic">{r.user?.username}</span>
                        {r.verified && (
                          <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full font-arabic">مشتري موثّق</span>
                        )}
                      </div>
                      <div className="flex items-center gap-1">
                        {[1,2,3,4,5].map((s) => (
                          <Star key={s} className="w-3.5 h-3.5" fill={s <= r.rating ? '#f59e0b' : 'none'} color={s <= r.rating ? '#f59e0b' : '#d1d5db'} />
                        ))}
                      </div>
                    </div>
                    <p className="text-sm text-gray-700 dark:text-gray-300 font-arabic leading-relaxed">{r.comment}</p>
                    <p className="text-xs text-gray-400 dark:text-gray-500 font-arabic mt-2">
                      {new Date(r.created_at).toLocaleDateString('ar-DZ')}
                    </p>
                  </div>
                ))}
              </div>
            )
          )}
        </div>
      </div>
    </div>
  );
}
