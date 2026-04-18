-- ============================================================
-- سوق - مخطط قاعدة البيانات PostgreSQL
-- يحتوي على نفس الموديلز الموجودة في مشروع Django
-- ============================================================

-- تفعيل UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- 1. جدول المستخدمين (Users)
-- ============================================================
CREATE TABLE IF NOT EXISTS users (
    id          SERIAL PRIMARY KEY,
    username    VARCHAR(150) NOT NULL UNIQUE,
    email       VARCHAR(254) NOT NULL UNIQUE,
    password    VARCHAR(128) NOT NULL,  -- hashed
    first_name  VARCHAR(150) DEFAULT '',
    last_name   VARCHAR(150) DEFAULT '',
    is_active   BOOLEAN DEFAULT TRUE,
    is_staff    BOOLEAN DEFAULT FALSE,
    is_superuser BOOLEAN DEFAULT FALSE,
    date_joined TIMESTAMPTZ DEFAULT NOW(),
    last_login  TIMESTAMPTZ
);

-- ============================================================
-- 2. جدول الملفات الشخصية (Profiles)
-- ============================================================
CREATE TABLE IF NOT EXISTS profiles (
    id                   SERIAL PRIMARY KEY,
    user_id              INTEGER NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    is_seller            BOOLEAN DEFAULT FALSE,
    phone                VARCHAR(20) DEFAULT '',
    address              TEXT DEFAULT '',
    wilaya               VARCHAR(100) DEFAULT '',
    baladia              VARCHAR(100) DEFAULT '',
    bio                  TEXT DEFAULT '',
    photo                VARCHAR(500),                  -- URL/path to image
    -- حقول التاجر
    store_name           VARCHAR(200) DEFAULT '',
    store_description    TEXT DEFAULT '',
    store_category       VARCHAR(200) DEFAULT '',
    store_logo           VARCHAR(500),
    commercial_register  VARCHAR(100) DEFAULT '',
    created_at           TIMESTAMPTZ DEFAULT NOW(),
    updated_at           TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 3. جدول عناوين IP للمستخدمين (UserIP)
-- ============================================================
CREATE TABLE IF NOT EXISTS user_ips (
    id           SERIAL PRIMARY KEY,
    user_id      INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    ip_address   INET NOT NULL,
    last_login   TIMESTAMPTZ DEFAULT NOW(),
    created_at   TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (user_id, ip_address)
);

-- ============================================================
-- 4. جدول الأقسام (Categories)
-- ============================================================
CREATE TABLE IF NOT EXISTS categories (
    id          SERIAL PRIMARY KEY,
    name        VARCHAR(200) NOT NULL,
    parent_id   INTEGER REFERENCES categories(id) ON DELETE SET NULL,
    slug        VARCHAR(220) NOT NULL UNIQUE,
    logo        VARCHAR(500),
    is_active   BOOLEAN DEFAULT TRUE,
    created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 5. جدول العلامات التجارية (Brands)
-- ============================================================
CREATE TABLE IF NOT EXISTS brands (
    id           SERIAL PRIMARY KEY,
    name         VARCHAR(200) NOT NULL,
    slug         VARCHAR(220) NOT NULL UNIQUE,
    logo         VARCHAR(500),
    category_id  INTEGER REFERENCES categories(id) ON DELETE SET NULL,
    description  TEXT DEFAULT '',
    website      VARCHAR(200) DEFAULT '',
    country      VARCHAR(100) DEFAULT '',
    created_at   TIMESTAMPTZ DEFAULT NOW(),
    updated_at   TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 6. جدول المنتجات (Products)
-- ============================================================
CREATE TABLE IF NOT EXISTS products (
    id             SERIAL PRIMARY KEY,
    category_id    INTEGER REFERENCES categories(id) ON DELETE SET NULL,
    seller_id      INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name           VARCHAR(300) NOT NULL,
    slug           VARCHAR(320) NOT NULL UNIQUE,
    description    TEXT DEFAULT '',
    sku            VARCHAR(100) DEFAULT '',
    brand_id       INTEGER REFERENCES brands(id) ON DELETE SET NULL,
    is_active      BOOLEAN DEFAULT TRUE,
    is_featured    BOOLEAN DEFAULT FALSE,
    rating         DECIMAL(3,2) DEFAULT 0.00,
    reviews_count  INTEGER DEFAULT 0,
    sold_count     INTEGER DEFAULT 0,
    created_at     TIMESTAMPTZ DEFAULT NOW(),
    updated_at     TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 7. جدول خصائص المنتج (ProductAttributes)
-- ============================================================
CREATE TABLE IF NOT EXISTS product_attributes (
    id          SERIAL PRIMARY KEY,
    product_id  INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    name        VARCHAR(100) NOT NULL,
    value       VARCHAR(300) NOT NULL
);

-- ============================================================
-- 8. جدول نسخ المنتج (ProductVariants)
-- ============================================================
CREATE TABLE IF NOT EXISTS product_variants (
    id          SERIAL PRIMARY KEY,
    product_id  INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    name        VARCHAR(200) NOT NULL,
    sku         VARCHAR(100) NOT NULL,
    price       DECIMAL(12,2) NOT NULL,
    old_price   DECIMAL(12,2),
    discount    INTEGER DEFAULT 0,       -- نسبة الخصم %
    stock       INTEGER DEFAULT 0,
    is_active   BOOLEAN DEFAULT TRUE,
    attributes  JSONB DEFAULT '{}',     -- {"color": "أحمر", "size": "L"}
    created_at  TIMESTAMPTZ DEFAULT NOW(),
    is_main     BOOLEAN DEFAULT FALSE,
    UNIQUE (product_id, sku)
);

-- ============================================================
-- 9. جدول صور النسخ (VariantImages)
-- ============================================================
CREATE TABLE IF NOT EXISTS variant_images (
    id          SERIAL PRIMARY KEY,
    product_id  INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    image       VARCHAR(500) NOT NULL,
    alt_text    VARCHAR(200) DEFAULT '',
    is_main     BOOLEAN DEFAULT FALSE,
    created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- جدول وسيط: صورة <-> نسخة (M2M)
CREATE TABLE IF NOT EXISTS variant_image_variants (
    image_id    INTEGER NOT NULL REFERENCES variant_images(id) ON DELETE CASCADE,
    variant_id  INTEGER NOT NULL REFERENCES product_variants(id) ON DELETE CASCADE,
    PRIMARY KEY (image_id, variant_id)
);

-- ============================================================
-- 10. جدول فيديوهات المنتج (ProductVideos)
-- ============================================================
CREATE TABLE IF NOT EXISTS product_videos (
    id          SERIAL PRIMARY KEY,
    product_id  INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    video       VARCHAR(500) NOT NULL     -- path/URL
);

-- ============================================================
-- 11. جدول السلة (Cart)
-- ============================================================
CREATE TABLE IF NOT EXISTS carts (
    id           SERIAL PRIMARY KEY,
    user_id      INTEGER REFERENCES users(id) ON DELETE CASCADE,
    session_key  VARCHAR(40),            -- للزوار غير المسجلين
    created_at   TIMESTAMPTZ DEFAULT NOW(),
    updated_at   TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (user_id),                   -- حساب واحد = سلة واحدة
    UNIQUE (session_key)
);

-- ============================================================
-- 12. جدول عناصر السلة (CartItems)
-- ============================================================
CREATE TABLE IF NOT EXISTS cart_items (
    id          SERIAL PRIMARY KEY,
    cart_id     INTEGER NOT NULL REFERENCES carts(id) ON DELETE CASCADE,
    variant_id  INTEGER REFERENCES product_variants(id) ON DELETE SET NULL,
    quantity    INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
    created_at  TIMESTAMPTZ DEFAULT NOW(),
    updated_at  TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (cart_id, variant_id)
);

-- ============================================================
-- 13. جدول الطلبات (Orders)
-- ============================================================
CREATE TYPE order_status AS ENUM (
    'pending', 'confirmed', 'processing', 'shipped',
    'delivered', 'cancelled', 'returned'
);
CREATE TYPE payment_method AS ENUM ('cod', 'card', 'apple_pay');
CREATE TYPE payment_status AS ENUM ('pending', 'paid', 'failed', 'refunded', 'cancelled');

CREATE TABLE IF NOT EXISTS orders (
    id               SERIAL PRIMARY KEY,
    user_id          INTEGER REFERENCES users(id) ON DELETE SET NULL,
    order_number     VARCHAR(20) NOT NULL UNIQUE,  -- SOQ-XXXX-YYYY
    username         VARCHAR(150) DEFAULT '',
    -- معلومات الشحن
    full_name        VARCHAR(200) NOT NULL,
    phone            VARCHAR(20) NOT NULL,
    email            VARCHAR(254) NOT NULL,
    address          TEXT NOT NULL,
    wilaya           VARCHAR(100) NOT NULL,
    baladia          VARCHAR(100) DEFAULT '',
    postal_code      VARCHAR(10) DEFAULT '',
    notes            TEXT DEFAULT '',
    -- المبالغ
    subtotal         DECIMAL(12,2) DEFAULT 0.00,
    shipping_cost    DECIMAL(12,2) DEFAULT 0.00,
    discount         DECIMAL(12,2) DEFAULT 0.00,
    total_amount     DECIMAL(12,2) DEFAULT 0.00,
    -- الشحن والدفع
    tracking_number  VARCHAR(50) DEFAULT '',
    status           order_status DEFAULT 'pending',
    payment_method   payment_method DEFAULT 'cod',
    payment_status   payment_status DEFAULT 'pending',
    stock_deducted   BOOLEAN DEFAULT FALSE,
    created_at       TIMESTAMPTZ DEFAULT NOW(),
    updated_at       TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 14. جدول عناصر الطلب (OrderItems)
-- ============================================================
CREATE TABLE IF NOT EXISTS order_items (
    id             SERIAL PRIMARY KEY,
    order_id       INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    product_id     INTEGER REFERENCES products(id) ON DELETE SET NULL,
    variant_id     INTEGER REFERENCES product_variants(id) ON DELETE SET NULL,
    -- snapshot عند وقت الشراء
    product_name   VARCHAR(300) NOT NULL,
    product_price  DECIMAL(12,2) NOT NULL,
    quantity       INTEGER NOT NULL DEFAULT 1,
    subtotal       DECIMAL(12,2) NOT NULL
);

-- ============================================================
-- 15. جدول المفضلة (Wishlist)
-- ============================================================
CREATE TABLE IF NOT EXISTS wishlists (
    id           SERIAL PRIMARY KEY,
    user_id      INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    product_id   INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    created_at   TIMESTAMPTZ DEFAULT NOW(),
    session_key  VARCHAR(40),
    UNIQUE (user_id, product_id)
);

-- ============================================================
-- 16. جدول عناصر المفضلة (WishlistItems)
-- ============================================================
CREATE TABLE IF NOT EXISTS wishlist_items (
    id           SERIAL PRIMARY KEY,
    wishlist_id  INTEGER NOT NULL REFERENCES wishlists(id) ON DELETE CASCADE,
    quantity     INTEGER DEFAULT 1,
    variant_id   INTEGER REFERENCES product_variants(id) ON DELETE SET NULL,
    created_at   TIMESTAMPTZ DEFAULT NOW(),
    updated_at   TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (wishlist_id, variant_id)
);

-- ============================================================
-- 17. جدول التقييمات (Reviews)
-- ============================================================
CREATE TABLE IF NOT EXISTS reviews (
    id             SERIAL PRIMARY KEY,
    product_id     INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    user_id        INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    rating         SMALLINT NOT NULL CHECK (rating BETWEEN 1 AND 5),
    comment        TEXT DEFAULT '',
    verified       BOOLEAN DEFAULT FALSE,
    helpful_count  INTEGER DEFAULT 0,
    created_at     TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (product_id, user_id)   -- مراجعة واحدة لكل مستخدم
);

-- ============================================================
-- 18. جدول الاشتراك في النشرة البريدية (SubscriptEmails)
-- ============================================================
CREATE TABLE IF NOT EXISTS subscript_emails (
    id          SERIAL PRIMARY KEY,
    email       VARCHAR(254) NOT NULL UNIQUE,
    created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- الفهارس (Indexes) لتحسين الأداء
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_products_category    ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_seller      ON products(seller_id);
CREATE INDEX IF NOT EXISTS idx_products_is_active   ON products(is_active);
CREATE INDEX IF NOT EXISTS idx_products_is_featured ON products(is_featured);
CREATE INDEX IF NOT EXISTS idx_products_slug        ON products(slug);

CREATE INDEX IF NOT EXISTS idx_variants_product     ON product_variants(product_id);
CREATE INDEX IF NOT EXISTS idx_variants_is_main     ON product_variants(is_main);

CREATE INDEX IF NOT EXISTS idx_cart_items_cart      ON cart_items(cart_id);
CREATE INDEX IF NOT EXISTS idx_orders_user          ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_status        ON orders(status);
CREATE INDEX IF NOT EXISTS idx_order_items_order    ON order_items(order_id);

CREATE INDEX IF NOT EXISTS idx_reviews_product      ON reviews(product_id);
CREATE INDEX IF NOT EXISTS idx_wishlists_user       ON wishlists(user_id);

-- ============================================================
-- الدوال التلقائية (Triggers)
-- ============================================================

-- تحديث updated_at تلقائياً
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_profiles_updated_at
    BEFORE UPDATE ON profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_products_updated_at
    BEFORE UPDATE ON products
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_carts_updated_at
    BEFORE UPDATE ON carts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_cart_items_updated_at
    BEFORE UPDATE ON cart_items
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_orders_updated_at
    BEFORE UPDATE ON orders
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- إنشاء الملف الشخصي تلقائياً عند تسجيل مستخدم جديد
CREATE OR REPLACE FUNCTION create_user_profile()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO profiles (user_id) VALUES (NEW.id);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_create_profile
    AFTER INSERT ON users
    FOR EACH ROW EXECUTE FUNCTION create_user_profile();

-- توليد رقم الطلب التلقائي: SOQ-YEAR-RANDOM
CREATE OR REPLACE FUNCTION generate_order_number()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.order_number IS NULL OR NEW.order_number = '' THEN
        NEW.order_number := 'SOQ-' || EXTRACT(YEAR FROM NOW())::TEXT || '-' || LPAD(FLOOR(RANDOM() * 99999)::TEXT, 5, '0');
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_order_number
    BEFORE INSERT ON orders
    FOR EACH ROW EXECUTE FUNCTION generate_order_number();

-- ============================================================
-- Views مفيدة
-- ============================================================

-- عرض المنتجات مع تفاصيلها
CREATE OR REPLACE VIEW v_products_detail AS
SELECT
    p.id,
    p.name,
    p.slug,
    p.description,
    p.is_active,
    p.is_featured,
    p.rating,
    p.reviews_count,
    p.sold_count,
    p.created_at,
    c.name AS category_name,
    c.slug AS category_slug,
    b.name AS brand_name,
    u.username AS seller_username,
    prof.store_name,
    -- السعر الأدنى من النسخ النشطة
    (SELECT MIN(pv.price) FROM product_variants pv WHERE pv.product_id = p.id AND pv.is_active = TRUE) AS min_price,
    -- الصورة الرئيسية
    (SELECT vi.image FROM variant_images vi
     WHERE vi.product_id = p.id AND vi.is_main = TRUE LIMIT 1) AS main_image
FROM products p
LEFT JOIN categories c ON p.category_id = c.id
LEFT JOIN brands b ON p.brand_id = b.id
LEFT JOIN users u ON p.seller_id = u.id
LEFT JOIN profiles prof ON u.id = prof.user_id;

-- عرض إحصائيات التاجر
CREATE OR REPLACE VIEW v_merchant_stats AS
SELECT
    u.id AS seller_id,
    u.username,
    prof.store_name,
    COUNT(DISTINCT p.id) AS total_products,
    COUNT(DISTINCT o.id) AS total_orders,
    COALESCE(SUM(CASE WHEN o.status = 'delivered' THEN o.total_amount ELSE 0 END), 0) AS total_revenue
FROM users u
JOIN profiles prof ON u.id = prof.user_id
LEFT JOIN products p ON u.id = p.seller_id
LEFT JOIN order_items oi ON p.id = oi.product_id
LEFT JOIN orders o ON oi.order_id = o.id
WHERE prof.is_seller = TRUE
GROUP BY u.id, u.username, prof.store_name;
