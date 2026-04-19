from django.contrib import admin
from .models import Cart, CartItem


class CartItemInline(admin.TabularInline):
    model = CartItem
    extra = 0
    fields = ['variant', 'quantity', 'created_at', 'updated_at']
    readonly_fields = ['created_at', 'updated_at']
    raw_id_fields = ['variant']


@admin.register(Cart)
class CartAdmin(admin.ModelAdmin):
    list_display = ['id', 'user', 'session_key', 'items_count_admin', 'total_admin', 'updated_at']
    list_filter = ['created_at', 'updated_at']
    search_fields = ['user__email', 'user__username', 'session_key']
    raw_id_fields = ['user']
    readonly_fields = ['created_at', 'updated_at', 'items_count_admin', 'total_admin']
    inlines = [CartItemInline]

    @admin.display(description='عدد العناصر')
    def items_count_admin(self, obj):
        return obj.items_count

    @admin.display(description='الإجمالي')
    def total_admin(self, obj):
        return obj.total


@admin.register(CartItem)
class CartItemAdmin(admin.ModelAdmin):
    list_display = ['cart', 'variant', 'quantity', 'subtotal_admin', 'updated_at']
    list_filter = ['created_at', 'updated_at']
    search_fields = ['cart__user__email', 'variant__product__name', 'variant__name', 'variant__sku']
    raw_id_fields = ['cart', 'variant']
    readonly_fields = ['created_at', 'updated_at', 'subtotal_admin']

    @admin.display(description='المجموع')
    def subtotal_admin(self, obj):
        return obj.subtotal
