/**
 * حقول العنوان: الولاية → البلدية
 * مكوّن مشترك يُستخدم في Checkout و Profile و Register
 */
import { useMemo } from 'react';
import { MapPin } from 'lucide-react';
import { useAlgeria } from '@souq/hooks/useAlgeria';

interface Props {
  wilaya: string;
  baladia: string;
  onChange: (field: 'wilaya' | 'baladia', value: string) => void;
  required?: boolean;
  className?: string;
}

export default function AddressFields({ wilaya, baladia, onChange, required = true, className = '' }: Props) {
  const { loading, wilayas, getCommunesByWilaya } = useAlgeria();

  const communes = useMemo(
    () => (wilaya ? getCommunesByWilaya(wilaya) : []),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [wilaya, loading]
  );

  const handleWilayaChange = (val: string) => {
    onChange('wilaya', val);
    onChange('baladia', '');
  };

  const inputCls = `w-full px-4 py-3 rounded-xl border bg-gray-50 dark:bg-[#1A1A1A] text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-400/30 focus:border-primary-400 transition-all font-arabic text-sm border-gray-200 dark:border-[#2E2E2E]`;

  if (loading) {
    return (
      <div className={`grid grid-cols-1 sm:grid-cols-2 gap-4 ${className}`}>
        {[...Array(2)].map((_, i) => (
          <div key={i} className="h-12 bg-gray-100 dark:bg-gray-800 rounded-xl animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className={`grid grid-cols-1 sm:grid-cols-2 gap-4 ${className}`}>
      {/* الولاية */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 font-arabic mb-2">
          الولاية {required && <span className="text-red-500">*</span>}
        </label>
        <div className="relative">
          <MapPin className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          <select
            value={wilaya}
            onChange={(e) => handleWilayaChange(e.target.value)}
            required={required}
            className={`${inputCls} pr-9`}
          >
            <option value="">اختر الولاية</option>
            {wilayas.map((w) => (
              <option key={w.code} value={w.name}>{w.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* البلدية */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 font-arabic mb-2">
          البلدية {required && <span className="text-red-500">*</span>}
        </label>
        <select
          value={baladia}
          onChange={(e) => onChange('baladia', e.target.value)}
          required={required}
          disabled={!wilaya || communes.length === 0}
          className={`${inputCls} disabled:opacity-50 disabled:cursor-not-allowed`}
        >
          <option value="">{wilaya ? 'اختر البلدية' : 'اختر الولاية أولاً'}</option>
          {communes.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
      </div>
    </div>
  );
}
