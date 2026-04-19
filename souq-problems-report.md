# تقرير شامل بمشاكل مشروع سوق (Souq)

> تاريخ التحليل: 2026-04-19
> الإصدار: استراد حديث من GitHub (kerbaniyacer/souq-react)

---

## ملخص تنفيذي

اكتشف هذا التحليل **25 مشكلة** مقسمة إلى **6 فئات رئيسية**. المشكلة الأكثر تأثيراً هي أن **كل طلبات البيانات (API) تتوجه إلى خادم Django غير موجود**، بينما البيانات الفعلية متوفرة فقط عبر json-server. هذا يعني أن التطبيق لا يستطيع جلب أي بيانات (منتجات، أقسام، طلبات، سلة، مفضلة) ويعرض صفحات فارغة أو أخطاء.

---

## الفئة A: مشاكل الاتصال بالخادم (Critical - حرجة)

### المشكلة A1: baseURL يشير إلى Django غير موجود
- **الملف:** `src/souq/services/api.ts` (سطر 6)
- **التفاصيل:** `const api = axios.create({ baseURL: '/api' });`
- **المشكلة:** الـ `/api` تم توجيهه عبر Vite proxy إلى `http://localhost:8000` (خادم Django)، لكن هذا الخادم غير متاح حالياً. كل طلبات المنتجات والأقسام والعلامات التجارية تفشل بـ `Network Error`.
- **التأثير:** لا يمكن جلب أي منتج أو قسم أو علامة تجارية. الصفحة الرئيسية فارغة.

### المشكلة A2: authService يتحدث مع Django غير موجود
- **الملف:** `src/souq/services/authService.ts` (سطر 6)
- **التفاصيل:** `const api = axios.create({ baseURL: '/api' });`
- **المشكلة:** جميع عمليات المصادقة (تسجيل دخول، تسجيل، ملف شخصي، تغيير كلمة مرور) تتوجه إلى Django. حتى عملية تحديث الرمز (JWT refresh) تفشل.
- **التأثير:** تسجيل الدخول والتسجيل لا يعملان. لا يمكن جلب الملف الشخصي.

### المشكلة A3: نقاط نهاية التاجر غير مدعومة من json-server
- **الملف:** `src/souq/services/api.ts` (سطر 38-64)
- **التفاصيل:** المسارات التالية غير موجودة في json-server:
  - `POST /merchant/products/` (إنشاء منتج)
  - `PATCH /merchant/products/:id/` (تحديث منتج)
  - `DELETE /merchant/products/:id/` (حذف منتج)
  - `GET /merchant/products/` (جلب منتجات التاجر)
- **الحل المطلوب:** تحويل هذه إلى استعلامات على `/products` مع فلترة مثل `?seller_id=X`.

### المشكلة A4: هيكل الاستجابة غير متوافق
- **الملف:** `src/souq/services/api.ts` + عدة صفحات
- **التفاصيل:** الكود يتوقع أحياناً استجابة Django المُصفحَة:
  ```json
  { "count": 50, "next": "...", "results": [...] }
  ```
  بينما json-server يُرجع مصفوفة مباشرة: `[...]`
- **الملفات المتأثرة:**
  - `api.ts` سطر 53: `res.data.results ?? res.data` (featured)
  - `api.ts` سطر 58: `res.data.results ?? res.data` (myProducts)
  - `Home.tsx` سطر 155-158: أربعة استدعاءات تستخدم `.results`
  - `Orders.tsx` سطر 23: `res.data.results ?? res.data`
  - `Products.tsx` سطر 35-36: `data.results`
  - `ProductDetail.tsx` سطر 43: `rRes?.data?.results`
- **ملاحظة:** بعض الأماكن تستخدم `?? res.data` كحل احتياطي، لكنه غير متسق عبر كل الملفات.

### المشكلة A5: جلب المنتج بالـ slug غير مدعوم من json-server
- **الملف:** `src/souq/services/api.ts` (سطر 33)
- **التفاصيل:** `api.get('/products/${slug}/')` — json-server يبحث بالمعرف (ID) وليس بالـ slug.
- **الحل المطلوب:** استخدام `GET /products?slug=X` أو جلب الكل وفلترة محلياً.

