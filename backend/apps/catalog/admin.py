from django.contrib import admin
from django.utils.html import format_html
from .models import (
    Category, Brand,
    Product, ProductVariant, ProductImage, ProductAttribute,
)


# ── Category ──────────────────────────────────────────────────────────────────

@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display  = ['name', 'slug', 'parent', 'is_active', 'order']
    list_filter   = ['is_active', 'parent']
    search_fields = ['name', 'slug']
    prepopulated_fields = {'slug': ('name',)}
    list_editable = ['is_active', 'order']
    ordering      = ['order', 'name']


# ── Brand ─────────────────────────────────────────────────────────────────────

@admin.register(Brand)
class BrandAdmin(admin.ModelAdmin):
    list_display  = ['name', 'slug', 'is_active']
    list_filter   = ['is_active']
    search_fields = ['name', 'slug']
    prepopulated_fields = {'slug': ('name',)}
    list_editable = ['is_active']


# ── Variant inline ────────────────────────────────────────────────────────────

class ProductVariantInline(admin.TabularInline):
    model  = ProductVariant
    extra  = 0
    fields = ['name', 'sku', 'price', 'old_price', 'stock', 'is_main', 'is_active', 'order']
    ordering = ['order', 'id']


# ── Attribute inline ──────────────────────────────────────────────────────────

class ProductAttributeInline(admin.TabularInline):
    model  = ProductAttribute
    extra  = 0
    fields = ['name', 'value']


# ── Image inline ──────────────────────────────────────────────────────────────

class ProductImageInline(admin.TabularInline):
    model  = ProductImage
    extra  = 0
    fields = ['image', 'alt', 'order']


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
    autocomplete_fields = ['category', 'brand']
    readonly_fields   = ['created_at', 'updated_at', 'rating', 'reviews_count', 'sold_count']
    inlines = [ProductVariantInline, ProductAttributeInline, ProductImageInline]

    fieldsets = (
        ('المعلومات الأساسية', {
            'fields': ('seller', 'name', 'slug', 'description', 'sku', 'main_image'),
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
        url = obj.main_image.name if obj.main_image else ''
        if url:
            return format_html('<img src="{}" style="height:40px;border-radius:4px">', url)
        return '—'

    @admin.display(description='المتغيرات')
    def variant_count(self, obj):
        return obj.variants.count()


# ── ProductVariant standalone ─────────────────────────────────────────────────

@admin.register(ProductVariant)
class ProductVariantAdmin(admin.ModelAdmin):
    list_display  = ['product', 'name', 'sku', 'price', 'old_price', 'stock', 'is_main', 'is_active']
    list_filter   = ['is_active', 'is_main']
    search_fields = ['sku', 'name', 'product__name']
    list_editable = ['price', 'stock', 'is_active']
    raw_id_fields = ['product']


@admin.register(ProductImage)
class ProductImageAdmin(admin.ModelAdmin):
    list_display = ['product', 'alt', 'order']
    list_filter = ['product']
    search_fields = ['product__name', 'alt']
    list_editable = ['order']
    raw_id_fields = ['product']


@admin.register(ProductAttribute)
class ProductAttributeAdmin(admin.ModelAdmin):
    list_display = ['product', 'name', 'value']
    list_filter = ['product']
    search_fields = ['product__name', 'name', 'value']
    raw_id_fields = ['product']
