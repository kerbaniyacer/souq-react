import { useEffect, useState, useCallback } from 'react';
import {
  CheckCircle2, XCircle, Clock, Package, User, Tag, Store,
  ChevronLeft, ChevronRight, AlertTriangle, Layers, RefreshCw,
  BadgeCheck, Gavel,
} from 'lucide-react';
import { adminReviewApi } from '@shared/services/api';
import { useToast } from '@shared/stores/toastStore';
import { DEFAULT_PRODUCT_IMAGE } from '@shared/lib/assets';

// ── Types ──────────────────────────────────────────────────────────────────────

interface ReviewVariant {
  id: number;
  name: string;
  price: number;
  old_price: number | null;
  stock: number;
  attributes: Record<string, string>;
  is_main: boolean;
  image?: string;
}

interface ReviewProduct {
  id: number;
  name: string;
  slug: string;
  description: string;
  sku: string;
  category: { name: string } | null;
  brand: { name: string; logo?: string } | null;
  store: { name: string } | null;
  variants: ReviewVariant[];
  images: { id: number; image: string; is_main: boolean }[];
  status: string;
  suspension_reason?: string | null;
  is_featured: boolean;
  review_deadline: string | null;
  created_at: string;
  seller_info: { id: number; username: string; email: string; store_name: string };
}

// ── Countdown hook ─────────────────────────────────────────────────────────────

function useCountdown(deadline: string | null) {
  const calc = () => {
    if (!deadline) return null;
    const diff = new Date(deadline).getTime() - Date.now();
    if (diff <= 0) return { h: 0, m: 0, s: 0, urgent: true, expired: true };
    const h = Math.floor(diff / 3600000);
    const m = Math.floor((diff % 3600000) / 60000);
    const s = Math.floor((diff % 60000) / 1000);
    return { h, m, s, urgent: diff < 3600000, expired: false };
  };
  const [time, setTime] = useState(calc);
  useEffect(() => {
    if (!deadline) return;
    const id = setInterval(() => setTime(calc()), 1000);
    return () => clearInterval(id);
  }, [deadline]);
  return time;
}

// ── Countdown badge ────────────────────────────────────────────────────────────

function CountdownBadge({ deadline }: { deadline: string | null }) {
  const t = useCountdown(deadline);
  if (!t) return null;
  if (t.expired) return (
    <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-500">
      <Clock className="w-3 h-3" />نُشر تلقائياً
    </span>
  );
  return (
    <span className={`flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full font-mono ${
      t.urgent
        ? 'bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400'
        : 'bg-amber-100 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400'
    }`}>
      <Clock className="w-3 h-3" />
      {String(t.h).padStart(2, '0')}:{String(t.m).padStart(2, '0')}:{String(t.s).padStart(2, '0')}
    </span>
  );
}

// ── Image gallery ──────────────────────────────────────────────────────────────

