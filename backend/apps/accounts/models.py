from django.contrib.auth.models import AbstractUser
from django.db import models
from django.utils import timezone


class User(AbstractUser):
    """Custom user model — extends AbstractUser with extra fields."""

    class Provider(models.TextChoices):
        LOCAL = 'local', 'Local'
        GOOGLE = 'google', 'Google'
        FACEBOOK = 'facebook', 'Facebook'

    class Status(models.TextChoices):
        ACTIVE = 'active', 'Active'
        SUSPENDED = 'suspended', 'Suspended'
        PENDING_DELETE = 'pending_delete', 'Pending Delete'
        DELETED = 'deleted', 'Deleted'

    class Role(models.TextChoices):
        CUSTOMER = 'customer', 'Customer'
        SELLER = 'seller', 'Seller'
        ADMIN = 'admin', 'Admin'

    email = models.EmailField(unique=True)
    provider = models.CharField(max_length=20, choices=Provider, default=Provider.LOCAL)
    provider_id = models.CharField(max_length=255, blank=True, default='')
    photo = models.ImageField(upload_to='users/photos/', null=True, blank=True)

    # Status & Audit tracking
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.ACTIVE)
    role = models.CharField(max_length=15, choices=Role.choices, default=Role.CUSTOMER)
    suspended_at = models.DateTimeField(null=True, blank=True)
    appeal_deadline = models.DateTimeField(null=True, blank=True)
    suspension_reason = models.TextField(null=True, blank=True)

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['username']

    class Meta:
        verbose_name = 'مستخدم'
        verbose_name_plural = 'المستخدمون'
        ordering = ['-date_joined']

    def __str__(self):
        return self.email

    @property
    def full_name(self):
        return f'{self.first_name} {self.last_name}'.strip() or self.username


class Profile(models.Model):
    """Extended profile — one-to-one with User."""

    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    phone = models.CharField(max_length=20, blank=True, default='')
    address = models.TextField(blank=True, default='')
    wilaya = models.CharField(max_length=100, blank=True, default='')
    baladia = models.CharField(max_length=100, blank=True, default='')
    bio = models.TextField(blank=True, default='')
    is_seller = models.BooleanField(default=False)

    # Store fields (only relevant when is_seller=True)
    store_name = models.CharField(max_length=200, blank=True, default='')
    store_description = models.TextField(blank=True, default='')
    store_category = models.CharField(max_length=100, blank=True, default='')
    store_logo = models.ImageField(upload_to='stores/logos/', null=True, blank=True)
    commercial_register = models.CharField(max_length=100, blank=True, default='')

    # Bank / Payment Details (for Sellers)
    ccp_number = models.CharField(max_length=20, blank=True, default='', verbose_name='رقم الحساب البريدي (CCP)')
    ccp_name   = models.CharField(max_length=200, blank=True, default='', verbose_name='الاسم الكامل في الحساب')
    baridimob_id = models.CharField(max_length=50, blank=True, default='', verbose_name='رقم RIP أو BaridiMob')

    # Performance metrics
    seller_rating = models.DecimalField(max_digits=3, decimal_places=2, default=0)
    seller_reviews_count = models.PositiveIntegerField(default=0)
    buyer_rating = models.DecimalField(max_digits=3, decimal_places=2, default=0)
    buyer_reviews_count = models.PositiveIntegerField(default=0)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'ملف شخصي'
        verbose_name_plural = 'الملفات الشخصية'

    @property
    def is_onboarded(self) -> bool:
        """Returns True if the user has completed the mandatory profile fields."""
        if not self.phone or not self.wilaya:
            return False
        if self.is_seller and not self.store_name:
            return False
        return True

    def __str__(self):
        return f'Profile({self.user.email})'


