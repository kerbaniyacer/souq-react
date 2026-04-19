import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { ArrowRight, Plus, Trash2, Save, ChevronDown, ChevronUp, Video, X, ImagePlus, Sparkles } from 'lucide-react';
import { useToast } from '@souq/stores/toastStore';
import { productsApi, categoriesApi } from '@souq/services/api';
import type { Category } from '@souq/types';

// ─── Types ────────────────────────────────────────────────────────────────────

interface OptionType {
  id: string;       // uuid-like
  name: string;     // e.g. "اللون"
  values: string[]; // e.g. ["أحمر","أزرق"]
}

interface Spec {
  key: string;
  value: string;
}

interface VariantForm {
  id?: string;
  name: string;          // auto-generated from combination
  sku: string;
  price: string;
  old_price: string;
  stock: string;
  image: string;         // data URL or external URL
  is_main: boolean;
  is_active: boolean;
  expanded: boolean;
  attributes: Record<string, string>; // option name → value
}

const uid = () => Math.random().toString(36).slice(2, 9);

const PRESET_BRANDS = [
  'Samsung', 'Apple', 'Huawei', 'Xiaomi', 'LG', 'Sony', 'Nike', 'Adidas', 'Puma',
  'Zara', 'H&M', 'Bershka', 'Pull&Bear', 'Generic',
];

const EXAMPLE_OPTION_SETS = [
  {
    label: '👕 ملابس',
    options: [
      { name: 'المقاس', values: ['XS', 'S', 'M', 'L', 'XL', 'XXL'] },
      { name: 'اللون', values: ['أبيض', 'أسود', 'أزرق', 'أحمر'] },
    ],
  },
  {
    label: '📱 هواتف',
    options: [
      { name: 'السعة', values: ['64GB', '128GB', '256GB', '512GB'] },
      { name: 'اللون', values: ['أسود', 'أبيض', 'ذهبي', 'أزرق'] },
    ],
  },
  {
    label: '👟 أحذية',
    options: [
      { name: 'المقاس', values: ['38', '39', '40', '41', '42', '43', '44'] },
    ],
  },
];

const SPEC_EXAMPLES = [
  { key: 'المعالج', value: 'Snapdragon 8 Gen 3' },
  { key: 'الشاشة', value: '6.8 بوصة AMOLED' },
  { key: 'البطارية', value: '5000 mAh' },
  { key: 'الخامة', value: '100% قطن' },
  { key: 'بلد الصنع', value: 'الصين' },
];

// ─── Cartesian product helper ─────────────────────────────────────────────────
function cartesian(arrays: string[][]): string[][] {
  if (!arrays.length) return [[]];
  const [first, ...rest] = arrays;
  const restCombos = cartesian(rest);
  return first.flatMap((val) => restCombos.map((combo) => [val, ...combo]));
}

