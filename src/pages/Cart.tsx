import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Trash2, Plus, Minus, ShoppingCart, ArrowLeft } from 'lucide-react';
import { useCartStore } from '@/stores/cartStore';
import { useToast } from '@/stores/toastStore';

export default function Cart() {
  const { cart, isLoading, fetchCart, updateItem, removeItem } = useCartStore();
  const toast = useToast();

  useEffect(() => {
    fetchCart();
  }, [fetchCart]);

  const handleUpdate = async (itemId: number, qty: number) => {
    if (qty < 1) {
      await handleRemove(itemId);
      return;
    }
    try {
      await updateItem(itemId, qty);
    } catch {
      toast.error('تعذّر تحديث الكمية');
    }
  };

  const handleRemove = async (itemId: number) => {
    try {
      await removeItem(itemId);
      toast.success('تمت إزالة المنتج');
    } catch {
      toast.error('تعذّر إزالة المنتج');
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-10">
        <div className="animate-pulse space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-28 bg-gray-100 dark:bg-[#252525] rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  const items = cart?.items ?? [];

  if (items.length === 0) {
    return (
      <div className="max-w-lg mx-auto px-4 py-20 text-center">
        <div className="w-24 h-24 bg-gray-100 dark:bg-[#252525] rounded-3xl flex items-center justify-center mx-auto mb-6">
          <ShoppingCart className="w-12 h-12 text-gray-300 dark:text-gray-600" />
        </div>
        <h2 className="text-xl font-bold text-gray-800 dark:text-gray-200 font-arabic mb-2">السلة فارغة</h2>
        <p className="text-gray-500 dark:text-gray-400 font-arabic mb-8">لم تضف أي منتجات بعد</p>
        <Link
          to="/products"
          className="inline-flex items-center gap-2 px-6 py-3 bg-primary-400 text-white rounded-xl font-arabic hover:bg-primary-500 transition-colors"
        >
          <ShoppingCart className="w-4 h-4" />
          تسوّق الآن
        </Link>
      </div>
    );
  }

  const subtotal = items.reduce((sum, item) => sum + item.subtotal, 0);
  const shipping = subtotal > 5000 ? 0 : 500;
  const total = subtotal + shipping;

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 font-arabic mb-8">
        سلة التسوق <span className="text-gray-400 dark:text-gray-500 text-lg">({items.length} منتج)</span>
      </h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Items */}
        <div className="lg:col-span-2 space-y-4">
          {items.map((item) => (
            <div key={item.id} className="bg-white dark:bg-[#1E1E1E] rounded-2xl border border-gray-100 dark:border-[#2E2E2E] p-5 flex gap-4">
              {/* Image */}
              <div className="w-24 h-24 bg-gray-50 dark:bg-[#1A1A1A] rounded-xl overflow-hidden shrink-0">
                {item.variant?.images?.[0]?.image ? (
                  <img
                    src={item.variant.images[0].image}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <ShoppingCart className="w-8 h-8 text-gray-300 dark:text-gray-600" />
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-gray-800 dark:text-gray-200 font-arabic line-clamp-2 text-sm">
                  {item.variant?.name ?? 'منتج'}
                </p>
                <p className="text-xs text-gray-400 dark:text-gray-500 font-arabic mt-1">SKU: {item.variant?.sku}</p>
                <div className="flex items-center justify-between mt-3">
                  {/* Quantity */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleUpdate(item.id, item.quantity - 1)}
                      className="w-8 h-8 rounded-lg border border-gray-200 dark:border-[#2E2E2E] flex items-center justify-center hover:border-primary-300 transition-colors text-gray-700 dark:text-gray-300"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="w-8 text-center text-sm font-bold text-gray-800 dark:text-gray-200">{item.quantity}</span>
                    <button
                      onClick={() => handleUpdate(item.id, item.quantity + 1)}
                      className="w-8 h-8 rounded-lg border border-gray-200 dark:border-[#2E2E2E] flex items-center justify-center hover:border-primary-300 transition-colors text-gray-700 dark:text-gray-300"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="font-bold text-primary-600 font-mono text-sm">
                      {Number(item.subtotal).toLocaleString('ar-DZ')} دج
                    </span>
                    <button
                      onClick={() => handleRemove(item.id)}
                      className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Summary */}
        <div className="lg:col-span-1">
          <div className="bg-white dark:bg-[#1E1E1E] rounded-2xl border border-gray-100 dark:border-[#2E2E2E] p-6 sticky top-20">
            <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 font-arabic mb-5">ملخص الطلب</h3>
            <div className="space-y-3 mb-5">
              <div className="flex justify-between text-sm font-arabic">
                <span className="text-gray-500 dark:text-gray-400">المجموع الفرعي</span>
                <span className="font-mono text-gray-800 dark:text-gray-200">{Number(subtotal).toLocaleString('ar-DZ')} دج</span>
              </div>
              <div className="flex justify-between text-sm font-arabic">
                <span className="text-gray-500 dark:text-gray-400">الشحن</span>
                <span className={`font-mono ${shipping === 0 ? 'text-green-600 dark:text-green-500' : 'text-gray-800 dark:text-gray-200'}`}>
                  {shipping === 0 ? 'مجاني' : `${Number(shipping).toLocaleString('ar-DZ')} دج`}
                </span>
              </div>
              {shipping > 0 && (
                <p className="text-xs text-gray-400 dark:text-gray-500 font-arabic">الشحن مجاني عند الطلب فوق 5000 دج</p>
              )}
              <div className="border-t border-gray-100 dark:border-[#2E2E2E] pt-3 flex justify-between font-arabic font-bold">
                <span className="text-gray-900 dark:text-gray-100">الإجمالي</span>
                <span className="text-primary-600 font-mono text-lg">{Number(total).toLocaleString('ar-DZ')} دج</span>
              </div>
            </div>
            <Link
              to="/checkout"
              className="w-full py-3.5 bg-primary-400 text-white font-bold rounded-xl hover:bg-primary-500 transition-colors font-arabic flex items-center justify-center gap-2"
            >
              إتمام الشراء
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <Link
              to="/products"
              className="block text-center mt-3 text-sm text-gray-500 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 font-arabic transition-colors"
            >
              متابعة التسوق
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
