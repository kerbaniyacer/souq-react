from rest_framework import serializers
from django.utils.text import slugify
from .models import Category, Brand, Series, Product, ProductVariant, ProductAttribute, VariantImage
from apps.accounts.models import Store


DEFAULT_PRODUCT_IMAGE = '/static/images/default-product.jpg'


def build_default_product_image(request):
    if request:
        return request.build_absolute_uri(DEFAULT_PRODUCT_IMAGE)
    return DEFAULT_PRODUCT_IMAGE


# ── Category ──────────────────────────────────────────────────────────────────

class CategorySerializer(serializers.ModelSerializer):
    children = serializers.SerializerMethodField()
    products_count = serializers.ReadOnlyField()

    class Meta:
        model = Category
        fields = ['id', 'name', 'slug', 'logo', 'parent', 'is_active', 'products_count', 'children']

    def get_children(self, obj):
        return CategorySerializer(obj.children.filter(is_active=True), many=True).data


class CategoryMiniSerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = ['id', 'name', 'slug', 'logo']


# ── Brand ─────────────────────────────────────────────────────────────────────

class BrandSerializer(serializers.ModelSerializer):
    class Meta:
        model = Brand
        fields = ['id', 'name', 'slug', 'logo', 'description', 'country']


class BrandMiniSerializer(serializers.ModelSerializer):
    class Meta:
        model = Brand
        fields = ['id', 'name', 'slug', 'logo']


# ── Variant Image ─────────────────────────────────────────────────────────────

class VariantImageSerializer(serializers.ModelSerializer):
    class Meta:
        model = VariantImage
        fields = ['id', 'image', 'alt_text', 'is_main']


# ── Series ───────────────────────────────────────────────────────────────────

class SeriesMiniSerializer(serializers.ModelSerializer):
    brand = BrandMiniSerializer(read_only=True)

    class Meta:
        model = Series
        fields = ['id', 'name', 'slug', 'logo', 'brand']


# ── Product Attribute ─────────────────────────────────────────────────────────

class ProductAttributeSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProductAttribute
        fields = ['id', 'name', 'value']


# ── Product Variant ───────────────────────────────────────────────────────────

class ProductVariantSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source='product.name', read_only=True)
    product_slug = serializers.CharField(source='product.slug', read_only=True)
    product_id = serializers.IntegerField(source='product.id', read_only=True)
    product_status = serializers.CharField(source='product.status', read_only=True)
    product_is_active = serializers.BooleanField(source='product.is_active', read_only=True)
    images = VariantImageSerializer(many=True, read_only=True)
    image = serializers.SerializerMethodField()
    is_in_stock = serializers.BooleanField(read_only=True)

    class Meta:
        model = ProductVariant
        fields = [
            'id', 'product_id', 'product_name', 'product_slug', 'product_status', 'product_is_active',
            'name', 'sku', 'price', 'old_price', 'discount',
            'stock', 'is_active', 'attributes', 'is_main',
            'images', 'image', 'is_in_stock', 'stock_status',
        ]

    def get_image(self, obj):
        """Return main image URL for this variant (from VariantImage table)."""
        url = obj.get_image  # @property on model
        if url:
            return url
        request = self.context.get('request')
        return build_default_product_image(request)


# ── Product List ──────────────────────────────────────────────────────────────

from apps.accounts.serializers import StoreMiniSerializer as StoreInfoSerializer


class ProductListSerializer(serializers.ModelSerializer):
    category = CategoryMiniSerializer(read_only=True)
    brand = BrandMiniSerializer(read_only=True)
    series = SeriesMiniSerializer(read_only=True)
    store = StoreInfoSerializer(read_only=True)
    variants = ProductVariantSerializer(many=True, read_only=True)
    main_image = serializers.SerializerMethodField()
    min_price = serializers.SerializerMethodField()
    max_price = serializers.SerializerMethodField()
    seller_name = serializers.CharField(source='seller.get_full_name', read_only=True)
    seller_username = serializers.CharField(source='seller.username', read_only=True)

    class Meta:
        model = Product
        fields = [
            'id', 'name', 'slug', 'main_image', 'category', 'brand', 'series', 'store',
            'variants', 'min_price', 'max_price', 'rating', 'reviews_count',
            'sold_count', 'is_featured', 'is_active', 'status', 'suspension_reason',
            'created_at', 'stock_status', 'seller_name', 'seller_username',
        ]

    def get_main_image(self, obj):
        """Get main image via Product.image property (from VariantImage)."""
        img_file = obj.image  # @property → ImageFieldFile or None
        if img_file:
            try:
                return img_file.url
            except Exception:
                pass
        request = self.context.get('request')
        return build_default_product_image(request)

    def get_min_price(self, obj):
        # Already calculated via annotate in views.py for performance
        return getattr(obj, 'min_price', None)

    def get_max_price(self, obj):
        # Already calculated via annotate in views.py for performance
        return getattr(obj, 'max_price', None)


