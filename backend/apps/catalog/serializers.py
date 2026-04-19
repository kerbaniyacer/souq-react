from rest_framework import serializers
from .models import Category, Brand, Product, ProductVariant, ProductImage, ProductAttribute


class CategorySerializer(serializers.ModelSerializer):
    children = serializers.SerializerMethodField()

    class Meta:
        model = Category
        fields = ['id', 'name', 'slug', 'description', 'icon', 'image', 'parent', 'children', 'order']

    def get_children(self, obj):
        return CategorySerializer(obj.children.filter(is_active=True), many=True).data


class CategoryMiniSerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = ['id', 'name', 'slug', 'icon']


class BrandSerializer(serializers.ModelSerializer):
    class Meta:
        model = Brand
        fields = ['id', 'name', 'slug', 'logo', 'description']


class BrandMiniSerializer(serializers.ModelSerializer):
    class Meta:
        model = Brand
        fields = ['id', 'name', 'slug', 'logo']


class ProductAttributeSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProductAttribute
        fields = ['id', 'name', 'value']


class ProductImageSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProductImage
        fields = ['id', 'image', 'alt', 'order']


class ProductVariantSerializer(serializers.ModelSerializer):
    is_in_stock = serializers.BooleanField(read_only=True)
    discount = serializers.IntegerField(read_only=True)

    class Meta:
        model = ProductVariant
        fields = [
            'id', 'name', 'sku', 'price', 'old_price', 'stock',
            'image', 'attributes', 'is_main', 'is_active', 'order',
            'is_in_stock', 'discount',
        ]


class ProductListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for product list pages."""
    category = CategoryMiniSerializer(read_only=True)
    brand = BrandMiniSerializer(read_only=True)
    variants = ProductVariantSerializer(many=True, read_only=True)
    main_image = serializers.SerializerMethodField()

    class Meta:
        model = Product
        fields = [
            'id', 'name', 'slug', 'main_image', 'category', 'brand',
            'variants', 'rating', 'reviews_count', 'sold_count',
            'is_featured', 'is_active', 'created_at',
        ]

    def get_main_image(self, obj):
        if not obj.main_image:
            return None
        name = obj.main_image.name or ''
        # Paths like /images/products/... are frontend static assets
        if name.startswith('/') or name.startswith('http'):
            return name
        request = self.context.get('request')
        url = obj.main_image.url
        return request.build_absolute_uri(url) if request else url


class ProductDetailSerializer(serializers.ModelSerializer):
    """Full serializer for product detail page."""
    category = CategoryMiniSerializer(read_only=True)
    brand = BrandMiniSerializer(read_only=True)
    variants = ProductVariantSerializer(many=True, read_only=True)
    images = ProductImageSerializer(many=True, read_only=True)
    attributes = ProductAttributeSerializer(many=True, read_only=True)
    seller = serializers.SerializerMethodField()
    main_image = serializers.SerializerMethodField()

    class Meta:
        model = Product
        fields = [
            'id', 'name', 'slug', 'description', 'main_image',
            'sku', 'category', 'brand', 'seller',
            'variants', 'images', 'attributes',
            'rating', 'reviews_count', 'sold_count',
            'is_featured', 'is_active', 'created_at', 'updated_at',
        ]

    def get_main_image(self, obj):
        if not obj.main_image:
            return None
        name = obj.main_image.name or ''
        if name.startswith('/') or name.startswith('http'):
            return name
        request = self.context.get('request')
        url = obj.main_image.url
        return request.build_absolute_uri(url) if request else url

    def get_seller(self, obj):
        return {
            'id': obj.seller.id,
            'username': obj.seller.username,
            'store_name': getattr(getattr(obj.seller, 'profile', None), 'store_name', ''),
        }


# ── Merchant write serializers ────────────────────────────────────────────────

class VariantWriteSerializer(serializers.Serializer):
    name = serializers.CharField()
    sku = serializers.CharField(required=False, allow_blank=True, default='')
    price = serializers.DecimalField(max_digits=10, decimal_places=2)
    old_price = serializers.DecimalField(
        max_digits=10, decimal_places=2, required=False, allow_null=True, default=None
    )
    stock = serializers.IntegerField(default=0)
    image = serializers.CharField(required=False, allow_blank=True, allow_null=True, default='')
    is_main = serializers.BooleanField(default=False)
    is_active = serializers.BooleanField(default=True)
    attributes = serializers.DictField(required=False, default=dict)


class ProductWriteSerializer(serializers.ModelSerializer):
    """For merchant create/update — accepts nested variants and brand_name."""
    variants = VariantWriteSerializer(many=True, required=False, default=list)
    category_id = serializers.PrimaryKeyRelatedField(
        queryset=Category.objects.all(), source='category',
        required=False, allow_null=True, default=None,
    )
    brand_name = serializers.CharField(required=False, allow_blank=True, default='', write_only=True)

    class Meta:
        model = Product
        fields = [
            'name', 'description', 'category_id', 'brand_name',
            'sku', 'is_active', 'is_featured', 'variants',
        ]

    def _save_variants(self, product, variants_data):
        product.variants.all().delete()
        for i, vd in enumerate(variants_data):
            image = vd.pop('image', '') or ''
            # Truncate base64 to avoid DB issues — store URL form only
            if image.startswith('data:'):
                image = ''
            ProductVariant.objects.create(product=product, order=i, image=image, **vd)

    def _resolve_brand(self, brand_name):
        if not brand_name:
            return None
        # 1. Exact name match (case-insensitive)
        brand = Brand.objects.filter(name__iexact=brand_name).first()
        if brand:
            return brand
        # 2. Build slug and look up by slug (handles duplicates from concurrent creates)
        slug = brand_name.lower().replace(' ', '-')
        brand = Brand.objects.filter(slug=slug).first()
        if brand:
            return brand
        # 3. Create with a unique slug
        base_slug = slug
        counter = 1
        while Brand.objects.filter(slug=slug).exists():
            slug = f"{base_slug}-{counter}"
            counter += 1
        return Brand.objects.create(name=brand_name, slug=slug)

    def create(self, validated_data):
        variants_data = validated_data.pop('variants', [])
        brand_name = validated_data.pop('brand_name', '')
        validated_data['brand'] = self._resolve_brand(brand_name)
        product = Product.objects.create(**validated_data)
        self._save_variants(product, variants_data)
        return product

    def update(self, instance, validated_data):
        variants_data = validated_data.pop('variants', None)
        brand_name = validated_data.pop('brand_name', None)
        if brand_name is not None:
            validated_data['brand'] = self._resolve_brand(brand_name)
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        if variants_data is not None:
            self._save_variants(instance, variants_data)
        return instance
