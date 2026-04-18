import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ShoppingBag, Shield, Truck, Headphones, ChevronRight, LayoutDashboard, Package } from 'lucide-react';
import { productsApi, categoriesApi } from '@/services/api';
import type { Product, Category } from '@/types';
import ProductCard from '@/components/store/ProductCard';
import { useAuthStore } from '@/stores/authStore';
import InteractiveHero from '@/components/common/InteractiveHero';

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

export default function Home() {
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [newProducts, setNewProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [featuredRes, newRes, catRes] = await Promise.allSettled([
          productsApi.featured(),
          productsApi.list({ ordering: '-created_at', page_size: 8 }),
          categoriesApi.list(),
        ]);

        if (featuredRes.status === 'fulfilled') setFeaturedProducts(featuredRes.value.data.results ?? featuredRes.value.data);
        if (newRes.status === 'fulfilled') setNewProducts(newRes.value.data.results ?? newRes.value.data);
        if (catRes.status === 'fulfilled') setCategories(catRes.value.data.results ?? catRes.value.data);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  return (
    <div>
      {/* Interactive Hero with Canvas Animation */}
      <InteractiveHero />

      <FeaturesSection />

      {/* Categories */}
      {categories.length > 0 && (
        <section className="py-16 bg-page-bg dark:bg-gray-950 transition-colors">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 font-arabic">تصفّح الأقسام</h2>
              <Link to="/products" className="flex items-center gap-1 text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 text-sm font-arabic">
                عرض الكل <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {categories.slice(0, 6).map((cat) => (
                <Link
                  key={cat.id}
                  to={`/products?category=${cat.slug}`}
                  className="flex flex-col items-center gap-3 p-4 bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 hover:border-primary-300 dark:hover:border-primary-700 hover:shadow-md dark:hover:shadow-gray-950/30 transition-all group"
                >
                  {cat.logo ? (
                    <img src={cat.logo} alt={cat.name} className="w-12 h-12 object-contain" />
                  ) : (
                    <div className="w-12 h-12 bg-primary-100 dark:bg-primary-900/30 rounded-xl flex items-center justify-center">
                      <ShoppingBag className="w-6 h-6 text-primary-400" />
                    </div>
                  )}
                  <span className="text-xs font-semibold text-gray-700 dark:text-gray-300 font-arabic text-center group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                    {cat.name}
                  </span>
                </Link>
              ))}
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
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="bg-gray-100 dark:bg-gray-800 rounded-2xl aspect-square animate-pulse" />
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
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
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="bg-gray-100 dark:bg-gray-800 rounded-2xl aspect-square animate-pulse" />
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
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
