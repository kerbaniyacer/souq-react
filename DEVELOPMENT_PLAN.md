# خطة تطوير مشروع Souq React

> **تاريخ الإنشاء:** 2026-04-18
> **الحالة الراهنة:** مشروع تجارة إلكترونية كامل — React 18 + TypeScript + JSON Server (mock backend)
> **الهدف النهائي:** منصة جاهزة للإنتاج بـ backend حقيقي، أمان متين، واختبارات شاملة

---

## الأولويات العامة

| الأولوية | المحور | الأثر |
|----------|--------|-------|
| 🔴 عالية | الأمان (Auth) | حماية المستخدمين والبيانات |
| 🔴 عالية | Backend حقيقي | التخلص من JSON Server في الإنتاج |
| 🟠 متوسطة | جودة الكود | استقرار وقابلية الصيانة |
| 🟠 متوسطة | تجربة المستخدم | أداء وسرعة التحميل |
| 🟡 منخفضة | ميزات جديدة | توسيع المنصة |

---

## المرحلة الأولى — تقوية الأمان 🔴
**الجدول الزمني:** أسبوعان

### 1.1 إصلاح نظام المصادقة

- [ ] **استبدال `mockAuth.ts`** بـ JWT حقيقي
  - إصدار `access_token` (15 دقيقة) + `refresh_token` (7 أيام)
  - تخزين `refresh_token` في `httpOnly cookie` بدل `localStorage`
- [ ] **تشفير كلمات المرور** باستخدام `bcrypt` (cost factor 12)
- [ ] **إصلاح ثغرة التسجيل بـ Google** — فحص `email` الموجود قبل إنشاء مستخدم جديد (تجنب التكرار)
- [ ] **التحقق من الـ OTP** على جانب الخادم لا العميل
- [ ] **Rate limiting** على endpoints المصادقة (login, register, OTP)

### 1.2 تأمين المتغيرات الحساسة

- [ ] نقل بيانات Gmail SMTP إلى **OAuth2** بدل كلمة المرور
- [ ] إضافة `.env.example` بجميع المتغيرات المطلوبة (بدون قيم حقيقية)
- [ ] التأكد من وجود `.env` في `.gitignore`

### 1.3 حماية الـ API

- [ ] إضافة **CSRF protection** للـ mutations
- [ ] التحقق من صحة `is_seller` و `is_staff` على الخادم (لا الـ frontend فقط)
- [ ] تطبيق **input sanitization** على جميع مدخلات المستخدم

---

## المرحلة الثانية — Backend حقيقي 🔴
**الجدول الزمني:** 3–4 أسابيع

### 2.1 إعداد قاعدة البيانات

- [ ] تطبيق `database/schema.sql` على **PostgreSQL**
- [ ] إضافة **migrations system** (Flyway أو Alembic حسب الـ backend المختار)
- [ ] إنشاء **seed data** للبيئة التطويرية
- [ ] إضافة indexes للأعمدة المستخدمة في البحث (`name`, `category`, `brand`)

### 2.2 خيارات الـ Backend

> **موصى به:** Django REST Framework (يوجد بالفعل `XTransformPort=3000` في الكود)

- [ ] بناء API endpoints مطابقة للمحاكاة الحالية:
  - `POST /auth/login/` — JWT
  - `POST /auth/register/`
  - `GET/PATCH /auth/profile/`
  - `CRUD /api/products/`
  - `CRUD /api/orders/`
  - `GET /api/categories/` و `/api/brands/`
- [ ] توثيق الـ API بـ **Swagger / OpenAPI**
- [ ] إضافة **pagination** موحدة على جميع قوائم

### 2.3 رفع الصور

- [ ] استبدال **data URLs** بـ رفع حقيقي إلى:
  - **Cloudinary** (موصى به للبساطة) أو **AWS S3**
- [ ] تحديد حد أقصى للحجم (5MB) وأنواع الملفات المقبولة
- [ ] إضافة **image optimization** (WebP, lazy loading)

