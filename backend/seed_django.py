import os
import django
import sys
from django.db import models

# Setup Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings.development')
django.setup()


from apps.accounts.models import User, Profile
from apps.catalog.models import Category, Brand, Product, ProductVariant, VariantImage

def seed():
    print("Starting seeding process...")

    # 1. Create Superuser
    if not User.objects.filter(models.Q(email='admin@souq.dz') | models.Q(username='admin')).exists():
        admin = User.objects.create_superuser(
            username='admin',
            email='admin@souq.dz',
            password='admin123'
        )
        print(f"Created superuser: {admin.email}")
    else:
        admin = User.objects.filter(models.Q(email='admin@souq.dz') | models.Q(username='admin')).first()
        print(f"Superuser {admin.email} already exists.")

    # 2. Create Seller
    if not User.objects.filter(models.Q(email='seller@souq.dz') | models.Q(username='seller')).exists():
        seller = User.objects.create_user(
            username='seller',
            email='seller@souq.dz',
            password='seller123',
            first_name='Ali',
            last_name='Souqi'
        )
        Profile.objects.filter(user=seller).update(
            is_seller=True,
            store_name='Souq Store',
            phone='0555123456',
            wilaya='Algiers',
            baladia='Dely Ibrahim'
        )
        print(f"Created seller: {seller.email}")
    else:
        seller = User.objects.filter(models.Q(email='seller@souq.dz') | models.Q(username='seller')).first()
        print(f"Seller {seller.email} already exists.")



    # 3. Create Categories
    cats_data = [
        {'name': 'Electronics', 'slug': 'electronics'},
        {'name': 'Fashion', 'slug': 'fashion'},
        {'name': 'Home', 'slug': 'home'},
    ]
    categories = {}
    for data in cats_data:
        cat, created = Category.objects.get_or_create(slug=data['slug'], defaults={'name': data['name']})
        categories[data['slug']] = cat
        if created: print(f"Created category: {data['slug']}")

    # 4. Create Brands
    brands_data = [
        {'name': 'Samsung', 'slug': 'samsung'},
        {'name': 'Nike', 'slug': 'nike'},
        {'name': 'Apple', 'slug': 'apple'},
    ]
    brands = {}
    for data in brands_data:
        brand, created = Brand.objects.get_or_create(slug=data['slug'], defaults={'name': data['name']})
        brands[data['slug']] = brand
        if created: print(f"Created brand: {data['slug']}")

    # 5. Create Products
    products_data = [
        {
            'name': 'Samsung Galaxy S21 Ultra',
            'category': categories['electronics'],
            'brand': brands['samsung'],
            'description': 'Smartphone',
            'price': 145000,
            'is_featured': True
        },
        {
            'name': 'iPhone 13 Pro',
            'category': categories['electronics'],
            'brand': brands['apple'],
            'description': 'Smartphone',
            'price': 185000,
            'is_featured': True
        },
        {
            'name': 'Nike Air Max',
            'category': categories['fashion'],
            'brand': brands['nike'],
            'description': 'Running Shoes',
            'price': 12000,
            'is_featured': False
        },
    ]

    for p_data in products_data:
        prod, created = Product.objects.get_or_create(
            name=p_data['name'],
            defaults={
                'category': p_data['category'],
                'brand': p_data['brand'],
                'seller': seller,
                'description': p_data['description'],
                'is_featured': p_data['is_featured'],
            }
        )
        if created:
            # Create a variant
            ProductVariant.objects.create(
                product=prod,
                sku=f"{prod.id}-DEFAULT",
                price=p_data['price'],
                stock=10,
                is_main=True
            )
            print(f"Created product: {p_data['name']}")


    print("Seeding complete!")

if __name__ == '__main__':
    seed()
