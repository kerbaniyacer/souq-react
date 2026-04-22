from rest_framework import serializers
from .models import Order, OrderItem, PaymentProof, SubOrder


class OrderItemSerializer(serializers.ModelSerializer):
    seller_id = serializers.SerializerMethodField()
    seller_name = serializers.SerializerMethodField()
    ccp_number = serializers.SerializerMethodField()
    ccp_name = serializers.SerializerMethodField()
    baridimob_id = serializers.SerializerMethodField()

    product_id = serializers.SerializerMethodField()
    product_slug = serializers.SerializerMethodField()
    is_rated = serializers.SerializerMethodField()

    def _get_variant_product(self, obj):
        variant = getattr(obj, 'variant', None)
        return getattr(variant, 'product', None)

    def _get_seller(self, obj):
        product = self._get_variant_product(obj)
        return getattr(product, 'seller', None)

    def get_seller_id(self, obj):
        seller = self._get_seller(obj)
        return getattr(seller, 'id', None)

    def get_seller_name(self, obj):
        seller = self._get_seller(obj)
        return getattr(seller, 'username', None)

    def get_ccp_number(self, obj):
        seller = self._get_seller(obj)
        profile = getattr(seller, 'profile', None)
        return getattr(profile, 'ccp_number', '')

    def get_ccp_name(self, obj):
        seller = self._get_seller(obj)
        profile = getattr(seller, 'profile', None)
        return getattr(profile, 'ccp_name', '')

    def get_baridimob_id(self, obj):
        seller = self._get_seller(obj)
        profile = getattr(seller, 'profile', None)
        return getattr(profile, 'baridimob_id', '')

    def get_product_id(self, obj):
        product = self._get_variant_product(obj)
        return getattr(product, 'id', None)

    def get_product_slug(self, obj):
        product = self._get_variant_product(obj)
        return getattr(product, 'slug', None)

    def get_is_rated(self, obj):
        from apps.reviews.models import Review
        request = self.context.get('request')
        if not request or not request.user or request.user.is_anonymous:
            return False
        product = self._get_variant_product(obj)
        if not product:
            return False
        return Review.objects.filter(product=product, user=request.user).exists()

    class Meta:
        model = OrderItem
        fields = [
            'id', 'product_id', 'product_slug', 'product_name', 'variant_name', 'variant_attributes',
            'product_price', 'quantity', 'subtotal', 'seller_id', 'seller_name',
            'ccp_number', 'ccp_name', 'baridimob_id', 'is_rated',
        ]


class PaymentProofSerializer(serializers.ModelSerializer):
    class Meta:
        model = PaymentProof
        fields = [
            'id', 'seller', 'image', 'transaction_id', 'amount', 'status',
            'rejection_reason', 'created_at', 'updated_at',
        ]


class OrderCreateSerializer(serializers.Serializer):
    full_name = serializers.CharField(max_length=200)
    phone = serializers.CharField(max_length=20)
    wilaya = serializers.CharField(max_length=100)
    baladia = serializers.CharField(max_length=100)
    address = serializers.CharField()
    payment_method = serializers.ChoiceField(choices=Order.PaymentMethod.choices)
    notes = serializers.CharField(required=False, allow_blank=True)


class SubOrderSerializer(serializers.ModelSerializer):
    items = OrderItemSerializer(many=True, read_only=True)
    seller_username = serializers.CharField(source='seller.username', read_only=True)
    buyer_username = serializers.CharField(source='order.user.username', read_only=True)
    order_number = serializers.CharField(source='order.order_number', read_only=True)
    
    # Customer info from parent order
    full_name = serializers.CharField(source='order.shipping_full_name', read_only=True)
    phone = serializers.CharField(source='order.shipping_phone', read_only=True)
    address = serializers.CharField(source='order.shipping_address', read_only=True)
    wilaya = serializers.CharField(source='order.shipping_wilaya', read_only=True)
    baladia = serializers.CharField(source='order.shipping_baladia', read_only=True)
    
    # Payment info from parent order
    payment_method = serializers.CharField(source='order.payment_method', read_only=True)
    payment_status = serializers.CharField(source='order.payment_status', read_only=True)
    total_amount = serializers.DecimalField(source='order.total_amount', max_digits=12, decimal_places=2, read_only=True)

    # Dynamic proofs based on seller
    proofs = serializers.SerializerMethodField()
    is_rated_by_seller = serializers.SerializerMethodField()
    is_rated_by_buyer = serializers.SerializerMethodField()

    def get_proofs(self, obj):
        proofs = PaymentProof.objects.filter(order=obj.order, seller=obj.seller)
        return PaymentProofSerializer(proofs, many=True).data

    def get_is_rated_by_seller(self, obj):
        from apps.reviews.models import BuyerReview
        return BuyerReview.objects.filter(sub_order=obj).exists()

    def get_is_rated_by_buyer(self, obj):
        from apps.reviews.models import SellerReview
        return SellerReview.objects.filter(sub_order=obj).exists()

    class Meta:
        model = SubOrder
        fields = [
            'id', 'order_number', 'status', 'subtotal', 'total_amount', 
            'seller_username', 'buyer_username',
            'payment_method', 'payment_status',
            'full_name', 'phone', 'address', 'wilaya', 'baladia',
            'is_rated_by_seller', 'is_rated_by_buyer',
            'items', 'proofs', 'created_at', 'updated_at'
        ]


class OrderSerializer(serializers.ModelSerializer):
    items = OrderItemSerializer(many=True, read_only=True)
    proofs = PaymentProofSerializer(many=True, read_only=True)
    sub_orders = SubOrderSerializer(many=True, read_only=True)
    buyer_name = serializers.CharField(source='user.get_full_name', read_only=True)
    buyer_email = serializers.EmailField(source='user.email', read_only=True)

    # Aliases for frontend compatibility
    full_name = serializers.CharField(source='shipping_full_name', read_only=True)
    phone = serializers.CharField(source='shipping_phone', read_only=True)
    wilaya = serializers.CharField(source='shipping_wilaya', read_only=True)
    baladia = serializers.CharField(source='shipping_baladia', read_only=True)
    address = serializers.CharField(source='shipping_address', read_only=True)

    class Meta:
        model = Order
        fields = [
            'id', 'order_number', 'status', 'payment_method', 'payment_status',
            'shipping_full_name', 'shipping_phone', 'shipping_wilaya',
            'shipping_baladia', 'shipping_address', 
            'full_name', 'phone', 'wilaya', 'baladia', 'address',
            'subtotal', 'shipping_cost',
            'discount', 'total_amount', 'tracking_number', 'notes',
            'created_at', 'updated_at', 'items', 'proofs', 'sub_orders',
            'buyer_name', 'buyer_email'
        ]

    def to_representation(self, instance):
        data = super().to_representation(instance)
        request = self.context.get('request')
        
        # If the requester is a merchant, only show their relevant items and proofs
        if request and request.user.is_authenticated and not request.user.is_staff:
            if hasattr(request.user, 'profile') and request.user.profile.is_seller:
                data['items'] = [i for i in data['items'] if i['seller_id'] == request.user.id]
                data['proofs'] = [p for p in data['proofs'] if p['seller'] == request.user.id]
        
        return data
