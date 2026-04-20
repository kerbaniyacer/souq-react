from django.urls import path
from rest_framework_simplejwt.views import (
    TokenRefreshView,
    TokenBlacklistView,
)
from .views import (
    register, profile, change_password, CustomLoginView, social_login, 
    verify_ip_login, login_history, profiles_list, admin_delete_user,
    admin_report_list, create_report, admin_user_detail, admin_action_log,
    admin_manage_action
)

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
    path('login-history/', login_history, name='auth-login-history'),
    path('profiles/', profiles_list, name='auth-profiles-list'),
    path('users/<int:pk>/', admin_user_detail, name='auth-admin-user-detail'),
    path('users/<int:pk>/delete/', admin_delete_user, name='auth-admin-delete-user'),
    
    # Reports
    path('reports/', create_report, name='auth-create-report'),
    path('admin/reports/', admin_report_list, name='auth-admin-report-list'),
    # Admin Actions & Logs
    path('admin/action-log/', admin_action_log, name='auth-admin-action-log'),
    path('admin/manage-action/<int:pk>/', admin_manage_action, name='auth-admin-manage-action'),
]
