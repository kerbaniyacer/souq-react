/**
 * خدمة تتبع عناوين IP - مبسطة للعمل مع Django
 */
import djangoApi from './authService';

/** جلب IP الحالي للمستخدم عبر api.ipify.org */
export async function getCurrentIP(): Promise<string> {
  try {
    const res = await fetch('https://api.ipify.org?format=json');
    const data = await res.json();
    return data.ip ?? 'unknown';
  } catch {
    return 'unknown';
  }
}

/** جلب سجل تسجيل الدخول لمستخدم معيّن (من Django) */
export async function getLoginHistory() {
  try {
    const res = await djangoApi.get('/auth/login-history/');
    return res.data;
  } catch {
    return [];
  }
}

/** 
 * لاحظ: عمليات التحقق من IP وتوليد OTP تتم الآن برمجياً داخل 
 * خادم Django عند محاولة تسجيل الدخول من جهاز جديد.
 */

