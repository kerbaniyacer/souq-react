from django.db import models
from django.utils.text import slugify
from django.utils.translation import gettext_lazy as _
from django.db.models import Avg, Sum
from apps.accounts.models import User

class Category(models.Model):
    name = models.CharField(max_length=100, verbose_name='اسم الفئة')
    parent = models.ForeignKey(
        'self',
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name='children'
    )    
    slug = models.SlugField(max_length=200, unique=True, blank=True, verbose_name='الرابط')
    logo = models.ImageField(upload_to='categories/', blank=True, null=True, verbose_name='الصورة')
    is_active = models.BooleanField(default=True, verbose_name='نشط')
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='تاريخ الإنشاء')

    class Meta:
        verbose_name = 'الفئة'
        verbose_name_plural = 'الفئات'

    def save(self, *args, **kwargs):
        if not self.slug:
            base_slug = slugify(self.name)
            slug = base_slug
            counter = 1

            while Category.objects.filter(slug=slug).exists():
                slug = f"{base_slug}-{counter}"
                counter += 1

            self.slug = slug

        super().save(*args, **kwargs)

    @property
    def products_count(self):
        return self.products.filter(is_active=True).count()

    def __str__(self):
        return self.name


class Brand(models.Model):
    name = models.CharField(max_length=100, verbose_name=_("Brand Name"))
    slug = models.SlugField(max_length=200, unique=True, blank=True, verbose_name=_("Slug"))
    logo = models.ImageField(upload_to='brands/', blank=True, null=True, verbose_name=_("Brand Logo"))
    category = models.ForeignKey(Category, on_delete=models.SET_NULL, null=True, blank=True, related_name='brands', verbose_name='الفئة')
    description = models.TextField(blank=True, null=True, verbose_name=_("Description"))
    website = models.URLField(blank=True, null=True, verbose_name=_("Website"))
    country = models.CharField(max_length=100, blank=True, null=True, verbose_name=_("Country"))
    created_at = models.DateTimeField(auto_now_add=True, verbose_name=_("Created At"))
    updated_at = models.DateTimeField(auto_now=True, verbose_name=_("Updated At"))

    class Meta:
        verbose_name = _("Brand")
        verbose_name_plural = _("Brands")
        ordering = ['-created_at']

    def __str__(self):
        return self.name

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.name)
        super().save(*args, **kwargs)


class Series(models.Model):
    brand = models.ForeignKey(Brand, on_delete=models.CASCADE, related_name='series', verbose_name='العلامة التجارية')
    name = models.CharField(max_length=100, verbose_name='اسم السلسلة')
    slug = models.SlugField(max_length=200, unique=True, blank=True, verbose_name='الرابط')
    logo = models.ImageField(upload_to='series/', blank=True, null=True, verbose_name='الشعار')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = 'سلسلة المنتجات'
        verbose_name_plural = 'سلاسل المنتجات'
        ordering = ['brand', 'name']
        unique_together = [['brand', 'name']]

    def save(self, *args, **kwargs):
        if not self.slug:
            base = slugify(f'{self.brand.slug}-{self.name}') if self.brand_id else slugify(self.name)
            base = base or f'series-{self.brand_id or 0}'
            slug, counter = base, 1
            while Series.objects.filter(slug=slug).exists():
                slug = f'{base}-{counter}'
                counter += 1
            self.slug = slug
        super().save(*args, **kwargs)

    def __str__(self):
        return f'{self.brand.name} › {self.name}'


class Product(models.Model):
    class Status(models.TextChoices):
        ACTIVE = 'active', 'Active'
        UNDER_REVIEW = 'under_review', 'Under Review'
        REJECTED = 'rejected', 'Rejected'
        SUSPENDED = 'suspended', 'Suspended'
        PENDING_DELETE = 'pending_delete', 'Pending Delete'
        DELETED = 'deleted', 'Deleted'

    category = models.ForeignKey(Category, on_delete=models.SET_NULL, null=True, blank=True, related_name='products', verbose_name='الفئة')
    seller = models.ForeignKey(User, on_delete=models.CASCADE, related_name='products', verbose_name='البائع')
    name = models.CharField(max_length=255, verbose_name='اسم المنتج')
    slug = models.SlugField(max_length=300, unique=True, blank=True, verbose_name='الرابط')
    description = models.TextField(verbose_name='الوصف')
    sku = models.CharField(max_length=50, blank=True, verbose_name='رمز المنتج')
    brand = models.ForeignKey(Brand, null=True, blank=True, on_delete=models.CASCADE, related_name='products', verbose_name='العلامة التجارية')
    store = models.ForeignKey('accounts.Store', null=True, blank=True, on_delete=models.SET_NULL, related_name='products', verbose_name='المتجر')
    series = models.ForeignKey('Series', null=True, blank=True, on_delete=models.SET_NULL, related_name='products', verbose_name='السلسلة')
    
    is_active = models.BooleanField(default=True, verbose_name='نشط')
    is_featured = models.BooleanField(default=False, verbose_name='مميز')
    
    # Status & Audit tracking
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.ACTIVE)
    suspended_at = models.DateTimeField(null=True, blank=True)
    appeal_deadline = models.DateTimeField(null=True, blank=True)
    suspension_reason = models.TextField(null=True, blank=True)
    review_deadline = models.DateTimeField(null=True, blank=True)

    rating = models.DecimalField(max_digits=3, decimal_places=2, default=0, verbose_name='التقييم')
    reviews_count = models.PositiveIntegerField(default=0, verbose_name='عدد التقييمات')
    sold_count = models.PositiveIntegerField(default=0, verbose_name='عدد المبيعات')
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='تاريخ الإنشاء')
    updated_at = models.DateTimeField(auto_now=True, verbose_name='آخر تحديث')

    def generate_unique_slug(self):
        slug = slugify(self.name)
        unique_slug = slug
        counter = 1

        while Product.objects.filter(slug=unique_slug).exists():
            unique_slug = f"{slug}-{counter}"
            counter += 1

        return unique_slug

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = self.generate_unique_slug()
        super().save(*args, **kwargs)

    @property
    def is_in_stock(self):
        return self.variants.filter(stock__gt=0, is_active=True).exists()

    @property
    def total_stock(self):
        return self.variants.filter(is_active=True).aggregate(total=Sum('stock'))['total'] or 0

    @property
    def stock_status(self):
        """Returns aggregate stock status for the whole product."""
        ts = self.total_stock
        if not self.is_active or ts == 0:
            return "out_of_stock"
        elif ts < 5:
            return "low"
        elif ts <= 10:
            return "medium"
        else:
            return "high"

    def __str__(self):
        return self.name
    
    @property
    def image(self):
        v = self.variants.filter(is_main=True).first()
        if not v:
            v = self.variants.filter(stock__gt=0).first()
        if not v:
            v = self.variants.first()
        
        if v:
            img = v.images.filter(is_main=True).first()
            if not img:
                img = v.images.first()
            return img.image if img else None
        return None

