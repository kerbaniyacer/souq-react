from django.db import models
from apps.accounts.models import User
from apps.catalog.models import ProductVariant


class Order(models.Model):
    class Status(models.TextChoices):
        PENDING = 'pending', 'قيد الانتظار'
        CONFIRMED = 'confirmed', 'مؤكد'
        PROCESSING = 'processing', 'قيد المعالجة'
        SHIPPED = 'shipped', 'تم الشحن'
        DELIVERED = 'delivered', 'تم التوصيل'
        CANCELLED = 'cancelled', 'ملغى'
        REFUNDED = 'refunded', 'مسترجع'

    class PaymentMethod(models.TextChoices):
        COD = 'cod', 'الدفع عند الاستلام'
        CARD = 'card', 'بطاقة بنكية'
        CCP = 'ccp', 'بريد الجزائر'
        BARIDIMOB = 'baridimob', 'بريدي موب (BaridiMob)'

    class PaymentStatus(models.TextChoices):
        PENDING = 'pending', 'في انتظار الدفع'
        PROOF_UPLOADED = 'proof_uploaded', 'تم رفع الوصل'
        PAID = 'paid', 'مدفوع'
        REJECTED = 'rejected', 'مرفوض'
        FAILED = 'failed', 'فشل'
        REFUNDED = 'refunded', 'مسترجع'

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='orders')
    order_number = models.CharField(max_length=50, unique=True)
    status = models.CharField(max_length=20, choices=Status, default=Status.PENDING)
    payment_method = models.CharField(max_length=20, choices=PaymentMethod, default=PaymentMethod.COD)
    payment_status = models.CharField(max_length=20, choices=PaymentStatus, default=PaymentStatus.PENDING)

    # Shipping info (snapshot at order time)
    shipping_full_name = models.CharField(max_length=200)
    shipping_phone = models.CharField(max_length=20)
    shipping_wilaya = models.CharField(max_length=100)
    shipping_baladia = models.CharField(max_length=100)
    shipping_address = models.TextField()

    subtotal = models.DecimalField(max_digits=12, decimal_places=2)
    shipping_cost = models.DecimalField(max_digits=8, decimal_places=2, default=0)
    discount = models.DecimalField(max_digits=8, decimal_places=2, default=0)
    total_amount = models.DecimalField(max_digits=12, decimal_places=2)

    tracking_number = models.CharField(max_length=100, blank=True, default='')
    notes = models.TextField(blank=True, default='')

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'طلب'
        verbose_name_plural = 'الطلبات'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['user', 'status']),
            models.Index(fields=['order_number']),
        ]

    def __str__(self):
        return f'Order #{self.order_number}'

    def save(self, *args, **kwargs):
        import random
        import string
        if not self.order_number:
            digits = ''.join(random.choices(string.digits, k=8))
            candidate = f'ORD{digits}'
            while Order.objects.filter(order_number=candidate).exists():
                digits = ''.join(random.choices(string.digits, k=8))
                candidate = f'ORD{digits}'
            self.order_number = candidate
        if not self.tracking_number:
            digits = ''.join(random.choices(string.digits, k=8))
            candidate = f'TRK{digits}'
            while Order.objects.filter(tracking_number=candidate).exists():
                digits = ''.join(random.choices(string.digits, k=8))
                candidate = f'TRK{digits}'
            self.tracking_number = candidate
        super().save(*args, **kwargs)


class PaymentProof(models.Model):
    class Status(models.TextChoices):
        PENDING = 'pending', 'قيد الانتظار'
        APPROVED = 'approved', 'مقبول'
        REJECTED = 'rejected', 'مرفوض'

    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name='proofs')
    seller = models.ForeignKey(User, on_delete=models.CASCADE, related_name='payment_proofs', null=True)
    image = models.ImageField(upload_to='orders/receipts/')
    transaction_id = models.CharField(max_length=100, blank=True, default='')
    amount = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)
    status = models.CharField(max_length=20, choices=Status, default=Status.PENDING)
    rejection_reason = models.TextField(blank=True, default='')

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'إثبات دفع'
        verbose_name_plural = 'إثباتات الدفع'
        ordering = ['-created_at']

    def __str__(self):
        return f'Proof for Order {self.order.order_number}'


class OrderItem(models.Model):
    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name='items')
    variant = models.ForeignKey(ProductVariant, null=True, on_delete=models.SET_NULL)

    # Snapshot at order time
    product_name = models.CharField(max_length=300)
    variant_name = models.CharField(max_length=200)
    variant_attributes = models.JSONField(default=dict)
    product_price = models.DecimalField(max_digits=10, decimal_places=2)
    quantity = models.PositiveIntegerField()
    subtotal = models.DecimalField(max_digits=12, decimal_places=2)

    class Meta:
        verbose_name = 'عنصر طلب'
        verbose_name_plural = 'عناصر الطلبات'

    def __str__(self):
        return f'{self.quantity}x {self.product_name}'