### 2.4 خادم البريد الإلكتروني

- [ ] الانتقال من `localhost:3002` إلى خدمة بريد مدارة (**SendGrid** أو **Resend**)
- [ ] إضافة **email queue** لتجنب التأخير المتزامن

---

## المرحلة الثالثة — جودة الكود 🟠
**الجدول الزمني:** أسبوعان

### 3.1 إضافة Data Fetching Layer

- [ ] تثبيت **TanStack Query (React Query) v5**
  ```bash
  npm install @tanstack/react-query
  ```
- [ ] تحويل جميع API calls في `api.ts` إلى `useQuery` / `useMutation`
- [ ] الاستفادة من **caching** التلقائي وإعادة المحاولة
- [ ] استبدال loading/error states اليدوية في الـ stores

### 3.2 Form Validation

- [ ] تثبيت **Zod** + **React Hook Form**
  ```bash
  npm install zod react-hook-form @hookform/resolvers
  ```
- [ ] إضافة schemas للنماذج:
  - تسجيل الدخول / التسجيل
  - إضافة / تعديل منتج (التاجر)
  - إتمام الطلب (checkout)
  - تحديث الملف الشخصي

### 3.3 TypeScript تحسينات

- [ ] إزالة جميع `// eslint-disable` وإصلاح المشاكل الحقيقية
- [ ] إضافة **strict null checks** حيث تنقصنا
- [ ] إنشاء `types/api.ts` مركزي لأنواع الاستجابة

### 3.4 توحيد إدارة الـ Cart

- [ ] اختيار مصدر واحد للحقيقة: Zustand **أو** localStorage (ليس الاثنان)
- [ ] مزامنة Cart مع الـ backend عند تسجيل الدخول
- [ ] حل تعارض الـ storage keys في `cartStore`

---

## المرحلة الرابعة — الأداء وتجربة المستخدم 🟠
**الجدول الزمني:** أسبوع

### 4.1 تحسين الأداء

- [ ] تطبيق **code splitting** لصفحات التاجر والإداري
  ```tsx
  const MerchantDashboard = React.lazy(() => import('./pages/merchant/Dashboard'));
  ```
- [ ] إضافة `React.memo` للمكونات الثقيلة (`ProductCard`, `OrderRow`)
- [ ] تطبيق **virtualization** على قوائم المنتجات الطويلة (`react-virtual`)
- [ ] إضافة **Skeleton loaders** بدل spinners بسيطة

### 4.2 تحسين SEO

- [ ] الانتقال من `HashRouter` إلى `BrowserRouter` (يتطلب server config)
- [ ] إضافة `<meta>` tags ديناميكية لصفحات المنتجات
- [ ] إضافة **sitemap.xml** و **robots.txt**

### 4.3 تحسين تجربة المستخدم

- [ ] إضافة **Optimistic UI** للسلة والمفضلة (تحديث فوري)
- [ ] إضافة **infinite scroll** أو pagination للمنتجات
- [ ] تحسين رسائل الخطأ لتكون واضحة وبالعربية
- [ ] إضافة **empty states** جميلة للقوائم الفارغة

---

## المرحلة الخامسة — الاختبارات 🟠
**الجدول الزمني:** أسبوعان

### 5.1 إعداد بيئة الاختبار

- [ ] تثبيت **Vitest** + **Testing Library**
  ```bash
  npm install -D vitest @testing-library/react @testing-library/user-event jsdom
  ```
- [ ] إعداد `vitest.config.ts` مع jsdom environment
- [ ] إضافة `setupTests.ts` للـ globals

### 5.2 اختبارات الوحدة (Unit Tests)

- [ ] اختبار Zustand stores: `authStore`, `cartStore`, `wishlistStore`
- [ ] اختبار utility functions في `api.ts`
- [ ] اختبار Zod schemas الجديدة

