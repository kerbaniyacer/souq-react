import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Heart, ShoppingCart, Trash2 } from 'lucide-react';
import { useWishlistStore } from '@souq/stores/wishlistStore';
import { useToast } from '@souq/stores/toastStore';
import VariantSelectorModal from '@souq/components/store/VariantSelectorModal';
import type { Product } from '@souq/types';

export default function Wishlist() {
  const { items, isLoading, fetchWishlist, removeItem } = useWishlistStore();
  const toast = useToast();

  // Modal state — same pattern as ProductCard / HomePage
  const [modalProduct, setModalProduct] = useState<Product | null>(null);

  useEffect(() => {
    fetchWishlist();
  }, [fetchWishlist]);

  const handleRemove = async (productId: number) => {
    try {
      await removeItem(productId);
      toast.info('تمت الإزالة من المفضلة');
    } catch {
      toast.error('تعذّر إزالة المنتج');
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-10">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-5">
          {[...Array(4)].map((_, i) => <div key={i} className="aspect-square bg-gray-100 dark:bg-gray-800 rounded-2xl animate-pulse" />)}
        </div>
      </div>
    );
  }

  if (!items.length) {
    return (
      <div className="max-w-lg mx-auto px-4 py-20 text-center">
        <div className="w-24 h-24 bg-gray-100 dark:bg-gray-800 rounded-3xl flex items-center justify-center mx-auto mb-6">
          <Heart className="w-12 h-12 text-gray-300" />
        </div>
        <h2 className="text-xl font-bold text-gray-800 dark:text-gray-200 font-arabic mb-2">المفضلة فارغة</h2>
        <p className="text-gray-500 dark:text-gray-400 font-arabic mb-8">لم تضف أي منتجات إلى المفضلة بعد</p>
        <Link to="/products" className="inline-flex items-center gap-2 px-6 py-3 bg-primary-400 text-white rounded-xl font-arabic hover:bg-primary-500 transition-colors">
          استكشاف المنتجات
        </Link>
      </div>
    );
  }

  return (
    <>
      {/* VariantSelectorModal — shared with homepage & products page */}
      <VariantSelectorModal
        product={modalProduct}
        isOpen={!!modalProduct}
        onClose={() => setModalProduct(null)}
      />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 font-arabic mb-8">
          المفضلة <span className="text-gray-400 dark:text-gray-500 text-lg">({items.length})</span>
        </h1>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-5">
          {items.map((entry) => {
            const product = entry.product;
            if (!product) return null;
            const mainVariant = product.variants?.find((v) => v.is_main) ?? product.variants?.[0];
            const mainImage = product.main_image ?? product.images?.[0]?.image;

            return (
              <div key={entry.id} className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden hover:shadow-lg transition-all group">
                <Link to={`/products/${product.slug}`} className="block">
                  <div className="aspect-square bg-gray-50 dark:bg-gray-800 overflow-hidden relative">
                    <img
                      src={mainImage || '/images/default-product.jpg'}
                      alt={product.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = '/images/default-product.jpg';
                      }}
                    />
                  </div>
                </Link>
                <div className="p-3">
                  <Link to={`/products/${product.slug}`}>
                    <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200 font-arabic line-clamp-2 mb-2 hover:text-primary-600 transition-colors">
                      {product.name}
                    </h3>
                  </Link>
                  {mainVariant && (
                    <p className="text-primary-600 font-bold font-mono text-sm mb-3">
                      {Number(mainVariant.price).toLocaleString('ar-DZ')} دج
                    </p>
                  )}
                  <div className="flex gap-2">
                    <button
                      onClick={() => setModalProduct(product)}
                      disabled={!mainVariant}
                      className="flex-1 py-2 bg-primary-400 text-white text-xs rounded-lg hover:bg-primary-500 transition-colors font-arabic flex items-center justify-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <ShoppingCart className="w-3.5 h-3.5" />
                      أضف للسلة
                    </button>
                    <button
                      onClick={() => handleRemove(product.id)}
                      className="p-2 border border-gray-200 dark:border-gray-700 text-gray-400 dark:text-gray-500 hover:text-red-500 hover:border-red-200 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}