// ─── Toggle Switch ────────────────────────────────────────────────────────────
function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <label className="flex items-center gap-3 cursor-pointer select-none">
      <div
        onClick={() => onChange(!checked)}
        className={`relative w-11 h-6 rounded-full transition-colors duration-200 ${checked ? 'bg-primary-400' : 'bg-gray-300 dark:bg-gray-600'}`}
      >
        <span className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all duration-200 ${checked ? 'right-1' : 'right-6'}`} />
      </div>
      <span className="text-sm font-arabic text-gray-700 dark:text-gray-300">{label}</span>
    </label>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function MerchantProductForm() {
  const { id } = useParams<{ id: string }>();
  const isEdit = Boolean(id);
  const toast = useToast();
  const navigate = useNavigate();
  const videoRef = useRef<HTMLInputElement>(null);

  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // ─── Basic info ──────────────────────────────────────────────────
  const [form, setForm] = useState({
    name: '',
    description: '',
    sku: '',
    category_id: '',
    brand: '',
    brand_other: '',
    is_active: true,
    is_featured: false,
  });

  // ─── Option types ──────────────────────────────────────────────
  const [optionTypes, setOptionTypes] = useState<OptionType[]>([]);
  const [newOptionName, setNewOptionName] = useState('');
  const [newOptionValues, setNewOptionValues] = useState<Record<string, string>>({});

  // ─── Variants (auto-generated) ─────────────────────────────────
  const [variants, setVariants] = useState<VariantForm[]>([]);

  // ─── Bulk actions ──────────────────────────────────────────────
  const [bulkPrice, setBulkPrice] = useState('');
  const [bulkOldPrice, setBulkOldPrice] = useState('');
  const [bulkStock, setBulkStock] = useState('');
  const [selectedVariants, setSelectedVariants] = useState<Set<number>>(new Set());
  const [sortBy, setSortBy] = useState<string>('');

  // ─── Bulk image ────────────────────────────────────────────────
  const [bulkImage, setBulkImage] = useState<string>('');
  const bulkImageRef = useRef<HTMLInputElement>(null);

  // ─── Specifications ────────────────────────────────────────────
  const [specs, setSpecs] = useState<Spec[]>([]);
  const [newSpec, setNewSpec] = useState<Spec>({ key: '', value: '' });

  // ─── Video ─────────────────────────────────────────────────────
  const [videoPreview, setVideoPreview] = useState<string>('');
  const [videoName, setVideoName] = useState('');

  // ─── Load categories & product (edit) ──────────────────────────
  useEffect(() => {
    categoriesApi.list().then((r) => setCategories(r.data as Category[]));
    if (isEdit && id) {
      setLoading(true);
      productsApi.merchantDetail(id).then((r) => {
        const p = r.data;
        setForm({
          name: p.name ?? '',
          description: p.description ?? '',
          sku: p.sku ?? '',
          category_id: String(p.category?.id ?? p.category_id ?? ''),
          brand: PRESET_BRANDS.includes(p.brand?.name ?? p.brand ?? '') ? (p.brand?.name ?? p.brand ?? '') : (p.brand?.name ?? p.brand) ? 'other' : '',
          brand_other: PRESET_BRANDS.includes(p.brand?.name ?? p.brand ?? '') ? '' : (p.brand?.name ?? p.brand ?? ''),
          is_active: p.is_active ?? true,
          is_featured: p.is_featured ?? false,
        });
        if (p.video) { setVideoPreview(p.video); setVideoName('فيديو موجود'); }
        if (p.specifications?.length) setSpecs(p.specifications);
        if (p.variants?.length) {
          setVariants(p.variants.map((v: any) => ({
            id: String(v.id),
            name: v.name,
            sku: v.sku ?? '',
            price: String(v.price),
            old_price: v.old_price ? String(v.old_price) : '',
            stock: String(v.stock ?? 0),
            image: v.image ?? '',
            is_main: v.is_main ?? false,
            is_active: v.is_active ?? true,
            expanded: false,
            attributes: v.attributes ?? {},
          })));
        }
      }).catch(() => {
        toast.error('تعذّر تحميل بيانات المنتج');
      }).finally(() => setLoading(false));
    }
  }, [id, isEdit, toast]);

  // ─── Option type management ─────────────────────────────────────
  const addOptionType = () => {
    if (!newOptionName.trim()) return;
    const newOpt: OptionType = { id: uid(), name: newOptionName.trim(), values: [] };
    setOptionTypes((p) => [...p, newOpt]);
    setNewOptionName('');
  };

  const addValueToOption = (optId: string) => {
    const val = (newOptionValues[optId] ?? '').trim();
    if (!val) return;
    setOptionTypes((p) => p.map((o) =>
      o.id === optId && !o.values.includes(val)
        ? { ...o, values: [...o.values, val] }
        : o
    ));
    setNewOptionValues((p) => ({ ...p, [optId]: '' }));
  };

  const removeValueFromOption = (optId: string, val: string) => {
    setOptionTypes((p) => p.map((o) =>
      o.id === optId ? { ...o, values: o.values.filter((v) => v !== val) } : o
    ));
  };

  const removeOptionType = (optId: string) => {
    setOptionTypes((p) => p.filter((o) => o.id !== optId));
  };

  const applyPreset = (preset: typeof EXAMPLE_OPTION_SETS[0]) => {
    setOptionTypes(preset.options.map((o) => ({ id: uid(), name: o.name, values: o.values })));
  };

  // ─── Generate variant combinations ─────────────────────────────
  const generateVariants = () => {
    const validOpts = optionTypes.filter((o) => o.values.length > 0);
    if (!validOpts.length) { toast.error('أضف خيارات وقيم أولاً'); return; }

    const combos = cartesian(validOpts.map((o) => o.values));
    const newVariants: VariantForm[] = combos.map((combo, i) => {
      const attrs: Record<string, string> = {};
      validOpts.forEach((opt, j) => { attrs[opt.name] = combo[j]; });
      const name = combo.join(' - ');
      // Keep existing variant data if name matches
      const existing = variants.find((v) => v.name === name);
      return existing
        ? { ...existing, attributes: attrs, expanded: false }
        : {
            name,
            sku: `${form.sku || 'PRD'}-${i + 1}`,
            price: '',
            old_price: '',
            stock: '0',
            image: '',
            is_main: i === 0,
            is_active: true,
            expanded: false,
            attributes: attrs,
          };
    });
    setVariants(newVariants);
    setSelectedVariants(new Set());
    toast.success(`تم توليد ${newVariants.length} نسخة`);
  };

  // ─── Variant management ────────────────────────────────────────
  const updateVariant = (idx: number, field: keyof VariantForm, value: string | boolean) => {
    setVariants((p) => p.map((v, i) => {
      if (i !== idx) return field === 'is_main' && value === true ? { ...v, is_main: false } : v;
      return { ...v, [field]: value };
    }));
  };

  const addManualVariant = () => {
    setVariants((p) => [...p, {
      name: '', sku: '', price: '', old_price: '', stock: '0',
      image: '', is_main: p.length === 0, is_active: true, expanded: true, attributes: {},
    }]);
  };

  const removeVariant = (idx: number) => {
    setVariants((p) => {
      const next = p.filter((_, i) => i !== idx);
      if (next.length > 0 && !next.some((v) => v.is_main)) next[0].is_main = true;
      return next;
    });
  };

  // ─── Bulk actions ────────────────────────────────────────────────
  const applyBulkPrice = () => {
    if (!bulkPrice) return;
    setVariants((p) => p.map((v, i) => selectedVariants.has(i) ? { ...v, price: bulkPrice } : v));
    setBulkPrice('');
  };

  const applyBulkOldPrice = () => {
    if (!bulkOldPrice) return;
    setVariants((p) => p.map((v, i) => selectedVariants.has(i) ? { ...v, old_price: bulkOldPrice } : v));
    setBulkOldPrice('');
  };

  const applyBulkStock = () => {
    if (!bulkStock) return;
    setVariants((p) => p.map((v, i) => selectedVariants.has(i) ? { ...v, stock: bulkStock } : v));
    setBulkStock('');
  };

  const applyBulkImage = () => {
    if (!bulkImage) return;
    setVariants((p) => p.map((v, i) => selectedVariants.has(i) ? { ...v, image: bulkImage } : v));
    setBulkImage('');
  };

  const handleBulkImageFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => setBulkImage(reader.result as string);
    reader.readAsDataURL(file);
  };

  const toggleSelectVariant = (idx: number) => {
    setSelectedVariants((p) => {
      const next = new Set(p);
      next.has(idx) ? next.delete(idx) : next.add(idx);
      return next;
    });
  };

  const selectAllVariants = () => {
    setSelectedVariants(new Set(variants.map((_, i) => i)));
  };

  // ─── Variant image upload ─────────────────────────────────────
  const handleVariantImage = (idx: number, file: File) => {
    const reader = new FileReader();
    reader.onload = () => updateVariant(idx, 'image', reader.result as string);
    reader.readAsDataURL(file);
  };

  // ─── Video upload ─────────────────────────────────────────────
  const handleVideo = (file: File) => {
    if (file.size > 50 * 1024 * 1024) { toast.error('حجم الفيديو يجب أن يكون أقل من 50MB'); return; }
    const url = URL.createObjectURL(file);
    setVideoPreview(url);
    setVideoName(file.name);
  };

  // ─── Spec management ──────────────────────────────────────────
  const addSpec = () => {
    if (!newSpec.key.trim() || !newSpec.value.trim()) return;
    setSpecs((p) => [...p, { ...newSpec }]);
    setNewSpec({ key: '', value: '' });
  };

  const removeSpec = (idx: number) => setSpecs((p) => p.filter((_, i) => i !== idx));

  // ─── Submit ───────────────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) { toast.error('اسم المنتج مطلوب'); return; }
    if (!variants.length) { toast.error('أضف نسخة واحدة على الأقل'); return; }
    const emptyPrice = variants.find((v) => !v.price);
    if (emptyPrice) { toast.error(`أدخل السعر لجميع النسخ (${emptyPrice.name || 'نسخة بدون اسم'})`); return; }

    setSaving(true);
    try {
      const brandValue = form.brand === 'other' ? form.brand_other : form.brand;

      const productData = {
        name: form.name,
        description: form.description,
        sku: form.sku,
        category_id: form.category_id ? Number(form.category_id) : null,
        brand_name: brandValue,
        is_active: form.is_active,
        is_featured: form.is_featured,
        variants: variants.map((v) => ({
          name: v.name,
          sku: v.sku,
          price: Number(v.price),
          old_price: v.old_price ? Number(v.old_price) : null,
          stock: Number(v.stock),
          image: v.image?.startsWith('data:') ? '' : (v.image || ''),
          is_main: v.is_main,
          is_active: v.is_active,
          attributes: v.attributes,
        })),
      };

      if (isEdit) {
        await productsApi.update(Number(id), productData);
        toast.success('تم تحديث المنتج بنجاح');
      } else {
        await productsApi.create(productData);
        toast.success('تم إضافة المنتج بنجاح 🎉');
      }
      navigate('/merchant/products');
    } catch {
      toast.error('حدث خطأ أثناء الحفظ');
    } finally {
      setSaving(false);
    }
  };

  // ─── Loading skeleton ─────────────────────────────────────────
  if (loading) return (
    <div className="max-w-4xl mx-auto px-4 py-10 space-y-4 animate-pulse">
      {[...Array(5)].map((_, i) => <div key={i} className="h-16 bg-gray-100 dark:bg-[#252525] rounded-xl" />)}
    </div>
  );

  // ─── JSX ──────────────────────────────────────────────────────
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm font-arabic text-gray-400 dark:text-gray-500 mb-6">
        <Link to="/merchant/products" className="hover:text-primary-600 transition-colors">منتجاتي</Link>
        <ArrowRight className="w-3 h-3" />
        <span className="text-gray-700 dark:text-gray-300">{isEdit ? 'تعديل المنتج' : 'إضافة منتج جديد'}</span>
      </div>

      <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 font-arabic mb-8">
        {isEdit ? 'تعديل المنتج' : '+ إضافة منتج جديد'}
      </h1>

      <form onSubmit={handleSubmit} className="space-y-6">

        {/* ── المعلومات الأساسية ───────────────────────────────────── */}
        <Section title="المعلومات الأساسية">
          <div>
            <label className="field-label">اسم المنتج *</label>
            <input name="name" value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
              required placeholder="مثال: هاتف سامسونج Galaxy S25"
              className="field-input" />
          </div>
          <div>
            <label className="field-label">الوصف</label>
            <textarea name="description" value={form.description}
              onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
              rows={4} placeholder="وصف تفصيلي للمنتج، ميزاته، مواصفاته العامة..."
              className="field-input resize-none" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="field-label">القسم</label>
              <select name="category_id" value={form.category_id}
                onChange={(e) => setForm((p) => ({ ...p, category_id: e.target.value }))}
                className="field-input">
                <option value="">اختر القسم</option>
                {categories.map((c) => <option key={c.id} value={String(c.id)}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="field-label">العلامة التجارية</label>
              <select value={form.brand} onChange={(e) => setForm((p) => ({ ...p, brand: e.target.value }))}
                className="field-input">
                <option value="">بدون علامة تجارية</option>
                {PRESET_BRANDS.map((b) => <option key={b} value={b}>{b}</option>)}
                <option value="other">أخرى...</option>
              </select>
            </div>
          </div>
          {form.brand === 'other' && (
            <div>
              <label className="field-label">اسم العلامة التجارية</label>
              <input value={form.brand_other} onChange={(e) => setForm((p) => ({ ...p, brand_other: e.target.value }))}
                placeholder="أدخل اسم العلامة التجارية"
                className="field-input" />
            </div>
          )}
          <div>
            <label className="field-label">رمز المنتج (SKU)</label>
            <input name="sku" value={form.sku} onChange={(e) => setForm((p) => ({ ...p, sku: e.target.value }))}
              placeholder="PRD-001"
              className="field-input" />
          </div>
          <div className="flex flex-wrap gap-6 pt-2">
            <Toggle checked={form.is_active} onChange={(v) => setForm((p) => ({ ...p, is_active: v }))} label="منتج نشط (ظاهر للزبائن)" />
            <Toggle checked={form.is_featured} onChange={(v) => setForm((p) => ({ ...p, is_featured: v }))} label="منتج مميز" />
          </div>
        </Section>

        {/* ── خيارات المنتج والنسخ ──────────────────────────────────── */}
        <Section title="خيارات المنتج والنسخ">
          {/* Quick presets */}
          <div className="mb-4">
            <p className="text-xs text-gray-400 dark:text-gray-500 font-arabic mb-2">أمثلة سريعة:</p>
            <div className="flex flex-wrap gap-2">
              {EXAMPLE_OPTION_SETS.map((preset) => (
                <button key={preset.label} type="button" onClick={() => applyPreset(preset)}
                  className="px-3 py-1.5 text-xs bg-gray-100 dark:bg-[#252525] text-gray-600 dark:text-gray-400 rounded-lg hover:bg-primary-50 dark:hover:bg-primary-900/20 hover:text-primary-600 dark:hover:text-primary-400 font-arabic transition-colors">
                  {preset.label}
                </button>
              ))}
            </div>
          </div>

          {/* Add option type */}
          <div className="flex gap-2 mb-4">
            <input value={newOptionName} onChange={(e) => setNewOptionName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addOptionType())}
              placeholder="اسم الخيار (اللون، المقاس، السعة...)"
              className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 dark:border-[#2E2E2E] bg-gray-50 dark:bg-[#1E1E1E] text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 text-sm font-arabic focus:outline-none focus:ring-2 focus:ring-primary-400/30" />
            <button type="button" onClick={addOptionType}
              className="px-4 py-2.5 bg-primary-400 text-white rounded-xl text-sm font-arabic hover:bg-primary-500 transition-colors flex items-center gap-1.5">
              <Plus className="w-4 h-4" /> إضافة
            </button>
          </div>

          {/* Option types list */}
          {optionTypes.map((opt) => (
            <div key={opt.id} className="p-4 rounded-xl border border-gray-200 dark:border-[#2E2E2E] bg-gray-50/50 dark:bg-[#1A1A1A] mb-3">
              <div className="flex items-center justify-between mb-3">
                <span className="font-medium text-gray-800 dark:text-gray-200 font-arabic text-sm">{opt.name}</span>
                <button type="button" onClick={() => removeOptionType(opt.id)}
                  className="p-1 text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
              {/* Values */}
              <div className="flex flex-wrap gap-2 mb-3">
                {opt.values.map((val) => (
                  <span key={val} className="inline-flex items-center gap-1 px-2.5 py-1 bg-white dark:bg-[#1E1E1E] border border-gray-200 dark:border-[#2E2E2E] rounded-lg text-sm font-arabic text-gray-700 dark:text-gray-300">
                    {val}
                    <button type="button" onClick={() => removeValueFromOption(opt.id, val)}
                      className="text-gray-400 hover:text-red-500 transition-colors">
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
              {/* Add value */}
              <div className="flex gap-2">
                <input
                  value={newOptionValues[opt.id] ?? ''}
                  onChange={(e) => setNewOptionValues((p) => ({ ...p, [opt.id]: e.target.value }))}
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addValueToOption(opt.id))}
                  placeholder={`أضف قيمة للـ ${opt.name}...`}
                  className="flex-1 px-3 py-1.5 rounded-lg border border-gray-200 dark:border-[#2E2E2E] bg-white dark:bg-[#1E1E1E] text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 text-sm font-arabic focus:outline-none focus:ring-2 focus:ring-primary-400/30" />
                <button type="button" onClick={() => addValueToOption(opt.id)}
                  className="px-3 py-1.5 bg-gray-200 dark:bg-[#2E2E2E] text-gray-700 dark:text-gray-300 rounded-lg text-sm hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors">
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}

          {/* Generate button */}
          {optionTypes.length > 0 && (
            <button type="button" onClick={generateVariants}
              className="w-full py-3 bg-gradient-to-l from-primary-500 to-primary-400 text-white font-bold rounded-xl hover:opacity-90 transition-opacity font-arabic flex items-center justify-center gap-2">
              <Sparkles className="w-5 h-5" />
              توليد النسخ تلقائياً ({cartesian(optionTypes.filter((o) => o.values.length > 0).map((o) => o.values)).length} نسخة)
            </button>
          )}

          {/* Manual add */}
          <div className="flex items-center gap-3 mt-3">
            <div className="flex-1 h-px bg-gray-200 dark:bg-[#2E2E2E]" />
            <span className="text-xs text-gray-400 dark:text-gray-500 font-arabic">أو</span>
            <div className="flex-1 h-px bg-gray-200 dark:bg-[#2E2E2E]" />
          </div>
          <button type="button" onClick={addManualVariant}
            className="w-full py-2.5 border-2 border-dashed border-gray-200 dark:border-[#2E2E2E] text-gray-500 dark:text-gray-400 rounded-xl text-sm font-arabic hover:border-primary-300 dark:hover:border-primary-700 hover:text-primary-600 dark:hover:text-primary-400 transition-colors flex items-center justify-center gap-2 mt-2">
            <Plus className="w-4 h-4" /> إضافة نسخة يدوياً
          </button>
        </Section>

        {/* ── النسخ المولّدة ─────────────────────────────────────────── */}
        {variants.length > 0 && (() => {
          // جمع مفاتيح الخصائص المتاحة للترتيب
          const allAttrKeys: string[] = [];
          variants.forEach((v) => Object.keys(v.attributes ?? {}).forEach((k) => {
            if (!allAttrKeys.includes(k)) allAttrKeys.push(k);
          }));

          // ترتيب النسخ حسب الخاصية المختارة
          const sortedVariants = sortBy
            ? [...variants].sort((a, b) => {
                if (sortBy === '__price') return Number(a.price) - Number(b.price);
                if (sortBy === '__name') return a.name.localeCompare(b.name, 'ar');
                const av = a.attributes?.[sortBy] ?? '';
                const bv = b.attributes?.[sortBy] ?? '';
                return av.localeCompare(bv, 'ar');
              })
            : variants;

          return (
          <Section title={`النسخ (${variants.length})`}>
            {/* Bulk actions */}
            <div className="p-3 bg-gray-50 dark:bg-[#1A1A1A] rounded-xl border border-gray-100 dark:border-[#2E2E2E] space-y-2 mb-4">
              {/* صف 1: تحديد + ترتيب */}
              <div className="flex flex-wrap items-center gap-3">
                <span className="text-xs font-arabic text-gray-500 dark:text-gray-400 font-medium">إجراءات جماعية:</span>
                <button type="button" onClick={selectAllVariants}
                  className="text-xs text-primary-600 dark:text-primary-400 underline font-arabic">تحديد الكل</button>
                <button type="button" onClick={() => setSelectedVariants(new Set())}
                  className="text-xs text-gray-500 dark:text-gray-400 underline font-arabic">إلغاء الكل</button>
                <div className="flex items-center gap-1.5 mr-auto">
                  <span className="text-xs text-gray-400 dark:text-gray-500 font-arabic">ترتيب:</span>
                  <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}
                    className="px-2 py-1.5 rounded-lg border border-gray-200 dark:border-[#2E2E2E] text-xs font-arabic bg-white dark:bg-[#1E1E1E] text-gray-900 dark:text-gray-100 focus:outline-none">
                    <option value="">الافتراضي</option>
                    {allAttrKeys.map((k) => <option key={k} value={k}>{k}</option>)}
                    <option value="__price">السعر</option>
                    <option value="__name">الاسم</option>
                  </select>
                </div>
              </div>
              {/* صف 2: السعر + السعر القديم + المخزون */}
              <div className="flex flex-wrap items-center gap-2">
                <input type="number" value={bulkPrice} onChange={(e) => setBulkPrice(e.target.value)}
                  placeholder="السعر الجديد" className="w-28 px-2 py-1.5 rounded-lg border border-gray-200 dark:border-[#2E2E2E] bg-white dark:bg-[#1E1E1E] text-gray-900 dark:text-gray-100 text-xs font-mono focus:outline-none" />
                <button type="button" onClick={applyBulkPrice}
                  className="px-2.5 py-1.5 bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400 rounded-lg text-xs font-arabic hover:bg-primary-100 dark:hover:bg-primary-900/30">تطبيق السعر</button>
                <div className="w-px h-4 bg-gray-200 dark:bg-[#2E2E2E]" />
                <input type="number" value={bulkOldPrice} onChange={(e) => setBulkOldPrice(e.target.value)}
                  placeholder="السعر الأصلي" className="w-28 px-2 py-1.5 rounded-lg border border-gray-200 dark:border-[#2E2E2E] bg-white dark:bg-[#1E1E1E] text-gray-900 dark:text-gray-100 text-xs font-mono focus:outline-none" />
                <button type="button" onClick={applyBulkOldPrice}
                  className="px-2.5 py-1.5 bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400 rounded-lg text-xs font-arabic hover:bg-orange-100 dark:hover:bg-orange-900/30">تطبيق الأصلي</button>
                <div className="w-px h-4 bg-gray-200 dark:bg-[#2E2E2E]" />
                <input type="number" value={bulkStock} onChange={(e) => setBulkStock(e.target.value)}
                  placeholder="المخزون" className="w-24 px-2 py-1.5 rounded-lg border border-gray-200 dark:border-[#2E2E2E] bg-white dark:bg-[#1E1E1E] text-gray-900 dark:text-gray-100 text-xs font-mono focus:outline-none" />
                <button type="button" onClick={applyBulkStock}
                  className="px-2.5 py-1.5 bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400 rounded-lg text-xs font-arabic hover:bg-primary-100 dark:hover:bg-primary-900/30">تطبيق المخزون</button>
                <div className="w-px h-4 bg-gray-200 dark:bg-[#2E2E2E]" />
                <div className="flex items-center gap-1.5">
                  {bulkImage ? (
                    <div className="relative w-8 h-8">
                      <img src={bulkImage} alt="" className="w-8 h-8 object-cover rounded-md border border-gray-200 dark:border-[#2E2E2E]" />
                      <button type="button" onClick={() => setBulkImage('')}
                        className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white rounded-full flex items-center justify-center">
                        <X className="w-2.5 h-2.5" />
                      </button>
                    </div>
                  ) : (
                    <label className="w-8 h-8 border-2 border-dashed border-gray-200 dark:border-[#2E2E2E] rounded-md flex items-center justify-center cursor-pointer hover:border-primary-300 transition-colors">
                      <ImagePlus className="w-4 h-4 text-gray-300 dark:text-gray-600" />
                      <input ref={bulkImageRef} type="file" accept="image/*" className="hidden"
                        onChange={(e) => e.target.files?.[0] && handleBulkImageFile(e.target.files[0])} />
                    </label>
                  )}
                  <button type="button" onClick={applyBulkImage} disabled={!bulkImage}
                    className="px-2.5 py-1.5 bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400 rounded-lg text-xs font-arabic hover:bg-primary-100 dark:hover:bg-primary-900/30 disabled:opacity-40">تطبيق الصورة</button>
                </div>
              </div>
            </div>

            {/* Variant cards */}
            <div className="space-y-3">
              {sortedVariants.map((v) => {
                const idx = variants.indexOf(v);
                return (
                <div key={v.id ?? idx}
                  className={`rounded-xl border-2 overflow-hidden transition-colors ${v.is_main ? 'border-primary-300 dark:border-primary-700' : 'border-gray-100 dark:border-[#2E2E2E]'}`}>
                  {/* Variant header */}
                  <div className={`flex items-center gap-3 px-4 py-3 ${v.is_main ? 'bg-primary-50/40 dark:bg-primary-900/10' : 'bg-gray-50/40 dark:bg-[#1A1A1A]/40'}`}>
                    <input type="checkbox" checked={selectedVariants.has(idx)} onChange={() => toggleSelectVariant(idx)}
                      className="accent-primary-400" />
                    <input type="radio" name="is_main_radio" checked={v.is_main}
                      onChange={() => updateVariant(idx, 'is_main', true)}
                      className="accent-primary-400" title="تعيين كمتغير رئيسي" />
                    {v.image ? (
                      <img src={v.image} alt="" className="w-8 h-8 object-cover rounded-lg border border-gray-200 dark:border-[#2E2E2E] shrink-0" />
                    ) : (
                      <div className="w-8 h-8 rounded-lg border-2 border-dashed border-gray-200 dark:border-[#2E2E2E] flex items-center justify-center shrink-0">
                        <ImagePlus className="w-3.5 h-3.5 text-gray-300 dark:text-gray-600" />
                      </div>
                    )}
                    <span className="flex-1 font-arabic text-sm text-gray-700 dark:text-gray-300 font-medium">
                      {v.name || `نسخة ${idx + 1}`}
                      {v.is_main && <span className="mr-2 text-xs text-primary-500">⭐ رئيسي</span>}
                    </span>
                    {v.price && <span className="text-sm font-mono text-gray-500 dark:text-gray-400">{Number(v.price).toLocaleString()} دج</span>}
                    <button type="button" onClick={() => updateVariant(idx, 'expanded', !v.expanded)}
                      className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg">
                      {v.expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                    {variants.length > 1 && (
                      <button type="button" onClick={() => removeVariant(idx)}
                        className="p-1 text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  {/* Variant body (expanded) */}
                  {v.expanded && (
                    <div className="px-4 pb-4 pt-3 border-t border-gray-100 dark:border-[#2E2E2E] grid grid-cols-2 sm:grid-cols-3 gap-3">
                      <div className="sm:col-span-2">
                        <label className="text-xs text-gray-500 dark:text-gray-400 font-arabic block mb-1">اسم النسخة *</label>
                        <input value={v.name} onChange={(e) => updateVariant(idx, 'name', e.target.value)}
                          placeholder="مثال: أحمر - L" required
                          className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-[#2E2E2E] bg-white dark:bg-[#1E1E1E] text-gray-900 dark:text-gray-100 text-sm font-arabic focus:outline-none focus:ring-2 focus:ring-primary-400/30" />
                      </div>
                      <div>
                        <label className="text-xs text-gray-500 dark:text-gray-400 font-arabic block mb-1">SKU</label>
                        <input value={v.sku} onChange={(e) => updateVariant(idx, 'sku', e.target.value)}
                          placeholder="PRD-001-RED"
                          className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-[#2E2E2E] bg-white dark:bg-[#1E1E1E] text-gray-900 dark:text-gray-100 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary-400/30" />
                      </div>
                      <div>
                        <label className="text-xs text-gray-500 dark:text-gray-400 font-arabic block mb-1">السعر (دج) *</label>
                        <input type="number" value={v.price} onChange={(e) => updateVariant(idx, 'price', e.target.value)}
                          required min="0"
                          className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-[#2E2E2E] bg-white dark:bg-[#1E1E1E] text-gray-900 dark:text-gray-100 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary-400/30" />
                      </div>
                      <div>
                        <label className="text-xs text-gray-500 dark:text-gray-400 font-arabic block mb-1">السعر القديم (دج)</label>
                        <input type="number" value={v.old_price} onChange={(e) => updateVariant(idx, 'old_price', e.target.value)}
                          min="0"
                          className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-[#2E2E2E] bg-white dark:bg-[#1E1E1E] text-gray-900 dark:text-gray-100 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary-400/30" />
                      </div>
                      <div>
                        <label className="text-xs text-gray-500 dark:text-gray-400 font-arabic block mb-1">المخزون</label>
                        <input type="number" value={v.stock} onChange={(e) => updateVariant(idx, 'stock', e.target.value)}
                          min="0"
                          className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-[#2E2E2E] bg-white dark:bg-[#1E1E1E] text-gray-900 dark:text-gray-100 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary-400/30" />
                      </div>
                      {/* Variant image */}
                      <div className="sm:col-span-3">
                        <label className="text-xs text-gray-500 dark:text-gray-400 font-arabic block mb-1">صورة النسخة</label>
                        <div className="flex items-center gap-3">
                          {v.image ? (
                            <div className="relative w-16 h-16">
                              <img src={v.image} alt="" className="w-16 h-16 object-cover rounded-lg border border-gray-200 dark:border-[#2E2E2E]" />
                              <button type="button" onClick={() => updateVariant(idx, 'image', '')}
                                className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center">
                                <X className="w-3 h-3" />
                              </button>
                            </div>
                          ) : (
                            <label className="w-16 h-16 border-2 border-dashed border-gray-200 dark:border-[#2E2E2E] rounded-lg flex items-center justify-center cursor-pointer hover:border-primary-300 transition-colors">
                              <ImagePlus className="w-5 h-5 text-gray-300 dark:text-gray-600" />
                              <input type="file" accept="image/*" className="hidden"
                                onChange={(e) => e.target.files?.[0] && handleVariantImage(idx, e.target.files[0])} />
                            </label>
                          )}
                          <Toggle checked={v.is_active} onChange={(val) => updateVariant(idx, 'is_active', val)} label="نسخة نشطة" />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Quick price/stock inline (collapsed) */}
                  {!v.expanded && (
                    <div className="px-4 pb-3 grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-xs text-gray-400 dark:text-gray-500 font-arabic block mb-1">السعر (دج) *</label>
                        <input type="number" value={v.price} onChange={(e) => updateVariant(idx, 'price', e.target.value)}
                          required min="0" placeholder="0"
                          className="w-full px-2.5 py-1.5 rounded-lg border border-gray-200 dark:border-[#2E2E2E] bg-white dark:bg-[#1E1E1E] text-gray-900 dark:text-gray-100 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary-400/30" />
                      </div>
                      <div>
                        <label className="text-xs text-gray-400 dark:text-gray-500 font-arabic block mb-1">المخزون</label>
                        <input type="number" value={v.stock} onChange={(e) => updateVariant(idx, 'stock', e.target.value)}
                          min="0" placeholder="0"
                          className="w-full px-2.5 py-1.5 rounded-lg border border-gray-200 dark:border-[#2E2E2E] bg-white dark:bg-[#1E1E1E] text-gray-900 dark:text-gray-100 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary-400/30" />
                      </div>
                    </div>
                  )}
                </div>
                );
              })}
            </div>
          </Section>
          );
        })()}

        {/* ── المواصفات الفنية ──────────────────────────────────────── */}
        <Section title="المواصفات الفنية">
          {/* Examples */}
          <div className="mb-4">
            <p className="text-xs text-gray-400 dark:text-gray-500 font-arabic mb-2">أمثلة سريعة:</p>
            <div className="flex flex-wrap gap-2">
              {SPEC_EXAMPLES.map((ex) => (
                <button key={ex.key} type="button"
                  onClick={() => setSpecs((p) => p.find((s) => s.key === ex.key) ? p : [...p, ex])}
                  className="px-2.5 py-1 text-xs bg-gray-100 dark:bg-[#252525] text-gray-600 dark:text-gray-400 rounded-lg hover:bg-primary-50 dark:hover:bg-primary-900/20 hover:text-primary-600 dark:hover:text-primary-400 font-arabic transition-colors">
                  + {ex.key}
                </button>
              ))}
            </div>
          </div>

          {/* Spec list */}
          {specs.map((spec, i) => (
            <div key={i} className="flex items-center gap-2 mb-2">
              <input value={spec.key} onChange={(e) => setSpecs((p) => p.map((s, j) => j === i ? { ...s, key: e.target.value } : s))}
                placeholder="المواصفة"
                className="w-36 px-3 py-2 rounded-lg border border-gray-200 dark:border-[#2E2E2E] bg-white dark:bg-[#1E1E1E] text-gray-900 dark:text-gray-100 text-sm font-arabic focus:outline-none focus:ring-2 focus:ring-primary-400/30" />
              <span className="text-gray-300 dark:text-gray-600">:</span>
              <input value={spec.value} onChange={(e) => setSpecs((p) => p.map((s, j) => j === i ? { ...s, value: e.target.value } : s))}
                placeholder="القيمة"
                className="flex-1 px-3 py-2 rounded-lg border border-gray-200 dark:border-[#2E2E2E] bg-white dark:bg-[#1E1E1E] text-gray-900 dark:text-gray-100 text-sm font-arabic focus:outline-none focus:ring-2 focus:ring-primary-400/30" />
              <button type="button" onClick={() => removeSpec(i)}
                className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}

          {/* Add spec */}
          <div className="flex items-center gap-2 mt-2">
            <input value={newSpec.key} onChange={(e) => setNewSpec((p) => ({ ...p, key: e.target.value }))}
              placeholder="المواصفة (مثال: الوزن)"
              className="w-36 px-3 py-2 rounded-lg border border-gray-200 dark:border-[#2E2E2E] bg-gray-50 dark:bg-[#1A1A1A] text-gray-900 dark:text-gray-100 text-sm font-arabic focus:outline-none focus:ring-2 focus:ring-primary-400/30" />
            <span className="text-gray-300 dark:text-gray-600">:</span>
            <input value={newSpec.value}
              onChange={(e) => setNewSpec((p) => ({ ...p, value: e.target.value }))}
              onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addSpec())}
              placeholder="القيمة (مثال: 185 غرام)"
              className="flex-1 px-3 py-2 rounded-lg border border-gray-200 dark:border-[#2E2E2E] bg-gray-50 dark:bg-[#1A1A1A] text-gray-900 dark:text-gray-100 text-sm font-arabic focus:outline-none focus:ring-2 focus:ring-primary-400/30" />
            <button type="button" onClick={addSpec}
              className="p-2 bg-primary-400 text-white rounded-lg hover:bg-primary-500 transition-colors">
              <Plus className="w-4 h-4" />
            </button>
          </div>
        </Section>

        {/* ── الفيديو ──────────────────────────────────────────────── */}
        <Section title="فيديو المنتج (اختياري)">
          {videoPreview ? (
            <div className="space-y-3">
              <video src={videoPreview} controls className="w-full rounded-xl max-h-64 bg-black" />
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500 dark:text-gray-400 font-arabic truncate">{videoName}</span>
                <button type="button" onClick={() => { setVideoPreview(''); setVideoName(''); }}
                  className="flex items-center gap-1.5 text-sm text-red-500 hover:text-red-700 font-arabic">
                  <Trash2 className="w-4 h-4" /> حذف الفيديو
                </button>
              </div>
            </div>
          ) : (
            <div onClick={() => videoRef.current?.click()}
              className="border-2 border-dashed border-gray-200 dark:border-[#2E2E2E] rounded-xl p-8 text-center cursor-pointer hover:border-primary-300 dark:hover:border-primary-700 transition-colors">
              <Video className="w-10 h-10 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
              <p className="text-sm font-arabic text-gray-500 dark:text-gray-400 mb-1">انقر لرفع فيديو المنتج</p>
              <p className="text-xs text-gray-400 dark:text-gray-500">MP4, MOV, AVI — حتى 50MB</p>
            </div>
          )}
          <input ref={videoRef} type="file" accept="video/*" className="hidden"
            onChange={(e) => e.target.files?.[0] && handleVideo(e.target.files[0])} />
        </Section>

        {/* ── أزرار الحفظ ────────────────────────────────────────────── */}
        <div className="flex gap-3">
          <button type="submit" disabled={saving}
            className="flex-1 py-3.5 bg-primary-400 text-white font-bold rounded-xl hover:bg-primary-500 transition-colors font-arabic flex items-center justify-center gap-2 disabled:opacity-60">
            {saving
              ? <><span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> جاري الحفظ...</>
              : <><Save className="w-5 h-5" /> {isEdit ? 'حفظ التعديلات' : 'إضافة المنتج'}</>
            }
          </button>
          <Link to="/merchant/products"
            className="px-6 py-3.5 bg-white dark:bg-[#1E1E1E] border border-gray-200 dark:border-[#2E2E2E] text-gray-700 dark:text-gray-300 font-arabic rounded-xl hover:bg-gray-50 dark:hover:bg-[#252525] transition-colors text-center">
            إلغاء
          </Link>
        </div>
      </form>
    </div>
  );
}

// ─── Section wrapper ──────────────────────────────────────────────────────────
function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white dark:bg-[#1A1A1A] rounded-2xl border border-gray-100 dark:border-[#2E2E2E] p-6 space-y-4">
      <h3 className="font-bold text-gray-800 dark:text-gray-200 font-arabic border-b border-gray-100 dark:border-[#2E2E2E] pb-3 -mt-1 mb-1">{title}</h3>
      {children}
    </div>
  );
}
