import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Trash2, Plus, Minus, ShoppingCart,
  ArrowLeft, Tag, Truck, ShieldCheck, RotateCcw,
} from 'lucide-react';
import { useCartStore } from '@souq/stores/cartStore';
import { useToast } from '@souq/stores/toastStore';

/* ── colour detection helper ───────────────────────────────────── */
const COLOR_MAP: Record<string, string> = {
  أحمر: '#ef4444', أزرق: '#3b82f6', أخضر: '#22c55e', أصفر: '#eab308',
  برتقالي: '#f97316', بنفسجي: '#a855f7', وردي: '#ec4899', أبيض: '#f3f4f6',
  أسود: '#111827', رمادي: '#6b7280', بني: '#92400e', ذهبي: '#d97706',
  فضي: '#9ca3af', بيج: '#d4b896', كحلي: '#1e3a5f', زيتي: '#4d7c0f',
  red: '#ef4444', blue: '#3b82f6', green: '#22c55e', yellow: '#eab308',
  orange: '#f97316', purple: '#a855f7', pink: '#ec4899', white: '#f3f4f6',
  black: '#111827', gray: '#6b7280', grey: '#6b7280', brown: '#92400e',
};

function getColorHex(val: string): string | null {
  return COLOR_MAP[val.trim().toLowerCase()] ?? COLOR_MAP[val.trim()] ?? null;
}

const SIZE_KEYS = ['مقاس', 'الحجم', 'size', 'مقاس الحذاء'];

function isColorKey(key: string) {
  return ['لون', 'اللون', 'color', 'colour'].includes(key.toLowerCase().trim());
}
function isSizeKey(key: string) {
  return SIZE_KEYS.some((s) => key.toLowerCase().includes(s.toLowerCase()));
}

