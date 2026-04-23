from django.urls import path
from .views import (
    register, profile, change_password, CustomLoginView, social_login,
    verify_ip_login, login_history, profiles_list, admin_delete_user,
    admin_report_list, admin_report_delete, create_report, admin_user_detail, admin_action_log,
    admin_manage_action, submit_appeal, user_appeal_list, admin_appeal_list,
    admin_manage_appeal, password_reset_request, password_reset_confirm,
    public_submit_appeal, CustomTokenRefreshView, CustomLogoutView,
    complete_profile, public_profile
)

urlpatterns = [
    # Auth
    path('register/', register, name='auth-register'),
    path('login/', CustomLoginView.as_view(), name='auth-login'),
    path('verify-ip/', verify_ip_login, name='auth-verify-ip'),
    path('social/', social_login, name='auth-social'),
    path('refresh/', CustomTokenRefreshView.as_view(), name='auth-refresh'),
    path('logout/', CustomLogoutView.as_view(), name='auth-logout'),
    path('complete-profile/', complete_profile, name='auth-complete-profile'),

    # Profile
    path('profile/', profile, name='auth-profile'),
    path('profile/<str:username>/', public_profile, name='auth-public-profile'),
    path('change-password/', change_password, name='auth-change-password'),
    path('password-reset/', password_reset_request, name='auth-password-reset'),
    path('password-reset/confirm/', password_reset_confirm, name='auth-password-reset-confirm'),
    path('login-history/', login_history, name='auth-login-history'),
    path('profiles/', profiles_list, name='auth-profiles-list'),
    path('users/<int:pk>/', admin_user_detail, name='auth-admin-user-detail'),
    path('users/<int:pk>/delete/', admin_delete_user, name='auth-admin-delete-user'),
    
    # Reports
    path('reports/', create_report, name='auth-create-report'),
    path('admin/reports/', admin_report_list, name='auth-admin-report-list'),
    path('admin/reports/<int:pk>/', admin_report_delete, name='auth-admin-report-delete'),
    
    # Appeals
    path('appeals/', submit_appeal, name='auth-submit-appeal'),
    path('appeals/public/', public_submit_appeal, name='auth-public-submit-appeal'),
    path('appeals/list/', user_appeal_list, name='auth-user-appeal-list'),
    path('admin/appeals/', admin_appeal_list, name='auth-admin-appeal-list'),
    path('admin/appeals/<int:pk>/manage/', admin_manage_appeal, name='auth-admin-manage-appeal'),

    # Admin Actions & Logs
    path('admin/action-log/', admin_action_log, name='auth-admin-action-log'),
    path('admin/manage-action/<int:pk>/', admin_manage_action, name='auth-admin-manage-action'),
]
