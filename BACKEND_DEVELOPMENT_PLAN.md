# خطة تطوير Backend لمشروع Souq React

> **تاريخ الإنشاء:** 2026-04-18
> **المشروع:** Souq React
> **الترشيح المعتمد:** Django + Django REST Framework + PostgreSQL
> **هدف الخطة:** نقل المشروع من mock backend محلي إلى backend إنتاجي آمن، قابل للتوسع، ومناسب لمتجر متعدد الأدوار

---

## 1. الملخص التنفيذي

المشروع الحالي مبني على React/Vite ويعتمد في التطوير على:

- `json-server` كـ mock API
- `localStorage` في أجزاء مثل السلة والمفضلة وبعض حالة المصادقة
- خادم بريد محلي بـ `Express + Nodemailer`

هذا مناسب للتطوير الأولي، لكنه غير مناسب للإنتاج.  
الخطة التالية تهدف إلى بناء backend حقيقي يدعم:

- العملاء
- التجار
- الإدارة
- الطلبات والمخزون
- المصادقة والصلاحيات
- البريد والعمليات غير المتزامنة

---

## 2. الأهداف الرئيسية

- استبدال `mockAuth` و `json-server` بـ API حقيقي
- ربط المشروع بقاعدة بيانات `PostgreSQL`
- اعتماد `JWT` مع `refresh token` آمن
- نقل منطق السلة والمفضلة والطلبات إلى الخادم
- بناء صلاحيات واضحة للأدوار: عميل، تاجر، مدير
- دعم رفع الصور والملفات
- تحسين موثوقية البريد والإشعارات
- تجهيز المشروع للنشر على staging و production

---

## 3. المعمارية المقترحة

### Backend Stack

- `Django 5.2`
- `Django REST Framework`
- `PostgreSQL`
- `Redis`
- `Celery`
- `drf-spectacular` لتوثيق OpenAPI
- `django-allauth` أو تكامل OAuth مخصص حسب الحاجة
- `Cloudinary` أو `S3-compatible storage` للصور

### تقسيم التطبيقات داخل Django

- `apps.accounts`
- `apps.catalog`
- `apps.cart`
- `apps.orders`
- `apps.wishlist`
- `apps.reviews`
- `apps.notifications`
- `apps.dashboard` أو `apps.merchant`
- `apps.common`

---

## 4. مراحل التنفيذ

## المرحلة 1: تأسيس backend

**المدة المقترحة:** 3 إلى 5 أيام

### المطلوب

- إنشاء مشروع Django جديد
- إعداد `settings` للبيئات المختلفة:
  - `development`
  - `staging`
  - `production`
- ربط PostgreSQL
- إعداد `CORS`
- إعداد `REST_FRAMEWORK`
- إعداد `drf-spectacular`
- إنشاء بنية apps الأساسية
- إضافة `.env.example`

### المخرجات

- مشروع backend قابل للتشغيل محليًا
- health endpoint
- Swagger / OpenAPI docs
- إعدادات بيئات واضحة

---

## المرحلة 2: نمذجة البيانات والمهاجرات

**المدة المقترحة:** 4 إلى 6 أيام

### المطلوب

- تحويل مخطط [schema.sql](C:\Users\WIN 11\projects\souq-react\database\schema.sql) إلى Django models
- مراجعة الجداول الحالية وتحسينها قبل التثبيت النهائي
- إنشاء migrations رسمية
- إنشاء seed data للتطوير

### الجداول ذات الأولوية

- `users`
- `profiles`
- `categories`
- `brands`
- `products`
- `product_variants`
- `variant_images`
- `carts`
- `cart_items`
- `orders`
- `order_items`
- `wishlists`
- `reviews`
- `subscript_emails`

### قرارات مهمة في هذه المرحلة

- اعتماد custom user model من البداية
- تحديد هل `seller` role يكون داخل profile أو permissions/group
- توحيد naming بين schema والـ API
- ضبط indexes للبحث والفلاتر

### المخرجات

- models مستقرة
- migrations جاهزة
- قاعدة بيانات تطوير قابلة للاستخدام

---

## المرحلة 3: المصادقة والحسابات

**المدة المقترحة:** 5 إلى 7 أيام

### المطلوب

- بناء تسجيل حساب جديد
- تسجيل الدخول
- تسجيل الخروج
- profile endpoint
- تحديث الملف الشخصي
- تغيير كلمة المرور
- refresh token flow
- OTP login أو OTP verification على الخادم
- دعم social auth لاحقًا أو ضمن نفس المرحلة إذا كان ضروريًا

### التوصيات الأمنية

- `access token` قصير العمر
- `refresh token` داخل `httpOnly cookie`
- كلمات المرور باستخدام `bcrypt` أو الآلية المعيارية في Django
- rate limiting على:
  - login
  - register
  - forgot password
  - OTP

### endpoints المقترحة

