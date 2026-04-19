/**
 * حقول العنوان: الولاية → البلدية → الرمز البريدي
 * مكوّن مشترك يُستخدم في Checkout و Profile و Register
 */
import { useEffect, useMemo, useRef, useState } from 'react';
import { MapPin } from 'lucide-react';
import { useAlgeria } from '@hooks/useAlgeria';

interface Props {
  wilaya: string;
  baladia: string;
  postal_code: string;
  onChange: (field: 'wilaya' | 'baladia' | 'postal_code', value: string) => void;
  required?: boolean;
  className?: string;
}

export default function AddressFields({ wilaya, baladia, postal_code, onChange, required = true, className = '' }: Props) {
  const { loading, wilayas, getCommunesByWilaya, getPostalCodes } = useAlgeria();
  const [postalError, setPostalError] = useState(false);
  const postalRef = useRef<HTMLInputElement>(null);

  // البلديات المتاحة للولاية المختارة
  const communes = useMemo(
    () => (wilaya ? getCommunesByWilaya(wilaya) : []),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [wilaya, loading]
  );

  // الرموز البريدية للبلدية المختارة
  const postalEntries = useMemo(
    () => (wilaya && baladia ? getPostalCodes(wilaya, baladia) : []),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [wilaya, baladia, loading]
  );

  const validCodes = useMemo(() => postalEntries.map((e) => e.post_code), [postalEntries]);

  // عند تغيير الولاية: أعد ضبط البلدية والرمز البريدي
  const handleWilayaChange = (val: string) => {
    onChange('wilaya', val);
    onChange('baladia', '');
    onChange('postal_code', '');
    setPostalError(false);
  };

  // عند تغيير البلدية: أعد ضبط الرمز البريدي
  const handleCommuneChange = (val: string) => {
    onChange('baladia', val);
    onChange('postal_code', '');
    setPostalError(false);
  };

  // عند تغيير الرمز البريدي: تحقق فوري
  const handlePostalChange = (val: string) => {
    onChange('postal_code', val);
    if (val === '') { setPostalError(false); return; }
    setPostalError(!validCodes.includes(val));
  };

  // إذا تغيّرت البلدية واختفى الرمز الحالي من القائمة
  useEffect(() => {
    if (postal_code && validCodes.length > 0 && !validCodes.includes(postal_code)) {
      setPostalError(true);
    } else {
      setPostalError(false);
    }
  }, [validCodes, postal_code]);

  // معرّف datalist فريد لتفادي تعارض أكثر من مكوّن في نفس الصفحة
  const datalistId = 'postal-datalist-' + (wilaya + baladia).replace(/\s/g, '-');

  const inputCls = (error?: boolean) =>
    `w-full px-4 py-3 rounded-xl border bg-gray-50 focus:outline-none focus:ring-2 transition-all font-arabic text-sm ${
      error
        ? 'border-red-400 focus:ring-red-300/30'
        : 'border-gray-200 focus:ring-primary-400/30 focus:border-primary-400'
    }`;

  if (loading) {
    return (
      <div className={`grid grid-cols-1 sm:grid-cols-2 gap-4 ${className}`}>
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-12 bg-gray-100 rounded-xl animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className={`grid grid-cols-1 sm:grid-cols-2 gap-4 ${className}`}>
      {/* الولاية */}
      <div>
        <label className="block text-sm font-medium text-gray-700 font-arabic mb-2">
          الولاية {required && <span className="text-red-500">*</span>}
        </label>
        <div className="relative">
          <MapPin className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          <select
            value={wilaya}
            onChange={(e) => handleWilayaChange(e.target.value)}
            required={required}
            className={`${inputCls()} pr-9`}
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
        <label className="block text-sm font-medium text-gray-700 font-arabic mb-2">
          البلدية {required && <span className="text-red-500">*</span>}
        </label>
        <select
          value={baladia}
          onChange={(e) => handleCommuneChange(e.target.value)}
          required={required}
          disabled={!wilaya || communes.length === 0}
          className={`${inputCls()} disabled:opacity-50 disabled:cursor-not-allowed`}
        >
          <option value="">{wilaya ? 'اختر البلدية' : 'اختر الولاية أولاً'}</option>
          {communes.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
      </div>

      {/* الرمز البريدي */}
      <div>
        <label className="block text-sm font-medium text-gray-700 font-arabic mb-2">
          الرمز البريدي {required && <span className="text-red-500">*</span>}
        </label>
        <input
          ref={postalRef}
          list={datalistId}
          value={postal_code}
          onChange={(e) => handlePostalChange(e.target.value)}
          required={required}
          disabled={!baladia}
          placeholder={baladia ? 'اكتب أو اختر الرمز البريدي' : 'اختر البلدية أولاً'}
          className={`${inputCls(postalError)} disabled:opacity-50 disabled:cursor-not-allowed`}
        />
        <datalist id={datalistId}>
          {postalEntries.map((e) => (
            <option key={e.post_code} value={e.post_code}>{e.post_code} — {e.post_name}</option>
          ))}
        </datalist>
        {postalError && (
          <p className="text-red-500 text-xs mt-1 font-arabic">
            الرمز البريدي غير صحيح لهذه البلدية
            {validCodes.length > 0 && ` — الرموز الصحيحة: ${validCodes.slice(0, 4).join('، ')}${validCodes.length > 4 ? '...' : ''}`}
          </p>
        )}
        {!postalError && postal_code && validCodes.includes(postal_code) && (
          <p className="text-green-600 text-xs mt-1 font-arabic">
            ✓ {postalEntries.find((e) => e.post_code === postal_code)?.post_name}
          </p>
        )}
      </div>
    </div>
  );
}
