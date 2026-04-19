/**
 * خدمة المصادقة المحلية - تعمل مع JSON Server
 */
import axios from 'axios';
import { sendWelcomeEmail, sendSecurityAlertEmail, sendOtpEmail } from './emailService';
import { getCurrentIP, checkAndRecordLogin, generateAndSaveOTP, verifyOTP, recordLogin } from './ipService';

const DB = '/db?XTransformPort=3001';

export interface MockUser {
  id: string | number;
  username: string;
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  is_staff: boolean;
  date_joined: string;
  provider?: 'local' | 'google' | 'facebook';
  provider_id?: string;
  photo?: string;
}

export interface MockProfile {
  id: string | number;
  user_id: string | number;
  is_seller: boolean;
  phone: string;
  address: string;
  wilaya: string;
  baladia: string;
  bio: string;
  photo: string | null;
  store_name: string;
  store_description: string;
  store_category: string;
  store_logo: string | null;
  commercial_register: string;
}

export interface ExtraProfileData {
  phone?: string;
  address?: string;
  wilaya?: string;
  baladia?: string;
  store_name?: string;
  store_description?: string;
  store_category?: string;
}

// توليد token وهمي
function makeToken(userId: string | number): string {
  return btoa(`user:${userId}:${Date.now()}`);
}

// جلب جميع المستخدمين
async function getUsers(): Promise<MockUser[]> {
  const res = await axios.get(`${DB}/users`);
  return res.data;
}

// ── جلب جميع ملفات مستخدم معيّن (مع تحويل النوع لتفادي اختلاف string/number) ──
async function getProfilesByUserId(userId: string | number): Promise<MockProfile[]> {
  const res = await axios.get(`${DB}/profiles`);
  const all: MockProfile[] = res.data;
  return all.filter((p) => String(p.user_id) === String(userId));
}

// ── جلب أو إنشاء الملف الشخصي (لا تكرار أبداً) ──
// forceIsSeller: إذا true يُحدِّث is_seller (للتسجيل فقط)، وإلا لا يلمسه
async function upsertProfile(
  userId: string | number,
  isSeller = false,
  photo: string | null = null,
  extra: ExtraProfileData = {},
  forceIsSeller = false
): Promise<MockProfile> {
  const existing = await getProfilesByUserId(userId);

  if (existing.length > 0) {
    // الملف موجود — حدّث الصورة والمعلومات الإضافية فقط
    // لا تغيّر is_seller إلا إذا طُلب صراحةً (forceIsSeller)
    const profile = existing[0];
    const patch: Record<string, unknown> = { ...extra };
    if (forceIsSeller) patch.is_seller = isSeller;
    if (photo && !profile.photo) patch.photo = photo;
    if (Object.keys(patch).length > 0) {
      const updated = await axios.patch(`${DB}/profiles/${profile.id}`, patch);
      return updated.data;
    }
    return profile;
  }

  // لم يجد — أنشئ ملفاً جديداً
  const newRes = await axios.post<MockProfile>(`${DB}/profiles`, {
    user_id: userId,
    is_seller: isSeller,
    phone: extra.phone ?? '',
    address: extra.address ?? '',
    wilaya: extra.wilaya ?? '',
    baladia: extra.baladia ?? '',
    bio: '',
    photo,
    store_name: extra.store_name ?? '',
    store_description: extra.store_description ?? '',
    store_category: extra.store_category ?? '',
    store_logo: null,
    commercial_register: '',
  });
  return newRes.data;
}

// ── تسجيل مستخدم جديد ──
export async function registerUser(data: {
  username: string;
  email: string;
  password: string;
  is_seller: boolean;
  phone?: string;
  address?: string;
  wilaya?: string;
  baladia?: string;
  store_name?: string;
  store_description?: string;
  store_category?: string;
}) {
  const users = await getUsers();

  if (users.find((u) => u.username === data.username)) {
    throw new Error('اسم المستخدم مستخدم بالفعل');
  }
  if (users.find((u) => u.email === data.email)) {
    throw new Error('البريد الإلكتروني مستخدم بالفعل');
  }

  const res = await axios.post<MockUser>(`${DB}/users`, {
    username: data.username,
    email: data.email,
    password: data.password,
    first_name: '',
    last_name: '',
    is_staff: false,
    date_joined: new Date().toISOString(),
    provider: 'local',
  });

  const newUser = res.data;

  await upsertProfile(newUser.id, data.is_seller, null, {
    phone: data.phone,
    address: data.address,
    wilaya: data.wilaya,
    baladia: data.baladia,
    store_name: data.store_name,
    store_description: data.store_description,
    store_category: data.store_category,
  }, true); // forceIsSeller=true عند التسجيل

  // إرسال بريد الترحيب
  sendWelcomeEmail(data.email, data.username).catch(() => { });

  return { success: true };
}

