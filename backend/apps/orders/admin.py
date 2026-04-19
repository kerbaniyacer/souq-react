from django.contrib import admin
from .models import Order, OrderItem


class OrderItemInline(admin.TabularInline):
    model = OrderItem
    extra = 0
    fields = [
        'variant', 'product_name', 'variant_name', 'product_price',
        'quantity', 'subtotal',
    ]
    readonly_fields = fields
    raw_id_fields = ['variant']


@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    list_display = [
        'order_number', 'user', 'status', 'payment_method', 'payment_status',
        'total_amount', 'shipping_wilaya', 'created_at',
    ]
    list_filter = ['status', 'payment_method', 'payment_status', 'shipping_wilaya', 'created_at']
    search_fields = [
        'order_number', 'user__email', 'user__username',
        'shipping_full_name', 'shipping_phone', 'tracking_number',
    ]
    raw_id_fields = ['user']
    readonly_fields = ['order_number', 'created_at', 'updated_at']
    inlines = [OrderItemInline]


@admin.register(OrderItem)
class OrderItemAdmin(admin.ModelAdmin):
    list_display = ['order', 'product_name', 'variant_name', 'quantity', 'product_price', 'subtotal']
    list_filter = ['order__status', 'order__created_at']
    search_fields = ['order__order_number', 'product_name', 'variant_name']
    raw_id_fields = ['order', 'variant']