- `POST /api/auth/register/`
- `POST /api/auth/login/`
- `POST /api/auth/refresh/`
- `POST /api/auth/logout/`
- `GET /api/auth/profile/`
- `PATCH /api/auth/profile/`
- `POST /api/auth/change-password/`
- `POST /api/auth/forgot-password/`
- `POST /api/auth/reset-password/`

### المخرجات

- نظام Auth حقيقي
- إزالة الاعتماد على `mockAuth`
- حماية endpoints الخاصة

---

## المرحلة 4: الكتالوج والمنتجات

**المدة المقترحة:** 5 إلى 8 أيام

### المطلوب

- API للأقسام
- API للعلامات التجارية
- API للمنتجات
- API لتفاصيل المنتج
- فلاتر:
  - category
  - brand
  - featured
  - search
  - ordering
- pagination موحدة

### للتاجر

- إنشاء منتج
- تعديل منتج
- حذف منتج
- إدارة variants
- إدارة الصور
- تقييد الوصول إلى منتجات التاجر نفسه

### endpoints المقترحة

- `GET /api/categories/`
- `GET /api/brands/`
- `GET /api/products/`
- `GET /api/products/{slug}/`
- `POST /api/merchant/products/`
- `PATCH /api/merchant/products/{id}/`
- `DELETE /api/merchant/products/{id}/`

### المخرجات

- استبدال `JSON Server` في المنتجات
- توافق واضح مع واجهة React الحالية

---

## المرحلة 5: السلة والمفضلة

**المدة المقترحة:** 4 إلى 6 أيام

### المطلوب

- نقل cart logic من `localStorage` إلى backend
- دعم guest cart عبر `session_key` أو cookie
- دمج سلة الزائر مع سلة المستخدم بعد تسجيل الدخول
- بناء wishlist حقيقية مرتبطة بالمستخدم

### endpoints المقترحة

- `GET /api/cart/`
- `POST /api/cart/items/`
- `PATCH /api/cart/items/{id}/`
- `DELETE /api/cart/items/{id}/`
- `POST /api/cart/merge/`
- `GET /api/wishlist/`
- `POST /api/wishlist/items/`
- `DELETE /api/wishlist/items/{product_id}/`

### ملاحظات تنفيذية

- يجب أن يكون backend هو مصدر الحقيقة الوحيد
- الـ frontend يحتفظ فقط بحالة العرض والكاش

### المخرجات

- cart و wishlist موثوقتان
- إزالة التشتت الحالي بين localStorage وواجهات API الشكلية

---

## المرحلة 6: الطلبات والدفع

**المدة المقترحة:** 6 إلى 10 أيام

### المطلوب

- إنشاء order من السلة
- حفظ snapshot لعناصر الطلب
- التحقق من المخزون قبل إنشاء الطلب
- خصم المخزون داخل transaction
- تحديث حالة الطلب
- إظهار الطلبات للعميل
- إظهار الطلبات الخاصة بالتاجر
- تتبع الطلب

### قواعد مهمة

- إنشاء الطلب يجب أن يكون داخل transaction atomically
- لا يتم خصم المخزون إلا بطريقة آمنة
- لا يسمح للتاجر برؤية إلا عناصره وطلباته ذات الصلة

### endpoints المقترحة

- `POST /api/orders/`
- `GET /api/orders/`
- `GET /api/orders/{id}/`
- `POST /api/orders/{id}/cancel/`
- `GET /api/orders/track/{order_number}/`
- `GET /api/merchant/orders/`
- `PATCH /api/merchant/orders/{id}/status/`

### الدفع

ابدأ أولًا بـ:

- `cash on delivery`

ثم أضف لاحقًا:

- `card`
- مزود دفع خارجي إذا توفرت المتطلبات التجارية

### المخرجات

- order pipeline حقيقي
- checkout موثوق
- دعم لوحات العميل والتاجر

---

## المرحلة 7: البريد والإشعارات

**المدة المقترحة:** 3 إلى 5 أيام

### المطلوب

- إيقاف الاعتماد على `email-server.cjs` للإنتاج
- اعتماد مزود بريد احترافي
- إرسال الرسائل بشكل غير متزامن عبر Celery

### الرسائل ذات الأولوية

- welcome email
- password reset
- password changed
- security alert
- merchant new order notification
- newsletter confirmation

### مزودات مقترحة

- `Resend`
- `SendGrid`

### المخرجات

- خدمة بريد موثوقة
- عدم تعطيل استجابة الـ API أثناء إرسال البريد

---

## المرحلة 8: لوحة الإدارة والتاجر

**المدة المقترحة:** 4 إلى 7 أيام

### المطلوب

- استخدام Django Admin للإدارة الداخلية
- تخصيص admin للمستخدمين والطلبات والمنتجات
- APIs مخصصة للوحة التاجر والإحصائيات

### وظائف لوحة التاجر

- عدد المنتجات
- عدد الطلبات
- الإيرادات
- آخر الطلبات
- حالة الطلبات

### المخرجات

- back office سريع للإدارة
- merchant dashboard مبني على بيانات حقيقية

---

## المرحلة 9: الأمان والجودة