// ── تسجيل الدخول العادي ──
export async function loginUser(
  username: string,
  password: string
): Promise<
  | { token: string; user: ReturnType<typeof sanitizeUser>; requiresOtp: false }
  | { requiresOtp: true; pendingUserId: string; maskedEmail: string }
> {
  const users = await getUsers();

  const user = users.find(
    (u) =>
      (u.username === username || u.email === username) &&
      u.password === password
  );

  if (!user) {
    throw new Error('اسم المستخدم أو كلمة المرور غير صحيحة');
  }

  // تحقق من IP — إذا كان جديداً اطلب OTP
  try {
    const ip = await getCurrentIP();
    const { isNewIP } = await checkAndRecordLogin(String(user.id), ip);
    if (isNewIP) {
      const otp = await generateAndSaveOTP(String(user.id));
      sendOtpEmail(user.email, otp).catch(() => { });
      const masked = user.email.replace(/(.{2}).+(@.+)/, '$1***$2');
      return { requiresOtp: true, pendingUserId: String(user.id), maskedEmail: masked };
    }
  } catch { /* إذا فشل كشف IP، أكمل الدخول بدون OTP */ }

  const token = makeToken(user.id);
  localStorage.setItem('mock_user_id', String(user.id));
  return { token, user: sanitizeUser(user), requiresOtp: false };
}

// ── إكمال تسجيل الدخول بعد التحقق من OTP ──
export async function verifyLoginOtp(userId: string, code: string) {
  const valid = await verifyOTP(userId, code);
  if (!valid) throw new Error('رمز التحقق غير صحيح أو منتهي الصلاحية');

  const userRes = await axios.get(`${DB}/users/${userId}`);
  const user: MockUser = userRes.data;
  const token = makeToken(user.id);
  localStorage.setItem('mock_user_id', String(user.id));

  // تسجيل IP بعد نجاح OTP
  getCurrentIP().then((ip) => recordLogin(String(user.id), ip)).catch(() => { });

  // إرسال تنبيه أمني بالدخول من موقع جديد
  getCurrentIP().then((ip) => sendSecurityAlertEmail(user.email, ip)).catch(() => { });

  return { token, user: sanitizeUser(user) };
}



// ── تسجيل الدخول عبر Google ──
export async function loginWithGoogle(googleUser: {
  sub: string;
  email: string;
  name: string;
  picture: string;
  given_name?: string;
  family_name?: string;
}) {
  const users = await getUsers();

  let user = users.find(
    (u) =>
      (u.provider === 'google' && u.provider_id === googleUser.sub) ||
      u.email === googleUser.email
  );

  let isNewUser = false;

  if (!user) {
    isNewUser = true;
    const nameParts = googleUser.name?.split(' ') ?? [];
    const baseUsername = googleUser.email.split('@')[0];
    let username = baseUsername;
    let counter = 1;
    while (users.find((u) => u.username === username)) {
      username = `${baseUsername}${counter++}`;
    }

    const res = await axios.post<MockUser>(`${DB}/users`, {
      username,
      email: googleUser.email,
      password: '',
      first_name: googleUser.given_name || nameParts[0] || '',
      last_name: googleUser.family_name || nameParts.slice(1).join(' ') || '',
      is_staff: false,
      date_joined: new Date().toISOString(),
      provider: 'google',
      provider_id: googleUser.sub,
      photo: googleUser.picture,
    });

    user = res.data;
    await upsertProfile(user.id, false, googleUser.picture);
    sendWelcomeEmail(googleUser.email, username).catch(() => { });
  } else if (user.provider !== 'google') {
    await axios.patch(`${DB}/users/${user.id}`, {
      provider: 'google',
      provider_id: googleUser.sub,
      photo: googleUser.picture,
    });
  }

  const token = makeToken(user!.id);
  localStorage.setItem('mock_user_id', String(user!.id));

  getCurrentIP().then(async (ip) => {
    const { isNewIP } = await checkAndRecordLogin(String(user!.id), ip);
    if (isNewIP) sendSecurityAlertEmail(user!.email, ip).catch(() => { });
  }).catch(() => { });

  return { token, user: sanitizeUser(user!), isNewUser };
}

