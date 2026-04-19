from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from .models import User, Profile, LoginHistory


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