class ProductAttribute(models.Model): 
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='attributes')
    name = models.CharField(max_length=100)
    value = models.CharField(max_length=255)

    def __str__(self):
        return f"{self.name}: {self.value}"
        
class ProductVariant(models.Model):
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='variants', verbose_name='المنتج')
    name = models.CharField(max_length=100, verbose_name='اسم المتغير', blank=True, default='')
    sku = models.CharField(max_length=100, verbose_name='رمز المتغير')
    price = models.DecimalField(max_digits=10, decimal_places=2, verbose_name='السعر')
    old_price = models.DecimalField(max_digits=10, decimal_places=2, blank=True, null=True, verbose_name='السعر القديم')
    discount = models.PositiveIntegerField(default=0, verbose_name='نسبة الخصم')
    stock = models.PositiveIntegerField(default=0, verbose_name='المخزون')
    is_active = models.BooleanField(default=True, verbose_name='نشط')
    attributes = models.JSONField(default=dict)
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='تاريخ الإنشاء')
    is_main = models.BooleanField(default=False, verbose_name='المتغير الرئيسي')

    class Meta:
        unique_together = ['product', 'sku']
        verbose_name = 'متغير المنتج'
        verbose_name_plural = 'متغيرات المنتجات'

    def save(self, *args, **kwargs):
        if self.is_main:
            ProductVariant.objects.filter(product=self.product, is_main=True).exclude(pk=self.pk).update(is_main=False)
        else:
            if not ProductVariant.objects.filter(product=self.product, is_main=True).exclude(pk=self.pk).exists():
                self.is_main = True
        super().save(*args, **kwargs)

    def __str__(self):
        if self.name:
            return f"{self.product.name} - {self.name}"
        return f"{self.product.name} - {self.sku}"

    @property
    def is_in_stock(self):
        return self.stock > 0 and self.is_active

    @property
    def stock_status(self):
        if not self.is_active or self.stock == 0:
            return "out_of_stock"
        elif self.stock < 5:
            return "low"
        elif self.stock <= 10:
            return "medium"
        else:
            return "high"

    @property
    def get_image(self):
        img = self.images.filter(is_main=True).first()
        if not img:
            img = self.images.first()
        return img.image.url if img else None

class VariantImage(models.Model):
    product = models.ForeignKey('Product', on_delete=models.CASCADE, related_name='variant_images', verbose_name='المنتج')
    image = models.ImageField(upload_to='variants/%Y/%m/', verbose_name='الصورة')
    alt_text = models.CharField(max_length=255, blank=True, verbose_name='النص البديل')
    variants = models.ManyToManyField('ProductVariant', blank=True, related_name='images', verbose_name='المتغيرات المرتبطة')
    is_main = models.BooleanField(default=False, verbose_name='صورة رئيسية')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = 'صورة متغير'
        verbose_name_plural = 'صور المتغيرات'
        ordering = ['-is_main', 'id']

    def __str__(self):
        variant_names = ', '.join(self.variants.values_list('name', flat=True)[:3])
        return f"{self.product.name} → {variant_names or 'بدون متغيرات'}"

    def save(self, *args, **kwargs):
        if self.is_main:
            VariantImage.objects.filter(product=self.product).exclude(pk=self.pk).update(is_main=False)
        super().save(*args, **kwargs)

class ProductVideo(models.Model):
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='videos')
    video = models.FileField(upload_to='products/videos/')
    
    class Meta:
        verbose_name = 'فيديو المنتج'

    def __str__(self):
        return f"فيديو لـ {self.product.name}"

class AttributeValue(models.Model):
    attribute = models.ForeignKey(ProductAttribute, on_delete=models.CASCADE, related_name='values')
    value = models.CharField(max_length=255)

    def __str__(self):
        return f"{self.attribute.name}: {self.value}"