/* ── attribute chip ─────────────────────────────────────────────── */
function AttrChip({ attrKey, value }: { attrKey: string; value: string }) {
  const hex = isColorKey(attrKey) ? getColorHex(value) : null;

  if (hex) {
    const isDark = ['#111827', '#1e3a5f', '#4d7c0f', '#3b82f6', '#a855f7', '#ec4899', '#ef4444', '#f97316'].includes(hex);
    return (
      <span
        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold font-arabic border"
        style={{
          backgroundColor: hex + '20',
          borderColor: hex + '60',
          color: isDark ? hex : undefined,
        }}
      >
        <span
          className="w-3 h-3 rounded-full border border-white/40 shadow-sm shrink-0"
          style={{ backgroundColor: hex }}
        />
        {value}
      </span>
    );
  }

  if (isSizeKey(attrKey)) {
    return (
      <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold font-arabic bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700 min-w-[2rem] justify-center">
        {value}
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-arabic bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 border border-blue-100 dark:border-blue-800/40">
      <span className="text-blue-400 dark:text-blue-500 font-medium">{attrKey}:</span>
      {value}
    </span>
  );
}

/* ── main page ──────────────────────────────────────────────────── */
export default function Cart() {
  const { cart, isLoading, fetchCart, updateItem, removeItem } = useCartStore();
  const toast = useToast();

  useEffect(() => { fetchCart(); }, [fetchCart]);

  const handleUpdate = async (itemId: number, qty: number) => {
    if (qty < 1) { await handleRemove(itemId); return; }
    try { await updateItem(itemId, qty); }
    catch { toast.error('تعذّر تحديث الكمية'); }
  };

  const handleRemove = async (itemId: number) => {
    try { await removeItem(itemId); toast.success('تمت إزالة المنتج'); }
    catch { toast.error('تعذّر إزالة المنتج'); }
  };

  /* skeleton */
  if (isLoading) {
    return (
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="h-8 w-48 bg-gray-100 dark:bg-gray-800 rounded-xl mb-8 animate-pulse mr-auto" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-36 bg-gray-100 dark:bg-gray-800 rounded-2xl animate-pulse" />
            ))}
          </div>
          <div className="h-72 bg-gray-100 dark:bg-gray-800 rounded-2xl animate-pulse" />
        </div>
      </div>
    );
  }

  const items = cart?.items ?? [];

  /* empty */
  if (items.length === 0) {
    return (
      <div className="max-w-lg mx-auto px-4 py-24 text-center">
        <div className="relative w-28 h-28 mx-auto mb-8">
          <div className="absolute inset-0 bg-primary-100 dark:bg-primary-900/20 rounded-3xl rotate-6" />
          <div className="absolute inset-0 bg-gray-100 dark:bg-gray-800 rounded-3xl flex items-center justify-center">
            <ShoppingCart className="w-14 h-14 text-gray-300 dark:text-gray-600" />
          </div>
        </div>
        <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200 font-arabic mb-2">السلة فارغة</h2>
        <p className="text-gray-500 dark:text-gray-400 font-arabic mb-8">لم تضف أي منتجات بعد، ابدأ التسوق الآن!</p>
        <Link
          to="/products"
          className="inline-flex items-center gap-2 px-8 py-3.5 bg-primary-400 text-white rounded-2xl font-arabic font-bold hover:bg-primary-500 transition-colors shadow-lg shadow-primary-400/20"
        >
          <ShoppingCart className="w-5 h-5" />
          تسوّق الآن
        </Link>
      </div>
    );
  }

  const subtotal = items.reduce((sum, item) => sum + Number(item.subtotal || 0), 0);
  const shipping = subtotal > 5000 ? 0 : 500;
  const total = subtotal + shipping;

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10" dir="rtl">

      {/* Title */}
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 font-arabic">
          سلة التسوق
          <span className="mr-2 text-base font-normal text-gray-400 dark:text-gray-500">
            ({items.length} {items.length === 1 ? 'منتج' : 'منتجات'})
          </span>
        </h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">

        {/* ── Items list ── */}
        <div className="lg:col-span-2 space-y-4">
          {items.map((item) => {
            const variant = item.variant;
            const attrs = variant?.attributes ?? {};
            const attrEntries = Object.entries(attrs);
            const unitPrice = variant?.price ?? 0;
            const image = variant?.images?.[0]?.image;
            const isLowStock = variant?.stock && variant.stock <= 5 && variant.stock > 0;

            return (
              <div
                key={item.id}
                className="group bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden hover:border-gray-200 dark:hover:border-gray-700 hover:shadow-md dark:hover:shadow-black/20 transition-all duration-200"
              >
                <div className="flex gap-0">

                  {/* Image */}
                  <div className="relative w-32 sm:w-40 shrink-0">
                    <Link to={`/products/${variant?.product_slug ?? '#'}`}>
                      <img
                        src={image || '/images/default-product.jpg'}
                        alt={variant?.product_name ?? ''}
                        className="w-full h-full object-cover aspect-square"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = '/images/default-product.jpg';
                        }}
                      />
                    </Link>
                    {/* Discount badge */}
                    {variant?.discount && variant.discount > 0 ? (
                      <span className="absolute top-2 right-2 px-1.5 py-0.5 bg-red-500 text-white text-[10px] font-bold rounded-md shadow">
                        {variant.discount}%
                      </span>
                    ) : null}
                  </div>

                  {/* Body */}
                  <div className="flex-1 min-w-0 p-4 flex flex-col justify-between">

                    {/* Top row */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        {/* Product name */}
                        <Link
                          to={`/products/${variant?.product_slug ?? '#'}`}
                          className="font-bold text-gray-900 dark:text-gray-100 font-arabic text-sm sm:text-base leading-snug line-clamp-1 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
                        >
                          {variant?.product_name ?? 'المنتج'}
                        </Link>

                        {/* Variant name (if set) */}
                        {variant?.name && (
                          <p className="text-xs text-gray-500 dark:text-gray-400 font-arabic mt-0.5">
                            {variant.name}
                          </p>
                        )}

                        {/* Attribute chips */}
                        {attrEntries.length > 0 ? (
                          <div className="flex flex-wrap gap-1.5 mt-2">
                            {attrEntries.map(([k, v]) => (
                              <AttrChip key={k} attrKey={k} value={v} />
                            ))}
                          </div>
                        ) : null}

                        {/* SKU */}
                        <p className="text-[11px] text-gray-400 dark:text-gray-600 font-mono mt-1.5 flex items-center gap-1">
                          <Tag className="w-2.5 h-2.5" />
                          {variant?.sku}
                        </p>
                      </div>

                      {/* Delete */}
                      <button
                        onClick={() => handleRemove(item.id)}
                        className="p-2 text-gray-300 dark:text-gray-600 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-all duration-150 shrink-0 opacity-0 group-hover:opacity-100"
                        title="إزالة"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Bottom row */}
                    <div className="flex items-center justify-between gap-3 mt-3 flex-wrap">

                      {/* Qty + low stock */}
                      <div className="flex items-center gap-3">
                        <div className="flex items-center rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                          <button
                            onClick={() => handleUpdate(item.id, item.quantity - 1)}
                            className="w-8 h-8 flex items-center justify-center text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-primary-500 transition-colors"
                          >
                            <Minus className="w-3.5 h-3.5" />
                          </button>
                          <span className="w-9 text-center text-sm font-bold text-gray-900 dark:text-gray-100 font-mono tabular-nums select-none border-x border-gray-200 dark:border-gray-700 h-8 leading-8">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => handleUpdate(item.id, item.quantity + 1)}
                            disabled={variant?.stock != null && item.quantity >= variant.stock}
                            className="w-8 h-8 flex items-center justify-center text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-primary-500 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        {isLowStock && (
                          <span className="text-[11px] font-arabic text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 px-2 py-0.5 rounded-lg border border-amber-200 dark:border-amber-700/40">
                            باقي {variant!.stock} فقط
                          </span>
                        )}
                      </div>

                      {/* Price */}
                      <div className="text-right">
                        <p className="text-lg font-bold text-primary-600 dark:text-primary-400 font-mono leading-none">
                          {Number(item.subtotal).toLocaleString('ar-DZ')} دج
                        </p>
                        {item.quantity > 1 && (
                          <p className="text-[11px] text-gray-400 dark:text-gray-500 font-mono mt-0.5">
                            {Number(unitPrice).toLocaleString('ar-DZ')} دج × {item.quantity}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* ── Order Summary ── */}
        <div className="lg:col-span-1 space-y-4">
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-6 sticky top-20">
            <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 font-arabic mb-5 pb-4 border-b border-gray-100 dark:border-gray-800">
              ملخص الطلب
            </h3>

            <div className="space-y-3 mb-5">
              <div className="flex justify-between items-center text-sm font-arabic">
                <span className="text-gray-500 dark:text-gray-400">
                  المجموع الفرعي ({items.reduce((s, i) => s + i.quantity, 0)} قطعة)
                </span>
                <span className="font-mono font-semibold text-gray-800 dark:text-gray-200">
                  {Number(subtotal).toLocaleString('ar-DZ')} دج
                </span>
              </div>

              <div className="flex justify-between items-center text-sm font-arabic">
                <span className="text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
                  <Truck className="w-3.5 h-3.5" />
                  الشحن
                </span>
                {shipping === 0 ? (
                  <span className="font-arabic font-bold text-emerald-600 dark:text-emerald-400">مجاني 🎉</span>
                ) : (
                  <span className="font-mono font-semibold text-gray-800 dark:text-gray-200">
                    {Number(shipping).toLocaleString('ar-DZ')} دج
                  </span>
                )}
              </div>

              {shipping > 0 && (
                <div className="flex items-start gap-2 text-xs text-gray-400 dark:text-gray-500 font-arabic bg-gray-50 dark:bg-gray-800/50 rounded-xl p-2.5">
                  <Truck className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                  أضف {Number(5000 - subtotal).toLocaleString('ar-DZ')} دج للحصول على شحن مجاني
                </div>
              )}

              <div className="border-t border-gray-100 dark:border-gray-800 pt-4 mt-2">
                <div className="flex justify-between items-center font-arabic">
                  <span className="font-bold text-gray-800 dark:text-gray-200">الإجمالي</span>
                  <span className="text-xl font-bold text-primary-600 dark:text-primary-400 font-mono">
                    {Number(total).toLocaleString('ar-DZ')} دج
                  </span>
                </div>
              </div>
            </div>

            <Link
              to="/checkout"
              className="w-full py-3.5 bg-primary-400 text-white font-bold rounded-2xl hover:bg-primary-500 active:scale-[.98] transition-all font-arabic flex items-center justify-center gap-2 shadow-lg shadow-primary-400/20 text-base"
            >
              إتمام الشراء
              <ArrowLeft className="w-4 h-4" />
            </Link>

            <Link
              to="/products"
              className="block text-center mt-3 text-sm text-gray-500 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 font-arabic transition-colors py-1"
            >
              ← متابعة التسوق
            </Link>

            {/* Trust badges */}
            <div className="mt-5 pt-5 border-t border-gray-100 dark:border-gray-800 grid grid-cols-2 gap-3">
              {[
                { icon: ShieldCheck, label: 'دفع آمن' },
                { icon: RotateCcw, label: 'إرجاع مجاني' },
              ].map(({ icon: Icon, label }) => (
                <div key={label} className="flex flex-col items-center gap-1.5 text-gray-400 dark:text-gray-500">
                  <Icon className="w-5 h-5" />
                  <span className="text-[11px] font-arabic">{label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