### المشكلة A6: نقاط نهاية السلة تتحدث مع Django
- **الملف:** `src/souq/services/api.ts` (سطر 92-110)
- **التفاصيل:** كل عمليات السلة تستخدم `/api/cart/`:
  - `GET /cart/` (جلب السلة)
  - `POST /cart/items/` (إضافة عنصر)
  - `PATCH /cart/items/:id/` (تحديث كمية)
  - `DELETE /cart/items/:id/delete/` (حذف عنصر)
  - `DELETE /cart/clear/` (تفريغ السلة)
- **التأثير:** زر "أضف إلى السلة" لا يعمل.

### المشكلة A7: نقاط نهاية المفضلة تتحدث مع Django
- **الملف:** `src/souq/services/api.ts` (سطر 128-143)
- **التفاصيل:** عمليات المفضلة تستخدم `/api/wishlist/` و `/api/wishlist/items/`.
- **التأثير:** زر المفضلة (القلب) لا يعمل بشكل صحيح.

### المشكلة A8: نقاط نهاية الطلبات تتحدث مع Django
- **الملف:** `src/souq/services/api.ts` (سطر 113-125)
- **التفاصيل:** جميع عمليات الطلبات تستخدم `/api/orders/`:
  - إنشاء طلب، عرض الطلبات، تفاصيل طلب، إلغاء طلب
  - نقاط التاجر: `/merchant/orders/`
  - تتبع الطلب: `/orders/track/:number/`
- **التأثير:** صفحة الطلبات فارغة، لا يمكن إنشاء طلب جديد.

### المشكلة A9: المصادقة عبر JWT لا تعمل مع json-server
- **الملف:** `src/souq/services/authService.ts`
- **التفاصيل:** json-server لا يتحقق من رموز JWT ولا يدعم نظام المصادقة. الـ interceptor يرسل `Bearer` token لا أحد يقرؤه.
- **التأثير:** حماية البيانات غائبة. أي مستخدم يمكنه الوصول لكل البيانات.

### المشكلة A10: next.config.ts يفتقر لـ rewrite لـ /api
- **الملف:** `next.config.ts`
- **التفاصيل:** يوجد rewrite فقط لـ `/db` → `localhost:3100`، لكن لا يوجد rewrite لـ `/api` أو `/email-api`.
- **التأثير:** في بيئة Next.js، حتى لو أردنا استخدام Django لاحقاً، لن تعمل الطلبات.

---

## الفئة B: مشاكل قاعدة البيانات (db.json)

### المشكلة B1: 3 ملفات شخصية معلقة (Orphan Profiles)
- **التفاصيل:** الملفات الشخصية التالية تشير إلى user_ids غير موجودة:
  - `Profile id=W78NI41ZsfU` ← user_id=`ISXQmcH2Mno` (غير موجود)
  - `Profile id=W6H_e8Ge8fg` ← user_id=`_fd3aIQYRaw` (غير موجود)
  - `Profile id=BbrP2nsmavU` ← user_id=`OoqYM1-jqIo` (غير موجود)
- **السبب:** تسجيل دخول عبر Google سابق أنشأ ملفات شخصية، لكن المستخدمين لحظوا لاحقاً بأسماء مختلفة.
- **التأثير:** بيانات غير صالحة تستهلك مساحة وتسبب أخطاء عند الربط.

### المشكلة B2: طلبان بدون عناصر (Orders without Items)
- **التفاصيل:**
  - `Order id=qMNb6OR-w30` — لا يوجد أي order_items مرتبط
  - `Order id=5w6HaAoONYo` — لا يوجد أي order_items مرتبط
- **التأثير:** عرض طلبات فارغة في صفحة الطلبات وتفاصيل الطلب.

### المشكلة B3: 4 منتجات بدون صورة رئيسية
- **التفاصيل:**
  - "طقم أواني مطبخ 10 قطع" (id=9) — main_image=null
  - "كتاب تعلم البرمجة بالعربية" (id=10) — main_image=null
  - "مكنسة روبوتية ذكية" (id=11) — main_image=null
  - "حقيبة جلدية رجالية" (id=12) — main_image=null
