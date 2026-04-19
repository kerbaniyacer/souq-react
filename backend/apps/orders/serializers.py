from rest_framework import serializers
from .models import Order, OrderItem


class OrderItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = OrderItem
        fields = [
            'id', 'product_name', 'variant_name', 'variant_attributes',
            'product_price', 'quantity', 'subtotal',
        ]


class OrderSerializer(serializers.ModelSerializer):
    items = OrderItemSerializer(many=True, read_only=True)

    class Meta:
        model = Order
        fields = [
            'id', 'order_number', 'status', 'payment_method', 'payment_status',
            'shipping_full_name', 'shipping_phone', 'shipping_wilaya',
            'shipping_baladia', 'shipping_address',
            'subtotal', 'shipping_cost', 'discount', 'total_amount',
            'tracking_number', 'notes', 'items', 'created_at', 'updated_at',
        ]
        read_only_fields = [
            'id', 'order_number', 'status', 'payment_status',
            'subtotal', 'shipping_cost', 'total_amount',
            'tracking_number', 'items', 'created_at', 'updated_at',
        ]


class OrderCreateSerializer(serializers.Serializer):
    payment_method = serializers.ChoiceField(choices=Order.PaymentMethod.choices)
    shipping_full_name = serializers.CharField(max_length=200)
    shipping_phone = serializers.CharField(max_length=20)
    shipping_wilaya = serializers.CharField(max_length=100)
    shipping_baladia = serializers.CharField(max_length=100)
    shipping_address = serializers.CharField()
    notes = serializers.CharField(required=False, allow_blank=True, default='')
