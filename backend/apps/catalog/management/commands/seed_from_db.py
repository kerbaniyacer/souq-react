"""
Management command: seed_from_db
Reads database/db.json (JSON Server mock) and populates the Django database.

Usage:
    python manage.py seed_from_db [--clear]

Options:
    --clear   Wipe existing data before seeding (default: False)
"""

import json
import os
import sys
from pathlib import Path

# Force UTF-8 output on Windows
if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8', errors='replace')
if hasattr(sys.stderr, 'reconfigure'):
    sys.stderr.reconfigure(encoding='utf-8', errors='replace')

from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand
from django.utils.text import slugify

User = get_user_model()

DB_JSON_PATH = Path(__file__).resolve().parents[5] / 'database' / 'db.json'


def _slug(text, existing=None):
    """Generate a unique slug, appending a counter if needed."""
    base = slugify(text, allow_unicode=True) or 'item'
    slug = base
    counter = 1
    while existing is not None and slug in existing:
        slug = f'{base}-{counter}'
        counter += 1
    if existing is not None:
        existing.add(slug)
    return slug


class Command(BaseCommand):
    help = 'Seed the Django database from database/db.json'

    def add_arguments(self, parser):
        parser.add_argument('--clear', action='store_true', help='Clear existing data first')

    def handle(self, *args, **options):
        from apps.accounts.models import Profile
        from apps.catalog.models import (
            Brand, Category, Product, ProductAttribute, ProductVariant,
        )
        from apps.orders.models import Order, OrderItem

        with open(DB_JSON_PATH, encoding='utf-8') as f:
            db = json.load(f)

        if options['clear']:
            self.stdout.write('  Clearing existing data...')
            OrderItem.objects.all().delete()
            Order.objects.all().delete()
            ProductVariant.objects.all().delete()
            ProductAttribute.objects.all().delete()
            Product.objects.all().delete()
            Brand.objects.all().delete()
            Category.objects.all().delete()
            Profile.objects.all().delete()
            User.objects.filter(is_superuser=False).delete()

        # ── 1. Users ──────────────────────────────────────────────────────────
        self.stdout.write('\n[1/6] Seeding users...')
        user_map = {}  # old_id -> User instance
        for u in db.get('users', []):
            old_id = str(u['id'])
            email = u.get('email', '').strip()
            if not email:
                self.stdout.write(f'  skip user {old_id}: no email')
                continue
            user, created = User.objects.get_or_create(
                email=email,
                defaults={
                    'username': u.get('username') or email.split('@')[0],
                    'first_name': u.get('first_name', ''),
                    'last_name': u.get('last_name', ''),
                    'is_staff': u.get('is_staff', False),
                    'is_superuser': u.get('is_staff', False),
                    'provider': u.get('provider', 'local'),
                    'provider_id': u.get('provider_id', ''),
                },
            )
            if created:
                raw_pw = u.get('password', '')
                if raw_pw:
                    user.set_password(raw_pw)
                else:
                    user.set_unusable_password()
                user.save()
                self.stdout.write(f'  + user: {email}')
            else:
                self.stdout.write(f'  ~ user exists: {email}')
            user_map[old_id] = user

        # ── 2. Profiles ───────────────────────────────────────────────────────
        self.stdout.write('\n[2/6] Seeding profiles...')
        for p in db.get('profiles', []):
            old_user_id = str(p.get('user_id', ''))
            user = user_map.get(old_user_id)
            if not user:
                continue
            Profile.objects.update_or_create(
                user=user,
                defaults={
                    'phone': p.get('phone', ''),
                    'address': p.get('address', ''),
                    'wilaya': p.get('wilaya', ''),
                    'baladia': p.get('baladia', ''),
                    'bio': p.get('bio', ''),
                    'is_seller': p.get('is_seller', False),
                    'store_name': p.get('store_name', ''),
                    'store_description': p.get('store_description', ''),
                    'store_category': p.get('store_category', ''),
                    'commercial_register': p.get('commercial_register', ''),
                },
            )
            self.stdout.write(f'  + profile: {user.email}')

        # ── 3. Categories ─────────────────────────────────────────────────────
        self.stdout.write('\n[3/6] Seeding categories...')
        cat_map = {}   # old_id -> Category instance
        used_slugs = set(Category.objects.values_list('slug', flat=True))
        # First pass: create without parent
        for c in db.get('categories', []):
            old_id = str(c['id'])
            slug = c.get('slug') or _slug(c['name'], used_slugs)
            cat, created = Category.objects.get_or_create(
                slug=slug,
                defaults={'name': c['name'], 'is_active': c.get('is_active', True)},
            )
            cat_map[old_id] = cat
            if created:
                self.stdout.write(f'  + category: {c["name"]}')
            else:
                self.stdout.write(f'  ~ category exists: {c["name"]}')
        # Second pass: set parents
        for c in db.get('categories', []):
            old_id = str(c['id'])
            parent_id = str(c.get('parent_id') or '')
            if parent_id and parent_id in cat_map and old_id in cat_map:
                cat = cat_map[old_id]
                cat.parent = cat_map[parent_id]
                cat.save(update_fields=['parent'])

        # ── 4. Brands ─────────────────────────────────────────────────────────
        self.stdout.write('\n[4/6] Seeding brands...')
        brand_map = {}  # old_id -> Brand instance
        used_brand_slugs = set(Brand.objects.values_list('slug', flat=True))
        for b in db.get('brands', []):
            old_id = str(b['id'])
            slug = b.get('slug') or _slug(b['name'], used_brand_slugs)
            brand, created = Brand.objects.get_or_create(
                slug=slug,
                defaults={'name': b['name']},
            )
            brand_map[old_id] = brand
            if created:
                self.stdout.write(f'  + brand: {b["name"]}')
            else:
                self.stdout.write(f'  ~ brand exists: {b["name"]}')

        # ── 5. Products ───────────────────────────────────────────────────────
        self.stdout.write('\n[5/6] Seeding products...')
        product_map = {}  # old_id -> Product instance
        used_product_slugs = set(Product.objects.values_list('slug', flat=True))
        for p in db.get('products', []):
            old_id = str(p['id'])
            seller = user_map.get(str(p.get('seller_id', '')))
            if not seller:
                # Fallback to first staff user
                seller = User.objects.filter(is_staff=True).first()
            if not seller:
                self.stdout.write(f'  skip product {old_id}: no seller')
                continue

            slug = p.get('slug') or _slug(p['name'], used_product_slugs)
            if slug in used_product_slugs and not Product.objects.filter(slug=slug).exists():
                pass
            elif Product.objects.filter(slug=slug).exists():
                self.stdout.write(f'  ~ product exists: {p["name"]}')
                product_map[old_id] = Product.objects.get(slug=slug)
                continue

            used_product_slugs.add(slug)

            category = cat_map.get(str(p.get('category_id') or ''))
            brand = brand_map.get(str(p.get('brand_id') or ''))

            # main_image: store the path string directly
            main_image_path = p.get('main_image', '') or ''
            if main_image_path.startswith('data:'):
                main_image_path = ''

            product = Product(
                seller=seller,
                category=category,
                brand=brand,
                name=p['name'],
                slug=slug,
                description=p.get('description', ''),
                sku=p.get('sku', ''),
                is_active=p.get('is_active', True),
                is_featured=p.get('is_featured', False),
                rating=p.get('rating', 0) or 0,
                reviews_count=p.get('reviews_count', 0) or 0,
                sold_count=p.get('sold_count', 0) or 0,
            )
            # Set main_image path without going through FileField validation
            product.main_image.name = main_image_path
            product.save()
            product_map[old_id] = product
            self.stdout.write(f'  + product: {p["name"]}')

            # Attributes
            for a in p.get('attributes', []):
                ProductAttribute.objects.create(
                    product=product,
                    name=a.get('name', ''),
                    value=a.get('value', ''),
                )

            # Variants
            for i, v in enumerate(p.get('variants', [])):
                image = v.get('image', '') or ''
                if image.startswith('data:'):
                    image = ''
                ProductVariant.objects.create(
                    product=product,
                    name=v.get('name', ''),
                    sku=v.get('sku', ''),
                    price=v.get('price', 0),
                    old_price=v.get('old_price') or None,
                    stock=v.get('stock', 0),
                    image=image,
                    attributes=v.get('attributes', {}),
                    is_main=v.get('is_main', False),
                    is_active=v.get('is_active', True),
                    order=i,
                )

        # ── 6. Orders ─────────────────────────────────────────────────────────
        self.stdout.write('\n[6/6] Seeding orders...')
        for o in db.get('orders', []):
            if Order.objects.filter(order_number=o.get('order_number', '')).exists():
                self.stdout.write(f'  ~ order exists: {o.get("order_number")}')
                continue

            user = user_map.get(str(o.get('user_id', '')))
            if not user:
                # Try to match by email
                email = o.get('email', '')
                user = User.objects.filter(email=email).first() if email else None
            if not user:
                self.stdout.write(f'  skip order {o.get("order_number")}: no user')
                continue

            order = Order.objects.create(
                user=user,
                order_number=o.get('order_number', ''),
                status=o.get('status', 'pending'),
                payment_method=o.get('payment_method', 'cod'),
                payment_status=o.get('payment_status', 'pending'),
                shipping_full_name=o.get('full_name', ''),
                shipping_phone=o.get('phone', ''),
                shipping_wilaya=o.get('wilaya', ''),
                shipping_baladia=o.get('baladia', ''),
                shipping_address=o.get('address', ''),
                subtotal=o.get('subtotal', 0),
                shipping_cost=o.get('shipping_cost', 0),
                discount=o.get('discount', 0),
                total_amount=o.get('total_amount', 0),
                tracking_number=o.get('tracking_number', ''),
                notes=o.get('notes', ''),
            )

            for item in o.get('items', []):
                # Try to find the real variant from product_map
                prod_old_id = str(item.get('product_id', ''))
                product = product_map.get(prod_old_id)
                variant = None
                if product:
                    variant = product.variants.filter(is_main=True).first() or product.variants.first()

                raw_name = item.get('product_name', '')
                if ' - ' in raw_name:
                    parts = raw_name.split(' - ', 1)
                    p_name, v_name = parts[0], parts[1]
                else:
                    p_name, v_name = raw_name, ''

                OrderItem.objects.create(
                    order=order,
                    variant=variant,
                    product_name=p_name,
                    variant_name=v_name,
                    variant_attributes=item.get('attributes', {}),
                    product_price=item.get('product_price', 0),
                    quantity=item.get('quantity', 1),
                    subtotal=item.get('subtotal', 0),
                )

            self.stdout.write(f'  + order: {order.order_number} ({order.status})')

        self.stdout.write(self.style.SUCCESS('\nDone! Database seeded successfully.'))
