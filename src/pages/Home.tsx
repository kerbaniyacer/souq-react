import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ShoppingBag, Shield, Truck, Headphones, ChevronLeft, LayoutDashboard, Package, Star, ArrowLeft } from 'lucide-react';
import { productsApi, categoriesApi } from '@/services/api';
import type { Product, Category } from '@/types';
import ProductCard from '@/components/store/ProductCard';
import HeroCarousel from '@/components/common/HeroCarousel';
import { useAuthStore } from '@/stores/authStore';

/* ── Features ── */
function FeaturesSection() {
  const features = [
    { icon: <Truck className="w-6 h-6" />, title: 'توصيل سريع', desc: 'توصيل إلى جميع ولايات الجزائر خلال 24-48 ساعة', darkColor: 'rgba(92,138,110,0.12)', lightColor: 'rgba(92,138,110,0.08)', iconColor: '#5C8A6E' },
    { icon: <Shield className="w-6 h-6" />, title: 'دفع آمن', desc: 'نظام دفع مؤمّن بالكامل مع عدة خيارات للدفع', darkColor: 'rgba(201,137,122,0.12)', lightColor: 'rgba(201,137,122,0.08)', iconColor: '#C9897A' },
    { icon: <Headphones className="w-6 h-6" />, title: 'دعم 24/7', desc: 'فريق دعم متاح على مدار الساعة لمساعدتك', darkColor: 'rgba(212,168,83,0.12)', lightColor: 'rgba(212,168,83,0.08)', iconColor: '#D4A853' },
    { icon: <ShoppingBag className="w-6 h-6" />, title: 'إرجاع مجاني', desc: 'ضمان الإرجاع خلال 7 أيام بدون أي شروط', darkColor: 'rgba(92,138,110,0.12)', lightColor: 'rgba(92,138,110,0.08)', iconColor: '#5C8A6E' },
  ];

  return (
    <section className="py-16 border-y border-gray-200 dark:border-[#1E1E1E] bg-gray-50 dark:bg-[#1A1A1A]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {features.map((f) => (
            <div key={f.title}
              className="flex items-start gap-4 p-5 rounded-2xl border border-gray-200 dark:border-[#2E2E2E] hover:border-primary-400/40 transition-all duration-300 group bg-white dark:bg-[#222222]">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 transition-transform duration-300 group-hover:scale-110"
                style={{ background: f.darkColor, color: f.iconColor }}>
                {f.icon}
              </div>
              <div>
                <h3 className="font-bold text-gray-800 dark:text-gray-200 font-arabic mb-1">{f.title}</h3>
                <p className="text-sm text-gray-500 font-arabic leading-relaxed">{f.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ── Section header ── */
function SectionHeader({ tag, title, href }: { tag: string; title: string; href: string }) {
  return (
    <div className="flex items-end justify-between mb-8">
      <div>
        <span className="section-tag mb-2 block">{tag}</span>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 font-arabic">{title}</h2>
      </div>
      <Link to={href} className="flex items-center gap-1 text-primary-500 dark:text-primary-400 hover:text-primary-400 dark:hover:text-primary-300 text-sm font-arabic transition-colors group">
        عرض الكل <ChevronLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
      </Link>
    </div>
  );
}

/* ── Skeleton ── */
function ProductSkeleton() {
  return (
    <div className="bg-white dark:bg-[#1E1E1E] border border-gray-200 dark:border-[#2E2E2E] rounded-2xl overflow-hidden">
      <div className="bg-gray-200 dark:bg-[#252525] animate-shimmer" style={{ height: '220px' }} />
      <div className="p-4 space-y-3">
        <div className="h-3 bg-gray-200 dark:bg-[#252525] rounded-lg w-1/3 animate-shimmer" />
        <div className="h-4 bg-gray-200 dark:bg-[#252525] rounded-lg w-4/5 animate-shimmer" />
        <div className="h-4 bg-gray-200 dark:bg-[#252525] rounded-lg w-3/5 animate-shimmer" />
        <div className="h-5 bg-gray-200 dark:bg-[#252525] rounded-lg w-2/5 animate-shimmer" />
      </div>
    </div>
  );
}

/* ── Main ── */
export default function Home() {
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [newProducts, setNewProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [featuredRes, newRes, catRes] = await Promise.allSettled([
          productsApi.featured(),
          productsApi.list({ ordering: '-created_at', page_size: 8 }),
          categoriesApi.list(),
        ]);
        if (featuredRes.status === 'fulfilled') setFeaturedProducts((featuredRes.value.data as any)?.results ?? featuredRes.value.data ?? []);
        if (newRes.status === 'fulfilled') setNewProducts((newRes.value.data as any)?.results ?? newRes.value.data ?? []);
        if (catRes.status === 'fulfilled') setCategories((catRes.value.data as any)?.results ?? catRes.value.data ?? []);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <div className="bg-gray-50 dark:bg-[#0F0F0F]">
      <HeroCarousel />
      <FeaturesSection />

      {/* Categories */}
      {(loading || categories.length > 0) && (
        <section className="py-16 bg-gray-50 dark:bg-[#0F0F0F]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <SectionHeader tag="الأقسام" title="تصفّح الأقسام" href="/products" />
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {loading
                ? [...Array(6)].map((_, i) => (
                    <div key={i} className="bg-white dark:bg-[#1E1E1E] border border-gray-200 dark:border-[#2E2E2E] rounded-2xl p-4 flex flex-col items-center gap-3 animate-shimmer">
                      <div className="w-12 h-12 bg-gray-200 dark:bg-[#252525] rounded-xl" />
                      <div className="h-3 bg-gray-200 dark:bg-[#252525] rounded w-16" />
                    </div>
                  ))
                : categories.slice(0, 6).map((cat) => (
                    <Link key={cat.id} to={`/products?category=${cat.slug}`}
                      className="flex flex-col items-center gap-3 p-5 bg-white dark:bg-[#1E1E1E] border border-gray-200 dark:border-[#2E2E2E] rounded-2xl
                                 hover:border-primary-400/40 hover:-translate-y-1 hover:shadow-xl hover:shadow-gray-200/60 dark:hover:shadow-black/40
                                 transition-all duration-300 group">
                      {cat.logo ? (
                        <img src={cat.logo} alt={cat.name} className="w-12 h-12 object-contain" />
                      ) : (
                        <div className="w-12 h-12 rounded-xl flex items-center justify-center"
                          style={{ background: 'linear-gradient(135deg, #5C8A6E, #7AA88C)' }}>
                          <ShoppingBag className="w-6 h-6 text-white" />
                        </div>
                      )}
                      <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 font-arabic text-center group-hover:text-primary-500 dark:group-hover:text-primary-300 transition-colors">
                        {cat.name}
                      </span>
                    </Link>
                  ))
              }
            </div>
          </div>
        </section>
      )}

      {/* Featured Products */}
      {(loading || featuredProducts.length > 0) && (
        <section className="py-16 border-y border-gray-200 dark:border-[#1E1E1E] bg-gray-100 dark:bg-[#1A1A1A]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <SectionHeader tag="الأكثر مبيعاً" title="منتجات مميزة" href="/products?featured=true" />
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-5">
              {loading
                ? [...Array(4)].map((_, i) => <ProductSkeleton key={i} />)
                : featuredProducts.slice(0, 8).map((p) => <ProductCard key={p.id} product={p} />)
              }
            </div>
          </div>
        </section>
      )}

      {/* New Products */}
      {(loading || newProducts.length > 0) && (
        <section className="py-16 bg-gray-50 dark:bg-[#0F0F0F]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <SectionHeader tag="وصل حديثاً" title="أحدث المنتجات" href="/products?ordering=-created_at" />
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-5">
              {loading
                ? [...Array(4)].map((_, i) => <ProductSkeleton key={i} />)
                : newProducts.slice(0, 8).map((p) => <ProductCard key={p.id} product={p} />)
              }
            </div>
          </div>
        </section>
      )}

      <CTASection />
    </div>
  );
}

/* ── CTA ── */
function CTASection() {
  const { isAuthenticated, profile } = useAuthStore();

  const ctaContent = isAuthenticated
    ? profile?.is_seller
      ? {
          icon: <LayoutDashboard className="w-8 h-8 text-primary-400" />,
          title: 'مرحباً بك في لوحة التاجر',
          desc: 'إدارة منتجاتك، متابعة طلباتك، وتنمية تجارتك بسهولة.',
          primary: { to: '/merchant/products', label: 'منتجاتي', icon: <Package className="w-5 h-5" /> },
          secondary: { to: '/merchant/dashboard', label: 'لوحة التحكم', icon: <LayoutDashboard className="w-5 h-5" /> },
        }
      : {
          icon: <ShoppingBag className="w-8 h-8 text-primary-400" />,
          title: 'استمتع بتجربة تسوق مميزة',
          desc: 'تابع طلباتك، استعرض قائمة رغباتك، واكتشف منتجات جديدة كل يوم.',
          primary: { to: '/orders', label: 'طلباتي', icon: <Package className="w-5 h-5" /> },
          secondary: { to: '/products', label: 'تسوّق الآن', icon: <ShoppingBag className="w-5 h-5" /> },
        }
    : {
        icon: <Star className="w-8 h-8 text-yellow-500 dark:text-yellow-400" />,
        title: 'هل أنت تاجر؟',
        desc: 'ابدأ البيع على سوق الآن واوصل منتجاتك إلى آلاف الزبائن في جميع ولايات الجزائر.',
        primary: { to: '/register?type=seller', label: 'ابدأ البيع الآن', icon: <ShoppingBag className="w-5 h-5" /> },
        secondary: { to: '/login', label: 'تسجيل الدخول', icon: null },
      };

  return (
    <section className="py-20 border-t border-gray-200 dark:border-[#1E1E1E] bg-gray-100 dark:bg-[#1A1A1A]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative rounded-3xl overflow-hidden border border-gray-200 dark:border-[#2E2E2E] text-center px-8 py-16 bg-white dark:bg-gradient-to-br dark:from-[#1a2a1f] dark:via-[#1A1A1A] dark:to-[#2a1a1f]">

          {/* Background orbs */}
          <div className="absolute top-0 right-0 w-64 h-64 rounded-full pointer-events-none"
            style={{ background: 'radial-gradient(circle, rgba(92,138,110,0.06) 0%, transparent 70%)' }} />
          <div className="absolute bottom-0 left-0 w-64 h-64 rounded-full pointer-events-none"
            style={{ background: 'radial-gradient(circle, rgba(201,137,122,0.04) 0%, transparent 70%)' }} />

          <div className="relative">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6 bg-primary-50 dark:bg-primary-400/10 border border-primary-200 dark:border-primary-400/20">
              {ctaContent.icon}
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-gray-100 font-arabic mb-4">{ctaContent.title}</h2>
            <p className="text-gray-500 font-arabic text-base mb-10 max-w-xl mx-auto leading-relaxed">{ctaContent.desc}</p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to={ctaContent.primary.to}
                className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-2xl text-white font-bold font-arabic text-base transition-all duration-300 hover:-translate-y-1"
                style={{ background: 'linear-gradient(135deg, #5C8A6E, #7AA88C)', boxShadow: '0 8px 30px rgba(92,138,110,0.3)' }}>
                {ctaContent.primary.icon}
                {ctaContent.primary.label}
                <ArrowLeft className="w-4 h-4" />
              </Link>
              <Link to={ctaContent.secondary.to}
                className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-2xl font-bold font-arabic text-base border border-gray-200 dark:border-[#2E2E2E] bg-gray-50 dark:bg-white/[0.03] text-gray-700 dark:text-gray-300 hover:border-primary-400/40 hover:bg-primary-50 dark:hover:bg-primary-400/5 transition-all duration-300">
                {ctaContent.secondary.icon}
                {ctaContent.secondary.label}
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
