# تحليل حالة المشروع — النسخة الثانية
**تاريخ التحقق**: 2026-04-19  
**المرحلة الحالية**: بعد إنجاز ربط Frontend بـ Django (Auth + Catalog + Cart + Wishlist + Orders)

---

## ملخص تنفيذي

المشروع يعمل الآن بـ**معمارية مزدوجة جزئياً**: بعض الوظائف مربوطة بـ Django (Auth, Catalog, Cart, Wishlist, Orders) والبعض الآخر لا يزال يستعمل JSON Server (`/db`). الهدف من هذا الملف هو رصد ما أُنجز وما تبقى بدقة.

---

## 1. حالة Frontend

### ✅ مكتمل

| الملف | الوضع |
|---|---|
| `src/souq/services/authService.ts` | خدمة Auth كاملة (JWT + refresh interceptor) |
| `src/souq/stores/authStore.ts` | Zustand store يستعمل Django كلياً |
| `src/souq/services/api.ts` — `cartApi` | يستعمل `/api/cart/` |
| `src/souq/services/api.ts` — `ordersApi` | يستعمل `/api/orders/` |
| `src/souq/services/api.ts` — `wishlistApi` | يستعمل `/api/wishlist/` |
| `src/souq/services/api.ts` — `productsApi` | يستعمل `/api/products/` و `/api/merchant/products/` |
| `src/souq/services/api.ts` — `categoriesApi` | يستعمل `/api/categories/` |
| `src/souq/services/api.ts` — `brandsApi` | يستعمل `/api/brands/` |
| `src/souq/pages/auth/Login.tsx` | حقل email بدلاً من username، OTP محذوف |
| `src/souq/pages/auth/Register.tsx` | يمرر `password2` + `address` |
| `src/souq/lib/schemas.ts` — `loginSchema` | يطلب email صحيح |
| `vite.config.ts` | `/api` → `localhost:8000`، `/db` → `localhost:3001` |
| TypeScript `npx tsc --noEmit` | **صفر أخطاء** |

### ❌ لا يزال يستعمل JSON Server (`/db`)

#### أ) صفحات التاجر — كلها مكسورة

| الملف | المشكلة |
|---|---|
| `src/souq/pages/merchant/MerchantProducts.tsx` | يجلب من `/db/products` بدلاً من `/api/merchant/products/` |
| `src/souq/pages/merchant/MerchantProductForm.tsx` | يرفع الصور ويحفظ على JSON Server |
| `src/souq/pages/merchant/MerchantOrders.tsx` | يجلب الطلبات من `/db` |
| `src/souq/pages/merchant/MerchantDashboard.tsx` | يجلب الإحصائيات من `/db` |

**Django endpoints جاهزة ولم تُستعمل:**
```
GET  /api/merchant/products/
POST /api/merchant/products/
GET|PATCH|DELETE /api/merchant/products/{id}/
GET  /api/merchant/orders/
PATCH /api/merchant/orders/{id}/status/
```

#### ب) صفحة الملف الشخصي (Profile.tsx)

| المشكلة | التفاصيل |
|---|---|
| تغيير كلمة المرور | يجلب `/db/users/{userId}` ويقارن كلمة المرور نصياً (خطر أمني) |
| الـ endpoint الصحيح جاهز | `POST /api/auth/change-password/` موجود في Django |
| `postal_code` | `(profile as any).postal_code` — الحقل غير موجود في `Profile` type |

#### ج) التسجيل الاجتماعي (Social Auth)

| الملف | المشكلة |
|---|---|
| `src/souq/components/common/SocialAuthButtons.tsx` | يستورد `loginWithGoogle` و `loginWithFacebook` من `mockAuth.ts` |
| `src/souq/services/mockAuth.ts` | ينشئ مستخدمين في `/db/users` ويُعيد tokens مزيفة |

هذا يعني: المستخدم الذي يدخل عبر Google **لا يمكنه** استعمال أي endpoint محمي بـ Django JWT.

#### د) Reviews و Newsletter

```ts
// src/souq/services/api.ts
reviewsApi.list()       → /db/reviews        ❌ JSON Server
reviewsApi.create()     → /db/reviews        ❌ JSON Server
newsletterApi.subscribe() → /db/subscript_emails ❌ JSON Server
```

