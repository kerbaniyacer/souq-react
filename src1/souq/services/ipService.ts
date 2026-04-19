/**
 * خدمة تتبع عناوين IP وسجل تسجيل الدخول
 */

const DB = '/db?XTransformPort=3001';

export interface LoginRecord {
  id?: string;
  user_id: string;
  ip: string;
  user_agent: string;
  logged_at: string;
}

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

/** جلب آخر IP سجّل به المستخدم */
async function getLastLoginIP(userId: string): Promise<string | null> {
  try {
    const res = await fetch(`${DB}/login_history`);
    const all: LoginRecord[] = await res.json();
    const userHistory = all
      .filter((r) => String(r.user_id) === String(userId))
      .sort((a, b) => new Date(b.logged_at).getTime() - new Date(a.logged_at).getTime());
    return userHistory.length > 0 ? userHistory[0].ip : null;
  } catch {
    return null;
  }
}

/** تسجيل دخول جديد في السجل */
export async function recordLogin(userId: string, ip: string): Promise<void> {
  try {
    await fetch(`${DB}/login_history`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user_id: userId,
        ip,
        user_agent: navigator.userAgent,
        logged_at: new Date().toISOString(),
      }),
    });
  } catch {
    // تجاهل
  }
}

/** جلب سجل تسجيل الدخول لمستخدم معيّن */
export async function getLoginHistory(userId: string): Promise<LoginRecord[]> {
  try {
    const res = await fetch(`${DB}/login_history`);
    const all: LoginRecord[] = await res.json();
    return all
      .filter((r) => String(r.user_id) === String(userId))
      .sort((a, b) => new Date(b.logged_at).getTime() - new Date(a.logged_at).getTime());
  } catch {
    return [];
  }
}

/**
 * تحقق من تغيير IP وأرجع true إذا كان IP جديداً أو لا يوجد سجل
 * لا يُسجّل الدخول تلقائياً — استخدم recordLogin بعد التحقق
 */
export async function checkAndRecordLogin(
  userId: string,
  ip: string
): Promise<{ isNewIP: boolean; previousIP: string | null }> {
  const previousIP = await getLastLoginIP(userId);
  // isNewIP = true إذا لم يوجد سجل سابق أو تغيّر الـ IP
  const isNewIP = previousIP === null || previousIP !== ip;
  if (!isNewIP) {
    // IP مألوف → سجّل الدخول مباشرة
    await recordLogin(userId, ip);
  }
  return { isNewIP, previousIP };
}

/** حذف آخر سجل دخول للمستخدم (يُستخدم عند إلغاء دخول لم يكتمل بـ OTP) */
export async function deleteLastLoginRecord(userId: string): Promise<void> {
  try {
    const res = await fetch(`${DB}/login_history`);
    const all: LoginRecord[] = await res.json();
    const userHistory = all
      .filter((r) => String(r.user_id) === String(userId))
      .sort((a, b) => new Date(b.logged_at).getTime() - new Date(a.logged_at).getTime());
    if (userHistory.length > 0 && userHistory[0].id) {
      await fetch(`${DB}/login_history/${userHistory[0].id}`, { method: 'DELETE' });
    }
  } catch { /* تجاهل */ }
}

/** توليد رمز OTP عشوائي وحفظه في قاعدة البيانات (صالح 10 دقائق) */
export async function generateAndSaveOTP(userId: string): Promise<string> {
  // حذف أي OTP قديم للمستخدم — نجلب الكل ونفلتر يدوياً لضمان التطابق
  try {
    const res = await fetch(`${DB}/otps`);
    const all: any[] = await res.json();
    const old = all.filter((o) => String(o.user_id) === String(userId));
    await Promise.all(old.map((o) => fetch(`${DB}/otps/${o.id}`, { method: 'DELETE' })));
  } catch { /* تجاهل */ }

  const code = String(Math.floor(100000 + Math.random() * 900000));
  const expires_at = new Date(Date.now() + 10 * 60 * 1000).toISOString();
  await fetch(`${DB}/otps`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ user_id: String(userId), code, expires_at }),
  });
  if (process.env.NODE_ENV === "development") {
    console.log(`[OTP] User ${userId} → code: ${code}`);
  }
  return code;
}

/** التحقق من صحة رمز OTP — يحذفه عند النجاح */
export async function verifyOTP(userId: string, code: string): Promise<boolean> {
  try {
    const res = await fetch(`${DB}/otps`);
    const all: any[] = await res.json();
    // نفلتر يدوياً بدل query params لضمان تطابق string/number
    const otps = all.filter((o) => String(o.user_id) === String(userId));
    const match = otps.find(
      (o) => String(o.code) === String(code) && new Date(o.expires_at) > new Date()
    );
    if (match) {
      await fetch(`${DB}/otps/${match.id}`, { method: 'DELETE' });
      return true;
    }
    return false;
  } catch {
    return false;
  }
}
