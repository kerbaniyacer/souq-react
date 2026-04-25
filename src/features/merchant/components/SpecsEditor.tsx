import { useState } from 'react';
import { Plus, Trash2, ChevronDown, ChevronRight, Zap } from 'lucide-react';

// ── Types ────────────────────────────────────────────────────────────────────

export type SpecDetail = { key: string; value: string };

export type Spec =
  | { type: 'simple'; name: string; value: string }
  | { type: 'group';  name: string; values: SpecDetail[] };

// ── Smart presets ─────────────────────────────────────────────────────────────

const PRESETS: { label: string; icon: string; spec: Spec }[] = [
  { label: 'المعالج',       icon: '⚡', spec: { type: 'simple', name: 'المعالج',       value: '' } },
  { label: 'الشاشة',        icon: '🖥',  spec: { type: 'group',  name: 'الشاشة',       values: [
    { key: 'النوع', value: '' }, { key: 'الحجم', value: '' },
    { key: 'الدقة', value: '' }, { key: 'التردد', value: '' },
  ]}},
  { label: 'البطارية',      icon: '🔋', spec: { type: 'group',  name: 'البطارية',     values: [
    { key: 'السعة', value: '' }, { key: 'الشحن السريع', value: '' }, { key: 'الشحن اللاسلكي', value: '' },
  ]}},
  { label: 'الذاكرة',       icon: '💾', spec: { type: 'group',  name: 'الذاكرة',      values: [
    { key: 'RAM', value: '' }, { key: 'التخزين', value: '' },
  ]}},
  { label: 'الكاميرا',      icon: '📷', spec: { type: 'group',  name: 'الكاميرا',     values: [
    { key: 'الرئيسية', value: '' }, { key: 'الأمامية', value: '' },
  ]}},
  { label: 'الاتصال',       icon: '📡', spec: { type: 'group',  name: 'الاتصال',      values: [
    { key: '5G / 4G', value: '' }, { key: 'WiFi', value: '' }, { key: 'Bluetooth', value: '' },
  ]}},
  { label: 'الأبعاد',       icon: '📐', spec: { type: 'group',  name: 'الأبعاد',      values: [
    { key: 'الطول', value: '' }, { key: 'العرض', value: '' },
    { key: 'السماكة', value: '' }, { key: 'الوزن', value: '' },
  ]}},
  { label: 'نظام التشغيل',  icon: '📱', spec: { type: 'simple', name: 'نظام التشغيل', value: '' } },
  { label: 'الخامة',        icon: '🧵', spec: { type: 'simple', name: 'الخامة',        value: '' } },
  { label: 'بلد الصنع',     icon: '🌍', spec: { type: 'simple', name: 'بلد الصنع',     value: '' } },
  { label: 'الضمان',        icon: '✅', spec: { type: 'simple', name: 'الضمان',         value: '' } },
];

// ── Sub-components ────────────────────────────────────────────────────────────

function SpecDetailItem({
  detail, onUpdate, onRemove, isOnly,
}: {
  detail: SpecDetail;
  onUpdate: (field: 'key' | 'value', val: string) => void;
  onRemove: () => void;
  isOnly: boolean;
}) {
  return (
    <div className="flex items-center gap-2">
      <input
        value={detail.key}
        onChange={e => onUpdate('key', e.target.value)}
        placeholder="المفتاح"
        className="w-28 shrink-0 px-2.5 py-1.5 text-xs bg-gray-50 dark:bg-[#252525] border border-gray-100 dark:border-gray-700 rounded-lg text-gray-600 dark:text-gray-400 outline-none focus:border-primary-400 transition-colors placeholder-gray-300 dark:placeholder-gray-600"
      />
      <span className="text-gray-300 dark:text-gray-600 shrink-0 text-sm">:</span>
      <input
        value={detail.value}
        onChange={e => onUpdate('value', e.target.value)}
        placeholder="القيمة"
        className="flex-1 px-2.5 py-1.5 text-xs bg-gray-50 dark:bg-[#252525] border border-gray-100 dark:border-gray-700 rounded-lg text-gray-700 dark:text-gray-300 outline-none focus:border-primary-400 transition-colors placeholder-gray-300 dark:placeholder-gray-600"
      />
      <button
        type="button"
        onClick={onRemove}
        disabled={isOnly}
        className="p-1 text-gray-300 dark:text-gray-600 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed shrink-0"
      >
        <Trash2 className="w-3 h-3" />
      </button>
    </div>
  );
}

