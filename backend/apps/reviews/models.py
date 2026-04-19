from django.core.validators import MinValueValidator, MaxValueValidator
from django.db import models
from apps.accounts.models import User
from apps.catalog.models import Product


class Review(models.Model):
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='reviews')
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='reviews')
    rating = models.PositiveSmallIntegerField(
        validators=[MinValueValidator(1), MaxValueValidator(5)]
    )
    comment = models.TextField(blank=True, default='')
    verified = models.BooleanField(default=False)  # purchased the product
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'تقييم'
        verbose_name_plural = 'التقييمات'
        unique_together = [['product', 'user']]
        ordering = ['-created_at']

    def __str__(self):
        return f'{self.user.email} → {self.product.name} ({self.rating}★)'