function ImageGallery({ images }: { images: ReviewProduct['images'] }) {
  const [active, setActive] = useState(0);
  const all = images.length ? images : [{ id: 0, image: DEFAULT_PRODUCT_IMAGE, is_main: true }];

  return (
    <div className="space-y-3">
      {/* Main image */}
      <div className="relative aspect-square bg-gray-50 dark:bg-[#1A1A1A] rounded-2xl overflow-hidden">
        <img
          src={all[active]?.image || DEFAULT_PRODUCT_IMAGE}
          alt=""
          className="w-full h-full object-contain"
          onError={e => { (e.target as HTMLImageElement).src = DEFAULT_PRODUCT_IMAGE; }}
        />
        {all.length > 1 && (
          <>
            <button
              onClick={() => setActive(i => (i === 0 ? all.length - 1 : i - 1))}
              className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-white/80 dark:bg-black/50 rounded-full flex items-center justify-center hover:bg-white transition-colors shadow"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
            <button
              onClick={() => setActive(i => (i === all.length - 1 ? 0 : i + 1))}
              className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-white/80 dark:bg-black/50 rounded-full flex items-center justify-center hover:bg-white transition-colors shadow"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
              {all.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setActive(i)}
                  className={`w-1.5 h-1.5 rounded-full transition-all ${i === active ? 'bg-primary-500 w-3' : 'bg-white/60'}`}
                />
              ))}
            </div>
          </>
        )}
      </div>

      {/* Thumbnails */}
      {all.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {all.map((img, i) => (
            <button
              key={img.id}
              onClick={() => setActive(i)}
              className={`shrink-0 w-14 h-14 rounded-xl overflow-hidden border-2 transition-all ${
                i === active ? 'border-primary-400' : 'border-transparent opacity-60'
              }`}
            >
              <img
                src={img.image || DEFAULT_PRODUCT_IMAGE}
                alt=""
                className="w-full h-full object-cover"
                onError={e => { (e.target as HTMLImageElement).src = DEFAULT_PRODUCT_IMAGE; }}
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Reject modal ───────────────────────────────────────────────────────────────

function RejectModal({
  product,
  onConfirm,
  onCancel,
  loading,
}: {
  product: ReviewProduct;
  onConfirm: (reason: string) => void;
  onCancel: () => void;
  loading: boolean;
}) {
  const [reason, setReason] = useState('');

  const PRESET_REASONS = [
    'الصور غير واضحة أو ذات جودة منخفضة',
    'الوصف غير مكتمل أو مضلل',
    'السعر غير مناسب أو مخالف للسياسة',
    'المنتج مخالف لشروط الاستخدام',
    'معلومات المتغيرات غير صحيحة',
    'المنتج مكرر أو موجود مسبقاً',
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" dir="rtl">
      <div className="bg-white dark:bg-[#141414] rounded-[2rem] w-full max-w-md shadow-2xl border border-gray-100 dark:border-gray-800 animate-in zoom-in-95 duration-200">
        <div className="p-6">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 bg-red-100 dark:bg-red-900/20 rounded-2xl flex items-center justify-center shrink-0">
              <XCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
            </div>
            <div>
              <h3 className="font-bold text-gray-900 dark:text-gray-100">رفض المنتج</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 truncate max-w-[220px]">{product.name}</p>
            </div>
          </div>

          {/* Preset reasons */}
          <div className="flex flex-wrap gap-2 mb-4">
            {PRESET_REASONS.map(r => (
              <button
                key={r}
                onClick={() => setReason(r)}
                className={`text-xs px-3 py-1.5 rounded-xl border transition-all ${
                  reason === r
                    ? 'bg-red-50 dark:bg-red-900/20 border-red-300 dark:border-red-700 text-red-700 dark:text-red-400'
                    : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-red-200 dark:hover:border-red-800'
                }`}
              >
                {r}
              </button>
            ))}
          </div>

          <textarea
            value={reason}
            onChange={e => setReason(e.target.value)}
            rows={3}
            placeholder="اكتب سبب الرفض أو اختر من الأسباب أعلاه..."
            className="w-full bg-gray-50 dark:bg-[#1E1E1E] border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 outline-none focus:border-red-400 transition-colors resize-none"
          />

          <div className="flex gap-3 mt-5">
            <button
              onClick={() => onConfirm(reason)}
              disabled={!reason.trim() || loading}
              className="flex-1 py-3 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white font-bold rounded-xl transition-colors"
            >
              {loading ? 'جاري الرفض...' : 'رفض المنتج'}
            </button>
            <button
              onClick={onCancel}
              disabled={loading}
              className="flex-1 py-3 bg-gray-100 dark:bg-[#252525] text-gray-700 dark:text-gray-300 font-bold rounded-xl hover:bg-gray-200 dark:hover:bg-[#303030] transition-colors"
            >
              إلغاء
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────

export default function AdminProductReview() {
  const toast = useToast();
  const [products, setProducts] = useState<ReviewProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<ReviewProduct | null>(null);
  const [deciding, setDeciding] = useState(false);
  const [rejectTarget, setRejectTarget] = useState<ReviewProduct | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await adminReviewApi.list();
      setProducts(data);
      setSelected(prev => prev ? (data.find((p: ReviewProduct) => p.id === prev.id) ?? data[0] ?? null) : (data[0] ?? null));
    } catch {
      toast.error('تعذر تحميل المنتجات');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleApprove = async (product: ReviewProduct) => {
    setDeciding(true);
    try {
      await adminReviewApi.decide(product.id, 'approve');
      toast.success(`تم نشر "${product.name}" بنجاح ✓`);
      setProducts(ps => ps.filter(p => p.id !== product.id));
      const remaining = products.filter(p => p.id !== product.id);
      setSelected(remaining[0] ?? null);
    } catch {
      toast.error('تعذر نشر المنتج');
    } finally {
      setDeciding(false);
    }
  };

  const handleReject = async (reason: string) => {
    if (!rejectTarget) return;
    setDeciding(true);
    try {
      await adminReviewApi.decide(rejectTarget.id, 'reject', reason);
      toast.success(`تم رفض "${rejectTarget.name}" — سيبقى في القائمة`);
      // Update in-place: mark as rejected with reason, keep on page
      const updated = { ...rejectTarget, status: 'rejected', suspension_reason: reason, review_deadline: null };
      setProducts(ps => ps.map(p => p.id === rejectTarget.id ? updated : p));
      setSelected(updated);
      setRejectTarget(null);
    } catch {
      toast.error('تعذر رفض المنتج');
    } finally {
      setDeciding(false);
    }
  };

  const pendingCount = products.filter(p => p.status === 'under_review').length;
  const minPrice = (p: ReviewProduct) => Math.min(...(p.variants.map(v => v.price) || [0]));
  const maxPrice = (p: ReviewProduct) => Math.max(...(p.variants.map(v => v.price) || [0]));

  return (
    <div className="min-h-screen bg-[#FDFCFB] dark:bg-[#0A0A0A] font-arabic" dir="rtl">
      <div className="max-w-[1400px] mx-auto px-4 py-8">

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="w-2 h-2 bg-amber-400 rounded-full animate-pulse" />
              <span className="text-xs font-bold text-amber-500 uppercase tracking-widest">مراجعة المنتجات</span>
            </div>
            <h1 className="text-2xl font-black text-gray-900 dark:text-gray-100">منتجات بانتظار الموافقة</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              تُنشر المنتجات تلقائياً بعد 24 ساعة إذا لم يتخذ المسؤول قراراً
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <div className="px-4 py-2 bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800/30 rounded-2xl">
                <span className="text-sm font-bold text-amber-700 dark:text-amber-400">
                  {loading ? '...' : pendingCount} قيد الانتظار
                </span>
              </div>
              {!loading && products.some(p => p.status === 'rejected') && (
                <div className="px-4 py-2 bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800/30 rounded-2xl">
                  <span className="text-sm font-bold text-red-600 dark:text-red-400">
                    {products.filter(p => p.status === 'rejected').length} مرفوض
                  </span>
                </div>
              )}
            </div>
            <button
              onClick={load}
              className="p-2.5 bg-white dark:bg-[#1A1A1A] border border-gray-200 dark:border-gray-800 rounded-xl hover:bg-gray-50 dark:hover:bg-[#222] transition-colors"
              title="تحديث"
            >
              <RefreshCw className="w-4 h-4 text-gray-500" />
            </button>
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-28 bg-white dark:bg-[#1A1A1A] rounded-2xl border border-gray-100 dark:border-gray-800 animate-pulse" />
              ))}
            </div>
            <div className="lg:col-span-2 bg-white dark:bg-[#1A1A1A] rounded-[2rem] border border-gray-100 dark:border-gray-800 animate-pulse h-[600px]" />
          </div>
        ) : products.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-32 text-center">
            <div className="w-20 h-20 bg-green-50 dark:bg-green-900/10 rounded-[2rem] flex items-center justify-center mb-5">
              <BadgeCheck className="w-10 h-10 text-green-500" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">كل شيء على ما يرام!</h2>
            <p className="text-gray-500 dark:text-gray-400 text-sm">لا توجد منتجات تنتظر المراجعة حالياً</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-[340px_1fr] gap-6">

            {/* ── Left: product list ── */}
            <div className="space-y-3">
              {products.map(p => (
                <button
                  key={p.id}
                  onClick={() => setSelected(p)}
                  className={`w-full text-right p-4 rounded-2xl border transition-all flex gap-3 items-start ${
                    selected?.id === p.id
                      ? `bg-white dark:bg-[#1A1A1A] shadow-lg ${p.status === 'rejected' ? 'border-red-400/50 shadow-red-400/10' : 'border-primary-400/50 shadow-primary-400/10'}`
                      : p.status === 'rejected'
                      ? 'bg-red-50/40 dark:bg-red-900/5 border-red-100 dark:border-red-900/20 hover:border-red-200 dark:hover:border-red-800/40'
                      : 'bg-white dark:bg-[#1A1A1A] border-gray-100 dark:border-gray-800 hover:border-gray-200 dark:hover:border-gray-700'
                  }`}
                >
                  {/* Thumbnail */}
                  <div className={`w-16 h-16 rounded-xl overflow-hidden shrink-0 ${p.status === 'rejected' ? 'opacity-60' : 'bg-gray-50 dark:bg-[#252525]'}`}>
                    <img
                      src={p.images.find(i => i.is_main)?.image || p.images[0]?.image || DEFAULT_PRODUCT_IMAGE}
                      alt={p.name}
                      className="w-full h-full object-cover"
                      onError={e => { (e.target as HTMLImageElement).src = DEFAULT_PRODUCT_IMAGE; }}
                    />
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className={`font-bold text-sm truncate ${p.status === 'rejected' ? 'text-gray-500 dark:text-gray-500' : 'text-gray-900 dark:text-gray-100'}`}>
                      {p.name}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 flex items-center gap-1">
                      <User className="w-3 h-3" />@{p.seller_info.username}
                    </p>
                    <div className="flex items-center gap-2 mt-2">
                      {p.status === 'rejected' ? (
                        <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400">
                          <XCircle className="w-3 h-3" />مرفوض
                        </span>
                      ) : (
                        <CountdownBadge deadline={p.review_deadline} />
                      )}
                      <span className="text-[10px] font-mono text-gray-500">
                        {minPrice(p).toLocaleString('ar-DZ')} دج
                        {maxPrice(p) !== minPrice(p) && ` – ${maxPrice(p).toLocaleString('ar-DZ')}`}
                      </span>
                    </div>
                  </div>
                </button>
              ))}
            </div>

            {/* ── Right: product detail ── */}
            {selected ? (
              <div className="bg-white dark:bg-[#1A1A1A] rounded-[2rem] border border-gray-100 dark:border-gray-800 overflow-hidden">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-0">

                  {/* Images */}
                  <div className="p-6 border-b md:border-b-0 md:border-l border-gray-100 dark:border-gray-800">
                    <ImageGallery images={selected.images} />
                  </div>

                  {/* Info */}
                  <div className="p-6 flex flex-col h-full">
                    <div className="flex-1 space-y-4 overflow-y-auto">

                      {/* Name + badges */}
                      <div>
                        <div className="flex flex-wrap items-center gap-2 mb-2">
                          {selected.is_featured && (
                            <span className="text-[10px] font-bold px-2 py-0.5 bg-amber-100 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 rounded-full">
                              مميز ⭐
                            </span>
                          )}
                          <CountdownBadge deadline={selected.review_deadline} />
                        </div>
                        <h2 className="text-xl font-black text-gray-900 dark:text-gray-100 leading-snug">
                          {selected.name}
                        </h2>
                        {selected.sku && (
                          <p className="text-xs text-gray-400 mt-0.5 font-mono">SKU: {selected.sku}</p>
                        )}
                      </div>

                      {/* Seller / Store / Category / Brand */}
                      <div className="grid grid-cols-2 gap-2">
                        <div className="bg-gray-50 dark:bg-[#252525] rounded-xl p-3">
                          <p className="text-[10px] font-bold text-gray-400 mb-1 flex items-center gap-1">
                            <User className="w-3 h-3" />التاجر
                          </p>
                          <p className="text-sm font-bold text-gray-800 dark:text-gray-200 truncate">
                            @{selected.seller_info.username}
                          </p>
                          <p className="text-[10px] text-gray-400 truncate">{selected.seller_info.email}</p>
                        </div>
                        <div className="bg-gray-50 dark:bg-[#252525] rounded-xl p-3">
                          <p className="text-[10px] font-bold text-gray-400 mb-1 flex items-center gap-1">
                            <Store className="w-3 h-3" />المتجر
                          </p>
                          <p className="text-sm font-bold text-gray-800 dark:text-gray-200 truncate">
                            {selected.store?.name || selected.seller_info.store_name || '—'}
                          </p>
                        </div>
                        {selected.category && (
                          <div className="bg-gray-50 dark:bg-[#252525] rounded-xl p-3">
                            <p className="text-[10px] font-bold text-gray-400 mb-1 flex items-center gap-1">
                              <Tag className="w-3 h-3" />القسم
                            </p>
                            <p className="text-sm font-bold text-gray-800 dark:text-gray-200">{selected.category.name}</p>
                          </div>
                        )}
                        {selected.brand && (
                          <div className="bg-gray-50 dark:bg-[#252525] rounded-xl p-3">
                            <p className="text-[10px] font-bold text-gray-400 mb-1 flex items-center gap-1">
                              <Gavel className="w-3 h-3" />العلامة التجارية
                            </p>
                            <p className="text-sm font-bold text-gray-800 dark:text-gray-200">{selected.brand.name}</p>
                          </div>
                        )}
                      </div>

                      {/* Description */}
                      {selected.description && (
                        <div>
                          <p className="text-xs font-bold text-gray-500 dark:text-gray-400 mb-2 flex items-center gap-1">
                            <Package className="w-3.5 h-3.5" />الوصف
                          </p>
                          <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-wrap">
                            {selected.description}
                          </p>
                        </div>
                      )}

                      {/* Variants */}
                      {selected.variants.length > 0 && (
                        <div>
                          <p className="text-xs font-bold text-gray-500 dark:text-gray-400 mb-2 flex items-center gap-1">
                            <Layers className="w-3.5 h-3.5" />{selected.variants.length} متغير
                          </p>
                          <div className="space-y-2 max-h-48 overflow-y-auto">
                            {selected.variants.map(v => (
                              <div key={v.id} className="flex items-center justify-between bg-gray-50 dark:bg-[#252525] rounded-xl px-3 py-2">
                                <div className="flex flex-wrap gap-1">
                                  {Object.entries(v.attributes).map(([k, val]) => (
                                    <span key={k} className="text-[10px] px-2 py-0.5 bg-white dark:bg-[#1A1A1A] border border-gray-200 dark:border-gray-700 rounded-lg text-gray-700 dark:text-gray-300">
                                      {k}: {val}
                                    </span>
                                  ))}
                                  {!Object.keys(v.attributes).length && (
                                    <span className="text-xs text-gray-500">{v.name || 'افتراضي'}</span>
                                  )}
                                </div>
                                <div className="text-left shrink-0">
                                  <p className="text-sm font-bold text-primary-600 font-mono">
                                    {Number(v.price).toLocaleString('ar-DZ')} دج
                                  </p>
                                  <p className="text-[10px] text-gray-400">مخزون: {v.stock}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Action buttons */}
                    <div className="mt-6 pt-5 border-t border-gray-100 dark:border-gray-800 space-y-3">

                      {/* Rejection banner */}
                      {selected.status === 'rejected' && (
                        <div className="bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800/30 rounded-2xl p-4">
                          <div className="flex items-center gap-2 mb-1">
                            <XCircle className="w-4 h-4 text-red-600 dark:text-red-400 shrink-0" />
                            <p className="text-sm font-bold text-red-700 dark:text-red-400">تم رفض هذا المنتج</p>
                          </div>
                          {selected.suspension_reason && (
                            <p className="text-xs text-red-600 dark:text-red-500 leading-relaxed pr-6">
                              {selected.suspension_reason}
                            </p>
                          )}
                          <p className="text-[11px] text-red-400 dark:text-red-600 mt-2 pr-6">
                            تم إبلاغ التاجر — يمكنك الموافقة عليه إذا غيّرت رأيك
                          </p>
                        </div>
                      )}

                      {/* Low stock warning */}
                      {selected.status !== 'rejected' && selected.variants.some(v => v.stock === 0) && (
                        <div className="flex items-center gap-2 text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/10 px-3 py-2 rounded-xl">
                          <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                          بعض المتغيرات لا يوجد لها مخزون
                        </div>
                      )}

                      {selected.status === 'rejected' ? (
                        /* Already rejected — only allow approve (undo) */
                        <button
                          onClick={() => handleApprove(selected)}
                          disabled={deciding}
                          className="w-full flex items-center justify-center gap-2 py-3.5 bg-green-600 hover:bg-green-700 disabled:opacity-60 text-white font-bold rounded-2xl transition-all active:scale-[0.98] shadow-lg shadow-green-600/20"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                          {deciding ? 'جاري النشر...' : 'الموافقة وإلغاء الرفض'}
                        </button>
                      ) : (
                        /* Under review — full approve / reject */
                        <div className="grid grid-cols-2 gap-3">
                          <button
                            onClick={() => handleApprove(selected)}
                            disabled={deciding}
                            className="flex items-center justify-center gap-2 py-3.5 bg-green-600 hover:bg-green-700 disabled:opacity-60 text-white font-bold rounded-2xl transition-all active:scale-[0.98] shadow-lg shadow-green-600/20"
                          >
                            <CheckCircle2 className="w-4 h-4" />
                            {deciding ? 'جاري النشر...' : 'رفع المنتج'}
                          </button>
                          <button
                            onClick={() => setRejectTarget(selected)}
                            disabled={deciding}
                            className="flex items-center justify-center gap-2 py-3.5 bg-red-600 hover:bg-red-700 disabled:opacity-60 text-white font-bold rounded-2xl transition-all active:scale-[0.98] shadow-lg shadow-red-600/20"
                          >
                            <XCircle className="w-4 h-4" />
                            رفض المنتج
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        )}
      </div>

      {/* Reject modal */}
      {rejectTarget && (
        <RejectModal
          product={rejectTarget}
          onConfirm={handleReject}
          onCancel={() => setRejectTarget(null)}
          loading={deciding}
        />
      )}
    </div>
  );
}