- **التأثير:** بطاقات المنتجات تظهر بدون صورة أو تعرض أيقونة بديلة.

### المشكلة B4: صور Base64 تضخم ملف قاعدة البيانات
- **التفاصيل:** حجم البيانات المشفرة بـ Base64 داخل db.json يبلغ **~1,259 KB** (1.26 ميجابايت).
- **السبب:** صورتان فقط مشفرتان داخل متغيرات المنتجات (variant images) بالكامل كـ Base64 AVIF.
- **التأثير:** يبطئ تحميل json-server ويزيد استهلاك الذاكرة. كل إعادة تشغيل يقرأ 1.2MB بيانات无用.

### المشكلة B5: تناقض حقل القسم الأب (Category Parent)
- **التفاصيل:** في جدول categories، بعض الأقسام لها `parent_id` محدد لكن حقل `parent` فارغ (null):
  - "هواتف ذكية": parent_id=6, parent=null
  - "ساعات ذكية": parent_id=1, parent=null
  - "تصوير": parent_id=1, parent=null
  - "أحذية رياضية": parent_id=4, parent=null
  - "نظارات شمسية": parent_id=9, parent=null
- **التأثير المباشر:** `Home.tsx` سطر 173 يفلتر الأقسام بـ `!c.parent`:
  ```tsx
  .filter((c) => !c.parent_id)  // هذا يعمل
  ```
  الكود يستخدم `parent_id` فعلياً لذا يعمل، لكن الأقسام الفرعية لن تظهر في الشبكة الرئيسية وهذا قد يكون مقصوداً. لكن حقل `parent` المفقود قد يسبب مشاكل في مكونات أخرى تتوقع وجوده.

### المشكلة B6: جداول فارغة لا تُستخدم
- **التفاصيل:** الجداول التالية فارغة تماماً:
  - `cart_items`: 0 سجلات
  - `carts`: 0 سجلات
  - `reviews`: 0 سجلات
  - `subscript_emails`: 0 سجلات
  - `otps`: 0 سجلات
- **التأثير:** لا توجد بيانات تجريبية للسلة والتقييمات والاشتراكات.

---

## الفئة C: مشاكل التوافق مع Next.js

### المشكلة C1: استخدام import.meta.env (5 ملفات)
- **التفاصيل:** `import.meta.env` خاص بـ Vite ولا يعمل في Next.js.
- **الملفات المتأثرة:**
  - `src/souq/main.tsx` (سطر 17): `import.meta.env.VITE_GOOGLE_CLIENT_ID`
  - `src/souq/services/ipService.ts` (سطر 120): `import.meta.env.DEV`
  - `src/souq/hooks/useFacebookSDK.ts` (سطر 34): `import.meta.env.VITE_FACEBOOK_APP_ID`
  - `src/souq/components/common/SocialAuthButtons.tsx` (سطر 83, 96): `import.meta.env.VITE_GOOGLE_CLIENT_ID` و `VITE_FACEBOOK_APP_ID`
- **الحل:** استبدال بـ `process.env.NEXT_PUBLIC_*` و `process.env.NODE_ENV !== 'production'`.

### المشكلة C2: HashRouter ضروري لـ Next.js
- **التفاصيل:** BrowserRouter لا يعمل بشكل صحيح داخل Next.js لأن Next.js يسيطر على التوجيه من جانب الخادم.
- **الحل:** استخدام HashRouter من `react-router-dom`.

---

## الفئة D: مشاكل التصميم والبنية (schema.sql / seed.sql)

### المشكلة D1: تناقض بين seed.sql و db.json
- **التفاصيل:**
  - `seed.sql` ينشئ أقساماً مختلفة: `clothing`, `phones` (بينما db.json يستخدم: `mens-fashion`, `smartphones`)
  - `seed.sql` ينشئ منتجات مختلفة (سامسونج S24, خلاط كهربائي) بينما db.json يحتوي 13 منتج مختلفة
  - `seed.sql` ينشئ علامات تجارية مختلفة (هواوي) غير موجودة في db.json
