import uuid
from django.db import models
from apps.accounts.models import User
from apps.catalog.models import ProductVariant


class Cart(models.Model):
    """One cart per user (or session for guests)."""
    user = models.OneToOneField(User, null=True, blank=True, on_delete=models.CASCADE, related_name='cart')
    session_key = models.CharField(max_length=64, blank=True, default='')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'سلة'
        verbose_name_plural = 'السلال'

    def __str__(self):
        return f'Cart({self.user or self.session_key})'

    @property
    def total(self):
        return sum(item.subtotal for item in self.items.all())

    @property
    def items_count(self):
        return sum(item.quantity for item in self.items.all())


class CartItem(models.Model):
    cart = models.ForeignKey(Cart, on_delete=models.CASCADE, related_name='items')
    variant = models.ForeignKey(ProductVariant, on_delete=models.CASCADE)
    quantity = models.PositiveIntegerField(default=1)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'عنصر سلة'
        verbose_name_plural = 'عناصر السلة'
        unique_together = [['cart', 'variant']]

    def __str__(self):
        return f'{self.quantity}x {self.variant}'

    @property
    def subtotal(self):
        return self.variant.price * self.quantity
