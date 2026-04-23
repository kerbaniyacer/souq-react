from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from .models import User, Profile, LoginHistory, AdminActionLog, Report, Appeal


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    list_display = ['email', 'username', 'full_name', 'provider', 'is_staff', 'date_joined']
    list_filter = ['is_staff', 'is_superuser', 'provider', 'is_active']
    search_fields = ['email', 'username', 'first_name', 'last_name']
    ordering = ['-date_joined']
    fieldsets = BaseUserAdmin.fieldsets + (
        ('Social Auth', {'fields': ('provider', 'provider_id', 'photo')}),
    )


@admin.register(Profile)
class ProfileAdmin(admin.ModelAdmin):
    list_display = ['user', 'phone', 'wilaya', 'is_seller', 'store_name']
    list_filter = ['is_seller', 'wilaya']
    search_fields = ['user__email', 'store_name', 'phone']
    raw_id_fields = ['user']


@admin.register(LoginHistory)
class LoginHistoryAdmin(admin.ModelAdmin):
    list_display = ['user', 'ip_address', 'logged_at']
    list_filter = ['logged_at']
    search_fields = ['user__email', 'ip_address']
    readonly_fields = ['user', 'ip_address', 'user_agent', 'logged_at']


@admin.register(AdminActionLog)
class AdminActionLogAdmin(admin.ModelAdmin):
    list_display = ['admin_user', 'action', 'target_model', 'target_name', 'is_processed', 'created_at']
    list_filter = ['action', 'target_model', 'is_processed', 'created_at']
    search_fields = ['admin_user__username', 'target_name', 'reason']
    readonly_fields = ['admin_user', 'action', 'target_model', 'target_id', 'target_name', 'reason', 'before_state', 'after_state', 'is_processed', 'created_at']


@admin.register(Report)
class ReportAdmin(admin.ModelAdmin):
    list_display = ['report_type', 'reporter', 'reason', 'status', 'created_at']
    list_filter = ['report_type', 'status', 'created_at']
    search_fields = ['reporter__username', 'reason', 'description']
    raw_id_fields = ['reporter', 'target_product', 'target_user']


@admin.register(Appeal)
class AppealAdmin(admin.ModelAdmin):
    list_display = ['appeal_id', 'user', 'target_type', 'status', 'created_at']
    list_filter = ['target_type', 'status', 'created_at']
    search_fields = ['appeal_id', 'user__username', 'reason']
    raw_id_fields = ['user']