- **التأثير:** تشوش للمطور عند محاولة إعادة بناء قاعدة البيانات.

### المشكلة D2: جداول في schema.sql غير موجودة في db.json
- **التفاصيل:** الجداول التالية في `schema.sql` ليس لها ما يقابلها في `db.json`:
  - `user_ips` — سجلات عناوين IP
  - `product_videos` — فيديوهات المنتجات
  - `variant_image_variants` — جدول وسيط صور-نسخ
  - `wishlist_items` — عناصر المفضلة (db.json يستخدم wishlists فقط)
- **التأثير:** عدم توافق بين المخطط والبيانات الفعلية.

### المشكلة D3: schema.sql يحدد parent_id لكن db.json يستخدم parent_id بشكل مختلف
- **التفاصيل:** في `schema.sql`، الحقل هو `parent_id INTEGER REFERENCES categories(id)`. في `db.json` بعض الأقسام تستخدم `parent_id` كـ string وبعضها لا تحتوي على حقل `parent` كائن مرتبط.

---

## الفئة E: مشاكل الأمان والبيانات

### المشكلة E1: كلمات مرور مخزنة كنص عادي
- **الملف:** `database/db.json`
- **التفاصيل:** كلمات مرور المستخدمين مخزنة كنص عادي:
  - admin: `admin1234`
  - seller1: `seller1234`
  - customer1: `customer1234`
  - kerbaniyacer: `Kerbani127854369@`
- **التأثير:** في حالة تسريب db.json، تُكشف كلمات المرور.
- **ملاحظة:** هذا مقبول في بيئة تطوير مع json-server لكن يجب توثيقه.

### المشكلة E2: عدم وجود تحقق من صلاحيات المستخدم
- **التفاصيل:** لا يوجد تحقق من أن المستخدم هو صاحب المنتج قبل تعديله أو حذفه. json-server يسمح لأي شخص بتعديل أي سجل.

### المشكلة E3: لا يوجد تحقق من المخزون عند الإضافة للسلة
- **التفاصيل:** نظام السلة الحالي (إن وجد Django) يتضمن منطق خصم المخزون. json-server لا يدعم هذا المنطق. يمكن إضافة منتج بنسبة مخزون صفر.

---

## الفئة F: مشاكل في الكود والمنطق

### المشكلة F1: merchant products لا يفلتر حسب المستخدم الحالي
- **الملف:** `src/souq/services/api.ts` (سطر 57)
- **التفاصيل:** `productsApi.myProducts()` يرسل `GET /merchant/products/` ويتوقع من الخادم إرجاع منتجات المستخدم فقط (بناءً على التوكن). json-server لا يدعم هذا.
- **الحل المطلوب:** استخدام `GET /products?seller_id=X` بعد الحصول على user_id من المصادقة.

### المشكلة F2: نقطة تتبع الطلب غير مدعومة
- **الملف:** `src/souq/services/api.ts` (سطر 118)
- **التفاصيل:** `GET /orders/track/:orderNumber/` غير موجودة في json-server.
- **الحل المطلوب:** `GET /orders?order_number=X`.

### المشكلة F3: wishlists في db.json تستخدم product_id لكن الكود يتوقع كائن product كامل
- **الملف:** `src/souq/stores/wishlistStore.ts` (سطر 41)
- **التفاصيل:** `isInWishlist` يتحقق بـ `w.product?.id === productId`. لكن wishlists في db.json تحتوي على `product_id` فقط وليس كائن `product` كامل.
- **التأثير:** دالة `isInWishlist` قد لا تعمل بشكل صحيح لأن `w.product` قد يكون undefined.

### المشكلة F4: orders في db.json تستخدم رقم تعريف عشوائي بدلاً من order_number
- **التفاصيل:** order_number غير موجود في طلبات db.json. الكود في `ordersApi.track()` يبحث بـ order_number.

---

## خريطة المشاكل حسب الأولوية

