from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db.models import Q
from .models import Conversation, Message
from .serializers import ConversationSerializer, MessageSerializer

class ConversationViewSet(viewsets.ModelViewSet):
    serializer_class = ConversationSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        return Conversation.objects.filter(Q(customer=user) | Q(seller=user))

    @action(detail=False, methods=['post'], url_path='get-or-create')
    def get_or_create(self, request):
        seller_id = request.data.get('seller_id')
        product_id = request.data.get('product_id')
        customer = request.user

        if not seller_id:
            return Response({'error': 'seller_id is required'}, status=status.HTTP_400_BAD_REQUEST)

        # Try to find existing conversation
        conversation = Conversation.objects.filter(
            customer=customer,
            seller_id=seller_id,
            product_id=product_id
        ).first()

        if not conversation:
            conversation = Conversation.objects.create(
                customer=customer,
                seller_id=seller_id,
                product_id=product_id
            )

        serializer = self.get_serializer(conversation)
        return Response(serializer.data)

    @action(detail=True, methods=['get'])
    def messages(self, request, pk=None):
        conversation = self.get_object()
        messages = conversation.messages.all()
        
        # Mark as read
        messages.exclude(sender=request.user).update(is_read=True)
        
        serializer = MessageSerializer(messages, many=True)
        return Response(serializer.data)

class MessageViewSet(viewsets.ModelViewSet):
    serializer_class = MessageSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        return Message.objects.filter(
            Q(conversation__customer=user) | Q(conversation__seller=user)
        ).distinct()

    def perform_create(self, serializer):
        conversation_id = self.request.data.get('conversation')
        try:
            conversation = Conversation.objects.get(id=conversation_id)
        except Conversation.DoesNotExist:
            return Response({'error': 'Conversation not found'}, status=status.HTTP_404_NOT_FOUND)
        
        # Security check
        if self.request.user not in [conversation.customer, conversation.seller]:
            raise permissions.PermissionDenied("You are not part of this conversation")
            
        message = serializer.save(sender=self.request.user)
        
        # Notify receiver
        try:
            receiver = conversation.seller if self.request.user == conversation.customer else conversation.customer
            from apps.notifications.utils import create_notification
            from apps.notifications.models import Notification
            create_notification(
                user=receiver,
                n_type=Notification.Type.NEW_MESSAGE,
                title='رسالة جديدة',
                message=f'لديك رسالة جديدة من {self.request.user.username}',
                related_id=conversation.id,
                related_type='chat'
            )
        except Exception as e:
            print(f"Error notifying receiver of new message: {e}")

        # Update conversation timestamp for sorting
        conversation.save()