class AdminActionLog(models.Model):
    """Logs administrative actions for audit trails and undo capabilities."""
    
    class Action(models.TextChoices):
        SUSPEND = 'suspend', 'Suspend'
        RESTORE = 'restore', 'Restore'
        DELETE = 'delete', 'Delete'
        PERMANENT_DELETE = 'permanent_delete', 'Permanent Delete'

    admin_user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='admin_actions')
    action = models.CharField(max_length=20, choices=Action.choices)
    target_model = models.CharField(max_length=50) # 'User' or 'Product'
    target_id = models.IntegerField()
    target_name = models.CharField(max_length=255, blank=True, default='')

    reason = models.TextField(blank=True, default='')
    before_state = models.JSONField(null=True, blank=True)
    after_state = models.JSONField(null=True, blank=True)
    is_processed = models.BooleanField(default=False)

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = 'سجل عمليات المسؤول'
        verbose_name_plural = 'سجلات عمليات المسؤولين'
        ordering = ['-created_at']

    def __str__(self):
        return f'{self.admin_user.username} {self.action} {self.target_model}:{self.target_id}'


class Report(models.Model):
    REPORT_TYPES = (
        ('product', 'منتج'),
        ('seller', 'تاجر'),
        ('buyer', 'مشتري'),
    )
    reporter = models.ForeignKey(User, on_delete=models.CASCADE, related_name='reports_made')
    report_type = models.CharField(max_length=10, choices=REPORT_TYPES)
    
    # Use lazy import/string reference for Product to avoid circular imports
    target_product = models.ForeignKey('catalog.Product', on_delete=models.CASCADE, null=True, blank=True)
    target_user = models.ForeignKey(User, on_delete=models.CASCADE, null=True, blank=True, related_name='reports_received')
    
    reason = models.CharField(max_length=200)
    description = models.TextField(blank=True, default='')
    status = models.CharField(max_length=20, default='pending') # pending, resolved, dismissed
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = 'تبليغ'
        verbose_name_plural = 'التبليغات'
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.report_type} - {self.reason}"


class LoginHistory(models.Model):
    """Track login events per user for security alerts."""

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='login_history')
    ip_address = models.GenericIPAddressField()
    user_agent = models.TextField(blank=True, default='')
    logged_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = 'سجل الدخول'
        verbose_name_plural = 'سجلات الدخول'
        ordering = ['-logged_at']

    def __str__(self):
        return f'{self.user.email} — {self.ip_address} @ {self.logged_at}'


import random

class OTPVerification(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='otp_verifications')
    otp = models.CharField(max_length=6)
    ip_address = models.GenericIPAddressField()
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        verbose_name = 'رمز تحقق OTP'
        verbose_name_plural = 'رموز تحقق OTP'
        ordering = ['-created_at']

    def generate_otp(self):
        self.otp = f"{random.randint(100000, 999999)}"
        self.save()
        
    def __str__(self):
        return f'{self.user.email} — {self.otp}'


class Appeal(models.Model):
    """Users can dispute account or product suspensions."""
    STATUS_CHOICES = [
        ("pending", "قيد المراجعة"),
        ("approved", "مقبول"),
        ("rejected", "مرفوض"),
    ]
    TARGET_TYPE = [
        ("account", "حساب"),
        ("product", "منتج"),
    ]

    appeal_id = models.CharField(max_length=20, unique=True, editable=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='appeals')
    
    target_type = models.CharField(max_length=20, choices=TARGET_TYPE)
    target_id = models.PositiveIntegerField() # ID of User or Product
    
    reason = models.TextField()
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="pending")
    admin_response = models.TextField(blank=True, default='')
    
    created_at = models.DateTimeField(auto_now_add=True)
    reviewed_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        verbose_name = 'طعن'
        verbose_name_plural = 'الطعون'
        ordering = ['-created_at']

    def save(self, *args, **kwargs):
        if not self.appeal_id:
            import datetime
            import string
            import random
            
            # Format: APL-YEAR-RANDOM
            year = datetime.datetime.now().year
            rand = ''.join(random.choices(string.digits, k=4))
            prefix = f"APL-{year}-{rand}"
            
            # Ensure uniqueness
            while Appeal.objects.filter(appeal_id=prefix).exists():
                rand = ''.join(random.choices(string.digits, k=4))
                prefix = f"APL-{year}-{rand}"
            self.appeal_id = prefix
            
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.appeal_id} - {self.user.email}"
