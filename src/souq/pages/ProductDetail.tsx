import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Star, Heart, ShoppingCart, Truck, Shield, ArrowRight, Minus, Plus, Store, Settings } from 'lucide-react';
import { productsApi, reviewsApi } from '@souq/services/api';
import type { Product, ProductVariant, Review } from '@souq/types';
import { useCartStore } from '@souq/stores/cartStore';
import { useWishlistStore } from '@souq/stores/wishlistStore';
import { useToast } from '@souq/stores/toastStore';
import { useAuthStore } from '@souq/stores/authStore';

const COLOR_MAP: Record<string, string> = {
  'أحمر': '#ef4444',
  'أزرق': '#3b82f6',
  'أخضر': '#22c55e',
  'أسود': '#171717',
  'أبيض': '#ffffff',
  'رمادي': '#6b7280',
  'ذهبي': '#eab308',
  'فضي': '#d1d5db',
  'بني': '#92400e',
  'برتقالي': '#f97316',
  'وردي': '#ec4899',
  'بنفسجي': '#a855f7',
  'أصفر': '#facc15'
};

export default function ProductDetail() {
  const { slug } = useParams<{ slug: string }>();
  const [product, setProduct] = useState<Product | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'desc' | 'specs' | 'reviews'>('desc');
  const [selectedAttrs, setSelectedAttrs] = useState<Record<string, string>>({});

  const { addItem: addToCart } = useCartStore();
  const { addItem: addToWishlist, removeItem: removeFromWishlist, isInWishlist } = useWishlistStore();
  const toast = useToast();
  const { user, isAuthenticated } = useAuthStore();
  const navigate = useNavigate();

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
      setSelectedImage((main as any)?.image ?? main?.images?.[0]?.image ?? p.main_image ?? p.images?.[0]?.image ?? null);
      // now fetch reviews with real id
      return reviewsApi.list(p.id);
    }).then((rRes) => {
      setReviews((rRes?.data as any)?.results ?? rRes?.data ?? []);
    }).catch(() => { }).finally(() => setLoading(false));
  }, [slug]);

  const handleAddToCart = async () => {
    const target = matchedVariant ?? selectedVariant;
    if (!target) return;
    try {
      await addToCart(target.id, quantity);
      toast.success('تمت الإضافة إلى السلة');
    } catch {
      toast.error('تعذّر إضافة المنتج');
    }
  };

  const handleToggleWishlist = async () => {
    if (!product) return;
    if (!isAuthenticated) {
      toast.info('سجّل دخولك لإضافة المنتجات إلى المفضلة');
      navigate('/login');
      return;
    }
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
          <div className="aspect-square bg-gray-100 dark:bg-[#1A1A1A] rounded-2xl" />
          <div className="space-y-4">
            <div className="h-8 bg-gray-100 dark:bg-[#1A1A1A] rounded-xl w-3/4" />
            <div className="h-6 bg-gray-100 dark:bg-[#1A1A1A] rounded-xl w-1/2" />
            <div className="h-32 bg-gray-100 dark:bg-[#1A1A1A] rounded-xl" />
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
  const isOwner = !!(user && product.seller && String(product.seller.id) === String(user.id));

  // ── استخراج خصائص المتغيرات المنفصلة (اللون، المقاس...) ──
  const attrKeys: string[] = [];
  (product.variants ?? []).forEach((v) => {
    Object.keys(v.attributes ?? {}).forEach((k) => {
      if (!attrKeys.includes(k)) attrKeys.push(k);
    });
  });

  // تهيئة الخصائص المختارة من المتغير الرئيسي
  const mainAttrs = (() => {
    const init: Record<string, string> = {};
    const mainV = product.variants?.find((v) => v.is_main) ?? product.variants?.[0];
    if (mainV?.attributes) Object.entries(mainV.attributes).forEach(([k, v]) => { init[k] = v; });
    return init;
  })();
  // تطبيق القيم الأولية إن كانت selectedAttrs فارغة
  const effectiveAttrs = Object.keys(selectedAttrs).length > 0 ? selectedAttrs : mainAttrs;

  // إيجاد المتغير المطابق للخصائص المختارة
  const matchedVariant = attrKeys.length > 0
    ? (product.variants ?? []).find((v) =>
      attrKeys.every((k) => v.attributes?.[k] === effectiveAttrs[k])
    ) ?? null
    : selectedVariant;

  // القيم المتاحة لكل خاصية
  function getAvailableValues(key: string): { value: string; available: boolean }[] {
    const allValues = [...new Set(
      (product!.variants ?? []).map((v) => v.attributes?.[key]).filter(Boolean) as string[]
    )];
    return allValues.map((val) => {
      const exists = (product!.variants ?? []).some((v) =>
        v.attributes?.[key] === val &&
        attrKeys.filter((k) => k !== key).every((k) => !effectiveAttrs[k] || v.attributes?.[k] === effectiveAttrs[k])
      );
      return { value: val, available: exists };
    });
  }

  const handleAttrSelect = (key: string, value: string) => {
    const next = { ...effectiveAttrs, [key]: value };
    setSelectedAttrs(next);
    const matched = (product.variants ?? []).find((v) =>
      attrKeys.every((k) => v.attributes?.[k] === next[k])
    );
    if (matched) {
      setSelectedVariant(matched);
      const img = (matched as any).image ?? matched.images?.[0]?.image;
      if (img) setSelectedImage(img);
    }
  };

  // هل جميع الخصائص محددة؟
  const allAttrsSelected = attrKeys.length === 0 || attrKeys.every((k) => !!effectiveAttrs[k]);

  const activeVariant = matchedVariant ?? selectedVariant;
  const hasDiscount = activeVariant?.old_price && activeVariant.old_price > activeVariant.price;

  // Use the active variant's explicitly linked images
  // Fall back to collecting the main image from all variants to show generic thumbnails
  const activeImages = activeVariant?.images?.length ? activeVariant.images : [];
  const fallbackThumbs = activeImages.length === 0 
    ? (product.variants ?? [])
        .filter((v) => (v as any).image)
        .map((v, i) => ({ id: i, image: (v as any).image as string }))
    : [];
  const images = activeImages.length > 0 ? activeImages : fallbackThumbs;

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
        {/* Images Section (Now First in code -> Right in RTL) */}
        <div className="flex flex-col gap-4">
          <div className="aspect-square bg-white dark:bg-[#1f1f1f] rounded-3xl overflow-hidden border border-gray-200 dark:border-[#2a2a2a]">
            {selectedImage ? (
              <img src={selectedImage} alt={product.name} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <ShoppingCart className="w-24 h-24 text-gray-300 dark:text-gray-700" />
              </div>
            )}
          </div>
          {images.length > 1 && (
            <div className="flex gap-3 overflow-x-auto no-scrollbar justify-end pb-2">
              {images.map((img) => (
                <button
                  key={img.id}
                  onClick={() => setSelectedImage(img.image)}
                  className={`w-20 h-20 rounded-2xl overflow-hidden border-2 shrink-0 transition-all ${
                    selectedImage === img.image 
                      ? 'border-primary-500 dark:border-[#6dbf8b]' 
                      : 'border-transparent hover:border-gray-300 dark:hover:border-gray-600'
                  }`}
                >
                  <img src={img.image} alt="" className="w-full h-full object-cover opacity-80 hover:opacity-100" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Details Section (Now Second in code -> Left in RTL) */}
        <div className="flex flex-col">
          {product.brand && (
            <p className="text-sm font-arabic mb-3 flex items-center justify-end gap-2 text-gray-400">
              البائع: {product.brand.name}
              <Store className="w-4 h-4 text-orange-300" />
            </p>
          )}
          {/* French name in LTR and left-aligned */}
          <h1 className="text-2xl md:text-3xl font-bold mb-4 leading-tight text-gray-900 dark:text-gray-100 text-left" dir="ltr">
            {product.name}
          </h1>

          {/* Rating - Stays Right as it blends with sold_count */}
          <div className="flex items-center justify-end gap-3 mb-8">
            <span className="text-sm font-arabic text-gray-500 dark:text-gray-400">{product.sold_count} مبيع</span>
            <span className="text-gray-400">|</span>
            <span className="text-sm font-arabic text-gray-500 dark:text-gray-400">({product.reviews_count} تقييم)</span>
            <span className="text-sm font-bold text-gray-700 dark:text-gray-300 ml-1">{Number(product.rating || 0).toFixed(1)}</span>
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((s) => (
                <Star key={s} className="w-3.5 h-3.5" fill={s <= Math.round(Number(product.rating || 0)) ? '#eab308' : 'none'} color={s <= Math.round(Number(product.rating || 0)) ? '#eab308' : '#eab308'} />
              ))}
            </div>
          </div>

          {/* Price Box */}
          <div className="bg-gray-50 dark:bg-[#1f1f1f] rounded-2xl p-6 mb-8 flex items-center justify-between border border-gray-200 dark:border-[#2a2a2a]">
            {activeVariant ? (
              <div className="flex items-center gap-4 w-full justify-between flex-row">
                <div className="flex items-center gap-3">
                  {hasDiscount && (
                    <span className="px-2.5 py-1 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-500 text-xs font-bold rounded-md">
                      -{activeVariant.discount}%
                    </span>
                  )}
                  {hasDiscount && (
                    <span className="text-lg text-gray-500 line-through font-mono">
                      {Number(activeVariant.old_price).toLocaleString('ar-DZ')} د.ج
                    </span>
                  )}
                </div>
                <span className="text-3xl font-bold text-primary-600 dark:text-[#6dbf8b] font-mono">
                  {Number(activeVariant.price).toLocaleString('ar-DZ')} د.ج
                </span>
              </div>
            ) : (
              <span className="text-gray-500 dark:text-gray-400 font-arabic w-full text-right">السعر غير متوفر</span>
            )}
          </div>

          {/* Options */}
          {attrKeys.length > 0 && (
            <div className="mb-8 space-y-5">
              {attrKeys.map((key) => {
                const values = getAvailableValues(key);
                const isColor = key.includes('لون') || key.includes('Color') || key === 'اللون';
                const isLatin = key.toLowerCase().includes('size') || key.includes('مقاس') || key.includes('Size');
                
                return (
                  <div key={key} className="flex flex-col items-end">
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-200 font-arabic mb-3 text-right">
                      {key}:
                    </p>
                    {/* Size and Latin options aligned to the left (ltr) while keeping container rtl logic */}
                    <div className={`flex flex-wrap gap-2 w-full ${isLatin ? 'justify-start' : 'justify-end'}`} dir={isLatin ? 'ltr' : 'rtl'}>
                      {values.map(({ value, available }) => {
                        const isSelected = effectiveAttrs[key] === value;
                        
                        if (isColor) {
                          const hex = COLOR_MAP[value] || '#888888';
                          return (
                            <button
                              key={value}
                              type="button"
                              onClick={() => available && handleAttrSelect(key, value)}
                              disabled={!available}
                              className={`w-8 h-8 rounded-full border border-gray-300 dark:border-gray-600 shadow-sm transition-all ${
                                isSelected 
                                  ? 'ring-2 ring-gray-400 dark:ring-gray-300 ring-offset-2 dark:ring-offset-[#121212]'
                                  : 'opacity-80 hover:opacity-100'
                              } ${!available ? 'opacity-30 cursor-not-allowed border-dashed' : ''}`}
                              style={{ backgroundColor: hex }}
                              title={value}
                            />
                          );
                        }

                        // Regular pill button
                        return (
                          <button
                            key={value}
                            type="button"
                            onClick={() => available && handleAttrSelect(key, value)}
                            disabled={!available}
                            className={`px-5 py-2.5 rounded-xl text-sm font-arabic transition-all border ${
                              isSelected
                                ? 'border-primary-500 text-primary-600 bg-primary-50 dark:border-[#6dbf8b] dark:text-[#6dbf8b] dark:bg-[#6dbf8b]/10'
                                : available
                                  ? 'border-gray-300 text-gray-700 hover:border-gray-400 dark:border-gray-700 dark:text-gray-400 dark:hover:border-gray-500'
                                  : 'border-gray-200 text-gray-400 line-through cursor-not-allowed dark:border-gray-800 dark:text-gray-600'
                            }`}
                          >
                            {value}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}


          {/* Quantity */}
          <div className="flex flex-col items-end mb-8">
            <p className="text-sm font-medium text-gray-700 dark:text-gray-200 font-arabic mb-3 text-right">الكمية:</p>
            <div className="flex items-center justify-between w-32 bg-white dark:bg-[#1f1f1f] border border-gray-200 dark:border-[#2a2a2a] rounded-xl p-1">
              <button
                onClick={() => setQuantity(Math.min(activeVariant?.stock ?? 99, quantity + 1))}
                className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-gray-100 dark:hover:bg-[#2a2a2a] transition-colors text-gray-600 dark:text-gray-300"
              >
                <Plus className="w-4 h-4" />
              </button>
              <span className="w-8 text-center font-bold font-mono text-gray-900 dark:text-white">{quantity}</span>
              <button
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-gray-100 dark:hover:bg-[#2a2a2a] transition-colors text-gray-600 dark:text-gray-300"
              >
                <Minus className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-4 mt-auto">
            {isOwner ? (
                <Link
                  to={`/merchant/products`}
                  className="flex-1 py-4 bg-primary-400 text-white font-bold rounded-2xl hover:bg-primary-500 transition-all font-arabic flex items-center justify-center gap-2"
                >
                  <Settings className="w-5 h-5" /> إدارة المنتج
                </Link>
            ) : (
                <button
                  onClick={handleAddToCart}
                  disabled={!allAttrsSelected || !(matchedVariant ?? selectedVariant)?.is_in_stock}
                  className="flex-1 py-4 text-white font-bold rounded-2xl transition-all font-arabic flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed bg-primary-500 hover:bg-primary-600 dark:bg-[#6dbf8b] dark:text-[#121212] dark:hover:bg-[#5aa877]"
                >
                  <ShoppingCart className="w-5 h-5" />
                  {!allAttrsSelected
                    ? `اختر ${attrKeys.filter((k) => !effectiveAttrs[k]).join(' و ')}`
                    : (matchedVariant ?? selectedVariant)?.is_in_stock
                      ? 'أضف إلى السلة'
                      : 'غير متوفر'}
                </button>
            )}
            <button
              onClick={handleToggleWishlist}
              className={`px-6 py-4 rounded-2xl border transition-all flex items-center gap-2 ${
                inWishlist
                  ? 'border-gray-400 dark:border-gray-500 bg-gray-100 dark:bg-[#252525] text-red-500'
                  : 'border-gray-300 dark:border-[#2a2a2a] bg-white dark:bg-[#1f1f1f] text-gray-600 dark:text-gray-300 hover:border-gray-400 dark:hover:border-gray-500'
              }`}
            >
              <Heart className="w-5 h-5" fill={inWishlist ? 'currentColor' : 'none'} />
              <span className="font-arabic text-sm">المفضلة</span>
            </button>
          </div>
        </div>
      </div>


      {/* Tabs */}
      <div className="bg-white dark:bg-[#1A1A1A] rounded-2xl border border-gray-100 dark:border-[#2E2E2E] overflow-hidden">
        <div className="flex border-b border-gray-100 dark:border-[#2E2E2E]">
          {[
            { key: 'desc', label: 'الوصف' },
            { key: 'specs', label: 'المواصفات' },
            { key: 'reviews', label: `التقييمات (${reviews.length})` },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as typeof activeTab)}
              className={`flex-1 py-4 text-sm font-arabic font-medium transition-colors ${activeTab === tab.key
                  ? 'text-primary-600 border-b-2 border-primary-400'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
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

          {activeTab === 'specs' && (() => {
            // بيانات ثابتة من المنتج
            const fixedRows: { label: string; value: string }[] = [];
            if (product.brand?.name) fixedRows.push({ label: 'العلامة التجارية', value: product.brand.name });
            if (product.category?.name) fixedRows.push({ label: 'الفئة', value: product.category.name });
            if (product.sku) fixedRows.push({ label: 'رمز المنتج (SKU)', value: product.sku });

            // المواصفات الفنية المدخلة يدوياً (specifications)
            const specRows: { label: string; value: string }[] = (
              (product as any).specifications ?? []
            ).map((s: any) => ({ label: s.key, value: s.value }));

            // الخصائص القديمة (attributes)
            const attrRows: { label: string; value: string }[] = (product.attributes ?? [])
              .map((a) => ({ label: a.name, value: a.value }));

            const allRows = [...fixedRows, ...specRows, ...attrRows];

            if (allRows.length === 0) {
              return <p className="text-gray-400 dark:text-gray-500 font-arabic text-center py-6">لا توجد مواصفات مدرجة</p>;
            }

            return (
              <div className="overflow-hidden rounded-xl border border-gray-100 dark:border-[#2E2E2E]">
                <table className="w-full text-sm font-arabic">
                  <tbody>
                    {allRows.map((row, i) => (
                      <tr key={i} className={i % 2 === 0 ? 'bg-gray-50 dark:bg-[#1E1E1E]' : 'bg-white dark:bg-[#1A1A1A]'}>
                        <td className="px-4 py-3 font-medium text-gray-600 dark:text-gray-400 w-40 border-l border-gray-100 dark:border-[#2E2E2E]">{row.label}</td>
                        <td className="px-4 py-3 text-gray-800 dark:text-gray-200">{row.value}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            );
          })()}

          {activeTab === 'reviews' && (
            reviews.length === 0 ? (
              <p className="text-gray-400 dark:text-gray-500 font-arabic text-center py-6">لا توجد تقييمات بعد</p>
            ) : (
              <div className="space-y-4">
                {reviews.map((r) => (
                  <div key={r.id} className="p-4 border border-gray-100 dark:border-[#2E2E2E] rounded-xl">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-primary-100 dark:bg-primary-900/20 rounded-full overflow-hidden flex items-center justify-center text-primary-600 font-bold text-sm">
                          {r.user_photo
                            ? <img src={r.user_photo} alt="" className="w-full h-full object-cover" />
                            : (r.user_name?.[0]?.toUpperCase() ?? '؟')}
                        </div>
                        <span className="text-sm font-medium text-gray-800 dark:text-gray-200 font-arabic">{r.user_name}</span>
                        {r.verified && (
                          <span className="px-2 py-0.5 bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400 text-xs rounded-full font-arabic">مشتري موثّق</span>
                        )}
                      </div>
                      <div className="flex items-center gap-1">
                        {[1, 2, 3, 4, 5].map((s) => (
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
