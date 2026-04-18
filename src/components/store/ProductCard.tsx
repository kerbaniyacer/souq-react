import { Link } from 'react-router-dom';
import { Heart, ShoppingCart, Star, Store } from 'lucide-react';
import type { Product } from '@/types';
import { useCartStore } from '@/stores/cartStore';
import { useWishlistStore } from '@/stores/wishlistStore';
import { useToast } from '@/stores/toastStore';
import { useAuthStore } from '@/stores/authStore';

interface Props {
  product: Product;
}

export default function ProductCard({ product }: Props) {
  const { addItem: addToCart } = useCartStore();
  const { addItem: addToWishlist, removeItem: removeFromWishlist, isInWishlist } = useWishlistStore();
  const toast = useToast();
  const { user } = useAuthStore();

  const mainVariant = product.variants?.find((v) => v.is_main) ?? product.variants?.[0];
  const mainImage = product.main_image ?? product.images?.[0]?.image;
  const inWishlist = isInWishlist(product.id);
  const isOwner = !!(user && product.seller && String(product.seller.id) === String(user.id));
  const hasDiscount = mainVariant && mainVariant.old_price && mainVariant.old_price > mainVariant.price;

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

  return (
    <Link to={`/products/${product.slug}`} className="group block">
      <div className="bg-white dark:bg-[#1E1E1E] border border-gray-200 dark:border-[#2E2E2E] rounded-2xl overflow-hidden
                      transition-all duration-400 hover:-translate-y-2
                      hover:border-primary-400/30 hover:shadow-2xl hover:shadow-gray-300/50 dark:hover:shadow-black/50
                      relative">

        {/* Image */}
        <div className="relative overflow-hidden bg-gray-100 dark:bg-[#151515] p-2" style={{ height: '220px' }}>
          {mainImage ? (
            <img
              src={mainImage}
              alt={product.name}
              className="w-full h-full object-contain transition-transform duration-600 group-hover:scale-105"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <ShoppingCart className="w-12 h-12 text-gray-300 dark:text-gray-700" />
            </div>
          )}

          {/* Top badges */}
          <div className="absolute top-3 right-3 flex flex-col gap-1.5">
            {hasDiscount && (
              <span className="px-2.5 py-1 bg-[#E94B5C] text-white text-xs font-bold rounded-lg shadow-lg">
                -{mainVariant.discount}%
              </span>
            )}
            {product.is_featured && (
              <span className="px-2.5 py-1 bg-gradient-to-l from-primary-400 to-primary-300 text-white text-xs font-bold rounded-lg shadow-lg font-arabic">
                مميز
              </span>
            )}
          </div>

          {/* Wishlist / Owner button - top left */}
          <div className="absolute top-3 left-3">
            {isOwner ? (
              <span className="w-9 h-9 flex items-center justify-center rounded-full bg-primary-400/80 text-white backdrop-blur-sm shadow-lg" title="منتجك الخاص">
                <Store className="w-4 h-4" />
              </span>
            ) : (
              <button
                onClick={handleToggleWishlist}
                className={`w-9 h-9 flex items-center justify-center rounded-full backdrop-blur-sm shadow-lg transition-all duration-200
                  ${inWishlist
                    ? 'bg-[#E94B5C] text-white'
                    : 'bg-black/50 text-white opacity-0 group-hover:opacity-100 hover:bg-[#E94B5C]'
                  }`}
              >
                <Heart className="w-4 h-4" fill={inWishlist ? 'currentColor' : 'none'} />
              </button>
            )}
          </div>

          {/* Overlay add-to-cart bar */}
          <div className="absolute inset-x-0 bottom-0 p-3
                          bg-gradient-to-t from-black/85 via-black/40 to-transparent
                          translate-y-full group-hover:translate-y-0
                          transition-transform duration-300 flex gap-2">
            {isOwner ? (
              <div className="w-full py-2.5 flex items-center justify-center gap-2 bg-primary-400/20 border border-primary-400/30 text-primary-300 rounded-xl text-sm font-arabic">
                <Store className="w-4 h-4" /> منتجك الخاص
              </div>
            ) : (
              <button
                onClick={handleAddToCart}
                disabled={!mainVariant?.is_in_stock}
                className="flex-1 py-2.5 bg-gradient-to-l from-primary-400 to-primary-300 text-white text-sm font-bold font-arabic rounded-xl
                           hover:shadow-lg hover:shadow-primary-400/30 active:scale-95 transition-all
                           disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <ShoppingCart className="w-4 h-4" />
                {mainVariant?.is_in_stock ? 'أضف للسلة' : 'نفد المخزون'}
              </button>
            )}
          </div>
        </div>

        {/* Info */}
        <div className="p-4">
          <p className="text-xs text-gray-400 dark:text-gray-600 font-arabic mb-1">{product.category?.name}</p>
          <h3 className="font-semibold text-gray-800 dark:text-gray-200 font-arabic text-sm leading-snug line-clamp-2 mb-2.5">
            {product.name}
          </h3>

          {/* Stars */}
          <div className="flex items-center gap-1 mb-3">
            {[1, 2, 3, 4, 5].map((s) => (
              <Star
                key={s}
                className={`w-3.5 h-3.5 ${s <= Math.round(product.rating) ? '' : 'text-gray-300 dark:text-[#3a3a3a]'}`}
                fill={s <= Math.round(product.rating) ? '#D4A853' : 'none'}
                color={s <= Math.round(product.rating) ? '#D4A853' : 'currentColor'}
              />
            ))}
            <span className="text-xs text-gray-400 dark:text-gray-600 mr-1">({product.reviews_count})</span>
          </div>

          {/* Price */}
          <div className="flex items-end justify-between">
            <div>
              {mainVariant ? (
                <>
                  <span className="text-lg font-bold text-primary-300 font-mono">
                    {Number(mainVariant.price).toLocaleString('ar-DZ')} دج
                  </span>
                  {hasDiscount && (
                    <span className="block text-xs text-gray-500 dark:text-gray-700 line-through font-mono mt-0.5">
                      {Number(mainVariant.old_price).toLocaleString('ar-DZ')} دج
                    </span>
                  )}
                </>
              ) : (
                <span className="text-sm text-gray-400 dark:text-gray-600 font-arabic">غير متوفر</span>
              )}
            </div>

            {/* Mobile cart btn (always visible) */}
            {!isOwner && (
              <button
                onClick={handleAddToCart}
                disabled={!mainVariant?.is_in_stock}
                className="md:hidden p-2.5 bg-primary-400/15 border border-primary-400/25 text-primary-300 rounded-xl
                           hover:bg-primary-400 hover:text-white active:scale-95 transition-all
                           disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <ShoppingCart className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}
