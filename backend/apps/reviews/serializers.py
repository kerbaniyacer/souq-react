from rest_framework import serializers
from .models import Review


class ReviewSerializer(serializers.ModelSerializer):
    user_name  = serializers.SerializerMethodField()
    user_photo = serializers.SerializerMethodField()

    class Meta:
        model = Review
        fields = [
            'id', 'product', 'user', 'user_name', 'user_photo',
            'rating', 'comment', 'verified', 'created_at',
        ]
        read_only_fields = ['id', 'user', 'user_name', 'user_photo', 'verified', 'created_at']

    def get_user_name(self, obj):
        return obj.user.full_name or obj.user.username

    def get_user_photo(self, obj):
        if obj.user.photo:
            request = self.context.get('request')
            url = obj.user.photo.url
            return request.build_absolute_uri(url) if request else url
        return None
