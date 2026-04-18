import { Link } from 'react-router-dom';
import { Heart, ShoppingCart, Star } from 'lucide-react';
import type { Product } from '@/types';
import { useCartStore } from '@/stores/cartStore';
import { useWishlistStore } from '@/stores/wishlistStore';
import { useToast } from '@/stores/toastStore';

interface Props {
  product: Product;
}

export default function ProductCard({ product }: Props) {
  const { addItem: addToCart } = useCartStore();
  const { addItem: addToWishlist, removeItem: removeFromWishlist, isInWishlist } = useWishlistStore();
  const toast = useToast();

  const mainVariant = product.variants?.find((v) => v.is_main) ?? product.variants?.[0];
  const mainImage = product.main_image ?? product.images?.[0]?.image;
  const inWishlist = isInWishlist(product.id);

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (!mainVariant) return;
    try {
      await addToCart(mainVariant.id);
      toast.success('تمت الإضافة إلى السلة');
    } catch {
      toast.error('تعذّر إضافة المنتج');
    }
  };

  const handleToggleWishlist = async (e: React.MouseEvent) => {
    e.preventDefault();
    try {
      if (inWishlist) {
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

  const hasDiscount = mainVariant && mainVariant.old_price && mainVariant.old_price > mainVariant.price;

  return (
    <Link to={`/products/${product.slug}`} className="group block">
      <div className="bg-white dark:bg-gray-900 rounded-2xl overflow-hidden transition-all duration-300 border border-gray-100 dark:border-gray-800 hover:-translate-y-1 hover:shadow-xl dark:hover:shadow-gray-950/60">
        {/* Image */}
        <div className="relative aspect-square overflow-hidden bg-gray-50 dark:bg-gray-800">
          {mainImage ? (
            <img
              src={mainImage}
              alt={product.name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700">
              <ShoppingCart className="w-12 h-12 text-gray-300 dark:text-gray-600" />
            </div>
          )}

          {/* Badges */}
          <div className="absolute top-3 right-3 flex flex-col gap-1.5">
            {hasDiscount && (
              <span className="px-2.5 py-1 bg-red-500 text-white text-xs font-bold rounded-lg shadow-lg shadow-red-500/30">
                -{mainVariant.discount}%
              </span>
            )}
            {product.is_featured && (
              <span className="px-2.5 py-1 bg-primary-400 text-white text-xs font-bold rounded-lg font-arabic shadow-lg shadow-primary-400/30">
                مميز
              </span>
            )}
          </div>

          {/* Wishlist button - always visible in top-left */}
          <button
            onClick={handleToggleWishlist}
            className={`absolute top-3 left-3 p-2.5 rounded-xl shadow-md transition-all duration-200 ${
              inWishlist
                ? 'bg-rose-500 text-white scale-100'
                : 'bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm text-gray-500 dark:text-gray-400 hover:text-rose-500 hover:scale-110 opacity-0 group-hover:opacity-100'
            }`}
          >
            <Heart className="w-4 h-4" fill={inWishlist ? 'currentColor' : 'none'} />
          </button>
        </div>

        {/* Info */}
        <div className="p-4 bg-white dark:bg-gray-900">
          {/* Category */}
          <p className="text-xs text-gray-400 dark:text-gray-500 font-arabic mb-1.5">{product.category?.name}</p>

          {/* Name */}
          <h3 className="font-semibold text-gray-800 dark:text-gray-100 font-arabic text-sm leading-snug line-clamp-2 mb-2 min-h-[2.5rem]">
            {product.name}
          </h3>

          {/* Rating */}
          <div className="flex items-center gap-1 mb-3">
            {[1, 2, 3, 4, 5].map((s) => (
              <Star
                key={s}
                className="w-3.5 h-3.5"
                fill={s <= Math.round(product.rating) ? '#f59e0b' : 'none'}
                color={s <= Math.round(product.rating) ? '#f59e0b' : '#d1d5db'}
              />
            ))}
            <span className="text-xs text-gray-400 dark:text-gray-500 mr-1">({product.reviews_count})</span>
          </div>

          {/* Price + Add to cart button */}
          <div className="flex items-center justify-between gap-3">
            <div className="flex-1 min-w-0">
              {mainVariant ? (
                <>
                  <span className="text-lg font-bold text-primary-600 dark:text-primary-400 font-mono block">
                    {Number(mainVariant.price).toLocaleString('ar-DZ')} دج
                  </span>
                  {hasDiscount && (
                    <span className="text-xs text-gray-400 dark:text-gray-500 line-through font-mono block">
                      {Number(mainVariant.old_price).toLocaleString('ar-DZ')} دج
                    </span>
                  )}
                </>
              ) : (
                <span className="text-sm text-gray-400 dark:text-gray-500 font-arabic">غير متوفر</span>
              )}
            </div>

            <button
              onClick={handleAddToCart}
              disabled={!mainVariant?.is_in_stock}
              className="flex items-center gap-1.5 px-3 py-2.5 bg-primary-400 hover:bg-primary-500 text-white text-xs font-bold font-arabic rounded-xl transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed shadow-md shadow-primary-400/25 whitespace-nowrap"
            >
              <ShoppingCart className="w-3.5 h-3.5" />
              إضافة
            </button>
          </div>
        </div>
      </div>
    </Link>
  );
}
