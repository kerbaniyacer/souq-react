from rest_framework import serializers
from .models import Review, SellerReview, BuyerReview, ReviewReply, ReviewImage


class ReviewReplySerializer(serializers.ModelSerializer):
    user_name = serializers.ReadOnlyField(source='user.username')

    class Meta:
        model = ReviewReply
        fields = ['user_name', 'content', 'created_at']


class ReviewImageSerializer(serializers.ModelSerializer):
    class Meta:
        model = ReviewImage
        fields = ['id', 'image']


class ReviewSerializer(serializers.ModelSerializer):
    user_name = serializers.SerializerMethodField()
    user_username = serializers.ReadOnlyField(source='user.username')
    user_photo = serializers.SerializerMethodField()
    official_reply = ReviewReplySerializer(read_only=True)
    images = ReviewImageSerializer(many=True, read_only=True)
    product_name = serializers.ReadOnlyField(source='product.name')
    product_slug = serializers.ReadOnlyField(source='product.slug')

    class Meta:
        model = Review
        fields = [
            'id', 'product', 'product_name', 'product_slug', 'user', 'user_username', 'user_name', 'user_photo',
            'rating', 'comment', 'verified', 'is_visible', 'official_reply', 'images', 'created_at',
        ]
        read_only_fields = ['id', 'user', 'user_name', 'user_photo', 'verified', 'is_visible', 'created_at']

    def get_user_name(self, obj):
        return obj.user.full_name or obj.user.username

    def get_user_photo(self, obj):
        if obj.user.photo:
            request = self.context.get('request')
            url = obj.user.photo.url
            return request.build_absolute_uri(url) if request else url
        return None


class SellerReviewSerializer(serializers.ModelSerializer):
    buyer_name = serializers.ReadOnlyField(source='buyer.username')
    official_reply = ReviewReplySerializer(read_only=True)
    product_names = serializers.SerializerMethodField()

    class Meta:
        model = SellerReview
        fields = ['id', 'sub_order', 'seller', 'buyer', 'buyer_name', 'rating', 'shipping_rating', 'comment', 'product_names', 'is_visible', 'official_reply', 'created_at']
        read_only_fields = ['id', 'buyer', 'seller', 'sub_order', 'is_visible', 'created_at']

    def get_product_names(self, obj):
        if not obj.sub_order:
            return ""
        return ", ".join([item.product_name for item in obj.sub_order.items.all()])


class BuyerReviewSerializer(serializers.ModelSerializer):
    seller_name = serializers.ReadOnlyField(source='seller.username')
    official_reply = ReviewReplySerializer(read_only=True)
    product_names = serializers.SerializerMethodField()

    class Meta:
        model = BuyerReview
        fields = ['id', 'sub_order', 'buyer', 'seller', 'seller_name', 'rating', 'comment', 'product_names', 'is_visible', 'official_reply', 'created_at']
        read_only_fields = ['id', 'seller', 'buyer', 'sub_order', 'is_visible', 'created_at']

    def get_product_names(self, obj):
        if not obj.sub_order:
            return ""
        return ", ".join([item.product_name for item in obj.sub_order.items.all()])
