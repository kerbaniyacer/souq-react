from django.db import models
from apps.accounts.models import User

class Notification(models.Model):
    class Type(models.TextChoices):
        NEW_PRODUCT = 'new_product', 'منتج جديد من تاجر تتابعه'
        ORDER_STATUS_UPDATE = 'order_status_update', 'تحديث حالة الطلب'
        NEW_ORDER = 'new_order', 'طلب جديد مستلم'
        NEW_MESSAGE = 'new_message', 'رسالة جديدة'
        FOLLOW = 'follow', 'متابع جديد'
        GENERAL = 'general', 'إشعار عام'

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='notifications')
    type = models.CharField(max_length=50, choices=Type.choices, default=Type.GENERAL)
    title = models.CharField(max_length=255)
    message = models.TextField()
    
    # Optional link to related objects
    related_id = models.CharField(max_length=100, blank=True, default='')
    related_type = models.CharField(max_length=50, blank=True, default='') # 'product', 'order', 'chat'
    
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = 'إشعار'
        verbose_name_plural = 'الإشعارات'
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.user.username} - {self.title}"