# ── Product Detail ────────────────────────────────────────────────────────────

class ProductDetailSerializer(serializers.ModelSerializer):
    category = CategoryMiniSerializer(read_only=True)
    brand = BrandMiniSerializer(read_only=True)
    series = SeriesMiniSerializer(read_only=True)
    store = StoreInfoSerializer(read_only=True)
    variants = ProductVariantSerializer(many=True, read_only=True)
    attributes = ProductAttributeSerializer(many=True, read_only=True)
    seller = serializers.SerializerMethodField()
    main_image = serializers.SerializerMethodField()
    options = serializers.SerializerMethodField()

    class Meta:
        model = Product
        fields = [
            'id', 'name', 'slug', 'description', 'main_image',
            'sku', 'category', 'brand', 'series', 'store', 'seller',
            'variants', 'attributes', 'options',
            'rating', 'reviews_count', 'sold_count', 'total_stock',
            'is_featured', 'is_active', 'created_at', 'updated_at', 'stock_status',
        ]

    def get_main_image(self, obj):
        img_file = obj.image  # @property → ImageFieldFile or None
        if img_file:
            try:
                return img_file.url
            except Exception:
                pass
        request = self.context.get('request')
        return build_default_product_image(request)

    def get_seller(self, obj):
        store_name = ''
        if obj.store:
            store_name = obj.store.name
        else:
            profile = getattr(obj.seller, 'profile', None)
            if profile:
                # Fallback for products not yet migrated or if store is null
                store_name = getattr(profile, 'store_name', '')
        
        return {
            'id': obj.seller.id,
            'username': obj.seller.username,
            'store_name': store_name,
        }

    def get_options(self, obj):
        """
        Compute structured options from variant attributes.
        Preserves the order keys were first seen across variants.
        Returns: [{"name": "اللون", "position": 0, "values": ["أحمر", "أزرق"]}, ...]
        """
        keys_order = []
        values_map = {}
        for variant in obj.variants.filter(is_active=True).order_by('id'):
            for key, val in (variant.attributes or {}).items():
                if key not in keys_order:
                    keys_order.append(key)
                    values_map[key] = []
                if val and val not in values_map[key]:
                    values_map[key].append(val)
        return [
            {'name': key, 'position': i, 'values': values_map[key]}
            for i, key in enumerate(keys_order)
        ]


# ── Admin Product Review ──────────────────────────────────────────────────────

class AdminReviewProductSerializer(serializers.ModelSerializer):
    category = CategoryMiniSerializer(read_only=True)
    brand = BrandMiniSerializer(read_only=True)
    series = SeriesMiniSerializer(read_only=True)
    store = StoreInfoSerializer(read_only=True)
    variants = ProductVariantSerializer(many=True, read_only=True)
    images = VariantImageSerializer(source='variant_images', many=True, read_only=True)
    seller_info = serializers.SerializerMethodField()

    class Meta:
        model = Product
        fields = [
            'id', 'name', 'slug', 'description', 'sku',
            'category', 'brand', 'series', 'store',
            'variants', 'images',
            'is_active', 'is_featured', 'status',
            'review_deadline', 'created_at',
            'seller_info',
        ]

    def get_seller_info(self, obj):
        return {
            'id': obj.seller.id,
            'username': obj.seller.username,
            'email': obj.seller.email,
            'store_name': obj.store.name if obj.store else '',
        }


# ── Merchant write serializers ────────────────────────────────────────────────