### 5.3 اختبارات المكونات (Component Tests)

- [ ] `ProductCard` — عرض البيانات، الإضافة للسلة
- [ ] `CartItem` — تغيير الكمية، الحذف
- [ ] `LoginForm` — validation، تسجيل الدخول الناجح والفاشل
- [ ] `PrivateRoute` / `MerchantRoute` — إعادة التوجيه

### 5.4 اختبارات التكامل (Integration Tests)

- [ ] تدفق الشراء الكامل: منتج → سلة → checkout → طلب
- [ ] تدفق التاجر: إضافة منتج → ظهور في المتجر

---

## المرحلة السادسة — CI/CD والنشر 🟡
**الجدول الزمني:** أسبوع

### 6.1 إعداد CI/CD

- [ ] إنشاء `.github/workflows/ci.yml`:
  ```yaml
  - TypeScript check (tsc --noEmit)
  - ESLint
  - Vitest
  - Build
  ```
- [ ] حظر merge إلى `main` إذا فشل أي step

### 6.2 إعداد البيئات

- [ ] `development` — JSON Server (الحالي)
- [ ] `staging` — backend حقيقي + قاعدة بيانات اختبار
- [ ] `production` — backend + قاعدة بيانات إنتاج

### 6.3 خيارات النشر

| الخدمة | المناسب لـ | التكلفة |
|--------|-----------|--------|
| **Vercel** | Frontend | مجاني |
| **Railway** | Backend + DB | مجاني للبداية |
| **Supabase** | PostgreSQL | مجاني للبداية |
| **Cloudinary** | الصور | مجاني (25GB) |

---

## المرحلة السابعة — ميزات جديدة 🟡
**الجدول الزمني:** حسب الأولوية

### 7.1 الدفع الإلكتروني

- [ ] دمج **Stripe** أو **PayMob** (للسوق العربي)
- [ ] دعم بطاقات Visa/Mastercard
- [ ] صفحة تأكيد الدفع الناجح/الفاشل

### 7.2 نظام الإشعارات

- [ ] إشعارات **in-app** (تحديث حالة الطلب)
- [ ] **Push notifications** (Service Worker)
- [ ] إشعارات بريد إلكتروني تلقائية للطلبات

### 7.3 تحليلات وإحصائيات

- [ ] لوحة تحكم التاجر: رسوم بيانية للمبيعات (Recharts)
- [ ] لوحة الإداري: مستخدمون جدد، أكثر المنتجات مبيعاً
- [ ] دمج **Google Analytics** أو **Plausible**

### 7.4 تحسينات المتجر

- [ ] **مقارنة المنتجات** (جانباً لجانب)
- [ ] **نظام كوبونات** الخصم
- [ ] **نقاط الولاء** للمشترين
- [ ] **متابعة التاجر** واشتراكات المتجر

---

## ملخص الجدول الزمني

```
الأسبوع 1-2  │ المرحلة 1 — الأمان (عالي الأولوية)
الأسبوع 3-6  │ المرحلة 2 — Backend حقيقي
الأسبوع 7-8  │ المرحلة 3 — جودة الكود
الأسبوع 9    │ المرحلة 4 — الأداء وتجربة المستخدم
الأسبوع 10-11│ المرحلة 5 — الاختبارات
الأسبوع 12   │ المرحلة 6 — CI/CD والنشر
الأسبوع 13+  │ المرحلة 7 — ميزات جديدة (تدريجي)
```

---

## مقاييس النجاح

| المقياس | الهدف |
|--------|-------|
| Lighthouse Performance | ≥ 90 |
| Lighthouse Accessibility | ≥ 95 |
| Test Coverage | ≥ 70% |
| TypeScript Errors | 0 |
| ESLint Warnings | 0 |
| Build Time | < 60 ثانية |
| First Contentful Paint | < 1.5 ثانية |

---

*آخر تحديث: 2026-04-18*
