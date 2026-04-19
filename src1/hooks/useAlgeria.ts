/**
 * Hook لتحميل بيانات الولايات والبلديات والرموز البريدية الجزائرية
 */
import { useEffect, useState } from 'react';

export interface PostalEntry {
  post_code: string;
  post_name: string;
  post_address: string;
  commune_id: number;
  commune_name: string;
  daira_name: string;
  wilaya_code: string;
  wilaya_name: string;
}

export interface WilayaOption {
  code: string;   // e.g. "16"
  name: string;   // e.g. "الجزائر"
  label: string;  // e.g. "16 - الجزائر"
}

let _cache: PostalEntry[] | null = null;

export function useAlgeria() {
  const [data, setData] = useState<PostalEntry[]>(_cache ?? []);
  const [loading, setLoading] = useState(!_cache);

  useEffect(() => {
    if (_cache) { setData(_cache); setLoading(false); return; }
    fetch('/algeria_postal_codes.json')
      .then((r) => r.json())
      .then((json: PostalEntry[]) => {
        _cache = json;
        setData(json);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  /** قائمة الولايات مرتبة بالرمز */
  const wilayas: WilayaOption[] = (() => {
    const map = new Map<string, string>();
    data.forEach((e) => {
      if (!map.has(e.wilaya_code)) map.set(e.wilaya_code, e.wilaya_name);
    });
    return Array.from(map.entries())
      .sort((a, b) => Number(a[0]) - Number(b[0]))
      .map(([code, name]) => ({ code, name, label: `${code} - ${name}` }));
  })();

  /** البلديات لولاية معيّنة (بالاسم أو الرمز) */
  function getCommunesByWilaya(wilayaNameOrCode: string): string[] {
    const filtered = data.filter(
      (e) => e.wilaya_name === wilayaNameOrCode || e.wilaya_code === wilayaNameOrCode
    );
    return [...new Set(filtered.map((e) => e.commune_name))].sort((a, b) =>
      a.localeCompare(b, 'ar')
    );
  }

  /** الرموز البريدية لبلدية معيّنة ضمن ولاية */
  function getPostalCodes(wilayaNameOrCode: string, communeName: string): PostalEntry[] {
    return data.filter(
      (e) =>
        (e.wilaya_name === wilayaNameOrCode || e.wilaya_code === wilayaNameOrCode) &&
        e.commune_name === communeName
    );
  }

  /** التحقق من صحة الرمز البريدي لبلدية ولاية معيّنة */
  function isValidPostalCode(
    wilayaNameOrCode: string,
    communeName: string,
    code: string
  ): boolean {
    if (!code.trim()) return false;
    return getPostalCodes(wilayaNameOrCode, communeName).some((e) => e.post_code === code.trim());
  }

  /** البحث عن إدخال برمز بريدي */
  function findByPostalCode(code: string): PostalEntry | undefined {
    return data.find((e) => e.post_code === code.trim());
  }

  return { loading, wilayas, getCommunesByWilaya, getPostalCodes, isValidPostalCode, findByPostalCode };
}