class VariantWriteSerializer(serializers.Serializer):
    name = serializers.CharField(required=False, allow_blank=True, default='')
    sku = serializers.CharField(required=False, allow_blank=True, default='')
    price = serializers.DecimalField(max_digits=10, decimal_places=2)
    old_price = serializers.DecimalField(
        max_digits=10, decimal_places=2, required=False, allow_null=True, default=None
    )
    stock = serializers.IntegerField(default=0)
    image = serializers.CharField(
        required=False, allow_blank=True, allow_null=True, default=''
    )  # URL reference only — base64 is stripped
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
    category_name = serializers.CharField(required=False, allow_blank=True, default='', write_only=True)
    series_id = serializers.PrimaryKeyRelatedField(
        queryset=Series.objects.all(), source='series',
        required=False, allow_null=True, default=None,
    )
    series_name = serializers.CharField(required=False, allow_blank=True, default='', write_only=True)
    store_id = serializers.PrimaryKeyRelatedField(
        queryset=Store.objects.all(), source='store',
        required=False, allow_null=True, default=None,
    )

    class Meta:
        model = Product
        fields = [
            'name', 'description', 'category_id', 'category_name', 'brand_name',
            'series_id', 'series_name', 'store_id', 'sku', 'is_active', 'is_featured', 'variants',
        ]

    def _save_variants(self, product, variants_data):
        import uuid
        import base64
        from django.core.files.base import ContentFile
        from .models import VariantImage

        old_images = {img.image.url: img for img in VariantImage.objects.filter(product=product) if img.image}

        product.variants.all().delete()
        for vd in variants_data:
            image_data = vd.pop('image', None)
            
            if not vd.get('sku'):
                vd['sku'] = uuid.uuid4().hex[:10].upper()
            
            price = vd.get('price', 0)
            old_price = vd.get('old_price')
            if old_price and float(old_price) > float(price):
                vd['discount'] = round((float(old_price) - float(price)) / float(old_price) * 100)
            else:
                vd['discount'] = 0
            
            variant = ProductVariant.objects.create(product=product, **vd)

            if image_data:
                if image_data.startswith('data:image'):
                    try:
                        fmt, imgstr = image_data.split(';base64,')
                        ext = fmt.split('/')[-1]
                        file_name = f'variant_{variant.id}.{ext}'
                        file = ContentFile(base64.b64decode(imgstr), name=file_name)
                        var_img = VariantImage.objects.create(product=product, image=file, is_main=variant.is_main)
                        var_img.variants.add(variant)
                    except Exception:
                        pass
                else:
                    for url, img_obj in old_images.items():
                        if url == image_data or image_data.endswith(url):
                            img_obj.variants.add(variant)
                            break

    def _resolve_series(self, series_name, brand):
        if not series_name or not brand:
            return None
        series = Series.objects.filter(name__iexact=series_name, brand=brand).first()
        if series:
            return series
        base = slugify(f'{brand.slug}-{series_name}') or f'{brand.slug}-series'
        slug, counter = base, 1
        while Series.objects.filter(slug=slug).exists():
            slug = f'{base}-{counter}'
            counter += 1
        return Series.objects.create(name=series_name, brand=brand, slug=slug)

    def _resolve_category(self, category_name):
        if not category_name:
            return None
        category = Category.objects.filter(name__iexact=category_name).first()
        if category:
            return category
        base_slug = category_name.lower().replace(' ', '-')
        slug = base_slug
        counter = 1
        while Category.objects.filter(slug=slug).exists():
            slug = f'{base_slug}-{counter}'
            counter += 1
        return Category.objects.create(name=category_name, slug=slug)

    def _resolve_brand(self, brand_name):
        if not brand_name:
            return None
        brand = Brand.objects.filter(name__iexact=brand_name).first()
        if brand:
            return brand
        slug = brand_name.lower().replace(' ', '-')
        brand = Brand.objects.filter(slug=slug).first()
        if brand:
            return brand
        base_slug = slug
        counter = 1
        while Brand.objects.filter(slug=slug).exists():
            slug = f'{base_slug}-{counter}'
            counter += 1
        return Brand.objects.create(name=brand_name, slug=slug)

    def create(self, validated_data):
        variants_data = validated_data.pop('variants', [])
        brand_name = validated_data.pop('brand_name', '')
        category_name = validated_data.pop('category_name', '')
        series_name = validated_data.pop('series_name', '')
        validated_data['brand'] = self._resolve_brand(brand_name)
        if category_name and not validated_data.get('category'):
            validated_data['category'] = self._resolve_category(category_name)
        if series_name and not validated_data.get('series'):
            validated_data['series'] = self._resolve_series(series_name, validated_data.get('brand'))
        # Auto-set store from user if not provided
        if not validated_data.get('store'):
            request = self.context.get('request')
            if request:
                store = Store.objects.filter(owner=request.user).first()
                if store:
                    validated_data['store'] = store
        product = Product.objects.create(**validated_data)
        self._save_variants(product, variants_data)
        return product

    def update(self, instance, validated_data):
        variants_data = validated_data.pop('variants', None)
        brand_name = validated_data.pop('brand_name', None)
        category_name = validated_data.pop('category_name', '')
        series_name = validated_data.pop('series_name', '')
        if brand_name is not None:
            validated_data['brand'] = self._resolve_brand(brand_name)
        if category_name and not validated_data.get('category'):
            validated_data['category'] = self._resolve_category(category_name)
        resolved_brand = validated_data.get('brand') or instance.brand
        if series_name and not validated_data.get('series'):
            validated_data['series'] = self._resolve_series(series_name, resolved_brand)
        # Auto-set store from user if not provided
        if not validated_data.get('store') and not instance.store:
            request = self.context.get('request')
            if request:
                store = Store.objects.filter(owner=request.user).first()
                if store:
                    validated_data['store'] = store
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        if variants_data is not None:
            self._save_variants(instance, variants_data)
        return instance
