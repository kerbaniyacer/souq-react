import { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  ShoppingBag, Shield, Truck, Headphones, ChevronRight, LayoutDashboard, Package,
  Smartphone, Watch, Laptop, Camera, Shirt, Sparkles, BookOpen,
  Home as HomeIcon, Dumbbell, GlassWater, Footprints, Palette
} from 'lucide-react';
import { productsApi, categoriesApi } from '@souq/services/api';
import type { Product, Category } from '@souq/types';
import ProductCard from '@souq/components/store/ProductCard';
import { useAuthStore } from '@souq/stores/authStore';
import InteractiveHero from '@souq/components/common/InteractiveHero';

function FeaturesSection() {
  const features = [
    {
      icon: <Truck className="w-6 h-6" />,
      title: 'توصيل سريع',
      desc: 'توصيل إلى جميع ولايات الجزائر خلال 24-48 ساعة',
      color: 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400',
    },
    {
      icon: <Shield className="w-6 h-6" />,
      title: 'دفع آمن',
      desc: 'نظام دفع مؤمّن بالكامل مع عدة خيارات للدفع',
      color: 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400',
    },
    {
      icon: <Headphones className="w-6 h-6" />,
      title: 'دعم 24/7',
      desc: 'فريق دعم متاح على مدار الساعة لمساعدتك',
      color: 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400',
    },
    {
      icon: <ShoppingBag className="w-6 h-6" />,
      title: 'إرجاع مجاني',
      desc: 'ضمان الإرجاع خلال 7 أيام بدون أي شروط',
      color: 'bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400',
    },
  ];

  return (
    <section className="py-16 bg-white dark:bg-gray-900 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((f) => (
            <div
              key={f.title}
              className="flex items-start gap-4 p-6 rounded-2xl border border-gray-100 dark:border-gray-800 hover:border-primary-200 dark:hover:border-primary-800 hover:shadow-md dark:hover:shadow-gray-950/30 transition-all bg-white dark:bg-gray-900"
            >
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${f.color}`}>
                {f.icon}
              </div>
              <div>
                <h3 className="font-bold text-gray-800 dark:text-gray-200 font-arabic mb-1">{f.title}</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 font-arabic leading-relaxed">{f.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* Category icon mapping */
function getCategoryIcon(slug: string, name: string) {
  const iconMap: Record<string, { icon: React.ReactNode; gradient: string; shadowColor: string }> = {
    electronics: {
      icon: <Laptop className="w-7 h-7 text-white" />,
      gradient: 'linear-gradient(135deg, #3B82F6, #1D4ED8)',
      shadowColor: 'rgba(59,130,246,0.3)',
    },
    'mens-fashion': {
      icon: <Shirt className="w-7 h-7 text-white" />,
      gradient: 'linear-gradient(135deg, #8B5CF6, #6D28D9)',
      shadowColor: 'rgba(139,92,246,0.3)',
    },
    'womens-fashion': {
      icon: <Sparkles className="w-7 h-7 text-white" />,
      gradient: 'linear-gradient(135deg, #EC4899, #BE185D)',
      shadowColor: 'rgba(236,72,153,0.3)',
    },
    'home-kitchen': {
      icon: <HomeIcon className="w-7 h-7 text-white" />,
      gradient: 'linear-gradient(135deg, #F59E0B, #D97706)',
      shadowColor: 'rgba(245,158,11,0.3)',
    },
    sports: {
      icon: <Dumbbell className="w-7 h-7 text-white" />,
      gradient: 'linear-gradient(135deg, #EF4444, #DC2626)',
      shadowColor: 'rgba(239,68,68,0.3)',
    },
    books: {
      icon: <BookOpen className="w-7 h-7 text-white" />,
      gradient: 'linear-gradient(135deg, #14B8A6, #0D9488)',
      shadowColor: 'rgba(20,184,166,0.3)',
    },
    smartphones: {
      icon: <Smartphone className="w-7 h-7 text-white" />,
      gradient: 'linear-gradient(135deg, #6366F1, #4F46E5)',
      shadowColor: 'rgba(99,102,241,0.3)',
    },
    smartwatches: {
      icon: <Watch className="w-7 h-7 text-white" />,
      gradient: 'linear-gradient(135deg, #5C8A6E, #3a5b46)',
      shadowColor: 'rgba(92,138,110,0.3)',
    },
    'perfumes-accessories': {
      icon: <GlassWater className="w-7 h-7 text-white" />,
      gradient: 'linear-gradient(135deg, #C9897A, #A8705F)',
      shadowColor: 'rgba(201,137,122,0.3)',
    },
    photography: {
      icon: <Camera className="w-7 h-7 text-white" />,
      gradient: 'linear-gradient(135deg, #78716C, #57534E)',
      shadowColor: 'rgba(120,113,108,0.3)',
    },
    sneakers: {
      icon: <Footprints className="w-7 h-7 text-white" />,
      gradient: 'linear-gradient(135deg, #0EA5E9, #0284C7)',
      shadowColor: 'rgba(14,165,233,0.3)',
    },
    sunglasses: {
      icon: <Palette className="w-7 h-7 text-white" />,
      gradient: 'linear-gradient(135deg, #D4A853, #B8860B)',
      shadowColor: 'rgba(212,168,83,0.3)',
    },
  };

  return iconMap[slug] || {
    icon: <ShoppingBag className="w-7 h-7 text-white" />,
    gradient: 'linear-gradient(135deg, #5C8A6E, #4a7259)',
    shadowColor: 'rgba(92,138,110,0.3)',
  };
}

export default function Home() {
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [newProducts, setNewProducts] = useState<Product[]>([]);
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [featuredRes, newRes, catRes, allRes] = await Promise.allSettled([
          productsApi.featured(),
          productsApi.list({ ordering: '-created_at', page_size: 8 }),
          categoriesApi.list(),
          productsApi.list({ page_size: 200 }),
        ]);

        if (featuredRes.status === 'fulfilled') setFeaturedProducts(featuredRes.value.data.results ?? featuredRes.value.data);
        if (newRes.status === 'fulfilled') setNewProducts(newRes.value.data.results ?? newRes.value.data);
        if (catRes.status === 'fulfilled') setCategories(catRes.value.data.results ?? catRes.value.data);
        if (allRes.status === 'fulfilled') setAllProducts(allRes.value.data.results ?? allRes.value.data);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const categoriesWithCount = useMemo(() => {
    const countMap: Record<string, number> = {};
    allProducts.forEach((p) => {
      const catSlug = p.category?.slug;
      if (catSlug) countMap[catSlug] = (countMap[catSlug] || 0) + 1;
    });
    return categories
      .filter((c) => !c.parent_id)
      .map((c) => ({ ...c, products_count: countMap[c.slug] || 0 }));
  }, [categories, allProducts]);

  return (
    <div>
      {/* Interactive Hero with Canvas Animation */}
      <InteractiveHero />

      <FeaturesSection />

      {/* Categories - New Design */}
      {categoriesWithCount.length > 0 && (
        <section className="py-20 bg-page-bg dark:bg-gray-950 transition-colors relative overflow-hidden">
          {/* Background decoration */}
          <div className="absolute inset-0 pointer-events-none opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(circle at 30% 50%, #5C8A6E 0%, transparent 50%), radial-gradient(circle at 70% 80%, #C9897A 0%, transparent 50%)' }} />

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
            {/* Section Header */}
            <div className="text-center mb-14">
              <span className="section-tag inline-block mb-4">الأقسام</span>
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white font-arabic mb-4">
                اختر فئة المنتج
              </h2>
              <p className="text-gray-500 dark:text-gray-400 font-arabic text-lg max-w-2xl mx-auto leading-relaxed">
                استكشف مجموعتنا المتنوعة من المنتجات المصنّفة بعناية لسهولة التصفح
              </p>
            </div>

            {/* Category Cards Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-5">
              {categoriesWithCount.slice(0, 10).map((cat, index) => {
                const iconInfo = getCategoryIcon(cat.slug, cat.name);
                return (
                  <Link
                    key={cat.id}
                    to={`/products?category=${cat.slug}`}
                    className="group relative flex flex-col items-center gap-4 p-6 bg-white dark:bg-[#1E1E1E] rounded-2xl border border-gray-100 dark:border-gray-800/80 hover:border-primary-400/50 dark:hover:border-primary-400/40 transition-all duration-300 hover:-translate-y-1.5 hover:shadow-xl hover:shadow-primary-400/10 dark:hover:shadow-primary-400/5"
                    style={{ animationDelay: `${index * 80}ms` }}
                  >
                    {/* Icon Circle */}
                    <div
                      className="w-16 h-16 rounded-2xl flex items-center justify-center transition-all duration-300 group-hover:scale-110 group-hover:shadow-lg"
                      style={{
                        background: iconInfo.gradient,
                        boxShadow: `0 4px 15px ${iconInfo.shadowColor}`,
                      }}
                    >
                      {iconInfo.icon}
                    </div>

                    {/* Category Name */}
                    <h3 className="font-bold text-gray-800 dark:text-white font-arabic text-sm text-center leading-snug group-hover:text-primary-600 dark:group-hover:text-primary-300 transition-colors">
                      {cat.name}
                    </h3>

                    {/* Product Count */}
                    <span className="text-xs text-gray-400 dark:text-gray-500 font-arabic font-medium">
                      {cat.products_count} منتج
                    </span>

                    {/* Hover indicator */}
                    <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-0 h-0.5 bg-primary-400 rounded-full transition-all duration-300 group-hover:w-12" />
                  </Link>
                );
              })}
            </div>

            {/* Show More */}
            <div className="text-center mt-10">
              <Link
                to="/products"
                className="inline-flex items-center gap-2 px-8 py-3 bg-white dark:bg-[#1E1E1E] text-primary-600 dark:text-primary-300 font-bold font-arabic text-sm rounded-xl border-2 border-primary-200 dark:border-primary-800/50 hover:bg-primary-50 dark:hover:bg-primary-900/20 hover:border-primary-400 dark:hover:border-primary-500 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md hover:shadow-primary-400/10"
              >
                عرض جميع الأقسام
                <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* Featured Products */}
      {(loading || featuredProducts.length > 0) && (
        <section className="py-16 bg-white dark:bg-gray-900 transition-colors">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 font-arabic">منتجات مميزة</h2>
              <Link to="/products?featured=true" className="flex items-center gap-1 text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 text-sm font-arabic">
                عرض الكل <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
            {loading ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-5">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="bg-gray-100 dark:bg-gray-800 rounded-2xl aspect-[4/5] animate-pulse" />
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-5">
                {featuredProducts.slice(0, 8).map((p) => (
                  <ProductCard key={p.id} product={p} />
                ))}
              </div>
            )}
          </div>
        </section>
      )}

      {/* New Products */}
      {(loading || newProducts.length > 0) && (
        <section className="py-16 bg-page-bg dark:bg-gray-950 transition-colors">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 font-arabic">أحدث المنتجات</h2>
              <Link to="/products?ordering=-created_at" className="flex items-center gap-1 text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 text-sm font-arabic">
                عرض الكل <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
            {loading ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-5">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="bg-gray-100 dark:bg-gray-800 rounded-2xl aspect-[4/5] animate-pulse" />
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-5">
                {newProducts.slice(0, 8).map((p) => (
                  <ProductCard key={p.id} product={p} />
                ))}
              </div>
            )}
          </div>
        </section>
      )}

      {/* CTA */}
      <CTASection />
    </div>
  );
}

function CTASection() {
  const { isAuthenticated, profile } = useAuthStore();

  if (isAuthenticated) {
    if (profile?.is_seller) {
      return (
        <section className="py-16 bg-gradient-to-br from-primary-50 to-sage-light/20 dark:from-gray-900 dark:to-gray-950 transition-colors">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-100 dark:bg-primary-900/30 rounded-2xl mb-6">
              <LayoutDashboard className="w-8 h-8 text-primary-600 dark:text-primary-400" />
            </div>
            <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100 font-arabic mb-4">
              مرحباً بك في لوحة التاجر
            </h2>
            <p className="text-gray-600 dark:text-gray-400 font-arabic mb-8 max-w-xl mx-auto">
              إدارة منتجاتك، متابعة طلباتك، وتنمية تجارتك بسهولة.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/merchant/products"
                className="inline-flex items-center gap-2 px-8 py-4 bg-primary-400 text-white rounded-2xl hover:bg-primary-500 transition-all font-arabic text-lg shadow-lg hover:shadow-primary-400/30 hover:shadow-xl"
              >
                <Package className="w-5 h-5" />
                منتجاتي
              </Link>
              <Link
                to="/merchant/dashboard"
                className="inline-flex items-center gap-2 px-8 py-4 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 rounded-2xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-all font-arabic text-lg border border-gray-200 dark:border-gray-700 shadow-sm"
              >
                <LayoutDashboard className="w-5 h-5" />
                لوحة التحكم
              </Link>
            </div>
          </div>
        </section>
      );
    }

    return (
      <section className="py-16 bg-gradient-to-br from-primary-50 to-sage-light/20 dark:from-gray-900 dark:to-gray-950 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-100 dark:bg-primary-900/30 rounded-2xl mb-6">
            <ShoppingBag className="w-8 h-8 text-primary-600 dark:text-primary-400" />
          </div>
          <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100 font-arabic mb-4">
            استمتع بتجربة تسوق مميزة
          </h2>
          <p className="text-gray-600 dark:text-gray-400 font-arabic mb-8 max-w-xl mx-auto">
            تابع طلباتك، استعرض قائمة رغباتك، واكتشف منتجات جديدة كل يوم.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/orders"
              className="inline-flex items-center gap-2 px-8 py-4 bg-primary-400 text-white rounded-2xl hover:bg-primary-500 transition-all font-arabic text-lg shadow-lg hover:shadow-primary-400/30 hover:shadow-xl"
            >
              <Package className="w-5 h-5" />
              طلباتي
            </Link>
            <Link
              to="/products"
              className="inline-flex items-center gap-2 px-8 py-4 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 rounded-2xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-all font-arabic text-lg border border-gray-200 dark:border-gray-700 shadow-sm"
            >
              <ShoppingBag className="w-5 h-5" />
              تسوّق الآن
            </Link>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-16 bg-gradient-to-br from-primary-50 to-sage-light/20 dark:from-gray-900 dark:to-gray-950 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white dark:bg-gray-900 rounded-3xl p-10 md:p-14 text-center shadow-sm dark:shadow-gray-950/30 border border-gray-100 dark:border-gray-800">
          <span className="inline-block px-4 py-2 bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 text-sm rounded-full font-arabic mb-6">
            🏪 انضم إلى آلاف التجار
          </span>
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-gray-100 font-arabic mb-4">
            هل أنت تاجر؟
          </h2>
          <p className="text-gray-600 dark:text-gray-400 font-arabic text-lg mb-8 max-w-2xl mx-auto leading-relaxed">
            ابدأ البيع على سوق الآن واوصل منتجاتك إلى آلاف الزبائن في جميع ولايات الجزائر.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/register?type=seller"
              className="inline-flex items-center gap-2 px-8 py-4 bg-primary-400 text-white rounded-2xl hover:bg-primary-500 transition-all font-arabic text-lg shadow-lg hover:shadow-primary-400/30 hover:shadow-xl"
            >
              <ShoppingBag className="w-5 h-5" />
              ابدأ البيع الآن
              <ChevronRight className="w-5 h-5" />
            </Link>
            <Link
              to="/login"
              className="inline-flex items-center gap-2 px-8 py-4 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 rounded-2xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-all font-arabic text-lg border border-gray-200 dark:border-gray-700 shadow-sm"
            >
              تسجيل الدخول
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
