import { Link } from 'react-router-dom';
import { Heart, ShoppingCart, Star } from 'lucide-react';
import type { Product } from '@types';
import { useCartStore } from '@stores/cartStore';
import { useWishlistStore } from '@stores/wishlistStore';
import { useToast } from '@stores/toastStore';

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
    e.stopPropagation();
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
    e.stopPropagation();
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
  const discountPercent = hasDiscount ? Math.round(((mainVariant.old_price! - mainVariant.price) / mainVariant.old_price!) * 100) : 0;

  return (
    <Link to={`/products/${product.slug}`} className="group block">
      <div className="bg-white dark:bg-[#1a1a2e] rounded-2xl overflow-hidden transition-all duration-300 border border-gray-100 dark:border-gray-800/60 hover:-translate-y-1 hover:shadow-xl hover:shadow-black/10 dark:hover:shadow-black/30">
        {/* Image */}
        <div className="relative aspect-[4/5] overflow-hidden bg-gray-100 dark:bg-gray-800">
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

          {/* Gradient overlay on hover */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

          {/* Discount badge - top right */}
          {hasDiscount && (
            <span className="absolute top-3 right-3 px-2.5 py-1 bg-red-500 text-white text-xs font-bold rounded-lg shadow-lg shadow-red-500/25 z-10">
              {discountPercent}%
            </span>
          )}

          {/* Featured badge */}
          {product.is_featured && (
            <span className="absolute top-3 right-3 px-2.5 py-1 bg-amber-500 text-white text-xs font-bold rounded-lg shadow-lg shadow-amber-500/25 z-10">
              مميز
            </span>
          )}

          {/* Wishlist button - always visible top left */}
          <button
            onClick={handleToggleWishlist}
            className={`absolute top-3 left-3 p-2 rounded-xl transition-all duration-200 z-10 ${
              inWishlist
                ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/30'
                : 'bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm text-gray-400 dark:text-gray-500 hover:text-rose-500 hover:bg-white dark:hover:bg-gray-700 shadow-md'
            }`}
          >
            <Heart className="w-4 h-4" fill={inWishlist ? 'currentColor' : 'none'} />
          </button>

          {/* Add to cart - appears on hover */}
          {mainVariant?.is_in_stock && (
            <button
              onClick={handleAddToCart}
              className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-2 px-5 py-2.5 bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm text-gray-800 dark:text-white text-sm font-bold font-arabic rounded-xl transition-all duration-300 opacity-0 translate-y-3 group-hover:opacity-100 group-hover:translate-y-0 shadow-xl border border-gray-200/50 dark:border-gray-700/50 hover:bg-primary-400 hover:text-white hover:border-primary-400 z-10"
            >
              <ShoppingCart className="w-4 h-4" />
              أضف إلى السلة
            </button>
          )}
        </div>

        {/* Info */}
        <div className="p-4 space-y-2">
          {/* Name */}
          <h3 className="font-semibold text-gray-800 dark:text-gray-100 font-arabic text-sm leading-snug line-clamp-2 min-h-[2.5rem] group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
            {product.name}
          </h3>

          {/* Rating */}
          <div className="flex items-center gap-1">
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

          {/* Price */}
          {mainVariant ? (
            <div className="flex items-center gap-2">
              <span className="text-lg font-bold text-emerald-600 dark:text-emerald-400 font-mono">
                {Number(mainVariant.price).toLocaleString('ar-DZ')} دج
              </span>
              {hasDiscount && (
                <span className="text-sm text-gray-400 dark:text-gray-500 line-through font-mono">
                  {Number(mainVariant.old_price).toLocaleString('ar-DZ')}
                </span>
              )}
            </div>
          ) : (
            <span className="text-sm text-gray-400 dark:text-gray-500 font-arabic">غير متوفر</span>
          )}
        </div>
      </div>
    </Link>
  );
}
