"""
Migration 0003: Sync catalog models with old Souq project structure.

Changes:
  Category  — remove description/icon/image/order; add created_at; change parent CASCADE
  Brand     — remove is_active; add category/website/country/created_at/updated_at
  Product   — remove main_image; add is_owner; change brand FK to CASCADE
  ProductVariant — remove image/order; add discount/created_at; add unique_together(product,sku)
  ProductImage   — deleted
  VariantImage   — new model (FK to Product, M2M to ProductVariant)
  ProductVideo   — new model
  AttributeValue — new model
"""

import uuid
import django.db.models.deletion
import django.utils.timezone
from django.conf import settings
from django.db import migrations, models


# ── Data migration: generate unique SKUs for blank-sku variants ──────────────

def generate_unique_skus(apps, schema_editor):
    """Ensure every variant has a unique non-blank SKU before adding unique_together."""
    ProductVariant = apps.get_model('catalog', 'ProductVariant')
    for variant in ProductVariant.objects.filter(sku=''):
        new_sku = uuid.uuid4().hex[:10].upper()
        while ProductVariant.objects.filter(product_id=variant.product_id, sku=new_sku).exists():
            new_sku = uuid.uuid4().hex[:10].upper()
        ProductVariant.objects.filter(pk=variant.pk).update(sku=new_sku)