| الأولوية | الفئة | عدد المشاكل | الوصف |
|----------|--------|-------------|-------|
| P0 (حرج) | A | 10 | الاتصال بالخادم — التطبيق لا يعمل |
| P1 (عالي) | B | 6 | بيانات قاعدة البيانات التالفة |
| P2 (متوسط) | C | 2 | توافق Next.js |
| P3 (منخفض) | D | 3 | توافق المخطط مع البيانات |
| P3 (منخفض) | E | 3 | أمان البيانات |
| P2 (متوسط) | F | 4 | منطق الكود |

---

## خطة الإصلاح المقترحة

### المرحلة 1: إصلاح الاتصال بالخادم (P0)
1. تحويل `api.ts` بالكامل لاستخدام `/db` بدلاً من `/api`
2. تحويل `authService.ts` لاستخدام `/db` مع مصادقة بسيطة
3. إعادة كتابة `cartApi` و `wishlistApi` و `ordersApi` للعمل مع json-server
4. تحويل مسارات التاجر من `/merchant/products/` إلى استعلامات json-server
5. توحيد هيكل الاستجابة (إزالة الاعتماد على `.results`)

### المرحلة 2: إصلاح قاعدة البيانات (P1)
1. حذف الملفات الشخصية المعلقة (3 orphan profiles)
2. حذف الطلبات بدون عناصر أو إضافة عناصر تجريبية
3. إضافة صور رئيسية للمنتجات الـ 4 (أو رفع صور حقيقية)
4. استبدال صور Base64 بروابط أو حذفها
5. إصلاح حقول الأقسام الفرعية (إضافة حقل `parent`)
6. إضافة بيانات تجريبية للسلة والتقييمات

### المرحلة 3: توافق Next.js (P2)
1. استبدال `import.meta.env` بـ `process.env` في 5 ملفات
2. التأكد من استخدام HashRouter

### المرحلة 4: إصلاح المنطق (P2)
1. إصلاح `isInWishlist` للعمل مع `product_id`
2. إصلاح تتبع الطلب للعمل مع `order_number`
3. إضافة فلترة منتجات التاجر حسب `seller_id`
4. إضافة تحقق بسيط من المخزون

---

## الملفات التي تحتاج تعديل

| الملف | نوع التعديل | الأولوية |
|-------|-------------|----------|
| `src/souq/services/api.ts` | إعادة كتابة كاملة | P0 |
| `src/souq/services/authService.ts` | إعادة كتابة كاملة | P0 |
| `src/souq/stores/cartStore.ts` | تعديل منطق السلة | P0 |
| `src/souq/stores/wishlistStore.ts` | إصلاح isInWishlist | P0 |
| `src/souq/stores/authStore.ts` | توافق مع authService الجديد | P0 |
| `src/souq/pages/Home.tsx` | إزالة `.results`، إصلاح الفلترة | P0 |
| `src/souq/pages/Products.tsx` | إزالة `.results` | P0 |
| `src/souq/pages/Orders.tsx` | إصلاح جلب الطلبات | P0 |
| `src/souq/pages/ProductDetail.tsx` | إصلاح جلب التقييمات | P0 |
| `src/souq/pages/merchant/MerchantProducts.tsx` | إصلاح فلترة التاجر | P1 |
| `src/souq/pages/Checkout.tsx` | إصلاح إنشاء الطلب | P1 |
| `src/souq/pages/TrackOrder.tsx` | إصلاح التتبع | P1 |
| `src/souq/pages/merchant/MerchantOrders.tsx` | إصلاح جلب طلبات التاجر | P1 |
| `src/souq/pages/merchant/MerchantDashboard.tsx` | إصلاح الإحصائيات | P1 |
| `src/souq/main.tsx` | استبدال import.meta.env | P2 |
| `src/souq/services/ipService.ts` | استبدال import.meta.env | P2 |
| `src/souq/hooks/useFacebookSDK.ts` | استبدال import.meta.env | P2 |
| `src/souq/components/common/SocialAuthButtons.tsx` | استبدال import.meta.env | P2 |
| `database/db.json` | تنظيف البيانات | P1 |
| `next.config.ts` | إضافة rewrite لـ /api | P2 |

---

> **إجمالي المشاكل: 25 مشكلة في 6 فئات**
> **الملفات المتأثرة: 21 ملف**
