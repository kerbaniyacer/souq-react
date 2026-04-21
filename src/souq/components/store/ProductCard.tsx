import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Heart, ShoppingCart, Star } from 'lucide-react';
import type { Product } from '@souq/types';
import { useWishlistStore } from '@souq/stores/wishlistStore';
import { useAuthStore } from '@souq/stores/authStore';
import { useToast } from '@souq/stores/toastStore';
import VariantSelectorModal from './VariantSelectorModal';

interface Props {
  product: Product;
}

export default function ProductCard({ product }: Props) {
  const [modalOpen, setModalOpen] = useState(false);
  const { addItem: addToWishlist, removeItem: removeFromWishlist, isInWishlist } = useWishlistStore();
  const { isAuthenticated } = useAuthStore();
  const toast = useToast();
  const navigate = useNavigate();

  const mainVariant = product.variants?.find((v) => v.is_main) ?? product.variants?.[0];
  const mainImage = product.main_image ?? product.images?.[0]?.image;
  const inWishlist = isInWishlist(product.id);

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!mainVariant) return;
    setModalOpen(true);
  };

  const handleToggleWishlist = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isAuthenticated) {
      toast.info('سجّل دخولك لإضافة المنتجات إلى المفضلة');
      navigate('/login');
      return;
    }
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
    <>
    <VariantSelectorModal
      product={product}
      isOpen={modalOpen}
      onClose={() => setModalOpen(false)}
    />
    <Link to={`/products/${product.slug}`} className="group block">
      <div className="bg-white dark:bg-[#1a1a2e] rounded-2xl overflow-hidden transition-all duration-300 border border-gray-100 dark:border-gray-800/60 hover:-translate-y-1 hover:shadow-xl hover:shadow-black/10 dark:hover:shadow-black/30">
        {/* Image */}
        <div className="relative aspect-[4/5] overflow-hidden bg-gray-100 dark:bg-gray-800">
          <img
            src={mainImage || '/images/default-product.jpg'}
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            loading="lazy"
            onError={(e) => {
              (e.target as HTMLImageElement).src = '/images/default-product.jpg';
            }}
          />

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
              className="absolute bottom-3 inset-x-3 flex items-center justify-center gap-2 py-2.5 bg-primary-400 hover:bg-primary-500 text-white text-sm font-bold font-arabic rounded-xl transition-all duration-300 opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 shadow-lg shadow-primary-400/30 whitespace-nowrap z-10"
            >
              <ShoppingCart className="w-4 h-4 shrink-0" />
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

          {/* Stock badge — same logic as ProductDetail.tsx */}
          {mainVariant && (() => {
            const status = (mainVariant as any).stock_status || (mainVariant.is_in_stock ? 'high' : 'out_of_stock');
            const config: Record<string, { text: string; classes: string }> = {
              high:          { text: 'متوفر في المخزن',                                           classes: 'text-green-600 bg-green-50 dark:bg-green-900/20' },
              medium:        { text: 'كمية محدودة',                                               classes: 'text-orange-600 bg-orange-50 dark:bg-orange-900/10' },
              low:           { text: `على وشك النفاذ - بقي ${mainVariant.stock} فقط`,             classes: 'text-red-600 bg-red-50 dark:bg-red-900/20' },
              out_of_stock:  { text: 'غير متوفر',                                                 classes: 'text-gray-500 bg-gray-100 dark:bg-gray-800' },
            };
            const { text, classes } = config[status] || config.out_of_stock;
            return (
              <span className={`inline-block text-xs font-arabic px-2.5 py-1 rounded-md font-bold ${classes}`}>
                {text}
              </span>
            );
          })()}

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
    </>
  );
}
