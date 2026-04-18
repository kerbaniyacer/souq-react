# سوق - مشروع React

متجر إلكتروني مبني بـ React + TypeScript + Tailwind CSS مع قاعدة بيانات PostgreSQL.

## هيكل المشروع

```
souq-react/
├── src/
│   ├── components/
│   │   ├── layout/         # Navbar, Footer, Layout
│   │   ├── common/         # Toast, Spinner
│   │   └── store/          # ProductCard
│   ├── pages/
│   │   ├── Home.tsx        # الصفحة الرئيسية
│   │   ├── Products.tsx    # قائمة المنتجات
│   │   ├── Cart.tsx        # السلة
│   │   ├── Checkout.tsx    # إتمام الطلب
│   │   ├── Orders.tsx      # الطلبات
│   │   ├── Wishlist.tsx    # المفضلة
│   │   ├── auth/           # تسجيل الدخول والتسجيل
│   │   └── merchant/       # لوحة التاجر
│   ├── stores/             # Zustand (Auth, Cart, Wishlist, Toast)
│   ├── services/           # API calls (Axios)
│   ├── types/              # TypeScript types
│   └── styles/             # CSS (Tailwind)
├── database/
│   ├── schema.sql          # مخطط PostgreSQL الكامل
│   ├── seed.sql            # بيانات تجريبية
│   └── db.json             # قاعدة بيانات JSON للتطوير المحلي
└── package.json
```

## تشغيل المشروع

### 1. تثبيت المتطلبات
```bash
cd souq-react
npm install
```

### 2. تشغيل قاعدة بيانات JSON (للتطوير)
```bash
npm run db:server
# سيعمل على http://localhost:3001
```

### 3. تشغيل تطبيق React
```bash
npm run dev
# سيعمل على http://localhost:5173
```

## قاعدة البيانات PostgreSQL

### إنشاء قاعدة البيانات
```bash
psql -U postgres
CREATE DATABASE souq_db;
\c souq_db
\i database/schema.sql
\i database/seed.sql
```

### الجداول الرئيسية

| الجدول | الوصف |
|--------|-------|
| `users` | المستخدمون |
| `profiles` | الملفات الشخصية |
| `categories` | أقسام المنتجات (متداخلة) |
| `brands` | العلامات التجارية |
| `products` | المنتجات |
| `product_variants` | نسخ المنتج (الألوان، الأحجام...) |
| `variant_images` | صور النسخ |
| `carts` | سلل التسوق |
| `cart_items` | عناصر السلة |
| `orders` | الطلبات |
| `order_items` | عناصر الطلب |
| `wishlists` | المفضلة |
| `reviews` | التقييمات |
| `subscript_emails` | النشرة البريدية |

## التقنيات المستخدمة

- **React 18** + **TypeScript**
- **Vite** - أداة البناء
- **Tailwind CSS** - التنسيق
- **React Router v6** - التنقل
- **Zustand** - إدارة الحالة
- **Axios** - طلبات HTTP
- **Lucide React** - الأيقونات
- **JSON Server** - API محلية للتطوير
- **PostgreSQL** - قاعدة البيانات

## الصفحات

- `/` - الصفحة الرئيسية
- `/products` - قائمة المنتجات مع فلترة وبحث
- `/products/:slug` - تفاصيل المنتج
- `/cart` - سلة التسوق
- `/checkout` - إتمام الطلب
- `/orders` - طلباتي
- `/wishlist` - المفضلة
- `/login` - تسجيل الدخول
- `/register` - إنشاء حساب
- `/merchant/dashboard` - لوحة التاجر
