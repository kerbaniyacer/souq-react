import { useState, useEffect, useCallback } from 'react';
import { X, ShoppingCart, ChevronRight, ChevronLeft, Minus, Plus, Check } from 'lucide-react';
import type { Product, ProductVariant } from '@shared/types';
import { useCartStore } from '@shared/stores/cartStore';
import { useAuthStore } from '@features/auth/stores/authStore';
import { useToast } from '@shared/stores/toastStore';
import { useNavigate } from 'react-router-dom';

interface Props {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
}

/* ── helpers ───────────────────────────────────────────────────── */

/** Collect all unique attribute keys across variants (e.g. ["اللون","المقاس"]) */
function getAttributeKeys(variants: ProductVariant[]): string[] {
  const keys = new Set<string>();
  variants.forEach((v) => Object.keys(v.attributes ?? {}).forEach((k) => keys.add(k)));
  return Array.from(keys);
}

/** Get unique values for a given attribute key */
function getAttributeValues(variants: ProductVariant[], key: string): string[] {
  const vals = new Set<string>();
  variants.forEach((v) => {
    const val = v.attributes?.[key];
    if (val) vals.add(val);
  });
  return Array.from(vals);
}

/** Find the variant that matches ALL selected attributes */
function findMatchingVariant(
  variants: ProductVariant[],
  selected: Record<string, string>,
): ProductVariant | undefined {
  return variants.find((v) =>
    Object.entries(selected).every(([k, val]) => v.attributes?.[k] === val),
  );
}

/* ── component ──────────────────────────────────────────────────── */

