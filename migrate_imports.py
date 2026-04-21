import os

replacements = [
    ("@souq/stores/authStore", "@features/auth/stores/authStore"),
    ("@souq/services/authService", "@features/auth/services/authService"),
    ("@souq/services/emailService", "@shared/services/emailService"),
    ("@souq/services/ipService", "@shared/services/ipService"),
    ("@souq/types", "@shared/types"),
    ("@souq/lib/", "@shared/lib/"),
    ("@souq/components/common", "@shared/components/common"),
    ("@souq/components/layout", "@shared/components/layout"),
    ("@souq/components/auth", "@features/auth/components"),
    ("@souq/components/store", "@features/products/components"),
    ("@souq/components/profile", "@features/auth/components"),
    ("@souq/components/reviews", "@features/products/components"),
    ("@souq/pages/auth", "@features/auth/pages"),
    ("@souq/pages/admin", "@features/admin/pages"),
    ("@souq/pages/merchant", "@features/merchant/pages"),
    ("@souq/pages/Home", "@features/products/pages/Home"),
    ("@souq/pages/Products", "@features/products/pages/Products"),
    ("@souq/pages/ProductDetail", "@features/products/pages/ProductDetail"),
    ("@souq/pages/Wishlist", "@features/products/pages/Wishlist"),
    ("@souq/pages/Cart", "@features/cart/pages/Cart"),
    ("@souq/pages/Checkout", "@features/cart/pages/Checkout"),
    ("@souq/pages/Orders", "@features/orders/pages/Orders"),
    ("@souq/pages/OrderDetail", "@features/orders/pages/OrderDetail"),
    ("@souq/pages/TrackOrder", "@features/orders/pages/TrackOrder"),
    ("@souq/stores/", "@shared/stores/"),
    ("@souq/services/api", "@shared/services/api"),
    ("@souq/styles/", "@shared/styles/"),
    ("@souq/hooks/", "@shared/hooks/"),
    ("@souq/data/", "@shared/data/"),
    ("./styles/index.css", "@shared/styles/index.css"),
]

def migrate_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    new_content = content
    for old, new in replacements:
        new_content = new_content.replace(old, new)
    
    if new_content != content:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(new_content)
        print(f"Migrated: {filepath}")

for root, dirs, files in os.walk('src'):
    if 'src\\souq' in root:
        continue
    for file in files:
        if file.endswith(('.ts', '.tsx', '.css')):
            migrate_file(os.path.join(root, file))
