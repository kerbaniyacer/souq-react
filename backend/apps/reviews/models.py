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
    is_visible = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'تقييم منتج'
        verbose_name_plural = 'تقييمات المنتجات'
        unique_together = [['product', 'user']]
        ordering = ['-created_at']

    def __str__(self):
        return f'{self.user.email} → {self.product.name} ({self.rating}★)'


class ReviewImage(models.Model):
    review = models.ForeignKey(Review, on_delete=models.CASCADE, related_name='images')
    image = models.ImageField(upload_to='reviews/')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = 'صورة تقييم'
        verbose_name_plural = 'صور التقييمات'


class SellerReview(models.Model):
    from apps.orders.models import SubOrder
    sub_order = models.ForeignKey(SubOrder, on_delete=models.CASCADE, related_name='seller_reviews', null=True)
    seller = models.ForeignKey(User, on_delete=models.CASCADE, related_name='received_seller_reviews')
    buyer = models.ForeignKey(User, on_delete=models.CASCADE, related_name='made_seller_reviews')
    rating = models.PositiveSmallIntegerField(validators=[MinValueValidator(1), MaxValueValidator(5)])
    shipping_rating = models.PositiveSmallIntegerField(validators=[MinValueValidator(1), MaxValueValidator(5)], default=5)
    comment = models.TextField(blank=True, default='')
    is_visible = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = 'تقييم تاجر'
        verbose_name_plural = 'تقييمات التجار'


class BuyerReview(models.Model):
    from apps.orders.models import SubOrder
    sub_order = models.ForeignKey(SubOrder, on_delete=models.CASCADE, related_name='buyer_reviews', null=True)
    buyer = models.ForeignKey(User, on_delete=models.CASCADE, related_name='received_buyer_reviews')
    seller = models.ForeignKey(User, on_delete=models.CASCADE, related_name='made_buyer_reviews')
    rating = models.PositiveSmallIntegerField(validators=[MinValueValidator(1), MaxValueValidator(5)])
    comment = models.TextField(blank=True, default='')
    is_visible = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = 'تقييم مشتري'
        verbose_name_plural = 'تقييمات المشترين'


class ReviewReply(models.Model):
    """Official single reply from merchant or admin to a review."""
    product_review = models.OneToOneField(Review, null=True, blank=True, on_delete=models.CASCADE, related_name='official_reply')
    seller_review = models.OneToOneField(SellerReview, null=True, blank=True, on_delete=models.CASCADE, related_name='official_reply')
    buyer_review = models.OneToOneField(BuyerReview, null=True, blank=True, on_delete=models.CASCADE, related_name='official_reply')
    
    user = models.ForeignKey(User, on_delete=models.CASCADE) # The merchant or admin who replied
    content = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = 'رد على تقييم'
        verbose_name_plural = 'ردود التقييمات'

    def __str__(self):
        return f"Reply by {self.user.username}"