**المدة المقترحة:** 4 إلى 6 أيام

### المطلوب

- permission classes واضحة
- object-level permissions
- sanitization للمدخلات
- throttling
- logging
- error handling موحد
- audit للأحداث الحساسة

### أمثلة على الصلاحيات

- العميل يدير ملفه وطلباته فقط
- التاجر يدير منتجاته وطلبات متجره فقط
- المدير يملك وصولًا أوسع وفق الدور

### المخرجات

- backend آمن وقابل للصيانة

---

## المرحلة 10: الاختبارات

**المدة المقترحة:** 5 إلى 8 أيام

### أنواع الاختبارات

- unit tests
- API tests
- permissions tests
- order flow tests
- cart merge tests
- auth tests

### أهم السيناريوهات

- تسجيل مستخدم جديد
- تسجيل الدخول والخروج
- إنشاء منتج كتاجر
- منع غير التاجر من إنشاء منتج
- إنشاء طلب ناجح
- رفض طلب عند عدم توفر المخزون
- دمج guest cart بعد login

### المخرجات

- تغطية معقولة للمسارات الحرجة
- تقليل regressions أثناء التطوير

---

## المرحلة 11: الدمج مع الواجهة الأمامية

**المدة المقترحة:** 4 إلى 7 أيام

### المطلوب

- استبدال endpoints الوهمية في [api.ts](C:\Users\WIN 11\projects\souq-react\src\souq\services\api.ts)
- إزالة الاعتماد على `localStorage` كمصدر بيانات أساسي
- توحيد أنواع الاستجابات
- إضافة error handling مناسب
- اعتماد React Query بشكل كامل إن لم يكتمل بعد

### نقاط مهمة

- ابدأ بتوافق API مع الواجهة الحالية لتقليل تكلفة التحويل
- بعدها حسّن بنية responses تدريجيًا

### المخرجات

- frontend مربوط بـ backend الحقيقي
- اختفاء الاعتماد على `json-server`

---

## المرحلة 12: النشر والتشغيل

**المدة المقترحة:** 3 إلى 5 أيام

### المطلوب

- إعداد Docker
- إعداد CI/CD
- نشر backend على:
  - Railway
  - Render
  - VPS
- نشر PostgreSQL على خدمة مناسبة
- إعداد media storage
- إعداد secrets management
- إعداد monitoring أساسي

### المخرجات

- بيئة staging
- بيئة production
- عملية نشر واضحة وقابلة للتكرار

---

## 5. ترتيب التنفيذ المقترح

1. تأسيس مشروع Django والإعدادات الأساسية
2. بناء models وmigrations
3. إنهاء auth والحسابات
4. بناء catalog والمنتجات
5. بناء cart وwishlist
6. بناء orders والcheckout الحقيقي
7. البريد والمهام الخلفية
8. dashboard وadmin
9. الأمان والاختبارات
10. ربط frontend بالكامل
11. staging ثم production

---

## 6. المخاطر المتوقعة

- تعارض بين بنية الـ frontend الحالية واستجابات API الجديدة
- استمرار منطق حرج داخل `localStorage` إن لم يتم تنظيفه بالكامل
- تعقيد صلاحيات التاجر والعميل إذا لم تُصمم مبكرًا
- مشاكل المخزون والطلبات إذا لم تُستخدم transactions بالشكل الصحيح
- تأخير الأداء إذا تم إرسال البريد أو المهام الثقيلة داخل request cycle

---

## 7. تعريف النجاح

يُعتبر المشروع انتقل إلى backend حقيقي عندما تتحقق الشروط التالية:

- لا يعتمد التطبيق على `json-server`
- لا يعتمد checkout على `localStorage`
- المصادقة حقيقية وآمنة
- المنتجات والطلبات والسلة تعمل من قاعدة بيانات PostgreSQL
- التاجر يرى بياناته فقط
- الإدارة تملك لوحة تشغيل فعلية
- البريد يعمل عبر مزود إنتاجي
- توجد اختبارات للمسارات الحرجة

---

## 8. النسخة الأولى القابلة للإطلاق MVP

إذا أردنا إطلاق نسخة أولى بسرعة، فالأولوية تكون:

- auth
- profile
- categories
- brands
- products
- cart
- checkout
- orders
- merchant products
- merchant orders
- password reset

ويمكن تأجيل:

- social auth
- analytics المتقدمة
- coupon system
- realtime notifications
- advanced dashboards

---

## 9. التوصية النهائية

أفضل مسار تطوير للمشروع هو:

- اعتماد `Django + DRF + PostgreSQL`
- تنفيذ backend على مراحل قصيرة
- إبقاء توافق API مع واجهة React الحالية في البداية
- إزالة كل منطق mock أو local-only تدريجيًا حتى يصبح الخادم هو المصدر الوحيد للحقيقة

هذا المسار يعطي المشروع:

- استقرارًا أعلى
- أمانًا أفضل
- سهولة إدارة داخلية
- قابلية نمو حقيقية مع توسع المتجر

