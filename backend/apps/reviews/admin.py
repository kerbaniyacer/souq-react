from django.contrib import admin
from .models import Review


@admin.register(Review)
class ReviewAdmin(admin.ModelAdmin):
    list_display = ['product', 'user', 'rating', 'verified', 'created_at']
    list_filter = ['rating', 'verified', 'created_at']
    search_fields = ['product__name', 'user__email', 'user__username', 'comment']
    raw_id_fields = ['product', 'user']
    readonly_fields = ['created_at', 'updated_at']
