from rest_framework import serializers
from .models import Review, SellerReview, BuyerReview, ReviewReply


class ReviewReplySerializer(serializers.ModelSerializer):
    user_name = serializers.ReadOnlyField(source='user.username')

    class Meta:
        model = ReviewReply
        fields = ['user_name', 'content', 'created_at']


class ReviewSerializer(serializers.ModelSerializer):
    user_name = serializers.SerializerMethodField()
    user_photo = serializers.SerializerMethodField()
    official_reply = ReviewReplySerializer(read_only=True)

    class Meta:
        model = Review
        fields = [
            'id', 'product', 'user', 'user_name', 'user_photo',
            'rating', 'comment', 'verified', 'is_visible', 'official_reply', 'created_at',
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

    class Meta:
        model = SellerReview
        fields = ['id', 'order', 'seller', 'buyer', 'buyer_name', 'rating', 'comment', 'is_visible', 'official_reply', 'created_at']
        read_only_fields = ['id', 'buyer', 'is_visible', 'created_at']


class BuyerReviewSerializer(serializers.ModelSerializer):
    seller_name = serializers.ReadOnlyField(source='seller.username')
    official_reply = ReviewReplySerializer(read_only=True)

    class Meta:
        model = BuyerReview
        fields = ['id', 'order', 'buyer', 'seller', 'seller_name', 'rating', 'comment', 'is_visible', 'official_reply', 'created_at']
        read_only_fields = ['id', 'seller', 'is_visible', 'created_at']
