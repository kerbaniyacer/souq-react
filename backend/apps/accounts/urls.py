from django.urls import path
from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
    TokenBlacklistView,
)
from .views import register, profile, change_password

urlpatterns = [
    # Auth
    path('register/', register, name='auth-register'),
    path('login/', TokenObtainPairView.as_view(), name='auth-login'),
    path('refresh/', TokenRefreshView.as_view(), name='auth-refresh'),
    path('logout/', TokenBlacklistView.as_view(), name='auth-logout'),

    # Profile
    path('profile/', profile, name='auth-profile'),
    path('change-password/', change_password, name='auth-change-password'),
]
