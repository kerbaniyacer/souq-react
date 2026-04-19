from django.urls import path
from rest_framework_simplejwt.views import (
    TokenRefreshView,
    TokenBlacklistView,
)
from .views import register, profile, change_password, CustomLoginView, social_login, verify_ip_login

urlpatterns = [
    # Auth
    path('register/', register, name='auth-register'),
    path('login/', CustomLoginView.as_view(), name='auth-login'),
    path('verify-ip/', verify_ip_login, name='auth-verify-ip'),
    path('social/', social_login, name='auth-social'),
    path('refresh/', TokenRefreshView.as_view(), name='auth-refresh'),
    path('logout/', TokenBlacklistView.as_view(), name='auth-logout'),

    # Profile
    path('profile/', profile, name='auth-profile'),
    path('change-password/', change_password, name='auth-change-password'),
]
