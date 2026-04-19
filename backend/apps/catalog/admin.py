from django.contrib import admin
from django.utils.html import format_html
from .models import (
    Category, Brand,
    Product, ProductVariant, ProductAttribute,
    VariantImage, ProductVideo, AttributeValue,
)


# ── Category ──────────────────────────────────────────────────────────────────

@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display  = ['name', 'slug', 'parent', 'is_active', 'products_count']
    list_filter   = ['is_active', 'parent']
    search_fields = ['name', 'slug']
    prepopulated_fields = {'slug': ('name',)}
    list_editable = ['is_active']
    ordering      = ['name']

    @admin.display(description='المنتجات')
    def products_count(self, obj):
        return obj.products.filter(is_active=True).count()


# ── Brand ─────────────────────────────────────────────────────────────────────

@admin.register(Brand)
class BrandAdmin(admin.ModelAdmin):
    list_display  = ['name', 'slug', 'country', 'created_at']
    search_fields = ['name', 'slug', 'country']
    prepopulated_fields = {'slug': ('name',)}
    ordering      = ['-created_at']


# ── Variant Image inline ──────────────────────────────────────────────────────

class VariantImageInline(admin.TabularInline):
    model  = VariantImage
    extra  = 0
    fields = ['image', 'alt_text', 'is_main']
    verbose_name = 'صورة متغير'
    verbose_name_plural = 'صور المتغيرات'


# ── Variant inline ────────────────────────────────────────────────────────────

class ProductVariantInline(admin.TabularInline):
    model  = ProductVariant
    extra  = 0
    fields = ['name', 'sku', 'price', 'old_price', 'discount', 'stock', 'is_main', 'is_active']
    ordering = ['id']


# ── Attribute inline ──────────────────────────────────────────────────────────

class ProductAttributeInline(admin.TabularInline):
    model  = ProductAttribute
    extra  = 0
    fields = ['name', 'value']


# ── Video inline ──────────────────────────────────────────────────────────────

class ProductVideoInline(admin.TabularInline):
    model  = ProductVideo
    extra  = 0
    fields = ['video']


# ── Product ───────────────────────────────────────────────────────────────────

@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display  = [
        'thumb', 'name', 'seller', 'category', 'brand',
        'variant_count', 'rating', 'sold_count',
        'is_active', 'is_featured', 'created_at',
    ]
    list_filter   = ['is_active', 'is_featured', 'category', 'brand', 'seller']
    search_fields = ['name', 'slug', 'sku', 'seller__email']
    prepopulated_fields = {'slug': ('name',)}
    list_editable = ['is_active', 'is_featured']
    raw_id_fields = ['seller']
    readonly_fields   = ['created_at', 'updated_at', 'rating', 'reviews_count', 'sold_count']
    inlines = [ProductVariantInline, VariantImageInline, ProductAttributeInline, ProductVideoInline]

    fieldsets = (
        ('المعلومات الأساسية', {
            'fields': ('seller', 'name', 'slug', 'description', 'sku'),
        }),
        ('التصنيف', {
            'fields': ('category', 'brand'),
        }),
        ('الحالة', {
            'fields': ('is_active', 'is_featured'),
        }),
        ('الإحصائيات', {
            'fields': ('rating', 'reviews_count', 'sold_count', 'created_at', 'updated_at'),
            'classes': ('collapse',),
        }),
    )

    @admin.display(description='صورة')
    def thumb(self, obj):
        img_file = obj.image  # @property — gets from VariantImage
        if img_file:
            try:
                return format_html('<img src="{}" style="height:40px;border-radius:4px">', img_file.url)
            except Exception:
                pass
        return '—'

    @admin.display(description='المتغيرات')
    def variant_count(self, obj):
        return obj.variants.count()


# ── ProductVariant standalone ─────────────────────────────────────────────────

@admin.register(ProductVariant)
class ProductVariantAdmin(admin.ModelAdmin):
    list_display  = ['product', 'name', 'sku', 'price', 'old_price', 'discount', 'stock', 'is_main', 'is_active']
    list_filter   = ['is_active', 'is_main']
    search_fields = ['sku', 'name', 'product__name']
    list_editable = ['price', 'stock', 'is_active']
    raw_id_fields = ['product']


# ── VariantImage standalone ───────────────────────────────────────────────────

@admin.register(VariantImage)
class VariantImageAdmin(admin.ModelAdmin):
    list_display  = ['thumb', 'product', 'alt_text', 'is_main', 'created_at']
    list_filter   = ['is_main', 'product']
    search_fields = ['product__name', 'alt_text']
    raw_id_fields = ['product']

    @admin.display(description='صورة')
    def thumb(self, obj):
        if obj.image:
            try:
                return format_html('<img src="{}" style="height:40px;border-radius:4px">', obj.image.url)
            except Exception:
                pass
        return '—'


# ── ProductAttribute standalone ───────────────────────────────────────────────

@admin.register(ProductAttribute)
class ProductAttributeAdmin(admin.ModelAdmin):
    list_display  = ['product', 'name', 'value']
    search_fields = ['product__name', 'name', 'value']
    raw_id_fields = ['product']


# ── ProductVideo standalone ───────────────────────────────────────────────────

@admin.register(ProductVideo)
class ProductVideoAdmin(admin.ModelAdmin):
    list_display  = ['product', 'video']
    search_fields = ['product__name']
    raw_id_fields = ['product']