class Migration(migrations.Migration):

    dependencies = [
        ('catalog', '0002_variant_image_textfield'),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [

        # ══════════════════════════════════════════════════════════════
        # CATEGORY
        # ══════════════════════════════════════════════════════════════

        migrations.RemoveField(model_name='category', name='description'),
        migrations.RemoveField(model_name='category', name='icon'),
        migrations.RemoveField(model_name='category', name='image'),
        migrations.RemoveField(model_name='category', name='order'),

        migrations.AddField(
            model_name='category',
            name='created_at',
            field=models.DateTimeField(
                auto_now_add=True,
                default=django.utils.timezone.now,
                verbose_name='تاريخ الإنشاء',
            ),
            preserve_default=False,
        ),

        migrations.AlterField(
            model_name='category',
            name='name',
            field=models.CharField(max_length=100, verbose_name='اسم الفئة'),
        ),
        migrations.AlterField(
            model_name='category',
            name='slug',
            field=models.SlugField(max_length=200, unique=True, blank=True, verbose_name='الرابط'),
        ),
        migrations.AddField(
            model_name='category',
            name='logo',
            field=models.ImageField(blank=True, null=True, upload_to='categories/', verbose_name='الصورة'),
        ),
        migrations.AlterField(
            model_name='category',
            name='parent',
            field=models.ForeignKey(
                blank=True, null=True,
                on_delete=django.db.models.deletion.CASCADE,
                related_name='children',
                to='catalog.category',
            ),
        ),
        migrations.AlterModelOptions(
            name='category',
            options={'verbose_name': 'الفئة', 'verbose_name_plural': 'الفئات'},
        ),

        # ══════════════════════════════════════════════════════════════
        # BRAND
        # ══════════════════════════════════════════════════════════════

        migrations.RemoveField(model_name='brand', name='is_active'),

        migrations.AddField(
            model_name='brand',
            name='category',
            field=models.ForeignKey(
                blank=True, null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name='brands',
                to='catalog.category',
                verbose_name='الفئة',
            ),
        ),
        migrations.AddField(
            model_name='brand',
            name='website',
            field=models.URLField(blank=True, null=True, verbose_name='الموقع'),
        ),
        migrations.AddField(
            model_name='brand',
            name='country',
            field=models.CharField(blank=True, max_length=100, null=True, verbose_name='البلد'),
        ),
        migrations.AddField(
            model_name='brand',
            name='created_at',
            field=models.DateTimeField(
                auto_now_add=True,
                default=django.utils.timezone.now,
                verbose_name='تاريخ الإنشاء',
            ),
            preserve_default=False,
        ),
        migrations.AddField(
            model_name='brand',
            name='updated_at',
            field=models.DateTimeField(auto_now=True, verbose_name='آخر تحديث'),
        ),

        migrations.AlterField(
            model_name='brand',
            name='name',
            field=models.CharField(max_length=100, verbose_name='اسم العلامة التجارية'),
        ),
        migrations.AlterField(
            model_name='brand',
            name='slug',
            field=models.SlugField(max_length=200, unique=True, blank=True, verbose_name='الرابط'),
        ),
        migrations.AlterField(
            model_name='brand',
            name='description',
            field=models.TextField(blank=True, null=True, verbose_name='الوصف'),
        ),
        migrations.AlterModelOptions(
            name='brand',
            options={
                'verbose_name': 'علامة تجارية',
                'verbose_name_plural': 'العلامات التجارية',
                'ordering': ['-created_at'],
            },
        ),

        # ══════════════════════════════════════════════════════════════
        # PRODUCT
        # ══════════════════════════════════════════════════════════════

        migrations.RemoveIndex(model_name='product', name='catalog_pro_slug_2b1eb6_idx'),
        migrations.RemoveIndex(model_name='product', name='catalog_pro_is_acti_e6e001_idx'),
        migrations.RemoveIndex(model_name='product', name='catalog_pro_seller__bf64dc_idx'),

        migrations.RemoveField(model_name='product', name='main_image'),

        migrations.AddField(
            model_name='product',
            name='is_owner',
            field=models.BooleanField(
                default=False,
                verbose_name='هل هذا المنتج يخص المستخدم الحالي',
            ),
        ),

        migrations.AlterField(
            model_name='product',
            name='name',
            field=models.CharField(max_length=255, verbose_name='اسم المنتج'),
        ),
        migrations.AlterField(
            model_name='product',
            name='slug',
            field=models.SlugField(max_length=300, unique=True, blank=True, verbose_name='الرابط'),
        ),
        migrations.AlterField(
            model_name='product',
            name='description',
            field=models.TextField(verbose_name='الوصف'),
        ),
        migrations.AlterField(
            model_name='product',
            name='sku',
            field=models.CharField(blank=True, max_length=50, verbose_name='رمز المنتج'),
        ),
        migrations.AlterField(
            model_name='product',
            name='brand',
            field=models.ForeignKey(
                blank=True, null=True,
                on_delete=django.db.models.deletion.CASCADE,
                related_name='products',
                to='catalog.brand',
                verbose_name='العلامة التجارية',
            ),
        ),
        migrations.AlterField(
            model_name='product',
            name='category',
            field=models.ForeignKey(
                blank=True, null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name='products',
                to='catalog.category',
                verbose_name='الفئة',
            ),
        ),
        migrations.AlterField(
            model_name='product',
            name='seller',
            field=models.ForeignKey(
                on_delete=django.db.models.deletion.CASCADE,
                related_name='products',
                to=settings.AUTH_USER_MODEL,
                verbose_name='البائع',
            ),
        ),
        migrations.AlterModelOptions(
            name='product',
            options={
                'verbose_name': 'منتج',
                'verbose_name_plural': 'المنتجات',
                'ordering': ['-created_at'],
            },
        ),

        # ══════════════════════════════════════════════════════════════
        # PRODUCT ATTRIBUTE
        # ══════════════════════════════════════════════════════════════

        migrations.AlterField(
            model_name='productattribute',
            name='value',
            field=models.CharField(max_length=255),
        ),

        # ══════════════════════════════════════════════════════════════
        # PRODUCT VARIANT
        # ══════════════════════════════════════════════════════════════

        migrations.RemoveField(model_name='productvariant', name='image'),
        migrations.RemoveField(model_name='productvariant', name='order'),

        migrations.AddField(
            model_name='productvariant',
            name='discount',
            field=models.PositiveIntegerField(default=0, verbose_name='نسبة الخصم'),
        ),
        migrations.AddField(
            model_name='productvariant',
            name='created_at',
            field=models.DateTimeField(
                auto_now_add=True,
                default=django.utils.timezone.now,
                verbose_name='تاريخ الإنشاء',
            ),
            preserve_default=False,
        ),

        migrations.AlterField(
            model_name='productvariant',
            name='name',
            field=models.CharField(
                blank=True, default='', max_length=100, verbose_name='اسم المتغير'
            ),
        ),
        migrations.AlterField(
            model_name='productvariant',
            name='sku',
            field=models.CharField(max_length=100, verbose_name='رمز المتغير'),
        ),
        migrations.AlterField(
            model_name='productvariant',
            name='product',
            field=models.ForeignKey(
                on_delete=django.db.models.deletion.CASCADE,
                related_name='variants',
                to='catalog.product',
                verbose_name='المنتج',
            ),
        ),
        migrations.AlterModelOptions(
            name='productvariant',
            options={
                'verbose_name': 'متغير المنتج',
                'verbose_name_plural': 'متغيرات المنتجات',
            },
        ),

        # Auto-generate SKUs for blank-sku variants BEFORE unique_together
        migrations.RunPython(generate_unique_skus, migrations.RunPython.noop),

        migrations.AlterUniqueTogether(
            name='productvariant',
            unique_together={('product', 'sku')},
        ),

        # ══════════════════════════════════════════════════════════════
        # DELETE PRODUCT IMAGE
        # ══════════════════════════════════════════════════════════════

        migrations.DeleteModel(name='ProductImage'),

        # ══════════════════════════════════════════════════════════════
        # CREATE NEW MODELS
        # ══════════════════════════════════════════════════════════════

        migrations.CreateModel(
            name='VariantImage',
            fields=[
                ('id', models.BigAutoField(
                    auto_created=True, primary_key=True,
                    serialize=False, verbose_name='ID',
                )),
                ('image', models.ImageField(upload_to='variants/%Y/%m/', verbose_name='الصورة')),
                ('alt_text', models.CharField(blank=True, max_length=255, verbose_name='النص البديل')),
                ('is_main', models.BooleanField(default=False, verbose_name='صورة رئيسية')),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('product', models.ForeignKey(
                    on_delete=django.db.models.deletion.CASCADE,
                    related_name='variant_images',
                    to='catalog.product',
                    verbose_name='المنتج',
                )),
                ('variants', models.ManyToManyField(
                    blank=True,
                    related_name='images',
                    to='catalog.productvariant',
                    verbose_name='المتغيرات المرتبطة',
                )),
            ],
            options={
                'verbose_name': 'صورة متغير',
                'verbose_name_plural': 'صور المتغيرات',
                'ordering': ['-is_main', 'id'],
            },
        ),

        migrations.CreateModel(
            name='ProductVideo',
            fields=[
                ('id', models.BigAutoField(
                    auto_created=True, primary_key=True,
                    serialize=False, verbose_name='ID',
                )),
                ('video', models.FileField(upload_to='products/videos/')),
                ('product', models.ForeignKey(
                    on_delete=django.db.models.deletion.CASCADE,
                    related_name='videos',
                    to='catalog.product',
                )),
            ],
            options={'verbose_name': 'فيديو المنتج'},
        ),

        migrations.CreateModel(
            name='AttributeValue',
            fields=[
                ('id', models.BigAutoField(
                    auto_created=True, primary_key=True,
                    serialize=False, verbose_name='ID',
                )),
                ('value', models.CharField(max_length=255)),
                ('attribute', models.ForeignKey(
                    on_delete=django.db.models.deletion.CASCADE,
                    related_name='values',
                    to='catalog.productattribute',
                )),
            ],
        ),
    ]