#### هـ) Admin Dashboard

| الملف | المشكلة |
|---|---|
| `src/souq/pages/admin/AdminDashboard.tsx` | يجلب `/db/users` و `/db/profiles` |
| `src/souq/pages/admin/AdminUserDetail.tsx` | نفس المشكلة |

لا يوجد أي Admin API في Django حالياً.

---

## 2. حالة Backend (Django)

### ✅ مكتمل ومُختبر (بنية)

| التطبيق | النماذج | الـ Serializers | الـ Views | الـ URLs |
|---|---|---|---|---|
| `accounts` | ✅ User, Profile, LoginHistory | ✅ كاملة | ✅ register, profile, change-password | ✅ |
| `catalog` | ✅ Category, Brand, Product, Variant, Image, Attribute | ✅ كاملة | ✅ public + merchant | ✅ |
| `cart` | ✅ Cart, CartItem | ✅ كاملة | ✅ get/add/update/remove/clear | ✅ |
| `orders` | ✅ Order, OrderItem | ✅ كاملة | ✅ list/create/cancel/track/merchant | ✅ |
| `wishlist` | ✅ WishlistItem | ✅ كاملة | ✅ list/add/remove | ✅ |
| `reviews` | ✅ Review (النموذج موجود) | ❌ | ❌ (ملف views فارغ) | ❌ (urlpatterns=[]) |

### ❌ ثغرات في Backend

#### أ) حقل `address` غير موجود في RegisterSerializer

**الملف**: `backend/apps/accounts/serializers.py`

المستخدم يُرسل `address` عند التسجيل لكن الـ serializer يتجاهله.

**الإصلاح**:
```python
# في RegisterSerializer fields:
address = serializers.CharField(required=False, allow_blank=True, default='')

# في create():
profile_data = {
    'phone': validated_data.pop('phone', ''),
    'wilaya': validated_data.pop('wilaya', ''),
    'baladia': validated_data.pop('baladia', ''),
    'address': validated_data.pop('address', ''),  # ← أضف هذا
    ...
}
```

#### ب) Reviews API فارغ تماماً

**الملف**: `backend/apps/reviews/urls.py`
```python
urlpatterns = []  # لا شيء!
```

**الملف**: `backend/apps/reviews/views.py`
```python
# Views will be built in Phase 4
```

النموذج موجود والتطبيق مسجّل في `config/urls.py`، لكن لا توجد أي endpoints.

#### ج) تسمية حقل تأكيد كلمة المرور — اختلاف

| الموقع | اسم الحقل |
|---|---|
| `schemas.ts` → `changePasswordSchema` | `confirm_password` |
| `authService.ts` → `changePasswordDjango()` | يُرسل `new_password2` إلى Django ✅ |
| Django `ChangePasswordSerializer` | `new_password2` ✅ |

**الوضع**: authService صحيح لكن Profile.tsx يستعمل `confirm_password` محلياً عند بناء كائن البيانات — يحتاج مراجعة.

#### د) `ProductDetailSerializer` — معلومات البائع منقوصة

```python
def get_seller(self, obj):
    return {
        'id': obj.seller.id,
        'username': obj.seller.username,
        'store_name': ...,
    }
```

Frontend يتوقع كائن `User` كامل، لكن هذا لا يُسبب أخطاء حالياً بسبب `as any` في الكود.

---

## 3. مخطط تكامل كامل (الوضع الحالي)

```
Frontend                          Backend (Django :8000)
────────                          ──────────────────────
Login / Register ──────────────► /api/auth/login|register  ✅
Profile update   ──────────────► /api/auth/profile          ✅
Products list    ──────────────► /api/products/             ✅
Product detail   ──────────────► /api/products/{slug}/      ✅
Categories       ──────────────► /api/categories/           ✅
Brands           ──────────────► /api/brands/               ✅
Cart             ──────────────► /api/cart/                 ✅
Orders           ──────────────► /api/orders/               ✅
Wishlist         ──────────────► /api/wishlist/             ✅

                                  JSON Server (:3001)
────────                          ───────────────────
Merchant Products ─────────────► /db/products               ❌
Merchant Orders   ─────────────► /db/orders                 ❌
Password change   ─────────────► /db/users/{id}             ❌
Social Auth       ─────────────► /db/users                  ❌
Reviews           ─────────────► /db/reviews                ❌
Newsletter        ─────────────► /db/subscript_emails       ❌
Admin             ─────────────► /db/users|profiles         ❌
```

