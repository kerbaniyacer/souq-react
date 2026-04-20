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
        verbose_name = 'تقييم منتج'
        verbose_name_plural = 'تقييمات المنتجات'
        unique_together = [['product', 'user']]
        ordering = ['-created_at']

    def __str__(self):
        return f'{self.user.email} → {self.product.name} ({self.rating}★)'


class SellerReview(models.Model):
    from apps.orders.models import Order
    order = models.OneToOneField(Order, on_delete=models.CASCADE, related_name='seller_review')
    seller = models.ForeignKey(User, on_delete=models.CASCADE, related_name='received_seller_reviews')
    buyer = models.ForeignKey(User, on_delete=models.CASCADE, related_name='made_seller_reviews')
    rating = models.PositiveSmallIntegerField(validators=[MinValueValidator(1), MaxValueValidator(5)])
    comment = models.TextField(blank=True, default='')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = 'تقييم تاجر'
        verbose_name_plural = 'تقييمات التجار'


class BuyerReview(models.Model):
    from apps.orders.models import Order
    order = models.OneToOneField(Order, on_delete=models.CASCADE, related_name='buyer_review')
    buyer = models.ForeignKey(User, on_delete=models.CASCADE, related_name='received_buyer_reviews')
    seller = models.ForeignKey(User, on_delete=models.CASCADE, related_name='made_buyer_reviews')
    rating = models.PositiveSmallIntegerField(validators=[MinValueValidator(1), MaxValueValidator(5)])
    comment = models.TextField(blank=True, default='')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = 'تقييم مشتري'
        verbose_name_plural = 'تقييمات المشترين'
