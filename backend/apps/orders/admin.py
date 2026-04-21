from django.contrib import admin
from django.utils.html import format_html
from .models import Order, OrderItem


class OrderItemInline(admin.TabularInline):
    model = OrderItem
    extra = 0
    fields = ['variant', 'product_name', 'variant_name', 'product_price', 'quantity', 'subtotal']
    readonly_fields = ['variant', 'product_name', 'variant_name', 'product_price', 'quantity', 'subtotal']
    raw_id_fields = ['variant']
    can_delete = False


@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    list_display = [
        'order_number', 'user', 'shipping_full_name', 'shipping_wilaya',
        'status_badge', 'payment_method', 'formatted_total', 'created_at',
    ]
    list_filter   = ['status', 'payment_method', 'payment_status', 'shipping_wilaya', 'created_at']
    search_fields = [
        'order_number', 'user__email', 'user__username',
        'shipping_full_name', 'shipping_phone', 'tracking_number',
    ]
    raw_id_fields   = ['user']
    readonly_fields = ['order_number', 'subtotal', 'total_amount', 'created_at', 'updated_at']
    ordering        = ['-created_at']
    inlines         = [OrderItemInline]
    list_per_page   = 25

    fieldsets = (
        ('معلومات الطلب', {
            'fields': ('order_number', 'user', 'status', 'payment_method', 'payment_status'),
        }),
        ('معلومات الشحن', {
            'fields': (
                'shipping_full_name', 'shipping_phone',
                'shipping_wilaya', 'shipping_baladia', 'shipping_address',
            ),
        }),
        ('المبالغ', {
            'fields': ('subtotal', 'shipping_cost', 'discount', 'total_amount'),
        }),
        ('تفاصيل إضافية', {
            'fields': ('tracking_number', 'notes', 'created_at', 'updated_at'),
            'classes': ('collapse',),
        }),
    )

    STATUS_COLORS = {
        'pending':    '#f59e0b',
        'confirmed':  '#3b82f6',
        'processing': '#8b5cf6',
        'shipped':    '#6366f1',
        'delivered':  '#10b981',
        'cancelled':  '#ef4444',
        'refunded':   '#6b7280',
    }

    @admin.display(description='الحالة', ordering='status')
    def status_badge(self, obj):
        color = self.STATUS_COLORS.get(obj.status, '#6b7280')
        return format_html(
            '<span style="background:{};color:#fff;padding:3px 12px;'
            'border-radius:12px;font-size:12px;font-weight:600">{}</span>',
            color, obj.get_status_display(),
        )

    @admin.display(description='الإجمالي', ordering='total_amount')
    def formatted_total(self, obj):
        return format_html('<strong>{} دج</strong>', f"{obj.total_amount:,.0f}")


@admin.register(OrderItem)
class OrderItemAdmin(admin.ModelAdmin):
    list_display    = ['order', 'product_name', 'variant_name', 'quantity', 'product_price', 'subtotal']
    list_filter     = ['order__status', 'order__created_at']
    search_fields   = ['order__order_number', 'product_name', 'variant_name']
    raw_id_fields   = ['order', 'variant']
    readonly_fields = ['subtotal']
