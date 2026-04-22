from rest_framework import serializers
from .models import Conversation, Message
from apps.accounts.serializers import UserSerializer
from apps.catalog.serializers import ProductListSerializer

class MessageSerializer(serializers.ModelSerializer):
    sender_name = serializers.ReadOnlyField(source='sender.username')
    
    class Meta:
        model = Message
        fields = ['id', 'conversation', 'sender', 'sender_name', 'content', 'is_read', 'created_at']
        read_only_fields = ['sender', 'is_read', 'created_at']

class ConversationSerializer(serializers.ModelSerializer):
    customer_details = UserSerializer(source='customer', read_only=True)
    seller_details = UserSerializer(source='seller', read_only=True)
    product_details = ProductListSerializer(source='product', read_only=True)
    last_message = serializers.SerializerMethodField()
    unread_count = serializers.SerializerMethodField()

    class Meta:
        model = Conversation
        fields = [
            'id', 'customer', 'seller', 'product', 
            'customer_details', 'seller_details', 'product_details', 
            'last_message', 'unread_count', 'created_at', 'updated_at'
        ]

    def get_last_message(self, obj):
        last_msg = obj.messages.last()
        if last_msg:
            return MessageSerializer(last_msg).data
        return None

    def get_unread_count(self, obj):
        request = self.context.get('request')
        if not request or not request.user.is_authenticated:
            return 0
        return obj.messages.filter(is_read=False).exclude(sender=request.user).count()
