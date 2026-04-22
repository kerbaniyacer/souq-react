from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import NotificationViewSet, FollowViewSet

router = DefaultRouter()
router.register(r'notifications', NotificationViewSet, basename='notification')
router.register(r'follows', FollowViewSet, basename='follow')

urlpatterns = [
    path('', include(router.urls)),
]
