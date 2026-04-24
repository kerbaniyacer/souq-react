from django.db import models
from apps.accounts.models import User

class Notification(models.Model):
    class Type(models.TextChoices):
        NEW_PRODUCT = 'new_product', 'منتج جديد من تاجر تتابعه'
        ORDER_STATUS_UPDATE = 'order_status_update', 'تحديث حالة الطلب'
        NEW_ORDER = 'new_order', 'طلب جديد مستلم'
        ORDER_CANCELLED = 'order_cancelled', 'تم إلغاء الطلب'
        NEW_MESSAGE = 'new_message', 'رسالة جديدة'
        FOLLOW = 'follow', 'متابع جديد'
        PAYMENT_SUBMITTED = 'payment_submitted', 'وصل دفع جديد مُرفق'
        PAYMENT_APPROVED = 'payment_approved', 'تم قبول وصل الدفع'
        PAYMENT_REJECTED = 'payment_rejected', 'تم رفض وصل الدفع'
        NEW_REVIEW = 'new_review', 'تقييم جديد'
        REVIEW_REPLY = 'review_reply', 'رد على تقييمك'
        APPEAL_SUBMITTED = 'appeal_submitted', 'طعن جديد للمراجعة'
        APPEAL_DECISION = 'appeal_decision', 'قرار بشأن طعنك'
        PRODUCT_VISIBILITY_CHANGE = 'product_visibility_change', 'تغيير ظهور المنتج'
        NEW_PRODUCT_REVIEW = 'new_product_review', 'منتج جديد للمراجعة'
        NEW_USER_REGISTERED = 'new_user_registered', 'مستخدم جديد سجّل'
        GENERAL = 'general', 'إشعار عام'

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='notifications')
    type = models.CharField(max_length=50, choices=Type.choices, default=Type.GENERAL)
    title = models.CharField(max_length=255)
    message = models.TextField()

    # Optional link to related objects
    related_id = models.CharField(max_length=100, blank=True, default='')
    related_type = models.CharField(max_length=50, blank=True, default='')

    is_read = models.BooleanField(default=False)
    is_pinned = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = 'إشعار'
        verbose_name_plural = 'الإشعارات'
        ordering = ['-is_pinned', '-created_at']

    def __str__(self):
        return f"{self.user.username} - {self.title}"
