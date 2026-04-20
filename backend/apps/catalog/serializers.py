from rest_framework import serializers
from .models import Category, Brand, Product, ProductVariant, ProductAttribute, VariantImage


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
    images = VariantImageSerializer(many=True, read_only=True)
    image = serializers.SerializerMethodField()
    is_in_stock = serializers.BooleanField(read_only=True)

    class Meta:
        model = ProductVariant
        fields = [
            'id', 'product_id', 'product_name', 'product_slug', 'name', 'sku', 'price', 'old_price', 'discount',
            'stock', 'is_active', 'attributes', 'is_main',
            'images', 'image', 'is_in_stock', 'stock_status',
        ]

    def get_image(self, obj):
        """Return main image URL for this variant (from VariantImage table)."""
        url = obj.get_image  # @property on model
        return url


# ── Product List ──────────────────────────────────────────────────────────────

class ProductListSerializer(serializers.ModelSerializer):
    category = CategoryMiniSerializer(read_only=True)
    brand = BrandMiniSerializer(read_only=True)
    variants = ProductVariantSerializer(many=True, read_only=True)
    main_image = serializers.SerializerMethodField()
    min_price = serializers.SerializerMethodField()
    max_price = serializers.SerializerMethodField()

    class Meta:
        model = Product
        fields = [
            'id', 'name', 'slug', 'main_image', 'category', 'brand',
            'variants', 'min_price', 'max_price', 'rating', 'reviews_count', 
            'sold_count', 'is_featured', 'is_active', 'created_at', 'stock_status',
        ]

    def get_main_image(self, obj):
        """Get main image via Product.image property (from VariantImage)."""
        img_file = obj.image  # @property → ImageFieldFile or None
        if img_file:
            try:
                return img_file.url
            except Exception:
                pass
        return None

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
    variants = ProductVariantSerializer(many=True, read_only=True)
    attributes = ProductAttributeSerializer(many=True, read_only=True)
    seller = serializers.SerializerMethodField()
    main_image = serializers.SerializerMethodField()

    class Meta:
        model = Product
        fields = [
            'id', 'name', 'slug', 'description', 'main_image',
            'sku', 'category', 'brand', 'seller',
            'variants', 'attributes',
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
        return None

    def get_seller(self, obj):
        return {
            'id': obj.seller.id,
            'username': obj.seller.username,
            'store_name': getattr(getattr(obj.seller, 'profile', None), 'store_name', ''),
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

    class Meta:
        model = Product
        fields = [
            'name', 'description', 'category_id', 'brand_name',
            'sku', 'is_active', 'is_featured', 'variants',
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