---

## 4. الأولويات المتبقية

### أولوية 1 (حرجة) — صفحات التاجر
ربط MerchantProducts + MerchantProductForm + MerchantOrders بـ `/api/merchant/*` الموجودة في Django.

**الملفات المعنية**:
- `src/souq/pages/merchant/MerchantProducts.tsx`
- `src/souq/pages/merchant/MerchantProductForm.tsx`
- `src/souq/pages/merchant/MerchantOrders.tsx`
- `src/souq/pages/merchant/MerchantDashboard.tsx`

**ما هو جاهز في Django**: كل endpoints التاجر موجودة ومختبرة بنيوياً.

---

### أولوية 2 (حرجة) — تغيير كلمة المرور في Profile.tsx
استبدال المنطق الحالي (مقارنة نصية مع `/db`) بـ `authStore.changePassword()` الذي يستعمل Django.

**الملف**: `src/souq/pages/auth/Profile.tsx`

---

### أولوية 3 (متوسطة) — Reviews API في Django

**الملفات**:
1. `backend/apps/reviews/serializers.py` — إنشاء ReviewSerializer
2. `backend/apps/reviews/views.py` — تنفيذ list + create
3. `backend/apps/reviews/urls.py` — تسجيل endpoints
4. `src/souq/services/api.ts` — تحويل `reviewsApi` إلى `/api/`

---

### أولوية 4 (متوسطة) — إضافة `address` في RegisterSerializer

**الملف**: `backend/apps/accounts/serializers.py`  
سطر واحد في `fields` وسطر في `create()`.

---

### أولوية 5 (منخفضة) — Social Auth

الخيار المقترح: **تعطيل Social Auth مؤقتاً** (إخفاء الأزرار) حتى يُنفَّذ Django OAuth backend (يحتاج `django-allauth` أو `drf-social-oauth2`).

---

### أولوية 6 (منخفضة) — Admin Dashboard

إضافة endpoints في Django أو إنشاء تطبيق `apps/admin_panel/` منفصل.

---

### أولوية 7 (منخفضة) — Newsletter

إضافة نموذج `Subscriber` وـ endpoint `POST /api/newsletter/subscribe/` في Django.

---

## 5. إجراءات ما قبل الإنتاج (Checklist)

```
[ ] python manage.py createsuperuser
[ ] إضافة بيانات أولية: categories, brands (python manage.py loaddata أو script)
[ ] اختبار تسجيل مستخدم جديد end-to-end
[ ] اختبار إضافة منتج من صفحة التاجر
[ ] اختبار دورة الطلب الكاملة (cart → checkout → order)
[ ] DB_ENGINE=postgresql في .env للإنتاج
[ ] DEBUG=False في production
[ ] python manage.py collectstatic
[ ] تشغيل JSON Server مطلوب فقط لـ: reviews + newsletter (مؤقتاً)
```

---

## 6. ملخص نقاط التحقق

| المحور | الحالة | التفاصيل |
|---|---|---|
| Auth (JWT) | ✅ مكتمل | Login, Register, Profile, Logout |
| Catalog API | ✅ مكتمل | Products, Categories, Brands |
| Cart API | ✅ مكتمل | Add, Remove, Update, Clear |
| Orders API | ✅ مكتمل | Create, Cancel, Track, Merchant |
| Wishlist API | ✅ مكتمل | Add, Remove, List |
| TypeScript | ✅ نظيف | 0 أخطاء |
| Merchant Pages | ❌ معطل | لا يزال يستعمل JSON Server |
| Password Change | ❌ معطل | يستعمل `/db` بمقارنة نصية |
| Reviews API | ❌ غير منفذ | Backend فارغ + Frontend على `/db` |
| Social Auth | ❌ معطل | mockAuth غير متوافق مع Django JWT |
| Admin Dashboard | ❌ غير منفذ | لا يوجد API في Django |
| Newsletter | ⚠️ مؤقت | JSON Server فقط |
| `address` في Register | ⚠️ ناقص | لا يُحفظ في Django |