// ── تسجيل الدخول عبر Facebook ──
export async function loginWithFacebook(fbUser: {
  id: string;
  name: string;
  email: string;
  picture?: string;
}) {
  const users = await getUsers();

  let user = users.find(
    (u) =>
      (u.provider === 'facebook' && u.provider_id === fbUser.id) ||
      u.email === fbUser.email
  );

  let isNewUser = false;

  if (!user) {
    isNewUser = true;
    const nameParts = fbUser.name?.split(' ') ?? [];
    const baseUsername = fbUser.email.split('@')[0];
    let username = baseUsername;
    let counter = 1;
    while (users.find((u) => u.username === username)) {
      username = `${baseUsername}${counter++}`;
    }

    const res = await axios.post<MockUser>(`${DB}/users`, {
      username,
      email: fbUser.email,
      password: '',
      first_name: nameParts[0] || '',
      last_name: nameParts.slice(1).join(' ') || '',
      is_staff: false,
      date_joined: new Date().toISOString(),
      provider: 'facebook',
      provider_id: fbUser.id,
      photo: fbUser.picture,
    });

    user = res.data;
    await upsertProfile(user.id, false, fbUser.picture ?? null);
    sendWelcomeEmail(fbUser.email, username).catch(() => { });
  }

  const token = makeToken(user!.id);
  localStorage.setItem('mock_user_id', String(user!.id));

  getCurrentIP().then(async (ip) => {
    const { isNewIP } = await checkAndRecordLogin(String(user!.id), ip);
    if (isNewIP) sendSecurityAlertEmail(user!.email, ip).catch(() => { });
  }).catch(() => { });

  return { token, user: sanitizeUser(user!), isNewUser };
}

// ── جلب الملف الشخصي (مع تنظيف المكررات) ──
export async function getProfile(userId: string | number) {
  let profiles = await getProfilesByUserId(userId);

  if (!profiles.length) {
    const created = await upsertProfile(userId, false, null);
    const userRes = await axios.get(`${DB}/users/${userId}`);
    return { ...created, user: sanitizeUser(userRes.data) };
  }

  // إذا تعددت الملفات، احذف المكررات واحتفظ بالأفضل
  if (profiles.length > 1) {
    profiles.sort((a, b) => {
      const scoreA = (a.is_seller ? 4 : 0) + (a.phone ? 2 : 0) + (a.store_name ? 1 : 0);
      const scoreB = (b.is_seller ? 4 : 0) + (b.phone ? 2 : 0) + (b.store_name ? 1 : 0);
      return scoreB - scoreA;
    });

    for (let i = 1; i < profiles.length; i++) {
      try { await axios.delete(`${DB}/profiles/${profiles[i].id}`); } catch { /* تجاهل */ }
    }
  }

  const profile = profiles[0];
  const userRes = await axios.get(`${DB}/users/${userId}`);
  return { ...profile, user: sanitizeUser(userRes.data) };
}

// ── تحديث الملف الشخصي ──
export async function updateProfileInDB(profileId: string | number, data: Partial<MockProfile>) {
  const res = await axios.patch(`${DB}/profiles/${profileId}`, data);
  return res.data;
}

// ── تحديث نوع الحساب (تاجر/مشتري) ──
export async function updateUserSellerStatus(userId: string | number, isSeller: boolean) {
  const profiles = await getProfilesByUserId(userId);
  if (!profiles.length) throw new Error('Profile not found');
  const profile = profiles[0];
  const updated = await axios.patch(`${DB}/profiles/${profile.id}`, { is_seller: isSeller });
  return updated.data;
}

// ── إزالة كلمة المرور ──
function sanitizeUser(user: MockUser) {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { password: _pw, ...safe } = user;
  return safe;
}