function SpecItem({
  spec, collapsed, onToggleCollapse, onUpdate, onRemove,
}: {
  spec: Spec;
  collapsed: boolean;
  onToggleCollapse: () => void;
  onUpdate: (spec: Spec) => void;
  onRemove: () => void;
}) {
  const handleToggleType = () => {
    if (spec.type === 'simple') {
      onUpdate({ type: 'group', name: spec.name, values: [{ key: '', value: '' }] });
    } else {
      onUpdate({ type: 'simple', name: spec.name, value: spec.values[0]?.value ?? '' });
    }
  };

  return (
    <div className={`bg-white dark:bg-[#1A1A1A] border rounded-2xl overflow-hidden transition-all ${
      spec.type === 'group' ? 'border-indigo-100 dark:border-indigo-900/30' : 'border-gray-100 dark:border-gray-800'
    }`}>
      {/* Header row */}
      <div className="flex items-center gap-2 px-3 py-2.5">
        {spec.type === 'group' ? (
          <button
            type="button"
            onClick={onToggleCollapse}
            className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg transition-colors shrink-0"
          >
            {collapsed ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        ) : (
          <span className="w-6 h-6 shrink-0 flex items-center justify-center text-gray-300 dark:text-gray-700 text-xs">—</span>
        )}

        <input
          value={spec.name}
          onChange={e => onUpdate({ ...spec, name: e.target.value } as Spec)}
          placeholder="اسم الخاصية"
          className="flex-1 bg-transparent text-sm font-bold text-gray-800 dark:text-gray-200 outline-none placeholder-gray-300 dark:placeholder-gray-600 min-w-0"
        />

        {/* Type badge / toggle */}
        <button
          type="button"
          onClick={handleToggleType}
          title="تبديل النوع"
          className={`flex items-center gap-1 px-2.5 py-1 text-[10px] font-bold rounded-xl transition-all border shrink-0 ${
            spec.type === 'group'
              ? 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 border-indigo-100 dark:border-indigo-800/50'
              : 'bg-gray-50 dark:bg-[#252525] text-gray-500 dark:text-gray-400 border-gray-200 dark:border-gray-700 hover:border-primary-200 dark:hover:border-primary-800'
          }`}
        >
          {spec.type === 'group' ? '◈ متقدم' : '◉ بسيط'}
        </button>

        <button
          type="button"
          onClick={onRemove}
          className="p-1.5 text-gray-200 dark:text-gray-700 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors shrink-0"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Simple value */}
      {spec.type === 'simple' && (
        <div className="px-3 pb-3">
          <input
            value={spec.value}
            onChange={e => onUpdate({ ...spec, value: e.target.value })}
            placeholder="أدخل القيمة..."
            className="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-[#252525] border border-gray-100 dark:border-gray-700 rounded-xl text-gray-700 dark:text-gray-300 outline-none focus:border-primary-400 transition-colors placeholder-gray-300 dark:placeholder-gray-600"
          />
        </div>
      )}

      {/* Group details */}
      {spec.type === 'group' && !collapsed && (
        <div className="px-3 pb-3 space-y-1.5">
          <div className="w-full h-px bg-gray-50 dark:bg-gray-800/50 mb-2" />
          {spec.values.map((detail, di) => (
            <SpecDetailItem
              key={di}
              detail={detail}
              isOnly={spec.values.length === 1}
              onUpdate={(field, val) => {
                const newValues = spec.values.map((d, j) => j === di ? { ...d, [field]: val } : d);
                onUpdate({ ...spec, values: newValues });
              }}
              onRemove={() => {
                onUpdate({ ...spec, values: spec.values.filter((_, j) => j !== di) });
              }}
            />
          ))}
          <button
            type="button"
            onClick={() => onUpdate({ ...spec, values: [...spec.values, { key: '', value: '' }] })}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-900/10 hover:bg-primary-100 dark:hover:bg-primary-900/20 rounded-lg transition-colors border border-dashed border-primary-200 dark:border-primary-800"
          >
            <Plus className="w-3 h-3" />
            إضافة تفصيل
          </button>
        </div>
      )}
    </div>
  );
}