export default function VariantSelectorModal({ product, isOpen, onClose }: Props) {
  const { addItem } = useCartStore();
  const { isAuthenticated } = useAuthStore();
  const toast = useToast();
  const navigate = useNavigate();

  // ── state ──────────────────────────────────────────────────────
  // All hooks must be called at the top, unconditionally.
  const [selected, setSelected] = useState<Record<string, string>>({});
  const [quantity, setQuantity] = useState(1);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [isAdding, setIsAdding] = useState(false);

  // ── Derived Data (Safe for null product) ────────────────────────
  const variants = product?.variants ?? [];
  const attrKeys = getAttributeKeys(variants);
  const hasAttributes = attrKeys.length > 0;

  // Resolve the current active variant
  const activeVariant: ProductVariant | undefined = hasAttributes
    ? findMatchingVariant(variants, selected)
    : selected['__variantId']
      ? variants.find((v) => String(v.id) === selected['__variantId'])
      : variants.find((v) => v.is_main) ?? variants[0];

  // Images for the active variant (fall back to product images)
  const variantImages =
    activeVariant?.images && activeVariant.images.length > 0
      ? activeVariant.images
      : product?.images ?? [];

  const productFallbackImage = product?.main_image ?? product?.images?.[0]?.image;

  // ── Effects (Unconditional) ─────────────────────────────────────
  
  // Reset on open
  useEffect(() => {
    if (!isOpen || !product) return;
    setQuantity(1);
    setActiveImageIndex(0);
    setIsAdding(false);

    // Pre-select the main variant's attributes
    // Need current variants list
    const currentVariants = product.variants ?? [];
    const mainV = currentVariants.find((v) => v.is_main) ?? currentVariants[0];
    if (mainV?.attributes) {
      setSelected({ ...mainV.attributes });
    } else {
      setSelected({});
    }
  }, [isOpen, product?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // Reset image index when variant changes
  useEffect(() => {
    setActiveImageIndex(0);
  }, [activeVariant?.id]);

  // Keyboard close
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // ── Callbacks ──────────────────────────────────────────────────
  const handleSelectAttr = useCallback((key: string, value: string) => {
    setSelected((prev) => ({ ...prev, [key]: value }));
  }, []);

  // ── Early Return Guard ──────────────────────────────────────────
  // MUST be after all hooks to comply with React's architecture.
  if (!product || !isOpen) return null;

  /** Check if a specific attribute value is still available given OTHER selected attrs */
  const isValueAvailable = (key: string, value: string): boolean => {
    const test = { ...selected, [key]: value };
    return variants.some((v) =>
      Object.entries(test).every(([k, val]) => !v.attributes?.[k] || v.attributes[k] === val) &&
      v.is_active,
    );
  };

  // ── add to cart ────────────────────────────────────────────────
  const handleAddToCart = async () => {
    if (!isAuthenticated) {
      toast.info('سجّل دخولك أولاً');
      onClose();
      navigate('/login');
      return;
    }
    if (!activeVariant) {
      toast.error('اختر المتغير المطلوب أولاً');
      return;
    }
    if (!activeVariant.is_in_stock) {
      toast.error('هذا المتغير غير متوفر');
      return;
    }
    if (quantity > activeVariant.stock) {
      toast.error(`المخزون المتاح: ${activeVariant.stock} فقط`);
      return;
    }

    setIsAdding(true);
    try {
      await addItem(activeVariant.id, quantity);
      toast.success('تمت الإضافة إلى السلة ✓');
      onClose();
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'تعذّر إضافة المنتج');
    } finally {
      setIsAdding(false);
    }
  };

  // ── image navigation ───────────────────────────────────────────
  const prevImage = () =>
    setActiveImageIndex((i) => (i === 0 ? variantImages.length - 1 : i - 1));
  const nextImage = () =>
    setActiveImageIndex((i) => (i === variantImages.length - 1 ? 0 : i + 1));

  const currentImageSrc =
    variantImages[activeImageIndex]?.image ?? productFallbackImage ?? '/images/default-product.jpg';

  if (!isOpen) return null;

  // ── render ─────────────────────────────────────────────────────
  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-sm"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      {/* Modal panel */}
      <div
        className="
          w-full sm:max-w-2xl max-h-[92dvh] sm:max-h-[88vh]
          bg-white dark:bg-[#1a1a2e]
          rounded-t-3xl sm:rounded-3xl
          overflow-hidden flex flex-col
          shadow-2xl
          animate-in slide-in-from-bottom-8 sm:zoom-in-95 duration-300
        "
        dir="rtl"
      >
        {/* ── Header ── */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-gray-800/60 shrink-0">
          <h2 className="text-base font-bold text-gray-900 dark:text-gray-100 font-arabic line-clamp-1">
            {product.name}
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* ── Scrollable body ── */}
        <div className="overflow-y-auto flex-1">
          <div className="flex flex-col sm:flex-row gap-0 sm:gap-6 p-5">
            {/* ── Image viewer ── */}
            <div className="sm:w-56 sm:shrink-0 space-y-3">
              {/* Main image */}
              <div className="relative aspect-square rounded-2xl overflow-hidden bg-gray-100 dark:bg-gray-800">
                <img
                  key={currentImageSrc}
                  src={currentImageSrc}
                  alt={activeVariant?.name || product.name}
                  className="w-full h-full object-cover transition-all duration-300"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = '/images/default-product.jpg';
                  }}
                />
                {variantImages.length > 1 && (
                  <>
                    <button
                      onClick={prevImage}
                      className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-full bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm shadow text-gray-700 dark:text-gray-200 hover:bg-white dark:hover:bg-gray-800 transition-colors"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                    <button
                      onClick={nextImage}
                      className="absolute left-2 top-1/2 -translate-y-1/2 p-1.5 rounded-full bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm shadow text-gray-700 dark:text-gray-200 hover:bg-white dark:hover:bg-gray-800 transition-colors"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    {/* Dots */}
                    <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5">
                      {variantImages.map((_, i) => (
                        <button
                          key={i}
                          onClick={() => setActiveImageIndex(i)}
                          className={`w-1.5 h-1.5 rounded-full transition-all ${
                            i === activeImageIndex
                              ? 'bg-white scale-125'
                              : 'bg-white/50'
                          }`}
                        />
                      ))}
                    </div>
                  </>
                )}
              </div>

              {/* Thumbnails */}
              {variantImages.length > 1 && (
                <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
                  {variantImages.map((img, i) => (
                    <button
                      key={img.id ?? i}
                      onClick={() => setActiveImageIndex(i)}
                      className={`shrink-0 w-14 h-14 rounded-xl overflow-hidden border-2 transition-all ${
                        i === activeImageIndex
                          ? 'border-primary-400 shadow-md shadow-primary-400/20'
                          : 'border-transparent opacity-60 hover:opacity-100 hover:border-gray-300 dark:hover:border-gray-600'
                      }`}
                    >
                      <img
                        src={img.image}
                        alt=""
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = '/images/default-product.jpg';
                        }}
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* ── Options ── */}
            <div className="flex-1 space-y-5 mt-5 sm:mt-0">
              {/* Price */}
              {activeVariant ? (
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 font-mono">
                    {Number(activeVariant.price).toLocaleString('ar-DZ')} دج
                  </span>
                  {activeVariant.old_price && activeVariant.old_price > activeVariant.price && (
                    <>
                      <span className="text-sm text-gray-400 dark:text-gray-500 line-through font-mono">
                        {Number(activeVariant.old_price).toLocaleString('ar-DZ')}
                      </span>
                      <span className="px-2 py-0.5 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 text-xs font-bold rounded-lg font-arabic">
                        {activeVariant.discount}% خصم
                      </span>
                    </>
                  )}
                </div>
              ) : (
                <p className="text-gray-400 dark:text-gray-500 font-arabic text-sm">
                  اختر المتغيرات لعرض السعر
                </p>
              )}

              {/* Attribute selectors */}
              {attrKeys.map((key) => {
                const values = getAttributeValues(variants, key);
                return (
                  <div key={key} className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-gray-700 dark:text-gray-300 font-arabic">
                        {key}:
                      </span>
                      {selected[key] && (
                        <span className="text-sm text-primary-500 dark:text-primary-400 font-arabic font-medium">
                          {selected[key]}
                        </span>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {values.map((val) => {
                        const isSelected = selected[key] === val;
                        const available = isValueAvailable(key, val);
                        return (
                          <button
                            key={val}
                            onClick={() => available && handleSelectAttr(key, val)}
                            disabled={!available}
                            className={`
                              relative px-3.5 py-1.5 rounded-xl text-sm font-arabic font-medium border-2 transition-all duration-150
                              ${isSelected
                                ? 'border-primary-400 bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300 shadow-sm shadow-primary-400/20'
                                : available
                                  ? 'border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:border-primary-300 dark:hover:border-primary-600 hover:bg-gray-50 dark:hover:bg-gray-800'
                                  : 'border-gray-100 dark:border-gray-800 text-gray-300 dark:text-gray-600 cursor-not-allowed line-through'
                              }
                            `}
                          >
                            {isSelected && (
                              <Check className="inline-block w-3 h-3 ml-1 -mt-0.5 text-primary-500" />
                            )}
                            {val}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}

              {/* No attributes — show simple variant list */}
              {!hasAttributes && variants.length > 1 && (
                <div className="space-y-2">
                  <span className="text-sm font-semibold text-gray-700 dark:text-gray-300 font-arabic">
                    النسخة:
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {variants.map((v) => (
                      <button
                        key={v.id}
                        disabled={!v.is_active || !v.is_in_stock}
                        onClick={() => {
                          /* For variants without attributes, we just switch by toggling is_main
                             We track selection separately via local state */
                          setSelected({ __variantId: String(v.id) });
                        }}
                        className={`
                          px-3.5 py-1.5 rounded-xl text-sm font-arabic font-medium border-2 transition-all
                          ${String(v.id) === selected['__variantId'] || (!selected['__variantId'] && v.is_main)
                            ? 'border-primary-400 bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300'
                            : v.is_active && v.is_in_stock
                              ? 'border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:border-primary-300'
                              : 'border-gray-100 dark:border-gray-800 text-gray-300 dark:text-gray-600 cursor-not-allowed'
                          }
                        `}
                      >
                        {v.name || v.sku}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Stock badge — same logic as ProductDetail.tsx */}
              {activeVariant && (() => {
                const status = (activeVariant as any).stock_status || (activeVariant.is_in_stock ? 'high' : 'out_of_stock');
                const config: Record<string, { text: string; classes: string }> = {
                  high:         { text: 'متوفر في المخزن',                                         classes: 'text-green-700 bg-green-50 dark:bg-green-900/20' },
                  medium:       { text: 'كمية محدودة',                                             classes: 'text-orange-600 bg-orange-50 dark:bg-orange-900/10' },
                  low:          { text: `على وشك النفاذ - بقي ${activeVariant.stock} فقط`,         classes: 'text-red-600 bg-red-50 dark:bg-red-900/20' },
                  out_of_stock: { text: 'نفدت الكمية',                                             classes: 'text-gray-500 bg-gray-100 dark:bg-gray-800' },
                };
                const { text, classes } = config[status] || config.out_of_stock;
                return (
                  <span className={`inline-block text-xs font-arabic px-3 py-1 rounded-lg font-bold ${classes}`}>
                    {text}
                  </span>
                );
              })()}

              {/* Quantity selector */}
              {activeVariant?.is_in_stock && (
                <div className="space-y-2">
                  <span className="text-sm font-semibold text-gray-700 dark:text-gray-300 font-arabic">
                    الكمية:
                  </span>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                      disabled={quantity <= 1}
                      className="w-9 h-9 flex items-center justify-center rounded-xl border-2 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:border-primary-400 hover:text-primary-500 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <span className="w-10 text-center text-lg font-bold text-gray-900 dark:text-gray-100 font-mono tabular-nums">
                      {quantity}
                    </span>
                    <button
                      onClick={() =>
                        setQuantity((q) => Math.min(activeVariant.stock, q + 1))
                      }
                      disabled={quantity >= activeVariant.stock}
                      className="w-9 h-9 flex items-center justify-center rounded-xl border-2 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:border-primary-400 hover:text-primary-500 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── Footer CTA ── */}
        <div className="px-5 py-4 border-t border-gray-100 dark:border-gray-800/60 shrink-0">
          {!activeVariant && hasAttributes ? (
            <p className="text-center text-sm font-arabic text-gray-400 dark:text-gray-500 py-2">
              اختر المتغيرات المطلوبة لإتمام الإضافة
            </p>
          ) : (
            <button
              onClick={handleAddToCart}
              disabled={isAdding || !activeVariant?.is_in_stock}
              className="
                w-full flex items-center justify-center gap-2.5
                py-3.5 rounded-2xl font-bold font-arabic text-base
                bg-primary-400 hover:bg-primary-500
                disabled:opacity-60 disabled:cursor-not-allowed
                text-white shadow-lg shadow-primary-400/25
                transition-all duration-200 active:scale-[.98]
              "
            >
              {isAdding ? (
                <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <ShoppingCart className="w-5 h-5 shrink-0" />
                  {activeVariant?.is_in_stock ? 'أضف إلى السلة' : 'نفدت الكمية'}
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
