-- ============================================================
-- بيانات تجريبية (Seed Data)
-- ============================================================

-- مستخدم مسؤول
INSERT INTO users (username, email, password, first_name, last_name, is_staff, is_superuser)
VALUES ('admin', 'admin@souq.dz', 'pbkdf2_sha256$...', 'مسؤول', 'النظام', TRUE, TRUE)
ON CONFLICT DO NOTHING;

-- مستخدم تاجر
INSERT INTO users (username, email, password, first_name, last_name)
VALUES ('seller1', 'seller@souq.dz', 'pbkdf2_sha256$...', 'أحمد', 'التاجر')
ON CONFLICT DO NOTHING;

-- مستخدم عادي
INSERT INTO users (username, email, password, first_name, last_name)
VALUES ('customer1', 'customer@souq.dz', 'pbkdf2_sha256$...', 'فاطمة', 'الزهراء')
ON CONFLICT DO NOTHING;

-- تحديث ملف التاجر
UPDATE profiles SET
    is_seller = TRUE,
    store_name = 'متجر أحمد للإلكترونيات',
    store_description = 'أفضل الإلكترونيات بأفضل الأسعار',
    store_category = 'إلكترونيات',
    phone = '0555000001',
    wilaya = 'الجزائر',
    baladia = 'الجزائر الوسطى'
WHERE user_id = (SELECT id FROM users WHERE username = 'seller1');

-- أقسام
INSERT INTO categories (name, slug, is_active) VALUES
    ('إلكترونيات', 'electronics', TRUE),
    ('ملابس وأزياء', 'clothing', TRUE),
    ('منزل ومطبخ', 'home-kitchen', TRUE),
    ('رياضة ولياقة', 'sports', TRUE),
    ('كتب وتعليم', 'books', TRUE),
    ('هواتف وأجهزة', 'phones', TRUE)
ON CONFLICT DO NOTHING;

-- قسم فرعي
INSERT INTO categories (name, slug, parent_id, is_active)
VALUES ('هواتف ذكية', 'smartphones', (SELECT id FROM categories WHERE slug = 'phones'), TRUE)
ON CONFLICT DO NOTHING;

-- علامات تجارية
INSERT INTO brands (name, slug, country, category_id) VALUES
    ('سامسونج', 'samsung', 'كوريا الجنوبية', (SELECT id FROM categories WHERE slug = 'electronics')),
    ('آبل', 'apple', 'الولايات المتحدة', (SELECT id FROM categories WHERE slug = 'phones')),
    ('هواوي', 'huawei', 'الصين', (SELECT id FROM categories WHERE slug = 'phones'))
ON CONFLICT DO NOTHING;

-- منتج 1
INSERT INTO products (category_id, seller_id, name, slug, description, is_active, is_featured, rating, reviews_count)
VALUES (
    (SELECT id FROM categories WHERE slug = 'smartphones'),
    (SELECT id FROM users WHERE username = 'seller1'),
    'هاتف سامسونج جالاكسي S24',
    'samsung-galaxy-s24',
    'هاتف ذكي متطور بمعالج قوي وكاميرا احترافية',
    TRUE, TRUE, 4.5, 12
) ON CONFLICT DO NOTHING;

-- نسخة المنتج 1
INSERT INTO product_variants (product_id, name, sku, price, old_price, discount, stock, is_main)
VALUES (
    (SELECT id FROM products WHERE slug = 'samsung-galaxy-s24'),
    '256GB - أسود', 'SGS24-256-BLK', 95000.00, 105000.00, 10, 15, TRUE
) ON CONFLICT DO NOTHING;

-- منتج 2
INSERT INTO products (category_id, seller_id, name, slug, description, is_active, is_featured, rating, reviews_count)
VALUES (
    (SELECT id FROM categories WHERE slug = 'electronics'),
    (SELECT id FROM users WHERE username = 'seller1'),
    'سماعات لاسلكية بلوتوث',
    'wireless-bluetooth-headphones',
    'سماعات عالية الجودة مع خاصية إلغاء الضوضاء',
    TRUE, FALSE, 4.2, 8
) ON CONFLICT DO NOTHING;

INSERT INTO product_variants (product_id, name, sku, price, stock, is_main)
VALUES (
    (SELECT id FROM products WHERE slug = 'wireless-bluetooth-headphones'),
    'أسود', 'WBH-BLK', 8500.00, 30, TRUE
) ON CONFLICT DO NOTHING;

-- منتج 3
INSERT INTO products (category_id, seller_id, name, slug, description, is_active, is_featured)
VALUES (
    (SELECT id FROM categories WHERE slug = 'home-kitchen'),
    (SELECT id FROM users WHERE username = 'seller1'),
    'خلاط كهربائي متعدد الوظائف',
    'multifunction-blender',
    'خلاط قوي مناسب لجميع الاحتياجات المنزلية',
    TRUE, TRUE
) ON CONFLICT DO NOTHING;

INSERT INTO product_variants (product_id, name, sku, price, stock, is_main)
VALUES (
    (SELECT id FROM products WHERE slug = 'multifunction-blender'),
    'أبيض 1.5 لتر', 'BLD-WHT-15', 5500.00, 25, TRUE
) ON CONFLICT DO NOTHING;

-- اشتراك بريدي تجريبي
INSERT INTO subscript_emails (email) VALUES ('newsletter@test.com') ON CONFLICT DO NOTHING;
