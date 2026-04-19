from django.db import models
from apps.accounts.models import User
from apps.catalog.models import Product


class WishlistItem(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='wishlist')
    product = models.ForeignKey(Product, on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = 'مفضلة'
        verbose_name_plural = 'المفضلة'
        unique_together = [['user', 'product']]
        ordering = ['-created_at']

    def __str__(self):
        return f'{self.user.email} ← {self.product.name}'
