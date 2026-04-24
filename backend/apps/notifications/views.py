from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import Notification
from .serializers import NotificationSerializer, FollowSerializer
from apps.accounts.models import Follow, User
from .utils import create_notification

class NotificationViewSet(viewsets.ModelViewSet):
    serializer_class = NotificationSerializer
    permission_classes = [permissions.IsAuthenticated]
    pagination_class = None

    def get_queryset(self):
        return Notification.objects.filter(user=self.request.user).order_by('-created_at')[:50]

    @action(detail=False, methods=['post'])
    def mark_as_read(self, request):
        notification_id = request.data.get('id')
        try:
            notification = Notification.objects.get(id=notification_id, user=request.user)
            notification.is_read = True
            notification.save()
            return Response({'status': 'notification marked as read'})
        except Notification.DoesNotExist:
            return Response({'detail': 'not found'}, status=status.HTTP_404_NOT_FOUND)

    def destroy(self, request, *args, **kwargs):
        """Delete a single notification owned by the user."""
        try:
            notification = Notification.objects.get(pk=kwargs['pk'], user=request.user)
            notification.delete()
            return Response(status=status.HTTP_204_NO_CONTENT)
        except Notification.DoesNotExist:
            return Response({'detail': 'not found'}, status=status.HTTP_404_NOT_FOUND)

    @action(detail=False, methods=['post'])
    def pin(self, request):
        """Toggle pin state for a notification."""
        notification_id = request.data.get('id')
        is_pinned = request.data.get('is_pinned', True)
        try:
            notification = Notification.objects.get(id=notification_id, user=request.user)
            notification.is_pinned = bool(is_pinned)
            notification.save(update_fields=['is_pinned'])
            return Response({'status': 'ok', 'is_pinned': notification.is_pinned})
        except Notification.DoesNotExist:
            return Response({'detail': 'not found'}, status=status.HTTP_404_NOT_FOUND)

    @action(detail=False, methods=['post'])
    def mark_all_as_read(self, request):
        Notification.objects.filter(user=request.user, is_read=False).update(is_read=True)
        return Response({'status': 'all notifications marked as read'})

    @action(detail=False, methods=['get'])
    def unread_count(self, request):
        count = Notification.objects.filter(user=request.user, is_read=False).count()
        return Response({'unread_count': count})

class FollowViewSet(viewsets.ModelViewSet):
    serializer_class = FollowSerializer
    permission_classes = [permissions.IsAuthenticated]
    pagination_class = None

    def get_queryset(self):
        return Follow.objects.filter(follower=self.request.user)

    def perform_create(self, serializer):
        following_user = serializer.validated_data['following']
        if following_user == self.request.user:
            raise Response({'detail': 'لا يمكنك متابعة نفسك'}, status=status.HTTP_400_BAD_REQUEST)
        
        follow, created = Follow.objects.get_or_create(
            follower=self.request.user,
            following=following_user
        )
        
        if created:
            # Notify the seller that they have a new follower
            create_notification(
                user=following_user,
                n_type=Notification.Type.FOLLOW,
                title='متابع جديد',
                message=f'لقد بدأ {self.request.user.username} بمتابعتك',
                related_id=self.request.user.id,
                related_type='user'
            )
        
        return follow

    @action(detail=False, methods=['post'], url_path='toggle/(?P<user_id>[^/.]+)')
    def toggle(self, request, user_id=None):
        try:
            target_user = User.objects.get(id=user_id)
        except User.DoesNotExist:
            return Response({'detail': 'المستخدم غير موجود'}, status=status.HTTP_404_NOT_FOUND)

        if target_user == request.user:
            return Response({'detail': 'لا يمكنك متابعة نفسك'}, status=status.HTTP_400_BAD_REQUEST)

        follow_qs = Follow.objects.filter(follower=request.user, following=target_user)
        
        if follow_qs.exists():
            follow_qs.delete()
            return Response({'status': 'unfollowed', 'is_following': False})
        else:
            Follow.objects.create(follower=request.user, following=target_user)
            # Notify
            create_notification(
                user=target_user,
                n_type=Notification.Type.FOLLOW,
                title='متابع جديد',
                message=f'لقد بدأ {request.user.username} بمتابعتك',
                related_id=request.user.id,
                related_type='user'
            )
            return Response({'status': 'followed', 'is_following': True})
