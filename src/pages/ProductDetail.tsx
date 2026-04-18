import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Star, Heart, ShoppingCart, Truck, Shield, ArrowRight, Minus, Plus, Store, Settings } from 'lucide-react';
import { productsApi, reviewsApi } from '@/services/api';
import type { Product, ProductVariant, Review } from '@/types';
import { useCartStore } from '@/stores/cartStore';
import { useWishlistStore } from '@/stores/wishlistStore';
import { useToast } from '@/stores/toastStore';
import { useAuthStore } from '@/stores/authStore';

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
  const { user } = useAuthStore();

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
      setSelectedImage(main?.image ?? p.main_image ?? p.images?.[0]?.image ?? null);
      // now fetch reviews with real id
      return reviewsApi.list(p.id);
    }).then((rRes) => {
      setReviews((rRes?.data as any)?.results ?? rRes?.data ?? []);
    }).catch(() => {}).finally(() => setLoading(false));
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
      if (matched.image) setSelectedImage(matched.image);
    }
  };

  // هل جميع الخصائص محددة؟
  const allAttrsSelected = attrKeys.length === 0 || attrKeys.every((k) => !!effectiveAttrs[k]);

  const activeVariant = matchedVariant ?? selectedVariant;
  const hasDiscount = activeVariant?.old_price && activeVariant.old_price > activeVariant.price;
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
          <div className="aspect-square bg-gray-50 dark:bg-[#1A1A1A] rounded-2xl overflow-hidden mb-4 border border-gray-100 dark:border-[#2E2E2E]">
            {selectedImage ? (
              <img src={selectedImage} alt={product.name} className="w-full h-full object-contain p-4" />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <ShoppingCart className="w-24 h-24 text-gray-200 dark:text-gray-700" />
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
                    selectedImage === img.image ? 'border-primary-400' : 'border-gray-200 dark:border-[#2E2E2E] hover:border-gray-300 dark:hover:border-gray-600'
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
            <span className="text-sm text-green-600 dark:text-green-500 font-arabic">{product.sold_count}+ مبيع</span>
          </div>

          {/* Price */}
          <div className="flex items-end gap-3 mb-6">
            {activeVariant ? (
              <>
                <span className="text-3xl font-bold text-primary-600 font-mono">
                  {Number(activeVariant.price).toLocaleString('ar-DZ')} دج
                </span>
                {hasDiscount && (
                  <>
                    <span className="text-lg text-gray-400 dark:text-gray-500 line-through font-mono">
                      {Number(activeVariant.old_price).toLocaleString('ar-DZ')} دج
                    </span>
                    <span className="px-2 py-1 bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm font-bold rounded-lg">
                      -{activeVariant.discount}%
                    </span>
                  </>
                )}
              </>
            ) : (
              <span className="text-gray-400 dark:text-gray-500 font-arabic">السعر غير متوفر</span>
            )}
          </div>

          {/* Variants — منفصلة حسب الخاصية */}
          {attrKeys.length > 0 && (
            <div className="mb-6 space-y-4">
              {attrKeys.map((key) => {
                const values = getAvailableValues(key);
                return (
                  <div key={key}>
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300 font-arabic mb-2">
                      {key}:
                      {effectiveAttrs[key] && (
                        <span className="mr-2 text-primary-600 font-bold">{effectiveAttrs[key]}</span>
                      )}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {values.map(({ value, available }) => {
                        const isSelected = effectiveAttrs[key] === value;
                        return (
                          <button
                            key={value}
                            type="button"
                            onClick={() => available && handleAttrSelect(key, value)}
                            disabled={!available}
                            className={`px-4 py-2 rounded-xl border-2 text-sm font-arabic transition-all ${
                              isSelected
                                ? 'border-primary-400 bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-400 font-bold'
                                : available
                                  ? 'border-gray-200 dark:border-[#2E2E2E] hover:border-primary-300 text-gray-600 dark:text-gray-400'
                                  : 'border-gray-100 dark:border-[#2E2E2E] text-gray-300 dark:text-gray-600 line-through cursor-not-allowed'
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
              {/* رسالة إذا لم يُحدَّد متغير مطابق */}
              {attrKeys.every((k) => !!effectiveAttrs[k]) && !matchedVariant && (
                <p className="text-xs text-red-500 font-arabic">هذه التركيبة غير متوفرة</p>
              )}
              {!attrKeys.every((k) => !!effectiveAttrs[k]) && (
                <p className="text-xs text-gray-400 dark:text-gray-500 font-arabic">
                  يرجى اختيار {attrKeys.filter((k) => !effectiveAttrs[k]).join(' و ')}
                </p>
              )}
            </div>
          )}

          {/* Fallback: متغيرات بدون خصائص */}
          {attrKeys.length === 0 && product.variants && product.variants.length > 1 && (
            <div className="mb-6">
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300 font-arabic mb-3">اختر النسخة:</p>
              <div className="flex flex-wrap gap-2">
                {product.variants.map((v) => (
                  <button
                    key={v.id}
                    onClick={() => { setSelectedVariant(v); if (v.image) setSelectedImage(v.image); }}
                    disabled={!v.is_in_stock}
                    className={`px-4 py-2 rounded-xl border-2 text-sm font-arabic transition-all ${
                      selectedVariant?.id === v.id
                        ? 'border-primary-400 bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-400'
                        : 'border-gray-200 dark:border-[#2E2E2E] hover:border-gray-300 text-gray-600 dark:text-gray-400'
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
            <div className="flex items-center gap-2 bg-gray-50 dark:bg-[#1A1A1A] rounded-xl p-1 border border-gray-100 dark:border-[#2E2E2E]">
              <button
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-white dark:hover:bg-[#252525] transition-colors text-gray-700 dark:text-gray-300"
              >
                <Minus className="w-4 h-4" />
              </button>
              <span className="w-8 text-center font-bold text-gray-800 dark:text-gray-200">{quantity}</span>
              <button
                onClick={() => setQuantity(Math.min(activeVariant?.stock ?? 99, quantity + 1))}
                className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-white dark:hover:bg-[#252525] transition-colors text-gray-700 dark:text-gray-300"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
            {activeVariant && (
              <span className="text-sm text-gray-400 dark:text-gray-500 font-arabic">
                ({activeVariant.stock} متوفر)
              </span>
            )}
          </div>

          {/* Actions */}
          {isOwner ? (
            <div className="flex items-center gap-3 mb-8">
              <div className="flex-1 py-3.5 bg-primary-50 dark:bg-primary-900/20 border-2 border-primary-200 dark:border-primary-800/40 text-primary-700 dark:text-primary-400 font-bold rounded-xl font-arabic flex items-center justify-center gap-2">
                <Store className="w-5 h-5" />
                منتجك الخاص
              </div>
              <Link
                to={`/merchant/products`}
                className="p-3.5 rounded-xl border-2 border-primary-200 dark:border-primary-800/40 bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400 hover:bg-primary-100 dark:hover:bg-primary-900/30 transition-all"
                title="إدارة المنتج"
              >
                <Settings className="w-5 h-5" />
              </Link>
            </div>
          ) : (
            <div className="flex gap-3 mb-8">
              <button
                onClick={handleAddToCart}
                disabled={!allAttrsSelected || !(matchedVariant ?? selectedVariant)?.is_in_stock}
                className="flex-1 py-3.5 bg-primary-400 text-white font-bold rounded-xl hover:bg-primary-500 active:scale-95 transition-all font-arabic flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <ShoppingCart className="w-5 h-5" />
                {!allAttrsSelected
                  ? `اختر ${attrKeys.filter((k) => !effectiveAttrs[k]).join(' و ')}`
                  : (matchedVariant ?? selectedVariant)?.is_in_stock
                    ? 'أضف إلى السلة'
                    : 'غير متوفر'}
              </button>
              <button
                onClick={handleToggleWishlist}
                className={`p-3.5 rounded-xl border-2 transition-all ${
                  inWishlist
                    ? 'border-rose-300 bg-rose-50 dark:bg-rose-900/20 text-rose-500'
                    : 'border-gray-200 dark:border-[#2E2E2E] text-gray-500 dark:text-gray-400 hover:border-rose-200 hover:text-rose-400'
                }`}
              >
                <Heart className="w-5 h-5" fill={inWishlist ? 'currentColor' : 'none'} />
              </button>
            </div>
          )}

          {/* Trust badges */}
          <div className="grid grid-cols-2 gap-3">
            {[
              { icon: <Truck className="w-4 h-4" />, text: 'توصيل لجميع الولايات', color: 'text-blue-600 bg-blue-50 dark:bg-blue-900/20 dark:text-blue-400' },
              { icon: <Shield className="w-4 h-4" />, text: 'ضمان الإرجاع 7 أيام', color: 'text-green-600 bg-green-50 dark:bg-green-900/20 dark:text-green-400' },
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
              className={`flex-1 py-4 text-sm font-arabic font-medium transition-colors ${
                activeTab === tab.key
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
                        <div className="w-8 h-8 bg-primary-100 dark:bg-primary-900/20 rounded-full flex items-center justify-center text-primary-600 font-bold text-sm">
                          {r.user?.username?.[0]?.toUpperCase() ?? '؟'}
                        </div>
                        <span className="text-sm font-medium text-gray-800 dark:text-gray-200 font-arabic">{r.user?.username}</span>
                        {r.verified && (
                          <span className="px-2 py-0.5 bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400 text-xs rounded-full font-arabic">مشتري موثّق</span>
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
