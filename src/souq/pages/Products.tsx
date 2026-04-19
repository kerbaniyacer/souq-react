import { useEffect, useState, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { SlidersHorizontal, X, ChevronDown } from 'lucide-react';
import { productsApi, categoriesApi, brandsApi } from '@souq/services/api';
import type { Product, Category, Brand } from '@souq/types';
import ProductCard from '@souq/components/store/ProductCard';

export default function Products() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);

  const search = searchParams.get('search') || '';
  const category = searchParams.get('category') || '';
  const brand = searchParams.get('brand') || '';
  const ordering = searchParams.get('ordering') || '';
  const page = parseInt(searchParams.get('page') || '1');
  const pageSize = 12;

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string | number> = { page, page_size: pageSize };
      if (search) params.search = search;
      if (category) params.category = category;
      if (brand) params.brand = brand;
      if (ordering) params.ordering = ordering;

      const res = await productsApi.list(params);
      const data = res.data as { results?: Product[]; count?: number } | Product[];
      if (!Array.isArray(data) && data.results) {
        setProducts(data.results);
        setTotal(data.count ?? 0);
      } else {
        const arr = Array.isArray(data) ? data : [];
        setProducts(arr);
        setTotal(arr.length);
      }
    } finally {
      setLoading(false);
    }
  }, [search, category, brand, ordering, page]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  useEffect(() => {
    Promise.all([categoriesApi.list(), brandsApi.list()]).then(([cRes, bRes]) => {
      setCategories(cRes.data.results ?? cRes.data);
      setBrands(bRes.data.results ?? bRes.data);
    });
  }, []);

  const updateFilter = (key: string, value: string) => {
    const p = new URLSearchParams(searchParams);
    if (value) p.set(key, value);
    else p.delete(key);
    if (key !== 'page') {
      p.delete('page');
    }
    setSearchParams(p);
  };

  const clearFilters = () => {
    const p = new URLSearchParams();
    if (search) p.set('search', search);
    setSearchParams(p);
  };

  const hasFilters = category || brand || ordering;
  const totalPages = Math.ceil(total / pageSize);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 font-arabic">
            {search ? `نتائج البحث: "${search}"` : 'المنتجات'}
          </h1>
          {!loading && (
            <p className="text-sm text-gray-500 dark:text-gray-400 font-arabic mt-1">
              {total} منتج
            </p>
          )}
        </div>

        <div className="flex items-center gap-3">
          {/* Sort */}
          <div className="relative">
            <select
              value={ordering}
              onChange={(e) => updateFilter('ordering', e.target.value)}
              className="appearance-none pl-8 pr-4 py-2.5 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-sm font-arabic focus:outline-none focus:ring-2 focus:ring-primary-400/30 cursor-pointer transition-colors"
            >
              <option value="">الأحدث</option>
              <option value="price">السعر: الأقل أولاً</option>
              <option value="-price">السعر: الأعلى أولاً</option>
              <option value="-rating">التقييم الأعلى</option>
              <option value="-sold_count">الأكثر مبيعاً</option>
            </select>
            <ChevronDown className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-500 pointer-events-none" />
          </div>

          {/* Filter toggle mobile */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="lg:hidden flex items-center gap-2 px-4 py-2.5 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-sm font-arabic"
          >
            <SlidersHorizontal className="w-4 h-4" />
            فلترة
            {hasFilters && <span className="w-2 h-2 bg-primary-400 rounded-full" />}
          </button>
        </div>
      </div>

      <div className="flex gap-8">
        {/* Filters sidebar */}
        <aside className={`${showFilters ? 'block' : 'hidden'} lg:block w-full lg:w-64 shrink-0`}>
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-5 sticky top-20">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-gray-800 dark:text-gray-200 font-arabic">تصفية النتائج</h3>
              {hasFilters && (
                <button onClick={clearFilters} className="text-xs text-red-500 font-arabic flex items-center gap-1">
                  <X className="w-3 h-3" /> مسح
                </button>
              )}
            </div>

            {/* Category filter */}
            {categories.length > 0 && (
              <div className="mb-5">
                <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 font-arabic mb-3">القسم</h4>
                <div className="space-y-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="category"
                      value=""
                      checked={!category}
                      onChange={() => updateFilter('category', '')}
                      className="accent-primary-400"
                    />
                    <span className="text-sm font-arabic text-gray-600 dark:text-gray-400">الكل</span>
                  </label>
                  {categories.map((cat) => (
                    <label key={cat.id} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="category"
                        value={cat.slug}
                        checked={category === cat.slug}
                        onChange={() => updateFilter('category', cat.slug)}
                        className="accent-primary-400"
                      />
                      <span className="text-sm font-arabic text-gray-600 dark:text-gray-400">{cat.name}</span>
                      {cat.products_count !== undefined && (
                        <span className="text-xs text-gray-400 dark:text-gray-500 mr-auto">({cat.products_count})</span>
                      )}
                    </label>
                  ))}
                </div>
              </div>
            )}

            {/* Brand filter */}
            {brands.length > 0 && (
              <div className="mb-5">
                <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 font-arabic mb-3">العلامة التجارية</h4>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="brand"
                      value=""
                      checked={!brand}
                      onChange={() => updateFilter('brand', '')}
                      className="accent-primary-400"
                    />
                    <span className="text-sm font-arabic text-gray-600 dark:text-gray-400">الكل</span>
                  </label>
                  {brands.map((b) => (
                    <label key={b.id} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="brand"
                        value={b.slug}
                        checked={brand === b.slug}
                        onChange={() => updateFilter('brand', b.slug)}
                        className="accent-primary-400"
                      />
                      <span className="text-sm font-arabic text-gray-600 dark:text-gray-400">{b.name}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}
          </div>
        </aside>

        {/* Products grid */}
        <div className="flex-1">
          {loading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-5">
              {[...Array(12)].map((_, i) => (
                <div key={i} className="bg-gray-100 dark:bg-gray-800 rounded-2xl aspect-square animate-pulse" />
              ))}
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-4xl mb-4">🔍</p>
              <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 font-arabic mb-2">لا توجد منتجات</h3>
              <p className="text-gray-500 dark:text-gray-400 font-arabic">جرّب تغيير معايير البحث</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-5">
                {products.map((p) => (
                  <ProductCard key={p.id} product={p} />
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex justify-center gap-2 mt-10">
                  {page > 1 && (
                    <button
                      onClick={() => updateFilter('page', String(page - 1))}
                      className="px-4 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-sm font-arabic hover:border-primary-300 transition-colors"
                    >
                      السابق
                    </button>
                  )}
                  {[...Array(totalPages)].map((_, i) => {
                    const p = i + 1;
                    if (Math.abs(p - page) > 2) return null;
                    return (
                      <button
                        key={p}
                        onClick={() => updateFilter('page', String(p))}
                        className={`w-10 h-10 rounded-xl text-sm font-bold transition-colors ${
                          p === page
                            ? 'bg-primary-400 text-white'
                            : 'bg-white border border-gray-200 text-gray-700 hover:border-primary-300'
                        }`}
                      >
                        {p}
                      </button>
                    );
                  })}
                  {page < totalPages && (
                    <button
                      onClick={() => updateFilter('page', String(page + 1))}
                      className="px-4 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-sm font-arabic hover:border-primary-300 transition-colors"
                    >
                      التالي
                    </button>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
