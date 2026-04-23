# خطة إصلاح مشاكل مشروع Souq

**تاريخ الخطة:** 23 أبريل 2026  
**المشاكل المستهدفة:** 11 مشكلة مؤكدة (5 حرجة Backend + 6 حرجة Frontend + 1 عالية Backend)

---

## المرحلة الأولى — إصلاحات الواجهة الخلفية الحرجة

### ✅ C4-BE — المستخدمون المحظورون يجددون رموزهم بلا نهاية
**الملف:** `backend/apps/accounts/views.py` السطر 276  
**المشكلة:** `CustomTokenRefreshView` لا تتحقق من حالة المستخدم قبل إصدار رمز جديد.  
**الإصلاح:** جلب المستخدم من قاعدة البيانات بعد التحقق من الرمز، ورفض الطلب إذا كان محظوراً.

---

### ✅ C5-BE — إلغاء الطلب لا يُعيد المخزون
**الملف:** `backend/apps/orders/views.py` السطر 63  
**المشكلة:** `order_cancel` تغيّر الحالة فقط دون استعادة `stock` لكل `variant`.  
**الإصلاح:** داخل `transaction.atomic()` — التكرار على عناصر الطلب وزيادة المخزون لكل عنصر.

---

### ✅ H1-BE — التحقق من OTP بدون تقييد المحاولات
**الملف:** `backend/apps/accounts/views.py` السطر 471  
**المشكلة:** `verify_ip_login` لا تعدّ المحاولات الفاشلة — المساحة 900,000 قابلة للاختراق.  
**الإصلاح:** إضافة `throttle_classes` مخصصة + عداد محاولات في `OTPVerification` مع قفل تلقائي.

---

### ✅ C2-BE — حالة سباق في إنشاء الطلبات
**الملف:** `backend/apps/orders/views.py` السطر 168  
**المشكلة:** فحص المخزون بدون `select_for_update()` — طلبان متزامنان يتجاوزان المخزون.  
**الإصلاح:** استخدام `select_for_update()` عند جلب `ProductVariant` داخل `transaction.atomic()`.

---

### ✅ C3-BE — حالة سباق في السلة
**الملف:** `backend/apps/cart/views.py` السطر 37  
**المشكلة:** `cart_add` تفحص المخزون خارج transaction — طلبان متزامنان يتجاوزان الكمية.  
**الإصلاح:** تغليف العملية بـ `transaction.atomic()` مع `select_for_update()`.

---

### ✅ C1-BE — تسجيل الدخول الاجتماعي بدون التحقق من رمز OAuth
**الملفات:** `backend/apps/accounts/views.py:358` + `src/shared/components/common/SocialAuthButtons.tsx`  
**المشكلة:** الخادم يقبل `email + provider_id` دون التحقق من الرمز مع Google/Facebook.  
**الإصلاح:**
- Frontend: إرسال `access_token` (Google) أو `access_token` (Facebook) مع الطلب
- Backend: التحقق من الرمز مع Google API / Facebook Graph API قبل إنشاء الجلسة

---

## المرحلة الثانية — إصلاحات الواجهة الأمامية الحرجة

### ✅ C1-FE + C2-FE — isAuthenticated و accessToken في localStorage
**الملف:** `src/features/auth/stores/authStore.ts` السطر 225  
**المشكلة:** Zustand `persist` يحفظ `isAuthenticated` و `accessToken` في localStorage.  
**الإصلاح:** إزالة `isAuthenticated` و `accessToken` من `partialize` — الـ `user` و `profile` كافيان.  
**ملاحظة:** `isAuthenticated` يُستنتج من وجود جلسة صالحة، وليس من قيمة محفوظة.

---

### ✅ C3-FE — isRefreshing خارج finally
**الملف:** `src/features/auth/services/authService.ts` السطر 82  
**المشكلة:** `isRefreshing = false` في try/catch — استثناء غير متوقع يُجمّد الحالة إلى الأبد.  
**الإصلاح:** نقل `isRefreshing = false` إلى كتلة `finally`.

---

### ✅ C4-FE — window.location.href يمحو حالة React
**الملف:** `src/features/auth/services/authService.ts` السطر 97  
**المشكلة:** `window.location.href = '/login'` يُعيد تحميل الصفحة كاملاً — يُلغي الطلبات المعلقة.  
**الإصلاح:** حذف هذا السطر — `PrivateRoute` في `App.tsx` يتولى التحويل تلقائياً عند `isAuthenticated = false`.

---

### ✅ C5-FE — مسار /registration-success مكرر
**الملف:** `src/App.tsx` السطر 176 و 215  
**المشكلة:** مساران على نفس المسار — العام يُطابَق دائماً قبل المحمي.  
**الإصلاح:** حذف المسار العام (سطر 176) والإبقاء على المحمي فقط.

---

### ✅ C6-FE — حساب الشحن لا يتطابق مع الخادم
**الملفات:** `src/features/cart/pages/Cart.tsx:136` + `src/features/cart/pages/Checkout.tsx:69`  
**المشكلة:** Frontend يستخدم `> 5000` بينما Backend يستخدم `>= 5000` — فجوة عند 5000 دج تماماً.  
**الإصلاح:** تغيير `subtotal > 5000` إلى `subtotal >= 5000` في الملفين.

---

## ترتيب التنفيذ وحالة الإنجاز

```
المرحلة 1 (Backend): ✅ مكتملة
  ✅ 1. C4-BE  → CustomTokenRefreshView + user status check
  ✅ 2. C5-BE  → order_cancel + stock restoration
  ✅ 3. H1-BE  → OTP rate limiting (cache-based, 5 attempts/hour)
  ✅ 4. C2-BE  → order_create + select_for_update
  ✅ 5. C3-BE  → cart_add + select_for_update + transaction.atomic
  ✅ 6. C1-BE  → social_login + OAuth token verification (Google + Facebook)

المرحلة 2 (Frontend): ✅ مكتملة
  ✅ 7. C6-FE  → shipping: > 5000 → >= 5000 (Cart.tsx + Checkout.tsx)
  ✅ 8. C5-FE  → duplicate /registration-success route removed
  ✅ 9. C4-FE  → window.location.href removed → PrivateRoute handles redirect
  ✅ 10. C3-FE → isRefreshing moved to finally block
  ✅ 11. C1+C2-FE → isAuthenticated + accessToken removed from localStorage persist
                    setAccessToken now derives isAuthenticated from token !== null
                    PrivateRoute awaits authReady before redirecting
```

---

## ملاحظات التنفيذ

- جميع تغييرات Backend تتم داخل `transaction.atomic()` حيث أمكن
- لا تتطلب الإصلاحات تغيير schema قاعدة البيانات (لا migrations جديدة)
- إصلاح C1-BE يستلزم تغييرات في Frontend وBackend معاً
- إصلاح C1-FE+C2-FE قد يتطلب ضبط منطق `PrivateRoute` ليعمل مع الـ user بدلاً من isAuthenticated
