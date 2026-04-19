from django.contrib.auth.models import AbstractUser
from django.db import models


class User(AbstractUser):
    """Custom user model — extends AbstractUser with extra fields."""

    class Provider(models.TextChoices):
        LOCAL = 'local', 'Local'
        GOOGLE = 'google', 'Google'
        FACEBOOK = 'facebook', 'Facebook'

    email = models.EmailField(unique=True)
    provider = models.CharField(max_length=20, choices=Provider, default=Provider.LOCAL)
    provider_id = models.CharField(max_length=255, blank=True, default='')
    photo = models.ImageField(upload_to='users/photos/', null=True, blank=True)

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

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'ملف شخصي'
        verbose_name_plural = 'الملفات الشخصية'

    def __str__(self):
        return f'Profile({self.user.email})'


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