// ── Main export ───────────────────────────────────────────────────────────────

interface Props {
  specs: Spec[];
  onChange: (specs: Spec[]) => void;
}

export default function SpecsEditor({ specs, onChange }: Props) {
  const [collapsed, setCollapsed] = useState<Record<number, boolean>>({});

  const addPreset = (preset: Spec) => {
    if (specs.some(s => s.name === preset.name)) return;
    onChange([...specs, JSON.parse(JSON.stringify(preset))]);
  };

  const addBlank = () => {
    onChange([...specs, { type: 'simple', name: '', value: '' }]);
  };

  const update = (i: number, spec: Spec) => {
    onChange(specs.map((s, idx) => idx === i ? spec : s));
  };

  const remove = (i: number) => {
    onChange(specs.filter((_, idx) => idx !== i));
    setCollapsed(c => {
      const next: Record<number, boolean> = {};
      Object.entries(c).forEach(([k, v]) => {
        const ki = Number(k);
        if (ki !== i) next[ki > i ? ki - 1 : ki] = v;
      });
      return next;
    });
  };

  return (
    <div className="space-y-4 font-arabic" dir="rtl">
      {/* ── Smart presets ── */}
      <div>
        <p className="text-xs text-gray-400 dark:text-gray-500 mb-2.5 flex items-center gap-1.5">
          <Zap className="w-3.5 h-3.5 text-amber-400" />
          إضافة سريعة
        </p>
        <div className="flex flex-wrap gap-2">
          {PRESETS.map(p => {
            const exists = specs.some(s => s.name === p.spec.name);
            return (
              <button
                key={p.label}
                type="button"
                onClick={() => addPreset(p.spec)}
                disabled={exists}
                className={`flex items-center gap-1.5 px-2.5 py-1 text-xs rounded-xl transition-all border ${
                  exists
                    ? 'bg-gray-50 dark:bg-[#1A1A1A] text-gray-300 dark:text-gray-600 border-gray-100 dark:border-gray-800 cursor-not-allowed'
                    : 'bg-white dark:bg-[#1A1A1A] text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-700 hover:bg-primary-50 dark:hover:bg-primary-900/20 hover:text-primary-600 dark:hover:text-primary-400 hover:border-primary-200 dark:hover:border-primary-800'
                }`}
              >
                <span>{p.icon}</span>
                <span>{p.label}</span>
                {p.spec.type === 'group' && !exists && (
                  <span className="text-[9px] font-mono opacity-40">⊞</span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Spec list ── */}
      {specs.length > 0 && (
        <div className="space-y-2">
          {specs.map((spec, i) => (
            <SpecItem
              key={i}
              spec={spec}
              collapsed={!!collapsed[i]}
              onToggleCollapse={() => setCollapsed(c => ({ ...c, [i]: !c[i] }))}
              onUpdate={s => update(i, s)}
              onRemove={() => remove(i)}
            />
          ))}
        </div>
      )}

      {/* ── Add blank ── */}
      <button
        type="button"
        onClick={addBlank}
        className="w-full flex items-center justify-center gap-2 py-2.5 text-sm text-gray-400 dark:text-gray-500 border border-dashed border-gray-200 dark:border-gray-700 rounded-2xl hover:border-primary-300 dark:hover:border-primary-700 hover:text-primary-600 dark:hover:text-primary-400 transition-all"
      >
        <Plus className="w-4 h-4" />
        إضافة خاصية جديدة
      </button>
    </div>
  );
}
