from rest_framework import serializers
from .models import Order, OrderItem, PaymentProof


class OrderItemSerializer(serializers.ModelSerializer):
    seller_id = serializers.IntegerField(source='variant.product.seller_id', read_only=True)
    seller_name = serializers.CharField(source='variant.product.seller.username', read_only=True)
    ccp_number = serializers.CharField(source='variant.product.seller.profile.ccp_number', read_only=True)
    ccp_name = serializers.CharField(source='variant.product.seller.profile.ccp_name', read_only=True)
    baridimob_id = serializers.CharField(source='variant.product.seller.profile.baridimob_id', read_only=True)

    class Meta:
        model = OrderItem
        fields = [
            'id', 'product_name', 'variant_name', 'variant_attributes',
            'product_price', 'quantity', 'subtotal', 'seller_id', 'seller_name',
            'ccp_number', 'ccp_name', 'baridimob_id',
        ]


class PaymentProofSerializer(serializers.ModelSerializer):
    class Meta:
        model = PaymentProof
        fields = [
            'id', 'seller', 'image', 'transaction_id', 'amount', 'status',
            'rejection_reason', 'created_at', 'updated_at',
        ]


class OrderSerializer(serializers.ModelSerializer):
    items = OrderItemSerializer(many=True, read_only=True)
    proofs = PaymentProofSerializer(many=True, read_only=True)

    # Expose shipping fields with the frontend-friendly names
    full_name = serializers.CharField(source='shipping_full_name', read_only=True)
    phone     = serializers.CharField(source='shipping_phone',     read_only=True)
    wilaya    = serializers.CharField(source='shipping_wilaya',    read_only=True)
    baladia   = serializers.CharField(source='shipping_baladia',   read_only=True)
    address   = serializers.CharField(source='shipping_address',   read_only=True)

    class Meta:
        model = Order
        fields = [
            'id', 'order_number', 'status', 'payment_method', 'payment_status',
            # frontend-friendly aliases
            'full_name', 'phone', 'wilaya', 'baladia', 'address',
            'subtotal', 'shipping_cost', 'discount', 'total_amount',
            'tracking_number', 'notes', 'items', 'proofs', 'created_at', 'updated_at',
        ]
        read_only_fields = [
            'id', 'order_number', 'status', 'payment_status',
            'subtotal', 'shipping_cost', 'total_amount',
            'tracking_number', 'items', 'proofs', 'created_at', 'updated_at',
        ]


class OrderCreateSerializer(serializers.Serializer):
    """Accepts the flat names that Checkout.tsx sends."""
    payment_method = serializers.ChoiceField(choices=Order.PaymentMethod.choices)
    full_name      = serializers.CharField(max_length=200)
    phone          = serializers.CharField(max_length=20)
    wilaya         = serializers.CharField(max_length=100)
    baladia        = serializers.CharField(max_length=100)
    address        = serializers.CharField()
    notes          = serializers.CharField(required=False, allow_blank=True, default='')
    # optional — ignored by the backend but accepted so Checkout.tsx does not throw
    email          = serializers.EmailField(required=False, allow_blank=True, default='')
    postal_code    = serializers.CharField(required=False, allow_blank=True, default='')
